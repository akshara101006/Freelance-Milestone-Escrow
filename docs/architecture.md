# System Architecture — Freelance Milestone Escrow

## 1. High-Level Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                   Browser Client (React 19 + TypeScript + Vite)            │
│                                                                            │
│  [Public Pre-Sign In Navigation]                                           │
│    • Overview        • How It Works        • Features        • Security    │
│                                                                            │
│  [Single-Role Enforced Navigation]                                         │
│    • Client (Alex):      Dashboard | My Projects | Create | Tx | Wallet    │
│    • Freelancer (Stark): Dashboard | My Projects | Submissions |           │
│                          Earnings | Transactions | Wallet                  │
│    • Arbitrator (Mark):  Dashboard | Active Disputes | Tx | Wallet         │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                   ethers.js v6 (BrowserProvider / JsonRpcProvider)
                   ABI Encoding via ethers.Interface (FACTORY_ABI, ESCROW_ABI)
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                 Local Hardhat EVM Node (http://127.0.0.1:8545)             │
│                               Chain ID: 31337                              │
│                                                                            │
│  • Account #0 — Client (Alex):      0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
│  • Account #1 — Freelancer (Stark): 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
│  • Account #2 — Arbitrator (Mark):  0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
└──────────────────────┬──────────────────────────────────┬──────────────────┘
                       │ Deploys & Indexes                │ Executes State Transitions
                       ▼                                  ▼
        ┌─────────────────────────────┐    ┌─────────────────────────────────┐
        │      EscrowFactory.sol      │───►│  FreelanceMilestoneEscrow.sol   │
        │   (Factory & Registry)      │    │  (is OpenZeppelin ReentrancyGuard)│
        └─────────────────────────────┘    └─────────────────────────────────┘
```

---

## 2. Technology Stack & Library Integration

| Layer | Technology / Library | Purpose in Architecture |
| :--- | :--- | :--- |
| **Smart Contracts** | Solidity `^0.8.24` | Deterministic state machines for escrow locking, milestone approvals, and dispute splits |
| **Security Library** | `@openzeppelin/contracts` (`v5.x`) | Official `ReentrancyGuard` inheritance (`nonReentrant` mutex on `withdraw()`) |
| **Web3 Client SDK** | `ethers.js` (`v6.x`) | `BrowserProvider` (MetaMask), `JsonRpcProvider` (`127.0.0.1:8545`), `ethers.Interface` ABI encoding, `parseEther`/`formatEther`, `keccak256` |
| **Development & Deployment** | Hardhat & Hardhat Ignition | Local EVM blockchain (`Chain ID 31337`), declarative deployment (`ignition/modules/FreelanceMilestoneEscrow.cjs`), Mocha/Chai test suites |
| **Frontend Application** | React 19, TypeScript, Tailwind CSS | Role-segregated dashboard, real-time solvency verifier, and EVM transaction receipt inspector |

---

## 3. Strict Single-Role Account Architecture

The protocol enforces a **Single-Role Architecture** with three dedicated participant accounts to eliminate conflicts of interest:

| Account | Role | Address | Permitted On-Chain Actions | Prohibited Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Alex** (`@alex.eth`) | **Client** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `createAgreement`, `fundAgreement`, `approveMilestone`, `raiseDispute`, `refundMilestone`, `withdraw` | Cannot submit deliverables, cannot resolve disputes |
| **Stark** (`@stark.eth`) | **Freelancer** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `submitMilestone`, `withdraw` | Cannot fund agreements, cannot approve or dispute work, cannot resolve disputes |
| **Mark** (`@mark.eth`) | **Arbitrator** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `resolveDispute` (0–10,000 bps split) | Cannot create/fund agreements, cannot submit deliverables, cannot withdraw escrow funds |

---

## 4. Smart Contract Specifications

### 4.1 `contracts/EscrowFactory.sol`
- Deploys isolated `FreelanceMilestoneEscrow` instances using the `new FreelanceMilestoneEscrow(...)` factory pattern.
- Indexes agreements globally (`allEscrows`) and per participant (`userEscrows[client]`, `userEscrows[freelancer]`, `userEscrows[arbitrator]`).
- Emits `AgreementCreated` for off-chain and frontend indexing:
  ```solidity
  event AgreementCreated(
      address indexed escrowAddress,
      address indexed client,
      address indexed freelancer,
      address arbitrator,
      string title,
      uint256 totalAmount,
      uint256 milestoneCount,
      uint256 timestamp
  );
  ```
- Holds **zero ETH**, eliminating systemic honeypot risk.

### 4.2 `contracts/FreelanceMilestoneEscrow.sol`
- Inherits `@openzeppelin/contracts/utils/ReentrancyGuard.sol`.
- Enforces immutable participant roles (`client`, `freelancer`, `arbitrator`) validated in the constructor as non-zero and pairwise distinct.
- **Agreement Finite State Machine**: `Unfunded` $\rightarrow$ `Active` $\rightarrow$ `Completed` (or `Cancelled`).
- **Milestone Finite State Machine**:
  - `Pending` $\rightarrow$ `Submitted` (via `submitMilestone` by Freelancer before deadline)
  - `Pending` $\rightarrow$ `Refunded` (via `refundMilestone` by Client on unstarted phase)
  - `Submitted` $\rightarrow$ `Released` (via `approveMilestone` by Client)
  - `Submitted` $\rightarrow$ `Disputed` (via `raiseDispute` by Client)
  - `Disputed` $\rightarrow$ `Resolved` (via `resolveDispute` by Arbitrator)
- **Pull-Over-Push Settlement**:
  ```solidity
  mapping(address => uint256) public withdrawable;
  ```
  All releases, refunds, and dispute awards credit `withdrawable[recipient]`. Actual ETH transfer occurs exclusively in `withdraw() external nonReentrant`.

---

## 5. Formal Financial Accounting Invariant

At every block and after every state transition, `verifyAccountingInvariant()` proves:

$$\text{address(this).balance} == \text{totalReserved} + \text{withdrawable}[\text{client}] + \text{withdrawable}[\text{freelancer}]$$

### Zero-Leakage Dispute Allocation
When the Arbitrator resolves a disputed milestone with `_freelancerShareBps` $\in [0, 10000]$:

$$\text{freelancerShare} = \left\lfloor \frac{\text{amount} \times \text{freelancerShareBps}}{10000} \right\rfloor$$

$$\text{clientRefund} = \text{amount} - \text{freelancerShare}$$

Deriving `clientRefund` by subtraction guarantees $\text{freelancerShare} + \text{clientRefund} == \text{amount}$ for every possible wei value and basis-point split, preventing rounding dust from ever being stranded in the contract.
