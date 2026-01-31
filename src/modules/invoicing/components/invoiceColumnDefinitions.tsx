import React, { useState } from 'react';
import { TableCell } from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { CustomerDetailsPopover } from '@/shared/components/customer/CustomerDetailsPopover';
import { useToast } from '@/shared/hooks/use-toast';
import { createCheckoutSession } from '../api/stripe.api';
import type { UIInvoice } from '../utils/invoiceTransform';

function StripePaymentLinkCell({ invoice }: { invoice: UIInvoice }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isPaid = invoice.status === 'paid' || invoice.stripeStatus === 'paid';

  const handleOpen = async () => {
    if (isPaid) return;
    setLoading(true);
    try {
      const { url } = await createCheckoutSession(invoice.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Could not create payment link',
        description: e instanceof Error ? e.message : 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isPaid) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7"
      disabled={loading}
      onClick={(e) => {
        e.stopPropagation();
        handleOpen();
      }}
    >
      {loading ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Opening…
        </>
      ) : (
        'Open'
      )}
    </Button>
  );
}

export interface InvoiceColumnDefinition {
  id: string;
  label: string;
  defaultWidth: number;
  sortable?: boolean;
  renderHeader: () => React.ReactNode;
  renderCell: (invoice: UIInvoice, props?: {
    isExpanded?: boolean;
    onToggleExpand?: () => void;
  }) => React.ReactNode;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid": return "bg-green-100 text-green-700";
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "overdue": return "bg-red-100 text-red-700";
    case "draft": return "bg-gray-100 text-gray-700";
    case "cancelled": return "bg-gray-100 text-gray-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getStripePillClass = (stripeStatus: string | null | undefined): string => {
  switch (stripeStatus) {
    case 'paid': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'unpaid':
    default: return 'bg-slate-100 text-slate-600';
  }
};

export const invoiceColumnDefinitions: InvoiceColumnDefinition[] = [
  {
    id: 'expand',
    label: '',
    defaultWidth: 50,
    sortable: false,
    renderHeader: () => <div className="w-12"></div>,
    renderCell: (invoice, { isExpanded, onToggleExpand }) => (
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
    ),
  },
  {
    id: 'invoiceNumber',
    label: 'Invoice Number',
    defaultWidth: 150,
    sortable: true,
    renderHeader: () => <div>Invoice Number</div>,
    renderCell: (invoice) => (
      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
    ),
  },
  {
    id: 'customer',
    label: 'Person',
    defaultWidth: 180,
    sortable: true,
    renderHeader: () => <div>Person</div>,
    renderCell: (invoice) => (
      <TableCell>
        <div>
          {invoice.customer && invoice.customer !== '—' && invoice.customer !== 'No person assigned' ? (
            <CustomerDetailsPopover
              invoiceId={invoice.id}
              fallbackName={invoice.customer}
              fallbackPhone={null}
              fallbackEmail={null}
              trigger={
                <button className="text-left hover:underline text-sm font-medium">
                  {invoice.customer}
                </button>
              }
            />
          ) : (
            <span className="text-sm text-muted-foreground font-medium">—</span>
          )}
          {invoice.orderId && (
            <div className="text-sm text-slate-500 mt-1">Order: {invoice.orderId.substring(0, 8)}...</div>
          )}
        </div>
      </TableCell>
    ),
  },
  {
    id: 'amount',
    label: 'Amount',
    defaultWidth: 120,
    sortable: true,
    renderHeader: () => <div>Amount</div>,
    renderCell: (invoice) => (
      <TableCell className="font-medium">{invoice.amount}</TableCell>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    defaultWidth: 100,
    sortable: true,
    renderHeader: () => <div>Status</div>,
    renderCell: (invoice) => (
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status}
          </Badge>
          <Badge variant="outline" className={getStripePillClass(invoice.stripeStatus)}>
            {invoice.stripeStatus ?? 'unpaid'}
          </Badge>
          {invoice.status === "overdue" && (
            <span className="text-xs text-red-600">
              {invoice.daysOverdue} days
            </span>
          )}
        </div>
      </TableCell>
    ),
  },
  {
    id: 'stripePaymentLink',
    label: 'Stripe payment link',
    defaultWidth: 140,
    sortable: false,
    renderHeader: () => <div>Stripe payment link</div>,
    renderCell: (invoice) => (
      <TableCell>
        <StripePaymentLinkCell invoice={invoice} />
      </TableCell>
    ),
  },
  {
    id: 'dueDate',
    label: 'Due Date',
    defaultWidth: 120,
    sortable: true,
    renderHeader: () => <div>Due Date</div>,
    renderCell: (invoice) => (
      <TableCell>{invoice.dueDate}</TableCell>
    ),
  },
  {
    id: 'paymentMethod',
    label: 'Payment Method',
    defaultWidth: 150,
    sortable: true,
    renderHeader: () => <div>Payment Method</div>,
    renderCell: (invoice) => (
      <TableCell>{invoice.paymentMethod || 'N/A'}</TableCell>
    ),
  },
];

