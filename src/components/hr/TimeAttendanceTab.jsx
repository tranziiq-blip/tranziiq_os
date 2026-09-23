import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 
"@/components/ui/table";
import { Clock, Timer, ClipboardList, LogOut } from "lucide-react";

const fmtTime = (v) => (v ? new Date(v).toLocaleTimeString("en-ZA", { hour: 
"2-digit", minute: "2-digit" }) : "—");
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-ZA", { day: 
"2-digit", month: "short" }) : "—");

function isToday(v) {
 if (!v) return false;
 const d = new Date(v);
 const t = new Date();
 return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && 
d.getFullYear() === t.getFullYear();
}

function duration(shift, now) {
 const end = shift.clock_out ? new Date(shift.clock_out).getTime() : now;
 const ms = Math.max(0, end - new Date(shift.clock_in).getTime());
 const h = Math.floor(ms / 3600000);
 const m = Math.floor((ms % 3600000) / 60000);
 return `${h}h ${String(m).padStart(2, "0")}m`;
}

export default function TimeAttendanceTab({ shiftLogs, onDataChanged }) {
 const [now, setNow] = useState(Date.now());
 const [busy, setBusy] = useState(null);

 useEffect(() => {
 const t = setInterval(() => setNow(Date.now()), 30000);
 return () => clearInterval(t);
 }, []);

 const onShift = shiftLogs.filter((s) => s.status === "active");
 const todayLogs = shiftLogs.filter((s) => isToday(s.clock_in));
 const msToday = todayLogs.reduce((sum, s) => {
 const end = s.clock_out ? new Date(s.clock_out).getTime() : now;
 return sum + Math.max(0, end - new Date(s.clock_in).getTime());
 }, 0);
 const hoursToday = (msToday / 3600000).toFixed(1);

 const clockOut = async (shift) => {
 setBusy(shift.id);
 try {
 await base44.entities.ShiftLog.update(shift.id, { clock_out: new 
Date().toISOString(), status: "ended" });
 onDataChanged?.();
 } finally {
 setBusy(null);
 }
 };

 return (
 <div className="space-y-4">
 <div className="grid grid-cols-3 gap-4">
 <Card className="border-border/60 shadow-sm"><CardContent 
className="p-4"><div className="flex items-center justify-between"><p 
className="text-xs text-muted-foreground">On Shift Now</p><Clock size={16} 
className="text-emerald-500" /></div><p className="mt-1 font-display text-2xl  font-bold text-brand-navy">{onShift.length}</p></CardContent></Card>
 <Card className="border-border/60 shadow-sm"><CardContent 
className="p-4"><div className="flex items-center justify-between"><p 
className="text-xs text-muted-foreground">Hours Today</p><Timer size={16} 
className="text-brand-teal" /></div><p className="mt-1 font-display text-2xl  font-bold text-brand-navy">{hoursToday}</p></CardContent></Card>
 <Card className="border-border/60 shadow-sm"><CardContent 
className="p-4"><div className="flex items-center justify-between"><p 
className="text-xs text-muted-foreground">Records</p><ClipboardList size={16} 
className="text-brand-blue" /></div><p className="mt-1 font-display text-2xl  font-bold text-brand-navy">{shiftLogs.length}</p></CardContent></Card>
 </div>

 <Card className="border-border/60 shadow-sm"><CardContent className="p-0  overflow-x-auto">
 <Table>
 
<TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Clock 
In</TableHead><TableHead>Clock 
Out</TableHead><TableHead>Duration</TableHead><TableHead>KM</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
 <TableBody>
 {shiftLogs.length === 0 && <TableRow><TableCell colSpan={8} 
className="text-center text-muted-foreground py-8">No clock-in records 
yet.</TableCell></TableRow>}
 {shiftLogs.slice(0, 100).map((s) => (
 <TableRow key={s.id} className="hover:bg-muted/30">
 <TableCell className="font-semibold text-brand-navy text-sm">{s.driver_name 
|| "—"}</TableCell>
 <TableCell className="text-xs">{fmtDate(s.clock_in)}</TableCell>
 <TableCell className="text-xs tabular-nums">{fmtTime(s.clock_in)}</TableCell>
 <TableCell className="text-xs tabular-nums">{s.clock_out ? 
fmtTime(s.clock_out) : <span 
className="text-muted-foreground">—</span>}</TableCell>
 <TableCell className="text-xs font-medium tabular-nums">{duration(s, 
now)}</TableCell>
 <TableCell className="text-xs">{s.km_driven || 0}</TableCell>
 <TableCell><Badge className={s.status === "active" ? "bg-emerald-100  text-emerald-700" : "bg-slate-100 text-slate-600"}>{s.status === "active" ? "On  Shift" : "Ended"}</Badge></TableCell>
 <TableCell>
 {s.status === "active" && (
 <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" 
onClick={() => clockOut(s)} disabled={busy === s.id}>
 <LogOut size={12} /> Clock Out
 </Button>
 )}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </CardContent></Card>
 </div>
 );
}
