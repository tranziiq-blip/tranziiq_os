import { useEffect, useState } from "react";
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
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Wrench,
  Thermometer,
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

const DEPARTMENTS = [
  { name: "Production", kpi: "TAT 4.2h", trend: "down", phase: 3 },
  { name: "Engineering", kpi: "2 open jobs", trend: "up", phase: 4 },
  { name: "HR", kpi: "48 drivers", trend: "up", phase: 5 },
  { name: "Safety", kpi: "96% compliant", trend: "up", phase: 5 },
  { name: "Stores", kpi: "R 84k stock", trend: "down", phase: 4 },
  { name: "Finance", kpi: "CPK R 8.40", trend: "down", phase: 6 },
];

const TREND = [
  { day: "Mon", loads: 18, delivered: 14 },
  { day: "Tue", loads: 22, delivered: 19 },
  { day: "Wed", loads: 20, delivered: 17 },
  { day: "Thu", loads: 26, delivered: 21 },
  { day: "Fri", loads: 24, delivered: 23 },
  { day: "Sat", loads: 15, delivered: 14 },
  { day: "Sun", loads: 9, delivered: 9 },
];

export default function Dashboard() {
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecs, setShowRecs] = useState(false);
  const [risks, setRisks] = useState([]);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [t, d, l, rk, ra, docs, inv, exp] = await Promise.all([
          base44.entities.Truck.list(),
          base44.entities.Driver.list(),
          base44.entities.Load.list(),
          base44.entities.RiskRegister.list().catch(() => []),
          base44.entities.ShiftRiskAssessment.list().catch(() => []),
          base44.entities.SafetyDocument.list().catch(() => []),
          base44.entities.Invoice.list().catch(() => []),
          base44.entities.Expense.list().catch(() => []),
        ]);
        setTrucks(t);
        setDrivers(d);
        setLoads(l);
        setRisks(rk);
        setRiskAssessments(ra);
        setDocuments(docs);
        setInvoices(inv);
        setExpenses(exp);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeTrucks = trucks.filter((t) => t.status === "active").length;
  const activeDrivers = drivers.filter((d) => d.status === "active").length;
  const inTransit = loads.filter((l) =>
    [
      "in_transit",
      "at_border",
      "customs_hold",
      "cleared",
      "at_destination",
      "unloading",
    ].includes(l.status),
  ).length;
  const delivered = loads.filter((l) =>
    ["delivered", "pod_captured", "completed"].includes(l.status),
  ).length;

  const kpis = [
    {
      label: "Active Fleet",
      value: loading ? "—" : `${activeTrucks}`,
      sub: `${trucks.length} registered`,
      icon: Truck,
      tone: "text-brand-blue",
    },
    {
      label: "Active Drivers",
      value: loading ? "—" : `${activeDrivers}`,
      sub: `${drivers.length} total`,
      icon: Users,
      tone: "text-brand-teal",
    },
    {
      label: "Loads In Transit",
      value: loading ? "—" : `${inTransit}`,
      sub: `${loads.length} total loads`,
      icon: Package,
      tone: "text-indigo-500",
    },
    {
      label: "Delivered",
      value: loading ? "—" : `${delivered}`,
      sub: "this  period",
      icon: TrendingUp,
      tone: "text-emerald-500",
    },
  ];

  const fleetMix = trucks.reduce((acc, t) => {
    const m = fleetTypeMeta(t.fleet_type);
    acc[m.label] = (acc[m.label] || 0) + 1;
    return acc;
  }, {});

  // SHEQ metrics
  const openRisks = risks.filter((r) => r.status === "open").length;
  const controlledRisks = risks.filter((r) => r.status !== "open").length;
  const flaggedRisks = riskAssessments.filter((a) => a.new_risk_flagged).length;
  const riskScore = risks.length
    ? Math.round((controlledRisks / risks.length) * 100)
    : 100;
  const docCompliance = documents.length
    ? Math.round(
        (documents.filter((d) => d.status === "active").length /
          documents.length) *
          100,
      )
    : 100;
  const complianceScore = Math.round((riskScore + docCompliance) / 2);
  const overallRating =
    risks.filter(
      (r) =>
        r.status === "open" &&
        ["critical", "high"].includes(r.residual_risk_rating),
    ).length > 0
      ? "High"
      : risks.filter(
            (r) => r.status === "open" && r.residual_risk_rating === "medium",
          ).length > 0
        ? "Medium"
        : "Low";

  // Financial health
  const finRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const finExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const finProfit = finRevenue - finExpenses;
  const finOutstanding = invoices
    .filter((i) => ["invoiced", "overdue"].includes(i.status))
    .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const finOverdue = invoices.filter((i) => i.status === "overdue").length;

  const recommendations = [
    {
      icon: Clock,
      title: "Expedite border clearance",
      detail:
        "2 loads delayed  at Beitbridge border — estimated R 4,800 in standing time. Contact clearing  agent to prioritise.",
      saving: "R 4,800",
    },
    {
      icon: Wrench,
      title: "Reassign idle truck",
      detail:
        "Truck MP 23 GP idle  3.5h at depot — dispatch to pending load LD-2041 to recover lost revenue.",
      saving: "R 3,200",
    },
    {
      icon: Thermometer,
      title: "Cold-chain breach risk",
      detail:
        "Reefer ZN 45  RT reefer unit temp trending upward. Schedule immediate inspection before cargo  loss.",
      saving: "R 4,450",
    },
  ];

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

      {/* AI Cost of Inefficiency banner */}
      <Card className="overflow-hidden border-0 gradient-brand text-white  shadow-lg">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center  md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl  bg-white/15 backdrop-blur">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                AI Insight — Cost of Inefficiency
              </p>
              <p className="mt-1 font-display text-3xl font-bold">
                R 12,450{" "}
                <span className="text-base font-medium text-white/70">
                  today
                </span>
              </p>
              <p className="mt-1 text-sm text-white/80">
                2 loads delayed at border · 1 truck idle 3.5h · 1 cold-chain
                breach risk
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRecs(true)}
              className="rounded-lg bg-white/15  px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/25"
            >
              View Recommendations
            </button>
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
                {k.value}
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
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={TREND} margin={{ left: -20, right: 8, top: 8 }}>
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
                No trucks registered yet.
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

      {/* SHEQ Risk & Compliance */}
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
                style={{ width: `${riskScore}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {riskScore}% controlled
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
                {complianceScore}%
              </p>
              <span className="text-xs text-muted-foreground">
                {flaggedRisks} new risks flagged
              </span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full gradient-brand"
                style={{ width: `${complianceScore}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {documents.length}
              documents · {docCompliance}% active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health */}
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
                  R
                  {Number(finRevenue).toLocaleString("en-ZA", {
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs  text-muted-foreground">Expenses</span>
                <span className="font-display text-lg  font-bold text-rose-500">
                  R{" "}
                  {Number(finExpenses).toLocaleString("en-ZA", {
                    minimumFractionDigits: 0,
                  })}
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
                  R
                  {Number(finProfit).toLocaleString("en-ZA", {
                    minimumFractionDigits: 0,
                  })}
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
                  R{" "}
                  {Number(finOutstanding).toLocaleString("en-ZA", {
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs  text-muted-foreground">
                  Overdue Invoices
                </span>
                <span className="font-display  text-lg font-bold text-rose-600">
                  {finOverdue}
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

      {/* Department summary */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold  text-brand-navy">
          Department Snapshots
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {DEPARTMENTS.map((d) => (
            <Card key={d.name} className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {d.name}
                  </p>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold  text-muted-foreground">
                    P{d.phase}
                  </span>
                </div>
                <p className="mt-2 font-display text-lg font-bold text-brand-navy">
                  {d.kpi}
                </p>
                <div
                  className={`mt-1 flex items-center gap-1 text-xs ${
                    d.trend === "up" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {d.trend === "up" ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  <span>vs last week</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Recommendations dialog */}
      <Dialog open={showRecs} onOpenChange={setShowRecs}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand-teal" /> AI
              Recommendations
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-brand-teal/5 p-3">
              <p className="text-sm font-semibold text-brand-navy">
                Total recoverable cost of inefficiency: R 12,450
              </p>
              <p className="text-xs text-muted-foreground">
                3 actionable recommendations below
              </p>
            </div>
            {recommendations.map((r) => (
              <div
                key={r.title}
                className="rounded-lg border border-border/60 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg  bg-muted">
                    <r.icon size={16} className="text-brand-navy" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-navy">
                        {r.title}
                      </p>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs  font-semibold text-emerald-700">
                        Save {r.saving}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerts */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={18} />
            <p className="text-sm font-semibold">Active Alerts</p>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li>
              • Truck <span className="font-medium">ND 123 456</span> due for
              service in 1,200 km
            </li>
            <li>
              • Driver <span className="font-medium">J. Mokoena</span>{" "}
              approaching 14h shift limit (12.5h logged)
            </li>
            <li>
              • Petroleum tanker <span className="font-medium">DG-77</span> DG
              permit expires in 6 days
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
