
import React, { useState, useEffect } from 'react';
import { User, Course, SavedChallenge, SubscriptionTier, Industry, Difficulty, Certificate } from '../types';
import { fetchPublishedCourses, fetchPublishedChallenges, fetchUserEnrollments, fetchUserModuleProgress, fetchUserCertificates } from '../services/supabaseService';
import { generateCertificate } from '../services/certificateService';
import { UserProfileDropdown } from './UserProfileDropdown';
import { MegaMenu } from './MegaMenu';
import { CertificateModal } from './CertificateModal';
import { Code2, Layers, Target, Search, BookOpen, Crown, Zap, Shield, ArrowRight, LayoutDashboard, Filter, Sparkles, Clock, Globe, ShoppingCart, TrendingUp, Activity, Truck, Megaphone, X, Lock, CheckCircle2, Award, Loader2, FileText, Play } from 'lucide-react';

interface CoursesPageProps {
  user: User | null;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateDashboard: () => void;
  onNavigateAdmin?: () => void;
  onShowSettings?: () => void;
  onStartCourse: (id: number) => void;
  onStartSaved: (id: number, industry: string, difficulty: string) => void;
  onStart: (industry: Industry, difficulty: Difficulty, customContext?: string) => void;
  onLoginRequest: () => void;
  subscriptionTier: SubscriptionTier;
  onShowPricing: () => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
  user,
  onLogout,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateAdmin,
  onShowSettings,
  onStartCourse,
  onStartSaved,
  onStart,
  onLoginRequest,
  subscriptionTier,
  onShowPricing
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'courses'>('all');
  const [completedCourseIds, setCompletedCourseIds] = useState<Set<number>>(new Set());
  
  const [userCertificates, setUserCertificates] = useState<Certificate[]>([]);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const coursesData = await fetchPublishedCourses();
      setCourses(coursesData || []);
      
