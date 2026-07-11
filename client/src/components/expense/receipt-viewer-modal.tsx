import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ZoomIn, ZoomOut, RotateCw, X, Receipt, Calendar, DollarSign, User } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string;
  expenseDetails: {
    title: string;
    amount: number;
    currency: string;
    category: string;
    date: Date;
    paidBy: string;
  };
  onDownload?: () => void;
  onDelete?: () => void;
}

export function ReceiptViewerModal({
  isOpen,
  onClose,
  receiptUrl,
  expenseDetails,
  onDownload,
  onDelete
}: ReceiptViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: expenseDetails.currency
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <DialogTitle>Receipt Viewer</DialogTitle>
          </div>
          <DialogDescription>
            Receipt for <strong>{expenseDetails.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expense Details */}
          <Card className="p-4 bg-muted/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span>Amount</span>
                </div>
                <p className="font-semibold">{formatCurrency(expenseDetails.amount)}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Date</span>
                </div>
                <p className="font-semibold">
                  {format(expenseDetails.date, "MMM d, yyyy")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Receipt className="h-3 w-3" />
                  <span>Category</span>
                </div>
                <Badge variant="secondary">{expenseDetails.category}</Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Paid By</span>
                </div>
                <p className="font-semibold truncate">{expenseDetails.paidBy}</p>
              </div>
            </div>
          </Card>

          {/* Controls */}
          <Card className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  Rotate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Image Viewer */}
          <Card className="relative overflow-hidden bg-muted/30">
            <div
              className="flex items-center justify-center p-8 min-h-[400px] max-h-[500px] overflow-auto"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,.03) 10px, rgba(0,0,0,.03) 20px)',
              }}
            >
              <img
                src={receiptUrl}
                alt="Receipt"
                className="max-w-full h-auto transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
              />
            </div>
          </Card>

          {/* OCR Info */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> This receipt was automatically processed. You can zoom and rotate to view details clearly.
            </p>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onDelete && (
            <Button
              variant="outline"
              onClick={onDelete}
              className="text-red-600 hover:text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Delete Receipt
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
