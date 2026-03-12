import React, { useState, useRef, useEffect } from 'react';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { SendIcon } from './icons/SendIcon';
import { CloseIcon } from './icons/CloseIcon';


interface ChatInputProps {
  onSend: (text: string, file: File | null) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null); // No preview for non-image files
      }
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleSend = () => {
    if ((text.trim() || file) && !isLoading) {
      onSend(text, file);
      setText('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  useEffect(adjustTextareaHeight, [text]);

  return (
    <div className="rounded-3xl p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] mx-1 bg-white/5 border border-white/15 backdrop-blur-xl">
      {file && (
        <div className="p-2 relative">
          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl">
            {preview ? (
              <img src={preview} alt="File preview" className="w-16 h-16 rounded-md object-cover"/>
            ) : (
                <div className="w-16 h-16 bg-slate-300/50 rounded-md flex items-center justify-center">
                    <PaperclipIcon className="w-6 h-6 text-slate-600" />
                </div>
            )}
            <div className="text-sm text-emerald-100">
                <p className="font-semibold truncate max-w-[150px]">{file.name}</p>
                <p>{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
           <button onClick={removeFile} className="absolute top-0 right-0 p-1 bg-black/40 text-white rounded-full hover:bg-black/70 transition-colors">
              <CloseIcon className="w-4 h-4" />
           </button>
        </div>
      )}
      <div className="flex items-end gap-2 p-1">
        <label htmlFor="file-upload" className="p-3 text-emerald-200/70 hover:text-emerald-200 cursor-pointer rounded-full hover:bg-white/10 transition-colors touch-manipulation">
          <PaperclipIcon className="w-6 h-6" />
        </label>
        <input id="file-upload" type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        
        <div className="flex-1 rounded-2xl bg-black/30 border border-white/10 p-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything…"
            className="w-full bg-transparent p-2.5 resize-none border-0 focus:ring-0 outline-none max-h-32 overflow-y-auto text-emerald-50 placeholder-emerald-100/40 text-base"
            rows={1}
            disabled={isLoading}
            style={{ fontSize: '16px' }} // Explicitly set 16px to prevent iOS zoom
          />
        </div>
        <button 
          onClick={handleSend} 
          disabled={isLoading || (!text.trim() && !file)} 
          className="p-3 rounded-full bg-emerald-400 text-[#03241a] disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed shadow-[0_0_18px_rgba(52,211,153,0.45)] hover:bg-emerald-300 transition-all touch-manipulation"
        >
          {isLoading ? (
             <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <SendIcon className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};