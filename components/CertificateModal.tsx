
import React from 'react';
import { X, Download, ExternalLink, Award, Share2, CheckCircle2, Linkedin } from 'lucide-react';
import { Certificate } from '../types';

interface CertificateModalProps {
  certificate: Certificate;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  const issueDate = new Date(certificate.issued_at);
  const linkedinUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certificate.course_title)}&organizationName=FestMan&issueYear=${issueDate.getFullYear()}&issueMonth=${issueDate.getMonth() + 1}&certId=${encodeURIComponent(certificate.id)}&certUrl=${encodeURIComponent(certificate.certificate_url)}`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#020015]/95 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-5xl bg-corp-dark border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh]">
        
        {/* Ambient Background - Global to modal */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-corp-royal/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-corp-cyan/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-50 p-2 bg-black/20 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white border border-white/5 backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* Left: Certificate Preview */}
        <div className="w-full lg:w-[60%] bg-[#05041a] p-8 lg:p-12 flex flex-col justify-center items-center relative border-b lg:border-b-0 lg:border-r border-white/5">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
           
           <div className="relative group w-full max-w-2xl perspective-1000">
              <div className="absolute -inset-1 bg-gradient-to-r from-corp-cyan to-corp-royal rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black transition-transform duration-500 transform group-hover:scale-[1.01] group-hover:rotate-1">
                 <img 
                   src={certificate.certificate_url} 
                   alt="Certificate Preview" 
                   className="w-full h-auto object-contain" 
                 />
              </div>
           </div>
           
           <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <CheckCircle2 size={12} className="text-green-500" />
              <span>Verified Credential • Issued {new Date(certificate.issued_at).toLocaleDateString()}</span>
           </div>
        </div>

        {/* Right: Context & Actions */}
        <div className="w-full lg:w-[40%] p-8 lg:p-12 flex flex-col justify-center relative bg-white/[0.01]">
           <div className="mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-corp-orange to-red-500 flex items-center justify-center mb-6 shadow-lg shadow-corp-orange/20 animate-in fade-in zoom-in duration-500 delay-100">
                 <Award size={32} className="text-white fill-white/20" />
              </div>
              
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight leading-tight">
                 Achievement <br/>Unlocked
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                 Congratulations! You have successfully demonstrated your proficiency and completed the rigorous training requirements for this industry track.
              </p>
           </div>

           <div className="mb-10 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] font-bold text-corp-cyan uppercase tracking-widest mb-1.5">Certification</div>
              <div className="text-lg font-bold text-white leading-snug">
                 {certificate.course_title}
              </div>
           </div>

           <div className="flex flex-col gap-3 mt-auto">
              <a 
                href={certificate.certificate_url} 
                download={`Certificate-${certificate.course_title.replace(/\s+/g, '-')}.png`}
                target="_blank" 
                rel="noreferrer"
                className="w-full py-4 bg-gradient-to-r from-corp-royal to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-corp-royal/30 transform hover:-translate-y-0.5 group"
              >
                <Download size={20} className="group-hover:animate-bounce" /> 
                Download High-Res
              </a>
              
              <div className="grid grid-cols-2 gap-3">
                 <a 
                   href={certificate.certificate_url} 
                   target="_blank" 
                   rel="noreferrer"
                   className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:border-white/20 text-xs sm:text-sm"
                 >
                   <ExternalLink size={16} /> Open Link
                 </a>
                 <a
                   href={linkedinUrl}
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="w-full py-3 bg-[#0a66c2]/80 hover:bg-[#0a66c2] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-xs sm:text-sm border border-transparent hover:border-white/10"
                 >
                   <Linkedin size={16} /> Add to LinkedIn
                 </a>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
