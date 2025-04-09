import React from "react";
import { motion } from "framer-motion";

interface OpenRouterMascotProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function OpenRouterMascot({ size = 120, animate = true, className = "" }: OpenRouterMascotProps) {
  const spinAnimation = {
    initial: { rotate: 0 },
    animate: animate ? {
      rotate: 360,
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 10,
        ease: "linear"
      }
    } : {}
  };

  const pulseAnimation = {
    initial: { scale: 1 },
    animate: animate ? {
      scale: [1, 1.05, 1],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 3,
        ease: "easeInOut"
      }
    } : {}
  };

  const blinkAnimation = {
    initial: { opacity: 1 },
    animate: animate ? {
      opacity: [1, 0.5, 1],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 0.75,
        ease: "easeInOut",
        repeatDelay: 3.5
      }
    } : {}
  };

  const moveAroundAnimation = {
    initial: { x: 0, y: 0 },
    animate: animate ? {
      x: [0, 5, 0, -5, 0],
      y: [0, -5, 0, 5, 0],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 4,
        ease: "easeInOut"
      }
    } : {}
  };

  return (
    <motion.div 
      className={`inline-block ${className}`} 
      style={{ width: size, height: size }}
      {...moveAroundAnimation}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base circle */}
        <motion.circle
          cx="100"
          cy="100"
          r="75"
          fill="#333333"
          {...pulseAnimation}
        />
        
        {/* Router symbol outer ring */}
        <motion.g {...spinAnimation}>
          <circle
            cx="100"
            cy="100"
            r="70"
            stroke="#FF6B6B"
            strokeWidth="6"
            strokeDasharray="15 10"
            fill="transparent"
          />
        </motion.g>
        
        {/* Inner circle */}
        <circle
          cx="100"
          cy="100"
          r="45"
          fill="#444444"
        />
        
        {/* Connection nodes */}
        <motion.circle
          cx="65"
          cy="65"
          r="10"
          fill="#4ECDC4"
          {...blinkAnimation}
        />
        
        <motion.circle
          cx="135"
          cy="65"
          r="10"
          fill="#FF6B6B"
          animate={{
            opacity: [1, 0.5, 1],
            transition: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 0.75,
              ease: "easeInOut",
              repeatDelay: 2.8
            }
          }}
        />
        
        <motion.circle
          cx="65"
          cy="135"
          r="10"
          fill="#F7FFF7"
          animate={{
            opacity: [1, 0.5, 1],
            transition: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 0.75,
              ease: "easeInOut",
              repeatDelay: 4.2
            }
          }}
        />
        
        <motion.circle
          cx="135"
          cy="135"
          r="10"
          fill="#FFE66D"
          animate={{
            opacity: [1, 0.5, 1],
            transition: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 0.75,
              ease: "easeInOut",
              repeatDelay: 3.7
            }
          }}
        />
        
        {/* Connection lines */}
        <line
          x1="65"
          y1="65"
          x2="100"
          y2="100"
          stroke="#4ECDC4"
          strokeWidth="3"
        />
        
        <line
          x1="135"
          y1="65"
          x2="100"
          y2="100"
          stroke="#FF6B6B"
          strokeWidth="3"
        />
        
        <line
          x1="65"
          y1="135"
          x2="100"
          y2="100"
          stroke="#F7FFF7"
          strokeWidth="3"
        />
        
        <line
          x1="135"
          y1="135"
          x2="100"
          y2="100"
          stroke="#FFE66D"
          strokeWidth="3"
        />
        
        {/* Center node */}
        <motion.circle
          cx="100"
          cy="100"
          r="15"
          fill="#FF6B6B"
          {...pulseAnimation}
        />
        
        {/* Eye */}
        <motion.circle
          cx="100"
          cy="100"
          r="7"
          fill="white"
          {...blinkAnimation}
        />
      </svg>
    </motion.div>
  );
}