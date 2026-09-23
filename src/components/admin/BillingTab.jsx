import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from 
"@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Check, AlertCircle, Zap, Plus, Truck, Smartphone, 
Snowflake, Flame, Package, Save } from "lucide-react";
import { PLAN_THRESHOLDS, getPlanForTruckCount } from "@/lib/operationTypes";

const PLANS = [
 { id: "starter", name: "Starter", price: 380, interval: "/truck/month", 
features: ["Core operations modules", "Driver mobile app", "AI insights", 
"Email support"], truckRange: "1–15 trucks" },
 { id: "growth", name: "Growth", price: 320, interval: "/truck/month", 
features: ["All Starter features", "Client portal access", "Advanced AI  reporting", "Priority support", "API integrations"], truckRange: "16–50 trucks" 
},
 { id: "enterprise", name: "Enterprise", price: 0, interval: "Custom", 
features: ["All Growth features", "White-label options", "Dedicated support", 
"Custom integrations", "SLA guarantee"], truckRange: "51+ trucks" }
];

const FEATURE_ADDONS = [
 { id: "starter_growth", name: "Growth Features (Starter add-on)", price: 30, 
interval: "/truck/month", description: "Unlock Growth-tier features while on  Starter", icon: Zap },
 { id: "growth_enterprise", name: "Enterprise Features (Growth add-on)", 
price: 20, interval: "/truck/month", description: "Unlock Enterprise-tier  features while on Growth", icon: Zap }
];

const DEVICE_ADDONS = [
 { id: "mobile_device", name: "Mobile Device + 10GB Data", price: 369, 
interval: "/device/month", description: "Rugged tablet with 10GB monthly data —  renewable after 36 months", icon: Smartphone }
];

const COMPLIANCE_ADDONS = [
 { id: "dg_hazmat", name: "DG / Hazmat Compliance", price: 249, interval: 
"/truck/month", description: "Specialized dangerous goods & hazardous materials  compliance suite", icon: Flame },
 { id: "cold_chain", name: "Cold-Chain Monitoring", price: 249, interval: 
"/truck/month", description: "Temperature monitoring & cold-chain compliance  reporting", icon: Snowflake },
 { id: "abnormal_load", name: "Abnormal-Load Permits & Escorts", price: 249, 
interval: "/truck/month", description: "Abnormal load permit management &  escort coordination", icon: Package }
];

const ALL_ADDONS = [...FEATURE_ADDONS, ...COMPLIANCE_ADDONS];

export default function BillingTab() {
 const { toast } = useToast();
 const [profile, setProfile] = useState(null);
 const [fleetSize, setFleetSize] = useState(0);
 const [loading, setLoading] = useState(true);
 const [truckCount, setTruckCount] = useState(1);
 const [selectedAddons, setSelectedAddons] = useState([]);
 const [deviceQty, setDeviceQty] = useState(0);
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 (async () => {
 try {
 const list = await base44.entities.CompanyProfile.list();
 if (list.length > 0) {
 setProfile(list[0]);
 setFleetSize(list[0].fleet_size || 0);
 setTruckCount(list[0].fleet_size || 1);
 setSelectedAddons(list[0].selected_addons || []);
 setDeviceQty(list[0].device_addon_qty || 0);
 }
 const trucks = await base44.entities.Truck.list().catch(() => []);
 if (trucks.length > 0) setTruckCount(trucks.length);
 } catch (e) { console.error(e); } finally { setLoading(false); }
 })();
 }, []);

 const currentPlan = profile?.billing_plan || "free";
 const billingStatus = profile?.billing_status || "trialing";
 const recommendedPlan = getPlanForTruckCount(truckCount);
 const calcMonthly = (price) => price * truckCount;

 const addonMonthly = selectedAddons.reduce((sum, id) => {
 const a = ALL_ADDONS.find((x) => x.id === id);
 return sum + (a ? a.price * truckCount : 0);
 }, 0);
 const deviceMonthly = deviceQty * 369;
 const planMonthly = currentPlan === "starter" ? 380 * truckCount : 
