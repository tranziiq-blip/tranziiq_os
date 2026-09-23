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
import { LEAVE_TYPES, LEAVE_STATUS } from "@/lib/hrConstants";

const empty = {
  employee_id: "",
  leave_type: "annual",
  start_date: "",
  end_date: "",
  days_requested: 1,
  reason: "",
  status: "pending",
  approved_by: "",
  notes: "",
};

export default function LeaveDialog({
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
    if (!form.employee_id || !form.start_date || !form.end_date) {
      toast({ title: "Employee & dates required", variant: "destructive" });
      return;
    }
    const emp = employees.find((e) => e.id === form.employee_id);
    const days = Math.max(
      1,
      Math.ceil(
        (new Date(form.end_date) - new Date(form.start_date)) / 86400000,
      ) + 1,
    );
    setSaving(true);
    try {
      await base44.entities.LeaveApplication.create({
        ...form,
        days_requested: days,
        employee_name: emp?.full_name || "",
        employee_number: emp?.employee_number || "",
        department: emp?.department || "",
      });
      toast({ title: "Leave application recorded" });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, children, full }) => (
    <div className={full ? "col-span-2  grid gap-1.5" : "grid gap-1.5"}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Leave Application</DialogTitle>
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
          <F label="Leave Type">
            <Select
              value={form.leave_type}
              onValueChange={(v) => set("leave_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAVE_STATUS).map(([k, s]) => (
                  <SelectItem key={k} value={k}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Start Date *">
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => set("start_date", e.target.value)}
            />
          </F>
          <F label="End Date *">
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => set("end_date", e.target.value)}
            />
          </F>
          <F label="Approved By">
            <Input
              value={form.approved_by}
              onChange={(e) => set("approved_by", e.target.value)}
              placeholder="Manager name"
            />
          </F>
          <div className="col-span-2" />
          <F label="Reason" full>
            <Textarea
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              rows={2}
            />
          </F>
          <F label="Notes" full>
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
            {saving ? "Saving…" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
