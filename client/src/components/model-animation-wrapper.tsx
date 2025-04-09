import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface ModelAnimationWrapperProps {
  provider: string;
  children: React.ReactNode;
  onModelSelected?: () => void;
}

const CELEBRATION_MESSAGES = {
  anthropic: [
    "Excelente escolha! Claude é conhecido por sua criatividade e compreensão de nuances.",
    "Claude é um grande assistente para tarefas criativas e raciocínio complexo!",
    "Claude é perfeito para respostas bem elaboradas e detalhadas!"
  ],
  google: [
    "Gemini é uma excelente escolha para tarefas multimodais e raciocínio avançado!",
    "Você escolheu o Gemini! Ele é incrível para análise de dados e conteúdo visual.",
    "Gemini tem capacidades incríveis para entender contextos e gerar conteúdo preciso!"
  ],
  openrouter: [
    "OpenRouter oferece acesso aos melhores modelos do mercado através de uma única API!",
    "Excelente escolha! Com OpenRouter você tem acesso a múltiplos modelos diferentes.",
    "OpenRouter é perfeito para quem precisa de flexibilidade entre diferentes modelos!"
  ]
};

export function ModelAnimationWrapper({ 
  provider,
  children,
  onModelSelected
}: ModelAnimationWrapperProps) {
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();
  
  // Reset celebration state when provider changes
  useEffect(() => {
    setHasCelebrated(false);
  }, [provider]);
  
  // Function to trigger confetti celebration
  const celebrateSelection = () => {
    if (hasCelebrated || !provider) return;
    
    setIsAnimating(true);
    
    // Show a toast message
    if (provider && CELEBRATION_MESSAGES[provider as keyof typeof CELEBRATION_MESSAGES]) {
      const messages = CELEBRATION_MESSAGES[provider as keyof typeof CELEBRATION_MESSAGES];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      toast({
        title: "Modelo selecionado!",
        description: randomMessage,
      });
    }
    
    // Trigger confetti animation
    const duration = 1500;
    const colors = provider === 'anthropic' 
      ? ['#7C3AED', '#8B5CF6', '#A78BFA'] 
      : provider === 'google'
      ? ['#4285F4', '#34A853', '#FBBC05', '#EA4335']
      : ['#888888', '#AAAAAA', '#666666'];
      
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      startVelocity: 30,
      gravity: 1.2,
      ticks: 300,
      shapes: ['circle', 'square'],
      scalar: 1
    });
    
    // Set timeout to end animation
    setTimeout(() => {
      setIsAnimating(false);
      setHasCelebrated(true);
      if (onModelSelected) onModelSelected();
    }, duration);
  };
  
  // Animation variants
  const containerVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.5
      }
    }
  };
  
  return (
    <motion.div
      className="relative cursor-pointer w-fit mx-auto"
      variants={containerVariants}
      initial="initial"
      animate={isAnimating ? "animate" : "initial"}
      onClick={celebrateSelection}
    >
      {children}
    </motion.div>
  );
}