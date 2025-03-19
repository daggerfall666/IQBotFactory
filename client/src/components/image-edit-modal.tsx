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
    cropData: { x: number; y: number; width: number; height: number },
    targetSize: number
  ) => {
    try {
      // Clear the canvas
      ctx.clearRect(0, 0, targetSize, targetSize);

      // Create circular mask
      ctx.save();
      ctx.beginPath();
      ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Calculate source dimensions and preserve aspect ratio
      const sourceAspect = cropData.width / cropData.height;
      const targetAspect = 1; // Circle is always 1:1

      let drawWidth = targetSize;
      let drawHeight = targetSize;
      let offsetX = 0;
      let offsetY = 0;

      if (sourceAspect > targetAspect) {
        // Source is wider than target
        drawWidth = drawHeight * sourceAspect;
        offsetX = -(drawWidth - targetSize) / 2;
      } else {
        // Source is taller than target
        drawHeight = drawWidth / sourceAspect;
        offsetY = -(drawHeight - targetSize) / 2;
      }

      // Apply scale transformation around the center
      ctx.translate(targetSize / 2, targetSize / 2);
      ctx.scale(scale, scale);
      ctx.translate(-targetSize / 2, -targetSize / 2);

      // Draw the image maintaining aspect ratio
      ctx.drawImage(
        img,
        cropData.x,
        cropData.y,
        cropData.width,
        cropData.height,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );

      ctx.restore();
    } catch (error) {
      console.error('Error drawing circular crop:', error);
      throw new Error('Failed to draw circular crop');
    }
  };

  const updatePreview = () => {
    if (!imgRef.current || !previewCanvasRef.current || !crop.width || !crop.height) {
      return;
    }

    try {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const previewSize = 100;
      canvas.width = previewSize;
      canvas.height = previewSize;

      // Calculate crop coordinates in pixel dimensions
      const cropData = {
        x: (crop.x * imgRef.current.width) / 100,
        y: (crop.y * imgRef.current.height) / 100,
        width: (crop.width * imgRef.current.width) / 100,
        height: (crop.height * imgRef.current.height) / 100
      };

      drawCircularCrop(ctx, imgRef.current, cropData, previewSize);
    } catch (error) {
      console.error('Error updating preview:', error);
    }
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

    try {
      const outputSize = 200;
      canvas.width = outputSize;
      canvas.height = outputSize;

      // Calculate crop coordinates in pixel dimensions
      const cropData = {
        x: (crop.x * image.width) / 100,
        y: (crop.y * image.height) / 100,
        width: (crop.width * image.width) / 100,
        height: (crop.height * image.height) / 100
      };

      drawCircularCrop(ctx, image, cropData, outputSize);

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
    } catch (error) {
      console.error('Error getting cropped image:', error);
      throw new Error('Failed to generate cropped image');
    } finally {
      // Cleanup
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
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