import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Truck as TruckIcon,
  Package as TrailerIcon,
} from "lucide-react";
import {
  FLEET_TYPES,
  fleetTypeMeta,
  COMBINATION_TYPES,
  combinationMeta,
  DIFF_TYPES,
  diffTypeMeta,
  TRAILER_TYPES,
  trailerTypeMeta,
  TYRE_TYPES,
  tyreTypeMeta,
} from "@/lib/fleetTypes";
import TruckFormDialog from "@/components/fleet/TruckFormDialog";
import TrailerFormDialog from "@/components/fleet/TrailerFormDialog";
import ExpiryBadge from "@/components/fleet/ExpiryBadge";

export default function Fleet() {
  const { toast } = useToast();
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [truckDialog, setTruckDialog] = useState(false);
  const [trailerDialog, setTrailerDialog] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [editingTrailer, setEditingTrailer] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [t, tr] = await Promise.all([
        base44.entities.Truck.list("-created_date"),
        base44.entities.Trailer.list("-created_date"),
      ]);
      setTrucks(t);
      setTrailers(tr);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const openNewTruck = () => {
    setEditingTruck(null);
    setTruckDialog(true);
  };
  const openEditTruck = (t) => {
    setEditingTruck(t);
    setTruckDialog(true);
  };
  const saveTruck = async (payload) => {
    try {
      if (editingTruck)
        await base44.entities.Truck.update(editingTruck.id, payload);
      else await base44.entities.Truck.create(payload);
      toast({ title: editingTruck ? "Truck updated" : "Truck added" });
      setTruckDialog(false);
      load();
    } catch (e) {
      toast({
        title: "Error saving",
        description: e.message,
        variant: "destructive",
      });
    }
  };
  const removeTruck = async (t) => {
    await base44.entities.Truck.delete(t.id);
    toast({ title: "Truck removed" });
    load();
  };

  const openNewTrailer = () => {
    setEditingTrailer(null);
    setTrailerDialog(true);
  };
  const openEditTrailer = (t) => {
    setEditingTrailer(t);
    setTrailerDialog(true);
  };
  const saveTrailer = async (payload) => {
    try {
      if (editingTrailer)
        await base44.entities.Trailer.update(editingTrailer.id, payload);
      else await base44.entities.Trailer.create(payload);
      toast({ title: editingTrailer ? "Trailer updated" : "Trailer added" });
      setTrailerDialog(false);
      load();
    } catch (e) {
      toast({
        title: "Error saving",
        description: e.message,
        variant: "destructive",
      });
    }
  };
  const removeTrailer = async (t) => {
    await base44.entities.Trailer.delete(t.id);
    toast({ title: "Trailer removed" });
    load();
  };

  const truckMeta = (id) => trucks.find((t) => t.id === id);
  const trailerMeta = (id) => trailers.find((t) => t.id === id);
  const filtered =
    filter === "all" ? trucks : trucks.filter((t) => t.fleet_type === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Fleet Register
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete truck & trailer records with compliance tracking
          </p>
        </div>
      </div>

      <Tabs defaultValue="trucks">
        <TabsList>
          <TabsTrigger value="trucks" className="gap-1.5">
            <TruckIcon size={14} />
            Trucks ({trucks.length})
          </TabsTrigger>
          <TabsTrigger value="trailers" className="gap-1.5">
            <TrailerIcon size={14} />
            Trailers ({trailers.length})
          </TabsTrigger>
        </TabsList>

        {/* TRUCKS TAB */}
        <TabsContent value="trucks" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-full px-3 py-1.5 
text-xs font-medium transition ${
                  filter === "all"
                    ? "bg-brand-navy text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                All ({trucks.length})
              </button>
              {FLEET_TYPES.map((f) => {
                const count = trucks.filter(
                  (t) => t.fleet_type === f.key,
                ).length;
                if (!count) return null;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      filter === f.key
                        ? "bg-brand-navy text-white"
                        : "bg-muted text-muted-foreground  hover:bg-muted/70"
                    }`}
                  >
                    {f.label} ({count})
                  </button>
                );
              })}
            </div>
            <Button
              onClick={openNewTruck}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Add Truck
            </Button>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration</TableHead>
                      <TableHead>Fleet Type</TableHead>
                      <TableHead>Combination</TableHead>
                      <TableHead>Diff</TableHead>
                      <TableHead>Make / Model</TableHead>
                      <TableHead>GVM / Tare</TableHead>
                      <TableHead>Odometer</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Op. License</TableHead>
                      <TableHead>COF</TableHead>
                      <TableHead>Trailer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell
                          colSpan={13}
                          className="text-center  text-muted-foreground py-8"
                        >
                          Loading fleet…
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={13}
                          className="text-center text-muted-foreground py-8"
                        >
                          No trucks found.
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered.map((t) => {
                      const meta = fleetTypeMeta(t.fleet_type);
                      const combo = combinationMeta(t.combination_type);
                      const diff = diffTypeMeta(t.diff_type);
                      const tr = trailerMeta(t.trailer_id);
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-semibold  text-brand-navy">
                            {t.registration_number}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full 
border px-2 py-0.5 text-xs font-medium ${meta.color}`}
                            >
                              <span
                                className={`h-1.5 
w-1.5 rounded-full ${meta.dot}`}
                              />
                              {meta.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {combo.label}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {diff.label}
                          </TableCell>
                          <TableCell className="text-xs">
                            {t.make_model || "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div>
                              {t.gvm
                                ? `${Number(t.gvm).toLocaleString()} kg`
                                : "—"}
                            </div>
                            <div className="text-muted-foreground">
                              {t.tare
                                ? `${Number(t.tare).toLocaleString()} 
kg`
                                : ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {t.current_odometer
                              ? `${Number(t.current_odometer).toLocaleString()} km`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <ExpiryBadge date={t.license_expiry} />
                          </TableCell>
                          <TableCell>
                            <ExpiryBadge date={t.operator_license_expiry} />
                          </TableCell>
                          <TableCell>
                            <ExpiryBadge date={t.cof_expiry} />
                          </TableCell>
                          <TableCell className="text-xs">
                            {tr ? tr.registration_number : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                t.status === "active"
                                  ? "default"
                                  : t.status === "maintenance"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditTruck(t)}
                                className="rounded-md p-2  text-muted-foreground hover:bg-muted hover:text-brand-navy"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => removeTruck(t)}
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
        </TabsContent>

        {/* TRAILERS TAB */}
        <TabsContent value="trailers" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button
              onClick={openNewTrailer}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Add Trailer
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration</TableHead>
                      <TableHead>Trailer Type</TableHead>
                      <TableHead>Axles</TableHead>
                      <TableHead>Tyre Type</TableHead>
                      <TableHead>Make / Model</TableHead>
                      <TableHead>GVM / Tare</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>COF</TableHead>
                      <TableHead>Assigned Truck</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="text-center  text-muted-foreground py-8"
                        >
                          Loading trailers…
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && trailers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="text-center text-muted-foreground py-8"
                        >
                          No trailers found.
                        </TableCell>
                      </TableRow>
                    )}
                    {trailers.map((t) => {
                      const meta = trailerTypeMeta(t.trailer_type);
                      const tyre = tyreTypeMeta(t.tyre_type);
                      const truck = truckMeta(t.assigned_truck_id);
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-semibold  text-brand-navy">
                            {t.registration_number}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 
text-xs font-medium ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {t.number_of_axles || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {tyre.label}
                          </TableCell>
                          <TableCell className="text-xs">
                            {t.make_model || "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div>
                              {t.gvm
                                ? `${Number(t.gvm).toLocaleString()} kg`
                                : "—"}
                            </div>
                            <div className="text-muted-foreground">
                              {t.tare
                                ? `${Number(t.tare).toLocaleString()} 
kg`
                                : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <ExpiryBadge date={t.license_expiry} />
                          </TableCell>
                          <TableCell>
                            <ExpiryBadge date={t.cof_expiry} />
                          </TableCell>
                          <TableCell className="text-xs">
                            {truck ? truck.registration_number : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                t.status === "active"
                                  ? "default"
                                  : t.status === "maintenance"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditTrailer(t)}
                                className="rounded-md p-2  text-muted-foreground hover:bg-muted hover:text-brand-navy"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => removeTrailer(t)}
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
        </TabsContent>
      </Tabs>

      <TruckFormDialog
        open={truckDialog}
        onOpenChange={setTruckDialog}
        editing={editingTruck}
        trailers={trailers.filter((t) => t.status === "active")}
        onSaved={saveTruck}
      />
      <TrailerFormDialog
        open={trailerDialog}
        onOpenChange={setTrailerDialog}
        editing={editingTrailer}
        trucks={trucks.filter((t) => t.status === "active")}
        onSaved={saveTrailer}
      />
    </div>
  );
}
