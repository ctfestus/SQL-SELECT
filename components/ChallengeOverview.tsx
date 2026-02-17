
import React, { useState, useEffect } from 'react';
import { Industry, Difficulty, User } from '../types';
import { BEGINNER_CURRICULUM, INTERMEDIATE_CURRICULUM } from '../constants';
import { generateBusinessBrief } from '../services/geminiService';
import { 
  Briefcase, Target, User as UserIcon, CheckCircle2, ArrowRight, ArrowLeft, 
  Globe, Mic, Zap, Award, Sparkles, Terminal, ShieldCheck, LayoutGrid
} from 'lucide-react';
import { UserProfileDropdown } from './UserProfileDropdown';
import { MegaMenu } from './MegaMenu';

interface ChallengeOverviewProps {
  user: User;
  onLogout: () => void;
  industry: Industry;
  difficulty: Difficulty;
  customContext?: string;
  onStart: () => void;
  onBack: () => void;
  onNavigateDashboard: () => void;
  onNavigateAdmin?: () => void;
  onShowSettings?: () => void;
}

export const ChallengeOverview: React.FC<ChallengeOverviewProps> = ({ 
  user,
  onLogout,
  industry, 
  difficulty, 
  customContext, 
  onStart, 
  onBack,
  onNavigateDashboard,
  onNavigateAdmin,
  onShowSettings
}) => {
  const [dynamicBrief, setDynamicBrief] = useState<string>('');

  const INDUSTRY_BRIEFS: Record<string, string> = {
    [Industry.ECOMMERCE]: "You are joining the data team of 'ShopStream', a rapidly growing global e-commerce platform. The company is facing challenges with inventory management and customer retention. Your task is to query the production database to extract actionable insights, audit order records, and support the marketing team with data-driven segments.",
    [Industry.FINANCE]: "You have been hired as a Data Analyst at 'SecureBank', a leading financial institution. The risk management team needs your help to monitor transaction flows, identify potential fraud patterns, and generate daily liquidity reports. You will work directly with the core banking ledger.",
    [Industry.HEALTHCARE]: "Welcome to 'MediCare Solutions'. As a data specialist, you are responsible for managing sensitive patient records and hospital operational data. The administration needs precise reports on admission rates, treatment efficacy, and resource utilization to improve patient care standards.",
    [Industry.TECH]: "You are the newest member of the DevOps Analytics team at 'CloudScale SaaS'. We track millions of user events daily. Your job is to query log data, analyze feature usage patterns, and help product managers understand user behavior through direct SQL analysis.",
    [Industry.LOGISTICS]: "You are operating at the nerve center of 'GlobalFreight', a logistics giant. With supply chains under pressure, you must query shipment tracking databases to optimize routes, manage fleet allocation, and ensure on-time deliveries across international borders.",
    [Industry.MARKETING]: "You are working for 'AdVantage', a digital marketing agency. Clients need real-time performance metrics on their campaigns. You will query click-stream data and conversion logs to calculate ROAS (Return on Ad Spend) and optimize audience targeting.",
  };

  useEffect(() => {
    if (industry === Industry.PERSONALIZED && customContext) {
      setDynamicBrief("Initializing secure mission profile based on custom parameters...");
      generateBusinessBrief(customContext).then(brief => {
        setDynamicBrief(brief);
      });
    }
  }, [industry, customContext]);

  const getBrief = () => {
    if (industry === Industry.PERSONALIZED) {
      return dynamicBrief || customContext || "You will engage in a series of data challenges relevant to your selected custom scenario.";
    }
    return INDUSTRY_BRIEFS[industry] || "You will engage in a series of data challenges relevant to your selected industry.";
  };

  const getRole = () => {
    return difficulty === 'Beginner' ? 'Junior SQL Analyst' : 'Senior Data Engineer';
  };

  const curriculum = difficulty === 'Beginner' ? BEGINNER_CURRICULUM : INTERMEDIATE_CURRICULUM;
  const skills = curriculum.slice(0, 8); // Show first 8 skills for the overview
  const totalPoints = curriculum.length * 100;

  // Formatting logic for the headline
  const industryName = industry === Industry.PERSONALIZED ? 'Custom' : `The ${industry.split(' ')[0]}`;
  const industrySuffix = industry === Industry.PERSONALIZED ? 'Context' : 'Challenge';

  return (
    <div className="min-h-screen bg-corp-blue font-sans text-white overflow-x-hidden flex flex-col">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-corp-royal/20 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-corp-cyan/10 rounded-full blur-[100px] mix-blend-screen opacity-30"></div>
      </div>

      {/* Navigation - High Z-Index to ensure dropdown floats over content */}
      <nav className="relative z-50 container mx-auto px-6 h-20 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm uppercase tracking-wider">Change Configuration</span>
        </button>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-corp-dark/50 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <Terminal size={14} className="text-corp-cyan" />
            <span className="text-xs font-mono text-blue-200">Environment: <span className="text-white font-bold">Ready</span></span>
          </div>
          
          <MegaMenu 
            onNavigateCourses={onNavigateDashboard} 
            isLoggedIn={true} 
            onStartCourse={onNavigateDashboard}
            onStartChallenge={onNavigateDashboard}
          />

          {/* User Profile Dropdown */}
          <UserProfileDropdown 
             user={user}
             onLogout={onLogout}
             onNavigateHome={onNavigateDashboard}
             onNavigateAdmin={onNavigateAdmin}
             onShowSettings={onShowSettings}
             onNavigateChallenges={onBack}
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 pt-8 pb-32 max-w-7xl">
        
        {/* Header Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-corp-orange/10 border border-corp-orange/30 text-corp-orange text-xs font-black uppercase tracking-widest mb-6">
            <Globe size={12} /> {industry === Industry.PERSONALIZED ? 'Custom Scenario' : industry}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[0.95] text-white drop-shadow-xl">
            <span className="block text-3xl md:text-4xl mb-2 text-white">Real World Project</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00a4ef] via-[#0453f1] to-[#ff9933]">{industryName}</span> <span className="text-white/50">{industrySuffix}<span className="text-corp-orange">.</span></span>
          </h1>

          <p className="text-xl text-blue-200 max-w-3xl font-light leading-relaxed">
            Step into the role of a <strong className="text-white font-bold">{getRole()}</strong>. 
            You will navigate a realistic database schema, solving complex business problems using SQL.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
          
          {/* 1. Mission Brief (Large Card) */}
          <div className="md:col-span-8 bg-corp-dark border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col justify-between group hover:border-corp-cyan/30 transition-all duration-300 relative overflow-hidden">
             {/* Subtle glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-corp-royal/10 rounded-full blur-[80px] -z-0 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-corp-royal flex items-center justify-center shadow-lg shadow-corp-royal/30">
                  <Briefcase size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold">Mission Profile</h2>
              </div>
              <p className="text-lg text-blue-100 leading-relaxed font-light">
                {getBrief()}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-6 text-sm text-slate-400 font-mono relative z-10">
               <span className="flex items-center gap-2"><LayoutGrid size={14} className="text-corp-cyan"/> {difficulty} Schema</span>
               <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-green-400"/> Read-Only Access</span>
            </div>
          </div>

          {/* 2. Rewards & Role (Side Stack) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            
            {/* Rewards Card */}
            <div className="bg-corp-dark border border-corp-orange/30 backdrop-blur-xl rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-corp-orange/20 rounded-full blur-2xl"></div>
               <div>
                 <div className="text-corp-orange text-xs font-black uppercase tracking-widest mb-1">Total Reward</div>
                 <div className="text-4xl font-black text-white">{totalPoints} <span className="text-lg text-corp-orange/70">XP</span></div>
               </div>
               <div className="w-12 h-12 bg-corp-orange text-corp-dark rounded-full flex items-center justify-center shadow-lg shadow-corp-orange/30 animate-pulse">
                 <Award size={24} className="fill-current" />
               </div>
            </div>

            {/* Persona Card */}
            <div className="flex-1 bg-corp-dark border border-white/10 backdrop-blur-xl rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-corp-cyan group-hover:bg-corp-orange transition-colors duration-500"></div>
               <div className="flex items-center gap-3 mb-2">
                 <UserIcon size={20} className="text-corp-cyan" />
                 <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Assigned Persona</span>
               </div>
               <div className="text-2xl font-bold text-white leading-tight">{getRole()}</div>
               <div className="mt-2 text-sm text-blue-200">Authorized to access production logs.</div>
            </div>
          </div>

          {/* 3. AI Features (Row) */}
          <div className="md:col-span-6 bg-corp-dark border border-white/10 backdrop-blur-xl rounded-3xl p-8 hover:border-corp-cyan/30 transition-colors group relative overflow-hidden">
             <div className="w-12 h-12 rounded-2xl bg-corp-cyan/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
               <Mic size={24} className="text-corp-cyan" />
             </div>
             <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-white">
               AI Live Mentor <span className="bg-corp-cyan text-corp-dark text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider">Gemini 2.5</span>
             </h3>
             <p className="text-blue-200 text-sm leading-relaxed">
               Stuck on a query? Activate the real-time voice mentor. 
               It mimics a senior engineer, providing semantic hints and debugging assistance without revealing the answer.
             </p>
          </div>

          {/* Intelligent Feedback Card */}
          <div className="md:col-span-6 bg-corp-dark border border-white/10 backdrop-blur-xl rounded-3xl p-8 hover:border-corp-cyan/30 transition-colors group relative overflow-hidden">
             <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
               <Zap size={24} className="text-purple-300" />
             </div>
             <h3 className="text-xl font-bold mb-3 text-white">Intelligent Feedback Engine</h3>
             <p className="text-blue-200 text-sm leading-relaxed">
               Our engine doesn't just check the output. It analyzes your logic, efficiency, and syntax, providing instant, constructive feedback to help you iterate faster.
             </p>
          </div>

          {/* 4. Curriculum Details (Full Width) */}
          <div className="md:col-span-12 bg-corp-dark border border-white/10 backdrop-blur-xl rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Target size={20} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Technical Requirements</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
               {skills.map((skill, i) => (
                 <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                    <CheckCircle2 size={16} className="text-corp-cyan shrink-0" />
                    <span className="text-sm font-medium text-blue-100">{skill.topic}</span>
                 </div>
               ))}
               <div className="flex items-center gap-3 p-3 rounded-xl bg-corp-cyan/10 border border-corp-cyan/20 justify-center">
                  <span className="text-sm font-bold text-corp-cyan">+ {curriculum.length - skills.length} More Modules</span>
               </div>
            </div>
          </div>

        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 w-full z-50 bg-corp-dark/95 backdrop-blur-lg border-t border-white/10 p-6 md:px-12">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 hidden md:flex">
             <div className="flex flex-col">
               <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Project Status</span>
               <span className="text-white font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Ready to Initialize</span>
             </div>
             <div className="h-8 w-px bg-white/10"></div>
             <div className="flex flex-col">
               <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Est. Time</span>
               <span className="text-white font-bold">~45 Minutes</span>
             </div>
          </div>

          <button 
            onClick={onStart}
            className="w-full md:w-auto bg-gradient-to-r from-corp-royal to-corp-cyan hover:from-blue-600 hover:to-cyan-400 text-white text-lg font-bold px-10 py-4 rounded-xl shadow-[0_0_30px_rgba(0,164,239,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(0,164,239,0.5)] flex items-center justify-center gap-3 group"
          >
            <Sparkles size={20} className="fill-white" />
            Start Project
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

    </div>
  );
};
