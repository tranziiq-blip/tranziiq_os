import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle } from "lucide-react";

const VAT_RATE = 15;
const DONE = ["load_completed", "delivered", "pod_captured", "completed"];
const RATE_LABEL = { per_ton: "/t", per_km: "/km", per_load: "/load" };
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const money = (n) =>
  "R " +
  Number(n || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const addDays = (iso, days) => {
  const d = new Date(iso || Date.now());
  d.setDate(d.getDate() + (Number(days) || 0));
  return d.toISOString().slice(0, 10);
};
const same = (a, b) =>
  (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

// Line amount from the agreed rate. Invoices are billed on OFFLOADED net tons.
function lineAmount(line) {
  const rate = Number(line.rate) || 0;
  if (line.rate_type === "per_ton") return round2(rate * (Number(line.tons) || 0));
  if (line.rate_type === "per_km") return round2(rate * (Number(line.distance_km) || 0));
  return round2(rate);
}

export default function InvoiceDialog({ open, onOpenChange, editing, nextNumber, onSaved }) {
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [loads, setLoads] = useState([]);
  const [charges, setCharges] = useState({});
  const [routes, setRoutes] = useState({});
  const [offloadTons, setOffloadTons] = useState({});
  const [showOpen, setShowOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [lines, setLines] = useState([]);

  // Load reference data each time the dialog opens
  useEffect(() => {
    if (!open) return;
    (async () => {
      const [dir, ls, ch, rts, wbs] = await Promise.all([
        base44.entities.BusinessDirectory.filter({ entity_type: "client" }, "name").catch(() => []),
        base44.entities.Load.list("-created_date").catch(() => []),
        base44.entities.LoadCharge.list().catch(() => []),
        base44.entities.Route.list().catch(() => []),
        base44.entities.Weighbill.list("-created_date").catch(() => []),
      ]);
      setClients(dir);
      setLoads(ls);
      setCharges(Object.fromEntries(ch.map((c) => [c.load_id, c])));
      setRoutes(Object.fromEntries(rts.map((r) => [r.id, r])));
      // Offloaded net tons from the offloading weighbill, if captured
      const off = {};
      wbs.forEach((w) => {
        if (!w.load_id || off[w.load_id] != null) return;
        if (/off/i.test(w.weighbill_type || "")) {
          off[w.load_id] = w.net_weight_tons ?? (w.net_weight ? w.net_weight / 1000 : null);
        }
      });
      setOffloadTons(off);
    })();
    const today = new Date().toISOString().slice(0, 10);
    if (editing) {
      setForm({ ...editing, due_date: editing.due_date || "" });
      setLines(Array.isArray(editing.line_items) ? editing.line_items : []);
    } else {
      setForm({
        invoice_number: nextNumber,
        client: "",
        client_directory_id: "",
        client_details: null,
        invoice_date: today,
        due_date: addDays(today, 30),
        notes: "",
        status: "invoiced",
      });
      setLines([]);
    }
    setShowOpen(false);
  }, [open, editing, nextNumber]);

  const client = clients.find((c) => c.id === form.client_directory_id);

  const pickClient = (id) => {
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setForm((f) => ({
      ...f,
      client_directory_id: c.id,
      client: c.name,
      client_details: {
        name: c.name,
        contact_person: c.contact_person || "",
        email: c.email || "",
        phone: c.phone || "",
        address: [c.address, c.city].filter(Boolean).join(", "),
        vat_number: c.vat_number || "",
        registration_number: c.registration_number || "",
      },
      due_date: addDays(f.invoice_date, c.payment_terms_days ?? 30),
    }));
    setLines([]);
  };

  // This client's loads that are not on another invoice
  const available = useMemo(() => {
    if (!form.client) return [];
    return loads.filter(
      (l) =>
        same(l.client, form.client) &&
        (!l.invoice_id || l.invoice_id === editing?.id) &&
        (showOpen || DONE.includes(l.status) || lines.some((x) => x.load_id === l.id)),
    );
  }, [loads, form.client, showOpen, editing, lines]);

  const makeLine = (l) => {
    const ch = charges[l.id] || {};
    const route = routes[l.route_id] || routes[ch.route_id] || {};
    const tons =
      l.offloaded_weight_tons ?? offloadTons[l.id] ?? null;
    const line = {
      load_id: l.id,
      load_number: l.load_number,
      date: l.delivery_date || l.pickup_date || (l.created_at || "").slice(0, 10),
      description: [l.origin, l.destination].filter(Boolean).join(" → ") || l.cargo_type || "Transport",
      truck_registration: l.truck_registration || "",
      tons: tons ?? "",
      tons_source: tons != null ? "offloaded" : "missing",
      rate_type: ch.rate_type || "per_ton",
      rate: ch.rate ?? "",
      distance_km: route.distance_km ?? "",
    };
    return { ...line, amount: lineAmount(line) };
  };

  const toggleLoad = (l) => {
    setLines((cur) =>
      cur.some((x) => x.load_id === l.id)
        ? cur.filter((x) => x.load_id !== l.id)
        : [...cur, makeLine(l)],
    );
  };

  const editLine = (loadId, patch) =>
    setLines((cur) =>
      cur.map((x) => {
        if (x.load_id !== loadId) return x;
        const next = { ...x, ...patch };
        return { ...next, amount: lineAmount(next) };
      }),
    );

  const subtotal = round2(lines.reduce((s, x) => s + (Number(x.amount) || 0), 0));
  const vat = round2((subtotal * VAT_RATE) / 100);
  const total = round2(subtotal + vat);
  const missingTons = lines.filter((x) => x.rate_type === "per_ton" && !(Number(x.tons) > 0));
  const missingRate = lines.filter((x) => !(Number(x.rate) > 0));

  const save = async () => {
    if (!form.invoice_number || !form.client) {
      toast({ title: "Invoice number and client are required", variant: "destructive" });
      return;
    }
    if (!lines.length) {
      toast({ title: "Select at least one load to invoice", variant: "destructive" });
      return;
    }
    if (missingTons.length || missingRate.length) {
      toast({
        title: "Some loads are incomplete",
        description: "Enter the offloaded tons and rate for every selected load.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const cleanLines = lines.map((x) => ({
        ...x,
        tons: x.tons === "" ? null : Number(x.tons),
        rate: Number(x.rate),
        amount: Number(x.amount),
      }));
      const data = {
        invoice_number: form.invoice_number,
        client: form.client,
        client_directory_id: form.client_directory_id || null,
        client_details: form.client_details || null,
        invoice_date: form.invoice_date,
        due_date: form.due_date || null,
        notes: form.notes || "",
        status: form.status || "invoiced",
        load_ids: cleanLines.map((x) => x.load_id),
        line_items: cleanLines,
        load_id: cleanLines[0]?.load_id || null,
        load_number: cleanLines.map((x) => x.load_number).join(", "),
        truck_registration: [...new Set(cleanLines.map((x) => x.truck_registration).filter(Boolean))].join(", "),
        amount: subtotal,
        vat_rate: VAT_RATE,
        vat_amount: vat,
        total_amount: total,
      };
      if (editing) await base44.entities.Invoice.update(editing.id, data);
      else await base44.entities.Invoice.create(data);
      toast({ title: editing ? "Invoice updated" : "Invoice created", description: `${money(total)} incl. VAT` });
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast({ title: "Could not save invoice", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Invoice" : "New Invoice"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Invoice number</Label>
            <Input value={form.invoice_number || ""} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Client</Label>
            <Select value={form.client_directory_id || ""} onValueChange={pickClient}>
              <SelectTrigger>
                <SelectValue placeholder={form.client || "Choose client"} />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No clients yet. Add them under Admin → Directory.
                  </div>
                )}
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Invoice date</Label>
            <Input
              type="date"
              value={form.invoice_date || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  invoice_date: e.target.value,
                  due_date: addDays(e.target.value, client?.payment_terms_days ?? 30),
                })
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">
              Due date{client ? ` (${client.payment_terms_days ?? 30} days)` : ""}
            </Label>
            <Input type="date" value={form.due_date || ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
        </div>

        {form.client_details && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed">
            <p className="font-semibold text-brand-navy">Bill to: {form.client_details.name}</p>
            {form.client_details.address && <p>{form.client_details.address}</p>}
            <p className="text-muted-foreground">
              {[
                form.client_details.contact_person,
                form.client_details.email,
                form.client_details.phone,
              ].filter(Boolean).join(" · ")}
            </p>
            <p className="text-muted-foreground">
              {form.client_details.vat_number ? `VAT no. ${form.client_details.vat_number}` : "No VAT number on file"}
              {form.client_details.registration_number ? ` · Reg. ${form.client_details.registration_number}` : ""}
            </p>
          </div>
        )}

        {form.client && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Loads to invoice ({lines.length} selected)
              </p>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" checked={showOpen} onChange={(e) => setShowOpen(e.target.checked)} />
                Include loads not yet completed
              </label>
            </div>
            {available.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                No completed, uninvoiced loads for {form.client}.
              </p>
            ) : (
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-border/60 p-2">
                {available.map((l) => {
                  const on = lines.some((x) => x.load_id === l.id);
                  return (
                    <label key={l.id} className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm ${on ? "bg-brand-teal/10" : "hover:bg-muted/50"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleLoad(l)} />
                      <span className="font-medium">{l.load_number}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[l.origin, l.destination].filter(Boolean).join(" → ")}
                        {!DONE.includes(l.status) ? ` · ${String(l.status || "").replace(/_/g, " ")}` : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {lines.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="py-1.5 pr-2">Load</th>
                  <th className="py-1.5 pr-2">Route</th>
                  <th className="py-1.5 pr-2 text-right">Offloaded tons</th>
                  <th className="py-1.5 pr-2 text-right">Rate (R)</th>
                  <th className="py-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((x) => (
                  <tr key={x.load_id} className="border-b border-border/40 align-middle">
                    <td className="py-1.5 pr-2 font-medium">{x.load_number}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{x.description}</td>
                    <td className="py-1.5 pr-2 text-right">
                      <Input
                        type="number"
                        className={`ml-auto h-8 w-24 text-right ${x.rate_type === "per_ton" && !(Number(x.tons) > 0) ? "border-amber-400" : ""}`}
                        value={x.tons}
                        onChange={(e) => editLine(x.load_id, { tons: e.target.value, tons_source: "manual" })}
                      />
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          className={`h-8 w-24 text-right ${!(Number(x.rate) > 0) ? "border-amber-400" : ""}`}
                          value={x.rate}
                          onChange={(e) => editLine(x.load_id, { rate: e.target.value })}
                        />
                        <span className="w-9 text-left text-muted-foreground">{RATE_LABEL[x.rate_type]}</span>
                      </div>
                    </td>
                    <td className="py-1.5 text-right font-semibold">{money(x.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(missingTons.length > 0 || missingRate.length > 0) && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                <AlertTriangle size={14} />
                {missingTons.length > 0 && `${missingTons.length} load(s) have no offloaded weight captured. `}
                {missingRate.length > 0 && `${missingRate.length} load(s) have no rate (no route rate set).`}
              </p>
            )}
          </div>
        )}

        <div className="ml-auto w-full max-w-xs space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">VAT ({VAT_RATE}%)</span><span>{money(vat)}</span></div>
          <div className="flex justify-between border-t border-border/60 pt-1 font-bold text-brand-navy"><span>Total</span><span>{money(total)}</span></div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs">Notes</Label>
          <Textarea rows={2} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-brand-navy hover:bg-brand-navy/90">
            {saving ? "Saving…" : editing ? "Save invoice" : "Create invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
