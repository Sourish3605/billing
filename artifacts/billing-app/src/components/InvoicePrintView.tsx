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
  const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString("en-IN");
  const effectiveCgstPercent =
    Number(invoice.subTotal) > 0
      ? (Number(invoice.totalCgst) / Number(invoice.subTotal)) * 100
      : 0;
  const effectiveSgstPercent =
    Number(invoice.subTotal) > 0
      ? (Number(invoice.totalSgst) / Number(invoice.subTotal)) * 100
      : 0;
  const itemRowCount = renderList.filter((row) => row.type === "item").length;
  const fillerRows = Math.max(0, 8 - itemRowCount);

  return (
    <div className="invoice-print-container relative overflow-hidden bg-white p-6 max-w-[210mm] mx-auto text-black font-sans text-[12px] leading-tight border print-border">
      {/* Shop Header */}
      <div className="relative z-10 text-center pb-3 mb-3 border-b print-border-b">
        <h1 className="text-[30px] font-black uppercase tracking-wide mb-1">{settings.shopName}</h1>
        <p className="text-[12px] font-semibold tracking-wider uppercase">Footwear And Accessories</p>
        <p className="text-[12px]">{settings.address}, {settings.city}, {settings.state} - {settings.pincode}</p>
        <p className="text-[12px]">Phone: {settings.phone} | Email: {settings.email}</p>
        <p className="font-bold mt-1 text-[13px]">GSTIN: {settings.gstin}</p>
      </div>

      <div className="relative z-10 text-center font-bold text-[26px] mb-3 tracking-wide print-only">TAX INVOICE</div>

      {/* Invoice Info & Buyer Details */}
      <div className="relative z-10 flex border print-border mb-4">
        <div className="w-1/2 p-3 border-r print-border-r">
          <p className="text-[12px] font-bold text-gray-800 mb-1 uppercase tracking-wide">Details of Receiver / Billed To</p>
          <p className="font-bold text-[14px] uppercase">{invoice.customerName}</p>
          <p className="whitespace-pre-line text-[12px]">{invoice.customerAddress}</p>
          {invoice.customerGstin && (
            <p className="mt-1 text-[12px]"><span className="font-bold">GSTIN/UIN:</span> {invoice.customerGstin}</p>
          )}
        </div>
        <div className="w-1/2 p-3 flex flex-col justify-center">
          <div className="flex justify-between mb-2 text-[13px]">
            <span className="font-bold">Invoice No:</span>
            <span>{invoice.invoiceNumber || "DRAFT"}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="font-bold">Date:</span>
            <span>{invoiceDate}</span>
          </div>
          <div className="flex justify-between mt-2 text-[12px]">
            <span className="font-bold">Invoice Type:</span>
            <span>Retail Footwear Bill</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="relative z-10 w-full print-table border-collapse mb-4 text-[11px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-1.5 border print-border w-[5%] text-center font-bold">S.No</th>
            <th className="p-1.5 border print-border w-[37%] font-bold">Description of Goods</th>
            <th className="p-1.5 border print-border w-[9%] text-center font-bold">HSN/SAC</th>
            <th className="p-1.5 border print-border w-[13%] text-right font-bold">Unit Price</th>
            <th className="p-1.5 border print-border w-[10%] text-center font-bold">Qty (Pairs)</th>
            <th className="p-1.5 border print-border w-[10%] text-right font-bold">Rate</th>
            <th className="p-1.5 border print-border w-[16%] text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {renderList.map((row, idx) => {
            if (row.type === "heading") {
              return (
                <tr key={`heading-${idx}`}>
                  <td colSpan={7} className="p-1.5 border print-border font-bold text-center bg-gray-50 tracking-widest text-[11px] uppercase">
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
                <td className="p-1.5 border print-border">
                  <div className="font-medium">{item.description}</div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-600">{cat}</div>
                </td>
                <td className="p-1.5 border print-border text-center">{item.hsnCode}</td>
                <td className="p-1.5 border print-border text-right">
                  {Number(item.unitPrice) > 0 ? Number(item.unitPrice).toFixed(2) : ""}
                </td>
                <td className="p-1.5 border print-border text-center">{item.quantity}</td>
                <td className="p-1.5 border print-border text-right">
                  {isShoe || Number(item.rate) > 0 ? Number(item.rate).toFixed(2) : ""}
                </td>
                <td className="p-1.5 border print-border text-right">{Number(item.amount).toFixed(2)}</td>
              </tr>
            );
          })}
          {Array.from({ length: fillerRows }).map((_, index) => (
            <tr key={`filler-${index}`}>
              <td className="p-1.5 border print-border text-center">&nbsp;</td>
              <td className="p-1.5 border print-border">&nbsp;</td>
              <td className="p-1.5 border print-border">&nbsp;</td>
              <td className="p-1.5 border print-border">&nbsp;</td>
              <td className="p-1.5 border print-border">&nbsp;</td>
              <td className="p-1.5 border print-border">&nbsp;</td>
              <td className="p-1.5 border print-border">&nbsp;</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-50">
            <td colSpan={4} className="p-1.5 border print-border text-right">Total:</td>
            <td className="p-1.5 border print-border text-center">{invoice.totalQuantity}</td>
            <td className="p-1.5 border print-border"></td>
            <td className="p-1.5 border print-border text-right">{Number(invoice.subTotal).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Totals Summary */}
      <div className="relative z-10 flex border print-border mb-4">
        <div className="w-2/3 p-3 border-r print-border-r flex flex-col justify-end">
          <p className="text-[12px] text-gray-700">Amount Chargeable (in words)</p>
          <p className="font-bold text-[18px] italic">{invoice.amountInWords}</p>
        </div>
        <div className="w-1/3">
          <div className="flex justify-between p-1.5 border-b print-border-b">
            <span className="font-medium">Total Before Tax:</span>
            <span>{formatCurrency(invoice.subTotal)}</span>
          </div>
          <div className="flex justify-between p-1.5 border-b print-border-b">
            <span className="font-medium">Add: CGST ({effectiveCgstPercent.toFixed(2)}%):</span>
            <span>{formatCurrency(invoice.totalCgst)}</span>
          </div>
          <div className="flex justify-between p-1.5 border-b print-border-b">
            <span className="font-medium">Add: SGST ({effectiveSgstPercent.toFixed(2)}%):</span>
            <span>{formatCurrency(invoice.totalSgst)}</span>
          </div>
          <div className="flex justify-between p-1.5 border-b print-border-b bg-gray-100 font-black text-[18px]">
            <span>Grand Total:</span>
            <span>{formatCurrency(invoice.finalAmount)}</span>
          </div>
          <div className="flex justify-between p-1.5 text-[10px] text-gray-600">
            <span>E.&amp;O.E</span>
            <span>All values in INR</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex justify-between mt-10">
        <div className="w-1/2">
          <p className="text-[12px] font-semibold text-gray-700 mb-1">Terms & Conditions:</p>
          <ol className="text-[11px] text-gray-700 list-decimal pl-4">
            <li>Goods once sold will not be taken back.</li>
            <li>Subject to local jurisdiction.</li>
          </ol>
          <p className="text-[10px] text-gray-500 mt-3 italic">This is a computer-generated invoice.</p>
        </div>
        <div className="w-1/3 text-center">
          <p className="font-bold mb-2 text-[13px]">For {settings.shopName}</p>
          <div className="h-12 mb-2 flex items-end justify-center">
            <img
              src={`${import.meta.env.BASE_URL}images/signature.svg`}
              alt="Authorized signature"
              className="h-12 max-w-42.5 object-contain"
            />
          </div>
          <p className="border-t print-border-t pt-1 text-[12px]">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
