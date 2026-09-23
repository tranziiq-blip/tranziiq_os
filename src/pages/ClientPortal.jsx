import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from 
"@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 
"@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Package, FileText, CheckCircle2, Clock, MapPin, Truck, Search, 
Share2, Eye, LogIn, AlertCircle } from "lucide-react";
import { fleetTypeMeta, loadStatusMeta } from "@/lib/fleetTypes";

const rand = (n) => `R ${Number(n || 0).toLocaleString("en-ZA", { 
maximumFractionDigits: 0 })}`;

export default function ClientPortal() {
 const { user, isLoadingAuth } = useAuth();
 const { toast } = useToast();
 const [loads, setLoads] = useState([]);
 const [invoices, setInvoices] = useState([]);
 const [clients, setClients] = useState([]);
 const [selected, setSelected] = useState("");
 const [loading, setLoading] = useState(true);

 const isClient = user?.role === "client";

 const loadData = useCallback(async () => {
 try {
 const [l, inv] = await Promise.all([
 base44.entities.Load.list("-pickup_date"),
 base44.entities.Invoice.list("-invoice_date").catch(() => [])
 ]);
 setLoads(l); setInvoices(inv);
 const unique = [...new Set(l.map(x => x.client).filter(Boolean))];
 setClients(unique.sort());

 // Auto-detect client if logged in as client
 if (isClient) {
 const dir = await base44.entities.BusinessDirectory.filter({ 
portal_access_email: user.email }).catch(() => []);
 if (dir.length > 0) {
 setSelected(dir[0].name);
 } else if (user.data?.linked_client_name) {
 setSelected(user.data.linked_client_name);
 }
 }
 } catch (e) { console.error(e); } finally { setLoading(false); }
 }, [isClient, user]);

 useEffect(() => { if (!isLoadingAuth) loadData(); }, [isLoadingAuth, 
loadData]);

 const clientLoads = selected ? loads.filter(l => l.client === selected) : [];
 const clientInvoices = selected ? invoices.filter(i => i.client === selected) 
: [];
 const activeLoads = clientLoads.filter(l => !["delivered", "pod_captured", 
"completed", "cancelled"].includes(l.status));
 const deliveredLoads = clientLoads.filter(l => ["delivered", "pod_captured", 
"completed"].includes(l.status));
 const outstandingInv = clientInvoices.filter(i => ["invoiced", 
"overdue"].includes(i.status));
 const totalOutstanding = outstandingInv.reduce((s, i) => s + (i.total_amount 
|| 0), 0);

 const sharePortal = () => {
 const url = `${window.location.origin}/portal`;
 navigator.clipboard?.writeText(url);
 toast({ title: "Portal link copied", description: "Share with your client for  live tracking" });
 };

 if (isLoadingAuth) {
 return <div className="flex items-center justify-center py-20"><div 
className="h-8 w-8 border-4 border-muted border-t-brand-teal rounded-full  animate-spin" /></div>;
 }

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">Client Portal</h1>
 <p className="text-sm text-muted-foreground">
 {isClient ? `Welcome, ${user?.full_name || user?.email}` : "External-facing  load tracking · invoice status · POD visibility"}
 </p>
 </div>
 {!isClient && <Button onClick={sharePortal} variant="outline" 
className="gap-2"><Share2 size={16} /> Copy Portal Link</Button>}
 </div>

 {/* Client login info banner */}
 {isClient && (
 <Card className="border-brand-teal/30 bg-brand-teal/5">
 <CardContent className="flex items-start gap-3 p-4">
 <LogIn className="mt-0.5 text-brand-teal" size={20} />
 <div>
 <p className="text-sm font-semibold text-brand-navy">You are logged in as a 
client portal user</p>
 <p className="mt-1 text-xs text-muted-foreground">You can only view loads and 
invoices assigned to your company. If you don't see any data, contact your  account manager to verify your portal access is linked correctly.</p>  </div>  </CardContent>  </Card>  )}   {/* Client selector (admin/user only) */}  {!isClient && (  <Card className="overflow-hidden border-0 gradient-brand text-white  shadow-lg">  <CardContent className="p-6">  <div className="flex flex-col gap-4 md:flex-row md:items-center  md:justify-between">  <div className="flex items-center gap-3">  <div className="flex h-11 w-11 items-center justify-center rounded-xl  bg-white/15 backdrop-blur"><Search className="text-white" size={22} /></div>  <div><p className="text-xs font-medium uppercase tracking-wider  text-white/70">Client View</p><p className="text-sm text-white/90">Select a  client to view their portal</p></div>  </div>  <div className="w-full md:w-72">  <Select value={selected} onValueChange={setSelected}>  <SelectTrigger className="border-white/20 bg-white/10 text-white  placeholder:text-white/60"><SelectValue placeholder="Select client…"  /></SelectTrigger>  <SelectContent>{clients.map(c => <SelectItem key={c}  value={c}>{c}</SelectItem>)}</SelectContent>  </Select>  </div>  </div>  </CardContent>  </Card>  )}   {/* Client not linked */}  {isClient && !selected && !loading && (  <Card className="border-dashed border-amber-300 bg-amber-50/50">  <CardContent className="flex flex-col items-center justify-center gap-3  py-16">  <AlertCircle className="text-amber-500" size={32} />  <p className="text-sm font-medium text-brand-navy">Your account is not linked  to a client yet</p>  <p className="max-w-sm text-center text-xs text-muted-foreground">Please  contact your account manager to complete your portal access setup. They will  link your email to your company profile.</p>  </CardContent>  </Card>  )}   {loading && (  <Card className="border-border/60"><CardContent className="flex items-center  justify-center py-16"><div className="h-8 w-8 border-4 border-muted  border-t-brand-teal rounded-full animate-spin" /></CardContent></Card>  )}   {!loading && !isClient && !selected && (  <Card className="border-dashed border-border/60">  <CardContent className="flex flex-col items-center justify-center gap-3  py-16">  <Eye className="text-brand-teal" size={32} />  <p className="text-sm font-medium text-brand-navy">No client selected</p>  <p className="max-w-sm text-center text-xs text-muted-foreground">Select a  client above to view their live load tracking, delivery status, and invoice  history.</p>  </CardContent>  </Card>  )}   {selected && !loading && (  <div className="space-y-6">  {/* KPIs */}  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">  <Card className="border-border/60 shadow-sm"><CardContent  className="p-5"><div className="flex items-center justify-between"><p  className="text-xs font-medium text-muted-foreground">Active Loads</p><Package  className="text-brand-blue" size={18} /></div><p className="mt-2 font-display  text-3xl font-bold  text-brand-navy">{activeLoads.length}</p></CardContent></Card>  <Card className="border-border/60 shadow-sm"><CardContent  className="p-5"><div className="flex items-center justify-between"><p  className="text-xs font-medium  text-muted-foreground">Delivered</p><CheckCircle2 className="text-emerald-500"  size={18} /></div><p className="mt-2 font-display text-3xl font-bold  text-brand-navy">{deliveredLoads.length}</p></CardContent></Card>  <Card className="border-border/60 shadow-sm"><CardContent  className="p-5"><div className="flex items-center justify-between"><p  className="text-xs font-medium text-muted-foreground">Outstanding</p><Clock  className="text-amber-500" size={18} /></div><p className="mt-2 font-display  text-3xl font-bold  text-brand-navy">{outstandingInv.length}</p></CardContent></Card>  <Card className="border-border/60 shadow-sm"><CardContent  className="p-5"><div className="flex items-center justify-between"><p  className="text-xs font-medium text-muted-foreground">Amount Due</p><FileText  className="text-rose-500" size={18} /></div><p className="mt-2 font-display  text-2xl font-bold  text-brand-navy">{rand(totalOutstanding)}</p></CardContent></Card>  </div>   {/* Active loads tracking */}  <Card className="border-border/60 shadow-sm">  <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2  text-base font-semibold"><Truck size={18} className="text-brand-blue" /> Live  Load Tracking</CardTitle></CardHeader>  <CardContent className="space-y-3 pt-2">  {activeLoads.length === 0 && <p className="py-6 text-center text-sm  text-muted-foreground">No active loads for this client.</p>}  {activeLoads.map(l => {  const sm = loadStatusMeta(l.status);  return (  <div key={l.id} className="rounded-xl border border-border/60 p-4">  <div className="flex flex-wrap items-start justify-between gap-2">  <div>  <p className="font-mono text-sm font-semibold  text-brand-navy">{l.load_number}</p>  <div className="mt-1 flex items-center gap-1 text-xs  text-muted-foreground"><MapPin size={12} /> {l.origin} → {l.destination}</div>  {l.cross_border && <Badge className="mt-1 bg-amber-100 text-amber-700  text-[10px]">Cross-Border</Badge>}  </div>  <span className={`rounded-full px-2.5 py-1 text-xs font-medium  ${sm.classes}`}>{sm.label}</span>  </div>  <div className="mt-3 flex items-center gap-2">  {["accepting_load", "loaded", "in_transit", "at_border", "cleared",  "at_destination", "delivered"].map((step, i) => {  const idx = ["accepting_load", "loaded", "in_transit", "at_border",  "cleared", "at_destination", "delivered"].indexOf(l.status);  const active = idx >= 0 && i <= idx;  return <div key={step} className="flex flex-1 items-center"><div  className={`h-2 flex-1 rounded-full ${active ? "gradient-brand" : "bg-muted"}`}  /></div>;  })}  </div>  <div className="mt-1 flex justify-between text-[10px]  text-muted-foreground"><span>Accept</span><span>Loaded</span><span>Transit</span><span>Border</span><span>Cleared</span><span>Arrival</span><span>Delivered</span></div>  </div>  );  })}  </CardContent>  </Card>   {/* Invoice history */}  <Card className="border-border/60 shadow-sm">  <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2  text-base font-semibold"><FileText size={18} className="text-brand-teal" />  Invoice History</CardTitle></CardHeader>  <CardContent className="p-0 overflow-x-auto">  <table className="w-full text-sm">  <thead className="border-b border-border bg-muted/40"><tr>  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice  #</th>  <th className="px-4 py-3 text-left font-medium  text-muted-foreground">Date</th>  <th className="px-4 py-3 text-left font-medium  text-muted-foreground">Load</th>  <th className="px-4 py-3 text-right font-medium  text-muted-foreground">Amount</th>  <th className="px-4 py-3 text-center font-medium  text-muted-foreground">POD</th>  <th className="px-4 py-3 text-left font-medium  text-muted-foreground">Status</th>  </tr></thead>  <tbody>  {clientInvoices.length === 0 && <tr><td colSpan={6} className="text-center  text-muted-foreground py-6">No invoices for this client.</td></tr>}  {clientInvoices.map(i => (  <tr key={i.id} className="border-b border-border/50 last:border-0  hover:bg-muted/30">  <td className="px-4 py-3 font-mono text-xs font-medium  text-brand-navy">{i.invoice_number}</td>  <td className="px-4 py-3 text-xs text-muted-foreground">{i.invoice_date ? new  Date(i.invoice_date).toLocaleDateString() : "—"}</td>  <td className="px-4 py-3 text-xs">{i.load_number || "—"}</td>  <td className="px-4 py-3 text-right font-semibold">{rand(i.total_amount ||  i.amount)}</td>  <td className="px-4 py-3 text-center">{i.pod_captured ? <CheckCircle2  className="mx-auto text-emerald-500" size={16} /> : <span className="text-xs  text-muted-foreground">Pending</span>}</td>  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs  font-medium ${i.status === "paid" ? "bg-emerald-100 text-emerald-700" :  i.status === "overdue" ? "bg-rose-100 text-rose-700" : i.status === "invoiced"  ? "bg-sky-100 text-sky-700" : "bg-slate-100  text-slate-600"}`}>{i.status}</span></td>  </tr>  ))}  </tbody>  </table>  </CardContent>  </Card>  </div>  )}  </div>  ); } 