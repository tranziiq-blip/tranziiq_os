import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Truck,
  Wrench,
  Users,
  ShieldCheck,
  Boxes,
  Wallet,
  Package,
  Fuel,
  TrendingUp,
  TrendingDown,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Play,
  Mail,
  Calendar,
  Settings2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ReportBuilderDialog from "@/components/reports/ReportBuilderDialog";
import ReportSnapshotViewer from "@/components/reports/ReportSnapshotViewer";
import { useAuth } from "@/lib/AuthContext";
import { canSeeFinance } from "@/lib/financeAccess";

const rand = (n) =>
  `R ${Number(n || 0).toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;
const COLORS = [
  "#003366",
  "#007BFF",
  "#00BFA5",
  "#FFB300",
  "#E85D3A",
  "#7C3AED",
];

const REPORT_TYPE_LABELS = {
  fleet_performance: "Fleet Performance",
  financial_summary: "Financial  Summary",
  load_activity: "Load Activity",
  maintenance_report: "Maintenance",
  sheq_compliance: "SHERQ Compliance",
  driver_performance: "Driver Performance",
  fuel_analysis: "Fuel Analysis",
  client_summary: "Client Summary",
  cross_border_status: "Cross-Border",
  custom: "Custom",
};

const FREQ_LABELS = {
  on_demand: "On Demand",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function Reports() {
  const { toast } = useToast();
  const { user } = useAuth();
  const showMoney = canSeeFinance(user);
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [generating, setGenerating] = useState(null);

  const loadOverview = useCallback(async () => {
    try {
      const [
        trucks,
        drivers,
        loads,
        invoices,
        expenses,
        jobCards,
        incidents,
        fuelLogs,
        parts,
      ] = await Promise.all([
        base44.entities.Truck.list(),
        base44.entities.Driver.list(),
        base44.entities.Load.list(),
        base44.entities.Invoice.list(),
        base44.entities.Expense.list(),
        base44.entities.JobCard.list(),
        base44.entities.IncidentReport.list(),
        base44.entities.FuelLog.list(),
        base44.entities.Part.list(),
      ]);
      setData({
        trucks,
        drivers,
        loads,
        invoices,
        expenses,
        jobCards,
        incidents,
        fuelLogs,
        parts,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConfigs = useCallback(async () => {
    try {
      setConfigs(
        await base44.entities.ReportConfiguration.list("-created_date"),
      );
      setSnapshots(
        await base44.entities.ReportSnapshot.list("-generated_date"),
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    loadConfigs();
  }, [loadOverview, loadConfigs]);

  const saveConfig = async (formData) => {
    try {
      if (editing) {
        await base44.entities.ReportConfiguration.update(editing.id, formData);
        toast({ title: "Report configuration updated" });
      } else {
        await base44.entities.ReportConfiguration.create(formData);
        toast({ title: "Report configuration created" });
      }
      setBuilderOpen(false);
      setEditing(null);
      loadConfigs();
    } catch (e) {
      toast({
        title: "Error saving",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const removeConfig = async (c) => {
    await base44.entities.ReportConfiguration.delete(c.id);
    toast({ title: "Configuration removed" });
    loadConfigs();
  };

  const generateReport = async (config) => {
    setGenerating(config.id);
    try {
      const today = new Date();
      const periodEnd = today.toISOString().slice(0, 10);
      const periodStart = new Date(today.getTime() - 30 * 86400000)
        .toISOString()
        .slice(0, 10);

      const fetchers = {
        loads: () => base44.entities.Load.list(),
        trucks: () => base44.entities.Truck.list(),
        drivers: () => base44.entities.Driver.list(),
        invoices: () => base44.entities.Invoice.list(),
        expenses: () => base44.entities.Expense.list(),
        job_cards: () => base44.entities.JobCard.list(),
        incidents: () => base44.entities.IncidentReport.list(),
        fuel_logs: () => base44.entities.FuelLog.list(),
        parts: () => base44.entities.Part.list(),
        weighbills: () => base44.entities.Weighbill.list(),
        manifests: () => base44.entities.TransportManifest.list(),
      };

      const d = {};
      await Promise.all(
        (config.data_sources || []).map(async (src) => {
          if (fetchers[src]) {
            try {
              d[src] = await fetchers[src]();
            } catch {
              d[src] = [];
            }
          }
        }),
      );

      const loads = d.loads || [],
        trucks = d.trucks || [],
        drivers = d.drivers || [];
      const invoices = d.invoices || [],
        expenses = d.expenses || [],
        jobCards = d.job_cards || [];
      const incidents = d.incidents || [],
        fuelLogs = d.fuel_logs || [],
        manifests = d.manifests || [];

      const summary = {};
      let details = [];

      switch (config.report_type) {
        case "fleet_performance":
          summary.total_trucks = trucks.length;
          summary.active = trucks.filter((t) => t.status === "active").length;
          summary.maintenance = trucks.filter(
            (t) => t.status === "maintenance",
          ).length;
          summary.avg_odometer = trucks.length
            ? Math.round(
                trucks.reduce((s, t) => s + (t.current_odometer || 0), 0) /
                  trucks.length,
              ).toLocaleString() + " km"
            : "—";
          details = trucks;
          break;
        case "financial_summary":
          summary.revenue = rand(
            invoices
              .filter((i) => i.status === "paid")
              .reduce((s, i) => s + (i.total_amount || 0), 0),
          );
          summary.expenses = rand(
            expenses.reduce((s, e) => s + (e.amount || 0), 0),
          );
          summary.outstanding = rand(
            invoices
              .filter((i) => ["invoiced", "overdue"].includes(i.status))
              .reduce((s, i) => s + (i.total_amount || 0), 0),
          );
          summary.net_profit = rand(
            invoices
              .filter((i) => i.status === "paid")
              .reduce((s, i) => s + (i.total_amount || 0), 0) -
              expenses.reduce((s, e) => s + (e.amount || 0), 0),
          );
          details = invoices;
          break;
        case "load_activity":
          summary.total_loads = loads.length;
          summary.in_transit = loads.filter((l) =>
            ["in_transit", "at_border", "cleared"].includes(l.status),
          ).length;
          summary.delivered = loads.filter((l) =>
            ["delivered", "completed"].includes(l.status),
          ).length;
          summary.delayed = loads.filter((l) => l.status === "delayed").length;
          summary.cross_border = loads.filter((l) => l.cross_border).length;
          details = loads;
          break;
        case "maintenance_report":
          summary.open_jobs = jobCards.filter(
            (j) => j.status !== "completed",
          ).length;
          summary.critical = jobCards.filter(
            (j) => j.priority === "critical" && j.status !== "completed",
          ).length;
          summary.downtime_hrs = jobCards.reduce(
            (s, j) => s + (j.downtime_hours || 0),
            0,
          );
          summary.total_cost = rand(
            jobCards.reduce((s, j) => s + (j.total_cost || 0), 0),
          );
          details = jobCards;
          break;
        case "sheq_compliance":
          summary.open_incidents = incidents.filter(
            (i) => i.status !== "resolved",
          ).length;
          summary.critical = incidents.filter(
            (i) => i.severity === "critical" && i.status !== "resolved",
          ).length;
          summary.near_misses = incidents.filter(
            (i) => i.incident_type === "near_miss",
          ).length;
          summary.resolved = incidents.filter(
            (i) => i.status === "resolved",
          ).length;
          details = incidents;
          break;
        case "driver_performance":
          summary.total_drivers = drivers.length;
          summary.active = drivers.filter((d) => d.status === "active").length;
          summary.on_leave = drivers.filter(
            (d) => d.status === "on_leave",
          ).length;
          summary.dg_certified = drivers.filter((d) => d.dg_certified).length;
          details = drivers;
          break;
        case "fuel_analysis":
          summary.total_litres = Math.round(
            fuelLogs.reduce((s, f) => s + (f.litres || 0), 0),
          ).toLocaleString();
          summary.total_cost = rand(
            fuelLogs.reduce((s, f) => s + (f.amount || 0), 0),
          );
          summary.entries = fuelLogs.length;
          summary.avg_per_fill = fuelLogs.length
            ? Math.round(
                fuelLogs.reduce((s, f) => s + (f.litres || 0), 0) /
                  fuelLogs.length,
              ) + " L"
            : "—";
          details = fuelLogs;
          break;
        case "cross_border_status":
          summary.pending = manifests.filter(
            (m) => m.manifest_status === "pending_review",
          ).length;
          summary.submitted = manifests.filter(
            (m) => m.manifest_status === "documents_submitted",
          ).length;
          summary.in_process = manifests.filter(
            (m) => m.manifest_status === "in_process",
          ).length;
          summary.cleared = manifests.filter(
            (m) => m.manifest_status === "cleared",
          ).length;
          summary.held = manifests.filter(
            (m) => m.manifest_status === "held",
          ).length;
          details = manifests;
          break;
        case "client_summary":
          const charges = showMoney
            ? await base44.entities.LoadCharge.list().catch(() => [])
            : [];
          const chargeFor = Object.fromEntries(
            charges.map((c) => [c.load_id, Number(c.estimated_amount || 0)]),
          );
          const groups = loads.reduce((acc, l) => {
            const key = l.client || "Unassigned";
            if (!acc[key]) acc[key] = { loads: 0, revenue: 0 };
            acc[key].loads++;
            acc[key].revenue += chargeFor[l.id] || 0;
            return acc;
          }, {});
          summary.total_clients = Object.keys(groups).length;
          summary.total_loads = loads.length;
          details = Object.entries(groups).map(([client, v]) =>
            showMoney
              ? { client, loads: v.loads, revenue: v.revenue }
              : { client, loads: v.loads },
          );
          break;
        default:
          details = loads;
          summary.records = loads.length;
          break;
      }

      const snapshot = await base44.entities.ReportSnapshot.create({
        configuration_id: config.id,
        report_name: config.report_name,
        report_type: config.report_type,
        generated_date: new Date().toISOString(),
        period_start: periodStart,
        period_end: periodEnd,
        summary_data: summary,
        detailed_data: details.slice(0, 500),
        format: config.format,
        delivery_status: "pending",
      });

      await base44.entities.ReportConfiguration.update(config.id, {
        last_run_date: periodEnd,
      });

      if (
        (config.delivery_method === "email" ||
          config.delivery_method === "both") &&
        config.email_recipients?.length > 0
      ) {
        try {
          const html = `<h2>${config.report_name}</h2><p>Period: ${periodStart} to 
