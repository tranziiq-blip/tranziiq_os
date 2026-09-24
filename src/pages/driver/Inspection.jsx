import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Check,
  X,
  ClipboardCheck,
  PenLine,
  Truck,
  CircleDot,
} from "lucide-react";
import { getInspectionSections } from "@/lib/inspectionChecklists";
import { PROFILE_TYPES } from "@/lib/complianceContent";
import { buildDviChecklist } from "@/lib/complianceEngine";
import { getAssetTyreCheckItems } from "@/lib/tyrePositions";
import { fleetTypeMeta, combinationMeta } from "@/lib/fleetTypes";
import CheckItem from "@/components/driver/CheckItem";

export default function Inspection() {
  const navigate = useNavigate();
  const { driver } = useOutletContext();
  const { toast } = useToast();
  const [trucks, setTrucks] = useState([]);
  const [truckId, setTruckId] = useState("");
  const [results, setResults] = useState({});
  const [signature, setSignature] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recent, setRecent] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [complianceProfile, setComplianceProfile] = useState(null);

  useEffect(() => {
    base44.entities.Truck.filter({ status: "active" }).then(setTrucks);
  }, []);

  useEffect(() => {
    if (driver)
      base44.entities.Inspection.filter(
        { driver_id: driver.id },
        "-created_date",
        3,
      ).then(setRecent);
  }, [driver?.id]);

  useEffect(() => {
    setTrailer(null);
    const t = trucks.find((x) => x.id === truckId);
    if (t?.trailer_id)
      base44.entities.Trailer.get(t.trailer_id)
        .then(setTrailer)
        .catch(() => {});
  }, [truckId]);

  // Specialized compliance profile of the driver's active load → additional DVI items
  useEffect(() => {
    (async () => {
      setComplianceProfile(null);
      if (!driver) return;
      const myLoads = await base44.entities.Load.filter(
        { driver_id: driver.id },
        "-created_date",
        10,
      );
      const active = myLoads.find(
        (l) => !["load_completed", "completed", "cancelled"].includes(l.status),
      );
      if (!active) return;
      const profs = await base44.entities.ComplianceProfile.filter({
        load_id: active.id,
      }).catch(() => []);
      setComplianceProfile(profs[0] || null);
    })().catch(() => {});
  }, [driver?.id]);

  const truck = trucks.find((t) => t.id === truckId);
  const fleetType = truck?.fleet_type || "tautliner";
  const comboType = truck?.combination_type || "semi";
  const tyreItems = truck ? getAssetTyreCheckItems(truck, trailer) : [];
  const { sections, allItems, combo } = getInspectionSections(
    fleetType,
    comboType,
    tyreItems,
  );
  const dviItems = complianceProfile
    ? buildDviChecklist(
        complianceProfile.profile_type,
        complianceProfile.cross_border,
      ).map((i) => ({ id: `cdvi_${i.id}`, label: i.label }))
    : [];
  const complianceSection =
    dviItems.length > 0
      ? [
          {
            id: "compliance_dvi",
            title: `${PROFILE_TYPES[complianceProfile.profile_type].label} — Additional DVI 
(Specialized Load)`,
            items: dviItems,
          },
        ]
      : [];
  const allSections = [...sections, ...complianceSection];
  const fullItems = [...allItems, ...dviItems];

  const setResult = (id, val) => setResults((p) => ({ ...p, [id]: val }));
  const answered = Object.keys(results).length;
  const allAnswered = answered === fullItems.length;

  const submit = async (overrideStatus) => {
    if (!truckId) {
      toast({ title: "Select a truck", variant: "destructive" });
      return;
    }
    if (!signature) {
      toast({ title: "Signature name required", variant: "destructive" });
      return;
    }
    const fails = Object.values(results).filter((v) => v === "fail").length;
    const status = overrideStatus || (fails > 0 ? "fail" : "pass");
    setSubmitting(true);
    try {
      await base44.entities.Inspection.create({
        truck_id: truckId,
        truck_registration: truck.registration_number,
        driver_id: driver?.id,
        fleet_type: fleetType,
        checklist_data: fullItems.map((item) =>
          JSON.stringify({
            id: item.id,
            label: item.label,
            result: results[item.id] || "na",
          }),
        ),
        status,
        signature_name: signature,
        notes,
      });
      const inspectedTruckId = truckId;
      if (status === "pass") {
        toast({
          title: "Inspection passed",
          description: "Next: your shift risk assessment",
        });
        // Straight on to the risk assessment for the truck just inspected
        navigate("/driver", { state: { openRisk: true, truckId: inspectedTruckId } });
        return;
      }
      toast({
        title: "Inspection submitted — FAIL",
        description:
          "Report the defects to the workshop. The risk assessment opens once the truck passes inspection.",
        variant: "destructive",
      });
      setResults({});
      setSignature("");
      setNotes("");
      setTruckId("");
      if (driver)
        setRecent(
          await base44.entities.Inspection.filter(
            { driver_id: driver.id },
            "-created_date",
            3,
          ),
        );
    } catch (e) {
      toast({
        title: "Error submitting",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-xl font-bold text-brand-navy">
          Pre-Trip Inspection
        </h1>
        <p className="text-sm text-muted-foreground">
          Truck & trailer checklist with tyre inspection
        </p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-2">
            <Label>Select Truck</Label>
            <Select value={truckId} onValueChange={setTruckId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose truck" />
              </SelectTrigger>
              <SelectContent>
                {trucks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.registration_number} —{fleetTypeMeta(t.fleet_type).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {truck && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-3  py-2">
              <Truck size={16} className="text-brand-teal" />
              <span className="text-sm font-medium">{combo.label}</span>
              <span className="text-xs text-muted-foreground">
                {combo.axles.length}
                axles
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {truck &&
        allSections.map((section) => (
          <Card key={section.id} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase  tracking-wider text-muted-foreground">
                <CircleDot size={14} className="text-brand-teal" />{" "}
                {section.title}
              </p>
              <div className="space-y-0">
                {section.items.map((item) => (
                  <CheckItem
                    key={item.id}
                    item={item}
                    value={results[item.id]}
                    onChange={setResult}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

      {truck && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional remarks…"
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                <PenLine size={14} /> Sign (type your name)
              </Label>
              <Input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="flex items-center justify-between text-xs  text-muted-foreground">
              <span>
                {answered}/{fullItems.length} answered
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => submit("fail")}
                disabled={!truckId || submitting || !signature}
                variant="outline"
                className="flex-1 gap-2 border-rose-300  text-rose-600 hover:bg-rose-50"
              >
                <X size={16} /> Submit Fail
              </Button>
              <Button
                onClick={() => submit()}
                disabled={!allAnswered || !signature || submitting}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Check size={16} /> Submit Pass
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {recent.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider  text-muted-foreground">
            Recent Inspections
          </p>
          <div className="space-y-2">
            {recent.map((r) => (
              <Card key={r.id} className="border-border/60">
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {r.truck_registration}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_date).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      r.status === "pass"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100  text-rose-700"
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
