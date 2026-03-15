import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSettingsData, useSettingsMutation } from "@/hooks/use-settings";
import { Loader2, Save, Store } from "lucide-react";
import { type ShopSettings } from "@workspace/api-client-react";

export default function Settings() {
  const { data, isLoading } = useSettingsData();
  const { updateSettings, isUpdating } = useSettingsMutation();
  
  const [formData, setFormData] = useState<ShopSettings>({
    shopName: "", address: "", city: "", state: "", pincode: "", gstin: "", phone: "", email: ""
  });

  useEffect(() => {
    if (data) setFormData(data);
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isLoading) return <AppLayout><div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Shop Settings</h1>
        <p className="text-muted-foreground mt-1">These details will be printed on all invoices</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 max-w-3xl overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-secondary/30 flex items-center gap-3">
          <Store className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Billing Address Profile</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Shop Name</label>
              <input required name="shopName" value={formData.shopName} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-border focus:border-primary outline-none" />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Address Line</label>
              <input required name="address" value={formData.address} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-border focus:border-primary outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">City</label>
              <input required name="city" value={formData.city} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-border focus:border-primary outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">State</label>
              <input required name="state" value={formData.state} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-border focus:border-primary outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Pincode</label>
              <input required name="pincode" value={formData.pincode} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-border focus:border-primary outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">GSTIN</label>
              <input required name="gstin" value={formData.gstin} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-border focus:border-primary outline-none uppercase font-mono" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Phone Number</label>
              <input required name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-border focus:border-primary outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Email Address</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-border focus:border-primary outline-none" />
            </div>
          </div>

          <div className="pt-6 border-t border-border/50 flex justify-end">
            <button type="submit" disabled={isUpdating} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
              {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
