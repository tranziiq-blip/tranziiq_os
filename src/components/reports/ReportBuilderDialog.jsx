import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Mail } from "lucide-react";

const REPORT_TYPES = [
  { value: "fleet_performance", label: "Fleet Performance" },
  { value: "financial_summary", label: "Financial Summary" },
  { value: "load_activity", label: "Load Activity" },
  { value: "maintenance_report", label: "Maintenance Report" },
  { value: "sheq_compliance", label: "SHERQ Compliance" },
  { value: "driver_performance", label: "Driver Performance" },
  { value: "fuel_analysis", label: "Fuel Analysis" },
  { value: "client_summary", label: "Client Summary" },
  { value: "cross_border_status", label: "Cross-Border Status" },
  { value: "custom", label: "Custom Report" },
];

const DATA_SOURCES = [
  { key: "loads", label: "Loads" },
  { key: "trucks", label: "Trucks" },
  { key: "drivers", label: "Drivers" },
  { key: "invoices", label: "Invoices" },
  { key: "expenses", label: "Expenses" },
  { key: "job_cards", label: "Job Cards" },
  { key: "incidents", label: "Incidents" },
  { key: "fuel_logs", label: "Fuel Logs" },
  { key: "parts", label: "Parts" },
  { key: "weighbills", label: "Weighbills" },
  { key: "manifests", label: "Transport Manifests" },
];

const METRICS_BY_TYPE = {
  fleet_performance: [
    "Total Trucks",
    "Active Trucks",
    "In Maintenance",
    "Avg  Odometer",
    "Fleet Utilisation %",
  ],
  financial_summary: [
    "Revenue",
    "Expenses",
    "Net Profit",
    "Outstanding  Invoices",
    "CPK",
    "RPK",
  ],
  load_activity: [
    "Total Loads",
    "In Transit",
    "Delivered",
    "Delayed",
    "Cancelled",
    "Avg Turnaround",
  ],
  maintenance_report: [
    "Open Jobs",
    "Critical Jobs",
    "Total Downtime (hrs)",
    "Total Cost",
    "Avg Repair Time",
  ],
  sheq_compliance: [
    "Open Incidents",
    "Critical",
    "Near-Misses",
    "Resolved",
    "VFLs Conducted",
  ],
  driver_performance: [
    "Total Drivers",
    "Active",
    "On Leave",
    "DG Certified",
    "Avg Hours/Week",
  ],
  fuel_analysis: [
    "Total Litres",
    "Total Cost",
    "Avg per Fill",
    "Entries",
    "Fuel Efficiency",
  ],
  client_summary: [
    "Loads per Client",
    "Revenue per Client",
    "Outstanding per  Client",
  ],
  cross_border_status: [
    "Pending Manifests",
    "Documents Submitted",
    "In  Process",
    "Cleared",
    "Held",
  ],
  custom: ["All Available Metrics"],
};

const empty = {
  report_name: "",
  report_type: "fleet_performance",
  data_sources: ["loads", "trucks"],
  metrics: [],
  frequency: "on_demand",
  delivery_method: "portal_only",
  email_recipients: [],
  format: "html",
};

export default function ReportBuilderDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}) {
  const [form, setForm] = useState(empty);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (editing) setForm({ ...empty, ...editing });
    else setForm(empty);
  }, [editing, open]);

  const toggleSource = (key) => {
    setForm((prev) => ({
      ...prev,
      data_sources: prev.data_sources.includes(key)
        ? prev.data_sources.filter((s) => s !== key)
        : [...prev.data_sources, key],
    }));
  };

  const toggleMetric = (metric) => {
    setForm((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter((m) => m !== metric)
        : [...prev.metrics, metric],
    }));
  };

  const addEmail = () => {
    if (newEmail && !form.email_recipients.includes(newEmail)) {
      setForm((prev) => ({
        ...prev,
        email_recipients: [...prev.email_recipients, newEmail],
      }));
      setNewEmail("");
    }
  };

  const removeEmail = (email) => {
    setForm((prev) => ({
      ...prev,
      email_recipients: prev.email_recipients.filter((e) => e !== email),
    }));
  };

  const availableMetrics = METRICS_BY_TYPE[form.report_type] || [];

  const save = () => {
    onSaved({
      ...form,
      is_active: true,
      next_run_date:
        form.frequency !== "on_demand"
          ? new Date().toISOString().slice(0, 10)
          : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing
              ? "Edit Report Configuration"
              : "Create Report  Configuration"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="grid gap-1.5 col-span-2">
            <Label className="text-xs">Report Name *</Label>
            <Input
              value={form.report_name}
              onChange={(e) =>
                setForm({ ...form, report_name: e.target.value })
              }
              placeholder="Weekly Fleet Performance"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Report Type</Label>
            <Select
              value={form.report_type}
              onValueChange={(v) =>
                setForm({ ...form, report_type: v, metrics: [] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Format</Label>
            <Select
              value={form.format}
              onValueChange={(v) => setForm({ ...form, format: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="html">HTML (Viewable)</SelectItem>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="pdf">PDF (Printable)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data sources */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            Data Sources — select what data to include
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {DATA_SOURCES.map((ds) => (
              <label
                key={ds.key}
                className="flex items-center gap-2 rounded-md border  border-border/50 px-2.5 py-1.5 text-xs cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={form.data_sources.includes(ds.key)}
                  onCheckedChange={() => toggleSource(ds.key)}
                  className="h-3.5 w-3.5"
                />
                <span className="font-medium">{ds.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            Metrics — what to calculate
          </Label>
          <div className="flex flex-wrap gap-2">
            {availableMetrics.map((m) => (
              <label
                key={m}
                className={`flex items-center gap-1.5 rounded-full border px-3 
py-1 text-xs cursor-pointer ${form.metrics.includes(m) ? "border-brand-teal  bg-brand-teal/5 text-brand-navy" : "border-border text-muted-foreground"}`}
              >
                <Checkbox
                  checked={form.metrics.includes(m)}
                  onCheckedChange={() => toggleMetric(m)}
                  className="h-3 w-3"
                />
                {m}
              </label>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs">Frequency</Label>
            <Select
              value={form.frequency}
              onValueChange={(v) => setForm({ ...form, frequency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_demand">On Demand Only</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Delivery Method</Label>
            <Select
              value={form.delivery_method}
              onValueChange={(v) => setForm({ ...form, delivery_method: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portal_only">Portal Only</SelectItem>
                <SelectItem value="email">Email Only</SelectItem>
                <SelectItem value="both">Portal + Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Email recipients */}
        {form.delivery_method !== "portal_only" && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Email Recipients</Label>
            <div className="flex gap-2">
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="recipient@company.co.za"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEmail();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addEmail}
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.email_recipients.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded-full  bg-muted px-2.5 py-1 text-xs"
                >
                  <Mail size={10} /> {email}
                  <button
                    onClick={() => removeEmail(email)}
                    className="ml-1  text-muted-foreground hover:text-rose-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={!form.report_name}
            className="bg-brand-navy  hover:bg-brand-navy/90"
          >
            {editing ? "Save Changes" : "Create  Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
