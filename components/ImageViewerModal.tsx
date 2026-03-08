
import React, { useEffect, useState, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface ImageViewerModalProps {
  src: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ src, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); 
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className={`fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header Controls */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-[110] bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex gap-2">
          <button 
            onClick={handleZoomIn}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all font-bold"
          >
            Zoom +
          </button>
          <button 
            onClick={handleZoomOut}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all font-bold"
          >
            Zoom -
          </button>
          {scale > 1 && (
             <button 
                onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all font-bold"
              >
                Reset
              </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-3 bg-white text-slate-900 rounded-full shadow-lg hover:bg-slate-200 transition-all active:scale-95"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Image Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <div 
          className="transition-transform duration-200 ease-out flex items-center justify-center"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          <img
            src={`data:image/png;base64,${src}`}
            alt="Full screen medical analysis"
            className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white/80 text-sm pointer-events-none">
        {scale > 1 ? 'Drag to pan around details' : 'Pinch or click Zoom to inspect text'}
      </div>
    </div>
  );
};
