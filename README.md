# Freelance Milestone Escrow

A trust-minimized, decentralized milestone escrow protocol engineered on the Ethereum Virtual Machine (EVM). Built with **Solidity ^0.8.24**, **OpenZeppelin Contracts v5** (`ReentrancyGuard`), **Hardhat & Hardhat Ignition**, **ethers.js v6**, and **React 19 + TypeScript + Tailwind CSS**.

---

## 1. Overview & Protocol Principles

**Freelance Milestone Escrow** enforces mathematical and financial integrity for contract engagements between independent Clients, Freelancers, and Arbitrators. Every agreement deployed through `EscrowFactory.sol` creates an isolated, non-custodial `FreelanceMilestoneEscrow.sol` smart contract instance with zero intermediary custody.

### Core Architectural Guarantees
- **Strict Single-Role Architecture (3 Dedicated Accounts)**: Every participant wallet is permanently bound to a single role (**Client**, **Freelancer**, or **Arbitrator**). This guarantees complete separation of powers, prevents role-confusion or self-arbitration conflicts, and enforces rigorous access control via on-chain modifiers (`onlyClient`, `onlyFreelancer`, `onlyArbitrator`).
  - **Only Freelancer (`Stark`)** can submit work deliverables (`submitMilestone`).
  - **Only Client (`Alex`)** can approve a submitted milestone (`approveMilestone`), raise a dispute (`raiseDispute`), or refund an unstarted milestone (`refundMilestone`).
  - **Only Arbitrator (`Mark`)** can resolve a disputed milestone (`resolveDispute`).
- **OpenZeppelin Security Standard**: Inherits `@openzeppelin/contracts/utils/ReentrancyGuard.sol` (`contract FreelanceMilestoneEscrow is ReentrancyGuard`) combined with the Checks-Effects-Interactions (CEI) pattern.
- **100% Upfront Milestone Lockup**: Clients deposit 100% of the agreement commitment upfront (`fundAgreement()`). Funds are reserved phase-by-phase and unlocked only upon verified milestone approval or neutral arbitration.
- **Pull-Over-Push Withdrawals**: Approved milestone payouts and arbitrated settlements credit an internal ledger (`mapping(address => uint256) public withdrawable`). Beneficiaries pull funds directly to their non-custodial wallet via `withdraw() external nonReentrant`, eliminating reentrancy and Denial-of-Service (DoS) vectors.
- **Mathematical Solvency Invariant**: At every block and state transition, the contract's ETH balance strictly equals active milestone reserves plus pending withdrawable credits:
  $$\text{address(this).balance} == \text{totalReserved} + \sum_{u} \text{withdrawable}[u]$$
- **Zero-Leakage Basis-Point Arbitration**: Contested milestones are resolved by the designated Arbitrator using basis points ($0 \dots 10000\text{ bps}$), with exact remainder derivation (`clientRefund = amount - freelancerShare`) so zero wei is ever trapped.

---

## 2. Pre-Configured Single-Role Accounts

For clean evaluation and live demonstration, the protocol maintains **3 dedicated single-role Hardhat accounts** (Chain ID `31337`):

| Role | Name | Handle | Wallet Address | Private Key (Local Testnet Only) |
| :--- | :--- | :--- | :--- | :--- |
| **Client** | **Alex** | `@alex.eth` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Freelancer** | **Stark** | `@stark.eth` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Arbitrator** | **Mark** | `@mark.eth` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

---

## 3. Repository Structure

```text
├── contracts/
│   ├── FreelanceMilestoneEscrow.sol         # Core milestone escrow state machine (OpenZeppelin ReentrancyGuard)
│   └── EscrowFactory.sol                    # Factory contract for deploying & indexing escrow instances
├── ignition/
│   └── modules/
│       └── FreelanceMilestoneEscrow.cjs     # Hardhat Ignition declarative deployment module
├── scripts/
│   └── deploy.cjs                           # Standard Hardhat deployment script
├── test/
│   ├── FreelanceMilestoneEscrow.test.cjs    # End-to-end lifecycle & pull-over-push withdrawal tests
│   ├── EscrowFactory.test.cjs               # Factory deployment & user indexing tests
│   ├── AccessControl.test.cjs               # Role boundary & unauthorized caller rejection tests
│   ├── AccountingInvariant.test.cjs         # Formal solvency invariant & zero-dust verification
│   └── DisputesAndRefunds.test.cjs          # Basis-point arbitration & unstarted refund tests
├── src/
│   ├── components/                          # Role-gated React views, modals, and receipt inspectors
│   ├── services/
│   │   ├── web3Service.ts                   # ethers.js v6 BrowserProvider, JsonRpcProvider & ABIs
│   │   └── evmEngine.ts                     # EVM state synchronization & transaction execution engine
│   └── types/
│       └── escrow.ts                        # TypeScript interfaces for agreements, milestones & receipts
├── docs/
│   ├── architecture.md                      # Detailed system & smart contract architecture
│   ├── platform-guide.md                    # End-to-end user & role workflow guide
│   └── threat-model.md                      # Security specification, threat matrix & mitigations
├── LOCAL_DEMO_GUIDE.md                      # Additional quick reference for local demo
├── hardhat.config.cjs                       # Hardhat EVM configuration (Solidity 0.8.24, Chain ID 31337)
└── package.json                             # Project dependencies & scripts
```

