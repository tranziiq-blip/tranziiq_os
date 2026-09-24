import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  Truck,
  Route,
} from "lucide-react";
import RoutesRatesPanel from "@/components/admin/RoutesRatesPanel";

const ENTITY_TYPES = {
  client: {
    label: "Client",
    color: "bg-emerald-100 text-emerald-700",
    icon: Users,
  },
  supplier: {
    label: "Supplier",
    color: "bg-blue-100 text-blue-700",
    icon: Building2,
  },
  service_provider: {
    label: "Service Provider",
    color: "bg-purple-100  text-purple-700",
    icon: Truck,
  },
  route: {
    label: "Route & Rate",
    color: "bg-amber-100 text-amber-700",
    icon: Route,
  },
};

const empty = {
  name: "",
  entity_type: "client",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  route_origin: "",
  route_destination: "",
  cargo_type: "",
  rate_per_ton: "",
  rate_per_km: "",
  linked_client: "",
  notes: "",
};

export default function BusinessDirectory() {
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    try {
      const list =
        await base44.entities.BusinessDirectory.list("-created_date");
      setEntries(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = (type) => {
    setEditing(null);
    setForm({ ...empty, entity_type: type || "client" });
    setOpen(true);
  };
  const openEdit = (e) => {
    setEditing(e);
    setForm({
      ...e,
      rate_per_ton: e.rate_per_ton ?? "",
      rate_per_km: e.rate_per_km ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    const payload = {
      ...form,
      rate_per_ton: form.rate_per_ton ? Number(form.rate_per_ton) : undefined,
      rate_per_km: form.rate_per_km ? Number(form.rate_per_km) : undefined,
    };
    try {
      if (editing)
        await base44.entities.BusinessDirectory.update(editing.id, payload);
      else await base44.entities.BusinessDirectory.create(payload);
      toast({ title: editing ? "Entry updated" : "Entry added" });
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

  const remove = async (e) => {
    await base44.entities.BusinessDirectory.delete(e.id);
    toast({ title: "Entry removed" });
    load();
  };

  const filtered =
    tab === "all" ? entries : entries.filter((e) => e.entity_type === tab);
  const clients = entries.filter((e) => e.entity_type === "client");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Business Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Clients · suppliers · service providers · routes & rates
          </p>
        </div>
        <Button
          onClick={() => openNew("client")}
          className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
        >
          <Plus size={16} /> Add Entry
        </Button>
      </div>

      <RoutesRatesPanel clients={entries.filter((e) => (e.entity_type || "client") === "client")} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All ({entries.length})</TabsTrigger>
          <TabsTrigger value="client">Clients</TabsTrigger>
          <TabsTrigger value="supplier">Suppliers</TabsTrigger>
          <TabsTrigger value="service_provider">Service Providers</TabsTrigger>
          <TabsTrigger value="route">Routes & Rates</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Route / Location</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                  {!loading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No entries yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((e) => {
                    const meta =
                      ENTITY_TYPES[e.entity_type] || ENTITY_TYPES.client;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-semibold text-brand-navy">
                          {e.name}
                        </TableCell>
                        <TableCell>
                          <Badge className={meta.color}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {e.contact_person || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {e.phone || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {e.entity_type === "route"
                            ? `${e.route_origin || "—"} → 
${e.route_destination || "—"}`
                            : e.city || e.address || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {e.rate_per_ton
                            ? `R ${Number(e.rate_per_ton).toLocaleString()}/t`
                            : e.rate_per_km
                              ? `R ${e.rate_per_km}/km`
                              : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEdit(e)}
                              className="rounded-md p-2  text-muted-foreground hover:bg-muted hover:text-brand-navy"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => remove(e)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Entry" : "Add  Entry"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="grid gap-1.5">
              <Label className="text-xs">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={form.entity_type}
                onValueChange={(v) => setForm({ ...form, entity_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENTITY_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.entity_type !== "route" && (
              <>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Contact Person</Label>
                  <Input
                    value={form.contact_person}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact_person: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5 col-span-2">
                  <Label className="text-xs">Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </div>
              </>
            )}
            {form.entity_type === "route" && (
              <>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Route Origin</Label>
                  <Input
                    value={form.route_origin}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        route_origin: e.target.value,
                      })
                    }
                    placeholder="Steelpoort"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Route Destination</Label>
                  <Input
                    value={form.route_destination}
                    onChange={(e) =>
                      setForm({ ...form, route_destination: e.target.value })
                    }
                    placeholder="Durban  Port"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Cargo Type</Label>
                  <Input
                    value={form.cargo_type}
                    onChange={(e) =>
                      setForm({ ...form, cargo_type: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Linked Client</Label>
                  <Select
                    value={form.linked_client || "none"}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        linked_client: v === "none" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Rate per Ton (R)</Label>
                  <Input
                    type="number"
                    value={form.rate_per_ton}
                    onChange={(e) =>
                      setForm({ ...form, rate_per_ton: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Rate per KM (R)</Label>
                  <Input
                    type="number"
                    value={form.rate_per_km}
                    onChange={(e) =>
                      setForm({ ...form, rate_per_km: e.target.value })
                    }
                  />
                </div>
              </>
            )}
            <div className="grid gap-1.5 col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              className="bg-brand-navy  hover:bg-brand-navy/90"
            >
              {editing ? "Save Changes" : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
