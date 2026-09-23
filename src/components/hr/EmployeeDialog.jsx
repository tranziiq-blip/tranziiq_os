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
import { DEPARTMENTS, JOB_TITLES, EMPLOYMENT_TYPES, EMPLOYEE_STATUS, PROVINCES 
} from "@/lib/hrConstants";

const empty = { full_name: "", employee_number: "", id_number: "", job_title: 
"Driver", department: "Transport", employment_type: "permanent", start_date: 
"", end_date: "", status: "active", phone: "", email: "", address_line1: "", 
address_line2: "", city: "", province: "", postal_code: "", bank_name: "", 
account_number: "", branch_code: "", account_type: "", next_of_kin_name: "", 
next_of_kin_relationship: "", next_of_kin_phone: "", qualifications: "", 
driver_id: "" };

export default function EmployeeDialog({ open, onOpenChange, editing, onSaved 
}) {
 const { toast } = useToast();
 const [form, setForm] = useState(empty);
 const [saving, setSaving] = useState(false);

 useEffect(() => { if (open) setForm(editing ? { ...empty, ...editing } : 
empty); }, [open, editing]);
 const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

 const save = async () => {
 if (!form.full_name) { toast({ title: "Name required", variant: "destructive" 
}); return; }
 setSaving(true);
 try {
 if (editing?.id) await base44.entities.Employee.update(editing.id, form);
 else await base44.entities.Employee.create(form);
 toast({ title: editing?.id ? "Employee updated" : "Employee added" });
 onSaved?.(); onOpenChange(false);
 } catch (e) { toast({ title: "Error", description: e.message, variant: 
"destructive" }); }
 finally { setSaving(false); }
 };

 const F = ({ label, children, full }) => <div className={full ? "col-span-2  grid gap-1.5" : "grid gap-1.5"}><Label 
className="text-xs">{label}</Label>{children}</div>;

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
 <DialogHeader><DialogTitle>{editing?.id ? "Edit Employee" : "Add  Employee"}</DialogTitle></DialogHeader>
 <div className="space-y-4 py-1">
 <p className="text-xs font-semibold uppercase tracking-wider  text-muted-foreground">Personal Details</p>
 <div className="grid grid-cols-2 gap-3">
 <F label="Full Name *"><Input value={form.full_name} onChange={(e) => 
set("full_name", e.target.value)} /></F>
 <F label="Employee Number"><Input value={form.employee_number} onChange={(e) => set("employee_number", e.target.value)} /></F>
 <F label="ID Number"><Input value={form.id_number} onChange={(e) => 
set("id_number", e.target.value)} /></F>
 <F label="Phone"><Input value={form.phone} onChange={(e) => set("phone", 
e.target.value)} /></F>
 <F label="Email"><Input value={form.email} onChange={(e) => set("email", 
e.target.value)} /></F>
 </div>
 <p className="text-xs font-semibold uppercase tracking-wider  text-muted-foreground border-t border-border/40 pt-3">Employment</p>
 <div className="grid grid-cols-2 gap-3">
 <F label="Job Title"><Select value={form.job_title} onValueChange={(v) => 
set("job_title", v)}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{JOB_TITLES.map((j) => <SelectItem key={j} 
value={j}>{j}</SelectItem>)}</SelectContent></Select></F>
 <F label="Department"><Select value={form.department} onValueChange={(v) => 
set("department", v)}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} 
value={d}>{d}</SelectItem>)}</SelectContent></Select></F>
 <F label="Employment Type"><Select value={form.employment_type} 
onValueChange={(v) => set("employment_type", v)}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem 
key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent></Select></F>
 <F label="Status"><Select value={form.status} onValueChange={(v) => 
set("status", v)}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{Object.entries(EMPLOYEE_STATUS).map(([k, s]) => <SelectItem key={k} 
value={k}>{s.label}</SelectItem>)}</SelectContent></Select></F>
 <F label="Start Date"><Input type="date" value={form.start_date} 
onChange={(e) => set("start_date", e.target.value)} /></F>
 <F label="End Date"><Input type="date" value={form.end_date} onChange={(e) => 
set("end_date", e.target.value)} /></F>
 </div>
 <p className="text-xs font-semibold uppercase tracking-wider  text-muted-foreground border-t border-border/40 pt-3">Address</p>
 <div className="grid grid-cols-2 gap-3">
 <F label="Address Line 1" full><Input value={form.address_line1} 
onChange={(e) => set("address_line1", e.target.value)} /></F>
 <F label="Address Line 2" full><Input value={form.address_line2} 
onChange={(e) => set("address_line2", e.target.value)} /></F>
 <F label="City"><Input value={form.city} onChange={(e) => set("city", 
e.target.value)} /></F>
 <F label="Province"><Select value={form.province || "none"} 
onValueChange={(v) => set("province", v === "none" ? "" : 
v)}><SelectTrigger><SelectValue placeholder="Select" 
/></SelectTrigger><SelectContent><SelectItem 
value="none">—</SelectItem>{PROVINCES.map((p) => <SelectItem key={p} 
value={p}>{p}</SelectItem>)}</SelectContent></Select></F>
 <F label="Postal Code"><Input value={form.postal_code} onChange={(e) => 
set("postal_code", e.target.value)} /></F>
 </div>
 <p className="text-xs font-semibold uppercase tracking-wider  text-muted-foreground border-t border-border/40 pt-3">Banking Details</p>
 <div className="grid grid-cols-2 gap-3">
 <F label="Bank Name"><Input value={form.bank_name} onChange={(e) => 
set("bank_name", e.target.value)} /></F>
 <F label="Account Number"><Input value={form.account_number} onChange={(e) => 
set("account_number", e.target.value)} /></F>
 <F label="Branch Code"><Input value={form.branch_code} onChange={(e) => 
set("branch_code", e.target.value)} /></F>
 <F label="Account Type"><Input value={form.account_type} onChange={(e) => 
set("account_type", e.target.value)} placeholder="Cheque / Savings" /></F>
 </div>
 <p className="text-xs font-semibold uppercase tracking-wider  text-muted-foreground border-t border-border/40 pt-3">Next of Kin</p>
 <div className="grid grid-cols-2 gap-3">
 <F label="Name"><Input value={form.next_of_kin_name} onChange={(e) => 
set("next_of_kin_name", e.target.value)} /></F>
 <F label="Relationship"><Input value={form.next_of_kin_relationship} 
onChange={(e) => set("next_of_kin_relationship", e.target.value)} /></F>
 <F label="Phone"><Input value={form.next_of_kin_phone} onChange={(e) => 
set("next_of_kin_phone", e.target.value)} /></F>
 </div>
 <p className="text-xs font-semibold uppercase tracking-wider  text-muted-foreground border-t border-border/40 pt-3">Qualifications</p>
 <F label="Qualifications & Skills" full><Textarea value={form.qualifications} 
onChange={(e) => set("qualifications", e.target.value)} rows={2} 
placeholder="List qualifications, certifications, skills…" /></F>
 </div>
 <DialogFooter><Button variant="outline" onClick={() => 
onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={saving} 
className="bg-brand-navy hover:bg-brand-navy/90">{saving ? "Saving…" : 
"Save"}</Button></DialogFooter>
 </DialogContent>
 </Dialog>
 );
} 
