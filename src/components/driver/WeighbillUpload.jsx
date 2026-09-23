import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Scale, Camera, Check, Upload } from "lucide-react";

export default function WeighbillUpload({ load, type, onSaved }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [tareWeight, setTareWeight] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const isLoaded = type === "loaded";
  const netWeight = (Number(grossWeight) || 0) - (Number(tareWeight) || 0);
  const netTons = Math.max(netWeight / 1000, 0);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (!ticketNumber || !grossWeight) {
      toast({
        title: "Ticket number & gross weight required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      let fileUrl = "";
      if (photoFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({
          file: photoFile,
        });
        fileUrl = file_url;
      }

      await base44.entities.Weighbill.create({
        ticket_number: ticketNumber,
        truck_id: load.truck_id,
        truck_registration: load.truck_registration || "",
        commodity: load.cargo_type || "",
        gross_weight: Number(grossWeight),
        tare_weight: Number(tareWeight) || 0,
        net_weight: netWeight,
        net_weight_tons: netTons,
        supplier: load.origin || "",
        destination: load.destination || "",
        cargo_type: load.cargo_type || "",
        log_date: new Date().toISOString().slice(0, 10),
        load_id: load.id,
        load_number: load.load_number,
        weighbill_type: type,
        file_url: fileUrl,
      });

      const loadUpdate = isLoaded
        ? { loaded_weight_tons: netTons, weight_tons: netTons }
        : { offloaded_weight_tons: netTons };
      await base44.entities.Load.update(load.id, loadUpdate);

      // Auto-compile transport manifest for cross-border loads (on loaded weighbill only)
      if (load.cross_border && isLoaded) {
        try {
          let truckReg = load.truck_registration || "";
          let driverName = "";
          if (load.truck_id && !truckReg) {
            const truckData = await base44.entities.Truck.get(
              load.truck_id,
            ).catch(() => null);
            if (truckData) truckReg = truckData.registration_number || "";
          }
          if (load.driver_id) {
            const driverData = await base44.entities.Driver.get(
              load.driver_id,
            ).catch(() => null);
            if (driverData)
              driverName = driverData.full_name || driverData.name || "";
          }
          const existingMF = await base44.entities.TransportManifest.filter({
            load_id: load.id,
          }).catch(() => []);
          if (existingMF.length === 0) {
            await base44.entities.TransportManifest.create({
              manifest_number: `MF-${load.load_number || Date.now().toString().slice(-6)}`,
              load_id: load.id,
              load_number: load.load_number,
              client: load.client || "",
              origin: load.origin || "",
              destination: load.destination || "",
              border_post: load.border_post || "",
              cargo_type: load.cargo_type || "",
              gross_weight: Number(grossWeight),
              tare_weight: Number(tareWeight) || 0,
              net_weight: netWeight,
              net_weight_tons: netTons,
              truck_registration: truckReg,
              driver_name: driverName,
              freight_forwarder: load.freight_forwarder || "",
              weighbill_ticket_number: ticketNumber,
              weighbill_file_url: fileUrl,
              manifest_status: "pending_review",
              customs_status: "pending",
              compiled_at: new Date().toISOString(),
            });
            toast({
              title:
                "Weighbill captured — transport manifest auto-compiled for  clearing agent",
            });
          } else {
            toast({
              title: `Weighbill captured — load ${
                isLoaded ? "loaded" : "offloaded"
              } weight updated`,
            });
          }
        } catch (e) {
          toast({
            title: "Weighbill captured, manifest creation failed",
            description: e.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: `Weighbill captured — load ${
            isLoaded ? "loaded" : "offloaded"
          } weight updated`,
        });
      }
      setTicketNumber("");
      setGrossWeight("");
      setTareWeight("");
      setPhotoUrl("");
      setPhotoFile(null);
      onSaved?.();
    } catch (e) {
      toast({
        title: "Error capturing weighbill",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-brand-teal/30">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-brand-navy">
          <Scale size={16} />
          <p className="text-sm font-semibold">
            {isLoaded ? "Loaded Weighbill" : "Offloaded Weighbill"}
          </p>
          <Badge className="bg-brand-teal/10 text-brand-teal text-[10px]">
            {isLoaded ? "Weighing Out Loaded" : "Weighing Out Empty"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Ticket Number</Label>
            <Input
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="WB-001"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Gross Weight (kg)</Label>
            <Input
              type="number"
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
              placeholder="32000"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Tare Weight (kg)</Label>
            <Input
              type="number"
              value={tareWeight}
              onChange={(e) => setTareWeight(e.target.value)}
              placeholder="15000"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Net Weight (kg)</Label>
            <div className="flex h-9 items-center rounded-md border border-input bg-muted  px-3 font-semibold text-brand-navy">
              {netWeight.toLocaleString()}
            </div>
          </div>
        </div>

        <p className="text-xs font-medium text-muted-foreground">
          Net:{" "}
          <span className="text-brand-navy font-bold">
            {netTons.toFixed(3)} tons
          </span>
        </p>

        {/* Photo upload */}
        <div className="space-y-2">
          {photoUrl ? (
            <div className="relative">
              <Image
                src={photoUrl}
                className="w-full rounded-lg border border-border h-40  object-cover"
                fittingType="fill"
              />
              <button
                onClick={() => {
                  setPhotoUrl("");
                  setPhotoFile(null);
                }}
                className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs  text-white"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full  flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-border  py-6 text-muted-foreground hover:bg-muted/50"
            >
              <Camera size={24} />
              <span className="text-xs font-medium">
                Capture / Upload Weighbill Photo
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />
        </div>

        <Button
          onClick={submit}
          disabled={saving}
          className="w-full gap-2  bg-brand-teal hover:bg-brand-teal/90"
        >
          {saving ? (
            "Saving…"
          ) : (
            <>
              <Check size={16} /> Capture & Update Load
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
