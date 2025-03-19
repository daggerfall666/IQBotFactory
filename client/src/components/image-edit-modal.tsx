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
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  const getCroppedImg = async (
    image: HTMLImageElement,
    crop: Crop,
    scale = 1,
    fileName = 'cropped.png'
  ): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set desired output size
    const maxSize = 200; // max size for avatar
    const size = Math.min(maxSize, image.width);
    canvas.width = size;
    canvas.height = size;

    // Clear canvas and create circular clipping path
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Calculate source crop area
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const sourceX = (crop.x * scaleX * image.width) / 100;
    const sourceY = (crop.y * scaleY * image.height) / 100;
    const sourceWidth = (crop.width * scaleX * image.width * scale) / 100;
    const sourceHeight = (crop.height * scaleY * image.height * scale) / 100;

    // Draw image with scaling
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      size,
      size
    );

    // Restore context
    ctx.restore();

    // Convert to blob
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