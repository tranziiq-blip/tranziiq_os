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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { FAILURE_CATEGORIES } from "@/lib/engineeringChecklists";
import { Search, AlertTriangle } from "lucide-react";

export default function RootCauseAnalysisDialog({ open, onOpenChange, rca, 
onComplete }) {
 const { toast } = useToast();
 const [form, setForm] = useState({ failure_category: "engine", 
failure_component: "", root_cause: "", contributing_factors: "", 
corrective_action: "", preventive_action: "", completed_by: "" });
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 if (rca) {
 setForm({
 failure_category: rca.failure_category || "engine",
 failure_component: rca.failure_component || "",
 root_cause: rca.root_cause || "",
 contributing_factors: rca.contributing_factors || "",
 corrective_action: rca.corrective_action || "",
 preventive_action: rca.preventive_action || "",
 completed_by: rca.completed_by || ""
 });
 }
 }, [rca]);

 const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

 const submit = async () => {
 if (!form.root_cause) { toast({ title: "Root cause required", variant: 
"destructive" }); return; }
 if (!form.completed_by) { toast({ title: "Your name required", variant: 
"destructive" }); return; }
 setSaving(true);
 try {
 await base44.entities.RootCauseAnalysis.update(rca.id, {
 ...form, status: "completed", completed_at: new Date().toISOString()
 });
 toast({ title: "Root cause analysis completed" });
 onComplete?.();
 onOpenChange(false);
 } catch (e) {
 toast({ title: "Error", description: e.message, variant: "destructive" });
 } finally {
 setSaving(false);
 }
 };

 if (!rca) return null;
 const jobCompleted = rca.job_card_id ? null : null; // just a placeholder to avoid lint
 const slaDeadline = rca.created_date ? new Date(new 
Date(rca.created_date).getTime() + 24 * 3600000) : null;
 const hoursLeft = slaDeadline ? Math.ceil((slaDeadline - Date.now()) / 
3600000) : null;
 const isOverdue = hoursLeft !== null && hoursLeft < 0;

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2"><Search size={18} 
className="text-brand-navy" /> Root Cause Analysis</DialogTitle>
 </DialogHeader>
 <div className="space-y-3">
 <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2  text-sm">
 <span className="font-medium">{rca.truck_registration || "—"}</span>
 {hoursLeft !== null && (
 <Badge className={isOverdue ? "bg-rose-100 text-rose-700" : hoursLeft <= 4 ? 
"bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
 {isOverdue ? <><AlertTriangle size={10} className="mr-1" />Overdue</> : 
`${hoursLeft}h left`}
 </Badge>
 )}
 </div>
 <div className="grid gap-1.5">
 <Label className="text-xs">Failure Category</Label>
 <Select value={form.failure_category} onValueChange={(v) => 
set("failure_category", v)}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>{FAILURE_CATEGORIES.map((c) => <SelectItem key={c.key} 
value={c.key}>{c.label}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div className="grid gap-1.5"><Label className="text-xs">Failed 
Component</Label><Input value={form.failure_component} onChange={(e) => 
set("failure_component", e.target.value)} placeholder="e.g. Alternator, brake  chamber" /></div>
 <div className="grid gap-1.5"><Label className="text-xs">Root Cause 
*</Label><Textarea value={form.root_cause} onChange={(e) => set("root_cause", 
e.target.value)} rows={2} placeholder="What caused the failure?" /></div>
 <div className="grid gap-1.5"><Label className="text-xs">Contributing 
Factors</Label><Textarea value={form.contributing_factors} onChange={(e) => 
set("contributing_factors", e.target.value)} rows={2} placeholder="What  contributed to the failure?" /></div>
 <div className="grid gap-1.5"><Label className="text-xs">Corrective Action 
Taken</Label><Textarea value={form.corrective_action} onChange={(e) => 
set("corrective_action", e.target.value)} rows={2} placeholder="What was done  to fix it?" /></div>
 <div className="grid gap-1.5"><Label className="text-xs">Preventive 
Action</Label><Textarea value={form.preventive_action} onChange={(e) => 
set("preventive_action", e.target.value)} rows={2} placeholder="What should be  done to prevent recurrence?" /></div>
 <div className="grid gap-1.5"><Label className="text-xs">Completed By (name) 
*</Label><Input value={form.completed_by} onChange={(e) => set("completed_by", 
e.target.value)} placeholder="Full name" /></div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
 <Button onClick={submit} disabled={saving} className="bg-brand-navy  hover:bg-brand-navy/90">{saving ? "Saving…" : "Complete RCA"}</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
