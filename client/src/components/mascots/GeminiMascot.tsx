import React from "react";
import { motion } from "framer-motion";

interface GeminiMascotProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function GeminiMascot({ size = 120, animate = true, className = "" }: GeminiMascotProps) {
  const floatAnimation = {
    initial: { y: 0 },
    animate: animate ? {
      y: [0, -8, 0],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 3,
        ease: "easeInOut"
      }
    } : {}
  };

  const rotateAnimation = {
    initial: { rotate: 0 },
    animate: animate ? {
      rotate: [0, 5, 0, -5, 0],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 6,
        ease: "easeInOut"
      }
    } : {}
  };

  const glowAnimation = {
    initial: { opacity: 0.5 },
    animate: animate ? {
      opacity: [0.5, 0.8, 0.5],
      scale: [1, 1.05, 1],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 3,
        ease: "easeInOut"
      }
    } : {}
  };

  return (
    <motion.div 
      className={`inline-block ${className}`} 
      style={{ width: size, height: size }}
      {...floatAnimation}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Glow */}
        <motion.circle 
          cx="100" 
          cy="100" 
          r="75" 
          fill="url(#geminiGlow)" 
          opacity="0.6" 
          {...glowAnimation}
        />
        
        {/* Gemini Body */}
        <motion.g {...rotateAnimation} style={{ originX: 0.5, originY: 0.5 }}>
          {/* Space-like body */}
          <circle cx="100" cy="100" r="60" fill="#4285F4" />
          
          {/* Inner gradient */}
          <circle cx="100" cy="100" r="48" fill="url(#geminiGradient)" />
          
          {/* Stars/sparkles */}
          <motion.g animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} 
            transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}>
            <circle cx="75" cy="80" r="3" fill="white" />
            <circle cx="120" cy="90" r="2" fill="white" />
            <circle cx="90" cy="110" r="2.5" fill="white" />
            <circle cx="110" cy="70" r="2" fill="white" />
            <circle cx="85" cy="65" r="1.5" fill="white" />
            <circle cx="130" cy="105" r="2" fill="white" />
            <circle cx="70" cy="105" r="2" fill="white" />
          </motion.g>
          
          {/* Twin faces (Gemini) */}
          <circle cx="80" cy="95" r="18" fill="#E8EAED" />
          <circle cx="120" cy="95" r="18" fill="#E8EAED" />
          
          {/* Left face features */}
          <circle cx="75" cy="90" r="3" fill="#4285F4" />
          <circle cx="85" cy="90" r="3" fill="#4285F4" />
          <path
            d="M75 100 Q80 105 85 100"
            stroke="#4285F4"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Right face features */}
          <circle cx="115" cy="90" r="3" fill="#4285F4" />
          <circle cx="125" cy="90" r="3" fill="#4285F4" />
          <path
            d="M115 100 Q120 105 125 100"
            stroke="#4285F4"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>
        
        {/* Defs for gradients */}
        <defs>
          <radialGradient id="geminiGradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
            <stop offset="0%" stopColor="#8AB4F8" />
            <stop offset="100%" stopColor="#4285F4" />
          </radialGradient>
          <radialGradient id="geminiGlow" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
            <stop offset="0%" stopColor="#8AB4F8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4285F4" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  );
}