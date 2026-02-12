import React, { useRef, useState } from 'react';
import { Camera, X, AlertTriangle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { WorkingStatus, ActivitySpace, getActivitySpaceLabel } from '@/types/village';
import { cn } from '@/lib/utils';
import { compressImageFileToDataUrl } from '@/lib/imageCompression';

interface ActivitySpaceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: ActivitySpace;
  selectedStatus: WorkingStatus;
  onSubmit: (data: { 
    status: WorkingStatus; 
    notes: string; 
    image?: string;
  }) => void;
}

export const ActivitySpaceReportModal: React.FC<ActivitySpaceReportModalProps> = ({
  isOpen,
  onClose,
  space,
  selectedStatus,
  onSubmit,
}) => {
  const [status, setStatus] = useState<WorkingStatus>(selectedStatus);
  const [notes, setNotes] = useState(space.maintenanceNotes || '');
  const [previewImage, setPreviewImage] = useState<string | null>(space.maintenanceImage || null);
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
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = () => {
    onSubmit({
      status,
      notes,
      image: previewImage || undefined,
    });
    onClose();
  };

  const handleCancel = () => {
    setStatus(selectedStatus);
    setNotes(space.maintenanceNotes || '');
    setPreviewImage(space.maintenanceImage || null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            Reportar Problema - {getActivitySpaceLabel(space)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Tipo de Problema
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setStatus('BROKEN')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
                  status === 'BROKEN'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                Roto
              </button>
              <button
                onClick={() => setStatus('MAINTENANCE')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
                  status === 'MAINTENANCE'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Wrench className="w-4 h-4" />
                Mantenimiento
              </button>
            </div>
          </div>

          {/* Photo Section */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Foto (Opcional)
            </label>
            {previewImage ? (
              <div className="relative">
                <img
                  src={previewImage}
                  alt="Vista previa del problema"
                  className="w-full h-48 object-cover rounded-xl border-2 border-border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4 mr-1" />
                  Quitar
                </Button>
              </div>
            ) : (
              <button
                onClick={openCamera}
                className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Toca para agregar foto
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Descripción del Problema
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe el problema..."
              className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background resize-none focus:outline-none focus:border-primary min-h-[100px]"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Enviar Reporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
