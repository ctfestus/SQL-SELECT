
export type Difficulty = 'Beginner' | 'Intermediate';

export enum Industry {
  ECOMMERCE = 'E-commerce',
  FINANCE = 'Finance & Banking',
  HEALTHCARE = 'Healthcare',
  TECH = 'SaaS & Technology',
  LOGISTICS = 'Logistics & Supply Chain',
  MARKETING = 'Digital Marketing',
  PERSONALIZED = 'Personalized'
}

export type SubscriptionTier = 'free' | 'basic' | 'pro';

export type ChallengeType = 'sql' | 'mcq' | 'debug' | 'completion';

export interface User {
  id?: string;
  username: string;
  email?: string;
  isAdmin?: boolean;
}

export interface UserStats {
  totalPoints: number;
  totalCompleted: number;
  streak: number;
  lastActive: number;
  lastIndustry?: Industry | null;
  lastDifficulty?: Difficulty | null;
  lastContext?: string;
  lastIndex?: number;
  subscriptionTier: SubscriptionTier;
}

export interface PlanSettings {
  basic: {
    monthly: number;
    annual: number;
  };
  pro: {
    monthly: number;
    annual: number;
  };
}

export interface PlanPermission {
  tier: string;
  course_lesson_limit: number; // -1 for unlimited
  allow_ai_tutor: boolean;
  allow_live_instructor: boolean;
}

export interface ChallengeDef {
  id: number;
  topic: string;
  description: string; // Internal description for the prompt
}

export interface SchemaTable {
  tableName: string;
  columns: string[];
  data: string[][]; // 2D array of cell values
}

export interface Challenge {
  id: number;
  title: string;
  type?: ChallengeType; // Defaults to 'sql' if undefined
  topic: string;
  scenario: string;
  task: string;
  schema: SchemaTable[]; // Structured array of tables
  difficulty: Difficulty;
  requiredConcepts: string[];
  // New fields for blended types
  options?: string[]; // For MCQ
  correctAnswer?: string; // For MCQ
  initialCode?: string; // For Debug/Completion
}

export interface SavedChallenge {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  industry: string;
  challenge_json: Challenge;
  created_at: string;
  is_published: boolean;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_title: string;
  certificate_url: string;
  issued_at: string;
}

// -- Course Types matching SQL Schema --

export interface CourseOutlineItem {
  title: string;
  skillFocus: string;
  taskDescription: string;
  expectedOutcome: string;
  difficulty: string;
  estimatedTime: string;
}

export interface CourseModule {
  id?: number;
  course_id?: number;
  sequence_order: number;
  title: string;
  skill_focus: string;
  task_description: string;
  expected_outcome: string;
  estimated_time: string;
  challenge_json?: Challenge | null;
  // UI helper for outline generation
  moduleType?: ChallengeType;
}

export interface Course {
  id: number;
  title: string;
  industry: string;
  target_role: string;
  skill_level: string;
  main_context: string;
  status: 'draft' | 'outline_ready' | 'generating' | 'published';
  created_at: string;
  modules?: CourseModule[]; // Joined data
}

export interface LearningPath {
  id: number;
  title: string;
  description: string;
  target_role: string;
  industry: string;
  is_published: boolean;
  created_at: string;
  courses?: Course[]; // Joined for UI
}

export interface LearningPathCourse {
  id: number;
  path_id: number;
  course_id: number;
  sequence_order: number;
}

export interface AssessmentState {
  industry: Industry | null;
  customContext?: string; // For personalized challenges
  difficulty: Difficulty | null;
  isOverviewConfirmed: boolean; // Tracks if user passed the overview page
  currentQuestionIndex: number;
  points: number;
  history: SubmissionResult[];
  isComplete: boolean;
  activeSavedChallengeId?: number;
  activeCourseId?: number;
}

export interface SubmissionResult {
  questionId: number;
  query: string;
  isCorrect: boolean;
  feedback: string;
  bestPractice?: string; // New field for educational tips
  outputData: any[]; // Array of objects for table
  pointsEarned: number;
  timestamp: number;
}

export interface ValidationResponse {
  isCorrect: boolean;
  feedback: string;
  bestPractice?: string; // New field for educational tips
  data: any[];
  points: number;
}

// -- Achievements --

export interface Achievement {
  id: string;
  title: string;
  description: string;
  target: number;
  type: 'challenge' | 'xp' | 'streak' | 'course';
  iconName: string; // Map to Lucide icon in component
  color: string;
  bg: string;
}

export interface UserAchievement {
  user_id: string;
  achievement_key: string;
  title: string;
  description: string;
  unlocked_at: string;
}
