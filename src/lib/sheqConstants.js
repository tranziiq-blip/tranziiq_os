export const DEPARTMENTS = [
  "Production",
  "Engineering",
  "Transport",
  "SHERQ",
  "Stores",
  "HR",
  "Finance",
  "Admin",
];

export const JOB_ROLES = [
  "Driver",
  "Mechanic",
  "Storekeeper",
  "Forklift  Operator",
  "Safety Officer",
  "Fleet Manager",
  "Dispatcher",
  "Administrator",
  "Workshop Supervisor",
];

export const RISK_CATEGORIES = [
  { key: "safety", label: "Safety", color: "bg-rose-100 text-rose-700" },
  { key: "health", label: "Health", color: "bg-amber-100 text-amber-700" },
  {
    key: "environment",
    label: "Environment",
    color: "bg-emerald-100  text-emerald-700",
  },
  { key: "quality", label: "Quality", color: "bg-blue-100 text-blue-700" },
  {
    key: "operational",
    label: "Operational",
    color: "bg-violet-100  text-violet-700",
  },
];

export const RISK_RATINGS = {
  low: { label: "Low", color: "bg-emerald-100 text-emerald-700", score: 1 },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700", score: 2 },
  high: { label: "High", color: "bg-orange-100 text-orange-700", score: 3 },
  critical: { label: "Critical", color: "bg-red-100 text-red-700", score: 4 },
};

export const LIKELIHOOD_LEVELS = [
  { key: "rare", label: "Rare", score: 1 },
  { key: "unlikely", label: "Unlikely", score: 2 },
  { key: "possible", label: "Possible", score: 3 },
  { key: "likely", label: "Likely", score: 4 },
  { key: "almost_certain", label: "Almost Certain", score: 5 },
];

export const IMPACT_LEVELS = [
  { key: "insignificant", label: "Insignificant", score: 1 },
  { key: "minor", label: "Minor", score: 2 },
  { key: "moderate", label: "Moderate", score: 3 },
  { key: "major", label: "Major", score: 4 },
  { key: "catastrophic", label: "Catastrophic", score: 5 },
];

export const RISK_STATUS = {
  open: { label: "Open", color: "bg-rose-100 text-rose-700" },
  controlled: { label: "Controlled", color: "bg-amber-100 text-amber-700" },
  monitoring: { label: "Monitoring", color: "bg-sky-100 text-sky-700" },
  closed: { label: "Closed", color: "bg-emerald-100 text-emerald-700" },
};

export const VFL_TYPES = {
  safe_act: { label: "Safe Act", color: "bg-emerald-100 text-emerald-700" },
  unsafe_act: { label: "Unsafe Act", color: "bg-rose-100 text-rose-700" },
  safe_condition: { label: "Safe Condition", color: "bg-sky-100 text-sky-700" },
  unsafe_condition: {
    label: "Unsafe Condition",
    color: "bg-amber-100  text-amber-700",
  },
};

export const DOCUMENT_TYPES = {
  policy: { label: "Policy", color: "bg-brand-navy text-white" },
  sop: { label: "SOP", color: "bg-brand-teal text-white" },
  guideline: { label: "Guideline", color: "bg-brand-blue text-white" },
  form: { label: "Form", color: "bg-violet-100 text-violet-700" },
};

export const TBT_STATUS = {
  planned: { label: "Planned", color: "bg-amber-100 text-amber-700" },
  conducted: { label: "Conducted", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-rose-100 text-rose-700" },
};

export const calcInherentRating = (likelihood, impact) => {
  const l = LIKELIHOOD_LEVELS.find((x) => x.key === likelihood)?.score || 3;
  const i = IMPACT_LEVELS.find((x) => x.key === impact)?.score || 3;
  const score = l + i;
  if (score <= 4) return "low";
  if (score <= 7) return "medium";
  if (score <= 9) return "high";
  return "critical";
};
