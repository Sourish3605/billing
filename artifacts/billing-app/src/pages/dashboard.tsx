import { AppLayout } from "@/components/layout/AppLayout";
import { useDashboardData } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/utils";
import { Loader2, IndianRupee, FileText, Package, AlertTriangle, PlusCircle } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data, isLoading } = useDashboardData();

  if (isLoading || !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const statCards = [
    { title: "Today's Sales", value: formatCurrency(data.todaySales || 0), icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Total Invoices", value: data.totalInvoices || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Total Products", value: data.totalProducts || 0, icon: Package, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Low Stock Items", value: data.lowStockProducts?.length || 0, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your shop's performance</p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/products" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2">
            <Package className="h-4 w-4" /> Add Product
          </Link>
          <Link href="/invoices" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2">
            <FileText className="h-4 w-4" /> History
          </Link>
          <Link href="/invoices/new" className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2">
            <PlusCircle className="h-5 w-5" /> Create New Bill
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
          </div>
          <span className="bg-rose-100 text-rose-700 py-1 px-3 rounded-full text-xs font-bold">
            {data.lowStockProducts?.length || 0} Items
          </span>
        </div>
        
        {data.lowStockProducts && data.lowStockProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Product Name</th>
                  <th className="p-4 font-medium">HSN Code</th>
                  <th className="p-4 font-medium">Unit Price</th>
                  <th className="p-4 font-medium">Current Stock</th>
                  <th className="p-4 font-medium">Min Level</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.lowStockProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{p.name}</td>
                    <td className="p-4 text-muted-foreground">{p.hsnCode}</td>
                    <td className="p-4 text-muted-foreground">{formatCurrency(p.unitPrice)}</td>
                    <td className="p-4 font-bold text-rose-600">{p.quantity}</td>
                    <td className="p-4 text-muted-foreground">{p.minStockLevel}</td>
                    <td className="p-4">
                      <span className="bg-rose-100 text-rose-700 py-1 px-2 rounded text-xs font-semibold uppercase">Restock</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Inventory is looking good. No low stock items.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
