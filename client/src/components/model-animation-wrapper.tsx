import React, { useState } from "react";
import { motion } from "framer-motion";
import { ModelMascotSelector } from "./mascots";
import confetti from "canvas-confetti";

interface ModelAnimationWrapperProps {
  provider: string;
  children: React.ReactNode;
  onModelSelected?: () => void;
}

export function ModelAnimationWrapper({ 
  provider,
  children,
  onModelSelected
}: ModelAnimationWrapperProps) {
  const [isExcited, setIsExcited] = useState(false);
  
  // Celebration effect when a model is selected
  const triggerCelebration = () => {
    setIsExcited(true);
    
    // Try to create confetti effect (on model selection)
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.log("Confetti not available");
    }
    
    // Reset excitement after animation completes
    setTimeout(() => {
      setIsExcited(false);
      if (onModelSelected) onModelSelected();
    }, 1500);
  };
  
  // Animation for the card
  const cardAnimation = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3 }
  };
  
  return (
    <div className="relative">
      <div className="flex justify-center mb-4">
        <ModelMascotSelector 
          provider={provider}
          size={120}
          animate={true}
          isExcited={isExcited}
        />
      </div>
      
      <motion.div 
        className="relative"
        onClick={triggerCelebration}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        {...cardAnimation}
      >
        {children}
      </motion.div>
    </div>
  );
}