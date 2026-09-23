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
import { FLEET_TYPES, COMBINATION_TYPES, DIFF_TYPES } from "@/lib/fleetTypes";
import {
  generateTruckPositionNames,
  defaultTruckTyrePositions,
} from "@/lib/tyrePositions";
import TyrePositionsEditor from "@/components/fleet/TyrePositionsEditor";

const empty = {
  registration_number: "",
  fleet_type: "tautliner",
  combination_type: "semi",
  diff_type: "double_diff",
  make_model: "",
  year: "",
  engine_number: "",
  chassis_number: "",
  vin_number: "",
  gvm: "",
  tare: "",
  fuel_tank_capacity: "",
  license_expiry: "",
  operator_license_expiry: "",
  cof_expiry: "",
  status: "active",
  current_odometer: "",
  trailer_id: "",
  tyre_positions: [],
};

export default function TruckFormDialog({
  open,
  onOpenChange,
  editing,
  trailers,
  onSaved,
}) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          ...empty,
          ...editing,
          year: editing.year ?? "",
          gvm: editing.gvm ?? "",
          tare: editing.tare ?? "",
          fuel_tank_capacity: editing.fuel_tank_capacity ?? "",
          current_odometer: editing.current_odometer ?? "",
          tyre_positions: editing.tyre_positions || [],
        });
      } else {
        setForm({
          ...empty,
          tyre_positions: defaultTruckTyrePositions(empty.combination_type),
        });
      }
    }
  }, [open, editing]);

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));
  const num = (val) => (val === "" || val === null ? undefined : Number(val));

  const save = async () => {
    if (!form.registration_number) return;
    const payload = {
      ...form,
      year: num(form.year),
      gvm: num(form.gvm) ?? 0,
      tare: num(form.tare) ?? 0,
      fuel_tank_capacity: num(form.fuel_tank_capacity) ?? 0,
      current_odometer: num(form.current_odometer) ?? 0,
      tyre_position_count: (form.tyre_positions || []).length,
    };
    onSaved(payload);
  };

  const Field = ({ label, children, full }) => (
    <div className={`grid gap-1.5 ${full ? "col-span-2" : ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Truck" : "Add  Truck"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <Field label="Registration Number">
            <Input
              value={form.registration_number}
              onChange={(e) => set("registration_number", e.target.value)}
              placeholder="ND  123 456"
            />
          </Field>
          <Field label="Fleet Type">
            <Select
              value={form.fleet_type}
              onValueChange={(v) => set("fleet_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLEET_TYPES.map((f) => (
                  <SelectItem key={f.key} value={f.key}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Combination Type">
            <Select
              value={form.combination_type}
              onValueChange={(v) => set("combination_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMBINATION_TYPES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Diff Type">
            <Select
              value={form.diff_type}
              onValueChange={(v) => set("diff_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFF_TYPES.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Make / Model">
            <Input
              value={form.make_model}
              onChange={(e) => set("make_model", e.target.value)}
              placeholder="Volvo FH16"
            />
          </Field>
          <Field label="Year">
            <Input
              type="number"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="2022"
            />
          </Field>
          <Field label="Engine Number">
            <Input
              value={form.engine_number}
              onChange={(e) => set("engine_number", e.target.value)}
            />
          </Field>
          <Field label="Chassis Number">
            <Input
              value={form.chassis_number}
              onChange={(e) => set("chassis_number", e.target.value)}
            />
          </Field>
          <Field label="VIN Number">
            <Input
              value={form.vin_number}
              onChange={(e) => set("vin_number", e.target.value)}
            />
          </Field>
          <Field label="GVM (kg)">
            <Input
              type="number"
              value={form.gvm}
              onChange={(e) => set("gvm", e.target.value)}
              placeholder="24000"
            />
          </Field>
          <Field label="Tare (kg)">
            <Input
              type="number"
              value={form.tare}
              onChange={(e) => set("tare", e.target.value)}
              placeholder="9000"
            />
          </Field>
          <Field label="Fuel Tank Capacity (L)">
            <Input
              type="number"
              value={form.fuel_tank_capacity}
              onChange={(e) => set("fuel_tank_capacity", e.target.value)}
              placeholder="400"
            />
          </Field>
          <Field label="License Expiry">
            <Input
              type="date"
              value={form.license_expiry}
              onChange={(e) => set("license_expiry", e.target.value)}
            />
          </Field>
          <Field label="Operator's License Expiry">
            <Input
              type="date"
              value={form.operator_license_expiry}
              onChange={(e) => set("operator_license_expiry", e.target.value)}
            />
          </Field>
          <Field label="COF Expiry">
            <Input
              type="date"
              value={form.cof_expiry}
              onChange={(e) => set("cof_expiry", e.target.value)}
            />
          </Field>
          <Field label="Current Odometer (km)">
            <Input
              type="number"
              value={form.current_odometer}
              onChange={(e) => set("current_odometer", e.target.value)}
            />
          </Field>
          <Field label="Assigned Trailer">
            <Select
              value={form.trailer_id || "none"}
              onValueChange={(v) => set("trailer_id", v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
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
              generateNames={generateTruckPositionNames}
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
            {editing ? "Save Changes" : "Add Truck"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
