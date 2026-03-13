import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { InvoicePrintView } from "@/components/InvoicePrintView";
import { useInvoicesData, useInvoiceMutations, useInvoiceData } from "@/hooks/use-invoices";
import { useProductsData } from "@/hooks/use-products";
import { useCustomersData } from "@/hooks/use-customers";
import { useSettingsData } from "@/hooks/use-settings";
import { formatCurrency, numberToWordsIndian } from "@/lib/utils";
import { Loader2, Plus, Trash2, Save, Printer, ArrowLeft } from "lucide-react";
import { type InvoiceInput, type InvoiceItem, type InvoiceInputRoundingOption } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";

const emptyItem: InvoiceItem = {
  description: "", hsnCode: "", unitPrice: 0, quantity: 1, rate: 0, amount: 0, cgstPercent: 9, cgstAmount: 0, sgstPercent: 9, sgstAmount: 0
};

export default function InvoiceForm() {
  const params = useParams();
  const id = params.id ? parseInt(params.id) : null;
  const isEdit = !!id;
  
  const [, setLocation] = useLocation();
  const { data: invoiceToEdit, isLoading: loadingInvoice } = useInvoiceData(id);
  const { data: products } = useProductsData();
  const { data: customers } = useCustomersData();
  const { data: settings } = useSettingsData();
  const { createInvoice, updateInvoice, isCreating, isUpdating } = useInvoiceMutations();

  // Form State
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  
  const [items, setItems] = useState<InvoiceItem[]>([{ ...emptyItem }]);
  const [roundingOption, setRoundingOption] = useState<InvoiceInputRoundingOption>("nearest");
  const [customRounding, setCustomRounding] = useState<number>(0);

  // Load existing data if editing
  useEffect(() => {
    if (isEdit && invoiceToEdit) {
      setInvoiceDate(invoiceToEdit.invoiceDate.split('T')[0]);
      setCustomerName(invoiceToEdit.customerName);
      setCustomerAddress(invoiceToEdit.customerAddress);
      setCustomerGstin(invoiceToEdit.customerGstin || "");
      setCustomerId(invoiceToEdit.customerId);
      setItems(invoiceToEdit.items);
      setRoundingOption(invoiceToEdit.roundingOption as InvoiceInputRoundingOption);
      setCustomRounding(invoiceToEdit.customRounding || 0);
    }
  }, [isEdit, invoiceToEdit]);

  // Handle Customer Selection
  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = parseInt(e.target.value);
    if (!cid) {
      setCustomerId(undefined); setCustomerName(""); setCustomerAddress(""); setCustomerGstin(""); return;
    }
    const c = customers?.find(x => x.id === cid);
    if (c) {
      setCustomerId(c.id); setCustomerName(c.name); setCustomerAddress(c.address); setCustomerGstin(c.gstin || "");
    }
  };

  // Row Calculation Logic
  const updateRow = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    (item as any)[field] = value;

    // Auto-fill from product
    if (field === 'productId' && value) {
      const p = products?.find(x => x.id === parseInt(value));
      if (p) {
        item.description = p.name;
        item.hsnCode = p.hsnCode;
        item.unitPrice = p.unitPrice;
      }
    }

    // Core Math
    // GST Value = Unit Price × 18%
    // Current Rate = Unit Price + GST Value
    // Rate Value Formula: (Current Rate × 100) / 105
    const up = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 0;
    const cgstP = Number(item.cgstPercent) || 0;
    const sgstP = Number(item.sgstPercent) || 0;

    const gstValue = up * 0.18;
    const currentRate = up + gstValue;
    const rate = (currentRate * 100) / 105;

    const amount = rate * qty;
    const cgstAmount = amount * (cgstP / 100);
    const sgstAmount = amount * (sgstP / 100);

    item.rate = rate;
    item.amount = amount;
    item.cgstAmount = cgstAmount;
    item.sgstAmount = sgstAmount;

    setItems(newItems);
  };

  // Totals
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const subTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalCgst = items.reduce((sum, item) => sum + (item.cgstAmount || 0), 0);
  const totalSgst = items.reduce((sum, item) => sum + (item.sgstAmount || 0), 0);
  const grandTotal = subTotal + totalCgst + totalSgst;

  let finalAmount = grandTotal;
  if (roundingOption === 'nearest') finalAmount = Math.round(grandTotal);
  if (roundingOption === 'custom') finalAmount = grandTotal + customRounding;

  const amountInWords = numberToWordsIndian(finalAmount);

  const handleSave = async () => {
    if (!customerName || items.length === 0) return alert("Please fill required fields");
    
    const payload: InvoiceInput = {
      invoiceDate, customerId, customerName, customerAddress, customerGstin,
      items, totalQuantity, subTotal, totalCgst, totalSgst, grandTotal,
      roundingOption, customRounding, finalAmount, amountInWords
    };

    if (isEdit && id) {
      await updateInvoice(id, payload);
    } else {
      await createInvoice(payload);
      setLocation('/invoices');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isEdit && loadingInvoice) return <AppLayout><div className="p-12 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div></AppLayout>;

  // A generated dummy invoice object for the PrintView preview to work dynamically
  const previewInvoice: any = {
    invoiceNumber: invoiceToEdit?.invoiceNumber || "DRAFT-000",
    invoiceDate, customerName, customerAddress, customerGstin, items,
    totalQuantity, subTotal, totalCgst, totalSgst, grandTotal, finalAmount, amountInWords
  };

  return (
    <AppLayout>
      <div className="no-print">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setLocation('/invoices')} className="p-2 hover:bg-secondary rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-3xl font-display font-bold text-foreground">{isEdit ? 'Edit Invoice' : 'Create New Invoice'}</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Form Area */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Customer Section */}
            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
              <h2 className="text-lg font-bold mb-4">Buyer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Select Saved Customer</label>
                  <select className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary" onChange={handleCustomerSelect} value={customerId || ""}>
                    <option value="">-- Custom / Enter manually --</option>
                    {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Invoice Date</label>
                  <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Customer Name*</label>
                  <input required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">GSTIN</label>
                  <input value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary uppercase" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Address*</label>
                  <textarea required value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary h-20 resize-none" />
                </div>
              </div>
            </div>

            {/* Product Items Table */}
            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 overflow-hidden">
              <h2 className="text-lg font-bold mb-4">Products / Services</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="p-3 w-10">#</th>
                      <th className="p-3 w-[20%]">Product</th>
                      <th className="p-3">HSN</th>
                      <th className="p-3 w-20">Price</th>
                      <th className="p-3 w-16">Qty</th>
                      <th className="p-3 w-20">Rate</th>
                      <th className="p-3 w-20">Amount</th>
                      <th className="p-3 w-16">CGST%</th>
                      <th className="p-3 w-16">SGST%</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {items.map((item, index) => (
                      <tr key={index} className="group hover:bg-muted/10">
                        <td className="p-3 text-sm text-muted-foreground">{index + 1}</td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <select 
                              className="p-1.5 border rounded text-sm w-full"
                              value={item.productId || ""}
                              onChange={e => updateRow(index, 'productId', e.target.value)}
                            >
                              <option value="">- Select -</option>
                              {products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input placeholder="Desc" value={item.description} onChange={e => updateRow(index, 'description', e.target.value)} className="p-1.5 border rounded text-sm w-full" />
                          </div>
                        </td>
                        <td className="p-3"><input value={item.hsnCode} onChange={e => updateRow(index, 'hsnCode', e.target.value)} className="w-full p-1.5 border rounded text-sm" /></td>
                        <td className="p-3"><input type="number" value={item.unitPrice} onChange={e => updateRow(index, 'unitPrice', e.target.value)} className="w-full p-1.5 border rounded text-sm" /></td>
                        <td className="p-3"><input type="number" value={item.quantity} onChange={e => updateRow(index, 'quantity', e.target.value)} className="w-full p-1.5 border rounded text-sm" /></td>
                        <td className="p-3 text-sm font-mono bg-muted/30">{item.rate.toFixed(2)}</td>
                        <td className="p-3 text-sm font-mono bg-muted/30">{item.amount.toFixed(2)}</td>
                        <td className="p-3"><input type="number" value={item.cgstPercent} onChange={e => updateRow(index, 'cgstPercent', e.target.value)} className="w-full p-1.5 border rounded text-sm" /></td>
                        <td className="p-3"><input type="number" value={item.sgstPercent} onChange={e => updateRow(index, 'sgstPercent', e.target.value)} className="w-full p-1.5 border rounded text-sm" /></td>
                        <td className="p-3">
                          <button onClick={() => setItems(items.filter((_, i) => i !== index))} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setItems([...items, {...emptyItem}])} className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>

          </div>

          {/* Sidebar / Summary Area */}
          <div className="space-y-6">
            <div className="bg-primary/5 rounded-2xl shadow-sm border border-primary/20 p-6 sticky top-6">
              <h2 className="text-lg font-bold mb-4 border-b border-primary/10 pb-2">Calculation Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Qty:</span> <span className="font-semibold">{totalQuantity}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sub Total:</span> <span className="font-mono">{formatCurrency(subTotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total CGST:</span> <span className="font-mono">{formatCurrency(totalCgst)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total SGST:</span> <span className="font-mono">{formatCurrency(totalSgst)}</span></div>
                
                <div className="pt-3 border-t border-primary/10">
                  <div className="flex justify-between font-bold text-base mb-2"><span>Grand Total:</span> <span className="font-mono">{formatCurrency(grandTotal)}</span></div>
                </div>

                <div className="pt-3 border-t border-primary/10">
                  <label className="text-xs font-medium block mb-2 text-primary">Rounding Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="radio" name="rounding" checked={roundingOption === 'decimal'} onChange={() => setRoundingOption('decimal')} /> Keep Decimal</label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="radio" name="rounding" checked={roundingOption === 'nearest'} onChange={() => setRoundingOption('nearest')} /> Round to Nearest (₹ {Math.round(grandTotal)})</label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="radio" name="rounding" checked={roundingOption === 'custom'} onChange={() => setRoundingOption('custom')} /> Custom Adjust: 
                      <input type="number" step="0.01" className="w-16 p-1 border rounded" disabled={roundingOption !== 'custom'} value={customRounding} onChange={e => setCustomRounding(Number(e.target.value))} />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-primary/20">
                  <div className="flex justify-between font-bold text-xl text-primary">
                    <span>FINAL:</span> <span>{formatCurrency(finalAmount)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground italic mt-2 leading-tight">
                    {amountInWords}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> Save Invoice
                </button>
                <button onClick={handlePrint} className="w-full py-3 bg-white border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" /> Print / PDF
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hidden Print Container injected at root level via CSS, but structured here */}
      {settings && <InvoicePrintView invoice={previewInvoice} settings={settings} />}
    </AppLayout>
  );
}
