from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import pypandoc, os, re

out_dir = "/"
md_path = os.path.join(out_dir, "Freelance_Milestone_Escrow_PRD.md")
docx_path = os.path.join(out_dir, "Freelance_Milestone_Escrow_PRD.docx")

content = r"""# Freelance Milestone Escrow
## Product Requirements Document, System Design, Security Specification, and AI Development Brief

**Document purpose:** This is the source of truth for AI-assisted implementation of a local-first Solidity mini-project. Feed this document to the coding AI before asking it to generate or modify code.

**Project type:** Educational Web3 application / smart-contract mini-project  
**Deployment target:** One laptop, local EVM only  
**Blockchain currency:** Local development ETH with no real monetary value  
**Primary priority:** Correct, testable Solidity and escrow accounting; frontend polish is secondary  
**Status:** Implementation specification; not a production audit or legal escrow agreement

---

# 1. Project Summary

Freelance Milestone Escrow is a decentralized application (dApp) that lets a client create a freelance agreement, define payment milestones, deposit the agreed amount into a smart contract, and release milestone funds when work is approved. A freelancer can submit milestones, either party can raise a dispute under defined conditions, and a designated arbitrator can resolve a disputed milestone according to explicit rules. The contract also supports safe withdrawal of credited funds and controlled refunds for eligible unstarted milestones.

The application must make blockchain activity inspectable. Users should be able to see the transaction hash, receipt status, block number, sender, destination contract, gas used, emitted events, and resulting contract state. The UI must never fake a successful transaction or treat local component state as authoritative.

The entire project must run on a single laptop. It must not require a public testnet, mainnet, real cryptocurrency, paid RPC provider, paid hosting, or external database. Hardhat Network and its disposable development accounts provide the local blockchain and test ETH.

## 1.1 Problem statement

Freelance work often involves uncertainty around payment timing, delivery approval, partial completion, and disagreements. A centralized platform may act as an intermediary. This project demonstrates how explicit, inspectable smart-contract rules can hold project funds, enforce role permissions, track milestones, and record payment decisions.

This educational prototype does not prove that submitted work is objectively good, and it does not replace legal advice, professional arbitration, or a production payment service.

## 1.2 Project objectives

1. Demonstrate meaningful Solidity development rather than a UI-only simulation.
2. Hold the agreed project funds in a deployed escrow contract.
3. Model an agreement and each milestone as explicit state machines.
4. Enforce client, freelancer, and arbitrator permissions on-chain.
5. Prevent duplicate releases, unauthorized withdrawals, and accounting errors.
6. Support milestone approval, disputes, arbitration, withdrawal credits, and eligible refunds.
7. Display verifiable transaction receipts, events, contract addresses, and state changes.
8. Run repeatable automated tests and a polished classroom demo on one laptop.
9. Keep the first version free to develop and operate locally.
10. Be understandable to a student and maintainable by an AI coding assistant.

## 1.3 Non-goals

Do not build these in the initial release:
- Public testnet or mainnet deployment.
- Real ETH, fiat currency, payment gateways, or production financial services.
- AI-based evaluation of the quality of freelance work.
- User passwords, email authentication, or a centralized account system.
- A custom backend API or database.
- NFT rewards, tokens, reputation scores, DAO governance, or social features.
- IPFS/file hosting or storage of large project files.
- Multiple arbitrators, appeals, or on-chain voting.
- A claim that the contract is production-audited or legally enforceable.

---

# 2. Users and Roles

## 2.1 Client
The client creates the agreement, specifies the freelancer and milestones, deposits the exact agreed amount, reviews submissions, approves work, raises disputes when permitted, and receives refunds for eligible unstarted work.

## 2.2 Freelancer
The freelancer accepts the role specified by the agreement, submits milestone work or a short on-chain/off-chain reference, raises a dispute when permitted, and withdraws funds credited to them.

## 2.3 Arbitrator
The designated arbitrator can resolve a disputed milestone only. The arbitrator cannot create arbitrary payments, change the agreement's roles, withdraw other people's credits, or resolve a milestone that is not disputed.

## 2.4 Local demo operator
The demo operator runs the local Hardhat node and frontend, deploys the contracts, and selects among separate local development accounts. The demo operator is not a privileged smart-contract role unless the deployed agreement explicitly assigns an account that role.

## 2.5 Account simulation
Use separate Hardhat development accounts for:
- Account 0: Client A
- Account 1: Freelancer A
- Account 2: Arbitrator
- Account 3: Client B or an unauthorized attacker test account

The account selector must change the actual signer used to submit transactions. It must not merely change a displayed name or wallet address. If MetaMask is added, use disposable local-only development accounts and never commit private keys or seed phrases.

---

# 3. Functional Scope and User Stories

## 3.1 Agreement creation
As a client, I can create an agreement with one freelancer, one arbitrator, a title/short description, a list of milestones, milestone amounts, and submission deadlines.

Acceptance criteria:
- Client, freelancer, and arbitrator addresses are non-zero.
- Required roles are distinct unless the specification explicitly allows an exception; for the demo, require all three to be distinct.
- Milestone count is greater than zero and bounded by a documented maximum, such as 10.
- Every milestone amount is greater than zero.
- Every deadline is a future Unix timestamp at creation time.
- Sum of milestone amounts is calculated with checked Solidity arithmetic.
- The contract records the agreement and emits an AgreementCreated event.
- The frontend shows the deployed agreement address and transaction hash.
- The frontend does not claim creation succeeded until the transaction is mined successfully.

## 3.2 Funding
As a client, I can fund the agreement with the exact sum of all milestone amounts.

Acceptance criteria:
- Only the client can fund the agreement.
- Funding is accepted only once.
- `msg.value` must equal the required total exactly.
- The agreement changes from Created/Unfunded to Funded/Active.
- A FundingReceived event is emitted.
- A failed funding attempt must not change state.
- The UI shows funded amount, total amount, contract balance, and receipt.

## 3.3 Milestone submission
As a freelancer, I can submit a milestone for client review.

Acceptance criteria:
- Only the freelancer can submit.
- The agreement must be funded and not terminated.
- The milestone must be Pending.
- The submission must occur before or at its deadline for the initial version.
- A short text note or content hash/reference may be recorded, with a strict length limit if stored on-chain.
- The milestone changes to Submitted and a MilestoneSubmitted event is emitted.
- A milestone cannot be submitted twice.

## 3.4 Milestone approval
As a client, I can approve a submitted milestone.

Acceptance criteria:
- Only the client can approve.
- The milestone must be Submitted and not disputed.
- Approval cannot release the milestone twice.
- The amount becomes a withdrawable credit for the freelancer; it is not pushed to the freelancer during approval.
- The milestone changes to Approved/Released (choose one consistent name in code and UI).
- A MilestoneApproved or MilestoneReleased event is emitted.
- The UI shows the actual transaction receipt and updated contract state.

Important terminology: milestone approval credits the freelancer's withdrawable balance. The ETH transfer happens later when the freelancer calls `withdraw()`. Clearly label these as separate transactions in the UI.

## 3.5 Dispute
As either party, I can raise a dispute for a milestone that has been submitted but not approved.

Acceptance criteria:
- Only the client or freelancer can raise the dispute.
- The milestone must be Submitted.
- The milestone cannot already be approved, refunded, or disputed.
- The milestone becomes Disputed and its funds remain reserved.
- A DisputeRaised event is emitted.
- Normal approval and refund transitions are blocked while the dispute is active.

## 3.6 Dispute resolution
As the designated arbitrator, I can allocate the disputed milestone amount between freelancer and client.

Acceptance criteria:
- Only the configured arbitrator can resolve.
- The milestone must be Disputed.
- The arbitrator specifies a freelancer share in basis points from 0 to 10,000.
- Freelancer share = milestone amount × shareBps / 10,000, using integer arithmetic.
- Client refund = milestone amount − freelancer share; this avoids rounding leakage.
- The freelancer share becomes a withdrawable credit for the freelancer.
- The client share becomes a withdrawable/refundable credit for the client.
- The milestone becomes Resolved and cannot be resolved again.
- A DisputeResolved event records the allocation.
- The arbitrator cannot allocate more than the disputed milestone's remaining amount.

This is a simple educational arbitration model. It does not establish whether a freelancer's work is objectively correct.

## 3.7 Withdrawal
As a participant with a positive withdrawable credit, I can withdraw my credit.

Acceptance criteria:
- The caller can withdraw only their own recorded credit.
- Credit is set to zero or reduced before making an external ETH transfer.
- Use checks-effects-interactions and an appropriate reentrancy guard from a compatible OpenZeppelin version, or implement and test an equivalent safe pattern.
- If the ETH transfer fails, the transaction reverts and the credit is not lost.
- A Withdrawal event is emitted.
- UI displays the before/after credit, receipt, and transaction hash.
- No user can withdraw another user's credit.

## 3.8 Refund/cancellation
The initial version must use conservative, explicit cancellation rules.

Recommended rules:
- A milestone in Pending state can be cancelled/refunded only if the agreement's rules permit it and there is no active dispute.
- A Submitted milestone cannot be unilaterally cancelled by the client; it must be approved, disputed, or handled by a separately specified mutual-cancellation rule.
- An Approved/Released or Resolved milestone cannot be refunded again.
- Credited funds belong to the named beneficiary and cannot be reclaimed by cancelling the agreement.
- The contract must not offer a general “refund the entire contract balance to the client” function.
- The initial version may omit mutual cancellation if implementing it safely would delay the core deliverable.
- Any eligible refund becomes a client withdrawable credit, rather than relying on a push transfer during cancellation.
- Emit a MilestoneRefunded or AgreementCancelled event as appropriate.

## 3.9 Read-only views
The frontend must be able to read:
- Agreement participants and status.
- Total amount and funding status.
- Milestone details, amount, deadline and state.
- Total amounts approved/released, refunded, and disputed.
- Each participant's withdrawable credit.
- Contract balance.
- Factory-created agreement addresses.
- Transaction/event history.

All financial and status values shown as authoritative must be read from the contract or transaction receipts, not hardcoded demo data.

---

# 4. Business Rules and State Machines

## 4.1 Agreement states

Use a small, documented state model. Recommended states:
- `Created` or `Unfunded`
- `Active`
- `Completed`
- `Cancelled` (only if cancellation rules are implemented)

Transitions:
- Creation → Created/Unfunded
- Successful exact funding → Active
- All milestones reach terminal outcomes and no reserved milestone remains → Completed
- Cancellation → Cancelled only when all required preconditions are met

Do not mark an agreement Completed merely because all milestones have been submitted. Completion must reflect terminal milestone outcomes and outstanding funds/credits according to the chosen definition.

## 4.2 Milestone states

Recommended enum:
- `Pending`
- `Submitted`
- `Disputed`
- `Released` (approved; freelancer has a withdrawable credit)
- `Resolved` (arbitration decision applied)
- `Refunded` (eligible client refund credited)

Use one consistent naming scheme in Solidity, tests, events and UI. Do not mix “Approved”, “Paid”, and “Released” if they represent different things. The recommended design distinguishes the milestone outcome from the later withdrawal transaction.

Allowed transitions:
- Pending → Submitted
- Pending → Refunded, only when eligible under cancellation rules
- Submitted → Released, by client approval
- Submitted → Disputed, by either party
- Disputed → Resolved, by arbitrator
- No transitions out of Released, Resolved, or Refunded

If an agreement needs a client-requested change, create a new agreement or add a separately specified mutual-consent flow. Do not silently alter the original milestone amount or participants.

## 4.3 Financial invariants

The contract must preserve these invariants:
1. The total value allocated to milestones equals the required agreement funding amount.
2. Each milestone amount is allocated at most once among freelancer credit, client refund credit, or still-reserved escrow funds.
3. A milestone cannot be both released and refunded.
4. A disputed milestone's amount remains reserved until resolution.
5. Total outstanding withdrawable credits never exceed the ETH held for those credits.
6. Contract balance must cover all outstanding withdrawable credits plus all funds still reserved for unresolved milestones.
7. No privileged role can create money, withdraw another person's credit, or allocate more than the milestone's available amount.
8. Every payout/refund path must update accounting before attempting an external transfer.
9. A failed withdrawal must revert atomically and preserve the user's credit.
10. Repeated calls cannot release, refund, or resolve the same milestone twice.

A recommended accounting model tracks:
- `totalRequired`
- `totalReserved` for unresolved milestone amounts
- `withdrawable[address]`
- optionally cumulative `totalCredited` and `totalWithdrawn` for audit/reporting

Document the exact invariant equation in the contract and tests. Be careful not to double-count a milestone amount after it moves from reserved escrow to a withdrawable credit.

---

# 5. System Architecture

## 5.1 High-level architecture

Browser UI (React + TypeScript)
→ application hooks/services (ethers.js v6)
→ JSON-RPC provider / local Hardhat Network
→ `EscrowFactory.sol`
→ individual `FreelanceEscrow.sol` contracts
→ transaction receipts, logs/events and contract state
→ frontend refreshes data from the provider/contract.

The local node and frontend run as separate local processes on the same laptop. No external API is required.

## 5.2 On-chain layer

### `EscrowFactory.sol`
Responsibilities:
- Create a distinct escrow instance for each agreement.
- Validate creation inputs or delegate the full validation to the escrow constructor.
- Track created escrow addresses.
- Emit `AgreementCreated` with client, freelancer, arbitrator, escrow address and project identifier.
- Provide read-only methods to enumerate or page through agreements.
- Avoid unnecessary owner privileges. The factory must not be able to drain funds from escrow instances.

### `FreelanceEscrow.sol`
Responsibilities:
- Store roles, agreement state, milestones, amounts and deadlines.
- Accept exact one-time funding.
- Enforce role-based transitions.
- Maintain reserved funds and withdrawable credits.
- Process milestone approvals, disputes, arbitration allocations and permitted refunds.
- Expose read-only summary and milestone methods.
- Emit auditable events.
- Use safe withdrawal logic and reentrancy protection.
- Avoid arbitrary external calls and avoid delegatecall/proxy patterns in the educational version.

### Libraries
Use a compatible OpenZeppelin Contracts version for utilities such as `ReentrancyGuard` and optional `Pausable` only if there is a well-defined pause policy. Do not add pausing simply as decoration: a pause must not let an administrator confiscate funds or permanently block users from withdrawing credits. Pin dependencies and use documentation for the installed major version.

## 5.3 Off-chain/frontend layer
The frontend is a client of the smart contract:
- Read on-chain state when loading a page.
- Use a signer for write operations.
- Wait for mined receipts before showing success.
- Decode contract events using the actual ABI.
- Refresh state after each transaction.
- Handle user rejection, RPC failure, reverted transactions, wrong network, missing deployment and stale addresses.
- Show local-chain status and the current connected account.
- Do not assume that a frontend role selector grants smart-contract permissions.

## 5.4 No backend/database in v1
Contract state and events are the source of truth for the first version. Avoid localStorage or mock JSON as an authoritative source of balances/status. UI preferences may be stored locally, but financial state must be read from the contract.

---

# 6. Complete Technology Stack

Use mutually compatible, pinned versions. Check current official docs during setup; do not copy commands from incompatible major versions.

## 6.1 Smart contract
- Solidity compiler version compatible with the selected Hardhat/OpenZeppelin dependencies.
- OpenZeppelin Contracts for reusable security utilities.
- Hardhat 3 for compilation, local execution, deployment and testing.
- TypeScript for configuration, deployment scripts and tests.
- Hardhat Network development accounts and test ETH.

## 6.2 Frontend
- React
- TypeScript
- Vite
- ethers.js v6
- React Router for pages
- Tailwind CSS for styling
- Lucide React for icons
- React Hook Form + Zod for form validation
- Vitest + React Testing Library for UI tests

Avoid adding a large state-management library unless actual complexity justifies it. React hooks and a small contract service layer are enough initially.

## 6.3 Wallets and accounts
- First choice: Hardhat local accounts exposed through a local provider or a carefully implemented local signer integration.
- Optional: MetaMask configured for the local Hardhat RPC.
- Use only disposable local accounts.
- Never commit private keys, seed phrases, RPC credentials or personal data.
- A role selector must select a real signer/account, not just update the UI label.

## 6.4 Development and quality tools
- Git for source control.
- VS Code or another editor.
- OpenCode and Google AI Studio for AI-assisted development within available usage limits.
- ESLint and Prettier for TypeScript/React code quality.
- Solidity formatting/linting tools where compatible.
- Automated tests in the repository.
- npm lockfile committed for reproducible dependency installs.

## 6.5 Explicitly not required
- Public Ethereum RPC provider
- Public testnet/mainnet
- Paid cloud hosting
- Database or backend API
- IPFS
- Docker, unless the developer specifically wants it
- Paid block explorer
- Real currency/payment gateway

---

# 7. Repository Structure

Use a single repository:

```text
freelance-milestone-escrow/
├── contracts/
│   ├── FreelanceEscrow.sol
│   └── EscrowFactory.sol
├── test/
│   ├── FreelanceEscrow.test.ts
│   ├── EscrowFactory.test.ts
│   ├── AccessControl.test.ts
│   ├── AccountingInvariant.test.ts
│   └── DisputesAndRefunds.test.ts
├── ignition/
│   └── modules/
│       └── Deploy.ts
├── scripts/
│   ├── deploy-local.ts
│   ├── seed-demo.ts
│   └── print-deployment.ts
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── contracts/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── test/
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── architecture.md
│   ├── threat-model.md
│   └── demo-script.md
├── hardhat.config.ts
├── package.json
├── package-lock.json
├── .gitignore
├── .env.example
└── README.md
```

Adjust this structure only when the installed Hardhat template requires a different convention. Do not create empty files or abstractions without a purpose.

---

# 8. UI/UX Requirements

## 8.1 Visual direction
Create a professional, clean fintech/Web3 dashboard:
- Light neutral background, dark readable text, restrained indigo/blue accent.
- Clear spacing and hierarchy.
- Cards for agreement summary and balances.
- Milestone timeline with readable status labels.
- Responsive layout suitable for a laptop presentation.
- Consistent buttons, badges, dialogs and form validation.
- Do not overuse gradients, animation, glassmorphism, or decorative charts.
- Accessibility: keyboard navigation, clear focus states, meaningful labels and sufficient contrast.

## 8.2 Global application header
Show:
- Application name: “Freelance Milestone Escrow”
- Local network status: “Hardhat Local”
- Connected account short address
- Current demo role derived from the selected account mapping, clearly labeled as a convenience only
- Account selector
- Link to transaction history / inspector
- Contract/factory address in a details area

Do not display “Ethereum Mainnet” when connected to a local chain.

## 8.3 Dashboard page
Show:
- Agreements where the current account is client or freelancer
- Total project value (label clearly as test ETH)
- Funds currently credited and available to withdraw
- Milestones awaiting review
- Active disputes
- Recent transactions with status
- Empty states with clear actions
- A visible indicator that the app is running on a local development blockchain

All summary cards must be computed from contract data or clearly marked as derived totals.

## 8.4 Create agreement page
Fields:
- Project title/short description
- Freelancer address
- Arbitrator address
- Dynamic milestone rows
- Each row: title/short description, amount in ETH, deadline
- Calculated total amount
- Validation messages
- Confirmation view before submission

Rules:
- Reject malformed/zero addresses.
- Enforce distinct roles.
- Require at least one milestone and maximum milestone count.
- Require positive amounts and future deadlines.
- Show exact total and warn that the client must fund the agreement.
- On submit, show pending state, transaction hash when available, receipt status and resulting contract address.
- Do not mark created until receipt success and contract address discovery are verified.

## 8.5 Agreement detail page
Show:
- Agreement address and short transaction link/copy action.
- Client, freelancer and arbitrator addresses.
- Funding status and totals.
- Milestone timeline and each milestone's state.
- Milestone amount and deadline.
- Submission reference/notes if present.
- Contextual actions based on the current account and on-chain state.
- Escrow's reserved amount and participant withdrawal credits.
- Event/transaction history for this agreement.
- Clear explanation that “approved/credited” is different from “withdrawn/paid to wallet.”

## 8.6 Role-specific actions
Client:
- Fund agreement (if not funded)
- Approve submitted milestone
- Raise dispute if permitted
- Cancel/refund only if contract rules permit

Freelancer:
- Submit pending milestone
- Raise dispute if permitted
- Withdraw credited funds

Arbitrator:
- See disputed milestone and amount
- Enter freelancer allocation percentage (0–100%)
- Preview freelancer credit and client refund
- Confirm resolution
- See the resulting receipt

Other accounts:
- Read public data
- No unauthorized write action should appear as enabled
- If a transaction is attempted directly, contract must still reject it

UI visibility is not security. Solidity must independently enforce all permissions.

## 8.7 Transaction Inspector page/panel
For each transaction, show:
- Action label
- Transaction hash with copy control
- Receipt status (success/reverted/pending/unknown)
- Block number
- From address
- To address
- Gas used
- Decoded events
- Associated agreement and milestone where applicable
- Timestamp only if reliably derived from the block timestamp
- A refresh/verify button that queries the provider by hash and reads current contract state

No fabricated hashes, block numbers, gas values or “verified” badges. If a transaction is not found by the provider, show “Not found on the current local chain” rather than inventing a result.

## 8.8 Loading and error states
Implement:
- Wallet/account not selected
- Wrong network or disconnected provider
- Contract address missing/stale
- Transaction awaiting wallet/signature
- Transaction pending
- Transaction succeeded
- Transaction reverted
- User rejected the signature
- RPC/node unavailable
- Insufficient local test ETH
- Contract function not permitted
- Malformed form input
- Empty agreement list
- Event not found

Never swallow errors silently. Show a concise human-readable message and allow details to be expanded.

---

# 9. Transaction Verification Design

The project must make real local blockchain execution easy to verify.

## 9.1 Transaction lifecycle
1. User selects a valid action.
2. Frontend validates form fields for usability.
3. ethers.js calls the actual deployed contract with the correct signer.
4. UI shows the pending state and transaction hash when available.
5. Frontend waits for the transaction receipt.
6. Verify receipt status equals success.
7. Read the receipt's transaction hash, block number, sender, destination and gas used.
8. Parse logs/events using the ABI.
9. Query contract state again.
10. Compare expected state changes with the on-chain result.
11. Display success only when the mined receipt and resulting state support it.

## 9.2 Evidence to show in the demo
For a milestone approval:
- Transaction hash
- Successful receipt status
- Block number
- Client sender address
- Escrow contract destination
- `MilestoneReleased` or equivalent event
- Milestone status after the transaction
- Freelancer withdrawable credit after the transaction

For a subsequent withdrawal:
- Separate transaction hash and receipt
- Freelancer as sender
- Escrow contract as destination
- `Withdrawal` event
- Freelancer's credit reduced accordingly
- Escrow balance reduced by the actual transfer, accounting for any other reserved funds/credits

## 9.3 Local explorer limitation
A Hardhat local transaction does not appear on public Etherscan. Do not present a fake Etherscan link. The local transaction inspector, provider RPC and Hardhat logs are the appropriate verification mechanisms.

## 9.4 Verification implementation
Use ethers.js v6 transaction response and receipt APIs. Wait for the transaction to be mined, check the receipt status, and then query the provider/contract again. A transaction hash by itself is not proof of success. A reverted transaction may be mined and have a failed receipt status.

---

# 10. Security Requirements and Threat Model

This is an educational financial contract. Security must be implemented and tested, but the finished project must not be described as audited or production-ready.

## 10.1 Access control
- Validate client-only operations on-chain.
- Validate freelancer-only operations on-chain.
- Validate arbitrator-only dispute resolution on-chain.
- Reject zero addresses.
- Require distinct roles for the initial demo.
- Avoid an owner backdoor that can transfer arbitrary escrow funds.
- Do not trust the UI role selector.
- Test direct unauthorized calls from a fourth account.

## 10.2 ETH accounting and withdrawals
- Exact funding amount; no accidental underfunding or overfunding.
- Use Solidity checked arithmetic and integer basis points for percentage splits.
- Keep per-user withdrawable balances.
- Credit funds in state before any external transfer.
- Apply checks-effects-interactions and a compatible reentrancy guard.
- Revert if a withdrawal transfer fails.
- Prevent withdrawals above recorded credits.
- Prevent duplicate milestone settlement.
- Maintain reserved funds separately from withdrawable credits.
- Add invariant tests that total liabilities never exceed the contract balance.
- Do not rely on `address(this).balance` alone to decide who owns which funds.
- Do not add an unrestricted emergency drain.

## 10.3 State validation
- Every function checks the expected agreement and milestone state.
- Every transition is explicit and one-way where appropriate.
- A disputed milestone cannot be approved or refunded through the ordinary path.
- A settled milestone cannot be disputed, paid or refunded again.
- Funding is accepted only in the correct state.
- Deadlines use `block.timestamp` and documented boundary rules.
- Frontend time displays are informational; contract checks are authoritative.

## 10.4 Reentrancy and external calls
- Minimize external calls in state-changing functions.
- Use a withdrawal-credit model rather than pushing money to a recipient during approval or dispute resolution.
- Update credit/state before withdrawal transfer.
- Use a compatible OpenZeppelin reentrancy guard where appropriate.
- Test failed transfers and reentrancy-related behavior using a malicious receiver test contract if feasible.

## 10.5 Dispute safety
- Arbitrator can resolve only a disputed milestone.
- Arbitrator can allocate only the remaining amount for that milestone.
- Allocation percentage is bounded from 0 to 10,000 basis points.
- Resolution is one-time only.
- Decision and allocation are emitted as an event.
- No arbitrator function can seize funds from unrelated milestones or other participants' credits.
- Clearly disclose that arbitration is a simplified demonstration.

## 10.6 Frontend security
- Never store private keys in frontend source code, `.env` files shipped to the browser, or Git.
- If a local demo signer needs private keys, use only disposable Hardhat development keys and keep the integration local-only.
- Never use real wallet secrets for the demo.
- Validate user input on the frontend for UX, but repeat all critical validation in Solidity.
- Do not render untrusted submission notes as raw HTML.
- Do not trust cached UI state for balances or permissions.
- Show transaction rejection/revert errors accurately.
- Do not call a transaction “successful” before a successful receipt and state refresh.
- Keep dependencies pinned and avoid unneeded packages.

## 10.7 Privacy
- Assume all on-chain data is publicly readable to anyone with access to the chain.
- Do not store personal documents, passwords, email addresses or confidential work details on-chain.
- Store only short notes or non-sensitive content references in the first version.
- The local chain is not a confidentiality guarantee.

## 10.8 Known limitations
- A local chain is resettable and is not a public immutable audit system.
- Local test ETH has no real monetary value.
- Smart contracts cannot objectively judge work quality.
- `block.timestamp` is suitable for the educational deadline model, but is not a perfect real-world clock.
- There is no formal audit, legal enforcement, or production dispute service.
- The project is not safe for real funds without professional review, threat modeling, testing and audit.

---

# 11. Testing Strategy

## 11.1 Contract unit tests
Test every public/external function for:
- Correct caller and wrong caller.
- Correct state and invalid state.
- Valid values and boundary values.
- Exact funding, underfunding and overfunding.
- Repeated calls.
- Zero address and invalid role combinations.
- Deadline boundary: just before, exactly at, and just after the deadline.
- Percentage allocation at 0%, 50%, and 100%.
- Integer rounding with non-divisible amounts.
- Transfer failure during withdrawal.
- No balance/credit change after a reverted transaction.

## 11.2 Accounting/invariant tests
Test that:
- Sum of milestone allocations equals required funding.
- Reserved amount decreases exactly when a milestone is settled.
- Credits increase by exactly the allocated amount.
- Withdrawals reduce credits and contract balance by the actual transfer.
- No milestone is settled twice.
- No credits are created without a corresponding escrow allocation.
- Contract balance covers reserved funds and withdrawable liabilities.
- Client refunds cannot take freelancer credits.
- Dispute resolution cannot affect unrelated milestones.

## 11.3 Factory tests
- Factory creates a valid agreement.
- Invalid creation inputs revert.
- Created address is tracked and event emitted.
- Different agreements use independent contract state.
- Factory cannot withdraw funds from an escrow.
- Agreement enumeration does not return duplicates.

## 11.4 Frontend tests
- Forms reject invalid addresses, zero amounts and past deadlines.
- The correct signer is used for each role.
- Buttons show pending state while waiting for a receipt.
- Failed/reverted transactions display errors.
- Successful transactions refresh state from contract reads.
- Unauthorized actions are hidden/disabled in UI but still rejected on-chain.
- Transaction inspector handles missing transactions and failed receipts.
- No mock data is mistaken for real contract state.

## 11.5 End-to-end demo test
Create an agreement with three milestones, fund it, submit and approve one, dispute another and resolve it, refund an eligible pending milestone, and withdraw credits. Verify receipts and accounting at every stage.

---

# 12. Stage-by-Stage Development Plan

AI must implement one phase at a time. Do not generate the whole application in one large code dump.

## Stage 0 — Environment and repository
Tasks:
- Check Node.js/npm versions.
- Initialize Git.
- Create a Hardhat 3 project using the official current guide.
- Create a React + TypeScript + Vite app.
- Pin dependencies and commit the lockfile.
- Confirm a minimal local contract compiles and a minimal frontend runs.

Exit criteria:
- Clean install works.
- Hardhat tests run.
- Vite app starts.
- No paid service or public RPC is required.

## Stage 1 — Finalize contract specification
Tasks:
- Write agreement and milestone enums.
- Define all allowed state transitions.
- Define funding, credit, withdrawal, dispute and refund accounting.
- Define cancellation limitations.
- Define events and view functions.
- Document the liability invariant.

Exit criteria:
- Every state-changing function has caller, preconditions, state effects, emitted event and failure conditions documented.
- No unresolved ambiguous fund path remains.

## Stage 2 — Implement `FreelanceEscrow.sol`
Tasks:
- Implement constructor/input validation.
- Implement exact funding.
- Implement submission and approval.
- Implement dispute and arbitration split.
- Implement credit-based withdrawal.
- Implement eligible refund/cancellation.
- Implement read-only views and events.
- Add reentrancy protection where appropriate.

Exit criteria:
- Contract compiles.
- Basic tests cover each function.
- No UI work is required yet.

## Stage 3 — Security and accounting tests
Tasks:
- Add unauthorized-caller tests.
- Add state-transition tests.
- Add boundary/deadline tests.
- Add repeated-call and double-settlement tests.
- Add withdrawal failure tests.
- Add invariant/accounting tests.
- Add malicious receiver test if feasible.

Exit criteria:
- All tests pass.
- No known path can create duplicate credits or drain unrelated funds.
- Any limitation is documented.

## Stage 4 — Implement `EscrowFactory.sol`
Tasks:
- Create escrow instances.
- Track addresses and emit creation events.
- Implement read methods for agreement discovery.
- Test independent agreements and factory restrictions.

Exit criteria:
- Multiple agreements can be created and queried.
- The factory cannot access escrow funds.

## Stage 5 — Local deployment and demo script
Tasks:
- Add deployment module/script.
- Deploy factory and contracts to local Hardhat Network.
- Print addresses and chain ID.
- Create repeatable sample accounts/agreements for demo.
- Generate/copy ABI and deployment address to the frontend.
- Document how to reset and redeploy after restarting the chain.

Exit criteria:
- A clean local node can be deployed from scratch using documented steps.
- The frontend uses the correct deployed addresses.
- No address is hardcoded without being generated by deployment output.

## Stage 6 — Frontend foundation
Tasks:
- Build header, navigation, local network indicator and account selector.
- Implement provider/signer setup.
- Add contract service layer and typed contract access.
- Add shared transaction submission/wait/receipt handling.
- Add reusable loading and error components.

Exit criteria:
- UI can read the factory and a deployed escrow.
- A write call can be sent, mined and verified.
- No business action is simulated solely in React state.

## Stage 7 — Agreement and milestone UI
Tasks:
- Build dashboard and create-agreement form.
- Build agreement detail and milestone timeline.
- Add funding, submission, approval and withdrawal actions.
- Add dispute and arbitrator resolution views.
- Add contextual actions based on current account and contract state.

Exit criteria:
- End-to-end workflow works through the UI.
- Role permissions are still enforced by Solidity.
- Contract state refreshes after every transaction.

## Stage 8 — Transaction inspector
Tasks:
- Record submitted transaction hashes in runtime UI state or reconstruct history from events.
- Query provider receipts by hash.
- Decode relevant events.
- Show sender, destination, block number, gas used and receipt status.
- Query contract state after a transaction.
- Provide copy-hash/address controls and clear local-chain labels.

Exit criteria:
- Each major action has inspectable transaction evidence.
- Missing or reverted transactions are not shown as successful.

## Stage 9 — UI polish and accessibility
Tasks:
- Refine spacing, typography, statuses, forms, empty states and responsive layout.
- Add accessible labels and keyboard focus.
- Ensure all balances are clearly labeled as local test ETH.
- Remove placeholder content that looks like real on-chain data.

Exit criteria:
- Presentation is clear and professional.
- No fake balances, fake transactions or fake explorer links remain.

## Stage 10 — Full regression and demo readiness
Tasks:
- Run all contract and frontend tests.
- Reset local chain and redeploy.
- Execute demo from a clean state.
- Test invalid actions.
- Verify all transaction receipts and state changes.
- Write README and demo script.

Exit criteria:
- A classmate can follow README to start the project.
- Demo is repeatable on one laptop.
- All core actions work without internet after dependencies are installed.
- Security limitations are disclosed.

---

# 13. Demonstration Script (5–8 minutes)

## Setup before presentation
- Start local Hardhat node.
- Deploy factory and implementation contracts.
- Start frontend.
- Confirm local chain ID and account balances.
- Prepare three milestones, such as:
  - Milestone 1: UI prototype — 0.30 ETH
  - Milestone 2: Core functionality — 0.50 ETH
  - Milestone 3: Final delivery — 0.20 ETH
- Total agreement funding: 1.00 ETH in local test ETH.
- Use three distinct local accounts: client, freelancer, arbitrator.
- Keep the Hardhat terminal visible or ready to show.

## Demo sequence
1. **Create agreement:** Client enters freelancer, arbitrator, and three milestones. Show the total and submit. Open the receipt panel and show the successful creation transaction and escrow address.
2. **Fund agreement:** Client deposits exactly 1.00 test ETH. Show the FundingReceived event and updated funding state.
3. **Unauthorized action:** Switch to an unrelated account and try to approve a milestone. Show the contract rejection. Explain that UI restrictions are not the security boundary.
4. **Submit work:** Switch to freelancer and submit Milestone 1. Show the transaction hash, event and state transition.
5. **Approve milestone:** Switch to client and approve Milestone 1. Show that the freelancer's withdrawable credit increases by 0.30 ETH.
6. **Withdraw:** Switch to freelancer and withdraw. Show a separate withdrawal receipt and credit becoming zero for that withdrawal.
7. **Raise dispute:** Submit Milestone 2 and have one party raise a dispute. Show normal approval is blocked.
8. **Resolve dispute:** Switch to arbitrator and allocate 70% to freelancer, 30% to client. Show both credits and the DisputeResolved event.
9. **Refund pending milestone:** Use the explicitly implemented eligible refund path for Milestone 3. Show client credit; if this feature is omitted from the first version, do not pretend it exists.
10. **Verify:** Open transaction inspector and show receipts, events, sender addresses, contract address, block numbers and contract state.

Do not attempt every feature if time is limited. The minimum compelling demo is create → fund → submit → approve → withdraw → inspect receipt, plus one rejected unauthorized call.

## Expected evidence
- Local chain ID and contract addresses.
- Successful transaction receipts.
- Relevant events.
- Before/after milestone status.
- Before/after withdrawal credit.
- Contract tests proving unauthorized and duplicate actions revert.
- A README and repeatable reset/deploy procedure.

---

# 14. Deployment and Run Instructions

The exact commands must be generated and checked against the selected Hardhat version and project template. Do not mix Hardhat 2 and Hardhat 3 command/plugin examples.

The intended operational flow is:
1. Install Node.js and dependencies.
2. Start the local Hardhat node in Terminal 1.
3. Run tests in a separate terminal.
4. Deploy the contracts to the running local node.
5. Generate or update frontend ABI and deployment address.
6. Start the Vite frontend in Terminal 2.
7. Open the local browser URL.
8. Use the demo account selector or MetaMask configured to the local RPC.
9. After resetting/restarting the chain, redeploy and update the frontend deployment artifact.

The README must include exact working commands, expected output, local RPC URL, chain ID, demo account labels, and troubleshooting. Do not publish development private keys in screenshots, public repositories, or committed files.

---

# 15. AI Coding Agent Instructions

This section is mandatory. The AI coding agent must follow it throughout development.

## 15.1 Work incrementally
- Read this entire document before changing files.
- Inspect the existing repository and package versions before proposing commands.
- Implement one stage at a time.
- Do not generate the entire application in one response.
- After each stage, run the relevant build/tests and report actual results.
- Do not claim tests pass unless they were actually run and passed.
- Do not silently skip a failing test.

## 15.2 Solidity first
- Contract correctness and accounting are more important than visual polish.
- Finish the state machine and financial invariants before frontend work.
- Every state-changing function must have a documented role, precondition, state transition, accounting effect, event, and failure case.
- Every money movement must have a test.
- Prefer small functions and explicit state transitions.
- Avoid unnecessary abstractions, upgradeability, assembly, delegatecall, and arbitrary external calls.
- Do not add token standards or external dependencies unless justified.

## 15.3 Security is not optional
- Never bypass a Solidity permission check to make the UI work.
- Never use frontend-only role checks as access control.
- Never add an unrestricted owner withdrawal.
- Never let cancellation reclaim credits already owed to the freelancer.
- Never allow a milestone to be paid or refunded twice.
- Never mark a transaction successful before receipt confirmation.
- Never store real secrets in source code.
- If a requested feature conflicts with the financial invariants, stop and explain the conflict before coding.

## 15.4 Dependencies and documentation
- Use official documentation for the installed versions.
- Pin compatible dependency versions and commit the lockfile.
- Avoid adding libraries for features that can be implemented simply and safely with the existing stack.
- If a dependency or API is version-sensitive, verify its current official documentation before coding.
- Do not invent command names, contract APIs or package functions.

## 15.5 Frontend requirements
- Use TypeScript and typed contract interfaces where practical.
- Keep blockchain reads/writes in a service or hook layer rather than scattered across components.
- Wait for receipts and refresh contract state.
- Display actual transaction evidence.
- Handle rejected signatures, reverts, wrong network and disconnected node.
- Never use mock state as authoritative financial state.
- Keep components readable and avoid a monolithic single-file application.

## 15.6 Required output for every development stage
Before coding, provide:
1. Stage objective.
2. Files to create or modify.
3. Implementation plan.
4. Security implications.
5. Acceptance criteria.

After coding, provide:
1. Files changed.
2. Summary of implementation.
3. Exact commands run.
4. Actual test/build results.
5. Known limitations or failures.
6. Recommended next stage.

## 15.7 Stop conditions
Stop and ask for clarification if:
- Two requirements conflict about ownership of funds.
- Cancellation or dispute rules leave funds unallocated.
- A design would let one role take another role's money.
- The requested behavior cannot be enforced reliably on-chain.
- The environment/version mismatch prevents safe implementation.
Otherwise, choose the simplest secure approach consistent with this specification and document the decision.

---

# 16. Definition of Done

The project is complete when all of the following are true:

- [ ] Local environment installs using documented commands.
- [ ] Contracts compile with pinned compatible versions.
- [ ] Factory creates independent escrow agreements.
- [ ] Exact funding works and invalid funding fails.
- [ ] Client/freelancer/arbitrator permissions are enforced on-chain.
- [ ] Milestone submission and approval work.
- [ ] Disputes can be raised and resolved according to the rules.
- [ ] Withdrawal credits and ETH transfers are accounted for correctly.
- [ ] Eligible refunds work without reclaiming funds owed to a freelancer.
- [ ] Duplicate release/refund/resolve attempts fail.
- [ ] Automated tests cover positive, negative, boundary and accounting cases.
- [ ] Frontend reads real deployed contract state.
- [ ] Transaction inspector displays actual receipts and events.
- [ ] Unauthorized direct contract calls are rejected.
- [ ] Full demo can be repeated after a clean local deployment.
- [ ] README, architecture, threat model and demo instructions are present.
- [ ] The UI clearly labels all ETH as local test ETH.
- [ ] Limitations are documented and the project is not falsely described as audited.

---

# 17. Official References

Use official documentation as the primary reference and verify instructions against the versions actually installed.

- Hardhat documentation: https://hardhat.org/docs
- Solidity documentation: https://docs.soliditylang.org/
- OpenZeppelin Contracts documentation: https://docs.openzeppelin.com/contracts/
- ethers.js documentation: https://docs.ethers.org/v6/
- React documentation: https://react.dev/
- Vite documentation: https://vite.dev/guide/
- TypeScript documentation: https://www.typescriptlang.org/docs/
- Vitest documentation: https://vitest.dev/guide/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/

---

# 18. Final Implementation Principle

Build this as a **smart-contract-first educational dApp**. The most important proof of success is not how much UI is present; it is whether the contract reliably enforces the agreement, preserves every unit of escrowed value, rejects invalid actions, and exposes real transaction evidence.

The frontend must make those properties easy to see. The tests must make them repeatable. The documentation must make the project understandable to another student. The local deployment must make the entire system demonstrable on one laptop without spending money on blockchain infrastructure.
"""

