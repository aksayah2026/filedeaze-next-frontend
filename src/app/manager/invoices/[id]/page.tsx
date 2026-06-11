'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Invoice } from '@/types';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ExternalLink } from 'lucide-react';
import dayjs from 'dayjs';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: async () => (await api.get(`/web/manager/invoices/${id}`)).data.data,
  });

  if (isLoading || !invoice) return <PageSpinner />;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Invoice #{invoice.invoiceNumber}</h2>
        {invoice.pdfUrl && (
          <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm"><ExternalLink size={14} /> View PDF</Button>
          </a>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-400">Ticket:</span> <span className="font-medium">{invoice.ticket?.ticketNumber ?? invoice.ticketId}</span></div>
          <div><span className="text-gray-400">Date:</span> <span className="font-medium">{dayjs(invoice.createdAt).format('DD MMM YYYY')}</span></div>
          <div><span className="text-gray-400">Base Amount:</span> <span className="font-medium">₹{invoice.amount.toLocaleString()}</span></div>
          {invoice.gstAmount != null && (
            <div><span className="text-gray-400">GST:</span> <span className="font-medium">₹{invoice.gstAmount.toLocaleString()}</span></div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total Amount</span>
          <span className="text-xl font-bold text-emerald-600">₹{invoice.totalAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
