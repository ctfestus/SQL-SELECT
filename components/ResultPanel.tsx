
import React from 'react';
import { SubmissionResult } from '../types';
import { Terminal, ChevronDown, ChevronRight } from 'lucide-react';

interface ResultPanelProps {
  result: SubmissionResult | null;
  loading: boolean;
  onToggle?: () => void;
  isCollapsed?: boolean;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ result, loading, onToggle, isCollapsed = false }) => {
  // Common Header
  const Header = () => (
      <div 
        className={`bg-black/20 px-4 py-2 border-b border-white/10 flex items-center justify-between shrink-0 ${onToggle ? 'cursor-pointer' : ''}`}
        onClick={onToggle}
      >
         <div className="flex items-center gap-2">
             <Terminal size={14} className="text-corp-orange" />
             <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Query Results</span>
         </div>
         {onToggle && (
             <div className="text-slate-400">
                 {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
             </div>
         )}
      </div>
  );

  if (isCollapsed) {
      return (
          <div className="h-full flex flex-col bg-corp-dark">
              <Header />
          </div>
      );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-corp-dark">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-corp-cyan space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/10 border-t-corp-cyan"></div>
            <p className="animate-pulse text-sm font-semibold tracking-wide text-white">Running Query...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col bg-corp-dark">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="bg-white/5 p-4 rounded-full mb-4">
            <Terminal size={32} className="opacity-40 text-blue-200" />
            </div>
            <p className="text-sm font-medium">Output will appear here</p>
        </div>
      </div>
    );
  }

  const columns = result.outputData.length > 0 ? Object.keys(result.outputData[0]) : [];

  return (
    <div className="h-full flex flex-col bg-corp-dark">
      <Header />
      <div className="flex-1 overflow-auto p-0">
        {columns.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="bg-corp-blue/40 text-blue-100 font-mono p-3 border-b border-white/10 sticky top-0 whitespace-nowrap text-xs uppercase tracking-wide font-bold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.outputData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  {columns.map((col) => (
                    <td key={col} className="p-3 text-slate-300 font-mono whitespace-nowrap text-xs">
                      {String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-slate-400 italic text-center mt-10">
             {result.outputData.length === 0 ? "Query returned no data." : "No data to display."}
          </div>
        )}
      </div>
    </div>
  );
};
