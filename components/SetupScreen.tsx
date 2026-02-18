
import React, { useState, useEffect } from 'react';
import { Industry, Difficulty, User, SubscriptionTier, PlanSettings, Course } from '../types';
import { fetchPublishedCourses } from '../services/supabaseService';
import {
   Briefcase, Activity, ShoppingCart, Code2, Truck, Megaphone,
   Target, BarChart, Sparkles, Terminal, Database, ChevronRight,
   Zap, Mic, CheckCircle2, Play, Users, Star, Cpu, Globe, Shield, ArrowDown, LogOut, LogIn,
   User as UserIcon, Lock, Check, Crown, X, ChevronDown, Layers, BookOpen, GraduationCap,
   Award, TrendingUp, MessageSquare, Layout, Share2, XCircle, Bot, Trophy, MousePointer2,
   FileCheck, Linkedin, Download, AlertCircle
} from 'lucide-react';
import { UserProfileDropdown } from './UserProfileDropdown';
import { MegaMenu } from './MegaMenu';

interface SetupScreenProps {
   user: User | null;
   subscriptionTier?: SubscriptionTier;
   onLogout: () => void;
   onLoginRequest: (mode: 'login' | 'signup') => void;
   onStart: (industry: Industry, difficulty: Difficulty, customContext?: string) => void;
   onNavigateDashboard?: () => void;
   onNavigateCourses?: () => void;
   onShowPricing: () => void;
   planSettings?: PlanSettings | null;
   onNavigateAdmin?: () => void;
   onShowSettings?: () => void;
}

const INDUSTRY_IMAGES: Record<Industry, string> = {
   [Industry.ECOMMERCE]: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=600",
   [Industry.FINANCE]: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600",
   [Industry.HEALTHCARE]: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600",
   [Industry.TECH]: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
   [Industry.LOGISTICS]: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600",
   [Industry.MARKETING]: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600",
   [Industry.PERSONALIZED]: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
};

