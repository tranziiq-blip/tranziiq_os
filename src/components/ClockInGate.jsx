// Sign in = clock in. Sign out = clock out.
//
// Wraps every signed-in page. For an employee it:
//   1. finds THEIR OWN employee / driver record from their login (never a
//      list to choose from — nobody can open another person's profile),
//   2. opens a shift in HR → Time & Attendance (sign-in time = clock-in),
//   3. makes them complete the shift risk assessment for their department
//      before any page opens (saved to SHERQ → Shift Risk Assessments).
// Signing out closes the shift (see base44.auth.logout).
//
// The company owner (admin login with no employee record), clients and
// clearing agents go straight in.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44, supabase } from "@/api/base44Client";
import { opsSettings } from "@/lib/opsSettings";
import { templateFor } from "@/lib/shiftRiskTemplates";
import { ShiftSessionContext } from "@/lib/shiftSession";
import ShiftRiskAssessmentForm from "@/components/shift/ShiftRiskAssessmentForm";
import BrandLogo from "@/components/BrandLogo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserX, AlertTriangle, LogOut, RefreshCw, OctagonAlert } from "lucide-react";

const EXEMPT_ROLES = ["client", "clearing_agent"];
const INACTIVE = ["terminated", "resigned", "suspended"];
const BLOCKED = /trial has ended|pilot project has ended|account is suspended/i;

// One clock-in per user at a time, even if the gate mounts twice
// (StrictMode, fast route changes).
const inflight = new Map();

async function safeGet(entity, id) {
  if (!id) return null;
  try {
    return await base44.entities[entity].get(id);
  } catch {
    return null;
  }
}

async function findMyEmployee(user) {
  const linked = await safeGet("Employee", user.linked_employee_id);
  if (linked) return linked;
  // Not linked yet: match on the login email only (the person's own email).
  const email = String(user.email || "").trim().toLowerCase();
  if (!email) return null;
  try {
    const { data } = await supabase
      .from("employee")
      .select("*")
      .ilike("email", email)
      .limit(2);
    return data?.length === 1 ? data[0] : null;
  } catch {
    return null;
  }
}

async function openOrResumeShift({ employee, driver, maxShiftHours }) {
  const personId = String(driver?.id || employee?.id);
  const ids = [employee?.id, driver?.id].filter(Boolean).map(String);
  const list = ids.join(",");

  const { data: open, error } = await supabase
    .from("shift_log")
    .select("*")
    .eq("status", "active")
    .or(`employee_id.in.(${list}),driver_id.in.(${list})`)
    .order("clock_in", { ascending: false });
  if (error) throw error;

  // A shift left open longer than the maximum shift (+2h grace) means the
  // person never signed out. Close it as a missed clock-out for HR to fix.
  const staleMs = (Number(maxShiftHours) || 14) * 3600000 + 2 * 3600000;
  const now = Date.now();
  let current = null;
  for (const s of open || []) {
    const age = now - new Date(s.clock_in).getTime();
    if (!current && age < staleMs) {
      current = s;
      continue;
    }
    await base44.entities.ShiftLog.update(s.id, {
      status: "ended",
      clock_out: age < staleMs ? new Date().toISOString() : null,
      clock_out_method: age < staleMs ? "duplicate" : "missed",
    });
  }
  if (current) return current;

  return base44.entities.ShiftLog.create({
    driver_id: personId,
    driver_name: employee?.full_name || driver?.full_name,
    employee_id: employee?.id ? String(employee.id) : null,
    department: employee?.department || (driver ? "Transport" : null),
    job_title: employee?.job_title || (driver ? "Driver" : null),
    truck_id: driver?.assigned_truck_id || null,
    clock_in: new Date().toISOString(),
    clock_in_method: "login",
    status: "active",
    km_driven: 0,
    rest_minutes: 0,
    rests_taken: 0,
    fatigue_violations: 0,
  });
}

// Returns this shift's risk assessment, or null if not done yet
async function findAssessment(shift, ids) {
  const { data: byShift } = await supabase
    .from("shift_risk_assessment")
    .select("id, stop_work")
    .eq("shift_log_id", String(shift.id))
    .limit(1);
  if (byShift?.length) return byShift[0];
  // Shifts opened before this update: accept an assessment made after clock-in
  const { data: legacy } = await supabase
    .from("shift_risk_assessment")
    .select("id, stop_work")
    .in("driver_id", ids)
    .gte("created_at", shift.clock_in)
    .limit(1);
  return legacy?.[0] || null;
}

const clearedKey = (shiftId) => `tranziiq_stop_cleared_${shiftId}`;

