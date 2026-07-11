import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Download, ExternalLink, Edit2, Trash2, AlertTriangle, Calendar, User, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format, differenceInDays } from "date-fns";

interface TripDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  notes?: string | null;
  expiryDate?: string | null;
  uploadedBy?: { id: string; name: string };
  createdAt: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: TripDocument[];
  initialDocumentId?: string;
  onUpdateDocument: (docId: string, updates: { name?: string; notes?: string; expiryDate?: string | null }) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  documents,
  initialDocumentId,
  onUpdateDocument,
  onDeleteDocument
}: DocumentViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialDocumentId) {
      const index = documents.findIndex(d => d.id === initialDocumentId);
      return index >= 0 ? index : 0;
    }
    return 0;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", notes: "", expiryDate: "" });

  const currentDoc = documents[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % documents.length);
    setIsEditing(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + documents.length) % documents.length);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditForm({
      name: currentDoc.name,
      notes: currentDoc.notes || "",
      expiryDate: currentDoc.expiryDate || ""
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    await onUpdateDocument(currentDoc.id, {
      name: editForm.name,
      notes: editForm.notes || undefined,
      expiryDate: editForm.expiryDate || null
    });
    setIsEditing(false);
  };

  const handleDownload = () => {
    window.open(currentDoc.url, '_blank');
  };

  const getDocumentTypeInfo = (type: string) => {
    const types: Record<string, { label: string; color: string; icon: string }> = {
      boarding_pass: { label: "Boarding Pass", color: "bg-blue-100 text-blue-800", icon: "✈️" },
      hotel_confirmation: { label: "Hotel Confirmation", color: "bg-purple-100 text-purple-800", icon: "🏨" },
      vaccination: { label: "Vaccination", color: "bg-green-100 text-green-800", icon: "💉" },
      insurance: { label: "Insurance", color: "bg-amber-100 text-amber-800", icon: "🛡️" },
      visa: { label: "Visa", color: "bg-pink-100 text-pink-800", icon: "📋" },
      rental: { label: "Rental Confirmation", color: "bg-cyan-100 text-cyan-800", icon: "🚗" },
      other: { label: "Document", color: "bg-gray-100 text-gray-800", icon: "📄" }
    };
    return types[type] || types.other;
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;

    const days = differenceInDays(new Date(expiryDate), new Date());

    if (days < 0) {
      return { label: "Expired", color: "bg-red-100 text-red-800", urgent: true };
    } else if (days <= 14) {
      return { label: `Expires in ${days} days`, color: "bg-amber-100 text-amber-800", urgent: true };
    } else if (days <= 30) {
      return { label: `Expires in ${days} days`, color: "bg-yellow-100 text-yellow-800", urgent: false };
    }

    return { label: `Expires ${format(new Date(expiryDate), "MMM d, yyyy")}`, color: "bg-gray-100 text-gray-700", urgent: false };
  };

  if (!currentDoc) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No documents available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const typeInfo = getDocumentTypeInfo(currentDoc.type);
  const expiryStatus = getExpiryStatus(currentDoc.expiryDate || null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{typeInfo.icon}</span>
              <div>
                <DialogTitle>{currentDoc.name}</DialogTitle>
                <DialogDescription>
                  Document {currentIndex + 1} of {documents.length}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {documents.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={documents.length === 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={documents.length === 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                </>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Document Info */}
          <div className="flex flex-wrap gap-2">
            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
            {expiryStatus && (
              <Badge className={expiryStatus.color}>
                {expiryStatus.urgent && <AlertTriangle className="h-3 w-3 mr-1" />}
                {expiryStatus.label}
              </Badge>
            )}
            {currentDoc.uploadedBy && (
              <Badge variant="outline">
                <User className="h-3 w-3 mr-1" />
                {currentDoc.uploadedBy.name}
              </Badge>
            )}
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(currentDoc.createdAt), "MMM d, yyyy")}
            </Badge>
          </div>

          {/* Edit Form or Display */}
          {isEditing ? (
            <Card className="p-4 space-y-3">
              <h4 className="text-sm font-semibold">Edit Document</h4>
              <div className="space-y-3">
                <div>
                  <Label>Document Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes or reminders"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Expiry Date (Optional)</Label>
                  <Input
                    type="date"
                    value={editForm.expiryDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSaveEdit}>Save Changes</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {currentDoc.notes && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">Notes</p>
                  <p className="text-sm text-blue-800">{currentDoc.notes}</p>
                </Card>
              )}

              {expiryStatus?.urgent && (
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Expiry Warning</p>
                      <p className="text-sm text-amber-800 mt-1">
                        This document {differenceInDays(new Date(currentDoc.expiryDate!), new Date()) < 0 ? 'has expired' : 'is expiring soon'}.
                        Please renew or update as needed.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Document Preview/Link */}
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div>
                <p className="font-semibold mb-1">{currentDoc.name}</p>
                <p className="text-xs text-muted-foreground">Click below to view or download</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={handleDownload}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Document
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Info
              </Button>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete document?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Permanently delete "{currentDoc.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await onDeleteDocument(currentDoc.id);
                      if (documents.length > 1) {
                        setCurrentIndex(prev => Math.min(prev, documents.length - 2));
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
          </div>
        </div>

        <DialogFooter className="border-t p-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">
              Use arrow buttons to navigate between documents
            </p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
