import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { PROFILE_TYPES, JURISDICTIONS } from "@/lib/complianceContent";

const SCOPES = [
  "driver",
  "vehicle",
  "equipment",
  "permit",
  "escort",
  "logger",
  "load",
];

export default function ComplianceDocumentDialog({
  open,
  onOpenChange,
  doc,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      doc
        ? { ...doc }
        : {
            profile_type: "dg_hazmat",
            scope: "vehicle",
            document_type: "",
            jurisdiction_code: "",
          },
    );
  }, [open, doc]);

  const suggestions =
    PROFILE_TYPES[form.profile_type]?.expiryRegister?.map(
      (r) => r.documentType,
    ) || [];

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, file_url }));
      toast({ title: "Document uploaded" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.document_type) {
      toast({ title: "Document type required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        document_type: form.document_type,
        profile_type: form.profile_type,
        scope: form.scope,
        holder_name: form.holder_name || "",
        holder_ref_id: form.holder_ref_id || "",
        jurisdiction_code: form.jurisdiction_code || "",
        reference_number: form.reference_number || "",
        issue_date: form.issue_date || "",
        expiry_date: form.expiry_date || "",
        file_url: form.file_url || "",
        notes: form.notes || "",
      };
      if (doc) await base44.entities.ComplianceDocument.update(doc.id, payload);
      else await base44.entities.ComplianceDocument.create(payload);
      toast({
        title: doc ? "Document updated" : "Document added to expiry register",
      });
      onSaved();
    } catch (e) {
      toast({
        title: "Error saving",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {doc ? "Edit" : "Add"} Expiry Register Document
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="grid gap-1.5">
            <Label className="text-xs">Module</Label>
            <Select
              value={form.profile_type}
              onValueChange={(v) =>
                setForm({ ...form, profile_type: v, document_type: "" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROFILE_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Scope</Label>
            <Select
              value={form.scope}
              onValueChange={(v) => setForm({ ...form, scope: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 col-span-2">
            <Label className="text-xs">Document Type</Label>
            <Input
              list="doc-suggestions"
              value={form.document_type || ""}
              onChange={(e) =>
                setForm({ ...form, document_type: e.target.value })
              }
              placeholder="e.g.  Driver DG training certificate"
            />
            <datalist id="doc-suggestions">
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Holder (name / reg / serial)</Label>
            <Input
              value={form.holder_name || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  holder_name: e.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Reference Number</Label>
            <Input
              value={form.reference_number || ""}
              onChange={(e) =>
                setForm({ ...form, reference_number: e.target.value })
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Jurisdiction</Label>
            <Select
              value={form.jurisdiction_code || "none"}
              onValueChange={(v) =>
                setForm({ ...form, jurisdiction_code: v === "none" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Global / not jurisdiction-specific" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Global / not jurisdiction-specific
                </SelectItem>
                {JURISDICTIONS.map((j) => (
                  <SelectItem key={j.code} value={j.code}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Issue Date</Label>
            <Input
              type="date"
              value={form.issue_date || ""}
              onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5 col-span-2">
            <Label className="text-xs">
              Expiry Date (drives 30/14/7-day alerts)
            </Label>
            <Input
              type="date"
              value={form.expiry_date || ""}
              onChange={(e) =>
                setForm({ ...form, expiry_date: e.target.value })
              }
            />
          </div>
          <div className="grid gap-1.5 col-span-2">
            <Label className="text-xs">Scanned Copy (optional)</Label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={upload}
              disabled={uploading}
            />
            {form.file_url && (
              <p className="text-[10px] text-emerald-600">✓ File attached</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-brand-navy  hover:bg-brand-navy/90"
          >
            {saving ? "Saving…" : "Save Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
