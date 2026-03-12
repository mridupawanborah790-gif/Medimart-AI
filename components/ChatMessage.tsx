
import React from 'react';
import { Message } from '../types';
import { marked } from 'marked';
import { DoctorCard } from './DoctorCard';
import { TranslateIcon } from './icons/TranslateIcon';
import { WebIcon } from './icons/WebIcon';
import { SearchIcon } from './icons/SearchIcon';
import { KeyIcon } from './icons/KeyIcon';
import { MapPinIcon } from './icons/MapPinIcon';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  onTranslate?: (messageId: string, text: string) => void;
  onImageView?: (imageSrc: string) => void;
  onFixKey?: () => void;
}

const renderer = new marked.Renderer();
const originalLinkRenderer = renderer.link.bind(renderer);
renderer.link = (token) => {
  const html = originalLinkRenderer(token);
  return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" class="font-bold text-green-600 underline" ');
};
marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
});

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading, onTranslate, onImageView, onFixKey }) => {
  const isModel = message.role === 'model';
  
  const createMarkup = (text: string) => {
    const rawMarkup = marked.parse(text) as string;
    return { __html: rawMarkup };
  };

  const filePreview = message.file ? (
    <div className="mt-2 p-2 bg-black/10 rounded-lg">
      <img
        src={URL.createObjectURL(message.file)}
        alt="Uploaded content"
        className="max-w-xs max-h-64 rounded-lg"
        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
      />
    </div>
  ) : null;

  return (
    <div className={`flex items-end ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-2xl w-auto`}>
        <div className={`${isModel ? 'chat-bubble-model' : 'chat-bubble-user'} ${message.isPermissionError ? 'border-2 border-red-400 !bg-red-50 !text-red-900' : ''}`}>
          {!isModel && (
            <div className="flex justify-end mb-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                ✓ Sent
              </span>
            </div>
          )}
          {isLoading ? (
              <div className="px-4 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-current opacity-50 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-current opacity-50 rounded-full animate-pulse delay-150"></span>
                  <span className="w-2 h-2 bg-current opacity-50 rounded-full animate-pulse delay-300"></span>
              </div>
          ) : (
            <>
              {message.parts && message.parts.length > 0 && message.parts[0]?.text && (
                 <div 
                    className="prose-chat prose-sm max-w-none"
                    dangerouslySetInnerHTML={createMarkup(message.parts[0].text)} 
                 />
              )}

              {message.isPermissionError && onFixKey && (
                <button 
                  onClick={onFixKey}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-xl font-bold border border-red-200 shadow-sm active:scale-95 transition-all"
                >
                  <KeyIcon className="w-4 h-4" />
                  Update API Key
                </button>
              )}

              {message.doctors && message.doctors.length > 0 && (
                <div className="space-y-3 pt-2">
                  {message.doctors.map((doctor, index) => (
                    <DoctorCard key={index} doctor={doctor} />
                  ))}
                </div>
              )}

              {message.comparisonImage && (
                <div className="mt-3 relative group">
                  <div className="absolute top-3 right-3 z-10 p-2 bg-black/40 backdrop-blur-md rounded-lg text-white text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <SearchIcon className="w-3 h-3" />
                    TAP TO ZOOM
                  </div>
                  <img
                    src={`data:image/png;base64,${message.comparisonImage}`}
                    alt="Infographic"
                    className="max-w-full rounded-lg shadow-2xl cursor-pointer hover:scale-[1.01] transition-transform"
                    onClick={() => onImageView && onImageView(message.comparisonImage!)}
                  />
                </div>
              )}

              {filePreview}
              
              {message.groundingChunks && message.groundingChunks.length > 0 && (
                  <div className={`pt-3 mt-3 border-t ${isModel ? 'border-black/10' : 'border-white/20'}`}>
                      <h4 className="flex items-center text-xs font-bold opacity-80 mb-2 uppercase tracking-wider">
                          <WebIcon className="w-3 h-3 mr-1.5" /> Verification Sources
                      </h4>
                      <ul className="space-y-1.5 list-none p-0 m-0">
                          {message.groundingChunks.map((chunk, index) => {
                              const source = chunk.web || chunk.maps;
                              if (!source) return null;
                              const isMap = !!chunk.maps;
                              
                              return (
                                  <li key={index} className="text-xs">
                                      <a href={source.uri} target="_blank" rel="noopener" className="flex items-center hover:underline opacity-90 group">
                                         {isMap ? (
                                             <MapPinIcon className={`w-3 h-3 mr-2 ${isModel ? 'text-red-500' : 'text-red-300'} flex-shrink-0`} />
                                         ) : (
                                             <div className={`w-1 h-1 ${isModel ? 'bg-black/40' : 'bg-white/40'} rounded-full mr-2 flex-shrink-0`} />
                                         )}
                                         <span className="truncate">{source.title || (isMap ? "Google Maps Result" : "Web Source")}</span>
                                      </a>
                                  </li>
                              );
                          })}
                      </ul>
                  </div>
              )}

              {isModel && !message.translatedText && message.parts[0]?.text && !message.comparisonImage && !message.isPermissionError && (
                  <button 
                      onClick={() => onTranslate!(message.id, message.parts[0].text)}
                      disabled={message.isTranslating}
                      className="mt-3 flex items-center text-xs font-semibold opacity-80 hover:opacity-100 disabled:opacity-50 transition-all"
                  >
                       {message.isTranslating ? (
                           <span className="flex items-center gap-2">
                               <div className="w-3 h-3 border-2 border-black/20 border-t-brand-green rounded-full animate-spin"></div>
                               Translating...
                           </span>
                       ) : (
                           <><TranslateIcon className="w-4 h-4 mr-1.5" /> Translate to Assamese</>
                       )}
                  </button>
              )}
              {message.translatedText && (
                  <div className={`pt-3 mt-3 border-t ${isModel ? 'border-black/10' : 'border-white/20'} font-assamese text-sm leading-relaxed`}>
                      <p className="opacity-70 text-[10px] uppercase font-bold tracking-widest mb-1">Assamese Translation:</p>
                      {message.translatedText}
                  </div>
              )}
            </>
          )}
        </div>
        <p className={`text-[10px] mt-1 px-2 ${isModel ? 'text-left' : 'text-right'} text-slate-400`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

    </div>
  );
};
