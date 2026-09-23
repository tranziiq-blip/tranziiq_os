import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Printer, Download, Mail, FileText } from "lucide-react";

export default function ReportSnapshotViewer({
  open,
  onOpenChange,
  snapshot,
  onEmailed,
}) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  if (!snapshot) return null;

  const summary = snapshot.summary_data || {};
  const details = snapshot.detailed_data || [];

  const handlePrint = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    const rows =
      details.length > 0
        ? `<table 
style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr>${Object.keys(
            details[0],
          )
            .map(
              (k) => `<th style="text-align:left;border:1px solid 
#ddd;padding:4px">${k.replace(/_/g, "  ")}</th>`,
            )
            .join("")}</tr></thead><tbody>${details
            .map(
              (r) =>
                `<tr>${Object.values(r)
                  .map(
                    (v) => `<td style="border:1px solid 
#ddd;padding:4px">${v ?? "—"}</td>`,
                  )
                  .join("")}</tr>`,
            )
            .join("")}</tbody></table>`
        : "<p>No detailed data.</p>";

    printWin.document.write(`
 <html><head><title>${snapshot.report_name}</title>
 
<style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#002D5B}h2{color:#007B8A;margin-top:20px}.kpis{display:flex;flex-wrap:wrap;gap:12px;margin:16px 
0}.kpi{border:1px solid 
#ddd;border-radius:8px;padding:12px;min-width:140px}.kpi-label{font-size:11px;color:#666}.kpi-value{font-size:20px;font-weight:bold;color:#002D5B}.header{display:flex;justify-content:space-between;border-bottom:2px 
solid #002D5B;padding-bottom:8px;margin-bottom:12px}</style>
 </head><body>
 <div class="header"><div><h1>${snapshot.report_name}</h1><p 
style="color:#666;font-size:12px">${snapshot.report_type?.replace(/_/g, "  ")}</p></div><div style="text-align:right;font-size:12px;color:#666"><p>Period: 
${snapshot.period_start || "—"} to ${
      snapshot.period_end || "—"
    }</p><p>Generated: ${new Date(
      snapshot.generated_date,
    ).toLocaleString()}</p></div></div>
 <h2>Summary</h2><div class="kpis">${Object.entries(summary)
   .map(
     ([k, v]) =>
       `<div class="kpi"><div class="kpi-label">${k.replace(/_/g, " ")}</div><div 
class="kpi-value">${
         typeof v === "number"
           ? v.toLocaleString("en-ZA", {
               maximumFractionDigits: 2,
             })
           : v
       }</div></div>`,
   )
   .join("")}</div>
 <h2>Details (${details.length} records)</h2>${rows}
 </body></html>
 `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
  };

  const handleDownloadCSV = () => {
    if (details.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = Object.keys(details[0]);
    const csv = [
      headers.join(","),
      ...details.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snapshot.report_name.replace(
      /\s+/g,
      "_",
    )}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV downloaded" });
  };

  const handleEmail = async () => {
    if (!snapshot.delivered_to || snapshot.delivered_to.length === 0) {
      toast({
        title: "No email recipients configured",
        description: "Edit the  report configuration to add recipients",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    try {
      const html = `<h2>${snapshot.report_name}</h2><p>Period: 
${snapshot.period_start || "—"} to ${
        snapshot.period_end || "—"
      }</p><h3>Summary</h3><ul>${Object.entries(summary)
        .map(
          ([k, v]) =>
            `<li><strong>${k.replace(/_/g, " ")}:</strong> ${
              typeof v === "number"
                ? v.toLocaleString("en-ZA", { maximumFractionDigits: 2 })
                : v
            }</li>`,
        )
        .join("")}</ul><p>${details.length} detailed records included.</p>`;
      const res = await base44.functions.invoke("sendReportEmail", {
        recipients: snapshot.delivered_to,
        report_name: snapshot.report_name,
        report_html: html,
        period: `${snapshot.period_start || "—"} to ${snapshot.period_end || "—"}`,
        snapshot_id: snapshot.id,
      });
      toast({ title: `Report emailed to ${res.data?.sent || 0} recipient(s)` });
      onEmailed?.();
    } catch (e) {
      toast({
        title: "Failed to send email",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} className="text-brand-navy" />
            {snapshot.report_name}
            <Badge variant="secondary" className="text-xs">
              {snapshot.report_type?.replace(/_/g, " ")}
            </Badge>
            <Badge
              className={
                snapshot.delivery_status === "sent"
                  ? "bg-emerald-100  text-emerald-700"
                  : "bg-amber-100  text-amber-700"
              }
            >
              {snapshot.delivery_status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between text-xs  text-muted-foreground border-b border-border pb-3">
          <span>
            Period: {snapshot.period_start || "—"} →{" "}
            {snapshot.period_end || "—"}
          </span>
          <span>
            Generated:{" "}
            {snapshot.generated_date
              ? new Date(snapshot.generated_date).toLocaleString()
              : "—"}
          </span>
        </div>

        {/* Summary KPIs */}
        {Object.keys(summary).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-brand-navy mb-2">
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(summary).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground capitalize">
                    {k.replace(/_/g, "  ")}
                  </p>
                  <p className="text-lg font-bold text-brand-navy">
                    {typeof v === "number"
                      ? v.toLocaleString("en-ZA", { maximumFractionDigits: 2 })
                      : String(v)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail table */}
        {details.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-brand-navy mb-2">
              Details ({details.length} records)
            </h3>
            <div className="max-h-64 overflow-auto rounded-lg border border-border/60">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80">
                  <tr>
                    {Object.keys(details[0]).map((k) => (
                      <th
                        key={k}
                        className="px-2 py-2  text-left font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {k.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {details.slice(0, 100).map((row, i) => (
                    <tr key={i} className="border-t border-border/40">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-2 py-1.5  whitespace-nowrap">
                          {v ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {details.length > 100 && (
              <p className="mt-1 text-xs  text-muted-foreground">
                Showing first 100 of {details.length} records. Download CSV for
                full data.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handlePrint}
          >
            <Printer size={14} /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleDownloadCSV}
          >
            <Download size={14} /> Download CSV
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-brand-teal hover:bg-brand-teal/90"
            onClick={handleEmail}
            disabled={sending}
          >
            <Mail size={14} />{" "}
            {sending
              ? "Sending…"
              : `Email (${snapshot.delivered_to?.length || 0})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
