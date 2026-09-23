// Works out where a company stands: free trial, pilot project, subscribed.
export const TRIAL_DAYS = 14;
export const PILOT_MONTHS = 3;

export function accessStatus(org, now = Date.now()) {
  if (!org) return { kind: "unknown", canWrite: true };
  const status = org.plan_status || "trial";
  if (status === "active" || status === "internal")
    return { kind: status, canWrite: true };
  if (status === "suspended") return { kind: "suspended", canWrite: false };
  const endsAt =
    status === "pilot"
      ? org.pilot_ends_at && new Date(org.pilot_ends_at)
      : org.trial_ends_at && new Date(org.trial_ends_at);
  const msLeft = endsAt ? endsAt.getTime() - now : Infinity;
  const startedAt =
    status === "pilot"
      ? endsAt && new Date(new Date(endsAt).setMonth(endsAt.getMonth() - PILOT_MONTHS))
      : endsAt && new Date(endsAt.getTime() - TRIAL_DAYS * 86400000);
  const totalDays = startedAt && endsAt ? Math.round((endsAt - startedAt) / 86400000) : null;
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
  return {
    kind: status, // "trial" | "pilot"
    endsAt,
    msLeft,
    daysLeft,
    totalDays,
    dayNumber: totalDays ? Math.min(totalDays, Math.max(1, totalDays - daysLeft + 1)) : null,
    expired: msLeft <= 0,
    canWrite: msLeft > 0,
  };
}

export function splitCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}
