import { useState } from "react";
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

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("generateInsights", {});
      setData(res.data);
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
            Predictive cost-of-inefficiency analysis · risk forecasting · KPI
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
              AI is analyzing operational data across all departments…
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
        <div className="space-y-6">
          {/* Cost of inefficiency banner */}
          <Card className="overflow-hidden border-0 gradient-brand text-white  shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl  bg-white/15 backdrop-blur">
                  <TrendingDown className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider  text-white/70">
                    AI-Estimated Cost of Inefficiency
                  </p>
                  <p className="mt-1 font-display text-4xl  font-bold">
                    {rand(data.cost_of_efficiency || data.cost_of_inefficiency)}
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    Estimated Rand value lost today across your operation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inefficiency breakdown */}
          {data.inefficiency_breakdown &&
            data.inefficiency_breakdown.length > 0 && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2  text-base font-semibold">
                    <TrendingDown size={18} className="text-rose-500" />
                    Inefficiency Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {data.inefficiency_breakdown.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border  border-border/50 p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg  bg-rose-50">
                        <span className="text-sm font-bold  text-rose-600">
                          {rand(item.amount).replace("R ", "")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-navy">
                          {item.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          {/* KPI Scorecard */}
          {data.kpi_scorecard && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2  text-base font-semibold">
                  <Gauge size={18} className="text-brand-teal" /> KPI Scorecard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <ScoreGauge
                    label="Fleet Utilization"
                    score={data.kpi_scorecard.fleet_utilization || 0}
                    icon={Gauge}
                  />
                  <ScoreGauge
                    label="On-Time Delivery"
                    score={data.kpi_scorecard.on_time_delivery || 0}
                    icon={DollarSign}
                  />
                  <ScoreGauge
                    label="Cost per KM"
                    score={data.kpi_scorecard.cost_per_km_efficiency || 0}
                    icon={TrendingDown}
                  />
                  <ScoreGauge
                    label="Safety Index"
                    score={data.kpi_scorecard.safety_index || 0}
                    icon={AlertTriangle}
                  />
                </div>
                {data.kpi_scorecard.notes && (
                  <p className="mt-4 rounded-lg bg-muted/50 p-3  text-xs text-muted-foreground">
                    {data.kpi_scorecard.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Predictions */}
            {data.predictions && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2  text-base font-semibold">
                    <AlertTriangle size={18} className="text-amber-500" />
                    Risk Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {data.predictions.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-brand-navy">
                          {p.risk}
                        </p>
                        <Badge
                          className={
                            LIKELIHOOD_STYLE[p.likelihood] || "bg-slate-100"
                          }
                        >
                          {p.likelihood}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.impact}
                      </p>
                      <p className="mt-1 text-xs font-medium text-brand-teal">
                        ⏱ {p.timeframe}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {data.recommendations && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2  text-base font-semibold">
                    <Lightbulb size={18} className="text-brand-blue" />
                    Prioritised Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {data.recommendations.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-brand-navy">
                          {r.action}
                        </p>
                        <Badge
                          className={PRIO_STYLE[r.priority] || "bg-slate-100"}
                        >
                          {r.priority}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          Dept: {r.department}
                        </span>
                        {r.expected_saving > 0 && (
                          <span className="font-semibold  text-emerald-600">
                            Save {rand(r.expected_saving)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
