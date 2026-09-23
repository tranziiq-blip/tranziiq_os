import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Fuel, DollarSign, TrendingDown, Gauge } from "lucide-react";

export default function FuelManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [logs, trucks] = await Promise.all([
          base44.entities.FuelLog.list("-created_date"),
          base44.entities.Truck.list(),
        ]);
        const byTruck = {};
        logs.forEach((log) => {
          if (!log.truck_id) return;
          if (!byTruck[log.truck_id])
            byTruck[log.truck_id] = {
              truck_id: log.truck_id,
              reg: log.truck_registration || "",
              litres: 0,
              amount: 0,
              maxOdo: 0,
              minOdo: Infinity,
            };
          byTruck[log.truck_id].litres += log.litres || 0;
          byTruck[log.truck_id].amount += log.amount || 0;
          byTruck[log.truck_id].maxOdo = Math.max(
            byTruck[log.truck_id].maxOdo,
            log.odometer || 0,
          );
          byTruck[log.truck_id].minOdo = Math.min(
            byTruck[log.truck_id].minOdo,
            log.odometer || byTruck[log.truck_id].maxOdo,
          );
        });
        const result = Object.values(byTruck).map((r) => {
          const truck = trucks.find((t) => t.id === r.truck_id);
          const reg = truck?.registration_number || r.reg;
          const dist =
            r.maxOdo > 0 && r.minOdo !== Infinity
              ? r.maxOdo - r.minOdo
              : r.maxOdo;
          const costPerKm = dist > 0 ? (r.amount / dist).toFixed(2) : "—";
          const l100km = dist > 0 ? ((r.litres / dist) * 100).toFixed(1) : "—";
          return { ...r, reg, dist, costPerKm, l100km };
        });
        setRows(result);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalLitres = rows.reduce((s, r) => s + r.litres, 0);
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const avgPerLitre =
    totalLitres > 0 ? (totalAmount / totalLitres).toFixed(2) : "0.00";
  const chartData = rows.map((r) => ({
    name: r.reg,
    litres: Math.round(r.litres),
    cost: Math.round(r.amount),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total Litres</p>
              <Fuel size={16} className="text-brand-blue" />
            </div>
            <p className="mt-1 font-display text-2xl  font-bold  text-brand-navy">
              {totalLitres.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <DollarSign size={16} className="text-brand-teal" />
            </div>
            <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
              R{totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Avg R/Litre</p>
              <Gauge size={16} className="text-indigo-500" />
            </div>
            <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
              R {avgPerLitre}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Trucks Fuelled</p>
              <TrendingDown size={16} className="text-amber-500" />
            </div>
            <p className="mt-1 font-display  text-2xl font-bold text-brand-navy">
              {rows.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2  text-base font-semibold">
            <Fuel size={16} className="text-brand-blue" /> Fuel Consumption by
            Truck
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center  text-muted-foreground text-sm">
              Loading chart…
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center  justify-center text-muted-foreground text-sm">
              No fuel logs recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar
                  dataKey="litres"
                  fill="hsl(var(--brand-blue))"
                  radius={[4, 4, 0, 0]}
                  name="Litres"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2  text-base font-semibold">
            <DollarSign size={16} className="text-brand-teal" />
            Fuel Cost & Efficiency Per Truck
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Truck</TableHead>
                  <TableHead>Litres</TableHead>
                  <TableHead>Amount</TableHead>

                  <TableHead>Distance</TableHead>
                  <TableHead>R/Km</TableHead>
                  <TableHead>L/100km</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center  text-muted-foreground py-8"
                    >
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No fuel data found.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.truck_id}>
                    <TableCell className="font-semibold text-brand-navy">
                      {r.reg}
                    </TableCell>
                    <TableCell>{r.litres.toLocaleString()} L</TableCell>
                    <TableCell>R {r.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">
                      {r.dist.toLocaleString()} km
                    </TableCell>
                    <TableCell
                      className={
                        r.costPerKm !== "—" && Number(r.costPerKm) > 15
                          ? "text-amber-600 font-medium"
                          : ""
                      }
                    >
                      {r.costPerKm !== "—" ? `R ${r.costPerKm}` : "—"}
                    </TableCell>
                    <TableCell
                      className={
                        r.l100km !== "—" && Number(r.l100km) > 50
                          ? "text-amber-600 font-medium"
                          : ""
                      }
                    >
                      {r.l100km !== "—" ? `${r.l100km}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Efficiency metrics (R/Km, L/100km) calculated from odometer readings in
        fuel logs. Drivers log fuel via the mobile app with odometer capture.
      </p>
    </div>
  );
}
