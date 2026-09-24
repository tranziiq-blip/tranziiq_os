// src/api/base44Client.js
//
// DROP-IN REPLACEMENT for the Base44 SDK client.
// Exposes the same shape the app already calls everywhere:
//   base44.entities.<Entity>.list/filter/create/update/delete
//   base44.auth.*
//   base44.integrations.Core.UploadFile
//   base44.functions.invoke
//
// Because it matches the original interface, you should NOT need to touch
// the 140+ component files that do `import { base44 } from "@/api/base44Client"`.
//
// Setup:
//   npm install @supabase/supabase-js
//   Add to your .env (Vercel env vars too):
//     VITE_SUPABASE_URL=https://xxxx.supabase.co
//     VITE_SUPABASE_ANON_KEY=xxxx
//
import { createClient } from "@supabase/supabase-js";
import { safeFileName, syncFileAuth } from "@/lib/secureFiles";
import { compressImage } from "@/lib/imageCompress";
import { NON_TEXT_COLUMNS } from "@/lib/dbColumnTypes";

// Keep only "https://<ref>.supabase.co". A URL pasted with a path such as
// "/rest/v1/" makes every sign-up fail with "Invalid path specified in request URL".
const supabaseUrl = (() => {
  const raw = (import.meta.env.VITE_SUPABASE_URL || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
})();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// Placeholders stop createClient throwing at import time when env vars are
// missing, so main.jsx can show a clear "missing environment variables" screen.
// ---- Password recovery lock ----
// A reset link signs the user in. Until they set a new password they are
// kept on the reset page (in every tab), so the link can't be used to get
// into the app without choosing a password.
const RECOVERY_KEY = "tranziiq_password_recovery";
if (typeof window !== "undefined") {
  const where = window.location.hash + window.location.search;
  if (/type=recovery|[?&]recovery=1/.test(where) && !/error=/.test(where)) {
    localStorage.setItem(RECOVERY_KEY, "1");
  }
}
export const isPasswordRecovery = () =>
  typeof window !== "undefined" && localStorage.getItem(RECOVERY_KEY) === "1";
export const clearPasswordRecovery = () => localStorage.removeItem(RECOVERY_KEY);

export const supabase = createClient(
  supabaseUrl || "https://missing-env-var.invalid",
  supabaseAnonKey || "missing-env-var",
);

supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    localStorage.setItem(RECOVERY_KEY, "1");
    if (window.location.pathname !== "/reset-password") {
      window.location.replace("/reset-password");
    }
  }
  if (event === "SIGNED_OUT") clearPasswordRecovery();
});

// Keep the file service worker's token in step with the session
supabase.auth.onAuthStateChange((_event, session) => {
  syncFileAuth(session, supabaseUrl, supabaseAnonKey);
});

let cachedOrgId = null;
async function currentOrgId() {
  if (cachedOrgId) return cachedOrgId;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in to upload files");
  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", session.user.id)
    .single();
  if (error || !data?.org_id) throw new Error("Your account is not linked to a company");
  cachedOrgId = data.org_id;
  return cachedOrgId;
}
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT" || event === "SIGNED_IN") cachedOrgId = null;
});

// ---------------------------------------------------------------
// Map PascalCase entity names (as used in the app) -> snake_case
// Supabase table names (as created by schema.sql).
// KEEP THIS IN SYNC with table_names.json generated alongside schema.sql.
// ---------------------------------------------------------------
const TABLE_MAP = {
  Budget: "budget",
  BusinessDirectory: "business_directory",
  CargoType: "cargo_type",
  CompanyProfile: "company_profile",
  ComplianceDocument: "compliance_document",
  ComplianceIncident: "compliance_incident",
  ComplianceProfile: "compliance_profile",
  DeliveryNote: "delivery_note",
  DisciplinaryAction: "disciplinary_action",
  Driver: "driver",
  Employee: "employee",
  EmployeeDocument: "employee_document",
  Expense: "expense",
  FinancialDoc: "financial_doc",
  FuelLog: "fuel_log",
  IncidentReport: "incident_report",
  Inspection: "inspection",
  IntegrationConfig: "integration_config",
  Invoice: "invoice",
  JobCard: "job_card",
  LeaveApplication: "leave_application",
  Load: "load",
  MaintenanceSchedule: "maintenance_schedule",
  Part: "part",
  PayrollEntry: "payroll_entry",
  PersonnelCredential: "personnel_credential",
  ReportConfiguration: "report_configuration",
  ReportSnapshot: "report_snapshot",
  RiskRegister: "risk_register",
  RootCauseAnalysis: "root_cause_analysis",
  SafetyDocument: "safety_document",
  Schedule: "schedule",
  ShiftLog: "shift_log",
  ShiftRiskAssessment: "shift_risk_assessment",
  StockMovement: "stock_movement",
  TelematicsReading: "telematics_reading",
  TemperatureExcursion: "temperature_excursion",
  TemperatureReading: "temperature_reading",
  ToolboxTalk: "toolbox_talk",
  Trailer: "trailer",
  TrainingRequirement: "training_requirement",
  TransportManifest: "transport_manifest",
  Truck: "truck",
  Tyre: "tyre",
  User: "profiles", // Base44's User entity maps to our profiles table
  VFL: "v_f_l",
  Weighbill: "weighbill",
  AbnormalLoadPermit: "abnormal_load_permit",
  BankTransaction: "bank_transaction",
  BreakdownReport: "breakdown_report",
};

