import React, { useEffect, useState } from 'react';
import { NotificationRecord } from '../types/escrow';
import { evm } from '../services/evmEngine';
import {
  Coins,
  ShieldAlert,
  Upload,
  X,
  ExternalLink,
} from 'lucide-react';

interface NotificationToastProps {
  onSelectAgreement: (contractAddress: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ onSelectAgreement }) => {
  const [toast, setToast] = useState<NotificationRecord | null>(evm.getLatestToast());
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = evm.subscribe(() => {
      const latest = evm.getLatestToast();
      if (latest && latest !== toast) {
        setToast(latest);
        setIsVisible(true);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [toast]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!toast || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    evm.clearLatestToast();
  };

  const handleAction = () => {
    if (toast.contractAddress) {
      onSelectAgreement(toast.contractAddress);
      evm.markAsRead(toast.id);
      handleDismiss();
    }
  };

  const getToastIcon = () => {
    switch (toast.type) {
      case 'funded':
      case 'completed':
      case 'withdrawn':
        return <Coins className="w-5 h-5 text-[#22C55E] shrink-0" />;
      case 'disputed':
      case 'resolved':
        return <ShieldAlert className="w-5 h-5 text-white shrink-0" />;
      default:
        return <Upload className="w-5 h-5 text-white shrink-0" />;
    }
  };

  const getTopBarColor = () => {
    switch (toast.severity) {
      case 'error':
      case 'warning':
        return 'bg-[#991B1B]';
      default:
        return 'bg-[#14532D]';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
      <div className="p-4 rounded-2xl bg-[#111312] border border-white/15 shadow-2xl text-white flex items-start gap-3 relative overflow-hidden transition-all">
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${getTopBarColor()}`} />

        {/* Icon */}
        <div className="p-2 rounded-xl bg-[#1A1D1B] border border-white/10">
          {getToastIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white truncate font-display">{toast.title}</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#14532D] text-white font-bold">
              Real-Time Alert
            </span>
          </div>
          <p className="text-xs text-white/80 leading-snug break-words">
            {toast.message}
          </p>

          <div className="pt-2 flex items-center gap-2">
            {toast.contractAddress && (
              <button
                onClick={handleAction}
                className="px-2.5 py-1 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>Open Agreement</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors border border-white/15 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="text-white/50 hover:text-white p-1 rounded-lg transition-colors absolute top-3 right-3 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
