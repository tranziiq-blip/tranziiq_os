import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { canSeeFinance } from "@/lib/financeAccess";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Truck,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Clock,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fleetTypeMeta } from "@/lib/fleetTypes";

const DAY = 86400000;
const IN_FLIGHT = [
  "enroute_to_loading", "arrived_at_loading", "queue_to_load", "weighing_in_empty",
  "loading", "weighing_out_loaded", "at_border", "cleared", "enroute_to_offloading",
  "arrived_at_offloading", "queue_to_offload", "weighing_in_loaded", "offloading",
  "weighing_out_empty", "in_transit", "customs_hold", "at_destination", "unloading", "loaded",
];
const DONE = ["load_completed", "delivered", "pod_captured", "completed"];
const JOB_CLOSED = ["completed", "cancelled", "closed"];

const safe = (p) => p.catch(() => []);
const toDate = (v) => (v ? new Date(v) : null);
const daysUntil = (v) => {
  const d = toDate(v);
  return d && !isNaN(d) ? Math.floor((d - Date.now()) / DAY) : null;
};
const rand = (n) =>
  "R " + Math.round(n || 0).toLocaleString("en-ZA").replace(/,/g, " ");
const compactRand = (n) =>
  n >= 1e6 ? `R ${(n / 1e6).toFixed(1)}m` : n >= 1e4 ? `R ${Math.round(n / 1e3)}k` : rand(n);
const completedAt = (l) => toDate(l.status_updated_at || l.updated_at || l.updated_date);
const expiryText = (d) =>
  d < 0 ? `expired ${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} ago` : d === 0 ? "expires today" : `expires in ${d} day${d === 1 ? "" : "s"}`;

