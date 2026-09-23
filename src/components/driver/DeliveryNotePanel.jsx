import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { FileText, PenTool, Check, Truck, MapPin, Package } from "lucide-react";

export default function DeliveryNotePanel({
  load,
  driver,
  deliveryNote,
  onUpdated,
}) {
  const { toast } = useToast();
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverContact, setReceiverContact] = useState("");
  const [signing, setSigning] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [deliveryNote?.id]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = "#002D5B";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clearSig = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const sign = async () => {
    if (!receiverName) {
      toast({ title: "Receiver name required", variant: "destructive" });
      return;
    }
    if (!hasDrawn) {
      toast({ title: "Please draw a signature", variant: "destructive" });
      return;
    }
    setSigning(true);
    try {
      const canvas = canvasRef.current;
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const file = new File(
        [blob],
        `sig-${deliveryNote.delivery_note_number}.png`,
        { type: "image/png" },
      );
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.DeliveryNote.update(deliveryNote.id, {
        receiver_name: receiverName,
        receiver_contact: receiverContact,
        receiver_signature_url: file_url,
        signed_at: new Date().toISOString(),
        status: "signed",
      });
      toast({
        title: "Delivery note signed",
        description: "Receiver signature  captured",
      });
      onUpdated?.();
    } catch (e) {
      toast({
        title: "Error signing",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  if (!deliveryNote) return null;
  const isSigned =
    deliveryNote.status === "signed" || deliveryNote.status === "completed";

  return (
    <Card className="border-brand-navy/30">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-brand-navy">
          <FileText size={18} />
          <p className="text-sm font-semibold">Delivery Note</p>
          <Badge
            className={
              isSigned
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }
          >
            {isSigned ? "Signed" : "Awaiting Signature"}
          </Badge>
        </div>

        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">DN Number</span>
            <span className="font-mono  font-semibold text-brand-navy">
              {deliveryNote.delivery_note_number}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Load</span>
            <span className="font-semibold">{deliveryNote.load_number}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Client</span>
            <span className="font-semibold">{deliveryNote.client}</span>
          </div>
          <div className="flex items-start gap-1.5 text-sm">
            <MapPin size={14} className="mt-0.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {deliveryNote.origin} →{deliveryNote.destination}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Truck size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">
              {deliveryNote.truck_registration}
            </span>
          </div>
          {deliveryNote.cargo_type && (
            <div className="flex items-center gap-1.5  text-sm">
              <Package size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">
                {deliveryNote.cargo_type}
              </span>
            </div>
          )}
          <div className="border-t border-border/40 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Loaded Tonnage</span>
              <span className="font-bold text-brand-navy">
                {deliveryNote.loaded_tons?.toFixed(3) || "—"} t
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Offloaded Tonnage</span>
              <span className="font-bold text-brand-teal">
                {deliveryNote.offloaded_tons?.toFixed(3) || "—"} t
              </span>
            </div>
          </div>
        </div>

        {isSigned ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm text-emerald-700">
              <Check size={14} />
              <span>
                Signed by
                <strong>{deliveryNote.receiver_name}</strong>
              </span>
            </div>
            {deliveryNote.receiver_signature_url && (
              <Image
                src={deliveryNote.receiver_signature_url}
                className="w-full rounded-lg  border border-border bg-white h-24 object-contain"
                fittingType="fit"
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Show this to the receiver to sign
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Receiver Name</Label>
                <Input
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Contact / ID</Label>
                <Input
                  value={receiverContact}
                  onChange={(e) => setReceiverContact(e.target.value)}
                  placeholder="Phone or ID"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs flex items-center gap-1">
                <PenTool size={12} />
                Receiver Signature
              </Label>
              <canvas
                ref={canvasRef}
                width={320}
                height={120}
                className="w-full rounded-lg border-2 border-border bg-white touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              <button
                onClick={clearSig}
                className="text-xs text-muted-foreground  hover:text-rose-600"
              >
                Clear signature
              </button>
            </div>
            <Button
              onClick={sign}
              disabled={signing}
              className="w-full gap-2  bg-brand-navy hover:bg-brand-navy/90"
            >
              {signing ? (
                "Signing…"
              ) : (
                <>
                  <Check size={16} /> Sign & Complete
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
