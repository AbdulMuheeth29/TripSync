/**
 * File Upload Component
 * Reusable component for uploading files to cloud storage
 */

import { useState, useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileIcon, ImageIcon } from 'lucide-react';

export interface FileUploadProps {
  /**
   * Upload endpoint (/api/upload/photo, /api/upload/document, etc.)
   */
  endpoint: string;

  /**
   * Accepted file types (MIME types)
   */
  accept?: string;

  /**
   * Maximum file size in MB
   */
  maxSizeMB?: number;

  /**
   * Allow multiple files
   */
  multiple?: boolean;

  /**
   * Callback when files are uploaded
   */
  onUploadComplete?: (urls: string[]) => void;

  /**
   * Button text
   */
  buttonText?: string;

  /**
   * Show preview for images
   */
  showPreview?: boolean;
}

export function FileUpload({
  endpoint,
  accept = 'image/*',
  maxSizeMB = 10,
  multiple = false,
  onUploadComplete,
  buttonText = 'Upload File',
  showPreview = true,
}: FileUploadProps) {
  const uniqueId = useId().replace(/:/g, '');
  const inputId = `file-upload-input-${uniqueId}`;
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = files.filter((f) => f.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    // Show previews for images
    if (showPreview && files[0].type.startsWith('image/')) {
      const readers = files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(setPreviews);
    }

    uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setProgress(0);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const token =
          localStorage.getItem('tripsync_token') ?? sessionStorage.getItem('tripsync_token');
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        uploadedUrls.push(data.url);

        setProgress(((i + 1) / files.length) * 100);
      }

      toast({
        title: 'Upload successful',
        description: `${files.length} file(s) uploaded`,
      });

      if (onUploadComplete) {
        onUploadComplete(uploadedUrls);
      }

      // Clear previews after upload
      setPreviews([]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id={inputId}
        />
        <label htmlFor={inputId}>
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : buttonText}
          </Button>
        </label>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">
            {Math.round(progress)}% uploaded
          </p>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePreview(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Batch Photo Upload Component
 * Specialized for uploading multiple photos at once
 */
export function BatchPhotoUpload({
  onUploadComplete,
}: {
  onUploadComplete?: (urls: string[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file sizes
    const maxSize = 25 * 1024 * 1024; // 25MB
    const oversized = files.filter((f) => f.size > maxSize);
    if (oversized.length > 0) {
      toast({
        title: 'Some files are too large',
        description: 'Maximum file size is 25MB per photo',
        variant: 'destructive',
      });
      return;
    }

    // Create previews
    const readers = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(setPreviews);

    uploadBatch(files);
  };

  const uploadBatch = async (files: File[]) => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const token =
        localStorage.getItem('tripsync_token') ?? sessionStorage.getItem('tripsync_token');
      const response = await fetch('/api/upload/photos/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Batch upload failed');
      }

      const data = await response.json();

      toast({
        title: 'Upload successful',
        description: `${data.count} photos uploaded`,
      });

      if (onUploadComplete) {
        onUploadComplete(data.uploads.map((u: any) => u.url));
      }

      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="batch-upload-input"
        />
        <label htmlFor="batch-upload-input">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Photos'}
          </Button>
        </label>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">
            Uploading {previews.length} photos...
          </p>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {previews.map((preview, index) => (
            <img
              key={index}
              src={preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-20 object-cover rounded border"
            />
          ))}
        </div>
      )}
    </div>
  );
}
