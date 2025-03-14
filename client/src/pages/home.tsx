import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Settings2, Database, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Chatbot } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const deleteBot = useMutation({
    mutationFn: async (botId: number) => {
      await apiRequest("DELETE", `/api/chatbots/${botId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] });
      toast({
        title: "Sucesso",
        description: "Chatbot excluído"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o chatbot",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Seus Chatbots
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerencie e configure seus assistentes virtuais
              </p>
            </div>
            <Button 
              onClick={() => createBot.mutate()} 
              disabled={createBot.isPending}
              size="lg"
              className="shadow-lg hover:shadow-primary/20 transition-all"
            >
              <Plus className="mr-2 h-5 w-5" />
              Criar Novo Bot
            </Button>
          </div>

          {chatbots?.length === 0 ? (
            <Card className="p-12 border-dashed">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Nenhum chatbot criado</h2>
                <p className="text-muted-foreground mb-4">
                  Comece criando seu primeiro chatbot para interagir com seus visitantes
                </p>
                <Button onClick={() => createBot.mutate()} disabled={createBot.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Bot
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chatbots?.map((bot) => (
                <Card key={bot.id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{bot.name}</CardTitle>
                        <CardDescription>{bot.description || "Sem descrição"}</CardDescription>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Chatbot</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este chatbot? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBot.mutate(bot.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings2 className="h-4 w-4" />
                          Modelo: {bot.settings.model.split("-").pop()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          {bot.apiKey ? "Chave API personalizada" : "Chave API padrão"}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/bot/${bot.id}`} className="flex-1">
                          <Button variant="secondary" className="w-full">
                            Configurar
                          </Button>
                        </Link>
                        <Link href={`/bot/${bot.id}/knowledge`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            Base de Conhecimento
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}