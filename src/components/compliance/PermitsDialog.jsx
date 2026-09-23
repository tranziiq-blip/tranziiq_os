import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 
"@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 
"@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { jurisdictionName, getJurisdiction } from "@/lib/complianceContent";
import { daysUntil } from "@/lib/complianceEngine";

const emptyPermit = { jurisdiction_code: "", permit_number: "", 
permit_authority: "", valid_from: "", valid_to: "", escort_required: false, 
escort_count: 0, travel_time_window: "", approved_route: "", route_survey_url: 
"", notes: "" };

export default function PermitsDialog({ open, onOpenChange, profile, onSaved 
}) {
 const { toast } = useToast();
 const [permits, setPermits] = useState([]);
 const [form, setForm] = useState(null);
 const [saving, setSaving] = useState(false);

 const load = async () => {
 if (!profile) return;
 setPermits(await base44.entities.AbnormalLoadPermit.filter({ profile_id: 
profile.id }));
 };
 useEffect(() => { load(); setForm(null); }, [open, profile?.id]); // eslint-disable-line

 if (!profile) return null;

 const selectJurisdiction = (code) => {
 const authority = getJurisdiction(code)?.rules?.abnormal?.permitAuthority || 
"";
 setForm((f) => ({ ...f, jurisdiction_code: code, permit_authority: authority 
}));
 };

 const save = async () => {
 if (!form.jurisdiction_code) { toast({ title: "Select the issuing  jurisdiction", variant: "destructive" }); return; }
 if (!form.permit_number) { toast({ title: "Permit number required", variant: 
"destructive" }); return; }
 setSaving(true);
 try {
 const payload = {
 profile_id: profile.id, load_id: profile.load_id, load_number: 
profile.load_number,
 jurisdiction_code: form.jurisdiction_code, jurisdiction_name: 
jurisdictionName(form.jurisdiction_code),
 permit_number: form.permit_number, permit_authority: form.permit_authority || 
"",
 valid_from: form.valid_from || "", valid_to: form.valid_to || "",
 escort_required: !!form.escort_required, escort_count: 
Number(form.escort_count) || 0,
 travel_time_window: form.travel_time_window || "", approved_route: 
form.approved_route || "",
 route_survey_url: form.route_survey_url || "", notes: form.notes || ""
 };
 if (form.id) await base44.entities.AbnormalLoadPermit.update(form.id, 
payload);
 else await base44.entities.AbnormalLoadPermit.create(payload);
 toast({ title: form.id ? "Permit updated" : "Permit added", description: 
`${jurisdictionName(form.jurisdiction_code)} — tracked with its own validity 
window` });
 setForm(null);
 load();
 onSaved();
 } catch (e) {
 toast({ title: "Error saving permit", description: e.message, variant: 
"destructive" });
 } finally { setSaving(false); }
 };

 const permitStatus = (p) => {
 const to = daysUntil(p.valid_to), from = daysUntil(p.valid_from);
 if (p.valid_from && from > 0) return { label: `Starts in ${from}d`, cls: 
"bg-sky-100 text-sky-700" };
 if (p.valid_to && to !== null && to < 0) return { label: "Expired", cls: 
"bg-rose-100 text-rose-700" };
 if (to !== null && to <= 14) return { label: `${to}d left`, cls: 
"bg-amber-100 text-amber-700" };
 return { label: "Valid", cls: "bg-emerald-100 text-emerald-700" };
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2"><FileText size={16} /> 
Abnormal Load Permits — {profile.load_number}</DialogTitle>
 <p className="text-xs font-normal text-muted-foreground">One permit per 
province/country crossed — each expires independently. Load: 
{profile.load_height_m ?? "—"}×{profile.load_width_m ?? 
"—"}×{profile.load_length_m ?? "—"}m · {profile.mass_tons ?? "—"}t</p>
 </DialogHeader>

 <div className="space-y-3 py-1">
 {permits.length === 0 && !form && (
 <div className="rounded-lg border border-dashed border-border p-6  text-center">
 <p className="text-xs text-muted-foreground">No permits captured yet. Every 
jurisdiction on the route needs its own permit before dispatch.</p>
 </div>
 )}
 {permits.map((p) => {
 const st = permitStatus(p);
 return (
 <div key={p.id} className="rounded-lg border border-border/60 p-3">
 <div className="flex items-start justify-between gap-2">
 <div>
 <p className="text-xs font-semibold text-brand-navy">{p.jurisdiction_name || 
jurisdictionName(p.jurisdiction_code)} · Permit {p.permit_number}</p>
 <p className="text-[11px] text-muted-foreground">{p.permit_authority || "—"} 
· valid {p.valid_from || "?"} → {p.valid_to || "?"}</p>
 {p.travel_time_window && <Badge variant="outline" className="mt-1  text-[10px]">Travel window: {p.travel_time_window}</Badge>}
 {p.escort_required && <Badge variant="outline" className="mt-1 ml-1  text-[10px]">Escort × {p.escort_count || 1}</Badge>}
 </div>
 <div className="flex items-center gap-1">
 <Badge className={`text-[10px] ${st.cls}`}>{st.label}</Badge>
 <button onClick={() => setForm({ ...p })} className="rounded-md p-1.5  text-muted-foreground hover:bg-muted"><Pencil size={14} /></button>
 <button onClick={async () => { await 
base44.entities.AbnormalLoadPermit.delete(p.id); load(); onSaved(); }} 
className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50  hover:text-rose-600"><Trash2 size={14} /></button>
 </div>
 </div>
 </div>
 );
 })}

 {form ? (
 <div className="grid grid-cols-2 gap-3 rounded-lg border border-brand-teal/40  bg-brand-teal/5 p-3">
 <div className="grid gap-1.5"><Label className="text-xs">Jurisdiction 
(province / country)</Label>
 <Select value={form.jurisdiction_code || "none"} 
onValueChange={selectJurisdiction}>
 <SelectTrigger><SelectValue placeholder="Issuing authority" /></SelectTrigger>
 <SelectContent>
 <SelectItem value="none" disabled>Select jurisdiction…</SelectItem>
 {(profile.jurisdictions || []).map((j) => <SelectItem key={j} 
value={j}>{jurisdictionName(j)}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div className="grid gap-1.5"><Label className="text-xs">Permit 
Number</Label><Input value={form.permit_number} onChange={(e) => setForm({ 
...form, permit_number: e.target.value })} /></div>
 <div className="grid gap-1.5"><Label className="text-xs">Permit 
Authority</Label><Input value={form.permit_authority} onChange={(e) => 
setForm({ ...form, permit_authority: e.target.value })} /></div>
 <div className="grid gap-1.5"><Label className="text-xs">Travel Time 
Window</Label><Input value={form.travel_time_window} onChange={(e) => setForm({ 
...form, travel_time_window: e.target.value })} placeholder="Daylight only  06:00–18:00" /></div>
 <div className="grid gap-1.5"><Label className="text-xs">Valid 
From</Label><Input type="date" value={form.valid_from || ""} onChange={(e) => 
setForm({ ...form, valid_from: e.target.value })} /></div>
 <div className="grid gap-1.5"><Label className="text-xs">Valid 
To</Label><Input type="date" value={form.valid_to || ""} onChange={(e) => 
setForm({ ...form, valid_to: e.target.value })} /></div>
 <div className="grid gap-1.5 col-span-2"><Label className="text-xs">Approved 
Route (GPS adherence tracked against this)</Label><Input 
value={form.approved_route || ""} onChange={(e) => setForm({ ...form, 
approved_route: e.target.value })} placeholder="N1 → N4 via Kroonval, no  detours" /></div>
 <label className="flex items-center gap-2 text-xs"><input type="checkbox" 
checked={!!form.escort_required} onChange={(e) => setForm({ ...form, 
escort_required: e.target.checked })} className="h-4 w-4" /> Escort 
required</label>
 <div className="grid gap-1.5"><Label className="text-xs">Escort 
Count</Label><Input type="number" value={form.escort_count ?? 0} onChange={(e) => setForm({ ...form, escort_count: e.target.value })} /></div>
 <div className="grid gap-1.5 col-span-2"><Label className="text-xs">Route 
Survey Report Link</Label><Input value={form.route_survey_url || ""} 
onChange={(e) => setForm({ ...form, route_survey_url: e.target.value })} 
placeholder="https://…" /></div>
 <div className="col-span-2 flex justify-end gap-2">
 <Button variant="outline" size="sm" onClick={() => 
setForm(null)}>Cancel</Button>
 <Button size="sm" onClick={save} disabled={saving} className="bg-brand-navy  hover:bg-brand-navy/90">{saving ? "Saving…" : "Save Permit"}</Button>
 </div>
 </div>
 ) : (
 <Button onClick={() => setForm({ ...emptyPermit })} className="w-full gap-2  bg-brand-navy hover:bg-brand-navy/90"><Plus size={16} /> Add Permit</Button>
 )}
 </div>
 </DialogContent>
 </Dialog>
 );
}
