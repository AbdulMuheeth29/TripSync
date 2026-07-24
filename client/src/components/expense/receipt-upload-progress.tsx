import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, CheckCircle2 } from 'lucide-react';

interface ReceiptUploadProgressProps {
  isOpen: boolean;
  progress: number;
  fileName: string;
  isComplete: boolean;
}

export function ReceiptUploadProgress({
  isOpen,
  progress,
  fileName,
  isComplete,
}: ReceiptUploadProgressProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {isComplete ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Upload className="h-6 w-6 text-primary animate-pulse" />
            )}
          </div>
          <DialogTitle className="text-center">
            {isComplete ? 'Upload Complete' : 'Uploading Receipt'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isComplete ? 'Receipt uploaded successfully' : `Uploading ${fileName}...`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <FileImage className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {isComplete ? '100%' : `${Math.round(progress)}%`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              <span>{isComplete ? 'Done' : 'Uploading...'}</span>
            </div>
          </div>

          {isComplete && (
            <p className="text-sm text-center text-green-600">Processing receipt with AI...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
