
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, X, Loader2, Sparkles, Volume2, Power, MicOff, Lock } from 'lucide-react';
import { Challenge, Industry } from '../types';
import { getLiveExpertSystemInstruction } from '../services/geminiService';

interface LiveSupportPanelProps {
  challenge: Challenge;
  industry: Industry;
  customContext?: string;
  currentCode: string;
  allowed: boolean;
  onShowPricing: () => void;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return new Blob([int16], { type: 'audio/pcm' });
}

function encodeBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const LiveSupportPanel: React.FC<LiveSupportPanelProps> = ({ challenge, industry, customContext, currentCode, allowed, onShowPricing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micActive, setMicActive] = useState(false);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [challenge.id]);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const systemInstruction = getLiveExpertSystemInstruction(challenge, industry, customContext, currentCode);

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log("Live Session Opened");
            setIsConnected(true);
            setIsConnecting(false);
            setMicActive(true);

            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = async (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              const base64Data = await encodeBlobToBase64(pcmBlob);
              
              sessionPromiseRef.current?.then(session => {
                 session.sendRealtimeInput({ 
                    media: { 
                      mimeType: 'audio/pcm;rate=16000', 
                      data: base64Data 
                    } 
                 });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
            
            sourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio && outputCtx) {
              setIsSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              
              const audioBytes = decode(base64Audio);
              const audioBuffer = await decodeAudioData(audioBytes, outputCtx, 24000, 1);
              
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              
              source.onended = () => {
                 activeSourcesRef.current.delete(source);
                 if (activeSourcesRef.current.size === 0) {
                   setIsSpeaking(false);
                 }
              };

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              activeSourcesRef.current.forEach(src => {
                 try { src.stop(); } catch(e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            console.log("Session Closed");
            disconnect();
          },
          onerror: (err) => {
            console.error("Session Error", err);
            disconnect();
          }
        }
      });

    } catch (err) {
      console.error("Failed to connect", err);
      disconnect();
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setMicActive(false);
    setIsSpeaking(false);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    activeSourcesRef.current.clear();
    sessionPromiseRef.current = null;
  };

  const isLocked = !allowed;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => isLocked ? onShowPricing() : setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-xl flex items-center gap-2 transition-transform hover:scale-110 ${
             isLocked 
             ? 'bg-slate-700 text-slate-400 cursor-pointer shadow-none border border-white/10'
             : 'bg-corp-orange hover:bg-orange-500 text-white shadow-corp-orange/30'
          }`}
        >
          {isLocked ? <Lock size={20} /> : <Sparkles size={24} />}
          <span className="font-bold pr-1">{isLocked ? 'Expert Locked' : 'Expert Voice'}</span>
        </button>
      )}

      {isOpen && !isLocked && (
        <div className="fixed bottom-6 right-6 z-50 w-80 glass-panel border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-corp-cyan/20 p-1.5 rounded text-corp-cyan">
                <Volume2 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Live Mentor</h3>
                <p className="text-xs text-slate-400">{industry}</p>
              </div>
            </div>
            <button 
              onClick={() => { disconnect(); setIsOpen(false); }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-black/40 relative min-h-[250px]">
            
            <div className="absolute top-4 flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-corp-orange animate-pulse' : 'bg-slate-600'}`}></div>
               <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                  {isConnecting ? 'Linking...' : 
                   !isConnected ? 'Standby' : 
                   isSpeaking ? 'Expert Speaking' : 'Listening'}
               </span>
            </div>

            <div className="relative">
              {(isSpeaking || micActive) && (
                <div className="absolute inset-0 bg-corp-cyan/20 rounded-full animate-ping"></div>
              )}
              
              <button 
                onClick={isConnected ? disconnect : connect}
                disabled={isConnecting}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isConnected 
                    ? 'bg-red-500/10 border-2 border-red-500 text-red-500 hover:bg-red-500/20' 
                    : 'bg-corp-royal hover:bg-blue-600 text-white shadow-xl shadow-corp-royal/30'
                }`}
              >
                 {isConnecting ? (
                   <Loader2 size={32} className="animate-spin" />
                 ) : isConnected ? (
                   <Power size={32} />
                 ) : (
                   <Mic size={32} />
                 )}
              </button>
            </div>

            <div className="mt-8 text-center px-4">
              {!isConnected ? (
                <p className="text-blue-200 text-sm font-medium">
                  Tap to initialize voice connection.
                </p>
              ) : (
                <div className="space-y-2">
                   <p className="text-white font-bold">Channel Open</p>
                   {micActive && !isSpeaking && (
                      <div className="flex justify-center gap-1 h-4 items-end mt-2">
                         <div className="w-1 bg-corp-cyan animate-[bounce_1s_infinite] h-2"></div>
                         <div className="w-1 bg-corp-cyan animate-[bounce_1.1s_infinite] h-3"></div>
                         <div className="w-1 bg-corp-cyan animate-[bounce_1.2s_infinite] h-1"></div>
                         <div className="w-1 bg-corp-cyan animate-[bounce_1s_infinite] h-2"></div>
                      </div>
                   )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
