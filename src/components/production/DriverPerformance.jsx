import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from 
"@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 
"@/components/ui/table";
import { Users, Package, ShieldCheck, Activity } from "lucide-react";

const COMPLETED = ["load_completed", "completed", "delivered", "pod_captured"];

export default function DriverPerformance() {
 const [rows, setRows] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 (async () => {
 try {
 const [d, loads, insp, risks, tele] = await Promise.all([
 base44.entities.Driver.list(),
 base44.entities.Load.list("-created_date"),
 base44.entities.Inspection.list("-created_date"),
 base44.entities.ShiftRiskAssessment.list("-created_date"),
 base44.entities.TelematicsReading.list("-reading_date")
 ]);
 const result = d.map((driver) => {
 const dl = loads.filter((l) => l.driver_id === driver.id);
 const completed = dl.filter((l) => COMPLETED.includes(l.status));
 const di = insp.filter((i) => i.driver_id === driver.id);
 const passed = di.filter((i) => i.status === "pass");
 const dr = risks.filter((r) => r.driver_id === driver.id);
 const dt = tele.filter((t) => t.driver_id === driver.id);
 const events = dt.reduce((s, t) => s + (t.harsh_braking_count || 0) + 
(t.harsh_acceleration_count || 0) + (t.speeding_count || 0) + 
(t.harsh_cornering_count || 0), 0);
 const score = dt[0]?.driver_score || 0;
 return {
 ...driver,
 loadsCompleted: completed.length, loadsTotal: dl.length,
 completionRate: dl.length ? Math.round((completed.length / dl.length) * 100) 
: 0,
 inspectionRate: di.length ? Math.round((passed.length / di.length) * 100) : 0,
 riskCount: dr.length, behaviorEvents: events, score
 };
 });
 setRows(result);
 } finally { setLoading(false); }
 })();
 }, []);

 const scoreColor = (s) => s >= 80 ? "text-emerald-600" : s >= 60 ? 
"text-amber-600" : s > 0 ? "text-rose-600" : "text-muted-foreground";

 return (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
 <Card className="border-border/60 shadow-sm"><CardContent 
className="p-4"><div className="flex items-center justify-between"><p 
className="text-xs text-muted-foreground">Active Drivers</p><Users size={16} 
className="text-brand-blue" /></div><p className="mt-1 font-display text-2xl  font-bold text-brand-navy">{rows.length}</p></CardContent></Card>
 <Card className="border-border/60 shadow-sm"><CardContent 
className="p-4"><div className="flex items-center justify-between"><p 
className="text-xs text-muted-foreground">Loads Completed</p><Package size={16} 
className="text-brand-teal" /></div><p className="mt-1 font-display text-2xl  font-bold text-brand-navy">{rows.reduce((s, r) => s + r.loadsCompleted, 
0)}</p></CardContent></Card>
 <Card className="border-border/60 shadow-sm"><CardContent 
className="p-4"><div className="flex items-center justify-between"><p 
className="text-xs text-muted-foreground">Avg Inspection Pass</p><ShieldCheck 
size={16} className="text-emerald-500" /></div><p className="mt-1 font-display  text-2xl font-bold text-brand-navy">{rows.length ? Math.round(rows.reduce((s, 
r) => s + r.inspectionRate, 0) / rows.length) : 0}%</p></CardContent></Card>
 <Card className="border-border/60 shadow-sm"><CardContent 
className="p-4"><div className="flex items-center justify-between"><p 
className="text-xs text-muted-foreground">Behavior Events</p><Activity 
size={16} className="text-amber-500" /></div><p className="mt-1 font-display  text-2xl font-bold text-brand-navy">{rows.reduce((s, r) => s + 
r.behaviorEvents, 0)}</p></CardContent></Card>
 </div>

 <Card className="border-border/60 shadow-sm">
 <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2  text-base font-semibold"><Users size={16} className="text-brand-navy" /> Driver 
Performance Scores</CardTitle></CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <Table>
 <TableHeader><TableRow>
 
<TableHead>Driver</TableHead><TableHead>Loads</TableHead><TableHead>Completion</TableHead>
 <TableHead>Inspection Pass</TableHead><TableHead>Risk 
Assess.</TableHead><TableHead>Behavior 
Events</TableHead><TableHead>Score</TableHead>
 </TableRow></TableHeader>
 <TableBody>
 {loading && <TableRow><TableCell colSpan={7} className="text-center  text-muted-foreground py-8">Loading…</TableCell></TableRow>}
 {!loading && rows.length === 0 && <TableRow><TableCell colSpan={7} 
className="text-center text-muted-foreground py-8">No drivers 
found.</TableCell></TableRow>}
 {rows.map((r) => (
 <TableRow key={r.id}>
 <TableCell><div className="font-medium  text-brand-navy">{r.full_name}</div><div className="text-xs  text-muted-foreground">{r.employee_number || ""}</div></TableCell>
 <TableCell>{r.loadsCompleted}/{r.loadsTotal}</TableCell>
 <TableCell><span className={`font-medium ${r.completionRate >= 80 ? 
"text-emerald-600" : r.completionRate >= 50 ? "text-amber-600" : 
"text-muted-foreground"}`}>{r.completionRate}%</span></TableCell>
 <TableCell><span className={`font-medium ${r.inspectionRate >= 80 ? 
"text-emerald-600" : r.inspectionRate > 0 ? "text-amber-600" : 
"text-muted-foreground"}`}>{r.inspectionRate}%</span></TableCell>
 <TableCell>{r.riskCount}</TableCell>
 <TableCell>{r.behaviorEvents > 0 ? <Badge variant="destructive" 
className="text-[10px]">{r.behaviorEvents}</Badge> : <span 
className="text-emerald-600 text-xs">Clean</span>}</TableCell>
 <TableCell><span className={`font-display text-lg font-bold 
${scoreColor(r.score)}`}>{r.score || "—"}</span></TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>
 <p className="text-xs text-muted-foreground">Behavior metrics (harsh braking, 
acceleration, speeding, cornering) sourced from telematics API. Connect a 
telematics provider to populate driver scores automatically.</p>
 </div>
 );
} 
