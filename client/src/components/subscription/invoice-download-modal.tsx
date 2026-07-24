import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Mail, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
  plan: 'Pro' | 'Teams';
  billingPeriod: {
    start: Date;
    end: Date;
  };
  amount: number;
  tax: number;
  total: number;
  paymentMethod: {
    type: string;
    last4: string;
  };
  billingAddress: {
    name: string;
    email: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

interface InvoiceDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData;
  onDownloadPdf: () => void;
  onEmailInvoice: () => void;
  onPrint: () => void;
}

export function InvoiceDownloadModal({
  isOpen,
  onClose,
  invoice,
  onDownloadPdf,
  onEmailInvoice,
  onPrint,
}: InvoiceDownloadModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = () => {
    switch (invoice.status) {
      case 'paid':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Paid
          </div>
        );
      case 'pending':
        return (
          <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
            Pending
          </div>
        );
      case 'overdue':
        return (
          <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            Overdue
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <DialogTitle>Invoice Details</DialogTitle>
          </div>
          <DialogDescription>Invoice #{invoice.invoiceNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-primary mb-1">TripSync</h3>
                <p className="text-sm text-muted-foreground">Trip Planning Made Easy</p>
              </div>
              {getStatusBadge()}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Invoice Number</p>
                <p className="font-semibold">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Invoice Date</p>
                <p className="font-semibold">{format(invoice.invoiceDate, 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Due Date</p>
                <p className="font-semibold">{format(invoice.dueDate, 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Billing Period</p>
                <p className="font-semibold">
                  {format(invoice.billingPeriod.start, 'MMM d')} -{' '}
                  {format(invoice.billingPeriod.end, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </Card>

          {/* Bill To */}
          <div>
            <h4 className="font-semibold mb-3">Bill To</h4>
            <Card className="p-4">
              <p className="font-medium mb-1">{invoice.billingAddress.name}</p>
              <p className="text-sm text-muted-foreground mb-1">{invoice.billingAddress.email}</p>
              {invoice.billingAddress.address && (
                <>
                  <p className="text-sm text-muted-foreground">{invoice.billingAddress.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.billingAddress.city}, {invoice.billingAddress.state}{' '}
                    {invoice.billingAddress.zip}
                  </p>
                  <p className="text-sm text-muted-foreground">{invoice.billingAddress.country}</p>
                </>
              )}
            </Card>
          </div>

          {/* Invoice Details */}
          <div>
            <h4 className="font-semibold mb-3">Invoice Details</h4>
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">Description</th>
                      <th className="text-right p-4 text-sm font-medium">Period</th>
                      <th className="text-right p-4 text-sm font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-4">
                        <p className="font-medium">TripSync {invoice.plan} Plan</p>
                        <p className="text-sm text-muted-foreground">Monthly subscription</p>
                      </td>
                      <td className="p-4 text-right text-sm">
                        {format(invoice.billingPeriod.start, 'MMM d')} -{' '}
                        {format(invoice.billingPeriod.end, 'MMM d, yyyy')}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(invoice.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Separator />

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(invoice.tax)}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Method */}
          <div>
            <h4 className="font-semibold mb-3">Payment Method</h4>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {invoice.paymentMethod.type} •••• {invoice.paymentMethod.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.status === 'paid'
                      ? `Charged on ${format(invoice.invoiceDate, 'MMM d, yyyy')}`
                      : 'Pending payment'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Actions Info */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Need help?</strong> Contact our support team at support@tripsync.com if you
              have any questions about this invoice.
            </p>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={onEmailInvoice}>
            <Mail className="h-4 w-4 mr-2" />
            Email Invoice
          </Button>
          <Button onClick={onDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
