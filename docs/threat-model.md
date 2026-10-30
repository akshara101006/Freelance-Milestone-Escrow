# Security Specification & Threat Model

## 1. Trust Assumptions & Role Boundaries

The **Freelance Milestone Escrow** protocol enforces strict cryptographic access control across three mutually exclusive participant roles:

- **Client (`Alex` — `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)**:
  - Authorized to deploy agreements via `EscrowFactory`, deposit 100% upfront ETH via `fundAgreement()`, approve submitted deliverables via `approveMilestone()`, raise disputes on submitted phases, and claim refunds on unstarted `Pending` milestones via `refundMilestone()`.
  - Cannot unilaterally claw back funds once a milestone has been `Submitted`, `Disputed`, `Released`, or `Resolved`.
- **Freelancer (`Stark` — `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`)**:
  - Authorized to submit deliverable proofs before milestone deadlines via `submitMilestone()` and pull earned funds via `withdraw()`.
  - Cannot approve or dispute milestones or withdraw more than `withdrawable[freelancer]`.
- **Arbitrator (`Mark` — `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`)**:
  - Authorized exclusively to settle milestones in the `Disputed` state via `resolveDispute(index, freelancerShareBps)`.
  - Cannot divert funds to the arbitrator address, cannot touch non-disputed milestones, and cannot initiate withdrawals.
- **External / Unauthorized Callers**:
  - Any address not matching the immutable role addresses is immediately rejected by `onlyClient`, `onlyFreelancer`, or `onlyArbitrator`.

---

## 2. Defense-in-Depth Mechanisms

### 2.1 OpenZeppelin `ReentrancyGuard` + CEI Pattern
`FreelanceMilestoneEscrow.sol` inherits directly from `@openzeppelin/contracts/utils/ReentrancyGuard.sol`:
```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FreelanceMilestoneEscrow is ReentrancyGuard {
    function withdraw() external nonReentrant {
        uint256 amount = withdrawable[msg.sender];
        require(amount > 0, "FreelanceMilestoneEscrow: no withdrawable balance");

        // Effects before Interactions
        withdrawable[msg.sender] = 0;
        totalWithdrawn += amount;

        // Interaction
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "FreelanceMilestoneEscrow: ETH transfer failed");

        emit Withdrawal(msg.sender, amount, block.timestamp);
    }
}
```
Even if a recipient address is a smart contract with a malicious `receive()` fallback that attempts to re-enter `withdraw()`, `nonReentrant` immediately reverts with `ReentrancyGuardReentrantCall()`, and the `withdrawable[msg.sender]` balance is already zeroed.

### 2.2 Pull-Over-Push Settlement (DoS Immunity)
Neither `approveMilestone()`, `resolveDispute()`, nor `refundMilestone()` performs an external `.call{value: ...}` transfer. Instead, they update internal accounting (`withdrawable[recipient] += amount`). A malicious or reverting counterparty contract can never block state transitions or freeze the agreement.

### 2.3 Formal Solvency Invariant
The contract exposes `verifyAccountingInvariant()` which asserts at runtime:
$$\text{address(this).balance} == \text{totalReserved} + \text{withdrawable}[\text{client}] + \text{withdrawable}[\text{freelancer}]$$

---

## 3. Threat Matrix & Mitigations

| Threat / Vulnerability Class | Attack Vector | Smart Contract Mitigation (`FreelanceMilestoneEscrow.sol`) | Verification Test Suite |
| :--- | :--- | :--- | :--- |
| **Recursive Reentrancy** | Malicious contract calls `withdraw()` recursively in `receive()` fallback | OpenZeppelin `nonReentrant` modifier + zeroing `withdrawable[msg.sender] = 0` prior to external `.call` | `test/FreelanceMilestoneEscrow.test.cjs` |
| **Push-Payment DoS** | Recipient contract reverts on incoming ETH to block `resolveDispute` or `approveMilestone` | Pull-over-push pattern separates ledger crediting from ETH transfer | `test/DisputesAndRefunds.test.cjs` |
| **Precision / Dust Leakage** | Integer division remainders in percentage splits trap wei in contract forever | Exact subtraction: `clientRefund = m.amount - freelancerShare` | `test/AccountingInvariant.test.cjs` |
| **Privilege Escalation** | Unauthorized caller invokes `approveMilestone`, `fundAgreement`, or `resolveDispute` | Strict immutable role modifiers (`onlyClient`, `onlyFreelancer`, `onlyArbitrator`) | `test/AccessControl.test.cjs` |
| **Role Collusion / Self-Arbitration** | Same address assigned to both Client and Arbitrator (or Freelancer) | Constructor pairwise uniqueness assertions (`client != freelancer`, `client != arbitrator`, `freelancer != arbitrator`) | `test/EscrowFactory.test.cjs` |
| **State Machine Bypass** | Approving an unsubmitted milestone or disputing an already released milestone | Explicit `MilestoneState` enum checks (`require(m.state == MilestoneState.Submitted)`) | `test/AccessControl.test.cjs` |
| **Underfunded / Overfunded Escrow** | Client sends partial ETH or excess ETH during `fundAgreement()` | Exact value assertion (`require(msg.value == totalRequired)`) and rejection of direct `receive()` transfers | `test/AccountingInvariant.test.cjs` |
