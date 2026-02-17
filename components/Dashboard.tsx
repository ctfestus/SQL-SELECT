
import React, { useState, useEffect } from 'react';
import { User, Industry, Difficulty, UserStats, SavedChallenge, Course, LearningPath, Certificate, UserAchievement } from '../types';
import { 
  Trophy, Flame, Target, Clock, ArrowRight, Play, Star, 
  TrendingUp, Shield, Zap, BookOpen, Crown, ChevronRight,
  Code2, Terminal, Activity, ShoppingCart, Truck, Megaphone, Sparkles, LogOut, CheckCircle2, ChevronDown, LayoutDashboard, List, Lock, Settings, Layers, Globe, Grid, Award, Medal, Rocket, BarChart3, GraduationCap, Package, X, Eye, Download, Share2, Maximize2, Loader2, FileText, CheckCircle, Library, Linkedin, Menu
} from 'lucide-react';
import { fetchLeaderboard, fetchPublishedChallenges, fetchPublishedCourses, fetchAllUserAttempts, fetchPublishedLearningPaths, fetchUserCertificates, fetchUserEnrollments, fetchUserModuleProgress, fetchUserPathEnrollments, updatePathEnrollmentStatus, enrollInLearningPath, fetchUserAchievements, fetchCompletedCourseCount } from '../services/supabaseService';
import { generateCertificate } from '../services/certificateService';
import { UserProfileDropdown } from './UserProfileDropdown';
import { MegaMenu } from './MegaMenu';
import { BundleOverview } from './BundleOverview';
import { CertificateModal } from './CertificateModal';
import { ACHIEVEMENTS } from '../constants';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onStart: (industry: Industry, difficulty: Difficulty, customContext?: string, startIndex?: number, resume?: boolean) => void;
  onStartSaved?: (id: number, industry: string, difficulty: string) => void;
  onStartCourse?: (id: number) => void;
  onNavigateHome: () => void;
  onNavigateCourses?: () => void;
  onShowPricing: () => void;
  onUserUpdate: (updatedUser: User) => void;
  onNavigateAdmin?: () => void;
  onShowSettings?: () => void;
  stats: UserStats;
}

const INDUSTRY_ICONS: Record<string, any> = {
  [Industry.ECOMMERCE]: ShoppingCart,
  [Industry.FINANCE]: TrendingUp,
  [Industry.HEALTHCARE]: Activity,
  [Industry.TECH]: Code2,
  [Industry.LOGISTICS]: Truck,
  [Industry.MARKETING]: Megaphone,
  [Industry.PERSONALIZED]: Sparkles,
};

const INDUSTRY_IMAGES: Record<string, string> = {
  [Industry.ECOMMERCE]: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=600",
  [Industry.FINANCE]: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600",
  [Industry.HEALTHCARE]: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600",
  [Industry.TECH]: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
  [Industry.LOGISTICS]: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600",
  [Industry.MARKETING]: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600",
  [Industry.PERSONALIZED]: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
};

const ICONS: Record<string, any> = {
  Zap, Star, BookOpen, Shield, Crown, Trophy, Award, Flame, GraduationCap, Library, Layers
};

const getIndustryIcon = (name: string) => {
    if (!name) return Globe;
    if (INDUSTRY_ICONS[name]) return INDUSTRY_ICONS[name];
    const key = Object.keys(INDUSTRY_ICONS).find(k => k.toLowerCase() === name.toLowerCase());
    if (key) return INDUSTRY_ICONS[key];
    const lower = name.toLowerCase();
    if (lower.includes('finance') || lower.includes('bank') || lower.includes('fintech')) return TrendingUp;
    if (lower.includes('tech') || lower.includes('saas') || lower.includes('code')) return Code2;
    if (lower.includes('health') || lower.includes('med')) return Activity;
    if (lower.includes('shop') || lower.includes('commerce')) return ShoppingCart;
    if (lower.includes('market')) return Megaphone;
    return Globe;
};

const getIndustryColor = (industry: string) => {
    const map: Record<string, string> = {
        [Industry.ECOMMERCE]: 'from-orange-500 to-red-500',
        [Industry.FINANCE]: 'from-emerald-500 to-teal-600',
        [Industry.HEALTHCARE]: 'from-rose-500 to-pink-600',
        [Industry.TECH]: 'from-blue-500 to-indigo-600',
        [Industry.LOGISTICS]: 'from-amber-500 to-orange-600',
        [Industry.MARKETING]: 'from-purple-500 to-violet-600',
        [Industry.PERSONALIZED]: 'from-slate-500 to-slate-700',
    };
    return map[industry] || 'from-blue-500 to-indigo-600';
};

interface LeaderboardItem {
  rank: number;
  name: string;
  xp: number;
  avatar: string;
  isUser?: boolean;
}

interface ProgressItem {
    id: string; 
    type: 'track' | 'course' | 'path';
    title: string;
    subtitle: string;
    icon: any;
    progressPercent: number;
    completedCount: number;
    totalCount: number;
    isCompleted: boolean;
    lastActive?: boolean;
    onContinue: () => void;
}

