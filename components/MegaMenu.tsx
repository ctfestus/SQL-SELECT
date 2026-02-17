
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, GraduationCap, Layers, ChevronRight, Code2, Sparkles, Trophy, Globe, ShoppingCart, TrendingUp, Activity, Truck, Megaphone, ArrowRight, PlayCircle, Star } from 'lucide-react';
import { fetchPublishedCourses, fetchPublishedChallenges } from '../services/supabaseService';
import { Course, SavedChallenge, Industry } from '../types';

interface MegaMenuProps {
  onNavigateCourses: () => void;
  onStartCourse?: (id: number) => void;
  onStartChallenge?: (id: number, industry: string, difficulty: string) => void;
  isLoggedIn?: boolean;
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

export const MegaMenu: React.FC<MegaMenuProps> = ({ 
  onNavigateCourses, 
  onStartCourse, 
  onStartChallenge,
  isLoggedIn = false
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [challenges, setChallenges] = useState<SavedChallenge[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'courses'>('courses');
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [cData, chData] = await Promise.all([
        fetchPublishedCourses(),
        fetchPublishedChallenges()
      ]);
      setCourses(cData || []);
      setChallenges(chData || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleStartCourse = (id: number) => {
    if (onStartCourse) {
      onStartCourse(id);
      setIsHovered(false);
    } else {
      onNavigateCourses();
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // Grace period
  };

  // --- Render Helpers ---

  const NavItem = ({ 
    id, 
    label, 
    icon: Icon, 
    description 
  }: { 
    id: 'courses', 
    label: string, 
    icon: any,
    description: string 
  }) => {
    const isActive = activeCategory === id;
    return (
      <button 
        onMouseEnter={() => setActiveCategory(id)}
        onClick={onNavigateCourses}
        className={`w-full group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border-l-4 text-left ${
            isActive 
            ? 'bg-white border-corp-blue shadow-sm' 
            : 'hover:bg-slate-100 border-transparent'
        }`}
      >
        <div className={`p-2.5 rounded-lg transition-colors shrink-0 ${
            isActive 
            ? 'bg-corp-blue/10 text-corp-blue' 
            : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-corp-blue group-hover:shadow-sm'
        }`}>
           <Icon size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
           <div className={`font-bold text-sm mb-0.5 flex items-center justify-between ${isActive ? 'text-corp-dark' : 'text-slate-700 group-hover:text-corp-dark'}`}>
              {label}
              <ChevronRight size={14} className={`transition-transform duration-300 ${isActive ? 'translate-x-0 opacity-100 text-corp-cyan' : '-translate-x-2 opacity-0'}`} />
           </div>
           <div className="text-[11px] text-slate-500 leading-tight font-medium">
              {description}
           </div>
        </div>
      </button>
    );
  };

  const CourseCard: React.FC<{ course: Course, featured?: boolean }> = ({ course, featured = false }) => (
    <button 
      onClick={() => handleStartCourse(course.id)} 
      className={`group relative flex flex-col text-left rounded-xl transition-all duration-200 border overflow-hidden ${
          featured 
          ? 'bg-gradient-to-br from-corp-blue/5 to-white border-corp-blue/20 hover:border-corp-blue hover:shadow-md p-5' 
          : 'bg-white border-slate-200 hover:border-corp-cyan hover:shadow-md p-4'
      }`}
    >
      <div className="flex justify-between items-start mb-3 w-full">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
              featured 
              ? 'bg-corp-blue/10 text-corp-blue border-corp-blue/20' 
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
             {course.skill_level}
          </span>
          {featured && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
      </div>
      
      <h4 className={`font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-corp-blue transition-colors ${featured ? 'text-lg' : 'text-sm'}`}>
          {course.title}
      </h4>
      
      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {course.main_context}
      </p>
      
      <div className="mt-auto flex items-center justify-between w-full pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
             <Globe size={10} /> {course.industry}
          </div>
          <ArrowRight size={14} className="text-corp-cyan -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200" />
      </div>
    </button>
  );

  return (
    <div 
      className="h-full flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        onClick={onNavigateCourses}
        className={`group flex items-center gap-1.5 text-[15px] font-medium transition-colors outline-none ${
            isHovered 
            ? 'text-white' 
            : 'text-slate-300 hover:text-white'
        }`}
      >
        Learn
        <ChevronDown size={14} className={`transition-transform duration-300 ${isHovered ? 'rotate-180 text-corp-cyan' : 'text-slate-400 group-hover:text-white'}`} />
      </button>

      {/* Mega Menu Overlay */}
      <div 
        className={`fixed top-[80px] left-0 w-full z-[100] perspective-1000 transition-all duration-200 ease-out origin-top ${
          isHovered ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="container mx-auto px-6 max-w-7xl">
           <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mt-2 grid grid-cols-12 gap-0 relative min-h-[480px] border-t-4 border-corp-cyan">
              
              {/* COL 1: Navigation Sidebar */}
              <div className="col-span-3 bg-slate-50 border-r border-slate-200 py-6 px-4 flex flex-col gap-2 relative">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-4">
                    Library
                 </div>
                 
                 <div className="flex-1 space-y-1">
                    <NavItem 
                        id="courses" 
                        label="Structured Courses" 
                        icon={GraduationCap}
                        description="Step-by-step career paths."
                    />
                 </div>

                 {/* Bottom CTA */}
                 <div className="mt-4 p-4 rounded-xl bg-corp-dark text-white border border-corp-dark group cursor-pointer hover:bg-corp-blue transition-colors shadow-lg" onClick={onNavigateCourses}>
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-bold">Full Catalog</div>
                        <ArrowRight size={14} className="text-corp-cyan group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="text-[10px] text-blue-200">Browse all modules</div>
                 </div>
              </div>

              {/* COL 2 & 3: Dynamic Content Area */}
              <div className="col-span-9 p-8 bg-white text-slate-800">
                  
                  {loading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                          <div className="w-8 h-8 border-2 border-corp-blue border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-bold uppercase tracking-wider text-corp-blue">Loading Library...</span>
                      </div>
                  ) : (
                      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                        
                        {/* COURSES VIEW */}
                        {activeCategory === 'courses' && (
                            <div className="grid grid-cols-2 gap-8 h-full">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Sparkles size={14} className="text-corp-orange" /> Featured Paths
                                    </h3>
                                    {courses.slice(0, 2).map(course => <CourseCard key={course.id} course={course} featured />)}
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Layers size={14} className="text-corp-blue" /> Latest Modules
                                        </h3>
                                        <button onClick={onNavigateCourses} className="text-[10px] font-bold text-corp-blue hover:text-corp-dark transition-colors uppercase tracking-wider flex items-center gap-1">
                                            View All <ChevronRight size={10} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {courses.slice(2, 5).map(course => <CourseCard key={course.id} course={course} />)}
                                        {courses.length < 3 && <div className="text-sm text-slate-400 italic p-4 text-center border border-slate-100 rounded-xl border-dashed">More content coming soon.</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                      </div>
                  )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
