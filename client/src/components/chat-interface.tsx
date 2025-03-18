import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sendMessage } from "@/lib/anthropic";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Chatbot } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  botId: number;
  className?: string;
}

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function ChatInterface({ botId, className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: bot } = useQuery<Chatbot>({
    queryKey: [`/api/chatbots/${botId}`],
  });

  useEffect(() => {
    if (bot?.settings.initialMessage) {
      setMessages([{ role: "assistant", content: bot.settings.initialMessage }]);
    }
  }, [bot]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessage(botId, input);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error: any) {
      let errorMessage = error.message;

      if (error.message.includes("Chave API inválida")) {
        errorMessage = "Chave API inválida. Por favor, verifique a configuração do bot.";
      } else if (error.message.includes("No API key")) {
        errorMessage = "Chave API não configurada. Por favor, configure uma chave API nas configurações do bot.";
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className={`${className} backdrop-blur-sm bg-background/95`}>
      <CardContent className="p-4 flex flex-col h-[500px]">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message, i) => (
                <motion.div
                  key={i}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex items-start gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className={`${message.role === "assistant" ? "bg-primary/10" : "bg-muted"}`}>
                    {message.role === "assistant" ? (
                      <>
                        <AvatarImage src={bot?.settings.theme.avatarUrl} />
                        <AvatarFallback>{bot?.name[0]?.toUpperCase() || "A"}</AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback>U</AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] relative ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                    style={{
                      borderRadius: bot?.settings.theme.chatBubbleStyle === "modern" 
                        ? "1rem" 
                        : "0.5rem",
                    }}
                  >
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Digitando...</span>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="shadow-sm"
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading}
            size="icon"
            className="shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}