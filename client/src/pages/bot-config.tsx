import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BotConfigForm } from "@/components/bot-config-form";
import { ChatbotPreview } from "@/components/chatbot-preview";
import { WPCodeGenerator } from "@/components/wp-code-generator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Chatbot } from "@shared/schema";
import { ArrowLeft, Activity } from "lucide-react";

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
        title: "Sucesso",
        description: "Configurações do bot atualizadas",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar as configurações",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !bot) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-4xl font-bold">{bot.name}</h1>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="config">Configurações</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
          </TabsList>
          <Link href={`/bot/${id}/dashboard`}>
            <Button variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Configurações do Bot</h2>
              <BotConfigForm
                bot={bot}
                onSubmit={(data) => updateBot.mutate(data)}
                isLoading={updateBot.isPending}
              />
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Preview em Tempo Real</h2>
              <ChatbotPreview bot={bot} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
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