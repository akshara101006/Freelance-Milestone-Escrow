import React, { useState } from 'react';
import { evm } from '../services/evmEngine';
import { web3Service } from '../services/web3Service';
import { HardhatAccount, Agreement, RpcNodeStatus } from '../types/escrow';
import {
  X,
  Wallet,
  Copy,
  Check,
  ArrowDownLeft,
  Briefcase,
  Laptop,
  Scale,
  RotateCcw,
  LogOut,
  ShieldCheck,
  Coins,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: HardhatAccount;
  agreements: Agreement[];
  rpcStatus: RpcNodeStatus;
  onSelectAccount: (id: string) => void;
  onLogout: () => void;
  onOpenReceipt: (tx: any) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  activeAccount,
  agreements,
  rpcStatus,
  onSelectAccount,
  onLogout,
  onOpenReceipt,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeAccount.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSyncBalance = async () => {
    try {
      setSyncing(true);
      setWithdrawError(null);
      const isOnline = await web3Service.checkLocalNode();
      if (!isOnline) {
        setWithdrawError(
          'Hardhat RPC Server (http://127.0.0.1:8545) is offline. Please start "npx hardhat node".'
        );
      } else {
        await evm.syncWithLiveChain();
      }
    } finally {
      setSyncing(false);
    }
  };

  // Compute total withdrawable credits across agreements for active account
  let withdrawableEthTotal = 0;
  const withdrawableAgreements: { address: string; title: string; eth: string }[] = [];
  for (const agr of agreements) {
    const cred = evm.getWithdrawable(agr.address, activeAccount.address);
    const amt = parseFloat(cred.eth);
    if (amt > 0) {
      withdrawableEthTotal += amt;
      withdrawableAgreements.push({
        address: agr.address,
        title: agr.title,
        eth: cred.eth,
      });
    }
  }

  // Compute total committed in escrow by client
  let clientCommittedEth = 0;
  for (const agr of agreements) {
    if (agr.client.toLowerCase() === activeAccount.address.toLowerCase()) {
      clientCommittedEth += parseFloat(agr.totalReserved);
    }
  }

  const handleWithdrawAll = async () => {
    if (withdrawableAgreements.length === 0) return;
    try {
      setWithdrawing(true);
      setWithdrawError(null);
      for (const item of withdrawableAgreements) {
        const tx = await evm.withdraw(item.address);
        onOpenReceipt(tx);
      }
    } catch (err: any) {
      setWithdrawError(err.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleResetData = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
      return;
    }
    evm.resetState();
    setConfirmReset(false);
    onClose();
  };

  const accounts = evm.getAccounts();
  const clientAccounts = accounts.filter((a) => a.role === 'client');
  const freelancerAccounts = accounts.filter((a) => a.role === 'freelancer');
  const arbitratorAccounts = accounts.filter((a) => a.role === 'arbitrator');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-white font-display">
                  Non-Custodial Escrow Wallet
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                  activeAccount.role === 'client'
                    ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                    : activeAccount.role === 'freelancer'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}>
                  {activeAccount.roleLabel}
                </span>
                {rpcStatus.isNodeOnline ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    Disconnected (Server Closed)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {rpcStatus.isNodeOnline
                  ? `Chain ID ${rpcStatus.chainId} · Hardhat RPC (${rpcStatus.rpcUrl}) · Block #${rpcStatus.latestBlock}`
                  : 'Hardhat RPC Server (http://127.0.0.1:8545) is OFFLINE'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {!rpcStatus.isNodeOnline && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs space-y-1.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Hardhat Server Closed — Wallet Disconnected
                </span>
                <button
                  onClick={handleSyncBalance}
                  disabled={syncing}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  Reconnect
                </button>
              </div>
              <p className="text-rose-200/90 leading-relaxed">
                The local Hardhat node at <code className="font-mono font-bold text-white">http://127.0.0.1:8545</code> is not responding. Start <code className="font-mono font-bold text-white">npx hardhat node</code> in your terminal to restore live wallet connectivity.
              </p>
            </div>
          )}

          {withdrawError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-lg">
              <span className="font-medium">{withdrawError}</span>
              <button
                onClick={() => setWithdrawError(null)}
                className="text-rose-300 hover:text-white font-bold underline text-[11px] ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active Balance Hero Card */}
          <div className="p-5 rounded-2xl bg-slate-950 text-white shadow-xl border border-white/10 relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-slate-400 block">
                  {rpcStatus.isNodeOnline
                    ? 'Live On-Chain Wallet Balance (Hardhat RPC)'
                    : 'Wallet Status: Disconnected (Hardhat Offline)'}
                </span>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
                    {rpcStatus.isNodeOnline ? activeAccount.balance : '—'}{' '}
                    <span className="text-emerald-400 text-xl font-normal">ETH</span>
                  </div>
                  <button
                    onClick={handleSyncBalance}
                    disabled={syncing}
                    className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 border border-emerald-400/30 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    title="Sync live ETH balance from http://127.0.0.1:8545"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-white ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Syncing...' : 'Sync RPC Balance'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-300">
                  <span className="truncate max-w-[220px] sm:max-w-[280px]">
                    {activeAccount.address}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors text-white shrink-0 cursor-pointer"
                    title="Copy Address"
                  >
                    {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-white/15 sm:pl-5 space-y-1">
                <span className="text-xs font-medium text-slate-400 block">Account Profile</span>
                <div className="font-bold text-sm font-display text-white">{activeAccount.name}</div>
                <div className="text-xs font-mono text-emerald-400">@{activeAccount.username}</div>
              </div>
            </div>
          </div>

          {/* Role Status & Withdrawable Credits */}
          {activeAccount.role === 'freelancer' && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>Withdrawable Milestone Earnings:</span>
                  <span className="font-mono text-base font-extrabold text-emerald-400">
                    {withdrawableEthTotal.toFixed(2)} ETH
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {withdrawableEthTotal > 0
                    ? `${withdrawableAgreements.length} project(s) ready for direct pull-over-push withdrawal.`
                    : 'No pending earnings to withdraw at this time.'}
                </p>
              </div>
              {withdrawableEthTotal > 0 && (
                <button
                  onClick={handleWithdrawAll}
                  disabled={withdrawing || !rpcStatus.isNodeOnline}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  {withdrawing ? 'Processing...' : 'Withdraw to Wallet'}
                </button>
              )}
            </div>
          )}

          {activeAccount.role === 'client' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-slate-100 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-sm block font-display text-white">Active Escrow Commitments</span>
                <p className="text-slate-400">
                  Total client funds locked in autonomous smart contract escrow:
                </p>
              </div>
              <div className="text-right font-mono font-extrabold text-base text-emerald-400">
                {clientCommittedEth.toFixed(2)} ETH
              </div>
            </div>
          )}

          {/* Single-Role Enforcement Architecture Notice */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict Single-Role Account Architecture</span>
            </div>
            <p className="leading-relaxed">
              Each account is permanently bound to exactly <strong className="text-white">one role</strong> ({activeAccount.roleLabel}). Switch between the 3 dedicated accounts below:
            </p>
          </div>

          {/* Switch Single-Role Account */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
              Switch Non-Custodial Account by Role
            </label>

            {/* Clients */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Briefcase className="w-3.5 h-3.5" />
                Client Account (Alex)
              </span>
              <div className="grid grid-cols-1 gap-2">
                {clientAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => onSelectAccount(acc.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      acc.id === activeAccount.id
                        ? 'bg-blue-950/60 text-white border-blue-500/50'
                        : 'bg-slate-950/70 hover:bg-slate-800 border-white/10 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs font-display text-white">{acc.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        @{acc.username} · {acc.address.substring(0, 10)}...
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-white">
                      {rpcStatus.isNodeOnline ? `${acc.balance} ETH` : 'Offline'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Freelancers */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Laptop className="w-3.5 h-3.5" />
                Freelancer Account (Stark)
              </span>
              <div className="grid grid-cols-1 gap-2">
                {freelancerAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => onSelectAccount(acc.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      acc.id === activeAccount.id
                        ? 'bg-emerald-950/60 text-white border-emerald-500/50'
                        : 'bg-slate-950/70 hover:bg-slate-800 border-white/10 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs font-display text-white">{acc.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        @{acc.username} · {acc.address.substring(0, 10)}...
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-white">
                      {rpcStatus.isNodeOnline ? `${acc.balance} ETH` : 'Offline'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Arbitrators */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Scale className="w-3.5 h-3.5" />
                Arbitrator Account (Mark)
              </span>
              <div className="grid grid-cols-1 gap-2">
                {arbitratorAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => onSelectAccount(acc.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      acc.id === activeAccount.id
                        ? 'bg-amber-950/60 text-white border-amber-500/50'
                        : 'bg-slate-950/70 hover:bg-slate-800 border-white/10 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs font-display text-white">{acc.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        @{acc.username} · {acc.address.substring(0, 10)}...
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-white">
                      {rpcStatus.isNodeOnline ? `${acc.balance} ETH` : 'Offline'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-bold">Reset state?</span>
              <button
                onClick={handleResetData}
                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-500 transition-colors cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Reset Node State
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
