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
import { TRAILER_TYPES, TYRE_TYPES } from "@/lib/fleetTypes";
import {
  generateTrailerPositionNames,
  defaultTrailerTyrePositions,
} from "@/lib/tyrePositions";
import TyrePositionsEditor from "@/components/fleet/TyrePositionsEditor";

const empty = {
  registration_number: "",
  trailer_type: "tautliner",
  number_of_axles: "2",
  tyre_type: "double_tyres",
  gvm: "",
  tare: "",
  make_model: "",
  year: "",
  license_expiry: "",
  cof_expiry: "",
  status: "active",
  assigned_truck_id: "",
  tyre_positions: [],
};

// Defined outside the form so inputs keep focus while typing
const Field = ({ label, children }) => (
  <div className="grid gap-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

export default function TrailerFormDialog({
  open,
  onOpenChange,
  editing,
  trucks,
  onSaved,
}) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          ...empty,
          ...editing,
          number_of_axles: editing.number_of_axles ?? "2",
          gvm: editing.gvm ?? "",
          tare: editing.tare ?? "",
          year: editing.year ?? "",
          tyre_positions: editing.tyre_positions || [],
        });
      } else {
        setForm({
          ...empty,
          tyre_positions: defaultTrailerTyrePositions(2, "double_tyres"),
        });
      }
    }
  }, [open, editing]);

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));
  const num = (val) => (val === "" || val === null ? undefined : Number(val));

  const save = () => {
    if (!form.registration_number) return;
    onSaved({
      ...form,
      number_of_axles: num(form.number_of_axles) ?? 2,
      gvm: num(form.gvm) ?? 0,
      tare: num(form.tare) ?? 0,
      year: num(form.year),
      tyre_position_count: (form.tyre_positions || []).length,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Trailer" : "Add  Trailer"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <Field label="Registration Number">
            <Input
              value={form.registration_number}
              onChange={(e) => set("registration_number", e.target.value)}
              placeholder="TR  123 456"
            />
          </Field>
          <Field label="Trailer Type">
            <Select
              value={form.trailer_type}
              onValueChange={(v) => set("trailer_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRAILER_TYPES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Number of Axles">
            <Input
              type="number"
              value={form.number_of_axles}
              onChange={(e) => set("number_of_axles", e.target.value)}
              placeholder="3"
            />
          </Field>
          <Field label="Tyre Type">
            <Select
              value={form.tyre_type}
              onValueChange={(v) => set("tyre_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYRE_TYPES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="GVM (kg)">
            <Input
              type="number"
              value={form.gvm}
              onChange={(e) => set("gvm", e.target.value)}
              placeholder="30000"
            />
          </Field>
          <Field label="Tare (kg)">
            <Input
              type="number"
              value={form.tare}
              onChange={(e) => set("tare", e.target.value)}
              placeholder="5000"
            />
          </Field>
          <Field label="Make / Model">
            <Input
              value={form.make_model}
              onChange={(e) => set("make_model", e.target.value)}
              placeholder="Henred Fruehauf"
            />
          </Field>
          <Field label="Year">
            <Input
              type="number"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="2021"
            />
          </Field>
          <Field label="License Expiry">
            <Input
              type="date"
              value={form.license_expiry}
              onChange={(e) => set("license_expiry", e.target.value)}
            />
          </Field>
          <Field label="COF Expiry">
            <Input
              type="date"
              value={form.cof_expiry}
              onChange={(e) => set("cof_expiry", e.target.value)}
            />
          </Field>
          <Field label="Assigned Truck">
            <Select
              value={form.assigned_truck_id || "none"}
              onValueChange={(v) =>
                set("assigned_truck_id", v === "none" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
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
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="decommissioned">Decommissioned</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="col-span-2">
            <TyrePositionsEditor
              value={form.tyre_positions}
              onChange={(v) => set("tyre_positions", v)}
              generateNames={(n) =>
                generateTrailerPositionNames(n, form.tyre_type)
              }
            />
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
            {editing ? "Save Changes" : "Add Trailer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
