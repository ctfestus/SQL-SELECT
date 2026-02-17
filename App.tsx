
// ... existing imports ...
import React, { useState, useEffect } from 'react';
import { AssessmentState, Industry, Difficulty, Challenge, SubmissionResult, SchemaTable, User, UserStats, SubscriptionTier, Course, PlanSettings, Certificate, Achievement, PlanPermission } from './types';
import { BEGINNER_CURRICULUM, INTERMEDIATE_CURRICULUM, DEFAULT_PLAN_SETTINGS, ACHIEVEMENTS } from './constants';
import { generateChallenge, validateSubmission } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { ensureUserProfile, fetchUserStats, updateUserStats, logChallengeAttempt, fetchChallengeAttempts, logDailyActivity, logXpEvent, fetchSavedChallengeById, fetchCourseById, fetchPlanSettings, fetchChallengeFromInventory, saveChallengeToInventory, enrollInCourse, updateEnrollmentStatus, fetchAllUserAttempts, logModuleCompletion, fetchUserModuleProgress, fetchUserAchievements, unlockAchievement, fetchCompletedCourseCount, fetchPlanPermissions, logModuleStart } from './services/supabaseService';
import { generateCertificate } from './services/certificateService';
import { SetupScreen } from './components/SetupScreen';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { CoursesPage } from './components/CoursesPage';
import { ChallengeOverview } from './components/ChallengeOverview';
import { CourseOverview } from './components/CourseOverview';
import { LoginScreen, AuthMode } from './components/LoginScreen';
import { SqlEditor } from './components/SqlEditor';
import { ResultPanel } from './components/ResultPanel';
import { FeedbackModal } from './components/FeedbackModal';
import { LiveSupportPanel } from './components/LiveSupportPanel';
import { ChatPanel } from './components/ChatPanel';
import { PricingModal } from './components/PricingModal';
import { SettingsModal } from './components/SettingsModal';
import { CertificateModal } from './components/CertificateModal';
import { UserProfileDropdown } from './components/UserProfileDropdown';
import { MegaMenu } from './components/MegaMenu';
import { AchievementToast } from './components/AchievementToast';
import { XPToast } from './components/XPToast';
import { CheckCircle, Circle, ArrowRight, BookOpen, Layers, Award, Maximize2, X, FileText, List, Code2, Zap, Lock, Bot, Shield, Loader2, CheckCircle2, ChevronLeft, ChevronRight, MousePointer2, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { McqPanel } from './components/McqPanel';
import { LimitReachedModal } from './components/LimitReachedModal';

// ... existing SchemaTableViewer ...
const SchemaTableViewer: React.FC<{ tables: SchemaTable[] }> = ({ tables }) => {
  if (!tables || tables.length === 0) return <div className="text-blue-200 italic">No schema available.</div>;

  return (
    <div className="space-y-6">
      {tables.map((table, idx) => (
        <div key={idx} className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
             <div className="text-xs font-mono font-bold text-corp-cyan bg-corp-cyan/10 px-2 py-1 rounded border border-corp-cyan/20">
               TABLE: {table.tableName.toUpperCase()}
             </div>
          </div>
          <div className="overflow-x-auto border border-white/10 rounded-lg shadow-sm">
            <table className="w-full text-left text-sm border-collapse bg-[#05046e]">
              <thead>
                <tr>
                  {table.columns.map((col, cIdx) => (
                    <th key={cIdx} className="border-b border-r border-white/10 bg-corp-blue/30 px-3 py-2 text-blue-100 font-mono text-xs font-semibold last:border-r-0 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.data.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border-r border-white/5 px-3 py-2 text-slate-300 font-mono text-xs last:border-r-0 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    totalCompleted: 0,
    streak: 0,
    lastActive: Date.now(),
    lastIndustry: null,
    lastDifficulty: null,
    lastContext: '',
    lastIndex: 0,
    subscriptionTier: 'free'
  });
  const [permissions, setPermissions] = useState<PlanPermission | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'admin' | 'courses'>('landing');
  
  const [state, setState] = useState<AssessmentState>({
    industry: null,
    customContext: '',
    difficulty: null,
    isOverviewConfirmed: false,
    currentQuestionIndex: 0,
    points: 0,
    history: [],
    isComplete: false,
    activeSavedChallengeId: undefined,
    activeCourseId: undefined
  });

  // Track completed course modules specifically from user_module_progress
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<number>>(new Set());
  // Track all started/enrolled modules (including completed)
  const [startedModuleIds, setStartedModuleIds] = useState<Set<number>>(new Set());

  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null); // Store loaded course info
  const [userCode, setUserCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);
  const [isSchemaExpanded, setIsSchemaExpanded] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'mission' | 'chat'>('mission');
  const [showLockedToast, setShowLockedToast] = useState(false);
  const [isModulesPaneCollapsed, setIsModulesPaneCollapsed] = useState(false);
  
  // Certificate State
  const [generatedCert, setGeneratedCert] = useState<Certificate | null>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  
  // Achievement & Notification State
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<Set<string>>(new Set());
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [xpNotification, setXpNotification] = useState<number | null>(null);

  // Init with defaults to ensure UI renders correctly before fetch
  const [planSettings, setPlanSettings] = useState<PlanSettings>(DEFAULT_PLAN_SETTINGS);

  // Mobile Responsiveness State
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanels, setMobilePanels] = useState({
    modules: false,
    instructions: false,
    editor: true,
    results: true
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        initUserSession(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
         setAuthMode('update_password');
         setShowLogin(true);
      }
      
      if (session?.user) {
        initUserSession(session.user);
      } else {
        setUser(null);
        setCurrentView('landing');
        setPermissions(null); // Clear permissions
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch plan settings initially AND whenever the user might have changed them (admin) or needs them (pricing modal)
  useEffect(() => {
      fetchPlanSettings().then(settings => {
          if (settings) setPlanSettings(settings);
      });
  }, [currentView, showPricing]);

  // Fetch Permissions whenever subscription tier changes
  useEffect(() => {
      if (userStats.subscriptionTier) {
          fetchPlanPermissions(userStats.subscriptionTier).then(p => setPermissions(p));
      } else {
          // Fallback to free tier permissions logic if no user? 
          if (user) fetchPlanPermissions('free').then(p => setPermissions(p));
      }
  }, [userStats.subscriptionTier, user]);

  // Unified History Loading Logic
  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
         let attempts: SubmissionResult[] = [];
         let completedSet = new Set<number>();
         let startedSet = new Set<number>();
         let relevantPoints = 0;

         // If we are in a course, fetch module progress for completion + attempts for UI history
         if (state.activeCourseId) {
             const [allAttempts, moduleProgress] = await Promise.all([
                 fetchAllUserAttempts(user.id!),
                 fetchUserModuleProgress(user.id!, state.activeCourseId)
             ]);

             // History for console/feedback retrieval
             attempts = allAttempts.map((row: any) => ({
                questionId: row.question_id,
                query: row.query,
                isCorrect: row.is_correct,
                feedback: '', 
                outputData: [], 
                pointsEarned: row.points_earned,
                timestamp: new Date(row.created_at).getTime()
             }));

             // Official progress source for Courses
             if (moduleProgress) {
                 moduleProgress.forEach((mp: any) => {
                     // Add to started set regardless of status
                     startedSet.add(mp.module_id);
                     
                     if (mp.status === 'completed') {
                         completedSet.add(mp.module_id);
                         relevantPoints += (mp.xp_earned || 0);
                     }
                 });
             }
             
         } else if (state.industry && state.difficulty) {
             // Standard track logic - uses Challenge Attempts table
             attempts = await fetchChallengeAttempts(user.id!, state.industry!, state.difficulty!);
             
             // For tracks, we deduce completion from attempts history
             const uniquePoints = new Map<number, number>();
             attempts.forEach(a => {
                if (a.isCorrect) {
                    completedSet.add(a.questionId);
                    const currentMax = uniquePoints.get(a.questionId) || 0;
                    if (a.pointsEarned > currentMax) {
                        uniquePoints.set(a.questionId, a.pointsEarned);
                    }
                }
             });
             relevantPoints = Array.from(uniquePoints.values()).reduce((a, b) => a + b, 0);
         } else {
             return;
         }

         setCompletedModuleIds(completedSet);
         setStartedModuleIds(startedSet);
         setState(prev => ({
             ...prev,
             history: attempts,
             points: relevantPoints
         }));
    };

    loadHistory();
  }, [state.industry, state.difficulty, state.activeCourseId, currentCourse, user]);

  const initUserSession = async (authUser: any) => {
    const basicUser: User = {
      id: authUser.id,
      username: authUser.user_metadata.username || authUser.email?.split('@')[0] || 'User',
      email: authUser.email
    };
    
    const profile = await ensureUserProfile(basicUser);
    
    if (profile) {
      basicUser.username = profile.username;
      basicUser.isAdmin = profile.is_admin;
    }
    
    setUser(basicUser);
    loadStats(basicUser.id!);
    
    // Load Achievements
    fetchUserAchievements(basicUser.id!).then(achievements => {
        if (achievements) {
            setUnlockedAchievementIds(new Set(achievements.map(a => a.achievement_key)));
        }
    });
    
    // Intelligently set the view to avoid kicking admin out on token refresh
    setCurrentView(prevView => {
      // If already in admin view and user is admin, stay there
      if (prevView === 'admin' && basicUser.isAdmin) {
        return 'admin';
      }
      // Otherwise go to dashboard (default for logged in)
      return 'dashboard';
    });
  };

  const loadStats = async (userId: string) => {
    await logDailyActivity(userId);
    const stats = await fetchUserStats(userId);
    if (stats) {
      setUserStats(stats);
    }
  };

  const checkAchievements = async (currentStats: UserStats, userId: string) => {
      // Get completed course count asynchronously
      const completedCourses = await fetchCompletedCourseCount(userId);
      
      const newUnlocks: Achievement[] = [];
      const updatedUnlockedSet = new Set(unlockedAchievementIds);

      for (const ach of ACHIEVEMENTS) {
          if (updatedUnlockedSet.has(ach.id)) continue;

          let isUnlocked = false;
          if (ach.type === 'challenge' && currentStats.totalCompleted >= ach.target) isUnlocked = true;
          if (ach.type === 'xp' && currentStats.totalPoints >= ach.target) isUnlocked = true;
          if (ach.type === 'streak' && currentStats.streak >= ach.target) isUnlocked = true;
          if (ach.type === 'course' && completedCourses >= ach.target) isUnlocked = true;

          if (isUnlocked) {
              const success = await unlockAchievement(userId, ach.id, ach.title, ach.description);
              if (success) {
                  newUnlocks.push(ach);
                  updatedUnlockedSet.add(ach.id);
              }
          }
      }

      if (newUnlocks.length > 0) {
          setUnlockedAchievementIds(updatedUnlockedSet);
          // Show toast for the first one found (simpler than queueing for now)
          setAchievementToast(newUnlocks[0]);
      }
  };

  useEffect(() => {
    if ((state.industry && state.difficulty && state.isOverviewConfirmed && !state.isComplete) || state.activeCourseId) {
      if (state.activeCourseId && !state.isOverviewConfirmed) {
          if (!currentCourse) {
              fetchCourseById(state.activeCourseId).then(c => setCurrentCourse(c));
          }
      } else {
          loadChallenge(state.currentQuestionIndex);
      }
    }
  }, [state.industry, state.difficulty, state.currentQuestionIndex, state.isOverviewConfirmed, state.activeSavedChallengeId, state.activeCourseId, currentCourse]);

  // Auto-expand results on submission
  useEffect(() => {
    if (lastResult && isMobile) {
        setMobilePanels(prev => ({ ...prev, results: true, editor: false }));
    }
  }, [lastResult, isMobile]);

  useEffect(() => {
    if (showFeedbackModal && lastResult?.isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00a4ef', '#ff9933', '#ffffff'],
        zIndex: 100
      });
    }
  }, [showFeedbackModal, lastResult]);

  const isChallengeLocked = (index: number) => {
    if (!permissions) return true; // Default locked if undefined
    
    // NOTE: This visual check uses index, but actual enforcement logic is in loadChallenge
    if (permissions.course_lesson_limit === -1) return false;
    
    // Visually lock future lessons if limit is reached AND user hasn't started them
    return index >= permissions.course_lesson_limit;
  };

  const isLessonCompleted = (index: number) => {
    let lessonId: number | undefined;
    
    if (state.activeCourseId && currentCourse?.modules) {
        lessonId = currentCourse.modules[index]?.id;
        if (!lessonId) return false;
        return completedModuleIds.has(lessonId);
    } else {
        // Fallback for tracks
        const curriculum = state.difficulty === 'Beginner' ? BEGINNER_CURRICULUM : INTERMEDIATE_CURRICULUM;
        lessonId = curriculum[index]?.id;
        if (!lessonId) return false;
        return state.history.some(h => h.questionId === lessonId && h.isCorrect);
    }
  };

  const loadChallenge = async (index: number) => {
    if (!state.activeSavedChallengeId && !state.activeCourseId && (!state.difficulty || !state.industry)) return;
    
    if (state.activeSavedChallengeId) {
        setIsLoading(true);
        setLoadingMessage("Loading Featured Challenge...");
        setLastResult(null);
        setShowFeedbackModal(false);
        setLeftPanelTab('mission');

        try {
            const savedData = await fetchSavedChallengeById(state.activeSavedChallengeId);
            if (savedData && savedData.challenge_json) {
                const ch = savedData.challenge_json;
                setCurrentChallenge({
                    ...ch,
                    id: savedData.id
                });
                // Initialize user code for debug/completion
                if (ch.type === 'debug' || ch.type === 'completion') {
                    setUserCode(ch.initialCode || '');
                } else {
                    setUserCode('');
                }
            } else {
                alert("Could not load challenge data.");
                setState(prev => ({...prev, isComplete: true}));
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
        return;
    }

    if (state.activeCourseId) {
        if (!state.isOverviewConfirmed) return;

        setIsLoading(true);
        setLoadingMessage("Loading Course Module...");
        setLastResult(null);
        setShowFeedbackModal(false);
        setLeftPanelTab('mission');

        try {
            // Use currentCourse if available, otherwise it will be fetched by useEffect
            const courseData = currentCourse; 
            
            if (courseData && courseData.modules && courseData.modules.length > index) {
                const module = courseData.modules[index];
                
                // Limit Check Fallback
                if (user?.id && permissions?.course_lesson_limit !== -1 && permissions !== null) {
                    const limit = permissions.course_lesson_limit;
                    const moduleId = module.id;
                    const isStarted = moduleId ? startedModuleIds.has(moduleId) : false;
                    
                    if (!isStarted) {
                        const currentCourseModuleIds = new Set(courseData.modules.map(m => m.id));
                        const startedInThisCourse = Array.from(startedModuleIds).filter(id => currentCourseModuleIds.has(id));
                        
                        if (startedInThisCourse.length >= limit) {
                            setIsLoading(false);
                            setShowLimitReachedModal(true);
                            return; // Block access
                        }
                    }
                    
                    // Log start (enrollment in lesson)
                    if (moduleId) {
                        await logModuleStart(user.id, state.activeCourseId, moduleId);
                        setStartedModuleIds(prev => new Set(prev).add(moduleId));
                    }
                }

                if (module.challenge_json) {
                    const ch = module.challenge_json;
                    setCurrentChallenge({
                        ...ch,
                        id: module.id || index + 1000 
                    });
                    // Initialize user code for debug/completion
                    if (ch.type === 'debug' || ch.type === 'completion') {
                        setUserCode(ch.initialCode || '');
                    } else {
                        setUserCode('');
                    }
                } else {
                    console.error("Module has no content");
                }
            } else if (courseData && courseData.modules && courseData.modules.length <= index) {
                setState(prev => ({...prev, isComplete: true}));
            }
        } catch (e) {
            console.error(e);
            alert("Error loading course content.");
        } finally {
            setIsLoading(false);
        }
        return;
    }

    // Standard track logic
    const tier = userStats.subscriptionTier;

    if (state.industry === Industry.PERSONALIZED && tier !== 'pro') {
        setShowPricing(true);
        setState(prev => ({ 
            ...prev, 
            industry: null, 
            difficulty: null, 
            isOverviewConfirmed: false,
            isComplete: false
        }));
        return;
    }

    // Use fetched permissions for locking logic
    if (isChallengeLocked(index)) {
        if (permissions && permissions.course_lesson_limit !== -1 && index >= permissions.course_lesson_limit) {
             setShowLimitReachedModal(true);
        } else {
             setShowPricing(true);
        }

        if (index === 0) {
             setState(prev => ({ 
                ...prev, 
                industry: null, 
                difficulty: null, 
                isOverviewConfirmed: false,
                isComplete: false
            }));
        }
        return;
    }

    setIsLoading(true);
    setLoadingMessage("Analyzing Curriculum...");
    setLastResult(null);
    setShowFeedbackModal(false);
    setUserCode(''); // Standard challenges default to SQL, so empty code
    setLeftPanelTab('mission');
    
    const curriculum = state.difficulty === 'Beginner' ? BEGINNER_CURRICULUM : INTERMEDIATE_CURRICULUM;
    const challengeDef = curriculum[index];

    if (!challengeDef) {
      setState(s => ({ ...s, isComplete: true }));
      setIsLoading(false);
      return;
    }

    if (state.industry !== Industry.PERSONALIZED) {
        try {
            setLoadingMessage("Checking Content Library...");
            const cached = await fetchChallengeFromInventory(challengeDef.topic, state.industry!, state.difficulty!);
            
            if (cached && cached.schema && cached.schema.length > 0) {
                setCurrentChallenge({
                    ...cached,
                    id: challengeDef.id
                });
                setIsLoading(false);
                return;
            }
        } catch(e) {
            console.warn("Cache check failed, falling back to generation");
        }
    }

    const msgs = [
       "Analyzing Learning Objectives...",
       `Synthesizing ${state.industry === 'Personalized' ? 'Custom' : state.industry} Scenario...`,
       "Designing Database Schema...",
       "Generating Realistic Mock Data...",
       "Validating Challenge Logic...",
       "Finalizing Environment..."
    ];
    let step = 0;
    const timer = setInterval(() => {
        step++;
        if (step < msgs.length) {
            setLoadingMessage(msgs[step]);
        }
    }, 1200);

    try {
      const challenge = await generateChallenge(
        challengeDef, 
        state.industry!, 
        state.difficulty!,
        state.customContext
      );
      
      setCurrentChallenge(challenge);

      if (state.industry !== Industry.PERSONALIZED && challenge.schema && challenge.schema.length > 0) {
          saveChallengeToInventory(challengeDef.topic, state.industry!, state.difficulty!, challenge);
      }

    } catch (e) {
      console.error(e);
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  };

  const handleLogin = (u: User) => {
    setShowLogin(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('landing');
    setState({
      industry: null,
      customContext: '',
      difficulty: null,
      isOverviewConfirmed: false,
      currentQuestionIndex: 0,
      points: 0,
      history: [],
      isComplete: false,
      activeSavedChallengeId: undefined,
      activeCourseId: undefined
    });
    setCurrentChallenge(null);
    setCurrentCourse(null);
    setUserCode('');
    setLastResult(null);
    setCompletedModuleIds(new Set());
    setStartedModuleIds(new Set());
    setUnlockedAchievementIds(new Set());
    setPermissions(null); // Clear permissions
  };

  const handleLoginRequest = (mode: AuthMode = 'login') => {
    setAuthMode(mode);
    setShowLogin(true);
  };

  const handleStart = (industry: Industry, difficulty: Difficulty, customContext?: string, startIndex: number = 0, resume: boolean = false) => {
    if (user?.id) {
       updateUserStats(user.id, {
         lastIndustry: industry,
         lastDifficulty: difficulty,
         lastContext: customContext || '',
         lastIndex: startIndex
       });
    }

    setState({
      industry,
      customContext,
      difficulty,
      isOverviewConfirmed: resume,
      currentQuestionIndex: startIndex,
      points: 0,
      history: [],
      isComplete: false,
      activeSavedChallengeId: undefined,
      activeCourseId: undefined
    });
    setCurrentView('dashboard');
  };
  
  const handleStartSavedChallenge = (id: number, industry: string, difficulty: string) => {
      setState({
          industry: industry as Industry, 
          customContext: '',
          difficulty: difficulty as Difficulty,
          isOverviewConfirmed: true, 
          currentQuestionIndex: 0,
          points: 0,
          history: [],
          isComplete: false,
          activeSavedChallengeId: id,
          activeCourseId: undefined
      });
      setCurrentView('dashboard');
  };

  const handleStartCourse = async (id: number) => {
      if (user?.id) {
          await enrollInCourse(user.id, id);
      }

      const course = await fetchCourseById(id);
      setCurrentCourse(course);

      let startIndex = 0;
      let resume = false;
      const completedSet = new Set<number>();
      const startedSet = new Set<number>();

      if (user?.id) {
          const progress = await fetchUserModuleProgress(user.id, id);
          if (progress) {
              progress.forEach((p: any) => {
                  startedSet.add(p.module_id);
                  if (p.status === 'completed') {
                      completedSet.add(p.module_id);
                  }
              });
              setCompletedModuleIds(completedSet);
              setStartedModuleIds(startedSet);

              if (course && course.modules && course.modules.length > 0) {
                  const firstUnfinished = course.modules.findIndex(m => m.id && !completedSet.has(m.id));
                  if (firstUnfinished !== -1) {
                      startIndex = firstUnfinished;
                      resume = startIndex > 0; 
                  } else if (completedSet.size >= course.modules.length) {
                      startIndex = 0;
                      resume = false; 
                  }
              }
          }
      }

      // --- CRITICAL CHECK: Limit enforcement BEFORE updating state ---
      if (permissions && permissions.course_lesson_limit !== -1 && user?.id && course && course.modules && course.modules.length > startIndex) {
          const module = course.modules[startIndex];
          // If trying to access a new (not started) module
          if (module && module.id && !startedSet.has(module.id)) {
              const limit = permissions.course_lesson_limit;
              const currentCourseModuleIds = new Set(course.modules.map(m => m.id));
              const startedInThisCourse = Array.from(startedSet).filter(id => currentCourseModuleIds.has(id));
              
              if (startedInThisCourse.length >= limit) {
                  // Block access immediately, stay on current view but show modal
                  setShowLimitReachedModal(true);
                  return;
              }
          }
      }

      setState({
          industry: (course?.industry as Industry) || Industry.TECH, 
          customContext: course?.main_context || '',
          difficulty: (course?.skill_level as Difficulty) || 'Intermediate', 
          isOverviewConfirmed: resume, 
          currentQuestionIndex: startIndex,
          points: 0, 
          history: [],
          isComplete: false,
          activeSavedChallengeId: undefined,
          activeCourseId: id
      });
      setCurrentView('dashboard');
  };

  const handleOverviewConfirm = () => {
    setState(prev => ({ ...prev, isOverviewConfirmed: true }));
  };

  const handleOverviewBack = () => {
    if (state.activeCourseId) {
        handleGoToDashboard();
    } else {
        setState(prev => ({ ...prev, industry: null, difficulty: null, isOverviewConfirmed: false }));
    }
  };

  const handleReturnToOverview = () => {
    if (state.activeCourseId) {
        handleGoToDashboard();
        return;
    }
    setState(prev => ({ ...prev, isOverviewConfirmed: false }));
  };

  const handleNavigateHome = () => setCurrentView('landing');
  
  const handleNavigateDashboard = () => setCurrentView('dashboard');
  
  const handleNavigateCourses = () => {
    if (user) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('courses');
    }
  };

  const handleGoToDashboard = () => {
    setState(prev => ({ 
        ...prev, 
        industry: null, 
        difficulty: null, 
        isOverviewConfirmed: false,
        activeSavedChallengeId: undefined,
        activeCourseId: undefined
    }));
    setCurrentCourse(null);
    setCurrentView('dashboard');
  };

  const handleJumpToQuestion = (index: number) => {
    if (state.activeSavedChallengeId) return;
    
    // Check sequential access requirement
    const isSequential = index === 0 || isLessonCompleted(index - 1);
    
    // If not sequential, check if already started (allows jumping back/resume)
    let isAccessible = isSequential;
    if (state.activeCourseId && currentCourse?.modules) {
        const modId = currentCourse.modules[index]?.id;
        if (modId && startedModuleIds.has(modId)) {
            isAccessible = true;
        }
    }

    if (!isAccessible) {
        setShowLockedToast(true);
        setTimeout(() => setShowLockedToast(false), 4000);
        return;
    }

    if (state.activeCourseId) {
        if (currentCourse && currentCourse.modules && index < currentCourse.modules.length && user?.id) {
             const module = currentCourse.modules[index];
             
             // --- CRITICAL CHECK: Limit enforcement BEFORE updating state ---
             if (module.id && !startedModuleIds.has(module.id)) {
                 if (permissions && permissions.course_lesson_limit !== -1) {
                     const limit = permissions.course_lesson_limit;
                     const currentCourseModuleIds = new Set(currentCourse.modules.map(m => m.id));
                     const startedInThisCourse = Array.from(startedModuleIds).filter(id => currentCourseModuleIds.has(id));
                     
                     if (startedInThisCourse.length >= limit) {
                         // Block access, show modal, DO NOT update state
                         setShowLimitReachedModal(true);
                         return;
                     }
                 }
             }
             
             setState(prev => ({ ...prev, currentQuestionIndex: index }));
        }
        return;
    }

    if (isLoading) return;
    
    if (isChallengeLocked(index)) {
        if (permissions && permissions.course_lesson_limit !== -1 && index >= permissions.course_lesson_limit) {
             setShowLimitReachedModal(true);
        } else {
             setShowPricing(true);
        }
        return;
    }

    setState(prev => ({
      ...prev,
      currentQuestionIndex: index
    }));
  };

  const calculateStreak = (lastActive: number, currentStreak: number): number => {
      const last = new Date(lastActive);
      const now = new Date();
      
      const isSameDay = last.getDate() === now.getDate() && 
                        last.getMonth() === now.getMonth() && 
                        last.getFullYear() === now.getFullYear();
      
      if (isSameDay) return currentStreak;
      
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays <= 1) return currentStreak + 1;
      return 1;
  };

  const handleSubmit = async (overrideQuery?: string) => {
    if (!currentChallenge) return;

    setIsValidating(true);
    setShowFeedbackModal(false);

    try {
      const ind = state.activeCourseId && currentCourse ? (currentCourse.industry as Industry) : state.industry;
      const ctx = state.activeCourseId && currentCourse ? currentCourse.main_context : state.customContext;
      
      // Use override query (for MCQs) or editor code
      const queryToValidate = overrideQuery !== undefined ? overrideQuery : userCode;

      const result = await validateSubmission(
        currentChallenge, 
        queryToValidate, 
        ind || Industry.TECH, 
        ctx
      );
      
      const submissionResult: SubmissionResult = {
        questionId: currentChallenge.id,
        query: queryToValidate,
        isCorrect: result.isCorrect,
        feedback: result.feedback,
        bestPractice: result.bestPractice, 
        outputData: result.isCorrect ? (result.data || []) : [], // STRICT: Hide data if incorrect
        pointsEarned: result.points,
        timestamp: Date.now()
      };

      setLastResult(submissionResult);
      
      if (result.isCorrect) {
        const isReplay = state.history.some(h => h.questionId === currentChallenge.id && h.isCorrect);
        const isModuleDone = state.activeCourseId ? completedModuleIds.has(currentChallenge.id) : false;
        
        const pointsToAdd = (isReplay || isModuleDone) ? 0 : result.points;

        setState(prev => ({
          ...prev,
          points: prev.points + pointsToAdd,
          history: [...prev.history, submissionResult]
        }));

        if (user && user.id) {
           const logInd = ind || Industry.TECH;
           const logDiff = state.difficulty || 'Intermediate';

           await logChallengeAttempt(user.id, submissionResult, logInd, logDiff);
           
           if (pointsToAdd > 0) {
               await logXpEvent(user.id, pointsToAdd, currentChallenge.id);
               
               // Ensure toast triggers only when points are earned (First successful attempt)
               setXpNotification(null);
               setTimeout(() => setXpNotification(result.points), 50);
           }

           if (state.activeCourseId) {
               await logModuleCompletion(user.id, state.activeCourseId, currentChallenge.id, pointsToAdd > 0 ? result.points : 0);
               await updateEnrollmentStatus(user.id, state.activeCourseId, 'in_progress');
               setCompletedModuleIds(prev => new Set(prev).add(currentChallenge.id));
               // Ensure it's in started set (though it should be already)
               setStartedModuleIds(prev => new Set(prev).add(currentChallenge.id));
           }

           const newStreak = calculateStreak(userStats.lastActive, userStats.streak);

           const nextIndex = (state.activeSavedChallengeId || state.activeCourseId) 
             ? state.currentQuestionIndex 
             : state.currentQuestionIndex + 1;

           setUserStats(prev => {
            const newStats: UserStats = {
              ...prev,
              totalPoints: prev.totalPoints + pointsToAdd,
              totalCompleted: pointsToAdd > 0 ? prev.totalCompleted + 1 : prev.totalCompleted,
              streak: newStreak, 
              lastActive: Date.now(),
              lastIndustry: (state.activeSavedChallengeId || state.activeCourseId) ? prev.lastIndustry : state.industry,
              lastDifficulty: (state.activeSavedChallengeId || state.activeCourseId) ? prev.lastDifficulty : state.difficulty,
              lastContext: (state.activeSavedChallengeId || state.activeCourseId) ? prev.lastContext : state.customContext,
              lastIndex: (state.activeSavedChallengeId || state.activeCourseId) ? prev.lastIndex : nextIndex
            };
            
            updateUserStats(user.id!, newStats);
            logDailyActivity(user.id!);
            
            checkAchievements(newStats, user.id!);

            return newStats;
          });
        }
        
      } else {
          // Incorrect: Show feedback modal
          setShowFeedbackModal(true);
      }

    } catch (error) {
      console.error("Submission error", error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerateAndShowCert = async (title: string) => {
      if (!user?.id) return;
      setIsGeneratingCert(true);
      try {
          const industry = state.activeCourseId && currentCourse ? (currentCourse.industry as Industry) : (state.industry || Industry.TECH);
          const cert = await generateCertificate(user.username, title, user.id, industry);
          if (cert) {
              setGeneratedCert(cert);
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

  const handleNext = async () => {
    if (state.activeSavedChallengeId) {
        if (currentChallenge) {
            await handleGenerateAndShowCert(currentChallenge.title);
        }
        return;
    }

    const nextIndex = state.currentQuestionIndex + 1;

    if (state.activeCourseId) {
        if (currentCourse && currentCourse.modules && nextIndex < currentCourse.modules.length) {
            const module = currentCourse.modules[nextIndex];
            
            // --- CRITICAL CHECK: Limit enforcement BEFORE updating state ---
            if (module && module.id && !startedModuleIds.has(module.id) && user?.id) {
                 if (permissions && permissions.course_lesson_limit !== -1) {
                     const limit = permissions.course_lesson_limit;
                     const currentCourseModuleIds = new Set(currentCourse.modules.map(m => m.id));
                     const startedInThisCourse = Array.from(startedModuleIds).filter(id => currentCourseModuleIds.has(id));
                     
                     if (startedInThisCourse.length >= limit) {
                         setShowLimitReachedModal(true);
                         return; // Prevents state update
                     }
                 }
            }

            setState(prev => ({ ...prev, currentQuestionIndex: nextIndex }));
        } else {
            setState(prev => ({ ...prev, isComplete: true }));
            if (state.activeCourseId && user?.id) {
                await updateEnrollmentStatus(user.id, state.activeCourseId, 'completed');
            }
        }
        return;
    }

    // Check permission-based lock for next lesson
    if (isChallengeLocked(nextIndex)) {
        if (permissions && permissions.course_lesson_limit !== -1 && nextIndex >= permissions.course_lesson_limit) {
             setShowLimitReachedModal(true);
        } else {
             setShowPricing(true);
        }
        return;
    }

    setState(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex
    }));
  };

  const handleUpgradeSuccess = (newTier: SubscriptionTier) => {
      setUserStats(prev => ({ ...prev, subscriptionTier: newTier }));
      // Refetch permissions after upgrade
      fetchPlanPermissions(newTier).then(p => setPermissions(p));
      setShowPricing(false);
  };
  
  const handleUserUpdate = (updatedUser: User) => {
     setUser(updatedUser);
  };

  let content = null;
  
  // View Rendering Logic (Unchanged)
  if (user && currentView === 'admin' && user.isAdmin) {
    content = <AdminDashboard user={user} onClose={() => setCurrentView('dashboard')} />;
  }
  else if (currentView === 'courses') {
    content = (
        <CoursesPage 
            user={user}
            onLogout={handleLogout}
            onNavigateHome={handleNavigateHome}
            onNavigateDashboard={handleNavigateDashboard}
            onNavigateAdmin={() => setCurrentView('admin')}
            onShowSettings={() => setShowSettings(true)}
            onStartCourse={handleStartCourse}
            onStartSaved={handleStartSavedChallenge}
            onStart={handleStart}
            onLoginRequest={() => handleLoginRequest('login')}
            subscriptionTier={userStats.subscriptionTier}
            onShowPricing={() => setShowPricing(true)}
        />
    );
  }
  else if (!state.industry && !state.activeSavedChallengeId && !state.activeCourseId) {
    if (user && currentView === 'dashboard') {
      content = (
        <Dashboard 
          user={user} 
          stats={userStats}
          onLogout={handleLogout} 
          onStart={handleStart}
          onStartSaved={handleStartSavedChallenge}
          onStartCourse={handleStartCourse}
          onNavigateHome={handleNavigateHome} 
          onNavigateCourses={handleNavigateCourses}
          onShowPricing={() => setShowPricing(true)}
          onUserUpdate={handleUserUpdate}
          onNavigateAdmin={() => setCurrentView('admin')}
          onShowSettings={() => setShowSettings(true)}
        />
      );
    } else {
      content = (
        <SetupScreen 
          user={user}
          subscriptionTier={userStats.subscriptionTier}
          onLogout={handleLogout} 
          onLoginRequest={handleLoginRequest} 
          onStart={handleStart} 
          onShowPricing={() => setShowPricing(true)}
          planSettings={planSettings}
          onNavigateDashboard={handleNavigateDashboard}
          onNavigateCourses={handleNavigateCourses}
          onNavigateAdmin={() => setCurrentView('admin')}
          onShowSettings={() => setShowSettings(true)}
        />
      );
    }
  } else if (!state.isOverviewConfirmed && user) {
    if (state.activeCourseId) {
       if (currentCourse) {
           content = (
               <CourseOverview 
                   user={user}
                   course={currentCourse}
                   onLogout={handleLogout}
                   onStart={handleOverviewConfirm}
                   onBack={handleOverviewBack}
                   onNavigateDashboard={handleNavigateDashboard}
                   onNavigateAdmin={() => setCurrentView('admin')}
                   onShowSettings={() => setShowSettings(true)}
               />
           );
       } else {
           content = (
               <div className="min-h-screen bg-corp-blue flex items-center justify-center">
                   <div className="text-center">
                       <div className="w-12 h-12 border-4 border-corp-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                       <p className="text-blue-200 font-bold uppercase tracking-widest text-sm">Loading Course Data...</p>
                   </div>
               </div>
           );
       }
    } else {
        content = (
          <ChallengeOverview 
            user={user}
            onLogout={handleLogout}
            industry={state.industry!}
            difficulty={state.difficulty!}
            customContext={state.customContext}
            onStart={handleOverviewConfirm}
            onBack={handleOverviewBack}
            onNavigateDashboard={handleNavigateDashboard}
            onNavigateAdmin={() => setCurrentView('admin')}
            onShowSettings={() => setShowSettings(true)}
          />
        );
    }
  } else if (state.isComplete && user) {
    content = (
      <div className="min-h-screen bg-corp-blue flex flex-col items-center justify-center p-8 text-center">
        <div className="glass-panel bg-corp-dark p-12 rounded-3xl max-w-2xl w-full border border-corp-cyan/30 relative overflow-hidden">
          <Award size={80} className="text-corp-orange mb-6 mx-auto" />
          <h1 className="text-4xl font-black text-white mb-4">Journey Completed</h1>
          <p className="text-blue-100 mb-10 text-lg">
            {state.activeCourseId 
             ? "You have completed this structured course." 
             : `You have successfully demonstrated your proficiency in the ${state.difficulty} SQL curriculum.`}
          </p>
          <div className="bg-corp-blue/50 p-8 rounded-2xl border border-white/10 mb-8 mx-auto max-w-sm">
            <div className="text-blue-200 mb-2 font-bold uppercase tracking-widest text-xs">Total XP Earned</div>
            <div className="text-6xl font-mono font-bold text-corp-cyan">{state.points}</div>
          </div>
          
          <div className="flex flex-col gap-4">
              <button 
                onClick={() => {
                    const title = state.activeCourseId 
                        ? (currentCourse?.title || "Course Completion") 
                        : `${state.industry} ${state.difficulty} Track`;
                    handleGenerateAndShowCert(title);
                }}
                disabled={isGeneratingCert}
                className="bg-corp-royal hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2"
              >
                {isGeneratingCert ? <Loader2 className="animate-spin" /> : <Award size={20} />}
                {isGeneratingCert ? 'Minting Certificate...' : 'Get Certificate'}
              </button>
              
              <button 
                onClick={handleGoToDashboard}
                className="text-slate-400 hover:text-white font-bold transition text-sm"
              >
                Return to Dashboard
              </button>
          </div>
        </div>
      </div>
    );
  } else if (user) {
    const curriculum = state.activeCourseId && currentCourse 
        ? currentCourse.modules?.map(m => ({ id: m.id || 0, topic: m.title, description: m.task_description })) || []
        : (state.difficulty === 'Beginner' ? BEGINNER_CURRICULUM : INTERMEDIATE_CURRICULUM);
    
    const isSavedMode = !!state.activeSavedChallengeId;
    const isCourseMode = !!state.activeCourseId;

    content = (
      <div className="h-screen w-full bg-corp-blue text-slate-200 flex flex-col overflow-hidden font-sans">
        <header className="h-16 bg-corp-dark border-b border-white/10 shadow-md flex items-center justify-between px-4 md:px-8 shrink-0 z-50">
          <button 
            onClick={handleReturnToOverview}
            className="flex items-center gap-4 cursor-pointer group hover:opacity-100 opacity-90 transition-all focus:outline-none"
            title="Back to Overview"
          >
            <div className="bg-corp-royal p-2 rounded-lg text-white shadow-lg shadow-corp-royal/30 group-hover:bg-blue-600 transition-colors relative">
              <ChevronRight size={20} className="text-white" />
              <Zap size={12} className="text-corp-orange fill-corp-orange absolute -top-1 -right-1" />
            </div>
            <div className="flex flex-col text-left max-w-[120px] md:max-w-none">
              <span className="font-bold text-white text-base tracking-tight group-hover:text-corp-cyan transition-colors truncate block">SELECT | SQL</span>
              <span className="text-xs text-corp-cyan font-bold uppercase tracking-wider group-hover:text-white transition-colors truncate block">
                  {state.activeCourseId && currentCourse ? currentCourse.title : `${state.industry} • ${state.difficulty}`}
              </span>
            </div>
          </button>
          <div className="flex items-center gap-2 md:gap-8">
            {!isSavedMode && (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-black/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-corp-cyan rounded-full transition-all duration-500" 
                      style={{ width: `${(state.currentQuestionIndex / curriculum.length) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-white text-sm font-bold">{state.currentQuestionIndex + 1}/{curriculum.length}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 md:px-4 rounded-full border border-white/5">
              <span className="text-xs font-bold text-corp-orange uppercase tracking-wider">XP</span>
              <span className="font-mono font-bold text-white">{state.points}</span>
            </div>
            
            <div className="hidden md:block">
                <MegaMenu 
                    onNavigateCourses={handleGoToDashboard} 
                    isLoggedIn={true} 
                    onStartCourse={() => handleGoToDashboard()}
                    onStartChallenge={() => handleGoToDashboard()}
                />
            </div>

            <UserProfileDropdown 
                user={user}
                subscriptionTier={userStats.subscriptionTier}
                onLogout={handleLogout}
                onNavigateHome={handleGoToDashboard}
                onNavigateAdmin={() => setCurrentView('admin')}
                onShowSettings={() => setShowSettings(true)}
                onNavigateChallenges={handleGoToDashboard}
            />

          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 md:p-4 gap-2 md:gap-4 relative">
          
          {/* Mobile Modules Pane (Collapsible) */}
          {isMobile && !isSavedMode && (
             <div className="shrink-0 flex flex-col bg-corp-dark border border-white/10 rounded-xl overflow-hidden transition-all duration-300">
                <button 
                    onClick={() => setMobilePanels(p => ({...p, modules: !p.modules}))}
                    className="flex items-center justify-between p-3 bg-black/20 active:bg-black/30"
                >
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-200 uppercase tracking-wider">
                        <List size={16} /> 
                        <span>Modules ({state.currentQuestionIndex + 1}/{curriculum.length})</span>
                    </div>
                    {mobilePanels.modules ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {mobilePanels.modules && (
                    <div className="max-h-[200px] overflow-y-auto p-2 bg-corp-dark border-t border-white/5 space-y-1">
                        {curriculum.map((item, idx) => {
                            const isActive = idx === state.currentQuestionIndex;
                            const isDone = isLessonCompleted(idx);
                            
                            const tierLocked = !isCourseMode && isChallengeLocked(idx);
                            const progressionLocked = idx > 0 && !isLessonCompleted(idx - 1);
                            const isLocked = tierLocked || progressionLocked;

                            return (
                              <button 
                                key={idx}
                                onClick={() => { handleJumpToQuestion(idx); setMobilePanels(p => ({...p, modules: false})); }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                                  isActive ? 'bg-corp-royal text-white shadow-lg font-bold' : 
                                  'text-blue-200 hover:bg-white/5 hover:text-white font-medium'
                                } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                {isLocked ? <Lock size={14} className="text-slate-500 shrink-0" /> : 
                                isDone ? <CheckCircle size={14} className="text-corp-cyan shrink-0" /> : 
                                isActive ? <div className="w-3 h-3 rounded-full border-2 border-corp-orange shrink-0" /> :
                                <Circle size={14} className="opacity-30 shrink-0" />}
                                <span className="truncate">{idx + 1}. {item.topic}</span>
                              </button>
                            );
                        })}
                    </div>
                )}
             </div>
          )}

          {/* Desktop Sidebar */}
          {!isSavedMode && !isMobile && (
              <aside className={`${isModulesPaneCollapsed ? 'w-12' : 'w-64'} glass-panel bg-corp-dark rounded-2xl flex flex-col shrink-0 overflow-hidden border-white/10 transition-all duration-300 relative`}>
                <div className={`p-4 border-b border-white/10 font-bold text-blue-200 text-xs uppercase tracking-wider bg-black/10 flex ${isModulesPaneCollapsed ? 'justify-center p-2' : 'justify-between'} items-center h-12`}>
                  {!isModulesPaneCollapsed && <span>Course Modules</span>}
                  <button 
                    onClick={() => setIsModulesPaneCollapsed(!isModulesPaneCollapsed)}
                    className={`hover:text-white transition-colors ${isModulesPaneCollapsed ? '' : 'text-slate-400'}`}
                    title={isModulesPaneCollapsed ? "Expand Modules" : "Collapse Modules"}
                  >
                    {isModulesPaneCollapsed ? <List size={18} /> : <ChevronLeft size={16} />}
                  </button>
                </div>
                {!isModulesPaneCollapsed ? (
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {curriculum.map((item, idx) => {
                        const isActive = idx === state.currentQuestionIndex;
                        const isDone = isLessonCompleted(idx);
                        
                        // Use permission check
                        const tierLocked = !isCourseMode && isChallengeLocked(idx);
                        
                        const progressionLocked = idx > 0 && !isLessonCompleted(idx - 1);
                        
                        const isLocked = tierLocked || progressionLocked;

                        return (
                          <button 
                            key={idx}
                            onClick={() => handleJumpToQuestion(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all text-left ${
                              isActive ? 'bg-corp-royal text-white shadow-lg shadow-corp-royal/30 font-bold' : 
                              'text-blue-200 hover:bg-white/5 hover:text-white font-medium'
                            } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                          >
                            {isLocked ? <Lock size={16} className="text-slate-500 shrink-0" /> : 
                            isDone ? <CheckCircle size={16} className="text-corp-cyan shrink-0" /> : 
                            isActive ? <div className="w-4 h-4 rounded-full border-4 border-corp-orange shadow-[0_0_10px_rgba(255,153,51,0.5)] shrink-0" /> :
                            <Circle size={16} className="opacity-30 shrink-0" />}
                            <span className={`truncate ${isDone && !isActive ? 'opacity-70' : ''} ${isLocked ? 'text-slate-500' : ''}`}>{idx + 1}. {item.topic}</span>
                          </button>
                        );
                      })}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center py-4 gap-2">
                        <div className="w-1 h-full bg-white/5 rounded-full relative">
                             <div className="absolute top-0 left-0 w-full bg-corp-cyan rounded-full transition-all duration-500" style={{ height: `${(state.currentQuestionIndex / curriculum.length) * 100}%` }}></div>
                        </div>
                    </div>
                )}
              </aside>
          )}

          <main className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 overflow-hidden relative">
            {isLoading || !currentChallenge ? (
              <div className="flex-1 glass-panel bg-corp-dark rounded-2xl flex flex-col items-center justify-center space-y-6">
                <div className="flex space-x-3 text-corp-cyan">
                    <div className="w-4 h-4 bg-corp-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-4 h-4 bg-corp-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-4 h-4 bg-corp-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <div className="flex flex-col items-center gap-2 animate-pulse">
                    <span className="text-blue-200 font-mono text-sm tracking-widest uppercase font-bold">{loadingMessage}</span>
                    <span className="text-xs text-slate-500">{isSavedMode || isCourseMode ? 'Retrieving Data...' : 'Powered by Gemini 2.5 Flash'}</span>
                </div>
              </div>
            ) : (
              <>
                {/* Instructions / Mission Panel */}
                <div className={`
                    glass-panel bg-corp-dark rounded-2xl flex flex-col overflow-hidden border-white/10
                    ${isMobile ? 'shrink-0 transition-all duration-300' : 'flex-1'}
                    ${isMobile && !mobilePanels.instructions ? 'h-12' : (isMobile ? 'flex-[2] min-h-[300px]' : 'flex-1')}
                `}>
                  <div 
                    className="flex items-center border-b border-white/10 bg-black/20 px-2 pt-2 gap-1 shrink-0 cursor-pointer md:cursor-default"
                    onClick={() => isMobile && setMobilePanels(p => ({...p, instructions: !p.instructions}))}
                  >
                      <button 
                          onClick={(e) => { e.stopPropagation(); setLeftPanelTab('mission'); }}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                              leftPanelTab === 'mission' 
                              ? 'bg-corp-dark text-white border-t border-x border-white/10 relative -bottom-px' 
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                          <BookOpen size={14} /> Mission
                      </button>
                      <button 
                          onClick={(e) => { e.stopPropagation(); setLeftPanelTab('chat'); }}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                              leftPanelTab === 'chat' 
                              ? 'bg-corp-dark text-white border-t border-x border-white/10 relative -bottom-px' 
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                          <Bot size={14} className={leftPanelTab === 'chat' ? 'text-corp-cyan' : ''} /> AI Tutor
                      </button>
                      
                      {isMobile && (
                          <div className="ml-auto mr-2 text-slate-400">
                              {mobilePanels.instructions ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                          </div>
                      )}
                  </div>
                  
                  {(!isMobile || mobilePanels.instructions) && (
                      <div className="flex-1 overflow-hidden relative">
                        {leftPanelTab === 'mission' ? (
                            <div className="absolute inset-0 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-2.5 py-1 rounded-md text-xs font-black bg-corp-royal text-white shadow-md uppercase tracking-wider">
                                    Challenge {isCourseMode ? state.currentQuestionIndex + 1 : currentChallenge.id}
                                    </span>
                                    <span className="text-corp-cyan text-xs font-bold uppercase tracking-wider">
                                    {currentChallenge.topic}
                                    </span>
                                    {currentChallenge.type && currentChallenge.type !== 'sql' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-white/5 border-white/10 text-slate-300">
                                            {currentChallenge.type.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl font-black text-white mb-3 tracking-tight">{currentChallenge.title}</h2>
                                <p className="text-blue-100 leading-relaxed text-base font-normal">{currentChallenge.scenario}</p>
                                </div>

                                <div className="bg-corp-blue/30 rounded-xl border border-white/5 p-6 relative overflow-hidden group shadow-inner">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-corp-orange"></div>
                                <h3 className="text-xs font-bold text-corp-orange uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <BookOpen size={16} /> Task Assignment
                                </h3>
                                <p className="text-white text-lg leading-7 font-medium">
                                    {currentChallenge.task}
                                </p>
                                {currentChallenge.requiredConcepts.length > 0 && (
                                    <div className="mt-5 pt-4 border-t border-white/5">
                                    <span className="text-xs text-blue-300 mr-2 uppercase tracking-wide font-bold">Use Concepts:</span>
                                    {currentChallenge.requiredConcepts.map(c => (
                                        <span key={c} className="inline-block bg-corp-cyan/20 text-corp-cyan text-xs font-bold px-2 py-1 rounded border border-corp-cyan/30 mr-1.5 mb-1">
                                        {c}
                                        </span>
                                    ))}
                                    </div>
                                )}
                                </div>

                                {currentChallenge.type !== 'mcq' && (
                                    <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wide">Database Schema</h3>
                                        <button 
                                        onClick={() => setIsSchemaExpanded(true)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-corp-cyan hover:text-white transition-colors bg-corp-cyan/10 hover:bg-corp-cyan/20 px-3 py-1.5 rounded-lg border border-corp-cyan/20"
                                        >
                                        <Maximize2 size={12} /> Expand
                                        </button>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 overflow-x-auto">
                                        <SchemaTableViewer tables={currentChallenge.schema} />
                                    </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <ChatPanel 
                                challenge={currentChallenge}
                                industry={state.industry!}
                                customContext={state.customContext}
                                allowed={permissions?.allow_ai_tutor ?? false}
                                onShowPricing={() => setShowPricing(true)}
                            />
                        )}
                      </div>
                  )}
                </div>

                {/* Editor & Results Container */}
                <div className={`flex-1 flex flex-col gap-4 min-w-0 ${isMobile ? 'overflow-y-auto pb-20' : ''}`}>
                  {currentChallenge.type === 'mcq' ? (
                      <McqPanel 
                          question={currentChallenge.task}
                          options={currentChallenge.options || []}
                          onSubmit={handleSubmit}
                          disabled={isValidating || (lastResult?.isCorrect ?? false)}
                          isCorrect={lastResult?.isCorrect}
                          correctAnswer={currentChallenge.correctAnswer}
                      />
                  ) : (
                      <>
                        {/* EDITOR */}
                        <div className={`
                            glass-panel bg-corp-dark rounded-2xl flex flex-col overflow-hidden border border-white/10 shadow-xl
                            ${isMobile ? 'shrink-0 transition-all duration-300' : 'flex-[3]'}
                            ${isMobile && !mobilePanels.editor ? 'h-12' : (isMobile ? 'flex-[2] min-h-[300px]' : 'flex-[3]')}
                        `}>
                            {/* Editor Body */}
                            <div className="flex-1 p-0 flex flex-col h-full">
                                <SqlEditor 
                                    code={userCode} 
                                    onChange={setUserCode} 
                                    disabled={isValidating || (lastResult?.isCorrect ?? false)} 
                                    onToggle={isMobile ? () => setMobilePanels(p => ({...p, editor: !p.editor})) : undefined}
                                    isCollapsed={isMobile && !mobilePanels.editor}
                                />
                            </div>
                            
                            {(!isMobile || mobilePanels.editor) && (
                                <div className="bg-black/30 border-t border-white/10 p-3 md:p-4 flex justify-end items-center backdrop-blur-sm">
                                    <div className="flex gap-2 md:gap-3">
                                        <button
                                            onClick={() => handleSubmit()}
                                            disabled={isValidating || !userCode.trim()}
                                            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg font-bold text-xs md:text-sm transition-all ${
                                            isValidating || !userCode.trim() 
                                            ? 'bg-white/5 text-slate-500 cursor-not-allowed' 
                                            : 'bg-corp-orange hover:bg-orange-500 text-white shadow-lg shadow-corp-orange/20 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            {isValidating ? 'Executing...' : 'Run Query'}
                                        </button>

                                        {lastResult && !isValidating && (
                                            <button
                                            onClick={() => setShowFeedbackModal(true)}
                                            className="flex items-center gap-2 bg-corp-royal hover:bg-blue-600 text-white px-4 md:px-5 py-2.5 rounded-lg font-bold text-xs md:text-sm transition-all shadow-lg"
                                            >
                                            <FileText size={16} /> Review
                                            </button>
                                        )}
                                        
                                        {lastResult?.isCorrect && !isValidating && (
                                            <button
                                                onClick={handleNext}
                                                disabled={isGeneratingCert}
                                                className="flex items-center gap-2 bg-transparent hover:bg-white/5 text-corp-cyan border border-corp-cyan/30 px-4 md:px-5 py-2.5 rounded-lg font-bold text-xs md:text-sm transition-colors disabled:opacity-50"
                                            >
                                                {isGeneratingCert ? <Loader2 size={16} className="animate-spin" /> : null}
                                                {isSavedMode ? 'Finish' : 'Next'} <ArrowRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RESULTS */}
                        <div className={`
                            glass-panel bg-corp-dark rounded-2xl overflow-hidden border border-white/10 shadow-lg
                            ${isMobile ? 'shrink-0 transition-all duration-300' : 'flex-[2] min-h-[200px]'}
                            ${isMobile && !mobilePanels.results ? 'h-12' : (isMobile ? 'flex-[2] min-h-[300px]' : 'flex-[2]')}
                        `}>
                            <ResultPanel 
                                result={lastResult} 
                                loading={isValidating} 
                                onToggle={isMobile ? () => setMobilePanels(p => ({...p, results: !p.results})) : undefined}
                                isCollapsed={isMobile && !mobilePanels.results}
                            />
                        </div>
                      </>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
        
        {/* ... (existing Modals: Schema, Feedback, LiveSupport, Toast) ... */}
        {isSchemaExpanded && currentChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-corp-blue/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="glass-panel bg-corp-dark w-full max-w-6xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-white/20">
              <div className="flex justify-between items-center p-5 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="bg-corp-cyan/20 p-2 rounded text-corp-cyan">
                    <BookOpen size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-white">Schema Reference</h2>
                </div>
                <button 
                  onClick={() => setIsSchemaExpanded(false)}
                  className="p-2 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 overflow-auto bg-corp-dark">
                <SchemaTableViewer tables={currentChallenge.schema} />
              </div>
              <div className="p-4 border-t border-white/10 bg-black/20 text-right">
                <button 
                  onClick={() => setIsSchemaExpanded(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <FeedbackModal 
          isOpen={showFeedbackModal}
          isCorrect={lastResult?.isCorrect ?? false}
          feedback={lastResult?.feedback ?? ''}
          bestPractice={lastResult?.bestPractice} // Pass new prop
          points={lastResult?.pointsEarned ?? 0}
          onClose={() => setShowFeedbackModal(false)}
          onNext={handleNext}
        />

        {currentChallenge && state.industry && (
          <LiveSupportPanel 
            challenge={currentChallenge}
            industry={state.industry}
            customContext={state.customContext}
            currentCode={userCode}
            allowed={permissions?.allow_live_instructor ?? false}
            onShowPricing={() => setShowPricing(true)}
          />
        )}

        {/* ... Toasts ... */}
        {achievementToast && (
            <AchievementToast 
                title={achievementToast.title} 
                iconName={achievementToast.iconName} 
                onClose={() => setAchievementToast(null)} 
            />
        )}
        
        {xpNotification && (
            <XPToast 
                points={xpNotification} 
                onClose={() => setXpNotification(null)} 
            />
        )}
        
        {showLockedToast && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/30 text-white px-6 py-3 rounded-full shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
               <Lock size={18} className="text-red-400" />
               <span className="font-bold text-sm">Complete previous modules to unlock.</span>
            </div>
        )}
      </div>
    );
  } else {
    // ... (SetupScreen) ...
    content = (
      <SetupScreen 
        user={null}
        subscriptionTier='free'
        onLogout={handleLogout} 
        onLoginRequest={handleLoginRequest} 
        onStart={handleStart} 
        onShowPricing={() => setShowPricing(true)}
        planSettings={planSettings}
        onNavigateDashboard={handleNavigateDashboard}
        onNavigateCourses={handleNavigateCourses}
        onNavigateAdmin={() => setCurrentView('admin')}
        onShowSettings={() => setShowSettings(true)}
      />
    );
  }

  return (
    <div className="relative">
      {/* ... (Modals: Login, Pricing, Settings, Certificate) ... */}
      {showLogin && (
        <div className="fixed inset-0 z-[100]">
          <LoginScreen 
             onLogin={handleLogin} 
             onClose={() => setShowLogin(false)} 
             initialMode={authMode}
          />
        </div>
      )}

      {showPricing && user && (
          <PricingModal 
             user={user}
             currentTier={userStats.subscriptionTier}
             onClose={() => setShowPricing(false)}
             onUpgradeSuccess={handleUpgradeSuccess}
             planSettings={planSettings}
          />
      )}

      {showLimitReachedModal && (
          <LimitReachedModal 
              isOpen={showLimitReachedModal}
              onClose={() => setShowLimitReachedModal(false)}
              onShowPricing={() => {
                  setShowLimitReachedModal(false);
                  setShowPricing(true);
              }}
          />
      )}

      {showSettings && user && (
         <SettingsModal 
            user={user} 
            onClose={() => setShowSettings(false)} 
            onUserUpdate={handleUserUpdate} 
         />
      )}
      
      {generatedCert && (
          <CertificateModal 
              certificate={generatedCert}
              onClose={() => {
                  setGeneratedCert(null);
                  if (state.activeSavedChallengeId) {
                      handleGoToDashboard();
                  }
              }}
          />
      )}
      
      {content}
    </div>
  );
};

export default App;
