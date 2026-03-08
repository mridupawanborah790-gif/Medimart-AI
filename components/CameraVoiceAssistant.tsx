
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { CloseIcon } from './icons/CloseIcon';
import { CameraIcon } from './icons/CameraIcon';
import { MicroIcon } from './icons/MicroIcon';
import { TranslateIcon } from './icons/TranslateIcon';

interface CameraVoiceAssistantProps {
  onClose: () => void;
}

type SupportedLanguage = 'English' | 'Hindi' | 'Assamese';

const FRAME_RATE = 2; // Increased to 2 frames per second for more responsive real-time vision
const JPEG_QUALITY = 0.25; // Lowered quality to ensure efficient processing and faster upload speeds

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

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const CameraVoiceAssistant: React.FC<CameraVoiceAssistantProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'error' | 'closing'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('English');
  const [isAutoDetect, setIsAutoDetect] = useState(true);
  
  // Processing cues
  const [isSyncingVision, setIsSyncingVision] = useState(false);
  const [userAudioLevel, setUserAudioLevel] = useState(0);
  const [analysisNodes, setAnalysisNodes] = useState<{x: number, y: number, id: number}[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const handleLanguageSwitch = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    setIsAutoDetect(false);
    
    if (sessionRef.current) {
        sessionRef.current.sendRealtimeInput({
            parts: [{ text: `System command: User explicitly switched to ${lang}. Please respond in ${lang} from now on.` }]
        });
    }
  };

  const toggleAutoDetect = () => {
      setIsAutoDetect(!isAutoDetect);
      if (!isAutoDetect && sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
            parts: [{ text: "System command: Enable real-time language detection. Respond in the language the user is speaking (English, Hindi, or Assamese)." }]
          });
      }
  };

  useEffect(() => {
    const initAssistant = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: { facingMode: 'environment' } 
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus('active');
              // Start audio stream
              const source = audioContextInRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate real-time audio level for visual feedback
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                  sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                setUserAudioLevel(Math.min(rms * 500, 100)); // Normalized level

                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextInRef.current!.destination);

              // Start vision stream
              frameIntervalRef.current = window.setInterval(() => {
                if (canvasRef.current && videoRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  canvasRef.current.width = videoRef.current.videoWidth;
                  canvasRef.current.height = videoRef.current.videoHeight;
                  ctx?.drawImage(videoRef.current, 0, 0);
                  
                  // Trigger vision sync animation
                  setIsSyncingVision(true);
                  
                  // Generate random "analysis nodes" to simulate feature detection
                  const nodes = Array.from({length: 3}, (_, i) => ({
                    x: 20 + Math.random() * 60,
                    y: 20 + Math.random() * 60,
                    id: Date.now() + i
                  }));
                  setAnalysisNodes(nodes);

                  setTimeout(() => {
                    setIsSyncingVision(false);
                    setAnalysisNodes([]);
                  }, 350); // Slightly shorter duration to match faster frame rate

                  canvasRef.current.toBlob(async (blob) => {
                    if (blob) {
                      const reader = new FileReader();
                      reader.readAsDataURL(blob);
                      reader.onloadend = () => {
                        const base64Data = (reader.result as string).split(',')[1];
                        sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } }));
                      };
                    }
                  }, 'image/jpeg', JPEG_QUALITY);
                }
              }, 1000 / FRAME_RATE);
            },
            onmessage: async (message: LiveServerMessage) => {
              const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioBase64) {
                setIsSpeaking(true);
                const ctx = audioContextOutRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsSpeaking(false);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
              }
            },
            onerror: (e) => {
              console.error('Live API Error:', e);
              setStatus('error');
              setErrorMessage('Failed to connect to Medimart AI Voice Engine.');
            },
            onclose: () => {
              setStatus('closing');
              onClose();
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: `You are Medimart AI Camera Voice Assistant.
Language Mode:
- Automatically detect language (Assamese, Hindi, English).
- Analyze medical docs via camera.
- Explain technical findings reassurance.
- MANDATORY: Disclaimer. NO diagnosis. NO prescription.
- Tone: Caring healthcare guide.`,
          },
        });
        sessionRef.current = await sessionPromise;
      } catch (err: any) {
        console.error('Initialization error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Camera or Microphone access denied.');
      }
    };

    initAssistant();

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (sessionRef.current) sessionRef.current.close();
      audioContextInRef.current?.close();
      audioContextOutRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between p-4 md:p-6 overflow-hidden select-none">
      {/* Header */}
      <div className="w-full flex justify-between items-center text-white mb-2 z-10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${status === 'active' ? 'bg-green-500 animate-pulse shadow-[0_0_15px_#22c55e]' : 'bg-yellow-500'}`}></div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold tracking-tight">Vision Voice Engine</h2>
            {status === 'active' && (
              <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="animate-ping w-1 h-1 bg-green-400 rounded-full"></span>
                Connected
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 active:scale-90"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Viewport Area */}
      <div className="relative w-full max-w-lg aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-black shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 shrink group">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Neural Analysis Overlay */}
        {status === 'active' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {/* Sync Pulsar */}
            <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 transition-all duration-300 ${isSyncingVision ? 'scale-110 border-green-500/50 bg-green-500/10' : 'scale-100 opacity-60'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isSyncingVision ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-slate-500'}`}></div>
                <span className="text-[9px] text-white font-bold uppercase tracking-tighter">Vision Sync</span>
            </div>

            {/* Simulated Detected Features */}
            {analysisNodes.map(node => (
              <div 
                key={node.id} 
                className="absolute w-12 h-12 border border-green-400/50 rounded-lg flex items-center justify-center animate-node-pulse"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <div className="w-1 h-1 bg-green-400 rounded-full shadow-[0_0_8px_#4ade80]"></div>
                <div className="absolute inset-0 border-2 border-green-400/20 rounded-lg animate-ping"></div>
              </div>
            ))}

            {/* Scan Frame with Sync Feedback */}
            <div className="absolute inset-10 border border-white/10 rounded-3xl transition-all duration-300">
                <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-2xl transition-all duration-200 ${isSyncingVision ? 'border-green-400 scale-110 shadow-[0_0_20px_rgba(74,222,128,0.4)]' : 'border-green-500/40'}`}></div>
                <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-2xl transition-all duration-200 ${isSyncingVision ? 'border-green-400 scale-110 shadow-[0_0_20px_rgba(74,222,128,0.4)]' : 'border-green-500/40'}`}></div>
                <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-2xl transition-all duration-200 ${isSyncingVision ? 'border-green-400 scale-110 shadow-[0_0_20px_rgba(74,222,128,0.4)]' : 'border-green-500/40'}`}></div>
                <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-2xl transition-all duration-200 ${isSyncingVision ? 'border-green-400 scale-110 shadow-[0_0_20px_rgba(74,222,128,0.4)]' : 'border-green-500/40'}`}></div>
                
                {/* Center Neural Activity Circle */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/5 rounded-full flex items-center justify-center transition-all duration-500 ${isSyncingVision ? 'scale-125 opacity-100' : 'scale-100 opacity-20'}`}>
                  <div className="w-full h-full border border-green-500/20 rounded-full animate-ping-slow"></div>
                  <div className={`w-16 h-16 rounded-full bg-green-500/10 backdrop-blur-sm border border-green-500/30 flex items-center justify-center transition-all ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
                      <div className={`w-8 h-8 rounded-full border-2 border-green-500/50 ${isSpeaking ? 'animate-neural-spin' : ''}`}></div>
                  </div>
                </div>

                {/* Vertical Scan Line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-green-500/40 to-transparent shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-scan-line-vertical"></div>
            </div>

            {/* AI Response Data Stream effect (only when speaking) */}
            {isSpeaking && (
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-1.5 px-6 py-3 bg-black/60 backdrop-blur-xl rounded-full border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-green-400 rounded-full animate-ai-wave" 
                      style={{ 
                        animationDelay: `${i * 0.15}s`, 
                        height: '12px',
                        opacity: 0.6 + (Math.random() * 0.4)
                      }} 
                    />
                  ))}
                  <span className="text-[11px] text-green-400 font-black ml-3 uppercase tracking-widest animate-pulse">Neural Output</span>
               </div>
            )}
          </div>
        )}

        {/* Connection/Error States */}
        <div className="absolute inset-0 pointer-events-none z-20">
            {status === 'connecting' && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <CameraIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-green-500 animate-pulse" />
                    </div>
                    <p className="mt-6 text-white text-sm font-bold tracking-widest uppercase animate-pulse">Syncing Vision...</p>
                </div>
            )}
            {status === 'error' && (
                <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 pointer-events-auto">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/50">
                        <CloseIcon className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Engine Error</h3>
                    <p className="text-red-200/70 text-center text-xs mb-8 max-w-[240px] leading-relaxed">{errorMessage}</p>
                    <button onClick={onClose} className="px-10 py-4 bg-red-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
                      Exit Assistant
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Controls & Interaction */}
      <div className="w-full flex flex-col items-center gap-6 mt-4 z-10">
        
        {/* Language Selection */}
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            <button 
                onClick={toggleAutoDetect}
                className={`px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all active:scale-95 ${isAutoDetect ? 'bg-green-600 text-white shadow-[0_5px_15px_rgba(22,163,74,0.3)]' : 'text-slate-500'}`}
            >
                <TranslateIcon className="w-3 h-3" />
                AUTO
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            {(['English', 'Hindi', 'Assamese'] as SupportedLanguage[]).map(lang => (
                <button
                    key={lang}
                    onClick={() => handleLanguageSwitch(lang)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${!isAutoDetect && currentLanguage === lang ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                    {lang.toUpperCase()}
                </button>
            ))}
        </div>

        {/* Visualizer - Fluid Circular Waveform */}
        <div className="relative flex items-center justify-center h-28 w-full">
            {/* Ambient Pulse Ring */}
            <div className={`absolute rounded-full border border-green-500/10 transition-all duration-700 ${isSpeaking ? 'scale-[2.5] opacity-0' : 'scale-100 opacity-20'}`}></div>

            {/* Siri-style Voice Waveforms */}
            {userAudioLevel > 2 && (
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <div 
                  className="absolute w-20 h-20 bg-green-500 rounded-full blur-xl transition-transform duration-75"
                  style={{ transform: `scale(${1 + userAudioLevel * 0.05})`, opacity: 0.4 }}
                />
                <div 
                  className="absolute w-24 h-24 bg-blue-500 rounded-full blur-xl transition-transform duration-100 delay-75"
                  style={{ transform: `scale(${1 + userAudioLevel * 0.04})`, opacity: 0.3 }}
                />
              </div>
            )}

            {/* Core Interaction Icon */}
            <div className={`relative p-6 rounded-full transition-all duration-500 shadow-2xl z-10 ${isSpeaking ? 'bg-green-500 scale-110 shadow-green-500/40' : userAudioLevel > 10 ? 'bg-slate-700 scale-105' : 'bg-slate-800'}`}>
                <MicroIcon className={`w-10 h-10 transition-colors duration-300 ${isSpeaking ? 'text-white' : userAudioLevel > 10 ? 'text-green-400' : 'text-slate-500'}`} />
                
                {/* Visualizer Particles */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute top-1/2 left-1/2 origin-bottom w-0.5 bg-green-400 rounded-full transition-all duration-100"
                      style={{ 
                        transform: `rotate(${i * 30}deg) translateY(-${35 + (userAudioLevel * 0.15)}px)`, 
                        height: `${Math.max(2, userAudioLevel * 0.4)}px`,
                        opacity: userAudioLevel > 5 ? 0.8 : 0
                      }}
                    ></div>
                  ))}
                </div>
            </div>
        </div>
        
        <div className="text-center space-y-2">
            <h3 className={`text-sm font-black tracking-widest uppercase transition-colors duration-300 ${isSpeaking ? 'text-green-400' : 'text-white'}`}>
                {isSpeaking ? 'Engine Synthesizing' : userAudioLevel > 5 ? 'Processing Audio' : 'Ready for Input'}
            </h3>
            <p className="text-slate-500 text-[10px] font-bold max-w-[240px] px-4 leading-tight opacity-70">
                Point the camera at medical documents and speak. AI will explain findings.
            </p>
        </div>

        {/* Footer Action */}
        <button 
          onClick={onClose}
          className="w-full max-w-xs py-4 bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-white/5 hover:border-red-500/40 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 group"
        >
          <CloseIcon className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Terminate Engine
        </button>
      </div>

      <style>{`
        @keyframes scan-line-vertical {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line-vertical {
            animation: scan-line-vertical 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes ai-wave {
            0%, 100% { height: 12px; transform: scaleY(1); opacity: 0.6; }
            50% { height: 28px; transform: scaleY(1.4); opacity: 1; }
        }
        .animate-ai-wave {
            animation: ai-wave 0.8s ease-in-out infinite;
        }
        @keyframes node-pulse {
            0%, 100% { opacity: 0.2; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.1); }
        }
        .animate-node-pulse {
            animation: node-pulse 0.4s ease-out infinite;
        }
        @keyframes neural-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-neural-spin {
            animation: neural-spin 4s linear infinite;
        }
        .animate-ping-slow {
          animation: ping 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
