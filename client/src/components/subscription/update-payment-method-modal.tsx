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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

interface UpdatePaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (paymentData: PaymentMethodData) => void | Promise<void>;
  currentCard?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
}

export interface PaymentMethodData {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  billingZip: string;
}

const cardNumberSchema = z.string().regex(/^\d{16}$/, 'Card number must be 16 digits');
const cvvSchema = z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits');
const zipSchema = z.string().regex(/^\d{5}$/, 'ZIP code must be 5 digits');

export function UpdatePaymentMethodModal({
  isOpen,
  onClose,
  onUpdate,
  currentCard,
}: UpdatePaymentMethodModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  };

  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits);

    // Clear error when user types
    if (errors.cardNumber) {
      setErrors((prev) => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleCvvChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setCvv(digits);

    if (errors.cvv) {
      setErrors((prev) => ({ ...prev, cvv: '' }));
    }
  };

  const handleZipChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 5);
    setBillingZip(digits);

    if (errors.billingZip) {
      setErrors((prev) => ({ ...prev, billingZip: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    const cardNumberResult = cardNumberSchema.safeParse(cardNumber);
    if (!cardNumberResult.success) {
      newErrors.cardNumber = cardNumberResult.error.errors[0].message;
    }

    if (!expiryMonth) {
      newErrors.expiryMonth = 'Expiry month is required';
    }

    if (!expiryYear) {
      newErrors.expiryYear = 'Expiry year is required';
    }

    // Check if card is expired
    if (expiryMonth && expiryYear) {
      const now = new Date();
      const expiry = new Date(parseInt(expiryYear), parseInt(expiryMonth) - 1);
      if (expiry < now) {
        newErrors.expiryYear = 'Card has expired';
      }
    }

    const cvvResult = cvvSchema.safeParse(cvv);
    if (!cvvResult.success) {
      newErrors.cvv = cvvResult.error.errors[0].message;
    }

    const zipResult = zipSchema.safeParse(billingZip);
    if (!zipResult.success) {
      newErrors.billingZip = zipResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    const paymentData: PaymentMethodData = {
      cardNumber,
      cardholderName,
      expiryMonth,
      expiryYear,
      cvv,
      billingZip,
    };

    await onUpdate(paymentData);

    // Reset form
    setCardNumber('');
    setCardholderName('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setBillingZip('');
    setErrors({});
    setIsSubmitting(false);
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return { value: month, label: month };
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => {
    const year = currentYear + i;
    return { value: year.toString(), label: year.toString() };
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <DialogTitle>Update Payment Method</DialogTitle>
          </div>
          <DialogDescription>
            {currentCard
              ? `Replace your ${currentCard.brand} ending in ${currentCard.last4}`
              : 'Add a new payment method for your subscription'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Card */}
          {currentCard && (
            <Card className="p-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {currentCard.brand} •••• {currentCard.last4}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Expires {currentCard.expiryMonth.toString().padStart(2, '0')}/
                  {currentCard.expiryYear}
                </span>
              </div>
            </Card>
          )}

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number *</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formatCardNumber(cardNumber)}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              className={errors.cardNumber ? 'border-red-500' : ''}
            />
            {errors.cardNumber && <p className="text-xs text-red-600">{errors.cardNumber}</p>}
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name *</Label>
            <Input
              id="cardholderName"
              type="text"
              placeholder="John Doe"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className={errors.cardholderName ? 'border-red-500' : ''}
            />
            {errors.cardholderName && (
              <p className="text-xs text-red-600">{errors.cardholderName}</p>
            )}
          </div>

          {/* Expiry & CVV */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Month *</Label>
              <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                <SelectTrigger
                  id="expiryMonth"
                  className={errors.expiryMonth ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.expiryMonth && <p className="text-xs text-red-600">{errors.expiryMonth}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryYear">Year *</Label>
              <Select value={expiryYear} onValueChange={setExpiryYear}>
                <SelectTrigger
                  id="expiryYear"
                  className={errors.expiryYear ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="YYYY" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.expiryYear && <p className="text-xs text-red-600">{errors.expiryYear}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV *</Label>
              <Input
                id="cvv"
                type="text"
                placeholder="123"
                value={cvv}
                onChange={(e) => handleCvvChange(e.target.value)}
                className={errors.cvv ? 'border-red-500' : ''}
              />
              {errors.cvv && <p className="text-xs text-red-600">{errors.cvv}</p>}
            </div>
          </div>

          {/* Billing ZIP */}
          <div className="space-y-2">
            <Label htmlFor="billingZip">Billing ZIP Code *</Label>
            <Input
              id="billingZip"
              type="text"
              placeholder="12345"
              value={billingZip}
              onChange={(e) => handleZipChange(e.target.value)}
              className={errors.billingZip ? 'border-red-500' : ''}
            />
            {errors.billingZip && <p className="text-xs text-red-600">{errors.billingZip}</p>}
          </div>

          {/* Security Notice */}
          <Card className="p-3 bg-green-50 border-green-200">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-xs text-green-900">
                  <strong>Secure Payment:</strong> Your payment information is encrypted and secure.
                  We never store your full card details.
                </p>
              </div>
            </div>
          </Card>

          {/* Warning */}
          <Card className="p-3 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-800">
                Your next payment will be charged to this card. The change takes effect immediately.
              </p>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Payment Method'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