type DashboardTab = 'my-courses' | 'all-courses' | 'paths' | 'leaderboard' | 'certificates';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onStart, onStartSaved, onStartCourse, onNavigateHome, onNavigateCourses, onShowPricing, onUserUpdate, onNavigateAdmin, onShowSettings, stats }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('my-courses');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [savedChallenges, setSavedChallenges] = useState<SavedChallenge[]>([]);
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [publishedPaths, setPublishedPaths] = useState<LearningPath[]>([]);
  const [customContext, setCustomContext] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  
  const [inProgressItems, setInProgressItems] = useState<ProgressItem[]>([]);
  const [completedItems, setCompletedItems] = useState<ProgressItem[]>([]);
  const [enrolledPathIds, setEnrolledPathIds] = useState<Set<number>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [completedCourseIds, setCompletedCourseIds] = useState<Set<number>>(new Set());
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [selectedBundle, setSelectedBundle] = useState<LearningPath | null>(null);
  const [userCertificates, setUserCertificates] = useState<Certificate[]>([]);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [completedCoursesCount, setCompletedCoursesCount] = useState(0);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const lbData = await fetchLeaderboard();
      const userEntry = lbData.find(item => item.name === user.username);
      const enhancedData = lbData.map(item => ({
          ...item,
          isUser: item.name === user.username
      }));
      setLeaderboard(enhancedData);

      const savedData = await fetchPublishedChallenges();
      setSavedChallenges(savedData || []);

      const courseData = await fetchPublishedCourses();
      setPublishedCourses(courseData || []);

      const pathData = await fetchPublishedLearningPaths();
      setPublishedPaths(pathData || []);
      
      if (user.id) {
          await processUserProgress(user.id, courseData || [], pathData || []);
          const certs = await fetchUserCertificates(user.id);
          setUserCertificates(certs || []);
          
          const achievements = await fetchUserAchievements(user.id);
          setUserAchievements(achievements || []);
          
          const courseCount = await fetchCompletedCourseCount(user.id);
          setCompletedCoursesCount(courseCount);
      }
    };
    loadData();
  }, [user.username]);

  const processUserProgress = async (userId: string, courses: Course[], paths: LearningPath[]) => {
      setLoadingProgress(true);
      try {
          const [enrollments, moduleProgress, pathEnrollments] = await Promise.all([
              fetchUserEnrollments(userId),
              fetchUserModuleProgress(userId), // Now the single source of truth for Course completions
              fetchUserPathEnrollments(userId)
          ]);

          const courseProgress = new Map<number, Set<number>>(); // courseId -> Set(moduleId)
          const activityMap = new Map<string, number>();
          const pathEnrollmentSet = new Set<number>(pathEnrollments.map((e: any) => Number(e.path_id)));
          setEnrolledPathIds(pathEnrollmentSet);
          
          // Map completed modules to courses
          moduleProgress.forEach((mp: any) => {
              if (!courseProgress.has(mp.course_id)) courseProgress.set(mp.course_id, new Set());
              courseProgress.get(mp.course_id)?.add(mp.module_id);
          });

          const calculatedInProgress: ProgressItem[] = [];
          const calculatedCompleted: ProgressItem[] = [];
          const tempCompletedIds = new Set<string>();
          const tempCompletedCourseIds = new Set<number>();
          
          const activeBundleIds = new Set<number>();

          // 1. Process Learning Paths (Bundles)
          paths.forEach(path => {
              const pathCourses = path.courses || [];
              if (pathCourses.length === 0) return;

              let totalModules = 0;
              let completedModules = 0;
              let lastActiveTime = 0;
              
              // Calculate next active course for deep linking
              let nextCourseId: number | null = null;

              pathCourses.forEach(c => {
                  totalModules += c.modules?.length || 0;
                  const completedSet = courseProgress.get(c.id);
                  const cTotal = c.modules?.length || 0;
                  const cCount = completedSet?.size || 0;
                  
                  if (completedSet) completedModules += completedSet.size;
                  
                  // Check enrollment for this course
                  const enrollment = enrollments.find((e: any) => e.course_id === c.id);
                  if (enrollment) {
                      const time = new Date(enrollment.last_accessed).getTime();
                      if (time > lastActiveTime) lastActiveTime = time;
                  }

                  // Determine individual course completion
                  const isCourseDone = (cCount >= cTotal && cTotal > 0) || enrollment?.status === 'completed';
                  if (isCourseDone) {
                      tempCompletedCourseIds.add(c.id);
                  }
                  
                  // Identify first course that is NOT fully completed
                  if (nextCourseId === null && !isCourseDone) {
                      nextCourseId = c.id;
                  }
              });
              
              if (!nextCourseId && pathCourses.length > 0) nextCourseId = pathCourses[0].id;

              const pathEnrollment = pathEnrollments.find((e: any) => e.path_id === path.id);
              const isExplicitlyEnrolled = !!pathEnrollment;

              // Only consider started if EXPLICITLY enrolled, matching the new requirement.
              if (isExplicitlyEnrolled) {
                  activeBundleIds.add(path.id);
                  const percent = totalModules > 0 ? Math.min(100, Math.round((completedModules / totalModules) * 100)) : 0;
                  
                  // Logic to verify and sync completion status
                  const isDoneCalc = totalModules > 0 && completedModules >= totalModules;
                  
                  // If calculation says done but DB doesn't, update DB
                  if (isDoneCalc && pathEnrollment?.status !== 'completed') {
                      updatePathEnrollmentStatus(userId, path.id, 'completed');
                  } 
                  // If not done but status is stale, ensure it's in_progress
                  else if (!isDoneCalc && pathEnrollment?.status !== 'in_progress' && pathEnrollment?.status !== 'completed') {
                      updatePathEnrollmentStatus(userId, path.id, 'in_progress');
                  }

                  const isDone = isDoneCalc || pathEnrollment?.status === 'completed';

                  const item: ProgressItem = {
                      id: `path-${path.id}`,
                      type: 'path',
                      title: path.title,
                      subtitle: `${pathCourses.length} Courses`,
                      icon: Package,
                      progressPercent: percent,
                      completedCount: completedModules,
                      totalCount: totalModules,
                      isCompleted: isDone,
                      onContinue: () => {
                          if (nextCourseId && onStartCourse && !isDone) {
                              // Deep link to next course
                              onStartCourse(nextCourseId);
                          } else {
                              // Go to bundle overview
                              setSelectedBundle(path);
                              setActiveTab('paths');
                          }
                      }
                  };
                  
                  if (pathEnrollment.enrolled_at) {
                      const enrolledTime = new Date(pathEnrollment.enrolled_at).getTime();
                      if (enrolledTime > lastActiveTime) lastActiveTime = enrolledTime;
                  }
                  if (lastActiveTime > 0) activityMap.set(item.id, lastActiveTime);

                  if (isDone) {
                      calculatedCompleted.push(item);
                      tempCompletedIds.add(`path-${path.id}`);
                  } else {
                      calculatedInProgress.push(item);
                  }
              }
          });

          // 2. Process Explicit Enrollments (Courses)
          enrollments.forEach((enrollment: any) => {
              const course = courses.find(c => c.id === enrollment.course_id);
              if (!course) return; // Maybe unpublished?

              // Filter out if part of an active bundle to avoid duplicates in the UI
              // Since we strictly check activeBundleIds which comes from EXPLICIT path enrollment,
              // users who take a course from a bundle without enrolling in the bundle will see the course here.
              const isPartOfActiveBundle = paths.some(p => activeBundleIds.has(p.id) && p.courses?.some(c => c.id === course.id));
              
              const completedSet = courseProgress.get(course.id) || new Set();
              const total = course.modules?.length || 0;
              const count = completedSet.size;
              const percent = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
              
              // We rely on either the DB enrollment status being 'completed' OR all modules being done.
              const isDone = (count >= total && total > 0) || enrollment.status === 'completed';
              
              if (isDone) {
                  tempCompletedCourseIds.add(course.id);
              }

              if (isPartOfActiveBundle) return;

              const item: ProgressItem = {
                  id: `course-${course.id}`,
                  type: 'course',
                  title: course.title,
                  subtitle: course.industry,
                  icon: getIndustryIcon(course.industry),
                  progressPercent: percent,
                  completedCount: count,
                  totalCount: total,
                  isCompleted: isDone,
                  onContinue: () => {
                      if (onStartCourse) onStartCourse(course.id);
                  }
              };

              if (enrollment.last_accessed) {
                  activityMap.set(item.id, new Date(enrollment.last_accessed).getTime());
              }

              if (isDone) {
                  calculatedCompleted.push(item);
                  tempCompletedIds.add(`course-${course.id}`);
              } else {
                  calculatedInProgress.push(item);
              }
          });

          calculatedInProgress.sort((a, b) => {
              const timeA = activityMap.get(a.id) || 0;
              const timeB = activityMap.get(b.id) || 0;
              return timeB - timeA; 
          });

          if (calculatedInProgress.length > 0) {
              calculatedInProgress[0].lastActive = true;
              for(let i = 1; i < calculatedInProgress.length; i++) {
                  calculatedInProgress[i].lastActive = false;
              }
          }

          setInProgressItems(calculatedInProgress);
          setCompletedItems(calculatedCompleted);
          setCompletedIds(tempCompletedIds);
          setCompletedCourseIds(tempCompletedCourseIds);

      } catch (e) {
          console.error("Error processing progress", e);
      } finally {
          setLoadingProgress(false);
      }
  };

  // ... (handleEnrollInPath, handleClaimCertificate, handleStartPath, NavItem) ...
  const handleEnrollInPath = async (pathId: number) => {
      if (user.id) {
          await enrollInLearningPath(user.id, pathId);
          // Refresh progress to show enrollment update
          await processUserProgress(user.id, publishedCourses, publishedPaths);
      }
  };

  const handleClaimCertificate = async (title: string, type: 'path' | 'course', industry: string) => {
      if (!user.id) return;
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

  const handleStartPath = () => {
    if (selectedIndustry && selectedDifficulty) {
       if (selectedIndustry === Industry.PERSONALIZED && stats.subscriptionTier !== 'pro') {
           onShowPricing();
           return;
       }
       onStart(selectedIndustry, selectedDifficulty, customContext);
    }
  };

  const NavItem = ({ icon: Icon, label, id, badge }: { icon: any, label: string, id: DashboardTab, badge?: string }) => (
    <button
      onClick={() => {
          setActiveTab(id);
          setSelectedBundle(null);
          setIsMobileMenuOpen(false); // Close mobile menu when item is selected
      }}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 group relative overflow-hidden ${
        activeTab === id 
        ? 'bg-white text-[#1916c2] shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
        : 'text-blue-200 hover:bg-white/10 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3 relative z-10">
        <Icon size={18} className={activeTab === id ? 'text-[#1916c2]' : 'text-blue-300 group-hover:text-white transition-colors'} />
        <span>{label}</span>
      </div>
      {badge && (
        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest relative z-10 ${
            activeTab === id ? 'bg-[#1916c2] text-white' : 'bg-corp-orange text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  // Combine static definition with user progress
  const displayAchievements = ACHIEVEMENTS.map(ach => {
      const unlocked = userAchievements.find(ua => ua.achievement_key === ach.id);
      
      let progress = 0;
      if (ach.type === 'challenge') progress = stats.totalCompleted;
      else if (ach.type === 'xp') progress = stats.totalPoints;
      else if (ach.type === 'streak') progress = stats.streak;
      else if (ach.type === 'course') progress = completedCoursesCount;

      return {
          ...ach,
          isUnlocked: !!unlocked,
          unlockedAt: unlocked?.unlocked_at,
          progress: Math.min(progress, ach.target)
      };
  });

  return (
    <div className="min-h-screen bg-[#1916c2] font-sans text-white overflow-x-hidden selection:bg-corp-cyan/30 flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#1916c2]"></div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#1916c2]/80 backdrop-blur-xl border-b border-white/10 h-16 shrink-0">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
                <Menu size={24} />
            </button>

            <button 
              onClick={onNavigateHome}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
            >
              <div className="bg-white p-1.5 rounded-lg shadow-lg shadow-white/10">
                 <ChevronRight size={20} className="text-[#1916c2]" />
              </div>
              <span className="font-black text-lg tracking-tight text-white hidden sm:inline">SELECT <span className="text-blue-300 font-normal"></span></span>
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-[15px] font-bold text-blue-200">
              <button onClick={onNavigateHome} className="hover:text-white cursor-pointer transition-colors hover:bg-white/10 px-3 py-1.5 rounded-lg">Home</button>
              <MegaMenu 
                onNavigateCourses={onNavigateCourses || (() => setActiveTab('all-courses'))}
                isLoggedIn={true}
                onStartCourse={onStartCourse}
                onStartChallenge={(id, ind, diff) => onStartSaved && onStartSaved(id, ind, diff)}
              />
              <button onClick={onShowPricing} className="hover:text-white cursor-pointer transition-colors hover:bg-white/10 px-3 py-1.5 rounded-lg">Pricing</button>
              
              <div className="h-6 w-px bg-white/20 mx-2"></div>

              {stats.subscriptionTier !== 'pro' && (
                <button 
                  onClick={onShowPricing}
                  className="bg-corp-orange hover:bg-orange-500 text-white px-4 py-1.5 rounded-full font-black text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Sparkles size={14} className="fill-white" /> Upgrade
                </button>
              )}
            </div>

            {/* Profile Dropdown (Visible on Mobile too) */}
            <div className="pl-2 border-l border-transparent md:border-white/10">
                <UserProfileDropdown 
                    user={user}
                    subscriptionTier={stats.subscriptionTier}
                    onLogout={onLogout}
                    onNavigateHome={onNavigateHome}
                    onNavigateAdmin={onNavigateAdmin}
                    onShowSettings={onShowSettings}
                />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-out Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="absolute top-0 left-0 bottom-0 w-3/4 max-w-xs bg-[#09069d] border-r border-white/10 shadow-2xl p-6 flex flex-col gap-6 animate-in slide-in-from-left duration-300">
                <div className="flex items-center justify-between">
                    <span className="font-black text-xl text-white flex items-center gap-2">
                        <ChevronRight size={20} className="text-corp-cyan" /> Menu
                    </span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-2 px-4">Navigation</div>
                    <NavItem icon={BookOpen} label="My Learning" id="my-courses" />
                    <NavItem icon={Layers} label="Course Catalog" id="all-courses" />
                    <NavItem icon={Package} label="Learning Paths" id="paths" badge="New" />
                    <NavItem icon={Award} label="Certificates" id="certificates" />
                    <NavItem icon={Crown} label="Leaderboard" id="leaderboard" />
                </div>

                <div className="bg-[#000000]/30 rounded-xl p-4 border border-white/10 space-y-3 mt-auto">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Stats</div>
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-xl font-mono font-bold text-corp-cyan">{stats.totalPoints.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Total XP</div>
                        </div>
                        <div className="text-right">
                            <div className="text-base font-mono font-bold text-orange-400 flex items-center justify-end gap-1">
                                <Flame size={14} className="fill-orange-400" /> {stats.streak}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Streak</div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
      )}

      <div className="flex flex-1 container mx-auto px-4 md:px-6 pt-6 pb-12 gap-8 relative z-10">
        
        <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-6">
           <div className="bg-black/20 border border-white/10 backdrop-blur-md rounded-2xl p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar flex flex-col gap-6 shadow-xl">
              
              <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-sm text-[#1916c2] shadow-md">
                    {user.username.substring(0, 2).toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{user.username}</div>
                    <div className="text-[10px] text-blue-200 font-mono flex items-center gap-1">
                       <Shield size={10} /> {stats.subscriptionTier === 'free' ? 'Basic Plan' : stats.subscriptionTier + ' Plan'}
                    </div>
                 </div>
              </div>

              <div className="space-y-1">
                 <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-2 px-4">Menu</div>
                 <NavItem icon={BookOpen} label="My Learning" id="my-courses" />
                 <NavItem icon={Layers} label="Course Catalog" id="all-courses" />
                 <NavItem icon={Package} label="Learning Paths" id="paths" badge="New" />
                 <NavItem icon={Award} label="Certificates" id="certificates" />
                 <NavItem icon={Crown} label="Leaderboard" id="leaderboard" />
              </div>

              <div className="bg-[#000000]/30 rounded-xl p-4 border border-white/10 space-y-3">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Stats</div>
                 <div className="flex justify-between items-end">
                    <div>
                       <div className="text-2xl font-mono font-bold text-corp-cyan">{stats.totalPoints.toLocaleString()}</div>
                       <div className="text-[10px] text-slate-400 font-bold uppercase">Total XP</div>
                    </div>
                    <div className="text-right">
                       <div className="text-lg font-mono font-bold text-orange-400 flex items-center justify-end gap-1">
                          <Flame size={16} className="fill-orange-400" /> {stats.streak}
                       </div>
                       <div className="text-[10px] text-slate-400 font-bold uppercase">Day Streak</div>
                    </div>
                 </div>
                 <div className="h-1 bg-white/10 rounded-full overflow-hidden w-full">
                    <div className="h-full bg-gradient-to-r from-corp-cyan to-corp-royal w-[70%]"></div>
                 </div>
              </div>
           </div>
        </aside>

        <main className="flex-1 min-w-0">
           
           {activeTab === 'my-courses' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                 
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/10">
                    <div>
                       <h1 className="text-4xl font-black text-white mb-2">Welcome back, {user.username.split(' ')[0]}</h1>
                       <p className="text-blue-200">Ready to continue your journey?</p>
                    </div>
                    {inProgressItems.length > 0 && inProgressItems[0].lastActive && (
                        <button 
                           onClick={inProgressItems[0].onContinue}
                           className="flex items-center gap-3 bg-white hover:bg-blue-50 text-[#1916c2] px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] transform hover:-translate-y-0.5 group"
                        >
                           <Play size={18} className="fill-current" />
                           Resume Learning
                           <span className="text-xs opacity-70 border-l border-[#1916c2]/20 pl-3 ml-1 uppercase tracking-wider">{inProgressItems[0].title}</span>
                        </button>
                    )}
                 </div>

                 <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                       
                       {/* In Progress Section */}
                       <div>
                          <div className="flex items-center gap-2 mb-4">
                             <Clock size={18} className="text-corp-cyan" />
                             <h2 className="text-lg font-bold text-white uppercase tracking-wider">In Progress</h2>
                          </div>
                          
                          {inProgressItems.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {inProgressItems.map(item => {
                                      let bgImage = INDUSTRY_IMAGES[item.title as Industry] || INDUSTRY_IMAGES[item.subtitle as Industry];
                                      if (!bgImage) {
                                          const key = Object.keys(INDUSTRY_IMAGES).find(k => 
                                              k.toLowerCase() === item.title.toLowerCase() || 
                                              item.title.toLowerCase().includes(k.toLowerCase()) ||
                                              k.toLowerCase() === item.subtitle.toLowerCase()
                                          );
                                          if (key) bgImage = INDUSTRY_IMAGES[key];
                                      }
                                      if (!bgImage) bgImage = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600";

                                      return (
                                          <button 
                                              key={item.id}
                                              onClick={item.onContinue}
                                              className="group relative w-full h-48 rounded-2xl border border-white/10 hover:border-corp-cyan/50 overflow-hidden text-left shadow-lg hover:shadow-xl transition-all"
                                          >
                                              <div className="absolute inset-0 z-0">
                                                  <img 
                                                      src={bgImage} 
                                                      alt={item.title} 
                                                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                  />
                                                  <div className="absolute inset-0 bg-corp-dark/80 group-hover:bg-corp-dark/70 transition-colors duration-300"></div>
                                                  <div className="absolute inset-0 bg-gradient-to-t from-corp-dark via-transparent to-transparent opacity-90"></div>
                                              </div>

                                              <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                                                  
                                                  <div className="flex justify-between items-start">
                                                      <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors group-hover:text-corp-cyan shadow-sm">
                                                          <item.icon size={24} />
                                                      </div>
                                                      {item.lastActive && (
                                                          <div className="bg-corp-cyan text-corp-dark text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
                                                              <Play size={10} className="fill-current" /> Latest
                                                          </div>
                                                      )}
                                                  </div>

                                                  <div>
                                                      <div className="flex items-center gap-2 mb-1.5 opacity-90">
                                                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-black/40 backdrop-blur-md ${
                                                              item.type === 'path' ? 'text-green-300 border-green-500/30' :
                                                              item.type === 'course' ? 'text-purple-300 border-purple-500/30' : 
                                                              'text-blue-300 border-blue-500/30'
                                                          }`}>
                                                              {item.type === 'path' ? 'Learning Path' : item.type === 'course' ? 'Course' : 'Track'}
                                                          </span>
                                                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{item.subtitle}</span>
                                                      </div>
                                                      
                                                      <div className="flex items-end justify-between gap-4 mb-3">
                                                          <h3 className="text-xl font-black text-white leading-none shadow-black drop-shadow-md truncate flex-1">{item.title}</h3>
                                                          <div className="text-xs font-mono font-bold text-corp-cyan bg-corp-cyan/10 px-2 py-0.5 rounded border border-corp-cyan/20">
                                                              {item.progressPercent}%
                                                          </div>
                                                      </div>

                                                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                                          <div className="h-full bg-corp-cyan shadow-[0_0_10px_rgba(0,164,239,0.5)] rounded-full relative transition-all duration-500" style={{ width: `${item.progressPercent}%` }}>
                                                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse"></div>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          </button>
                                      )
                                  })}
                              </div>
                          ) : loadingProgress ? (
                              <div className="p-12 text-center border border-dashed border-white/20 rounded-2xl animate-pulse bg-white/5 text-slate-300">Retrieving curriculum data...</div>
                          ) : (
                             <div className="p-12 text-center border border-dashed border-white/20 rounded-3xl bg-black/10 flex flex-col items-center gap-4 hover:border-corp-cyan/30 transition-colors">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-400 mb-2">
                                   <Rocket size={32} />
                                </div>
                                <div>
                                   <h3 className="text-lg font-bold text-white">Start Your First Project</h3>
                                   <p className="text-blue-200 text-sm max-w-xs mx-auto mt-1">Explore our industry-specific paths to begin your SQL mastery.</p>
                                </div>
                                <button onClick={() => setActiveTab('all-courses')} className="px-6 py-2.5 bg-corp-cyan text-corp-dark rounded-xl font-bold text-sm hover:bg-cyan-400 transition-colors mt-2 shadow-lg shadow-corp-cyan/20">Browse Catalog</button>
                             </div>
                          )}
                       </div>

                       {completedItems.length > 0 && (
                           <div>
                              <div className="flex items-center gap-2 mb-4">
                                 <CheckCircle2 size={18} className="text-green-400" />
                                 <h2 className="text-lg font-bold text-white uppercase tracking-wider">Completed</h2>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {completedItems.map(item => (
                                      <div key={item.id} className="bg-black/20 border border-green-500/20 rounded-xl p-4 flex items-center justify-between hover:bg-green-500/5 transition-all">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                                                  <CheckCircle2 size={20} />
                                              </div>
                                              <div>
                                                  <h4 className="font-bold text-white text-sm">{item.title}</h4>
                                                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-wide">Completed</p>
                                              </div>
                                          </div>
                                          <button onClick={item.onContinue} className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all">Review</button>
                                      </div>
                                  ))}
                              </div>
                           </div>
                       )}
                    </div>

                    {/* Achievements Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-black/20 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-lg backdrop-blur-md">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-corp-orange/10 rounded-full blur-[50px] pointer-events-none"></div>
                            
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <Award size={20} className="text-corp-orange" />
                                    <h3 className="font-bold text-white">Achievements</h3>
                                </div>
                                <div className="text-xs text-slate-400 font-bold bg-white/5 px-2 py-1 rounded">
                                    {displayAchievements.filter(a => a.isUnlocked).length} / {displayAchievements.length}
                                </div>
                            </div>

                            <div className="space-y-3 relative z-10 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {displayAchievements.map((item) => {
                                    const Icon = ICONS[item.iconName] || Trophy;
                                    return (
                                        <div key={item.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${item.isUnlocked ? `bg-white/5 ${item.bg}` : 'bg-black/20 border-white/5 opacity-50 grayscale'}`}>
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.isUnlocked ? item.color + ' bg-black/20 shadow-sm' : 'bg-white/5 text-slate-500'}`}>
                                                <Icon size={18} className={item.isUnlocked ? "fill-current" : ""} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-bold truncate ${item.isUnlocked ? 'text-white' : 'text-slate-400'}`}>{item.title}</div>
                                                <div className="text-[10px] text-slate-400">{item.description}</div>
                                                
                                                {!item.isUnlocked ? (
                                                    <div className="mt-2 h-1 bg-black/40 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full bg-slate-600`} style={{width: `${(item.progress / item.target) * 100}%`}}></div>
                                                    </div>
                                                ) : item.unlockedAt && (
                                                    <div className="text-[9px] text-green-400 mt-1 flex items-center gap-1">
                                                        Unlocked {new Date(item.unlockedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                                    </div>
                                                )}
                                            </div>
                                            {item.isUnlocked && <CheckCircle2 size={16} className="text-green-400 shrink-0" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-3xl p-6 text-center shadow-lg">
                            <h4 className="font-bold text-blue-200 mb-2 text-sm uppercase tracking-wide">Keep the streak alive!</h4>
                            <div className="text-4xl font-black text-white mb-2">{stats.streak} <span className="text-lg font-medium text-slate-400">Days</span></div>
                            <p className="text-xs text-blue-200">Consistency is key to mastering SQL. Complete a challenge today.</p>
                        </div>
                    </div>
                 </div>
              </div>
           )}

           {/* ... (Other tabs - unchanged logic, just kept in structure) ... */}
           {activeTab === 'paths' && (
               // ... existing paths code
               <div className="space-y-8 animate-in fade-in duration-300">
                   {!selectedBundle ? (
                       <>
                           <div className="flex justify-between items-center border-b border-white/10 pb-6">
                               <div>
                                   <h2 className="text-3xl font-black text-white mb-2">Learning Paths</h2>
                                   <p className="text-blue-200">Comprehensive bundles designed for role mastery.</p>
                               </div>
                           </div>
                           
                           {publishedPaths.length > 0 ? (
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                   {publishedPaths.map(path => {
                                       const isCompleted = completedIds.has(`path-${path.id}`);
                                       const isEnrolled = enrolledPathIds.has(path.id);
                                       const existingCert = userCertificates.find(c => c.course_title === path.title);
                                       
                                       return (
                                       <button 
                                           key={path.id}
                                           onClick={() => setSelectedBundle(path)}
                                           className="flex flex-col text-left p-0 rounded-2xl bg-black/20 border border-white/10 hover:border-corp-cyan/50 hover:shadow-xl hover:shadow-corp-cyan/10 transition-all group relative overflow-hidden h-full backdrop-blur-sm"
                                       >
                                           <div className="h-2 bg-gradient-to-r from-corp-royal to-corp-cyan w-full"></div>
                                           {isCompleted && (
                                               <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg z-10">
                                                   <CheckCircle2 size={12} /> Completed
                                               </div>
                                           )}
                                           {isEnrolled && !isCompleted && (
                                               <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg z-10">
                                                   <Play size={10} className="fill-current" /> Enrolled
                                               </div>
                                           )}
                                           <div className="p-6 flex flex-col h-full">
                                               <div className="flex justify-between items-start mb-4">
                                                   <div className="flex flex-col gap-1.5">
                                                       <span className="text-[10px] font-bold uppercase tracking-wider text-corp-cyan bg-corp-cyan/10 px-2 py-1 rounded w-fit border border-corp-cyan/20">
                                                           {path.industry}
                                                       </span>
                                                       <h3 className="font-bold text-white text-xl group-hover:text-corp-cyan transition-colors line-clamp-2">{path.title}</h3>
                                                   </div>
                                                   <div className="p-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400">
                                                       <Package size={20} />
                                                   </div>
                                               </div>
                                               
                                               <p className="text-sm text-slate-300 mb-6 line-clamp-3 leading-relaxed flex-1">{path.description}</p>
                                               
                                               {isCompleted && (
                                                   <div className="mb-4">
                                                       {existingCert ? (
                                                           <div 
                                                               onClick={(e) => { e.stopPropagation(); setViewingCertificate(existingCert); }}
                                                               className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors"
                                                           >
                                                               <Award size={14} /> View Certificate
                                                           </div>
                                                       ) : (
                                                           <div 
                                                               onClick={(e) => { e.stopPropagation(); handleClaimCertificate(path.title, 'path', path.industry); }}
                                                               className="w-full bg-corp-royal hover:bg-blue-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
                                                           >
                                                               {isGeneratingCert ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />} 
                                                               {isGeneratingCert ? 'Minting...' : 'Claim Certificate'}
                                                           </div>
                                                       )}
                                                   </div>
                                               )}
                                               
                                               <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400 w-full group-hover:text-white transition-colors mt-auto">
                                                   <span className="flex items-center gap-1.5"><Target size={14}/> {path.target_role}</span>
                                                   <span className="flex items-center gap-1.5"><Layers size={14}/> {path.courses?.length || 0} Courses</span>
                                               </div>
                                           </div>
                                       </button>
                                   )})}
                               </div>
                           ) : (
                               <div className="text-center py-20 text-slate-400 border border-dashed border-white/10 rounded-3xl bg-black/10">No learning paths available yet.</div>
                           )}
                       </>
                   ) : (
                       <BundleOverview 
                           user={user}
                           bundle={selectedBundle}
                           onBack={() => setSelectedBundle(null)}
                           onStartCourse={(id) => { 
                               if(onStartCourse) onStartCourse(id); 
                           }}
                           isEnrolled={enrolledPathIds.has(selectedBundle.id)}
                           onEnroll={() => handleEnrollInPath(selectedBundle.id)}
                           isCompleted={completedIds.has(`path-${selectedBundle.id}`)}
                           certificate={userCertificates.find(c => c.course_title === selectedBundle.title)}
                           onClaimCertificate={() => handleClaimCertificate(selectedBundle.title, 'path', selectedBundle.industry)}
                           isClaiming={isGeneratingCert}
                           completedCourseIds={completedCourseIds}
                       />
                   )}
               </div>
           )}

           {activeTab === 'all-courses' && (
              // ... existing all-courses code ...
              <div className="space-y-8 animate-in fade-in duration-300">
                 <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <div>
                       <h2 className="text-3xl font-black text-white mb-2">Course Catalog</h2>
                       <p className="text-blue-200">Structured learning paths designed by industry experts.</p>
                    </div>
                 </div>
                 
                 {publishedCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {publishedCourses.map(course => {
                           const isCompleted = completedCourseIds.has(course.id);
                           const existingCert = userCertificates.find(c => c.course_title === course.title);
                           const IndustryIcon = getIndustryIcon(course.industry);

                           return (
                           <div 
                              key={course.id}
                              onClick={() => onStartCourse && onStartCourse(course.id)}
                              className="group relative flex flex-col bg-[#1f1bc3] border border-white/10 rounded-2xl overflow-hidden hover:border-corp-cyan/50 transition-all duration-300 h-full hover:-translate-y-1 hover:shadow-2xl hover:shadow-corp-cyan/10 cursor-pointer"
                           >
                              {/* Colored Header Bar */}
                              <div className={`h-1.5 w-full bg-gradient-to-r ${getIndustryColor(course.industry)}`}></div>
                              
                              <div className="p-6 flex-1 flex flex-col">
                                  {/* Header: Icon + Badge */}
                                  <div className="flex justify-between items-start mb-4">
                                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getIndustryColor(course.industry)} flex items-center justify-center text-white shadow-lg`}>
                                           <IndustryIcon size={20} />
                                      </div>
                                      {isCompleted ? (
                                          <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                              <CheckCircle2 size={12} /> Done
                                          </div>
                                      ) : (
                                          <div className="flex items-center gap-1 bg-white/5 border border-white/10 text-slate-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                              {course.skill_level}
                                          </div>
                                      )}
                                  </div>

                                  {/* Title & Context */}
                                  <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-corp-cyan transition-colors line-clamp-2">
                                      {course.title}
                                  </h3>
                                  <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-3 flex-1">
                                      {course.main_context}
                                  </p>

                                  {/* Meta Info */}
                                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                       <div className="flex flex-col">
                                           <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Role Focus</span>
                                           <span className="text-xs text-blue-100 font-medium">{course.target_role}</span>
                                       </div>
                                       <div className="text-right flex flex-col items-end">
                                           <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Content</span>
                                           <span className="text-xs text-blue-100 font-medium">{course.modules?.length || 0} Modules</span>
                                       </div>
                                  </div>
                              </div>

                              {/* Action Footer */}
                              <div className="p-4 bg-white/[0.02] border-t border-white/5">
                                  {isCompleted ? (
                                       <div className="flex gap-2">
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); if(onStartCourse) onStartCourse(course.id); }}
                                              className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5 transition-colors"
                                           >
                                              Review
                                           </button>
                                           {existingCert ? (
                                               <button 
                                                  onClick={(e) => { e.stopPropagation(); setViewingCertificate(existingCert); }}
                                                  className="flex-1 py-2.5 rounded-lg bg-corp-cyan/10 text-corp-cyan font-bold text-xs hover:bg-corp-cyan/20 transition-colors border border-corp-cyan/20"
                                               >
                                                  Certificate
                                               </button>
                                           ) : (
                                               <button 
                                                  onClick={(e) => { e.stopPropagation(); handleClaimCertificate(course.title, 'course', course.industry); }}
                                                  disabled={isGeneratingCert}
                                                  className="flex-1 py-2.5 rounded-lg bg-corp-royal hover:bg-blue-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                               >
                                                  {isGeneratingCert ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />} Claim
                                               </button>
                                           )}
                                       </div>
                                  ) : (
                                       <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-corp-royal hover:text-white text-blue-100 font-bold text-sm transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                                           Start Learning <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                                       </button>
                                  )}
                              </div>
                           </div>
                        )})}
                    </div>
                 ) : (
                    <div className="text-center py-20 text-slate-400 border border-dashed border-white/10 rounded-3xl bg-black/10">No courses available. Check back soon.</div>
                 )}
              </div>
           )}

           {activeTab === 'certificates' && (
              // ... existing certificates code ...
              <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-8 pb-6 border-b border-white/10">
                    <div>
                      <h2 className="text-3xl font-black text-white mb-2">My Credentials</h2>
                      <p className="text-blue-200">Official verified certificates earned from your achievements.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4 mt-4 md:mt-0 backdrop-blur-sm">
                       <Award size={24} className="text-corp-orange" />
                       <div>
                          <div className="text-2xl font-bold text-white leading-none">{userCertificates.length}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Certifications</div>
                       </div>
                    </div>
                  </div>

                  {userCertificates.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {userCertificates.map((cert) => {
                              const issueDate = new Date(cert.issued_at);
                              const linkedinUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.course_title)}&organizationName=FestMan&issueYear=${issueDate.getFullYear()}&issueMonth=${issueDate.getMonth() + 1}&certId=${encodeURIComponent(cert.id)}&certUrl=${encodeURIComponent(cert.certificate_url)}`;
                              
                              return (
                              <div key={cert.id} className="group relative bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-corp-cyan/50 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-corp-cyan/10 flex flex-col h-full">
                                 <div className="relative aspect-[4/3] overflow-hidden bg-black/20 p-6 flex items-center justify-center cursor-pointer group/image" onClick={() => setViewingCertificate(cert)}>
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                                    <div className="absolute inset-0 bg-corp-royal/5 group-hover:bg-corp-royal/10 transition-colors"></div>
                                    
                                    <img src={cert.certificate_url} alt={cert.course_title} className="w-full h-full object-contain shadow-lg transform group-hover/image:scale-105 transition-transform duration-500 rounded-lg relative z-10" />
                                    
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm z-20">
                                       <span className="flex items-center gap-2 bg-white text-corp-dark px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transform translate-y-4 group-hover/image:translate-y-0 transition-transform shadow-lg">
                                          <Maximize2 size={14} /> View Credential
                                       </span>
                                    </div>
                                 </div>

                                 <div className="p-6 flex-1 flex flex-col bg-[#05041a]/50 backdrop-blur-sm">
                                    <div className="flex items-start justify-between mb-4">
                                       <div className="flex-1 pr-4">
                                          <div className="text-[10px] font-bold text-corp-cyan uppercase tracking-wider mb-1 flex items-center gap-1">
                                             <CheckCircle2 size={12} className="text-corp-cyan fill-corp-cyan/20" /> Verified
                                          </div>
                                          <h3 className="text-lg font-bold text-white leading-tight line-clamp-2" title={cert.course_title}>{cert.course_title}</h3>
                                       </div>
                                       <div className="bg-white/5 p-2 rounded-lg text-slate-400 group-hover:text-white transition-colors border border-white/5">
                                          <Award size={18} />
                                       </div>
                                    </div>
                                    
                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                       <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">Issued: {issueDate.toLocaleDateString()}</span>
                                       
                                       <div className="flex gap-2">
                                          <button 
                                             onClick={() => setViewingCertificate(cert)} 
                                             className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors border border-white/5" 
                                             title="View"
                                          >
                                             <Eye size={16} />
                                          </button>
                                          <a 
                                             href={cert.certificate_url}
                                             download={`Certificate-${cert.course_title.replace(/\s+/g, '-')}.png`}
                                             className="p-2 bg-white/5 hover:bg-corp-cyan/20 rounded-lg text-slate-400 hover:text-corp-cyan transition-colors border border-white/5 hover:border-corp-cyan/30" 
                                             title="Download"
                                             target="_blank"
                                             rel="noreferrer"
                                          >
                                             <Download size={16} />
                                          </a>
                                          <a
                                             href={linkedinUrl}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="p-2 bg-white/5 hover:bg-corp-royal/20 rounded-lg text-slate-400 hover:text-corp-royal transition-colors border border-white/5 hover:border-corp-royal/30"
                                             title="Add to LinkedIn"
                                          >
                                             <Linkedin size={16} />
                                          </a>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                          )})}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center py-24 bg-black/20 border border-white/10 border-dashed rounded-[2rem] text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-t from-corp-dark to-transparent opacity-50"></div>
                          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                              <Award size={40} className="text-slate-500 group-hover:text-corp-cyan transition-colors" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2 relative z-10">No Certificates Yet</h3>
                          <p className="text-slate-400 max-w-md mx-auto mb-8 relative z-10 text-sm">
                              Complete a full learning path or course to earn your first verified credential. 
                              Your certificates will appear here.
                          </p>
                          <button 
                              onClick={() => setActiveTab('all-courses')} 
                              className="px-8 py-3 bg-corp-cyan hover:bg-cyan-400 text-corp-dark font-black rounded-xl transition-all shadow-lg shadow-corp-cyan/20 relative z-10 flex items-center gap-2 hover:-translate-y-0.5"
                          >
                              Start Learning <ArrowRight size={16} />
                          </button>
                      </div>
                  )}
              </div>
           )}

           {activeTab === 'leaderboard' && (
              // ... existing leaderboard code ...
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                  <div className="flex justify-between items-end mb-8 pb-6 border-b border-white/10">
                    <div>
                      <h2 className="text-3xl font-black text-white mb-2">Global Rankings</h2>
                      <p className="text-blue-200">Top performers across all industry tracks.</p>
                    </div>
                    <div className="bg-gradient-to-r from-corp-orange to-red-500 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-lg shadow-corp-orange/20">
                       <Trophy size={24} className="text-white" />
                       <div>
                          <div className="text-2xl font-bold text-white leading-none">#{leaderboard.find(i => i.isUser)?.rank || '-'}</div>
                          <div className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Your Rank</div>
                       </div>
                    </div>
                  </div>

                  <div className="bg-corp-dark border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                      {leaderboard.length > 0 ? (
                          <div className="divide-y divide-white/5">
                              {leaderboard.map((item) => (
                                  <div 
                                    key={item.rank} 
                                    className={`flex items-center p-6 gap-6 transition-colors ${
                                        item.isUser 
                                        ? 'bg-corp-cyan/10 hover:bg-corp-cyan/20' 
                                        : 'hover:bg-white/5'
                                    }`}
                                  >
                                      <div className={`w-12 h-12 flex items-center justify-center font-black text-xl rounded-xl shrink-0 ${
                                          item.rank === 1 ? 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/20' :
                                          item.rank === 2 ? 'bg-slate-300 text-slate-800 shadow-lg shadow-slate-300/20' :
                                          item.rank === 3 ? 'bg-orange-400 text-orange-900 shadow-lg shadow-orange-400/20' :
                                          'bg-white/5 text-slate-500 border border-white/5'
                                      }`}>
                                          {item.rank <= 3 ? <Crown size={20} className="fill-current" /> : item.rank}
                                      </div>
                                      
                                      <div className="flex items-center gap-4 flex-1 min-w-0">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shadow-sm ${
                                              item.isUser ? 'bg-corp-cyan text-corp-dark border-corp-cyan' : 'bg-white/10 text-slate-300 border-white/10'
                                          }`}>
                                              {item.avatar}
                                          </div>
                                          <div>
                                              <div className={`font-bold text-lg ${item.isUser ? 'text-corp-cyan' : 'text-white'}`}>
                                                  {item.name} {item.isUser && '(You)'}
                                              </div>
                                              <div className="text-xs text-slate-500 font-mono">
                                                  Level {Math.floor(item.xp / 1000) + 1} • Data Scientist
                                              </div>
                                          </div>
                                      </div>

                                      <div className="text-right">
                                          <div className="text-xl font-black text-white font-mono">{item.xp.toLocaleString()}</div>
                                          <div className="text-[10px] font-bold text-corp-orange uppercase tracking-wider">Total XP</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="p-12 text-center text-slate-500">
                              Leaderboard is updating...
                          </div>
                      )}
                  </div>
              </div>
           )}

        </main>
      </div>

      {selectedIndustry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-corp-dark border border-white/10 rounded-3xl shadow-2xl p-8 max-w-lg w-full relative">
                  <button 
                      onClick={() => setSelectedIndustry(null)}
                      className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                      <X size={20} />
                  </button>

                  <div className="mb-6">
                      <div className="inline-flex items-center gap-2 text-corp-cyan mb-2">
                          <Globe size={20} />
                          <span className="font-bold uppercase tracking-wider text-sm">{selectedIndustry}</span>
                      </div>
                      <h2 className="text-2xl font-black text-white">Configure Path</h2>
                  </div>

                  {selectedIndustry === Industry.PERSONALIZED && (
                      <div className="mb-6">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Scenario Context</label>
                          <textarea 
                              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan outline-none resize-none h-32"
                              placeholder="Describe your custom scenario..."
                              value={customContext}
                              onChange={(e) => setCustomContext(e.target.value)}
                          />
                      </div>
                  )}

                  <div className="mb-8">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Proficiency Level</label>
                      <div className="grid grid-cols-2 gap-4">
                          {(['Beginner', 'Intermediate'] as Difficulty[]).map(diff => (
                              <button
                                  key={diff}
                                  onClick={() => setSelectedDifficulty(diff)}
                                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                                      selectedDifficulty === diff 
                                      ? 'bg-corp-royal/20 border-corp-royal text-white shadow-lg' 
                                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                  }`}
                              >
                                  <span className="font-bold">{diff}</span>
                                  {selectedDifficulty === diff && <CheckCircle2 size={16} className="text-corp-royal" />}
                              </button>
                          ))}
                      </div>
                  </div>

                  <button 
                      onClick={handleStartPath}
                      disabled={selectedIndustry === Industry.PERSONALIZED && !customContext.trim()}
                      className="w-full py-4 bg-gradient-to-r from-corp-royal to-corp-cyan hover:shadow-lg hover:shadow-corp-cyan/20 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Start Assessment <ArrowRight size={18} />
                  </button>
              </div>
          </div>
      )}

      {viewingCertificate && (
          <CertificateModal 
              certificate={viewingCertificate} 
              onClose={() => setViewingCertificate(null)} 
          />
      )}

    </div>
  );
};
