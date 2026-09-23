import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
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
import { AlertTriangle, Wrench, Camera } from "lucide-react";

const TYPES = [
  { key: "breakdown", label: "Breakdown", icon: Wrench },
  { key: "incident", label: "Incident", icon: AlertTriangle },
  { key: "near_miss", label: "Near Miss", icon: AlertTriangle },
];

const SEVERITY = [
  { key: "low", label: "Low", color: "text-emerald-600" },
  { key: "medium", label: "Medium", color: "text-amber-600" },
  { key: "high", label: "High", color: "text-orange-600" },
  { key: "critical", label: "Critical", color: "text-rose-600" },
];

export default function Breakdown() {
  const { driver } = useOutletContext();
  const { toast } = useToast();
  const [trucks, setTrucks] = useState([]);
  const [truckId, setTruckId] = useState("");
  const [reportType, setReportType] = useState("breakdown");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    base44.entities.Truck.filter({ status: "active" }).then(setTrucks);
  }, []);
  useEffect(() => {
    if (driver)
      base44.entities.BreakdownReport.filter(
        {
          driver_id: driver.id,
        },
        "-created_date",
        5,
      ).then(setRecent);
  }, [driver?.id]);

  const truck = trucks.find((t) => t.id === truckId);

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!truckId || !description) {
      toast({ title: "Truck & description  required", variant: "destructive" });
      return;
    }
    try {
      const report = await base44.entities.BreakdownReport.create({
        truck_id: truckId,
        truck_registration: truck?.registration_number,
        driver_id: driver?.id,
        report_type: reportType,
        severity,
        description,
        location,
        photo_url: photoUrl,
        status: "open",
      });
      if (reportType === "breakdown") {
        await base44.entities.JobCard.create({
          truck_id: truckId,
          truck_registration: truck?.registration_number,
          breakdown_report_id: report.id,
          job_type: "breakdown",
          title: `Breakdown: ${truck?.registration_number}`,
          description,
          status: "open",
          priority:
            severity === "critical"
              ? "critical"
              : severity === "high"
                ? "high"
                : "medium",
          asset_type: "truck",
        });
      }
      toast({
        title: "Report submitted",
        description:
          reportType === "breakdown"
            ? "Job card auto-created for engineering"
            : undefined,
      });
      setDescription("");
      setLocation("");
      setPhotoUrl("");
      setTruckId("");
      if (driver)
        setRecent(
          await base44.entities.BreakdownReport.filter(
            {
              driver_id: driver.id,
            },
            "-created_date",
            5,
          ),
        );
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-xl font-bold text-brand-navy">
          Report Issue
        </h1>
        <p className="text-sm text-muted-foreground">
          Breakdown, incident or near-miss
        </p>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setReportType(t.key)}
            className={`flex 
flex-col items-center gap-1 rounded-lg border p-3 transition ${
              reportType === t.key
                ? "border-brand-teal bg-brand-teal/5 text-brand-teal"
                : "border-border  bg-card text-muted-foreground"
            }`}
          >
            <t.icon size={20} />
            <span className="text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-2">
            <Label>Truck</Label>
            <Select value={truckId} onValueChange={setTruckId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose truck" />
              </SelectTrigger>
              <SelectContent>
                {trucks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.registration_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Severity</Label>
            <div className="flex gap-2">
              {SEVERITY.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSeverity(s.key)}
                  className={`flex-1 
rounded-lg border py-2 text-xs font-medium transition ${
                    severity === s.key
                      ? `border-current ${s.color} bg-muted`
                      : "border-border  text-muted-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. N1 near Polokwane"
            />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what happened…"
            />
          </div>
          <div className="grid gap-2">
            <Label>Photo</Label>
            {photoUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <img src={photoUrl} alt="evidence" className="w-full" />
                <button
                  onClick={() => setPhotoUrl("")}
                  className="absolute right-2 top-2  rounded-md bg-black/60 px-2 py-1 text-xs text-white"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                className={`flex cursor-pointer flex-col items-center justify-center 
gap-2 rounded-lg border-2 border-dashed border-border p-6 ${
                  uploading ? "opacity-60" : "hover:bg-muted/50"
                }`}
              >
                {uploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2  border-muted border-t-brand-teal" />
                ) : (
                  <Camera className="text-muted-foreground" size={28} />
                )}
                <span className="text-xs text-muted-foreground">
                  {uploading ? "Uploading…" : "Add photo evidence"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => uploadPhoto(e.target.files[0])}
                />
              </label>
            )}
          </div>
          <Button
            onClick={submit}
            disabled={uploading}
            className="w-full gap-2  bg-brand-navy hover:bg-brand-navy/90"
          >
            <AlertTriangle size={16} /> Submit Report
          </Button>
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider  text-muted-foreground">
            Recent Reports
          </p>
          <div className="space-y-2">
            {recent.map((r) => (
              <Card key={r.id} className="border-border/60">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold  capitalize">
                      {r.report_type.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold 
${
  r.status === "open"
    ? "bg-rose-100 text-rose-700"
    : r.status === "in_progress"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100  text-emerald-700"
}`}
                    >
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.truck_registration} ·{r.location}
                  </p>
                  <p className="mt-1 text-sm">{r.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
