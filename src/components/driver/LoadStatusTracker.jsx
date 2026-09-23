import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoadSequence, LEGACY_STATUS_MAP } from "@/lib/fleetTypes";
import { useToast } from "@/components/ui/use-toast";
import {
  Check,
  ChevronRight,
  MapPin,
  Scale,
  Package,
  Clock,
  Navigation,
  Globe,
  PenLine,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const KEY_ICONS = {
  enroute_to_loading: Navigation,
  arrived_at_loading: MapPin,
  queue_to_load: Clock,
  weighing_in_empty: Scale,
  loading: Package,
  weighing_out_loaded: Scale,
  at_border: Globe,
  cleared: Check,
  enroute_to_offloading: Navigation,
  arrived_at_offloading: MapPin,
  queue_to_offload: Clock,
  weighing_in_loaded: Scale,
  offloading: Package,
  weighing_out_empty: Scale,
  load_completed: Check,
};

// Statuses that mean "assigned but not started" — the first step is next.
const PRE_START = new Set([
  "accepting_load",
  "pending",
  "assigned",
  "scheduled",
  "planned",
  "dispatched",
  "new",
  "open",
]);

// Colour per action, mirroring the Engineering job-card buttons
const ACTION_STYLE = {
  enroute_to_loading: "bg-indigo-600 hover:bg-indigo-700",
  arrived_at_loading: "bg-cyan-600 hover:bg-cyan-700",
  queue_to_load: "bg-amber-600 hover:bg-amber-700",
  weighing_in_empty: "bg-slate-700 hover:bg-slate-800",
  loading: "bg-blue-600 hover:bg-blue-700",
  weighing_out_loaded: "bg-slate-700 hover:bg-slate-800",
  at_border: "bg-orange-600 hover:bg-orange-700",
  cleared: "bg-emerald-600 hover:bg-emerald-700",
  enroute_to_offloading: "bg-indigo-600 hover:bg-indigo-700",
  arrived_at_offloading: "bg-cyan-600 hover:bg-cyan-700",
  queue_to_offload: "bg-amber-600 hover:bg-amber-700",
  weighing_in_loaded: "bg-slate-700 hover:bg-slate-800",
  offloading: "bg-blue-600 hover:bg-blue-700",
  weighing_out_empty: "bg-slate-700 hover:bg-slate-800",
  load_completed: "bg-emerald-600 hover:bg-emerald-700",
};

export default function LoadStatusTracker({
  load,
  onUpdated,
  onComplete,
  onWeighbillCapture,
  onRequireDeliveryNote,
  deliveryNoteSigned,
}) {
  const { toast } = useToast();
  const [advancing, setAdvancing] = useState(false);
  // Local copy so the screen moves on the instant the update succeeds,
  // exactly like the job card, without waiting for the page to reload.
  const [status, setStatus] = useState(load.status);
  useEffect(() => setStatus(load.status), [load.id, load.status]);

  const sequence = getLoadSequence(load.cross_border);
  const statusKey = LEGACY_STATUS_MAP[status] || status;
  const isCompleted = statusKey === "load_completed";
  const notStarted = PRE_START.has(status) || !status;
  const currentStepIndex = sequence.findIndex((s) => s.key === statusKey);
  let nextStep = null;
  if (!isCompleted) {
    if (currentStepIndex >= 0) nextStep = sequence[currentStepIndex + 1];
    else nextStep = sequence[0]; // not started or unknown dispatch status
  }
  const completionBlocked =
    nextStep?.key === "load_completed" && !deliveryNoteSigned;

  const saveStatus = async (key) => {
    const now = new Date().toISOString();
    const history = Array.isArray(load.status_history)
      ? load.status_history
      : [];
    const full = {
      status: key,
      status_updated_at: now,
      status_history: [...history, { status: key, at: now }],
    };
    try {
      return await base44.entities.Load.update(load.id, full);
    } catch (e) {
      // Older databases without the history columns: save the status alone
      if (/status_history|status_updated_at|column/i.test(e.message || "")) {
        return base44.entities.Load.update(load.id, { status: key });
      }
      throw e;
    }
  };

  const advance = async () => {
    if (!nextStep || advancing) return;
    if (nextStep.key === "load_completed" && !deliveryNoteSigned) {
      toast({
        title: "Delivery note signature required",
        description: "Capture the receiver's signature before completing the load",
      });
      onRequireDeliveryNote?.();
      return;
    }
    const step = nextStep;
    setAdvancing(true);
    try {
      await saveStatus(step.key);
      setStatus(step.key);
      toast({ title: "Status updated", description: step.label });
      if (step.key === "load_completed" && onComplete) {
        await onComplete();
      }
      if (
        step.key === "weighing_out_loaded" ||
        step.key === "weighing_out_empty"
      ) {
        onWeighbillCapture?.(
          step.key === "weighing_out_loaded" ? "loaded" : "offloaded",
        );
      }
      onUpdated?.();
    } catch (e) {
      toast({
        title: "Could not update status",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setAdvancing(false);
    }
  };

  const NextIcon = (nextStep && KEY_ICONS[nextStep.key]) || ChevronRight;

  return (
    <div className="space-y-4">
      {/* Current status */}
      <div className="rounded-xl gradient-brand p-4 text-white shadow-lg">
        <p className="text-xs font-medium uppercase tracking-wider  text-white/70">
          Current Status
        </p>
        <p className="font-display text-lg font-bold">
          {isCompleted
            ? "Load Completed"
            : currentStepIndex >= 0
              ? sequence[currentStepIndex].label
              : notStarted
                ? "Assigned — not started"
                : String(status || "").replace(/_/g, " ")}
        </p>
        {nextStep && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
            <ChevronRight size={14} /> Next: {nextStep.label}
          </div>
        )}
        {currentStepIndex < 0 && !isCompleted && !notStarted && (
          <p className="mt-1 text-xs text-white/70">
            Status set by dispatch — tap the button below to continue the trip.
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {sequence.map((step, i) => (
          <div
            key={step.key}
            className={`h-1.5 flex-1 rounded-full ${
              i <= currentStepIndex ? "bg-brand-teal" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {Math.max(0, currentStepIndex + 1)} of {sequence.length} steps completed
        {load.cross_border ? " · cross-border route" : ""}
      </p>

      {/* One contextual action button per stage — same pattern as job cards */}
      {nextStep && (
        <Button
          type="button"
          onClick={advance}
          disabled={advancing}
          className={`h-12 w-full gap-2 text-base font-semibold text-white ${
            completionBlocked
              ? "bg-amber-600 hover:bg-amber-700"
              : ACTION_STYLE[nextStep.key] || "bg-brand-teal hover:bg-brand-teal/90"
          }`}
        >
          {advancing ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Updating…
            </>
          ) : completionBlocked ? (
            <>
              <PenLine size={18} /> Capture Signature — Complete Load
            </>
          ) : (
            <>
              <NextIcon size={18} /> {nextStep.label}
            </>
          )}
        </Button>
      )}
      {isCompleted && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={18} /> Load completed
        </div>
      )}

      {/* Step list */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-3">
          <div className="space-y-0.5">
            {sequence.map((step, i) => {
              const Icon = KEY_ICONS[step.key] || Check;
              const isDone = i < currentStepIndex || isCompleted;
              const isCurrent = i === currentStepIndex && !isCompleted;
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${isCurrent ? "bg-brand-teal/10" : ""}`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                          ? "bg-brand-teal text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span
                    className={`flex-1 text-sm ${
                      isDone
                        ? "text-muted-foreground  line-through"
                        : isCurrent
                          ? "font-semibold text-brand-navy"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold uppercase  text-brand-teal">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
