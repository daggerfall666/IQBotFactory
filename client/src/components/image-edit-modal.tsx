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
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize crop when image loads
  useEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const size = Math.min(80, (width / height) * 80);
      setCrop({
        unit: '%',
        width: size,
        height: size,
        x: (100 - size) / 2,
        y: (100 - size) / 2
      });
    }
  }, [imageUrl]);

  // Update preview whenever crop or scale changes
  useEffect(() => {
    if (imgRef.current && crop.width && crop.height) {
      updatePreview();
    }
  }, [crop, scale]);

  const drawCircularCrop = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    pixelCrop: { x: number; y: number; width: number; height: number },
    targetSize: number
  ) => {
    try {
      // Clear the canvas
      ctx.clearRect(0, 0, targetSize, targetSize);

      // Create circular mask
      ctx.save();
      ctx.beginPath();
      ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Calculate the scale to fit the crop area into the target size
      const scaleX = targetSize / pixelCrop.width;
      const scaleY = targetSize / pixelCrop.height;
      const scale = Math.max(scaleX, scaleY);

      // Calculate centered position
      const scaledWidth = pixelCrop.width * scale;
      const scaledHeight = pixelCrop.height * scale;
      const dx = (targetSize - scaledWidth) / 2;
      const dy = (targetSize - scaledHeight) / 2;

      // Draw the cropped portion
      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        dx,
        dy,
        scaledWidth,
        scaledHeight
      );

      ctx.restore();
    } catch (error) {
      console.error('Error drawing crop:', error);
    }
  };

  const updatePreview = () => {
    if (!imgRef.current || !previewCanvasRef.current || !crop.width || !crop.height) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewSize = 100;
    canvas.width = previewSize;
    canvas.height = previewSize;

    // Convert percentage crop to pixel values
    const pixelCrop = {
      x: (crop.x / 100) * imgRef.current.width,
      y: (crop.y / 100) * imgRef.current.height,
      width: (crop.width / 100) * imgRef.current.width,
      height: (crop.height / 100) * imgRef.current.height
    };

    drawCircularCrop(ctx, imgRef.current, pixelCrop, previewSize);
  };

  const getCroppedImg = async (image: HTMLImageElement): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set output size
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    // Convert percentage to pixels for final output
    const pixelCrop = {
      x: (crop.x / 100) * image.width,
      y: (crop.y / 100) * image.height,
      width: (crop.width / 100) * image.width,
      height: (crop.height / 100) * image.height
    };

    drawCircularCrop(ctx, image, pixelCrop, size);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(new File([blob], 'avatar.png', { type: 'image/png' }));
        },
        'image/png',
        1
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Avatar</DialogTitle>
          <DialogDescription>
            Ajuste o recorte e o tamanho da imagem para seu avatar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-6">
            <div className="flex-1 relative bg-muted rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => {
                    const size = Math.min(c.width, c.height);
                    setCrop({
                      ...c,
                      width: size,
                      height: size
                    });
                  }}
                  aspect={1}
                  circularCrop
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
                    className="max-w-full h-auto"
                  />
                </ReactCrop>
              </div>
            </div>

            <div className="w-[200px] space-y-4">
              <div>
                <Label>Preview</Label>
                <div className="mt-2 relative w-[100px] h-[100px] rounded-full overflow-hidden bg-muted">
                  <canvas 
                    ref={previewCanvasRef} 
                    className="w-full h-full"
                  />
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
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={async () => {
              try {
                if (!imgRef.current) return;
                const croppedImage = await getCroppedImg(imgRef.current);
                onSave(croppedImage);
                onClose();
              } catch (error) {
                console.error('Error saving cropped image:', error);
              }
            }}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}