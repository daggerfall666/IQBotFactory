import React from "react";
import { motion } from "framer-motion";

interface ClaudeMascotProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function ClaudeMascot({ size = 120, animate = true, className = "" }: ClaudeMascotProps) {
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
      <circle cx="100" cy="100" r="95" fill="#7C3AED" />
      
      {/* Face */}
      <motion.g {...floatAnimation}>
        {/* Claude eyes */}
        <motion.g {...eyeAnimation}>
          <circle cx="70" cy="80" r="10" fill="white" />
          <circle cx="68" cy="78" r="5" fill="black" />
          <circle cx="130" cy="80" r="10" fill="white" />
          <circle cx="128" cy="78" r="5" fill="black" />
        </motion.g>
        
        {/* Mouth - gentle curve */}
        <path
          d="M70 120 Q100 140 130 120"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
      
      {/* Claude's bow tie */}
      <motion.g 
        animate={animate ? {
          rotate: [-2, 2, -2],
          transition: { duration: 1.5, repeat: Infinity }
        } : {}}
      >
        <rect x="90" y="150" width="20" height="8" rx="4" fill="#FFFFFF" />
        <path d="M90 154 L75 146 L75 162 Z" fill="#FFFFFF" />
        <path d="M110 154 L125 146 L125 162 Z" fill="#FFFFFF" />
      </motion.g>
    </motion.svg>
  );
}