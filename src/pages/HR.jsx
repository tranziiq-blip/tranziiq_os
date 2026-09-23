import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Plus,
  Pencil,
  ExternalLink,
  Users,
  Gavel,
  CalendarDays,
  GraduationCap,
  FileText,
} from "lucide-react";
import EmployeeDialog from "@/components/hr/EmployeeDialog";
import EmployeeDocumentDialog from "@/components/hr/EmployeeDocumentDialog";
import DisciplinaryDialog from "@/components/hr/DisciplinaryDialog";
import LeaveDialog from "@/components/hr/LeaveDialog";
import TrainingDialog from "@/components/hr/TrainingDialog";
import CredentialsTab from "@/components/hr/CredentialsTab";
import TimeAttendanceTab from "@/components/hr/TimeAttendanceTab";
import {
  EMPLOYEE_STATUS,
  EMP_DOC_TYPES,
  DISCIPLINARY_TYPES,
  LEAVE_STATUS,
  LEAVE_TYPES,
  TRAINING_STATUS,
} from "@/lib/hrConstants";

export default function HR() {
  const [employees, setEmployees] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [disciplinary, setDisciplinary] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [training, setTraining] = useState([]);
  const [empDocs, setEmpDocs] = useState([]);
  const [shiftLogs, setShiftLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [empDialog, setEmpDialog] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [docDialog, setDocDialog] = useState(false);
  const [docEmp, setDocEmp] = useState(null);
  const [discDialog, setDiscDialog] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [trainDialog, setTrainDialog] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [emp, cred, drv, disc, lv, tr, docs, shifts] = await Promise.all([
        base44.entities.Employee.list("-created_date"),
        base44.entities.PersonnelCredential.list("-expiry_date"),
        base44.entities.Driver.list(),
        base44.entities.DisciplinaryAction.list("-created_date"),
        base44.entities.LeaveApplication.list("-created_date"),
        base44.entities.TrainingRequirement.list("-created_date"),
        base44.entities.EmployeeDocument.list("-created_date"),
        base44.entities.ShiftLog.list("-clock_in"),
      ]);
      setEmployees(emp);
      setCredentials(cred);
      setDrivers(drv);
      setDisciplinary(disc);
      setLeaves(lv);
      setTraining(tr);
      setEmpDocs(docs);
      setShiftLogs(shifts);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const onLeave = employees.filter((e) => e.status === "on_leave").length;
  const pendingLeave = leaves.filter((l) => l.status === "pending").length;
  const overdueTraining = training.filter(
    (t) =>
      t.status === "overdue" ||
      (t.required_by_date &&
        new Date(t.required_by_date) < new Date() &&
        t.status !== "completed"),
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
          Human Resources
        </h1>
        <p className="text-sm text-muted-foreground">
          Employee management · credentials · disciplinary · leave · training
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            l: "Total Employees",
            v: employees.length,
            s: `${activeEmployees} 
active`,
            i: Users,
            t: "text-brand-blue",
          },
          {
            l: "On Leave",
            v: onLeave,
            s: `${pendingLeave} pending`,
            i: CalendarDays,
            t: "text-amber-500",
          },
          {
            l: "Disciplinary",
            v: disciplinary.filter((d) => d.status === "open").length,
            s: "open cases",
            i: Gavel,
            t: "text-rose-500",
          },
          {
            l: "Training Overdue",
            v: overdueTraining,
            s: "requirements",
            i: GraduationCap,
            t: "text-orange-500",
          },
        ].map((k) => (
          <Card key={k.l} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{k.l}</p>
                <k.i className={k.t} size={16} />
              </div>
              <p className="mt-1 font-display text-2xl font-bold  text-brand-navy">
                {loading ? "—" : k.v}
              </p>
              <p className="text-xs  text-muted-foreground">{k.s}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="employees">
        <TabsList className="flex-wrap">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Time &amp; Attendance</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="disciplinary">Disciplinary</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        {/* EMPLOYEES */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingEmp(null);
                setEmpDialog(true);
              }}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Add Employee
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center  text-muted-foreground py-8"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && employees.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No employees added yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {employees.map((e) => (
                    <TableRow key={e.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-brand-navy">
                        {e.full_name}
                      </TableCell>
                      <TableCell className="text-sm">{e.job_title}</TableCell>
                      <TableCell className="text-xs">{e.department}</TableCell>
                      <TableCell className="text-xs capitalize">
                        {e.employment_type}
                      </TableCell>
                      <TableCell className="text-xs">
                        {e.phone || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={EMPLOYEE_STATUS[e.status]?.color}>
                          {EMPLOYEE_STATUS[e.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingEmp(e);
                              setEmpDialog(true);
                            }}
                            className="rounded-md p-1.5 text-brand-blue hover:bg-brand-blue/10"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDocEmp(e);
                              setDocDialog(true);
                            }}
                            className="rounded-md p-1.5 text-brand-teal hover:bg-brand-teal/10"
                            title="Upload Document"
                          >
                            <FileText size={14} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIME & ATTENDANCE — auto-synced from all clock-ins/outs */}
        <TabsContent value="attendance">
          <TimeAttendanceTab shiftLogs={shiftLogs} onDataChanged={load} />
        </TabsContent>

        {/* CREDENTIALS */}
        <TabsContent value="credentials">
          <CredentialsTab
            credentials={credentials}
            drivers={drivers}
            onDataChanged={load}
          />
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setDocEmp(null);
                setDocDialog(true);
              }}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Upload Document
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empDocs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No documents uploaded yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {empDocs.map((d) => (
                    <TableRow key={d.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-brand-navy  text-sm">
                        {d.employee_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={EMP_DOC_TYPES[d.document_type]?.color}
                        >
                          {EMP_DOC_TYPES[d.document_type]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.document_name || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.uploaded_date
                          ? new Date(d.uploaded_date).toLocaleDateString(
                              "en-ZA",
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.expiry_date
                          ? new Date(d.expiry_date).toLocaleDateString("en-ZA")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {d.file_url && (
                          <a
                            href={d.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-blue  hover:text-brand-teal"
                          >
                            <ExternalLink size={14} />
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

        {/* DISCIPLINARY */}
        <TabsContent value="disciplinary" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setDiscDialog(true)}
              className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus size={16} />
              Record Action
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Incident Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disciplinary.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No disciplinary actions recorded.
                      </TableCell>
                    </TableRow>
                  )}
                  {disciplinary.map((d) => (
                    <TableRow key={d.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-brand-navy  text-sm">
                        {d.employee_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={DISCIPLINARY_TYPES[d.action_type]?.color}
                        >
                          {DISCIPLINARY_TYPES[d.action_type]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(d.incident_date).toLocaleDateString("en-ZA")}
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground  truncate">
                        {d.description}
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground  truncate">
                        {d.outcome || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium 
${d.status === "open" ? "bg-amber-100 text-amber-700" : "bg-emerald-100  text-emerald-700"}`}
                        >
                          {d.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEAVE */}
        <TabsContent value="leave" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setLeaveDialogOpen(true)}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Apply Leave
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No leave applications.
                      </TableCell>
                    </TableRow>
                  )}
                  {leaves.map((l) => (
                    <TableRow key={l.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-brand-navy  text-sm">
                        {l.employee_name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {LEAVE_TYPES.find((t) => t.key === l.leave_type)
                          ?.label || l.leave_type}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(l.start_date).toLocaleDateString("en-ZA")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(l.end_date).toLocaleDateString("en-ZA")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {l.days_requested}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium 
${LEAVE_STATUS[l.status]?.color}`}
                        >
                          {LEAVE_STATUS[l.status]?.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRAINING */}
        <TabsContent value="training" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setTrainDialog(true)}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Add Training
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Training</TableHead>
                    <TableHead>Required By</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {training.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        No training requirements.
                      </TableCell>
                    </TableRow>
                  )}
                  {training.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-brand-navy  text-sm">
                        {t.employee_name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.training_type}
                      </TableCell>
                      <TableCell className="text-xs">
                        {t.required_by_date
                          ? new Date(t.required_by_date).toLocaleDateString(
                              "en-ZA",
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {t.completion_date
                          ? new Date(t.completion_date).toLocaleDateString(
                              "en-ZA",
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium 
${TRAINING_STATUS[t.status]?.color}`}
                        >
                          {TRAINING_STATUS[t.status]?.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EmployeeDialog
        open={empDialog}
        onOpenChange={setEmpDialog}
        editing={editingEmp}
        onSaved={load}
      />
      <EmployeeDocumentDialog
        open={docDialog}
        onOpenChange={setDocDialog}
        employee={docEmp}
        employees={employees}
        onSaved={load}
      />
      <DisciplinaryDialog
        open={discDialog}
        onOpenChange={setDiscDialog}
        employees={employees}
        onSaved={load}
      />
      <LeaveDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        employees={employees}
        onSaved={load}
      />
      <TrainingDialog
        open={trainDialog}
        onOpenChange={setTrainDialog}
        employees={employees}
        onSaved={load}
      />
    </div>
  );
}
