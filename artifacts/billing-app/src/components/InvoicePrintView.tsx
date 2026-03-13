import { type Invoice, type ShopSettings, type InvoiceItem } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";

interface InvoicePrintViewProps {
  invoice: Invoice;
  settings: ShopSettings;
}

type Category = "Shoes" | "Socks" | "Bags";

/**
 * Build an ordered rendering list:
 * - Shoes appear inline with no heading row
 * - First occurrence of Socks gets a SOCKS heading row before it
 * - First occurrence of Bags gets a BAGS heading row before it
 */
function buildRenderList(items: InvoiceItem[]): Array<{ type: "heading"; label: string } | { type: "item"; item: InvoiceItem; sno: number }> {
  const result: Array<{ type: "heading"; label: string } | { type: "item"; item: InvoiceItem; sno: number }> = [];
  const seenCategories = new Set<string>();
  let sno = 0;

  for (const item of items) {
    const cat = (item.category || "Shoes") as Category;
    if (cat !== "Shoes" && !seenCategories.has(cat)) {
      seenCategories.add(cat);
      result.push({ type: "heading", label: cat.toUpperCase() });
    }
    sno++;
    result.push({ type: "item", item, sno });
  }

  return result;
}

export function InvoicePrintView({ invoice, settings }: InvoicePrintViewProps) {
  const renderList = buildRenderList(invoice.items);

  return (
    <div className="invoice-print-container bg-white p-8 max-w-[210mm] mx-auto text-black font-sans text-[12px] leading-tight">
      {/* Shop Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold uppercase mb-1">{settings.shopName}</h1>
        <p className="text-sm">{settings.address}, {settings.city}, {settings.state} - {settings.pincode}</p>
        <p className="text-sm">Phone: {settings.phone} | Email: {settings.email}</p>
        <p className="font-bold mt-1 text-sm">GSTIN: {settings.gstin}</p>
      </div>

      <div className="text-center font-bold text-lg mb-2 underline print-only">TAX INVOICE</div>

      {/* Invoice Info & Buyer Details */}
      <div className="flex border print-border mb-4">
        <div className="w-1/2 p-3 border-r print-border-r">
          <p className="text-xs text-gray-600 mb-1">Details of Receiver / Billed To:</p>
          <p className="font-bold text-sm uppercase">{invoice.customerName}</p>
          <p className="whitespace-pre-line">{invoice.customerAddress}</p>
          {invoice.customerGstin && (
            <p className="mt-1"><span className="font-bold">GSTIN/UIN:</span> {invoice.customerGstin}</p>
          )}
        </div>
        <div className="w-1/2 p-3 flex flex-col justify-center">
          <div className="flex justify-between mb-2">
            <span className="font-bold">Invoice No:</span>
            <span>{invoice.invoiceNumber || "DRAFT"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Date:</span>
            <span>{new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full print-table border-collapse mb-4 text-[11px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-1.5 border print-border w-[5%] text-center">S.No</th>
            <th className="p-1.5 border print-border w-[28%]">Description of Goods</th>
            <th className="p-1.5 border print-border w-[10%] text-center">HSN/SAC</th>
            <th className="p-1.5 border print-border w-[7%] text-center">Qty</th>
            <th className="p-1.5 border print-border w-[9%] text-right">Rate</th>
            <th className="p-1.5 border print-border w-[10%] text-right">Amount</th>
            <th className="p-1.5 border print-border w-[6%] text-center">CGST%</th>
            <th className="p-1.5 border print-border w-[8%] text-right">CGST Amt</th>
            <th className="p-1.5 border print-border w-[6%] text-center">SGST%</th>
            <th className="p-1.5 border print-border w-[8%] text-right">SGST Amt</th>
          </tr>
        </thead>
        <tbody>
          {renderList.map((row, idx) => {
            if (row.type === "heading") {
              return (
                <tr key={`heading-${idx}`}>
                  <td colSpan={10} className="p-1.5 border print-border font-bold text-center bg-gray-50 tracking-widest text-[11px] uppercase">
                    {row.label}
                  </td>
                </tr>
              );
            }
            const { item, sno } = row;
            const cat = (item.category || "Shoes") as Category;
            const isShoe = cat === "Shoes";
            return (
              <tr key={`item-${idx}`}>
                <td className="p-1.5 border print-border text-center">{sno}</td>
                <td className="p-1.5 border print-border">{item.description}</td>
                <td className="p-1.5 border print-border text-center">{item.hsnCode}</td>
                <td className="p-1.5 border print-border text-center">{item.quantity}</td>
                <td className="p-1.5 border print-border text-right">
                  {isShoe || Number(item.rate) > 0 ? Number(item.rate).toFixed(2) : ""}
                </td>
                <td className="p-1.5 border print-border text-right">{Number(item.amount).toFixed(2)}</td>
                <td className="p-1.5 border print-border text-center">{item.cgstPercent}%</td>
                <td className="p-1.5 border print-border text-right">{Number(item.cgstAmount).toFixed(2)}</td>
                <td className="p-1.5 border print-border text-center">{item.sgstPercent}%</td>
                <td className="p-1.5 border print-border text-right">{Number(item.sgstAmount).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-50">
            <td colSpan={3} className="p-1.5 border print-border text-right">Total:</td>
            <td className="p-1.5 border print-border text-center">{invoice.totalQuantity}</td>
            <td className="p-1.5 border print-border"></td>
            <td className="p-1.5 border print-border text-right">{Number(invoice.subTotal).toFixed(2)}</td>
            <td className="p-1.5 border print-border"></td>
            <td className="p-1.5 border print-border text-right">{Number(invoice.totalCgst).toFixed(2)}</td>
            <td className="p-1.5 border print-border"></td>
            <td className="p-1.5 border print-border text-right">{Number(invoice.totalSgst).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Totals Summary */}
      <div className="flex border print-border mb-4">
        <div className="w-2/3 p-3 border-r print-border-r flex flex-col justify-end">
          <p className="text-xs text-gray-600">Amount Chargeable (in words)</p>
          <p className="font-bold text-sm italic">{invoice.amountInWords}</p>
        </div>
        <div className="w-1/3">
          <div className="flex justify-between p-1.5 border-b print-border-b">
            <span>Total Before Tax:</span>
            <span>{formatCurrency(invoice.subTotal)}</span>
          </div>
          <div className="flex justify-between p-1.5 border-b print-border-b">
            <span>Add: CGST:</span>
            <span>{formatCurrency(invoice.totalCgst)}</span>
          </div>
          <div className="flex justify-between p-1.5 border-b print-border-b">
            <span>Add: SGST:</span>
            <span>{formatCurrency(invoice.totalSgst)}</span>
          </div>
          <div className="flex justify-between p-1.5 border-b print-border-b bg-gray-100 font-bold text-sm">
            <span>Grand Total:</span>
            <span>{formatCurrency(invoice.finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-12">
        <div className="w-1/2">
          <p className="text-xs text-gray-500 mb-1">Terms & Conditions:</p>
          <ol className="text-[10px] text-gray-600 list-decimal pl-4">
            <li>Goods once sold will not be taken back.</li>
            <li>Subject to local jurisdiction.</li>
          </ol>
        </div>
        <div className="w-1/3 text-center">
          <p className="font-bold mb-8">For {settings.shopName}</p>
          <p className="border-t print-border-t pt-1">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
