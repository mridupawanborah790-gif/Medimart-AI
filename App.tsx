
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Doctor, FilterCriteria } from './types';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { runQuery, findDoctors as findDoctorsService, translateToAssamese, generateComparisonImage } from './services/geminiService';
import { MapPinIcon } from './components/icons/MapPinIcon';
import { FilterModal } from './components/FilterModal';
import { SmileIcon } from './components/icons/SmileIcon';
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
      parts: [{ text: "Hello! I'm Medimart AI, your friendly medical assistant. How can I help you today? You can ask me about medications, upload a prescription, or ask me to find a doctor nearby." }],
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

    try {
      const response = await runQuery(text, file);
      let accumulatedText = '';
      
      // In @google/genai, the response object contains a 'stream' property which is the async iterable
      for await (const chunk of (response as any).stream || response) {
        try {
          // text is a getter property in this SDK, not a function
          const chunkText = chunk.text || '';
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
      
      // Handle race condition or invalid key selection
      if (error.message?.includes('Requested entity was not found')) {
        setHasKey(false);
        return;
      }

      let errorText = 'Sorry, I encountered an error. Please try again.';
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
      <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 mb-6">
          <MascotIcon />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-4">Secure Setup Required</h2>
        <p className="text-slate-600 mb-8 max-w-sm leading-relaxed">
          Medimart AI uses advanced medical vision and voice processing. To enable these features, please complete the secure setup by selecting your project API key.
          <br/><br/>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-green-600 underline text-xs">Technical documentation</a>
        </p>
        <button 
          onClick={handleOpenKeySelector}
          className="px-10 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-xl hover:bg-green-700 active:scale-95 transition-all flex items-center gap-3"
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
      
      <div className="flex flex-col h-[100dvh] font-sans overflow-hidden">
        <header className="p-3 md:p-4 flex items-center gap-3 sticky top-0 z-10 glassmorphism shrink-0">
          <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg">
            <SmileIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Medimart AI</h1>
            <p className="text-xs md:text-sm text-green-600 font-semibold flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              Secure Connection
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleOpenKeySelector}
              className="p-3 bg-white shadow-md rounded-full text-slate-500 hover:text-green-600 active:scale-95 transition-all neumorphic-convex border border-green-50"
              title="API Settings"
            >
              <KeyIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsVoiceAssistantOpen(true)}
              className="p-3 bg-green-600 shadow-md rounded-full text-white hover:bg-green-700 active:scale-95 transition-all border border-green-400"
              title="Voice Scan Assistant"
            >
              <CameraIcon className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6 md:space-y-8 pb-4 relative">
          {/* Subtle Watermark */}
          <div className="app-watermark"></div>
          
          <div className="relative z-10 space-y-6 md:space-y-8">
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
        
        <footer className="p-2 sticky bottom-0 z-20 shrink-0 bg-white/30 backdrop-blur-md">
          <div className="max-w-4xl mx-auto space-y-2">
              <div className="grid grid-cols-2 gap-2 px-1">
                  <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center px-3 py-3 text-sm font-bold text-slate-700 neumorphic-convex">
                      <MapPinIcon className="w-4 h-4 mr-1.5 text-green-500" />
                      Find Doctor
                  </button>
                  <button onClick={() => setIsSuggestionModalOpen(true)} className="flex items-center justify-center px-3 py-3 text-sm font-bold text-slate-700 neumorphic-convex">
                      <LightbulbIcon className="w-4 h-4 mr-1.5 text-yellow-500" />
                      Compare
                  </button>
              </div>
              <ChatInput onSend={handleSend} isLoading={isLoading} />
          </div>
        </footer>
      </div>
    </>
  );
};

export default App;
