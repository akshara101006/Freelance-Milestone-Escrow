import React, { useState } from 'react';
import {
  FileText,
  Lock,
  Send,
  CheckCircle2,
  Coins,
  Scale,
  ShieldCheck,
  ArrowRight,
  Layers,
  GitBranch,
  Terminal,
  Database,
  Wallet,
} from 'lucide-react';

interface HowItWorksViewProps {
  onConnectWallet: () => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onConnectWallet }) => {
  const [selectedStage, setSelectedStage] = useState<number>(0);

  const steps = [
    {
      num: '01',
      title: 'Agreement Commissioning & Terms Definition',
      subtitle: 'Client defines project scope, milestones, and participant addresses',
      desc: 'The client initiates a new agreement by specifying the project title, detailed scope, individual milestone titles, ETH allocations, delivery deadlines, the Freelancer wallet address, and the neutral Arbitrator wallet address.',
      icon: <FileText className="w-6 h-6 text-lime-300" />,
      tag: 'Client Action',
      soliditySig: 'constructor(address _freelancer, address _arbitrator, uint256[] _amounts) payable',
      preconditions: [
        'client != _freelancer && client != _arbitrator && _freelancer != _arbitrator',
        '_amounts.length > 0 (at least one milestone defined)',
        'Role Registry confirms each address holds its designated single role',
      ],
      effects: [
        'Initializes immutable client, freelancer, and arbitrator state variables',
        'Creates Milestone structs in storage with initial status = State.Pending (0)',
      ],
      event: 'AgreementCreated(address indexed client, address indexed freelancer, address arbitrator, uint256 totalAmount)',
    },
    {
      num: '02',
      title: '100% Upfront Smart Contract Escrow Lockup',
      subtitle: 'Full project value quarantined in contract reserves prior to work',
      desc: 'During deployment, the client deposits 100% of the cumulative milestone value in ETH. The smart contract constructor sums all milestone allocations and reverts immediately if msg.value does not match to the exact wei.',
      icon: <Lock className="w-6 h-6 text-amber-300" />,
      tag: 'Escrow Guarantee',
      soliditySig: 'require(msg.value == sumOfMilestones, "Exact funding required")',
      preconditions: [
        'msg.value == Σ(milestones[i].amount) across all phases',
        'Each individual milestone amount > 0 wei',
      ],
      effects: [
        'Sets totalReserved = msg.value inside contract storage',
        'Verifies address(this).balance == totalReserved + totalWithdrawable',
      ],
      event: 'EscrowFunded(uint256 totalReserved, uint256 milestoneCount)',
    },
    {
      num: '03',
      title: 'Phase-by-Phase Deliverable Proof Submission',
      subtitle: 'Freelancer commits cryptographic proof & work artifacts on-chain',
      desc: 'After verifying on-chain that 100% of project funds are locked in totalReserved, the freelancer executes the work. Upon completing a phase, the freelancer submits deliverable links, commit hashes, or IPFS CIDs on-chain.',
      icon: <Send className="w-6 h-6 text-emerald-400" />,
      tag: 'Freelancer Action',
      soliditySig: 'function submitMilestone(uint256 milestoneId, string calldata proof) external onlyFreelancer',
      preconditions: [
        'msg.sender == freelancer (enforced by onlyFreelancer modifier)',
        'milestones[milestoneId].status == State.Pending',
      ],
      effects: [
        'Updates milestones[milestoneId].status = State.Submitted (1)',
        'Records deliverable proof metadata and submission timestamp on-chain',
      ],
      event: 'MilestoneSubmitted(uint256 indexed milestoneId, string deliverableHash, uint256 timestamp)',
    },
    {
      num: '04',
      title: 'Client Deliverable Verification & Approval',
      subtitle: 'Phase allocation moves from locked reserve to freelancer credit',
      desc: 'The client inspects the submitted deliverable proof. When satisfied that specifications are met, the client signs approveMilestone(id). The smart contract deducts the phase amount from totalReserved and credits withdrawable[freelancer].',
      icon: <CheckCircle2 className="w-6 h-6 text-lime-300" />,
      tag: 'Client Approval',
      soliditySig: 'function approveMilestone(uint256 milestoneId) external onlyClient nonReentrant',
      preconditions: [
        'msg.sender == client (enforced by onlyClient modifier)',
        'milestones[milestoneId].status == State.Submitted (or Pending)',
      ],
      effects: [
        'Updates milestones[milestoneId].status = State.Released (2)',
        'Decrements totalReserved -= amount; increments withdrawable[freelancer] += amount',
      ],
      event: 'MilestoneApproved(uint256 indexed milestoneId, address indexed freelancer, uint256 amount)',
    },
    {
      num: '05',
      title: 'Impartial Dispute Escalation & Basis-Point Arbitration',
      subtitle: 'Neutral arbitrator partitions contested milestone with 0.01% precision',
      desc: 'If a submitted deliverable fails specifications, the client calls raiseDispute(id) to freeze the milestone in State.Disputed. The designated Arbitrator reviews the evidence in the Resolution Center and calls resolveDispute(id, freelancerBps).',
      icon: <Scale className="w-6 h-6 text-amber-400" />,
      tag: 'Arbitration Path',
      soliditySig: 'function resolveDispute(uint256 milestoneId, uint256 freelancerBps) external onlyArbitrator nonReentrant',
      preconditions: [
        'msg.sender == arbitrator (enforced by onlyArbitrator modifier)',
        'milestones[milestoneId].status == State.Disputed (3)',
        'freelancerBps <= 10000 (where 10,000 BPS = 100.00%)',
      ],
      effects: [
        'Computes freelancerAward = (amount * freelancerBps) / 10000 and clientRefund = amount - freelancerAward',
        'Updates status = State.Resolved (4), decrements totalReserved, credits both withdrawable balances',
      ],
      event: 'DisputeResolved(uint256 indexed milestoneId, uint256 freelancerBps, uint256 freelancerAward, uint256 clientRefund)',
    },
    {
      num: '06',
      title: 'Non-Custodial Pull-Over-Push Wallet Withdrawal',
      subtitle: 'Reentrancy-guarded direct ETH transfer to personal wallet',
      desc: 'At any time after funds are credited to withdrawable[msg.sender], the freelancer (or refunded client) invokes withdraw(). The contract zeroes the caller credit balance first under a nonReentrant lock and transfers ETH to their wallet.',
      icon: <Coins className="w-6 h-6 text-emerald-300" />,
      tag: 'Instant Settlement',
      soliditySig: 'function withdraw() external nonReentrant',
      preconditions: [
        '_status != _ENTERED (ReentrancyGuard mutex unlocked)',
        'withdrawable[msg.sender] > 0 wei',
      ],
      effects: [
        'Sets withdrawable[msg.sender] = 0 and decrements totalWithdrawable before external call (CEI)',
        'Transfers ETH via msg.sender.call{value: amount}("") and verifies solvency invariant',
      ],
      event: 'FundsWithdrawn(address indexed recipient, uint256 amount)',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 space-y-16 animate-in fade-in duration-200">
      {/* 1. PAGE HEADER */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-lime-300 text-xs font-semibold">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protocol Execution Lifecycle & Sequence Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          How Autonomous Milestone Escrow Works
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          From initial agreement deployment and 100% reserve lockup to deliverable verification, basis-point dispute resolution, and pull withdrawals—every phase is enforced deterministically on the EVM.
        </p>
      </div>

      {/* 2. MULTI-LANE SWIMLANE SEQUENCE DIAGRAM */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-emerald-500/25 shadow-2xl shadow-black/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-mono text-lime-300 font-semibold">
              01. Multi-Actor Chronological Sequence Diagram
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              On-Chain Interaction & Message Passing Swimlanes
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            4 Swimlanes · Deterministic EVM Execution
          </span>
        </div>

        {/* Swimlane Header Columns */}
        <div className="grid grid-cols-4 gap-3 text-center font-mono text-xs">
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/35 text-emerald-300 font-bold">
            1. Client Wallet
            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">onlyClient Signer</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-lime-400/40 text-lime-300 font-bold">
            2. Escrow Smart Contract
            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">Vault & State Machine</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/35 text-emerald-300 font-bold">
            3. Freelancer Wallet
            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">onlyFreelancer Signer</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-400/35 text-amber-300 font-bold">
            4. Arbitrator Wallet
            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">onlyArbitrator Signer</span>
          </div>
        </div>

        {/* Sequence Steps Rows */}
        <div className="space-y-3 text-xs font-mono">
          {/* Row 1: Deploy & Fund */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-3 text-emerald-300 font-bold">
              [T1] Client Signs Deployment
            </div>
            <div className="md:col-span-6 text-slate-200 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-lime-300">msg.value = 100% ETH</span>
              <span>→</span>
              <span>Locks <code className="text-white">totalReserved</code> · Sets all milestones to <code className="text-amber-300">Pending</code></span>
            </div>
            <div className="md:col-span-3 text-right text-slate-400 text-[11px]">
              emit AgreementCreated()
            </div>
          </div>

          {/* Row 2: Submit Deliverable */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-3 text-lime-300 font-bold">
              [T2] Freelancer Submits Work
            </div>
            <div className="md:col-span-6 text-slate-200 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">submitMilestone(id, proof)</span>
              <span>→</span>
              <span>Transitions phase <code className="text-amber-300">Pending</code> → <code className="text-blue-300">Submitted</code></span>
            </div>
            <div className="md:col-span-3 text-right text-slate-400 text-[11px]">
              emit MilestoneSubmitted()
            </div>
          </div>

          {/* Row 3A: Happy Path Approval */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-3 text-emerald-300 font-bold">
              [T3-A] Client Approves Phase
            </div>
            <div className="md:col-span-6 text-slate-200 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-lime-300">approveMilestone(id)</span>
              <span>→</span>
              <span>Moves ETH from <code className="text-white">totalReserved</code> to <code className="text-lime-300">withdrawable[freelancer]</code></span>
            </div>
            <div className="md:col-span-3 text-right text-emerald-300 text-[11px]">
              emit MilestoneApproved()
            </div>
          </div>

          {/* Row 3B: Conditional Dispute Escalation */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-3 text-amber-300 font-bold">
              [T3-B] Or: Dispute & BPS Ruling
            </div>
            <div className="md:col-span-6 text-slate-200 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">resolveDispute(id, bps)</span>
              <span>→</span>
              <span>Splits phase into <code className="text-white">withdrawable[freelancer]</code> & <code className="text-white">withdrawable[client]</code></span>
            </div>
            <div className="md:col-span-3 text-right text-amber-300 text-[11px]">
              emit DisputeResolved()
            </div>
          </div>

          {/* Row 4: Pull Withdrawal */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-lime-400/30 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-3 text-white font-bold">
              [T4] Non-Custodial Pull Payout
            </div>
            <div className="md:col-span-6 text-slate-200 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-lime-400/20 text-lime-300">withdraw() nonReentrant</span>
              <span>→</span>
              <span>Zeroes <code className="text-white">withdrawable[caller]</code> first, then transfers ETH to wallet</span>
            </div>
            <div className="md:col-span-3 text-right text-lime-300 text-[11px]">
              emit FundsWithdrawn()
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE 6-STAGE DEEP-DIVE INSPECTOR */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono text-lime-300 font-semibold">
            02. Step-by-Step Smart Contract Specification
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            6-Stage Operational & Solidity Breakdown
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Click any stage below to inspect its exact Solidity function signature, access control pre-conditions, storage mutations, and EVM event logs.
          </p>
        </div>

        {/* Interactive Stage Selector Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {steps.map((s, idx) => (
            <button
              key={s.num}
              onClick={() => setSelectedStage(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedStage === idx
                  ? 'bg-emerald-950/90 border-lime-400 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-950/70 border-white/10 text-slate-300 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-lime-300 font-bold">Stage {s.num}</span>
                <span className="text-[10px] text-slate-400">{s.tag}</span>
              </div>
              <div className="text-xs font-bold text-white line-clamp-1">{s.title}</div>
            </button>
          ))}
        </div>

        {/* Highlighted Stage Technical Detail Panel */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/85 backdrop-blur-xl border border-lime-400/35 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-950 border border-emerald-500/40 shrink-0">
                {steps[selectedStage].icon}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-lime-300">
                  <span>Stage {steps[selectedStage].num}</span>
                  <span>·</span>
                  <span>{steps[selectedStage].tag}</span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  {steps[selectedStage].title}
                </h3>
                <p className="text-xs text-slate-400">{steps[selectedStage].subtitle}</p>
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 font-mono text-xs text-emerald-300">
              {steps[selectedStage].soliditySig}
            </div>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {steps[selectedStage].desc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2">
              <span className="font-mono font-bold text-amber-300 block">
                On-Chain Pre-Conditions (require Checks)
              </span>
              <ul className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                {steps[selectedStage].preconditions.map((pre, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400">▸</span>
                    <span>{pre}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2">
              <span className="font-mono font-bold text-emerald-300 block">
                EVM State Mutations & Storage Effects
              </span>
              <ul className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                {steps[selectedStage].effects.map((eff, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{eff}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
            <span className="text-slate-400">Emitted Keccak-256 Event Log:</span>
            <span className="text-lime-300 font-semibold break-all">{steps[selectedStage].event}</span>
          </div>
        </div>

        {/* All 6 Cards Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {steps.map((step, idx) => (
            <div
              key={step.num}
              onClick={() => setSelectedStage(idx)}
              className="p-6 rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-black/60 space-y-4 hover:border-lime-400/40 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-black text-lime-400/70 tabular-nums">
                  {step.num}.
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {step.tag}
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 shrink-0">
                  {step.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    {step.subtitle}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {step.desc}
              </p>

              <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-emerald-300 truncate">
                {step.soliditySig}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FINITE STATE MACHINE (FSM) DIAGRAM & TRANSITION MATRIX */}
      <section className="p-8 rounded-3xl bg-slate-950/85 backdrop-blur-xl border border-lime-400/30 text-white shadow-2xl shadow-black/70 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-lime-300 text-xs font-semibold font-mono">
            <GitBranch className="w-4 h-4" />
            <span>03. Finite State Machine (FSM) Specification</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Deterministic 5-State Milestone Lifecycle
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
            Every milestone is governed by a strict Solidity <code className="text-lime-300">enum MilestoneStatus</code>. Backward transitions or double-releases are mathematically impossible because terminal states (<code className="text-emerald-300">Released</code> and <code className="text-amber-300">Resolved</code>) reject all further mutation calls.
          </p>
        </div>

        {/* Visual State Nodes Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-400/30 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 block">enum State = 0</span>
            <span className="text-sm font-bold text-amber-300 block">Pending</span>
            <p className="text-[11px] text-slate-300">100% ETH locked in totalReserved; awaiting work</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-400/30 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 block">enum State = 1</span>
            <span className="text-sm font-bold text-blue-300 block">Submitted</span>
            <p className="text-[11px] text-slate-300">Deliverable proof hash recorded on-chain</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-400/40 space-y-1">
            <span className="text-[11px] font-mono text-emerald-300 block">enum State = 2 (Terminal)</span>
            <span className="text-sm font-bold text-lime-300 block">Released</span>
            <p className="text-[11px] text-slate-300">Approved by Client; credited to Freelancer</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-400/40 space-y-1">
            <span className="text-[11px] font-mono text-rose-300 block">enum State = 3</span>
            <span className="text-sm font-bold text-rose-300 block">Disputed</span>
            <p className="text-[11px] text-slate-300">Frozen for neutral Arbitrator review</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/40 space-y-1">
            <span className="text-[11px] font-mono text-amber-300 block">enum State = 4 (Terminal)</span>
            <span className="text-sm font-bold text-amber-300 block">Resolved</span>
            <p className="text-[11px] text-slate-300">BPS split executed by Arbitrator</p>
          </div>
        </div>

        {/* State Transition Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/15 text-slate-400">
                <th className="py-2.5 pr-4">Current State</th>
                <th className="py-2.5 px-4">Trigger Function</th>
                <th className="py-2.5 px-4">Authorized Role</th>
                <th className="py-2.5 px-4">Next State</th>
                <th className="py-2.5 pl-4">Accounting Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              <tr>
                <td className="py-2.5 pr-4 text-amber-300">Pending (0)</td>
                <td className="py-2.5 px-4">submitMilestone(id, proof)</td>
                <td className="py-2.5 px-4 text-lime-300">onlyFreelancer</td>
                <td className="py-2.5 px-4 text-blue-300">Submitted (1)</td>
                <td className="py-2.5 pl-4 text-slate-400">Funds remain locked in totalReserved</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-blue-300">Submitted (1)</td>
                <td className="py-2.5 px-4">approveMilestone(id)</td>
                <td className="py-2.5 px-4 text-emerald-300">onlyClient</td>
                <td className="py-2.5 px-4 text-lime-300">Released (2) [Terminal]</td>
                <td className="py-2.5 pl-4 text-emerald-300">totalReserved -= amt; withdrawable[freelancer] += amt</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-blue-300">Submitted (1)</td>
                <td className="py-2.5 px-4">raiseDispute(id, reason)</td>
                <td className="py-2.5 px-4 text-emerald-300">onlyClient</td>
                <td className="py-2.5 px-4 text-rose-300">Disputed (3)</td>
                <td className="py-2.5 pl-4 text-slate-400">Funds quarantined in totalReserved pending ruling</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-rose-300">Disputed (3)</td>
                <td className="py-2.5 px-4">resolveDispute(id, bps)</td>
                <td className="py-2.5 px-4 text-amber-300">onlyArbitrator</td>
                <td className="py-2.5 px-4 text-amber-300">Resolved (4) [Terminal]</td>
                <td className="py-2.5 pl-4 text-amber-300">totalReserved -= amt; splits to withdrawable[F] & [C]</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onConnectWallet}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Connect Wallet & Test Lifecycle</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