${periodEnd}</p><h3>Summary</h3><ul>${Object.entries(summary)
            .map(
              ([k, v]) =>
                `<li><strong>${k.replace(/_/g, " ")}:</strong> 
${v}</li>`,
            )
            .join("")}</ul><p>${details.length} detailed records included.</p>`;
          await base44.functions.invoke("sendReportEmail", {
            recipients: config.email_recipients,
            report_name: config.report_name,
            report_html: html,
            period: `${periodStart} to ${periodEnd}`,
            snapshot_id: snapshot.id,
          });
        } catch (e) {
          console.error("Email failed:", e);
        }
      }

      toast({
        title: "Report generated",
        description: config.email_recipients?.length
          ? `Emailed to ${config.email_recipients.length} 
recipient(s)`
          : "View in Generated Reports",
      });
      loadConfigs();
      setViewing(snapshot);
      setTab("snapshots");
    } catch (e) {
      toast({
        title: "Generation failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  // Overview data
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-muted border-t-brand-teal rounded-full  animate-spin" />
      </div>
    );
  }

  const {
    trucks,
    drivers,
    loads,
    invoices,
    expenses,
    jobCards,
    incidents,
    fuelLogs,
    parts,
  } = data;
  const revenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.total_amount || 0), 0);
  const outstanding = invoices
    .filter((i) => ["invoiced", "overdue"].includes(i.status))
    .reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = revenue - totalExpenses;
  const stockValue = parts.reduce(
    (s, p) => s + (p.quantity_on_hand || 0) * (p.unit_cost || 0),
    0,
  );

  const scorecards = [
    {
      dept: "Fleet",
      icon: Truck,
      color: "text-brand-blue",
      bg: "bg-blue-50",
      metrics: [
        { label: "Total Trucks", value: `${trucks.length}` },
        {
          label: "Active",
          value: `${trucks.filter((t) => t.status === "active").length}`,
        },
        {
          label: "In Maintenance",
          value: `${trucks.filter((t) => t.status === "maintenance").length}`,
        },
        {
          label: "Avg Odometer",
          value: trucks.length
            ? `${Math.round(
                trucks.reduce((s, t) => s + (t.current_odometer || 0), 0) /
                  trucks.length,
              ).toLocaleString()} km`
            : "—",
        },
      ],
    },
    {
      dept: "Production",
      icon: Package,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      metrics: [
        { label: "Total Loads", value: `${loads.length}` },
        {
          label: "In Transit",
          value: `${
            loads.filter((l) =>
              ["in_transit", "at_border", "cleared"].includes(l.status),
            ).length
          }`,
        },
        {
          label: "Delivered",
          value: `${
            loads.filter((l) => ["delivered", "completed"].includes(l.status))
              .length
          }`,
        },
        {
          label: "Delayed",
          value: `${loads.filter((l) => l.status === "delayed").length}`,
        },
      ],
    },
    {
      dept: "Engineering",
      icon: Wrench,
      color: "text-amber-500",
      bg: "bg-amber-50",
      metrics: [
        {
          label: "Open Jobs",
          value: `${jobCards.filter((j) => j.status !== "completed").length}`,
        },
        {
          label: "Critical",
          value: `${
            jobCards.filter(
              (j) => j.priority === "critical" && j.status !== "completed",
            ).length
          }`,
        },
        {
          label: "Downtime (hrs)",
          value: `${jobCards.reduce((s, j) => s + (j.downtime_hours || 0), 0)}`,
        },
        {
          label: "Total Cost",
          value: rand(jobCards.reduce((s, j) => s + (j.total_cost || 0), 0)),
        },
      ],
    },
    {
      dept: "HR",
      icon: Users,
      color: "text-brand-teal",
      bg: "bg-teal-50",
      metrics: [
        { label: "Total Drivers", value: `${drivers.length}` },
        {
          label: "Active",
          value: `${drivers.filter((d) => d.status === "active").length}`,
        },
        {
          label: "On Leave",
          value: `${drivers.filter((d) => d.status === "on_leave").length}`,
        },
        {
          label: "DG Certified",
          value: `${drivers.filter((d) => d.dg_certified).length}`,
        },
      ],
    },
    {
      dept: "Safety",
      icon: ShieldCheck,
      color: "text-rose-500",
      bg: "bg-rose-50",
      metrics: [
        {
          label: "Open Incidents",
          value: `${incidents.filter((i) => i.status !== "resolved").length}`,
        },
        {
          label: "Critical",
          value: `${
            incidents.filter(
              (i) => i.severity === "critical" && i.status !== "resolved",
            ).length
          }`,
        },
        {
          label: "Near-Misses",
          value: `${
            incidents.filter((i) => i.incident_type === "near_miss").length
          }`,
        },
        {
          label: "Resolved",
          value: `${incidents.filter((i) => i.status === "resolved").length}`,
        },
      ],
    },
    {
      dept: "Stores",
      icon: Boxes,
      color: "text-purple-500",
      bg: "bg-purple-50",
      metrics: [
        { label: "Total Parts", value: `${parts.length}` },
        {
          label: "Below Reorder",
          value: `${
            parts.filter(
              (p) => (p.quantity_on_hand || 0) <= (p.reorder_level || 0),
            ).length
          }`,
        },
        { label: "Stock Value", value: rand(stockValue) },
        { label: "Movements", value: "—" },
      ],
    },
    showMoney && {
      dept: "Finance",
      icon: Wallet,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      metrics: [
        { label: "Revenue", value: rand(revenue) },
        { label: "Outstanding", value: rand(outstanding) },
        { label: "Expenses", value: rand(totalExpenses) },
        { label: "Net Profit", value: rand(netProfit) },
      ],
    },
    {
      dept: "Fuel",
      icon: Fuel,
      color: "text-orange-500",
      bg: "bg-orange-50",
      metrics: [
        {
          label: "Total Litres",
          value: `${Math.round(
            fuelLogs.reduce((s, f) => s + (f.litres || 0), 0),
          ).toLocaleString()}`,
        },
        {
          label: "Total Cost",
          value: rand(fuelLogs.reduce((s, f) => s + (f.amount || 0), 0)),
        },
        { label: "Entries", value: `${fuelLogs.length}` },
        {
          label: "Avg per Fill",
          value: fuelLogs.length
            ? `${Math.round(
                fuelLogs.reduce((s, f) => s + (f.litres || 0), 0) /
                  fuelLogs.length,
              )} L`
            : "—",
        },
      ],
    },
  ];

  const expByCat = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const expChartData = Object.entries(expByCat).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
  }));
  const statusDist = loads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});
  const statusChartData = Object.entries(statusDist).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Reports & Scorecards
          </h1>
          <p className="text-sm text-muted-foreground">
            Build custom reports · schedule delivery · print & email
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setBuilderOpen(true);
          }}
          className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
        >
          <Plus size={16} />
          Create Report
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="builder">
            Report Builder ({configs.length})
          </TabsTrigger>
          <TabsTrigger value="snapshots">
            Generated Reports ({snapshots.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Revenue
                  </p>
                  <TrendingUp className="text-emerald-500" size={18} />
                </div>
                <p className="mt-2 font-display  text-2xl font-bold text-brand-navy">
                  {rand(revenue)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Outstanding
                  </p>
                  <FileText className="text-amber-500" size={18} />
                </div>
                <p className="mt-2 font-display  text-2xl font-bold text-brand-navy">
                  {rand(outstanding)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-rose-200 bg-rose-50/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Expenses
                  </p>
                  <TrendingDown className="text-rose-500" size={18} />
                </div>
                <p className="mt-2 font-display  text-2xl font-bold  text-brand-navy">
                  {rand(totalExpenses)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-brand-teal/30 bg-brand-teal/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Net Profit
                  </p>
                  <Wallet className="text-brand-teal" size={18} />
                </div>
                <p
                  className={`mt-2 font-display 
