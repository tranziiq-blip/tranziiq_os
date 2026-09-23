import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 
"@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 
"@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { registerNumber } from "@/lib/complianceEngine";

const DG_TYPES = ["spill", "geofence_breach", "route_deviation", "other"];
const CC_TYPES = ["temperature_breach", "other"];
const AB_TYPES = ["route_deviation", "time_window_violation", 
"geofence_breach", "other"];

export default function ComplianceIncidentDialog({ open, onOpenChange, 
activeLoad, driver, profile, onSaved }) {
 const { toast } = useToast();
 const [form, setForm] = useState({});
 const [saving, setSaving] = useState(false);

 const typeOptions = profile?.profile_type === "dg_hazmat" ? DG_TYPES : 
profile?.profile_type === "cold_chain" ? CC_TYPES : profile?.profile_type === 
"abnormal_load" ? AB_TYPES : ["other"];

 const save = async () => {
 if (!form.description) { toast({ title: "Describe the incident", variant: 
"destructive" }); return; }
 setSaving(true);
 try {
 const all = await base44.entities.ComplianceIncident.list();
 await base44.entities.ComplianceIncident.create({
 register_number: registerNumber(all.length),
 incident_type: form.incident_type || typeOptions[0],
 profile_type: profile?.profile_type, profile_id: profile?.id || "",
 load_id: activeLoad?.id || "", load_number: activeLoad?.load_number || "",
 truck_id: activeLoad?.truck_id || "", truck_registration: 
profile?.truck_registration || "",
 driver_id: driver?.id || "", driver_name: driver?.full_name || "",
 jurisdiction_code: form.jurisdiction_code || (profile?.jurisdictions || 
[])[0] || "",
 detected_at: new Date().toISOString(),
 severity: form.severity || "medium",
 location: form.location || "",
 description: form.description,
 emergency_services_notified: !!form.emergency_services_notified,
 status: "open",
 reported_by: driver?.full_name || "Driver app"
 });
 toast({
 title: "Incident logged to compliance register",
 description: "The compliance officer has been alerted. " + 
(form.emergency_services_notified ? "Emergency services marked as notified." : 
""),
 variant: form.severity === "critical" || form.emergency_services_notified ? 
"destructive" : "default"
 });
 setForm({});
 onSaved();
 } catch (e) {
 toast({ title: "Error reporting incident", description: e.message, variant: 
"destructive" });
 } finally { setSaving(false); }
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
 <DialogHeader><DialogTitle className="text-rose-600">Report Emergency / 
Deviation</DialogTitle></DialogHeader>
 <div className="grid gap-3 py-1">
 <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
 {profile?.profile_type === "dg_hazmat" ? "Spill / DG incident — an incident  record is created immediately and routed to the compliance officer with the  emergency contact list for the jurisdiction."
 : profile?.profile_type === "cold_chain" ? "Temperature breach — a cold-chain  excursion record is created for the compliance officer."
 : "Route / travel-window deviation — logged against the permit-approved route  for audit."}
 </p>
 <div className="grid gap-1.5"><Label className="text-xs">Incident Type</Label>
 <Select value={form.incident_type || typeOptions[0]} onValueChange={(v) => 
setForm({ ...form, incident_type: v })}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {typeOptions.map((t) => <SelectItem key={t} value={t} 
className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div className="grid gap-1.5"><Label className="text-xs">Severity</Label>
 <Select value={form.severity || "medium"} onValueChange={(v) => setForm({ 
...form, severity: v })}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>{["low", "medium", "high", "critical"].map((s) => <SelectItem 
key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div className="grid gap-1.5"><Label className="text-xs">Location (road / km 
marker / nearest town)</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
 <div className="grid gap-1.5"><Label className="text-xs">What 
happened?</Label><Textarea value={form.description || ""} onChange={(e) => 
setForm({ ...form, description: e.target.value })} rows={3} /></div>
 {profile?.profile_type === "dg_hazmat" && (
 <label className="flex items-start gap-2 text-xs">
 <input type="checkbox" checked={!!form.emergency_services_notified} 
onChange={(e) => setForm({ ...form, emergency_services_notified: 
e.target.checked })} className="mt-0.5 h-4 w-4" />
 Emergency services notified (activates the jurisdiction contact list)
 </label>
 )}
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
 <Button onClick={save} disabled={saving} className="bg-rose-600  hover:bg-rose-700">{saving ? "Reporting…" : "Report Incident"}</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
