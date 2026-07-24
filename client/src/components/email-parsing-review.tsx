import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Edit2, Mail } from 'lucide-react';

const emailDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  confirmation: z.string().optional(),
  notes: z.string().optional(),
});

type EmailData = z.infer<typeof emailDataSchema>;

interface EmailParsingReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: EmailData) => void | Promise<void>;
  extractedData: Partial<EmailData>;
  isProcessing?: boolean;
}

export function EmailParsingReview({
  isOpen,
  onClose,
  extractedData,
  onConfirm,
  isProcessing = false,
}: EmailParsingReviewProps) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailData>({
    resolver: zodResolver(emailDataSchema),
    defaultValues: extractedData,
  });

  const onSubmit = (data: EmailData) => {
    onConfirm(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">Review Extracted Information</DialogTitle>
          <DialogDescription className="text-center">
            We found this information in your email. Review and edit if needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  {Object.keys(extractedData).length} fields auto-filled
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Information extracted using AI from your email
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                {isEditing ? 'Done' : 'Edit'}
              </Button>
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                Activity Title
                {extractedData.title && (
                  <Badge variant="outline" className="text-xs">
                    Auto-filled
                  </Badge>
                )}
              </Label>
              <Input
                id="title"
                {...register('title')}
                readOnly={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  Start Date
                  {extractedData.startDate && (
                    <Badge variant="outline" className="text-xs">
                      Auto-filled
                    </Badge>
                  )}
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register('startDate')}
                  readOnly={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  End Date
                  {extractedData.endDate && (
                    <Badge variant="outline" className="text-xs">
                      Auto-filled
                    </Badge>
                  )}
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register('endDate')}
                  readOnly={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                Location
                {extractedData.location && (
                  <Badge variant="outline" className="text-xs">
                    Auto-filled
                  </Badge>
                )}
              </Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="e.g., 123 Main St, City, Country"
                readOnly={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
            </div>

            {/* Confirmation Number */}
            <div className="space-y-2">
              <Label htmlFor="confirmation" className="flex items-center gap-2">
                Confirmation Number
                {extractedData.confirmation && (
                  <Badge variant="outline" className="text-xs">
                    Auto-filled
                  </Badge>
                )}
              </Label>
              <Input
                id="confirmation"
                {...register('confirmation')}
                placeholder="e.g., ABC123XYZ"
                readOnly={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                Additional Notes
                {extractedData.notes && (
                  <Badge variant="outline" className="text-xs">
                    Auto-filled
                  </Badge>
                )}
              </Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any additional information..."
                rows={3}
                readOnly={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? 'Adding...' : 'Add to Itinerary'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
