import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface PromptGeneratorProps {
  onPromptGenerated: (prompt: string) => void;
  currentPrompt?: string;
}

export function PromptGenerator({ onPromptGenerated, currentPrompt }: PromptGeneratorProps) {
  const [mission, setMission] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  async function handleGeneratePrompt() {
    if (!mission.trim()) {
      toast({
        title: t('errors.validation.required'),
        description: t('errors.validation.mission_required'),
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/generate-prompt", { mission });
      const data = await response.json();

      if (data.prompt) {
        onPromptGenerated(data.prompt);
        toast({
          title: t('success.prompt_generated'),
          description: t('success.prompt_ready')
        });
      }
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast({
        title: t('errors.prompt_generation.title'),
        description: t('errors.prompt_generation.description'),
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleImprovePrompt() {
    if (!currentPrompt?.trim()) {
      toast({
        title: t('errors.validation.required'),
        description: t('errors.validation.current_prompt_required'),
        variant: "destructive"
      });
      return;
    }

    setIsImproving(true);
    try {
      const response = await apiRequest("POST", "/api/improve-prompt", { currentPrompt });
      const data = await response.json();

      if (data.prompt) {
        onPromptGenerated(data.prompt);
        toast({
          title: t('success.prompt_improved'),
          description: t('success.prompt_ready')
        });
      }
    } catch (error) {
      console.error("Error improving prompt:", error);
      toast({
        title: t('errors.prompt_improvement.title'),
        description: t('errors.prompt_improvement.description'),
        variant: "destructive"
      });
    } finally {
      setIsImproving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder={t('placeholders.enter_bot_mission')}
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          {t('help.mission_description')}
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={handleGeneratePrompt}
          disabled={isGenerating || !mission.trim()}
          className="flex-1"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          {isGenerating ? t('buttons.generating') : t('buttons.generate_prompt')}
        </Button>
        {currentPrompt && (
          <Button 
            onClick={handleImprovePrompt}
            disabled={isImproving || !currentPrompt.trim()}
            variant="secondary"
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isImproving ? t('buttons.improving') : t('buttons.improve_prompt')}
          </Button>
        )}
      </div>
    </div>
  );
}