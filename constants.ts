
import { ChallengeDef, PlanSettings, Achievement } from './types';

export const DEFAULT_PLAN_SETTINGS: PlanSettings = {
  basic: { monthly: 50, annual: 499 },
  pro: { monthly: 99, annual: 929 }
};

export const ACHIEVEMENTS: Achievement[] = [
  // Challenge Milestones
  { id: 'fast-starter', title: 'Fast Starter', description: 'Complete 5 challenges', target: 5, type: 'challenge', iconName: 'Zap', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  { id: 'rising-star', title: 'Rising Star', description: 'Complete 10 challenges', target: 10, type: 'challenge', iconName: 'Star', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  { id: 'dedicated-learner', title: 'Dedicated Learner', description: 'Complete 25 challenges', target: 25, type: 'challenge', iconName: 'BookOpen', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { id: 'challenge-warrior', title: 'Challenge Warrior', description: 'Complete 50 challenges', target: 50, type: 'challenge', iconName: 'Shield', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  { id: 'centurion', title: 'Centurion', description: 'Complete 100 challenges', target: 100, type: 'challenge', iconName: 'Crown', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },

  // XP Milestones
  { id: '1k-club', title: '1K Club', description: 'Earn 1,000 XP', target: 1000, type: 'xp', iconName: 'Trophy', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' },
  { id: '5k-club', title: '5K Club', description: 'Earn 5,000 XP', target: 5000, type: 'xp', iconName: 'Award', color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20' },
  { id: 'xp-legend', title: 'XP Legend', description: 'Earn 10,000 XP', target: 10000, type: 'xp', iconName: 'Zap', color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20' },

  // Streak Milestones
  { id: 'week-warrior', title: 'Week Warrior', description: '7-day streak', target: 7, type: 'streak', iconName: 'Flame', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
  { id: 'streak-master', title: 'Streak Master', description: '30-day streak', target: 30, type: 'streak', iconName: 'Flame', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },

  // Course Milestones
  { id: 'course-finisher', title: 'Course Finisher', description: 'Complete 1 course', target: 1, type: 'course', iconName: 'GraduationCap', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  { id: 'knowledge-seeker', title: 'Knowledge Seeker', description: 'Complete 5 courses', target: 5, type: 'course', iconName: 'Layers', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
];

export const BEGINNER_CURRICULUM: ChallengeDef[] = [
  { id: 1, topic: "SELECT & Aliasing", description: "Retrieve specific columns and rename them using AS." },
  { id: 2, topic: "SELECT DISTINCT", description: "Retrieve unique values from a column to remove duplicates." },
  { id: 3, topic: "SELECT * (Wildcard)", description: "Retrieve all columns from a table." },
  { id: 4, topic: "LIMIT / TOP", description: "Restrict the number of rows returned." },
  { id: 5, topic: "WHERE & Comparison", description: "Filter rows using =, !=." },
  { id: 6, topic: "WHERE & Comparison", description: "Filter rows using <, > operators." },
  { id: 7, topic: "AND Logic", description: "Filter rows requiring multiple conditions to be true." },
  { id: 8, topic: "OR Logic", description: "Filter rows where at least one condition is true." },
  { id: 9, topic: "NOT Logic", description: "Filter rows by negating a condition." },
  { id: 10, topic: "BETWEEN", description: "Filter values within a specific range." },
  { id: 11, topic: "IN Operator", description: "Filter values matching a list of possibilities." },
  { id: 12, topic: "LIKE Wildcards", description: "Pattern matching using % and _." },
  { id: 13, topic: "IS NULL / IS NOT NULL", description: "Filter for missing or present values." },
  { id: 14, topic: "ORDER BY", description: "Sort results in Ascending or Descending order." },
  { id: 15, topic: "Multi-Column Sorting", description: "Sort by one column, then another." },
  { id: 16, topic: "COUNT()", description: "Count the number of rows matching a criteria." },
  { id: 17, topic: "SUM()", description: "Calculate the total sum of a numeric column." },
  { id: 18, topic: "AVG()", description: "Calculate the average value of a numeric column." },
  { id: 19, topic: "MIN() / MAX()", description: "Find the minimum and maximum values." },
  { id: 20, topic: "GROUP BY & HAVING", description: "Group rows and filter groups based on aggregate values." },
];

export const INTERMEDIATE_CURRICULUM: ChallengeDef[] = [
  { id: 1, topic: "GROUP BY (Advanced)", description: "Group by multiple columns with aggregation." },
  { id: 2, topic: "INNER JOIN", description: "Combine rows from two tables based on a related column." },
  { id: 3, topic: "LEFT JOIN", description: "Retrieve all records from the left table and matching records from the right." },
  { id: 4, topic: "UNION / UNION ALL", description: "Combine result sets of two or more SELECT statements." },
  { id: 5, topic: "INTERSECT / EXCEPT", description: "Return common rows or unique rows between two queries." },
  { id: 6, topic: "CASE (Simple)", description: "Conditional logic to transform data values." },
  { id: 7, topic: "CASE (Searched)", description: "Complex conditional logic with multiple criteria." },
  { id: 8, topic: "COALESCE / NULLIF", description: "Handle NULL values effectively." },
  { id: 9, topic: "CAST / CONVERT", description: "Change data types of columns." },
  { id: 10, topic: "String Functions (Basic)", description: "Use CONCAT and SUBSTRING." },
  { id: 11, topic: "String Functions (Advanced)", description: "Use TRIM, LENGTH, and REPLACE." },
  { id: 12, topic: "Date Functions (Diff)", description: "Calculate differences between dates (DATEDIFF)." },
  { id: 13, topic: "Date Functions (Add/Extract)", description: "Add intervals to dates or extract parts (DATEADD, EXTRACT)." },
  { id: 14, topic: "Numeric Functions", description: "Use ROUND, CEIL, FLOOR, ABS." },
  { id: 15, topic: "Subqueries (WHERE)", description: "Use a subquery inside a WHERE clause." },
  { id: 16, topic: "Subqueries (SELECT/FROM)", description: "Use subqueries in the SELECT list or FROM clause." },
  { id: 17, topic: "CTEs (Simple)", description: "Create a Common Table Expression for readability." },
  { id: 18, topic: "CTEs (Multi-step)", description: "Chain CTEs for complex logic." },
  { id: 19, topic: "Complex Joins", description: "Join more than two tables to solve a business problem." },
  { id: 20, topic: "Capstone Logic", description: "Combine Aggregates, Joins, and Logic for a complex report." },
];
