
import { supabase } from './supabaseClient';
import { UserStats, Industry, Difficulty, SubmissionResult, User, SubscriptionTier, SavedChallenge, Challenge, Course, CourseModule, PlanSettings, LearningPath, Certificate, UserAchievement, PlanPermission } from '../types';
import { DEFAULT_PLAN_SETTINGS } from '../constants';

export const ensureUserProfile = async (user: User) => {
  if (!user.id) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            username: user.username,
            total_xp: 0,
            total_completed: 0,
            streak: 0,
            last_active: new Date().toISOString(),
            subscription_plan: 'free', // Default to free
            is_pro: false,
            is_admin: false
          }
        ])
        .select()
        .single();
      
      if (createError) throw createError;
      return newProfile;
    }
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error ensuring profile:', err);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: { username?: string }) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating profile:', err);
    return false;
  }
};

// --- Permissions (New) ---

export const fetchPlanPermissions = async (tier: string): Promise<PlanPermission | null> => {
  try {
    // Basic normalization: handle 'basic_monthly' -> 'basic'
    const normalizedTier = tier.toLowerCase().split('_')[0]; // free, basic, pro
    
    const { data, error } = await supabase
      .from('plan_permissions')
      .select('*')
      .eq('tier', normalizedTier)
      .single();

    if (error) {
        console.warn(`No permissions found for tier: ${tier} (normalized: ${normalizedTier})`, error);
        return null;
    }
    return data as PlanPermission;
  } catch (err) {
    console.error('Error fetching plan permissions:', err);
    return null;
  }
};

export const fetchAllPlanPermissions = async (): Promise<PlanPermission[]> => {
  try {
    const { data, error } = await supabase
      .from('plan_permissions')
      .select('*')
      .order('tier');

    if (error) throw error;
    return data as PlanPermission[];
  } catch (err) {
    console.error('Error fetching all plan permissions:', err);
    return [];
  }
};

export const updatePlanPermission = async (tier: string, updates: Partial<PlanPermission>) => {
  try {
    const { error } = await supabase
      .from('plan_permissions')
      .update(updates)
      .eq('tier', tier);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating plan permission:', err);
    return false;
  }
};

export const fetchUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Normalize subscription plan from DB (e.g., 'basic_monthly' -> 'basic')
    let tier: SubscriptionTier = 'free';
    const plan = (data.subscription_plan || 'free').toLowerCase();
    
    if (plan.includes('pro')) {
        tier = 'pro';
    } else if (plan.includes('basic')) {
        tier = 'basic';
    }

    return {
      totalPoints: data.total_xp || 0,
      totalCompleted: data.total_completed || 0,
      streak: data.streak || 0,
      lastActive: new Date(data.last_active).getTime(),
      lastIndustry: data.last_industry as Industry,
      lastDifficulty: data.last_difficulty as Difficulty,
      lastContext: data.last_context,
      lastIndex: data.last_index || 0,
      subscriptionTier: tier
    };
  } catch (err) {
    console.error('Error fetching stats:', err);
    return null;
  }
};

export const updateUserStats = async (userId: string, stats: Partial<UserStats>) => {
  try {
    const updates: any = {
      last_active: new Date().toISOString(),
    };
    if (stats.totalPoints !== undefined) updates.total_xp = stats.totalPoints;
    if (stats.totalCompleted !== undefined) updates.total_completed = stats.totalCompleted;
    if (stats.streak !== undefined) updates.streak = stats.streak;
    if (stats.lastIndustry !== undefined) updates.last_industry = stats.lastIndustry;
    if (stats.lastDifficulty !== undefined) updates.last_difficulty = stats.lastDifficulty;
    if (stats.lastContext !== undefined) updates.last_context = stats.lastContext;
    if (stats.lastIndex !== undefined) updates.last_index = stats.lastIndex;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  } catch (err) {
    console.error('Error updating stats:', err);
  }
};

