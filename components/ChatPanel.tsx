
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Sparkles, Zap, Code, BookOpen, HelpCircle, RefreshCw, Terminal, Lock } from 'lucide-react';
import { Challenge, Industry } from '../types';
import { createExpertChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface ChatPanelProps {
  challenge: Challenge;
  industry: Industry;
  customContext?: string;
  allowed: boolean;
  onShowPricing: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const SUGGESTION_CHIPS = [
  { label: "Explain Concept", icon: BookOpen, prompt: "Can you explain the core concept behind this task?", color: "bg-corp-cyan/10 text-corp-cyan border-corp-cyan/20" },
  { label: "Industry Context", icon: Zap, prompt: "How is this used in the real world industry context?", color: "bg-corp-orange/10 text-corp-orange border-corp-orange/20" },
  { label: "Syntax Hint", icon: Code, prompt: "Can you provide a syntax skeleton (no answer) for this?", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { label: "Debug Approach", icon: HelpCircle, prompt: "What's the best way to debug a query like this?", color: "bg-green-500/10 text-green-400 border-green-500/20" },
];

export const ChatPanel: React.FC<ChatPanelProps> = ({ challenge, industry, customContext, allowed, onShowPricing }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat when challenge changes
    if (allowed) {
        chatRef.current = createExpertChat(challenge, industry, customContext);
        setMessages([{ 
            role: 'model', 
            text: `**Welcome, Analyst.**\n\nI am your Industry Mentor. We are focusing on **${challenge.topic}** today.\n\nShall I explain what **${challenge.topic}** means in the context of **${industry === 'Personalized' ? 'this project' : industry}**?`,
            timestamp: Date.now()
        }]);
        setShowSuggestions(true);
    }
  }, [challenge.id, industry, customContext, allowed]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !chatRef.current || !allowed) return;

    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: Date.now() }]);
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const result: GenerateContentResponse = await chatRef.current.sendMessage({ message: userMsg });
      const responseText = result.text || "I'm having trouble connecting right now.";
      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!allowed) {
      return (
          <div className="flex flex-col h-full bg-corp-dark relative overflow-hidden font-sans text-sm border-l border-white/10 items-center justify-center p-8 text-center">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                      <Lock size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">AI Tutor Locked</h3>
                  <p className="text-slate-400 mb-6 max-w-xs">Upgrade your plan to access unlimited context-aware AI mentorship.</p>
                  <button 
                      onClick={onShowPricing}
                      className="bg-corp-cyan hover:bg-cyan-400 text-corp-dark font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                  >
                      <Sparkles size={16} /> Unlock AI Features
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-corp-dark relative overflow-hidden font-sans text-sm border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-corp-cyan/10 flex items-center justify-center border border-corp-cyan/30">
              <Bot size={16} className="text-corp-cyan" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-corp-dark rounded-full animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Mentor</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
               {isLoading ? 'Processing...' : 'Online'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            setMessages([{ 
                role: 'model', 
                text: `Let's restart. How can I help you with **${challenge.topic}**?`,
                timestamp: Date.now()
            }]);
            setShowSuggestions(true);
          }}
          className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Reset Conversation"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`group flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
              msg.role === 'user' 
              ? 'bg-corp-royal border-white/10 text-white' 
              : 'bg-corp-blue border-white/10 text-corp-cyan'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
            </div>

            {/* Message Bubble */}
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
               <div className={`relative px-5 py-4 rounded-xl text-sm leading-relaxed shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-corp-royal text-white border-white/10' 
                    : 'bg-white/5 text-blue-100 border-white/5'
                }`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code(props) {
                            const {children, className, node, ...rest} = props
                            const match = /language-(\w+)/.exec(className || '')
                            return match ? (
                                <div className="rounded-md overflow-hidden my-3 border border-white/10 bg-black/40 w-full max-w-full">
                                    <div className="bg-white/5 px-3 py-1.5 text-[10px] text-slate-400 border-b border-white/5 uppercase tracking-wider flex items-center justify-between font-mono">
                                       <span className="flex items-center gap-2"><Terminal size={10} /> SQL</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <SyntaxHighlighter
                                          {...rest}
                                          PreTag="div"
                                          children={String(children).replace(/\n$/, '')}
                                          language={match[1]}
                                          style={vscDarkPlus}
                                          customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8rem', background: 'transparent' }}
                                          wrapLongLines={true}
                                      />
                                    </div>
                                </div>
                            ) : (
                                <code {...rest} className="bg-white/10 px-1 py-0.5 rounded text-corp-cyan text-xs border border-white/5 break-words whitespace-pre-wrap font-mono">
                                    {children}
                                </code>
                            )
                        },
                        // Ensure tables fit and don't force wide scrolling if possible, though overflow-x-auto handles needed scrolling
                        table: ({node, ...props}) => <div className="overflow-x-auto max-w-full my-3 rounded border border-white/10"><table className="w-full text-left border-collapse bg-black/20" {...props} /></div>,
                        thead: ({node, ...props}) => <thead className="bg-white/5 text-[11px] uppercase tracking-wider font-bold text-slate-400 font-sans" {...props} />,
                        tbody: ({node, ...props}) => <tbody className="text-sm font-mono" {...props} />,
                        tr: ({node, ...props}) => <tr className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors" {...props} />,
                        th: ({node, ...props}) => <th className="px-3 py-2 border-r border-white/5 last:border-0 whitespace-nowrap" {...props} />,
                        td: ({node, ...props}) => <td className="px-3 py-2 border-r border-white/5 last:border-0 text-blue-100 text-xs" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                        p: ({node, ...props}) => <p className="mb-3 last:mb-0 break-words whitespace-pre-wrap" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 ml-1 marker:text-corp-cyan" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-1 marker:text-corp-cyan" {...props} />,
                        a: ({node, ...props}) => <a className="text-corp-cyan hover:underline decoration-1 underline-offset-2 break-all" {...props} />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
               </div>
               <span className="text-[10px] text-slate-500 mt-1 font-medium px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
            </div>
          </div>
        ))}
        
        {/* Thinking Indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-corp-blue border-white/10 text-corp-cyan">
                <Sparkles size={16} className="animate-pulse" />
             </div>
             <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-lg rounded-tl-none flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-corp-cyan/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-corp-cyan/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-corp-cyan/60 rounded-full animate-bounce"></div>
                </div>
                <span className="text-xs text-slate-500 font-medium ml-2">Analyzing...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Interaction Area */}
      <div className="p-4 pt-2 bg-gradient-to-t from-corp-dark to-transparent z-10">
        
        {/* Suggestion Chips */}
        {showSuggestions && !isLoading && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-none snap-x mask-fade-right">
             {SUGGESTION_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(chip.prompt)}
                  className={`snap-start shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${chip.color} hover:bg-opacity-20`}
                >
                   <chip.icon size={12} />
                   {chip.label}
                </button>
             ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="relative group">
          <div className="relative flex gap-2 bg-black/20 border border-white/10 rounded-xl p-2 shadow-lg items-end focus-within:border-corp-cyan/50 focus-within:ring-1 focus-within:ring-corp-cyan/20 transition-all">
             <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask your mentor..."
                className="flex-1 bg-transparent text-white text-sm px-3 py-2.5 max-h-32 min-h-[44px] focus:outline-none placeholder:text-slate-600 resize-none custom-scrollbar font-sans"
                rows={1}
             />
             <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-2.5 rounded-lg bg-corp-cyan hover:bg-cyan-400 text-corp-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
             </button>
          </div>
        </div>
        
        <div className="text-center mt-2 flex items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-slate-500 font-medium">
               Powered by Google Gemini
            </span>
        </div>
      </div>
    </div>
  );
};
