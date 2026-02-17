
import React from 'react';
import { X, ArrowRight, RefreshCw, Trophy, Zap, Terminal, Sparkles, AlertCircle, BookOpen } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  isCorrect: boolean;
  feedback: string;
  bestPractice?: string;
  points: number;
  onClose: () => void;
  onNext: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isOpen, 
  isCorrect, 
  feedback, 
  bestPractice,
  points, 
  onClose, 
  onNext 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Darkened Backdrop - Allows clicking to dismiss (Non-modal behavior) */}
      <div 
        className="absolute inset-0 bg-corp-blue/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose} 
      />

      {/* Modern Glass Card */}
      <div className={`relative w-full max-w-lg overflow-hidden rounded-[2rem] border shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ${
        isCorrect 
          ? 'bg-corp-dark/90 border-corp-cyan/30 shadow-[0_0_50px_rgba(0,164,239,0.2)]' 
          : 'bg-corp-dark/90 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]'
      }`}>
        
        {/* Ambient Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-[80px] opacity-40 mix-blend-screen ${isCorrect ? 'bg-corp-cyan' : 'bg-red-600'}`}></div>
            <div className={`absolute -bottom-32 -right-32 w-64 h-64 rounded-full blur-[80px] opacity-40 mix-blend-screen ${isCorrect ? 'bg-corp-royal' : 'bg-orange-600'}`}></div>
        </div>

        {/* Header */}
        <div className="relative z-10 px-8 pt-8 pb-4 flex justify-between items-start">
            <div className="flex items-center gap-4">
                {isCorrect ? (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-corp-cyan to-corp-royal flex items-center justify-center shadow-lg shadow-corp-cyan/20">
                        <Trophy size={28} className="text-white drop-shadow-md" />
                    </div>
                ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <AlertCircle size={28} className="text-white drop-shadow-md" />
                    </div>
                )}
                <div>
                    <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
                        {isCorrect ? 'Challenge Solved' : 'Review Required'}
                    </h2>
                    {isCorrect && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-corp-cyan bg-corp-cyan/10 px-2 py-0.5 rounded border border-corp-cyan/20 flex items-center gap-1">
                                <Zap size={10} className="fill-current" /> +{points} XP
                            </span>
                            <span className="text-xs font-medium text-slate-400">Analysis Complete</span>
                        </div>
                    )}
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Content Body */}
        <div className="relative z-10 px-8 py-2 space-y-6">
            
            {/* Feedback Section */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Terminal size={14} /> Logic Analysis
                </h3>
                <p className={`text-sm leading-relaxed font-medium p-4 rounded-xl border ${
                    isCorrect 
                    ? 'bg-corp-blue/20 border-corp-cyan/20 text-blue-100' 
                    : 'bg-red-500/10 border-red-500/20 text-red-100'
                }`}>
                    {feedback}
                </p>
            </div>

            {/* Educational / Pro Tip Section */}
            {bestPractice && (
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-corp-orange uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={14} /> Senior Engineer Tip
                    </h3>
                    <div className="relative p-4 rounded-xl bg-gradient-to-r from-corp-orange/10 to-transparent border border-corp-orange/20">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-corp-orange rounded-l-xl"></div>
                        <p className="text-sm text-slate-200 italic">
                            "{bestPractice}"
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 p-8 pt-6 flex gap-3">
            {!isCorrect ? (
              <button 
                onClick={onClose} 
                className="w-full py-4 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 group hover:border-white/30"
              >
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500 text-slate-400 group-hover:text-white" />
                <span className="text-slate-300 group-hover:text-white">Refine Query</span>
              </button>
            ) : (
              <div className="flex gap-3 w-full">
                  <button 
                    onClick={onClose} 
                    className="flex-1 py-4 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 hover:text-white"
                  >
                    Review Code
                  </button>
                  <button 
                    onClick={onNext} 
                    className="flex-[2] py-4 rounded-xl font-bold text-white bg-gradient-to-r from-corp-royal to-corp-cyan hover:from-blue-600 hover:to-cyan-400 shadow-lg shadow-corp-cyan/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Next Challenge <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-[-150%] transition-transform duration-700 ease-in-out"></div>
                  </button>
              </div>
            )}
        </div>

      </div>
    </div>
  );
};
