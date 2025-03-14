import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Key, Activity, FileText, Eye, EyeOff, Shield, RefreshCw, Info, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { RateLimitConfig, DEFAULT_RATE_LIMITS } from "@shared/schema";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface SystemKeyResponse {
  key: string | null;
}

interface RateLimitResponse {
  config: RateLimitConfig;
}

interface LogEntry {
  timestamp: number;
  level: 'error' | 'info' | 'warn';
  message: string;
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [systemApiKey, setSystemApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimits, setRateLimits] = useState<RateLimitConfig>(DEFAULT_RATE_LIMITS);
  const [isUpdatingLimits, setIsUpdatingLimits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: savedKey, isLoading: isLoadingKey } = useQuery<SystemKeyResponse>({
    queryKey: ["/api/admin/system-key"],
    staleTime: 1000 * 60,
    retry: 3
  });

  useEffect(() => {
    if (savedKey?.key) {
      setSystemApiKey(savedKey.key);
    }
  }, [savedKey]);

  async function handleSaveApiKey() {
    if (!systemApiKey.trim()) {
      toast({
        title: 'Erro',
        description: 'A chave API é obrigatória',
        variant: "destructive"
      });
      return;
    }

    if (!systemApiKey.startsWith('sk-ant-')) {
      toast({
        title: 'Erro',
        description: 'Formato inválido da chave API. Certifique-se de que começa com "sk-ant-"',
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/system-key", { key: systemApiKey });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Erro desconhecido");
      }

      toast({
        title: "Sucesso",
        description: "Chave API atualizada com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-key"] });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a chave API",
        variant: "destructive"
      });
      setSystemApiKey("");
    } finally {
      setIsLoading(false);
    }
  }

  const { data: savedLimits, isLoading: isLoadingLimits } = useQuery<RateLimitResponse>({
    queryKey: ["/api/admin/rate-limits"],
    staleTime: 1000 * 60,
    retry: 3
  });

  useEffect(() => {
    if (savedLimits?.config) {
      setRateLimits(savedLimits.config);
    }
  }, [savedLimits]);

  async function handleSaveRateLimits() {
    setIsUpdatingLimits(true);
    try {
      const response = await apiRequest("POST", "/api/admin/rate-limits", rateLimits);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Erro desconhecido");
      }

      toast({
        title: "Sucesso",
        description: "Limites de requisição atualizados com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/rate-limits"] });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar os limites",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingLimits(false);
    }
  }

  const RateLimitSection = ({ 
    title, 
    description, 
    limits, 
    path, 
    minMax = 10,
    maxMax = 500,
    step = 10,
    warningThreshold = 0.8  // 80% of max value
  }: { 
    title: string, 
    description: string, 
    limits: { max: number, windowMs: number },
    path: 'api' | 'chat' | 'admin' | 'upload',
    minMax?: number,
    maxMax?: number,
    step?: number,
    warningThreshold?: number
  }) => {
    const effectiveRate = (limits.max / (limits.windowMs / 1000)) * 60;
    const isHighRate = limits.max >= maxMax * warningThreshold;
    const isLowWindow = limits.windowMs <= 60000; // 60 seconds

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{title}</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {(isHighRate || isLowWindow) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {isHighRate && "Taxa de requisições alta pode sobrecarregar o sistema."}
                    {isLowWindow && "Intervalo curto pode causar sobrecarga."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Máximo de requisições</span>
              <span className="text-sm font-mono">{limits.max}</span>
            </div>
            <div className="space-y-2">
              <Slider
                value={[limits.max]}
                onValueChange={([value]) => setRateLimits(prev => ({
                  ...prev,
                  [path]: { ...prev[path], max: value }
                }))}
                min={minMax}
                max={maxMax}
                step={step}
                disabled={isUpdatingLimits || isLoadingLimits}
              />
              <Progress 
                value={(limits.max / maxMax) * 100} 
                className={`h-1 ${isHighRate ? 'bg-warning' : ''}`}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Intervalo de tempo</span>
              <span className="text-sm font-mono">{limits.windowMs / 1000}s</span>
            </div>
            <div className="space-y-2">
              <Slider
                value={[limits.windowMs / 1000]}
                onValueChange={([value]) => setRateLimits(prev => ({
                  ...prev,
                  [path]: { ...prev[path], windowMs: value * 1000 }
                }))}
                min={30}
                max={300}
                step={30}
                disabled={isUpdatingLimits || isLoadingLimits}
              />
              <Progress 
                value={(limits.windowMs / (300 * 1000)) * 100} 
                className={`h-1 ${isLowWindow ? 'bg-warning' : ''}`}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Taxa efetiva:
              </p>
              <p className={`text-xs font-mono ${effectiveRate > 100 ? 'text-warning' : ''}`}>
                {effectiveRate.toFixed(1)} req/min
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const { 
    data: logs = [], 
    isLoading: isLoadingLogs,
    error: logsError
  } = useQuery<LogEntry[]>({
    queryKey: ["/api/admin/logs"],
    refetchInterval: 30000, 
    staleTime: 10000,
    retry: 3
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-4xl font-bold">Configurações do Sistema</h1>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Chave API
          </TabsTrigger>
          <TabsTrigger value="rate-limits" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Limites de Requisição
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>Chave API do Sistema</CardTitle>
              <CardDescription>
                Configure a chave API padrão do sistema para o Claude AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Chave API do Anthropic</h3>
                <p className="text-sm text-muted-foreground">
                  Esta chave será usada como padrão para todos os chatbots que não possuem uma chave personalizada
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={systemApiKey}
                      onChange={(e) => setSystemApiKey(e.target.value)}
                      placeholder={isLoadingKey ? "Carregando..." : "sk-ant-..."}
                      className="font-mono pr-10"
                      disabled={isLoading || isLoadingKey}
                    />
                    {systemApiKey && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={handleSaveApiKey}
                    disabled={!systemApiKey.trim() || isLoading || isLoadingKey}
                  >
                    {isLoading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Visualize os logs mais recentes do sistema em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Últimos logs (atualizado a cada 30 segundos)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
              <div className="h-[400px] overflow-auto font-mono text-sm whitespace-pre bg-muted p-4 rounded-lg">
                {isLoadingLogs ? (
                  <p className="text-muted-foreground">Carregando logs...</p>
                ) : logsError ? (
                  <p className="text-destructive">
                    Erro ao carregar logs: {logsError instanceof Error ? logsError.message : 'Erro desconhecido'}
                  </p>
                ) : !logs || logs.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum log encontrado</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className={`ml-2 ${log.level === 'error' ? 'text-destructive' : ''}`}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas do Sistema</CardTitle>
                <CardDescription>
                  Métricas e informações sobre o uso da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Total de Chatbots</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">0</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mensagens Hoje</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">0</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Usuários Ativos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">0</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="rate-limits">
          <Card>
            <CardHeader>
              <CardTitle>Limites de Requisição</CardTitle>
              <CardDescription>
                Configure os limites de requisição para diferentes tipos de operações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <RateLimitSection 
                title="API Geral"
                description="Limites globais aplicados a todas as requisições da API"
                limits={rateLimits.api}
                path="api"
                maxMax={500}
              />

              <RateLimitSection 
                title="Chat"
                description="Limites específicos para as interações de chat com o Claude AI"
                limits={rateLimits.chat}
                path="chat"
                minMax={5}
                maxMax={100}
                step={5}
              />

              <RateLimitSection 
                title="Administração"
                description="Limites para operações administrativas e configurações do sistema"
                limits={rateLimits.admin}
                path="admin"
                minMax={5}
                maxMax={50}
                step={5}
              />

              <RateLimitSection 
                title="Upload"
                description="Limites para o upload de arquivos e documentos"
                limits={rateLimits.upload}
                path="upload"
                minMax={1}
                maxMax={20}
                step={1}
              />

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveRateLimits}
                  disabled={isUpdatingLimits || isLoadingLimits}
                  className="min-w-[200px]"
                >
                  {isUpdatingLimits ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Configurações"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}