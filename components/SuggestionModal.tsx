import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';

const CompareIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M5 7.5H14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M5 11.5H11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M5 15.5H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M17 8L20.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M20.5 8L17 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M17 19.5L20.5 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M20.5 19.5L17 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.24)] ring-1 ring-slate-100 transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600">
              <CompareIcon className="w-4.5 h-4.5" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Suggest & Compare</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 pt-5 space-y-4">
            <div>
              <label htmlFor="suggestion-query" className="block text-sm font-medium text-slate-600 mb-2">
                Enter two products to compare
              </label>
              <input 
                ref={inputRef}
                type="text" 
                id="suggestion-query" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchClick() }}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/75 text-slate-800 placeholder-slate-400 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition"
                placeholder="e.g. Product A vs Product B"
                style={{ fontSize: '16px' }}
              />
            </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 rounded-b-3xl bg-white">
          <button 
            onClick={handleReset} 
            className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Reset
          </button>
          <button 
            onClick={handleSearchClick}
            disabled={!query.trim()}
            className="px-7 py-2.5 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 shadow-[0_10px_25px_rgba(99,102,241,0.35)] hover:brightness-105 active:scale-[0.98] transition-all disabled:from-slate-400 disabled:via-slate-400 disabled:to-slate-500 disabled:shadow-none"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};