export const upgradeSubscription = async (
    userId: string, 
    tier: SubscriptionTier, 
    cycle: 'monthly' | 'annual', 
    reference: string, 
    amount: number
) => {
  try {
    const planName = `${tier}_${cycle}`;
    const durationDays = cycle === 'annual' ? 365 : 30;

    const { error } = await supabase.rpc('upgrade_user_plan', {
        target_user_id: userId,
        new_plan: planName,
        duration_days: durationDays,
        payment_ref: reference,
        payment_amount: amount
    });
      
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error upgrading subscription:', err);
    return false;
  }
};

export const logChallengeAttempt = async (userId: string, result: SubmissionResult, industry: Industry, difficulty: Difficulty) => {
  try {
    const { error } = await supabase
      .from('challenge_attempts')
      .insert([
        {
          user_id: userId,
          question_id: result.questionId, // Mapping simple ID
          query: result.query,
          is_correct: result.isCorrect,
          points_earned: result.pointsEarned,
          industry: industry,
          difficulty: difficulty,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
  } catch (err) {
    console.error('Error logging attempt:', err);
  }
};

// --- NEW MODULE PROGRESS FUNCTIONS ---

export const logModuleCompletion = async (userId: string, courseId: number, moduleId: number, xp: number) => {
  try {
    const { error } = await supabase
      .from('user_module_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        module_id: moduleId,
        status: 'completed',
        xp_earned: xp,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id, module_id' });

    if (error) throw error;
  } catch (err) {
    console.error('Error logging module completion:', err);
  }
};

export const logModuleStart = async (userId: string, courseId: number, moduleId: number) => {
  try {
    // Insert 'started' status if record doesn't exist. Ignore if duplicates (to preserve 'completed' or existing 'started').
    const { error } = await supabase
      .from('user_module_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        module_id: moduleId,
        status: 'started',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, module_id', ignoreDuplicates: true });

    if (error) throw error;
  } catch (err) {
    console.error('Error logging module start:', err);
  }
};

export const fetchUserModuleProgress = async (userId: string, courseId?: number) => {
  try {
    let query = supabase.from('user_module_progress').select('*').eq('user_id', userId);
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching module progress:', err);
    return [];
  }
};

export const logXpEvent = async (userId: string, xp: number, challengeId: number) => {
  try {
    const { error } = await supabase
      .from('xp_events')
      .insert([
        {
          user_id: userId,
          source: 'challenge',
          source_id: challengeId, 
          xp: xp
        }
      ]);
      
    if (error) throw error;

    const { error: rpcError } = await supabase.rpc('add_xp', { 
      user_id: userId,
      xp: xp
    });

    if (rpcError) throw rpcError;

  } catch (err) {
    console.error('Error logging XP event:', err);
  }
};

export const fetchChallengeAttempts = async (userId: string, industry: Industry, difficulty: Difficulty) => {
  try {
    const { data, error } = await supabase
      .from('challenge_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('industry', industry)
      .eq('difficulty', difficulty)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map((row: any) => ({
      questionId: row.question_id,
      query: row.query,
      isCorrect: row.is_correct,
      feedback: '', 
      outputData: [], 
      pointsEarned: row.points_earned,
      timestamp: new Date(row.created_at).getTime()
    })) as SubmissionResult[];
  } catch (err) {
    console.error('Error fetching attempts:', err);
    return [];
  }
};

export const fetchAllUserAttempts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('challenge_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_correct', true); 
    
    if (error) throw error;
    
    // Deduplicate by question_id within industry/difficulty group logic is handled by caller or simple distinct here if needed.
    // For now returning raw rows.
    return data || [];
  } catch (err) {
    console.error('Error fetching all attempts:', err);
    return [];
  }
};

// --- Learning Path Enrollments (New) ---

export const fetchUserPathEnrollments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('learning_path_enrollments')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching path enrollments:', err);
    return [];
  }
};

export const enrollInLearningPath = async (userId: string, pathId: number) => {
  try {
    const { data: existing } = await supabase
      .from('learning_path_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('path_id', pathId)
      .maybeSingle();

    if (!existing) {
        await supabase
          .from('learning_path_enrollments')
          .insert({
            user_id: userId,
            path_id: pathId,
            status: 'in_progress'
          });
    }
    return true;
  } catch (err) {
    console.error('Error enrolling in path:', err);
    return false;
  }
};

export const updatePathEnrollmentStatus = async (userId: string, pathId: number, status: 'in_progress' | 'completed') => {
    try {
        const updates: any = { status };
        if (status === 'completed') updates.completed_at = new Date().toISOString();
        
        await supabase
            .from('learning_path_enrollments')
            .update(updates)
            .eq('user_id', userId)
            .eq('path_id', pathId);
    } catch (err) {
        console.error('Error updating path status:', err);
    }
};

// --- Course Enrollment Management ---

export const enrollInCourse = async (userId: string, courseId: number) => {
  try {
    // Check for existing enrollment to determine insert vs update
    const { data: existing } = await supabase
      .from('course_enrollments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
        // Just update access time
        await supabase
          .from('course_enrollments')
          .update({ last_accessed: new Date().toISOString() })
          .eq('id', existing.id);
    } else {
        // Create new enrollment
        await supabase
          .from('course_enrollments')
          .insert({ 
             user_id: userId, 
             course_id: courseId,
             status: 'enrolled',
             enrolled_at: new Date().toISOString(),
             last_accessed: new Date().toISOString()
          });
    }

    return true;
  } catch (err) {
    console.error('Error enrolling:', err);
    return false;
  }
};

export const fetchUserEnrollments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*, course:courses(*)')
      .eq('user_id', userId)
      .order('last_accessed', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    return [];
  }
};

export const updateEnrollmentStatus = async (userId: string, courseId: number, status?: 'in_progress' | 'completed') => {
    try {
        const updates: any = { last_accessed: new Date().toISOString() };
        if (status) {
            updates.status = status;
            if (status === 'completed') updates.completed_at = new Date().toISOString();
        }
        
        await supabase
            .from('course_enrollments')
            .update(updates)
            .eq('user_id', userId)
            .eq('course_id', courseId);
            
    } catch(err) {
        console.error("Error updating enrollment status", err);
    }
};

export const fetchUserCertificates = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_certificates')
      .select('*')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return data as Certificate[];
  } catch (err) {
    console.error('Error fetching certificates:', err);
    return [];
  }
};

