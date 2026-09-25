import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  RISK_CATEGORIES,
  RISK_RATINGS,
  RISK_STATUS,
  VFL_TYPES,
  TBT_STATUS,
  DOCUMENT_TYPES,
} from "@/lib/sheqConstants";
import RiskRegisterDialog from "@/components/sheq/RiskRegisterDialog";
import VFLDialog from "@/components/sheq/VFLDialog";
import ToolboxTalkDialog from "@/components/sheq/ToolboxTalkDialog";
import DocumentUploadDialog from "@/components/sheq/DocumentUploadDialog";
import IncidentsTab from "@/components/sheq/IncidentsTab";
import {
  Plus,
  ShieldAlert,
  Eye,
  Megaphone,
  ClipboardList,
  FileText,
  Flag,
  ExternalLink,
  Pencil,
} from "lucide-react";

export default function Safety() {
  const { toast } = useToast();
  const [risks, setRisks] = useState([]);
  const [vfls, setVfls] = useState([]);
  const [talks, setTalks] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [riskDialog, setRiskDialog] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [vflDialog, setVflDialog] = useState(false);
  const [tbtDialog, setTbtDialog] = useState(false);
  const [editingTbt, setEditingTbt] = useState(null);
  const [docDialog, setDocDialog] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rk, vf, tt, ra, inc, docs, drv, trk] = await Promise.all([
        base44.entities.RiskRegister.list("-created_date"),
        base44.entities.VFL.list("-created_date"),
        base44.entities.ToolboxTalk.list("-scheduled_date"),
        base44.entities.ShiftRiskAssessment.list("-created_date"),
        base44.entities.IncidentReport.list("-created_date"),
        base44.entities.SafetyDocument.list("-created_date"),
        base44.entities.Driver.list(),
        base44.entities.Truck.list(),
      ]);
      setRisks(rk);
      setVfls(vf);
      setTalks(tt);
      setAssessments(ra);
      setIncidents(inc);
      setDocuments(docs);
      setDrivers(drv);
      setTrucks(trk);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  // Overview metrics
  const openRisks = risks.filter((r) => r.status === "open").length;
  const flaggedAssessments = assessments.filter((a) => a.new_risk_flagged);
  const thisMonth = new Date().getMonth();
  const vflsThisMonth = vfls.filter(
    (v) => new Date(v.conducted_date).getMonth() === thisMonth,
  ).length;
  const talksPlanned = talks.filter((t) => t.status === "planned").length;
  const talksConducted = talks.filter((t) => t.status === "conducted").length;
  const controlledRisks = risks.filter((r) => r.status !== "open").length;
  const riskScore = risks.length
    ? Math.round((controlledRisks / risks.length) * 100)
    : 100;
  const docCompliance = documents.length
    ? Math.round(
        (documents.filter((d) => d.status === "active").length /
          documents.length) *
          100,
      )
    : 100;
  const overallRating =
    risks.filter(
      (r) =>
        r.status === "open" &&
        ["critical", "high"].includes(r.residual_risk_rating),
    ).length > 0
      ? "High"
      : risks.filter(
            (r) => r.status === "open" && r.residual_risk_rating === "medium",
          ).length > 0
        ? "Medium"
        : "Low";
  const ratingColor =
    overallRating === "High"
      ? "bg-rose-100 text-rose-700"
      : overallRating === "Medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100  text-emerald-700";

  const kpis = [
    {
      label: "Total Risks",
      value: risks.length,
      sub: `${openRisks} open`,
      icon: ShieldAlert,
      tone: "text-brand-navy",
    },
    {
      label: "VFLs This Month",
      value: vflsThisMonth,
      sub: "observations",
      icon: Eye,
      tone: "text-brand-teal",
    },
    {
      label: "Toolbox Talks",
      value: talksConducted,
      sub: `${talksPlanned} 
planned`,
      icon: Megaphone,
      tone: "text-brand-blue",
    },
    {
      label: "Flagged New Risks",
      value: flaggedAssessments.length,
      sub: "from  assessments",
      icon: Flag,
      tone: "text-amber-500",
    },
  ];

  const addToRegister = (assessment) => {
    setEditingRisk({
      risk_description: assessment.new_risk_description,
      category: "safety",
      department: "Transport",
      applicable_roles: ["Driver"],
      status: "open",
    });
    setRiskDialog(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
          SHERQ Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Risk register · VFLs · toolbox talks · compliance · documents
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="register">Risk Register</TabsTrigger>
          <TabsTrigger value="vfl">VFLs</TabsTrigger>
          <TabsTrigger value="tbt">Toolbox Talks</TabsTrigger>
          <TabsTrigger value="assessments">Risk Assessments</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.label} className="border-border/60  shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center  justify-between">
                    <p className="text-xs  text-muted-foreground">{k.label}</p>
                    <k.icon size={16} className={k.tone} />
                  </div>
                  <p className="mt-1 font-display text-2xl font-bold  text-brand-navy">
                    {loading ? "—" : k.value}
                  </p>
                  <p className="text-xs  text-muted-foreground">{k.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Risk Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm  text-muted-foreground">
                    Overall Rating
                  </span>
                  <Badge className={ratingColor}>{overallRating}</Badge>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    Risks by Category
                  </p>
                  {RISK_CATEGORIES.map((c) => {
                    const count = risks.filter(
                      (r) => r.category === c.key,
                    ).length;
                    return (
                      <div
                        key={c.key}
                        className="mb-1 flex  items-center justify-between text-xs"
                      >
                        <span>{c.label}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2  rounded-full gradient-brand"
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {riskScore}% risks controlled
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Compliance Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm  text-muted-foreground">
                    Document Compliance
                  </span>
                  <span className="font-display  text-lg font-bold text-brand-navy">
                    {docCompliance}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm  text-muted-foreground">
                    Toolbox Talks Conducted
                  </span>
                  <span className="font-display text-lg font-bold text-brand-navy">
                    {talks.length
                      ? Math.round((talksConducted / talks.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm  text-muted-foreground">
                    Flagged New Risks
                  </span>
                  <span className="font-display  text-lg font-bold text-amber-600">
                    {flaggedAssessments.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm  text-muted-foreground">
                    Open Incidents
                  </span>
                  <span className="font-display  text-lg font-bold text-brand-navy">
                    {incidents.filter((i) => i.status !== "resolved").length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          {flaggedAssessments.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base  font-semibold text-amber-800">
                  <Flag size={16} /> New Risks Flagged by Employees — Review
                  Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {flaggedAssessments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center  justify-between rounded-lg border border-amber-200 bg-white p-3"
                  >
                    <div>
                      <span className="font-medium text-brand-navy">
                        {a.driver_name}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(a.shift_date).toLocaleDateString("en-ZA")}
                      </span>
                      <p className="mt-0.5  text-xs text-muted-foreground">
                        {a.new_risk_description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addToRegister(a)}
                      className="gap-1 bg-brand-navy  hover:bg-brand-navy/90"
                    >
                      Add to Register
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* RISK REGISTER */}
        <TabsContent value="register" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingRisk(null);
                setRiskDialog(true);
              }}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Add Risk
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Inherent</TableHead>
                    <TableHead>Residual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center  text-muted-foreground py-8"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && risks.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        No risks registered yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {risks.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="max-w-xs text-sm">
                        {r.risk_description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            RISK_CATEGORIES.find((c) => c.key === r.category)
                              ?.color || ""
                          }
                        >
                          {RISK_CATEGORIES.find((c) => c.key === r.category)
                            ?.label || r.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{r.department}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(r.applicable_roles || []).join(", ") || "All"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            RISK_RATINGS[r.inherent_risk_rating]?.color
                          }
                        >
                          {RISK_RATINGS[r.inherent_risk_rating]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            RISK_RATINGS[r.residual_risk_rating]?.color
                          }
                        >
                          {RISK_RATINGS[r.residual_risk_rating]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium 
${RISK_STATUS[r.status]?.color}`}
                        >
                          {RISK_STATUS[r.status]?.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => {
                            setEditingRisk(r);
                            setRiskDialog(true);
                          }}
                          className="rounded-md p-1.5 text-brand-blue hover:bg-brand-blue/10"
                        >
                          <Pencil size={14} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VFLs */}
        <TabsContent value="vfl" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setVflDialog(true)}
              className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus size={16} />
              Record VFL
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center  text-muted-foreground py-8"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && vfls.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        No VFLs recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {vfls.map((v) => (
                    <TableRow key={v.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs">
                        {new Date(v.conducted_date).toLocaleDateString("en-ZA")}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {v.conducted_by}
                      </TableCell>
                      <TableCell className="text-xs">{v.department}</TableCell>
                      <TableCell>
                        <Badge className={VFL_TYPES[v.observation_type]?.color}>
                          {VFL_TYPES[v.observation_type]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground  truncate">
                        {v.description}
                      </TableCell>
                      <TableCell className="text-xs">
                        {v.follow_up_required ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium 
${v.status === "open" ? "bg-amber-100 text-amber-700" : "bg-emerald-100  text-emerald-700"}`}
                        >
                          {v.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TOOLBOX TALKS */}
        <TabsContent value="tbt" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingTbt(null);
                setTbtDialog(true);
              }}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Plan Talk
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center  text-muted-foreground py-8"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && talks.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        No talks planned yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {talks.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm font-medium">
                        {t.title}
                      </TableCell>
                      <TableCell className="text-xs">{t.department}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(t.scheduled_date).toLocaleDateString("en-ZA")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {t.conducted_by || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {t.attendees_count || 0}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium 
${TBT_STATUS[t.status]?.color}`}
                        >
                          {TBT_STATUS[t.status]?.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => {
                            setEditingTbt(t);
                            setTbtDialog(true);
                          }}
                          className="rounded-md p-1.5 text-brand-blue hover:bg-brand-blue/10"
                        >
                          <Pencil size={14} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RISK ASSESSMENTS */}
        <TabsContent value="assessments" className="space-y-4">
          {flaggedAssessments.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-3">
                <p className="flex items-center gap-2 text-sm font-semibold  text-amber-800">
                  <Flag size={16} /> {flaggedAssessments.length} new risk(s)
                  flagged by employees — review and add to risk register
                </p>
              </CardContent>
            </Card>
          )}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Hazards</TableHead>
                    <TableHead>New Risk</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center  text-muted-foreground py-8"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && assessments.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        No risk assessments submitted yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {assessments.map((a) => (
                    <TableRow
                      key={a.id}
                      className={`hover:bg-muted/30 ${
                        a.new_risk_flagged ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <TableCell className="text-xs">
                        {new Date(a.shift_date).toLocaleDateString("en-ZA")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {a.driver_name}
                        {a.job_title && (
                          <span className="block text-[10px] font-normal text-muted-foreground">
                            {a.job_title}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.department || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.truck_registration || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={RISK_RATINGS[a.risk_level]?.color}>
                          {RISK_RATINGS[a.risk_level]?.label}
                        </Badge>
                        {a.stop_work && (
                          <Badge variant="destructive" className="ml-1">
                            Stop work
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className="max-w-xs text-xs text-muted-foreground  truncate"
                        title={a.hazards_identified || ""}
                      >
                        {a.hazards_identified || "—"}
                      </TableCell>
                      <TableCell>
                        {a.new_risk_flagged ? (
                          <Badge variant="destructive" className="gap-1">
                            <Flag size={10} /> Flagged
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {a.new_risk_flagged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToRegister(a)}
                            className="text-xs"
                          >
                            Add to Register
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INCIDENTS */}
        <TabsContent value="incidents">
          <IncidentsTab
            incidents={incidents}
            drivers={drivers}
            trucks={trucks}
            onDataChanged={load}
          />
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setDocDialog(true)}
              className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus size={16} />
              Upload
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Review Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center  text-muted-foreground py-8"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && documents.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        No documents uploaded yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {documents.map((d) => (
                    <TableRow key={d.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm font-medium  text-brand-navy">
                        {d.document_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={DOCUMENT_TYPES[d.document_type]?.color}
                        >
                          {DOCUMENT_TYPES[d.document_type]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{d.department}</TableCell>
                      <TableCell className="text-xs">
                        {d.version || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.review_date
                          ? new Date(d.review_date).toLocaleDateString("en-ZA")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium 
${d.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-muted  text-muted-foreground"}`}
                        >
                          {d.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {d.file_url && (
                          <a
                            href={d.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-blue  hover:text-brand-teal"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <RiskRegisterDialog
        open={riskDialog}
        onOpenChange={setRiskDialog}
        editing={editingRisk}
        onSaved={load}
      />
      <VFLDialog open={vflDialog} onOpenChange={setVflDialog} onSaved={load} />
      <ToolboxTalkDialog
        open={tbtDialog}
        onOpenChange={setTbtDialog}
        editing={editingTbt}
        onSaved={load}
      />
      <DocumentUploadDialog
        open={docDialog}
        onOpenChange={setDocDialog}
        onSaved={load}
      />
    </div>
  );
}
