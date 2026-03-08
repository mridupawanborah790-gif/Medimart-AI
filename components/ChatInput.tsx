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
    <div className="glassmorphism rounded-2xl p-2 shadow-lg mx-1">
      {file && (
        <div className="p-2 relative">
          <div className="flex items-center gap-3 bg-slate-200/50 p-2 rounded-md">
            {preview ? (
              <img src={preview} alt="File preview" className="w-16 h-16 rounded-md object-cover"/>
            ) : (
                <div className="w-16 h-16 bg-slate-300/50 rounded-md flex items-center justify-center">
                    <PaperclipIcon className="w-6 h-6 text-slate-600" />
                </div>
            )}
            <div className="text-sm text-slate-700">
                <p className="font-semibold truncate max-w-[150px]">{file.name}</p>
                <p>{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
           <button onClick={removeFile} className="absolute top-0 right-0 p-1 bg-slate-600 text-white rounded-full hover:bg-slate-800 transition-colors">
              <CloseIcon className="w-4 h-4" />
           </button>
        </div>
      )}
      <div className="flex items-end gap-2 p-1">
        <label htmlFor="file-upload" className="p-3 text-slate-500 hover:text-green-600 cursor-pointer rounded-full hover:bg-slate-200/50 transition-colors touch-manipulation">
          <PaperclipIcon className="w-6 h-6" />
        </label>
        <input id="file-upload" type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        
        <div className="flex-1 neumorphic-concave p-1">
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
            placeholder="Ask me anything..."
            className="w-full bg-transparent p-2 resize-none border-0 focus:ring-0 outline-none max-h-32 overflow-y-auto text-slate-800 placeholder-slate-500 text-base"
            rows={1}
            disabled={isLoading}
            style={{ fontSize: '16px' }} // Explicitly set 16px to prevent iOS zoom
          />
        </div>
        <button 
          onClick={handleSend} 
          disabled={isLoading || (!text.trim() && !file)} 
          className="p-3 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:shadow-inner transition-all touch-manipulation"
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