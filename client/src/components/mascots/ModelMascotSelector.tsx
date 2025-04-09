import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClaudeMascot, GeminiMascot, OpenRouterMascot } from ".";

interface ModelMascotSelectorProps {
  provider: "anthropic" | "google" | "openrouter" | string;
  size?: number;
  animate?: boolean;
  isExcited?: boolean;
  className?: string;
}

export function ModelMascotSelector({ 
  provider, 
  size = 120, 
  animate = true, 
  isExcited = false,
  className = "" 
}: ModelMascotSelectorProps) {
  
  // Scale animation when excited - used when user selects a model
  const excitedAnimation = {
    initial: { scale: 1 },
    animate: isExcited ? {
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    } : {}
  };

  // Randomly generate a celebration message when excited
  const celebrationMessages = [
    "Excelente escolha!",
    "Ótima decisão!",
    "Vamos lá!",
    "Perfeito!",
    "Boa escolha!",
    "Incrível!",
    "Você vai adorar!"
  ];
  
  const randomMessage = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div {...excitedAnimation}>
        <AnimatePresence mode="wait">
          {provider === "anthropic" && (
            <motion.div 
              key="claude"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ClaudeMascot size={size} animate={animate} />
            </motion.div>
          )}
          
          {provider === "google" && (
            <motion.div 
              key="gemini"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GeminiMascot size={size} animate={animate} />
            </motion.div>
          )}
          
          {provider === "openrouter" && (
            <motion.div 
              key="openrouter"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <OpenRouterMascot size={size} animate={animate} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Show celebration message when excited */}
      <AnimatePresence>
        {isExcited && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-2 text-center font-medium text-primary"
          >
            {randomMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}