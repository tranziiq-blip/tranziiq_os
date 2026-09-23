import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import {
  Scale,
  Zap,
  Plus,
  FileText,
  Truck,
  MapPin,
  Package,
  Globe,
  Send,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const MANIFEST_STATUS_META = {
  pending_review: {
    label: "Pending Review",
    color: "bg-amber-100  text-amber-700",
    icon: Clock,
  },
  documents_submitted: {
    label: "Documents Submitted",
    color: "bg-sky-100  text-sky-700",
    icon: FileText,
  },
  in_process: {
    label: "In Process",
    color: "bg-indigo-100 text-indigo-700",
    icon: Clock,
  },
  cleared: {
    label: "Cleared",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  held: {
    label: "Held",
    color: "bg-rose-100 text-rose-700",
    icon: AlertTriangle,
  },
};

export default function Weighbill() {
  const { user, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [trucks, setTrucks] = useState([]);
  const [weighbills, setWeighbills] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    ticket_number: "",
    truck_id: "",
    commodity: "",
    gross_weight: "",
    tare_weight: "",
    supplier: "",
    destination: "",
    cargo_type: "",
  });
  const [saving, setSaving] = useState(false);
  const [selectedManifest, setSelectedManifest] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: "", notes: "" });
  const [updating, setUpdating] = useState(false);

  const isClearingAgent = user?.role === "clearing_agent";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isClearingAgent) {
        const mf = await base44.entities.TransportManifest.list("-compiled_at");
        setManifests(mf);
      } else {
        const [t, w, mf] = await Promise.all([
          base44.entities.Truck.filter({ status: "active" }),
          base44.entities.Weighbill.list("-created_date"),
          base44.entities.TransportManifest.list("-compiled_at").catch(
            () => [],
          ),
        ]);
        setTrucks(t);
        setWeighbills(w);
        setManifests(mf);
      }
    } finally {
      setLoading(false);
    }
  }, [isClearingAgent]);

  useEffect(() => {
    if (!isLoadingAuth) load();
  }, [isLoadingAuth, load]);

  // Weighbill capture (admin/user only)
  const netWeight =
    (Number(form.gross_weight) || 0) - (Number(form.tare_weight) || 0);
  const truck = trucks.find((t) => t.id === form.truck_id);

  const submit = async () => {
    if (!form.ticket_number || !form.truck_id || !form.gross_weight) {
      toast({
        title: "Ticket #, truck & gross weight required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const loadNumber = `LD-WB-${Date.now().toString().slice(-6)}`;
      const newLoad = await base44.entities.Load.create({
        load_number: loadNumber,
        client: form.supplier || "Weighbill Import",
        origin: form.supplier || "",
        destination: form.destination || "",
        status: "loaded",
        truck_id: form.truck_id,
        cargo_type: form.cargo_type || form.commodity,
        pickup_date: today,
        weight_tons: Math.max(netWeight / 1000, 0),
      });
      await base44.entities.Weighbill.create({
        ticket_number: form.ticket_number,
        truck_id: form.truck_id,
        truck_registration: truck?.registration_number,
        commodity: form.commodity,
        gross_weight: Number(form.gross_weight),
        tare_weight: Number(form.tare_weight) || 0,
        net_weight: netWeight,
        supplier: form.supplier,
        destination: form.destination,
        cargo_type: form.cargo_type,
        log_date: today,
        load_id: newLoad.id,
      });
      toast({ title: `Weighbill captured — load ${loadNumber} auto-created` });
      setForm({
        ticket_number: "",
        truck_id: "",
        commodity: "",
        gross_weight: "",
        tare_weight: "",
        supplier: "",
        destination: "",
        cargo_type: "",
      });
      load();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Manifest status update (clearing agent)
  const openManifest = (m) => {
    setSelectedManifest(m);
    setStatusForm({
      status: m.manifest_status || "pending_review",
      notes: m.clearing_agent_notes || "",
    });
  };

  const updateManifestStatus = async () => {
    setUpdating(true);
    try {
      const res = await base44.functions.invoke("notifyCustomsStatus", {
        manifest_id: selectedManifest.id,
        new_status: statusForm.status,
        load_number: selectedManifest.load_number,
        client: selectedManifest.client,
        border_post: selectedManifest.border_post,
        destination: selectedManifest.destination,
        notes: statusForm.notes,
      });
      toast({
        title: "Status updated & controllers notified",
        description: `${res.data?.notified || 0} controller(s) notified via email`,
      });
      setSelectedManifest(null);
      load();
    } catch (e) {
      toast({
        title: "Error updating status",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-muted border-t-brand-teal rounded-full  animate-spin" />
      </div>
    );
  }

  // ===== CLEARING AGENT VIEW: Freight Clearance Portal =====
  if (isClearingAgent) {
    const pending = manifests.filter(
      (m) => m.manifest_status === "pending_review",
    );
    const inProcess = manifests.filter((m) =>
      ["documents_submitted", "in_process"].includes(m.manifest_status),
    );
    const cleared = manifests.filter((m) => m.manifest_status === "cleared");
    const held = manifests.filter((m) => m.manifest_status === "held");

    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Freight Clearance Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Transport manifests for cross-border loads · update customs status
          </p>
        </div>

        <Card className="border-brand-teal/30 bg-brand-teal/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Globe className="mt-0.5 text-brand-teal" size={20} />
            <div>
              <p className="text-sm font-semibold text-brand-navy">
                How it works
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                When a driver uploads a weighbill for a cross-border load, a
                transport manifest is automatically compiled here. Review the
                manifest, process the customs documents, and update the status —
                the driver and operations controller will be automatically
                notified.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status summary */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Pending Review
                </p>
                <Clock className="text-amber-500" size={18} />
              </div>
              <p className="mt-2 font-display  text-3xl font-bold text-brand-navy">
                {pending.length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  In Process
                </p>
                <FileText className="text-indigo-500" size={18} />
              </div>
              <p className="mt-2 font-display  text-3xl font-bold text-brand-navy">
                {inProcess.length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Cleared
                </p>
                <CheckCircle2 className="text-emerald-500" size={18} />
              </div>
              <p className="mt-2 font-display  text-3xl font-bold text-brand-navy">
                {cleared.length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-rose-200 bg-rose-50/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Held
                </p>
                <AlertTriangle className="text-rose-500" size={18} />
              </div>
              <p className="mt-2 font-display  text-3xl font-bold text-brand-navy">
                {held.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Manifest list */}
        <div className="space-y-3">
          {loading && (
            <p className="text-center text-muted-foreground py-8">
              Loading manifests…
            </p>
          )}
          {!loading && manifests.length === 0 && (
            <Card className="border-dashed  border-border/60">
              <CardContent className="flex flex-col items-center  justify-center gap-3 py-16">
                <Globe className="text-muted-foreground/40" size={32} />
                <p className="text-sm font-medium text-muted-foreground">
                  No transport manifests yet
                </p>
                <p className="text-xs  text-muted-foreground">
                  Manifests appear here automatically when drivers upload
                  weighbills for cross-border loads.
                </p>
              </CardContent>
            </Card>
          )}
          {manifests.map((m) => {
            const meta =
              MANIFEST_STATUS_META[m.manifest_status] ||
              MANIFEST_STATUS_META.pending_review;
            return (
              <Card
                key={m.id}
                className={`border-border/60 shadow-sm hover:shadow-md 
transition-shadow cursor-pointer ${
                  m.manifest_status === "held"
                    ? "border-rose-200"
                    : m.manifest_status === "cleared"
                      ? "border-emerald-200"
                      : ""
                }`}
                onClick={() => openManifest(m)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-bold  text-brand-navy">
                          {m.manifest_number}
                        </p>
                        <Badge className={meta.color + " text-xs gap-1"}>
                          <meta.icon size={10} />
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-brand-navy">
                        {m.client}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={11} /> {m.origin} → {m.destination}
                      </p>
                      {m.border_post && (
                        <p className="text-xs text-muted-foreground flex  items-center gap-1">
                          <Globe size={11} /> Border Post: {m.border_post}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1"
                        >
                          <Truck size={10} />
                          {m.truck_registration || "—"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1"
                        >
                          <Package size={10} /> {m.cargo_type || "—"}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          Net:
                          {m.net_weight_tons?.toFixed(3) || "—"} t
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Load: {m.load_number}
                      </p>
                      {m.freight_forwarder && (
                        <p className="text-xs  text-muted-foreground">
                          Forwarder: {m.freight_forwarder}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Weighbill:
                        {m.weighbill_ticket_number || "—"}
                      </p>
                      {m.status_updated_at && (
                        <p className="text-[10px]  text-muted-foreground">
                          Updated:{" "}
                          {new Date(m.status_updated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Manifest detail / status update dialog */}
        <Dialog
          open={!!selectedManifest}
          onOpenChange={(v) => !v && setSelectedManifest(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText size={20} className="text-brand-navy" /> Manifest
                {selectedManifest?.manifest_number}
              </DialogTitle>
            </DialogHeader>
            {selectedManifest && (
              <div className="space-y-4">
                {/* Manifest details */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60  p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Load Number</p>
                    <p className="text-sm font-semibold  text-brand-navy">
                      {selectedManifest.load_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="text-sm font-semibold  text-brand-navy">
                      {selectedManifest.client}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Route</p>
                    <p className="text-sm font-semibold text-brand-navy">
                      {selectedManifest.origin} →{selectedManifest.destination}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Border Post</p>
                    <p className="text-sm font-semibold text-brand-navy">
                      {selectedManifest.border_post || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cargo Type</p>
                    <p className="text-sm font-semibold text-brand-navy">
                      {selectedManifest.cargo_type || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Truck</p>
                    <p className="text-sm font-semibold  text-brand-navy">
                      {selectedManifest.truck_registration || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Gross Weight
                    </p>
                    <p className="text-sm font-semibold  text-brand-navy">
                      {selectedManifest.gross_weight?.toLocaleString() || "—"}
                      kg
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tare Weight</p>
                    <p className="text-sm font-semibold  text-brand-navy">
                      {selectedManifest.tare_weight?.toLocaleString() || "—"}
                      kg
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net Weight</p>
                    <p className="text-sm font-bold  text-brand-teal">
                      {selectedManifest.net_weight_tons?.toFixed(3) || "—"}
                      tons
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Forwarder</p>
                    <p className="text-sm font-semibold  text-brand-navy">
                      {selectedManifest.freight_forwarder || "—"}
                    </p>
                  </div>
                </div>

                {/* Weighbill photo */}
                {selectedManifest.weighbill_file_url && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Weighbill Document
                    </p>
                    <Image
                      src={selectedManifest.weighbill_file_url}
                      className="w-full rounded-lg  border border-border h-48 object-contain bg-white"
                      fittingType="fit"
                    />
                  </div>
                )}

                {/* Status update form */}
                <div className="space-y-3 rounded-lg border border-brand-teal/30  bg-brand-teal/5 p-4">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-brand-teal" />
                    <p className="text-sm font-semibold  text-brand-navy">
                      Update Customs Status
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updating the status will automatically notify the driver and
                    operations controller via email.
                  </p>
                  <div className="grid gap-2">
                    <Label className="text-xs">New Status</Label>
                    <Select
                      value={statusForm.status}
                      onValueChange={(v) =>
                        setStatusForm({
                          ...statusForm,
                          status: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending_review">
                          Pending Review
                        </SelectItem>
                        <SelectItem value="documents_submitted">
                          Documents Submitted
                        </SelectItem>
                        <SelectItem value="in_process">In Process</SelectItem>
                        <SelectItem value="cleared">Cleared</SelectItem>
                        <SelectItem value="held">Held</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      value={statusForm.notes}
                      onChange={(e) =>
                        setStatusForm({
                          ...statusForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Add processing notes,  document references, or instructions…"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedManifest(null)}
              >
                Close
              </Button>
              <Button
                onClick={updateManifestStatus}
                disabled={updating}
                className="gap-2  bg-brand-navy hover:bg-brand-navy/90"
              >
                {updating ? (
                  "Updating…"
                ) : (
                  <>
                    <Send size={14} /> Update & Notify
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ===== ADMIN/USER VIEW: Weighbill Capture + Manifest Oversight =====
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
          Weighbill Capture & Freight Clearance
        </h1>
        <p className="text-sm text-muted-foreground">
          Auto-production from weighbills · cross-border manifest oversight
        </p>
      </div>

      <Card className="border-brand-teal/30 bg-brand-teal/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Zap className="mt-0.5 text-brand-teal" size={20} />
          <div>
            <p className="text-sm font-semibold text-brand-navy">
              Auto-Production from Weighbill
            </p>
            <p className="text-xs text-muted-foreground">
              Capturing a weighbridge ticket automatically creates a Load entry.
              For cross-border loads, a transport manifest is also compiled for
              the clearing agent.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base  font-semibold">
            <Scale size={16} className="text-brand-navy" /> New Weighbill
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Ticket Number</Label>
              <Input
                value={form.ticket_number}
                onChange={(e) =>
                  setForm({ ...form, ticket_number: e.target.value })
                }
                placeholder="WB-2026-001"
              />
            </div>
            <div className="grid gap-2">
              <Label>Truck</Label>
              <Select
                value={form.truck_id}
                onValueChange={(v) => setForm({ ...form, truck_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose truck" />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Commodity</Label>
              <Input
                value={form.commodity}
                onChange={(e) =>
                  setForm({ ...form, commodity: e.target.value })
                }
                placeholder="Chrome ore"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cargo Type</Label>
              <Input
                value={form.cargo_type}
                onChange={(e) =>
                  setForm({ ...form, cargo_type: e.target.value })
                }
                placeholder="Mining Bulk"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Supplier / Origin</Label>
              <Input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="Steelpoort"
              />
            </div>
            <div className="grid gap-2">
              <Label>Destination</Label>
              <Input
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
                placeholder="Durban Port"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Gross (kg)</Label>
              <Input
                type="number"
                value={form.gross_weight}
                onChange={(e) =>
                  setForm({ ...form, gross_weight: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Tare (kg)</Label>
              <Input
                type="number"
                value={form.tare_weight}
                onChange={(e) =>
                  setForm({ ...form, tare_weight: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Net (kg)</Label>
              <div className="flex h-10  items-center rounded-md border border-input bg-muted px-3 font-semibold  text-brand-navy">
                {netWeight.toLocaleString()}
              </div>
            </div>
          </div>
          <Button
            onClick={submit}
            disabled={saving}
            className="w-full gap-2  bg-brand-navy hover:bg-brand-navy/90"
          >
            <Plus size={16} />{" "}
            {saving ? "Capturing…" : "Capture & Generate Load"}
          </Button>
        </CardContent>
      </Card>

      {/* Manifest oversight */}
      {manifests.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base  font-semibold">
              <Globe size={16} className="text-brand-teal" /> Cross-Border
              Manifest Oversight
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manifest #</TableHead>
                  <TableHead>Load</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Net (t)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manifests.map((m) => {
                  const meta =
                    MANIFEST_STATUS_META[m.manifest_status] ||
                    MANIFEST_STATUS_META.pending_review;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs font-semibold  text-brand-navy">
                        {m.manifest_number}
                      </TableCell>
                      <TableCell className="text-xs">{m.load_number}</TableCell>
                      <TableCell className="text-xs">{m.client}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.origin} →{m.destination}
                      </TableCell>
                      <TableCell className="text-xs  font-semibold">
                        {m.net_weight_tons?.toFixed(3)}
                      </TableCell>
                      <TableCell>
                        <Badge className={meta.color + "  text-[10px]"}>
                          {meta.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Recent Weighbills
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Truck</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Tare</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Load</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center  text-muted-foreground py-8"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!loading && weighbills.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No weighbills yet.
                  </TableCell>
                </TableRow>
              )}
              {weighbills.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-semibold  text-brand-navy">
                    {w.ticket_number}
                  </TableCell>
                  <TableCell>{w.truck_registration}</TableCell>
                  <TableCell>{w.commodity}</TableCell>
                  <TableCell>{w.gross_weight?.toLocaleString()}</TableCell>
                  <TableCell>{w.tare_weight?.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">
                    {w.net_weight?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {w.load_id ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100  text-emerald-700"
                      >
                        Created
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
