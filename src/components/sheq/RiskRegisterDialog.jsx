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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  DEPARTMENTS,
  JOB_ROLES,
  RISK_CATEGORIES,
  RISK_RATINGS,
  LIKELIHOOD_LEVELS,
  IMPACT_LEVELS,
  RISK_STATUS,
  calcInherentRating,
} from "@/lib/sheqConstants";

const empty = {
  risk_description: "",
  category: "safety",
  department: "Transport",
  applicable_roles: [],
  likelihood: "possible",
  impact: "moderate",
  control_measures: "",
  residual_risk_rating: "medium",
  status: "open",
  reviewed_by: "",
  review_date: "",
};

// Defined outside the form so inputs keep focus while typing
const Field = ({ label, children }) => (
  <div className="grid gap-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

export default function RiskRegisterDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open)
      setForm(
        editing
          ? {
              ...empty,
              ...editing,
              applicable_roles: editing.applicable_roles || [],
            }
          : empty,
      );
  }, [open, editing]);
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const toggleRole = (role) =>
    set(
      "applicable_roles",
      (form.applicable_roles || []).includes(role)
        ? (form.applicable_roles || []).filter((r) => r !== role)
        : [...(form.applicable_roles || []), role],
    );
  const inherentRating = calcInherentRating(form.likelihood, form.impact);

  const save = async () => {
    if (!form.risk_description) {
      toast({ title: "Risk description required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, inherent_risk_rating: inherentRating };
      if (editing?.id)
        await base44.entities.RiskRegister.update(editing.id, payload);
      else await base44.entities.RiskRegister.create(payload);
      toast({ title: editing ? "Risk updated" : "Risk added to register" });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing?.id ? "Edit Risk" : "Add to Risk  Register"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="col-span-2">
            <Field label="Risk Description *">
              <Textarea
                value={form.risk_description}
                onChange={(e) => set("risk_description", e.target.value)}
                rows={2}
                placeholder="Describe the risk…"
              />
            </Field>
          </div>
          <Field label="Category">
            <Select
              value={form.category}
              onValueChange={(v) => set("category", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RISK_CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Department">
            <Select
              value={form.department}
              onValueChange={(v) => set("department", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="col-span-2">
            <Label className="text-xs">Applicable Job Roles</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2 rounded-lg border  border-border/60 p-3">
              {JOB_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-1.5 text-xs  cursor-pointer"
                >
                  <Checkbox
                    checked={(form.applicable_roles || []).includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>
          <Field label="Likelihood">
            <Select
              value={form.likelihood}
              onValueChange={(v) => set("likelihood", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIKELIHOOD_LEVELS.map((l) => (
                  <SelectItem key={l.key} value={l.key}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Impact">
            <Select value={form.impact} onValueChange={(v) => set("impact", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMPACT_LEVELS.map((i) => (
                  <SelectItem key={i.key} value={i.key}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="col-span-2 flex items-center justify-between rounded-lg  bg-muted/50 px-3 py-2">
            <span className="text-xs font-medium">
              Inherent Risk Rating (auto)
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold 
${RISK_RATINGS[inherentRating].color}`}
            >
              {RISK_RATINGS[inherentRating].label}
            </span>
          </div>
          <div className="col-span-2">
            <Field label="Control Measures">
              <Textarea
                value={form.control_measures}
                onChange={(e) => set("control_measures", e.target.value)}
                rows={2}
                placeholder="What controls are in place?"
              />
            </Field>
          </div>
          <Field label="Residual Rating">
            <Select
              value={form.residual_risk_rating}
              onValueChange={(v) => set("residual_risk_rating", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RISK_RATINGS).map(([k, r]) => (
                  <SelectItem key={k} value={k}>
                    {r.label}
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
                {Object.entries(RISK_STATUS).map(([k, s]) => (
                  <SelectItem key={k} value={k}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Reviewed By">
            <Input
              value={form.reviewed_by}
              onChange={(e) => set("reviewed_by", e.target.value)}
              placeholder="SHERQ Manager name"
            />
          </Field>
          <Field label="Review Date">
            <Input
              type="date"
              value={form.review_date}
              onChange={(e) => set("review_date", e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {saving ? "Saving…" : editing?.id ? "Save" : "Add Risk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
