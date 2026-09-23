import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 
"@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DEPARTMENTS, DOCUMENT_TYPES } from "@/lib/sheqConstants";
import { Upload, FileText } from "lucide-react";

const empty = { document_name: "", document_type: "policy", department: 
"Transport", version: "1.0", effective_date: "", review_date: "", uploaded_by: 
"" };

export default function DocumentUploadDialog({ open, onOpenChange, onSaved }) {
 const { toast } = useToast();
 const [form, setForm] = useState(empty);
 const [file, setFile] = useState(null);
 const [uploading, setUploading] = useState(false);

 useEffect(() => { if (open) { setForm(empty); setFile(null); } }, [open]);
 const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

 const save = async () => {
 if (!form.document_name) { toast({ title: "Document name required", variant: 
"destructive" }); return; }
 setUploading(true);
 try {
 let file_url = "";
 if (file) {
 const res = await base44.integrations.Core.UploadFile({ file });
 file_url = res.file_url;
 }
 await base44.entities.SafetyDocument.create({ ...form, file_url, status: 
"active" });
 toast({ title: "Document uploaded" });
 onSaved?.();
 onOpenChange(false);
 } catch (e) { toast({ title: "Error", description: e.message, variant: 
"destructive" }); }
 finally { setUploading(false); }
 };

 const Field = ({ label, children }) => <div className="grid gap-1.5"><Label 
className="text-xs">{label}</Label>{children}</div>;

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-lg">
 <DialogHeader><DialogTitle>Upload Policy / SOP</DialogTitle></DialogHeader>
 <div className="grid grid-cols-2 gap-3 py-1">
 <div className="col-span-2"><Field label="Document Name *"><Input 
value={form.document_name} onChange={(e) => set("document_name", 
e.target.value)} placeholder="e.g. Forklift Safety Policy" /></Field></div>
 <Field label="Type"><Select value={form.document_type} onValueChange={(v) => 
set("document_type", v)}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{Object.entries(DOCUMENT_TYPES).map(([k, t]) => <SelectItem key={k} 
value={k}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
 <Field label="Department"><Select value={form.department} onValueChange={(v) => set("department", v)}><SelectTrigger><SelectValue 
/></SelectTrigger><SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} 
value={d}>{d}</SelectItem>)}</SelectContent></Select></Field>
 <Field label="Version"><Input value={form.version} onChange={(e) => 
set("version", e.target.value)} /></Field>
 <Field label="Uploaded By"><Input value={form.uploaded_by} onChange={(e) => 
set("uploaded_by", e.target.value)} placeholder="Your name" /></Field>
 <Field label="Effective Date"><Input type="date" value={form.effective_date} 
onChange={(e) => set("effective_date", e.target.value)} /></Field>
 <Field label="Review Date"><Input type="date" value={form.review_date} 
onChange={(e) => set("review_date", e.target.value)} /></Field>
 <div className="col-span-2">
 <Label className="text-xs">File Upload</Label>
 <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg  border-2 border-dashed border-border/60 px-4 py-6 hover:bg-muted/30">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg  bg-muted">
 {file ? <FileText size={20} className="text-brand-teal" /> : <Upload 
size={20} className="text-muted-foreground" />}
 </div>
 <div>
 <p className="text-sm font-medium">{file ? file.name : "Click to select  file"}</p>
 <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 25MB</p>
 </div>
 <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
 </label>
 </div>
 </div>
 <DialogFooter><Button variant="outline" onClick={() => 
onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={uploading} 
className="gap-2 bg-brand-navy hover:bg-brand-navy/90">{uploading ? 
"Uploading…" : <><Upload size={16} /> Upload</>}</Button></DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
