import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  UserCog,
  BadgeCheck,
  AlertTriangle,
  HeartPulse,
  Plus,
  Pencil,
  IdCard,
} from "lucide-react";

const CRED_META = {
  pdp: { label: "PDP", color: "bg-blue-100 text-blue-700" },
  license: {
    label: "Driver's License",
    color: "bg-indigo-100 text-indigo-700",
  },
  medical: { label: "Medical Fitness", color: "bg-rose-100 text-rose-700" },
  dg_certification: {
    label: "DG Certification",
    color: "bg-amber-100  text-amber-700",
  },
  competency: {
    label: "Competency Assessment",
    color: "bg-teal-100  text-teal-700",
  },
};
function daysUntil(d) {
  return d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;
}
function credStatus(d) {
  const x = daysUntil(d);
  return x === null
    ? "valid"
    : x < 0
      ? "expired"
      : x <= 30
        ? "expiring"
        : "valid";
}
const STATUS_STYLE = {
  valid: "bg-emerald-100 text-emerald-700",
  expiring: "bg-amber-100 text-amber-700",
  expired: "bg-rose-100 text-rose-700",
};

export default function CredentialsTab({
  credentials,
  drivers,
  onDataChanged,
}) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    driver_id: "",
    credential_type: "pdp",
    credential_number: "",
    issue_date: "",
    expiry_date: "",
    issuing_authority: "",
    notes: "",
  });

  const driverName = (id) => drivers.find((d) => d.id === id)?.full_name || "—";
  const expiringCreds = credentials.filter(
    (c) => credStatus(c.expiry_date) === "expiring",
  );
  const expiredCreds = credentials.filter(
    (c) => credStatus(c.expiry_date) === "expired",
  );
  const dgCertified = drivers.filter((d) => d.dg_certified).length;
  const filtered = credentials.filter(
    (c) => filter === "all" || credStatus(c.expiry_date) === filter,
  );

  const openNew = () => {
    setEditing(null);
    setForm({
      driver_id: "",
      credential_type: "pdp",
      credential_number: "",
      issue_date: "",
      expiry_date: "",
      issuing_authority: "",
      notes: "",
    });
    setOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ ...c });
    setOpen(true);
  };
  const save = async () => {
    if (!form.driver_id || !form.expiry_date) {
      toast({
        title: "Driver & expiry  date required",
        variant: "destructive",
      });
      return;
    }
    const data = {
      ...form,
      driver_name: driverName(form.driver_id),
      status: credStatus(form.expiry_date),
    };
    if (editing)
      await base44.entities.PersonnelCredential.update(editing.id, data);
    else await base44.entities.PersonnelCredential.create(data);
    toast({ title: editing ? "Credential updated" : "Credential added" });
    setOpen(false);
    onDataChanged?.();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            l: "Total Drivers",
            v: drivers.length,
            i: UserCog,
            t: "text-brand-blue",
          },
          {
            l: "Expiring (30d)",
            v: expiringCreds.length,
            i: AlertTriangle,
            t: "text-amber-500",
          },
          {
            l: "Expired",
            v: expiredCreds.length,
            i: AlertTriangle,
            t: "text-rose-500",
          },
          {
            l: "DG Certified",
            v: dgCertified,
            i: BadgeCheck,
            t: "text-brand-teal",
          },
        ].map((k) => (
          <Card key={k.l} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{k.l}</p>
                <k.i className={k.t} size={16} />
              </div>
              <p className="mt-1 font-display text-2xl font-bold  text-brand-navy">
                {k.v}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {(expiringCreds.length > 0 || expiredCreds.length > 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5  text-amber-600" size={20} />
            <div>
              <p className="text-sm font-semibold  text-amber-800">
                {expiringCreds.length + expiredCreds.length} credential(s) need
                attention
              </p>
              <p className="text-xs text-amber-700">
                {expiredCreds.length}
                expired · {expiringCreds.length} expiring within 30 days
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Credential Register
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={openNew}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border  bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Driver
                </th>
                <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                  Credential
                </th>
                <th className="px-4 py-3  text-left font-medium text-muted-foreground">
                  Number
                </th>
                <th className="px-4  py-3 text-left font-medium text-muted-foreground">
                  Expiry
                </th>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center  text-muted-foreground py-8"
                  >
                    No credentials found.
                  </td>
                </tr>
              )}
              {filtered.map((c) => {
                const st = credStatus(c.expiry_date);
                const d = daysUntil(c.expiry_date);
                return (
                  <tr
                    key={c.id}
                    className="border-b border-border/50 last:border-0  hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-semibold text-brand-navy">
                      {c.driver_name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={CRED_META[c.credential_type]?.color}>
                        {CRED_META[c.credential_type]?.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {c.credential_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.expiry_date
                        ? new Date(c.expiry_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs 
font-medium ${STATUS_STYLE[st]}`}
                      >
                        {st === "expired"
                          ? "Expired"
                          : st === "expiring"
                            ? `${d}d left`
                            : "Valid"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base  font-semibold">
            Competency Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border  bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Driver
                </th>
                <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                  Level
                </th>
                <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                  DG Certified
                </th>
                <th className="px-4 py-3  text-left font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr
                  key={d.id}
                  className="border-b  border-border/50 last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3  font-semibold text-brand-navy">
                    {d.full_name}
                  </td>
                  <td className="px-4  py-3">
                    <Badge variant="secondary">
                      {d.competency_level || "Unrated"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {d.dg_certified ? (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4  py-3">
                    <Badge
                      variant={d.status === "active" ? "secondary" : "outline"}
                      className={
                        d.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : ""
                      }
                    >
                      {d.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center text-muted-foreground py-6"
                  >
                    No drivers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Credential" : "Add  Credential"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Driver</Label>
                <Select
                  value={form.driver_id}
                  onValueChange={(v) => setForm({ ...form, driver_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Credential Type</Label>
                <Select
                  value={form.credential_type}
                  onValueChange={(v) =>
                    setForm({ ...form, credential_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CRED_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Credential Number</Label>
              <Input
                value={form.credential_number}
                onChange={(e) =>
                  setForm({ ...form, credential_number: e.target.value })
                }
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={form.issue_date || ""}
                  onChange={(e) =>
                    setForm({ ...form, issue_date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={form.expiry_date || ""}
                  onChange={(e) =>
                    setForm({ ...form, expiry_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Issuing Authority</Label>
              <Input
                value={form.issuing_authority}
                onChange={(e) =>
                  setForm({ ...form, issuing_authority: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
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
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
