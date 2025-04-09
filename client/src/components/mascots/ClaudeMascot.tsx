import React from "react";
import { motion } from "framer-motion";

interface ClaudeMascotProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function ClaudeMascot({ size = 120, animate = true, className = "" }: ClaudeMascotProps) {
  const waveAnimation = {
    initial: { rotate: 0 },
    animate: animate ? { 
      rotate: [0, 15, 0, 15, 0], 
      transition: { 
        repeat: Infinity, 
        repeatType: "loop" as const,
        duration: 2.5, 
        ease: "easeInOut",
        repeatDelay: 2
      } 
    } : {}
  };

  const bouncingAnimation = {
    initial: { y: 0 },
    animate: animate ? {
      y: [0, -10, 0],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 2,
        ease: "easeInOut",
        repeatDelay: 1.5
      }
    } : {}
  };

  const eyeBlinkAnimation = {
    initial: { scaleY: 1 },
    animate: animate ? {
      scaleY: [1, 0.1, 1],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 0.4,
        times: [0, 0.5, 1],
        ease: "easeInOut",
        repeatDelay: 3
      }
    } : {}
  };

  return (
    <motion.div 
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      {...bouncingAnimation}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <motion.g>
          <circle cx="100" cy="100" r="80" fill="#7C3AED" />
          
          {/* Face */}
          <circle cx="100" cy="90" r="55" fill="white" />
          
          {/* Eyes */}
          <motion.g {...eyeBlinkAnimation}>
            <circle cx="75" cy="85" r="8" fill="#333" />
            <circle cx="125" cy="85" r="8" fill="#333" />
          </motion.g>
          
          {/* Smile */}
          <path
            d="M70 110 Q100 140 130 110"
            stroke="#333"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Antennas */}
          <path
            d="M90 45 Q85 25 75 15"
            stroke="#7C3AED"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="75" cy="15" r="5" fill="#7C3AED" />
          
          <path
            d="M110 45 Q115 25 125 15"
            stroke="#7C3AED"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="125" cy="15" r="5" fill="#7C3AED" />
          
          {/* Arm */}
          <motion.g {...waveAnimation} style={{ originX: 0.35, originY: 0.65 }}>
            <path
              d="M50 110 Q35 110 25 95"
              stroke="#7C3AED"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="25" cy="95" r="10" fill="#7C3AED" />
          </motion.g>
          
          {/* Other arm */}
          <path
            d="M150 110 Q165 110 175 95"
            stroke="#7C3AED"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="175" cy="95" r="10" fill="#7C3AED" />
        </motion.g>
      </svg>
    </motion.div>
  );
}