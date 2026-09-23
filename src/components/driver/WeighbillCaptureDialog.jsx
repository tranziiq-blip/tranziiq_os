import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WeighbillUpload from "@/components/driver/WeighbillUpload";
import { Camera } from "lucide-react";

export default function WeighbillCaptureDialog({
  open,
  onOpenChange,
  load,
  type,
  onSaved,
}) {
  if (!load) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera size={18} className="text-brand-teal" />
            {type === "loaded"
              ? "Capture Loaded Weighbill"
              : "Capture Offloaded  Weighbill"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          {type === "loaded"
            ? "Photograph the weigh-out (loaded) ticket and capture the details to  continue."
            : "Photograph the weigh-out (empty) ticket and capture the details to  continue."}
        </p>
        <WeighbillUpload
          load={load}
          type={type || "offloaded"}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
