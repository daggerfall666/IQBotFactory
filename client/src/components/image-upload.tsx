import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ImageEditModal } from "./image-edit-modal";
import { Trash2 } from "lucide-react";
import { imageCache } from "@/lib/imageCache";

interface ImageUploadProps {
  onImageSelected: (file: File | null) => void;
  defaultPreview?: string | undefined;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export function ImageUpload({ onImageSelected, defaultPreview, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(defaultPreview || "");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione uma imagem (PNG, JPEG ou GIF)",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter menos de 5MB",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    try {
      setIsLoading(true);
      setSelectedFile(file);

      // Check cache first
      const cacheKey = imageCache.generateKey(file);
      const cachedPreview = imageCache.get(cacheKey);

      if (cachedPreview) {
        setPreview(cachedPreview);
        setIsEditModalOpen(true);
        setIsLoading(false);
        return;
      }

      // If not in cache, read file and cache it
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string') {
          imageCache.set(cacheKey, reader.result);
          setPreview(reader.result);
          setIsEditModalOpen(true);
        }
        setIsLoading(false);
      };
      reader.onerror = () => {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao ler o arquivo",
          variant: "destructive"
        });
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a imagem",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleEditComplete = (editedFile: File) => {
    setSelectedFile(editedFile);
    onImageSelected(editedFile);
    setIsEditModalOpen(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result && typeof reader.result === 'string') {
        setPreview(reader.result);
      }
    };
    reader.readAsDataURL(editedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDelete = () => {
    setPreview("");
    setSelectedFile(null);
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleInputChange}
        />

        <motion.div
          className="relative group cursor-pointer"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <AnimatePresence>
            {preview ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative rounded-full overflow-hidden aspect-square w-24 h-24 border"
              >
                <img
                  src={preview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
                <motion.div
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  initial={false}
                  animate={isDragging ? { opacity: 0.7 } : { opacity: 0 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                  >
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-dashed ${
                  isDragging ? 'border-primary' : 'border-muted-foreground/25'
                } transition-colors`}
              >
                <Upload className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground/25'}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {selectedFile && (
        <ImageEditModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          imageUrl={preview}
          onSave={handleEditComplete}
        />
      )}
    </>
  );
}