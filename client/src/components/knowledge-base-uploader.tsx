import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, File, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { KnowledgeBase } from "@shared/schema";

interface KnowledgeBaseUploaderProps {
  botId: number;
  onUploadComplete: (kb: KnowledgeBase) => void;
}

export function KnowledgeBaseUploader({ botId, onUploadComplete }: KnowledgeBaseUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleUpload(file: File) {
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("botId", botId.toString());

    try {
      const response = await fetch("/api/knowledge-base", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const kb = await response.json();
      onUploadComplete(kb);
      toast({
        title: "Success",
        description: "File uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-6 text-center">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        accept=".txt,.pdf,.doc,.docx"
      />

      <div className="flex flex-col items-center gap-6 p-8 bg-gradient-to-b from-background to-muted/20 rounded-xl border-2 border-dashed border-muted transition-all hover:border-primary/50">
        <Upload className="h-16 w-16 text-primary/60" />
        <div className="text-center">
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Upload Knowledge Base</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Drag and drop your documents here or click to browse files
          </p>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          variant="outline"
        >
          Select File
        </Button>

        {isUploading && (
          <div className="w-full">
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        )}
      </div>
    </div>
  );
}
