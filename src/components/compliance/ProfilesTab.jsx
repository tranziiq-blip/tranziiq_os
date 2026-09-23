import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  ClipboardCheck,
  Thermometer,
  FileText,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import ComplianceProfileDialog from "@/components/compliance/ComplianceProfileDialog";
import ProfileChecklistDialog from "@/components/compliance/ProfileChecklistDialog";
import TemperatureLogDialog from "@/components/compliance/TemperatureLogDialog";
import PermitsDialog from "@/components/compliance/PermitsDialog";
import { PROFILE_TYPES } from "@/lib/complianceContent";
import { jurisdictionSummary, gateSummary } from "@/lib/complianceEngine";
export default function ProfilesTab({
  profileType,
  profiles,
  loads,
  onRefresh,
}) {
  const { toast } = useToast();
  const [dialog, setDialog] = useState(null); // { profile } for edit, { new: true } for create
  const [checklist, setChecklist] = useState(null);
  const [tempLog, setTempLog] = useState(null);
  const [permits, setPermits] = useState(null);

  const meta = PROFILE_TYPES[profileType];
  const list = profiles.filter((p) => p.profile_type === profileType);
  const blockedCount = list.filter((p) => gateSummary(p).blocked).length;
  const clearedCount = list.filter(
    (p) => !gateSummary(p).blocked && p.documents_data?.length > 0,
  ).length;

  const remove = async (p) => {
    await base44.entities.ComplianceProfile.delete(p.id);
    toast({ title: "Compliance profile removed" });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <Card className="border-brand-teal/30 bg-brand-teal/5">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-navy">
                {meta.label} — Regulatory Basis
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {meta.regulatoryBasis}
              </p>
            </div>
            <Button
              onClick={() => setDialog({ new: true })}
              className="gap-2  bg-brand-navy hover:bg-brand-navy/90 shrink-0"
            >
              <Plus size={16} /> New {meta.label} Profile
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border/60 bg-white p-2">
              <p className="font-display text-lg font-bold text-brand-navy">
                {list.length}
              </p>
              <p className="text-[10px] text-muted-foreground">Profiles</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-white p-2">
              <p className="font-display text-lg font-bold  text-emerald-600">
                {clearedCount}
              </p>
              <p className="text-[10px]  text-muted-foreground">
                Dispatch-cleared
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-white p-2">
              <p className="font-display text-lg font-bold text-rose-600">
                {blockedCount}
              </p>
              <p className="text-[10px] text-muted-foreground">Gate-blocked</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {list.length === 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-8 text-center">
            <ClipboardCheck
              className="mx-auto text-muted-foreground/40"
              size={36}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              No {meta.label} compliance profiles yet — create one against a
              load to build the document checklist, DVI items and monitoring.
            </p>
          </CardContent>
        </Card>
      )}

      {list.map((p) => {
        const gate = gateSummary(p);
        return (
          <Card
            key={p.id}
            className={`border-border/60 shadow-sm ${
              gate.blocked
                ? "border-rose-200"
                : p.documents_data?.length > 0
                  ? "border-emerald-200"
                  : ""
            }`}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display font-bold text-brand-navy">
                    {p.load_number || "Unassigned load"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.client || "—"} ·{p.truck_registration || "—"} ·{" "}
                    {p.driver_name || "—"}
                  </p>
                </div>
                <Badge
                  className={
                    gate.blocked
                      ? "bg-rose-100 text-rose-700"
                      : p.documents_data?.length > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted  text-muted-foreground"
                  }
                >
                  {gate.blocked ? (
                    <ShieldAlert size={12} className="mr-1" />
                  ) : (
                    <CheckCircle2 size={12} className="mr-1" />
                  )}
                  {gate.blocked
                    ? `Blocked — ${gate.failures.length} item(s)`
                    : p.documents_data?.length > 0
                      ? "Cleared for dispatch"
                      : "Checklist pending"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(p.jurisdictions || []).map((j) => (
                  <Badge key={j} variant="outline" className="text-[10px]">
                    {j}
                  </Badge>
                ))}
                {p.cross_border && (
                  <Badge className="bg-amber-100 text-amber-700  text-[10px]">
                    Cross-Border
                  </Badge>
                )}
                {profileType === "dg_hazmat" && p.un_number && (
                  <Badge className="bg-orange-100 text-orange-700 text-[10px]">
                    UN {p.un_number} · Class
                    {p.un_class || "—"}
                  </Badge>
                )}
                {profileType === "cold_chain" &&
                  (p.temp_min_c != null || p.temp_max_c != null) && (
                    <Badge className="bg-cyan-100 text-cyan-700 text-[10px]">
                      {p.temp_min_c ?? "—"}°C to {p.temp_max_c ?? "—"}°C
                    </Badge>
                  )}
                {profileType === "abnormal_load" && (
                  <Badge variant="outline" className="text-[10px]">
                    {p.load_height_m ?? "—"}×{p.load_width_m ?? "—"}×
                    {p.load_length_m ?? "—"}m · {p.mass_tons ?? "—"}t{" "}
                    {p.escort_required ? "·  Escort" : ""}
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Jurisdictions:
                {jurisdictionSummary(p.jurisdictions) || "—"}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => setChecklist(p)}
                  className="gap-1.5  bg-brand-navy hover:bg-brand-navy/90"
                >
                  <ClipboardCheck size={14} />
                  Checklist
                </Button>
                {profileType === "cold_chain" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setTempLog(p)}
                  >
                    <Thermometer size={14} />
                    Temperature Log
                  </Button>
                )}
                {profileType === "abnormal_load" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setPermits(p)}
                  >
                    <FileText size={14} />
                    Permits
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setDialog({ profile: p })}
                >
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-rose-600  hover:bg-rose-50"
                  onClick={() => remove(p)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {dialog && (
        <ComplianceProfileDialog
          open={!!dialog}
          onOpenChange={(v) => !v && setDialog(null)}
          profile={dialog.profile || null}
          profileType={profileType}
          loads={loads}
          onSaved={() => {
            setDialog(null);
            onRefresh();
          }}
        />
      )}
      <ProfileChecklistDialog
        open={!!checklist}
        onOpenChange={(v) => !v && setChecklist(null)}
        profile={checklist}
        onSaved={onRefresh}
      />
      <TemperatureLogDialog
        open={!!tempLog}
        onOpenChange={(v) => !v && setTempLog(null)}
        profile={tempLog}
        onSaved={onRefresh}
      />
      <PermitsDialog
        open={!!permits}
        onOpenChange={(v) => !v && setPermits(null)}
        profile={permits}
        onSaved={onRefresh}
      />
    </div>
  );
}
