import { useState, useRef, useEffect } from "react";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface ImageEditModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImage: File) => void;
}

export function ImageEditModal({ open, onClose, imageUrl, onSave }: ImageEditModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [scale, setScale] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && imgRef.current) {
      console.log("Modal opened, updating preview");
      updatePreview();
    }
  }, [open, crop, scale]);

  const updatePreview = () => {
    console.log("Updating preview", { crop, scale });
    if (!imgRef.current || !previewCanvasRef.current || !crop.width || !crop.height) {
      console.log("Missing required refs for preview update");
      return;
    }

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    // Set preview canvas size
    const previewSize = 100;
    canvas.width = previewSize;
    canvas.height = previewSize;

    // Clear and create circular mask
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Calculate source dimensions based on crop percentages
    const sourceWidth = (crop.width * scaleX * imgRef.current.width) / 100;
    const sourceHeight = (crop.height * scaleY * imgRef.current.height) / 100;
    const sourceX = (crop.x * scaleX * imgRef.current.width) / 100;
    const sourceY = (crop.y * scaleY * imgRef.current.height) / 100;

    // Draw the preview
    ctx.drawImage(
      imgRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      previewSize,
      previewSize
    );

    ctx.restore();

    // Update preview URL
    const newPreviewUrl = canvas.toDataURL();
    console.log("Generated new preview URL");
    setPreviewUrl(newPreviewUrl);
  };

  const handleEditComplete = async () => {
    try {
      if (!imgRef.current) return;
      console.log("Processing final image");

      const croppedImage = await getCroppedImg(imgRef.current, crop, scale);
      await onSave(croppedImage);
      onClose();
    } catch (err) {
      console.error('Failed to process image:', err);
    }
  };

  const getCroppedImg = async (
    image: HTMLImageElement,
    crop: Crop,
    scale: number = 1,
    fileName = 'cropped.png'
  ): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set fixed output size for avatar
    const outputSize = 200;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Apply circular mask
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Calculate dimensions
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate source dimensions
    const sourceWidth = (crop.width * scaleX * image.width) / 100;
    const sourceHeight = (crop.height * scaleY * image.height) / 100;
    const sourceX = (crop.x * scaleX * image.width) / 100;
    const sourceY = (crop.y * scaleY * image.height) / 100;

    // Draw scaled image
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(new File([blob], fileName, { type: 'image/png' }));
        },
        'image/png',
        1
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Avatar</DialogTitle>
          <DialogDescription>
            Ajuste o recorte e o tamanho da imagem para seu avatar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-6">
            <div className="flex-1">
              <ReactCrop
                crop={crop}
                onChange={(c) => {
                  console.log("Crop changed", c);
                  setCrop(c);
                }}
                aspect={1}
                circularCrop
                keepSelection
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Imagem para edição"
                  style={{
                    maxHeight: '400px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center'
                  }}
                  onLoad={() => {
                    console.log("Image loaded");
                    updatePreview();
                  }}
                />
              </ReactCrop>
            </div>

            <div className="w-[100px] space-y-4">
              <Label>Preview</Label>
              <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden bg-muted">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <canvas 
                    ref={previewCanvasRef} 
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Zoom ({scale.toFixed(1)}x)</Label>
            <Slider
              min={0.5}
              max={3}
              step={0.1}
              value={[scale]}
              onValueChange={([value]) => {
                console.log("Scale changed", value);
                setScale(value || 1);
              }}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleEditComplete}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}