export const SetupScreen: React.FC<SetupScreenProps> = ({
   user,
   subscriptionTier = 'free',
   onLogout,
   onLoginRequest,
   onStart,
   onNavigateDashboard,
   onNavigateCourses,
   onShowPricing,
   planSettings,
   onNavigateAdmin,
   onShowSettings
}) => {
   const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
   const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
   const [customContext, setCustomContext] = useState('');
   const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

   const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
         const headerOffset = 100;
         const elementPosition = element.getBoundingClientRect().top;
         const offsetPosition = elementPosition + window.scrollY - headerOffset;

         window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
         });
      }
   };

   // Prices for Display with PlanSettings fallback
   const basicConfig = planSettings?.basic || { monthly: 50, annual: 499 };
   const proConfig = planSettings?.pro || { monthly: 99, annual: 929 };

   const BASIC_PRICE = billingCycle === 'monthly' ? basicConfig.monthly : basicConfig.annual;
   const PRO_PRICE = billingCycle === 'monthly' ? proConfig.monthly : proConfig.annual;

   return (
      <div className="min-h-screen bg-corp-blue text-white font-sans selection:bg-corp-cyan/30 overflow-x-hidden">

         {/* Navbar */}
         <nav className="fixed top-0 w-full z-50 bg-corp-blue/90 backdrop-blur-lg border-b border-white/5">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between relative">
               <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
                  {/* REPLACED LOGO */}
                  <div className="flex items-center gap-3">
                  <img 
                     src="https://oxksmvkuimqvagazbove.supabase.co/storage/v1/object/public/Assets/SELECTLOGO.png" 
                     alt="Select Logo" 
                     className="w-20 h-20  object-contain" 
                  />
                  <span className="text-lg font-bold">SELECT</span>
                  </div>
               </button>

               <div className="hidden md:flex items-center gap-6 text-[15.5px] font-medium text-slate-300">
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">Home</button>

                  {/* Learn Mega Menu */}
                  <MegaMenu
                     onNavigateCourses={onNavigateCourses || (() => { })}
                     isLoggedIn={!!user}
                     onStartCourse={(id) => {
                        if (user) {
                           if (onNavigateCourses) onNavigateCourses();
                        } else {
                           onLoginRequest('login');
                        }
                     }}
                  />

                  <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button>

                  {user ? (
                     <div className="flex items-center gap-4">
                        {subscriptionTier !== 'pro' && (
                           <button
                              onClick={onShowPricing}
                              className="bg-gradient-to-r from-corp-orange to-red-500 hover:from-orange-500 hover:to-red-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg shadow-corp-orange/20 transition-all flex items-center gap-2"
                           >
                              <Sparkles size={14} className="fill-white" /> Upgrade
                           </button>
                        )}

                        <UserProfileDropdown
                           user={user}
                           subscriptionTier={subscriptionTier}
                           onLogout={onLogout}
                           onNavigateHome={onNavigateDashboard}
                           onNavigateAdmin={onNavigateAdmin}
                           onShowSettings={onShowSettings}
                           onNavigateChallenges={() => scrollToSection('config-section')}
                        />
                     </div>
                  ) : (
                     <div className="flex items-center gap-4">
                        <button
                           onClick={() => onLoginRequest('login')}
                           className="text-white hover:text-corp-cyan font-bold transition-colors"
                        >
                           Log In
                        </button>
                        <button
                           onClick={() => onLoginRequest('signup')}
                           className="bg-white text-corp-blue hover:bg-slate-200 px-6 py-2.5 rounded-full font-bold transition-colors shadow-lg flex items-center gap-2"
                        >
                           Get Started
                        </button>
                     </div>
                  )}
               </div>
            </div>
         </nav>

         {/* Hero Section */}
         <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-corp-blue">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
               <img
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                  alt="Data Center"
                  className="w-full h-full object-cover opacity-10"
               />
               <div className="absolute inset-0 bg-gradient-to-b from-corp-blue via-corp-blue/90 to-corp-blue"></div>
               <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-corp-royal/30 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">

               {/* Hero Text */}
               <div className="max-w-2xl">
                  <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                     Industry Job-Ready <br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-corp-cyan to-corp-orange">SQL Skills</span>
                  </h1>

                  <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                     Built for aspiring <strong className="text-white font-bold">Data Analysts, Scientists, and Engineers</strong>.
                     Solve real-world business challenges in HR, Finance, and Product Analytics—not just generic syntax drills.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                     <button
                        onClick={() => onLoginRequest('signup')}
                        className="px-8 py-4 bg-corp-royal hover:bg-blue-600 text-white rounded-full font-bold text-lg shadow-[0_0_40px_rgba(4,83,241,0.4)] transition-all hover:scale-105 flex items-center justify-center gap-2"
                     >
                        Start Assessment <ChevronRight size={20} />
                     </button>
                     <button onClick={() => scrollToSection('features')} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold text-lg border border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
                        Explore Features
                     </button>
                  </div>

                  <div className="mt-12 flex items-center gap-4 text-sm text-blue-200 font-medium animate-in fade-in duration-1000 delay-500">
                     <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map(i => (
                           <div key={i} className="w-8 h-8 rounded-full border-2 border-corp-blue bg-slate-700 flex items-center justify-center overflow-hidden">
                              <img src={`https://randomuser.me/api/portraits/thumb/men/${i * 10}.jpg`} alt="User" className="w-full h-full" />
                           </div>
                        ))}
                     </div>
                     <p>Join 10,000+ industry-ready professionals</p>
                  </div>
               </div>

               {/* Hero Visual (Mock Interface) */}
               <div className="hidden lg:block relative perspective-1000 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
                  <div className="relative transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out preserve-3d">
                     {/* Glow Behind */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-corp-cyan to-corp-royal rounded-2xl blur-[60px] opacity-30"></div>

                     {/* Window Frame */}
                     <div className="relative bg-corp-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        {/* Title Bar */}
                        <div className="h-10 bg-black/20 border-b border-white/5 flex items-center px-4 gap-2">
                           <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                           <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                           <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                           <div className="ml-4 text-xs font-mono text-blue-300">challenge_finance_01.sql</div>
                        </div>

                        {/* Code Area */}
                        <div className="p-6 font-mono text-sm leading-relaxed">
                           <div className="flex">
                              <div className="text-blue-400 select-none text-right pr-4 mr-4 border-r border-white/5">
                                 1<br />2<br />3<br />4<br />5<br />6<br />7<br />8
                              </div>
                              <div className="text-blue-100">
                                 <span className="text-corp-cyan font-bold">SELECT</span> <br />
                                 &nbsp;&nbsp;t.transaction_id, <br />
                                 &nbsp;&nbsp;t.amount, <br />
                                 &nbsp;&nbsp;<span className="text-purple-400">AVG</span>(t.amount) <span className="text-corp-cyan font-bold">OVER</span> (<span className="text-corp-cyan font-bold">PARTITION BY</span> t.user_id) <span className="text-corp-cyan font-bold">AS</span> avg_spend<br />
                                 <span className="text-corp-cyan font-bold">FROM</span> transactions t<br />
                                 <span className="text-corp-cyan font-bold">JOIN</span> fraud_flags f <span className="text-corp-cyan font-bold">ON</span> t.id = f.tx_id<br />
                                 <span className="text-corp-cyan font-bold">WHERE</span> f.severity = <span className="text-corp-orange">'HIGH'</span><br />
                                 <span className="text-corp-cyan font-bold">ORDER BY</span> 2 DESC;
                              </div>
                           </div>
                        </div>

                        {/* AI Overlay Mockup */}
                        <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl p-4 flex items-center gap-4 shadow-xl animate-bounce-subtle max-w-[280px]">
                           <div className="w-10 h-10 rounded-full bg-corp-royal flex items-center justify-center shrink-0 relative">
                              <Zap size={20} className="text-white fill-white" />
                              <div className="absolute inset-0 bg-corp-royal rounded-full animate-ping opacity-50"></div>
                           </div>
                           <div>
                              <div className="text-xs font-bold text-corp-cyan mb-1">AI Mentor Active</div>
                              <div className="text-[10px] text-slate-300 leading-tight">"Great use of Window Functions for fraud detection. Consider indexing the 'user_id' column."</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Differentiation Section: Learn by Doing */}
         <section className="py-24 bg-corp-dark relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <div className="container mx-auto px-6 relative z-10">
               <div className="text-center mb-20">
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Stop Watching. Start Solving.</h2>
                  <p className="text-blue-200 text-lg max-w-2xl mx-auto">
                     Employers don't care how many videos you've watched. They care about what you can build.
                     We replaced passive lectures with an <span className="text-corp-cyan font-bold">active coding environment</span>.
                  </p>
               </div>

               <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                  {/* Old Way */}
                  <div className="relative p-8 rounded-3xl border border-white/5 bg-white/[0.02] grayscale opacity-60 hover:opacity-100 transition-all duration-500">
                     <div className="absolute top-4 right-4 text-red-500"><XCircle size={32} /></div>
                     <h3 className="text-xl font-bold text-slate-400 mb-4">The Old Way</h3>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-500">
                           <Play size={20} /> <span>100+ Hours of Theory Videos</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                           <BookOpen size={20} /> <span>Abstract Concepts</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                           <Check size={20} /> <span>Multiple Choice Quizzes</span>
                        </div>
                     </div>
                     <div className="mt-8 h-32 bg-black/40 rounded-xl flex items-center justify-center border border-white/5">
                        <Play size={48} className="text-slate-600" />
                     </div>
                  </div>

                  {/* New Way (SELECT) */}
                  <div className="relative p-8 rounded-3xl border border-corp-cyan/30 bg-gradient-to-br from-corp-blue/20 to-corp-royal/10 shadow-[0_0_50px_rgba(0,164,239,0.1)] transform md:-translate-y-4">
                     <div className="absolute top-4 right-4 text-corp-cyan"><CheckCircle2 size={32} className="fill-corp-cyan/20" /></div>
                     <h3 className="text-xl font-bold text-white mb-4">The SELECT Way</h3>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 text-white">
                           <Terminal size={20} className="text-corp-cyan" /> <span>100% Hands-on Coding</span>
                        </div>
                        <div className="flex items-center gap-3 text-white">
                           <Briefcase size={20} className="text-corp-cyan" /> <span>Real-world Business Cases</span>
                        </div>
                        <div className="flex items-center gap-3 text-white">
                           <Cpu size={20} className="text-corp-cyan" /> <span>AI-Driven Feedback</span>
                        </div>
                     </div>
                     {/* Mock Interactive Element */}
                     <div className="mt-8 p-4 bg-black/60 rounded-xl border border-corp-cyan/20 font-mono text-xs">
                        <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                           <span className="text-green-400 font-bold">✓ Query Executed</span>
                           <span className="text-slate-400">12ms</span>
                        </div>
                        <div className="text-blue-200">
                           Output: 5,430 rows affected.<br />
                           <span className="text-corp-orange">{'>'} Revenue Report Generated.</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Feature Grid (Bento) */}
         <section id="features" className="py-24 bg-corp-blue relative">
            <div className="container mx-auto px-6">
               <div className="mb-16">
                  <div className="text-corp-cyan font-bold uppercase tracking-wider text-sm mb-2">Platform Features</div>
                  <h2 className="text-4xl font-black text-white">Everything You Need to Get Hired</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[280px]">

                  {/* 1. AI Mentor */}
                  <div className="md:col-span-2 bg-gradient-to-br from-corp-dark to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity"><Zap size={120} /></div>
                     <h3 className="text-2xl font-bold text-white mb-2">AI Mentor</h3>
                     <p className="text-slate-400 mb-6 max-w-sm">Context-aware guidance that explains *why* your query failed, not just *that* it failed.</p>
                     {/* Mock Chat UI */}
                     <div className="bg-white/5 rounded-xl p-4 border border-white/5 max-w-md backdrop-blur-sm">
                        <div className="flex gap-3 mb-3">
                           <div className="w-8 h-8 rounded-full bg-corp-royal flex items-center justify-center shrink-0"><Bot size={16} /></div>
                           <div className="bg-white/10 rounded-r-xl rounded-bl-xl p-3 text-xs text-white">
                              Try using a <code className="text-corp-cyan bg-black/30 px-1 rounded">LEFT JOIN</code> here to include customers with zero orders.
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <input disabled placeholder="Type your question..." className="w-full bg-black/30 rounded-lg px-3 py-2 text-xs border border-white/10" />
                        </div>
                     </div>
                  </div>

                  {/* 2. Rewards System */}
                  <div className="md:col-span-1 bg-corp-dark border border-white/10 rounded-3xl p-6 relative flex flex-col items-center justify-center text-center overflow-hidden hover:border-corp-orange/50 transition-colors">
                     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-corp-orange/10 to-transparent"></div>
                     <div className="relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-corp-orange/20 text-corp-orange flex items-center justify-center mx-auto mb-4 border border-corp-orange/30">
                           <Award size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Gamified Mastery</h3>
                        <p className="text-xs text-slate-400">Earn XP, streaks, and badges.</p>

                        {/* Mock Toast */}
                        <div className="mt-6 bg-corp-dark border border-corp-orange/30 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg animate-bounce">
                           <Star size={14} className="text-yellow-400 fill-yellow-400" />
                           <span className="text-xs font-bold text-white">+50 XP Earned</span>
                        </div>
                     </div>
                  </div>

                  {/* 3. Leaderboard */}
                  <div className="md:col-span-1 bg-corp-dark border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-400" /> Leaderboard</h3>
                     <div className="space-y-3">
                        {[1, 2, 3].map((rank) => (
                           <div key={rank} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                              <div className="flex items-center gap-3">
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rank === 1 ? 'bg-yellow-400 text-black' : 'bg-slate-700 text-white'}`}>{rank}</div>
                                 <div className="w-16 h-2 bg-slate-700 rounded-full"></div>
                              </div>
                              <span className="text-xs font-mono text-corp-cyan font-bold">{1000 - (rank * 50)} XP</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* 4. Live Expert Review */}
                  <div className="md:col-span-2 lg:col-span-2 bg-corp-dark border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-corp-cyan/30 transition-all duration-300">
                     <div className="flex flex-col h-full justify-between relative z-10">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                                 <CheckCircle2 size={12} /> Instant Feedback
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">Intelligent Code Review</h3>
                              <p className="text-slate-400 text-sm max-w-sm">Get real code reviews from our AI engine, mimicking senior data professionals.</p>
                           </div>
                        </div>

                        {/* IDE Mockup */}
                        <div className="mt-4 bg-[#0d1117] rounded-xl border border-white/10 p-0 font-mono text-xs overflow-hidden relative shadow-2xl">
                           {/* Tab Bar */}
                           <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                              <div className="flex gap-1.5">
                                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                 <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                              </div>
                              <span className="text-[10px] text-slate-500 ml-2">query.sql</span>
                           </div>

                           {/* Editor Content */}
                           <div className="p-4 relative">
                              <div className="text-slate-600 absolute left-3 top-4 text-right w-4 select-none">1</div>
                              <div className="pl-8">
                                 <span className="text-purple-400">SELECT</span> * <span className="text-purple-400">FROM</span> sales_records
                              </div>

                              {/* Comment Bubble Overlay */}
                              <div className="absolute top-2 right-4 transform translate-y-2 bg-corp-dark border border-green-500/30 text-slate-300 p-3 rounded-lg rounded-tr-none shadow-xl max-w-[220px] animate-in slide-in-from-right-4 fade-in duration-700 z-10">
                                 <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-white/5">
                                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                       <Bot size={12} />
                                    </div>
                                    <span className="text-[10px] font-bold text-green-400">Senior DB Admin</span>
                                 </div>
                                 <p className="text-[10px] leading-relaxed">
                                    "Avoid <code className="text-orange-300 bg-white/5 px-1 rounded">SELECT *</code> in production. List columns explicitly for index optimization."
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* 5. Certificates */}
                  <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-r from-corp-royal/20 to-corp-blue/20 border border-white/10 rounded-3xl p-8 flex items-center justify-between relative overflow-hidden group hover:border-corp-cyan/30 transition-all duration-300">
                     <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                           <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-corp-cyan/10 border border-corp-cyan/20 text-corp-cyan text-[10px] font-bold uppercase tracking-wider mb-2">
                              <FileCheck size={12} /> Verified Credential
                           </div>
                           <h3 className="text-2xl font-bold text-white mb-2">Career-Ready Certificates</h3>
                           <p className="text-blue-200 text-sm mb-6 max-w-xs">Shareable credentials that prove your job-readiness to employers.</p>
                        </div>

                        <div className="flex gap-3">
                           <button className="bg-white text-corp-blue px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-lg">
                              <Linkedin size={14} /> Add to LinkedIn
                           </button>
                           <button className="bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-white/20 transition-colors">
                              <Download size={14} /> PDF
                           </button>
                        </div>
                     </div>

                     {/* Certificate Mockup */}
                     <div className="absolute right-[-20px] bottom-[-40px] w-64 h-48 bg-white rounded-xl shadow-2xl rotate-[-6deg] transform group-hover:rotate-0 group-hover:translate-y-[-10px] transition-all duration-500 border-4 border-white/50 p-1">
                        <div className="h-full w-full border border-slate-200 rounded-lg p-4 bg-white flex flex-col items-center relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-corp-royal to-corp-cyan"></div>
                           <div className="w-8 h-8 rounded-full bg-corp-dark/10 mb-2"></div>
                           <div className="h-2 w-24 bg-slate-800 rounded mb-1"></div>
                           <div className="h-1 w-32 bg-slate-300 rounded mb-4"></div>

                           <div className="mt-auto w-full flex justify-between items-end">
                              <div className="h-8 w-8 bg-corp-orange/20 rounded-full flex items-center justify-center">
                                 <Award size={16} className="text-corp-orange" />
                              </div>
                              <div className="h-6 w-16 bg-green-100 border border-green-200 rounded flex items-center justify-center">
                                 <span className="text-[8px] font-bold text-green-700 uppercase tracking-wider">Verified</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

               </div>
            </div>
         </section>

         {/* Specialization Tracks */}
         <section className="py-24 bg-corp-dark border-t border-white/5">
            <div className="container mx-auto px-6">
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Choose Your Specialization</h2>
                  <p className="text-blue-200 text-lg">Don't be a generalist. Master the domain that hires you.</p>
               </div>

               <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                     { icon: TrendingUp, title: "FinTech Analytics", desc: "Fraud detection, ledger analysis, and risk scoring.", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
                     { icon: Users, title: "HR Analytics", desc: "Retention modeling, diversity metrics, and performance tracking.", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
                     { icon: ShoppingCart, title: "Product Analytics", desc: "User retention, funnel analysis, and A/B test results.", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
                     { icon: Activity, title: "Healthcare Data", desc: "Patient outcomes, resource utilization, and compliance reporting.", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
                  ].map((track, idx) => (
                     <div key={idx} className={`p-6 rounded-2xl border ${track.border} bg-corp-blue/20 hover:bg-corp-blue/40 transition-colors group cursor-default`}>
                        <div className={`w-12 h-12 rounded-xl ${track.bg} ${track.color} flex items-center justify-center mb-4 border ${track.border}`}>
                           <track.icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{track.title}</h3>
                        <p className="text-sm text-slate-400">{track.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Pricing Section */}
         <section id="pricing" className="py-24 bg-corp-blue border-t border-white/10 relative overflow-hidden">
            <div className="container mx-auto px-6 text-center relative z-10">
               <h2 className="text-4xl font-black mb-4">Invest in Your Career</h2>
               <p className="text-blue-200 max-w-2xl mx-auto mb-16">
                  Unlock the full potential of AI mentorship with plans designed for serious learners.
               </p>

               <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

                  {/* Free Plan */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all text-left">
                     <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                        <Shield size={24} className="text-slate-300" />
                     </div>
                     <h3 className="text-xl font-bold mb-2">Free Starter</h3>
                     <div className="text-3xl font-black mb-6">GHS 0<span className="text-sm font-medium text-slate-400">/mo</span></div>
                     <ul className="space-y-4 mb-8 text-sm text-slate-300">
                        <li className="flex items-center gap-3"><Check size={16} /> 2 Free Lessons per course</li>
                        <li className="flex items-center gap-3"><Check size={16} /> AI reviewer</li>
                        <li className="flex items-center gap-3 opacity-50"><X size={16} /> AI tutor and live instructor</li>
                     </ul>
                     <button onClick={() => onLoginRequest('signup')} className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 font-bold transition-colors">Create Account</button>
                  </div>

                  {/* Basic Plan */}
                  <div className="bg-corp-dark/50 border border-corp-cyan/30 rounded-3xl p-8 relative overflow-hidden transform md:-translate-y-4 text-left">
                     <div className="absolute top-0 left-0 w-full h-1 bg-corp-cyan"></div>
                     <div className="w-12 h-12 rounded-2xl bg-corp-cyan/20 flex items-center justify-center mb-6 text-corp-cyan">
                        <Zap size={24} className="fill-current" />
                     </div>
                     <h3 className="text-xl font-bold mb-2 text-white">Basic</h3>
                     <div className="text-3xl font-black mb-6">GHS {BASIC_PRICE}<span className="text-sm font-medium text-slate-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span></div>
                     <ul className="space-y-4 mb-8 text-sm text-blue-100">
                        <li className="flex items-center gap-3"><Check size={16} className="text-corp-cyan" /> Unlimited courses</li>
                        <li className="flex items-center gap-3"><Check size={16} className="text-corp-cyan" /> Unlimited learning paths</li>
                        <li className="flex items-center gap-3"><Check size={16} className="text-corp-cyan" /> Verifiable certificates</li>
                     </ul>
                     <button onClick={() => user ? onShowPricing() : onLoginRequest('signup')} className="w-full py-3 rounded-xl bg-corp-cyan text-corp-dark font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-corp-cyan/20">Get Basic</button>
                  </div>

                  {/* Pro Plan */}
                  <div className="bg-gradient-to-b from-corp-orange/10 to-transparent border border-corp-orange/30 rounded-3xl p-8 relative text-left">
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-corp-orange text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Best Value</div>
                     <div className="w-12 h-12 rounded-2xl bg-corp-orange/20 flex items-center justify-center mb-6 text-corp-orange">
                        <Crown size={24} className="fill-current" />
                     </div>
                     <h3 className="text-xl font-bold mb-2 text-white">Pro Access</h3>
                     <div className="text-3xl font-black mb-6">GHS {PRO_PRICE}<span className="text-sm font-medium text-slate-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span></div>
                     <ul className="space-y-4 mb-8 text-sm text-white">
                        <li className="flex items-center gap-3"><Check size={16} className="text-corp-orange" /> Everything in Basic</li>
                        <li className="flex items-center gap-3"><Check size={16} className="text-corp-orange" /> Unlimited AI Voice Mentor</li>
                        <li className="flex items-center gap-3"><Check size={16} className="text-corp-orange" /> Verifiable Certificates</li>
                        <li className="flex items-center gap-3"><Check size={16} className="text-corp-orange" /> Personalized AI tutor</li>
                     </ul>
                     <button onClick={() => user ? onShowPricing() : onLoginRequest('signup')} className="w-full py-3 rounded-xl bg-gradient-to-r from-corp-orange to-red-500 text-white font-bold hover:from-orange-500 hover:to-red-600 transition-all shadow-lg shadow-corp-orange/20">Go Pro</button>
                  </div>

               </div>
            </div>
         </section>

         {/* Footer */}
         <footer className="py-12 border-t border-white/10 bg-[#06069d]">
            <div className="container mx-auto px-6 text-center">
               <div className="flex items-center justify-center gap-2 mb-6 opacity-50">
                  <ChevronRight size={24} />
                  <span className="text-xl font-bold">SELECT by FestMan</span>
               </div>
               <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
                  Empowering the next generation of data professionals with AI-driven, industry-specific training.
               </p>
               <div className="text-slate-500 text-xs">
                  &copy; {new Date().getFullYear()} SELECT. All rights reserved.
               </div>
            </div>
         </footer>

      </div>
   );
};
