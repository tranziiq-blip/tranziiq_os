import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { canSeeFinance } from "@/lib/financeAccess";
import { loadOpsData, analyseOperations, CATEGORIES, formatRand } from "@/lib/opsEngine";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2, ArrowRight, Lightbulb } from "lucide-react";

const SEV = {
  critical: { label: "Critical", dot: "bg-rose-600", chip: "bg-rose-100 text-rose-700" },
  high: { label: "High", dot: "bg-amber-500", chip: "bg-amber-100 text-amber-800" },
  medium: { label: "Medium", dot: "bg-yellow-400", chip: "bg-yellow-100 text-yellow-800" },
  low: { label: "Low", dot: "bg-slate-300", chip: "bg-slate-100 text-slate-600" },
};

export default function Insights() {
  const { user } = useAuth();
  const showMoney = canSeeFinance(user);
  const [ops, setOps] = useState(null);
  const [busy, setBusy] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [aiState, setAiState] = useState("idle"); // idle | loading | done | unavailable
  const [filter, setFilter] = useState("all");

  const run = async () => {
    setBusy(true);
    const d = await loadOpsData();
    setOps(analyseOperations(d));
    setBusy(false);
  };
  useEffect(() => {
    run();
  }, []);

  const findings = ops?.findings || [];
  const shown = useMemo(
    () => (filter === "all" ? findings : findings.filter((x) => x.category === filter)),
    [findings, filter],
  );

  // Top priorities: biggest risks and costs first
  const plan = useMemo(() => findings.slice(0, 5), [findings]);

  const askAI = async () => {
    setAiState("loading");
    try {
      const res = await base44.functions.invoke("generateInsights", {
        mode: "action_plan",
        findings: findings.slice(0, 40).map((x) => ({
          category: CATEGORIES[x.category],
          severity: x.severity,
          problem: x.title,
          detail: x.detail || "",
          estimated_cost_rand: showMoney ? x.cost || 0 : undefined,
          suggested_action: x.action,
        })),
      });
      const body = res?.data?.data ?? res?.data;
      if (body?.plan) {
        setAiPlan(body.plan);
        setAiState("done");
      } else setAiState("unavailable");
    } catch {
      setAiState("unavailable");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-brand-navy">AI Insights</h1>
          <p className="text-sm text-muted-foreground">
            Every inefficiency and risk found in your live records, what it is costing you, and how to fix it
          </p>
        </div>
        <Button variant="outline" onClick={run} disabled={busy} className="gap-2">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Re-check now
        </Button>
      </div>

      {/* Summary */}
      <Card className="overflow-hidden border-0 gradient-brand text-white shadow-lg">
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-white/70">
            {showMoney ? "Estimated cost of current problems" : "Problems needing attention"}
          </p>
          <p className="mt-1 font-display text-4xl font-bold">
            {!ops ? "…" : showMoney ? formatRand(ops.totalCost) : findings.length}
          </p>
          <p className="mt-1 text-sm text-white/80">
            {ops ? `${findings.length} problem(s) found · ${findings.filter((x) => x.severity === "critical").length} critical` : "Analysing…"}
          </p>
          {showMoney && ops && (
            <p className="mt-3 text-xs text-white/70">
              Estimates use your cost settings (Admin → Cost & Risk Settings). Each problem shows how its figure was worked out.
            </p>
          )}
        </CardContent>
      </Card>

      {/* By area */}
      {ops && ops.byCategory.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter("all")} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === "all" ? "border-brand-navy bg-brand-navy text-white" : "border-border bg-card"}`}>
            All ({findings.length})
          </button>
          {ops.byCategory.map((c) => (
            <button key={c.key} onClick={() => setFilter(c.key)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === c.key ? "border-brand-navy bg-brand-navy text-white" : "border-border bg-card"}`}>
              {c.label} ({c.count}){showMoney && c.cost ? ` · ${formatRand(c.cost)}` : ""}
            </button>
          ))}
        </div>
      )}

      {/* Action plan */}
      {plan.length > 0 && (
        <Card className="border-brand-teal/40 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-display text-base font-semibold text-brand-navy">
                <Lightbulb size={18} className="text-brand-teal" /> Do these first
              </p>
              <Button size="sm" onClick={askAI} disabled={aiState === "loading"} className="gap-2 bg-brand-navy hover:bg-brand-navy/90">
                {aiState === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Generate AI action plan
              </Button>
            </div>
            <ol className="mt-3 space-y-2">
              {plan.map((x, i) => (
                <li key={x.id} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">{i + 1}</span>
                  <span>
                    <span className="font-medium text-brand-navy">{x.action}</span>
                    <span className="block text-xs text-muted-foreground">
                      {x.title}{showMoney && x.cost ? ` · saves up to ${formatRand(x.cost)}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            {aiState === "done" && aiPlan && (
              <div className="mt-4 whitespace-pre-line rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">{aiPlan}</div>
            )}
            {aiState === "unavailable" && (
              <p className="mt-3 text-xs text-muted-foreground">
                The AI action plan isn't switched on for your account yet. The priorities above are worked out from your data and your cost settings.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* All problems */}
      {!ops ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : findings.length === 0 ? (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-6 text-center text-sm text-emerald-800">
            No problems found. Fatigue, delays, fleet use, payload, fuel, maintenance, compliance and cash flow are all within your targets.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((x) => (
            <Card key={x.id} className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${SEV[x.severity].dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium text-brand-navy">{x.title}</p>
                      {showMoney && x.cost ? <span className="shrink-0 font-display text-lg font-bold text-rose-700">{formatRand(x.cost)}</span> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${SEV[x.severity].chip}`}>{SEV[x.severity].label}</span>
                      {CATEGORIES[x.category]}
                      {x.detail ? ` · ${x.detail}` : ""}
                    </p>
                    {showMoney && x.costBasis && <p className="mt-1 text-[11px] text-muted-foreground">Estimate: {x.costBasis}</p>}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md bg-brand-teal/5 p-2.5">
                      <p className="text-sm"><span className="font-semibold text-brand-teal">Fix: </span>{x.action}</p>
                      {x.link && (
                        <Link to={x.link} className="flex items-center gap-1 text-xs font-medium text-brand-blue hover:underline">
                          Open <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
