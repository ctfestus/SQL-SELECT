
import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { ensureUserProfile } from '../services/supabaseService';
import { Code2, Zap, ArrowRight, Shield, User as UserIcon, Lock, X, Mail, AlertCircle, CheckCircle2, Star, Database, Activity, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react';

export type AuthMode = 'login' | 'signup' | 'update_password';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onClose?: () => void;
  initialMode?: AuthMode;
}

type ViewMode = 'login' | 'signup' | 'forgot_password' | 'update_password';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sign Up State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Login/Reset State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  //google login
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Redirects back to your app after login
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (mode === 'signup') {
        // Sign Up Validation
        if (!firstName.trim() || !lastName.trim() || !signUpEmail.trim() || !password || !confirmPassword) {
          throw new Error('All fields are required.');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: signUpEmail,
          password: password,
          options: {
            data: {
              username: `${firstName.trim()} ${lastName.trim()}`,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
           // If session exists, user is logged in. 
           if (data.session) {
             const user: User = { 
                id: data.user.id,
                username: data.user.user_metadata.username || `${firstName.trim()} ${lastName.trim()}`, 
                email: data.user.email 
             };
             // Create initial profile
             await ensureUserProfile(user);
             onLogin(user);
           } else {
             setSuccessMessage('Account created! Please check your email to confirm your registration.');
             setLoading(false);
           }
        }

      } else if (mode === 'login') {
        // Login Validation
        if (!loginEmail.trim()) {
          throw new Error('Email is required.');
        }
        
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });

        if (signInError) throw signInError;

        if (data.user && data.session) {
          const user: User = { 
             id: data.user.id,
             username: data.user.user_metadata.username || data.user.email?.split('@')[0] || 'User', 
             email: data.user.email 
          };
          // Ensure profile exists just in case
          await ensureUserProfile(user);
          onLogin(user);
        }
      } else if (mode === 'forgot_password') {
        // Password Reset Validation
        if (!loginEmail.trim()) {
            throw new Error('Please enter your email address.');
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(loginEmail, {
            redirectTo: window.location.origin,
        });

        if (resetError) throw resetError;
        setSuccessMessage('Password reset instructions have been sent to your email.');
        setLoading(false);
      } else if (mode === 'update_password') {
        if (!password || !confirmPassword) {
            throw new Error('Please enter your new password.');
        }
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters.');
        }
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match.');
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) throw updateError;
        
        setSuccessMessage('Password updated successfully! Redirecting...');
        setLoading(false);
        
        // Close modal after delay since user is logged in
        setTimeout(() => {
            if (onClose) onClose();
        }, 2000);
      }
    } catch (err: any) {
      // Improve error messaging for common auth errors
      let msg = err.message || 'An unexpected error occurred.';
      if (msg.includes('Invalid login credentials')) msg = 'Invalid email or password.';
      setError(msg);
      setLoading(false);
    }
  };

  const switchMode = (newMode: ViewMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-0">
      
      {/* Main Container */}
      <div className="w-full max-w-6xl h-full md:h-[800px] max-h-[90vh] bg-corp-dark rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative border border-white/10 animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/20 hover:bg-white/10 text-white/50 hover:text-white transition-colors backdrop-blur-md border border-white/5"
          >
            <X size={20} />
          </button>
        )}

        {/* Left Side: Visual Experience (Hidden on Mobile) */}
        <div className="hidden md:flex w-1/2 relative bg-corp-blue overflow-hidden flex-col justify-between p-12 text-white">
          {/* Background Image & Effects */}
          <div className="absolute inset-0 z-0">
            <img 
               src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2000&auto=format&fit=crop" 
               alt="Professional Woman in Tech" 
               className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-corp-blue/90 via-corp-dark/80 to-corp-royal/90"></div>
            {/* Animated Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-corp-cyan/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-corp-orange/10 rounded-full blur-[100px]"></div>
          </div>

          {/* Content Layer */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <ChevronRight size={24} className="text-corp-cyan" />
              </div>
              <span className="text-xl font-bold tracking-tight">SELECT</span>
            </div>

            {/* Middle Visual Artifact: Code Card */}
            <div className="my-auto transform hover:scale-105 transition-transform duration-500">
               <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative">
                  <div className="absolute -top-3 -right-3 bg-corp-orange text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Zap size={10} className="fill-black" /> Live AI Mentor
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                  </div>
                  <div className="space-y-2 font-mono text-xs opacity-80">
                    <div className="flex gap-4"><span className="text-slate-500">1</span> <span><span className="text-corp-cyan">SELECT</span> * <span className="text-corp-cyan">FROM</span> users</span></div>
                    <div className="flex gap-4"><span className="text-slate-500">2</span> <span><span className="text-corp-cyan">WHERE</span> status = <span className="text-orange-400">'active'</span></span></div>
                    <div className="flex gap-4"><span className="text-slate-500">3</span> <span><span className="text-corp-cyan">AND</span> last_login {'>'} <span className="text-purple-400">NOW()</span> - <span className="text-blue-300">INTERVAL</span> '7d';</span></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-corp-cyan flex items-center justify-center">
                      <Zap size={14} className="text-corp-dark fill-corp-dark" />
                    </div>
                    <div className="text-xs">
                       <div className="font-bold text-corp-cyan">Analysis Complete</div>
                       <div className="text-slate-400">Query optimized. 98/100 Efficiency.</div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Bottom Text */}
            <div className="space-y-6">
              <h2 className="text-4xl font-black leading-tight">
                Build Job-Ready SQL Skills with <span className="text-transparent bg-clip-text bg-gradient-to-r from-corp-cyan to-white">Industry Projects</span>
              </h2>
              
              <div className="flex gap-6 text-sm font-medium text-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-corp-cyan" />
                  <span>Industry Scenarios</span>
                </div>
                 <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-corp-cyan" />
                  <span>Interactive Schema</span>
                </div>
                 <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-corp-cyan" />
                  <span>Voice Mode</span>
                </div>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                 <div className="text-xs">
                    <div className="flex items-center gap-1 text-corp-orange">
                       <Star size={10} className="fill-current" />
                       <Star size={10} className="fill-current" />
                       <Star size={10} className="fill-current" />
                       <Star size={10} className="fill-current" />
                       <Star size={10} className="fill-current" />
                    </div>
                    <div className="text-slate-400 mt-1">Trusted by 10,000+ Data Professionals</div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 bg-corp-dark flex flex-col p-8 md:p-16 relative overflow-y-auto custom-scrollbar">
           <div className="max-w-md mx-auto w-full my-auto">
             {/* Mobile Header (Only visible on small screens) */}
             <div className="md:hidden mb-8 flex items-center justify-center gap-2 text-white">
                <div className="w-8 h-8 rounded-lg bg-corp-royal flex items-center justify-center">
                  <ChevronRight size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold">SELECT</span>
             </div>

             <div className="mb-10">
                <h1 className="text-3xl font-black text-white mb-2">
                   {mode === 'signup' ? 'Create an account' : 
                    mode === 'forgot_password' ? 'Reset Password' : 
                    mode === 'update_password' ? 'Set New Password' :
                    'Welcome back'}
                </h1>
                <p className="text-slate-400">
                   {mode === 'signup' ? 'Start building your professional profile today.' : 
                    mode === 'forgot_password' ? 'Enter your email to receive reset instructions.' : 
                    mode === 'update_password' ? 'Secure your account with a new password.' :
                    'Enter your credentials to access your workspace.'}
                </p>
             </div>

             {/* Error Message */}
             {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-sm text-red-200 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Authentication Error</span>
                    {error}
                  </div>
                </div>
              )}

             {/* Success Message */}
             {successMessage && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3 text-sm text-green-200 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 size={18} className="text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Success</span>
                    {successMessage}
                  </div>
                </div>
              )}

              {/* ... existing header code ... */}
             
             {/* GOOGLE LOGIN BUTTON */}
             <button
               type="button"
               onClick={handleGoogleLogin}
               disabled={loading}
               className="w-full bg-white text-slate-800 hover:bg-slate-100 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all mb-6 shadow-lg"
             >
               {/* Google SVG Icon */}
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                 <path
                   d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                   fill="#4285F4"
                 />
                 <path
                   d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                   fill="#34A853"
                 />
                 <path
                   d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                   fill="#FBBC05"
                 />
                 <path
                   d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                   fill="#EA4335"
                 />
               </svg>
               <span>Continue with Google</span>
             </button>

             {/* DIVIDER */}
             <div className="relative flex items-center gap-4 mb-6">
               <div className="h-px bg-white/10 flex-1"></div>
               <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Or continue with email</span>
               <div className="h-px bg-white/10 flex-1"></div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-5">
               
               {mode === 'signup' && (
                 <>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-300 ml-1">First Name</label>
                       <input 
                         type="text" 
                         value={firstName}
                         onChange={(e) => setFirstName(e.target.value)}
                         className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan transition-all outline-none"
                         placeholder="Jane"
                       />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-300 ml-1">Last Name</label>
                       <input 
                         type="text" 
                         value={lastName}
                         onChange={(e) => setLastName(e.target.value)}
                         className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan transition-all outline-none"
                         placeholder="Doe"
                       />
                     </div>
                   </div>

                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-300 ml-1">Email Address</label>
                     <div className="relative">
                       <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                         type="email" 
                         value={signUpEmail}
                         onChange={(e) => setSignUpEmail(e.target.value)}
                         className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan transition-all outline-none"
                         placeholder="jane@company.com"
                       />
                     </div>
                   </div>

                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-300 ml-1">Password</label>
                     <div className="relative">
                       <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                         type="password" 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan transition-all outline-none"
                         placeholder="Min 8 characters"
                       />
                     </div>
                   </div>

                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-300 ml-1">Confirm Password</label>
                     <div className="relative">
                       <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                         type="password" 
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan transition-all outline-none"
                         placeholder="Re-enter password"
                       />
                     </div>
                   </div>
                 </>
               )}

               {mode === 'login' && (
                 <>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-300 ml-1">Email Address</label>
                     <div className="relative">
                       <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                         type="email" 
                         value={loginEmail}
                         onChange={(e) => setLoginEmail(e.target.value)}
                         className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan transition-all outline-none"
                         placeholder="Your email address"
                       />
                     </div>
                   </div>

                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-slate-300">Password</label>
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); switchMode('forgot_password'); }}
                          className="text-xs text-corp-cyan hover:text-white transition-colors"
                        >
                          Forgot password?
                        </a>
                      </div>
                     <div className="relative">
                       <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                         type="password" 
                         value={loginPassword}
                         onChange={(e) => setLoginPassword(e.target.value)}
                         className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan transition-all outline-none"
                         placeholder="••••••••"
                       />
                     </div>
                   </div>
                 </>
               )}

               {mode === 'forgot_password' && (
                 <>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-300 ml-1">Email Address</label>
                     <div className="relative">
                       <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                         type="email" 
                         value={loginEmail}
                         onChange={(e) => setLoginEmail(e.target.value)}
                         className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan transition-all outline-none"
                         placeholder="Enter your registered email"
                       />
                     </div>
                   </div>
                 </>
               )}

               {mode === 'update_password' && (
                 <>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-300 ml-1">New Password</label>
                     <div className="relative">
                       <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                         type="password" 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan transition-all outline-none"
                         placeholder="Min 8 characters"
                       />
                     </div>
                   </div>

                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-300 ml-1">Confirm New Password</label>
                     <div className="relative">
                       <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                         type="password" 
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:border-corp-cyan focus:ring-1 focus:ring-corp-cyan transition-all outline-none"
                         placeholder="Re-enter new password"
                       />
                     </div>
                   </div>
                 </>
               )}

               <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 shadow-lg mt-4 ${
                    loading
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed' 
                    : 'bg-corp-royal hover:bg-blue-600 text-white shadow-corp-royal/20 hover:shadow-corp-royal/40 hover:-translate-y-0.5'
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {mode === 'signup' ? 'Create Account' : 
                       mode === 'forgot_password' ? 'Send Reset Link' : 
                       mode === 'update_password' ? 'Update Password' :
                       'Sign In'} 
                      {mode === 'forgot_password' ? <KeyRound size={18} /> : <ArrowRight size={18} />}
                    </>
                  )}
                </button>
             </form>

             <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <p className="text-slate-400 text-sm">
                  {mode === 'signup' ? "Already have an account?" : 
                   mode === 'forgot_password' ? "Remember your password?" :
                   mode === 'update_password' ? "" :
                   "Don't have an account yet?"}
                  
                  {mode === 'signup' ? (
                     <button 
                       onClick={() => switchMode('login')}
                       className="ml-2 font-bold text-white hover:text-corp-cyan transition-colors"
                     >
                       Sign In
                     </button>
                  ) : mode === 'forgot_password' ? (
                     <button 
                       onClick={() => switchMode('login')}
                       className="ml-2 font-bold text-white hover:text-corp-cyan transition-colors"
                     >
                       Back to Login
                     </button>
                  ) : mode === 'update_password' ? (
                     <span className="text-slate-500">Secure connection established.</span>
                  ) : (
                     <button 
                       onClick={() => switchMode('signup')}
                       className="ml-2 font-bold text-white hover:text-corp-cyan transition-colors"
                     >
                       Sign Up
                     </button>
                  )}
                </p>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};
