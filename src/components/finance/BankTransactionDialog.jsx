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

const empty = {
  transaction_date: new Date().toISOString().slice(0, 10),
  description: "",
  reference: "",
  amount: 0,
  transaction_type: "debit",
  category: "",
  bank_account: "",
  reconciled: false,
  notes: "",
};

// Defined outside the form so inputs keep focus while typing
const F = ({ label, children, full }) => (
  <div className={full ? "col-span-2  grid gap-1.5" : "grid gap-1.5"}>
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

export default function BankTransactionDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const save = async () => {
    if (!form.amount || !form.description) {
      toast({
        title: "Amount & description  required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.BankTransaction.create({
        ...form,
        amount: Number(form.amount) || 0,
      });
      toast({ title: "Transaction recorded" });
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
          <DialogTitle>Add Bank Transaction</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <F label="Transaction Date *">
            <Input
              type="date"
              value={form.transaction_date}
              onChange={(e) => set("transaction_date", e.target.value)}
            />
          </F>
          <F label="Type">
            <Select
              value={form.transaction_type}
              onValueChange={(v) => set("transaction_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">Debit (Outflow)</SelectItem>
                <SelectItem value="credit">Credit (Inflow)</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Amount (R) *">
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
            />
          </F>
          <F label="Bank Account">
            <Input
              value={form.bank_account}
              onChange={(e) => set("bank_account", e.target.value)}
              placeholder="Account name / number"
            />
          </F>
          <F label="Description *" full>
            <Input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Transaction description"
            />
          </F>
          <F label="Reference">
            <Input
              value={form.reference}
              onChange={(e) => set("reference", e.target.value)}
            />
          </F>
          <F label="Category">
            <Input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. Fuel, Salaries"
            />
          </F>
          <div className="col-span-2 flex items-center justify-between rounded-lg  bg-muted/50 px-3 py-2.5">
            <span className="text-sm  font-medium">Reconciled?</span>
            <Switch
              checked={form.reconciled}
              onCheckedChange={(v) => set("reconciled", v)}
            />
          </div>
          <F label="Notes" full>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
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
