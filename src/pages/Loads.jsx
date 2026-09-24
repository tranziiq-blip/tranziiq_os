import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Send } from "lucide-react";
import { loadStatusMeta } from "@/lib/fleetTypes";
import { PROFILE_TYPES } from "@/lib/complianceContent";
import { gateSummary } from "@/lib/complianceEngine";

const empty = {
  load_number: "",
  client: "",
  origin: "",
  destination: "",
  cargo_type: "",
  pickup_date: "",
  delivery_date: "",
  weight_tons: "",
  route_id: "",
  truck_id: "",
  driver_id: "",
  cross_border: false,
  border_post: "",
  freight_forwarder: "",
};

export default function Loads() {
  const { toast } = useToast();
  const [loads, setLoads] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [routes, setRoutes] = useState([]);
  const pickRoute = (id) => {
    const r = routes.find((x) => x.id === id);
    if (!r) return setForm((f) => ({ ...f, route_id: "" }));
    setForm((f) => ({
      ...f,
      route_id: r.id,
      client: r.client || f.client,
      origin: r.origin || f.origin,
      destination: r.destination || f.destination,
      cargo_type: r.cargo_type || f.cargo_type,
      cross_border: r.cross_border ?? f.cross_border,
      border_post: r.border_post || f.border_post,
    }));
  };
  const [form, setForm] = useState(empty);
  const [profiles, setProfiles] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [l, t, d, cps, rts] = await Promise.all([
        base44.entities.Load.list("-created_date"),
        base44.entities.Truck.filter({ status: "active" }),
        base44.entities.Driver.filter({ status: "active" }),
        base44.entities.ComplianceProfile.list("-created_date"),
        base44.entities.Route.filter({ active: true }, "name").catch(() => []),
      ]);
      setRoutes(rts);
      setLoads(l);
      setTrucks(t);
      setDrivers(d);
      setProfiles(cps);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (l) => {
    setEditing(l);
    setForm({ ...l, weight_tons: l.weight_tons ?? "", route_id: l.route_id || "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.load_number) {
      toast({ title: "Load number required", variant: "destructive" });
      return;
    }
    const { rate: _noRate, ...rest } = form; // rates never travel with a load
    const payload = {
      ...rest,
      route_id: form.route_id || null,
      weight_tons: form.weight_tons ? Number(form.weight_tons) : undefined,
    };
    if (!editing) payload.status = "accepting_load";
    try {
      if (editing) await base44.entities.Load.update(editing.id, payload);
      else await base44.entities.Load.create(payload);
      toast({ title: editing ? "Load updated" : "Load dispatched" });
      setOpen(false);
      load();
    } catch (e) {
      toast({
        title: "Error saving",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const remove = async (l) => {
    await base44.entities.Load.delete(l.id);
    toast({ title: "Load removed" });
    load();
  };

  const truckReg = (id) =>
    trucks.find((t) => t.id === id)?.registration_number || "—";
  const driverName = (id) => drivers.find((d) => d.id === id)?.full_name || "—";

  const loadsByTruck = loads.reduce((acc, l) => {
    if (l.truck_id) {
      acc[l.truck_id] = acc[l.truck_id] || [];
      acc[l.truck_id].push(l);
    }
    return acc;
  }, {});
  const multiLoadTrucks = Object.entries(loadsByTruck).filter(
    ([, ls]) => ls.length > 1,
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Dispatch
          </h1>
          <p className="text-sm text-muted-foreground">
            Assign trucks & drivers to loads — status tracked by driver app
          </p>
        </div>
        <Button
          onClick={openNew}
          className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
        >
          <Plus size={16} /> New Load
        </Button>
      </div>

      {multiLoadTrucks.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-brand-teal/10 px-4  py-2.5 text-sm text-brand-navy">
          <Send size={15} className="text-brand-teal" />
          <span className="font-medium">
            {multiLoadTrucks.length} truck(s) have multiple loads assigned —
            ideal for local multi-trip operations
          </span>
        </div>
      )}

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center  text-muted-foreground py-8"
                    >
                      Loading loads…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && loads.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-8"
                    >
                      No loads dispatched yet.
                    </TableCell>
                  </TableRow>
                )}
                {loads.map((l) => {
                  const meta = loadStatusMeta(l.status);
                  const truckLoads = l.truck_id
                    ? loadsByTruck[l.truck_id] || []
                    : [];
                  const loadIdx = truckLoads.findIndex((x) => x.id === l.id);
                  return (
                    <TableRow key={l.id}>
                      <TableCell>
                        <span className="font-semibold text-brand-navy">
                          {l.load_number}
                        </span>
                        {l.cross_border && (
                          <Badge className="ml-1.5 bg-amber-100 text-amber-700  text-[10px]">
                            Cross-Border
                          </Badge>
                        )}
                        {(() => {
                          const prof = profiles.find((p) => p.load_id === l.id);
                          if (!prof) return null;
                          const gate = gateSummary(prof);
                          return (
                            <Badge
                              className={`ml-1.5 text-[10px] ${gate.blocked ? "bg-rose-100  text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                            >
                              {PROFILE_TYPES[prof.profile_type]?.label ||
                                "Compliance"}{" "}
                              · {gate.blocked ? "Gate Blocked" : "Cleared"}
                            </Badge>
                          );
                        })()}
                        {truckLoads.length > 1 && (
                          <Badge
                            variant="secondary"
                            className="ml-1.5  text-[10px]"
                          >
                            #{loadIdx + 1} of {truckLoads.length}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{l.client || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.origin || "—"} →{l.destination || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {truckReg(l.truck_id)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {driverName(l.driver_id)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {l.cargo_type || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium 
${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {l.weight_tons ? `${l.weight_tons} t` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(l)}
                            className="rounded-md p-2  text-muted-foreground hover:bg-muted hover:text-brand-navy"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => remove(l)}
                            className="rounded-md p-2  text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Load" : "Dispatch New  Load"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="col-span-2 grid gap-1.5">
              <Label className="text-xs">Route</Label>
              <Select value={form.route_id || "none"} onValueChange={(v) => pickRoute(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No route (enter details manually)</SelectItem>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                      {r.client ? ` · ${r.client}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {routes.length
                  ? "Client, origin and destination fill in from the route. The agreed rate is applied automatically."
                  : "No routes yet. Routes and rates are set by the owner or operations manager under Admin → Directory."}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Load Number</Label>
              <Input
                value={form.load_number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    load_number: e.target.value,
                  })
                }
                placeholder="LD-2026-001"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Client</Label>
              <Input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Origin</Label>
              <Input
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Destination</Label>
              <Input
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
              />
            </div>
            <div className="grid gap-1.5 col-span-2">
              <Label className="text-xs">Truck Assignment</Label>
              <Select
                value={form.truck_id || "none"}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    truck_id: v === "none" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 col-span-2">
              <Label className="text-xs">Driver Assignment</Label>
              <Select
                value={form.driver_id || "none"}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    driver_id: v === "none" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Cargo Type</Label>
              <Input
                value={form.cargo_type}
                onChange={(e) =>
                  setForm({ ...form, cargo_type: e.target.value })
                }
                placeholder="Chrome ore"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Status</Label>
              <div className="flex h-9 items-center rounded-md border border-input  bg-muted/50 px-3 text-sm text-muted-foreground">
                {editing
                  ? `${loadStatusMeta(form.status).label} (driver updates via app)`
                  : "Accepting Load (driver updates via app)"}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Pickup Date</Label>
              <Input
                type="date"
                value={form.pickup_date}
                onChange={(e) =>
                  setForm({ ...form, pickup_date: e.target.value })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Delivery Date</Label>
              <Input
                type="date"
                value={form.delivery_date}
                onChange={(e) =>
                  setForm({ ...form, delivery_date: e.target.value })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Weight (tons)</Label>
              <Input
                type="number"
                value={form.weight_tons}
                onChange={(e) =>
                  setForm({ ...form, weight_tons: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border p-3">
            <input
              type="checkbox"
              id="cross_border"
              checked={form.cross_border || false}
              onChange={(e) =>
                setForm({ ...form, cross_border: e.target.checked })
              }
              className="h-4 w-4 rounded border-input"
            />
            <Label
              htmlFor="cross_border"
              className="text-xs font-medium  cursor-pointer"
            >
              Cross-Border Load (triggers freight clearance workflow)
            </Label>
          </div>
          {form.cross_border && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Border Post</Label>
                <Input
                  value={form.border_post || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      border_post: e.target.value,
                    })
                  }
                  placeholder="Beitbridge"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Freight Forwarder</Label>
                <Input
                  value={form.freight_forwarder || ""}
                  onChange={(e) =>
                    setForm({ ...form, freight_forwarder: e.target.value })
                  }
                  placeholder="Clearing  agent"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              className="bg-brand-navy  hover:bg-brand-navy/90"
            >
              {editing ? "Save Changes" : "Dispatch Load"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
