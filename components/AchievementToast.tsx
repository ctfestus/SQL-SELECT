
import React, { useEffect, useState } from 'react';
import { Trophy, Zap, Star, BookOpen, Shield, Crown, Award, Flame, GraduationCap, Library, Layers } from 'lucide-react';

interface AchievementToastProps {
  title: string;
  iconName: string;
  onClose: () => void;
  className?: string;
}

const ICONS: Record<string, any> = {
  Zap, Star, BookOpen, Shield, Crown, Trophy, Award, Flame, GraduationCap, Library, Layers
};

export const AchievementToast: React.FC<AchievementToastProps> = ({ title, iconName, onClose, className = "top-24" }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);
    
    // Auto dismiss
    const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = ICONS[iconName] || Trophy;

  return (
    <div className={`fixed right-6 z-[200] transition-all duration-500 transform ${className} ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-corp-dark border border-corp-cyan/30 rounded-2xl shadow-[0_0_30px_rgba(0,164,239,0.3)] p-4 flex items-center gap-4 relative overflow-hidden backdrop-blur-xl min-w-[280px]">
         
         {/* Shiny effect */}
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
         <div className="absolute top-0 right-0 w-20 h-20 bg-corp-cyan/20 rounded-full blur-xl -z-10"></div>

         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-corp-cyan to-corp-royal flex items-center justify-center text-white shadow-lg shrink-0">
            <Icon size={24} className="fill-white/20" />
         </div>
         
         <div className="pr-4">
            <div className="text-[10px] font-black text-corp-cyan uppercase tracking-widest mb-0.5">Achievement Unlocked</div>
            <div className="font-bold text-white text-lg leading-tight">{title}</div>
         </div>
      </div>
    </div>
  );
};
