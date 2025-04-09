import React from "react";
import { motion } from "framer-motion";

interface OpenRouterMascotProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function OpenRouterMascot({ size = 120, animate = true, className = "" }: OpenRouterMascotProps) {
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

  const rotateAnimation = animate ? {
    animate: {
      rotate: [0, 5, 0, -5, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        repeatType: "loop" as "loop"
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
      <circle cx="100" cy="100" r="95" fill="#333333" />
      
      {/* Router Body */}
      <motion.g {...rotateAnimation}>
        <rect x="55" y="70" width="90" height="60" rx="5" fill="#555555" />
        
        {/* Router lights */}
        <motion.circle 
          cx="75" 
          cy="85" 
          r="5" 
          fill="#4CAF50"
          animate={animate ? {
            opacity: [1, 0.3, 1],
            transition: { duration: 1, repeat: Infinity }
          } : {}}
        />
        <motion.circle 
          cx="95" 
          cy="85" 
          r="5" 
          fill="#FFC107"
          animate={animate ? {
            opacity: [1, 0.5, 1],
            transition: { duration: 1.5, repeat: Infinity, delay: 0.2 }
          } : {}}
        />
        <motion.circle 
          cx="115" 
          cy="85" 
          r="5" 
          fill="#03A9F4"
          animate={animate ? {
            opacity: [1, 0.5, 1],
            transition: { duration: 1.2, repeat: Infinity, delay: 0.4 }
          } : {}}
        />
        
        {/* Router antennas */}
        <line x1="70" y1="70" x2="70" y2="50" stroke="#888888" strokeWidth="3" />
        <line x1="100" y1="70" x2="100" y2="45" stroke="#888888" strokeWidth="3" />
        <line x1="130" y1="70" x2="130" y2="55" stroke="#888888" strokeWidth="3" />
        
        {/* Antenna tops */}
        <circle cx="70" cy="50" r="3" fill="#BBBBBB" />
        <circle cx="100" cy="45" r="3" fill="#BBBBBB" />
        <circle cx="130" cy="55" r="3" fill="#BBBBBB" />
      </motion.g>
      
      {/* Face */}
      <motion.g>
        {/* Eyes */}
        <motion.g {...eyeAnimation}>
          <circle cx="80" cy="115" r="6" fill="white" />
          <circle cx="120" cy="115" r="6" fill="white" />
        </motion.g>
        
        {/* Smile */}
        <path
          d="M85 130 Q100 140 115 130"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
      
      {/* Network waves */}
      <motion.g
        animate={animate ? {
          opacity: [0, 1, 0],
          scale: [0.8, 1.1, 0.8],
          transition: { duration: 2, repeat: Infinity }
        } : {}}
      >
        <path
          d="M50 100 C60 70, 140 70, 150 100"
          stroke="#BBBBBB"
          strokeWidth="2"
          strokeDasharray="4 2"
          fill="none"
        />
        <path
          d="M40 100 C60 60, 140 60, 160 100"
          stroke="#999999"
          strokeWidth="2"
          strokeDasharray="4 2"
          fill="none"
        />
        <path
          d="M30 100 C60 50, 140 50, 170 100"
          stroke="#666666"
          strokeWidth="2"
          strokeDasharray="4 2"
          fill="none"
        />
      </motion.g>
    </motion.svg>
  );
}