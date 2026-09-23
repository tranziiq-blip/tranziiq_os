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
export const supabase = createClient(
  supabaseUrl || "https://missing-env-var.invalid",
  supabaseAnonKey || "missing-env-var",
);

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
  Tyre: "tyre",
  User: "profiles", // Base44's User entity maps to our profiles table VFL: 'vfl',
  Weighbill: "weighbill",
  AbnormalLoadPermit: "abnormal_load_permit",
  BankTransaction: "bank_transaction",
  BreakdownReport: "breakdown_report",
};

// ---------------------------------------------------------------
// Generic entity CRUD factory — mimics Base44's per-entity methods
// ---------------------------------------------------------------
function makeEntityClient(table) {
  return {
    // base44.entities.X.list() -> newest first, matches typical Base44 default
    async list(sort = "-created_at") {
      let query = supabase.from(table).select("*");
      const desc = sort.startsWith("-");
      const col = desc ? sort.slice(1) : sort;
      query = query.order(col, { ascending: !desc });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    // base44.entities.X.filter({ field: value, ... })
    async filter(criteria = {}, sort = "-created_at") {
      let query = supabase.from(table).select("*");
      for (const [key, value] of Object.entries(criteria)) {
        query = query.eq(key, value);
      }
      const desc = sort.startsWith("-");
      const col = desc ? sort.slice(1) : sort;
      query = query.order(col, { ascending: !desc });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
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
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    return { ...user, ...profile };
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
      options: metadata ? { data: metadata } : undefined,
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
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw error;
  },

  setToken(_token) {
    // Supabase manages its own session/token storage internally via
    // supabase-js — this is a no-op kept only so existing call sites
    // don't break. Safe to leave as-is.
  },

  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/ResetPassword`,
    });
    if (error) throw error;
  },

  async resetPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
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
    async UploadFile({ file }) {
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage
        .from("uploads")
        .upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      return { file_url: data.publicUrl };
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

export const base44 = {
  entities,
  auth,
  integrations,
  functions: functionsApi,
};
