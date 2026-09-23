import {
  PROFILE_TYPES,
  getJurisdiction,
  jurisdictionName,
} from "@/lib/complianceContent";

// ---- Expiry alert engine (reusable): alerts at 30/14/7 days, escalation at 0 ----
export const EXPIRY_LEVELS = [
  {
    key: "valid",
    minDays: 31,
    label: "Valid",
    color: "bg-emerald-100  text-emerald-700",
  },
  {
    key: "30d",
    minDays: 15,
    label: "30-day alert",
    color: "bg-sky-100  text-sky-700",
  },
  {
    key: "14d",
    minDays: 8,
    label: "14-day alert",
    color: "bg-amber-100  text-amber-700",
  },
  {
    key: "7d",
    minDays: 1,
    label: "7-day alert",
    color: "bg-orange-100  text-orange-700",
  },
  {
    key: "expired",
    minDays: -Infinity,
    label: "EXPIRED — escalated to  compliance officer",
    color: "bg-rose-100 text-rose-700",
  },
];

export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.setHours(23, 59, 59, 999) - Date.now()) / 86400000);
};

export const expiryLevel = (doc) => {
  if (!doc || !doc.expiry_date) return EXPIRY_LEVELS[0];
  const d = daysUntil(doc.expiry_date);
  if (d === null) return EXPIRY_LEVELS[0];
  return EXPIRY_LEVELS.find((l) => d >= l.minDays) || EXPIRY_LEVELS[4];
};

export const isExpired = (doc) => {
  const d = daysUntil(doc?.expiry_date);
  return d !== null && d < 0;
};

// ---- Checklist builders (content as data) ----
export const buildDocumentChecklist = (
  profileType,
  jurisdictions = [],
  crossBorder = false,
) => {
  const content = PROFILE_TYPES[profileType];
  if (!content) return [];
  const items = [];
  content.documents.forEach((d) => {
    if (d.crossBorderOnly && !crossBorder) return;
    if (d.perJurisdiction && jurisdictions.length > 0) {
      jurisdictions.forEach((j) =>
        items.push({
          ...d,
          id: `${d.id}::${j}`,
          label: `${d.label}`,
          jurisdiction: j,
          jurisdictionName: jurisdictionName(j),
        }),
      );
    } else {
      items.push({ ...d, jurisdiction: null, jurisdictionName: null });
    }
  });
  return items;
};

export const buildDviChecklist = (profileType, crossBorder = false) =>
  (PROFILE_TYPES[profileType]?.dvi || []).filter(
    (i) => !i.crossBorderOnly || crossBorder,
  );

// ---- Dispatch gate (reusable rule engine) ----
export const parseChecklist = (data) =>
  Array.isArray(data)
    ? data
        .map((s) => {
          try {
            return JSON.parse(s);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    : [];

export const BLOCKING_STATUSES = ["missing", "expired", "failed"];

export const evaluateGate = (documentsData) => {
  const items = parseChecklist(documentsData);
  const failures = items.filter(
    (i) => !i.required === false && BLOCKING_STATUSES.includes(i.status),
  );
  return { blocked: failures.length > 0, failures, total: items.length };
};

export const gateSummary = (profile) => {
  if (!profile) return { blocked: false, failures: [], total: 0 };
  return evaluateGate(profile.documents_data);
};

// ---- Register numbering (tenant SHERQ mapping supported via sheq_reference field) ----
export const registerNumber = (existingCount) =>
  `CC-INC-${new Date().getFullYear()}-${String(existingCount + 1).padStart(
    4,
    "0",
  )}`;

// ---- Jurisdiction rule helpers ----
export const jurisdictionRule = (code, profileType) => {
  const j = getJurisdiction(code);
  return j?.rules?.[profileType] || null;
};

export const jurisdictionSummary = (jurisdictions = []) =>
  jurisdictions.map(jurisdictionName).join(" · ");

// ---- Temperature range helper ----
export const tempInRange = (temp, profile) =>
  temp != null &&
  (profile.temp_min_c == null || temp >= profile.temp_min_c) &&
  (profile.temp_max_c == null || temp <= profile.temp_max_c);
