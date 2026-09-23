import { useState } from "react";
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

  const sequence = getLoadSequence(load.cross_border);
  const statusKey = LEGACY_STATUS_MAP[load.status] || load.status;
  const currentStepIndex = sequence.findIndex((s) => s.key === statusKey);
  const isCompleted = load.status === "load_completed";
  const nextStep =
    currentStepIndex >= 0 && !isCompleted
      ? sequence[currentStepIndex + 1]
      : null;
  const completionBlocked =
    nextStep?.key === "load_completed" && !deliveryNoteSigned;

  const advance = async () => {
    if (!nextStep) return;
    if (nextStep.key === "load_completed" && !deliveryNoteSigned) {
      toast({
        title: "Delivery note signature required",
        description:
          "Capture the  receiver's signature before completing the load",
      });
      onRequireDeliveryNote?.();
      return;
    }
    setAdvancing(true);
    try {
      await base44.entities.Load.update(load.id, { status: nextStep.key });
      toast({ title: "Status updated", description: nextStep.label });
      onUpdated?.();
      if (nextStep.key === "load_completed" && onComplete) {
        await onComplete();
      }
      if (
        nextStep.key === "weighing_out_loaded" ||
        nextStep.key === "weighing_out_empty"
      ) {
        onWeighbillCapture?.(
          nextStep.key === "weighing_out_loaded" ? "loaded" : "offloaded",
        );
      }
    } catch (e) {
      toast({
        title: "Error updating status",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setAdvancing(false);
    }
  };

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
              : load.status.replace(/_/g, " ")}
        </p>
        {nextStep && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
            <ChevronRight size={14} /> Next: {nextStep.label}
          </div>
        )}
        {currentStepIndex < 0 && !isCompleted && (
          <p className="mt-1 text-xs text-white/70">
            This status is managed by dispatch — the load sequence resumes from
            the next standard step.
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

      {/* Single advance button (sequential, no dropdown) */}
      {nextStep && (
        <Button
          onClick={advance}
          disabled={advancing}
          className="w-full gap-2 bg-brand-teal hover:bg-brand-teal/90"
        >
          {advancing ? (
            "Updating…"
          ) : completionBlocked ? (
            <>
              <PenLine size={16} /> Capture Signature — Complete Load
            </>
          ) : (
            <>
              <ChevronRight size={16} /> Advance to: {nextStep.label}
            </>
          )}
        </Button>
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
                  className={`flex items-center gap-3 rounded-lg px-3 
py-2.5 ${isCurrent ? "bg-brand-teal/10" : ""}`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center 
rounded-full ${
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