export default function ClockInGate() {
  const { user, logout } = useAuth();
  const [phase, setPhase] = useState("loading");
  // loading | exempt | unlinked | inactive | error | assess | stop | ready
  const [employee, setEmployee] = useState(null);
  const [driver, setDriver] = useState(null);
  const [shift, setShift] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const startedFor = useRef(null);

  const start = useCallback(async () => {
    if (!user?.id) return;
    setPhase("loading");
    setErrorMsg("");
    if (EXEMPT_ROLES.includes(user.role)) {
      setPhase("exempt");
      return;
    }
    try {
      const emp = await findMyEmployee(user);
      const drv = await safeGet("Driver", user.linked_driver_id || emp?.driver_id);
      setEmployee(emp);
      setDriver(drv);

      if (!emp && !drv) {
        // The owner / admin account with no staff record goes straight in
        setPhase(user.role === "admin" ? "exempt" : "unlinked");
        return;
      }
      if (emp && INACTIVE.includes(emp.status)) {
        setPhase("inactive");
        return;
      }

      let settings = opsSettings(null);
      try {
        const cp = await base44.entities.CompanyProfile.list();
        settings = opsSettings(cp[0]);
      } catch {
        /* defaults */
      }

      if (!inflight.has(user.id)) {
        inflight.set(
          user.id,
          openOrResumeShift({
            employee: emp,
            driver: drv,
            maxShiftHours: settings.max_shift_hours,
          }).finally(() => setTimeout(() => inflight.delete(user.id), 3000)),
        );
      }
      const s = await inflight.get(user.id);
      setShift(s);

      const ids = [emp?.id, drv?.id].filter(Boolean).map(String);
      const done = await findAssessment(s, ids);
      if (!done) setPhase("assess");
      else if (done.stop_work && !localStorage.getItem(clearedKey(s.id))) setPhase("stop");
      else setPhase("ready");
    } catch (e) {
      if (BLOCKED.test(e?.message || "")) {
        // Company is read-only (trial ended): don't lock staff out
        setPhase("exempt");
        return;
      }
      setErrorMsg(e?.message || "Could not clock you in");
      setPhase("error");
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id || startedFor.current === user.id) return;
    startedFor.current = user.id;
    start();
  }, [user?.id, start]);

  const signOut = useCallback(async () => {
    await logout(true); // clocks out, then signs out
  }, [logout]);

  const template = useMemo(
    () => (employee || driver ? templateFor(employee, driver) : null),
    [employee, driver],
  );

  const ctx = useMemo(
    () => ({
      phase,
      employee,
      driver,
      shift,
      template,
      exempt: phase === "exempt",
      refresh: start,
      signOut,
    }),
    [phase, employee, driver, shift, template, start, signOut],
  );

  let content;
  if (phase === "ready" || phase === "exempt") {
    content = <Outlet />;
  } else if (phase === "assess") {
    content = (
      <ShiftRiskAssessmentForm
        employee={employee}
        driver={driver}
        shift={shift}
        template={template}
        onSignOut={signOut}
        onSubmitted={(rec) => setPhase(rec.stop_work ? "stop" : "ready")}
      />
    );
  } else {
    content = (
      <GateScreen
        phase={phase}
        errorMsg={errorMsg}
        employee={employee}
        onRetry={start}
        onContinue={() => {
          if (shift) localStorage.setItem(clearedKey(shift.id), new Date().toISOString());
          setPhase("ready");
        }}
        onSignOut={signOut}
      />
    );
  }

  return (
    <ShiftSessionContext.Provider value={ctx}>{content}</ShiftSessionContext.Provider>
  );
}

function GateScreen({ phase, errorMsg, employee, onRetry, onContinue, onSignOut }) {
  if (phase === "loading") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
        <p className="text-sm text-muted-foreground">Clocking you in…</p>
      </div>
    );
  }

  const screens = {
    unlinked: {
      icon: UserX,
      tone: "text-amber-600",
      title: "Your login is not linked to an employee profile",
      body: "For security you can only open your own profile. Ask your administrator to link your login to your employee record in Admin → Users, then sign in again.",
    },
    inactive: {
      icon: UserX,
      tone: "text-rose-600",
      title: "Your employee profile is not active",
      body: `Your HR status is "${employee?.status}". Please speak to HR before starting work.`,
    },
    error: {
      icon: AlertTriangle,
      tone: "text-rose-600",
      title: "We couldn't clock you in",
      body: errorMsg,
    },
    stop: {
      icon: OctagonAlert,
      tone: "text-rose-600",
      title: "STOP — do not start work",
      body: "Your shift risk assessment is CRITICAL and has been recorded in SHERQ. Report to your supervisor now. Only continue once your supervisor has cleared you to work.",
    },
  };
  const s = screens[phase] || screens.error;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/60 shadow-xl">
          <CardContent className="space-y-4 p-6 text-center">
            <BrandLogo size={32} withText />
            <s.icon className={`mx-auto ${s.tone}`} size={40} />
            <h1 className="font-display text-lg font-bold text-brand-navy">{s.title}</h1>
            <p className="text-sm text-muted-foreground">{s.body}</p>
            <div className="grid gap-2">
              {phase === "error" && (
                <Button onClick={onRetry} className="gap-2 bg-brand-navy hover:bg-brand-navy/90">
                  <RefreshCw size={16} /> Try again
                </Button>
              )}
              {phase === "stop" && (
                <Button onClick={onContinue} className="bg-brand-navy hover:bg-brand-navy/90">
                  My supervisor has cleared me — continue
                </Button>
              )}
              <Button variant="outline" onClick={onSignOut} className="gap-2">
                <LogOut size={16} /> {phase === "unlinked" || phase === "inactive" ? "Sign out" : "Clock out & sign out"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
