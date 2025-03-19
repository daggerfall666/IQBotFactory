import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChatbotSchema, CLAUDE_MODELS } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Chatbot } from "@shared/schema";
import { Settings2, MessageSquare, Brush, Code, Wand2, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ImageUpload } from "./image-upload";

interface BotConfigFormProps {
  bot: Chatbot;
  onSubmit: (data: Partial<Chatbot>) => void;
  isLoading?: boolean;
}

// Demo bot configuration
const demoBotConfig: Partial<Chatbot> = {
  name: "Claude Assistant",
  description: "Um assistente AI amigável e versátil para ajudar em várias tarefas",
  settings: {
    initialMessage: "Olá! Sou o Claude, seu assistente pessoal. Como posso ajudar você hoje?",
    model: "claude-3-sonnet-20240229",
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: `Você é o Claude, um assistente AI amigável e prestativo com personalidade otimista e empática. Seu objetivo é ajudar os usuários de forma clara e eficiente, mantendo um tom conversacional agradável.

Diretrizes:
- Seja claro e direto, mas mantenha um tom amigável
- Use analogias e exemplos quando útil
- Demonstre empatia e compreensão
- Divida explicações complexas em partes menores
- Peça esclarecimentos quando necessário
- Mantenha as respostas concisas mas informativas`,
    theme: {
      primaryColor: "#7C3AED",
      fontFamily: "Inter",
      borderRadius: 12,
      chatBubbleStyle: "modern",
      darkMode: false,
      avatarUrl: "https://ui-avatars.com/api/?name=Claude&background=7C3AED&color=fff",
      avatarBackgroundColor: "#7C3AED",
      botName: "Claude",
      customMessageStyles: {
        userBackground: "#7C3AED",
        botBackground: "#F4F4F5",
        userText: "#FFFFFF",
        botText: "#18181B"
      }
    }
  },
  wordpressConfig: {
    position: "bottom-right",
    customCss: "",
    hideOnMobile: false,
    customPosition: {}
  }
};