text-2xl font-bold ${netProfit >= 0 ? "text-brand-navy" : "text-rose-600"}`}
                >
                  {rand(netProfit)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-semibold  text-brand-navy">
              Department Scorecards
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {scorecards.filter(Boolean).map((s) => (
                <Card key={s.dept} className="border-border/60 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg 
${s.bg}`}
                      >
                        <s.icon className={s.color} size={16} />
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        {s.dept}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {s.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="flex items-center justify-between border-b  border-border/30 pb-1 last:border-0 last:pb-0"
                      >
                        <span className="text-xs  text-muted-foreground">
                          {m.label}
                        </span>
                        <span className="text-sm font-semibold  text-brand-navy">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Expense Breakdown by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expChartData.length === 0 ? (
                  <p className="py-8 text-center  text-sm text-muted-foreground">
                    No expense data.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={expChartData}
                      margin={{ left: -10, right: 10, top: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#eef2f7"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px  solid #e2e8f0",
                          fontSize: 12,
                        }}
                        formatter={(v) => rand(v)}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {expChartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Load Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusChartData.length === 0 ? (
                  <p className="py-8 text-center  text-sm text-muted-foreground">
                    No load data.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={45}
                        label={{
                          fontSize: 10,
                          fill: "#64748b",
                        }}
                      >
                        {statusChartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Report Builder tab */}
        <TabsContent value="builder" className="space-y-4 mt-4">
          {configs.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex  flex-col items-center justify-center gap-3 py-16">
                <FileText className="text-muted-foreground/40" size={32} />
                <p className="text-sm font-medium text-muted-foreground">
                  No report configurations yet
                </p>
                <p className="max-w-sm text-center text-xs text-muted-foreground">
                  Create a report configuration to define what data to include,
                  which metrics to calculate, and how frequently to receive it.
                </p>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setBuilderOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus size={16} /> Create First Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {configs.map((c) => (
                <Card
                  key={c.id}
                  className={`border-border/60 shadow-sm ${
                    !c.is_active ? "opacity-60" : ""
                  }`}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-brand-navy">
                          {c.report_name}
                        </p>
                        <p className="text-xs  text-muted-foreground">
                          {REPORT_TYPE_LABELS[c.report_type] || c.report_type}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditing(c);
                            setBuilderOpen(true);
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted  hover:text-brand-navy"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => removeConfig(c)}
                          className="rounded-md p-1.5  text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Calendar size={10} /> {FREQ_LABELS[c.frequency]}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        {c.delivery_method === "portal_only"
                          ? "Portal"
                          : c.delivery_method === "email"
                            ? "Email"
                            : "Portal + Email"}
                      </Badge>
                      {c.email_recipients?.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1"
                        >
                          <Mail size={10} />
                          {c.email_recipients.length}
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className="text-[10px]  uppercase"
                      >
                        {c.format}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(c.data_sources || []).map((s) => (
                        <span
                          key={s}
                          className="rounded bg-muted  px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {s.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                    {c.last_run_date && (
                      <p className="text-[10px] text-muted-foreground">
                        Last generated:{" "}
                        {new Date(c.last_run_date).toLocaleDateString()}
                      </p>
                    )}
                    <Button
                      onClick={() => generateReport(c)}
                      disabled={generating === c.id}
                      size="sm"
                      className="w-full gap-2 bg-brand-teal hover:bg-brand-teal/90"
                    >
                      <Play size={14} />{" "}
                      {generating === c.id ? "Generating…" : "Generate Now"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Generated Reports tab */}
        <TabsContent value="snapshots" className="space-y-4 mt-4">
          {snapshots.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex  flex-col items-center justify-center gap-3 py-16">
                <FileText className="text-muted-foreground/40" size={32} />
                <p className="text-sm font-medium text-muted-foreground">
                  No generated reports yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Generate a report from the Report Builder tab to see it here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {snapshots.map((s) => (
                <Card
                  key={s.id}
                  className="border-border/60 shadow-sm hover:shadow-md  transition-shadow cursor-pointer"
                  onClick={() => setViewing(s)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg  bg-brand-navy/10">
                        <FileText size={18} className="text-brand-navy" />
                      </div>
                      <div>
                        <p className="font-semibold text-brand-navy">
                          {s.report_name}
                        </p>
                        <p className="text-xs  text-muted-foreground">
                          {REPORT_TYPE_LABELS[s.report_type] || s.report_type} ·
                          {s.generated_date
                            ? new Date(s.generated_date).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {s.period_start} →{s.period_end}
                      </span>
                      <Badge
                        className={
                          s.delivery_status === "sent"
                            ? "bg-emerald-100  text-emerald-700"
                            : s.delivery_status === "viewed"
                              ? "bg-blue-100  text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }
                      >
                        {s.delivery_status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ReportBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        editing={editing}
        onSaved={saveConfig}
      />
      <ReportSnapshotViewer
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        snapshot={viewing}
        onEmailed={loadConfigs}
      />
    </div>
  );
}
