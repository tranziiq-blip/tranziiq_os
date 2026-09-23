import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import LoadStatusTracker from "@/components/driver/LoadStatusTracker";
import WeighbillUpload from "@/components/driver/WeighbillUpload";
import WeighbillCaptureDialog from "@/components/driver/WeighbillCaptureDialog";
import DeliveryNotePanel from "@/components/driver/DeliveryNotePanel";
import DeliveryNoteDialog from "@/components/driver/DeliveryNoteDialog";
import ComplianceIncidentDialog from "@/components/driver/ComplianceIncidentDialog";
import { PROFILE_TYPES } from "@/lib/complianceContent";
import { gateSummary } from "@/lib/complianceEngine";
import {
  Package,
  MapPin,
  Check,
  ArrowRight,
  Truck as TruckIcon,
  Scale,
  AlertTriangle,
} from "lucide-react";

const TERMINAL_STATUSES = ["load_completed", "completed", "cancelled"];

export default function LoadManagement() {
  const { driver } = useOutletContext();
  const { toast } = useToast();
  const [activeLoad, setActiveLoad] = useState(null);
  const [availableLoads, setAvailableLoads] = useState([]);
  const [deliveryNote, setDeliveryNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [capture, setCapture] = useState(null);
  const [dnDialog, setDnDialog] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [incidentOpen, setIncidentOpen] = useState(false);

  const loadDeliveryNote = async (loadId) => {
    if (!loadId) return null;
    try {
      const notes = await base44.entities.DeliveryNote.filter({
        load_id: loadId,
      });
      return notes[0] || null;
    } catch {
      return null;
    }
  };

  const loadData = async () => {
    if (!driver) return;
    const loads = await base44.entities.Load.filter(
      { driver_id: driver.id },
      "-created_date",
      20,
    );
    const inFlight = loads.find((l) => !TERMINAL_STATUSES.includes(l.status));
    setActiveLoad(
      inFlight && inFlight.status !== "accepting_load" ? inFlight : null,
    );

    if (inFlight) {
      const dn = await loadDeliveryNote(inFlight.id);
      setDeliveryNote(dn);
      try {
        const profs = await base44.entities.ComplianceProfile.filter({
          load_id: inFlight.id,
        });
        setActiveProfile(profs[0] || null);
      } catch {
        setActiveProfile(null);
      }
    } else {
      setDeliveryNote(null);
      setActiveProfile(null);
    }

    if (
      !inFlight ||
      inFlight.status === "load_completed" ||
      inFlight.status === "accepting_load"
    ) {
      const unassigned = await base44.entities.Load.filter(
        { status: "accepting_load" },
        "-created_date",
        20,
      );
      setAvailableLoads(
        unassigned.filter((l) => !l.driver_id || l.driver_id === driver.id),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.id]);

  const acceptLoad = async (load) => {
    setAccepting(load.id);
    try {
      // Dispatch gate — a load with a specialized compliance profile cannot move
      // while any required document is missing/expired/failed for any jurisdiction
      const profs = await base44.entities.ComplianceProfile.filter({
        load_id: load.id,
      }).catch(() => []);
      const prof = profs[0];
      if (prof) {
        const gate = gateSummary(prof);
        if (gate.blocked) {
          toast({
            title: "Dispatch gate blocked",
            description: `${gate.failures.length} required 
${PROFILE_TYPES[prof.profile_type]?.label || "compliance"} document(s) missing, 
expired or failed — the compliance checklist must be cleared before departure.`,
            variant: "destructive",
          });
          return;
        }
      }
      await base44.entities.Load.update(load.id, {
        driver_id: driver.id,
        truck_id: driver.assigned_truck_id || "",
        status: "enroute_to_loading",
      });
      toast({ title: "Load accepted", description: load.load_number });
      loadData();
    } catch (e) {
      toast({
        title: "Error accepting load",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setAccepting(null);
    }
  };

  const ensureDeliveryNote = async () => {
    const existing = await loadDeliveryNote(activeLoad.id);
    if (existing) return existing;
    const dnNumber = `DN-${
      (activeLoad.load_number || "").replace(/^LD-/, "") ||
      Date.now().toString().slice(-6)
    }`;
    const dn = await base44.entities.DeliveryNote.create({
      delivery_note_number: dnNumber,
      load_id: activeLoad.id,
      load_number: activeLoad.load_number,
      driver_id: driver.id,
      driver_name: driver.full_name,
      truck_registration: activeLoad.truck_registration || "",
      client: activeLoad.client || "",
      origin: activeLoad.origin || "",
      destination: activeLoad.destination || "",
      cargo_type: activeLoad.cargo_type || "",
      loaded_tons: activeLoad.loaded_weight_tons || activeLoad.weight_tons || 0,
      offloaded_tons: activeLoad.offloaded_weight_tons || 0,
      delivered_date: new Date().toISOString().slice(0, 10),
      status: "pending_signature",
    });
    await base44.entities.Load.update(activeLoad.id, {
      delivery_note_id: dn.id,
    });
    return dn;
  };

  const handleWeighbillSaved = async (type) => {
    setCapture(null);
    await loadData();
    if (type === "offloaded" && activeLoad) {
      try {
        const dn = await ensureDeliveryNote();
        setDeliveryNote(dn);
        setDnDialog(true);
        toast({
          title: "Weighbill captured",
          description:
            "Present the delivery note  to the receiver for signature",
        });
      } catch (e) {
        toast({
          title: "Error preparing delivery note",
          description: e.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleRequireDeliveryNote = async () => {
    if (!activeLoad) return;
    try {
      const dn = await ensureDeliveryNote();
      setDeliveryNote(dn);
      setDnDialog(true);
    } catch (e) {
      toast({
        title: "Error preparing delivery note",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    if (!activeLoad) return;
    try {
      const dn = await loadDeliveryNote(activeLoad.id);
      if (dn && dn.status === "signed") {
        await base44.entities.DeliveryNote.update(dn.id, {
          status: "completed",
        });
      }
      await loadData();
    } catch (e) {
      toast({
        title: "Error completing load",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  if (!driver)
    return (
      <p className="text-center text-muted-foreground  py-12">
        Select a driver…
      </p>
    );
  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-muted border-t-brand-teal rounded-full  animate-spin" />
      </div>
    );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-xl font-bold text-brand-navy">
          Load Management
        </h1>
        <p className="text-sm text-muted-foreground">
          {activeLoad ? "Track your active  load" : "Accept an available load"}
        </p>
      </div>

      {activeLoad ? (
        <>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-brand-navy">
                <Package size={18} />
                <p className="text-sm font-semibold">Active Load</p>
              </div>
              <p className="font-display text-lg font-bold">
                {activeLoad.load_number}
              </p>
              <p className="text-sm text-muted-foreground">
                {activeLoad.client}
              </p>
              <div className="flex items-start gap-1.5 text-sm">
                <MapPin size={14} className="mt-0.5 text-muted-foreground" />
                <span>
                  {activeLoad.origin} →{activeLoad.destination}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activeLoad.weight_tons && (
                  <Badge variant="secondary" className="text-xs">
                    {activeLoad.weight_tons} t
                  </Badge>
                )}
                {activeLoad.loaded_weight_tons > 0 && (
                  <Badge className="bg-cyan-100  text-cyan-700 text-xs">
                    Loaded: {activeLoad.loaded_weight_tons.toFixed(3)}t
                  </Badge>
                )}
                {activeLoad.offloaded_weight_tons > 0 && (
                  <Badge className="bg-teal-100  text-teal-700 text-xs">
                    Offloaded: {activeLoad.offloaded_weight_tons.toFixed(3)}t
                  </Badge>
                )}
                {activeLoad.cross_border && (
                  <Badge className="bg-amber-100 text-amber-700  text-xs">
                    Cross-Border
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <LoadStatusTracker
            load={activeLoad}
            onUpdated={loadData}
            onComplete={handleComplete}
            deliveryNoteSigned={
              deliveryNote?.status === "signed" ||
              deliveryNote?.status === "completed"
            }
            onWeighbillCapture={setCapture}
            onRequireDeliveryNote={handleRequireDeliveryNote}
          />

          {activeProfile && (
            <Button
              variant="outline"
              onClick={() => setIncidentOpen(true)}
              className="w-full gap-2 border-rose-300 text-rose-600 hover:bg-rose-50"
            >
              <AlertTriangle size={16} /> Report Emergency / Deviation
            </Button>
          )}

          {/* Weighbill upload at weighing steps */}
          {(activeLoad.status === "weighing_out_loaded" ||
            activeLoad.status === "weighing_out_empty") && (
            <WeighbillUpload
              load={activeLoad}
              type={
                activeLoad.status === "weighing_out_loaded"
                  ? "loaded"
                  : "offloaded"
              }
              onSaved={loadData}
            />
          )}

          {/* Delivery note after load completion */}
          {activeLoad.status === "load_completed" && deliveryNote && (
            <DeliveryNotePanel
              load={activeLoad}
              driver={driver}
              deliveryNote={deliveryNote}
              onUpdated={loadData}
            />
          )}

          {/* Automatic weighbill capture pop-ups at weighing-out steps */}
          <WeighbillCaptureDialog
            open={!!capture}
            onOpenChange={(v) => !v && setCapture(null)}
            load={activeLoad}
            type={capture}
            onSaved={() => handleWeighbillSaved(capture)}
          />

          {/* Delivery note signature pop-up — required before completing the load */}
          <DeliveryNoteDialog
            open={dnDialog}
            onOpenChange={setDnDialog}
            load={activeLoad}
            driver={driver}
            deliveryNote={deliveryNote}
            onUpdated={loadData}
          />

          <ComplianceIncidentDialog
            open={incidentOpen}
            onOpenChange={setIncidentOpen}
            activeLoad={activeLoad}
            driver={driver}
            profile={activeProfile}
            onSaved={() => {}}
          />
        </>
      ) : availableLoads.length > 0 ? (
        <div className="space-y-3">
          {availableLoads.map((load) => (
            <Card key={load.id} className="border-border/60 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-display font-bold text-brand-navy">
                    {load.load_number}
                  </p>
                  {load.cargo_type && (
                    <Badge variant="secondary" className="text-xs">
                      {load.cargo_type}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{load.client}</p>
                <div className="flex items-start gap-1.5 text-sm">
                  <MapPin size={14} className="mt-0.5 text-muted-foreground" />
                  <span>
                    {load.origin} →{load.destination}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {load.weight_tons && (
                    <p className="text-xs  text-muted-foreground">
                      {load.weight_tons} tons
                    </p>
                  )}
                  {load.cross_border && (
                    <Badge className="bg-amber-100 text-amber-700  text-xs">
                      Cross-Border
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => acceptLoad(load)}
                  disabled={accepting === load.id}
                  className="w-full gap-2 bg-brand-navy hover:bg-brand-navy/90"
                >
                  {accepting === load.id ? (
                    "Accepting…"
                  ) : (
                    <>
                      <Check size={16} /> Accept Load
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-8 text-center">
            <TruckIcon className="mx-auto text-muted-foreground/40" size={40} />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No loads available
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              New loads will appear here when dispatched
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
