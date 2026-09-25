import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { OPS_DEFAULTS, OPS_FIELDS, opsSettings } from "@/lib/opsSettings";
import { Gauge } from "lucide-react";

// Costs and limits used to spot problems and price them
export default function OpsSettingsPanel() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [vals, setVals] = useState(OPS_DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.CompanyProfile.list().then((l) => {
      setProfile(l[0] || null);
      setVals(opsSettings(l[0]));
    });
  }, []);

  const save = async () => {
    if (!profile) {
      toast({ title: "Complete your company profile first", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const clean = Object.fromEntries(Object.keys(OPS_DEFAULTS).map((k) => [k, Number(vals[k])]));
      await base44.entities.CompanyProfile.update(profile.id, { ops_settings: clean });
      toast({ title: "Settings saved", description: "Command Center and AI Insights now use these figures." });
    } catch (e) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const groups = [...new Set(OPS_FIELDS.map((f) => f.group))];
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Gauge size={18} className="text-brand-teal" /> Cost & Risk Settings
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Used to spot problems and estimate what they cost you. Set these to your own figures for accurate estimates.
          The fatigue rules also drive the driver app's rest and shift timers.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {OPS_FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} className="grid gap-1">
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={vals[f.key]}
                    onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={() => setVals(OPS_DEFAULTS)}>Reset to defaults</Button>
          <Button onClick={save} disabled={saving} className="bg-brand-navy hover:bg-brand-navy/90">
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
