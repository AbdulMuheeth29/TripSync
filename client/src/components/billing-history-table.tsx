import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  date: Date;
  plan: 'Free' | 'Pro' | 'Teams';
  amount: number;
  status: 'paid' | 'failed' | 'pending';
  receiptUrl?: string;
  invoiceNumber: string;
}

interface BillingHistoryTableProps {
  invoices: Invoice[];
  onDownloadReceipt: (invoiceId: string) => void;
  onViewInvoice: (invoiceId: string) => void;
  currency?: string;
}

export function BillingHistoryTable({
  invoices,
  onDownloadReceipt,
  onViewInvoice,
  currency = 'USD',
}: BillingHistoryTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (invoices.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">No Billing History</h3>
        <p className="text-sm text-muted-foreground">
          Your invoices will appear here once you start a subscription
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-sm">Date</th>
              <th className="text-left p-4 font-medium text-sm">Invoice #</th>
              <th className="text-left p-4 font-medium text-sm">Plan</th>
              <th className="text-left p-4 font-medium text-sm">Amount</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-right p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/50">
                <td className="p-4 text-sm">{format(invoice.date, 'MMM d, yyyy')}</td>
                <td className="p-4 text-sm font-mono text-muted-foreground">
                  {invoice.invoiceNumber}
                </td>
                <td className="p-4 text-sm">
                  <Badge variant="outline">{invoice.plan}</Badge>
                </td>
                <td className="p-4 text-sm font-medium">{formatCurrency(invoice.amount)}</td>
                <td className="p-4">{getStatusBadge(invoice.status)}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewInvoice(invoice.id)}>
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {invoice.status === 'paid' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadReceipt(invoice.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{format(invoice.date, 'MMM d, yyyy')}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {invoice.invoiceNumber}
                </p>
              </div>
              {getStatusBadge(invoice.status)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{invoice.plan}</Badge>
              </div>
              <p className="text-lg font-semibold">{formatCurrency(invoice.amount)}</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onViewInvoice(invoice.id)}
              >
                <FileText className="h-4 w-4 mr-1" />
                View
              </Button>
              {invoice.status === 'paid' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onDownloadReceipt(invoice.id)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Receipt
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
