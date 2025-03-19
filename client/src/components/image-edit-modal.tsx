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

  const centerCrop = (imageWidth: number, imageHeight: number) => {
    const size = Math.min(imageWidth, imageHeight);
    return {
      unit: '%' as const,
      width: (size / imageWidth) * 100,
      height: (size / imageHeight) * 100,
      x: ((imageWidth - size) / 2 / imageWidth) * 100,
      y: ((imageHeight - size) / 2 / imageHeight) * 100
    };
  };

  const processImage = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    targetSize: number
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, targetSize, targetSize);

    // Create circular mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Calculate crop dimensions
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = (x * image.width * scaleX) / 100;
    const cropY = (y * image.height * scaleY) / 100;
    const cropWidth = (width * image.width * scaleX) / 100;
    const cropHeight = (height * image.height * scaleY) / 100;

    // Draw image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      targetSize,
      targetSize
    );

    ctx.restore();
  };

  const updatePreview = () => {
    if (!imgRef.current || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set preview size
    const previewSize = 100;
    canvas.width = previewSize;
    canvas.height = previewSize;

    processImage(ctx, imgRef.current, crop.x, crop.y, crop.width, crop.height, previewSize);
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

    // Set output size
    const outputSize = 200;
    canvas.width = outputSize;
    canvas.height = outputSize;

    processImage(ctx, image, crop.x, crop.y, crop.width, crop.height, outputSize);

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
                      setCrop(centerCrop(e.currentTarget.width, e.currentTarget.height));
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