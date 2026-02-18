import React, { useRef, useState } from 'react';
import { Camera, X, Wrench, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { compressImageFileToDataUrl } from '@/lib/imageCompression';

interface GeneralMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    location: string;
    priority: 'low' | 'medium' | 'high';
    image?: string;
  }) => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low' as const, label: 'נמוכה', color: 'bg-blue-500 text-white' },
  { value: 'medium' as const, label: 'בינונית', color: 'bg-yellow-500 text-white' },
  { value: 'high' as const, label: 'גבוהה', color: 'bg-destructive text-destructive-foreground' },
];

export const GeneralMaintenanceModal: React.FC<GeneralMaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setPreviewImage(dataUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!description.trim() || !location.trim()) return;
    onSubmit({
      title: title.trim() || 'תחזוקה כללית',
      description: description.trim(),
      location: location.trim(),
      priority,
      image: previewImage || undefined,
    });
    // Reset
    setTitle('');
    setDescription('');
    setLocation('');
    setPriority('medium');
    setPreviewImage(null);
    onClose();
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setPriority('medium');
    setPreviewImage(null);
    onClose();
  };

  const isValid = description.trim().length > 0 && location.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wrench className="w-6 h-6 text-primary" />
            דיווח תחזוקה כללי
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">כותרת (אופציונלי)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: מנורה שבורה"
              className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">תיאור *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תאר את הבעיה..."
              className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background resize-none focus:outline-none focus:border-primary min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">מיקום *</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="למשל: ליד המדורה בשכונה 2"
              className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">עדיפות</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-xl font-semibold transition-all',
                    priority === opt.value
                      ? opt.color
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">תמונה (אופציונלי)</label>
            {previewImage ? (
              <div className="relative">
                <img src={previewImage} alt="Preview" className="w-full h-48 object-cover rounded-xl border-2 border-border" />
                <Button variant="destructive" size="sm" onClick={handleRemoveImage} className="absolute top-2 left-2">
                  <X className="w-4 h-4 ml-1" />
                  הסר
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Camera className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">לחץ להוספת תמונה</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">ביטול</Button>
          <Button onClick={handleSubmit} disabled={!isValid} className="flex-1">
            <Plus className="w-4 h-4 ml-1" />
            שלח דיווח
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
