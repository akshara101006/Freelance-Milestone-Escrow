# Local Demonstration & Architecture Guide

This guide provides step-by-step instructions to set up, test, and demonstrate the **Freelance Milestone Escrow** project locally using **Solidity ^0.8.24**, **OpenZeppelin Contracts v5** (`ReentrancyGuard`), **Hardhat & Hardhat Ignition**, **ethers.js v6**, **MetaMask**, and **React 19 + TypeScript + Vite + Tailwind CSS**.

---

## 1. System Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│         React 19 + TypeScript + Vite + Tailwind         │
│               (Frontend Web Application)                │
└────────────────────────────┬────────────────────────────┘
                             │
             ethers.js v6 (BrowserProvider / JsonRpcProvider)
             ABI Encoding via ethers.Interface
                             │
┌────────────────────────────▼────────────────────────────┐
│              Local Hardhat Ethereum Node                │
│                 http://127.0.0.1:8545                   │
│                     (Chain ID 31337)                    │
└────────────────────────────┬────────────────────────────┘
                             │
     ┌───────────────────────┴───────────────────────┐
     │                                               │
┌────▼─────────────────┐           ┌─────────────────▼────────┐
│  EscrowFactory.sol   │           │FreelanceMilestoneEscrow  │
│  (Factory Contract)  │──────────►│.sol (is ReentrancyGuard) │
└──────────────────────┘           └──────────────────────────┘
```

---

## 2. Step-by-Step Local Setup Instructions

### Step 1: Install Dependencies
Open your terminal in the project root directory and run:
```bash
npm install
```

### Step 2: Run the Smart Contract Unit Test Suite
Verify that all 5 test suites (`FreelanceMilestoneEscrow.test.cjs`, `EscrowFactory.test.cjs`, `AccessControl.test.cjs`, `AccountingInvariant.test.cjs`, `DisputesAndRefunds.test.cjs`) pass:
```bash
npx hardhat test
```

### Step 3: Start the Local Hardhat Ethereum Blockchain (Terminal 1)
In **Terminal 1**, start the local Hardhat network listening on `http://127.0.0.1:8545`:
```bash
npx hardhat node
```
> **Note:** Keep this terminal running during your demo. Whenever you execute actions in the frontend (`createAgreement`, `fundAgreement`, `submitMilestone`, `approveMilestone`, `raiseDispute`, `resolveDispute`, `withdraw`), `ethers.js v6` broadcasts transactions directly to `http://127.0.0.1:8545` so you can see real-time transaction hashes, block numbers, and gas metrics logged in this terminal.

### Step 4: Deploy Smart Contracts via Hardhat Ignition (Terminal 2)
In **Terminal 2**, deploy the contracts to the running Hardhat node:
```bash
npx hardhat ignition deploy ignition/modules/FreelanceMilestoneEscrow.cjs --network localhost
```
*(Alternative)* Deploy using the standard Hardhat script:
```bash
npx hardhat run scripts/deploy.cjs --network localhost
```

### Step 5: Start the Frontend Application (Terminal 2)
In **Terminal 2**, start the React + Vite development server:
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### Step 6: Connect MetaMask & Import Demo Accounts
1. In MetaMask, add or switch to the local Hardhat network (the app also auto-prompts this via `wallet_addEthereumChain` when you click **Connect MetaMask**):
   - **Network Name:** `Hardhat Localhost 8545`
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337` (`0x7a69`)
   - **Currency Symbol:** `ETH`
2. Import the 3 dedicated role accounts below using their private keys.
3. If you restart `npx hardhat node`, clear MetaMask's cached nonce history via **Settings $\rightarrow$ Advanced $\rightarrow$ Clear activity tab data**.

---

## 3. Dedicated Single-Role Hardhat Accounts

The platform enforces a **Strict Single-Role Architecture** with 1 account per role:

| Role | Account Name | Handle | Address | Private Key |
| :--- | :--- | :--- | :--- | :--- |
| **Client** | **Alex** | `@alex.eth` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Freelancer** | **Stark** | `@stark.eth` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Arbitrator** | **Mark** | `@mark.eth` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

---

## 4. Live 5-Phase Demo Script

1. **Phase 1 — Deploy & Fund (`Alex` — Client):**
   - Connect as **Alex**, go to **Create Project**, deploy a 2-milestone project (`1.0 ETH` + `2.0 ETH`), and click **Fund 3.00 ETH Now**.
   - Notice that while milestones are `Pending`, Alex sees the waiting badge **`Awaiting Freelancer (Stark) Submission`** and cannot submit work.
2. **Phase 2 — Submit Deliverables (`Stark` — Freelancer):**
   - Switch to **Stark**, submit work proofs on both Milestone 1 and Milestone 2 (`submitMilestone`).
   - Once `Submitted`, Stark sees **`Awaiting Client (Alex) Review — Only Client can Approve or Dispute`**.
3. **Phase 3 — Approve & Dispute (`Alex` — Client):**
   - Switch back to **Alex**.
   - Click **Approve & Release** on Milestone 1 (`1.0 ETH` credited to Stark).
   - Click **Raise Dispute** on Milestone 2 (`2.0 ETH` escalated to Mark).
4. **Phase 4 — Arbitrate Dispute (`Mark` — Arbitrator):**
   - Switch to **Mark**, open **Active Disputes**, set a `6000 bps` (60% Freelancer / 40% Client) split on Milestone 2, and click **Execute Binding Resolution**.
5. **Phase 5 — Pull-Over-Push Withdrawals (`Stark` & `Alex`):**
   - Switch to **Stark** and click **Withdraw 2.2000 ETH** (`withdraw()`).
   - Switch to **Alex** and click **Withdraw 0.8000 ETH** (`withdraw()`).

---

## 5. Key Technical Highlights for Evaluators

1. **OpenZeppelin Security (`@openzeppelin/contracts`):** `FreelanceMilestoneEscrow.sol` inherits OpenZeppelin's `ReentrancyGuard` (`nonReentrant`) and follows the Checks-Effects-Interactions (CEI) pattern on all `withdraw()` calls.
2. **Strict Role Modifiers:** `submitMilestone` is restricted to `onlyFreelancer` (`Stark`), `approveMilestone` and `raiseDispute` are restricted to `onlyClient` (`Alex`), and `resolveDispute` is restricted to `onlyArbitrator` (`Mark`).
3. **Real-Time Hardhat RPC Heartbeat:** Continuously monitors `http://127.0.0.1:8545` every 3 seconds and immediately warns the user if the local Hardhat node goes offline.
4. **Pull-Over-Push EVM Withdrawals:** Client approvals credit `withdrawable[freelancer]` without pushing external ETH transfers during approval, preventing reentrancy and DoS attacks.
5. **Formal Solvency Invariant:** Real-time verification that `address(this).balance == totalReserved + sum(withdrawable)` at every state transition.
