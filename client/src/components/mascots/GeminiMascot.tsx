import React from "react";
import { motion } from "framer-motion";

interface GeminiMascotProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function GeminiMascot({ size = 120, animate = true, className = "" }: GeminiMascotProps) {
  // Animation variants
  const eyeAnimation = animate ? {
    animate: {
      y: [0, -1, 0, 1, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as "reverse"
      }
    }
  } : {};

  const floatAnimation = animate ? {
    animate: {
      y: [0, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse" as "reverse"
      }
    }
  } : {};

  const tiltAnimation = animate ? {
    animate: {
      rotate: [-3, 3, -3],
      transition: {
        duration: 4, 
        repeat: Infinity,
        repeatType: "reverse" as "reverse",
        ease: "easeInOut"
      }
    }
  } : {};

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...floatAnimation}
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="95" fill="#4285F4" />
      
      {/* Face */}
      <motion.g {...floatAnimation}>
        {/* Gemini eyes */}
        <motion.g {...eyeAnimation}>
          <g transform="translate(55, 80)">
            <circle cx="0" cy="0" r="10" fill="white" />
            <circle cx="-2" cy="-2" r="5" fill="black" />
          </g>
          <g transform="translate(145, 80)">
            <circle cx="0" cy="0" r="10" fill="white" />
            <circle cx="-2" cy="-2" r="5" fill="black" />
          </g>
        </motion.g>
        
        {/* Mouth - simple happy line */}
        <path
          d="M70 120 Q100 140 130 120"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
      
      {/* Gemini logo stylized as a necklace/emblem */}
      <motion.g 
        transform="translate(80, 150) scale(0.4)"
        {...tiltAnimation}
      >
        {/* This is a simplified Gemini logo as two shapes */}
        <path d="M0,0 L20,40 L40,0 Z" fill="#fbbc05" />
        <path d="M60,0 L80,40 L100,0 Z" fill="#ea4335" />
        {/* Chain part */}
        <path d="M-10,0 C-10,-5 110,-5 110,0" stroke="#E8EAED" strokeWidth="3" fill="none" />
      </motion.g>
    </motion.svg>
  );
}