export function BotConfigForm({ bot, onSubmit, isLoading }: BotConfigFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [showMissionInput, setShowMissionInput] = useState(false);
  const [mission, setMission] = useState("");
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertChatbotSchema),
    defaultValues: bot
  });

  const handleLoadDemoConfig = () => {
    Object.entries(demoBotConfig).forEach(([key, value]) => {
      form.setValue(key as any, value as any);
    });
    toast({
      title: "Configuração demo carregada",
      description: "As configurações do bot demo foram aplicadas"
    });
  };

  async function handleGeneratePrompt() {
    if (!mission.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva a missão do chatbot",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/generate-prompt", { mission });
      const data = await response.json();

      if (data.prompt) {
        form.setValue("settings.systemPrompt", data.prompt);
        toast({
          title: "Prompt gerado",
          description: "O prompt foi gerado com sucesso"
        });
        setShowMissionInput(false);
        setMission("");
      }
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast({
        title: "Erro ao gerar prompt",
        description: "Não foi possível gerar o prompt",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleImprovePrompt() {
    const currentPrompt = form.getValues("settings.systemPrompt");
    if (!currentPrompt?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "É necessário ter um prompt para melhorar",
        variant: "destructive"
      });
      return;
    }

    setIsImproving(true);
    try {
      const response = await apiRequest("POST", "/api/improve-prompt", { currentPrompt });
      const data = await response.json();

      if (data.prompt) {
        form.setValue("settings.systemPrompt", data.prompt);
        toast({
          title: "Prompt melhorado",
          description: "O prompt foi aprimorado com sucesso"
        });
      }
    } catch (error) {
      console.error("Error improving prompt:", error);
      toast({
        title: "Erro ao melhorar prompt",
        description: "Não foi possível melhorar o prompt",
        variant: "destructive"
      });
    } finally {
      setIsImproving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadDemoConfig}
            className="mb-4"
          >
            Carregar Configuração Demo
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Brush className="w-4 h-4" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Embed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configurações básicas do seu chatbot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Bot</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormDescription>
                        Uma breve descrição do propósito do seu chatbot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <FormLabel>Usar Chave API Personalizada</FormLabel>
                          <FormDescription>
                            Use sua própria chave API ou a chave padrão do sistema
                          </FormDescription>
                        </div>
                        <Switch
                          checked={field.value !== null}
                          onCheckedChange={(checked) => {
                            field.onChange(checked ? "" : null);
                          }}
                        />
                      </div>
                      {field.value !== null && (
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            placeholder="sk-ant-..."
                            className="font-mono"
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Chat</CardTitle>
                <CardDescription>
                  Configure o comportamento e as respostas do seu chatbot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="settings.model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo Claude AI</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um modelo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CLAUDE_MODELS.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              <div>
                                <div className="font-medium">{model.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {model.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.systemPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt do Sistema</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            className="min-h-[100px] pr-20"
                            placeholder="Você é um assistente útil que..."
                          />
                          <div className="absolute right-2 top-2 flex gap-1">
                            <Dialog open={showMissionInput} onOpenChange={setShowMissionInput}>
                              <DialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  type="button"
                                  title="Gerar novo prompt"
                                >
                                  <Wand2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Gerar Prompt</DialogTitle>
                                  <DialogDescription>
                                    Descreva a missão do seu chatbot e deixe a IA criar um prompt otimizado.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <Textarea
                                    placeholder="Ex: Um assistente de vendas especializado em produtos de tecnologia..."
                                    value={mission}
                                    onChange={(e) => setMission(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                  <Button
                                    onClick={handleGeneratePrompt}
                                    disabled={isGenerating || !mission.trim()}
                                    className="w-full"
                                  >
                                    {isGenerating ? (
                                      <>
                                        <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                                        Gerando prompt...
                                      </>
                                    ) : (
                                      <>
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Gerar Prompt
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="icon"
                              variant="ghost"
                              type="button"
                              onClick={handleImprovePrompt}
                              disabled={isImproving || !field.value?.trim()}
                              title="Melhorar prompt atual"
                            >
                              {isImproving ? (
                                <Sparkles className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Define a personalidade e comportamento base do chatbot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.initialMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem Inicial</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Primeira mensagem que o chatbot enviará ao usuário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperatura ({field.value})</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={1}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Controla a criatividade das respostas (0 = focado, 1 = criativo)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Personalize o visual do seu chatbot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="settings.theme.avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar do Bot</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-4">
                            <ImageUpload
                              onImageSelected={(file) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  field.onChange(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }}
                              defaultPreview={field.value}
                            />
                            {field.value && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => field.onChange("")}
                                title="Remover avatar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Faça upload de uma imagem para o avatar do seu chatbot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.theme.avatarBackgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor de Fundo do Avatar</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} type="color" className="w-24" />
                          <Input {...field} placeholder="#000000" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.theme.botName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Exibido</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Assistente" />
                      </FormControl>
                      <FormDescription>
                        Nome que será exibido nas mensagens do bot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.theme.primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor Principal</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} type="color" className="w-24" />
                          <Input {...field} placeholder="#000000" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.theme.fontFamily"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonte</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma fonte" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="system-ui">Sistema</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.theme.chatBubbleStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estilo das Mensagens</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um estilo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="modern">Moderno</SelectItem>
                          <SelectItem value="classic">Clássico</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.theme.customMessageStyles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cores Personalizadas das Mensagens</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Fundo (Usuário)</label>
                            <Input
                              type="color"
                              value={field.value?.userBackground || "#000000"}
                              onChange={(e) =>
                                field.onChange({
                                  ...field.value,
                                  userBackground: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Fundo (Bot)</label>
                            <Input
                              type="color"
                              value={field.value?.botBackground || "#000000"}
                              onChange={(e) =>
                                field.onChange({
                                  ...field.value,
                                  botBackground: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Texto (Usuário)</label>
                            <Input
                              type="color"
                              value={field.value?.userText || "#000000"}
                              onChange={(e) =>
                                field.onChange({
                                  ...field.value,
                                  userText: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Texto (Bot)</label>
                            <Input
                              type="color"
                              value={field.value?.botText || "#000000"}
                              onChange={(e) =>
                                field.onChange({
                                  ...field.value,
                                  botText: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Personalize as cores de fundo e texto das mensagens
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.theme.darkMode"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Modo Escuro</FormLabel>
                        <FormDescription>
                          Ativar tema escuro para o chatbot
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embed" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Embed</CardTitle>
                <CardDescription>
                  Configure como o chatbot será exibido no seu site WordPress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="wordpressConfig.position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posição do Widget</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a posição" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                          <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wordpressConfig.hideOnMobile"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Ocultar em Dispositivos Móveis</FormLabel>
                        <FormDescription>
                          O chatbot não será exibido em telas pequenas
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wordpressConfig.customCss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSS Personalizado</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="font-mono text-sm"
                          placeholder=".chat-widget { /* seus estilos */ }"
                        />
                      </FormControl>
                      <FormDescription>
                        CSS adicional para personalizar o widget
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
}