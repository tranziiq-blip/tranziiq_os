import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  JOB_CARD_STATUS,
  PRIORITY_COLORS,
  getEngineeringChecklist,
} from "@/lib/engineeringChecklists";
import CheckItem from "@/components/driver/CheckItem";
import {
  UserCheck,
  Clock,
  Navigation,
  MapPin,
  Wrench,
  CheckCircle2,
  Package,
  Save,
  Timer,
} from "lucide-react";

function fmtTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDuration(mins) {
  if (!mins) return "—";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function JobCardDetailDialog({
  open,
  onOpenChange,
  jobCard,
  onUpdated,
}) {
  const { toast } = useToast();
  const [mechanic, setMechanic] = useState("");
  const [eta, setEta] = useState("");
  const [checklist, setChecklist] = useState({});
  const [parts, setParts] = useState([]);
  const [newPartName, setNewPartName] = useState("");
  const [newPartQty, setNewPartQty] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (jobCard) {
      setMechanic(jobCard.assigned_technician || "");
      setEta(jobCard.eta_minutes ? String(jobCard.eta_minutes) : "");
      const cl = {};
      (jobCard.checklist_data || []).forEach((raw) => {
        let i = raw;
        if (typeof i === "string") {
          try {
            i = JSON.parse(i);
          } catch {
            i = null;
          }
        }
        if (i?.id) cl[i.id] = i.result;
      });
      setChecklist(cl);
      loadParts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobCard?.id]);

  const [tyrePositions, setTyrePositions] = useState([]);
  useEffect(() => {
    if (!jobCard) return;
    (async () => {
      try {
        if (jobCard.asset_type === "trailer" && jobCard.trailer_id) {
          const tr = await base44.entities.Trailer.get(jobCard.trailer_id);
          setTyrePositions(
            (tr?.tyre_positions || []).map((p) => `Trailer — ${p}`),
          );
        } else if (jobCard.truck_id) {
          const t = await base44.entities.Truck.get(jobCard.truck_id);
          let pos = (t?.tyre_positions || []).map((p) => `Horse — ${p}`);
          if (t?.trailer_id) {
            try {
              const tr = await base44.entities.Trailer.get(t.trailer_id);
              pos = [
                ...pos,
                ...(tr?.tyre_positions || []).map((p) => `Trailer — ${p}`),
              ];
            } catch {
              /* noop */
            }
          }
          setTyrePositions(pos);
        } else {
          setTyrePositions([]);
        }
      } catch {
        setTyrePositions([]);
      }
    })();
  }, [jobCard?.id]);

  const loadParts = async () => {
    if (!jobCard) return;
    const p = await base44.entities.StockMovement.filter({
      job_card_id: jobCard.id,
    });
    setParts(p);
  };

  const update = async (updates, msg) => {
    setSaving(true);
    try {
      await base44.entities.JobCard.update(jobCard.id, updates);
      if (msg) toast({ title: msg });
      onUpdated?.();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const allocate = () => {
    if (!mechanic) {
      toast({ title: "Enter mechanic  name", variant: "destructive" });
      return;
    }
    update(
      { status: "allocated", assigned_technician: mechanic },
      `Allocated to ${mechanic}`,
    );
  };
  const accept = () =>
    update(
      { status: "accepted", accepted_at: new Date().toISOString() },
      "Job accepted",
    );
  const goEnRoute = () =>
    update(
      {
        status: "en_route",
        notified_driver_at: new Date().toISOString(),
        eta_minutes: Number(eta) || 0,
      },
      "Driver notified — on  route",
    );
  const arrive = () => {
    const now = new Date();
    const created = new Date(jobCard.created_date);
    update(
      {
        status: "arrived",
        arrived_at: now.toISOString(),
        response_time_minutes: Math.round((now - created) / 60000),
      },
      "Arrived at  site",
    );
  };
  const startWork = () =>
    update(
      { status: "in_progress", work_started_at: new Date().toISOString() },
      "Work started",
    );
  const complete = async () => {
    const now = new Date();
    const arrived = jobCard.arrived_at ? new Date(jobCard.arrived_at) : now;
    const created = new Date(jobCard.created_date);
    const repairTime = Math.round((now - arrived) / 60000);
    const downtime = Math.round((now - created) / 3600000);
    const sections = getEngineeringChecklist(
      jobCard.asset_type,
      jobCard.job_type,
      tyrePositions,
    );
    const allItems = sections.flatMap((s) => s.items);
    const checklistData = allItems.map((item) =>
      JSON.stringify({
        id: item.id,
        label: item.label,
        result: checklist[item.id] || "na",
      }),
    );
    await update(
      {
        status: "completed",
        completed_at: now.toISOString(),
        repair_time_minutes: repairTime,
        downtime_hours: downtime,
        total_cost: (jobCard.parts_cost || 0) + (jobCard.labour_cost || 0),
        checklist_data: checklistData,
      },
      "Job completed",
    );
    if (jobCard.job_type === "breakdown") {
      try {
        const rca = await base44.entities.RootCauseAnalysis.create({
          job_card_id: jobCard.id,
          breakdown_report_id: jobCard.breakdown_report_id || "",
          truck_id: jobCard.truck_id,
          truck_registration: jobCard.truck_registration,
          failure_category: "engine",
          status: "open",
        });
        await base44.entities.JobCard.update(jobCard.id, { rca_id: rca.id });
        toast({
          title: "RCA auto-opened — 24h SLA started",
          description: "Complete  root cause analysis within 24 hours",
        });
        onUpdated?.();
      } catch {
        /* noop */
      }
    }
  };

  const addPart = async () => {
    if (!newPartName) return;
    await base44.entities.StockMovement.create({
      part_name: newPartName,
      movement_type: "dispatch",
      quantity: Number(newPartQty) || 1,
      job_card_id: jobCard.id,
      truck_id: jobCard.truck_id,
      reference: jobCard.title,
    });
    toast({ title: "Part requested" });
    setNewPartName("");
    setNewPartQty("");
    loadParts();
  };

  const saveChecklist = async () => {
    const sections = getEngineeringChecklist(
      jobCard.asset_type,
      jobCard.job_type,
      tyrePositions,
    );
    const allItems = sections.flatMap((s) => s.items);
    const checklistData = allItems.map((item) =>
      JSON.stringify({
        id: item.id,
        label: item.label,
        result: checklist[item.id] || "na",
      }),
    );
    await update({ checklist_data: checklistData }, "Checklist saved");
  };

  if (!jobCard) return null;
  const status = JOB_CARD_STATUS[jobCard.status] || JOB_CARD_STATUS.open;
  const showChecklist = ["service", "inspection", "preventative"].includes(
    jobCard.job_type,
  );
  const sections = getEngineeringChecklist(
    jobCard.asset_type,
    jobCard.job_type,
    tyrePositions,
  );

  const TimelineItem = ({ label, time, icon: Icon, done }) => (
    <div
      className={`flex items-center gap-2 text-xs ${
        done ? "text-foreground" : "text-muted-foreground/50"
      }`}
    >
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full ${
          done ? "bg-brand-teal text-white" : "bg-muted"
        }`}
      >
        <Icon size={12} />
      </div>
      <span className="font-medium">{label}</span>
      {done && <span className="ml-auto text-muted-foreground">{time}</span>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg">{jobCard.title}</DialogTitle>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm">
            <div>
              <span className="text-muted-foreground">Asset:</span>{" "}
              <span className="font-medium">
                {jobCard.truck_registration || jobCard.title}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>{" "}
              <span className="font-medium capitalize">{jobCard.job_type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Priority:</span>{" "}
              <Badge className={PRIORITY_COLORS[jobCard.priority]}>
                {jobCard.priority}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Technician:</span>{" "}
              <span className="font-medium">
                {jobCard.assigned_technician || "Unassigned"}
              </span>
            </div>
            {jobCard.description && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Description:</span>
                {jobCard.description}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-2 rounded-lg border border-border/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider  text-muted-foreground">
              Timeline
            </p>
            <TimelineItem
              label="Created"
              time={fmtTime(jobCard.created_date)}
              icon={Clock}
              done
            />
            <TimelineItem
              label="Accepted"
              time={fmtTime(jobCard.accepted_at)}
              icon={UserCheck}
              done={!!jobCard.accepted_at}
            />
            <TimelineItem
              label="On Route"
              time={fmtTime(jobCard.notified_driver_at)}
              icon={Navigation}
              done={!!jobCard.notified_driver_at}
            />
            <TimelineItem
              label="Arrived"
              time={fmtTime(jobCard.arrived_at)}
              icon={MapPin}
              done={!!jobCard.arrived_at}
            />
            <TimelineItem
              label="Work Started"
              time={fmtTime(jobCard.work_started_at)}
              icon={Wrench}
              done={!!jobCard.work_started_at}
            />
            <TimelineItem
              label="Completed"
              time={fmtTime(jobCard.completed_at)}
              icon={CheckCircle2}
              done={!!jobCard.completed_at}
            />
            {jobCard.status === "completed" && (
              <div className="mt-2 flex gap-4 border-t border-border/40 pt-2 text-xs">
                <span className="flex items-center gap-1">
                  <Timer size={12} className="text-brand-teal" /> Response:
                  <strong>{fmtDuration(jobCard.response_time_minutes)}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Wrench size={12} className="text-brand-blue" /> Repair:
                  <strong>{fmtDuration(jobCard.repair_time_minutes)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Workflow actions */}
          <div className="space-y-3">
            {jobCard.status === "open" && (
              <div className="flex items-end gap-2">
                <div className="flex-1 grid gap-1">
                  <Label className="text-xs">Allocate Mechanic</Label>
                  <Input
                    value={mechanic}
                    onChange={(e) => setMechanic(e.target.value)}
                    placeholder="Mechanic name"
                  />
                </div>
                <Button
                  onClick={allocate}
                  disabled={saving}
                  className="bg-brand-navy  hover:bg-brand-navy/90"
                >
                  Allocate
                </Button>
              </div>
            )}
            {jobCard.status === "allocated" && (
              <Button
                onClick={accept}
                disabled={saving}
                className="w-full gap-2 bg-brand-teal hover:bg-brand-teal/90"
              >
                <UserCheck size={16} /> Accept Job
              </Button>
            )}
            {jobCard.status === "accepted" && (
              <div className="flex items-end gap-2">
                <div className="flex-1 grid gap-1">
                  <Label className="text-xs">ETA (minutes)</Label>
                  <Input
                    type="number"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    placeholder="45"
                  />
                </div>
                <Button
                  onClick={goEnRoute}
                  disabled={saving}
                  className="gap-2 bg-indigo-600  hover:bg-indigo-700"
                >
                  <Navigation size={16} /> On Route — Notify Driver
                </Button>
              </div>
            )}
            {jobCard.status === "en_route" && (
              <Button
                onClick={arrive}
                disabled={saving}
                className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700"
              >
                <MapPin size={16} />
                Arrived at Site
              </Button>
            )}
            {jobCard.status === "arrived" && (
              <Button
                onClick={startWork}
                disabled={saving}
                className="w-full gap-2 bg-blue-600  hover:bg-blue-700"
              >
                <Wrench size={16} /> Start Work
              </Button>
            )}
            {(jobCard.status === "in_progress" ||
              jobCard.status === "parts_ordered") && (
              <Button
                onClick={complete}
                disabled={saving}
                className="w-full gap-2  bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} /> Complete Job
              </Button>
            )}
          </div>

          {/* Parts request */}
          {(jobCard.status === "in_progress" ||
            jobCard.status === "parts_ordered" ||
            parts.length > 0) && (
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase  tracking-wider text-muted-foreground">
                <Package size={14} /> Parts Requested
              </p>
              {parts.length > 0 && (
                <div className="space-y-1">
                  {parts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between  text-xs"
                    >
                      <span>{p.part_name}</span>
                      <Badge variant="secondary">x{p.quantity}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {(jobCard.status === "in_progress" ||
                jobCard.status === "parts_ordered") && (
                <div className="flex items-end gap-2 pt-1">
                  <Input
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="Part name"
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(e.target.value)}
                    placeholder="Qty"
                    className="w-20 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={addPart}>
                    Add
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Checklist */}
          {showChecklist && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider  text-muted-foreground">
                  {jobCard.asset_type === "trailer" ? "Trailer" : "Truck"}
                  Service Checklist
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveChecklist}
                  disabled={saving}
                  className="gap-1"
                >
                  <Save size={14} /> Save
                </Button>
              </div>
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-lg border border-border/60 p-3"
                >
                  <p className="mb-2 text-sm font-semibold text-brand-navy">
                    {section.title}
                  </p>
                  <div className="space-y-0">
                    {section.items.map((item) => (
                      <CheckItem
                        key={item.id}
                        item={item}
                        value={checklist[item.id]}
                        onChange={(id, val) =>
                          setChecklist((p) => ({ ...p, [id]: val }))
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
