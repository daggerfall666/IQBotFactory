import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Wand2, Save, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function PromptLab() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewResponse, setPreviewResponse] = useState("");
  const [mission, setMission] = useState("");

  const handleGeneratePrompt = async () => {
    if (!mission.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva o objetivo do chatbot",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/generate-prompt", { mission });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar prompt");
      }

      setCurrentPrompt(data.prompt);
      toast({
        title: "Sucesso",
        description: "Novo prompt gerado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o prompt",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprovePrompt = async () => {
    if (!currentPrompt.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um prompt para melhorar",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/improve-prompt", { currentPrompt });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao melhorar prompt");
      }

      setCurrentPrompt(data.prompt);
      toast({
        title: "Sucesso",
        description: "Prompt melhorado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível melhorar o prompt",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPrompt = async () => {
    if (!currentPrompt.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um prompt para testar",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/test-prompt", { prompt: currentPrompt });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao testar prompt");
      }

      setPreviewResponse(data.response);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível testar o prompt",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-4xl font-bold">Laboratório de Prompts</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerador de Prompts</CardTitle>
              <CardDescription>
                Descreva o objetivo do seu chatbot e deixe a IA criar um prompt otimizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ex: Um assistente especializado em suporte técnico para produtos de informática..."
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleGeneratePrompt} 
                disabled={isGenerating || !mission.trim()}
                className="w-full"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {isGenerating ? "Gerando..." : "Gerar Prompt"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Editor de Prompts</CardTitle>
              <CardDescription>
                Edite e refine seu prompt manualmente ou use a IA para melhorá-lo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Cole ou escreva seu prompt aqui..."
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                className="min-h-[200px] font-mono"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleImprovePrompt}
                  disabled={isGenerating || !currentPrompt.trim()}
                  className="flex-1"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Melhorar
                </Button>
                <Button
                  onClick={handlePreviewPrompt}
                  disabled={isGenerating || !currentPrompt.trim()}
                  className="flex-1"
                >
                  Testar Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:h-full">
          <CardHeader>
            <CardTitle>Visualização do Prompt</CardTitle>
            <CardDescription>
              Veja como seu chatbot responde com o prompt atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg min-h-[400px] font-mono text-sm whitespace-pre-wrap">
              {previewResponse || "A resposta do chatbot aparecerá aqui..."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}