// ---------------------------------------------------------------
// Generic entity CRUD factory — mimics Base44's per-entity methods
// ---------------------------------------------------------------
// Base44 used created_date / updated_date; our tables use created_at / updated_at.
// Translate both ways so every existing component keeps working unchanged.
const FIELD_ALIASES = { created_date: "created_at", updated_date: "updated_at" };
const NO_UPDATED_AT = new Set(["profiles", "clearance_message", "notifications"]);

const toColumn = (field) => FIELD_ALIASES[field] || field;

function withAliases(row) {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    created_date: row.created_date ?? row.created_at,
    updated_date: row.updated_date ?? row.updated_at,
  };
}

function cleanPayload(payload = {}, table) {
  const types = NON_TEXT_COLUMNS[table] || {};
  const out = {};
  for (const [k, v] of Object.entries(payload || {})) {
    if (k === "created_date" || k === "updated_date" || k === "id") continue;
    const type = types[k];
    if (type && (v === "" || v === undefined)) {
      out[k] = null; // blank date / number / id / list -> empty
    } else if (type === "num" && typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) {
      out[k] = Number(v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

// Base44 accepted Mongo-style filters ({ field: { $lt: x } }); translate them.
function applyCriteria(query, criteria = {}) {
  for (const [key, value] of Object.entries(criteria || {})) {
    const col = toColumn(key);
    if (value === null) query = query.is(col, null);
    else if (Array.isArray(value)) query = query.in(col, value);
    else if (value && typeof value === "object" && !(value instanceof Date)) {
      for (const [op, v] of Object.entries(value)) {
        if (op === "$lt") query = query.lt(col, v);
        else if (op === "$lte") query = query.lte(col, v);
        else if (op === "$gt") query = query.gt(col, v);
        else if (op === "$gte") query = query.gte(col, v);
        else if (op === "$ne") query = v === null ? query.not(col, "is", null) : query.neq(col, v);
        else if (op === "$in") query = query.in(col, v);
        else if (op === "$eq") query = query.eq(col, v);
        else throw new Error(`Unsupported filter operator ${op}`);
      }
    } else query = query.eq(col, value);
  }
  return query;
}

function applySort(query, sort, table) {
  if (!sort || typeof sort !== "string") return query;
  const desc = sort.startsWith("-");
  let col = toColumn(desc ? sort.slice(1) : sort);
  if (col === "updated_at" && NO_UPDATED_AT.has(table)) col = "created_at";
  return query.order(col, { ascending: !desc, nullsFirst: false });
}

// Saves refused because a trial/pilot ended (raised by the database) are
// announced app-wide, so every screen shows the reason even if that screen
// doesn't handle errors itself.
const BLOCKED = /trial has ended|pilot project has ended|account is suspended/i;
function announceWriteError(error) {
  if (typeof window !== "undefined" && BLOCKED.test(error?.message || "")) {
    window.dispatchEvent(new CustomEvent("tranziiq:write-blocked", { detail: error.message }));
    error.handledGlobally = true;
  }
  return error;
}

function makeEntityClient(table) {
  return {
    // base44.entities.X.list(sort?, limit?) -> newest first by default
    async list(sort = "-created_at", limit) {
      let query = applySort(supabase.from(table).select("*"), sort, table);
      if (Number(limit) > 0) query = query.limit(Number(limit));
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(withAliases);
    },

    // base44.entities.X.filter({ field: value, ... }, sort?, limit?)
    async filter(criteria = {}, sort = "-created_at", limit) {
      let query = applyCriteria(supabase.from(table).select("*"), criteria);
      query = applySort(query, sort, table);
      if (Number(limit) > 0) query = query.limit(Number(limit));
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(withAliases);
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return withAliases(data);
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(table)
        .insert(cleanPayload(payload, table))
        .select()
        .single();
      if (error) throw announceWriteError(error);
      return withAliases(data);
    },

    async bulkCreate(rows = []) {
      if (!rows.length) return [];
      const { data, error } = await supabase
        .from(table)
        .insert(rows.map((r) => cleanPayload(r, table)))
        .select();
      if (error) throw announceWriteError(error);
      return (data || []).map(withAliases);
    },

    async update(id, payload) {
      const body = cleanPayload(payload, table);
      if (!NO_UPDATED_AT.has(table)) body.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from(table)
        .update(body)
        .eq("id", id)
        .select()
        .single();
      if (error) throw announceWriteError(error);
      return withAliases(data);
    },

    // updateMany(criteria, { $set: {...} } | {...})
    async updateMany(criteria = {}, changes = {}) {
      const body = cleanPayload(changes.$set || changes, table);
      if (!NO_UPDATED_AT.has(table)) body.updated_at = new Date().toISOString();
      const { data, error } = await applyCriteria(
        supabase.from(table).update(body),
        criteria,
      ).select();
      if (error) throw announceWriteError(error);
      return (data || []).map(withAliases);
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw announceWriteError(error);
      return true;
    },
  };
}

const entities = new Proxy(
  {},
  {
    get(_target, entityName) {
      const table = TABLE_MAP[entityName];
      if (!table) {
        throw new Error(
          `[base44Client] No Supabase table mapped for entity "${String(
            entityName,
          )}". Add it to TABLE_MAP in src/api/base44Client.js.`,
        );
      }
      return makeEntityClient(table);
    },
  },
);

// ---------------------------------------------------------------
// Auth — mirrors base44.auth.* used across AuthContext, Login,
// Register, ForgotPassword, ResetPassword, OAuthConsent.
// ---------------------------------------------------------------
const auth = {
  async me() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    let organization = null;
    if (profile?.org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.org_id)
        .maybeSingle();
      organization = org || null;
    }
    return { ...user, ...(profile || {}), organization };
  },

  async isAuthenticated() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return !!session;
  },

  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async loginWithProvider(provider, returnTo) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider, // 'google'
      options: { redirectTo: returnTo || window.location.origin },
    });
    if (error) throw error;
  },

  async register({ email, password, metadata }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(metadata ? { data: metadata } : {}),
        // The default Supabase email contains a confirmation link, not a code.
        // Send that link back to this site so clicking it signs the user in.
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    if (error) throw error;
    return data;
  },

  // Base44's OTP flow -> Supabase email OTP verification
  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "signup",
    });
    if (error) throw error;
    return { access_token: data.session?.access_token, ...data };
  },

  async resendOtp(email) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) throw error;
  },

  setToken(_token) {
    // Supabase manages its own session/token storage internally via
    // supabase-js — this is a no-op kept only so existing call sites
    // don't break. Safe to leave as-is.
  },

  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?recovery=1`,
    });
    if (error) throw error;
  },

  // Sets the new password for the signed-in recovery session, then signs
  // out every other device that may still be logged in.
  async resetPassword(newPassword) {
    const password =
      typeof newPassword === "object" ? newPassword?.newPassword : newPassword;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    clearPasswordRecovery();
    await supabase.auth.signOut({ scope: "others" }).catch(() => {});
  },

  async cancelPasswordRecovery() {
    clearPasswordRecovery();
    await supabase.auth.signOut();
  },

  async updateMe(payload) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async logout(returnTo) {
    await supabase.auth.signOut();
    if (returnTo) window.location.href = returnTo;
  },

  redirectToLogin(returnTo) {
    window.location.href = `/Login?returnTo=${encodeURIComponent(returnTo || window.location.href)}`;
  },
};

// ---------------------------------------------------------------
// File uploads -> Supabase Storage
// Create a bucket named "uploads" in Supabase dashboard (Storage tab)
// and set it to public (or use signed URLs if it must stay private).
// ---------------------------------------------------------------
const integrations = {
  Core: {
    // Files go into the company's own folder of a private bucket. The
    // returned link only opens for signed-in users of the same company.
    async UploadFile({ file: original }) {
      const file = await compressImage(original);
      const orgId = await currentOrgId();
      const path = `${orgId}/${crypto.randomUUID()}-${safeFileName(file?.name)}`;
      const { error } = await supabase.storage
        .from("uploads")
        .upload(path, file, { contentType: file?.type || undefined });
      if (error) throw error;
      return { file_url: `/files/${path}` };
    },
  },
};

// ---------------------------------------------------------------
// Custom backend functions -> Supabase Edge Functions.
// These 3 functions (sendReportEmail, generateInsights,
// notifyCustomsStatus) contained real business logic on Base44's
// server that wasn't part of the frontend export — you'll need to
// write each one as a Supabase Edge Function separately. This just
// routes the call correctly once you do.
// ---------------------------------------------------------------
const functionsApi = {
  async invoke(name, payload) {
    const { data, error } = await supabase.functions.invoke(name, {
      body: payload,
    });
    if (error) throw error;
    return { data };
  },
};

// Staff invitations. The invited person signs up with the same email and is
// placed in the inviting company automatically (database trigger).
const users = {
  async inviteUser(email, role = "user", extra = {}) {
    const clean = String(email || "").trim().toLowerCase();
    if (!clean) throw new Error("Email required");
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", clean)
      .maybeSingle();
    if (existing) throw new Error("This person already has an account in your company");
    const { data, error } = await supabase
      .from("org_invites")
      .insert({
        email: clean,
        role,
        module_access: extra.module_access?.length ? extra.module_access : null,
        linked_client_name: extra.linked_client_name || null,
        linked_directory_id: extra.linked_directory_id || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async listInvites() {
    const { data, error } = await supabase
      .from("org_invites")
      .select("*")
      .is("accepted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async cancelInvite(id) {
    const { error } = await supabase.from("org_invites").delete().eq("id", id);
    if (error) throw error;
  },
};

export const base44 = {
  entities,
  auth,
  users,
  integrations,
  functions: functionsApi,
};
