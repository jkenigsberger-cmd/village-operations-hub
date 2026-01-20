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
import { Facility, WorkingStatus } from '@/types/village';
import { cn } from '@/lib/utils';
import { compressImageFileToDataUrl } from '@/lib/imageCompression';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: Facility;
  selectedStatus: WorkingStatus;
  onSubmit: (data: { 
    status: WorkingStatus; 
    notes: string; 
    image?: string;
  }) => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  facility,
  selectedStatus,
  onSubmit,
}) => {
  const [status, setStatus] = useState<WorkingStatus>(selectedStatus);
  const [notes, setNotes] = useState(facility.maintenanceNotes || '');
  const [previewImage, setPreviewImage] = useState<string | null>(facility.maintenanceImage || null);
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
    // Reset to original values
    setStatus(selectedStatus);
    setNotes(facility.maintenanceNotes || '');
    setPreviewImage(facility.maintenanceImage || null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            Report Issue - {facility.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Issue Type
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
                Broken
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
                Maintenance
              </button>
            </div>
          </div>

          {/* Photo Section */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Photo (Optional)
            </label>
            {previewImage ? (
              <div className="relative">
                <img
                  src={previewImage}
                  alt="Issue preview"
                  className="w-full h-48 object-cover rounded-xl border-2 border-border"
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
              <button
                onClick={openCamera}
                className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Tap to add photo
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
              Description
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background resize-none focus:outline-none focus:border-primary min-h-[100px]"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
