import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { useToast } from "@/components/ui/use-toast";
import { JOB_CARD_STATUS, PRIORITY_COLORS } from "@/lib/engineeringChecklists";
import JobCardDetailDialog from "@/components/engineering/JobCardDetailDialog";
import RootCauseAnalysisDialog from "@/components/engineering/RootCauseAnalysisDialog";
import MaintenanceScheduleDialog from "@/components/engineering/MaintenanceScheduleDialog";
import TyreManagementTab from "@/components/engineering/TyreManagementTab";
import {
  Plus,
  Wrench,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  Search,
  ChevronRight,
  CircleDot,
} from "lucide-react";

export default function Engineering() {
  const { toast } = useToast();
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [rcas, setRcas] = useState([]);
  const [tyres, setTyres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedRcaId, setSelectedRcaId] = useState(null);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    asset_type: "truck",
    truck_id: "",
    trailer_id: "",
    job_type: "service",
    title: "",
    description: "",
    priority: "medium",
  });
  const [jobFilter, setJobFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [t, tr, j, s, r, ty] = await Promise.all([
        base44.entities.Truck.list(),
        base44.entities.Trailer.list(),
        base44.entities.JobCard.list("-created_date"),
        base44.entities.MaintenanceSchedule.list("-scheduled_date"),
        base44.entities.RootCauseAnalysis.list("-created_date"),
        base44.entities.Tyre.list("-created_date"),
      ]);
      setTrucks(t);
      setTrailers(tr);
      setJobCards(j);
      setSchedules(s);
      setRcas(r);
      setTyres(ty);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(i);
  }, []);

  const selectedJob = jobCards.find((j) => j.id === selectedJobId) || null;
  const selectedRca = rcas.find((r) => r.id === selectedRcaId) || null;

  const totalTrucks = trucks.length;
  const activeTrucks = trucks.filter((t) => t.status === "active").length;
  const offRoad = trucks.filter((t) => t.status === "maintenance").length;
  const inWorkshop = new Set(
    jobCards
      .filter((j) => j.status !== "completed" && j.truck_id)
      .map((j) => j.truck_id),
  ).size;
  const available = Math.max(activeTrucks - inWorkshop, 0);
  const availabilityPct = totalTrucks
    ? Math.round((available / totalTrucks) * 100)
    : 0;

  const completedBreakdowns = jobCards.filter(
    (j) => j.status === "completed" && j.job_type === "breakdown",
  );
  const avgResponse = completedBreakdowns.length
    ? Math.round(
        completedBreakdowns.reduce(
          (s, j) => s + (j.response_time_minutes || 0),
          0,
        ) / completedBreakdowns.length,
      )
    : 0;
  const avgRepair = completedBreakdowns.length
    ? Math.round(
        completedBreakdowns.reduce(
          (s, j) => s + (j.repair_time_minutes || 0),
          0,
        ) / completedBreakdowns.length,
      )
    : 0;

  const filteredJobs =
    jobFilter === "all"
      ? jobCards
      : jobFilter === "open"
        ? jobCards.filter((j) => j.status === "open")
        : jobFilter === "active"
          ? jobCards.filter((j) =>
              [
                "allocated",
                "accepted",
                "en_route",
                "arrived",
                "in_progress",
                "parts_ordered",
              ].includes(j.status),
            )
          : jobCards.filter((j) => j.status === "completed");
  const openCount = jobCards.filter((j) => j.status === "open").length;
  const activeCount = jobCards.filter((j) =>
    [
      "allocated",
      "accepted",
      "en_route",
      "arrived",
      "in_progress",
      "parts_ordered",
    ].includes(j.status),
  ).length;
  const completedCount = jobCards.filter(
    (j) => j.status === "completed",
  ).length;

  const breakdownsByMonth = {};
  jobCards
    .filter((j) => j.job_type === "breakdown")
    .forEach((j) => {
      const m = new Date(j.created_date).toLocaleString("en-ZA", {
        month: "short",
      });
      breakdownsByMonth[m] = (breakdownsByMonth[m] || 0) + 1;
    });
  const chartData = Object.entries(breakdownsByMonth).map(([month, count]) => ({
    month,
    breakdowns: count,
  }));
  const recurringMap = {};
  rcas
    .filter((r) => r.status === "completed")
    .forEach((r) => {
      const k = `${r.truck_id}-${r.failure_category}`;
      recurringMap[k] = recurringMap[k] || {
        truck: r.truck_registration,
        category: r.failure_category,
        count: 0,
      };
      recurringMap[k].count++;
    });
  const recurringList = Object.values(recurringMap)
    .filter((p) => p.count > 1)
    .sort((a, b) => b.count - a.count);

  const openRcas = rcas.filter((r) => r.status === "open");
  const completedRcas = rcas.filter((r) => r.status === "completed");
  const rcaWithSla = (rca) => {
    const d = new Date(rca.created_date).getTime() + 24 * 3600000;
    const h = Math.ceil((d - now) / 3600000);
    return { ...rca, hoursLeft: h, overdue: h < 0 };
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingSchedules = schedules
    .filter((s) => s.status !== "completed" && s.scheduled_date >= todayStr)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  const overdueSchedules = schedules.filter(
    (s) => s.status !== "completed" && s.scheduled_date < todayStr,
  );
  const serviceHistory = jobCards
    .filter(
      (j) =>
        j.status === "completed" &&
        ["service", "inspection", "preventative"].includes(j.job_type),
    )
    .slice(0, 15);

  const createJobCard = async () => {
    if (!newJob.title) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    const truck = trucks.find((t) => t.id === newJob.truck_id);
    await base44.entities.JobCard.create({
      ...newJob,
      truck_registration: truck?.registration_number || "",
      status: "open",
    });
    toast({ title: "Job card created" });
    setNewJobOpen(false);
    setNewJob({
      asset_type: "truck",
      truck_id: "",
      trailer_id: "",
      job_type: "service",
      title: "",
      description: "",
      priority: "medium",
    });
    load();
  };

  const fmtDuration = (mins) => {
    if (!mins) return "—";
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Engineering Workshop
          </h1>
          <p className="text-sm text-muted-foreground">
            Fleet availability · breakdown management · maintenance planning
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingSchedule(null);
              setScheduleDialog(true);
            }}
            className="gap-2"
          >
            <Calendar size={16} />
            Schedule
          </Button>
          <Button
            onClick={() => setNewJobOpen(true)}
            className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
          >
            <Plus size={16} /> New Job Card
          </Button>
        </div>
      </div>

      {/* Fleet Availability Banner */}
      <div className="rounded-xl gradient-brand p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider  text-white/70">
              Fleet Availability
            </p>
            <p className="font-display text-4xl font-bold">
              {availabilityPct}%
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="font-display text-2xl  font-bold">{available}</p>
              <p className="text-xs  text-white/70">Available</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl  font-bold">{inWorkshop}</p>
              <p className="text-xs text-white/70">In Workshop</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl  font-bold">{offRoad}</p>
              <p className="text-xs text-white/70">Off Road</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl  font-bold">{totalTrucks}</p>
              <p className="text-xs text-white/70">Total</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs" className="gap-1.5">
            <Wrench size={14} /> Job Cards
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5">
            <Calendar size={14} />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="tyres" className="gap-1.5">
            <CircleDot size={14} />
            Tyres
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5">
            <TrendingUp size={14} />
            Trends & RCA
          </TabsTrigger>
        </TabsList>

        {/* JOB CARDS TAB */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Unallocated</p>
                  <AlertCircle size={16} className="text-rose-500" />
                </div>
                <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
                  {openCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Active</p>
                  <Wrench size={16} className="text-amber-500" />
                </div>
                <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
                  {activeCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                  <Clock size={16} className="text-brand-teal" />
                </div>
                <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
                  {fmtDuration(avgResponse)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Avg Repair</p>
                  <Wrench size={16} className="text-brand-blue" />
                </div>
                <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
                  {fmtDuration(avgRepair)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            {[
              { k: "all", l: "All" },
              { k: "open", l: "Unallocated" },
              { k: "active", l: "Active" },
              { k: "completed", l: "Completed" },
            ].map((f) => (
              <button
                key={f.k}
                onClick={() => setJobFilter(f.k)}
                className={`rounded-full 
px-3 py-1.5 text-xs font-medium transition ${jobFilter === f.k ? "bg-brand-navy  text-white" : "bg-muted text-muted-foreground  hover:bg-muted/70"}`}
              >
                {f.l}
              </button>
            ))}
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>

                      <TableHead>Technician</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Repair</TableHead>
                      <TableHead></TableHead>
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
                    {!loading && filteredJobs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center text-muted-foreground py-8"
                        >
                          No job cards found.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredJobs.slice(0, 50).map((j) => {
                      const meta =
                        JOB_CARD_STATUS[j.status] || JOB_CARD_STATUS.open;
                      return (
                        <TableRow
                          key={j.id}
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() => setSelectedJobId(j.id)}
                        >
                          <TableCell className="font-semibold text-brand-navy">
                            {j.truck_registration || j.title}
                          </TableCell>
                          <TableCell className="text-sm">{j.title}</TableCell>
                          <TableCell className="text-xs capitalize  text-muted-foreground">
                            {j.job_type}
                          </TableCell>
                          <TableCell>
                            <Badge className={PRIORITY_COLORS[j.priority]}>
                              {j.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {j.assigned_technician || "—"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium 
${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmtDuration(j.response_time_minutes)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmtDuration(j.repair_time_minutes)}
                          </TableCell>
                          <TableCell>
                            <ChevronRight
                              size={15}
                              className="text-muted-foreground"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MAINTENANCE TAB */}
        <TabsContent value="maintenance" className="space-y-4">
          {overdueSchedules.length > 0 && (
            <Card className="border-rose-200 bg-rose-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2  text-base font-semibold text-rose-800">
                  <AlertCircle size={16} /> Overdue Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg  border border-rose-200 bg-white p-3"
                  >
                    <div>
                      <span className="font-semibold text-brand-navy">
                        {s.truck_registration || "Trailer"}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground  capitalize">
                        {s.maintenance_type} · was due{" "}
                        {new Date(s.scheduled_date).toLocaleDateString("en-ZA")}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingSchedule(s);
                        setScheduleDialog(true);
                      }}
                    >
                      Update
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Upcoming Schedules
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingSchedule(null);
                  setScheduleDialog(true);
                }}
                className="gap-1.5"
              >
                <Plus size={14} /> New
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Next</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingSchedules.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-6"
                      >
                        No upcoming schedules.
                      </TableCell>
                    </TableRow>
                  )}
                  {upcomingSchedules.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => {
                        setEditingSchedule(s);
                        setScheduleDialog(true);
                      }}
                    >
                      <TableCell className="font-semibold text-brand-navy">
                        {s.truck_registration || "Trailer"}
                      </TableCell>
                      <TableCell className="text-xs capitalize">
                        {s.maintenance_type}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(s.scheduled_date).toLocaleDateString("en-ZA")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.next_service_date
                          ? new Date(s.next_service_date).toLocaleDateString(
                              "en-ZA",
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.assigned_technician || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-xs  capitalize"
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base  font-semibold">
                Service History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Technician</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceHistory.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-6"
                      >
                        No service history yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {serviceHistory.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="font-semibold  text-brand-navy">
                        {j.truck_registration}
                      </TableCell>
                      <TableCell className="text-sm">{j.title}</TableCell>
                      <TableCell className="text-xs capitalize  text-muted-foreground">
                        {j.job_type}
                      </TableCell>
                      <TableCell className="text-xs">
                        {j.completed_at
                          ? new Date(j.completed_at).toLocaleDateString("en-ZA")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {j.assigned_technician || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TYRES TAB */}
        <TabsContent value="tyres">
          <TyreManagementTab
            trucks={trucks}
            trailers={trailers}
            tyres={tyres}
            onDataChanged={load}
          />
        </TabsContent>

        {/* TRENDS & RCA TAB */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Total Breakdowns
                  </p>
                  <AlertCircle size={16} className="text-rose-500" />
                </div>
                <p className="mt-1 font-display  text-2xl font-bold text-brand-navy">
                  {jobCards.filter((j) => j.job_type === "breakdown").length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Open RCAs</p>
                  <Search size={16} className="text-amber-500" />
                </div>
                <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
                  {openRcas.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                  <Clock size={16} className="text-brand-teal" />
                </div>
                <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
                  {fmtDuration(avgResponse)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Avg Repair</p>
                  <Wrench size={16} className="text-brand-blue" />
                </div>
                <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
                  {fmtDuration(avgRepair)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base  font-semibold">
                Breakdown Trend by Month
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm  text-muted-foreground">
                  No breakdown data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar
                      dataKey="breakdowns"
                      fill="hsl(var(--brand-blue))"
                      radius={[4, 4, 0, 0]}
                      name="Breakdowns"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {recurringList.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2  text-base font-semibold text-amber-800">
                  <AlertCircle size={16} /> Recurring Problems
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {recurringList.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold  text-brand-navy">
                          {p.truck}
                        </TableCell>
                        <TableCell className="text-xs  capitalize">
                          {p.category.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-[10px]">
                            {p.count}
                            occurrences
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {openRcas.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2  text-base font-semibold text-amber-800">
                  <Search size={16} /> Open Root Cause Analyses — 24h SLA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {openRcas.map((rca) => {
                  const s = rcaWithSla(rca);
                  return (
                    <div
                      key={rca.id}
                      className="flex items-center justify-between rounded-lg  border border-amber-200 bg-white p-3"
                    >
                      <div>
                        <span className="font-semibold  text-brand-navy">
                          {rca.truck_registration}
                        </span>
                        <span className="ml-2 text-xs  text-muted-foreground capitalize">
                          {rca.failure_category.replace(/_/g, "  ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            s.overdue
                              ? "bg-rose-100 text-rose-700"
                              : s.hoursLeft <= 4
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }
                        >
                          {s.overdue ? "Overdue" : `${s.hoursLeft}h left`}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => setSelectedRcaId(rca.id)}
                          className="gap-1  bg-brand-navy hover:bg-brand-navy/90"
                        >
                          Complete RCA
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {completedRcas.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base  font-semibold">
                  Completed RCAs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Root Cause</TableHead>
                      <TableHead>Preventive Action</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedRcas.slice(0, 10).map((rca) => (
                      <TableRow key={rca.id}>
                        <TableCell className="font-semibold  text-brand-navy">
                          {rca.truck_registration}
                        </TableCell>
                        <TableCell className="text-xs capitalize">
                          {rca.failure_category.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs  truncate">
                          {rca.root_cause}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs  truncate">
                          {rca.preventive_action}
                        </TableCell>
                        <TableCell className="text-xs">
                          {rca.completed_at
                            ? new Date(rca.completed_at).toLocaleDateString(
                                "en-ZA",
                              )
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <JobCardDetailDialog
        open={!!selectedJobId}
        onOpenChange={(v) => !v && setSelectedJobId(null)}
        jobCard={selectedJob}
        onUpdated={load}
      />
      <RootCauseAnalysisDialog
        open={!!selectedRcaId}
        onOpenChange={(v) => !v && setSelectedRcaId(null)}
        rca={selectedRca}
        onComplete={load}
      />
      <MaintenanceScheduleDialog
        open={scheduleDialog}
        onOpenChange={setScheduleDialog}
        editing={editingSchedule}
        trucks={trucks}
        trailers={trailers}
        onSaved={load}
      />

      {/* New Job Card Dialog */}
      <Dialog open={newJobOpen} onOpenChange={setNewJobOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Job Card</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="grid gap-1.5">
              <Label className="text-xs">Asset Type</Label>
              <Select
                value={newJob.asset_type}
                onValueChange={(v) =>
                  setNewJob({
                    ...newJob,
                    asset_type: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="trailer">Trailer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Job Type</Label>
              <Select
                value={newJob.job_type}
                onValueChange={(v) =>
                  setNewJob({
                    ...newJob,
                    job_type: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakdown">Breakdown</SelectItem>
                  <SelectItem value="preventative">Preventative</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 col-span-2">
              {newJob.asset_type === "truck" ? (
                <Select
                  value={newJob.truck_id || "none"}
                  onValueChange={(v) =>
                    setNewJob({
                      ...newJob,
                      truck_id: v === "none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select truck" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {trucks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.registration_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={newJob.trailer_id || "none"}
                  onValueChange={(v) =>
                    setNewJob({
                      ...newJob,
                      trailer_id: v === "none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trailer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {trailers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.registration_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-1.5 col-span-2">
              <Label className="text-xs">Title</Label>
              <Input
                value={newJob.title}
                onChange={(e) =>
                  setNewJob({ ...newJob, title: e.target.value })
                }
                placeholder="e.g. Front brake  pad replacement"
              />
            </div>
            <div className="grid gap-1.5 col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={newJob.description}
                onChange={(e) =>
                  setNewJob({ ...newJob, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Priority</Label>
              <Select
                value={newJob.priority}
                onValueChange={(v) => setNewJob({ ...newJob, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewJobOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={createJobCard}
              className="bg-brand-navy hover:bg-brand-navy/90"
            >
              Create Job Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
