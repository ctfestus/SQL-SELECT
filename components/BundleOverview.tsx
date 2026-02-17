
import React from 'react';
import { LearningPath, User, Certificate } from '../types';
import { 
  Briefcase, Target, User as UserIcon, CheckCircle2, ArrowLeft, 
  Globe, Mic, Zap, Award, LayoutGrid, ShieldCheck, Layers, ArrowRight, Sparkles, Terminal, BookOpen, Star, Play, PlusCircle, Loader2
} from 'lucide-react';

interface BundleOverviewProps {
  user: User;
  bundle: LearningPath;
  onBack: () => void;
  onStartCourse: (id: number) => void;
  isEnrolled?: boolean;
  onEnroll?: () => void;
  isCompleted?: boolean;
  certificate?: Certificate;
  onClaimCertificate?: () => void;
  isClaiming?: boolean;
  completedCourseIds?: Set<number>;
}

export const BundleOverview: React.FC<BundleOverviewProps> = ({ 
  user,
  bundle,
  onBack,
  onStartCourse,
  isEnrolled,
  onEnroll,
  isCompleted,
  certificate,
  onClaimCertificate,
  isClaiming,
  completedCourseIds
}) => {
  
  // Calculate total XP based on courses and modules
  const totalCourses = bundle.courses?.length || 0;
  const totalModules = bundle.courses?.reduce((acc, course) => acc + (course.modules?.length || 0), 0) || 0;
  const totalPoints = totalModules * 100;

  return (
    <div className="flex flex-col h-full font-sans text-white animate-in fade-in slide-in-from-right-8 duration-500">
      
      {/* Background Ambience (Local to container) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-corp-royal/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      {/* Navigation / Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-xs uppercase tracking-wider">Back to Paths</span>
        </button>
        
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
            <Layers size={14} className="text-corp-cyan" />
            <span className="text-xs font-mono text-blue-200">Bundle ID: <span className="text-white font-bold">{bundle.id}</span></span>
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
        
        {/* Title Section */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-corp-orange/10 border border-corp-orange/30 text-corp-orange text-xs font-black uppercase tracking-widest mb-4">
              <Globe size={12} /> {bundle.industry} Track
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[0.95] text-white drop-shadow-xl">
              <span className="block text-2xl md:text-3xl mb-2 text-white/90">Career Pathway</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00a4ef] via-[#0453f1] to-[#ff9933]">{bundle.title}</span>
            </h1>

            <p className="text-lg text-blue-200 max-w-3xl font-light leading-relaxed">
              A curated learning path designed for the <strong className="text-white font-bold">{bundle.target_role}</strong> role. 
              Master the complete skill set through {totalCourses} specialized courses.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto space-y-4">
             {!isEnrolled ? (
                 <button 
                    onClick={onEnroll}
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-corp-royal to-corp-cyan hover:shadow-lg hover:shadow-corp-cyan/20 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 shadow-xl border border-white/10"
                 >
                    <PlusCircle size={24} />
                    <span className="text-lg">Enroll in Path</span>
                 </button>
             ) : (
                 <div className="px-8 py-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg">
                    <CheckCircle2 size={24} />
                    <span className="text-lg">Enrolled</span>
                 </div>
             )}

             {isCompleted && isEnrolled && (
                 <>
                    {certificate ? (
                        <div className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg w-full md:w-auto">
                            <Award size={20} />
                            <span>Certificate Earned</span>
                        </div>
                    ) : (
                        <button 
                            onClick={onClaimCertificate}
                            disabled={isClaiming}
                            className="w-full md:w-auto px-8 py-3 bg-corp-royal hover:bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                        >
                            {isClaiming ? <Loader2 size={20} className="animate-spin" /> : <Award size={20} />}
                            <span>{isClaiming ? 'Generating...' : 'Claim Certificate'}</span>
                        </button>
                    )}
                 </>
             )}
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* 1. Path Strategy (Large Card) */}
          <div className="md:col-span-8 bg-corp-dark border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col justify-between group hover:border-corp-cyan/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-corp-royal/10 rounded-full blur-[80px] -z-0 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-corp-royal flex items-center justify-center shadow-lg shadow-corp-royal/30">
                  <Briefcase size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold">Path Strategy</h2>
              </div>
              <p className="text-lg text-blue-100 leading-relaxed font-light">
                {bundle.description}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-6 text-sm text-slate-400 font-mono relative z-10">
               <span className="flex items-center gap-2"><LayoutGrid size={14} className="text-corp-cyan"/> Multi-Course</span>
               <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-green-400"/> Certification Ready</span>
            </div>
          </div>

          {/* 2. Rewards & Role (Side Stack) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            
            {/* Rewards Card */}
            <div className="bg-corp-dark border border-corp-orange/30 backdrop-blur-xl rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-corp-orange/20 rounded-full blur-2xl"></div>
               <div>
                 <div className="text-corp-orange text-xs font-black uppercase tracking-widest mb-1">Total Path Value</div>
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
                 <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Target Role</span>
               </div>
               <div className="text-2xl font-bold text-white leading-tight">{bundle.target_role}</div>
               <div className="mt-2 text-sm text-blue-200">End-to-end competency development.</div>
            </div>
          </div>

          {/* 3. Curriculum / Courses List (Full Width) */}
          <div className="md:col-span-12 space-y-4">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 pl-2">
                <BookOpen size={20} className="text-corp-cyan" /> 
                Included Courses 
                <span className="text-sm font-normal text-slate-400 ml-2">({totalCourses})</span>
            </h3>
            
            {bundle.courses && bundle.courses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {bundle.courses.map((course, idx) => {
                        const isCourseCompleted = completedCourseIds?.has(course.id);
                        return (
                        <div key={course.id} className="group relative bg-black/20 border border-white/10 hover:border-corp-cyan/50 hover:bg-black/30 rounded-2xl p-6 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 overflow-hidden">
                            {/* Sequence Number */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border shadow-lg shrink-0 transition-colors ${
                                isCourseCompleted ? 'bg-green-500 text-white border-green-600' : 'bg-white/5 text-white border-white/10 group-hover:bg-corp-cyan group-hover:text-corp-dark'
                            }`}>
                                {isCourseCompleted ? <CheckCircle2 size={24} /> : idx + 1}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-lg font-bold text-white group-hover:text-corp-cyan transition-colors truncate">{course.title}</h4>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                        course.skill_level === 'Advanced' ? 'bg-red-500/10 text-red-300 border-red-500/20' : 
                                        course.skill_level === 'Practical' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-green-500/10 text-green-300 border-green-500/20'
                                    }`}>
                                        {course.skill_level}
                                    </span>
                                    {isCourseCompleted && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                                            Completed
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-1">{course.main_context}</p>
                            </div>

                            {/* Meta & Action */}
                            <div className="flex items-center gap-6 shrink-0 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                                    <Layers size={14} /> {course.modules?.length || 0} Modules
                                </div>
                                {isEnrolled ? (
                                    <button 
                                        onClick={() => onStartCourse(course.id)}
                                        className={`${
                                            isCourseCompleted 
                                            ? 'bg-white/5 hover:bg-white/10 text-slate-300' 
                                            : 'bg-white/10 hover:bg-corp-cyan hover:text-corp-dark text-white shadow-lg group-hover:shadow-corp-cyan/20'
                                        } px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2`}
                                    >
                                        {isCourseCompleted ? 'Review' : 'Start'} <Play size={14} className="fill-current" />
                                    </button>
                                ) : (
                                    <button 
                                        disabled
                                        className="bg-white/5 text-slate-500 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-not-allowed border border-white/5"
                                    >
                                        Locked <ShieldCheck size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            ) : (
                <div className="p-8 text-center text-slate-500 italic bg-white/5 rounded-2xl border border-white/5 border-dashed">
                    No courses have been added to this path yet.
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