# Generate a standalone Markdown file using pypandoc as required.
pypandoc.convert_text(content, 'md', format='md', outputfile=md_path, extra_args=['--standalone'])

# Create a readable DOCX version from the same source, preserving headings, lists, tables, and code blocks.
doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(0.7)
sec.bottom_margin = Inches(0.7)
sec.left_margin = Inches(0.8)
sec.right_margin = Inches(0.8)

styles = doc.styles
styles['Normal'].font.name = 'Aptos'
styles['Normal'].font.size = Pt(9.5)
styles['Normal'].font.color.rgb = RGBColor(40, 45, 55)
for sname, size, color in [('Title', 26, '153E75'), ('Heading 1', 18, '153E75'), ('Heading 2', 13, '245A81'), ('Heading 3', 10.5, '245A81')]:
    st = styles[sname]
    st.font.name = 'Aptos Display' if sname != 'Normal' else 'Aptos'
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = RGBColor.from_string(color)

def shade_cell(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), fill)
    tcPr.append(shd)

def add_rich_runs(paragraph, text):
    # Basic inline markdown support for bold and inline code.
    parts = re.split(r'(\*\*.*?\*\*|`[^`]+`|\*[^*]+\*)', text)
    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**'):
            r = paragraph.add_run(part[2:-2]); r.bold = True
        elif part.startswith('`') and part.endswith('`'):
            r = paragraph.add_run(part[1:-1]); r.font.name = 'Consolas'; r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(90, 50, 130)
        elif part.startswith('*') and part.endswith('*'):
            r = paragraph.add_run(part[1:-1]); r.italic = True
        else:
            paragraph.add_run(part)

