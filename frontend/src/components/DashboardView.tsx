import React, { useState } from 'react';
import { Agreement, HardhatAccount, NotificationRecord } from '../types/escrow';
import { evm } from '../services/evmEngine';
import { NotificationCenter } from './NotificationCenter';
import {
  ShieldAlert,
  Coins,
  Lock,
  PlusCircle,
  Briefcase,
  Laptop,
  AlertTriangle,
  Scale,
  ArrowDownLeft,
  CheckCircle2,
  FileCheck,
  Wallet,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface DashboardViewProps {
  agreements: Agreement[];
  activeAccount: HardhatAccount;
  viewMode?: 'dashboard' | 'projects' | 'submissions' | 'earnings';
  onSelectAgreement: (address: string) => void;
  onNavigateCreate: () => void;
  onNavigateDisputes: () => void;
  onOpenReceipt: (tx: any) => void;
  onOpenWallet: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agreements,
  activeAccount,
  viewMode = 'dashboard',
  onSelectAgreement,
  onNavigateCreate,
  onOpenReceipt,
  onOpenWallet,
}) => {
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const notifications: NotificationRecord[] = evm.getNotifications(activeAccount.address);

  // User's total withdrawable credits across all agreements
  let userWithdrawableTotal = 0;
  for (const agr of agreements) {
    const credit = evm.getWithdrawable(agr.address, activeAccount.address);
    userWithdrawableTotal += parseFloat(credit.eth);
  }

  // Active disputes count
  let activeDisputesCount = 0;
  for (const agr of agreements) {
    for (const m of agr.milestones) {
      if (m.state === 'Disputed') activeDisputesCount++;
    }
  }

  // Filter agreements by active account's dedicated single role
  const roleAgreements = agreements.filter((agr) => {
    if (activeAccount.role === 'client') {
      return agr.client.toLowerCase() === activeAccount.address.toLowerCase();
    }
    if (activeAccount.role === 'freelancer') {
      return agr.freelancer.toLowerCase() === activeAccount.address.toLowerCase();
    }
    if (activeAccount.role === 'arbitrator') {
      return agr.arbitrator.toLowerCase() === activeAccount.address.toLowerCase();
    }
    return true;
  });

  // Further filter if viewMode is submissions
  const displayedAgreements = roleAgreements.filter((agr) => {
    if (viewMode === 'submissions') {
      return agr.milestones.some((m) => m.state === 'Pending' || m.state === 'Submitted');
    }
    return true;
  });

  // Client-specific metrics
  const clientAgreementsCount = roleAgreements.length;
  const clientFundedEth = roleAgreements.reduce(
    (sum, a) => sum + (a.agreementState === 'Active' ? parseFloat(a.totalReserved) : 0),
    0
  );
  const clientPendingSubmissions = roleAgreements.reduce(
    (sum, a) => sum + a.milestones.filter((m) => m.state === 'Submitted').length,
    0
  );

  // Freelancer-specific metrics
  const freelancerPendingMilestones = roleAgreements.reduce(
    (sum, a) => sum + a.milestones.filter((m) => m.state === 'Pending' || m.state === 'Submitted').length,
    0
  );
  const freelancerCompletedMilestones = roleAgreements.reduce(
    (sum, a) => sum + a.milestones.filter((m) => m.state === 'Released').length,
    0
  );

  const handleWithdrawAll = async (agrAddress: string) => {
    try {
      setWithdrawing(true);
      setWithdrawError(null);
      const tx = await evm.withdraw(agrAddress);
      onOpenReceipt(tx);
    } catch (err: any) {
      setWithdrawError(err.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'Active':
      case 'Completed':
        return 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40';
      case 'Cancelled':
        return 'bg-rose-950/90 text-rose-300 border-rose-500/40';
      case 'Unfunded':
      default:
        return 'bg-slate-800 text-slate-300 border-white/15';
    }
  };

  return (
    <div className="space-y-6">
      {withdrawError && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-lg">
          <span className="font-semibold">{withdrawError}</span>
          <button
            onClick={() => setWithdrawError(null)}
            className="text-rose-300 hover:text-white font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Prominent Single-Role Workspace Banner */}
      <div className="rounded-2xl bg-slate-900/90 backdrop-blur-xl text-white p-6 shadow-xl border border-white/10 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl p-2 shrink-0 flex items-center justify-center border ${
                activeAccount.role === 'client'
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                  : activeAccount.role === 'freelancer'
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-600/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {activeAccount.role === 'client' && <Briefcase className="w-6 h-6" />}
              {activeAccount.role === 'freelancer' && <Laptop className="w-6 h-6" />}
              {activeAccount.role === 'arbitrator' && <Scale className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span className="font-bold text-white">{activeAccount.name}</span>
                <span>·</span>
                <span>@{activeAccount.username}</span>
                <span>·</span>
                <span className="font-bold text-lime-300">
                  Single-Role: {activeAccount.roleLabel}
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                {activeAccount.role === 'client' &&
                  (viewMode === 'projects'
                    ? 'Client: My Commissioned Projects'
                    : 'Client Escrow Dashboard')}
                {activeAccount.role === 'freelancer' &&
                  (viewMode === 'projects'
                    ? 'Freelancer: My Assigned Projects'
                    : viewMode === 'submissions'
                    ? 'Milestone Deliverable Submissions'
                    : viewMode === 'earnings'
                    ? 'Freelancer Earnings & Payouts'
                    : 'Freelancer Escrow Dashboard')}
                {activeAccount.role === 'arbitrator' && 'Arbitrator Dispute Desk'}
              </h2>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {activeAccount.role === 'client' && (
              <button
                onClick={onNavigateCreate}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs border border-emerald-400/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md shadow-emerald-950/50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            )}

            {activeAccount.role === 'freelancer' && userWithdrawableTotal > 0 && (
              <button
                onClick={onOpenWallet}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs border border-emerald-400/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md shadow-emerald-950/50"
              >
                <Coins className="w-4 h-4" />
                <span>Withdraw {userWithdrawableTotal.toFixed(2)} ETH</span>
              </button>
            )}

            <button
              onClick={onOpenWallet}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/15 font-mono font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Wallet: {activeAccount.balance} ETH</span>
            </button>
          </div>
        </div>

        {/* Informative Guidance Strip */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 text-xs leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-300">
          <div className="space-y-0.5">
            <span className="font-bold flex items-center gap-1.5 text-sm text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {activeAccount.role === 'client' && 'Client Role Permissions (Alex)'}
              {activeAccount.role === 'freelancer' && 'Freelancer Role Permissions (Stark)'}
              {activeAccount.role === 'arbitrator' && 'Arbitrator Role Permissions (Mark)'}
            </span>
            <p className="text-slate-300">
              {activeAccount.role === 'client' &&
                'Authorized to create milestone contracts, lock ETH into smart contract escrow, review submitted work proofs, and approve or dispute deliverables.'}
              {activeAccount.role === 'freelancer' &&
                'Authorized to accept escrow projects, submit deliverable proofs before deadlines, and pull approved payouts directly to your wallet.'}
              {activeAccount.role === 'arbitrator' &&
                'Impartial dispute mediator. Analyzes contested milestones and executes binding basis-point split settlements.'}
            </p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-lime-300 shrink-0">
            One Account = One Role Enforced
          </span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeAccount.role === 'client' ? (
          <>
            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Commissioned Projects</span>
                <Briefcase className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {clientAgreementsCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Active Client Escrows
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Locked in Escrow</span>
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {clientFundedEth.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">ETH</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Secured for active milestones
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Deliverables Awaiting Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {clientPendingSubmissions}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Submitted by hired freelancer
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Active Disputes</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
                {activeDisputesCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Escalated to Resolution Center
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Assigned Projects</span>
                <Laptop className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {roleAgreements.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Contracts with your address
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Withdrawable Earnings</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {userWithdrawableTotal.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">ETH</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {userWithdrawableTotal > 0 ? 'Ready for immediate pull' : 'No pending release'}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Pending Deliverables</span>
                <FileCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {freelancerPendingMilestones}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Phases in progress or review
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Completed & Approved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {freelancerCompletedMilestones}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Successful milestone payouts
              </div>
            </div>
          </>
        )}
      </div>

      {/* Prominent Earnings Card when viewMode is earnings or withdrawable > 0 */}
      {(viewMode === 'earnings' ||
        (activeAccount.role === 'freelancer' && userWithdrawableTotal > 0)) && (
        <div className="p-6 rounded-2xl bg-emerald-950/80 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-500/40">
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-lime-300">
              Direct Withdrawable Balance (Pull-Over-Push)
            </span>
            <div className="text-3xl font-extrabold font-mono text-white tabular-nums">
              {userWithdrawableTotal.toFixed(2)} ETH
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              In accordance with smart contract security best practices, funds from approved milestones are held in your dedicated withdrawable credit buffer. Pull funds safely to your wallet at any time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {roleAgreements
              .filter(
                (a) =>
                  parseFloat(evm.getWithdrawable(a.address, activeAccount.address).eth) > 0
              )
              .map((a) => (
                <button
                  key={a.address}
                  onClick={() => handleWithdrawAll(a.address)}
                  disabled={withdrawing}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-display font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <ArrowDownLeft className="w-4 h-4 text-slate-950" />
                  <span>
                    Withdraw {evm.getWithdrawable(a.address, activeAccount.address).eth} ETH
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Real-Time Notification Center Alert Feed */}
      <NotificationCenter
        notifications={notifications}
        activeAccount={activeAccount}
        onSelectAgreement={onSelectAgreement}
      />

      {/* Agreements List for Active Role */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-white">
              {activeAccount.role === 'client' && 'My Commissioned Projects'}
              {activeAccount.role === 'freelancer' &&
                (viewMode === 'submissions'
                  ? 'Projects Awaiting Deliverable Submissions'
                  : 'My Assigned Projects')}
              {activeAccount.role === 'arbitrator' && 'Assigned Escrow Agreements'}
            </h3>
            <p className="text-xs text-slate-400">
              {activeAccount.role === 'client' &&
                'Agreements created and funded by your Client account'}
              {activeAccount.role === 'freelancer' &&
                'Agreements assigned to your Freelancer account'}
              {activeAccount.role === 'arbitrator' &&
                'Escrow contracts under your arbitration guardianship'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Showing {displayedAgreements.length} project(s)</span>
          </div>
        </div>

        {displayedAgreements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="font-display font-bold text-white text-base">
              No agreements found for this single-role view
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {activeAccount.role === 'client' &&
                'You have not created any escrow projects yet. Click "Create Project" above to launch a milestone contract.'}
              {activeAccount.role === 'freelancer' &&
                'No contracts currently assign this account as Freelancer. To commission work as Client, switch to the Client account (Alex) in the top menu.'}
              {activeAccount.role === 'arbitrator' &&
                'No dispute cases currently assigned to your address.'}
            </p>
            {activeAccount.role === 'client' && (
              <button
                onClick={onNavigateCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Project
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {displayedAgreements.map((agr) => {
              const releasedCount = agr.milestones.filter((m) => m.state === 'Released').length;
              const disputedCount = agr.milestones.filter((m) => m.state === 'Disputed').length;
              const pendingCount = agr.milestones.filter((m) => m.state === 'Pending').length;
              const submittedCount = agr.milestones.filter((m) => m.state === 'Submitted').length;

              const userCredit = evm.getWithdrawable(agr.address, activeAccount.address);
              const hasWithdrawable = parseFloat(userCredit.eth) > 0;

              return (
                <div
                  key={agr.address}
                  className="p-6 hover:bg-slate-800/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4
                        className="font-display text-base font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors"
                        onClick={() => onSelectAgreement(agr.address)}
                      >
                        {agr.title}
                      </h4>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded border uppercase font-mono font-bold ${getStatusBadge(
                          agr.agreementState
                        )}`}
                      >
                        {agr.agreementState}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        · {activeAccount.roleLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 font-mono">
                      <span>
                        Contract:{' '}
                        <strong className="text-slate-200 select-all">
                          {agr.address.substring(0, 10)}...{agr.address.substring(34)}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Client:{' '}
                        <strong className="text-slate-200">
                          {agr.client.substring(0, 6)}...{agr.client.substring(38)}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Freelancer:{' '}
                        <strong className="text-slate-200">
                          {agr.freelancer.substring(0, 6)}...{agr.freelancer.substring(38)}
                        </strong>
                      </span>
                    </div>

                    {/* Unboxed Clean Metadata Summary */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-slate-300">
                      <span>Milestones ({agr.milestones.length}):</span>
                      {releasedCount > 0 && (
                        <span className="text-emerald-400 font-bold">
                          {releasedCount} Released
                        </span>
                      )}
                      {submittedCount > 0 && (
                        <>
                          {releasedCount > 0 && <span>·</span>}
                          <span className="text-lime-300 font-semibold">
                            {submittedCount} Submitted
                          </span>
                        </>
                      )}
                      {pendingCount > 0 && (
                        <>
                          {(releasedCount > 0 || submittedCount > 0) && <span>·</span>}
                          <span className="text-slate-300">{pendingCount} Pending</span>
                        </>
                      )}
                      {disputedCount > 0 && (
                        <>
                          {(releasedCount > 0 || submittedCount > 0 || pendingCount > 0) && (
                            <span>·</span>
                          )}
                          <span className="text-rose-400 font-bold">
                            {disputedCount} Disputed
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial & Action Column */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0">
                    <div className="text-left lg:text-right">
                      <div className="text-lg font-bold font-mono text-white tabular-nums">
                        {agr.totalRequired} ETH
                      </div>
                      <div className="text-xs text-slate-400 font-mono tabular-nums">
                        Reserved: {agr.totalReserved} ETH
                      </div>
                      {hasWithdrawable && (
                        <div className="text-xs text-emerald-400 font-mono font-bold mt-0.5 tabular-nums">
                          Withdrawable: {userCredit.eth} ETH
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {hasWithdrawable && (
                        <button
                          onClick={() => handleWithdrawAll(agr.address)}
                          disabled={withdrawing}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          Withdraw {userCredit.eth} ETH
                        </button>
                      )}
                      <button
                        onClick={() => onSelectAgreement(agr.address)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/15 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Open Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
