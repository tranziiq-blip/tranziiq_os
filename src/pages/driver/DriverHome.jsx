import { useState, useEffect } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  AlertTriangle,
  Package,
  CheckCircle2,
  Timer,
  Coffee,
  ClipboardCheck,
  ShieldAlert,
  Truck as TruckIcon,
  ChevronRight,
} from "lucide-react";
import RiskAssessmentDialog from "@/components/driver/RiskAssessmentDialog";
import GpsTracker from "@/components/driver/GpsTracker";
import { opsSettings } from "@/lib/opsSettings";


function fmt(ms) {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(
    2,
    "0",
  )}:${String(s).padStart(2, "0")}`;
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export default function DriverHome() {
  const { driver } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  // Fatigue rules come from the company's Cost & Risk Settings
  const [fatigue, setFatigue] = useState(opsSettings(null));
  useEffect(() => {
    base44.entities.CompanyProfile.list()
      .then((l) => setFatigue(opsSettings(l[0])))
      .catch(() => {});
  }, []);
  const REST_INTERVAL_MS = fatigue.rest_interval_hours * 3600000;
  const SHIFT_LIMIT_MS = fatigue.max_shift_hours * 3600000;
  const [shift, setShift] = useState(null);
  const [activeLoad, setActiveLoad] = useState(null);
  const [inspectionDone, setInspectionDone] = useState(false);
  const [riskDone, setRiskDone] = useState(false);
  const [truck, setTruck] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [riskOpen, setRiskOpen] = useState(false);

  const loadData = async () => {
    if (!driver) return;
    const [shifts, loads, inspections, risks] = await Promise.all([
      base44.entities.ShiftLog.filter(
        { driver_id: driver.id, status: "active" },
        "-clock_in",
        1,
      ),
      base44.entities.Load.filter(
        { driver_id: driver.id },
        "-created_date",
        10,
      ),
      base44.entities.Inspection.filter(
        { driver_id: driver.id },
        "-created_date",
        1,
      ),
      base44.entities.ShiftRiskAssessment.filter(
        { driver_id: driver.id },
        "-created_date",
        1,
      ),
    ]);
    setShift(shifts[0] || null);
    const inFlight = loads.find(
      (l) => !["load_completed", "completed", "cancelled"].includes(l.status),
    );
    setActiveLoad(inFlight || null);
    setInspectionDone(
      inspections[0] &&
        isToday(inspections[0].created_date) &&
        inspections[0].status === "pass",
    );
    const riskAlreadyDone = !!(risks[0] && isToday(risks[0].created_date));
    setRiskDone(riskAlreadyDone);
    // Coming straight from a passed inspection: use that truck
    const handoff = location.state?.openRisk ? location.state : null;
    const truckIdToLoad = handoff?.truckId || driver.assigned_truck_id;
    if (truckIdToLoad) {
      try {
        const t = await base44.entities.Truck.get(truckIdToLoad);
        setTruck(t);
      } catch {
        /* noop */
      }
    }
    setLoading(false);
    if (handoff) {
      // Clear the hand-off so a refresh doesn't reopen it
      navigate(location.pathname, { replace: true, state: null });
      if (!riskAlreadyDone) setRiskOpen(true);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const clockIn = async () => {
    await base44.entities.ShiftLog.create({
      driver_id: driver.id,
      driver_name: driver.full_name,
      truck_id: driver.assigned_truck_id || "",
      clock_in: new Date().toISOString(),
      status: "active",
      km_driven: 0,
      rest_minutes: 0,
      rests_taken: 0,
      fatigue_violations: 0,
    });
    loadData();
  };

  const takeRest = async () => {
    if (!shift) return;
    await base44.entities.ShiftLog.update(shift.id, {
      rests_taken: (shift.rests_taken || 0) + 1,
      rest_minutes: (shift.rest_minutes || 0) + fatigue.rest_break_minutes,
    });
    loadData();
  };

  const clockOut = async () => {
    if (!shift) return;
    await base44.entities.ShiftLog.update(shift.id, {
      clock_out: new Date().toISOString(),
      status: "ended",
    });
    setShift(null);
  };

  if (!driver)
    return (
      <p className="text-center text-muted-foreground  py-12">
        Select a driver…
      </p>
    );
  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-muted border-t-brand-teal rounded-full  animate-spin" />
      </div>
    );

  const clockInTime = shift ? new Date(shift.clock_in).getTime() : 0;
  const elapsed = shift ? now - clockInTime : 0;
  const sinceRest = shift ? elapsed - shift.rests_taken * REST_INTERVAL_MS : 0;
  const restDue = sinceRest >= REST_INTERVAL_MS;
  const shiftRemaining = SHIFT_LIMIT_MS - elapsed;
  const shiftOver = elapsed >= SHIFT_LIMIT_MS;

  const StepCard = ({
    step,
    icon: Icon,
    title,
    subtitle,
    done,
    actionLabel,
    onAction,
    disabled,
  }) => (
    <Card
      className={`border shadow-sm transition ${
        done
          ? "border-emerald-200  bg-emerald-50/50"
          : disabled
            ? "border-border/40 opacity-50"
            : "border-border/60"
      }`}
    >
      <CardContent className="flex items-center gap-3 p-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center 
rounded-full ${done ? "bg-emerald-500 text-white" : "bg-muted  text-muted-foreground"}`}
        >
          {done ? <CheckCircle2 size={20} /> : <Icon size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-navy">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {!done && !disabled && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 text-brand-teal"
            onClick={onAction}
          >
            {actionLabel}
            <ChevronRight size={14} />
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-2xl gradient-brand p-5 text-white shadow-lg">
        <p className="text-xs font-medium uppercase tracking-wider  text-white/70">
          Welcome back
        </p>
        <h1 className="font-display text-xl font-bold">{driver.full_name}</h1>
        <p className="text-sm  text-white/80">
          {driver.competency_level}
          {driver.dg_certified ? " · DG  Certified" : ""}
        </p>
        {truck && (
          <p className="mt-1 flex items-center gap-1 text-xs  text-white/70">
            <TruckIcon size={12} /> {truck.registration_number}
          </p>
        )}
      </div>
      {/* Shift / clock card */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5">
          {!shift ? (
            <div className="text-center">
              <Clock className="mx-auto text-brand-navy" size={32} />
              <p className="mt-2 text-sm text-muted-foreground">
                You're clocked out
              </p>{" "}
              <Button
                onClick={clockIn}
                className="mt-3 w-full gap-2 bg-brand-navy  hover:bg-brand-navy/90"
              >
                <Clock size={16} /> Clock In
              </Button>{" "}
            </div>
          ) : (
            <>
              {" "}
              <div className="flex items-center justify-between">
                {" "}
                <div>
                  {" "}
                  <p className="text-xs font-medium uppercase tracking-wider  text-muted-foreground">
                    Shift Active
                  </p>{" "}
                  <p className="font-display text-3xl font-bold text-brand-navy  tabular-nums">
                    {fmt(elapsed)}
                  </p>{" "}
                </div>{" "}
                <div className="text-right">
                  {" "}
                  <p className="text-xs text-muted-foreground">
                    Shift limit
                  </p>{" "}
                  <p
                    className={`font-semibold tabular-nums ${shiftOver ? "text-rose-600" : "text-foreground"}`}
                  >
                    {fmt(shiftRemaining)}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <div className="mt-3 h-2 w-full rounded-full bg-muted">
                {" "}
                <div
                  className={`h-2 rounded-full ${shiftOver ? "bg-rose-500" : "gradient-brand"}`}
                  style={{
                    width: `${Math.min(100, (elapsed / SHIFT_LIMIT_MS) * 100)}%`,
                  }}
                />{" "}
              </div>{" "}
              <div
                className={`mt-4 rounded-lg p-3 ${restDue ? "bg-amber-50" : "bg-muted/50"}`}
              >
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <Coffee
                    size={16}
                    className={
                      restDue ? "text-amber-600" : "text-muted-foreground"
                    }
                  />{" "}
                  <p className="text-sm font-medium text-foreground">
                    {`Fatigue rule — rest ${fatigue.rest_break_minutes} min every ${fatigue.rest_interval_hours}h`}
                  </p>{" "}
                </div>{" "}
                {restDue ? (
                  <div className="mt-2">
                    {" "}
                    <p className="text-sm font-semibold text-amber-700">
                      {`⚠ Rest break due now (min ${fatigue.rest_break_minutes} min)`}
                    </p>{" "}
                    <Button
                      onClick={takeRest}
                      size="sm"
                      className="mt-2 gap-2 bg-amber-600  hover:bg-amber-700"
                    >
                      <Coffee size={14} /> {`Log ${fatigue.rest_break_minutes}-min Rest`}
                    </Button>{" "}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {shift.rests_taken || 0} rests taken
                  </p>
                )}{" "}
              </div>{" "}
              {shiftOver && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-3  text-rose-700">
                  {" "}
                  <AlertTriangle size={16} />{" "}
                  <p className="text-sm font-medium">
                    15-hour shift limit reached — clock out immediately
                  </p>{" "}
                </div>
              )}{" "}
              <Button
                onClick={clockOut}
                variant="outline"
                className="mt-4 w-full"
              >
                Clock Out
              </Button>{" "}
            </>
          )}{" "}
        </CardContent>{" "}
      </Card>{" "}
      {/* Workflow stepper */}{" "}
      {shift && (
        <div className="space-y-3">
          {" "}
          <p className="px-1 text-xs font-semibold uppercase tracking-wider  text-muted-foreground">
            Shift Workflow
          </p>{" "}
          <StepCard
            step={1}
            icon={ClipboardCheck}
            title="Truck Inspection"
            subtitle={
              inspectionDone
                ? "Completed — passed"
                : "Pre-trip truck & trailer  check"
            }
            done={inspectionDone}
            actionLabel="Inspect"
            onAction={() => navigate("/driver/inspect")}
            disabled={false}
          />{" "}
          <StepCard
            step={2}
            icon={ShieldAlert}
            title="Shift Risk Assessment"
            subtitle={riskDone ? "Completed" : "Assess route & conditions"}
            done={riskDone}
            actionLabel="Assess"
            onAction={() => setRiskOpen(true)}
            disabled={!inspectionDone}
          />{" "}
          <StepCard
            step={3}
            icon={Package}
            title="Accept Load"
            subtitle={activeLoad ? "Load accepted" : "View available loads"}
            done={!!activeLoad}
            actionLabel="View"
            onAction={() => navigate("/driver/load")}
            disabled={!riskDone}
          />{" "}
          {activeLoad && (
            <StepCard
              step={4}
              icon={TruckIcon}
              title="Active Load"
              subtitle={activeLoad.load_number}
              done={activeLoad.status === "load_completed"}
              actionLabel="Update"
              onAction={() => navigate("/driver/load")}
              disabled={false}
            />
          )}{" "}
        </div>
      )}{" "}
      <RiskAssessmentDialog
        open={riskOpen}
        onOpenChange={setRiskOpen}
        driver={driver}
        truck={truck}
        onComplete={loadData}
      />{" "}
      {shift && (
        <GpsTracker shift={shift} driver={driver} onUpdated={loadData} />
      )}{" "}
    </div>
  );
}
