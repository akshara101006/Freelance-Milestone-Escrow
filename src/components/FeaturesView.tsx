import React, { useState } from 'react';
import {
  Shield,
  Coins,
  Scale,
  Bell,
  Cpu,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  UserCheck,
  Terminal,
  Database,
  Sliders,
} from 'lucide-react';

interface FeaturesViewProps {
  onConnectWallet: () => void;
}

export const FeaturesView: React.FC<FeaturesViewProps> = ({ onConnectWallet }) => {
  const [simulatedBps, setSimulatedBps] = useState<number>(6500);
  const sampleMilestoneEth = 5.0;

  const freelancerAwardEth = ((sampleMilestoneEth * simulatedBps) / 10000).toFixed(4);
  const clientRefundEth = (sampleMilestoneEth - parseFloat(freelancerAwardEth)).toFixed(4);
  const freelancerPercent = (simulatedBps / 100).toFixed(2);
  const clientPercent = (100 - simulatedBps / 100).toFixed(2);

  const featureList = [
    {
      title: '01. Autonomous Per-Agreement Smart Contracts',
      desc: 'Each freelance agreement deploys its own isolated FreelanceMilestoneEscrow smart contract on the EVM. Funds are never pooled in a shared honeypot vault, eliminating cross-project contagion and central custodian risk.',
      icon: <Cpu className="w-6 h-6 text-lime-300" />,
      spec: 'Contract Factory & Isolated EVM Storage',
      highlights: [
        'Dedicated contract address per project',
        '100% upfront ETH deposit verified in constructor',
        'Zero platform rent-seeking or custody fees',
      ],
    },
    {
      title: '02. Strict Single-Role Identity Architecture',
      desc: 'To eliminate self-dealing and role-confusion exploits, each wallet address is permanently bound to a single role: Client, Freelancer, or Arbitrator. Multi-role overlap is rejected at both the registry and smart contract layers.',
      icon: <UserCheck className="w-6 h-6 text-emerald-400" />,
      spec: 'onlyClient · onlyFreelancer · onlyArbitrator',
      highlights: [
        'Prevents clients or freelancers from self-arbitrating',
        'Enforces client != freelancer != arbitrator in constructor',
        'Dedicated role-specific workspace views after login',
      ],
    },
    {
      title: '03. Continuous Mathematical Solvency Invariant',
      desc: 'Every state-changing transaction asserts that address(this).balance equals totalReserved plus totalWithdrawable. Any transaction that would create a solvency deficit or stranded balance reverts atomically.',
      icon: <Shield className="w-6 h-6 text-lime-300" />,
      spec: 'balance == totalReserved + Σ(withdrawable)',
      highlights: [
        'Zero unbacked liabilities or phantom credits',
        'Automatic revert on accounting discrepancy',
        'Rejects unsolicited direct ETH transfers via receive()',
      ],
    },
    {
      title: '04. Pull-Over-Push Settlement Accounting',
      desc: 'Following OpenZeppelin security standards, approval and dispute resolution never push ETH to external addresses. Instead, funds are credited to withdrawable[recipient] for independent pull withdrawal.',
      icon: <Coins className="w-6 h-6 text-emerald-400" />,
      spec: 'mapping(address => uint256) public withdrawable',
      highlights: [
        'Immunity against malicious fallback revert DoS attacks',
        'Isolates gas costs to the withdrawing party',
        'Protected by nonReentrant mutex and CEI ordering',
      ],
    },
    {
      title: '05. 10,000 Basis-Point (BPS) Dispute Engine',
      desc: 'When a milestone is contested, the designated Arbitrator can partition the locked allocation with 1 basis-point (0.01%) granularity, simultaneously crediting the Freelancer award and refunding the Client remainder.',
      icon: <Scale className="w-6 h-6 text-amber-300" />,
      spec: 'resolveDispute(uint256 id, uint256 freelancerBps)',
      highlights: [
        'Proportional settlement from 0 BPS to 10,000 BPS',
        'Subtraction remainder prevents rounding dust loss',
        'Binding single-transaction settlement in Resolution Center',
      ],
    },
    {
      title: '06. Live JSON-RPC Receipt Inspector & Event Feed',
      desc: 'Every contract deployment, milestone submission, approval, dispute, and withdrawal generates a verifiable EVM receipt with decoded ABI calldata, block header hashes, gas telemetry, and real-time notifications.',
      icon: <Bell className="w-6 h-6 text-lime-300" />,
      spec: 'eth_getTransactionReceipt · Keccak-256 Logs',
      highlights: [
        'One-click live verification against Hardhat RPC (8545)',
        'Raw JSON-RPC receipt & ABI event decoder modal',
        'Role-targeted unread notification center',
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 space-y-16 animate-in fade-in duration-200">
      {/* 1. PAGE HEADER */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-lime-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protocol Subsystems & Engineering Capabilities</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Engineered for Escrow Integrity
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Explore the six core architectural subsystems, interactive basis-point arbitration math, and role-based access control matrices that power trustless milestone settlements.
        </p>
      </div>

      {/* 2. SIX CORE SUBSYSTEM CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {featureList.map((item, idx) => (
          <div
            key={idx}
            className="p-6 sm:p-7 rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-black/60 space-y-4 hover:border-lime-400/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/30">
                  {item.icon}
                </div>
                <span className="text-[11px] font-mono text-lime-300 bg-slate-900/90 border border-white/10 px-2.5 py-1 rounded-lg">
                  {item.spec}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {item.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {item.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-1.5">
              {item.highlights.map((h, hIdx) => (
                <div key={hIdx} className="flex items-center gap-2 text-xs font-medium text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 3. INTERACTIVE 10,000 BPS ARBITRATION SIMULATOR & DIAGRAM */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-950/85 backdrop-blur-xl border border-lime-400/30 shadow-2xl shadow-black/80 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300 font-semibold">
              <Sliders className="w-4 h-4" />
              <span>Interactive Presentation Demo · Basis-Point (BPS) Split Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Simulate On-Chain Proportional Dispute Resolution
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">
            Contested Milestone Allocation: <strong className="text-lime-300">5.0000 ETH</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Drag the Basis-Point slider (<code className="text-white">0 BPS</code> to <code className="text-white">10,000 BPS</code>) to observe how <code className="text-emerald-300">resolveDispute(milestoneId, freelancerBps)</code> partitions locked milestone funds between the Freelancer and Client without losing a single wei:
            </p>

            <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Arbitrator Input (freelancerBps):</span>
                <span className="text-base font-extrabold text-lime-300 tabular-nums">
                  {simulatedBps} BPS ({freelancerPercent}%)
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={10000}
                step={25}
                value={simulatedBps}
                onChange={(e) => setSimulatedBps(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: '0 BPS (100% Client)', val: 0 },
                  { label: '2,500 BPS (25/75)', val: 2500 },
                  { label: '5,000 BPS (50/50)', val: 5000 },
                  { label: '6,500 BPS (65/35)', val: 6500 },
                  { label: '10,000 BPS (100% Freelancer)', val: 10000 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    onClick={() => setSimulatedBps(preset.val)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                      simulatedBps === preset.val
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-300 border border-white/10 hover:border-emerald-400/40'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Solidity Calculation Output Column */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/95 border border-white/15 space-y-4 font-mono text-xs">
            <div className="text-slate-400 text-[11px] border-b border-white/10 pb-2">
              Live EVM Storage Mutation Preview
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/35">
                <span className="text-[11px] text-emerald-300 block">Freelancer Pull Credit</span>
                <span className="text-lg font-extrabold text-white tabular-nums">{freelancerAwardEth} ETH</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({freelancerPercent}% · {simulatedBps} BPS)
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-400/35">
                <span className="text-[11px] text-amber-300 block">Client Refund Credit</span>
                <span className="text-lg font-extrabold text-white tabular-nums">{clientRefundEth} ETH</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({clientPercent}% · {10000 - simulatedBps} BPS)
                </span>
              </div>
            </div>

            {/* Visual Split Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-5 rounded-xl overflow-hidden flex border border-white/15 bg-slate-950">
                <div
                  style={{ width: `${simulatedBps / 100}%` }}
                  className="bg-emerald-500 transition-all duration-150 flex items-center justify-center text-[10px] font-bold text-slate-950 overflow-hidden"
                >
                  {simulatedBps >= 1500 && `${freelancerPercent}%`}
                </div>
                <div
                  style={{ width: `${100 - simulatedBps / 100}%` }}
                  className="bg-amber-400 transition-all duration-150 flex items-center justify-center text-[10px] font-bold text-slate-950 overflow-hidden"
                >
                  {10000 - simulatedBps >= 1500 && `${clientPercent}%`}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>Solvency Check: {freelancerAwardEth} + {clientRefundEth} =</span>
                <span className="text-lime-300 font-bold">5.0000 ETH (100% Conserved)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ROLE-BASED ACCESS CONTROL (RBAC) PERMISSION MATRIX */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-emerald-500/25 shadow-2xl space-y-5 overflow-x-auto">
        <div className="space-y-1">
          <span className="text-xs font-mono text-lime-300 font-semibold">
            Cryptographic Access Control Matrix
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Single-Role Permission Enforcement Table
          </h2>
          <p className="text-xs text-slate-300">
            Every external function in <code className="text-white">FreelanceMilestoneEscrow.sol</code> enforces strict caller verification against immutable role addresses initialized at deployment.
          </p>
        </div>

        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-white/15 text-slate-400">
              <th className="py-3 pr-4">Smart Contract Operation</th>
              <th className="py-3 px-4">Solidity Modifier</th>
              <th className="py-3 px-4 text-center">Client</th>
              <th className="py-3 px-4 text-center">Freelancer</th>
              <th className="py-3 pl-4 text-center">Arbitrator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-200">
            <tr>
              <td className="py-3 pr-4 font-bold text-white">Deploy & Lock 100% Escrow</td>
              <td className="py-3 px-4 text-emerald-300">constructor() payable</td>
              <td className="py-3 px-4 text-center text-lime-300 font-bold">AUTHORIZED</td>
              <td className="py-3 px-4 text-center text-slate-500">Blocked</td>
              <td className="py-3 pl-4 text-center text-slate-500">Blocked</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-bold text-white">Submit Deliverable Proof</td>
              <td className="py-3 px-4 text-emerald-300">onlyFreelancer</td>
              <td className="py-3 px-4 text-center text-slate-500">Blocked</td>
              <td className="py-3 px-4 text-center text-lime-300 font-bold">AUTHORIZED</td>
              <td className="py-3 pl-4 text-center text-slate-500">Blocked</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-bold text-white">Approve Milestone & Release</td>
              <td className="py-3 px-4 text-emerald-300">onlyClient</td>
              <td className="py-3 px-4 text-center text-lime-300 font-bold">AUTHORIZED</td>
              <td className="py-3 px-4 text-center text-slate-500">Blocked</td>
              <td className="py-3 pl-4 text-center text-slate-500">Blocked</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-bold text-white">Escalate Milestone Dispute</td>
              <td className="py-3 px-4 text-emerald-300">onlyClient</td>
              <td className="py-3 px-4 text-center text-lime-300 font-bold">AUTHORIZED</td>
              <td className="py-3 px-4 text-center text-slate-500">Blocked</td>
              <td className="py-3 pl-4 text-center text-slate-500">Blocked</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-bold text-white">Execute BPS Dispute Split</td>
              <td className="py-3 px-4 text-amber-300">onlyArbitrator</td>
              <td className="py-3 px-4 text-center text-slate-500">Blocked</td>
              <td className="py-3 px-4 text-center text-slate-500">Blocked</td>
              <td className="py-3 pl-4 text-center text-amber-300 font-bold">AUTHORIZED</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-bold text-white">Pull Credited Balance (withdraw)</td>
              <td className="py-3 px-4 text-lime-300">nonReentrant (withdrawable &gt; 0)</td>
              <td className="py-3 px-4 text-center text-emerald-300">If Refunded</td>
              <td className="py-3 px-4 text-center text-emerald-300">If Approved/Split</td>
              <td className="py-3 pl-4 text-center text-slate-500">0 Balance Always</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 5. BOTTOM CTA BANNER */}
      <div className="p-8 rounded-3xl bg-slate-950/85 backdrop-blur-xl border border-lime-400/30 shadow-2xl shadow-black/70 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">
          Ready to Experience Autonomous Milestone Escrow?
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Connect your wallet to deploy a new milestone contract as a Client, submit deliverables as a Freelancer, or mediate disputes as an Arbitrator.
        </p>
        <div className="pt-2">
          <button
            onClick={onConnectWallet}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Connect Wallet & Launch Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
