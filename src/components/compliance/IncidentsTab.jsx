import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { PROFILE_TYPES } from "@/lib/complianceContent";

const TYPE_LABELS = {
  spill: "DG Spill / Release",
  temperature_breach: "Temperature Breach",
  route_deviation: "Route Deviation",
  geofence_breach: "Geofence / Restricted Zone",
  time_window_violation: "Travel  Time Window",
  other: "Other Deviation",
};
const SEVERITY_COLORS = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-rose-100 text-rose-700",
};
const STATUS_COLORS = {
  open: "bg-rose-100 text-rose-700",
  investigating: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

export default function IncidentsTab({ incidents, onRefresh }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const list = incidents.filter((i) => filter === "all" || i.status === filter);

  const updateStatus = async (id, status) => {
    await base44.entities.ComplianceIncident.update(id, { status });
    toast({ title: "Incident status updated" });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3  p-4">
          <div>
            <p className="text-sm font-semibold text-brand-navy">
              Compliance Incident Register
            </p>
            <p className="text-xs text-muted-foreground">
              Spills, temperature breaches, route deviations & time-window
              violations. Map records to your own SHEQ/SHERQ numbering via the
              reference column.
            </p>
          </div>
          <div className="flex gap-1.5">
            {["all", "open", "investigating", "resolved"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  filter === s
                    ? "bg-brand-navy text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}{" "}
                {s !== "all" &&
                  `(${incidents.filter((i) => i.status === s).length})`}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Register #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Module</TableHead>

                <TableHead>Load</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead>SHEQ Ref</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8  text-center text-muted-foreground"
                  >
                    No compliance incidents recorded — monitoring breaches and
                    driver reports appear here automatically.
                  </TableCell>
                </TableRow>
              )}
              {list.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-xs font-semibold">
                    {i.register_number || "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    <p className="font-medium">
                      {TYPE_LABELS[i.incident_type] || i.incident_type}
                    </p>
                    {i.emergency_services_notified && (
                      <Badge className="mt-0.5 bg-rose-100  text-rose-700 text-[9px]">
                        Emergency services notified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {PROFILE_TYPES[i.profile_type]?.label || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <p className="font-medium">{i.load_number || "—"}</p>
                    <p className="text-muted-foreground">
                      {i.truck_registration || ""}
                      {i.location ? ` · ${i.location}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[10px] capitalize 
${SEVERITY_COLORS[i.severity]}`}
                    >
                      {i.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {i.detected_at
                      ? new Date(i.detected_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {i.sheq_reference || "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={i.status}
                      onValueChange={(v) => updateStatus(i.id, v)}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <Badge
                          className={`pointer-events-none text-[10px] 
${STATUS_COLORS[i.status]}`}
                        >
                          {i.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="investigating">
                          Investigating
                        </SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
