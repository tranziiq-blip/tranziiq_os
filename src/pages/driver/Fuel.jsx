import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 
"@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Fuel as FuelIcon, Camera, Image as ImageIcon } from "lucide-react";

export default function Fuel() {
 const { driver } = useOutletContext();
 const { toast } = useToast();
 const [trucks, setTrucks] = useState([]);
 const [truckId, setTruckId] = useState("");
 const [litres, setLitres] = useState("");
 const [amount, setAmount] = useState("");
 const [odometer, setOdometer] = useState("");
 const [station, setStation] = useState("");
 const [photoUrl, setPhotoUrl] = useState("");
 const [uploading, setUploading] = useState(false);
 const [recent, setRecent] = useState([]);

 useEffect(() => { base44.entities.Truck.filter({ status: "active" 
}).then(setTrucks); }, []);
 useEffect(() => { if (driver) base44.entities.FuelLog.filter({ driver_id: 
driver.id }, "-created_date", 5).then(setRecent); }, [driver?.id]);

 const truck = trucks.find((t) => t.id === truckId);

 const uploadPhoto = async (file) => {
 if (!file) return;
 setUploading(true);
 try {
 const { file_url } = await base44.integrations.Core.UploadFile({ file });
 setPhotoUrl(file_url);
 toast({ title: "Photo uploaded" });
 } catch (e) {
 toast({ title: "Upload failed", description: e.message, variant: 
"destructive" });
 } finally {
 setUploading(false);
 }
 };

 const submit = async () => {
 if (!truckId || !litres) { toast({ title: "Truck & litres required", variant: 
"destructive" }); return; }
 try {
 await base44.entities.FuelLog.create({
 truck_id: truckId,
 truck_registration: truck?.registration_number,
 driver_id: driver?.id,
 litres: Number(litres),
 amount: amount ? Number(amount) : undefined,
 odometer: odometer ? Number(odometer) : undefined,
 station,
 photo_url: photoUrl,
 log_date: new Date().toISOString().slice(0, 10)
 });
 toast({ title: "Fuel logged" });
 setLitres(""); setAmount(""); setOdometer(""); setStation(""); 
setPhotoUrl(""); setTruckId("");
 if (driver) setRecent(await base44.entities.FuelLog.filter({ driver_id: 
driver.id }, "-created_date", 5));
 } catch (e) {
 toast({ title: "Error", description: e.message, variant: "destructive" });
 }
 };

 return (
 <div className="space-y-5 animate-fade-in">
 <div>
 <h1 className="font-display text-xl font-bold text-brand-navy">Fuel 
Logging</h1>
 <p className="text-sm text-muted-foreground">Capture with photo evidence</p>
 </div>

 <Card className="border-border/60 shadow-sm">
 <CardContent className="p-4 space-y-3">
 <div className="grid gap-2">
 <Label>Truck</Label>
 <Select value={truckId} onValueChange={setTruckId}>
 <SelectTrigger><SelectValue placeholder="Choose truck" /></SelectTrigger>
 <SelectContent>{trucks.map((t) => <SelectItem key={t.id} 
value={t.id}>{t.registration_number}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="grid gap-2"><Label>Litres</Label><Input type="number" 
value={litres} onChange={(e) => setLitres(e.target.value)} placeholder="0" 
/></div>
 <div className="grid gap-2"><Label>Amount (R)</Label><Input type="number" 
value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" 
/></div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="grid gap-2"><Label>Odometer (km)</Label><Input type="number" 
value={odometer} onChange={(e) => setOdometer(e.target.value)} /></div>
 <div className="grid gap-2"><Label>Station</Label><Input value={station} 
onChange={(e) => setStation(e.target.value)} placeholder="Engen N1" /></div>
 </div>

 {/* Photo evidence */}
 <div className="grid gap-2">
 <Label>Fuel Slip Photo</Label>
 {photoUrl ? (
 <div className="relative overflow-hidden rounded-lg border border-border">
 <img src={photoUrl} alt="slip" className="w-full" />
 <button onClick={() => setPhotoUrl("")} className="absolute right-2 top-2  rounded-md bg-black/60 px-2 py-1 text-xs text-white">Remove</button>
 </div>
 ) : (
 <label className={`flex cursor-pointer flex-col items-center justify-center 
gap-2 rounded-lg border-2 border-dashed border-border p-6 ${uploading ? 
"opacity-60" : "hover:bg-muted/50"}`}>
 {uploading ? <div className="h-6 w-6 animate-spin rounded-full border-2  border-muted border-t-brand-teal" /> : <Camera 
className="text-muted-foreground" size={28} />}
 <span className="text-xs text-muted-foreground">{uploading ? "Uploading…" : 
"Tap to capture slip"}</span>
 <input type="file" accept="image/*" capture="environment" className="hidden" 
onChange={(e) => uploadPhoto(e.target.files[0])} />
 </label>
 )}
 </div>

 <Button onClick={submit} disabled={uploading} className="w-full gap-2  bg-brand-navy hover:bg-brand-navy/90">
 <FuelIcon size={16} /> Log Fuel
 </Button>
 </CardContent>
 </Card>

 {recent.length > 0 && (
 <div>
 <p className="mb-2 text-xs font-semibold uppercase tracking-wider  text-muted-foreground">Recent Logs</p>
 <div className="space-y-2">
 {recent.map((f) => (
 <Card key={f.id} className="border-border/60">
 <CardContent className="flex items-center justify-between p-3">
 <div className="flex items-center gap-3">
 {f.photo_url ? <img src={f.photo_url} alt="" className="h-10 w-10 rounded  object-cover" /> : <div className="flex h-10 w-10 items-center justify-center  rounded bg-muted"><ImageIcon size={16} className="text-muted-foreground" 
/></div>}
 <div>
 <p className="text-sm font-semibold">{f.truck_registration}</p>
 <p className="text-xs text-muted-foreground">{f.litres} L {f.amount ? `· R 
${f.amount}` : ""}</p>
 </div>
 </div>
 <span className="text-xs text-muted-foreground">{f.log_date}</span>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
