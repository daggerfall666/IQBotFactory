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

  const getPixelCrop = (image: HTMLImageElement, percentCrop: Crop) => {
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    return {
      x: Math.round((percentCrop.x * image.width * scaleX) / 100),
      y: Math.round((percentCrop.y * image.height * scaleY) / 100),
      width: Math.round((percentCrop.width * image.width * scaleX) / 100),
      height: Math.round((percentCrop.height * image.height * scaleY) / 100)
    };
  };

  const drawCircularImage = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    crop: { x: number; y: number; width: number; height: number },
    targetSize: number
  ) => {
    ctx.clearRect(0, 0, targetSize, targetSize);
    ctx.save();

    // Create circular mask
    ctx.beginPath();
    ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw the image maintaining aspect ratio
    const aspectRatio = crop.width / crop.height;
    let drawWidth = targetSize;
    let drawHeight = targetSize;

    if (aspectRatio > 1) {
      drawHeight = targetSize / aspectRatio;
    } else {
      drawWidth = targetSize * aspectRatio;
    }

    const drawX = (targetSize - drawWidth) / 2;
    const drawY = (targetSize - drawHeight) / 2;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      drawX,
      drawY,
      drawWidth,
      drawHeight
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

    const pixelCrop = getPixelCrop(imgRef.current, crop);
    drawCircularImage(ctx, imgRef.current, pixelCrop, previewSize);
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

    const pixelCrop = getPixelCrop(image, crop);
    drawCircularImage(ctx, image, pixelCrop, outputSize);

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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Avatar</DialogTitle>
          <DialogDescription>
            Ajuste o recorte e o tamanho da imagem para seu avatar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-6">
            {/* Main editor area */}
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
                    onLoad={(e) => {
                      // Center crop when image loads
                      const size = Math.min(e.currentTarget.width, e.currentTarget.height);
                      const width = (size / e.currentTarget.width) * 100;
                      const height = (size / e.currentTarget.height) * 100;
                      const x = ((e.currentTarget.width - size) / 2 / e.currentTarget.width) * 100;
                      const y = ((e.currentTarget.height - size) / 2 / e.currentTarget.height) * 100;

                      setCrop({ unit: '%', width, height, x, y });
                      updatePreview();
                    }}
                  />
                </ReactCrop>
              </div>
            </div>

            {/* Preview and controls */}
            <div className="w-[200px] space-y-4">
              <div>
                <Label>Preview</Label>
                <div className="mt-2 relative w-[100px] h-[100px] rounded-full overflow-hidden bg-muted">
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
                await onSave(croppedImage);
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