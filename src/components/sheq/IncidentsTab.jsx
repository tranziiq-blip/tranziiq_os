import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from 
"@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 
"@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 
"@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, ArrowRight } from "lucide-react";

const TYPE_META = { incident: "bg-blue-100 text-blue-700", near_miss: 
"bg-amber-100 text-amber-700", injury: "bg-rose-100 text-rose-700", 
property_damage: "bg-orange-100 text-orange-700", environmental: "bg-teal-100  text-teal-700" };
const SEVERITY = { low: "bg-slate-100 text-slate-600", medium: "bg-amber-100  text-amber-700", high: "bg-orange-100 text-orange-700", critical: "bg-red-100  text-red-700" };
const STATUS_FLOW = ["reported", "investigating", "action_pending", 
"resolved"];
const STATUS_META = { reported: { label: "Reported", color: "bg-rose-100  text-rose-700" }, investigating: { label: "Investigating", color: "bg-amber-100  text-amber-700" }, action_pending: { label: "Action Pending", color: 
"bg-sky-100 text-sky-700" }, resolved: { label: "Resolved", color: 
"bg-emerald-100 text-emerald-700" } };

export default function IncidentsTab({ incidents, drivers, trucks, 
onDataChanged }) {
 const { toast } = useToast();
 const [search, setSearch] = useState("");
 const [open, setOpen] = useState(false);
 const [investigate, setInvestigate] = useState(null);
 const [form, setForm] = useState({ incident_type: "incident", severity: 
"medium", driver_id: "", truck_id: "", location: "", description: "", 
reported_by: "" });
 const [invForm, setInvForm] = useState({ root_cause: "", corrective_action: 
"", investigated_by: "" });

 const driverName = (id) => drivers.find((d) => d.id === id)?.full_name || "";
 const truckReg = (id) => trucks.find((t) => t.id === id)?.registration_number 
|| "";
 const filtered = incidents.filter((i) => !search || (i.description || 
"").toLowerCase().includes(search.toLowerCase()) || (i.location || 
"").toLowerCase().includes(search.toLowerCase()) || (i.driver_name || 
"").toLowerCase().includes(search.toLowerCase()));

 const openNew = () => { setForm({ incident_type: "incident", severity: 
"medium", driver_id: "", truck_id: "", location: "", description: "", 
reported_by: "" }); setOpen(true); };
 const save = async () => {
 if (!form.description) { toast({ title: "Description required", variant: 
"destructive" }); return; }
 await base44.entities.IncidentReport.create({ ...form, incident_date: new 
Date().toISOString(), driver_name: driverName(form.driver_id), 
truck_registration: truckReg(form.truck_id), status: "reported" });
 toast({ title: "Incident reported" }); setOpen(false); onDataChanged?.();
 };
 const openInv = (i) => { setInvestigate(i); setInvForm({ root_cause: 
i.root_cause || "", corrective_action: i.corrective_action || "", 
investigated_by: i.investigated_by || "" }); };
 const advance = async (i) => { const idx = STATUS_FLOW.indexOf(i.status); if 
(idx >= STATUS_FLOW.length - 1) return; const next = STATUS_FLOW[idx + 1]; 
const updates = { status: next }; if (next === "resolved") 
updates.resolution_date = new Date().toISOString().slice(0, 10); await 
base44.entities.IncidentReport.update(i.id, updates); toast({ title: `Status: 
${STATUS_META[next].label}` }); onDataChanged?.(); };
 const saveInv = async () => { await 
base44.entities.IncidentReport.update(investigate.id, { root_cause: 
invForm.root_cause, corrective_action: invForm.corrective_action, 
investigated_by: invForm.investigated_by, status: investigate.status === 
"reported" ? "investigating" : investigate.status }); toast({ title: 
"Investigation saved" }); setInvestigate(null); onDataChanged?.(); };

 return (
 <div className="space-y-4">
 <Card className="border-border/60 shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between pb-3">
 <CardTitle className="text-base font-semibold">Incident Register</CardTitle>
 <div className="flex items-center gap-2">
 <div className="relative"><Search size={15} className="absolute left-2.5  top-2.5 text-muted-foreground" /><Input value={search} onChange={(e) => 
setSearch(e.target.value)} placeholder="Search…" className="h-9 w-40 pl-8" 
/></div>
 <Button onClick={openNew} className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"><Plus size={16} /> Report</Button>
 </div>
 </CardHeader>
 <CardContent className="p-0 overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="border-b border-border bg-muted/40"><tr><th className="px-4  py-3 text-left font-medium text-muted-foreground">Date</th><th className="px-4  py-3 text-left font-medium text-muted-foreground">Type</th><th className="px-4  py-3 text-left font-medium text-muted-foreground">Severity</th><th 
className="px-4 py-3 text-left font-medium text-muted-foreground">Driver / 
Truck</th><th className="px-4 py-3 text-left font-medium  text-muted-foreground">Description</th><th className="px-4 py-3 text-left  font-medium text-muted-foreground">Status</th><th className="px-4  py-3"></th></tr></thead>
 <tbody>
 {filtered.length === 0 && <tr><td colSpan={7} className="text-center  text-muted-foreground py-8">No incidents found.</td></tr>}
 {filtered.map((i) => (
 <tr key={i.id} className="border-b border-border/50 last:border-0  hover:bg-muted/30">
 <td className="px-4 py-3 text-xs text-muted-foreground">{i.incident_date ? 
new Date(i.incident_date).toLocaleDateString() : "—"}</td>
 <td className="px-4 py-3"><Badge 
className={TYPE_META[i.incident_type]}>{i.incident_type.replace("_", "  ")}</Badge></td>
 <td className="px-4 py-3"><Badge 
className={SEVERITY[i.severity]}>{i.severity}</Badge></td>
 <td className="px-4 py-3 text-xs">{i.driver_name || "—"}<br /><span 
className="text-muted-foreground">{i.truck_registration || ""}</span></td>
 <td className="px-4 py-3 max-w-xs"><p className="truncate text-xs  text-muted-foreground">{i.description}</p></td>
 <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs 
font-medium 
${STATUS_META[i.status].color}`}>{STATUS_META[i.status].label}</span></td>
 <td className="px-4 py-3"><div className="flex items-center gap-1"><button 
onClick={() => openInv(i)} title="Investigate" className="rounded-md p-1.5  text-brand-blue hover:bg-brand-blue/10"><Search size={15} /></button>{i.status 
!== "resolved" && <button onClick={() => advance(i)} title="Advance" 
className="rounded-md p-1.5 text-brand-teal hover:bg-brand-teal/10"><ArrowRight 
size={15} /></button>}</div></td>
 </tr>
 ))}
 </tbody>
 </table>
 </CardContent>
 </Card>

 {/* Report dialog */}
 <Dialog open={open} onOpenChange={setOpen}><DialogContent>
 <DialogHeader><DialogTitle>Report Incident</DialogTitle></DialogHeader>
 <div className="grid gap-4 py-2">
 <div className="grid grid-cols-2 gap-4">
 <div className="grid gap-2"><Label>Type</Label><Select 
value={form.incident_type} onValueChange={(v) => setForm({ ...form, 
incident_type: v })}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{["incident","near_miss","injury","property_damage","environmental"].map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", "  ")}</SelectItem>)}</SelectContent></Select></div>
 <div className="grid gap-2"><Label>Severity</Label><Select 
value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v 
})}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{["low","medium","high","critical"].map((s) => 
<SelectItem key={s} value={s} 
className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="grid gap-2"><Label>Driver</Label><Select 
value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v 
})}><SelectTrigger><SelectValue placeholder="Select driver" 
/></SelectTrigger><SelectContent>{drivers.map((d) => <SelectItem key={d.id} 
value={d.id}>{d.full_name}</SelectItem>)}</SelectContent></Select></div>
 <div className="grid gap-2"><Label>Truck</Label><Select value={form.truck_id} 
onValueChange={(v) => setForm({ ...form, truck_id: v 
})}><SelectTrigger><SelectValue placeholder="Select truck" 
/></SelectTrigger><SelectContent>{trucks.map((t) => <SelectItem key={t.id} 
value={t.id}>{t.registration_number}</SelectItem>)}</SelectContent></Select></div>
 </div>
 <div className="grid gap-2"><Label>Location</Label><Input 
value={form.location} onChange={(e) => setForm({ ...form, location: 
e.target.value })} /></div>
 <div className="grid gap-2"><Label>Description</Label><Textarea 
value={form.description} onChange={(e) => setForm({ ...form, description: 
e.target.value })} rows={3} /></div>
 <div className="grid gap-2"><Label>Reported By</Label><Input 
value={form.reported_by} onChange={(e) => setForm({ ...form, reported_by: 
e.target.value })} /></div>
 </div>
 <DialogFooter><Button variant="outline" onClick={() => 
setOpen(false)}>Cancel</Button><Button onClick={save} className="bg-brand-navy  hover:bg-brand-navy/90">Submit</Button></DialogFooter>
 </DialogContent></Dialog>

 {/* Investigation dialog */}
 <Dialog open={!!investigate} onOpenChange={(o) => !o && 
setInvestigate(null)}><DialogContent>
 <DialogHeader><DialogTitle>Incident Investigation</DialogTitle></DialogHeader>
 {investigate && (
 <div className="space-y-4 py-2">
 <div className="rounded-lg bg-muted/50 p-3"><div className="flex flex-wrap  items-center gap-2"><Badge 
className={TYPE_META[investigate.incident_type]}>{investigate.incident_type.replace("_", 
" ")}</Badge><Badge 
className={SEVERITY[investigate.severity]}>{investigate.severity}</Badge><span 
className="text-xs text-muted-foreground">{investigate.driver_name} · 
{investigate.truck_registration}</span></div><p className="mt-2 text-sm  text-foreground">{investigate.description}</p>{investigate.location && <p 
className="mt-1 text-xs text-muted-foreground">📍 
{investigate.location}</p>}</div>
 <div className="grid gap-2"><Label>Root Cause Analysis</Label><Textarea 
value={invForm.root_cause} onChange={(e) => setInvForm({ ...invForm, 
root_cause: e.target.value })} rows={3} placeholder="Identify the underlying  cause(s)…" /></div>
 <div className="grid gap-2"><Label>Corrective Action</Label><Textarea 
value={invForm.corrective_action} onChange={(e) => setInvForm({ ...invForm, 
corrective_action: e.target.value })} rows={3} placeholder="Action taken /  required to prevent recurrence…" /></div>
 <div className="grid gap-2"><Label>Investigated By</Label><Input 
value={invForm.investigated_by} onChange={(e) => setInvForm({ ...invForm, 
investigated_by: e.target.value })} /></div>
 </div>
 )}
 <DialogFooter><Button variant="outline" onClick={() => 
setInvestigate(null)}>Close</Button><Button onClick={saveInv} 
className="bg-brand-navy hover:bg-brand-navy/90">Save 
Investigation</Button></DialogFooter>
 </DialogContent></Dialog>
 </div>
 );
}
