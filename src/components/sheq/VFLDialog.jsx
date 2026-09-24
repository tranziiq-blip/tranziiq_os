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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { DEPARTMENTS, VFL_TYPES } from "@/lib/sheqConstants";

const nowISO = () => new Date().toISOString().slice(0, 16);
const empty = {
  conducted_by: "",
  conducted_date: nowISO(),
  department: "Transport",
  observation_type: "safe_act",
  location: "",
  description: "",
  intervention: "",
  follow_up_required: false,
  follow_up_action: "",
};

// Defined outside the form so inputs keep focus while typing
const Field = ({ label, children }) => (
  <div className="grid gap-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

export default function VFLDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const save = async () => {
    if (!form.conducted_by || !form.description) {
      toast({ title: "Name &  description required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.VFL.create({
        ...form,
        conducted_date: new Date(form.conducted_date).toISOString(),
        status: "open",
      });
      toast({ title: "VFL recorded" });
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record VFL Observation</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <Field label="Conducted By *">
            <Input
              value={form.conducted_by}
              onChange={(e) => set("conducted_by", e.target.value)}
              placeholder="Safety Officer name"
            />
          </Field>
          <Field label="Date & Time">
            <Input
              type="datetime-local"
              value={form.conducted_date}
              onChange={(e) => set("conducted_date", e.target.value)}
            />
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
          <Field label="Observation Type">
            <Select
              value={form.observation_type}
              onValueChange={(v) => set("observation_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VFL_TYPES).map(([k, t]) => (
                  <SelectItem key={k} value={k}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="col-span-2">
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Where was the observation made?"
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Description *">
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={2}
                placeholder="What did you observe?"
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Intervention / Action  Taken">
              <Textarea
                value={form.intervention}
                onChange={(e) => set("intervention", e.target.value)}
                rows={2}
                placeholder="What did you do about it?"
              />
            </Field>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-lg  bg-muted/50 px-3 py-2.5">
            <span className="text-sm font-medium">Follow-up required?</span>
            <Switch
              checked={form.follow_up_required}
              onCheckedChange={(v) => set("follow_up_required", v)}
            />
          </div>
          {form.follow_up_required && (
            <div className="col-span-2">
              <Field label="Follow-up Action">
                <Textarea
                  value={form.follow_up_action}
                  onChange={(e) => set("follow_up_action", e.target.value)}
                  rows={2}
                />
              </Field>
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
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {saving ? "Saving…" : "Record  VFL"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
