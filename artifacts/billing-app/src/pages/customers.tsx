import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCustomersData, useCustomerMutations } from "@/hooks/use-customers";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { type Customer, type CustomerInput } from "@workspace/api-client-react";

export default function Customers() {
  const { data: customers, isLoading } = useCustomersData();
  const { createCustomer, updateCustomer, deleteCustomer, isCreating, isUpdating, isDeleting } = useCustomerMutations();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState<CustomerInput>({
    name: "", address: "", phone: "", gstin: ""
  });

  const openNew = () => {
    setEditingCustomer(null);
    setFormData({ name: "", address: "", phone: "", gstin: "" });
    setIsModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({ name: c.name, address: c.address, phone: c.phone, gstin: c.gstin || "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, formData);
    } else {
      await createCustomer(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your buyers and clients</p>
        </div>
        <button onClick={openNew} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <Plus className="h-5 w-5" /> Add Customer
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
        ) : !customers?.length ? (
          <div className="p-12 text-center text-muted-foreground">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium border-b border-border/50">Name</th>
                  <th className="p-4 font-medium border-b border-border/50">Phone</th>
                  <th className="p-4 font-medium border-b border-border/50">GSTIN</th>
                  <th className="p-4 font-medium border-b border-border/50">Address</th>
                  <th className="p-4 font-medium border-b border-border/50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{c.name}</td>
                    <td className="p-4 text-muted-foreground">{c.phone}</td>
                    <td className="p-4 text-muted-foreground font-mono text-sm">{c.gstin || '-'}</td>
                    <td className="p-4 text-muted-foreground truncate max-w-[200px]">{c.address}</td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => {if(confirm("Delete?")) deleteCustomer(c.id)}} disabled={isDeleting} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-border/50 bg-muted/20">
              <h2 className="text-xl font-bold">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border-2 border-border focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border-2 border-border focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GSTIN (Optional)</label>
                <input type="text" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border-2 border-border focus:border-primary outline-none transition-all uppercase" placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border-2 border-border focus:border-primary outline-none transition-all resize-none h-24" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary">Cancel</button>
                <button type="submit" disabled={isCreating || isUpdating} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-md">
                  {isCreating || isUpdating ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
