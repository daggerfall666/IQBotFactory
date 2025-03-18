import { motion } from "framer-motion";
import { BarChart3, Activity, MessageSquare, Bot } from "lucide-react";

interface LoadingAnimationProps {
  message?: string;
}

export function LoadingAnimation({ message = "Loading..." }: LoadingAnimationProps) {
  const icons = [
    { Icon: BarChart3, delay: 0 },
    { Icon: Activity, delay: 0.2 },
    { Icon: MessageSquare, delay: 0.4 },
    { Icon: Bot, delay: 0.6 }
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex gap-4">
        {icons.map(({ Icon, delay }, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <Icon className="h-8 w-8 text-primary/60" />
          </motion.div>
        ))}
      </div>
      <motion.p
        className="text-muted-foreground text-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        {message}
      </motion.p>
    </div>
  );
}
