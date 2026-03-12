
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Doctor, FilterCriteria } from './types';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { runQuery, findDoctors as findDoctorsService, translateToAssamese, generateComparisonImage } from './services/geminiService';
import { MapPinIcon } from './components/icons/MapPinIcon';
import { FilterModal } from './components/FilterModal';
import { SuggestionModal } from './components/SuggestionModal';
import { LightbulbIcon } from './components/icons/LightbulbIcon';
import { ImageViewerModal } from './components/ImageViewerModal';
import { CameraVoiceAssistant } from './components/CameraVoiceAssistant';
import { CameraIcon } from './components/icons/CameraIcon';
import { KeyIcon } from './components/icons/KeyIcon';
import { MascotIcon } from './components/icons/MascotIcon';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateUniqueId(),
      role: 'model',
      parts: [{ text: "Hello! I'm Medimart AI, your friendly medical assistant.\nHow can I help you today? You can ask me about medications, upload a prescription, or ask me to find a doctor nearby." }],
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true); 
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true); 
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async (text: string, file: File | null) => {
    if (!text && !file) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: generateUniqueId(),
      role: 'user',
      parts: [{ text }],
      timestamp: new Date(),
    };
    if (file) userMessage.file = file;

    setMessages(prev => [...prev, userMessage]);

    const placeholderId = generateUniqueId();
    setMessages(prev => [...prev, { id: placeholderId, role: 'model', parts: [{ text: '' }], timestamp: new Date(), isLoading: true }]);

    let accumulatedText = '';
    try {
      const response = await runQuery(text, file);
      
      // Use the .stream property or fallback to the response itself
      const stream = (response as any).stream || response;
      
      for await (const chunk of stream) {
        try {
          // In the Unified SDK, chunk.text is a getter that can throw if the response is blocked
          // We use a safer check to avoid crashing the render loop
          let chunkText = '';
          try {
             chunkText = chunk.text || '';
          } catch (textErr) {
             console.warn('Chunk text blocked or unavailable:', textErr);
             // If we already have some text, we just stop here rather than crashing
             continue; 
          }

          if (chunkText) {
            accumulatedText += chunkText;
            
            setMessages(currentMessages => 
              currentMessages.map(msg => 
                msg.id === placeholderId 
                  ? { ...msg, parts: [{ text: accumulatedText }], isLoading: false } 
                  : msg
              )
            );
          }
        } catch (e) {
          console.warn('Error processing chunk:', e);
        }
      }
    } catch (error: any) {
      console.error('Error from Gemini API:', error);
      
      // Only setHasKey(false) if we haven't received any content yet 
      // This prevents the screen from blanking out mid-conversation
      if (error.message?.includes('Requested entity was not found') && !accumulatedText) {
        setHasKey(false);
        return;
      }

      let errorText = 'Sorry, I encountered an error. Please try again.';
      if (error.message?.includes('finishReason')) {
         errorText = 'The response was interrupted for safety or technical reasons. Please try a different prompt.';
      }
      
      const isPermissionError = error.message?.toLowerCase().includes('permission') || error.message?.toLowerCase().includes('403');
      
      if (isPermissionError) {
        errorText = 'Permission Denied: This feature requires a valid API key setup.';
      }

      const errorMessage: Message = {
        id: generateUniqueId(),
        role: 'model',
        parts: [{ text: errorText }],
        timestamp: new Date(),
        isPermissionError: isPermissionError
      };
      setMessages(prev => prev.map(msg => msg.id === placeholderId ? errorMessage : msg));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchWithFilters = useCallback((filters: FilterCriteria) => {
    setIsFilterModalOpen(false);
    const userQuery = `Searching for doctors ${filters.specialty ? `specializing in ${filters.specialty}` : ''}...`;

    const userMessage: Message = { id: generateUniqueId(), role: 'user', parts: [{ text: userQuery }], timestamp: new Date() };
    const loadingMessageId = generateUniqueId();
    setMessages(prev => [...prev, userMessage, { id: loadingMessageId, role: 'model', parts: [{ text: '' }], timestamp: new Date(), isLoading: true }]);

    const performSearch = async (latitude: number | null, longitude: number | null) => {
        setIsLoading(true);
        try {
            const { doctors, groundingChunks } = await findDoctorsService(latitude, longitude, filters);
            if (doctors && doctors.length > 0) {
                setMessages(prev => prev.map(msg => msg.id === loadingMessageId ? {
                    id: generateUniqueId(),
                    role: 'model',
                    parts: [{ text: "Here are the top-rated healthcare providers I found:" }],
                    timestamp: new Date(),
                    doctors,
                    groundingChunks,
                } : msg));
            } else {
                 setMessages(prev => prev.map(msg => msg.id === loadingMessageId ? {
                    id: generateUniqueId(),
                    role: 'model',
                    parts: [{ text: "I couldn't find any specific doctors matching those filters. Try adjusting your search criteria." }],
                    timestamp: new Date(),
                } : msg));
            }
        } catch (error: any) {
            if (error.message?.includes('Requested entity was not found')) {
                setHasKey(false);
                return;
            }
            const isPermissionError = error.message?.toLowerCase().includes('permission');
            setMessages(prev => prev.map(msg => msg.id === loadingMessageId ? {
                id: generateUniqueId(),
                role: 'model',
                parts: [{ text: isPermissionError ? 'API Key Permission required for this search.' : 'Trouble searching for doctors.' }],
                timestamp: new Date(),
                isPermissionError
            } : msg));
        } finally {
            setIsLoading(false);
        }
    };

    if (filters.location) {
        performSearch(null, null);
    } else {
        navigator.geolocation.getCurrentPosition(
            (position) => performSearch(position.coords.latitude, position.coords.longitude),
            () => performSearch(null, null)
        );
    }
  }, []);

  const handleSuggestionSearch = useCallback(async (query: string) => {
    setIsSuggestionModalOpen(false);
    setIsLoading(true);
    const userMessage: Message = { id: generateUniqueId(), role: 'user', parts: [{ text: `Compare: ${query}` }], timestamp: new Date() };
    const loadingId = generateUniqueId();
    setMessages(prev => [...prev, userMessage, { id: loadingId, role: 'model', parts: [{ text: 'Generating high-res comparison...' }], timestamp: new Date(), isLoading: true }]);

    try {
      const { image, error } = await generateComparisonImage(query);
      if (image) {
        setMessages(prev => prev.map(msg => msg.id === loadingId ? {
          id: generateUniqueId(),
          role: 'model',
          parts: [{ text: `Comparison for ${query}` }],
          timestamp: new Date(),
          comparisonImage: image,
        } : msg));
      } else {
        throw new Error(error || 'Failed to generate image');
      }
    } catch (error: any) {
       if (error.message?.includes('Requested entity was not found')) {
          setHasKey(false);
          return;
       }
       const isPermissionError = error.message?.toLowerCase().includes('permission');
       setMessages(prev => prev.map(msg => msg.id === loadingId ? {
          id: generateUniqueId(),
          role: 'model',
          parts: [{ text: isPermissionError ? 'Advanced comparison requires a valid API key setup.' : 'Failed to generate comparison.' }],
          timestamp: new Date(),
          isPermissionError
       } : msg));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTranslate = useCallback(async (messageId: string, text: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isTranslating: true } : msg
    ));
    
    try {
      const translatedText = await translateToAssamese(text);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, translatedText, isTranslating: false } : msg
      ));
    } catch (error: any) {
      console.error('Translation error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isTranslating: false } : msg
      ));
    }
  }, []);

  if (hasKey === false) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#030a08] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 mb-6">
          <MascotIcon />
        </div>
        <h2 className="text-2xl font-extrabold text-emerald-50 mb-4">Secure Setup Required</h2>
        <p className="text-emerald-100/75 mb-8 max-w-sm leading-relaxed">
          Medimart AI uses advanced medical vision and voice processing. To enable these features, please complete the secure setup by selecting your project API key.
          <br/><br/>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-emerald-300 underline text-xs">Technical documentation</a>
        </p>
        <button 
          onClick={handleOpenKeySelector}
          className="px-10 py-4 bg-emerald-400 text-[#03241a] rounded-2xl font-bold shadow-[0_0_25px_rgba(52,211,153,0.5)] hover:bg-emerald-300 active:scale-95 transition-all flex items-center gap-3"
        >
          <KeyIcon className="w-6 h-6" />
          Complete Setup
        </button>
      </div>
    );
  }

  return (
    <>
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} onSearch={handleSearchWithFilters} />
      <SuggestionModal isOpen={isSuggestionModalOpen} onClose={() => setIsSuggestionModalOpen(false)} onSearch={handleSuggestionSearch} />
      {viewingImage && <ImageViewerModal src={viewingImage} onClose={() => setViewingImage(null)} />}
      {isVoiceAssistantOpen && <CameraVoiceAssistant onClose={() => setIsVoiceAssistantOpen(false)} />}
      
      <div className="flex flex-col h-[100dvh] font-sans overflow-hidden app-shell-dark max-w-5xl mx-auto w-full relative">
        <header className="px-5 py-4 flex items-center justify-between border-b border-emerald-400/20 glass-panel-dark shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-wide text-white">Medimart AI</h1>
            <p className="text-xs text-emerald-200/85">Secure Connection</p>
          </div>
          <div className="vision-sync-pill">Vision Sync</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-24 relative">
          <section className="scanner-frame relative overflow-hidden rounded-[2rem] border border-white/15 shadow-2xl">
            <div className="absolute inset-0 scanner-overlay-grid"></div>
            <div className="scan-bracket top-4 left-4"></div>
            <div className="scan-bracket top-4 right-4 rotate-90"></div>
            <div className="scan-bracket bottom-4 right-4 rotate-180"></div>
            <div className="scan-bracket bottom-4 left-4 -rotate-90"></div>
            <div className="scan-face-ring"></div>
            <div className="scan-forehead-dot"></div>
            <div className="scanner-watermark">MedimartAI</div>
          </section>

          <div className="flex flex-wrap gap-2 justify-center glass-panel-dark rounded-full p-2 border border-white/10">
            {['AUTO', 'ENGLISH', 'HINDI', 'ASSAMESE'].map((lang) => (
              <button
                key={lang}
                className="px-4 py-1.5 text-xs md:text-sm rounded-full bg-white/5 text-emerald-100 border border-white/10 hover:bg-emerald-400/20 transition-colors"
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id || index}
                message={msg}
                isLoading={msg.isLoading}
                onTranslate={handleTranslate}
                onImageView={setViewingImage}
                onFixKey={handleOpenKeySelector}
              />
            ))}
          </div>
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-3 pt-2 sticky bottom-0 z-20 shrink-0 bg-[#07110f]/80 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setIsFilterModalOpen(true)} className="action-pill-dark">
                <MapPinIcon className="w-4 h-4 mr-1 text-emerald-300" />
                Find Doctor
              </button>
              <button onClick={() => setIsSuggestionModalOpen(true)} className="action-pill-dark">
                <LightbulbIcon className="w-4 h-4 mr-1 text-emerald-300" />
                Compare Medicine
              </button>
              <button onClick={() => setIsVoiceAssistantOpen(true)} className="action-pill-dark">
                <CameraIcon className="w-4 h-4 mr-1 text-emerald-300" />
                Upload Prescription
              </button>
            </div>
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </div>
        </footer>

        <button
          onClick={() => setIsVoiceAssistantOpen(true)}
          className="mic-float-btn"
          title="Voice Assistant"
        >
          <CameraIcon className="w-6 h-6" />
        </button>
      </div>
    </>
  );
};

export default App;
