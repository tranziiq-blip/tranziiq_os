import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, FlaskConical, Lock } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { accessStatus, splitCountdown } from "@/lib/accessStatus";

const pad = (n) => String(n).padStart(2, "0");

// Live countdown for free trials and pilot projects, shown on every page.
export default function TrialBanner({ compact = false }) {
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());
  const org = user?.organization;
  const st = accessStatus(org, now);

  useEffect(() => {
    if (st.kind !== "trial" && st.kind !== "pilot") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [st.kind]);

  if (!org || !["trial", "pilot", "suspended"].includes(st.kind)) return null;
  const isAdmin = user?.role === "admin";

  if (st.kind === "suspended" || st.expired) {
    const msg =
      st.kind === "pilot"
        ? "Your pilot project has ended."
        : st.kind === "suspended"
          ? "This account is suspended."
          : "Your 14-day free trial has ended.";
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 bg-rose-600 px-4 py-2.5 text-sm text-white">
        <span className="flex items-center gap-2">
          <Lock size={16} className="shrink-0" />
          <span>
            <strong>{msg}</strong> Your data is safe and read-only.
          </span>
        </span>
        {st.kind === "trial" && isAdmin ? (
          <Link to="/billing" className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-rose-700">
            Choose a plan
          </Link>
        ) : (
          <a href="mailto:tranziiq@gmail.com" className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-rose-700">
            Contact TranziIQ
          </a>
        )}
      </div>
    );
  }

  const { days, hours, minutes, seconds } = splitCountdown(st.msLeft);
  const urgent = st.kind === "trial" && st.daysLeft <= 3;
  const pct = st.totalDays ? Math.min(100, ((st.dayNumber || 0) / st.totalDays) * 100) : 0;
  const tone =
    st.kind === "pilot"
      ? "bg-brand-navy"
      : urgent
        ? "bg-amber-600"
        : "bg-brand-teal";

  return (
    <div className={`${tone} px-4 py-2 text-white`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-sm">
        <span className="flex items-center gap-2">
          {st.kind === "pilot" ? (
            <FlaskConical size={16} className="shrink-0" />
          ) : (
            <Clock size={16} className="shrink-0" />
          )}
          <strong>{st.kind === "pilot" ? "Pilot project" : "Free trial"}</strong>
          {!compact && st.dayNumber && (
            <span className="text-white/80">
              · Day {st.dayNumber} of {st.totalDays}
            </span>
          )}
        </span>
        <span className="flex items-center gap-3">
          <span className="font-mono tabular-nums" aria-label={`${days} days ${hours} hours ${minutes} minutes left`}>
            {days}d {pad(hours)}h {pad(minutes)}m{compact ? "" : ` ${pad(seconds)}s`} left
          </span>
          {st.kind === "trial" && isAdmin && !compact && (
            <Link to="/billing" className="rounded-md bg-white/95 px-3 py-1 text-xs font-semibold text-brand-navy hover:bg-white">
              Choose a plan
            </Link>
          )}
        </span>
      </div>
      <div className="mt-1.5 h-1 w-full rounded-full bg-white/25" aria-hidden="true">
        <div className="h-1 rounded-full bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