---

## 4. Complete Local Setup Procedure (From Scratch)

### Prerequisites
- **Node.js** `v18+` (recommended `v20 LTS`) and **npm**
- **MetaMask** browser extension (optional — you can either sign live transactions through MetaMask or use the built-in Hardhat RPC signer)

### Step 1: Clone the Repository & Install Dependencies
Open a terminal in the project root directory and install all packages:
```bash
npm install
```

### Step 2: Compile Smart Contracts & Run the Automated Test Suite
Verify that both contracts (`FreelanceMilestoneEscrow.sol` and `EscrowFactory.sol`) compile cleanly and pass all 5 Hardhat test suites:
```bash
npx hardhat compile
npx hardhat test
```

### Step 3: Start the Local Hardhat EVM Blockchain (Terminal 1)
Open **Terminal 1** and launch the local Hardhat Ethereum node on `http://127.0.0.1:8545` (`Chain ID: 31337`):
```bash
npx hardhat node
```
> **Important:** Leave **Terminal 1** open and running throughout your entire session. Every contract deployment and state-changing transaction will print live block numbers, transaction hashes, and gas usage here.

### Step 4: Deploy Smart Contracts to Localhost (Terminal 2)
Open a second terminal (**Terminal 2**) in the project root and deploy `EscrowFactory` using Hardhat Ignition:
```bash
npx hardhat ignition deploy ignition/modules/FreelanceMilestoneEscrow.cjs --network localhost
```
*(Alternatively, you can run `npx hardhat run scripts/deploy.cjs --network localhost`.)*

