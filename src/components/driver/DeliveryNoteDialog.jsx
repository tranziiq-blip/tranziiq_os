import { Dialog, DialogContent, DialogHeader, DialogTitle } from 
"@/components/ui/dialog";
import DeliveryNotePanel from "@/components/driver/DeliveryNotePanel";
import { FileText } from "lucide-react";

export default function DeliveryNoteDialog({ open, onOpenChange, load, driver, 
deliveryNote, onUpdated }) {
 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <FileText size={18} className="text-brand-navy" />
 Delivery Note — Receiver Signature
 </DialogTitle>
 </DialogHeader>
 <p className="text-xs text-muted-foreground">Present this delivery note to 
the receiver for signature. The load can only be completed once signed.</p>
 {deliveryNote && (
 <DeliveryNotePanel
 load={load}
 driver={driver}
 deliveryNote={deliveryNote}
 onUpdated={() => { onUpdated?.(); onOpenChange(false); }}
 />
 )}
 </DialogContent>
 </Dialog>
 );
}
