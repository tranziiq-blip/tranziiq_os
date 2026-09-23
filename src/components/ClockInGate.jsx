import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import RiskAssessmentDialog from "@/components/driver/RiskAssessmentDialog";
import { Clock, ShieldAlert, CheckCircle2 } from "lucide-react";

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

export default function ClockInGate({ children }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phase, setPhase] = useState("loading"); // loading | gate | done
  const [employees, setEmployees] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [activeShift, setActiveShift] = useState(null);
  const [riskDone, setRiskDone] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);
  const [clockingIn, setClockingIn] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    if (["client", "clearing_agent"].includes(user.role)) {
      setPhase("done");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const empList = await base44.entities.Employee.filter({
          status: "active",
        });
        if (cancelled) return;
        setEmployees(empList);
        if (empList.length === 0) {
          setPhase("done");
          return;
        }
        let me = empList.find((e) => e.id === user.linked_employee_id);
        if (!me)
          me = empList.find(
            (e) =>
              (e.email || "").toLowerCase() ===
              (user.email || "").toLowerCase(),
          );
        if (me) {
          setEmployee(me);
          const shifts = await base44.entities.ShiftLog.filter(
            { driver_id: me.id, status: "active" },
            "-clock_in",
            1,
          );
          const shift = shifts[0] || null;
          if (cancelled) return;
          setActiveShift(shift);
          if (shift) {
            const risks = await base44.entities.ShiftRiskAssessment.filter(
              { driver_id: me.id },
              "-created_date",
              1,
            );
            if (cancelled) return;
            const rd = !!(risks[0] && isToday(risks[0].created_date));
            setRiskDone(rd);
            setPhase(rd ? "done" : "gate");
          } else {
            setRiskDone(false);
            setPhase("gate");
          }
        } else {
          setPhase("gate");
        }
      } catch {
        if (!cancelled) setPhase("done");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const clockIn = async () => {
    const target = employee || employees.find((e) => e.id === selectedId);
    if (!target) return;
    setClockingIn(true);
    try {
      if (!employee) {
        setEmployee(target);
        try {
          await base44.auth.updateMe({ linked_employee_id: target.id });
        } catch {
          /* non-critical */
        }
      }
      const shift = await base44.entities.ShiftLog.create({
        driver_id: target.id,
        driver_name: target.full_name,
        clock_in: new Date().toISOString(),
        status: "active",
        km_driven: 0,
        rest_minutes: 0,
        rests_taken: 0,
        fatigue_violations: 0,
      });
      setActiveShift(shift);
      setRiskOpen(true);
      toast({
        title: "Clocked in",
        description:
          "Complete your shift risk  assessment to open your workspace",
      });
    } catch (e) {
      toast({
        title: "Error clocking in",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setClockingIn(false);
    }
  };

  if (phase !== "gate") return children;

  const needsSelection = !employee;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/60 shadow-xl">
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <Clock className="mx-auto text-brand-teal" size={36} />
              <h1 className="mt-2 font-display text-xl font-bold text-brand-navy">
                Start Your Shift
              </h1>
              <p className="text-sm text-muted-foreground">
                Clock in and complete your shift risk assessment to open your
                workspace
              </p>
            </div>

            {needsSelection ? (
              <div className="grid gap-2">
                <Label>Select Your Profile</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your name…" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.full_name} — {e.job_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-sm font-semibold text-brand-navy">
                  {employee.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {employee.job_title} ·{employee.department}
                </p>
              </div>
            )}

            {activeShift && (
              <div className="flex items-center justify-between rounded-lg border  border-emerald-200 bg-emerald-50/50 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 size={14} /> Clocked in
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(activeShift.clock_in).toLocaleTimeString("en-ZA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}

            {!activeShift ? (
              <Button
                onClick={clockIn}
                disabled={clockingIn || (needsSelection && !selectedId)}
                className="w-full gap-2 bg-brand-navy hover:bg-brand-navy/90"
              >
                <Clock size={16} /> {clockingIn ? "Clocking in…" : "Clock In"}
              </Button>
            ) : !riskDone ? (
              <Button
                onClick={() => setRiskOpen(true)}
                className="w-full gap-2  bg-brand-teal hover:bg-brand-teal/90"
              >
                <ShieldAlert size={16} /> Complete Shift Risk Assessment
              </Button>
            ) : null}

            <p className="text-center text-[10px] text-muted-foreground">
              All clock-ins and clock-outs sync automatically to HR → Time &amp;
              Attendance.
            </p>

            <RiskAssessmentDialog
              open={riskOpen}
              onOpenChange={setRiskOpen}
              driver={
                employee
                  ? { id: employee.id, full_name: employee.full_name }
                  : null
              }
              truck={null}
              onComplete={() => {
                setRiskDone(true);
                setPhase("done");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
