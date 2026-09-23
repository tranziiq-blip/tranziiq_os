import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { PROFILE_TYPES } from "@/lib/complianceContent";
import { parseChecklist, evaluateGate } from "@/lib/complianceEngine";

const STATUSES = [
  { key: "verified", label: "Verified", cls: "bg-emerald-600 text-white" },
  { key: "missing", label: "Missing", cls: "bg-orange-500 text-white" },
  { key: "expired", label: "Expired", cls: "bg-amber-600 text-white" },
  { key: "failed", label: "Failed", cls: "bg-rose-600 text-white" },
  { key: "na", label: "N/A", cls: "bg-muted text-muted-foreground" },
];

export default function ProfileChecklistDialog({
  open,
  onOpenChange,
  profile,
  onSaved,
}) {
  const { toast } = useToast();
  const [docs, setDocs] = useState([]);
  const [dvis, setDvis] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !profile) return;
    setDocs(parseChecklist(profile.documents_data));
    setDvis(parseChecklist(profile.dvi_data));
  }, [open, profile]);

  if (!profile) return null;
  const meta = PROFILE_TYPES[profile.profile_type];
  const setStatus = (kind, id, status) => {
    const setter = kind === "doc" ? setDocs : setDvis;
    setter((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };
  const gate = evaluateGate(docs.map((d) => JSON.stringify(d)));

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.ComplianceProfile.update(profile.id, {
        documents_data: docs.map((d) => JSON.stringify(d)),
        dvi_data: dvis.map((d) => JSON.stringify(d)),
        status: gate.blocked ? "blocked" : "cleared",
      });
      toast({
        title: gate.blocked
          ? "Checklist saved — dispatch gate BLOCKED"
          : "Checklist  saved — cleared for dispatch",
        description: gate.blocked
          ? `${gate.failures.length} required document(s) 
missing, expired or failed`
          : "All required documents verified for every  jurisdiction",
        variant: gate.blocked ? "destructive" : "default",
      });
      onSaved();
    } catch (e) {
      toast({
        title: "Error saving checklist",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {meta.label} Checklist —{profile.load_number}
          </DialogTitle>
          <p className="text-xs text-muted-foreground  font-normal">
            {meta.regulatoryBasis}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider  text-muted-foreground">
              Pre-Dispatch Documents (per jurisdiction)
            </p>
            <div className="space-y-1.5">
              {docs.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No document items — edit the profile to regenerate the
                  checklist.
                </p>
              )}
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col gap-1.5 rounded-lg border  border-border/60 p-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-brand-navy">
                      {d.label}
                    </p>
                    {d.jurisdiction && (
                      <Badge variant="outline" className="mt-0.5  text-[9px]">
                        {d.jurisdiction}
                      </Badge>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setStatus("doc", d.id, s.key)}
                        className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                          d.status === s.key
                            ? s.cls
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider  text-muted-foreground">
              Additional Driver-Vehicle Inspection (DVI)
            </p>
            <div className="space-y-1.5">
              {dvis.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col gap-1.5 rounded-lg border  border-border/60 p-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-xs font-medium text-brand-navy">
                    {d.label}
                  </p>
                  <div className="flex shrink-0 gap-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setStatus("dvi", d.id, s.key)}
                        className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                          d.status === s.key
                            ? s.cls
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`rounded-lg border p-3 ${gate.blocked ? "border-rose-200  bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}
          >
            <div className="flex items-center gap-2">
              {gate.blocked ? (
                <ShieldAlert size={16} className="text-rose-600" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-600" />
              )}
              <p
                className={`text-xs font-semibold ${
                  gate.blocked ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {gate.blocked
                  ? "Dispatch gate: BLOCKED"
                  : "Dispatch gate: CLEARED"}
              </p>
            </div>
            {gate.blocked && (
              <ul className="mt-1.5 space-y-0.5">
                {gate.failures.slice(0, 4).map((f) => (
                  <li key={f.id} className="text-[11px] text-rose-700">
                    •{f.label}
                    {f.jurisdiction ? ` (${f.jurisdiction})` : ""} — {f.status}
                  </li>
                ))}
                {gate.failures.length > 4 && (
                  <li className="text-[11px] text-rose-700">
                    • +{gate.failures.length - 4} more
                  </li>
                )}
              </ul>
            )}
            <p className="mt-1 text-[10px] text-muted-foreground">
              The load cannot move to dispatch while any required document is
              missing, expired or failed for any jurisdiction on the route.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-brand-navy  hover:bg-brand-navy/90"
          >
            {saving ? "Saving…" : "Save Checklist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
