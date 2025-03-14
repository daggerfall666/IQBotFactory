import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Chatbot } from "@shared/schema";

interface WPCodeGeneratorProps {
  bot: Chatbot;
}

export function WPCodeGenerator({ bot }: WPCodeGeneratorProps) {
  const { toast } = useToast();

  const generateEmbedCode = () => {
    return `
<!-- Claude AI Chatbot -->
<script>
window.claudeBotConfig = {
  botId: "${bot.id}",
  position: "${bot.wordpressConfig.position}",
  theme: ${JSON.stringify(bot.settings.theme)},
  initialMessage: "${bot.settings.initialMessage}"
};
</script>
<script src="${window.location.origin}/chatbot.js"></script>
<link rel="stylesheet" href="${window.location.origin}/chatbot.css">
${bot.wordpressConfig.customCss ? `<style>${bot.wordpressConfig.customCss}</style>` : ""}
    `.trim();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode());
      toast({
        title: "Copied!",
        description: "Code copied to clipboard"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>WordPress Embed Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Textarea
            value={generateEmbedCode()}
            readOnly
            className="min-h-[200px] font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
