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
import { DISCIPLINARY_TYPES } from "@/lib/hrConstants";

const empty = {
  employee_id: "",
  incident_date: new Date().toISOString().slice(0, 10),
  action_type: "verbal_warning",
  description: "",
  outcome: "",
  conducted_by: "",
  hearing_date: "",
  status: "open",
  notes: "",
};

// Defined outside the form so inputs keep focus while typing
const F = ({ label, children, full }) => (
  <div className={full ? "col-span-2  grid gap-1.5" : "grid gap-1.5"}>
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

export default function DisciplinaryDialog({
  open,
  onOpenChange,
  employees,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const save = async () => {
    if (!form.employee_id || !form.description) {
      toast({
        title: "Employee &  description required",
        variant: "destructive",
      });
      return;
    }
    const emp = employees.find((e) => e.id === form.employee_id);
    setSaving(true);
    try {
      await base44.entities.DisciplinaryAction.create({
        ...form,
        employee_name: emp?.full_name || "",
        employee_number: emp?.employee_number || "",
        department: emp?.department || "",
      });
      toast({ title: "Disciplinary action recorded" });
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
          <DialogTitle>Record Disciplinary Action</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <F label="Employee *" full>
            <Select
              value={form.employee_id}
              onValueChange={(v) => set("employee_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name} —{e.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Action Type">
            <Select
              value={form.action_type}
              onValueChange={(v) => set("action_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DISCIPLINARY_TYPES).map(([k, t]) => (
                  <SelectItem key={k} value={k}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Incident Date *">
            <Input
              type="date"
              value={form.incident_date}
              onChange={(e) => set("incident_date", e.target.value)}
            />
          </F>
          <F label="Conducted By">
            <Input
              value={form.conducted_by}
              onChange={(e) => set("conducted_by", e.target.value)}
              placeholder="Chairperson / Manager"
            />
          </F>
          <F label="Hearing Date">
            <Input
              type="date"
              value={form.hearing_date}
              onChange={(e) => set("hearing_date", e.target.value)}
            />
          </F>
          <F label="Description *" full>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="What  happened?"
            />
          </F>
          <F label="Outcome" full>
            <Textarea
              value={form.outcome}
              onChange={(e) => set("outcome", e.target.value)}
              rows={2}
              placeholder="What was the outcome /  decision?"
            />
          </F>
          <F label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Notes">
            <Input
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </F>
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
            {saving ? "Saving…" : "Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
