import React, { useState } from 'react';
import { evm } from '../services/evmEngine';
import { web3Service } from '../services/web3Service';
import { HardhatAccount, RpcNodeStatus } from '../types/escrow';
import {
  Wallet,
  Briefcase,
  Laptop,
  Scale,
  X,
  Check,
  Copy,
  ArrowRight,
  Globe,
  Flame,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectAccount: (accountId: string) => void;
  rpcStatus: RpcNodeStatus;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onConnectAccount,
  rpcStatus,
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);
  const [checkingNode, setCheckingNode] = useState(false);
  const [metaMaskError, setMetaMaskError] = useState<string | null>(null);

  if (!isOpen) return null;

  const accounts = evm.getAccounts();
  const clientAccounts = accounts.filter((a) => a.role === 'client');
  const freelancerAccounts = accounts.filter((a) => a.role === 'freelancer');
  const arbitratorAccounts = accounts.filter((a) => a.role === 'arbitrator');

  const handleCopy = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleRetryNode = async () => {
    setCheckingNode(true);
    setMetaMaskError(null);
    await web3Service.checkLocalNode();
    await evm.syncWithLiveChain();
    setCheckingNode(false);
  };

  const handleSelectRoleAccount = async (accountId: string) => {
    setMetaMaskError(null);
    const isOnline = await web3Service.checkLocalNode();
    if (!isOnline) {
      setMetaMaskError(
        'Cannot connect wallet: Hardhat RPC Server (http://127.0.0.1:8545) is closed/offline. Please run "npx hardhat node" in your terminal first.'
      );
      return;
    }

    const selectedAccount = accounts.find((a) => a.id === accountId);
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      setIsConnectingMetaMask(true);
      try {
        await web3Service.connectMetaMask(selectedAccount?.address);
      } catch (err: any) {
        setMetaMaskError(err.message || 'MetaMask connection cancelled or failed.');
        setIsConnectingMetaMask(false);
        return;
      }
      setIsConnectingMetaMask(false);
    }

    onConnectAccount(accountId);
    onClose();
  };

  const handleConnectMetaMask = async () => {
    setIsConnectingMetaMask(true);
    setMetaMaskError(null);
    try {
      const res = await web3Service.connectMetaMask();
      const matched = accounts.find(
        (a) => a.address.toLowerCase() === res.address.toLowerCase()
      );
      if (matched) {
        onConnectAccount(matched.id);
      } else {
        onConnectAccount('account-0');
      }
      onClose();
    } catch (err: any) {
      setMetaMaskError(err.message || 'Failed to connect MetaMask');
    } finally {
      setIsConnectingMetaMask(false);
    }
  };

  const renderAccountCard = (account: HardhatAccount) => {
    const isClient = account.role === 'client';
    const isFreelancer = account.role === 'freelancer';
    const isArbitrator = account.role === 'arbitrator';
    const isNodeOnline = rpcStatus.isNodeOnline;

    return (
      <div
        key={account.id}
        onClick={() => handleSelectRoleAccount(account.id)}
        className={`group relative p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
          isNodeOnline
            ? 'bg-slate-950/85 border-white/10 hover:border-emerald-500/45 hover:bg-slate-900 cursor-pointer'
            : 'bg-slate-950/50 border-white/5 opacity-75 cursor-not-allowed'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                isClient
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                  : isFreelancer
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-600/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {isClient && <Briefcase className="w-5 h-5" />}
              {isFreelancer && <Laptop className="w-5 h-5" />}
              {isArbitrator && <Scale className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors font-display">
                  {account.name}
                </h4>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                    isClient
                      ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                      : isFreelancer
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {account.roleLabel}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">@{account.username}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">
              {isNodeOnline ? 'Live RPC Balance' : 'Node Offline'}
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {isNodeOnline ? `${account.balance} ETH` : '— ETH'}
            </span>
          </div>
        </div>

        {/* Address and Connect Action */}
        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <span>{account.address}</span>
            <button
              onClick={(e) => handleCopy(account.address, e)}
              className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer"
              title="Copy Address"
            >
              {copiedAddress === account.address ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelectRoleAccount(account.id);
            }}
            className={`flex items-center gap-1 text-xs font-bold transition-all ${
              isNodeOnline
                ? 'text-emerald-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 cursor-pointer'
                : 'text-rose-400 cursor-not-allowed'
            }`}
          >
            <span>{isNodeOnline ? 'Connect Wallet' : 'Server Offline'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 rounded-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-950 text-white border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-display">
                  Connect Your Wallet
                </h3>
                {rpcStatus.isNodeOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    Hardhat RPC Online · Block #{rpcStatus.latestBlock}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-950/90 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    Hardhat RPC Offline (127.0.0.1:8545 Closed)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Connect via MetaMask or select one of the 3 dedicated role accounts (Alex, Stark, or Mark).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable Accounts List */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Live Hardhat Server Offline Warning */}
          {!rpcStatus.isNodeOnline && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 space-y-2 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Hardhat RPC Server Disconnected (http://127.0.0.1:8545 is Closed)</span>
                </div>
                <button
                  onClick={handleRetryNode}
                  disabled={checkingNode}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${checkingNode ? 'animate-spin' : ''}`} />
                  <span>{checkingNode ? 'Checking...' : 'Retry Connection'}</span>
                </button>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                Wallet connections require an active Hardhat JSON-RPC node so that balances and transactions are 100% original and verifiable. Start{' '}
                <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono font-bold text-rose-200">
                  npx hardhat node
                </code>{' '}
                in your terminal, then click <strong>Retry Connection</strong>.
              </p>
            </div>
          )}

          {/* Live MetaMask Option */}
          <div className="p-4 rounded-2xl bg-slate-950 text-white border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                  <span>Connect Browser Extension (MetaMask)</span>
                  <span className="text-[10px] bg-slate-800 border border-white/15 text-slate-200 px-2 py-0.5 rounded font-mono">
                    Chain ID: 31337
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Connect MetaMask on <code className="bg-slate-900 px-1 py-0.5 rounded text-[11px] font-mono text-emerald-400">http://127.0.0.1:8545</code> for live browser popup signing.
                </p>
              </div>
            </div>

            <button
              onClick={handleConnectMetaMask}
              disabled={isConnectingMetaMask || !rpcStatus.isNodeOnline}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Globe className="w-4 h-4" />
              <span>
                {isConnectingMetaMask
                  ? 'Connecting...'
                  : rpcStatus.isNodeOnline
                  ? 'Connect MetaMask'
                  : 'Hardhat Offline'}
              </span>
            </button>
          </div>

          {metaMaskError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-bold">
              ⚠️ {metaMaskError}
            </div>
          )}

          {/* Client Account */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider font-mono">
                  Client Account (Commission & Fund Agreements)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {clientAccounts.length} Account
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {clientAccounts.map(renderAccountCard)}
            </div>
          </section>

          {/* Freelancer Account */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  Freelancer Account (Submit Deliverables & Withdraw)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {freelancerAccounts.length} Account
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {freelancerAccounts.map(renderAccountCard)}
            </div>
          </section>

          {/* Arbitrator Account */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Arbitrator Account (Neutral Dispute Mediation)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {arbitratorAccounts.length} Account
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {arbitratorAccounts.map(renderAccountCard)}
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>
            {rpcStatus.isNodeOnline
              ? `Connected to Hardhat RPC http://127.0.0.1:8545 (Chain ID ${rpcStatus.chainId}).`
              : 'Disconnected: Hardhat RPC http://127.0.0.1:8545 is currently closed.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/15 font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
