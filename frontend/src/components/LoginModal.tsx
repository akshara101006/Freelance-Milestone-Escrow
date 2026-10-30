import React from 'react';
import { HARDHAT_ACCOUNTS } from '../services/evmEngine';
import { HardhatAccount } from '../types/escrow';
import { X, ArrowRight, Briefcase, Laptop, Scale, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: HardhatAccount;
  onSelectAccount: (id: string) => void;
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  activeAccount,
  onSelectAccount,
  onLoginSuccess,
}) => {
  if (!isOpen) return null;

  const handleSignIn = (id: string) => {
    onSelectAccount(id);
    onLoginSuccess();
  };

  const clientAccounts = HARDHAT_ACCOUNTS.filter((a) => a.role === 'client');
  const freelancerAccounts = HARDHAT_ACCOUNTS.filter((a) => a.role === 'freelancer');
  const arbitratorAccounts = HARDHAT_ACCOUNTS.filter((a) => a.role === 'arbitrator');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111312]/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-[#111312]/15 shadow-2xl overflow-hidden text-[#111312] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-[#111312] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1D1B] border border-white/10 flex items-center justify-center p-1.5 shadow-xs overflow-hidden">
              <img src="/logo.png" alt="Platform Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-display">
                Sign In to Non-Custodial Account
              </h3>
              <p className="text-xs text-white/70">
                Select your dedicated single-role profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Single Role Explanation */}
          <div className="p-3.5 rounded-2xl bg-[#F7F8F7] border border-[#111312]/12 text-xs text-[#111312] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#14532D] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[#111312] mb-0.5 font-display">
                Strict Single-Role Architecture:
              </span>
              <p className="text-[#111312]/70 leading-relaxed">
                Each account operates with exactly one permanent role — <strong>Client</strong>, <strong>Freelancer</strong>, or <strong>Arbitrator</strong> — with its own non-custodial wallet and on-chain permissions.
              </p>
            </div>
          </div>

          {/* Group 1: Clients */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-[#111312] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Briefcase className="w-3.5 h-3.5" />
              Client Profiles (Creates Agreements & Funds Escrow)
            </div>
            {clientAccounts.map((acc) => {
              const isSelected = acc.id === activeAccount.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => handleSignIn(acc.id)}
                  className={`w-full p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-[#111312] text-white border-[#111312]'
                      : 'bg-white hover:bg-[#F7F8F7] border-[#111312]/15 text-[#111312]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs font-display">
                        {acc.name}
                      </span>
                      <span className={`text-[11px] font-mono ${isSelected ? 'text-white/70' : 'text-[#111312]/60'}`}>
                        @{acc.username}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.2 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] ${isSelected ? 'text-white/70' : 'text-[#111312]/60'}`}>
                      {acc.roleDescription || acc.roleLabel}
                    </div>
                    <div className={`text-[10px] font-mono ${isSelected ? 'text-white/50' : 'text-[#111312]/40'}`}>
                      {acc.address.substring(0, 10)}...{acc.address.substring(34)}
                    </div>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <span className="font-mono text-xs font-bold block mb-1">
                      {acc.balance} ETH
                    </span>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs ml-auto cursor-pointer"
                    >
                      Connect <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Group 2: Freelancers */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-bold text-[#14532D] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Laptop className="w-3.5 h-3.5" />
              Freelancer Profiles (Submits Deliverables & Withdraws Payouts)
            </div>
            {freelancerAccounts.map((acc) => {
              const isSelected = acc.id === activeAccount.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => handleSignIn(acc.id)}
                  className={`w-full p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-[#14532D] text-white border-[#14532D]'
                      : 'bg-white hover:bg-[#F7F8F7] border-[#111312]/15 text-[#111312]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs font-display">
                        {acc.name}
                      </span>
                      <span className={`text-[11px] font-mono ${isSelected ? 'text-white/80' : 'text-[#14532D]'}`}>
                        @{acc.username}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.2 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] ${isSelected ? 'text-white/80' : 'text-[#111312]/60'}`}>
                      {acc.roleDescription || acc.roleLabel}
                    </div>
                    <div className={`text-[10px] font-mono ${isSelected ? 'text-white/60' : 'text-[#111312]/40'}`}>
                      {acc.address.substring(0, 10)}...{acc.address.substring(34)}
                    </div>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <span className="font-mono text-xs font-bold block mb-1">
                      {acc.balance} ETH
                    </span>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-[#111312] hover:bg-[#222624] text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs ml-auto cursor-pointer"
                    >
                      Connect <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Group 3: Arbitrators */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-bold text-[#991B1B] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Scale className="w-3.5 h-3.5" />
              Arbitrator Profiles (Neutral Dispute Guardianship)
            </div>
            {arbitratorAccounts.map((acc) => {
              const isSelected = acc.id === activeAccount.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => handleSignIn(acc.id)}
                  className={`w-full p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-[#991B1B] text-white border-[#991B1B]'
                      : 'bg-white hover:bg-[#F7F8F7] border-[#111312]/15 text-[#111312]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs font-display">
                        {acc.name}
                      </span>
                      <span className={`text-[11px] font-mono ${isSelected ? 'text-white/80' : 'text-[#991B1B]'}`}>
                        @{acc.username}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.2 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] ${isSelected ? 'text-white/80' : 'text-[#111312]/60'}`}>
                      {acc.roleDescription || acc.roleLabel}
                    </div>
                    <div className={`text-[10px] font-mono ${isSelected ? 'text-white/60' : 'text-[#111312]/40'}`}>
                      {acc.address.substring(0, 10)}...{acc.address.substring(34)}
                    </div>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <span className="font-mono text-xs font-bold block mb-1">
                      {acc.balance} ETH
                    </span>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-[#111312] hover:bg-[#222624] text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs ml-auto cursor-pointer"
                    >
                      Connect <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#111312]/12 bg-[#F7F8F7] flex items-center justify-between text-xs text-[#111312]/60 shrink-0">
          <span>Non-Custodial Account Authentication</span>
          <button
            onClick={() => handleSignIn(activeAccount.id)}
            className="px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] font-bold text-white text-xs shadow-xs transition-colors cursor-pointer"
          >
            Continue as {activeAccount.name}
          </button>
        </div>
      </div>
    </div>
  );
};
