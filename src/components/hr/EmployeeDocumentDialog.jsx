import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { EMP_DOC_TYPES } from "@/lib/hrConstants";
import { Upload, FileText, User } from "lucide-react";

const empty = {
  document_type: "id_document",
  document_name: "",
  expiry_date: "",
  notes: "",
};

// Defined outside the form so inputs keep focus while typing
const F = ({ label, children }) => (
  <div className="grid gap-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

export default function EmployeeDocumentDialog({
  open,
  onOpenChange,
  employee,
  employees,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");

  useEffect(() => {
    if (open) {
      setForm(empty);
      setFile(null);
      setSelectedEmpId("");
    }
  }, [open]);
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const activeEmployee =
    employee || employees?.find((e) => e.id === selectedEmpId);

  const save = async () => {
    if (!activeEmployee) {
      toast({ title: "Select an employee", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Select a file to upload", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.EmployeeDocument.create({
        ...form,
        employee_id: activeEmployee.id,
        employee_name: activeEmployee.full_name,
        file_url: res.file_url,
        uploaded_date: new Date().toISOString().slice(0, 10),
      });
      toast({ title: "Document uploaded" });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={18} /> Upload Document{" "}
            {employee ? `— ${employee.full_name}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          {!employee && employees && (
            <div className="col-span-2">
              <F label="Select Employee">
                <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose employee…" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.full_name} — {e.job_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
            </div>
          )}
          <F label="Document Type">
            <Select
              value={form.document_type}
              onValueChange={(v) => set("document_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMP_DOC_TYPES).map(([k, t]) => (
                  <SelectItem key={k} value={k}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Document Name">
            <Input
              value={form.document_name}
              onChange={(e) => set("document_name", e.target.value)}
              placeholder="e.g. ID Book Copy"
            />
          </F>
          <F label="Expiry Date (if applicable)">
            <Input
              type="date"
              value={form.expiry_date}
              onChange={(e) => set("expiry_date", e.target.value)}
            />
          </F>
          <div className="col-span-2">
            <Label className="text-xs">File</Label>
            <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg  border-2 border-dashed border-border/60 px-4 py-6 hover:bg-muted/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg  bg-muted">
                {file ? (
                  <FileText size={20} className="text-brand-teal" />
                ) : (
                  <Upload size={20} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {file ? file.name : "Click to select  file"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, PNG, DOC up to 25MB
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={uploading || !activeEmployee}
            className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
          >
            {uploading ? (
              "Uploading…"
            ) : (
              <>
                <Upload size={16} />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
