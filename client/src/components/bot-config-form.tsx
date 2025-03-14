import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChatbotSchema, CLAUDE_MODELS } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Chatbot } from "@shared/schema";
import { Settings2, MessageSquare, Brush, Code } from "lucide-react";

interface BotConfigFormProps {
  bot: Chatbot;
  onSubmit: (data: Partial<Chatbot>) => void;
  isLoading?: boolean;
}

export function BotConfigForm({ bot, onSubmit, isLoading }: BotConfigFormProps) {
  const form = useForm({
    resolver: zodResolver(insertChatbotSchema),
    defaultValues: bot
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormLabel>Chave API da Anthropic (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="sk-ant-..." />
                      </FormControl>
                      <FormDescription>
                        Use sua própria chave API ou deixe em branco para usar a chave padrão
                      </FormDescription>
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
                        <Textarea 
                          {...field} 
                          className="min-h-[100px]"
                          placeholder="Você é um assistente útil que..."
                        />
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