### Step 5: Start the Frontend Development Server (Terminal 2)
In **Terminal 2**, start the React + Vite web application:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### Step 6: Configure MetaMask for Localhost 8545
1. Open the **MetaMask** browser extension and add/select the local Hardhat network (or click **Connect Your Wallet $\rightarrow$ Connect MetaMask** in the app to auto-configure via `wallet_addEthereumChain`):
   - **Network Name:** `Hardhat Localhost 8545`
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
2. Import the 3 dedicated role accounts into MetaMask using **Import Account $\rightarrow$ Private Key**:
   - **Alex (Client):** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - **Stark (Freelancer):** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - **Mark (Arbitrator):** `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

> **Troubleshooting MetaMask Nonce Errors (`Nonce too low` / `nonce has already been used`):**
> Whenever you restart `npx hardhat node`, the local blockchain resets to Block `0` (so account nonces reset to `0`), while MetaMask still caches your previous transaction history.
> - **Fix in MetaMask:** Go to **Settings $\rightarrow$ Advanced $\rightarrow$ Clear activity tab data** for the Hardhat network.
> - **Built-in Protection:** The app also automatically queries `eth_getTransactionCount(..., "pending")` from the live node before sending transactions and monitors Hardhat node connectivity every 3 seconds (displaying a live **Hardhat RPC Online / Disconnected** banner if the node is stopped).

---

## 5. Step-by-Step Live Demonstration Walkthrough

Follow these 5 phases to demonstrate the complete lifecycle, role-based access enforcement, and dispute resolution during an evaluation or live presentation:

### Phase 1: Client (`Alex`) Creates & Funds a Project
1. Connect as **Alex (Client — `0xf39F...2266`)** using the top-right wallet button (either via MetaMask with Account #0 selected or the Alex role switcher).
2. Click **Create Project** in the navigation bar.
3. Notice that **Stark (`0x7099...79C8`)** is pre-configured as the **Freelancer** and **Mark (`0x3C44...93BC`)** as the **Arbitrator**.
4. Enter a project title (e.g., `"Hotel Management System"`) and keep or customize the 2 milestones:
   - **Milestone 1:** `Architectural System Design & Wireframes` — `1.0 ETH`
   - **Milestone 2:** `Application Implementation & Quality Assurance` — `2.0 ETH`
5. Click **Deploy Escrow Agreement** and confirm the transaction.
6. On the newly created project card (currently in the `Unfunded` state), click **Fund 3.00 ETH Now** (`fundAgreement()`).
   - **Verify:** The contract status changes to **Active (Escrow Locked)**, `3.00 ETH` is locked on-chain, and Milestone 1 & Milestone 2 show a blue status badge for Alex: **`Awaiting Freelancer (Stark) Submission`** (Alex has no "Submit Work" button).

### Phase 2: Freelancer (`Stark`) Submits Deliverable Proofs
1. Switch your active wallet to **Stark (Freelancer — `0x7099...79C8`)** (in MetaMask and/or via the top-right account menu).
2. Open the project in **My Projects** or **Milestone Submissions**.
3. Notice that only **Stark** sees the **Submit Work** button on `Pending` milestones:
   - For **Milestone 1**, enter a deliverable note/link (e.g., `"Figma System Architecture & ER Diagrams v1.0 - ipfs://QmDesignHash"`) and click **Submit Deliverable**.
   - For **Milestone 2**, enter a deliverable note/link (e.g., `"Production Repository & QA Suite - https://github.com/stark/hotel-hms"`) and click **Submit Deliverable**.
4. **Verify Role Separation:** Once both milestones are in the `Submitted` state, Stark sees an amber status badge: **`Awaiting Client (Alex) Review — Only Client can Approve or Dispute`**. Stark cannot approve or dispute his own submissions.

### Phase 3: Client (`Alex`) Approves Milestone 1 & Disputes Milestone 2
1. Switch back to **Alex (Client — `0xf39F...2266`)**.
2. Inspect the two `Submitted` milestones on the project card:
   - Notice that **Alex** now sees **Approve & Release** and **Raise Dispute** buttons.
   - **On Milestone 1 (`1.0 ETH`):** Click **Approve & Release** (`approveMilestone(0)`).
     - Milestone 1 transitions to **`Released`**, and `1.00 ETH` is credited to Stark's pull-over-push `withdrawable` ledger.
   - **On Milestone 2 (`2.0 ETH`):** Click **Raise Dispute** (`raiseDispute(1)`), enter a dispute reason (e.g., `"Load testing benchmarks not met on checkout module"`), and confirm.
     - Milestone 2 transitions to **`Disputed`**, and both Alex and Stark now see a purple waiting badge: **`Awaiting Arbitrator (Mark) Resolution`**.

### Phase 4: Arbitrator (`Mark`) Resolves the Dispute via Basis-Point Split
1. Switch to **Mark (Arbitrator — `0x3C44...93BC`)**.
2. Navigate to **Active Disputes** (or inspect the disputed milestone directly).
3. Use the interactive **Basis-Point Resolution Slider (`0–10,000 bps`)** to set a fair ruling — for example, **`60%` (`6000 bps`) to Freelancer (Stark)** and **`40%` (`4000 bps`) Refund to Client (Alex)**.
4. Click **Execute Binding Resolution** (`resolveDispute(1, 6000)`).
   - **Verify:** Milestone 2 transitions to **`Resolved`**, `1.20 ETH` is credited to Stark's `withdrawable` balance, and `0.80 ETH` is credited to Alex's `withdrawable` balance.
   - **Verify Solvency Invariant:** The on-chain accounting verifier confirms:
     $$\text{Contract Balance } (3.00\text{ ETH}) == \text{Reserved } (0.00\text{ ETH}) + \text{Stark Withdrawable } (2.20\text{ ETH}) + \text{Alex Withdrawable } (0.80\text{ ETH})$$

### Phase 5: Pull-Over-Push Non-Custodial Withdrawals (`Stark` & `Alex`)
1. Switch to **Stark (`@stark.eth`)**, open **Earnings** (or the project withdrawal banner), and click **Withdraw 2.2000 ETH** (`withdraw()`).
   - Protected by OpenZeppelin's `nonReentrant` modifier, `2.20 ETH` is transferred to Stark's wallet and his `withdrawable` balance resets to `0.00 ETH`.
2. Switch to **Alex (`@alex.eth`)** and click **Withdraw 0.8000 ETH** (`withdraw()`) to claim the arbitrated refund.
3. Click any transaction in the **Transactions** tab to inspect the **Cryptographic EVM Receipt** (real transaction hash, block number, gas used, function selector, and ABI-decoded event logs).

---

## 6. Documentation Index
- [**System Architecture**](./docs/architecture.md) — Component topology, OpenZeppelin & ethers.js v6 integration, state machines, and solvency equations.
- [**Platform Guide**](./docs/platform-guide.md) — Step-by-step workflows for **Alex** (Client), **Stark** (Freelancer), and **Mark** (Arbitrator).
- [**Security & Threat Model**](./docs/threat-model.md) — Formal threat analysis, attack vectors, and smart contract mitigations.
- [**Local Demo Guide**](./LOCAL_DEMO_GUIDE.md) — Quick-reference guide for local demonstration with Hardhat (`127.0.0.1:8545`) and MetaMask.
