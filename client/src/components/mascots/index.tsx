import React from 'react';
import { ClaudeMascot } from './ClaudeMascot';
import { GeminiMascot } from './GeminiMascot';
import { OpenRouterMascot } from './OpenRouterMascot';

interface ModelMascotSelectorProps {
  provider: string;
  size?: number;
  animate?: boolean;
  className?: string;
}

export function ModelMascotSelector({ provider, size = 120, animate = true, className = "" }: ModelMascotSelectorProps) {
  switch (provider) {
    case 'anthropic':
      return <ClaudeMascot size={size} animate={animate} className={className} />;
    case 'google':
      return <GeminiMascot size={size} animate={animate} className={className} />;
    case 'openrouter':
      return <OpenRouterMascot size={size} animate={animate} className={className} />;
    default:
      // Default mascot or placeholder for unknown providers
      return (
        <div 
          className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full ${className}`}
          style={{ height: `${size}px`, width: `${size}px` }}
        >
          <span className="text-3xl font-bold text-gray-500 dark:text-gray-400">AI</span>
        </div>
      );
  }
}