lines = content.splitlines()
i = 0
in_code = False
code_lines = []
first_title_done = False
while i < len(lines):
    line = lines[i]
    if line.strip().startswith('```'):
        if not in_code:
            in_code = True; code_lines = []
        else:
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.18)
            p.paragraph_format.space_after = Pt(5)
            r = p.add_run('\n'.join(code_lines))
            r.font.name = 'Consolas'; r.font.size = Pt(8)
            in_code = False
        i += 1
        continue
    if in_code:
        code_lines.append(line)
        i += 1
        continue
    if not line.strip():
        i += 1
        continue
    # Markdown table detection
    if line.strip().startswith('|') and i + 1 < len(lines) and re.match(r'^\s*\|?[\s:|-]+\|[\s:|-]*$', lines[i+1]):
        table_lines = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            table_lines.append(lines[i].strip())
            i += 1
        parsed = []
        for tl in table_lines:
            cells = [c.strip() for c in tl.strip('|').split('|')]
            if all(re.fullmatch(r':?-{2,}:?', c or '-') for c in cells):
                continue
            parsed.append(cells)
        if parsed:
            ncols = max(len(row) for row in parsed)
            table = doc.add_table(rows=0, cols=ncols)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.style = 'Light Shading Accent 1'
            for ridx, row in enumerate(parsed):
                cells = table.add_row().cells
                for cidx in range(ncols):
                    val = row[cidx] if cidx < len(row) else ''
                    cells[cidx].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
                    p = cells[cidx].paragraphs[0]
                    add_rich_runs(p, val)
                    if ridx == 0:
                        shade_cell(cells[cidx], 'D9EAF7')
                        for run in p.runs:
                            run.bold = True
            doc.add_paragraph()
        continue
    if line.startswith('# '):
        title = line[2:].strip()
        if not first_title_done:
            p = doc.add_paragraph(style='Title')
            add_rich_runs(p, title)
            first_title_done = True
        else:
            doc.add_heading(title, level=1)
    elif line.startswith('## '):
        doc.add_heading(line[3:].strip(), level=1)
    elif line.startswith('### '):
        doc.add_heading(line[4:].strip(), level=2)
    elif line.startswith('#### '):
        doc.add_heading(line[5:].strip(), level=3)
    elif line.startswith('> '):
        p = doc.add_paragraph(style='Quote')
        add_rich_runs(p, line[2:])
    elif re.match(r'^\s*[-*] ', line):
        p = doc.add_paragraph(style='List Bullet')
        add_rich_runs(p, re.sub(r'^\s*[-*] ', '', line))
    elif re.match(r'^\s*\d+\. ', line):
        p = doc.add_paragraph(style='List Number')
        add_rich_runs(p, re.sub(r'^\s*\d+\. ', '', line))
    elif line.startswith('**Document purpose:**') or line.startswith('**Project type:**') or line.startswith('**Deployment target:**') or line.startswith('**Blockchain currency:**') or line.startswith('**Primary priority:**') or line.startswith('**Status:**'):
        p = doc.add_paragraph()
        add_rich_runs(p, line)
    else:
        p = doc.add_paragraph()
        add_rich_runs(p, line)
    i += 1

# Header and footer
for section in doc.sections:
    header = section.header.paragraphs[0]
    header.text = "FREELANCE MILESTONE ESCROW  |  PROJECT SPECIFICATION"
    header.style = styles['Caption']
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.add_run("Educational local-chain prototype • Not a production security audit")
doc.save(docx_path)

print("Created files:")
print(md_path, os.path.getsize(md_path), "bytes")
print(docx_path, os.path.getsize(docx_path), "bytes")
