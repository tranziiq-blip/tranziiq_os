import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { canSeeFinance } from "@/lib/financeAccess";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  RefreshCw,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Gauge,
  DollarSign,
} from "lucide-react";

const PRIO_STYLE = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100  text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};
const LIKELIHOOD_STYLE = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};
const rand = (n) =>
  `R ${Number(n || 0).toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;

function ScoreGauge({ label, score, icon: Icon }) {
  const color =
    score >= 75
      ? "text-emerald-500"
      : score >= 50
        ? "text-amber-500"
        : "text-rose-500";
  const ring = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border  border-border/60 p-4">
      <Icon className="text-muted-foreground" size={18} />
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke={ring}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 201} 201`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-display text-xl font-bold 
${color}`}
          >
            {Math.round(score)}
          </span>
        </div>
      </div>
      <p className="text-center text-xs font-medium  text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const showMoney = canSeeFinance(user);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("generateInsights", {});
      setData(res?.data?.data ?? res?.data ?? null);
    } catch (e) {
      setError(e.message || "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            AI Insights & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Live operational figures · risk forecasting · KPI
            scorecards
          </p>
        </div>
        <Button
          onClick={generate}
          disabled={loading}
          className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
        >
          {loading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {loading ? "Analyzing…" : data ? "Regenerate" : "Generate Insights"}
        </Button>
      </div>

      {loading && !data && (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center justify-center gap-3  py-16">
            <div className="h-10 w-10 border-4 border-muted border-t-brand-teal  rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              Counting your live records…
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="text-rose-500" size={20} />
            <p className="text-sm text-rose-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !data && !error && (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center gap-3  py-16">
            <Sparkles className="text-brand-teal" size={32} />
            <p className="text-sm font-medium text-brand-navy">
              No insights generated yet
            </p>
            <p className="max-w-sm text-center text-xs text-muted-foreground">
              Click "Generate Insights" to run AI analysis across your
              operational data — cost of inefficiency, risk predictions, and
              prioritised recommendations.
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Loads this month", value: data.loads_this_month, to: "/loads" },
              { label: "Cross-border loads awaiting clearance", value: data.cross_border_loads_pending_clearance, to: "/weighbill", warn: data.cross_border_loads_pending_clearance > 0 },
              { label: "Services due in 30 days", value: data.maintenance_due_30_days, to: "/engineering", warn: data.maintenance_due_30_days > 0 },
              { label: "Compliance documents expiring in 30 days", value: data.compliance_docs_expiring_30_days, to: "/compliance", warn: data.compliance_docs_expiring_30_days > 0 },
              ...(showMoney
                ? [
                    { label: "Overdue invoices", value: `${data.overdue_invoices_count || 0} · ${rand(data.overdue_invoices_total)}`, to: "/finance", warn: data.overdue_invoices_count > 0 },
                    { label: "Fuel spend this month", value: rand(data.fuel_spend_this_month), to: "/finance" },
                  ]
                : []),
            ].map((m) => (
              <Link key={m.label} to={m.to}>
                <Card className={`h-full border-border/60 shadow-sm transition hover:shadow-md ${m.warn ? "border-amber-300 bg-amber-50/40" : ""}`}>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                    <p className={`mt-2 font-display text-2xl font-bold ${m.warn ? "text-amber-700" : "text-brand-navy"}`}>
                      {m.value ?? 0}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Calculated from your live records
            {data.generated_at ? ` at ${new Date(data.generated_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}` : ""}.
            Figures are counted directly from your data, never estimated.
          </p>
        </div>
      )}
    </div>
  );
}
