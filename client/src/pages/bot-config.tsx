import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BotConfigForm } from "@/components/bot-config-form";
import { ChatbotPreview } from "@/components/chatbot-preview";
import { WPCodeGenerator } from "@/components/wp-code-generator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Chatbot } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function BotConfig() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: bot, isLoading } = useQuery<Chatbot>({
    queryKey: [`/api/chatbots/${id}`],
  });

  const updateBot = useMutation({
    mutationFn: async (data: Partial<Chatbot>) => {
      await apiRequest("PATCH", `/api/chatbots/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${id}`] });
      toast({
        title: "Success",
        description: "Bot configuration updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bot configuration",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !bot) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chatbots
        </Button>
        <h1 className="text-4xl font-bold">{bot.name}</h1>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="embed">Embed Code</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Bot Settings</h2>
              <BotConfigForm
                bot={bot}
                onSubmit={(data) => updateBot.mutate(data)}
                isLoading={updateBot.isPending}
              />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">Real-time Preview</h2>
              <ChatbotPreview bot={bot} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <div className="flex justify-center">
            <div className="w-full max-w 2xl">
              <ChatbotPreview bot={bot} fullscreen />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="embed">
          <WPCodeGenerator bot={bot} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