export const logDailyActivity = async (userId: string) => {
  try {
    const { error } = await supabase.rpc('handle_new_login', { target_user_id: userId });
    if (error) throw error;
  } catch (err) {
    console.error('Error logging daily activity:', err);
  }
};

export const fetchLeaderboard = async () => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('global_rank', { ascending: true })
      .limit(10);

    if (error) {
       const { data: profiles, error: pError } = await supabase
         .from('profiles')
         .select('username, total_xp')
         .order('total_xp', { ascending: false })
         .limit(10);
       
       if (pError) throw pError;
       
       return profiles.map((p, idx) => ({
         rank: idx + 1,
         name: p.username,
         xp: p.total_xp,
         avatar: p.username.substring(0, 2).toUpperCase(),
         isUser: false
       }));
    }

    return data.map((row: any) => ({
      rank: row.global_rank,
      name: row.username,
      xp: row.total_xp,
      avatar: row.username.substring(0, 2).toUpperCase(),
      isUser: false
    }));
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return [];
  }
};

// --- Challenges Inventory Caching ---

export const fetchChallengeFromInventory = async (topic: string, industry: string, difficulty: string) => {
  try {
    const { data, error } = await supabase
      .from('challenges_inventory')
      .select('challenge_json')
      .eq('topic', topic)
      .eq('industry', industry)
      .eq('difficulty', difficulty)
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data?.challenge_json as Challenge | undefined;
  } catch (err) {
    console.error('Error fetching challenge from inventory:', err);
    return null;
  }
};

export const saveChallengeToInventory = async (topic: string, industry: string, difficulty: string, challenge: Challenge) => {
  try {
    // Basic check to avoid duplicates if unique constraint isn't perfect
    const existing = await fetchChallengeFromInventory(topic, industry, difficulty);
    if (existing) return;

    const { error } = await supabase
      .from('challenges_inventory')
      .insert([
        {
          topic,
          industry,
          difficulty,
          challenge_json: challenge
        }
      ]);

    if (error) {
        // Ignore duplicate key errors silently
        if (error.code !== '23505') {
            console.error('Error saving challenge to inventory:', error);
        }
    }
  } catch (err) {
    console.error('Error saving challenge to inventory:', err);
  }
};

