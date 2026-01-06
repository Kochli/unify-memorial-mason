import React from 'react';
import { TableCell } from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { CustomerDetailsPopover } from '@/shared/components/customer/CustomerDetailsPopover';
import type { UIInvoice } from '../utils/invoiceTransform';

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
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status}
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

