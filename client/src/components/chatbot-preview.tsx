import { useState } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, X } from "lucide-react";
import type { Chatbot } from "@shared/schema";

interface ChatbotPreviewProps {
  bot: Chatbot;
  fullscreen?: boolean;
}

export function ChatbotPreview({ bot, fullscreen = false }: ChatbotPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    custom: "", // Custom position handled by WordPress embedding
  };

  if (fullscreen) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <ChatInterface botId={bot.id} className="w-full" />
      </div>
    );
  }

  return (
    <>
      {isOpen ? (
        <Card
          className={`fixed ${
            positionClasses[bot.wordpressConfig.position]
          } w-[400px] h-[600px] shadow-lg z-50`}
          style={{
            "--primary": bot.settings.theme.primaryColor,
            "--radius": `${bot.settings.theme.borderRadius}px`,
            fontFamily: bot.settings.theme.fontFamily,
          } as React.CSSProperties}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Chat with Us</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ChatInterface botId={bot.id} className="border-none shadow-none" />
        </Card>
      ) : (
        <Button
          className={`fixed ${positionClasses[bot.wordpressConfig.position]}`}
          onClick={() => setIsOpen(true)}
          size="lg"
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          Chat with Us
        </Button>
      )}
    </>
  );
}
