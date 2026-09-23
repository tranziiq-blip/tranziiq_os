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

const CONDITIONS = [
 { key: "new", label: "New" },
 { key: "good", label: "Good" },
 { key: "worn", label: "Worn" },
 { key: "damaged", label: "Damaged" },
 { key: "punctured", label: "Punctured" },
 { key: "retread", label: "Retread" },
 { key: "scrapped", label: "Scrapped" }
];

const STATUSES = [
 { key: "fitted", label: "Fitted" },
 { key: "spare", label: "Spare" },
 { key: "in_storage", label: "In Storage" },
 { key: "retreaded", label: "Sent for Retread" },
 { key: "scrapped", label: "Scrapped" }
];

export default function TyreDialog({ open, onOpenChange, editing, trucks, 
trailers, onSaved }) {
 const { toast } = useToast();
 const [form, setForm] = useState({});
 const [saving, setSaving] = useState(false);

 const assets = [
 ...trucks.map((t) => ({ id: t.id, type: "truck", label: 
t.registration_number, positions: t.tyre_positions || [] })),
 ...trailers.map((t) => ({ id: t.id, type: "trailer", label: 
t.registration_number, positions: t.tyre_positions || [] }))
 ];

 useEffect(() => {
 if (open) {
 if (editing) {
 setForm({
 asset_id: editing.asset_id || "",
 position_name: editing.position_name || "",
 brand: editing.brand || "", size: editing.size || "", serial_number: 
editing.serial_number || "",
 tread_depth_mm: editing.tread_depth_mm ?? "", pressure_bar: 
editing.pressure_bar ?? "",
 condition: editing.condition || "good", dot_code: editing.dot_code || "",
 fitted_date: editing.fitted_date || "", last_checked_date: 
editing.last_checked_date || new Date().toISOString().slice(0, 10),
 cost: editing.cost ?? "", status: editing.status || "fitted", notes: 
editing.notes || ""
 });
 } else {
 setForm({
 asset_id: "", position_name: "",
 brand: "", size: "", serial_number: "",
 tread_depth_mm: "", pressure_bar: "", condition: "good", dot_code: "",
 fitted_date: new Date().toISOString().slice(0, 10), last_checked_date: new 
Date().toISOString().slice(0, 10),
 cost: "", status: "fitted", notes: ""
 });
 }
 }
 }, [open, editing]);

 const selectedAsset = assets.find((a) => a.id === form.asset_id);
 const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

 const save = async () => {
 if (!form.asset_id) { toast({ title: "Select an asset", variant: 
"destructive" }); return; }
 if (!form.position_name) { toast({ title: "Select a tyre position", variant: 
"destructive" }); return; }
 setSaving(true);
 try {
 const payload = {
 asset_id: form.asset_id,
 asset_type: selectedAsset?.type || "truck",
 asset_registration: selectedAsset?.label || "",
 position_name: form.position_name,
 brand: form.brand, size: form.size, serial_number: form.serial_number,
 tread_depth_mm: Number(form.tread_depth_mm) || 0,
 pressure_bar: Number(form.pressure_bar) || 0,
 condition: form.condition, dot_code: form.dot_code,
 fitted_date: form.fitted_date || undefined,
 last_checked_date: form.last_checked_date || undefined,
 cost: Number(form.cost) || 0,
 status: form.status, notes: form.notes
 };
 if (editing) {
 await base44.entities.Tyre.update(editing.id, payload);
 } else {
 await base44.entities.Tyre.create(payload);
 }
 toast({ title: editing ? "Tyre record updated" : "Tyre record added" });
 onSaved?.();
 onOpenChange(false);
 } catch (e) {
 toast({ title: "Error saving tyre", description: e.message, variant: 
"destructive" });
 } finally {
 setSaving(false);
 }
 };

 const Field = ({ label, children, full }) => (
 <div className={`grid gap-1.5 ${full ? "col-span-2" : ""}`}><Label 
className="text-xs">{label}</Label>{children}</div>
 );

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
 <DialogHeader><DialogTitle>{editing ? "Edit Tyre Record" : "Add Tyre  Record"}</DialogTitle></DialogHeader>
 <div className="grid grid-cols-2 gap-3 py-1">
 <Field label="Asset">
 <Select value={form.asset_id} onValueChange={(v) => { set("asset_id", v); 
set("position_name", ""); }}>
 <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
 <SelectContent>
 {assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.label} 
({a.type})</SelectItem>)}
 </SelectContent>
 </Select>
 </Field>
 <Field label="Position">
 <Select value={form.position_name} onValueChange={(v) => set("position_name", 
v)} disabled={!selectedAsset || (selectedAsset.positions || []).length === 0}>
 <SelectTrigger><SelectValue placeholder={selectedAsset && 
(selectedAsset.positions || []).length === 0 ? "No positions on asset" : 
"Select position"} /></SelectTrigger>
 <SelectContent>
 {(selectedAsset?.positions || []).map((p) => <SelectItem key={p} 
value={p}>{p}</SelectItem>)}
 </SelectContent>
 </Select>
 </Field>
 <Field label="Brand"><Input value={form.brand} onChange={(e) => set("brand", 
e.target.value)} placeholder="Michelin / Bridgestone" /></Field>
 <Field label="Size"><Input value={form.size} onChange={(e) => set("size", 
e.target.value)} placeholder="315/80 R22.5" /></Field>
 <Field label="Serial Number"><Input value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} /></Field>
 <Field label="DOT Code"><Input value={form.dot_code} onChange={(e) => 
set("dot_code", e.target.value)} placeholder="DOT 2026" /></Field>
 <Field label="Tread Depth (mm)"><Input type="number" step="0.1" 
value={form.tread_depth_mm} onChange={(e) => set("tread_depth_mm", 
e.target.value)} placeholder="12.5" /></Field>
 <Field label="Pressure (bar)"><Input type="number" step="0.1" 
value={form.pressure_bar} onChange={(e) => set("pressure_bar", e.target.value)} 
placeholder="8.0" /></Field>
 <Field label="Condition">
 <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c.key} 
value={c.key}>{c.label}</SelectItem>)}</SelectContent>
 </Select>
 </Field>
 <Field label="Status">
 <Select value={form.status} onValueChange={(v) => set("status", v)}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>{STATUSES.map((c) => <SelectItem key={c.key} 
value={c.key}>{c.label}</SelectItem>)}</SelectContent>
 </Select>
 </Field>
 <Field label="Fitted Date"><Input type="date" value={form.fitted_date} 
onChange={(e) => set("fitted_date", e.target.value)} /></Field>
 <Field label="Last Checked"><Input type="date" value={form.last_checked_date} 
onChange={(e) => set("last_checked_date", e.target.value)} /></Field>
 <Field label="Cost (ZAR)"><Input type="number" value={form.cost} 
onChange={(e) => set("cost", e.target.value)} /></Field>
 <Field label="Notes" full><Textarea value={form.notes} onChange={(e) => 
set("notes", e.target.value)} rows={2} /></Field>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
 <Button onClick={save} disabled={saving} className="bg-brand-navy  hover:bg-brand-navy/90">{saving ? "Saving…" : editing ? "Save Changes" : "Add  Record"}</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
