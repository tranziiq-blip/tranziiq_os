import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 
"@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ShieldAlert, CloudRain, Eye, Wind, CloudLightning, Sun, Flag } from 
"lucide-react";

const WEATHER_OPTIONS = [
 { value: "clear", label: "Clear", icon: Sun },
 { value: "rain", label: "Rain", icon: CloudRain },
 { value: "fog", label: "Fog", icon: Eye },
 { value: "strong_wind", label: "Strong Wind", icon: Wind },
 { value: "storm", label: "Storm", icon: CloudLightning }
];

export default function RiskAssessmentDialog({ open, onOpenChange, driver, 
truck, onComplete }) {
 const { toast } = useToast();
 const [form, setForm] = useState({ weather: "clear", routeFamiliar: true, 
restAdequate: true, vehicleCondition: "good", hazards: "", mitigation: "", 
signature: "", newRiskFlagged: false, newRiskDescription: "" });
 const [acknowledgedRisks, setAcknowledgedRisks] = useState({});
 const [registerRisks, setRegisterRisks] = useState([]);
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 if (open) {
 setForm({ weather: "clear", routeFamiliar: true, restAdequate: true, 
vehicleCondition: "good", hazards: "", mitigation: "", signature: "", 
newRiskFlagged: false, newRiskDescription: "" });
 setAcknowledgedRisks({});
 }
 }, [open]);

 useEffect(() => {
 (async () => {
 try {
 const all = await base44.entities.RiskRegister.list();
 const applicable = all.filter((r) => !r.applicable_roles || 
r.applicable_roles.length === 0 || r.applicable_roles.includes("Driver"));
 setRegisterRisks(applicable);
 } catch { /* noop */ }
 })();
 }, []);

 const riskLevel = (() => {
 let score = 0;
 if (["rain", "fog", "strong_wind"].includes(form.weather)) score++;
 if (form.weather === "storm") score += 2;
 if (!form.routeFamiliar) score++;
 if (!form.restAdequate) score++;
 if (form.vehicleCondition === "fair") score++;
 if (form.vehicleCondition === "poor") score += 2;
 if (score >= 3) return "high";
 if (score >= 1) return "medium";
 return "low";
 })();

 const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

 const handleSubmit = async () => {
 if (!form.signature) { toast({ title: "Signature required", variant: 
"destructive" }); return; }
 if (form.newRiskFlagged && !form.newRiskDescription) { toast({ title: 
"Describe the new risk", variant: "destructive" }); return; }
 setSaving(true);
 try {
 await base44.entities.ShiftRiskAssessment.create({
 driver_id: driver.id,
 driver_name: driver.full_name,
 shift_date: new Date().toISOString().split("T")[0],
 truck_id: truck?.id || "",
 truck_registration: truck?.registration_number || "",
 combination_type: truck?.combination_type || "",
 weather_conditions: form.weather,
 route_familiar: form.routeFamiliar,
 rest_adequate: form.restAdequate,
 vehicle_condition: form.vehicleCondition,
 hazards_identified: form.hazards,
 risk_level: riskLevel,
 mitigation_actions: form.mitigation,
 signature_name: form.signature,
 new_risk_flagged: form.newRiskFlagged,
 new_risk_description: form.newRiskFlagged ? form.newRiskDescription : ""
 });
 toast({ title: "Risk assessment submitted", description: `Risk level: 
${riskLevel.toUpperCase()}${form.newRiskFlagged ? " · New risk flagged for  SHEQ" : ""}` });
 onComplete?.();
 onOpenChange(false);
 } catch (e) {
 toast({ title: "Error", description: e.message, variant: "destructive" });
 } finally {
 setSaving(false);
 }
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2"><ShieldAlert size={18} 
className="text-brand-navy" /> Shift Risk Assessment</DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 {/* Prepopulated risks from register */}
 {registerRisks.length > 0 && (
 <div className="rounded-lg border border-border/60 p-3">
 <p className="mb-2 text-xs font-semibold uppercase tracking-wider  text-muted-foreground">Known Risks for Your Role</p>
 <div className="space-y-1.5">
 {registerRisks.slice(0, 8).map((r) => (
 <label key={r.id} className="flex items-start gap-2 text-xs cursor-pointer">
 <Checkbox checked={acknowledgedRisks[r.id] || false} onCheckedChange={(v) => 
setAcknowledgedRisks((p) => ({ ...p, [r.id]: v }))} className="mt-0.5" />
 <span className="flex-1">{r.risk_description}{r.control_measures && <span 
className="block text-muted-foreground">Control: 
{r.control_measures}</span>}</span>
 </label>
 ))}
 </div>
 </div>
 )}

 <div className="space-y-1.5">
 <Label>Weather Conditions</Label>
 <Select value={form.weather} onValueChange={(v) => set("weather", v)}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>{WEATHER_OPTIONS.map((w) => <SelectItem key={w.value} 
value={w.value}>{w.label}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3  py-2.5">
 <span className="text-sm font-medium">Familiar with route?</span>
 <Switch checked={form.routeFamiliar} onCheckedChange={(v) => 
set("routeFamiliar", v)} />
 </div>
 <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3  py-2.5">
 <span className="text-sm font-medium">Had adequate rest?</span>
 <Switch checked={form.restAdequate} onCheckedChange={(v) => 
set("restAdequate", v)} />
 </div>
 <div className="space-y-1.5">
 <Label>Vehicle Condition</Label>
 <Select value={form.vehicleCondition} onValueChange={(v) => 
set("vehicleCondition", v)}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent><SelectItem value="good">Good</SelectItem><SelectItem 
value="fair">Fair</SelectItem><SelectItem 
value="poor">Poor</SelectItem></SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label>Hazards Identified</Label>
 <Textarea value={form.hazards} onChange={(e) => set("hazards", 
e.target.value)} rows={2} placeholder="Describe any route or load hazards…" />
 </div>
 <div className="space-y-1.5">
 <Label>Mitigation Actions</Label>
 <Textarea value={form.mitigation} onChange={(e) => set("mitigation", 
e.target.value)} rows={2} placeholder="What will you do to mitigate risks?" />
 </div>

 {/* New risk flagging */}
 <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
 <label className="flex items-center justify-between cursor-pointer">
 <span className="flex items-center gap-1.5 text-sm font-medium  text-amber-800"><Flag size={14} /> New risk not in register?</span>
 <Switch checked={form.newRiskFlagged} onCheckedChange={(v) => 
set("newRiskFlagged", v)} />
 </label>
 {form.newRiskFlagged && (
 <Textarea value={form.newRiskDescription} onChange={(e) => 
set("newRiskDescription", e.target.value)} rows={2} placeholder="Describe the  new risk for SHEQ to review…" className="mt-2" />
 )}
 </div>

 <div className="flex items-center justify-between rounded-lg border  border-border px-3 py-2.5">
 <span className="text-sm font-medium">Calculated Risk Level</span>
 <span className={`rounded-full px-3 py-1 text-xs font-bold ${riskLevel === 
"high" ? "bg-rose-100 text-rose-700" : riskLevel === "medium" ? "bg-amber-100  text-amber-700" : "bg-emerald-100  text-emerald-700"}`}>{riskLevel.toUpperCase()}</span>
 </div>
 <div className="space-y-1.5">
 <Label>Sign (type your name)</Label>
 <Input value={form.signature} onChange={(e) => set("signature", 
e.target.value)} placeholder="Full name" />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
 <Button onClick={handleSubmit} disabled={saving} className="bg-brand-navy  hover:bg-brand-navy/90">{saving ? "Submitting…" : "Submit Assessment"}</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
} 
