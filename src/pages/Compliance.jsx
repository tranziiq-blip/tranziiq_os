import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, ShieldCheck, Trash2, CheckCircle2 } from "lucide-react";
import { FLEET_TYPES } from "@/lib/fleetTypes";

export default function Compliance() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    compliance_profile: "",
    active: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      setProfiles(await base44.entities.CargoType.list("-created_date"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = (key) => {
    const ft = FLEET_TYPES.find((f) => f.key === key);
    setEditing(null);
    setForm({
      name: ft?.label || "",
      key: key || "",
      description: "",
      compliance_profile: "",
      active: true,
    });
    setOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...p });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.key) {
      toast({ title: "Name & key required", variant: "destructive" });
      return;
    }
    try {
      if (editing) await base44.entities.CargoType.update(editing.id, form);
      else await base44.entities.CargoType.create(form);
      toast({ title: editing ? "Profile updated" : "Profile created" });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const toggle = async (p) => {
    await base44.entities.CargoType.update(p.id, { active: !p.active });
    load();
  };

  const remove = async (p) => {
    await base44.entities.CargoType.delete(p.id);
    toast({ title: "Profile removed" });
    load();
  };

  const configuredKeys = new Set(profiles.map((p) => p.key));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Compliance Profiles
          </h1>
          <p className="text-sm text-muted-foreground">
            Configurable cargo-type layer — activates fleet-specific workflows
          </p>
        </div>
      </div>

      <Card className="border-brand-teal/30 bg-brand-teal/5">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 text-brand-teal" size={20} />
          <div>
            <p className="text-sm font-semibold text-brand-navy">
              First-class configurable compliance
            </p>
            <p className="text-xs text-muted-foreground">
              Activating a cargo type enables its inspection checklists, DG
              documentation, and compliance fields across the platform — no
              hardcoded workflows.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active profiles */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold  text-brand-navy">
          Active Cargo Types
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && profiles.length === 0 && (
            <p className="text-sm  text-muted-foreground">
              No profiles configured yet — activate a fleet type below.
            </p>
          )}
          {profiles.map((p) => (
            <Card
              key={p.id}
              className={`border-border/60 shadow-sm ${
                !p.active ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-brand-navy">
                        {p.name}
                      </p>
                      {p.active && (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="mt-1 font-mono  text-[10px]"
                    >
                      {p.key}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-md p-1.5  text-muted-foreground hover:bg-muted hover:text-brand-navy"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => remove(p)}
                      className="rounded-md p-1.5  text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.description || "No  description."}
                </p>
                {p.compliance_profile && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider  text-muted-foreground">
                      Compliance Requirements
                    </p>
                    <p className="mt-1 text-xs text-foreground">
                      {p.compliance_profile}
                    </p>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => toggle(p)}
                    className={`relative h-5 w-9 rounded-full 
transition ${p.active ? "bg-brand-teal" : "bg-muted"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition 
${p.active ? "left-4" : "left-0.5"}`}
                    />
                  </button>
                  <span className="text-xs font-medium text-muted-foreground">
                    {p.active ? "Activated" : "Inactive"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available fleet types to activate */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold  text-brand-navy">
          Available Fleet Types
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {FLEET_TYPES.map((f) => {
            const configured = configuredKeys.has(f.key);
            return (
              <button
                key={f.key}
                onClick={() => !configured && openNew(f.key)}
                disabled={configured}
                className={`flex items-center justify-between rounded-lg border p-3 text-left 
transition ${
                  configured
                    ? "border-border bg-muted/30 opacity-60"
                    : "border-border bg-card hover:border-brand-teal hover:bg-brand-teal/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${f.dot}`} />
                  <span className="text-sm font-medium">{f.label}</span>
                </div>
                {configured ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Plus size={16} className="text-brand-teal" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Compliance Profile" : "Activate  Cargo Type"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cargo Type Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Key</Label>
                <Input
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  className="font-mono"
                  disabled={!!editing}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Compliance Requirements</Label>
              <Textarea
                value={form.compliance_profile}
                onChange={(e) =>
                  setForm({ ...form, compliance_profile: e.target.value })
                }
                rows={2}
                placeholder="e.g. DG placards,  SANS 10406, decanting checklist, product loss/gain"
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
              {editing ? "Save Changes" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
