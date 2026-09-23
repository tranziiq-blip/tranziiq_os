import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 
"@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { BUDGET_CATEGORIES } from "@/lib/financeConstants";
import { DEPARTMENTS } from "@/lib/hrConstants";

const empty = { budget_name: "", category: "fuel", department: "Transport", 
period_month: new Date().toISOString().slice(0, 7) + "-01", budgeted_amount: 0, 
actual_amount: 0, budgeted_distance_km: 0, notes: "" };

export default function BudgetDialog({ open, onOpenChange, editing, onSaved }) 
{
 const { toast } = useToast();
 const [form, setForm] = useState(empty);
 const [saving, setSaving] = useState(false);

 useEffect(() => { if (open) setForm(editing ? { ...empty, ...editing } : 
empty); }, [open, editing]);
 const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

 const save = async () => {
 if (!form.budget_name || !form.period_month) { toast({ title: "Name & period  required", variant: "destructive" }); return; }
 setSaving(true);
 try {
 const payload = { ...form, budgeted_amount: Number(form.budgeted_amount) || 
0, actual_amount: Number(form.actual_amount) || 0, budgeted_distance_km: 
Number(form.budgeted_distance_km) || 0, budgeted_cpk: 
(Number(form.budgeted_amount) || 0) / (Number(form.budgeted_distance_km) || 1) 
};
 if (editing?.id) await base44.entities.Budget.update(editing.id, payload);
 else await base44.entities.Budget.create(payload);
 toast({ title: editing?.id ? "Budget updated" : "Budget created" });
 onSaved?.(); onOpenChange(false);
 } catch (e) { toast({ title: "Error", description: e.message, variant: 
"destructive" }); }
 finally { setSaving(false); }
 };

 const F = ({ label, children, full }) => <div className={full ? "col-span-2  grid gap-1.5" : "grid gap-1.5"}><Label 
className="text-xs">{label}</Label>{children}</div>;

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-lg">
 <DialogHeader><DialogTitle>{editing?.id ? "Edit Budget" : "Create  Budget"}</DialogTitle></DialogHeader>
 <div className="grid grid-cols-2 gap-3 py-1">
 <F label="Budget Name *" full><Input value={form.budget_name} onChange={(e) => set("budget_name", e.target.value)} placeholder="e.g. September Fuel Budget" 
/></F>
 <F label="Category"><Select value={form.category} onValueChange={(v) => 
set("category", v)}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{BUDGET_CATEGORIES.map((c) => <SelectItem 
key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent></Select></F>
 <F label="Department"><Select value={form.department} onValueChange={(v) => 
set("department", v)}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} 
value={d}>{d}</SelectItem>)}</SelectContent></Select></F>
 <F label="Period (Month)"><Input type="date" value={form.period_month} 
onChange={(e) => set("period_month", e.target.value)} /></F>
 <F label="Budgeted Amount (R)"><Input type="number" 
value={form.budgeted_amount} onChange={(e) => set("budgeted_amount", 
e.target.value)} /></F>
 <F label="Actual Amount (R)"><Input type="number" value={form.actual_amount} 
onChange={(e) => set("actual_amount", e.target.value)} /></F>
 <F label="Budgeted Distance (km)"><Input type="number" 
value={form.budgeted_distance_km} onChange={(e) => set("budgeted_distance_km", 
e.target.value)} /></F>
 <F label="Notes" full><Textarea value={form.notes} onChange={(e) => 
set("notes", e.target.value)} rows={2} /></F>
 </div>
 <DialogFooter><Button variant="outline" onClick={() => 
onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={saving} 
className="bg-brand-navy hover:bg-brand-navy/90">{saving ? "Saving…" : 
"Save"}</Button></DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
