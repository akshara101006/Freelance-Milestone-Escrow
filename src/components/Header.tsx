import React, { useState, useRef, useEffect } from 'react';
import { evm } from '../services/evmEngine';
import { web3Service } from '../services/web3Service';
import { HardhatAccount, NotificationRecord, RpcNodeStatus } from '../types/escrow';
import {
  Check,
  LogOut,
  Briefcase,
  Laptop,
  Copy,
  RotateCcw,
  ChevronDown,
  Bell,
  CheckCheck,
  Wallet,
  ShieldCheck,
  Scale,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  isLoggedIn: boolean;
  activeAccount: HardhatAccount;
  rpcStatus: RpcNodeStatus;
  onSelectAccount: (id: string) => void;
  onOpenConnectWallet: () => void;
  onLogout: () => void;
  onOpenWallet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  isLoggedIn,
  activeAccount,
  rpcStatus,
  onSelectAccount,
  onOpenConnectWallet,
  onLogout,
  onOpenWallet,
}) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [retryingNode, setRetryingNode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const unreadCount = evm.getUnreadCount(activeAccount.address);
  const notifications: NotificationRecord[] = evm.getNotifications(activeAccount.address);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
        setShowNotificationDrawer(false);
        setConfirmReset(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyAddr = (addr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleRetryRpc = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryingNode(true);
    await web3Service.checkLocalNode();
    await evm.syncWithLiveChain();
    setRetryingNode(false);
  };

  const handleResetData = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
      return;
    }
    evm.resetState();
    setConfirmReset(false);
    setShowAccountDropdown(false);
  };

  const accounts = evm.getAccounts();
  const clientAccounts = accounts.filter((a) => a.role === 'client');
  const freelancerAccounts = accounts.filter((a) => a.role === 'freelancer');
  const arbitratorAccounts = accounts.filter((a) => a.role === 'arbitrator');

  return (
    <header className="fixed top-3 sm:top-5 inset-x-0 z-50 px-3 sm:px-4 flex justify-center pointer-events-none transition-all duration-300">
      <div ref={containerRef} className="relative pointer-events-auto max-w-full">
        {/* Floating Capsule Nav Bar (Dark Translucent Obsidian Glass) */}
        <nav className="inline-flex items-center gap-1.5 sm:gap-2 bg-slate-950/80 backdrop-blur-2xl text-slate-100 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full sm:rounded-2xl shadow-2xl shadow-black/70 border border-emerald-500/25 text-sm font-medium transition-all hover:border-lime-400/35 max-w-full">
          {/* Logo */}
          <button
            onClick={() => setCurrentTab(isLoggedIn ? 'dashboard' : 'landing')}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 p-1 transition-colors shrink-0 shadow-xs cursor-pointer"
            title="Freelance Milestone Escrow"
          >
            <img src="/logo.png" alt="Platform Logo" className="w-full h-full object-contain" />
          </button>

          {/* Live Hardhat RPC Status Pill */}
          <button
            onClick={handleRetryRpc}
            title={
              rpcStatus.isNodeOnline
                ? `Hardhat RPC Online (${rpcStatus.rpcUrl}) · Block #${rpcStatus.latestBlock}`
                : 'Hardhat RPC Server Closed (http://127.0.0.1:8545 Offline) — Click to retry connection'
            }
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer shrink-0 ${
              rpcStatus.isNodeOnline
                ? 'bg-emerald-950/70 text-lime-300 border-emerald-500/40 hover:bg-emerald-900/70'
                : 'bg-rose-950/80 text-rose-300 border-rose-500/50 hover:bg-rose-900/70'
            }`}
          >
            {rpcStatus.isNodeOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-lime-400" />
                <span>RPC Online · #{rpcStatus.latestBlock}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Hardhat Offline</span>
              </>
            )}
          </button>

          <div className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />

          {/* Navigation Links */}
          {!isLoggedIn ? (
            /* Pre-signin Navigation Menu - Distinct dedicated pages */
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => setCurrentTab('landing')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'landing'
                    ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentTab('how-it-works')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'how-it-works'
                    ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                How It Works
              </button>
              <button
                onClick={() => setCurrentTab('features')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'features'
                    ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Features
              </button>
              <button
                onClick={() => setCurrentTab('security')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'security'
                    ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Security
              </button>
            </div>
          ) : (
            /* Post-signin Navigation Menu - Strictly Separated by Role */
            <div className="flex items-center gap-1 shrink-0">
              {activeAccount.role === 'client' && (
                <>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'dashboard'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentTab('projects')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'projects'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    My Projects
                  </button>
                  <button
                    onClick={() => setCurrentTab('create')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'create'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Create Project
                  </button>
                  <button
                    onClick={() => setCurrentTab('inspector')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium hidden sm:inline-block whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'inspector'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Transactions
                  </button>
                  <button
                    onClick={onOpenWallet}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5 text-lime-400" />
                    <span>Wallet</span>
                  </button>
                </>
              )}

              {activeAccount.role === 'freelancer' && (
                <>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'dashboard'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentTab('projects')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'projects'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    My Projects
                  </button>
                  <button
                    onClick={() => setCurrentTab('submissions')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'submissions'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Milestone Submissions
                  </button>
                  <button
                    onClick={() => setCurrentTab('earnings')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'earnings'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Earnings
                  </button>
                  <button
                    onClick={() => setCurrentTab('inspector')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium hidden md:inline-block whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'inspector'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Transactions
                  </button>
                  <button
                    onClick={onOpenWallet}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Wallet</span>
                  </button>
                </>
              )}

              {activeAccount.role === 'arbitrator' && (
                <>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'dashboard'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentTab('disputes')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'disputes'
                        ? 'text-amber-300 bg-amber-950/80 border border-amber-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Active Disputes
                  </button>
                  <button
                    onClick={() => setCurrentTab('inspector')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium hidden sm:inline-block whitespace-nowrap shrink-0 cursor-pointer ${
                      currentTab === 'inspector'
                        ? 'text-lime-300 bg-emerald-950/80 border border-lime-400/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Transactions
                  </button>
                  <button
                    onClick={onOpenWallet}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>Wallet</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Real-time Notification Bell Icon */}
          {isLoggedIn && (
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowNotificationDrawer(!showNotificationDrawer);
                  setShowAccountDropdown(false);
                }}
                className={`p-2 rounded-xl transition-all relative flex items-center justify-center cursor-pointer ${
                  showNotificationDrawer
                    ? 'bg-emerald-900/60 text-lime-300'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Real-Time Notifications & Live Alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              {showNotificationDrawer && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 p-4 z-50 text-slate-100 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-lime-400" />
                      <span className="text-xs font-bold text-slate-100">Real-Time Event Alerts</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => evm.markAllAsRead(activeAccount.address)}
                        className="text-[11px] text-lime-400 hover:text-lime-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Mark Read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        No notifications yet. Alerts appear when milestones are funded, completed, or disputed.
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border transition-all ${
                            !n.read
                              ? 'bg-emerald-950/50 border-emerald-500/35'
                              : 'bg-slate-800/50 border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-100 mb-1">
                            <span className="truncate">{n.title}</span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-lime-400 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-white/10 mt-3 pt-2 text-center">
                    <button
                      onClick={() => {
                        setShowNotificationDrawer(false);
                        setCurrentTab('dashboard');
                      }}
                      className="text-xs font-bold text-lime-400 hover:text-lime-300 transition-colors cursor-pointer"
                    >
                      View Full Notification Center →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Pill & Dropdown */}
          {isLoggedIn ? (
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowAccountDropdown(!showAccountDropdown);
                  setShowNotificationDrawer(false);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm px-3 py-1.5 sm:py-2 rounded-xl transition-all shadow-md active:scale-95 text-white cursor-pointer ${
                  !rpcStatus.isNodeOnline
                    ? 'bg-rose-600 hover:bg-rose-500 ring-2 ring-rose-400/50'
                    : activeAccount.role === 'client'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : activeAccount.role === 'freelancer'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {rpcStatus.isNodeOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-lime-200 shrink-0" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-white shrink-0" />
                )}
                <span>{activeAccount.name}</span>
                <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider hidden sm:inline">
                  {rpcStatus.isNodeOnline ? activeAccount.roleLabel : 'Node Offline'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {/* Account Dropdown */}
              {showAccountDropdown && (
                <div className="absolute right-0 mt-3 w-80 sm:w-88 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 p-3 z-50 text-slate-100 animate-in fade-in duration-150">
                  {/* Live RPC Node Connection Status Banner inside Dropdown */}
                  <div
                    className={`p-2.5 rounded-xl border mb-2.5 flex items-center justify-between text-xs ${
                      rpcStatus.isNodeOnline
                        ? 'bg-emerald-950/60 border-emerald-500/35 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {rpcStatus.isNodeOnline ? (
                        <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-[11px]">
                          {rpcStatus.isNodeOnline
                            ? 'Wallet Connected to Hardhat RPC'
                            : 'Wallet Disconnected (Server Closed)'}
                        </div>
                        <div className="text-[10px] font-mono opacity-80">
                          {rpcStatus.isNodeOnline
                            ? `${rpcStatus.rpcUrl} · Block #${rpcStatus.latestBlock}`
                            : 'http://127.0.0.1:8545 is unreachable'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRetryRpc}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 cursor-pointer"
                      title="Refresh Hardhat RPC Status"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${retryingNode ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Active Account Overview */}
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-white/10 mb-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{activeAccount.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          activeAccount.role === 'client'
                            ? 'bg-blue-500/20 text-blue-300'
                            : activeAccount.role === 'freelancer'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {activeAccount.roleLabel}
                      </span>
                    </div>
                    <div className="text-xs text-lime-300 font-mono mt-0.5 flex items-center justify-between">
                      <span>
                        {activeAccount.address.substring(0, 10)}...{activeAccount.address.substring(34)}
                      </span>
                      <button
                        onClick={(e) => handleCopyAddr(activeAccount.address, e)}
                        className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                        title="Copy Address"
                      >
                        {copiedAddress ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {rpcStatus.isNodeOnline ? 'Live Balance:' : 'Status:'}
                      </span>
                      <span className="font-mono font-bold text-slate-100 tabular-nums">
                        {rpcStatus.isNodeOnline
                          ? `${activeAccount.balance} ETH`
                          : 'Disconnected (Node Offline)'}
                      </span>
                    </div>
                  </div>

                  {/* Single Role Architecture Explanatory Header */}
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Single-Role System (1 Account = 1 Role)</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
                  </div>
                  <p className="px-2 text-[11px] text-slate-400 leading-tight mb-2">
                    Switch between the 3 dedicated accounts below:
                  </p>

                  {/* Grouped Single-Role Account Switcher */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {/* Clients */}
                    <div>
                      <div className="text-[10px] font-bold text-blue-400 uppercase px-1 mb-1 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Client Account
                      </div>
                      <div className="space-y-1">
                        {clientAccounts.map((acc) => {
                          const isCurrent = acc.id === activeAccount.id;
                          return (
                            <button
                              key={acc.id}
                              onClick={() => {
                                onSelectAccount(acc.id);
                                setShowAccountDropdown(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                isCurrent
                                  ? 'bg-blue-950/60 border border-blue-500/40 text-blue-200 font-bold'
                                  : 'hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              <div>
                                <div className="text-slate-100 font-medium">{acc.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">@{acc.username}</div>
                              </div>
                              <span className="font-mono text-[11px] text-slate-200 tabular-nums">
                                {rpcStatus.isNodeOnline ? `${acc.balance} ETH` : 'Offline'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Freelancers */}
                    <div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase px-1 mb-1 flex items-center gap-1">
                        <Laptop className="w-3 h-3" /> Freelancer Account
                      </div>
                      <div className="space-y-1">
                        {freelancerAccounts.map((acc) => {
                          const isCurrent = acc.id === activeAccount.id;
                          return (
                            <button
                              key={acc.id}
                              onClick={() => {
                                onSelectAccount(acc.id);
                                setShowAccountDropdown(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                isCurrent
                                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 font-bold'
                                  : 'hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              <div>
                                <div className="text-slate-100 font-medium">{acc.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">@{acc.username}</div>
                              </div>
                              <span className="font-mono text-[11px] text-slate-200 tabular-nums">
                                {rpcStatus.isNodeOnline ? `${acc.balance} ETH` : 'Offline'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Arbitrators */}
                    <div>
                      <div className="text-[10px] font-bold text-amber-400 uppercase px-1 mb-1 flex items-center gap-1">
                        <Scale className="w-3 h-3" /> Arbitrator Account
                      </div>
                      <div className="space-y-1">
                        {arbitratorAccounts.map((acc) => {
                          const isCurrent = acc.id === activeAccount.id;
                          return (
                            <button
                              key={acc.id}
                              onClick={() => {
                                onSelectAccount(acc.id);
                                setShowAccountDropdown(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                isCurrent
                                  ? 'bg-amber-950/60 border border-amber-500/40 text-amber-200 font-bold'
                                  : 'hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              <div>
                                <div className="text-slate-100 font-medium">{acc.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">@{acc.username}</div>
                              </div>
                              <span className="font-mono text-[11px] text-slate-200 tabular-nums">
                                {rpcStatus.isNodeOnline ? `${acc.balance} ETH` : 'Offline'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Footer Actions */}
                  <div className="border-t border-white/10 mt-2.5 pt-2 flex items-center gap-2">
                    {confirmReset ? (
                      <div className="flex-1 flex items-center justify-between gap-1 bg-rose-950/60 border border-rose-500/40 px-2 py-1 rounded-xl">
                        <span className="text-[10px] text-rose-300 font-medium">Reset all?</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleResetData}
                            className="text-[10px] font-bold text-white bg-rose-600 px-1.5 py-0.5 rounded hover:bg-rose-500 cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmReset(false)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer px-1"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleResetData}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        title="Reset local state and sync with Hardhat node"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        Reset Data
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowAccountDropdown(false);
                        onLogout();
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenConnectWallet}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Your Wallet</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
