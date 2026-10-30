import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Layers,
  ChevronDown,
  FileText,
  Lock,
  Send,
  CheckCircle2,
  Coins,
  Scale,
  Cpu,
  UserCheck,
  Shield,
  Terminal,
  GitBranch,
  Database,
  KeyRound,
  AlertTriangle,
  Wallet,
  Check,
  X,
} from 'lucide-react';

interface LandingPageViewProps {
  onConnectWallet: () => void;
  onNavigateHowItWorks: () => void;
  onNavigateFeatures: () => void;
  onNavigateSecurity: () => void;
  onNavigateDisputes: () => void;
  onNavigateActivity: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onConnectWallet,
  onNavigateHowItWorks,
  onNavigateFeatures,
  onNavigateSecurity,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeFlowPath, setActiveFlowPath] = useState<'happy' | 'dispute'>('happy');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-20 sm:space-y-28 py-6 sm:py-10">
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 pt-4 sm:pt-8 max-w-5xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-lime-300 tracking-wide">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Decentralized Milestone Escrow Protocol · Ethereum & Hardhat EVM (Chain 31337)</span>
        </div>

        <div className="space-y-5">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-md">
            Trustless Milestone Escrow Engineered for Modern Freelancing
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Eliminate counterparty risk, payment delays, and platform custody fees. Lock 100% of project funds in isolated smart contract vaults before work begins, verify deliverables phase-by-phase, and settle payouts via non-custodial pull accounting.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.02] cursor-pointer whitespace-nowrap"
            >
              <span>Launch Protocol Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateHowItWorks}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-white/15 font-semibold text-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Explore Full Architecture</span>
            </button>
          </div>

          {/* Executive Protocol Metrics Bar */}
          <div className="pt-8 mt-8 rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-emerald-500/25 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left shadow-2xl shadow-black/70">
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-white/10">
              <span className="text-xs text-slate-400 block">Escrow Solvency Guarantee</span>
              <span className="text-lg font-extrabold text-lime-300 font-mono tabular-nums">100% Upfront Lock</span>
              <span className="text-[11px] text-slate-300 block mt-1">
                Verified on-chain via constructor <code className="text-emerald-300">msg.value</code> before Phase 1 starts
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-white/10">
              <span className="text-xs text-slate-400 block">Release Granularity</span>
              <span className="text-lg font-extrabold text-white font-mono tabular-nums">Phase-by-Phase</span>
              <span className="text-[11px] text-slate-300 block mt-1">
                Each milestone transitions independently through a 5-state finite machine
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-white/10">
              <span className="text-xs text-slate-400 block">Dispute Settlement Precision</span>
              <span className="text-lg font-extrabold text-emerald-300 font-mono tabular-nums">10,000 BPS (0.01%)</span>
              <span className="text-[11px] text-slate-300 block mt-1">
                Proportional basis-point split between Freelancer and Client on conflict
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-white/10">
              <span className="text-xs text-slate-400 block">Identity & Access Model</span>
              <span className="text-lg font-extrabold text-amber-300 font-mono tabular-nums">Single-Role RBAC</span>
              <span className="text-[11px] text-slate-300 block mt-1">
                Permanent 1-to-1 wallet binding prevents self-dealing and role spoofing
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HIGH-LEVEL SYSTEM ARCHITECTURE BLUEPRINT DIAGRAM */}
      <section className="space-y-8 max-w-6xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-mono tracking-wider text-lime-300 font-semibold">
            01. System Topology & Smart Contract Blueprint
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            End-to-End Protocol Architecture
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            A three-tier decentralized architecture connecting role-isolated cryptographic wallets through an EIP-1193 JSON-RPC signing layer directly to autonomous Solidity escrow vaults.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-emerald-500/25 shadow-2xl shadow-black/80 space-y-6">
          {/* Tier 1: Cryptographic Actor Layer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-lime-300 font-mono">
                Tier 1 · Role-Isolated Cryptographic Participants (Permanent 1:1 Wallet Binding)
              </span>
              <span className="text-xs text-slate-400 font-mono">EIP-1193 / ECDSA secp256k1 Signers</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    Client Signer
                  </span>
                  <span className="text-[11px] font-mono text-emerald-300">onlyClient</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Deploys the escrow contract with 100% upfront ETH deposit, audits submitted deliverables, approves milestone releases, or escalates disputes.
                </p>
                <div className="pt-1 text-[11px] font-mono text-slate-400">
                  Permissions: <span className="text-slate-200">deploy() · approveMilestone() · raiseDispute() · withdraw()</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-lime-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-lime-300" />
                    Freelancer Signer
                  </span>
                  <span className="text-[11px] font-mono text-lime-300">onlyFreelancer</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Verifies upfront escrow lock before starting work, delivers milestone proofs on-chain, and pulls released earnings from the credit ledger.
                </p>
                <div className="pt-1 text-[11px] font-mono text-slate-400">
                  Permissions: <span className="text-slate-200">submitMilestone() · withdraw()</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-300" />
                    Arbitrator Signer
                  </span>
                  <span className="text-[11px] font-mono text-amber-300">onlyArbitrator</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Neutral third-party mediator invoked strictly when a milestone enters the <code className="text-amber-200">Disputed</code> state. Executes binding basis-point splits.
                </p>
                <div className="pt-1 text-[11px] font-mono text-slate-400">
                  Permissions: <span className="text-slate-200">resolveDispute(id, freelancerBps)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual SVG Connector Arrows */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="grid grid-cols-3 w-full max-w-3xl text-center text-[11px] font-mono text-emerald-400">
              <div>↓ Signed Tx (msg.value)</div>
              <div>↓ Signed Deliverable Proof</div>
              <div>↓ Signed BPS Ruling</div>
            </div>
            <svg className="w-full max-w-3xl h-8 text-emerald-500/50" viewBox="0 0 600 32" fill="none">
              <path d="M100 0 V16 H300 V32" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M300 0 V32" stroke="currentColor" strokeWidth="2" />
              <path d="M500 0 V16 H300 V32" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx="300" cy="16" r="4" fill="#10b981" />
            </svg>
          </div>

          {/* Tier 2: Web3 Transport & ABI Encoding Layer */}
          <div className="p-4 rounded-2xl bg-slate-900/95 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono text-lime-300 block">Tier 2 · Web3 JSON-RPC & ABI Verification Layer</span>
                <h4 className="text-sm font-bold text-white">
                  Ethers.js v6 Interface · Hardhat EVM RPC (127.0.0.1:8545 · Chain ID 31337)
                </h4>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300">
              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10">eth_sendTransaction</span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10">eth_getTransactionReceipt</span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10">Keccak-256 Event Logs</span>
            </div>
          </div>

          {/* Visual Connector Down to Tier 3 */}
          <div className="flex flex-col items-center justify-center py-1">
            <span className="text-[11px] font-mono text-lime-300">↓ EVM Bytecode Execution & State Transition</span>
            <svg className="w-6 h-6 text-lime-400" viewBox="0 0 24 24" fill="none">
              <path d="M12 4v16m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Tier 3: Smart Contract Core Subsystems */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900/95 to-slate-950 border border-lime-400/35 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-mono text-lime-300 font-bold">
                  Tier 3 · Autonomous Smart Contract Instance (FreelanceMilestoneEscrow.sol)
                </span>
                <h3 className="text-base font-extrabold text-white">
                  Isolated Per-Agreement Vault & Deterministic State Engine
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-lg">
                Solidity ^0.8.24 · Non-Custodial
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-white/10 space-y-1.5">
                <div className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>1. Reserve Vault</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Quarantines active milestone allocations in <code className="text-white">totalReserved</code> until client approval or arbitration.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-white/10 space-y-1.5">
                <div className="font-mono font-bold text-lime-300 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>2. State Machine</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Enforces strict one-way transitions (<code className="text-white">Pending → Submitted → Released / Disputed → Resolved</code>).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-white/10 space-y-1.5">
                <div className="font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  <span>3. Pull-Credit Ledger</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Credits approved payouts to <code className="text-white">withdrawable[addr]</code> instead of pushing ETH during state updates.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-white/10 space-y-1.5">
                <div className="font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>4. Invariant Guard</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Verifies <code className="text-white">balance == totalReserved + Σ(withdrawable)</code> + CEI reentrancy lock on every call.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BRIEF OF PAGE 1: HOW IT WORKS (LIFECYCLE & INTERACTIVE FLOWCHART) */}
      <section className="space-y-8 max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono tracking-wider text-lime-300 font-semibold">
              02. Comprehensive Brief · How It Works
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              6-Stage Autonomous Escrow Lifecycle & Execution Flowchart
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every project follows a deterministic 6-stage pipeline from initial contract commissioning to final wallet withdrawal, supporting both direct approval and impartial dispute resolution.
            </p>
          </div>
          <button
            onClick={onNavigateHowItWorks}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-lime-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Open Dedicated "How It Works" Page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Flowchart Selector (Happy Path vs Dispute Path) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-emerald-500/25 shadow-2xl shadow-black/75 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Interactive Protocol Execution Flowchart
              </h3>
              <p className="text-xs text-slate-400">
                Toggle between the standard Milestone Approval Path and the Arbitrated Dispute Settlement Path
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10">
              <button
                onClick={() => setActiveFlowPath('happy')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFlowPath === 'happy'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Standard Approval Path
              </button>
              <button
                onClick={() => setActiveFlowPath('dispute')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFlowPath === 'dispute'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Dispute & Arbitration Path
              </button>
            </div>
          </div>

          {/* Visual Flowchart Diagram */}
          {activeFlowPath === 'happy' ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
              {[
                {
                  stage: 'Step 1',
                  title: 'Deploy & Lock 100%',
                  actor: 'Client',
                  code: 'constructor() payable',
                  state: 'State: Pending',
                  desc: 'Client defines milestones and locks 100% of total ETH in contract reserves.',
                  color: 'border-emerald-500/35 bg-emerald-950/30',
                },
                {
                  stage: 'Step 2',
                  title: 'Verify Reserve Lock',
                  actor: 'Freelancer',
                  code: 'totalReserved == Σ(m)',
                  state: 'Solvency Verified',
                  desc: 'Freelancer confirms on-chain that full project funds are locked before starting work.',
                  color: 'border-white/15 bg-slate-900/80',
                },
                {
                  stage: 'Step 3',
                  title: 'Submit Deliverable',
                  actor: 'Freelancer',
                  code: 'submitMilestone(id, cid)',
                  state: 'State: Submitted',
                  desc: 'Freelancer commits deliverable proof hash/URL and notes to the blockchain.',
                  color: 'border-blue-400/35 bg-blue-950/30',
                },
                {
                  stage: 'Step 4',
                  title: 'Approve & Credit',
                  actor: 'Client',
                  code: 'approveMilestone(id)',
                  state: 'State: Released',
                  desc: 'Client approves work; contract moves ETH from totalReserved to withdrawable[freelancer].',
                  color: 'border-lime-400/40 bg-emerald-950/40',
                },
                {
                  stage: 'Step 5',
                  title: 'Pull Withdrawal',
                  actor: 'Freelancer',
                  code: 'withdraw() nonReentrant',
                  state: 'ETH Transferred',
                  desc: 'Freelancer zeroes credit buffer and pulls ETH directly to personal wallet.',
                  color: 'border-emerald-400/50 bg-emerald-900/30',
                },
              ].map((node, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${node.color} flex flex-col justify-between space-y-3 relative`}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-lime-300 font-bold">{node.stage}</span>
                      <span className="text-slate-400">{node.actor}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{node.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{node.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <div className="text-[10px] font-mono text-emerald-300 truncate">{node.code}</div>
                    <div className="text-[10px] font-mono text-slate-400">{node.state}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
              {[
                {
                  stage: 'Step 1',
                  title: 'Deliverable Submitted',
                  actor: 'Freelancer',
                  code: 'submitMilestone(id, proof)',
                  state: 'State: Submitted',
                  desc: 'Freelancer uploads deliverable proof and marks milestone ready for client review.',
                  color: 'border-blue-400/35 bg-blue-950/30',
                },
                {
                  stage: 'Step 2',
                  title: 'Client Escalates Dispute',
                  actor: 'Client',
                  code: 'raiseDispute(id, reason)',
                  state: 'State: Disputed',
                  desc: 'Client contests deliverable quality/scope; milestone funds remain frozen in totalReserved.',
                  color: 'border-rose-500/40 bg-rose-950/30',
                },
                {
                  stage: 'Step 3',
                  title: 'Arbitrator Audits Proof',
                  actor: 'Arbitrator',
                  code: 'Resolution Center Review',
                  state: 'Evidence Inspection',
                  desc: 'Neutral arbitrator inspects original milestone specs, deliverable proof, and dispute logs.',
                  color: 'border-amber-400/40 bg-amber-950/30',
                },
                {
                  stage: 'Step 4',
                  title: 'Basis-Point Split (BPS)',
                  actor: 'Arbitrator',
                  code: 'resolveDispute(id, bps)',
                  state: 'State: Resolved',
                  desc: 'Arbitrator sets 0–10,000 BPS split, crediting Freelancer share & Client refund simultaneously.',
                  color: 'border-amber-400/50 bg-amber-900/30',
                },
                {
                  stage: 'Step 5',
                  title: 'Dual Pull Settlement',
                  actor: 'Client & Freelancer',
                  code: 'withdraw() nonReentrant',
                  state: 'Independent Payouts',
                  desc: 'Both parties independently pull their respective awarded ETH from withdrawable balances.',
                  color: 'border-emerald-400/50 bg-emerald-900/30',
                },
              ].map((node, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${node.color} flex flex-col justify-between space-y-3`}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-amber-300 font-bold">{node.stage}</span>
                      <span className="text-slate-400">{node.actor}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{node.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{node.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <div className="text-[10px] font-mono text-amber-300 truncate">{node.code}</div>
                    <div className="text-[10px] font-mono text-slate-400">{node.state}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detailed 6-Card Breakdown of How It Works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {[
              {
                num: '01',
                title: 'Agreement Commissioning',
                icon: <FileText className="w-5 h-5 text-lime-300" />,
                desc: 'Client defines project scope, milestone titles, ETH allocations, deadlines, and designates the Freelancer and Arbitrator wallet addresses.',
              },
              {
                num: '02',
                title: '100% Upfront Escrow Lockup',
                icon: <Lock className="w-5 h-5 text-amber-300" />,
                desc: 'Full agreement value is deposited during contract deployment. The constructor reverts if msg.value does not match the exact sum of all milestones.',
              },
              {
                num: '03',
                title: 'On-Chain Deliverable Proofs',
                icon: <Send className="w-5 h-5 text-emerald-400" />,
                desc: 'Freelancers submit cryptographic proof hashes, repository links, and delivery notes directly on-chain, transitioning the milestone to Submitted.',
              },
              {
                num: '04',
                title: 'Phase-by-Phase Client Approval',
                icon: <CheckCircle2 className="w-5 h-5 text-lime-300" />,
                desc: 'Client verifies each submitted milestone and executes approveMilestone(), releasing that specific allocation without unlocking future phases.',
              },
              {
                num: '05',
                title: 'Non-Custodial Pull Withdrawals',
                icon: <Coins className="w-5 h-5 text-emerald-300" />,
                desc: 'Approved funds accumulate in withdrawable[address]. Recipients call withdraw() at their convenience, isolating external transfer risks.',
              },
              {
                num: '06',
                title: 'Basis-Point Dispute Mediation',
                icon: <Scale className="w-5 h-5 text-amber-400" />,
                desc: 'Contested milestones route to the Resolution Center where the Arbitrator apportions funds with 1 basis-point (0.01%) mathematical precision.',
              },
            ].map((step) => (
              <div key={step.num} className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30">
                    {step.icon}
                  </div>
                  <span className="font-mono text-lg font-extrabold text-lime-300/70 tabular-nums">{step.num}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{step.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BRIEF OF PAGE 2: FEATURES & CAPABILITIES (DEEP DIVE + COMPARISON) */}
      <section className="space-y-8 max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono tracking-wider text-emerald-400 font-semibold">
              03. Comprehensive Brief · Features & Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Enterprise Smart Contract Capabilities & Protocol Mechanics
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Engineered to solve the core failure modes of traditional freelance marketplaces through isolated smart contracts, basis-point math, and live RPC verification.
            </p>
          </div>
          <button
            onClick={onNavigateFeatures}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Open Dedicated "Features" Page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Grid + Basis Point Visual Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7 Cols: Core Capabilities */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Isolated Per-Agreement Vaults',
                icon: <Cpu className="w-5 h-5 text-lime-300" />,
                desc: 'Every agreement deploys its own dedicated FreelanceMilestoneEscrow contract instance—no pooled honeypot risk or cross-agreement contagion.',
                spec: 'Independent EVM Storage & Balance',
              },
              {
                title: 'Permanent Single-Role Registry',
                icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
                desc: 'Wallets are permanently bound to Client, Freelancer, or Arbitrator. The protocol rejects any agreement where two roles share an address.',
                spec: 'client != freelancer != arbitrator',
              },
              {
                title: 'Pull-Over-Push Settlement',
                icon: <Coins className="w-5 h-5 text-lime-300" />,
                desc: 'Approval and arbitration never execute external ETH calls. They update internal ledger mappings, neutralizing gas griefing and fallback reverts.',
                spec: 'withdrawable[user] += amount',
              },
              {
                title: 'Live RPC Receipt Inspector',
                icon: <Terminal className="w-5 h-5 text-emerald-400" />,
                desc: 'Built-in blockchain explorer queries eth_getTransactionReceipt live on Hardhat RPC, decoding ABI calldata, gas usage, and Keccak-256 event logs.',
                spec: 'Real-Time On-Chain Audit',
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-emerald-500/20 shadow-xl flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 w-fit">
                    {feat.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-lime-300">
                  {feat.spec}
                </div>
              </div>
            ))}
          </div>

          {/* Right 5 Cols: Basis-Point Arbitration Mathematical Diagram */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-950/85 backdrop-blur-xl border border-lime-400/30 shadow-2xl flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-mono text-amber-300 font-semibold">
                Mathematical Settlement Diagram
              </span>
              <h3 className="text-lg font-extrabold text-white">
                10,000 Basis-Point (BPS) Dispute Engine
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Instead of binary all-or-nothing rulings, the arbitrator can split any disputed milestone down to <span className="text-white font-semibold">0.01% (1 BPS)</span> precision with zero remainder loss:
              </p>
            </div>

            {/* Visual Formula Box */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3 font-mono text-xs">
              <div className="text-slate-400 text-[11px]">Example: 2.00 ETH Milestone · Ruling = 6,500 BPS (65%)</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-emerald-300">
                  <span>freelancerAward = (2.00 × 6500) / 10000</span>
                  <span className="font-bold">1.3000 ETH</span>
                </div>
                <div className="flex items-center justify-between text-amber-300">
                  <span>clientRefund = 2.00 - 1.3000</span>
                  <span className="font-bold">0.7000 ETH</span>
                </div>
              </div>
              {/* Proportional Bar Diagram */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-4 rounded-lg overflow-hidden flex border border-white/15">
                  <div className="w-[65%] bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                    65% Freelancer (6,500 BPS)
                  </div>
                  <div className="w-[35%] bg-amber-400 flex items-center justify-center text-[10px] font-bold text-slate-950">
                    35% Client
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Credited to withdrawable[freelancer]</span>
                  <span>Credited to withdrawable[client]</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/25 text-xs text-slate-200 space-y-1">
              <div className="font-bold text-lime-300">Zero Dust / Zero Stranded Wei Guarantee</div>
              <p className="text-[11px] text-slate-300">
                By computing <code className="text-white">clientRefund = milestone.amount - freelancerAward</code>, integer division remainder is always preserved to the exact wei.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Matrix: Traditional Freelance Platforms vs Trustless Milestone Escrow */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-white/15 shadow-2xl space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              Architectural Comparison: Centralized Platforms vs. Autonomous Milestone Escrow
            </h3>
            <span className="text-xs font-mono text-slate-400">Presentation Benchmark</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/15 text-slate-400 font-mono">
                <th className="py-3 pr-4">Architectural Dimension</th>
                <th className="py-3 px-4">Traditional Web2 Platforms</th>
                <th className="py-3 px-4">Simple Direct Crypto Transfers</th>
                <th className="py-3 pl-4 text-lime-300">Our Milestone Escrow Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Fund Custody & Solvency</td>
                <td className="py-3 px-4 text-slate-400">Opaque corporate bank accounts</td>
                <td className="py-3 px-4 text-slate-400">No escrow; 100% counterparty risk</td>
                <td className="py-3 pl-4 text-emerald-300 font-semibold">100% locked in isolated smart contract vault</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Platform Middleman Fees</td>
                <td className="py-3 px-4 text-rose-300">10% – 20% commission per milestone</td>
                <td className="py-3 px-4 text-slate-400">Network gas only (no protection)</td>
                <td className="py-3 pl-4 text-emerald-300 font-semibold">0% platform fee · Direct EVM execution</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Payout Settlement Speed</td>
                <td className="py-3 px-4 text-slate-400">7 to 14 business days clearing delay</td>
                <td className="py-3 px-4 text-slate-400">Manual; relies on client goodwill</td>
                <td className="py-3 pl-4 text-emerald-300 font-semibold">Instant on-chain credit & pull withdrawal</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Dispute Granularity</td>
                <td className="py-3 px-4 text-slate-400">Slow manual support tickets</td>
                <td className="py-3 px-4 text-rose-300">Irreversible; zero recourse</td>
                <td className="py-3 pl-4 text-emerald-300 font-semibold">10,000 BPS (0.01%) on-chain arbitration</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. BRIEF OF PAGE 3: SECURITY ARCHITECTURE (CEI DIAGRAM, INVARIANT PROOF & THREAT MODEL) */}
      <section className="space-y-8 max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono tracking-wider text-lime-300 font-semibold">
              04. Comprehensive Brief · Security Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Cryptographic Defense-in-Depth & Formal Solvency Proofs
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every transaction is guarded by OpenZeppelin-standard reentrancy mutexes, Checks-Effects-Interactions (CEI) execution ordering, and continuous conservation-of-value assertions.
            </p>
          </div>
          <button
            onClick={onNavigateSecurity}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-lime-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Open Dedicated "Security" Page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Solvency Equation Proof Diagram + CEI Pipeline Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Diagram A: Conservation of Value & Solvency Invariant */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-emerald-500/25 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-lime-300 font-semibold">
                Formal Accounting Invariant
              </span>
              <span className="text-xs font-mono text-emerald-400">_verifySolvencyInvariant()</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Mathematical Conservation of Value
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              At the conclusion of every state-mutating call, the smart contract asserts that its physical EVM Ether balance equals the exact sum of unapproved milestone reserves plus unpaid withdrawable credits:
            </p>

            {/* Visual Equation Schematic */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 font-mono text-center space-y-3">
              <div className="text-xs text-slate-400">On-Chain Solvency Identity</div>
              <div className="text-sm sm:text-base font-extrabold text-white py-2 px-3 rounded-xl bg-slate-950 border border-white/10">
                <span className="text-lime-300">address(this).balance</span>
                <span className="text-slate-400 mx-2">===</span>
                <span className="text-amber-300">totalReserved</span>
                <span className="text-slate-400 mx-2">+</span>
                <span className="text-emerald-400">Σ withdrawable[u]</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-left pt-1">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-white/10">
                  <span className="text-lime-300 font-bold block">Physical Vault</span>
                  <span className="text-slate-400">Real ETH held by contract address</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-white/10">
                  <span className="text-amber-300 font-bold block">Locked Reserves</span>
                  <span className="text-slate-400">Pending, Submitted & Disputed phases</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-white/10">
                  <span className="text-emerald-400 font-bold block">Pull Credits</span>
                  <span className="text-slate-400">Approved & Resolved user balances</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Prevents unauthorized minting, double-releases, or underfunded milestones.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Direct unsolicited ETH transfers (<code className="text-white">receive()</code>) are rejected to preserve accounting purity.</span>
              </div>
            </div>
          </div>

          {/* Diagram B: Checks-Effects-Interactions (CEI) Reentrancy Shield */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-emerald-500/25 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-lime-300 font-semibold">
                Reentrancy Defense Pipeline
              </span>
              <span className="text-xs font-mono text-emerald-400">nonReentrant + CEI Pattern</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Checks-Effects-Interactions Execution Gate
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When a participant invokes <code className="text-white">withdraw()</code>, the contract executes a strict 4-stage pipeline that renders recursive fallback calls mathematically inert:
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-lime-300 font-bold">Gate 1 · Mutex Lock (nonReentrant)</span>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Verifies <code className="text-white">_status != _ENTERED</code> and immediately locks mutex before execution.
                  </p>
                </div>
                <Lock className="w-4 h-4 text-lime-300 shrink-0" />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">Gate 2 · Checks (Prerequisite Validation)</span>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Reads <code className="text-white">uint256 amount = withdrawable[msg.sender]</code> and requires <code className="text-white">amount &gt; 0</code>.
                  </p>
                </div>
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold">Gate 3 · Effects (Zero Out Internal State First)</span>
                  <p className="text-[11px] text-emerald-200 font-sans">
                    Sets <code className="text-white">withdrawable[msg.sender] = 0</code> and decrements <code className="text-white">totalWithdrawable</code> BEFORE any external call.
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-amber-300 font-bold">Gate 4 · Interaction & Invariant Release</span>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Executes <code className="text-white">msg.sender.call&#123;value: amount&#125;("")</code>, verifies solvency, and unlocks mutex.
                  </p>
                </div>
                <KeyRound className="w-4 h-4 text-amber-300 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Threat Vector Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              threat: 'Recursive Reentrancy Attack',
              defense: 'Blocked by _status mutex + pre-transfer zeroing of withdrawable[msg.sender].',
            },
            {
              threat: 'Malicious Fallback Gas DoS',
              defense: 'Neutralized by Pull-Over-Push accounting; approvals never invoke external wallets.',
            },
            {
              threat: 'Self-Arbitration Collusion',
              defense: 'Prevented by Single-Role Registry & constructor address uniqueness checks.',
            },
            {
              threat: 'Arbitrator Fund Embezzlement',
              defense: 'Impossible; resolveDispute() can only route funds between Client and Freelancer.',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950/75 border border-white/12 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{item.threat}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.defense}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. DEDICATED PAGES DISCOVERY HUB */}
      <section className="space-y-6 max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono tracking-wider text-lime-300 font-semibold">
            05. Deep-Dive Presentation Modules
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Open Full-Screen Technical Documentation Pages
          </h2>
          <p className="text-sm text-slate-300">
            Jump directly into any of the three dedicated specification pages for swimlane sequence diagrams, interactive BPS simulators, and threat matrices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={onNavigateHowItWorks}
            className="group p-7 rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-emerald-500/25 shadow-2xl shadow-black/60 space-y-4 hover:border-lime-400/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-lime-300 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-lime-300 transition-colors">
                How It Works · Full Specification
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Includes multi-lane UML sequence diagrams, 5-state finite state machine transition tables, and step-by-step EVM custody flowcharts.
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-lime-300">
              <span>Open How It Works</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={onNavigateFeatures}
            className="group p-7 rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-emerald-500/25 shadow-2xl shadow-black/60 space-y-4 hover:border-emerald-400/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Features · Interactive Capabilities
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Includes an interactive 10,000 BPS dispute split simulator, Role-Based Access Control (RBAC) matrix, and subsystem architecture cards.
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Open Features & Simulator</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={onNavigateSecurity}
            className="group p-7 rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-emerald-500/25 shadow-2xl shadow-black/60 space-y-4 hover:border-lime-400/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-lime-300 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-lime-300 transition-colors">
                Security · Formal Proofs & Threat Matrix
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Includes side-by-side Vulnerable Push vs. Protected Pull-CEI attack flowcharts, solvency conservation proofs, and 8-vector threat analysis.
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-lime-300">
              <span>Open Security Architecture</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="space-y-6 max-w-4xl mx-auto px-4">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono tracking-wider text-lime-300 font-semibold">
            06. Protocol Q&A
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Frequently Asked Technical Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'How does the single-role architecture work?',
              a: 'Under the decentralized protocol, each wallet account is permanently bound to exactly one role (Client, Freelancer, or Arbitrator). Both the application registry and the smart contract constructor enforce that client != freelancer, client != arbitrator, and freelancer != arbitrator, preventing self-arbitration and role-confusion exploits.',
            },
            {
              q: 'How does escrow protect the freelancer before starting work?',
              a: 'During contract deployment, the constructor requires msg.value to equal the exact sum of all milestone allocations. Funds are locked inside totalReserved on-chain before Phase 1 begins, guaranteeing the client has 100% liquidity committed.',
            },
            {
              q: 'Why does the smart contract use Pull-Over-Push payments instead of sending ETH directly on approval?',
              a: 'If approveMilestone() or resolveDispute() pushed ETH directly to a recipient address, a malicious contract wallet could revert in its receive() fallback or consume all gas, permanently freezing the escrow state machine. By crediting withdrawable[recipient] and letting users call withdraw(), state transitions never fail due to external wallet behavior.',
            },
            {
              q: 'How does basis-point (BPS) arbitration prevent rounding errors?',
              a: 'The arbitrator specifies a split between 0 and 10,000 BPS (where 100 BPS = 1%). The smart contract calculates freelancerAward = (milestoneAmount * freelancerBps) / 10000 and sets clientRefund = milestoneAmount - freelancerAward. Because clientRefund is computed by subtraction, the sum always equals 100% of the milestone down to the exact wei.',
            },
            {
              q: 'How can participants verify that transactions are genuinely mined on the Hardhat blockchain?',
              a: 'Every state action returns a cryptographic transaction receipt containing the Keccak-256 transaction hash, block number, gas used, and decoded event logs. Clicking any receipt opens the Live RPC Verifier, which queries eth_getTransactionReceipt directly against http://127.0.0.1:8545.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-950/75 backdrop-blur-xl border border-white/12 overflow-hidden shadow-lg hover:border-emerald-500/35 transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-semibold text-slate-100 text-sm hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                    openFaq === idx ? 'rotate-180 text-lime-300' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-950/90 to-emerald-900/80 backdrop-blur-xl border border-lime-400/30 text-white text-center space-y-6 shadow-2xl shadow-black/70">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Launch the Live Escrow Demo?
            </h2>
            <p className="text-slate-300 text-sm">
              Connect a Client, Freelancer, or Arbitrator wallet on Hardhat Network (Chain ID 31337) to deploy milestone contracts, submit deliverables, and inspect real-time EVM receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-lime-400/20 hover:scale-[1.02] cursor-pointer whitespace-nowrap"
            >
              <span>Connect Wallet & Start Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