// --- Admin Functions ---

export const fetchAllLearners = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('last_active', { ascending: false });
    
    if (error) {
        console.error('Supabase error fetching learners:', error);
        throw error;
    }
    return data || [];
  } catch (err) {
    console.error('Error fetching learners:', err);
    return [];
  }
};

export const updateLearnerPlan = async (userId: string, newPlan: string) => {
  try {
    const isPro = newPlan.toLowerCase().includes('pro');
    
    // Calculate new end date based on plan type
    let subscriptionEndDate: string | null = null;
    const now = new Date();

    if (newPlan.toLowerCase().includes('monthly')) {
      now.setDate(now.getDate() + 30);
      subscriptionEndDate = now.toISOString();
    } else if (newPlan.toLowerCase().includes('annual')) {
      now.setDate(now.getDate() + 365);
      subscriptionEndDate = now.toISOString();
    }
    // If free, end date is cleared (null)

    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: newPlan,
        is_pro: isPro,
        subscription_end_date: subscriptionEndDate
      })
      .eq('id', userId)
      .select();

    if (error) throw error;
    
    // If update successful but no rows returned, usually means RLS filtered it out
    if (data.length === 0) {
        console.warn('Admin update successful but no rows modified. Check RLS policies.');
    }
    
    return true;
  } catch (err) {
    console.error('Error updating learner plan:', err);
    return false;
  }
};

export const fetchSavedChallenges = async () => {
  try {
    const { data, error } = await supabase
      .from('saved_challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SavedChallenge[];
  } catch (err) {
    console.error('Error fetching saved challenges:', err);
    return [];
  }
};

export const fetchPublishedChallenges = async () => {
  try {
    const { data, error } = await supabase
      .from('saved_challenges')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SavedChallenge[];
  } catch (err) {
    console.error('Error fetching published challenges:', err);
    return [];
  }
};

export const fetchSavedChallengeById = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('saved_challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as SavedChallenge;
  } catch (err) {
    console.error('Error fetching challenge by id:', err);
    return null;
  }
};

export const saveAdminChallenge = async (challenge: Challenge, industry: string, difficulty: string) => {
  try {
    const { error } = await supabase
      .from('saved_challenges')
      .insert([
        {
          title: challenge.title,
          topic: challenge.topic,
          difficulty: difficulty,
          industry: industry,
          challenge_json: challenge,
          is_published: true
        }
      ]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error saving challenge:', err);
    return false;
  }
};

export const toggleChallengePublish = async (id: number, currentStatus: boolean) => {
  try {
    const { error } = await supabase
      .from('saved_challenges')
      .update({ is_published: !currentStatus })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error toggling challenge status:', err);
    return false;
  }
};

export const deleteSavedChallenge = async (id: number) => {
  try {
    const { error } = await supabase
      .from('saved_challenges')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting challenge:', err);
    return false;
  }
};

// --- Full Course Functions (New Schema) ---

// Create the parent course record
export const createCourseDraft = async (course: Partial<Course>) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([{
        title: course.title,
        industry: course.industry,
        target_role: course.target_role,
        skill_level: course.skill_level,
        main_context: course.main_context,
        status: 'draft'
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Course;
  } catch (err) {
    console.error('Error creating course draft:', err);
    return null;
  }
};

// Bulk insert modules for a course
export const createCourseModules = async (courseId: number, modules: CourseModule[]) => {
  try {
    const rows = modules.map((m, idx) => ({
      course_id: courseId,
      sequence_order: m.sequence_order || idx + 1, // Prioritize provided sequence_order
      title: m.title,
      skill_focus: m.skill_focus,
      task_description: m.task_description,
      expected_outcome: m.expected_outcome,
      estimated_time: m.estimated_time,
      challenge_json: m.challenge_json || null
    }));

    const { error } = await supabase
      .from('course_modules')
      .insert(rows);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error creating modules:', err);
    return false;
  }
};

export const fetchCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, modules:course_modules(*)')
      .order('created_at', { ascending: false });

    if (error) {
       console.error(error);
       return [];
    }
    
    // Sort modules by sequence inside
    const courses = data.map((c: any) => ({
        ...c,
        modules: c.modules?.sort((a: any, b: any) => a.sequence_order - b.sequence_order) || []
    }));

    return courses as Course[];
  } catch (err) {
    console.error('Error fetching courses:', err);
    return [];
  }
};

