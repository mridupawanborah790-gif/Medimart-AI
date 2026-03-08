import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

export const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, onClose, onSearch }) => {
  const [query, setQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => inputRef.current?.focus(), 300); // Focus after transition
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const handleSearchClick = () => {
    if (query.trim()) {
        onSearch(query.trim());
    }
  };

  const handleReset = () => {
    setQuery('');
  }

  return (
    <div 
      className={`fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div 
        className={`w-[95%] max-w-md glassmorphism rounded-2xl shadow-2xl transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-2">
            <LightbulbIcon className="w-6 h-6 text-yellow-500" />
            <h2 className="text-lg font-bold text-slate-800">Suggest & Compare</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-white/50">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
            <div>
              <label htmlFor="suggestion-query" className="block text-sm font-semibold text-slate-700 mb-1">
                Enter two products to compare
              </label>
              <div className="relative neumorphic-concave p-1">
                <input 
                  ref={inputRef}
                  type="text" 
                  id="suggestion-query" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchClick() }}
                  className="w-full px-3 py-2 bg-transparent border-0 rounded-md focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400 text-base"
                  placeholder="e.g., Product A vs Product B"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/20 rounded-b-xl">
          <button 
            onClick={handleReset} 
            className="px-5 py-2.5 text-sm font-bold text-slate-700 neumorphic-convex"
          >
            Reset
          </button>
          <button 
            onClick={handleSearchClick}
            disabled={!query.trim()}
            className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg hover:shadow-xl active:shadow-inner transition-all disabled:from-slate-400 disabled:to-slate-500"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};