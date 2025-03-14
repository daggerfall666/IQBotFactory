import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Settings2, Database, Trash2, Wand2, Bot, MessageSquare } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Layout } from "@/components/layout";

export default function Home() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBotName, setNewBotName] = useState("");

  const { data: chatbots = [], isLoading, error } = useQuery<Chatbot[]>({
    queryKey: ["/api/chatbots"],
    staleTime: 1000 * 30,
  });

  const createBot = useMutation({
    mutationFn: async (name: string) => {
      const defaultBot: Omit<Chatbot, "id"> = {
        name,
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

      const response = await apiRequest("POST", "/api/chatbots", defaultBot);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] });
      setIsCreateDialogOpen(false);
      setNewBotName("");
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

  if (error) {
    return (
      <Layout showSidebar={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-destructive">Erro ao carregar chatbots</p>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] })}
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout showSidebar={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Bot className="h-16 w-16 animate-bounce text-primary/60 mb-4" />
            <p className="text-muted-foreground">Carregando chatbots...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={chatbots.length > 0}>
      <div className="container py-8 space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Gerencie e monitore seus chatbots
          </p>
        </div>

        {/* Content Section */}
        {chatbots.length === 0 ? (
          <Card className="p-12 border-dashed">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Comece sua jornada</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crie seu primeiro chatbot e comece a interagir com seus usuários de forma inteligente.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  size="lg"
                  className="shadow-lg hover:shadow-primary/20 transition-all"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Criar Primeiro Bot
                </Button>
                <Link href="/docs">
                  <Button
                    variant="outline"
                    size="lg"
                    className="shadow hover:shadow-md transition-all"
                  >
                    Ler Documentação
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((bot) => (
              <Card
                key={bot.id}
                className="group hover:shadow-lg transition-all border-muted bg-gradient-to-b from-background to-muted/20"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {bot.name}
                      </CardTitle>
                      <CardDescription>
                        {bot.description || "Sem descrição"}
                      </CardDescription>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        >
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
                  <div className="space-y-6">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Modelo: {bot.settings.model.split("-").pop()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {bot.apiKey === null ? "Chave API padrão" : "Chave API personalizada"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/bot/${bot.id}`} className="col-span-2">
                        <Button variant="default" className="w-full shadow hover:shadow-md transition-all">
                          <Settings2 className="mr-2 h-4 w-4" />
                          Configurar
                        </Button>
                      </Link>
                      <Link href={`/bot/${bot.id}/knowledge`}>
                        <Button variant="outline" className="w-full shadow hover:shadow-md transition-all">
                          Base de Conhecimento
                        </Button>
                      </Link>
                      <Link href={`/bot/${bot.id}/dashboard`}>
                        <Button variant="outline" className="w-full shadow hover:shadow-md transition-all">
                          Dashboard
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

      {/* Create Bot Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Chatbot</DialogTitle>
            <DialogDescription>
              Digite um nome para seu novo chatbot. Você poderá personalizar outras configurações depois.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do chatbot"
              value={newBotName}
              onChange={(e) => setNewBotName(e.target.value)}
              className="h-12"
              onKeyPress={(e) => e.key === "Enter" && newBotName.trim() && createBot.mutate(newBotName)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => newBotName.trim() && createBot.mutate(newBotName)}
              disabled={!newBotName.trim() || createBot.isPending}
              className="shadow hover:shadow-md transition-all"
            >
              {createBot.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}