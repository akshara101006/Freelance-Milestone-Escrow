# Freelance Milestone Escrow — Platform Guide

This guide outlines the end-to-end operation, role-based navigation flows, and lifecycle responsibilities for the **Freelance Milestone Escrow** platform.

---

## 1. Strict Single-Role Account Directory

The platform operates with **3 dedicated single-role accounts** mapped directly to Hardhat local node accounts (`Chain ID: 31337`). Each wallet is permanently bound to a single role:

| Account Name | Handle | Role | Wallet Address | Core Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Alex** | `@alex.eth` | **Client** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Deploy agreements, lock 100% escrow funding, review & approve deliverables, raise disputes on submitted work, or refund unstarted milestones |
| **Stark** | `@stark.eth` | **Freelancer** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Deliver milestone work proofs prior to deadlines and withdraw released or arbitrated ETH |
| **Mark** | `@mark.eth` | **Arbitrator** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Inspect contested milestones in the Resolution Center and execute binding basis-point split settlements |

---

## 2. Navigation Architecture

### Public Pre-Sign In Navigation
Before connecting a wallet, visitors can explore the platform architecture through the top navigation bar:
- **Overview**: Platform highlights, core guarantees, and FAQ.
- **How It Works**: Step-by-step visual walkthrough of the 6-phase escrow lifecycle.
- **Features**: Deep dive into single-role access control, pull-over-push accounting, and solvency verification.
- **Security**: OpenZeppelin `ReentrancyGuard` architecture, formal solvency equations, and threat mitigations.

### Role-Specific Post-Sign In Navigation
- **When connected as Alex (Client)**:
  - `Dashboard`: Portfolio overview, locked escrow commitments, pending deliverable reviews, and solvency status.
  - `My Projects`: Full list of commissioned agreements with milestone progress bars.
  - `Create Project`: Interactive deployment form that auto-populates **Stark** (`@stark.eth`) as Freelancer and **Mark** (`@mark.eth`) as Arbitrator.
  - `Transactions`: Live EVM transaction ledger with decoded Solidity events and gas usage.
  - `Wallet`: Non-custodial balance manager, testnet faucet (`+5.0 Test ETH`), and instant role account switcher.
- **When connected as Stark (Freelancer)**:
  - `Dashboard`: Assigned agreements, active deadlines, and withdrawable earnings summary.
  - `My Projects`: Agreements where Stark is the designated contractor.
  - `Milestone Submissions`: Dedicated workbench to submit deliverable proofs (`submitMilestone`).
  - `Earnings`: Pull-over-push withdrawal manager (`withdraw()`) to transfer credited ETH to Stark's wallet.
  - `Transactions` & `Wallet`.
- **When connected as Mark (Arbitrator)**:
  - `Dashboard`: Arbitration queue metrics and resolved case history.
  - `Active Disputes`: Resolution Center with an interactive `0–10,000 bps` (`0%–100%`) slider to partition disputed milestone funds between Alex and Stark.
  - `Transactions` & `Wallet`.

---

## 3. End-to-End Escrow Lifecycle Walkthrough

### Step 1: Deploy Agreement (`Alex` — Client)
1. Click **Connect Your Wallet** and select **Alex** (`Client`) or connect via MetaMask (`0xf39F...2266`).
2. Navigate to **Create Project**.
3. **Stark** (`0x7099...79C8`) and **Mark** (`0x3C44...93BC`) are pre-selected as the dedicated Freelancer and Arbitrator.
4. Define 1 to 10 milestones with titles, ETH amounts, and deadlines, then click **Deploy Escrow Agreement**.

### Step 2: Fund Escrow (`Alex` — Client)
1. On the newly created agreement (`Unfunded` state), click **Fund Escrow Agreement**.
2. `fundAgreement()` transfers 100% of `totalRequired` ETH into `FreelanceMilestoneEscrow.sol`, transitioning the agreement to `Active`.

### Step 3: Submit Deliverable (`Stark` — Freelancer)
1. Switch account to **Stark** (`Freelancer`) via the top-right account menu.
2. Open the active agreement or **Milestone Submissions**, enter a deliverable proof note (e.g., repository commit or deployment URL), and submit (`submitMilestone`).
3. The milestone state transitions from `Pending` $\rightarrow$ `Submitted`.

### Step 4: Approve or Dispute (`Alex` — Client)
1. Switch back to **Alex** (`Client`).
2. Inspect Stark's submission:
   - Click **Approve & Credit** (`approveMilestone`) to transition the milestone to `Released` and credit Stark's `withdrawable` balance.
   - Or click **Raise Dispute** (`raiseDispute`) to transition the milestone to `Disputed` and escalate it to **Mark**.

### Step 5: Arbitrate Dispute (`Mark` — Arbitrator, if Disputed)
1. Switch to **Mark** (`Arbitrator`) and open **Active Disputes**.
2. Select a basis-point split (e.g., `6000 bps` = 60% to Stark, 40% refund to Alex) and execute `resolveDispute`.
3. The milestone transitions to `Resolved` and both parties' `withdrawable` balances are credited with zero wei remainder leakage.

### Step 6: Pull-Over-Push Withdrawal (`Stark` / `Alex`)
1. Switch to **Stark** (or **Alex** if refunded) and click **Withdraw Funds** (`withdraw()`).
2. Protected by OpenZeppelin's `nonReentrant` guard, the contract zeroes out `withdrawable[msg.sender]` before transferring ETH to the wallet.