      if (user?.id) {
          const [enrollments, moduleProgress, certs] = await Promise.all([
              fetchUserEnrollments(user.id),
              fetchUserModuleProgress(user.id),
              fetchUserCertificates(user.id)
          ]);
          
          setUserCertificates(certs || []);

          const completed = new Set<number>();
          
          // 1. Check explicit enrollment status (standalone)
          if (enrollments) {
              enrollments.forEach((e: any) => {
                  if (e.status === 'completed') {
                      completed.add(e.course_id);
                  }
              });
          }

          // 2. Check calculated completion from module progress (bundles & standalone)
          if (moduleProgress && coursesData) {
              const userModules = new Set(moduleProgress.map((mp: any) => mp.module_id));
              
              coursesData.forEach(course => {
                  if (course.modules && course.modules.length > 0) {
                      const allModulesDone = course.modules.every(m => m.id && userModules.has(m.id));
                      if (allModulesDone) {
                          completed.add(course.id);
                      }
                  }
              });
          }

          setCompletedCourseIds(completed);
      }
      setLoading(false);
    };
    loadContent();
  }, [user]);

  const handleClaimCertificate = async (title: string, industry: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user?.id) return;
      setIsGeneratingCert(true);
      try {
          const cert = await generateCertificate(user.username, title, user.id, industry);
          if (cert) {
              setUserCertificates(prev => [cert, ...prev]);
              setViewingCertificate(cert);
          } else {
              alert("Could not generate certificate. Please try again later.");
          }
      } catch (e) {
          console.error(e);
          alert("An error occurred while generating your certificate.");
      } finally {
          setIsGeneratingCert(false);
      }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-corp-blue font-sans text-white overflow-x-hidden selection:bg-corp-cyan/30">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-corp-dark/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={onNavigateHome}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="bg-corp-royal p-1.5 rounded-lg">
                 <Code2 size={20} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">SELECT <span className="text-corp-cyan">| Library</span></span>
            </button>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-[15px] font-medium text-slate-300">
              <button onClick={onNavigateHome} className="hover:text-white cursor-pointer transition-colors">Home</button>
              
              <MegaMenu 
                onNavigateCourses={() => {}} // Already on courses page, maybe refresh?
                isLoggedIn={!!user}
                onStartCourse={(id) => { if(user) onStartCourse(id); else onLoginRequest(); }}
                // Removed onStartChallenge
              />

              <button onClick={onShowPricing} className="hover:text-white cursor-pointer transition-colors">Pricing</button>
              
              {user ? (
                <>
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
                        onNavigateChallenges={() => {}}
                    />
                </>
              ) : (
                <div className="flex items-center gap-4">
                    <button onClick={onLoginRequest} className="text-sm font-bold text-white hover:text-corp-cyan">Log In</button>
                    <button onClick={onLoginRequest} className="bg-white text-corp-blue hover:bg-slate-200 px-4 py-2 rounded-full font-bold transition-colors shadow-lg text-xs">Get Started</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">Learning Library</h1>
            <p className="text-blue-200">Access structured career paths and targeted skill modules.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             {/* Search */}
             <div className="relative group flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-corp-cyan transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search topics..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-corp-cyan/50 focus:ring-1 focus:ring-corp-cyan/20 transition-all"
                />
             </div>
             
             {/* Tabs */}
             <div className="bg-black/20 p-1 rounded-xl border border-white/10 flex overflow-x-auto custom-scrollbar">
                {(['all', 'courses'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-[13.5px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      activeTab === tab 
                      ? 'bg-corp-cyan text-corp-dark shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="space-y-16">
          
          {/* Structured Courses */}
          {(activeTab === 'all' || activeTab === 'courses') && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
               <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                    <Layers size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Career Paths</h2>
               </div>
               
               {filteredCourses.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(course => {
                       const isCompleted = completedCourseIds.has(course.id);
                       const existingCert = userCertificates.find(c => c.course_title === course.title);

                       return (
                       <div 
                          key={course.id}
                          onClick={() => {
                              if (!user) onLoginRequest();
                              else onStartCourse(course.id);
                          }}
                          className="flex flex-col text-left p-6 rounded-2xl bg-[#1f1bc3] border border-white/10 hover:border-corp-cyan/50 hover:bg-white/5 transition-all group relative overflow-hidden h-full cursor-pointer"
                       >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full pointer-events-none group-hover:from-purple-500/20 transition-colors"></div>
                          
                          {isCompleted && (
                               <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg z-10">
                                   <CheckCircle2 size={12} /> Completed
                               </div>
                          )}

                          <div className="flex justify-between items-start mb-4 relative z-10">
                             <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-1 rounded text-slate-300 border border-white/5">
                                {course.industry}
                             </span>
                             <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                                 course.skill_level === 'Advanced' ? 'bg-red-500/10 text-red-300 border-red-500/20' : 
                                 course.skill_level === 'Practical' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-green-500/10 text-green-300 border-green-500/20'
                             }`}>
                                {course.skill_level}
                             </span>
                          </div>
                          
                          <h3 className="font-bold text-white text-xl mb-3 group-hover:text-corp-cyan transition-colors line-clamp-2">{course.title}</h3>
                          <p className="text-sm text-blue-200 mb-6 line-clamp-3 leading-relaxed">{course.main_context}</p>
                          
                          <div className="mt-auto pt-4 border-t border-white/5 w-full">
                             {isCompleted ? (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onStartCourse(course.id); }}
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
                                    >
                                        <FileText size={14} /> Review
                                    </button>
                                    {existingCert ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setViewingCertificate(existingCert); }}
                                            className="flex-1 bg-corp-cyan/10 hover:bg-corp-cyan/20 text-corp-cyan border border-corp-cyan/30 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Award size={14} /> Certificate
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={(e) => handleClaimCertificate(course.title, course.industry, e)}
                                            disabled={isGeneratingCert}
                                            className="flex-1 bg-corp-royal hover:bg-blue-600 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                        >
                                            {isGeneratingCert ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                                            Claim
                                        </button>
                                    )}
                                </div>
                             ) : (
                                <div className="flex items-center justify-between text-xs text-slate-400 font-mono w-full">
                                    <span className="flex items-center gap-1.5"><Target size={14}/> {course.target_role}</span>
                                    <span className="flex items-center gap-1.5"><Layers size={14}/> {course.modules?.length || 'Multiple'} Modules</span>
                                </div>
                             )}
                          </div>
                       </div>
                    )})}
                 </div>
               ) : (
                 <div className="text-slate-500 italic py-8 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">No courses found matching your search.</div>
               )}
            </section>
          )}

        </div>
      </main>

      {viewingCertificate && (
          <CertificateModal 
              certificate={viewingCertificate} 
              onClose={() => setViewingCertificate(null)} 
          />
      )}

    </div>
  );
};
