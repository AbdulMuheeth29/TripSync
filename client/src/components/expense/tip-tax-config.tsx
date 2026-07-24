import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Percent } from 'lucide-react';

interface TipTaxConfigProps {
  baseAmount: number;
  onTotalChange: (total: number, tip: number, tax: number) => void;
  currency?: string;
}

export function TipTaxConfig({ baseAmount, onTotalChange, currency = 'USD' }: TipTaxConfigProps) {
  const [includeTip, setIncludeTip] = useState(false);
  const [tipPercentage, setTipPercentage] = useState(18);
  const [customTip, setCustomTip] = useState(false);
  const [customTipAmount, setCustomTipAmount] = useState(0);

  const [includeTax, setIncludeTax] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(10);
  const [customTax, setCustomTax] = useState(false);
  const [customTaxAmount, setCustomTaxAmount] = useState(0);

  const tipAmount = includeTip
    ? customTip
      ? customTipAmount
      : (baseAmount * tipPercentage) / 100
    : 0;

  const taxAmount = includeTax
    ? customTax
      ? customTaxAmount
      : (baseAmount * taxPercentage) / 100
    : 0;

  const totalAmount = baseAmount + tipAmount + taxAmount;

  // Update parent whenever calculations change
  useEffect(() => {
    onTotalChange(totalAmount, tipAmount, taxAmount);
  }, [totalAmount, tipAmount, taxAmount, onTotalChange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h4 className="font-semibold mb-1">Additional Charges</h4>
        <p className="text-sm text-muted-foreground">Add tip and tax to the base amount</p>
      </div>

      <Separator />

      {/* Tip Configuration */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-tip"
            checked={includeTip}
            onCheckedChange={(checked) => setIncludeTip(checked as boolean)}
          />
          <Label htmlFor="include-tip" className="font-medium cursor-pointer">
            Add Tip
          </Label>
        </div>

        {includeTip && (
          <div className="ml-6 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="custom-tip"
                checked={customTip}
                onCheckedChange={(checked) => setCustomTip(checked as boolean)}
              />
              <Label htmlFor="custom-tip" className="text-sm cursor-pointer">
                Custom amount
              </Label>
            </div>

            {customTip ? (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customTipAmount || ''}
                  onChange={(e) => setCustomTipAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-32"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={tipPercentage}
                  onChange={(e) => setTipPercentage(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">= {formatCurrency(tipAmount)}</span>
              </div>
            )}

            {/* Quick Tip Buttons */}
            {!customTip && (
              <div className="flex gap-2">
                {[15, 18, 20, 25].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => setTipPercentage(percent)}
                    className={`px-3 py-1 text-sm rounded border ${
                      tipPercentage === percent
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Tax Configuration */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-tax"
            checked={includeTax}
            onCheckedChange={(checked) => setIncludeTax(checked as boolean)}
          />
          <Label htmlFor="include-tax" className="font-medium cursor-pointer">
            Add Tax
          </Label>
        </div>

        {includeTax && (
          <div className="ml-6 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="custom-tax"
                checked={customTax}
                onCheckedChange={(checked) => setCustomTax(checked as boolean)}
              />
              <Label htmlFor="custom-tax" className="text-sm cursor-pointer">
                Custom amount
              </Label>
            </div>

            {customTax ? (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customTaxAmount || ''}
                  onChange={(e) => setCustomTaxAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-32"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">= {formatCurrency(taxAmount)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Total Breakdown */}
      <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base Amount</span>
          <span>{formatCurrency(baseAmount)}</span>
        </div>
        {includeTip && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tip {!customTip && `(${tipPercentage}%)`}</span>
            <span>{formatCurrency(tipAmount)}</span>
          </div>
        )}
        {includeTax && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax {!customTax && `(${taxPercentage}%)`}</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <Separator className="my-2" />
        <div className="flex justify-between font-semibold text-lg">
          <span>Total Amount</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </Card>
  );
}
