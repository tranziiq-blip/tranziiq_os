import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Boxes,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  Search,
  Plus,
  Pencil,
} from "lucide-react";

export default function Stores() {
  const { toast } = useToast();
  const [parts, setParts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [partForm, setPartForm] = useState({
    part_number: "",
    name: "",
    category: "",
    unit_of_measure: "each",
    quantity_on_hand: 0,
    reorder_level: 0,
    unit_cost: 0,
    location: "",
  });
  const [moveForm, setMoveForm] = useState({
    part_id: "",
    movement_type: "receipt",
    quantity: 1,
    reference: "",
    truck_id: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [p, m, t] = await Promise.all([
        base44.entities.Part.list("-created_date"),
        base44.entities.StockMovement.list("-created_date"),
        base44.entities.Truck.list(),
      ]);
      setParts(p);
      setMovements(m);
      setTrucks(t);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const lowStock = parts.filter((p) => p.quantity_on_hand <= p.reorder_level);
  const stockValue = parts.reduce(
    (s, p) => s + (p.quantity_on_hand || 0) * (p.unit_cost || 0),
    0,
  );

  const filtered = parts.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.part_number.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "low" && p.quantity_on_hand <= p.reorder_level);
    return matchSearch && matchFilter;
  });

  const openNewPart = () => {
    setModal("part");
    setPartForm({
      part_number: "",
      name: "",
      category: "",
      unit_of_measure: "each",
      quantity_on_hand: 0,
      reorder_level: 0,
      unit_cost: 0,
      location: "",
    });
  };
  const openEditPart = (p) => {
    setModal("part");
    setPartForm({ ...p });
  };
  const savePart = async () => {
    if (!partForm.part_number || !partForm.name) {
      toast({ title: "Part # & name  required", variant: "destructive" });
      return;
    }
    if (partForm.id) await base44.entities.Part.update(partForm.id, partForm);
    else await base44.entities.Part.create(partForm);
    toast({ title: "Part saved" });
    setModal(null);
    load();
  };

  const openMovement = (type, part) => {
    setModal("move");
    setMoveForm({
      part_id: part?.id || "",
      movement_type: type,
      quantity: 1,
      reference: "",
      truck_id: "",
      notes: "",
    });
  };

  const submitMovement = async () => {
    if (!moveForm.part_id || !moveForm.quantity) {
      toast({ title: "Part &  quantity required", variant: "destructive" });
      return;
    }
    const part = parts.find((p) => p.id === moveForm.part_id);
    const qty = Number(moveForm.quantity);
    if (moveForm.movement_type === "dispatch" && qty > part.quantity_on_hand) {
      toast({ title: "Insufficient stock", variant: "destructive" });
      return;
    }
    await base44.entities.StockMovement.create({
      ...moveForm,
      quantity: qty,
      part_number: part.part_number,
      part_name: part.name,
      unit_cost: part.unit_cost,
      truck_id: moveForm.truck_id || undefined,
    });
    const delta =
      moveForm.movement_type === "receipt"
        ? qty
        : moveForm.movement_type === "dispatch"
          ? -qty
          : qty;
    await base44.entities.Part.update(part.id, {
      quantity_on_hand: part.quantity_on_hand + delta,
    });
    toast({
      title: `${moveForm.movement_type} recorded`,
      description: `${qty} × 
${part.name}`,
    });
    setModal(null);
    load();
  };

  const kpis = [
    {
      label: "Total Parts",
      value: loading ? "—" : `${parts.length}`,
      icon: Boxes,
      tone: "text-brand-blue",
    },
    {
      label: "Low Stock Items",
      value: loading ? "—" : `${lowStock.length}`,
      icon: AlertTriangle,
      tone: "text-amber-500",
    },
    {
      label: "Stock Value",
      value: loading ? "—" : `R${stockValue.toLocaleString()}`,
      icon: PackagePlus,
      tone: "text-brand-teal",
    },
    {
      label: "Movements (Recent)",
      value: loading ? "—" : `${movements.length}`,
      icon: PackageMinus,
      tone: "text-indigo-500",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Stores & Inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            Stock receipt/dispatch · low-stock alerts · reconciliation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => openMovement("receipt")}
            className="gap-1.5"
          >
            <PackagePlus size={16} /> Receive
          </Button>
          <Button
            variant="outline"
            onClick={() => openMovement("dispatch")}
            className="gap-1.5"
          >
            <PackageMinus size={16} /> Issue
          </Button>
          <Button
            onClick={openNewPart}
            className="gap-1.5 bg-brand-navy  hover:bg-brand-navy/90"
          >
            <Plus size={16} /> New Part
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {k.label}
                </p>
                <k.icon className={k.tone} size={18} />
              </div>
              <p className="mt-2 font-display text-3xl font-bold  text-brand-navy">
                {k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="text-amber-600" size={20} />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {lowStock.length} part(s) at or below reorder level
              </p>
              <p className="text-xs text-amber-700">
                {lowStock.map((p) => p.name).join(",  ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Parts Catalogue
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-2.5 top-2.5 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-9 w-44 pl-8"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parts</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Part #
                </th>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  On Hand
                </th>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Reorder
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Unit Cost
                </th>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Location
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center text-muted-foreground  py-8"
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    No parts found.
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const low = p.quantity_on_hand <= p.reorder_level;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border/50 last:border-0  hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold  text-brand-navy">
                      {p.part_number}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.category || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          low ? "text-rose-600" : "text-foreground"
                        }`}
                      >
                        {p.quantity_on_hand}
                      </span>
                      {p.unit_of_measure}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.reorder_level}
                    </td>
                    <td className="px-4 py-3">
                      R{(p.unit_cost || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.location || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openMovement("receipt", p)}
                          title="Receive"
                          className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                        >
                          <PackagePlus size={15} />
                        </button>
                        <button
                          onClick={() => openMovement("dispatch", p)}
                          title="Issue"
                          className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
                        >
                          <PackageMinus size={15} />
                        </button>
                        <button
                          onClick={() => openEditPart(p)}
                          title="Edit"
                          className="rounded-md  p-1.5 text-muted-foreground hover:bg-muted"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recent movements */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base  font-semibold">
            Stock Movements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left font-medium  text-muted-foreground">
                  Part
                </th>
                <th className="px-4 py-2 text-left font-medium  text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Qty
                </th>
                <th className="px-4 py-2 text-left font-medium  text-muted-foreground">
                  Reference
                </th>
                <th className="px-4 py-2 text-left font-medium  text-muted-foreground">
                  Truck
                </th>
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 15).map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-2">{m.part_name}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        m.movement_type === "receipt"
                          ? "secondary"
                          : m.movement_type === "dispatch"
                            ? "outline"
                            : "default"
                      }
                      className="capitalize"
                    >
                      {m.movement_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    {m.movement_type === "dispatch" ? "-" : "+"}
                    {m.quantity}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {m.reference || "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {trucks.find((t) => t.id === m.truck_id)
                      ?.registration_number || "—"}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-muted-foreground py-6"
                  >
                    No movements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Part dialog */}
      <Dialog
        open={modal === "part"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{partForm.id ? "Edit Part" : "New  Part"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Part Number</Label>
                <Input
                  value={partForm.part_number}
                  onChange={(e) =>
                    setPartForm({ ...partForm, part_number: e.target.value })
                  }
                  className="font-mono"
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Input
                  value={partForm.category}
                  onChange={(e) =>
                    setPartForm({ ...partForm, category: e.target.value })
                  }
                  placeholder="Filters, Brakes"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={partForm.name}
                onChange={(e) =>
                  setPartForm({ ...partForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>On Hand</Label>
                <Input
                  type="number"
                  value={partForm.quantity_on_hand}
                  onChange={(e) =>
                    setPartForm({
                      ...partForm,
                      quantity_on_hand: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  value={partForm.reorder_level}
                  onChange={(e) =>
                    setPartForm({
                      ...partForm,
                      reorder_level: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Unit Cost (R)</Label>
                <Input
                  type="number"
                  value={partForm.unit_cost}
                  onChange={(e) =>
                    setPartForm({
                      ...partForm,
                      unit_cost: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input
                  value={partForm.location}
                  onChange={(e) =>
                    setPartForm({ ...partForm, location: e.target.value })
                  }
                  placeholder="Bay A-3"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={savePart}
              className="bg-brand-navy hover:bg-brand-navy/90"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement dialog */}
      <Dialog
        open={modal === "move"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moveForm.movement_type === "receipt"
                ? "Receive  Stock"
                : "Issue Stock"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Part</Label>
              <Select
                value={moveForm.part_id}
                onValueChange={(v) =>
                  setMoveForm({
                    ...moveForm,
                    part_id: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select part" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.part_number} — {p.name}({p.quantity_on_hand})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={moveForm.quantity}
                  onChange={(e) =>
                    setMoveForm({ ...moveForm, quantity: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Reference / PO</Label>
                <Input
                  value={moveForm.reference}
                  onChange={(e) =>
                    setMoveForm({ ...moveForm, reference: e.target.value })
                  }
                  placeholder="PO-12345"
                />
              </div>
            </div>
            {moveForm.movement_type === "dispatch" && (
              <div className="grid gap-2">
                <Label>Issue to Truck</Label>
                <Select
                  value={moveForm.truck_id}
                  onValueChange={(v) =>
                    setMoveForm({
                      ...moveForm,
                      truck_id: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select truck (optional)" />
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
            )}
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input
                value={moveForm.notes}
                onChange={(e) =>
                  setMoveForm({ ...moveForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={submitMovement}
              className="bg-brand-navy hover:bg-brand-navy/90"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
