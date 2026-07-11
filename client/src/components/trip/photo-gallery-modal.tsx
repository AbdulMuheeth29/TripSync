import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, X, Download, Trash2, User, Calendar, Edit2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface TripPhoto {
  id: string;
  url: string;
  caption?: string | null;
  userId: string;
  user: { id: string; name: string };
  createdAt: string;
}

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: TripPhoto[];
  initialPhotoId?: string;
  currentUserId: string;
  onUpdateCaption: (photoId: string, caption: string) => Promise<void>;
  onDeletePhoto: (photoId: string) => Promise<void>;
}

export function PhotoGalleryModal({
  isOpen,
  onClose,
  photos,
  initialPhotoId,
  currentUserId,
  onUpdateCaption,
  onDeletePhoto
}: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialPhotoId) {
      const index = photos.findIndex(p => p.id === initialPhotoId);
      return index >= 0 ? index : 0;
    }
    return 0;
  });
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    if (currentPhoto) {
      setImageLoaded(false);
      setCaptionText(currentPhoto.caption || "");
      setIsEditingCaption(false);
    }
  }, [currentPhoto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, photos.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleSaveCaption = async () => {
    await onUpdateCaption(currentPhoto.id, captionText);
    setIsEditingCaption(false);
  };

  const handleDownload = () => {
    window.open(currentPhoto.url, '_blank');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const canDelete = currentPhoto && currentPhoto.userId === currentUserId;

  if (!currentPhoto) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] sm:max-h-[95vh] h-[95vh] p-0 bg-black/95">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-white/20 text-white">
                    {getInitials(currentPhoto.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{currentPhoto.user.name}</p>
                  <p className="text-xs text-white/70">
                    {format(new Date(currentPhoto.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                  {currentIndex + 1} / {photos.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Image */}
          <div className="flex-1 flex items-center justify-center p-16">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse text-white">Loading...</div>
              </div>
            )}
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || "Trip photo"}
              className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          {/* Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="max-w-4xl mx-auto space-y-3">
              {/* Caption */}
              {isEditingCaption ? (
                <div className="flex gap-2">
                  <Input
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    placeholder="Add a caption..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveCaption();
                      } else if (e.key === "Escape") {
                        setIsEditingCaption(false);
                        setCaptionText(currentPhoto.caption || "");
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="icon"
                    onClick={handleSaveCaption}
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingCaption(false);
                      setCaptionText(currentPhoto.caption || "");
                    }}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  {currentPhoto.caption ? (
                    <p className="text-white flex-1">{currentPhoto.caption}</p>
                  ) : (
                    <p className="text-white/50 italic flex-1">No caption</p>
                  )}
                  {currentPhoto.userId === currentUserId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingCaption(true)}
                      className="text-white hover:bg-white/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white hover:bg-white/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete photo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Permanently delete this photo? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              await onDeletePhoto(currentPhoto.id);
                              if (photos.length > 1) {
                                setCurrentIndex(prev => Math.min(prev, photos.length - 2));
                              } else {
                                onClose();
                              }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <p className="text-xs text-white/50">
                  Use arrow keys to navigate • ESC to close
                </p>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip (Optional - can be shown on hover) */}
          {photos.length > 1 && (
            <div className="absolute bottom-24 left-0 right-0 z-10 opacity-0 hover:opacity-100 transition-opacity">
              <div className="max-w-4xl mx-auto px-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                        index === currentIndex
                          ? 'border-white scale-110'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
