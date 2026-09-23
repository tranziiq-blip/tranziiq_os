import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 
"@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 
"@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import ComplianceDocumentDialog from 
"@/components/compliance/ComplianceDocumentDialog";
import { PROFILE_TYPES } from "@/lib/complianceContent";
import { expiryLevel } from "@/lib/complianceEngine";

export default function ExpiryRegisterTab({ documents, onRefresh }) {
 const { toast } = useToast();
 const [filter, setFilter] = useState("all");
 const [dialog, setDialog] = useState(null);

 const list = documents.filter((d) => filter === "all" || d.profile_type === 
filter);
 const expired = documents.filter((d) => expiryLevel(d).key === 
"expired").length;
 const d7 = documents.filter((d) => expiryLevel(d).key === "7d").length;
 const d14 = documents.filter((d) => expiryLevel(d).key === "14d").length;
 const d30 = documents.filter((d) => expiryLevel(d).key === "30d").length;

 const remove = async (d) => {
 await base44.entities.ComplianceDocument.delete(d.id);
 toast({ title: "Register entry removed" });
 onRefresh();
 };

 return (
 <div className="space-y-4">
 <Card className="border-border/60 shadow-sm">
 <CardContent className="p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="text-sm font-semibold text-brand-navy">Expiry Alert Engine</p>
 <p className="text-xs text-muted-foreground">Alerts at 30 / 14 / 7 days 
before expiry — escalates to the compliance officer at 0 days</p>
 </div>
 <div className="flex items-center gap-2">
 <Select value={filter} onValueChange={setFilter}>
 <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All modules</SelectItem>
 {Object.entries(PROFILE_TYPES).map(([k, v]) => <SelectItem key={k} 
value={k}>{v.label}</SelectItem>)}
 </SelectContent>
 </Select>
 <Button onClick={() => setDialog({ new: true })} className="gap-2  bg-brand-navy hover:bg-brand-navy/90"><Plus size={16} /> Add Document</Button>
 </div>
 </div>
 <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
 <div className="rounded-lg border border-rose-200 bg-rose-50 p-2  text-center"><p className="font-display text-lg font-bold  text-rose-600">{expired}</p><p className="text-[10px] text-rose-700">Expired — 
escalated</p></div>
 <div className="rounded-lg border border-orange-200 bg-orange-50 p-2  text-center"><p className="font-display text-lg font-bold  text-orange-600">{d7}</p><p className="text-[10px] text-orange-700">≤ 7 
days</p></div>
 <div className="rounded-lg border border-amber-200 bg-amber-50 p-2  text-center"><p className="font-display text-lg font-bold  text-amber-600">{d14}</p><p className="text-[10px] text-amber-700">≤ 14 
days</p></div>
 <div className="rounded-lg border border-sky-200 bg-sky-50 p-2  text-center"><p className="font-display text-lg font-bold  text-sky-600">{d30}</p><p className="text-[10px] text-sky-700">≤ 30 
days</p></div>
 </div>
 </CardContent>
 </Card>

 <Card className="border-border/60 shadow-sm">
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow>
 
<TableHead>Document</TableHead><TableHead>Module</TableHead><TableHead>Holder</TableHead>
 
<TableHead>Jurisdiction</TableHead><TableHead>Expiry</TableHead><TableHead>Alert</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {list.length === 0 && <TableRow><TableCell colSpan={7} className="py-8  text-center text-muted-foreground">No tracked documents yet — add 
expiry-tracked certificates, permits and service 
records.</TableCell></TableRow>}
 {list.map((d) => {
 const level = expiryLevel(d);
 return (
 <TableRow key={d.id}>
 <TableCell className="text-xs  font-medium">{d.document_type}{d.reference_number && <span 
className="text-muted-foreground"> · {d.reference_number}</span>}</TableCell>
 <TableCell><Badge variant="secondary" 
className="text-[10px]">{PROFILE_TYPES[d.profile_type]?.label || 
d.profile_type}</Badge></TableCell>
 <TableCell className="text-xs">{d.holder_name || "—"}</TableCell>
 <TableCell className="text-xs">{d.jurisdiction_code || "—"}</TableCell>
 <TableCell className="text-xs">{d.expiry_date || "No expiry"}</TableCell>
 <TableCell><Badge className={`text-[10px] ${level.color}`}>{level.key === 
"expired" ? <><AlertTriangle size={10} className="mr-1 inline" />Expired</> : 
level.label}</Badge></TableCell>
 <TableCell className="text-right">
 <div className="flex justify-end gap-1">
 <button onClick={() => setDialog({ doc: d })} className="rounded-md p-2  text-muted-foreground hover:bg-muted hover:text-brand-navy"><Pencil size={15} 
/></button>
 <button onClick={() => remove(d)} className="rounded-md p-2  text-muted-foreground hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} 
/></button>
 </div>
 </TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 </CardContent>
 </Card>

 {dialog && (
 <ComplianceDocumentDialog
 open={!!dialog}
 onOpenChange={(v) => !v && setDialog(null)}
 doc={dialog.doc || null}
 onSaved={() => { setDialog(null); onRefresh(); }}
 />
 )}
 </div>
 );
}
