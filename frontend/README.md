# Freelance Milestone Escrow — Frontend Web Application

React + TypeScript application with Vite and Tailwind CSS. Provides an intuitive, responsive interface for interacting with the Freelance Milestone Escrow smart contracts.

---

## Navigation Architecture

### Pre-Sign In Navigation
- **How It Works**: Interactive guide to the 4-step escrow lifecycle.
- **Features**: Single-role account model, non-custodial wallets, and milestone release schedules.
- **Security**: Invariant guarantees and smart contract threat mitigations.

### Post-Sign In Navigation

#### Client Navigation
- **Dashboard**: Overview of commissioned projects, locked funds, and submission counters.
- **My Projects**: Complete directory of client contracts and progress indicators.
- **Create Project**: Form for deploying new multi-milestone escrow agreements.
- **Transactions**: On-chain ledger of funding, releases, and dispute events.
- **Wallet**: Non-custodial wallet drawer with balance, address copying, and account switcher.

#### Freelancer Navigation
- **Dashboard**: Summary of assigned contracts, deadlines, and withdrawable earnings.
- **My Projects**: All contracts where the account is designated as the freelancer.
- **Milestone Submissions**: Console for attaching deliverables and tracking client approvals.
- **Earnings**: Direct withdrawable balance manager with 1-click execution.
- **Transactions**: Full verifiable audit trail of confirmations and payouts.
- **Wallet**: Personal wallet management interface with balance verification and network status.

---

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript typecheck & lint
npm run lint

# Compile production bundle
npm run build
```
