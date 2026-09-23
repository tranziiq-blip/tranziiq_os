import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 
"@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { KeyRound, Link2, Loader2 } from "lucide-react";

export default function ConnectIntegrationDialog({ open, onOpenChange, 
provider, existing, onSaved }) {
 const { toast } = useToast();
 const [form, setForm] = useState({ api_key: "", api_secret: "", base_url: "", 
account_id: "", company_id: "", sync_frequency: "manual" });
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 if (existing) {
 setForm({
 api_key: existing.api_key || "",
 api_secret: existing.api_secret || "",
 base_url: existing.base_url || "",
 account_id: existing.account_id || "",
 company_id: existing.company_id || "",
 sync_frequency: existing.sync_frequency || "manual"
 });
 } else {
 setForm({ api_key: "", api_secret: "", base_url: "", account_id: "", 
company_id: "", sync_frequency: "manual" });
 }
 }, [existing, open]);

 if (!provider) return null;

 const save = async () => {
 if (!form.api_key) { toast({ title: "API Key is required", variant: 
"destructive" }); return; }
 setSaving(true);
 try {
 if (existing) {
 await base44.entities.IntegrationConfig.update(existing.id, { ...form, 
connection_status: "connected", last_sync_date: new Date().toISOString() });
 } else {
 await base44.entities.IntegrationConfig.create({
 provider_name: provider.name,
 provider_category: provider.category,
 ...form,
 connection_status: "connected",
 last_sync_date: new Date().toISOString(),
 is_active: true
 });
 }
 toast({ title: `${provider.name} connected`, description: "Integration is now  active" });
 onSaved?.();
 onOpenChange(false);
 } catch (e) {
 toast({ title: "Connection failed", description: e.message, variant: 
"destructive" });
 } finally {
 setSaving(false);
 }
 };

 const needsBaseUrl = ["geotab", "erp", 
"accounting"].includes(provider.category) || provider.name === "Geotab";
 const needsAccountId = ["telematics", 
"fuel_card"].includes(provider.category);

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg  bg-brand-navy/10">
 {provider.icon ? <provider.icon size={16} className="text-brand-navy" /> : 
<Link2 size={16} className="text-brand-navy" />}
 </div>
 Connect {provider.name}
 </DialogTitle>
 </DialogHeader>

 <div className="space-y-3 py-2">
 <p className="text-xs text-muted-foreground">{provider.description}</p>

 <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
 <p className="text-xs text-amber-800">Enter your {provider.name} API 
credentials below. You can find these in your {provider.name} account settings 
or developer portal.</p>
 </div>

 <div className="grid gap-1.5">
 <Label className="text-xs flex items-center gap-1"><KeyRound size={12} /> API 
Key *</Label>
 <Input type="password" value={form.api_key} onChange={(e) => setForm({ 
...form, api_key: e.target.value })} placeholder="Your API key" />
 </div>

 <div className="grid gap-1.5">
 <Label className="text-xs">API Secret / Password (optional)</Label>
 <Input type="password" value={form.api_secret} onChange={(e) => setForm({ 
...form, api_secret: e.target.value })} placeholder="If required by provider" />
 </div>

 {needsAccountId && (
 <div className="grid gap-1.5">
 <Label className="text-xs">Account / Fleet ID</Label>
 <Input value={form.account_id} onChange={(e) => setForm({ ...form, 
account_id: e.target.value })} placeholder="Your account identifier" />
 </div>
 )}

 {needsBaseUrl && (
 <div className="grid gap-1.5">
 <Label className="text-xs">Base URL / Server</Label>
 <Input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: 
e.target.value })} placeholder="https://api.provider.com" />
 </div>
 )}

 <div className="grid grid-cols-2 gap-3">
 <div className="grid gap-1.5">
 <Label className="text-xs">Company ID (optional)</Label>
 <Input value={form.company_id} onChange={(e) => setForm({ ...form, 
company_id: e.target.value })} placeholder="If applicable" />
 </div>
 <div className="grid gap-1.5">
 <Label className="text-xs">Sync Frequency</Label>
 <Select value={form.sync_frequency} onValueChange={(v) => setForm({ ...form, 
sync_frequency: v })}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="manual">Manual</SelectItem>
 <SelectItem value="hourly">Hourly</SelectItem>
 <SelectItem value="daily">Daily</SelectItem>
 <SelectItem value="realtime">Realtime</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </div>

 <DialogFooter>
 <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
 <Button onClick={save} disabled={saving || !form.api_key} className="gap-2  bg-brand-navy hover:bg-brand-navy/90">
 {saving ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} 
/>}
 {existing ? "Update Connection" : "Connect"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}


production 
