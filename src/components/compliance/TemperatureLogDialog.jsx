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
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, 
ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Thermometer } from "lucide-react";
import { tempInRange, registerNumber } from "@/lib/complianceEngine";

const READING_TYPES = [
 { key: "pre_cool", label: "Pre-Cool" }, { key: "pickup", label: "Pickup" },
 { key: "in_transit", label: "In Transit" }, { key: "checkpoint", label: 
"Checkpoint" },
 { key: "border", label: "Border Crossing" }, { key: "offload", label: 
"Offload" },
 { key: "logger", label: "Logger Feed" }
];

export default function TemperatureLogDialog({ open, onOpenChange, profile, 
onSaved }) {
 const { toast } = useToast();
 const [readings, setReadings] = useState([]);
 const [excursions, setExcursions] = useState([]);
 const [form, setForm] = useState({ temperature_c: "", reading_type: 
"in_transit", recorded_by: "", notes: "" });
 const [saving, setSaving] = useState(false);

 const load = async () => {
 if (!profile) return;
 const [r, e] = await Promise.all([
 base44.entities.TemperatureReading.filter({ load_id: profile.load_id }, 
"recorded_at", 200),
 base44.entities.TemperatureExcursion.filter({ load_id: profile.load_id }, 
"-started_at", 50)
 ]);
 setReadings(r);
 setExcursions(e);
 };
 useEffect(() => { load(); }, [open, profile?.id]); // eslint-disable-line

 if (!profile) return null;

 const addReading = async () => {
 if (form.temperature_c === "") { toast({ title: "Temperature required", 
variant: "destructive" }); return; }
 setSaving(true);
 try {
 const temp = Number(form.temperature_c);
 const inRange = tempInRange(temp, profile);
 await base44.entities.TemperatureReading.create({
 load_id: profile.load_id, load_number: profile.load_number, profile_id: 
profile.id,
 recorded_at: new Date().toISOString(), temperature_c: temp,
 reading_type: form.reading_type, in_range: inRange,
 recorded_by: form.recorded_by || "", source: "manual", notes: form.notes || ""
 });

 if (!inRange) {
 const openExc = excursions.find((e) => e.status === "open");
 if (!openExc) {
 const exc = await base44.entities.TemperatureExcursion.create({
 load_id: profile.load_id, load_number: profile.load_number, profile_id: 
profile.id,
 started_at: new Date().toISOString(), min_temp_c: temp, max_temp_c: temp,
 severity: "medium", status: "open"
 });
 const all = await base44.entities.ComplianceIncident.list();
 await base44.entities.ComplianceIncident.create({
 register_number: registerNumber(all.length), incident_type: 
"temperature_breach",
 profile_type: "cold_chain", profile_id: profile.id, load_id: profile.load_id,
 load_number: profile.load_number, truck_id: profile.truck_id, 
truck_registration: profile.truck_registration,
 driver_id: profile.driver_id, driver_name: profile.driver_name,
 detected_at: new Date().toISOString(), severity: "medium",
 description: `Temperature ${temp}°C outside required range 
${profile.temp_min_c ?? "—"}–${profile.temp_max_c ?? "—"}°C — cold-chain 
excursion opened`,
 status: "open"
 });
 toast({ title: "THRESHOLD BREACH — excursion opened", description: `Alert 
raised to the compliance officer. Excursion report auto-generates if breach 
exceeds ${profile.logger_interval_minutes || 15} minutes.`, variant: 
"destructive" });
 } else {
 await base44.entities.TemperatureExcursion.update(openExc.id, {
 min_temp_c: Math.min(openExc.min_temp_c ?? temp, temp), max_temp_c: 
Math.max(openExc.max_temp_c ?? temp, temp)
 });
 toast({ title: "THRESHOLD BREACH — excursion continues", variant: 
"destructive" });
 }
 } else {
 const openExc = excursions.find((e) => e.status === "open");
 if (openExc) {
 const started = new Date(openExc.started_at).getTime();
 const duration = Math.max(1, Math.round((Date.now() - started) / 60000));
 await base44.entities.TemperatureExcursion.update(openExc.id, {
 ended_at: new Date().toISOString(), duration_minutes: duration, status: 
"closed",
 excursion_report_required: duration > (profile.logger_interval_minutes || 15),
 severity: duration > (profile.logger_interval_minutes || 15) ? "high" : 
"medium"
 });
 toast({ title: "Temperature back in range — excursion closed", description: 
`Breach duration: ${duration} min${duration > (profile.logger_interval_minutes 
|| 15) ? " — Cold-Chain Excursion Report required" : ""}` });
 } else {
 toast({ title: "Reading logged", description: `${temp}°C — within range` });
 }
 }
 setForm({ temperature_c: "", reading_type: "in_transit", recorded_by: "", 
notes: "" });
 load();
 onSaved();
 } catch (e) {
 toast({ title: "Error logging reading", description: e.message, variant: 
"destructive" });
 } finally { setSaving(false); }
 };

 const chartData = readings.map((r) => ({ time: new 
Date(r.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" 
}), temp: r.temperature_c, in: r.in_range }));

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2"><Thermometer size={16} /> 
Cold-Chain Log — {profile.load_number}</DialogTitle>
 <p className="text-xs font-normal text-muted-foreground">Required range 
{profile.temp_min_c ?? "—"}°C to {profile.temp_max_c ?? "—"}°C · logger 
{profile.logger_serial || "—"} · interval {profile.logger_interval_minutes || 
15} min</p>
 </DialogHeader>

 <div className="space-y-4 py-1">
 {readings.length > 0 ? (
 <div className="h-48 rounded-lg border border-border/60 p-2">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 
}}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
 <XAxis dataKey="time" tick={{ fontSize: 10 }} />
 <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
 <Tooltip formatter={(v) => [`${v}°C`]} />
 {profile.temp_min_c != null && <ReferenceLine y={profile.temp_min_c} 
stroke="#f97316" strokeDasharray="4 4" />}
 {profile.temp_max_c != null && <ReferenceLine y={profile.temp_max_c} 
stroke="#f97316" strokeDasharray="4 4" />}
 <Line type="monotone" dataKey="temp" stroke="#0d9488" strokeWidth={2} dot={{ 
r: 2 }} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 ) : (
 <p className="text-center text-xs text-muted-foreground py-6">No readings 
logged yet — capture the pre-cool and pickup readings before dispatch.</p>
 )}

 <div className="rounded-lg border border-border/60 p-3">
 <p className="mb-2 text-xs font-semibold uppercase tracking-wider  text-muted-foreground">Chain-of-Custody Readings</p>
 <div className="max-h-40 space-y-1 overflow-y-auto">
 {readings.slice().reverse().map((r) => (
 <div key={r.id} className="flex items-center justify-between text-xs">
 <span className="text-muted-foreground">{new 
Date(r.recorded_at).toLocaleString()} · {READING_TYPES.find((t) => t.key === 
r.reading_type)?.label || r.reading_type}{r.recorded_by ? ` · ${r.recorded_by}` 
: ""}</span>
 <Badge className={r.in_range ? "bg-emerald-100 text-emerald-700" : 
"bg-rose-100 text-rose-700"}>{r.temperature_c}°C</Badge>
 </div>
 ))}
 </div>
 </div>

 {excursions.length > 0 && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
 <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider  text-rose-700">Excursions</p>
 {excursions.map((e) => (
 <p key={e.id} className="text-[11px] text-rose-700">
 {new Date(e.started_at).toLocaleString()} → {e.status === "open" ? "ongoing" 
: `${e.duration_minutes} min`} · {e.min_temp_c}–{e.max_temp_c}°C 
{e.excursion_report_required ? "· Excursion Report REQUIRED" : ""}
 </p>
 ))}
 </div>
 )}

 <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 p-3  sm:grid-cols-4">
 <div className="grid gap-1.5"><Label className="text-xs">Temp 
(°C)</Label><Input type="number" step="0.1" value={form.temperature_c} 
onChange={(e) => setForm({ ...form, temperature_c: e.target.value })} /></div>
 <div className="grid gap-1.5"><Label className="text-xs">Handover 
Point</Label>
 <Select value={form.reading_type} onValueChange={(v) => setForm({ ...form, 
reading_type: v })}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>{READING_TYPES.map((t) => <SelectItem key={t.key} 
value={t.key}>{t.label}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div className="grid gap-1.5"><Label className="text-xs">Recorded 
By</Label><Input value={form.recorded_by} onChange={(e) => setForm({ ...form, 
recorded_by: e.target.value })} placeholder="Name" /></div>
 <div className="flex items-end"><Button onClick={addReading} 
disabled={saving} className="w-full gap-1.5 bg-brand-teal  hover:bg-brand-teal/90"><Plus size={14} /> Log</Button></div>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 );
}
