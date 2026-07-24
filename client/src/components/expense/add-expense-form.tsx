import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarIcon, Upload, X, DollarSign, Users, Receipt } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { SplitMethodSelector, type SplitMethod } from "./split-method-selector";
import { PercentageSplitBreakdown } from "./percentage-split-breakdown";
import { CustomAmountSplit } from "./custom-amount-split";
import { TipTaxConfig } from "./tip-tax-config";
import { CurrencySelector } from "./currency-selector";
import { ReceiptUploadProgress } from "./receipt-upload-progress";
import { ReceiptOCRProcessing } from "./receipt-ocr-processing";

interface TripMember {
  id: string;
  name: string;
  email: string;
}

interface AddExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: ExpenseFormData) => void | Promise<void>;
  tripMembers: TripMember[];
  defaultCurrency?: string;
}

export interface ExpenseFormData {
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: Date;
  paidBy: string;
  splitMethod: SplitMethod;
  splits: Record<string, number>;
  notes?: string;
  receiptUrl?: string;
  tipAmount?: number;
  taxAmount?: number;
}

const EXPENSE_CATEGORIES = [
  "Accommodation",
  "Transportation",
  "Food & Dining",
  "Activities",
  "Shopping",
  "Entertainment",
  "Groceries",
  "Other"
];

export function AddExpenseForm({
  isOpen,
  onClose,
  onSubmit,
  tripMembers,
  defaultCurrency = "USD"
}: AddExpenseFormProps) {
  const [title, setTitle] = useState("");
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [paidBy, setPaidBy] = useState(tripMembers[0]?.id || "");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [splits, setSplits] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    setIsUploadingReceipt(true);
    setUploadProgress(0);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setIsUploadingReceipt(false);
          setIsProcessingOcr(true);

          // Simulate OCR processing
          setTimeout(() => {
            setIsProcessingOcr(false);
            // In real app, set OCR extracted data here
            setReceiptUrl(URL.createObjectURL(file));
          }, 5000);

          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptUrl(null);
    setIsUploadingReceipt(false);
    setIsProcessingOcr(false);
    setUploadProgress(0);
  };

  const handleTotalChange = (total: number, tip: number, tax: number) => {
    setTotalAmount(total);
    setTipAmount(tip);
    setTaxAmount(tax);
  };

  const handleSplitChange = (newSplits: Record<string, number> | Record<string, { amount: number; note?: string }>) => {
    // Normalize to Record<string, number> for state
    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(newSplits)) {
      normalized[key] = typeof value === 'number' ? value : value.amount;
    }
    setSplits(normalized);
  };

  const handleSubmit = async () => {
    if (!title || totalAmount <= 0 || !category || !paidBy) {
      return;
    }

    setIsSubmitting(true);

    const expenseData: ExpenseFormData = {
      title,
      amount: totalAmount,
      currency,
      category,
      date,
      paidBy,
      splitMethod,
      splits,
      notes: notes || undefined,
      receiptUrl: receiptUrl || undefined,
      tipAmount: tipAmount || undefined,
      taxAmount: taxAmount || undefined
    };

    await onSubmit(expenseData);

    // Reset form
    setTitle("");
    setBaseAmount(0);
    setTotalAmount(0);
    setCategory("");
    setDate(new Date());
    setSplitMethod("equal");
    setSplits({});
    setNotes("");
    setReceiptFile(null);
    setReceiptUrl(null);
    setTipAmount(0);
    setTaxAmount(0);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Record a trip expense and split it with your group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Expense Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Dinner at Italian Bistro"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <CurrencySelector
                  value={currency}
                  onChange={setCurrency}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Amount & Tip/Tax */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Amount Details</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseAmount">Base Amount *</Label>
              <Input
                id="baseAmount"
                type="number"
                placeholder="0.00"
                step="0.01"
                value={baseAmount || ""}
                onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <TipTaxConfig
              baseAmount={baseAmount}
              onTotalChange={handleTotalChange}
            />

            {totalAmount > 0 && (
              <Card className="p-4 bg-primary/5 border-primary">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currency
                    }).format(totalAmount)}
                  </span>
                </div>
              </Card>
            )}
          </div>

          <Separator />

          {/* Paid By */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Paid By *</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tripMembers.map((member) => (
                <Card
                  key={member.id}
                  className={`p-3 cursor-pointer transition-all ${
                    paidBy === member.id
                      ? "border-primary border-2 bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setPaidBy(member.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Split Method */}
          <div className="space-y-4">
            <SplitMethodSelector
              value={splitMethod}
              onChange={setSplitMethod}
              peopleCount={tripMembers.length}
            />

            {splitMethod === "percentage" && (
              <PercentageSplitBreakdown
                members={tripMembers}
                totalAmount={totalAmount}
                onSplitChange={handleSplitChange}
              />
            )}

            {splitMethod === "custom" && (
              <CustomAmountSplit
                members={tripMembers}
                totalAmount={totalAmount}
                currency={currency}
                onSplitChange={handleSplitChange}
              />
            )}

            {splitMethod === "equal" && totalAmount > 0 && (
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-center">
                  Each person pays:{" "}
                  <span className="font-bold text-lg">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currency
                    }).format(totalAmount / tripMembers.length)}
                  </span>
                </p>
              </Card>
            )}

            {splitMethod === "self" && totalAmount > 0 && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-900 text-center">
                  This expense is for <strong>{tripMembers.find(m => m.id === paidBy)?.name}</strong> only
                  and won't be split with the group
                </p>
              </Card>
            )}
          </div>

          <Separator />

          {/* Receipt Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Receipt (Optional)</h3>
            </div>

            {!receiptFile && !receiptUrl && (
              <div>
                <Label htmlFor="receipt" className="cursor-pointer">
                  <Card className="p-6 border-dashed border-2 hover:border-primary transition-colors">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Upload Receipt</p>
                      <p className="text-xs text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                    </div>
                  </Card>
                </Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReceiptUpload}
                />
              </div>
            )}

            {isUploadingReceipt && (
              <ReceiptUploadProgress
                isOpen={isUploadingReceipt}
                fileName={receiptFile?.name || ""}
                progress={uploadProgress}
                isComplete={uploadProgress === 100}
              />
            )}

            {isProcessingOcr && (
              <ReceiptOCRProcessing
                isOpen={isProcessingOcr}
                fileName={receiptFile?.name || "receipt"}
              />
            )}

            {receiptUrl && !isUploadingReceipt && !isProcessingOcr && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Receipt uploaded</p>
                      <p className="text-xs text-muted-foreground">{receiptFile?.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveReceipt}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details about this expense..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title || totalAmount <= 0 || !category || !paidBy || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
