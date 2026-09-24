import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const empty = {
  asset_type: "truck",
  truck_id: "",
  trailer_id: "",
  maintenance_type: "service",
  scheduled_date: "",
  next_service_date: "",
  service_interval_km: "",
  service_interval_days: "",
  assigned_technician: "",
  notes: "",
};

// Defined outside the form so inputs keep focus while typing
const Field = ({ label, children }) => (
  <div className="grid gap-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

export default function MaintenanceScheduleDialog({
  open,
  onOpenChange,
  editing,
  trucks,
  trailers,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          ...empty,
          ...editing,
          service_interval_km: editing.service_interval_km ?? "",
          service_interval_days: editing.service_interval_days ?? "",
        });
      } else {
        setForm(empty);
      }
    }
  }, [open, editing]);

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));
  const num = (val) => (val === "" || val === null ? undefined : Number(val));

  const save = async () => {
    if (!form.scheduled_date) {
      toast({ title: "Scheduled date required", variant: "destructive" });
      return;
    }
    const payload = {
      ...form,
      truck_registration:
        form.asset_type === "truck"
          ? trucks.find((t) => t.id === form.truck_id)?.registration_number ||
            ""
          : "",
      service_interval_km: num(form.service_interval_km) ?? 0,
      service_interval_days: num(form.service_interval_days) ?? 0,
    };
    try {
      if (editing)
        await base44.entities.MaintenanceSchedule.update(editing.id, payload);
      else await base44.entities.MaintenanceSchedule.create(payload);
      toast({ title: editing ? "Schedule updated" : "Schedule created" });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Schedule" : "New Maintenance  Schedule"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <Field label="Asset Type">
            <Select
              value={form.asset_type}
              onValueChange={(v) => set("asset_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="trailer">Trailer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Maintenance Type">
            <Select
              value={form.maintenance_type}
              onValueChange={(v) => set("maintenance_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="preventative">Preventative</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {form.asset_type === "truck" ? (
            <Field label="Truck">
              <Select
                value={form.truck_id || "none"}
                onValueChange={(v) => set("truck_id", v === "none" ? "" : v)}
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
            </Field>
          ) : (
            <Field label="Trailer">
              <Select
                value={form.trailer_id || "none"}
                onValueChange={(v) => set("trailer_id", v === "none" ? "" : v)}
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
            </Field>
          )}
          <Field label="Scheduled Date">
            <Input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => set("scheduled_date", e.target.value)}
            />
          </Field>
          <Field label="Next Service Date">
            <Input
              type="date"
              value={form.next_service_date}
              onChange={(e) => set("next_service_date", e.target.value)}
            />
          </Field>
          <Field label="Interval (km)">
            <Input
              type="number"
              value={form.service_interval_km}
              onChange={(e) => set("service_interval_km", e.target.value)}
              placeholder="15000"
            />
          </Field>
          <Field label="Interval (days)">
            <Input
              type="number"
              value={form.service_interval_days}
              onChange={(e) => set("service_interval_days", e.target.value)}
              placeholder="90"
            />
          </Field>
          <Field label="Assigned Technician">
            <Input
              value={form.assigned_technician}
              onChange={(e) => set("assigned_technician", e.target.value)}
              placeholder="Mechanic name"
            />
          </Field>
          <div className="col-span-2">
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Additional  notes…"
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            className="bg-brand-navy  hover:bg-brand-navy/90"
          >
            {editing ? "Save" : "Create Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
