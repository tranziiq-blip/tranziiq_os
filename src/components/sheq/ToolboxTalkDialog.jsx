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
import { useToast } from "@/components/ui/use-toast";
import { DEPARTMENTS, TBT_STATUS } from "@/lib/sheqConstants";

const empty = {
  title: "",
  topic: "",
  department: "Transport",
  scheduled_date: "",
  conducted_by: "",
  duration_minutes: 15,
  attendees_count: 0,
  status: "planned",
  notes: "",
};

// Defined outside the form so inputs keep focus while typing
const Field = ({ label, children }) => (
  <div className="grid gap-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

export default function ToolboxTalkDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(editing ? { ...empty, ...editing } : empty);
  }, [open, editing]);
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const save = async () => {
    if (!form.title || !form.scheduled_date) {
      toast({ title: "Title & date  required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) await base44.entities.ToolboxTalk.update(editing.id, form);
      else await base44.entities.ToolboxTalk.create(form);
      toast({ title: editing ? "Talk updated" : "Toolbox talk planned" });
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
          <DialogTitle>
            {editing ? "Edit Toolbox Talk" : "Plan Toolbox  Talk"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="col-span-2">
            <Field label="Title *">
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Pre-trip  inspection refresher"
              />
            </Field>
          </div>
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
          <Field label="Scheduled Date *">
            <Input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => set("scheduled_date", e.target.value)}
            />
          </Field>
          <Field label="Conducted By">
            <Input
              value={form.conducted_by}
              onChange={(e) => set("conducted_by", e.target.value)}
              placeholder="Presenter name"
            />
          </Field>
          <Field label="Topic">
            <Input
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
              placeholder="Topic focus area"
            />
          </Field>
          <Field label="Duration (min)">
            <Input
              type="number"
              value={form.duration_minutes}
              onChange={(e) => set("duration_minutes", Number(e.target.value))}
            />
          </Field>
          <Field label="Attendees">
            <Input
              type="number"
              value={form.attendees_count}
              onChange={(e) => set("attendees_count", Number(e.target.value))}
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TBT_STATUS).map(([k, s]) => (
                  <SelectItem key={k} value={k}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="col-span-2">
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
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
            disabled={saving}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {saving ? "Saving…" : editing ? "Save" : "Plan Talk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
