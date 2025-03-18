import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  defaultPreview?: string;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageUpload({ onImageSelected, defaultPreview, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(defaultPreview || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Determine size for square crop
        const size = Math.min(img.width, img.height);

        // Set canvas to final dimensions (we'll use 400x400 for high quality avatars)
        const finalSize = 400;
        canvas.width = finalSize;
        canvas.height = finalSize;

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Make canvas transparent initially
        ctx.clearRect(0, 0, finalSize, finalSize);

        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(finalSize / 2, finalSize / 2, finalSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Calculate source and destination coordinates for centered crop
        const sourceX = (img.width - size) / 2;
        const sourceY = (img.height - size) / 2;

        // Draw image with proper centering
        ctx.drawImage(
          img,
          sourceX, sourceY, size, size, // Source rectangle
          0, 0, finalSize, finalSize    // Destination rectangle
        );

        // Determine output format based on input
        const isPNG = file.type === 'image/png';
        const outputFormat = isPNG ? 'image/png' : 'image/jpeg';
        const quality = isPNG ? undefined : 0.9;

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, isPNG ? '.png' : '.jpg'), {
              type: outputFormat,
              lastModified: Date.now(),
            }));
          } else {
            reject(new Error('Failed to create image blob'));
          }
        }, outputFormat, quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Erro",
        description: "A imagem deve ter menos de 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      const optimizedFile = await optimizeImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(optimizedFile);
      onImageSelected(optimizedFile);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Falha ao processar a imagem",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {preview ? (
        <div className="relative rounded-full overflow-hidden aspect-square w-24 h-24 border">
          <img
            src={preview}
            alt="Avatar preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-24 h-24 rounded-full flex flex-col items-center justify-center gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Upload</span>
        </Button>
      )}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}