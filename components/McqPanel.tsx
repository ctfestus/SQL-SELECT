
import React, { useState } from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface McqPanelProps {
  question: string;
  options: string[];
  onSubmit: (selectedOption: string) => void;
  disabled: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
}

export const McqPanel: React.FC<McqPanelProps> = ({ 
  question, 
  options, 
  onSubmit, 
  disabled, 
  isCorrect,
  correctAnswer
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selected) {
      onSubmit(selected);
    }
  };

  return (
    <div className="flex-1 glass-panel bg-corp-dark rounded-2xl flex flex-col overflow-hidden border border-white/10 shadow-xl h-full p-8 justify-center">
      <div className="max-w-2xl mx-auto w-full">
        <h2 className="text-xl font-bold text-white mb-6 leading-relaxed">
          {question}
        </h2>

        <div className="space-y-3 mb-8">
          {options.map((option, idx) => {
            const isSelected = selected === option;
            const showSuccess = disabled && isCorrect && isSelected;
            const showFailure = disabled && !isCorrect && isSelected;
            const isMissed = disabled && !isCorrect && option === correctAnswer;

            let borderClass = 'border-white/10 hover:border-white/30';
            let bgClass = 'bg-black/20';
            let textClass = 'text-slate-300';

            if (showSuccess) {
                borderClass = 'border-green-500 bg-green-500/10';
                textClass = 'text-green-100';
            } else if (showFailure) {
                borderClass = 'border-red-500 bg-red-500/10';
                textClass = 'text-red-100';
            } else if (isMissed) {
                borderClass = 'border-green-500/50 border-dashed';
                textClass = 'text-green-300';
            } else if (isSelected) {
                borderClass = 'border-corp-cyan bg-corp-cyan/10';
                textClass = 'text-white';
            }

            return (
              <button
                key={idx}
                onClick={() => !disabled && setSelected(option)}
                disabled={disabled}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 group ${borderClass} ${bgClass}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? (showSuccess ? 'border-green-500 bg-green-500 text-white' : showFailure ? 'border-red-500 bg-red-500 text-white' : 'border-corp-cyan bg-corp-cyan text-corp-dark') : 'border-slate-500 text-transparent'
                }`}>
                    {isSelected && (showSuccess || showFailure ? (showSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />) : <Circle size={10} fill="currentColor" />)}
                </div>
                <span className={`text-base font-medium ${textClass}`}>{option}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={disabled || !selected}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
            disabled || !selected
              ? 'bg-white/5 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-corp-royal to-corp-cyan hover:shadow-corp-cyan/20 transform hover:-translate-y-0.5'
          }`}
        >
          {disabled ? (isCorrect ? 'Correct Answer' : 'Incorrect') : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
};
