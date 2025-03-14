import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Chatbot } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();

  const { data: chatbots, isLoading } = useQuery<Chatbot[]>({
    queryKey: ["/api/chatbots"]
  });

  const createBot = useMutation({
    mutationFn: async () => {
      const defaultBot: Omit<Chatbot, "id"> = {
        name: "Novo Chatbot",
        description: "",
        settings: {
          initialMessage: "Olá! Como posso ajudar?",
          systemPrompt: "Você é um assistente prestativo e amigável.",
          model: "claude-3-haiku-20240307",
          temperature: 0.7,
          maxTokens: 1000,
          theme: {
            primaryColor: "#007AFF",
            fontFamily: "Inter",
            borderRadius: 8,
            chatBubbleStyle: "modern",
            darkMode: false
          }
        },
        wordpressConfig: {
          position: "bottom-right",
          customCss: "",
          hideOnMobile: false,
          customPosition: {}
        },
        apiKey: null
      };

      return apiRequest("POST", "/api/chatbots", defaultBot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] });
      toast({
        title: "Sucesso",
        description: "Novo chatbot criado"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o chatbot",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Seus Chatbots</h1>
        <Button onClick={() => createBot.mutate()} disabled={createBot.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Bot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chatbots?.map((bot) => (
          <Card key={bot.id}>
            <CardHeader>
              <CardTitle>{bot.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{bot.description || "Sem descrição"}</p>
              <div className="flex gap-2">
                <Link href={`/bot/${bot.id}`}>
                  <Button variant="secondary">Configurar</Button>
                </Link>
                <Link href={`/bot/${bot.id}/knowledge`}>
                  <Button variant="outline">Base de Conhecimento</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}