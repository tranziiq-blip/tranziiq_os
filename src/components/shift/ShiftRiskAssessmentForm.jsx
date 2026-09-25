// Mandatory shift risk assessment shown straight after sign-in (clock-in).
// The questions come from the employee's department template. It cannot be
// skipped or closed: the only ways out are submitting it or clocking out.
// The result is saved to SHERQ → Shift Risk Assessments.
import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { WEATHER_OPTIONS, scoreAssessment } from "@/lib/shiftRiskTemplates";
import { localDate } from "@/lib/shiftSession";
import { RISK_RATINGS } from "@/lib/sheqConstants";
import BrandLogo from "@/components/BrandLogo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ShieldAlert, Flag, LogOut, CheckCircle2, Truck as TruckIcon } from "lucide-react";

const norm = (v) => String(v || "").replace(/\s+/g, " ").trim().toLowerCase();

const fmtTime = (v) =>
  v ? new Date(v).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "";

function AnswerButtons({ check, value, onChange }) {
  const opts = [
    { v: "yes", label: "Yes" },
    { v: "no", label: "No" },
    ...(check.allowNA ? [{ v: "na", label: "N/A" }] : []),
  ];
  return (
    <div className="flex shrink-0 gap-1">
      {opts.map((o) => {
        const active = value === o.v;
        const unsafe = active && o.v !== "na" && o.v !== check.safe;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={`h-9 min-w-[46px] rounded-md border px-2 text-xs font-semibold transition ${
              active
                ? unsafe
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "border-brand-teal bg-brand-teal text-white"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ShiftRiskAssessmentForm({
  employee,
  driver,
  shift,
  template,
  onSubmitted,
  onSignOut,
}) {
  const { toast } = useToast();
  const name = employee?.full_name || driver?.full_name || "";
  const [answers, setAnswers] = useState({});
  const [weather, setWeather] = useState("clear");
  const [hazards, setHazards] = useState("");
  const [mitigation, setMitigation] = useState("");
  const [newRisk, setNewRisk] = useState(false);
  const [newRiskText, setNewRiskText] = useState("");
  const [registerRisks, setRegisterRisks] = useState([]);
  const [acknowledged, setAcknowledged] = useState({});
  const [truck, setTruck] = useState(null);
  const [signature, setSignature] = useState("");
  const [declared, setDeclared] = useState(false);
  const [saving, setSaving] = useState(false);

  // Known risks from the SHERQ risk register for this person's role
  useEffect(() => {
    const roles = [employee?.job_title, ...(template?.registerRoles || [])]
      .filter(Boolean)
      .map(norm);
    base44.entities.RiskRegister.list()
      .then((all) =>
        setRegisterRisks(
          all
            .filter((r) => r.status !== "closed")
            .filter(
              (r) =>
                !r.applicable_roles?.length ||
                r.applicable_roles.some((x) => roles.includes(norm(x))),
            )
            .slice(0, 10),
        ),
      )
      .catch(() => {});
  }, [employee?.job_title, template]);

  // Drivers: the truck assigned to them
  useEffect(() => {
    const id = driver?.assigned_truck_id || shift?.truck_id;
    if (!template?.askWeather || !id) return;
    base44.entities.Truck.get(id).then(setTruck).catch(() => {});
  }, [driver?.assigned_truck_id, shift?.truck_id, template]);

  const result = useMemo(
    () => scoreAssessment(template, answers, weather),
    [template, answers, weather],
  );
  const unanswered = template.checks.filter((c) => !answers[c.id]).length;
  const unacknowledged = registerRisks.filter((r) => !acknowledged[r.id]).length;
  const needsMitigation = result.unsafe.length > 0 && !mitigation.trim();

  const submit = async () => {
    const problems = [];
    if (unanswered) problems.push(`Answer all questions (${unanswered} left)`);
    if (unacknowledged) problems.push("Tick every known risk to confirm you have read it");
    if (needsMitigation) problems.push("Say what you will do about the \"No\" answers");
    if (newRisk && !newRiskText.trim()) problems.push("Describe the new risk");
    if (signature.trim().length < 2) problems.push("Sign by typing your full name");
    if (!declared) problems.push("Tick the declaration");
    if (problems.length) {
      toast({ title: "Assessment not complete", description: problems.join(" · "), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const checklist = template.checks.map((c) => ({
        id: c.id,
        question: c.text,
        answer: answers[c.id],
        safe: answers[c.id] === "na" || answers[c.id] === c.safe,
        critical: !!c.critical,
      }));
      const unsafeText = result.unsafe.map((c) => `✗ ${c.text}`).join("\n");
      const rec = await base44.entities.ShiftRiskAssessment.create({
        driver_id: String(driver?.id || employee?.id),
        driver_name: name,
        employee_id: employee?.id ? String(employee.id) : null,
        department: employee?.department || (driver ? "Transport" : null),
        job_title: employee?.job_title || (driver ? "Driver" : null),
        shift_log_id: String(shift.id),
        assessment_type: template.key,
        shift_date: localDate(),
        truck_id: truck?.id || null,
        truck_registration: truck?.registration_number || null,
        combination_type: truck?.combination_type || null,
        weather_conditions: template.askWeather ? weather : null,
        route_familiar: answers.route_known ? answers.route_known === "yes" : null,
        rest_adequate: answers.rested === "yes",
        hazards_identified: [hazards.trim(), unsafeText].filter(Boolean).join("\n"),
        risk_level: result.level,
        mitigation_actions: mitigation.trim(),
        signature_name: signature.trim(),
        new_risk_flagged: newRisk,
        new_risk_description: newRisk ? newRiskText.trim() : "",
        checklist_data: [
          ...checklist,
          ...registerRisks.map((r) => ({
            id: `register_${r.id}`,
            question: `Known risk acknowledged: ${r.risk_description}`,
            answer: "acknowledged",
            safe: true,
          })),
        ],
        stop_work: result.stopWork,
      });
      toast({
        title: result.stopWork ? "Assessment recorded — STOP WORK" : "Shift risk assessment submitted",
        description: `Risk level: ${result.level.toUpperCase()}`,
        variant: result.stopWork ? "destructive" : undefined,
      });
      onSubmitted?.(rec);
    } catch (e) {
      toast({ title: "Could not submit", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const rating = RISK_RATINGS[result.level];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto max-w-xl space-y-4 p-4 pb-16">
        <div className="flex items-center justify-between">
          <BrandLogo size={28} withText />
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onSignOut}>
            <LogOut size={14} /> Clock out
          </Button>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-brand-navy">
              <ShieldAlert size={20} />
              <h1 className="font-display text-lg font-bold">{template.title}</h1>
            </div>
            <p className="text-xs text-muted-foreground">{template.subtitle}</p>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-semibold text-brand-navy">{name}</p>
              <p className="text-xs text-muted-foreground">
                {[employee?.job_title || (driver ? "Driver" : null), employee?.department]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
                <CheckCircle2 size={12} /> Clocked in at {fmtTime(shift?.clock_in)}
              </p>
              {truck && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <TruckIcon size={12} /> {truck.registration_number}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Complete this assessment before you start work. It goes to SHERQ.
            </p>
          </CardContent>
        </Card>

        {registerRisks.length > 0 && (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Known risks for your job — tick each one you have read
              </p>
              {registerRisks.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-start gap-2 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={!!acknowledged[r.id]}
                    onCheckedChange={(v) => setAcknowledged((p) => ({ ...p, [r.id]: !!v }))}
                  />
                  <span>
                    {r.risk_description}
                    {r.control_measures && (
                      <span className="block text-xs text-muted-foreground">Control: {r.control_measures}</span>
                    )}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-3 p-4">
            {template.askWeather && (
              <div className="space-y-1.5">
                <Label>Weather conditions</Label>
                <Select value={weather} onValueChange={setWeather}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_OPTIONS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {template.checks.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  answers[c.id] && answers[c.id] !== "na" && answers[c.id] !== c.safe
                    ? "border-rose-200 bg-rose-50/60"
                    : "border-border/60"
                }`}
              >
                <p className="flex-1 text-sm">
                  <span className="mr-1 text-muted-foreground">{i + 1}.</span>
                  {c.text}
                  {c.critical && <span className="ml-1 text-[10px] font-bold text-rose-600">CRITICAL</span>}
                </p>
                <AnswerButtons
                  check={c}
                  value={answers[c.id]}
                  onChange={(v) => setAnswers((p) => ({ ...p, [c.id]: v }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1.5">
              <Label>Other hazards you can see today</Label>
              <Textarea rows={2} value={hazards} onChange={(e) => setHazards(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>
                What will you do to stay safe?
                {result.unsafe.length > 0 && <span className="text-rose-600"> (required — you answered "No")</span>}
              </Label>
              <Textarea rows={2} value={mitigation} onChange={(e) => setMitigation(e.target.value)} />
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
                  <Flag size={14} /> New risk not in the register?
                </span>
                <Switch checked={newRisk} onCheckedChange={setNewRisk} />
              </label>
              {newRisk && (
                <Textarea
                  className="mt-2"
                  rows={2}
                  value={newRiskText}
                  onChange={(e) => setNewRiskText(e.target.value)}
                  placeholder="Describe the new risk for SHERQ to review…"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risk level</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${rating?.color || ""}`}>
                {result.level.toUpperCase()}
              </span>
            </div>
            {result.stopWork && (
              <p className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">
                A critical check failed. After you submit, do not start work — report to your supervisor.
              </p>
            )}
            <div className="space-y-1.5">
              <Label>Sign (type your full name)</Label>
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder={name} />
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
              <Checkbox className="mt-0.5" checked={declared} onCheckedChange={(v) => setDeclared(!!v)} />
              I confirm that my answers are true and that I will stop work and report any change in conditions.
            </label>
            <Button
              onClick={submit}
              disabled={saving}
              className="w-full gap-2 bg-brand-navy hover:bg-brand-navy/90"
            >
              <ShieldAlert size={16} /> {saving ? "Submitting…" : "Submit and start work"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
