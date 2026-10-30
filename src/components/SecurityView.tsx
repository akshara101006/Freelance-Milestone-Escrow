import React from 'react';
import {
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Shield,
  KeyRound,
  FileCheck,
  XCircle,
  Terminal,
} from 'lucide-react';

interface SecurityViewProps {
  onConnectWallet: () => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ onConnectWallet }) => {
  const securityPillars = [
    {
      title: '01. Formal Reentrancy Defense (CEI + Mutex)',
      desc: 'All state-changing functions adhere strictly to the Checks-Effects-Interactions (CEI) design pattern and are shielded by an OpenZeppelin-standard reentrancy mutex (_status != _ENTERED).',
      icon: <Lock className="w-6 h-6 text-lime-300" />,
      status: 'Enforced On-Chain',
      code: 'withdrawable[msg.sender] = 0; (bool ok,) = msg.sender.call{value: amt}("");',
    },
    {
      title: '02. Continuous Solvency Invariant Verification',
      desc: 'Every transaction verifies that address(this).balance == totalReserved + totalWithdrawable. No fund leakage, stranded reserves, or unbacked credit creation is mathematically possible.',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      status: 'Mathematically Proven',
      code: 'require(address(this).balance == totalReserved + totalWithdrawable);',
    },
    {
      title: '03. Single-Role RBAC & Constructor Uniqueness',
      desc: 'Cryptographic modifiers (onlyClient, onlyFreelancer, onlyArbitrator) gate every operation, while constructor assertions guarantee that no wallet address can hold more than one role.',
      icon: <KeyRound className="w-6 h-6 text-lime-300" />,
      status: 'Role-Gated',
      code: 'require(client != freelancer && client != arbitrator && freelancer != arbitrator);',
    },
    {
      title: '04. Pull-Over-Push Settlement Isolation',
      desc: 'No external ETH transfers occur during milestone approval or dispute resolution. Funds are ledger-credited to individual withdrawable balances, eliminating denial-of-service (DoS) vectors.',
      icon: <Cpu className="w-6 h-6 text-emerald-400" />,
      status: 'DoS Immune',
      code: 'totalReserved -= amt; withdrawable[freelancer] += amt; // Zero external calls',
    },
  ];

  const threatMitigations = [
    {
      threat: '1. Recursive Fallback Reentrancy on Withdrawal',
      vector: 'Attacker deploys a malicious contract wallet whose receive() function recursively calls withdraw() before balance updates.',
      mitigation: 'Dual defense: nonReentrant mutex reverts any nested call with ReentrancyGuardReentrantCall(), and withdrawable[msg.sender] is set to 0 before .call{value}() executes.',
    },
    {
      threat: '2. Malicious Fallback Revert / Gas Griefing (DoS)',
      vector: 'A participant uses a smart contract wallet that unconditionally reverts on incoming ETH to block dispute resolution.',
      mitigation: 'Pull-over-push accounting ensures resolveDispute() and approveMilestone() only mutate internal storage mappings and never invoke external wallet code.',
    },
    {
      threat: '3. Client Refusal to Release / Unfunded Work',
      vector: 'Client commissions work without having funds or refuses to pay after valid milestone delivery.',
      mitigation: '100% of agreement ETH is locked in contract reserves at deployment. If the client refuses to approve valid work, the neutral arbitrator executes a binding split.',
    },
    {
      threat: '4. Arbitrator Collusion or Embezzlement',
      vector: 'Arbitrator attempts to transfer disputed escrow funds to their own wallet or an external address.',
      mitigation: 'resolveDispute() accepts only a basis-point integer (0–10,000 BPS) and hardcodes credit destinations strictly to the immutable client and freelancer addresses.',
    },
    {
      threat: '5. Sybil Role Hijacking / Self-Arbitration',
      vector: 'Client or Freelancer assigns their own wallet address as the Arbitrator to win all disputes.',
      mitigation: 'Single-Role Registry locks each wallet permanently to one role, and the contract constructor reverts if client, freelancer, or arbitrator addresses overlap.',
    },
    {
      threat: '6. Integer Division Rounding Dust Loss',
      vector: 'Odd milestone amounts divided by 10,000 BPS leave stranded wei inside the contract, breaking solvency.',
      mitigation: 'Contract calculates freelancerAward = (amount * bps) / 10000 and computes clientRefund = amount - freelancerAward, guaranteeing 100% wei conservation.',
    },
    {
      threat: '7. Double-Approval or Replay State Transition',
      vector: 'Calling approveMilestone() or resolveDispute() twice on the same milestone to drain other milestones.',
      mitigation: 'Strict Finite State Machine requires status == Submitted or Disputed and immediately transitions to terminal states (Released / Resolved).',
    },
    {
      threat: '8. Unsolicited ETH Injection Accounting Skew',
      vector: 'Sending raw ETH directly to the contract outside of deployment to distort balance checks.',
      mitigation: 'Direct receive() / fallback transfers without milestone allocation are rejected, preserving strict accounting parity.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 space-y-16 animate-in fade-in duration-200">
      {/* 1. PAGE HEADER */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-lime-300 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cryptographic Defense-in-Depth & Formal Threat Model</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Security Architecture & Formal Proofs
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Engineered with OpenZeppelin reentrancy mutexes, Checks-Effects-Interactions (CEI) ordering, pull-over-push isolation, and continuous conservation-of-value invariants.
        </p>
      </div>

      {/* 2. FOUR CORE SECURITY PILLARS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {securityPillars.map((p, idx) => (
          <div
            key={idx}
            className="p-6 sm:p-7 rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-black/60 space-y-4 hover:border-lime-400/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/30">
                  {p.icon}
                </div>
                <span className="text-xs font-mono text-lime-300 bg-slate-900 px-3 py-1 rounded-lg border border-white/10">
                  {p.status}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white">
                {p.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                {p.desc}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto">
              {p.code}
            </div>
          </div>
        ))}
      </section>

      {/* 3. SIDE-BY-SIDE REENTRANCY FLOWCHART COMPARISON (VULNERABLE VS PROTECTED) */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-950/85 backdrop-blur-xl border border-emerald-500/25 shadow-2xl space-y-6">
        <div className="space-y-1 border-b border-white/10 pb-4">
          <span className="text-xs font-mono text-lime-300 font-semibold">
            01. Attack Execution Flowchart Comparison
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Why Naive Push Contracts Fail vs. How Our Pull + CEI Architecture Neutralizes Exploits
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Vulnerable Push Contract */}
          <div className="p-5 rounded-2xl bg-rose-950/25 border border-rose-500/35 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                Naive Push Escrow (Vulnerable Pattern)
              </span>
              <span className="text-[11px] font-mono text-rose-300">EXPLOITABLE</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-slate-300">
                1. Caller invokes <code className="text-white">withdraw()</code>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200">
                2. Contract sends ETH <strong className="text-white">BEFORE</strong> zeroing balance:
                <div className="text-[11px] text-rose-300 mt-1">msg.sender.call&#123;value: bal&#125;("")</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200">
                3. Attacker <code className="text-white">receive()</code> triggers &amp; recursively calls <code className="text-white">withdraw()</code> while <code className="text-white">bal &gt; 0</code>!
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/30 text-rose-300 font-bold">
                Result: Vault Drained Before Step 4 (bal = 0) Is Reached
              </div>
            </div>
          </div>

          {/* Right: Protected Pull + CEI + Mutex Architecture */}
          <div className="p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/35 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-lime-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Our Pull-Over-Push + CEI + Mutex Vault
              </span>
              <span className="text-[11px] font-mono text-emerald-300">IMMUNE</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-slate-200">
                1. <code className="text-lime-300">nonReentrant</code> sets <code className="text-white">_status = _ENTERED</code>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200">
                2. Effects First: Zeroes storage <strong className="text-white">BEFORE</strong> interaction:
                <div className="text-[11px] text-lime-300 mt-1">withdrawable[msg.sender] = 0; totalWithdrawable -= amt;</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-slate-200">
                3. Executes external transfer <code className="text-white">msg.sender.call&#123;value: amt&#125;("")</code>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-lime-400/40 text-lime-300 font-bold">
                Result: Any Recursive Call Reverts Immediately at Gate 1 (_ENTERED) &amp; Gate 2 (0 Balance)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FORMAL CONSERVATION OF VALUE & SOLVENCY MATRIX */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-lime-400/30 shadow-2xl space-y-5 overflow-x-auto">
        <div className="space-y-1">
          <span className="text-xs font-mono text-lime-300 font-semibold">
            02. Formal Solvency Conservation Proof
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            State-by-State Balance Sheet Invariant Verification
          </h2>
          <p className="text-xs text-slate-300">
            Across every lifecycle transition of a milestone of value <code className="text-white">M</code>, the sum of <code className="text-amber-300">totalReserved</code> and <code className="text-emerald-300">totalWithdrawable</code> remains strictly equal to <code className="text-lime-300">address(this).balance</code>:
          </p>
        </div>

        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-white/15 text-slate-400">
              <th className="py-3 pr-4">Lifecycle Event</th>
              <th className="py-3 px-4">Physical Vault (balance)</th>
              <th className="py-3 px-4">Locked Reserves (totalReserved)</th>
              <th className="py-3 px-4">Pull Credits (Σ withdrawable)</th>
              <th className="py-3 pl-4 text-lime-300">Invariant Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-200">
            <tr>
              <td className="py-3 pr-4 font-bold text-white">1. Contract Deployed (+M)</td>
              <td className="py-3 px-4 text-lime-300">+M ETH</td>
              <td className="py-3 px-4 text-amber-300">+M ETH</td>
              <td className="py-3 px-4 text-slate-400">0 ETH</td>
              <td className="py-3 pl-4 text-emerald-400">M === M + 0 (Verified)</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-bold text-white">2. Deliverable Submitted</td>
              <td className="py-3 px-4 text-lime-300">M ETH (Unchanged)</td>
              <td className="py-3 px-4 text-amber-300">M ETH (Unchanged)</td>
              <td className="py-3 px-4 text-slate-400">0 ETH</td>
              <td className="py-3 pl-4 text-emerald-400">M === M + 0 (Verified)</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-bold text-white">3A. Milestone Approved</td>
              <td className="py-3 px-4 text-lime-300">M ETH (Unchanged)</td>
              <td className="py-3 px-4 text-amber-300">-M ETH (→ 0)</td>
              <td className="py-3 px-4 text-emerald-300">+M ETH (Freelancer)</td>
              <td className="py-3 pl-4 text-emerald-400">M === 0 + M (Verified)</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-bold text-white">3B. Dispute Split (F + C = M)</td>
              <td className="py-3 px-4 text-lime-300">M ETH (Unchanged)</td>
              <td className="py-3 px-4 text-amber-300">-M ETH (→ 0)</td>
              <td className="py-3 px-4 text-emerald-300">+F ETH + C ETH = +M</td>
              <td className="py-3 pl-4 text-emerald-400">M === 0 + (F+C) (Verified)</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-bold text-white">4. Pull Withdrawal (-M)</td>
              <td className="py-3 px-4 text-lime-300">-M ETH (→ 0)</td>
              <td className="py-3 px-4 text-slate-400">0 ETH</td>
              <td className="py-3 px-4 text-emerald-300">-M ETH (→ 0)</td>
              <td className="py-3 pl-4 text-emerald-400">0 === 0 + 0 (Verified)</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 5. COMPREHENSIVE 8-VECTOR THREAT MODEL MATRIX */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-black/70 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <FileCheck className="w-5 h-5 text-lime-300" />
          <div>
            <span className="text-xs font-mono text-lime-300 block">03. Exhaustive Threat Matrix</span>
            <h2 className="text-xl font-extrabold text-white">
              8 Attack Vectors & Cryptographic Countermeasures
            </h2>
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {threatMitigations.map((item, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4 space-y-1">
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{item.threat}</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                  {item.vector}
                </p>
              </div>
              <div className="lg:col-span-8 text-xs text-slate-200 flex items-start gap-2.5 bg-slate-900/70 p-3.5 rounded-2xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. BOTTOM CTA BANNER */}
      <div className="p-8 rounded-3xl bg-slate-950/85 backdrop-blur-xl border border-lime-400/30 text-white shadow-2xl shadow-black/70 text-center space-y-4">
        <h2 className="text-2xl font-bold">
          Inspect Live Smart Contract Security On-Chain
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Every escrow agreement is deployed independently on Hardhat EVM (Chain ID 31337) with full participant auditability and live JSON-RPC receipt verification.
        </p>
        <div className="pt-2">
          <button
            onClick={onConnectWallet}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Connect Wallet & Verify On-Chain</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
