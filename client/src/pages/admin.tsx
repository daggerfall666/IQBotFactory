import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Key, Activity, FileText } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [systemApiKey, setSystemApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSaveApiKey() {
    if (!systemApiKey.trim()) return;

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/admin/system-key", { key: systemApiKey });
      toast({
        title: "Sucesso",
        description: "Chave API do sistema atualizada com sucesso"
      });
      setSystemApiKey(""); // Limpa o input após sucesso
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.details || "Não foi possível salvar a chave API",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

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
            API
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
              <CardTitle>Configurações da API</CardTitle>
              <CardDescription>
                Gerencie as chaves API do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Chave API do Sistema</h3>
                <p className="text-sm text-muted-foreground">
                  Esta é a chave API padrão usada quando um bot não tem sua própria chave configurada.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={systemApiKey}
                    onChange={(e) => setSystemApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="font-mono"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSaveApiKey} 
                    disabled={!systemApiKey.trim() || isLoading}
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
                Visualize os logs de atividade do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-auto font-mono text-sm whitespace-pre bg-muted p-4 rounded-lg">
                [Em desenvolvimento] Aqui serão exibidos os logs do sistema
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
              <CardDescription>
                Métricas e estatísticas de uso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total de Bots</CardTitle>
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
      </Tabs>
    </div>
  );
}