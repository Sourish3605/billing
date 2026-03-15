import { AppLayout } from "@/components/layout/AppLayout";
import { useInvoicesData, useInvoiceMutations } from "@/hooks/use-invoices";
import { formatCurrency } from "@/lib/utils";
import { Loader2, FileText, Plus, Eye, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function InvoicesList() {
  const { data: invoices, isLoading } = useInvoicesData();
  const { deleteInvoice, isDeleting } = useInvoiceMutations();

  const handleDelete = async (id: number, invoiceNumber: string) => {
    if (!confirm(`Delete invoice ${invoiceNumber}? This will restore the stock and cannot be undone.`)) return;
    await deleteInvoice(id);
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Invoice history and records</p>
        </div>
        <Link href="/invoices/new" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <Plus className="h-5 w-5" /> Create New Bill
        </Link>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
        ) : !invoices?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            No invoices generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium border-b border-border/50">Invoice No</th>
                  <th className="p-4 font-medium border-b border-border/50">Date</th>
                  <th className="p-4 font-medium border-b border-border/50">Customer</th>
                  <th className="p-4 font-medium border-b border-border/50">Amount</th>
                  <th className="p-4 font-medium border-b border-border/50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-bold text-primary">{inv.invoiceNumber}</td>
                    <td className="p-4 text-muted-foreground">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-4">
                      <div className="font-medium text-foreground">{inv.customerName}</div>
                      {inv.customerGstin && <div className="text-xs text-muted-foreground font-mono">GST: {inv.customerGstin}</div>}
                    </td>
                    <td className="p-4 font-bold text-foreground">{formatCurrency(inv.finalAmount)}</td>
                    <td className="p-4 flex justify-end gap-2">
                      <Link href={`/invoices/${inv.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-sm font-medium">
                        <Eye className="w-4 h-4" /> View / Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                        disabled={isDeleting}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
