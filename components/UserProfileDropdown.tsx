
import React from 'react';
import { User, SubscriptionTier } from '../types';
import { LogOut, LayoutDashboard, Shield, List, Settings, ChevronDown, Star } from 'lucide-react';

interface UserProfileDropdownProps {
  user: User;
  subscriptionTier?: SubscriptionTier;
  onLogout: () => void;
  onNavigateHome?: () => void;
  onNavigateAdmin?: () => void;
  onShowSettings?: () => void;
  onNavigateChallenges?: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ 
  user, 
  subscriptionTier, 
  onLogout, 
  onNavigateHome, 
  onNavigateAdmin,
  onShowSettings,
  onNavigateChallenges
}) => {
  const getFirstName = (fullName: string) => {
    if (!fullName) return 'Learner';
    const namePart = fullName.includes('@') ? fullName.split('@')[0] : fullName;
    const first = namePart.split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  };
  
  const firstName = getFirstName(user.username);

  return (
    <div className="relative group h-full flex items-center ml-2 z-50">
        <button className="flex items-center gap-2 outline-none group-hover:opacity-100 opacity-90 transition-opacity py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-corp-cyan to-corp-royal flex items-center justify-center text-white font-bold text-xs shadow-lg relative">
                {firstName.charAt(0).toUpperCase()}
                {subscriptionTier === 'pro' && (
                    <div className="absolute -top-1 -right-1 bg-corp-dark rounded-full p-0.5">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    </div>
                )}
            </div>
            <span className="text-white font-bold text-sm hidden sm:block">{firstName}</span>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-white transition-colors" />
        </button>
        
        {/* Dropdown Menu */}
        <div className="absolute right-0 top-[calc(100%-5px)] pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
            <div className="bg-corp-dark border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1 backdrop-blur-xl relative">
                {onNavigateHome && (
                    <button 
                        onClick={onNavigateHome}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                        <LayoutDashboard size={16} />
                        Dashboard
                    </button>
                )}
                
                {user.isAdmin && onNavigateAdmin && (
                  <button 
                      onClick={onNavigateAdmin}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:text-white hover:bg-white/5 transition-colors text-left font-bold"
                  >
                      <Shield size={16} />
                      Admin Portal
                  </button>
                )}
                
                {onShowSettings && (
                    <button 
                        onClick={onShowSettings}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                        <Settings size={16} />
                        Settings
                    </button>
                )}

                <div className="h-px bg-white/10 my-1"></div>
                
                <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </div>
    </div>
  );
};
