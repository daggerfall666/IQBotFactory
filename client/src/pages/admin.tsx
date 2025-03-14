import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Key, Activity, FileText, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

interface SystemKeyResponse {
  key: string | null;
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [systemApiKey, setSystemApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  // Busca a chave API do sistema quando a página carrega
  const { data: savedKey, isLoading: isLoadingKey } = useQuery<SystemKeyResponse>({
    queryKey: ["/api/admin/system-key"],
    staleTime: 1000 * 60, // 1 minuto
    retry: 3
  });

  // Atualiza o input quando a chave é carregada
  useEffect(() => {
    if (savedKey?.key) {
      setSystemApiKey(savedKey.key);
    }
  }, [savedKey]);

  async function handleSaveApiKey() {
    if (!systemApiKey.trim()) {
      toast({
        title: t('admin.errors.general.error'),
        description: t('admin.validation.api_key_required'),
        variant: "destructive"
      });
      return;
    }

    if (!systemApiKey.startsWith('sk-ant-')) {
      toast({
        title: t('admin.errors.api_key.invalid_format'),
        description: t('admin.validation.api_key_format'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/system-key", { key: systemApiKey });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || t('admin.errors.general.unknown'));
      }

      toast({
        title: "Sucesso",
        description: t('admin.success.api_key_updated')
      });

      // Atualiza a chave no cache
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-key"] });

    } catch (error: any) {
      toast({
        title: t('admin.errors.general.error'),
        description: error.message || t('admin.errors.api_key.save_failed'),
        variant: "destructive"
      });
      setSystemApiKey(""); // Limpa apenas em caso de erro
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('admin.buttons.back')}
        </Button>
        <h1 className="text-4xl font-bold">{t('admin.title')}</h1>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            {t('admin.tabs.api')}
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('admin.tabs.logs')}
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {t('admin.tabs.stats')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.api.title')}</CardTitle>
              <CardDescription>
                {t('admin.api.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">{t('admin.api.apikey.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('admin.api.apikey.description')}
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
                    {isLoading ? t('admin.buttons.saving') : t('admin.buttons.save')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.logs.title')}</CardTitle>
              <CardDescription>
                {t('admin.logs.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-auto font-mono text-sm whitespace-pre bg-muted p-4 rounded-lg">
                {t('admin.logs.placeholder')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.stats.title')}</CardTitle>
              <CardDescription>
                {t('admin.stats.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('admin.stats.total_bots')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('admin.stats.messages_today')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('admin.stats.active_users')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}