currentPlan === "growth" ? 320 * truckCount : 0;
 const totalMonthly = planMonthly + addonMonthly + deviceMonthly;

 const toggleAddon = (id) => {
 setSelectedAddons((prev) => prev.includes(id) ? prev.filter((x) => x !== id) 
: [...prev, id]);
 };

 const saveConfig = async () => {
 if (!profile) { toast({ title: "No company profile found", variant: 
"destructive" }); return; }
 setSaving(true);
 try {
 await base44.entities.CompanyProfile.update(profile.id, {
 fleet_size: truckCount,
 selected_addons: selectedAddons,
 device_addon_qty: deviceQty,
 billing_plan: recommendedPlan
 });
 toast({ title: "Billing configuration saved", description: `Plan: 
${recommendedPlan} · ${truckCount} trucks · ${selectedAddons.length} add-on(s) 
· Total: R${totalMonthly.toLocaleString()}/month` });
 } catch (e) { toast({ title: "Error saving", description: e.message, variant: 
"destructive" }); }
 finally { setSaving(false); }
 };

 if (loading) return <div className="flex justify-center py-12"><div 
className="h-8 w-8 border-4 border-muted border-t-brand-teal rounded-full  animate-spin" /></div>;

 return (
 <div className="space-y-6">
 {/* Current billing status */}
 <Card className="border-border/60 shadow-sm">
 <CardContent className="flex flex-wrap items-center justify-between gap-3  p-5">
 <div className="flex items-center gap-3">
 <div className="flex h-11 w-11 items-center justify-center rounded-xl  gradient-brand"><CreditCard className="text-white" size={22} /></div>
 <div>
 <p className="text-xs font-medium text-muted-foreground">Current Plan</p>
 <p className="font-display text-lg font-bold capitalize  text-brand-navy">{currentPlan.replace("_", " ")}</p>
 </div>
 </div>
 <Badge className={billingStatus === "active" ? "bg-emerald-100  text-emerald-700" : billingStatus === "trialing" ? "bg-sky-100 text-sky-700" : 
"bg-rose-100 text-rose-700"}>{billingStatus.replace("_", " ")}</Badge>
 </CardContent>
 </Card>

 {/* Truck count + thresholds */}
 <Card className="border-brand-teal/30 bg-brand-teal/5">
 <CardContent className="p-4">
 <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
 <div className="flex items-center gap-2">
 <Truck size={20} className="text-brand-navy" />
 <div>
 <p className="text-sm font-semibold text-brand-navy">Truck Thresholds & Plan 
Tiers</p>
 <p className="text-xs text-muted-foreground">Your fleet size determines your 
plan tier and add-on eligibility.</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Label className="text-xs text-muted-foreground">Trucks:</Label>
 <Input type="number" min={1} value={truckCount} onChange={(e) => 
setTruckCount(Math.max(1, Number(e.target.value)))} className="w-20 h-8  text-center font-bold" />
 </div>
 </div>
 <div className="grid grid-cols-3 gap-2">
 {PLANS.map((p) => {
 const thresh = PLAN_THRESHOLDS[p.id];
 const isRecommended = p.id === recommendedPlan;
 return (
 <div key={p.id} className={`rounded-lg border p-2 text-center ${isRecommended 
? "border-brand-teal bg-white" : "border-border/60 bg-white/50"}`}>
 <p className="text-xs font-semibold text-brand-navy">{p.name}</p>
 <p className="text-[10px] text-muted-foreground">{thresh?.label}</p>
 {isRecommended && <Badge className="bg-brand-teal text-white text-[9px]  mt-1">Recommended</Badge>}
 </div>
 );
 })}
 </div>
 </CardContent>
 </Card>

 {/* Pricing plans */}
 <div>
 <h2 className="mb-3 font-display text-lg font-semibold  text-brand-navy">Subscription Plans</h2>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {PLANS.map((plan) => {
 const isCurrent = plan.id === currentPlan;
 const isRecommended = plan.id === recommendedPlan;
 return (
 <Card key={plan.id} className={`shadow-sm transition-shadow hover:shadow-md 
${isCurrent ? "border-brand-teal ring-1 ring-brand-teal" : isRecommended ? 
"border-brand-teal/50" : "border-border/60"}`}>
 <CardContent className="p-5">
 <div className="flex items-center justify-between">
 <p className="font-semibold text-brand-navy">{plan.name}</p>
 {isCurrent ? <Badge className="bg-brand-teal text-white">Current</Badge> : 
isRecommended ? <Badge className="bg-amber-100  text-amber-700">Recommended</Badge> : null}
 </div>
 <div className="mt-2">
 {plan.price > 0 ? (
 <>
 <span className="font-display text-2xl font-bold  text-brand-navy">R{plan.price}</span>
 <span className="text-sm text-muted-foreground">{plan.interval}</span>
 <p className="text-xs text-muted-foreground mt-0.5">≈ 
R{calcMonthly(plan.price).toLocaleString()}/month for {truckCount} 
truck{truckCount !== 1 ? "s" : ""}</p>
 </>
 ) : (
 <span className="font-display text-2xl font-bold  text-brand-navy">Custom</span>
 )}
 </div>
 <Badge variant="secondary" className="mt-2  text-[10px]">{plan.truckRange}</Badge>
 <ul className="mt-3 space-y-1.5">
 {plan.features.map((f, i) => (
 <li key={i} className="flex items-start gap-2 text-xs  text-muted-foreground"><Check className="mt-0.5 text-brand-teal shrink-0" 
size={14} /> {f}</li>
 ))}
 </ul>
 </CardContent>
 </Card>
 );
 })}
 </div>
 </div>

 {/* Feature add-ons */}
 <div>
 <h2 className="mb-1 font-display text-lg font-semibold  text-brand-navy">Feature Add-Ons</h2>
 <p className="mb-3 text-xs text-muted-foreground">Toggle to 
activate/deactivate. Billed per truck per month.</p>
 <div className="grid gap-4 sm:grid-cols-2">
 {FEATURE_ADDONS.map((addon) => {
 const active = selectedAddons.includes(addon.id);
 return (
 <Card key={addon.id} className={`cursor-pointer transition-shadow 
hover:shadow-md ${active ? "border-brand-teal ring-1 ring-brand-teal/50" : 
"border-border/60"}`} onClick={() => toggleAddon(addon.id)}>
 <CardContent className="flex items-start justify-between gap-3 p-4">
 <div className="flex items-start gap-3">
 <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active 
? "bg-brand-teal/20" : "bg-brand-blue/10"}`}><addon.icon size={18} 
className={active ? "text-brand-teal" : "text-brand-blue"} /></div>
 <div>
 <p className="text-sm font-semibold text-brand-navy">{addon.name}</p>
 <p className="text-xs text-muted-foreground">{addon.description}</p>
 </div>
 </div>
 <div className="text-right shrink-0">
 <p className="font-display text-lg font-bold  text-brand-navy">R{addon.price}</p>
 <p className="text-[10px] text-muted-foreground">{addon.interval}</p>
 <div className={`mt-1 flex h-5 w-9 items-center rounded-full px-0.5 
transition ${active ? "bg-brand-teal justify-end" : "bg-muted justify-start"}`}>
 <div className="h-4 w-4 rounded-full bg-white shadow" />
 </div>
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 </div>

 {/* Device add-ons */}
 <div>
 <h2 className="mb-1 font-display text-lg font-semibold  text-brand-navy">Device Add-Ons</h2>
 <p className="mb-3 text-xs text-muted-foreground">Hardware bundled with 
connectivity. Set the quantity you need.</p>
 <div className="grid gap-4 sm:grid-cols-2">
 {DEVICE_ADDONS.map((addon) => (
 <Card key={addon.id} className="border-border/60 shadow-sm">
 <CardContent className="flex items-start justify-between gap-3 p-4">
 <div className="flex items-start gap-3">
 <div className="flex h-9 w-9 items-center justify-center rounded-lg  bg-indigo-100"><addon.icon size={18} className="text-indigo-600" /></div>
 <div>
 <p className="text-sm font-semibold text-brand-navy">{addon.name}</p>
 <p className="text-xs text-muted-foreground">{addon.description}</p>
 <div className="mt-2 flex items-center gap-2">
 <Label className="text-xs text-muted-foreground">Qty:</Label>
 <Input type="number" min={0} value={deviceQty} onChange={(e) => 
setDeviceQty(Math.max(0, Number(e.target.value)))} className="w-16 h-8  text-center font-bold" />
 <span className="text-xs text-muted-foreground">= R{(deviceQty * 
addon.price).toLocaleString()}/month</span>
 </div>
 </div>
 </div>
 <div className="text-right shrink-0">
 <p className="font-display text-lg font-bold  text-brand-navy">R{addon.price}</p>
 <p className="text-[10px] text-muted-foreground">{addon.interval}</p>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>

 {/* Specialized compliance add-ons */}
 <div>
 <h2 className="mb-1 font-display text-lg font-semibold  text-brand-navy">Specialized Operations Compliance</h2>
 <p className="mb-3 text-xs text-muted-foreground">Extra compliance modules 
for specialized freight operations. Toggle to activate.</p>
 <div className="grid gap-4 sm:grid-cols-3">
 {COMPLIANCE_ADDONS.map((addon) => {
 const active = selectedAddons.includes(addon.id);
 return (
 <Card key={addon.id} className={`cursor-pointer transition-shadow 
hover:shadow-md ${active ? "border-brand-teal ring-1 ring-brand-teal/50" : 
"border-border/60"}`} onClick={() => toggleAddon(addon.id)}>
 <CardContent className="p-4 space-y-2">
 <div className="flex items-center gap-2">
 <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${active 
? "bg-brand-teal/20" : "bg-rose-100"}`}><addon.icon size={16} className={active 
? "text-brand-teal" : "text-rose-600"} /></div>
 <p className="text-sm font-semibold text-brand-navy">{addon.name}</p>
 </div>
 <p className="text-xs text-muted-foreground">{addon.description}</p>
 <div className="flex items-baseline gap-1 border-t border-border/40 pt-2">
 <span className="font-display text-xl font-bold  text-brand-navy">R{addon.price}</span>
 <span className="text-[10px] text-muted-foreground">{addon.interval}</span>
 </div>
 <div className={`flex h-6 w-full items-center justify-center rounded-md 
text-xs font-medium transition ${active ? "bg-brand-teal text-white" : 
"bg-muted text-muted-foreground"}`}>
 {active ? "✓ Activated" : "Click to Add"}
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 </div>

 {/* Monthly total + save */}
 <Card className="border-brand-navy bg-brand-navy text-white shadow-lg">
 <CardContent className="p-5">
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div>
 <p className="text-xs font-medium uppercase tracking-wider  text-white/60">Estimated Monthly Total</p>
 <p className="font-display text-3xl  font-bold">R{totalMonthly.toLocaleString()}</p>
 <p className="text-xs text-white/60 mt-1">{recommendedPlan} plan · 
{truckCount} truck{truckCount !== 1 ? "s" : ""} · {selectedAddons.length} 
add-on(s) · {deviceQty} device(s)</p>
 </div>
 <Button onClick={saveConfig} disabled={saving} className="gap-2 bg-brand-teal  hover:bg-brand-teal/90 text-white">
 {saving ? "Saving…" : <><Save size={16} /> Save Configuration</>}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
