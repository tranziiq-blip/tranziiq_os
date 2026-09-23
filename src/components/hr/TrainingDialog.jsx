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
import { TRAINING_STATUS } from "@/lib/hrConstants";

const TRAINING_TYPES = ["Defensive Driving", "Dangerous Goods", "First Aid", 
"Forklift Operation", "Fire Safety", "HIV/AIDS Awareness", "Customer Service", 
"Hazmat Handling", "Fatigue Management", "Driver Wellness", "Load Securing", 
"Other"];
const empty = { employee_id: "", training_type: "Defensive Driving", 
description: "", required_by_date: "", status: "not_started", completion_date: 
"", certification_expiry: "", provider: "", cost: 0, notes: "" };

export default function TrainingDialog({ open, onOpenChange, employees, 
onSaved }) {
 const { toast } = useToast();
 const [form, setForm] = useState(empty);
 const [saving, setSaving] = useState(false);

 useEffect(() => { if (open) setForm(empty); }, [open]);
 const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

 const save = async () => {
 if (!form.employee_id) { toast({ title: "Employee required", variant: 
"destructive" }); return; }
 const emp = employees.find((e) => e.id === form.employee_id);
 setSaving(true);
 try {
 await base44.entities.TrainingRequirement.create({ ...form, cost: 
Number(form.cost) || 0, employee_name: emp?.full_name || "", department: 
emp?.department || "", job_title: emp?.job_title || "" });
 toast({ title: "Training requirement recorded" });
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
 <DialogHeader><DialogTitle>Training Requirement</DialogTitle></DialogHeader>
 <div className="grid grid-cols-2 gap-3 py-1">
 <F label="Employee *" full><Select value={form.employee_id} 
onValueChange={(v) => set("employee_id", v)}><SelectTrigger><SelectValue 
placeholder="Select employee" 
/></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} 
value={e.id}>{e.full_name} — 
{e.job_title}</SelectItem>)}</SelectContent></Select></F>
 <F label="Training Type"><Select value={form.training_type} 
onValueChange={(v) => set("training_type", v)}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{TRAINING_TYPES.map((t) => <SelectItem key={t} 
value={t}>{t}</SelectItem>)}</SelectContent></Select></F>
 <F label="Status"><Select value={form.status} onValueChange={(v) => 
set("status", v)}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{Object.entries(TRAINING_STATUS).map(([k, s]) => <SelectItem key={k} 
value={k}>{s.label}</SelectItem>)}</SelectContent></Select></F>
 <F label="Required By"><Input type="date" value={form.required_by_date} 
onChange={(e) => set("required_by_date", e.target.value)} /></F>
 <F label="Completion Date"><Input type="date" value={form.completion_date} 
onChange={(e) => set("completion_date", e.target.value)} /></F>
 <F label="Provider"><Input value={form.provider} onChange={(e) => 
set("provider", e.target.value)} placeholder="Training provider" /></F>
 <F label="Cost (R)"><Input type="number" value={form.cost} onChange={(e) => 
set("cost", e.target.value)} /></F>
 <F label="Cert Expiry"><Input type="date" value={form.certification_expiry} 
onChange={(e) => set("certification_expiry", e.target.value)} /></F>
 <F label="Description" full><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Training  description / scope…" /></F>
 <F label="Notes" full><Input value={form.notes} onChange={(e) => set("notes", 
e.target.value)} /></F>
 </div>
 <DialogFooter><Button variant="outline" onClick={() => 
onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={saving} 
className="bg-brand-navy hover:bg-brand-navy/90">{saving ? "Saving…" : 
"Record"}</Button></DialogFooter>
 </DialogContent>
 </Dialog>
 );
} 
