
import React from 'react';
import { X, Unlock, Check, ArrowRight, Zap, Crown, BookOpen, Mic } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowPricing: () => void;
}

export const LimitReachedModal: React.FC<LimitReachedModalProps> = ({ isOpen, onClose, onShowPricing }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 font-sans" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#020015]/90 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#09069d] rounded-3xl shadow-2xl border-2 border-[#ff9933] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col">
        
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#ff9933]/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-blue-200 hover:text-white transition-colors rounded-full hover:bg-white/10 z-10"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center relative z-10">
          
          {/* Hero Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#ff9933] to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 transform rotate-3">
            <Unlock size={32} className="text-white" strokeWidth={2} />
          </div>

          <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
            Ready to go further?
          </h2>
          
          <p className="text-blue-100 text-sm mb-8 leading-relaxed font-medium">
            You've unlocked your <strong className="text-white">2 free lessons</strong>. Upgrade to Pro to access the full curriculum and advanced career tools.
          </p>

          {/* Value Highlights */}
          <div className="space-y-4 mb-8 text-left bg-[#05046e]/50 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 text-sm text-blue-50">
              <div className="p-1 rounded-full bg-green-500/20 text-green-400 shrink-0">
                <Check size={12} strokeWidth={3} />
              </div>
              <span>Unlimited lesson access</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-50">
              <div className="p-1 rounded-full bg-green-500/20 text-green-400 shrink-0">
                <Zap size={12} strokeWidth={3} className="fill-green-400/20" />
              </div>
              <span>AI Tutor & Mentorship</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-50">
              <div className="p-1 rounded-full bg-green-500/20 text-green-400 shrink-0">
                <Mic size={12} strokeWidth={3} />
              </div>
              <span>24/7 AI Live Instructor</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-50">
              <div className="p-1 rounded-full bg-green-500/20 text-green-400 shrink-0">
                <BookOpen size={12} strokeWidth={3} />
              </div>
              <span>Complete Learning Path</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button 
              onClick={onShowPricing}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#ff9933] to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              Upgrade Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 px-4 text-blue-300 hover:text-white font-bold text-sm transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
