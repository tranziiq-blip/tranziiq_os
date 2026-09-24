import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { canManageRoutes } from "@/lib/financeAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Route as RouteIcon } from "lucide-react";

const RATE_TYPES = {
  per_ton: "per ton",
  per_km: "per km",
  per_load: "per load",
};
const blank = {
  name: "",
  client_directory_id: "",
  client: "",
  origin: "",
  destination: "",
  distance_km: "",
  cargo_type: "",
  cross_border: false,
  border_post: "",
  active: true,
  rate_type: "per_ton",
  rate: "",
  effective_from: new Date().toISOString().slice(0, 10),
};
const rand = (n) => "R " + Number(n || 0).toLocaleString("en-ZA", { maximumFractionDigits: 2 });

// Routes are visible to dispatchers (no money). Rates are stored separately
// and only the owner, operations manager and finance can see them.
export default function RoutesRatesPanel({ clients = [] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const canEdit = canManageRoutes(user);
  const [routes, setRoutes] = useState([]);
  const [rates, setRates] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [r, rr] = await Promise.all([
      base44.entities.Route.list("name").catch(() => []),
      base44.entities.RouteRate.list("-effective_from").catch(() => []),
    ]);
    setRoutes(r);
    setRates(rr);
  };
  useEffect(() => {
    load();
  }, []);

  const currentRate = (routeId) => {
    const today = new Date().toISOString().slice(0, 10);
    return rates.find((x) => x.route_id === routeId && x.effective_from <= today) ||
      rates.find((x) => x.route_id === routeId);
  };

  const openNew = () => {
    setEditing(null);
    setForm(blank);
    setOpen(true);
  };
  const openEdit = (r) => {
    const cr = currentRate(r.id);
    setEditing(r);
    setForm({
      ...blank,
      ...r,
      distance_km: r.distance_km ?? "",
      rate_type: cr?.rate_type || "per_ton",
      rate: cr?.rate ?? "",
      effective_from: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.origin || !form.destination) {
      toast({ title: "Route name, origin and destination are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const routeBody = {
        name: form.name,
        client_directory_id: form.client_directory_id || null,
        client: form.client || null,
        origin: form.origin,
        destination: form.destination,
        distance_km: form.distance_km === "" ? null : Number(form.distance_km),
        cargo_type: form.cargo_type || null,
        cross_border: !!form.cross_border,
        border_post: form.border_post || null,
        active: form.active !== false,
      };
      const saved = editing
        ? await base44.entities.Route.update(editing.id, routeBody)
        : await base44.entities.Route.create(routeBody);
      const prev = editing ? currentRate(editing.id) : null;
      const rateChanged =
        form.rate !== "" &&
        (!prev || Number(prev.rate) !== Number(form.rate) || prev.rate_type !== form.rate_type);
      if (rateChanged) {
        // A new rate row keeps the history of what was charged when
        await base44.entities.RouteRate.create({
          route_id: saved.id,
          rate_type: form.rate_type,
          rate: Number(form.rate),
          effective_from: form.effective_from,
        });
      }
      toast({ title: editing ? "Route updated" : "Route added" });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: "Could not save route", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const pickClient = (id) => {
    const c = clients.find((x) => x.id === id);
    setForm((f) => ({ ...f, client_directory_id: c?.id || "", client: c?.name || "" }));
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <RouteIcon size={18} className="text-brand-teal" /> Routes &amp; Rates
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Dispatchers pick these routes when dispatching. They never see the rates.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openNew} className="gap-2 bg-brand-navy hover:bg-brand-navy/90">
            <Plus size={16} /> Add Route
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {routes.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No routes yet. Add your regular lanes with their agreed rates.
          </p>
        )}
        {routes.map((r) => {
          const cr = currentRate(r.id);
          return (
            <div
              key={r.id}
              className={`flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 ${r.active === false ? "opacity-60" : ""}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-navy">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.origin} → {r.destination}
                  {r.distance_km ? ` · ${r.distance_km} km` : ""}
                  {r.client ? ` · ${r.client}` : ""}
                  {r.active === false ? " · inactive" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-brand-navy">
                  {cr ? `${rand(cr.rate)} ${RATE_TYPES[cr.rate_type]}` : "No rate"}
                </span>
                {canEdit && (
                  <button
                    onClick={() => openEdit(r)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-brand-navy"
                    aria-label={`Edit ${r.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Route" : "Add Route"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="col-span-2 grid gap-1.5">
              <Label className="text-xs">Route name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mogalakwena to Polokwane Smelter"
              />
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label className="text-xs">Client</Label>
              <Select value={form.client_directory_id || "none"} onValueChange={(v) => pickClient(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Origin</Label>
              <Input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Destination</Label>
              <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Distance (km)</Label>
              <Input type="number" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Cargo type</Label>
              <Input value={form.cargo_type} onChange={(e) => setForm({ ...form, cargo_type: e.target.value })} />
            </div>
            <div className="col-span-2 flex items-center gap-2 rounded-lg border border-border p-3">
              <input
                type="checkbox"
                id="route_cross_border"
                checked={!!form.cross_border}
                onChange={(e) => setForm({ ...form, cross_border: e.target.checked })}
              />
              <Label htmlFor="route_cross_border" className="text-sm">Cross-border route</Label>
              {form.cross_border && (
                <Input
                  className="ml-auto h-8 max-w-[160px]"
                  placeholder="Border post"
                  value={form.border_post || ""}
                  onChange={(e) => setForm({ ...form, border_post: e.target.value })}
                />
              )}
            </div>
            <div className="col-span-2 mt-1 rounded-lg bg-muted/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rate (owner, operations and finance only)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Select value={form.rate_type} onValueChange={(v) => setForm({ ...form, rate_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_ton">Per ton</SelectItem>
                    <SelectItem value="per_km">Per km</SelectItem>
                    <SelectItem value="per_load">Per load</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Rate (R)"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                />
                <Input
                  type="date"
                  value={form.effective_from}
                  onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
                  aria-label="Rate effective from"
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Changing a rate keeps the old one on record. Loads dispatched on this
                route use the rate in effect on the day.
              </p>
            </div>
            {editing && (
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="route_active"
                  checked={form.active !== false}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                <Label htmlFor="route_active" className="text-sm">Active (shown to dispatchers)</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-brand-navy hover:bg-brand-navy/90">
              {saving ? "Saving…" : editing ? "Save" : "Add Route"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
