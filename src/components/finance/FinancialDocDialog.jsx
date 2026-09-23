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
import {
  FIN_DOC_TYPES,
  FIN_DOC_STATUS,
  VAT_RATE,
} from "@/lib/financeConstants";
import { Plus, Trash2 } from "lucide-react";

const empty = {
  document_number: "",
  document_type: "quote",
  client_supplier: "",
  document_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  status: "draft",
  notes: "",
  linked_load_number: "",
};

export default function FinancialDocDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [lineItems, setLineItems] = useState([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(empty);
      setLineItems([{ description: "", quantity: 1, unit_price: 0 }]);
    }
  }, [open]);
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const addItem = () =>
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unit_price: 0 },
    ]);
  const removeItem = (i) =>
    setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateItem = (i, f, v) =>
    setLineItems(
      lineItems.map((item, idx) =>
        idx === i
          ? { ...item, [f]: f === "description" ? v : Number(v) }
          : item,
      ),
    );

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = subtotal + vat;

  const save = async () => {
    if (!form.document_number || !form.client_supplier) {
      toast({ title: "Doc  number & client required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.FinancialDoc.create({
        ...form,
        line_items: lineItems,
        subtotal,
        vat_amount: vat,
        total_amount: total,
      });
      toast({ title: "Document created" });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Financial Document</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <F label="Document Number *">
            <Input
              value={form.document_number}
              onChange={(e) => set("document_number", e.target.value)}
              placeholder="QT-001 /  INV-001 / CN-001 / PO-001"
            />
          </F>
          <F label="Document Type">
            <Select
              value={form.document_type}
              onValueChange={(v) => set("document_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIN_DOC_TYPES).map(([k, t]) => (
                  <SelectItem key={k} value={k}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Client / Supplier *" full>
            <Input
              value={form.client_supplier}
              onChange={(e) => set("client_supplier", e.target.value)}
              placeholder="Client or  supplier name"
            />
          </F>
          <F label="Document Date">
            <Input
              type="date"
              value={form.document_date}
              onChange={(e) => set("document_date", e.target.value)}
            />
          </F>
          <F label="Due Date">
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => set("due_date", e.target.value)}
            />
          </F>
          <F label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIN_DOC_STATUS).map(([k, s]) => (
                  <SelectItem key={k} value={k}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Linked Load #">
            <Input
              value={form.linked_load_number}
              onChange={(e) => set("linked_load_number", e.target.value)}
            />
          </F>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold uppercase tracking-wider  text-muted-foreground">
              Line Items
            </Label>
            <Button
              size="sm"
              variant="outline"
              onClick={addItem}
              className="gap-1 h-7  text-xs"
            >
              <Plus size={12} /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {lineItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                  placeholder="Description"
                  className="flex-1 text-sm"
                />
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  className="w-16 text-sm"
                />
                <Input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateItem(i, "unit_price", e.target.value)}
                  className="w-24 text-sm"
                  placeholder="Unit  price"
                />
                <span className="w-20 text-right text-sm font-medium">
                  R {(item.quantity * item.unit_price).toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(i)}
                  className="text-rose-500  hover:bg-rose-50 rounded p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">R {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (15%)</span>
              <span className="font-medium">R {vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold  text-brand-navy">
              <span>Total</span>
              <span>R {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <F label="Notes" full>
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
          />
        </F>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {saving ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
