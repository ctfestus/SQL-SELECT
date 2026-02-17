
import React, { useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Database, Code2, ChevronDown, ChevronRight } from 'lucide-react';

interface SqlEditorProps {
  code: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  onToggle?: () => void;
  isCollapsed?: boolean;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({ code, onChange, disabled, onToggle, isCollapsed = false }) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('corp-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '00a4ef', fontStyle: 'bold' }, // Cyan for keywords
          { token: 'string', foreground: 'ff9933' }, // Orange for strings
          { token: 'number', foreground: 'a3e635' }, // Lime/Greenish for numbers
          { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' }, // Slate for comments
          { token: 'operator', foreground: 'e2e8f0' },
          { token: 'delimiter', foreground: 'e2e8f0' }
        ],
        colors: {
          'editor.background': '#09069d', // Matches container bg
          'editor.foreground': '#e2e8f0',
          'editor.selectionBackground': '#00a4ef40',
          'editor.lineHighlightBackground': '#ffffff08',
          'editorCursor.foreground': '#00a4ef',
          'editorLineNumber.foreground': '#5074b8',
          'editor.inactiveSelectionBackground': '#09069d'
        }
      });
      monaco.editor.setTheme('corp-dark');
    }
  }, [monaco]);

  return (
    <div className="relative w-full h-full bg-[#09069d] flex flex-col">
      {/* Modern Editor Header */}
      <div 
        className={`bg-[#07057a] text-blue-200 px-4 py-3 text-xs font-mono border-b border-white/10 flex justify-between items-center shrink-0 shadow-md z-10 ${onToggle ? 'cursor-pointer' : ''}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
           <Code2 size={14} className="text-corp-cyan" />
           <span className="font-bold text-white tracking-wide">SQL QUERY EDITOR</span>
        </div>
        <div className="flex items-center gap-2">
           {!isCollapsed && (
               <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold bg-black/20 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                  PostgreSQL
               </div>
           )}
           {onToggle && (
               <div className="text-slate-400">
                   {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
               </div>
           )}
        </div>
      </div>
      
      {!isCollapsed && (
          <div className="flex-1 relative overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="sql"
              value={code}
              onChange={(value) => onChange(value || '')}
              theme="corp-dark"
              options={{
                readOnly: disabled,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 20, bottom: 20 },
                fontFamily: '"JetBrains Mono", monospace',
                renderLineHighlight: 'all',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
              }}
            />
          </div>
      )}
    </div>
  );
};
