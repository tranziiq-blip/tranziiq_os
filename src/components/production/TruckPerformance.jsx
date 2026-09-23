import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Truck, Wrench, Fuel, Activity } from "lucide-react";

export default function TruckPerformance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, loads, jobs, tele] = await Promise.all([
          base44.entities.Truck.list(),
          base44.entities.Load.list("-created_date"),
          base44.entities.JobCard.list("-created_date"),
          base44.entities.TelematicsReading.list("-reading_date"),
        ]);
        const result = t.map((truck) => {
          const tl = loads.filter((l) => l.truck_id === truck.id);
          const openJobs = jobs.filter(
            (j) => j.truck_id === truck.id && j.status !== "completed",
          );
          const downtime = jobs
            .filter((j) => j.truck_id === truck.id)
            .reduce((s, j) => s + (j.downtime_hours || 0), 0);
          const tt = tele.filter((r) => r.truck_id === truck.id);
          const distance = tt.reduce((s, r) => s + (r.distance_km || 0), 0);
          const fuel = tt.reduce(
            (s, r) => s + (r.fuel_consumed_litres || 0),
            0,
          );
          const idle = tt.reduce((s, r) => s + (r.idle_time_minutes || 0), 0);
          const efficiency = fuel > 0 ? (distance / fuel).toFixed(2) : "—";
          const score = tt[0]?.truck_score || 0;
          return {
            ...truck,
            loadsCount: tl.length,
            openJobs: openJobs.length,
            downtime: downtime.toFixed(1),
            distance: distance.toLocaleString(),
            fuel: fuel.toLocaleString(),
            efficiency,
            idleHours: (idle / 60).toFixed(1),
            score,
          };
        });
        setRows(result);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const scoreColor = (s) =>
    s >= 80
      ? "text-emerald-600"
      : s >= 60
        ? "text-amber-600"
        : s > 0
          ? "text-rose-600"
          : "text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Fleet Size</p>
              <Truck size={16} className="text-brand-blue" />
            </div>
            <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
              {rows.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Open Job Cards</p>
              <Wrench size={16} className="text-amber-500" />
            </div>
            <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
              {rows.reduce((s, r) => s + r.openJobs, 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total Downtime</p>
              <Activity size={16} className="text-rose-500" />
            </div>
            <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
              {rows.reduce((s, r) => s + Number(r.downtime), 0).toFixed(1)}h
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total Distance</p>
              <Fuel size={16} className="text-brand-teal" />
            </div>
            <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
              {rows
                .reduce((s, r) => s + Number(r.distance.replace(/,/g, "")), 0)
                .toLocaleString()}
              km
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2  text-base font-semibold">
            <Truck size={16} className="text-brand-navy" /> Truck Performance
            Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Truck</TableHead>
                  <TableHead>Loads</TableHead>
                  <TableHead>Open Jobs</TableHead>
                  <TableHead>Downtime</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Fuel Used</TableHead>
                  <TableHead>Km/L</TableHead>
                  <TableHead>Idle (h)</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center  text-muted-foreground py-8"
                    >
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-8"
                    >
                      No trucks found.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-semibold  text-brand-navy">
                        {r.registration_number}
                      </div>
                      <div className="text-xs  text-muted-foreground">
                        {r.make_model || ""}
                      </div>
                    </TableCell>
                    <TableCell>{r.loadsCount}</TableCell>
                    <TableCell>
                      {r.openJobs > 0 ? (
                        <Badge variant="destructive" className="text-[10px]">
                          {r.openJobs}
                        </Badge>
                      ) : (
                        <span className="text-emerald-600 text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        Number(r.downtime) > 0
                          ? "text-amber-600 font-medium"
                          : ""
                      }
                    >
                      {r.downtime}h
                    </TableCell>
                    <TableCell className="text-xs">{r.distance} km</TableCell>
                    <TableCell className="text-xs">{r.fuel} L</TableCell>
                    <TableCell
                      className={`font-medium ${
                        r.efficiency !== "—" && Number(r.efficiency) < 2
                          ? "text-amber-600"
                          : ""
                      }`}
                    >
                      {r.efficiency}
                    </TableCell>
                    <TableCell className="text-xs">{r.idleHours}</TableCell>
                    <TableCell>
                      <span
                        className={`font-display text-lg font-bold 
${scoreColor(r.score)}`}
                      >
                        {r.score || "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Performance data combines production loads, engineering job cards, and
        telematics readings. Connect a telematics provider via API to populate
        distance, fuel, and truck scores automatically.
      </p>
    </div>
  );
}
