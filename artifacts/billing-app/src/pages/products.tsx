import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProductsData, useProductMutations } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { type Product, type ProductInput } from "@workspace/api-client-react";

const CATEGORIES = ["Shoes", "Socks", "Bags"] as const;
type Category = typeof CATEGORIES[number];

const categoryColors: Record<Category, string> = {
  Shoes: "bg-blue-100 text-blue-700",
  Socks: "bg-purple-100 text-purple-700",
  Bags: "bg-amber-100 text-amber-700",
};

export default function Products() {
  const { data: products, isLoading } = useProductsData();
  const { createProduct, updateProduct, deleteProduct, isCreating, isUpdating, isDeleting } = useProductMutations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<ProductInput>({
    name: "", hsnCode: "", unitPrice: 0, quantity: 0, minStockLevel: 5, category: "Shoes"
  });

  const openNew = () => {
    setEditingProduct(null);
    setFormData({ name: "", hsnCode: "", unitPrice: 0, quantity: 0, minStockLevel: 5, category: "Shoes" });
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name, hsnCode: p.hsnCode, unitPrice: p.unitPrice,
      quantity: p.quantity, minStockLevel: p.minStockLevel,
      category: (p.category as Category) || "Shoes"
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await updateProduct(editingProduct.id, formData);
    } else {
      await createProduct(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
    }
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage products and stock levels</p>
        </div>
        <button
          onClick={openNew}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Add Product
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
        ) : !products?.length ? (
          <div className="p-12 text-center text-muted-foreground">No products found. Add your first product.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium border-b border-border/50">Name</th>
                  <th className="p-4 font-medium border-b border-border/50">Category</th>
                  <th className="p-4 font-medium border-b border-border/50">HSN/SAC</th>
                  <th className="p-4 font-medium border-b border-border/50">Price</th>
                  <th className="p-4 font-medium border-b border-border/50">Stock</th>
                  <th className="p-4 font-medium border-b border-border/50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {products.map((p) => {
                  const isLowStock = p.quantity <= p.minStockLevel;
                  const cat = (p.category || "Shoes") as Category;
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium text-foreground">
                        {p.name}
                        {isLowStock && (
                          <span className="ml-2 inline-flex items-center gap-1 bg-rose-100 text-rose-700 py-0.5 px-2 rounded text-[10px] font-bold uppercase">
                            <AlertCircle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block py-0.5 px-2.5 rounded-full text-xs font-semibold ${categoryColors[cat]}`}>
                          {cat}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{p.hsnCode}</td>
                      <td className="p-4 text-muted-foreground">{formatCurrency(p.unitPrice)}</td>
                      <td className={`p-4 font-medium ${isLowStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {p.quantity} <span className="text-xs text-muted-foreground font-normal">(Min: {p.minStockLevel})</span>
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} disabled={isDeleting} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-border/50 bg-muted/20">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HSN/SAC Code</label>
                <input type="text" value={formData.hsnCode} onChange={e => setFormData({ ...formData, hsnCode: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Price (₹)</label>
                <input type="number" step="0.01" value={formData.unitPrice === 0 ? "" : formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-lg border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Available Qty</label>
                  <input type="number" value={formData.quantity === 0 ? "" : formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-lg border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Stock Level</label>
                  <input type="number" value={formData.minStockLevel} onChange={e => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-lg border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={isCreating || isUpdating} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50">
                  {isCreating || isUpdating ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
