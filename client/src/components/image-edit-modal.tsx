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
    width: 80,
    height: 80,
    x: 10,
    y: 10
  });
  const [scale, setScale] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (imgRef.current && crop.width && crop.height) {
      updatePreview();
    }
  }, [crop, scale]);

  const getCropArea = (image: HTMLImageElement) => {
    // Get the displayed size of the image
    const displayedWidth = image.width * scale;
    const displayedHeight = image.height * scale;

    // Calculate the scaling factors
    const scaleX = image.naturalWidth / displayedWidth;
    const scaleY = image.naturalHeight / displayedHeight;

    // Convert percentage to actual pixels on the natural image
    return {
      x: (crop.x * displayedWidth * scaleX) / 100,
      y: (crop.y * displayedHeight * scaleY) / 100,
      width: (crop.width * displayedWidth * scaleX) / 100,
      height: (crop.height * displayedHeight * scaleY) / 100
    };
  };

  const drawCircularImage = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    cropDimensions: { x: number; y: number; width: number; height: number },
    destSize: number
  ) => {
    // Clear existing content
    ctx.clearRect(0, 0, destSize, destSize);

    // Create circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(destSize / 2, destSize / 2, destSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw the image
    ctx.drawImage(
      image,
      cropDimensions.x,
      cropDimensions.y,
      cropDimensions.width,
      cropDimensions.height,
      0,
      0,
      destSize,
      destSize
    );

    ctx.restore();
  };

  const updatePreview = () => {
    if (!imgRef.current || !previewCanvasRef.current || !crop.width || !crop.height) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewSize = 100;
    canvas.width = previewSize;
    canvas.height = previewSize;

    const cropArea = getCropArea(imgRef.current);
    drawCircularImage(ctx, imgRef.current, cropArea, previewSize);
    setPreviewUrl(canvas.toDataURL());
  };

  const getCroppedImg = async (
    image: HTMLImageElement,
    fileName = 'cropped.png'
  ): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const outputSize = 200;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const cropArea = getCropArea(image);
    drawCircularImage(ctx, image, cropArea, outputSize);

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
            <div className="flex-1 flex items-center justify-center bg-muted rounded-lg p-6 h-[400px]">
              <div className="relative max-w-full max-h-full">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => {
                    const size = Math.min(c.width, c.height);
                    const newCrop = {
                      ...c,
                      width: size,
                      height: size
                    };
                    setCrop(newCrop);
                  }}
                  aspect={1}
                  circularCrop
                  className="max-h-[350px] flex items-center justify-center"
                >
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Imagem para edição"
                    style={{
                      maxHeight: '350px',
                      transform: `scale(${scale})`,
                      transformOrigin: 'center'
                    }}
                    className="max-w-none"
                    onLoad={updatePreview}
                  />
                </ReactCrop>
              </div>
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
              onValueChange={([value]) => setScale(value || 1)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={async () => {
              if (!imgRef.current) return;
              const croppedImage = await getCroppedImg(imgRef.current);
              await onSave(croppedImage);
              onClose();
            }}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}