export default function Dashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showRecs, setShowRecs] = useState(false);
  const { user } = useAuth();
  const showMoney = canSeeFinance(user);

  useEffect(() => {
    (async () => {
      const E = base44.entities;
      const keys = [
        "trucks", "trailers", "drivers", "loads", "jobs", "parts", "shifts", "creds",
        "compDocs", "risks", "riskAssessments", "documents", "invoices", "expenses",
        "fuel", "schedules", "employees",
      ];
      const results = await Promise.all([
        safe(E.Truck.list()), safe(E.Trailer.list()), safe(E.Driver.list()),
        safe(E.Load.list()), safe(E.JobCard.list()), safe(E.Part.list()),
        safe(E.ShiftLog.list("-clock_in", 500)), safe(E.PersonnelCredential.list()),
        safe(E.ComplianceDocument.list()), safe(E.RiskRegister.list()),
        safe(E.ShiftRiskAssessment.list()), safe(E.SafetyDocument.list()),
        safe(E.Invoice.list()), safe(E.Expense.list()), safe(E.FuelLog.list()),
        safe(E.MaintenanceSchedule.list()), safe(E.Employee.list()),
      ]);
      setData(Object.fromEntries(keys.map((k, i) => [k, results[i] || []])));
      setLoading(false);
    })();
  }, []);

  const {
    trucks = [], trailers = [], drivers = [], loads = [], jobs = [], parts = [],
    shifts = [], creds = [], compDocs = [], risks = [], riskAssessments = [],
    documents = [], invoices = [], expenses = [], fuel = [], schedules = [], employees = [],
  } = data;
  const now = Date.now();

  const activeTrucks = trucks.filter((t) => t.status === "active").length;
  const activeDrivers = drivers.filter((d) => d.status === "active").length;
  const inTransit = loads.filter((l) => IN_FLIGHT.includes(l.status)).length;
  const doneLoads = loads.filter((l) => DONE.includes(l.status));
  const delivered30 = doneLoads.filter((l) => completedAt(l) > now - 30 * DAY).length;

  const kpis = [
    { label: "Active Fleet", value: `${activeTrucks}`, sub: `${trucks.length} registered`, icon: Truck, tone: "text-brand-blue" },
    { label: "Active Drivers", value: `${activeDrivers}`, sub: `${drivers.length} total`, icon: Users, tone: "text-brand-teal" },
    { label: "Loads In Transit", value: `${inTransit}`, sub: `${loads.length} total loads`, icon: Package, tone: "text-indigo-500" },
    { label: "Delivered", value: `${delivered30}`, sub: "last 30 days", icon: TrendingUp, tone: "text-emerald-500" },
  ];

  // Load throughput — real counts for the last 7 days
  const trend = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - i));
    const next = day.getTime() + DAY;
    const inDay = (d) => d && d >= day && d < next;
    return {
      day: day.toLocaleDateString("en-ZA", { weekday: "short" }),
      loads: loads.filter((l) => inDay(toDate(l.created_at))).length,
      delivered: doneLoads.filter((l) => inDay(completedAt(l))).length,
    };
  });
  const hasTrend = trend.some((d) => d.loads || d.delivered);

  const fleetMix = trucks.reduce((acc, t) => {
    const m = fleetTypeMeta(t.fleet_type);
    acc[m.label] = (acc[m.label] || 0) + 1;
    return acc;
  }, {});

  // SHERQ metrics
  const openRisks = risks.filter((r) => r.status === "open").length;
  const controlledRisks = risks.filter((r) => r.status !== "open").length;
  const flaggedRisks = riskAssessments.filter((a) => a.new_risk_flagged).length;
  const riskScore = risks.length ? Math.round((controlledRisks / risks.length) * 100) : null;
  const docCompliance = documents.length
    ? Math.round((documents.filter((d) => d.status === "active").length / documents.length) * 100)
    : null;
  const scores = [riskScore, docCompliance].filter((x) => x !== null);
  const complianceScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const highOpen = risks.filter((r) => r.status === "open" && ["critical", "high"].includes(r.residual_risk_rating));
  const overallRating = !risks.length
    ? "Not assessed"
    : highOpen.length
      ? "High"
      : risks.some((r) => r.status === "open" && r.residual_risk_rating === "medium")
        ? "Medium"
        : "Low";

  // Financial health
  const invTotal = (i) => Number(i.total_amount || i.amount || 0);
  const finRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + invTotal(i), 0);
  const finExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const finProfit = finRevenue - finExpenses;
  const isOverdue = (i) =>
    i.status === "overdue" ||
    (i.status !== "paid" && i.status !== "cancelled" && i.due_date && daysUntil(i.due_date) < 0);
  const overdueInv = invoices.filter(isOverdue);
  const finOutstanding = invoices
    .filter((i) => !["paid", "cancelled", "draft"].includes(i.status))
    .reduce((s, i) => s + invTotal(i), 0);

  // Department snapshots — each value is calculated, or honestly empty
  const recent30 = doneLoads.filter((l) => completedAt(l) > now - 30 * DAY && l.created_at);
  const avgTat = recent30.length
    ? recent30.reduce((s, l) => s + (completedAt(l) - new Date(l.created_at)) / 3600000, 0) / recent30.length
    : null;
  const openJobs = jobs.filter((j) => !JOB_CLOSED.includes(j.status));
  const staleJobs = openJobs.filter((j) => toDate(j.created_at) < now - 2 * DAY);
  const activeEmployees = employees.filter((e) => !e.status || e.status === "active").length;
  const credsDue = creds.filter((c) => { const d = daysUntil(c.expiry_date); return d !== null && d <= 30; });
  const activeParts = parts.filter((p) => p.active !== false);
  const stockValue = activeParts.reduce((s, p) => s + Number(p.quantity_on_hand || 0) * Number(p.unit_cost || 0), 0);
  const lowStock = activeParts.filter((p) => Number(p.reorder_level || 0) > 0 && Number(p.quantity_on_hand || 0) <= Number(p.reorder_level));
  const inLast30 = (v) => { const d = toDate(v); return d && d > now - 30 * DAY; };
  const km30 = shifts.filter((s) => inLast30(s.clock_in)).reduce((s, x) => s + Number(x.km_driven || 0), 0);
  const cost30 =
    expenses.filter((e) => inLast30(e.expense_date || e.created_at)).reduce((s, e) => s + Number(e.amount || 0), 0) +
    fuel.filter((f) => inLast30(f.log_date || f.created_at)).reduce((s, f) => s + Number(f.amount || 0), 0);
  const cpk = km30 > 0 ? cost30 / km30 : null;

  const departments = [
    { name: "Production", kpi: avgTat !== null ? `TAT ${avgTat.toFixed(1)}h` : "No trips yet", sub: avgTat !== null ? `${recent30.length} loads, last 30 days` : "Completed loads show turnaround here" },
    { name: "Engineering", kpi: `${openJobs.length} open job${openJobs.length === 1 ? "" : "s"}`, sub: staleJobs.length ? `${staleJobs.length} open longer than 48h` : "None older than 48h", warn: staleJobs.length > 0 },
    { name: "HR", kpi: `${activeEmployees || drivers.length} staff`, sub: credsDue.length ? `${credsDue.length} credential${credsDue.length === 1 ? "" : "s"} due within 30 days` : "No credentials due", warn: credsDue.length > 0 },
    { name: "SHERQ", kpi: complianceScore !== null ? `${complianceScore}% compliant` : "Not assessed", sub: complianceScore !== null ? `${openRisks} open risk${openRisks === 1 ? "" : "s"}` : "Add risks and documents to score", warn: highOpen.length > 0 },
    { name: "Stores", kpi: `${compactRand(stockValue)} stock`, sub: lowStock.length ? `${lowStock.length} item${lowStock.length === 1 ? "" : "s"} at reorder level` : `${activeParts.length} parts listed`, warn: lowStock.length > 0 },
    showMoney && { name: "Finance", kpi: cpk !== null ? `CPK R ${cpk.toFixed(2)}` : "CPK —", sub: cpk !== null ? `${Math.round(km30).toLocaleString("en-ZA")} km, last 30 days` : "Needs costs and km driven", warn: false },
  ];

  // Alerts — generated from real records, most urgent first
  const alerts = [];
  const push = (days, text, to) => alerts.push({ days, text, to });
  const checkExpiry = (value, what, to) => {
    const d = daysUntil(value);
    if (d !== null && d <= 30) push(d, `${what} ${expiryText(d)}`, to);
  };
  trucks.forEach((t) => {
    const reg = t.registration_number || "Truck";
    checkExpiry(t.license_expiry, `${reg} licence disc`, "/fleet");
    checkExpiry(t.cof_expiry, `${reg} roadworthy / COF`, "/fleet");
    checkExpiry(t.operator_license_expiry, `${reg} operator card`, "/fleet");
  });
  trailers.forEach((t) => {
    const reg = t.registration_number || "Trailer";
    checkExpiry(t.license_expiry, `Trailer ${reg} licence disc`, "/fleet");
    checkExpiry(t.cof_expiry, `Trailer ${reg} roadworthy / COF`, "/fleet");
  });
  creds.forEach((c) =>
    checkExpiry(c.expiry_date, `${c.driver_name || "Driver"} ${String(c.credential_type || "credential").replace(/_/g, " ")}`, "/drivers"),
  );
  compDocs.forEach((c) =>
    checkExpiry(c.expiry_date, `${String(c.document_type || "Compliance document").replace(/_/g, " ")}${c.holder_name ? ` (${c.holder_name})` : ""}`, "/compliance"),
  );
  schedules
    .filter((m) => !["completed", "cancelled"].includes(m.status))
    .forEach((m) => {
      const d = daysUntil(m.next_service_date || m.scheduled_date);
      if (d !== null && d <= 7)
        push(d, `${m.truck_registration || "Asset"} ${String(m.maintenance_type || "service").replace(/_/g, " ")} ${d < 0 ? `overdue by ${-d} day${d === -1 ? "" : "s"}` : d === 0 ? "due today" : `due in ${d} day${d === 1 ? "" : "s"}`}`, "/engineering");
    });
  shifts
    .filter((s) => s.status === "active" && s.clock_in && !s.clock_out)
    .forEach((s) => {
      const h = (now - new Date(s.clock_in)) / 3600000;
      if (h >= 12) push(-1, `${s.driver_name || "Driver"} on shift ${h.toFixed(1)}h — ${h >= 14 ? "over" : "approaching"} the 14h limit`, "/drivers");
    });
  loads
    .filter((l) => IN_FLIGHT.includes(l.status))
    .forEach((l) => {
      const last = toDate(l.status_updated_at || l.updated_at);
      const h = last ? (now - last) / 3600000 : 0;
      if (h >= 12) push(0, `Load ${l.load_number || ""} has had no status update for ${Math.round(h)}h`, "/loads");
    });
  if (showMoney && overdueInv.length)
    push(0, `${overdueInv.length} overdue invoice${overdueInv.length === 1 ? "" : "s"} worth ${rand(overdueInv.reduce((s, i) => s + invTotal(i), 0))}`, "/finance");
  if (lowStock.length) push(3, `${lowStock.length} stock item${lowStock.length === 1 ? "" : "s"} at or below reorder level`, "/stores");
  if (highOpen.length) push(0, `${highOpen.length} high or critical risk${highOpen.length === 1 ? "" : "s"} still open`, "/safety");
  if (staleJobs.length) push(1, `${staleJobs.length} job card${staleJobs.length === 1 ? "" : "s"} open longer than 48 hours`, "/engineering");
  alerts.sort((a, b) => a.days - b.days);

  // Insight banner — only real rand amounts, no estimates
  const overdueValue = overdueInv.reduce((s, i) => s + invTotal(i), 0);
  const urgent = alerts.filter((a) => a.days <= 7).length;
  const isEmpty = !loading && !trucks.length && !loads.length && !drivers.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
          Operations Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Live business intelligence across your transport operation
        </p>
      </div>

      {/* Insight banner — calculated from live records */}
      <Card className="overflow-hidden border-0 gradient-brand text-white shadow-lg">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Operational insight
              </p>
              {loading ? (
                <p className="mt-1 font-display text-2xl font-bold">Analysing your operation…</p>
              ) : isEmpty ? (
                <>
                  <p className="mt-1 font-display text-2xl font-bold">Welcome to TranziIQ</p>
                  <p className="mt-1 text-sm text-white/80">
                    Add your vehicles, drivers and first load. Insights appear here as soon as real activity is recorded.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 font-display text-3xl font-bold">
                    {urgent}{" "}
                    <span className="text-base font-medium text-white/70">
                      item{urgent === 1 ? "" : "s"} need attention this week
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    {showMoney && overdueValue > 0 ? `${rand(overdueValue)} in overdue invoices · ` : ""}
                    {inTransit} load{inTransit === 1 ? "" : "s"} on the road · {openJobs.length} open job card{openJobs.length === 1 ? "" : "s"}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isEmpty ? (
              <Link
                to="/fleet"
                className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/25"
              >
                Add your first vehicle
              </Link>
            ) : (
              <button
                onClick={() => setShowRecs(true)}
                disabled={loading}
                className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/25"
              >
                View all ({alerts.length})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {k.label}
                </p>
                <k.icon className={k.tone} size={18} />
              </div>
              <p className="mt-2 font-display text-3xl font-bold  text-brand-navy">
                {loading ? "—" : k.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Load Throughput
            </CardTitle>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </CardHeader>
          <CardContent className="relative">
            {!loading && !hasTrend && (
              <p className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
                No loads in the last 7 days. Created and completed loads will chart here.
              </p>
            )}
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gLoads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#007BFF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#007BFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00BFA5" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00BFA5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#eef2f7"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="loads"
                  stroke="#007BFF"
                  strokeWidth={2.5}
                  fill="url(#gLoads)"
                  name="Loads"
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stroke="#00BFA5"
                  strokeWidth={2.5}
                  fill="url(#gDel)"
                  name="Delivered"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fleet mix */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Fleet Composition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {Object.entries(fleetMix).length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                No vehicles registered yet.
              </p>
            )}
            {Object.entries(fleetMix).map(([label, count]) => {
              const pct = Math.round((count / trucks.length) * 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full gradient-brand"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* SHERQ Risk & Compliance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Risk Profile
              </p>
              <ShieldCheck size={18} className="text-brand-teal" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-display text-2xl font-bold  text-brand-navy">
                {overallRating}
              </p>
              <span className="text-xs text-muted-foreground">
                {risks.length} risks registered · {openRisks} open
              </span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full gradient-brand"
                style={{ width: `${riskScore ?? 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {riskScore !== null ? `${riskScore}% controlled` : "No risks registered yet"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Compliance Profile
              </p>
              <ShieldCheck size={18} className="text-brand-blue" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-display text-2xl font-bold  text-brand-navy">
                {complianceScore !== null ? `${complianceScore}%` : "—"}
              </p>
              <span className="text-xs text-muted-foreground">
                {flaggedRisks} new risks flagged
              </span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full gradient-brand"
                style={{ width: `${complianceScore ?? 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {documents.length
                ? `${documents.length} documents · ${docCompliance}% active`
                : "No SHERQ documents uploaded yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health — owner, operations and finance only */}
      {showMoney && (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Revenue & Profit
              </p>
              <Wallet size={18} className="text-emerald-500" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs  text-muted-foreground">
                  Revenue (Paid)
                </span>
                <span className="font-display  text-lg font-bold text-brand-navy">
{rand(finRevenue)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs  text-muted-foreground">Expenses</span>
                <span className="font-display text-lg  font-bold text-rose-500">
{rand(finExpenses)}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-border/40  pt-1">
                <span className="text-xs text-muted-foreground">
                  Net Profit
                </span>
                <span
                  className={`font-display text-lg font-bold ${
                    finProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
{finProfit < 0 ? "-" : ""}{rand(Math.abs(finProfit))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Debtors & Expenses
              </p>
              <Clock size={18} className="text-amber-500" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs  text-muted-foreground">
                  Outstanding
                </span>
                <span className="font-display text-lg  font-bold text-amber-600">
{rand(finOutstanding)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs  text-muted-foreground">
                  Overdue Invoices
                </span>
                <span className="font-display  text-lg font-bold text-rose-600">
                  {overdueInv.length}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs  text-muted-foreground">
                  Total Expense Entries
                </span>
                <span className="font-display text-lg font-bold  text-brand-navy">
                  {expenses.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Department snapshots */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-brand-navy">
          Department Snapshots
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {departments.filter(Boolean).map((d) => (
            <Card key={d.name} className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">{d.name}</p>
                <p className="mt-2 font-display text-lg font-bold text-brand-navy">
                  {loading ? "—" : d.kpi}
                </p>
                <p className={`mt-1 text-xs ${d.warn ? "font-medium text-amber-700" : "text-muted-foreground"}`}>
                  {loading ? "" : d.sub}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <Card className={alerts.length ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/40"}>
        <CardContent className="p-5">
          <div className={`flex items-center gap-2 ${alerts.length ? "text-amber-700" : "text-emerald-700"}`}>
            {alerts.length ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
            <p className="text-sm font-semibold">
              {alerts.length ? `Active Alerts (${alerts.length})` : "No active alerts"}
            </p>
          </div>
          {loading ? (
            <p className="mt-3 text-sm text-muted-foreground">Checking your records…</p>
          ) : alerts.length ? (
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              {alerts.slice(0, 6).map((a, i) => (
                <li key={i}>
                  <Link to={a.to} className="hover:underline">• {a.text}</Link>
                </li>
              ))}
              {alerts.length > 6 && (
                <li>
                  <button onClick={() => setShowRecs(true)} className="font-medium text-brand-blue hover:underline">
                    Show all {alerts.length} alerts
                  </button>
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Expiring licences, overdue services, fatigue limits and stalled loads will be flagged here automatically.
            </p>
          )}
        </CardContent>
      </Card>

      {/* All alerts dialog */}
      <Dialog open={showRecs} onOpenChange={setShowRecs}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand-teal" /> What needs attention
            </DialogTitle>
          </DialogHeader>
          {alerts.length ? (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <Link
                  key={i}
                  to={a.to}
                  onClick={() => setShowRecs(false)}
                  className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50"
                >
                  <AlertTriangle
                    size={16}
                    className={`mt-0.5 shrink-0 ${a.days < 0 ? "text-rose-600" : a.days <= 7 ? "text-amber-600" : "text-muted-foreground"}`}
                  />
                  <span className="text-sm text-brand-navy">{a.text}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
