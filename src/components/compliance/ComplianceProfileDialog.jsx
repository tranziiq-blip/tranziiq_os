import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { JURISDICTIONS } from "@/lib/complianceContent";
import {
  buildDocumentChecklist,
  buildDviChecklist,
} from "@/lib/complianceEngine";

const countries = JURISDICTIONS.filter((j) => j.level === "country");
const provinces = JURISDICTIONS.filter((j) => j.level === "province");

export default function ComplianceProfileDialog({
  open,
  onOpenChange,
  profile,
  profileType,
  loads,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    if (!open) return;
    setForm(profile ? { ...profile } : {});
    base44.entities.Driver.filter({ status: "active" })
      .then(setDrivers)
      .catch(() => {});
  }, [open, profile]);

  const selectLoad = async (loadId) => {
    const load = loads.find((l) => l.id === loadId);
    if (!load) {
      setForm((f) => ({ ...f, load_id: "" }));
      return;
    }
    const next = {
      ...form,
      load_id: load.id,
      load_number: load.load_number,
      client: load.client || "",
      truck_id: load.truck_id || "",
      driver_id: load.driver_id || "",
      driver_name:
        drivers.find((d) => d.id === load.driver_id)?.full_name || "",
      cross_border: !!load.cross_border,
    };
    if (load.truck_id) {
      try {
        const t = await base44.entities.Truck.get(load.truck_id);
        next.truck_registration = t.registration_number;
      } catch {
        next.truck_registration = "";
      }
    }
    setForm(next);
  };

  const toggleJurisdiction = (code) =>
    setForm((f) => ({
      ...f,
      jurisdictions: (f.jurisdictions || []).includes(code)
        ? (f.jurisdictions || []).filter((c) => c !== code)
        : [...(f.jurisdictions || []), code],
    }));

  const save = async () => {
    if (!form.load_id) {
      toast({ title: "Select a load", variant: "destructive" });
      return;
    }
    if (!(form.jurisdictions || []).length) {
      toast({
        title: "Select at least one  jurisdiction",
        description: "Country/province rule sets drive the document  checklist",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const common = {
        profile_type: profileType,
        load_id: form.load_id,
        load_number: form.load_number,
        client: form.client || "",
        truck_id: form.truck_id || "",
        truck_registration: form.truck_registration || "",
        driver_id: form.driver_id || "",
        driver_name: form.driver_name || "",
        jurisdictions: form.jurisdictions,
        cross_border: !!form.cross_border,
        notes: form.notes || "",
      };
      if (profileType === "dg_hazmat")
        Object.assign(common, {
          un_class: form.un_class || "",
          un_number: form.un_number || "",
          proper_shipping_name: form.proper_shipping_name || "",
          trem_reference: form.trem_reference || "",
          multi_substance: !!form.multi_substance,
        });
      if (profileType === "cold_chain")
        Object.assign(common, {
          product_type: form.product_type || "",
          temp_min_c:
            form.temp_min_c === "" || form.temp_min_c == null
              ? null
              : Number(form.temp_min_c),
          temp_max_c:
            form.temp_max_c === "" || form.temp_max_c == null
              ? null
              : Number(form.temp_max_c),
          logger_serial: form.logger_serial || "",
          logger_interval_minutes: Number(form.logger_interval_minutes) || 15,
        });
      if (profileType === "abnormal_load")
        Object.assign(common, {
          load_height_m: form.load_height_m ? Number(form.load_height_m) : null,
          load_width_m: form.load_width_m ? Number(form.load_width_m) : null,
          load_length_m: form.load_length_m ? Number(form.load_length_m) : null,
          mass_tons: form.mass_tons ? Number(form.mass_tons) : null,
          escort_required: !!form.escort_required,
          travel_time_restriction: form.travel_time_restriction || "",
        });

      if (profile) {
        await base44.entities.ComplianceProfile.update(profile.id, common);
      } else {
        const docs = buildDocumentChecklist(
          profileType,
          form.jurisdictions,
          !!form.cross_border,
        );
        const dvis = buildDviChecklist(profileType, !!form.cross_border);
        common.documents_data = docs.map((d) =>
          JSON.stringify({
            id: d.id,
            label: d.label,
            jurisdiction: d.jurisdiction,
            status: "missing",
            required: true,
          }),
        );
        common.dvi_data = dvis.map((d) =>
          JSON.stringify({
            id: d.id,
            label: d.label,
            status: "missing",
            required: true,
          }),
        );
        common.status = "pending";
        await base44.entities.ComplianceProfile.create(common);
      }
      toast({
        title: profile ? "Profile updated" : "Compliance profile created",
        description:
          "Document checklist and DVI items generated for each jurisdiction  on the route",
      });
      onSaved();
    } catch (e) {
      toast({
        title: "Error saving",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {profile ? "Edit" : "New"} Compliance Profile
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <div className="grid gap-1.5">
            <Label className="text-xs">Load</Label>
            <Select value={form.load_id || "none"} onValueChange={selectLoad}>
              <SelectTrigger>
                <SelectValue placeholder="Select load" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a load…</SelectItem>
                {loads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.load_number} —{l.client || "No client"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.cross_border && (
              <Badge className="w-fit bg-amber-100  text-amber-700">
                Cross-border load — transit-country documents will be added
              </Badge>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">
              Jurisdictions on the Route{" "}
              <span className="text-rose-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {countries.map((j) => (
                <button
                  key={j.code}
                  onClick={() => toggleJurisdiction(j.code)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium 
${(form.jurisdictions || []).includes(j.code) ? "border-brand-teal  bg-brand-teal text-white" : "border-border bg-white text-muted-foreground"}`}
                >
                  {j.name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider  text-muted-foreground w-full">
                SA Provinces (abnormal-load permits are issued per province)
              </span>
              {provinces.map((j) => (
                <button
                  key={j.code}
                  onClick={() => toggleJurisdiction(j.code)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] 
${(form.jurisdictions || []).includes(j.code) ? "border-brand-teal  bg-brand-teal text-white" : "border-border bg-white text-muted-foreground"}`}
                >
                  {j.name.replace(" (SA)", "")}
                </button>
              ))}
            </div>
          </div>

          {profileType === "dg_hazmat" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">UN Class (SANS 10228)</Label>
                <Input
                  value={form.un_class || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      un_class: e.target.value,
                    })
                  }
                  placeholder="3"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">UN Number</Label>
                <Input
                  value={form.un_number || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      un_number: e.target.value,
                    })
                  }
                  placeholder="1203"
                />
              </div>
              <div className="grid gap-1.5 col-span-2">
                <Label className="text-xs">Proper Shipping Name</Label>
                <Input
                  value={form.proper_shipping_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, proper_shipping_name: e.target.value })
                  }
                  placeholder="Petrol / Gasoline"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">TREM Card Reference</Label>
                <Input
                  value={form.trem_reference || ""}
                  onChange={(e) =>
                    setForm({ ...form, trem_reference: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-xs mt-5">
                <input
                  type="checkbox"
                  checked={!!form.multi_substance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      multi_substance: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />{" "}
                Multiple substances (segregation check applies)
              </label>
            </div>
          )}

          {profileType === "cold_chain" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Product Type</Label>
                <Input
                  value={form.product_type || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      product_type: e.target.value,
                    })
                  }
                  placeholder="Pharma / Perishable  food"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Logger Serial</Label>
                <Input
                  value={form.logger_serial || ""}
                  onChange={(e) =>
                    setForm({ ...form, logger_serial: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Min Temp (°C)</Label>
                <Input
                  type="number"
                  value={form.temp_min_c ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, temp_min_c: e.target.value })
                  }
                  placeholder="2"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Max Temp (°C)</Label>
                <Input
                  type="number"
                  value={form.temp_max_c ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, temp_max_c: e.target.value })
                  }
                  placeholder="8"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Logger Interval (min)</Label>
                <Input
                  type="number"
                  value={form.logger_interval_minutes ?? 15}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      logger_interval_minutes: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {profileType === "abnormal_load" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Height (m)</Label>
                <Input
                  type="number"
                  value={form.load_height_m ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, load_height_m: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Width (m)</Label>
                <Input
                  type="number"
                  value={form.load_width_m ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, load_width_m: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Length (m)</Label>
                <Input
                  type="number"
                  value={form.load_length_m ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, load_length_m: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Mass (t)</Label>
                <Input
                  type="number"
                  value={form.mass_tons ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, mass_tons: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={!!form.escort_required}
                  onChange={(e) =>
                    setForm({ ...form, escort_required: e.target.checked })
                  }
                  className="h-4 w-4"
                />{" "}
                Escort vehicle(s) required
              </label>
              <div className="grid gap-1.5">
                <Label className="text-xs">Travel Time Restriction</Label>
                <Input
                  value={form.travel_time_restriction || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      travel_time_restriction: e.target.value,
                    })
                  }
                  placeholder="Daylight only 06:00–18:00"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-brand-navy  hover:bg-brand-navy/90"
          >
            {saving ? "Saving…" : profile ? "Save Changes" : "Create Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