export const fetchPublishedCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, modules:course_modules(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
       console.error(error);
       return [];
    }
    
    // Sort modules by sequence inside
    const courses = data.map((c: any) => ({
        ...c,
        modules: c.modules?.sort((a: any, b: any) => a.sequence_order - b.sequence_order) || []
    }));

    return courses as Course[];
  } catch (err) {
    console.error('Error fetching published courses:', err);
    return [];
  }
};

export const fetchCourseById = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, modules:course_modules(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Sort modules
    if (data.modules) {
        data.modules.sort((a: any, b: any) => a.sequence_order - b.sequence_order);
    }
    
    return data as Course;
  } catch (err) {
    console.error('Error fetching course:', err);
    return null;
  }
};

export const updateCourseStatus = async (courseId: number, status: string) => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ status })
      .eq('id', courseId);
    if (error) throw error;
    return true;
  } catch(err) {
    console.error('Error updating status:', err);
    return false;
  }
};

export const updateCourseDetails = async (courseId: number, updates: Partial<Course>) => {
  try {
    const { error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId);
    if (error) throw error;
    return true;
  } catch(err) {
    console.error('Error updating course details:', err);
    return false;
  }
};

// Update specific module (e.g., adding generated content)
export const updateCourseModule = async (moduleId: number, updates: Partial<CourseModule>) => {
  try {
    const { error } = await supabase
      .from('course_modules')
      .update(updates)
      .eq('id', moduleId);
    if (error) throw error;
    return true;
  } catch(err) {
    console.error('Error updating module:', err);
    return false;
  }
};

export const deleteCourseModule = async (moduleId: number) => {
  try {
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', moduleId);
    if (error) throw error;
    return true;
  } catch(err) {
    console.error('Error deleting module:', err);
    return false;
  }
};

export const deleteCourse = async (id: number) => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting course:', err);
    return false;
  }
};

// --- Plan Settings (Updated to use correct schema: id, tier, cycle, amount) ---

export const fetchPlanSettings = async (): Promise<PlanSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('subscription_prices')
      .select('tier, cycle, amount');

    if (error) {
      console.error('Error fetching subscription_prices:', error);
      return DEFAULT_PLAN_SETTINGS;
    }

    const settings: PlanSettings = { ...DEFAULT_PLAN_SETTINGS };

    if (data && data.length > 0) {
        data.forEach((row: any) => {
            if (row.tier === 'basic' || row.tier === 'pro') {
                const t = row.tier as 'basic' | 'pro';
                if (row.cycle === 'monthly') {
                    settings[t].monthly = row.amount;
                } else if (row.cycle === 'annual') {
                    settings[t].annual = row.amount;
                }
            }
        });
    }
    
    return settings;
  } catch (err) {
    console.error('Error fetching plan settings:', err);
    return DEFAULT_PLAN_SETTINGS;
  }
};

