import React from 'react';

export const MascotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <radialGradient id="mascotGradient" cx="0.4" cy="0.4" r="0.6">
        <stop offset="0%" stopColor="#00c08a" />
        <stop offset="100%" stopColor="#00a878" />
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="2" dy="2" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    <circle cx="50" cy="50" r="45" fill="url(#mascotGradient)" filter="url(#shadow)" />
    
    {/* Eyes */}
    <circle cx="35" cy="45" r="5" fill="white" />
    <circle cx="65" cy="45" r="5" fill="white" />
    
    {/* Smile */}
    <path d="M 30 65 Q 50 80 70 65" stroke="white" strokeWidth="4" fill="transparent" strokeLinecap="round" />
  </svg>
);