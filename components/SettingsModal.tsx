import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { updateProfile } from '../services/supabaseService';
import { X, User as UserIcon, Lock, Save, CheckCircle2, AlertCircle, Shield, Loader2, Sparkles, ChevronRight, Mail, KeyRound, Fingerprint, History } from 'lucide-react';

interface SettingsModalProps {
  user: User;
  onClose: () => void;
  onUserUpdate: (updatedUser: User) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [username, setUsername] = useState(user.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      if (user.id) {
         const success = await updateProfile(user.id, { username });
         if (success) {
            await supabase.auth.updateUser({ data: { username } });
            onUserUpdate({ ...user, username });
            setMessage({ type: 'success', text: 'Profile updated successfully.' });
         } else {
            throw new Error('Failed to update profile.');
         }
      }
    } catch (err) {
       setMessage({ type: 'error', text: 'An error occurred while updating profile.' });
    } finally {
       setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match or are empty.' });
        return;
    }
    if (newPassword.length < 8) {
         setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
         return;
    }

    setLoading(true);
    setMessage(null);

    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password updated successfully.' });
        setNewPassword('');
        setConfirmPassword('');
    } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
        setLoading(false);
    }
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
       {/* Darkened Backdrop */}
       <div 
         className="absolute inset-0 bg-[#020015]/90 backdrop-blur-md transition-opacity duration-500" 
         onClick={onClose} 
       />
       
       {/* Main Modal Card */}
       <div className="relative w-full max-w-4xl bg-corp-dark rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[700px] max-h-[90vh] animate-in zoom-in-95 duration-300 isolate ring-1 ring-white/5">
          
          {/* Deep Ambient Background Effects - Supporting Color Theme */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
             {/* Corp Royal Blob Top Left */}
             <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-corp-royal/20 rounded-full blur-[100px] mix-blend-screen"></div>
             {/* Corp Cyan Blob Bottom Right */}
             <div className="absolute bottom-[0%] right-[0%] w-[50%] h-[50%] bg-corp-cyan/10 rounded-full blur-[100px] mix-blend-screen"></div>
             {/* Corp Orange Blob (Subtle Accent) */}
             <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-corp-orange/5 rounded-full blur-[80px] mix-blend-overlay"></div>
          </div>

          {/* Sidebar Navigation */}
          <div className="w-full md:w-72 bg-black/20 backdrop-blur-sm border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col relative z-20">
             
             {/* User Profile Card */}
             <div className="flex flex-col items-center text-center mb-8 pt-4">
                <div className="relative group mb-4">
                    <div className="absolute inset-0 bg-gradient-to-tr from-corp-cyan to-corp-royal rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-corp-cyan to-corp-royal p-[3px] relative z-10">
                       <div className="w-full h-full rounded-full bg-corp-dark flex items-center justify-center relative overflow-hidden group-hover:scale-[0.98] transition-transform duration-300">
                          {/* Inner gradient sheen */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-3xl font-black text-white">{getInitials(user.username)}</span>
                       </div>
                    </div>
                </div>
                
                <h2 className="text-lg font-bold text-white mb-1 truncate w-full px-2">{user.username}</h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-corp-cyan animate-pulse"></span>
                  <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wide">Online</span>
                </div>
             </div>

             {/* Separator */}
             <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>

             {/* Navigation Tabs */}
             <nav className="flex flex-col gap-2 w-full">
                <button
                   onClick={() => { setActiveTab('profile'); setMessage(null); }}
                   className={`group relative px-4 py-3.5 rounded-xl text-sm font-bold text-left flex items-center justify-between transition-all duration-300 ${
                      activeTab === 'profile' 
                      ? 'bg-gradient-to-r from-corp-royal to-corp-blue text-white shadow-lg shadow-corp-royal/20 border border-white/10' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                   }`}
                >
                   <div className="flex items-center gap-3 relative z-10">
                      <UserIcon size={18} className={activeTab === 'profile' ? 'text-white' : 'text-slate-500 group-hover:text-corp-cyan transition-colors'} /> 
                      Account Profile
                   </div>
                   {activeTab === 'profile' && <ChevronRight size={16} className="text-white/50" />}
                </button>

                <button
                   onClick={() => { setActiveTab('security'); setMessage(null); }}
                   className={`group relative px-4 py-3.5 rounded-xl text-sm font-bold text-left flex items-center justify-between transition-all duration-300 ${
                      activeTab === 'security' 
                      ? 'bg-gradient-to-r from-corp-royal to-corp-blue text-white shadow-lg shadow-corp-royal/20 border border-white/10' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                   }`}
                >
                   <div className="flex items-center gap-3 relative z-10">
                      <Shield size={18} className={activeTab === 'security' ? 'text-white' : 'text-slate-500 group-hover:text-corp-cyan transition-colors'} /> 
                      Security & Auth
                   </div>
                   {activeTab === 'security' && <ChevronRight size={16} className="text-white/50" />}
                </button>
             </nav>
             
             <div className="mt-auto pt-6 text-center">
               <p className="text-[10px] text-slate-600 font-mono flex items-center justify-center gap-1 opacity-50">
                  <Fingerprint size={10} /> User ID: {user.id?.slice(0, 8)}...
               </p>
             </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 relative flex flex-col bg-white/[0.01]">
             
             {/* Header */}
             <div className="p-8 pb-6 flex justify-between items-start border-b border-white/5">
               <div>
                 <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                   {activeTab === 'profile' ? (
                       <>
                         <span className="p-2 rounded-lg bg-corp-cyan/10 text-corp-cyan"><UserIcon size={24} /></span>
                         Edit Profile
                       </>
                   ) : (
                       <>
                         <span className="p-2 rounded-lg bg-corp-orange/10 text-corp-orange"><Lock size={24} /></span>
                         Security Settings
                       </>
                   )}
                 </h1>
                 <p className="text-blue-200 text-sm font-medium pl-14 opacity-80">
                   {activeTab === 'profile' ? 'Manage your public identity and account details.' : 'Update your password and secure your account access.'}
                 </p>
               </div>
               <button 
                  onClick={onClose} 
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
               >
                  <X size={24} />
               </button>
             </div>

             {/* Content Body */}
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               {activeTab === 'profile' && (
                  <form onSubmit={handleUpdateProfile} className="max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      
                      {/* Avatar Upload Mockup (Visual Only) */}
                      <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-corp-blue flex items-center justify-center text-xl font-bold text-white border border-white/10">
                              {getInitials(user.username)}
                          </div>
                          <div className="flex-1">
                              <div className="text-sm font-bold text-white mb-1">Profile Photo</div>
                              <div className="text-xs text-slate-400 mb-2">Upload a new avatar to personalize your experience.</div>
                              <button type="button" className="text-xs font-bold text-corp-cyan hover:text-white transition-colors flex items-center gap-1">
                                  <span className="opacity-50 cursor-not-allowed">Upload Image</span> (Coming Soon)
                              </button>
                          </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex flex-col gap-2">
                             <label className="text-xs font-bold text-corp-cyan uppercase tracking-wider ml-1">Display Name</label>
                             <div className="relative group">
                                <div className="absolute inset-0 bg-corp-cyan/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center bg-[#05041a] border border-white/10 rounded-xl overflow-hidden transition-colors group-focus-within:border-corp-cyan/50">
                                    <div className="pl-4 text-slate-500">
                                        <UserIcon size={18} />
                                    </div>
                                    <input 
                                       type="text" 
                                       value={username}
                                       onChange={(e) => setUsername(e.target.value)}
                                       className="w-full bg-transparent border-none text-white px-4 py-4 focus:ring-0 placeholder:text-slate-600 text-sm font-medium"
                                       placeholder="Enter your display name"
                                    />
                                </div>
                             </div>
                         </div>

                         <div className="flex flex-col gap-2 opacity-80">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                             <div className="flex items-center bg-white/5 border border-white/5 rounded-xl px-4 py-4 text-slate-400 cursor-not-allowed justify-between">
                                <div className="flex items-center gap-3">
                                    <Mail size={18} />
                                    <span className="text-sm font-mono">{user.email}</span>
                                </div>
                                <Lock size={14} className="opacity-50" />
                             </div>
                         </div>
                      </div>
                      
                      {message && (
                         <div className={`p-4 rounded-xl text-sm flex items-start gap-3 animate-in zoom-in-95 duration-200 border ${
                            message.type === 'success' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.1)]' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(248,113,113,0.1)]'
                         }`}>
                            {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                            <span className="font-bold">{message.text}</span>
                         </div>
                      )}

                      <div className="pt-2 border-t border-white/5">
                        <button 
                           type="submit" 
                           disabled={loading || !username.trim() || username === user.username}
                           className="px-8 py-3 bg-corp-cyan hover:bg-cyan-400 text-corp-dark font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,164,239,0.2)] hover:shadow-[0_0_30px_rgba(0,164,239,0.4)] hover:-translate-y-0.5"
                        >
                           {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                           Save Changes
                        </button>
                      </div>
                  </form>
               )}

               {activeTab === 'security' && (
                  <form onSubmit={handleUpdatePassword} className="max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      
                      <div className="bg-gradient-to-r from-corp-orange/10 to-transparent border border-corp-orange/20 rounded-xl p-5 flex gap-4">
                         <div className="p-3 bg-corp-orange/10 rounded-lg text-corp-orange shrink-0 h-fit">
                            <KeyRound size={24} />
                         </div>
                         <div>
                            <h4 className="text-base font-bold text-white mb-1">Password Requirements</h4>
                            <ul className="text-xs text-blue-200 space-y-1 list-disc pl-4 opacity-80">
                                <li>Minimum 8 characters long</li>
                                <li>Include at least one number or symbol</li>
                                <li>Avoid using personal information</li>
                            </ul>
                         </div>
                      </div>

                      <div className="space-y-5">
                         <div className="flex flex-col gap-2">
                             <label className="text-xs font-bold text-corp-cyan uppercase tracking-wider ml-1">New Password</label>
                             <div className="relative group">
                                <div className="absolute inset-0 bg-corp-cyan/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center bg-[#05041a] border border-white/10 rounded-xl overflow-hidden transition-colors group-focus-within:border-corp-cyan/50">
                                    <div className="pl-4 text-slate-500 group-focus-within:text-corp-cyan transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input 
                                       type="password" 
                                       value={newPassword}
                                       onChange={(e) => setNewPassword(e.target.value)}
                                       className="w-full bg-transparent border-none text-white px-4 py-4 focus:ring-0 placeholder:text-slate-600 text-sm font-medium tracking-wide"
                                       placeholder="••••••••"
                                    />
                                </div>
                             </div>
                         </div>

                         <div className="flex flex-col gap-2">
                             <label className="text-xs font-bold text-corp-cyan uppercase tracking-wider ml-1">Confirm Password</label>
                             <div className="relative group">
                                <div className="absolute inset-0 bg-corp-cyan/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center bg-[#05041a] border border-white/10 rounded-xl overflow-hidden transition-colors group-focus-within:border-corp-cyan/50">
                                    <div className="pl-4 text-slate-500 group-focus-within:text-corp-cyan transition-colors">
                                        <Shield size={18} />
                                    </div>
                                    <input 
                                       type="password" 
                                       value={confirmPassword}
                                       onChange={(e) => setConfirmPassword(e.target.value)}
                                       className="w-full bg-transparent border-none text-white px-4 py-4 focus:ring-0 placeholder:text-slate-600 text-sm font-medium tracking-wide"
                                       placeholder="••••••••"
                                    />
                                </div>
                             </div>
                         </div>
                      </div>

                      {message && (
                         <div className={`p-4 rounded-xl text-sm flex items-start gap-3 animate-in zoom-in-95 duration-200 border ${
                            message.type === 'success' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.1)]' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(248,113,113,0.1)]'
                         }`}>
                            {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                            <span className="font-bold">{message.text}</span>
                         </div>
                      )}

                      <div className="pt-2 border-t border-white/5">
                        <button 
                           type="submit" 
                           disabled={loading || !newPassword}
                           className="px-8 py-3 bg-corp-royal hover:bg-blue-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(4,83,241,0.3)] hover:shadow-[0_0_30px_rgba(4,83,241,0.5)] hover:-translate-y-0.5"
                        >
                           {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                           Update Password
                        </button>
                      </div>
                  </form>
               )}
             </div>

          </div>
       </div>
    </div>
  );
};