import { useState, useRef } from "react";
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
    width: 100,
    height: 100,
    x: 0,
    y: 0
  });
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: Crop,
    scale = 1,
    fileName = 'cropped.jpg'
  ): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to desired dimensions (200x200 for avatar)
    const targetSize = 200;
    canvas.width = targetSize;
    canvas.height = targetSize;

    // Make canvas transparent initially
    ctx.clearRect(0, 0, targetSize, targetSize);

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Calculate source and destination coordinates
    const cropX = (crop.x * scaleX) / 100;
    const cropY = (crop.y * scaleY) / 100;
    const cropWidth = (crop.width * scaleX * scale) / 100;
    const cropHeight = (crop.height * scaleY * scale) / 100;

    // Draw image with proper scaling and cropping
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

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          // Always save as PNG to preserve transparency
          resolve(new File([blob], fileName.replace(/\.[^/.]+$/, '.png'), { type: 'image/png' }));
        },
        'image/png',
        1
      );
    });
  };

  const handleSave = async () => {
    try {
      if (imgRef.current) {
        const croppedImage = await getCroppedImg(imgRef.current, crop, scale);
        onSave(croppedImage);
        onClose();
      }
    } catch (err) {
      console.error('Failed to process image:', err);
    }
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
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                src={imageUrl}
                style={{ maxHeight: '400px' }}
                alt="Imagem para edição"
              />
            </ReactCrop>
          </div>

          <div className="space-y-2">
            <Label>Zoom</Label>
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
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}