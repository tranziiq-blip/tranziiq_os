import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import TyreDialog from "@/components/engineering/TyreDialog";
import {
  CircleDot,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Warehouse,
} from "lucide-react";

const CONDITION_COLORS = {
  new: "bg-emerald-100 text-emerald-700",
  good: "bg-emerald-100 text-emerald-700",
  worn: "bg-amber-100 text-amber-700",
  damaged: "bg-rose-100 text-rose-700",
  punctured: "bg-rose-100 text-rose-700",
  retread: "bg-sky-100 text-sky-700",
  scrapped: "bg-zinc-200 text-zinc-600",
};

export default function TyreManagementTab({
  trucks,
  trailers,
  tyres,
  onDataChanged,
}) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(null);

  const fitted = tyres.filter((t) => t.status === "fitted");
  const alerts = fitted.filter(
    (t) =>
      ["worn", "damaged", "punctured"].includes(t.condition) ||
      (t.tread_depth_mm > 0 && t.tread_depth_mm < 4),
  );
  const avgTread = fitted.filter((t) => t.tread_depth_mm > 0).length
    ? (
        fitted
          .filter((t) => t.tread_depth_mm > 0)
          .reduce((s, t) => s + t.tread_depth_mm, 0) /
        fitted.filter((t) => t.tread_depth_mm > 0).length
      ).toFixed(1)
    : "—";
  const inStorage = tyres.filter(
    (t) => t.status === "in_storage" || t.status === "spare",
  ).length;

  const totalPositions = [...trucks, ...trailers].reduce(
    (s, a) => s + (a.tyre_positions?.length || 0),
    0,
  );

  const remove = async (tyre) => {
    setBusy(tyre.id);
    try {
      await base44.entities.Tyre.delete(tyre.id);
      toast({ title: "Tyre record deleted" });
      onDataChanged?.();
    } catch (e) {
      toast({
        title: "Error deleting",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Positions Registered
              </p>
              <CircleDot size={16} className="text-brand-teal" />
            </div>
            <p className="mt-1 font-display  text-2xl font-bold text-brand-navy">
              {totalPositions}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Tyres Fitted</p>
              <CircleDot size={16} className="text-brand-blue" />
            </div>
            <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
              {fitted.length}
            </p>
          </CardContent>
        </Card>
        <Card
          className={`border shadow-sm ${
            alerts.length > 0 ? "border-rose-200" : "border-border/60"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex  items-center justify-between">
              <p className="text-xs  text-muted-foreground">Alerts</p>
              <AlertTriangle
                size={16}
                className={
                  alerts.length > 0 ? "text-rose-500" : "text-muted-foreground"
                }
              />
            </div>
            <p
              className={`mt-1 font-display text-2xl font-bold ${
                alerts.length > 0 ? "text-rose-600" : "text-brand-navy"
              }`}
            >
              {alerts.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Avg Tread</p>
              <Warehouse size={16} className="text-amber-500" />
            </div>
            <p className="mt-1 font-display text-2xl  font-bold text-brand-navy">
              {avgTread}
              {avgTread !== "—" ? " mm" : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {inStorage} spare / storage
            </p>
          </CardContent>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="space-y-1.5 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold  text-rose-800">
              <AlertTriangle size={14} /> Tyres Requiring Attention
            </p>
            {alerts.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg  border border-rose-200 bg-white px-3 py-2 text-xs"
              >
                <span>
                  <strong>{t.asset_registration}</strong> · {t.position_name}
                </span>
                <Badge className={CONDITION_COLORS[t.condition] || "bg-muted"}>
                  {t.condition}
                  {t.tread_depth_mm > 0 && t.tread_depth_mm < 4
                    ? ` · 
${t.tread_depth_mm}mm`
                    : ""}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
        >
          <Plus size={16} /> Add Tyre Record
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0  overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Tread (mm)</TableHead>
                <TableHead>Pressure (bar)</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tyres.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground py-8"
                  >
                    No tyre records yet. Add records per position to track
                    tread, pressure and condition.
                  </TableCell>
                </TableRow>
              )}
              {tyres.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-brand-navy  text-sm">
                    {t.asset_registration || "—"}
                  </TableCell>
                  <TableCell className="text-xs">{t.position_name}</TableCell>
                  <TableCell className="text-xs">
                    {t.brand || "—"}
                    {t.size ? (
                      <span className="block text-muted-foreground">
                        {t.size}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs">
                    {t.serial_number || "—"}
                  </TableCell>
                  <TableCell
                    className={`text-xs font-medium tabular-nums ${
                      t.tread_depth_mm > 0 && t.tread_depth_mm < 4
                        ? "text-rose-600"
                        : ""
                    }`}
                  >
                    {t.tread_depth_mm || "—"}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {t.pressure_bar || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={CONDITION_COLORS[t.condition] || "bg-muted"}
                    >
                      {t.condition}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-[10px]  capitalize"
                    >
                      {(t.status || "").replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {t.last_checked_date
                      ? new Date(t.last_checked_date).toLocaleDateString(
                          "en-ZA",
                        )
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditing(t);
                          setDialogOpen(true);
                        }}
                        className="rounded-md p-1.5 text-brand-blue hover:bg-brand-blue/10"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(t)}
                        disabled={busy === t.id}
                        className="rounded-md p-1.5 text-rose-500 hover:bg-rose-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TyreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        trucks={trucks}
        trailers={trailers}
        onSaved={onDataChanged}
      />
    </div>
  );
}
