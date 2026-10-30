import React from 'react';
import { HARDHAT_ACCOUNTS } from '../services/evmEngine';
import { HardhatAccount } from '../types/escrow';
import { Wallet, Briefcase, Laptop, Scale, ArrowRight, ArrowLeft, Check, Copy, ShieldCheck } from 'lucide-react';

interface ConnectWalletViewProps {
  onConnectAccount: (accountId: string) => void;
  onCancel?: () => void;
}

export const ConnectWalletView: React.FC<ConnectWalletViewProps> = ({
  onConnectAccount,
  onCancel,
}) => {
  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);

  const clientAccounts = HARDHAT_ACCOUNTS.filter((a) => a.role === 'client');
  const freelancerAccounts = HARDHAT_ACCOUNTS.filter((a) => a.role === 'freelancer');
  const arbitratorAccounts = HARDHAT_ACCOUNTS.filter((a) => a.role === 'arbitrator');

  const handleCopy = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const renderAccountCard = (account: HardhatAccount) => {
    const isClient = account.role === 'client';
    const isFreelancer = account.role === 'freelancer';
    const isArbitrator = account.role === 'arbitrator';

    return (
      <div
        key={account.id}
        onClick={() => onConnectAccount(account.id)}
        className="group relative p-5 rounded-2xl bg-white border border-[#111312]/12 hover:border-[#14532D] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                isClient
                  ? 'bg-[#111312]'
                  : isFreelancer
                  ? 'bg-[#14532D]'
                  : 'bg-[#991B1B]'
              }`}
            >
              {isClient && <Briefcase className="w-5 h-5" />}
              {isFreelancer && <Laptop className="w-5 h-5" />}
              {isArbitrator && <Scale className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#111312] group-hover:text-[#14532D] transition-colors font-display">
                  {account.name}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-white ${
                    isClient
                      ? 'bg-[#111312]'
                      : isFreelancer
                      ? 'bg-[#14532D]'
                      : 'bg-[#991B1B]'
                  }`}
                >
                  {account.roleLabel}
                </span>
              </div>
              <span className="text-xs text-[#111312]/50 font-mono">@{account.username}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#111312]/50 block">Balance</span>
            <span className="text-sm font-mono font-bold text-[#111312]">{account.balance} ETH</span>
          </div>
        </div>

        {/* Address and Quick Copy */}
        <div className="pt-3 border-t border-[#111312]/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#111312]/60">
            <span>{account.address.substring(0, 10)}...{account.address.substring(34)}</span>
            <button
              onClick={(e) => handleCopy(account.address, e)}
              className="text-[#111312]/40 hover:text-[#111312] p-0.5 transition-colors cursor-pointer"
              title="Copy Address"
            >
              {copiedAddress === account.address ? (
                <Check className="w-3.5 h-3.5 text-[#14532D]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <button
            onClick={() => onConnectAccount(account.id)}
            className="flex items-center gap-1 text-xs font-bold text-[#14532D] group-hover:text-[#166534] group-hover:translate-x-0.5 transition-all cursor-pointer"
          >
            <span>Connect</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111312]/60 hover:text-[#111312] mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#14532D] text-white flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111312] tracking-tight font-display">
                Connect Your Wallet
              </h1>
              <p className="text-xs sm:text-sm text-[#111312]/60 mt-0.5">
                Select an account below to connect to the decentralized milestone escrow platform.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111312] text-white text-xs font-bold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
          <span>Single-Role Enforced Architecture</span>
        </div>
      </div>

      {/* Accounts List Section */}
      <div className="space-y-8">
        {/* Client Accounts */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#111312]/12 pb-2">
            <Briefcase className="w-4 h-4 text-[#111312]" />
            <h2 className="text-sm font-bold text-[#111312] uppercase tracking-wider font-mono">
              Client Accounts (Commission & Fund Escrow)
            </h2>
            <span className="text-xs text-[#111312]/50 font-mono ml-auto">
              {clientAccounts.length} Available
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientAccounts.map(renderAccountCard)}
          </div>
        </section>

        {/* Freelancer Accounts */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#111312]/12 pb-2">
            <Laptop className="w-4 h-4 text-[#14532D]" />
            <h2 className="text-sm font-bold text-[#14532D] uppercase tracking-wider font-mono">
              Freelancer Accounts (Submit Deliverables & Earn)
            </h2>
            <span className="text-xs text-[#111312]/50 font-mono ml-auto">
              {freelancerAccounts.length} Available
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {freelancerAccounts.map(renderAccountCard)}
          </div>
        </section>

        {/* Arbitrator Accounts */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#111312]/12 pb-2">
            <Scale className="w-4 h-4 text-[#991B1B]" />
            <h2 className="text-sm font-bold text-[#991B1B] uppercase tracking-wider font-mono">
              Arbitrator Accounts (Mediate & Resolve Disputes)
            </h2>
            <span className="text-xs text-[#111312]/50 font-mono ml-auto">
              {arbitratorAccounts.length} Available
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {arbitratorAccounts.map(renderAccountCard)}
          </div>
        </section>
      </div>
    </div>
  );
};
