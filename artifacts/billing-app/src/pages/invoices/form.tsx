import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { InvoicePrintView } from "@/components/InvoicePrintView";
import { useInvoiceMutations, useInvoiceData, useInvoicesData } from "@/hooks/use-invoices";
import { useProductsData } from "@/hooks/use-products";
import { useCustomersData } from "@/hooks/use-customers";
import { useSettingsData } from "@/hooks/use-settings";
import { formatCurrency, numberToWordsIndian } from "@/lib/utils";
import { Loader2, Plus, Trash2, Save, Printer, ArrowLeft } from "lucide-react";
import { type InvoiceInput, type InvoiceItem, type InvoiceInputRoundingOption } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";

type Category = "Shoes" | "Socks" | "Bags";

function parsePercentInput(value: string): number {
  const trimmed = value.trim().replace(/%/g, "");
  if (trimmed === "") return 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePercentText(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return cleaned;
}

/**
 * Rate calculation — ONLY for Shoes.
 * Uses the manually entered GST percent so the rate can be customized.
 * Formula: ROUND(((UnitPrice - UnitPrice × GST/100) × 100) / 105)
 */
function calcShoeRate(unitPrice: number, gstPct: number): number {
  const raw = ((unitPrice - (unitPrice * gstPct) / 100) * 100) / 105;
  return Math.round(raw); // < 0.5 → down, ≥ 0.5 → up
}

type UIInvoiceItem = InvoiceItem & { autoRate?: boolean };

const emptyItem = (): UIInvoiceItem => ({
  description: "",
  hsnCode: "",
  unitPrice: 0,
  quantity: 1,
  rate: 0,
  amount: 0,
  cgstPercent: 0,
  cgstAmount: 0,
  sgstPercent: 0,
  sgstAmount: 0,
  igstPercent: 0,
  igstAmount: 0,
  category: "Shoes",
  autoRate: true,
});

function getNextInvoiceNumber(invoices?: Array<{ invoiceNumber: string }>): string {
  if (!invoices?.length) return "01";

  const numericInvoiceNumbers = invoices
    .map((invoice) => String(invoice.invoiceNumber || "").trim())
    .filter((invoiceNumber) => /^\d+$/.test(invoiceNumber))
    .map((invoiceNumber) => parseInt(invoiceNumber, 10));

  const nextNumber = numericInvoiceNumbers.length > 0
    ? Math.max(...numericInvoiceNumbers) + 1
    : invoices.length + 1;

  return String(nextNumber).padStart(2, "0");
}

export default function InvoiceForm() {
  const params = useParams();
  const id = params.id ? parseInt(params.id) : null;
  const isEdit = !!id;

  const [, setLocation] = useLocation();
  const { data: invoiceToEdit, isLoading: loadingInvoice } = useInvoiceData(id);
  const { data: invoices } = useInvoicesData();
  const { data: products } = useProductsData();
  const { data: customers } = useCustomersData();
  const { data: settings } = useSettingsData();
  const { createInvoice, updateInvoice, isCreating, isUpdating } = useInvoiceMutations();

  const [invoiceNumber, setInvoiceNumber] = useState("01");
  const [invoiceNumberTouched, setInvoiceNumberTouched] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [items, setItems] = useState<UIInvoiceItem[]>([emptyItem()]);
  const [cgstPercent, setCgstPercent] = useState<string>("");
  const [sgstPercent, setSgstPercent] = useState<string>("");
  const [igstPercent, setIgstPercent] = useState<string>("");
  const [roundingOption, setRoundingOption] = useState<InvoiceInputRoundingOption>("nearest");
  const [customRounding, setCustomRounding] = useState<number>(0);

  useEffect(() => {
    if (isEdit && invoiceToEdit) {
      setInvoiceNumber(invoiceToEdit.invoiceNumber || "01");
      setInvoiceNumberTouched(true);
      setInvoiceDate(invoiceToEdit.invoiceDate.split("T")[0]);
      setCustomerName(invoiceToEdit.customerName);
      setCustomerAddress(invoiceToEdit.customerAddress);
      setCustomerGstin(invoiceToEdit.customerGstin || "");
      setCustomerId(invoiceToEdit.customerId);

      const firstItem = invoiceToEdit.items?.[0];
      const derivedCgst =
        typeof firstItem?.cgstPercent === "number"
          ? firstItem.cgstPercent
          : invoiceToEdit.subTotal > 0
            ? (invoiceToEdit.totalCgst / invoiceToEdit.subTotal) * 100
            : 0;
      const derivedSgst =
        typeof firstItem?.sgstPercent === "number"
          ? firstItem.sgstPercent
          : invoiceToEdit.subTotal > 0
            ? (invoiceToEdit.totalSgst / invoiceToEdit.subTotal) * 100
            : 0;
      const derivedIgst =
        typeof firstItem?.igstPercent === "number"
          ? firstItem.igstPercent
          : invoiceToEdit.subTotal > 0
            ? (invoiceToEdit.totalIgst / invoiceToEdit.subTotal) * 100
            : 0;

      setCgstPercent(Number.isFinite(derivedCgst) && derivedCgst > 0 ? derivedCgst.toFixed(2) : "");
      setSgstPercent(Number.isFinite(derivedSgst) && derivedSgst > 0 ? derivedSgst.toFixed(2) : "");
      setIgstPercent(Number.isFinite(derivedIgst) && derivedIgst > 0 ? derivedIgst.toFixed(2) : "");

      setItems((invoiceToEdit.items || []).map(i => recalcItem({ ...(i as UIInvoiceItem), autoRate: (i.category === "Shoes") })));
      setRoundingOption(invoiceToEdit.roundingOption as InvoiceInputRoundingOption);
      setCustomRounding(invoiceToEdit.customRounding || 0);
    }
  }, [isEdit, invoiceToEdit]);

  useEffect(() => {
    if (!isEdit && !invoiceToEdit && !invoiceNumberTouched) {
      setInvoiceNumber(getNextInvoiceNumber(invoices));
    }
  }, [isEdit, invoiceToEdit, invoices, invoiceNumberTouched]);

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

  const recalcItem = (item: UIInvoiceItem): UIInvoiceItem => {
    const up = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 0;
    const cgstP = parsePercentInput(cgstPercent);
    const sgstP = parsePercentInput(sgstPercent);
    const igstP = parsePercentInput(igstPercent);
    const totalTaxPercent = cgstP + sgstP + igstP;
    const cat = (item.category || "Shoes") as Category;
    // Determine rate: use autoRate when enabled, otherwise use manual rate
    const useAuto = item.autoRate ?? (cat === "Shoes");
    const rate = useAuto ? calcShoeRate(up, totalTaxPercent) : (Number(item.rate) || 0);
    const amount = rate * qty;

    return {
      ...item,
      rate,
      amount,
      cgstPercent: cgstP,
      cgstAmount: amount * (cgstP / 100),
      sgstPercent: sgstP,
      sgstAmount: amount * (sgstP / 100),
      igstPercent: igstP,
      igstAmount: amount * (igstP / 100),
      autoRate: useAuto,
    };
  };

  useEffect(() => {
    setItems((prev) => prev.map((item) => recalcItem(item)));
  }, [cgstPercent, sgstPercent, igstPercent]);

  const updateRow = (index: number, field: keyof UIInvoiceItem, value: any) => {
    const newItems = [...items];
    // Always store productId as a number so the backend can match it in the DB
    const coercedValue = field === "productId" ? (value ? parseInt(value) : undefined) : value;
    let item = { ...newItems[index], [field]: coercedValue };

    // Auto-fill from product selection
    if (field === "productId" && coercedValue) {
      const p = products?.find(x => x.id === coercedValue);
      if (p) {
        item.description = p.name;
        item.hsnCode = p.hsnCode;
        item.unitPrice = p.unitPrice;
        item.category = (p.category || "Shoes") as Category;
        // Default autoRate based on category
        item.autoRate = item.category === "Shoes" ? true : false;
        if (item.category !== "Shoes") item.rate = 0;
      }
    }

    newItems[index] = recalcItem(item);
    setItems(newItems);
  };

  const updateRate = (index: number, value: string) => {
    // Manual rate override — mark autoRate false
    const newItems = [...items];
    const item = { ...newItems[index], rate: parseFloat(value) || 0, autoRate: false } as UIInvoiceItem;
    newItems[index] = recalcItem(item);
    setItems(newItems);
  };

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const subTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const cgstPercentValue = parsePercentInput(cgstPercent);
  const sgstPercentValue = parsePercentInput(sgstPercent);
  const igstPercentValue = parsePercentInput(igstPercent);
  const totalCgst = subTotal * (cgstPercentValue / 100);
  const totalSgst = subTotal * (sgstPercentValue / 100);
  const totalIgst = subTotal * (igstPercentValue / 100);
  const grandTotal = subTotal + totalCgst + totalSgst + totalIgst;

  let finalAmount = grandTotal;
  if (roundingOption === "nearest") finalAmount = Math.round(grandTotal);
  if (roundingOption === "custom") finalAmount = grandTotal + customRounding;

  const amountInWords = numberToWordsIndian(finalAmount);

  const handleSave = async () => {
    if (!invoiceNumber.trim() || !customerName || items.length === 0) return alert("Please fill required fields");
    const sanitizedItems: InvoiceItem[] = items.map(({ autoRate, ...rest }) => rest as InvoiceItem);

    const payload: InvoiceInput & { invoiceNumber: string } = {
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate, customerId, customerName, customerAddress, customerGstin,
      items: sanitizedItems, totalQuantity, subTotal, totalCgst, totalSgst, totalIgst, grandTotal,
      roundingOption, customRounding, finalAmount, amountInWords,
    };
    try {
      if (isEdit && id) {
        await updateInvoice(id, payload);
      } else {
        await createInvoice(payload);
        setLocation("/invoices");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save invoice");
    }
  };

  if (isEdit && loadingInvoice) return <AppLayout><div className="p-12 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div></AppLayout>;

  const previewInvoice: any = {
    invoiceNumber: invoiceNumber || invoiceToEdit?.invoiceNumber || "01",
    invoiceDate, customerName, customerAddress, customerGstin, items,
    totalQuantity, subTotal, totalCgst, totalSgst, totalIgst, grandTotal, finalAmount, amountInWords,
  };

  return (
    <AppLayout>
      <div className="no-print">
        <div className="flex items-center gap-4 mb-6">
          <button type="button" onClick={() => setLocation("/invoices")} className="p-2 hover:bg-secondary rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-3xl font-display font-bold text-foreground">{isEdit ? "Edit Invoice" : "Create New Invoice"}</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">

            {/* Buyer Details */}
            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
              <h2 className="text-lg font-bold mb-4">Buyer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Select Saved Customer</label>
                  <select className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary" onChange={handleCustomerSelect} value={customerId || ""}>
                    <option value="">-- Enter manually --</option>
                    {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Invoice Number *</label>
                  <input value={invoiceNumber} onChange={e => { setInvoiceNumberTouched(true); setInvoiceNumber(e.target.value); }} className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Invoice Date</label>
                  <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Customer Name *</label>
                  <input required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">GSTIN</label>
                  <input value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary uppercase" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Address *</label>
                  <textarea required value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full p-2.5 rounded-lg border-2 border-border focus:border-primary h-20 resize-none" />
                </div>
              </div>
            </div>

            {/* Product Items Table */}
            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 overflow-hidden">
              <h2 className="text-lg font-bold mb-4">Products / Services</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-225">
                  <thead>
                    <tr className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="p-3 w-8">#</th>
                      <th className="p-3">Product / Shoe Description</th>
                      <th className="p-3 w-20">HSN</th>
                      <th className="p-3 w-24">Unit Price</th>
                      <th className="p-3 w-16">Qty (Pairs)</th>
                      <th className="p-3 w-36">Rate</th>
                      <th className="p-3 w-22">Amount</th>
                      <th className="p-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {items.map((item, index) => {
                      const cat = (item.category || "Shoes") as Category;
                      const isShoe = cat === "Shoes";
                      return (
                        <tr key={index} className="group hover:bg-muted/10">
                          <td className="p-3 text-sm text-muted-foreground">{index + 1}</td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <select
                                className="p-1.5 border rounded text-sm w-full"
                                value={item.productId || ""}
                                onChange={e => updateRow(index, "productId", e.target.value)}
                              >
                                <option value="">— Select product —</option>
                                {products?.map(p => (
                                  <option key={p.id} value={p.id}>[{p.category}] {p.name}</option>
                                ))}
                              </select>
                              <input
                                placeholder="Description"
                                value={item.description}
                                onChange={e => updateRow(index, "description", e.target.value)}
                                className="p-1.5 border rounded text-sm w-full"
                              />
                              <span className={`self-start text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                cat === "Shoes" ? "bg-blue-100 text-blue-700" :
                                cat === "Socks" ? "bg-purple-100 text-purple-700" :
                                "bg-amber-100 text-amber-700"
                              }`}>{cat}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <input type="number" value={item.quantity === 0 ? "" : item.quantity} onChange={e => updateRow(index, "quantity", e.target.value)} className="w-full p-1.5 border rounded text-sm" />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={Boolean((item as UIInvoiceItem).autoRate)}
                                  onChange={e => {
                                    const newItems = [...items];
                                    const updated = { ...newItems[index], autoRate: e.target.checked } as UIInvoiceItem;
                                    newItems[index] = recalcItem(updated);
                                    setItems(newItems);
                                  }}
                                />
                                <span className="select-none">Auto</span>
                              </label>

                              {((item as UIInvoiceItem).autoRate) ? (
                                <span className="w-36 p-2 block text-sm font-mono bg-muted/40 rounded text-center">
                                  {Number(item.rate) > 0 ? Number(item.rate).toFixed(2) : "\u00A0"}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.rate || ""}
                                  placeholder="Manual"
                                  onChange={e => updateRate(index, e.target.value)}
                                  className="w-36 p-1.5 border-2 border-dashed border-amber-400 rounded text-sm bg-amber-50"
                                />
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-sm font-mono bg-muted/30 text-right pr-3">
                            {Number(item.amount) > 0 ? Number(item.amount).toFixed(2) : ""}
                          </td>
                          <td className="p-3">
                            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button type="button" onClick={() => setItems([...items, emptyItem()])} className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Row (Shoes)
                </button>
                <button type="button" onClick={() => setItems([...items, { ...emptyItem(), category: "Socks", rate: 0, autoRate: false }])} className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Socks Row
                </button>
                <button type="button" onClick={() => setItems([...items, { ...emptyItem(), category: "Bags", rate: 0, autoRate: false }])} className="px-4 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Bags Row
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold">Shoes:</span> Rate is auto-calculated from the GST percentages below.
                &nbsp;<span className="font-semibold">Socks/Bags:</span> Enter Rate manually.
                &nbsp;Leave GST fields blank to treat them as 0.
              </p>
            </div>

          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-primary/5 rounded-2xl shadow-sm border border-primary/20 p-6 sticky top-6">
              <h2 className="text-lg font-bold mb-4 border-b border-primary/10 pb-2">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Qty:</span> <span className="font-semibold">{totalQuantity}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sub Total:</span> <span className="font-mono">{formatCurrency(subTotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total CGST:</span> <span className="font-mono">{formatCurrency(totalCgst)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total SGST:</span> <span className="font-mono">{formatCurrency(totalSgst)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total IGST:</span> <span className="font-mono">{formatCurrency(totalIgst)}</span></div>

                <div className="pt-3 border-t border-primary/10">
                  <div className="flex justify-between font-bold text-base mb-2"><span>Grand Total:</span> <span className="font-mono">{formatCurrency(grandTotal)}</span></div>
                </div>

                <div className="pt-3 border-t border-primary/10">
                  <label className="text-xs font-medium block mb-2 text-primary">GST Percentages</label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="text-xs text-muted-foreground">
                      CGST%
                      <input
                        type="text"
                        value={cgstPercent}
                        placeholder="0"
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setCgstPercent(normalizePercentText(e.target.value))}
                        className="w-full mt-1 p-1.5 border rounded"
                      />
                    </label>
                    <label className="text-xs text-muted-foreground">
                      SGST%
                      <input
                        type="text"
                        value={sgstPercent}
                        placeholder="0"
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setSgstPercent(normalizePercentText(e.target.value))}
                        className="w-full mt-1 p-1.5 border rounded"
                      />
                    </label>
                    <label className="text-xs text-muted-foreground">
                      IGST%
                      <input
                        type="text"
                        value={igstPercent}
                        placeholder="0"
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setIgstPercent(normalizePercentText(e.target.value))}
                        className="w-full mt-1 p-1.5 border rounded"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-primary/10">
                  <label className="text-xs font-medium block mb-2 text-primary">Rounding</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="radio" name="rounding" checked={roundingOption === "decimal"} onChange={() => setRoundingOption("decimal")} /> Keep Decimal</label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="radio" name="rounding" checked={roundingOption === "nearest"} onChange={() => setRoundingOption("nearest")} /> Round to Nearest (₹{Math.round(grandTotal)})</label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="radio" name="rounding" checked={roundingOption === "custom"} onChange={() => setRoundingOption("custom")} /> Custom Adjust:
                      <input type="number" step="0.01" className="w-16 p-1 border rounded" disabled={roundingOption !== "custom"} value={customRounding === 0 ? "" : customRounding} onChange={e => setCustomRounding(Number(e.target.value) || 0)} />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-primary/20">
                  <div className="flex justify-between font-bold text-xl text-primary">
                    <span>FINAL:</span> <span>{formatCurrency(finalAmount)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground italic mt-2 leading-tight">{amountInWords}</div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                  <button type="button" onClick={handleSave} disabled={isCreating || isUpdating} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  <Save className="w-5 h-5" /> {isCreating || isUpdating ? "Saving..." : "Save Invoice"}
                </button>
                <button type="button" onClick={() => window.print()} className="w-full py-3 bg-white border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" /> Print / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {settings && <InvoicePrintView invoice={previewInvoice} settings={settings} />}
    </AppLayout>
  );
}
