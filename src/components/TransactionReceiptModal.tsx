import React, { useEffect, useState } from 'react';
import { TransactionRecord } from '../types/escrow';
import { web3Service, LiveReceiptVerification } from '../services/web3Service';
import {
  CheckCircle2,
  XCircle,
  Copy,
  X,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Terminal,
} from 'lucide-react';

interface TransactionReceiptModalProps {
  receipt: TransactionRecord | null;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  receipt,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<LiveReceiptVerification | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    if (receipt?.hash) {
      handleVerifyOnChain(receipt.hash);
    } else {
      setVerification(null);
    }
  }, [receipt?.hash]);

  if (!receipt) return null;

  const copyValue = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerifyOnChain = async (hash: string) => {
    setVerifying(true);
    try {
      const res = await web3Service.verifyTransactionOnChain(hash);
      setVerification(res);
    } finally {
      setVerifying(false);
    }
  };

  const isSuccess = receipt.status === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 p-1 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            {isSuccess ? (
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-extrabold text-white font-display">
                {isSuccess ? 'On-Chain EVM Transaction Receipt' : 'Transaction Reverted on EVM'}
              </h3>
              <p className="text-xs text-slate-400">
                Method: <span className="font-mono text-emerald-400 font-bold">{receipt.action}</span>
                {receipt.executionSource && (
                  <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/15">
                    {receipt.executionSource === 'metamask_rpc'
                      ? 'Signed via MetaMask (Chain 31337)'
                      : 'Mined on Hardhat RPC (127.0.0.1:8545)'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[76vh] overflow-y-auto">
          {/* Live On-Chain Verification Status Box */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 ${
              verification?.verified
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold">
                {verification?.verified ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Verified Live on Hardhat RPC ({verification.rpcUrl}) · {verification.confirmations} Confirmation(s)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      {verifying
                        ? 'Querying eth_getTransactionReceipt on Hardhat RPC...'
                        : 'On-Chain RPC Verification Failed (Hardhat Server Offline or Reset)'}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {verification?.verified && verification.rawReceipt && (
                  <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>{showRawJson ? 'Hide Raw RPC JSON' : 'View Raw RPC JSON'}</span>
                  </button>
                )}
                <button
                  onClick={() => handleVerifyOnChain(receipt.hash)}
                  disabled={verifying}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-white/10 font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${verifying ? 'animate-spin' : ''}`} />
                  <span>{verifying ? 'Verifying...' : 'Verify Live via RPC'}</span>
                </button>
              </div>
            </div>

            {verification?.error && (
              <p className="text-[11px] text-rose-300 font-semibold">{verification.error}</p>
            )}

            {showRawJson && verification?.rawReceipt && (
              <pre className="p-3 rounded-xl bg-slate-950 border border-white/10 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(verification.rawReceipt, null, 2)}
              </pre>
            )}
          </div>

          {/* Revert reason alert if failed */}
          {!isSuccess && receipt.revertReason && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono shadow-xs">
              <span className="font-bold">EVM Revert Error: </span>
              {receipt.revertReason}
            </div>
          )}

          {/* Core Receipt Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-slate-400 block mb-1">Receipt Status</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  isSuccess
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {receipt.status} (0x1)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-slate-400 block mb-1">Block & Tx Index</span>
              <span className="font-mono font-bold text-slate-100 tabular-nums">
                #{receipt.blockNumber} · idx {receipt.transactionIndex ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-slate-400 block mb-1">Gas Used / Price</span>
              <span className="font-mono font-semibold text-slate-100 tabular-nums">
                {receipt.gasUsed.toLocaleString()}{' '}
                {receipt.effectiveGasPriceGwei ? `@ ${parseFloat(receipt.effectiveGasPriceGwei).toFixed(2)} Gwei` : 'units'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-slate-400 block mb-1">Value & Nonce</span>
              <span className="font-mono font-bold text-slate-100 tabular-nums">
                {receipt.value} {receipt.nonce !== undefined ? `· Nonce #${receipt.nonce}` : ''}
              </span>
            </div>
          </div>

          {/* Hash, Block Hash & Addresses */}
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Transaction Hash (Original Hardhat Keccak-256)</span>
                <button
                  onClick={() => copyValue('txHash', receipt.hash)}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedField === 'txHash' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-slate-100 break-all select-all text-[11px] font-semibold">
                {receipt.hash}
              </div>
            </div>

            {(receipt.blockHash || verification?.blockHash) && (
              <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Block Hash (Mined Block Header Hash)</span>
                  <button
                    onClick={() =>
                      copyValue('blockHash', (receipt.blockHash || verification?.blockHash)!)
                    }
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedField === 'blockHash' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-slate-200 break-all select-all text-[11px]">
                  {receipt.blockHash || verification?.blockHash}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10">
                <span className="text-slate-400 block text-[11px]">From (Signer Wallet)</span>
                <span className="font-mono text-slate-200 text-[11px] truncate block font-semibold" title={receipt.from}>
                  {receipt.from}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10">
                <span className="text-slate-400 block text-[11px]">To (Target Smart Contract)</span>
                <span className="font-mono text-slate-200 text-[11px] truncate block font-semibold" title={receipt.to}>
                  {receipt.to}
                </span>
              </div>
            </div>

            {receipt.contractAddress && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 block text-[11px] font-bold">
                    Deployed FreelanceMilestoneEscrow Contract Address:
                  </span>
                  <span className="font-mono text-white font-bold text-xs break-all block">
                    {receipt.contractAddress}
                  </span>
                </div>
                <button
                  onClick={() => copyValue('contractAddr', receipt.contractAddress!)}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-emerald-500/30 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  {copiedField === 'contractAddr' ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}

            {receipt.calldata && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10">
                <span className="text-slate-400 block text-[11px] mb-1">
                  ABI-Encoded Input Calldata (ethers.Interface)
                </span>
                <div className="font-mono text-[10px] text-slate-300 break-all max-h-16 overflow-y-auto bg-slate-900 p-2 rounded-lg border border-white/10">
                  {receipt.calldata}
                </div>
              </div>
            )}
          </div>

          {/* Decoded Logs & ABI Events */}
          {receipt.events && receipt.events.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-200 block font-display">
                Decoded Smart Contract Event Logs ({receipt.events.length})
              </span>
              <div className="space-y-2">
                {receipt.events.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs"
                  >
                    <div className="text-emerald-400 font-bold mb-1 flex items-center justify-between">
                      <span>event {ev.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">log #{i}</span>
                    </div>
                    <pre className="text-[11px] text-slate-200 whitespace-pre-wrap overflow-x-auto bg-slate-900 p-2.5 rounded-lg border border-white/10">
                      {JSON.stringify(ev.args, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium font-mono">
            Chain ID 31337 · Hardhat RPC (http://127.0.0.1:8545)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-colors shadow-xs cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
