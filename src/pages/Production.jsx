import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from 
"@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from 
"@/components/ui/tabs";
import { Activity, Timer, Gauge, Users, Coffee, AlertTriangle, TrendingUp, 
Globe } from "lucide-react";
import { loadStatusMeta } from "@/lib/fleetTypes";
import DriverPerformance from "@/components/production/DriverPerformance";
import TruckPerformance from "@/components/production/TruckPerformance";
import FuelManagement from "@/components/production/FuelManagement";

function hrsBetween(a, b) {
 return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 3600000;
}

export default function Production() {
 const [loads, setLoads] = useState([]);
 const [shifts, setShifts] = useState([]);
 const [trucks, setTrucks] = useState([]);
 const [loading, setLoading] = useState(true);
 const [now, setNow] = useState(Date.now());

 useEffect(() => {
 (async () => {
 try {
 const [l, s, t] = await Promise.all([
 base44.entities.Load.list("-created_date"),
 base44.entities.ShiftLog.filter({ status: "active" }),
 base44.entities.Truck.list()
 ]);
 setLoads(l); setShifts(s); setTrucks(t);
 } finally { setLoading(false); }
 })();
 const t = setInterval(() => setNow(Date.now()), 30000);
 return () => clearInterval(t);
 }, []);

 const inTransit = loads.filter((l) => ["enroute_to_loading", 
"arrived_at_loading", "queue_to_load", "weighing_in_empty", "loading", 
"weighing_out_loaded", "enroute_to_offloading", "arrived_at_offloading", 
"queue_to_offload", "weighing_in_loaded", "offloading", "weighing_out_empty", 
"in_transit", "at_border", "customs_hold", "cleared", "at_destination", 
"unloading"].includes(l.status));
 const completed = loads.filter((l) => ["load_completed", "delivered", 
"pod_captured", "completed"].includes(l.status));
 const activeTrucks = trucks.filter((t) => t.status === "active").length;
 const utilisation = trucks.length ? Math.round((inTransit.length / 
Math.max(activeTrucks, 1)) * 100) : 0;

 const avgTAT = completed.length
 ? completed.reduce((sum, l) => {
 const start = l.pickup_date ? new Date(l.pickup_date).getTime() : new 
Date(l.created_date).getTime();
 const end = l.delivery_date ? new Date(l.delivery_date).getTime() : new 
Date(l.created_date).getTime();
 return sum + Math.max(hrsBetween(start, end), 0);
 }, 0) / completed.length
 : 0;

 const crossBorderLoads = loads.filter((l) => l.cross_border && 
!["load_completed", "completed", "cancelled"].includes(l.status));

 const fatigueFlags = shifts.filter((s) => {
 const elapsed = now - new Date(s.clock_in).getTime();
 return elapsed >= 2 * 3600000 && (s.rests_taken || 0) === 0;
 });

 const kpis = [
 { label: "Loads In Transit", value: loading ? "—" : `${inTransit.length}`, 
sub: `${loads.length} total`, icon: Activity, tone: "text-brand-blue" },
 { label: "Avg Turnaround", value: loading ? "—" : `${avgTAT.toFixed(1)}h`, 
sub: "completed loads", icon: Timer, tone: "text-brand-teal" },
 { label: "Fleet Utilisation", value: loading ? "—" : `${Math.min(utilisation, 
100)}%`, sub: `${activeTrucks} active trucks`, icon: Gauge, tone: 
"text-indigo-500" },
 { label: "Drivers On Shift", value: loading ? "—" : `${shifts.length}`, sub: 
`${fatigueFlags.length} rest due`, icon: Users, tone: "text-amber-500" }
 ];

 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">Production & Operations</h1>
 <p className="text-sm text-muted-foreground">Operations · Driver performance 
· Truck performance · Fuel management</p>
 </div>

 <Tabs defaultValue="operations">
 <TabsList className="flex-wrap">
 <TabsTrigger value="operations">Operations</TabsTrigger>
 <TabsTrigger value="drivers">Driver Performance</TabsTrigger>
 <TabsTrigger value="trucks">Truck Performance</TabsTrigger>
 <TabsTrigger value="fuel">Fuel Management</TabsTrigger>
 </TabsList>

 <TabsContent value="operations" className="space-y-6">
 <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
 {kpis.map((k) => (
 <Card key={k.label} className="border-border/60 shadow-sm">
 <CardContent className="p-5">
 <div className="flex items-center justify-between">
 <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
 <k.icon className={k.tone} size={18} />
 </div>
 <p className="mt-2 font-display text-3xl font-bold  text-brand-navy">{k.value}</p>
 <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
 </CardContent>
 </Card>
 ))}
 </div>

 {shifts.length > 0 && (
 <Card className="border-border/60 shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="flex items-center gap-2 text-base  font-semibold"><Coffee size={16} className="text-amber-500" /> Fatigue 
Oversight</CardTitle>
 {fatigueFlags.length > 0 && <Badge 
variant="destructive">{fatigueFlags.length} rest due</Badge>}
 </CardHeader>
 <CardContent>
 <div className="space-y-2">
 {shifts.map((s) => {
 const elapsed = now - new Date(s.clock_in).getTime();
 const hrs = (elapsed / 3600000).toFixed(1);
 const restDue = elapsed >= 2 * 3600000 && (s.rests_taken || 0) === 0;
 const overLimit = elapsed >= 15 * 3600000;
 return (
 <div key={s.id} className="flex items-center justify-between rounded-lg  border border-border/60 p-3">
 <div>
 <p className="text-sm font-semibold text-brand-navy">{s.driver_name}</p>
 <p className="text-xs text-muted-foreground">{s.truck_registration || 
"Unassigned"} · {hrs}h on shift · {s.rests_taken || 0} rests</p>
 </div>
 {overLimit ? <Badge variant="destructive">15h limit exceeded</Badge>
 : restDue ? <Badge variant="destructive">Rest due</Badge>
 : <Badge variant="secondary" className="bg-emerald-100  text-emerald-700">Compliant</Badge>}
 </div>
 );
 })}
 </div>
 </CardContent>
 </Card>
 )}

 <Card className="border-border/60 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="flex items-center gap-2 text-base  font-semibold"><Activity size={16} className="text-brand-blue" /> Live Load 
Monitoring</CardTitle>
 </CardHeader>
 <CardContent className="p-0 overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="border-b border-border bg-muted/40">
 <tr>
 <th className="px-4 py-3 text-left font-medium text-muted-foreground">Load 
#</th>
 <th className="px-4 py-3 text-left font-medium  text-muted-foreground">Client</th>
 <th className="px-4 py-3 text-left font-medium  text-muted-foreground">Route</th>
 <th className="px-4 py-3 text-left font-medium  text-muted-foreground">Status</th>
 <th className="px-4 py-3 text-left font-medium text-muted-foreground">TAT 
(elapsed)</th>
 <th className="px-4 py-3 text-left font-medium  text-muted-foreground">Weight</th>
 </tr>
 </thead>
 <tbody>
 {loading && <tr><td colSpan={6} className="text-center text-muted-foreground  py-8">Loading…</td></tr>}
 {!loading && inTransit.length === 0 && <tr><td colSpan={6} 
className="text-center text-muted-foreground py-8">No loads in 
transit.</td></tr>}
 {inTransit.map((l) => {
 const meta = loadStatusMeta(l.status);
 const start = l.pickup_date ? new Date(l.pickup_date).getTime() : new 
Date(l.created_date).getTime();
 const elapsedHrs = ((now - start) / 3600000).toFixed(1);
 const tatRisk = Number(elapsedHrs) > 24;
 return (
 <tr key={l.id} className="border-b border-border/50 last:border-0  hover:bg-muted/30">
 <td className="px-4 py-3 font-semibold  text-brand-navy">{l.load_number}{l.cross_border && <span className="ml-1.5  inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium  text-amber-700">Cross-Border</span>}</td>
 <td className="px-4 py-3">{l.client}</td>
 <td className="px-4 py-3 text-muted-foreground">{l.origin} → 
{l.destination}</td>
 <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs 
font-medium ${meta.color}`}>{meta.label}</span></td>
 <td className="px-4 py-3">
 <span className={`flex items-center gap-1 font-medium ${tatRisk ? 
"text-rose-600" : "text-foreground"}`}>
 {tatRisk && <AlertTriangle size={13} />}{elapsedHrs}h
 </span>
 </td>
 <td className="px-4 py-3">{l.weight_tons ? `${l.weight_tons} t` : "—"}</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </CardContent>
 </Card>

 {crossBorderLoads.length > 0 && (
 <Card className="border-amber-200 bg-amber-50/50">
 <CardHeader className="pb-2">
 <CardTitle className="flex items-center gap-2 text-base font-semibold"><Globe 
size={16} className="text-amber-600" /> Cross-Border Freight 
Clearance</CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 <p className="text-xs text-muted-foreground">Cross-border loads require 
coordination between driver, operations, and freight clearance portal.</p>
 {crossBorderLoads.map((l) => (
 <div key={l.id} className="flex flex-wrap items-center justify-between gap-2  rounded-lg border border-amber-200 bg-white p-3">
 <div>
 <p className="text-sm font-semibold text-brand-navy">{l.load_number} — 
{l.client}</p>
 <p className="text-xs text-muted-foreground">{l.origin} → {l.destination} via 
{l.border_post || "—"}</p>
 {l.freight_forwarder && <p className="text-xs  text-muted-foreground">Forwarder: {l.freight_forwarder}</p>}
 </div>
 <div className="flex items-center gap-2">
 <span className={`rounded-full px-2.5 py-1 text-xs font-medium 
${l.customs_status === "cleared" ? "bg-emerald-100 text-emerald-700" : 
l.customs_status === "held" ? "bg-rose-100 text-rose-700" : "bg-amber-100  text-amber-700"}`}>{(l.customs_status || "pending").replace(/_/g, " ")}</span>
 </div>
 </div>
 ))}
 </CardContent>
 </Card>
 )}

 <Card className="border-border/60 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="flex items-center gap-2 text-base  font-semibold"><TrendingUp size={16} className="text-brand-teal" /> Fleet 
Utilisation by Type</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {Object.entries(
 trucks.reduce((acc, t) => {
 const key = t.fleet_type;
 acc[key] = acc[key] || { total: 0, working: 0 };
 acc[key].total++;
 if (inTransit.some((l) => l.truck_id === t.id)) acc[key].working++;
 return acc;
 }, {})
 ).map(([key, v]) => {
 const pct = v.total ? Math.round((v.working / v.total) * 100) : 0;
 return (
 <div key={key} className="rounded-lg border border-border/60 p-3">
 <div className="flex items-center justify-between text-sm">
 <span className="font-medium capitalize">{key.replace(/_/g, " ")}</span>
 <span className="text-muted-foreground">{v.working}/{v.total}</span>
 </div>
 <div className="mt-2 h-2 w-full rounded-full bg-muted">
 <div className="h-2 rounded-full gradient-brand" style={{ width: `${pct}%` }} 
/>
 </div>
 <p className="mt-1 text-xs text-muted-foreground">{pct}% utilised</p>
 </div>
 );
 })}
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="drivers"><DriverPerformance /></TabsContent>
 <TabsContent value="trucks"><TruckPerformance /></TabsContent>
 <TabsContent value="fuel"><FuelManagement /></TabsContent>
 </Tabs>
 </div>
 );
}
