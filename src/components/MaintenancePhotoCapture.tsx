import React, { useRef, useState } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { compressImageFileToDataUrl } from '@/lib/imageCompression';

interface MaintenancePhotoCaptureProps {
  facilityId: string;
  currentImage?: string;
  onImageCapture: (facilityId: string, image: string | undefined) => void;
}

export const MaintenancePhotoCapture: React.FC<MaintenancePhotoCaptureProps> = ({
  facilityId,
  currentImage,
  onImageCapture,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setPreviewImage(dataUrl);
      onImageCapture(facilityId, dataUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewImage(base64);
        onImageCapture(facilityId, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    onImageCapture(facilityId, undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      {/* Thumbnail or Add Photo Button */}
      {currentImage ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-lg overflow-hidden border-2 border-primary/50 hover:border-primary transition-all flex-shrink-0"
        >
          <img 
            src={currentImage} 
            alt="Maintenance issue" 
            className="w-full h-full object-cover"
          />
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={openCamera}
          className="flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          Add Photo
        </Button>
      )}

      {/* Hidden file input for camera/gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Full image dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Maintenance Photo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewImage ? (
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Maintenance issue" 
                  className="w-full rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  No photo attached
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={openCamera}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                {previewImage ? 'Replace Photo' : 'Take Photo'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
