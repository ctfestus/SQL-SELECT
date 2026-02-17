
import React, { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { X, Check, Star, Zap, Shield, Crown, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { User, SubscriptionTier, PlanSettings } from '../types';
import { upgradeSubscription } from '../services/supabaseService';

interface PricingModalProps {
  user: User;
  currentTier: SubscriptionTier;
  onClose: () => void;
  onUpgradeSuccess: (newTier: SubscriptionTier) => void;
  planSettings?: PlanSettings | null;
}

const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || 'pk_live_76bf102897be4ffe9e803e6d510064a6bcb8fc1e';

export const PricingModal: React.FC<PricingModalProps> = ({ user, currentTier, onClose, onUpgradeSuccess, planSettings }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  
  const handleSuccess = async (response: any, tier: SubscriptionTier, amount: number) => {
    // response contains { reference, message, status, trans, etc }
    const paymentRef = response.reference;
    
    if (user.id) {
      // Amount in Paystack is in Kobo, so we pass the original Cedi amount * 100 to the service 
      // or if the service expects Kobo, we pass it as is. 
      // The service call wrapper expects the raw amount we used for logic, 
      // but the DB likely wants Kobo if using INTEGER for currency. 
      // The SQL comment says "Amount in Kobo". 
      // Paystack amount passed to hook is amount * 100. 
      // So we pass amount * 100 to db.
      const amountInKobo = amount * 100;
      
      const success = await upgradeSubscription(user.id, tier, billingCycle, paymentRef, amountInKobo);
      if (success) {
        onUpgradeSuccess(tier);
      }
    }
  };

  const handleClose = () => {
    // Optional: handle close without payment
  };

  const PayButton = ({ amount, tier, label, className, icon: Icon }: { amount: number, tier: SubscriptionTier, label: string, className: string, icon?: any }) => {
    const config = {
      reference: (new Date()).getTime().toString(),
      email: user.email || 'customer@example.com',
      amount: amount * 100, // Paystack expects amount in kobo
      publicKey: PAYSTACK_PUBLIC_KEY,
      currency: 'GHS',
    };

    const initializePayment = usePaystackPayment(config);

    if (amount === 0) {
        return (
            <button className={className} disabled>
                {label}
            </button>
        )
    }

    return (
      <button
        onClick={() => {
          initializePayment({
             onSuccess: (reference: any) => handleSuccess(reference, tier, amount),
             onClose: handleClose,
          });
        }}
        className={className}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
            {Icon && <Icon size={18} className="fill-current" />}
            {label}
        </span>
      </button>
    );
  };

  // Prices logic with fallback
  const basicConfig = planSettings?.basic || { monthly: 50, annual: 499 };
  const proConfig = planSettings?.pro || { monthly: 99, annual: 929 };

  const BASIC_PRICE = billingCycle === 'monthly' ? basicConfig.monthly : basicConfig.annual;
  const PRO_PRICE = billingCycle === 'monthly' ? proConfig.monthly : proConfig.annual;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
       <div className="absolute inset-0 bg-corp-blue/90 backdrop-blur-xl transition-opacity" onClick={onClose} />
       
       <div className="relative w-full max-w-5xl bg-corp-dark rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh] sm:max-h-[85vh]">
          
          {/* Background Ambient Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-corp-royal/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="p-6 md:p-8 pb-0 flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 shrink-0 gap-4">
             <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-corp-orange/10 border border-corp-orange/20 w-fit">
                    <Crown size={14} className="text-corp-orange fill-corp-orange" />
                    <span className="text-xs font-bold text-corp-orange uppercase tracking-wider">Unlock Potential</span>
               </div>
               <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Upgrade Plan</h2>
               <p className="text-blue-200 text-sm md:text-base">Choose the perfect plan to accelerate your SQL mastery.</p>
             </div>
             
             <div className="flex items-center gap-4">
                 {/* Billing Toggle */}
                 <div className="bg-black/30 p-1 rounded-full border border-white/10 flex items-center relative">
                     <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all relative z-10 ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                     >
                        Monthly
                     </button>
                     <button 
                        onClick={() => setBillingCycle('annual')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all relative z-10 ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                     >
                        Annual <span className="text-corp-orange ml-1">-20%</span>
                     </button>
                     <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-corp-royal rounded-full transition-all duration-300 ${billingCycle === 'monthly' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                 </div>

                 <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white border border-white/5">
                   <X size={20} />
                 </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative z-10">
             <div className="grid md:grid-cols-3 gap-4 md:gap-6 items-stretch">
                
                {/* Free Plan */}
                <div className={`rounded-3xl p-6 border flex flex-col relative transition-all duration-300 ${
                    currentTier === 'free' 
                    ? 'bg-white/[0.03] border-white/10' 
                    : 'bg-transparent border-white/5 opacity-70 hover:opacity-100 hover:bg-white/[0.02]'
                }`}>
                   <div className="mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-3 border border-white/10">
                         <Shield size={20} className="text-slate-400" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">Free</h4>
                      <p className="text-xs text-slate-400 mb-3">For curious learners starting out.</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">GHS 0</span>
                      </div>
                   </div>
                   
                   <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="p-1 rounded-full bg-white/10"><Check size={10} className="text-white" /></div>
                        <span>2 Free lessons per course</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300 opacity-50">
                         <div className="p-1 rounded-full bg-white/5"><X size={10} className="text-white" /></div>
                         <span className="line-through">Unlimited access to courses and learning paths</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300 opacity-50">
                         <div className="p-1 rounded-full bg-white/5"><X size={10} className="text-white" /></div>
                         <span className="line-through">Live AI Mentor</span>
                      </div>
                   </div>

                   <button 
                      disabled
                      className={`w-full py-3 rounded-xl font-bold text-sm border transition-all ${
                          currentTier === 'free'
                          ? 'bg-white/10 border-white/10 text-white cursor-default'
                          : 'bg-transparent border-white/10 text-slate-500'
                      }`}
                   >
                      {currentTier === 'free' ? "Current Plan" : "Get Started"}
                   </button>
                </div>

                {/* Basic Plan */}
                <div className={`rounded-3xl p-6 border flex flex-col relative transition-all duration-300 ${
                    currentTier === 'basic'
                    ? 'bg-corp-cyan/10 border-corp-cyan/50 shadow-[0_0_30px_rgba(0,164,239,0.1)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-corp-cyan/30 hover:bg-corp-cyan/[0.02]'
                }`}>
                   <div className="mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-corp-cyan/20 flex items-center justify-center mb-3 border border-corp-cyan/20">
                         <Zap size={20} className="text-corp-cyan" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">Basic</h4>
                      <p className="text-xs text-blue-200 mb-3">Essential tools for dedicated students.</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">GHS {BASIC_PRICE}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                      </div>
                   </div>
                   
                   <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center gap-3 text-sm text-white">
                        <div className="p-1 rounded-full bg-corp-cyan text-corp-dark"><Check size={10} /></div>
                        <span>Unlimited courses</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white">
                        <div className="p-1 rounded-full bg-corp-cyan text-corp-dark"><Check size={10} /></div>
                        <span>Unlimited learning path</span>
                      </div>
                       <div className="flex items-center gap-3 text-sm text-slate-400 opacity-60">
                        <div className="p-1 rounded-full bg-white/10"><X size={10} className="text-white" /></div>
                        <span className="line-through">AI tutor</span>
                      </div>
                       <div className="flex items-center gap-3 text-sm text-slate-400 opacity-60">
                        <div className="p-1 rounded-full bg-white/10"><X size={10} className="text-white" /></div>
                        <span className="line-through">Live AI Expert</span>
                      </div>
                   </div>

                   <PayButton 
                      amount={BASIC_PRICE} 
                      tier="basic" 
                      label={currentTier === 'basic' ? "Current Plan" : "Upgrade to Basic"}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                        currentTier === 'basic' 
                        ? 'bg-corp-cyan/20 border border-corp-cyan text-corp-cyan cursor-default' 
                        : 'bg-corp-cyan hover:bg-cyan-400 text-corp-dark shadow-lg shadow-corp-cyan/20'
                      }`}
                   />
                </div>

                {/* Pro Plan */}
                <div className={`rounded-3xl p-1 relative flex flex-col transition-all duration-300 transform md:hover:-translate-y-2 ${
                     currentTier === 'pro'
                     ? 'bg-gradient-to-b from-corp-orange via-corp-orange/50 to-transparent'
                     : 'bg-gradient-to-b from-corp-royal via-corp-royal/50 to-transparent'
                }`}>
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-corp-orange to-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2 whitespace-nowrap z-20">
                      <Sparkles size={10} className="fill-white" /> Recommended
                   </div>

                   <div className="bg-corp-dark h-full w-full rounded-[1.4rem] p-5 flex flex-col relative overflow-hidden">
                       {/* Shine Effect */}
                       <div className="absolute top-0 right-0 w-64 h-64 bg-corp-orange/10 rounded-full blur-[60px] pointer-events-none"></div>

                       <div className="mb-4 relative z-10">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-corp-orange to-red-500 flex items-center justify-center mb-3 shadow-lg shadow-corp-orange/20">
                             <Crown size={20} className="text-white fill-white" />
                          </div>
                          <h4 className="text-lg font-bold text-white mb-1">Pro Access</h4>
                          <p className="text-xs text-blue-200 mb-3">Complete mastery with no limits.</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-corp-orange to-red-400">GHS {PRO_PRICE}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                          </div>
                       </div>
                       
                       <div className="space-y-3 mb-6 flex-1 relative z-10">
                          <div className="flex items-center gap-3 text-sm text-white font-bold">
                            <div className="p-1 rounded-full bg-gradient-to-r from-corp-orange to-red-500 text-white"><Star size={10} className="fill-current" /></div>
                            <span>Unlimited Access to courses</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-white font-medium">
                            <div className="p-1 rounded-full bg-gradient-to-r from-corp-orange to-red-500 text-white"><Star size={10} className="fill-current" /></div>
                            <span>Unlimited Access to learning path</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-white font-medium">
                            <div className="p-1 rounded-full bg-gradient-to-r from-corp-orange to-red-500 text-white"><Star size={10} className="fill-current" /></div>
                            <span>Access to Live Mentor</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-white font-medium">
                            <div className="p-1 rounded-full bg-gradient-to-r from-corp-orange to-red-500 text-white"><Star size={10} className="fill-current" /></div>
                            <span>Access to AI tutor</span>
                          </div>
                       </div>

                       <PayButton 
                          amount={PRO_PRICE} 
                          tier="pro" 
                          icon={currentTier !== 'pro' ? Sparkles : undefined}
                          label={currentTier === 'pro' ? "Plan Active" : "Get Pro Access"}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-xl relative z-10 ${
                             currentTier === 'pro'
                             ? 'bg-white/10 border border-white/20 text-white cursor-default'
                             : 'bg-gradient-to-r from-corp-orange to-red-500 hover:from-orange-500 hover:to-red-600 text-white hover:scale-[1.02]'
                          }`}
                       />
                   </div>
                </div>

             </div>
             
             <div className="mt-8 text-center text-xs text-slate-500 pb-4">
               <p>Secure payment via Paystack. Cancel anytime.</p>
               <p className="mt-2">Need help? Contact support@festai.com</p>
             </div>
          </div>
       </div>
    </div>
  );
};