export const savePlanSettings = async (settings: PlanSettings) => {
  try {
    // Upsert individual rows based on the schema
    const updates = [
        { id: 'basic_monthly', tier: 'basic', cycle: 'monthly', amount: settings.basic.monthly, updated_at: new Date() },
        { id: 'basic_annual', tier: 'basic', cycle: 'annual', amount: settings.basic.annual, updated_at: new Date() },
        { id: 'pro_monthly', tier: 'pro', cycle: 'monthly', amount: settings.pro.monthly, updated_at: new Date() },
        { id: 'pro_annual', tier: 'pro', cycle: 'annual', amount: settings.pro.annual, updated_at: new Date() }
    ];

    const { error } = await supabase
      .from('subscription_prices')
      .upsert(updates, { onConflict: 'id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error saving plan settings:', err);
    return false;
  }
};

// --- Learning Paths (Bundles) ---

export const fetchLearningPaths = async () => {
  try {
    const { data, error } = await supabase
      .from('learning_paths')
      .select(`
        *,
        courses:learning_path_courses(
          sequence_order,
          course:courses(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((path: any) => ({
      ...path,
      courses: path.courses
        ?.sort((a: any, b: any) => a.sequence_order - b.sequence_order)
        .map((c: any) => c.course)
        .filter((c: any) => c !== null)
    })) as LearningPath[];
  } catch (err) {
    console.error('Error fetching learning paths:', err);
    return [];
  }
};

export const fetchPublishedLearningPaths = async () => {
  try {
    const { data, error } = await supabase
      .from('learning_paths')
      .select(`
        *,
        courses:learning_path_courses(
          sequence_order,
          course:courses(*, modules:course_modules(id))
        )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((path: any) => ({
      ...path,
      courses: path.courses
        ?.sort((a: any, b: any) => a.sequence_order - b.sequence_order)
        .map((c: any) => ({...c.course, modules: c.course.modules}))
        .filter((c: any) => c !== null)
    })) as LearningPath[];
  } catch (err) {
    console.error('Error fetching published learning paths:', err);
    return [];
  }
};

export const createLearningPath = async (path: Partial<LearningPath>) => {
  try {
    const { data, error } = await supabase
      .from('learning_paths')
      .insert([{
        title: path.title,
        description: path.description,
        target_role: path.target_role,
        industry: path.industry,
        is_published: path.is_published || false
      }])
      .select()
      .single();

    if (error) throw error;
    return data as LearningPath;
  } catch (err) {
    console.error('Error creating learning path:', err);
    return null;
  }
};

export const updateLearningPath = async (id: number, updates: Partial<LearningPath>) => {
  try {
    const { error } = await supabase
      .from('learning_paths')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating learning path:', err);
    return false;
  }
};

export const deleteLearningPath = async (id: number) => {
  try {
    const { error } = await supabase
      .from('learning_paths')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting learning path:', err);
    return false;
  }
};

export const addCourseToPath = async (pathId: number, courseId: number, sequenceOrder: number) => {
  try {
    const { error } = await supabase
      .from('learning_path_courses')
      .insert({
        path_id: pathId,
        course_id: courseId,
        sequence_order: sequenceOrder
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error adding course to path:', err);
    return false;
  }
};

export const removeCourseFromPath = async (pathId: number, courseId: number) => {
  try {
    const { error } = await supabase
      .from('learning_path_courses')
      .delete()
      .eq('path_id', pathId)
      .eq('course_id', courseId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error removing course from path:', err);
    return false;
  }
};

// --- Achievement System ---

export const fetchUserAchievements = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data as UserAchievement[];
  } catch (err) {
    console.error('Error fetching achievements:', err);
    return [];
  }
};

export const unlockAchievement = async (userId: string, achievementKey: string, title: string, description: string) => {
  try {
    const { error } = await supabase
      .from('user_achievements')
      .insert({ 
        user_id: userId, 
        achievement_key: achievementKey, 
        title, 
        description 
      }); 
      // The table has a UNIQUE constraint on (user_id, achievement_key), so insert will fail if it exists.
      // We catch the error silently if it's a duplicate.
      
    if (error && error.code !== '23505') { // 23505 is unique_violation
        throw error;
    }
    
    return !error; // Return true if inserted successfully (new unlock)
  } catch (err) {
    // console.error('Error unlocking achievement:', err);
    return false;
  }
};

export const fetchCompletedCourseCount = async (userId: string) => {
    try {
        const { count, error } = await supabase
            .from('course_enrollments')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');
            
        if (error) throw error;
        return count || 0;
    } catch(err) {
        console.error("Error fetching completed course count", err);
        return 0;
    }
};
