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
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";

const empty = {
  full_name: "",
  employee_number: "",
  phone: "",
  license_number: "",
  status: "active",
  competency_level: "",
  dg_certified: false,
};

export default function Drivers() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    try {
      setDrivers(await base44.entities.Driver.list("-created_date"));
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
  const openEdit = (d) => {
    setEditing(d);
    setForm({ ...d });
    setOpen(true);
  };

  const save = async () => {
    if (!form.full_name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    try {
      if (editing) await base44.entities.Driver.update(editing.id, form);
      else await base44.entities.Driver.create(form);
      toast({ title: editing ? "Driver updated" : "Driver added" });
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

  const remove = async (d) => {
    await base44.entities.Driver.delete(d.id);
    toast({ title: "Driver removed" });
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Drivers
          </h1>
          <p className="text-sm text-muted-foreground">
            Competency & DG certification tracked per fleet type
          </p>
        </div>
        <Button
          onClick={openNew}
          className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
        >
          <Plus size={16} /> Add Driver
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Emp #</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Competency</TableHead>
                <TableHead>DG Cert</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center  text-muted-foreground py-8"
                  >
                    Loading drivers…
                  </TableCell>
                </TableRow>
              )}
              {!loading && drivers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    No drivers found.
                  </TableCell>
                </TableRow>
              )}
              {drivers.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-semibold text-brand-navy">
                    {d.full_name}
                  </TableCell>
                  <TableCell>{d.employee_number || "—"}</TableCell>
                  <TableCell>{d.phone || "—"}</TableCell>
                  <TableCell>{d.license_number || "—"}</TableCell>
                  <TableCell>{d.competency_level || "—"}</TableCell>
                  <TableCell>
                    {d.dg_certified ? (
                      <span className="inline-flex items-center gap-1  text-emerald-600">
                        <ShieldCheck size={14} /> Yes
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        d.status === "active"
                          ? "default"
                          : d.status === "on_leave"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {d.status.replace("_", "  ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(d)}
                        className="rounded-md p-2  text-muted-foreground hover:bg-muted hover:text-brand-navy"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => remove(d)}
                        className="rounded-md p-2  text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Driver" : "Add  Driver"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Employee #</Label>
                <Input
                  value={form.employee_number}
                  onChange={(e) =>
                    setForm({ ...form, employee_number: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>License Number</Label>
                <Input
                  value={form.license_number}
                  onChange={(e) =>
                    setForm({ ...form, license_number: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Competency Level</Label>
                <Input
                  value={form.competency_level}
                  onChange={(e) =>
                    setForm({ ...form, competency_level: e.target.value })
                  }
                  placeholder="Code EC / DG"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.dg_certified}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dg_certified: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded  border-input accent-brand-teal"
                  />
                  DG Certified
                </label>
              </div>
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
              {editing ? "Save Changes" : "Add Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
