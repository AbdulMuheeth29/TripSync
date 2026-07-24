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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Calendar,
  DollarSign,
  Store,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface OCRLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OCRResults {
  merchantName: string;
  date: Date;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  tip?: number;
  category?: string;
  lineItems: OCRLineItem[];
  confidence: number; // 0-100
}

interface OCRResultsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (data: OCRResults) => void;
  onReject: () => void;
  results: OCRResults;
  receiptImageUrl: string;
}

export function OCRResultsReviewModal({
  isOpen,
  onClose,
  onAccept,
  onReject,
  results: initialResults,
  receiptImageUrl,
}: OCRResultsReviewModalProps) {
  const [results, setResults] = useState(initialResults);
  const [isEditing, setIsEditing] = useState(false);

  const handleFieldChange = (field: keyof OCRResults, value: any) => {
    setResults((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineItemChange = (index: number, field: keyof OCRLineItem, value: any) => {
    setResults((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAccept = () => {
    onAccept(results);
  };

  const isHighConfidence = results.confidence >= 85;
  const isMediumConfidence = results.confidence >= 60 && results.confidence < 85;
  const isLowConfidence = results.confidence < 60;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            <DialogTitle>Review OCR Results</DialogTitle>
          </div>
          <DialogDescription>
            AI has extracted the following information from your receipt. Please verify accuracy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Confidence Score */}
          <Card
            className={`p-4 ${
              isHighConfidence
                ? 'bg-green-50 border-green-200'
                : isMediumConfidence
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isHighConfidence ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-medium">Confidence Score: {results.confidence}%</p>
                  <p className="text-xs text-muted-foreground">
                    {isHighConfidence && 'High confidence - data looks accurate'}
                    {isMediumConfidence && 'Medium confidence - please verify key fields'}
                    {isLowConfidence && 'Low confidence - please review all fields carefully'}
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Done Editing' : 'Edit Results'}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - Receipt Details */}
            <div className="space-y-4">
              <h4 className="font-semibold">Receipt Details</h4>

              {/* Merchant Name */}
              <div className="space-y-2">
                <Label htmlFor="merchant" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Merchant Name
                </Label>
                {isEditing ? (
                  <Input
                    id="merchant"
                    value={results.merchantName}
                    onChange={(e) => handleFieldChange('merchantName', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{results.merchantName}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </Label>
                <p className="text-sm font-medium p-2 bg-muted rounded">
                  {format(results.date, 'MMMM d, yyyy')}
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Category
                </Label>
                {isEditing ? (
                  <Input
                    id="category"
                    value={results.category || ''}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    placeholder="e.g., Food & Dining"
                  />
                ) : (
                  <Badge variant="secondary">{results.category || 'Not detected'}</Badge>
                )}
              </div>

              {/* Amount Breakdown */}
              <Card className="p-4">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount Breakdown
                </h5>

                <div className="space-y-2">
                  {results.subtotal && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={results.subtotal}
                          onChange={(e) =>
                            handleFieldChange('subtotal', parseFloat(e.target.value))
                          }
                          className="w-24 h-8"
                        />
                      ) : (
                        <span className="font-medium">${results.subtotal.toFixed(2)}</span>
                      )}
                    </div>
                  )}

                  {results.tax !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={results.tax}
                          onChange={(e) => handleFieldChange('tax', parseFloat(e.target.value))}
                          className="w-24 h-8"
                        />
                      ) : (
                        <span className="font-medium">${results.tax.toFixed(2)}</span>
                      )}
                    </div>
                  )}

                  {results.tip !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tip</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={results.tip}
                          onChange={(e) => handleFieldChange('tip', parseFloat(e.target.value))}
                          className="w-24 h-8"
                        />
                      ) : (
                        <span className="font-medium">${results.tip.toFixed(2)}</span>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={results.totalAmount}
                        onChange={(e) =>
                          handleFieldChange('totalAmount', parseFloat(e.target.value))
                        }
                        className="w-24 h-8"
                      />
                    ) : (
                      <span className="text-lg font-bold">${results.totalAmount.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Receipt Image */}
            <div className="space-y-4">
              <h4 className="font-semibold">Receipt Image</h4>
              <Card className="p-2 bg-muted/30">
                <div className="relative aspect-[3/4] overflow-hidden rounded">
                  <img
                    src={receiptImageUrl}
                    alt="Receipt"
                    className="w-full h-full object-contain"
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* Line Items */}
          {results.lineItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Line Items ({results.lineItems.length})</h4>
                {!isEditing && (
                  <Badge variant="secondary" className="text-xs">
                    Auto-detected
                  </Badge>
                )}
              </div>

              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Item</th>
                        <th className="text-center p-3 font-medium">Qty</th>
                        <th className="text-right p-3 font-medium">Unit Price</th>
                        <th className="text-right p-3 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.lineItems.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">
                            {isEditing ? (
                              <Input
                                value={item.description}
                                onChange={(e) =>
                                  handleLineItemChange(index, 'description', e.target.value)
                                }
                                className="h-8"
                              />
                            ) : (
                              item.description
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleLineItemChange(index, 'quantity', parseInt(e.target.value))
                                }
                                className="h-8 w-16 text-center mx-auto"
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleLineItemChange(
                                    index,
                                    'unitPrice',
                                    parseFloat(e.target.value)
                                  )
                                }
                                className="h-8 w-20 ml-auto"
                              />
                            ) : (
                              `$${item.unitPrice.toFixed(2)}`
                            )}
                          </td>
                          <td className="p-3 text-right font-medium">
                            ${item.totalPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Warning for Low Confidence */}
          {isLowConfidence && (
            <Card className="p-3 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-900">
                  <strong>Low confidence detection:</strong> The receipt image quality may be poor.
                  Please carefully verify all extracted information before accepting.
                </p>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onReject}>
            Reject & Enter Manually
          </Button>
          <Button onClick={handleAccept}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
