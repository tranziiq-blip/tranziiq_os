import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Wallet,
  FileText,
  Receipt,
  Plus,
  Pencil,
  CheckCircle2,
  Clock,
  TrendingDown,
  Calculator,
  Banknote,
  ExternalLink,
  Building2,
} from "lucide-react";
import BudgetDialog from "@/components/finance/BudgetDialog";
import FinancialDocDialog from "@/components/finance/FinancialDocDialog";
import BankTransactionDialog from "@/components/finance/BankTransactionDialog";
import {
  BUDGET_CATEGORIES,
  FIN_DOC_TYPES,
  FIN_DOC_STATUS,
} from "@/lib/financeConstants";

const INV_STATUS = {
  unbilled: "bg-slate-100 text-slate-600",
  invoiced: "bg-sky-100 text-sky-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-rose-100 text-rose-700",
};
const EXP_CAT = {
  fuel: "bg-blue-100 text-blue-700",
  toll: "bg-purple-100  text-purple-700",
  maintenance: "bg-amber-100 text-amber-700",
  driver_allowance: "bg-teal-100 text-teal-700",
  border_clearance: "bg-rose-100 text-rose-700",
  other: "bg-slate-100 text-slate-600",
};
const PAY_STATUS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-sky-100 text-sky-700",
  paid: "bg-emerald-100 text-emerald-700",
};
const rand = (n) =>
  `R ${Number(n || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
function daysOverdue(due) {
  if (!due) return 0;
  return Math.floor((Date.now() - new Date(due).getTime()) / 86400000);
}

export default function Finance() {
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loads, setLoads] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [finDocs, setFinDocs] = useState([]);
  const [bankTxns, setBankTxns] = useState([]);
  const [telematics, setTelematics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [invOpen, setInvOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [finDocOpen, setFinDocOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [invForm, setInvForm] = useState({
    invoice_number: "",
    client: "",
    load_id: "",
    invoice_date: "",
    due_date: "",
    amount: 0,
    pod_captured: false,
    pod_date: "",
    notes: "",
  });
  const [expForm, setExpForm] = useState({
    expense_date: "",
    category: "fuel",
    truck_id: "",
    load_id: "",
    vendor: "",
    amount: 0,
    reference: "",
    notes: "",
  });
  const [payForm, setPayForm] = useState({
    driver_id: "",
    period: "",
    base_salary: 0,
    trips_completed: 0,
    trip_incentive: 0,
    overtime_hours: 0,
    overtime_pay: 0,
    deductions: 0,
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [inv, exp, pay, l, t, d, bg, fd, bt, tel] = await Promise.all([
        base44.entities.Invoice.list("-invoice_date"),
        base44.entities.Expense.list("-expense_date"),
        base44.entities.PayrollEntry.list("-period"),
        base44.entities.Load.list(),
        base44.entities.Truck.list(),
        base44.entities.Driver.list(),
        base44.entities.Budget.list("-period_month").catch(() => []),
        base44.entities.FinancialDoc.list("-created_date").catch(() => []),
        base44.entities.BankTransaction.list("-transaction_date").catch(
          () => [],
        ),
        base44.entities.TelematicsReading.list().catch(() => []),
      ]);
      setInvoices(inv);
      setExpenses(exp);
      setPayroll(pay);
      setLoads(l);
      setTrucks(t);
      setDrivers(d);
      setBudgets(bg);
      setFinDocs(fd);
      setBankTxns(bt);
      setTelematics(tel);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const loadNum = (id) => loads.find((l) => l.id === id)?.load_number || "";
  const truckReg = (id) =>
    trucks.find((t) => t.id === id)?.registration_number || "";
  const driverName = (id) => drivers.find((d) => d.id === id)?.full_name || "";

  // Financial metrics
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const outstanding = invoices
    .filter((i) => ["invoiced", "overdue"].includes(i.status))
    .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalPayroll = payroll
    .filter((p) => p.status !== "pending")
    .reduce((s, p) => s + (p.total_pay || 0), 0);
  const netProfit = totalRevenue - totalExpenses - totalPayroll;
  const totalDistance = telematics.reduce(
    (s, t) => s + (t.distance_km || 0),
    0,
  );
  const totalCosts = totalExpenses + totalPayroll;
  const cpk = totalDistance > 0 ? totalCosts / totalDistance : 0;
  const rpk = totalDistance > 0 ? totalRevenue / totalDistance : 0;
  const marginPerKm = rpk - cpk;
  const budgetedTotal = budgets.reduce(
    (s, b) => s + (b.budgeted_amount || 0),
    0,
  );
  const actualTotal = budgets.reduce((s, b) => s + (b.actual_amount || 0), 0);
  const budgetedDist = budgets.reduce(
    (s, b) => s + (b.budgeted_distance_km || 0),
    0,
  );
  const budgetedCpk = budgetedDist > 0 ? budgetedTotal / budgetedDist : 0;

  // Invoice actions
  const openInvNew = () => {
    setEditing(null);
    setInvForm({
      invoice_number: `INV-${String(invoices.length + 1).padStart(4, "0")}`,
      client: "",
      load_id: "",
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: "",
      amount: 0,
      pod_captured: false,
      pod_date: "",
      notes: "",
    });
    setInvOpen(true);
  };
  const openInvEdit = (i) => {
    setEditing(i);
    setInvForm({ ...i });
    setInvOpen(true);
  };
  const saveInv = async () => {
    if (!invForm.invoice_number || !invForm.client || !invForm.amount) {
      toast({
        title: "Number, client & amount required",
        variant: "destructive",
      });
      return;
    }
    const vat = Math.round(invForm.amount * 0.15 * 100) / 100;
    const data = {
      ...invForm,
      vat_amount: vat,
      total_amount: Number(invForm.amount) + vat,
      load_number: loadNum(invForm.load_id),
      truck_registration: loads.find((l) => l.id === invForm.load_id)?.truck_id
        ? truckReg(loads.find((l) => l.id === invForm.load_id).truck_id)
        : "",
    };
    if (editing) await base44.entities.Invoice.update(editing.id, data);
    else await base44.entities.Invoice.create(data);
    toast({ title: editing ? "Invoice updated" : "Invoice created" });
    setInvOpen(false);
    load();
  };
  const advanceInv = async (i) => {
    const flow = ["unbilled", "invoiced", "paid"];
    const idx = flow.indexOf(i.status === "overdue" ? "invoiced" : i.status);
    const next = flow[idx + 1] || "paid";
    const updates = { status: next };
    if (next === "paid")
      updates.paid_date = new Date().toISOString().slice(0, 10);
    await base44.entities.Invoice.update(i.id, updates);
    toast({
      title: `Marked 
${next}`,
    });
    load();
  };
  const togglePod = async (i) => {
    await base44.entities.Invoice.update(i.id, {
      pod_captured: !i.pod_captured,
      pod_date: !i.pod_captured ? new Date().toISOString().slice(0, 10) : "",
    });
    toast({
      title: `POD 
${!i.pod_captured ? "captured" : "uncaptured"}`,
    });
    load();
  };

  // Expense actions
  const openExpNew = () => {
    setEditing(null);
    setExpForm({
      expense_date: new Date().toISOString().slice(0, 10),
      category: "fuel",
      truck_id: "",
      load_id: "",
      vendor: "",
      amount: 0,
      reference: "",
      notes: "",
    });
    setExpOpen(true);
  };
  const openExpEdit = (e) => {
    setEditing(e);
    setExpForm({ ...e });
    setExpOpen(true);
  };
  const saveExp = async () => {
    if (!expForm.expense_date || !expForm.amount) {
      toast({ title: "Date & amount  required", variant: "destructive" });
      return;
    }
    const data = {
      ...expForm,
      truck_registration: truckReg(expForm.truck_id),
      load_number: loadNum(expForm.load_id),
    };
    if (editing) await base44.entities.Expense.update(editing.id, data);
    else await base44.entities.Expense.create(data);
    toast({ title: editing ? "Expense updated" : "Expense captured" });
    setExpOpen(false);
    load();
  };

  // Payroll actions
  const openPayNew = () => {
    setEditing(null);
    setPayForm({
      driver_id: "",
      period: new Date().toISOString().slice(0, 7),
      base_salary: 0,
      trips_completed: 0,
      trip_incentive: 0,
      overtime_hours: 0,
      overtime_pay: 0,
      deductions: 0,
      notes: "",
    });
    setPayOpen(true);
  };
  const openPayEdit = (p) => {
    setEditing(p);
    setPayForm({ ...p });
    setPayOpen(true);
  };
  const savePay = async () => {
    if (!payForm.driver_id || !payForm.period) {
      toast({ title: "Driver & period  required", variant: "destructive" });
      return;
    }
    const total =
      Number(payForm.base_salary) +
      Number(payForm.trip_incentive) +
      Number(payForm.overtime_pay) -
      Number(payForm.deductions);
    const data = {
      ...payForm,
      driver_name: driverName(payForm.driver_id),
      employee_number:
        drivers.find((d) => d.id === payForm.driver_id)?.employee_number || "",
      total_pay: total,
    };
    if (editing) await base44.entities.PayrollEntry.update(editing.id, data);
    else await base44.entities.PayrollEntry.create(data);
    toast({ title: editing ? "Payroll updated" : "Payroll entry created" });
    setPayOpen(false);
    load();
  };
  const advancePay = async (p) => {
    const flow = ["pending", "approved", "paid"];
    const next = flow[flow.indexOf(p.status) + 1] || "paid";
    await base44.entities.PayrollEntry.update(p.id, { status: next });
    toast({ title: `Marked ${next}` });
    load();
  };

  // Auto-flag overdue
  useEffect(() => {
    const overdue = invoices.filter(
      (i) =>
        i.status === "invoiced" && i.due_date && daysOverdue(i.due_date) > 0,
    );
    if (overdue.length > 0 && !loading) {
      base44.entities.Invoice.updateMany(
        {
          status: "invoiced",
          due_date: { $lt: new Date().toISOString().slice(0, 10) },
        },
        { $set: { status: "overdue" } },
      )
        .then(() => load())
        .catch(() => {}); // read-only accounts can't auto-flag; not an error
    }
  }, [loading]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
          Finance & Admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Budgeting · invoicing · payroll · financial documents · reconciliation
          · CPK analysis
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="cpk">CPK Analysis</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                l: "Revenue (Paid)",
                v: rand(totalRevenue),
                s: `${
                  invoices.filter((i) => i.status === "paid").length
                } invoices`,
                i: Wallet,
                t: "text-emerald-500",
              },
              {
                l: "Outstanding",
                v: rand(outstanding),
                s: `${overdueCount} overdue`,
                i: Clock,
                t: "text-amber-500",
              },
              {
                l: "Total Costs",
                v: rand(totalCosts),
                s: `expenses + 
payroll`,
                i: Receipt,
                t: "text-rose-500",
              },
              {
                l: "Net Profit",
                v: rand(netProfit),
                s: "after costs",
                i: TrendingDown,
                t: netProfit >= 0 ? "text-brand-teal" : "text-rose-500",
              },
            ].map((k) => (
              <Card key={k.l} className="border-border/60 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{k.l}</p>
                    <k.i className={k.t} size={16} />
                  </div>
                  <p className="mt-1 font-display text-xl font-bold  text-brand-navy">
                    {loading ? "—" : k.v}
                  </p>
                  <p className="text-xs  text-muted-foreground">{k.s}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Budget vs Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {budgets.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No budgets created yet.
                  </p>
                )}
                {budgets.slice(0, 6).map((b) => {
                  const variance =
                    (b.actual_amount || 0) - (b.budgeted_amount || 0);
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="font-medium">
                        {BUDGET_CATEGORIES.find((c) => c.key === b.category)
                          ?.label || b.category}
                      </span>
                      <span
                        className={
                          variance > 0 ? "text-rose-600" : "text-emerald-600"
                        }
                      >
                        {rand(variance)}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Cost per Kilometer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Distance</span>
                  <span className="font-bold text-brand-navy">
                    {totalDistance.toLocaleString("en-ZA")}
                    km
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Costs</span>
                  <span className="font-bold">{rand(totalCosts)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-bold text-emerald-600">
                    {rand(totalRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border/40  pt-2 text-sm">
                  <span className="font-semibold text-brand-navy">
                    Actual CPK
                  </span>
                  <span className="font-display text-lg font-bold text-brand-navy">
                    R{cpk.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Revenue per km (RPK)
                  </span>
                  <span className="font-bold text-emerald-600">
                    R {rpk.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Margin per km</span>
                  <span
                    className={`font-bold ${
                      marginPerKm >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    R {marginPerKm.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* INVOICES */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={openInvNew}
              className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus size={16} /> New Invoice
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border  bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                      Invoice #
                    </th>
                    <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                      Client
                    </th>
                    <th className="px-4 py-3  text-right font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4  py-3 text-left font-medium text-muted-foreground">
                      Due
                    </th>
                    <th className="px-4  py-3 text-center font-medium text-muted-foreground">
                      POD
                    </th>
                    <th className="px-4  py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center text-muted-foreground  py-8"
                      >
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && invoices.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No invoices yet.
                      </td>
                    </tr>
                  )}
                  {invoices.map((i) => (
                    <tr
                      key={i.id}
                      className="border-b border-border/50 last:border-0  hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium  text-brand-navy">
                        {i.invoice_number}
                      </td>
                      <td className="px-4 py-3 font-semibold">{i.client}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {rand(i.total_amount || i.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {i.due_date
                          ? new Date(i.due_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => togglePod(i)}
                          className={`rounded-full p-1.5 ${i.pod_captured ? "text-emerald-600  bg-emerald-50" : "text-slate-400 bg-slate-50 hover:bg-slate-100"}`}
                          title="Toggle POD"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs 
font-medium ${INV_STATUS[i.status]}`}
                        >
                          {i.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openInvEdit(i)}
                            className="rounded-md p-1.5  text-muted-foreground hover:bg-muted"
                          >
                            <Pencil size={15} />
                          </button>
                          {i.status !== "paid" && (
                            <button
                              onClick={() => advanceInv(i)}
                              className="rounded-md  bg-brand-teal/10 px-2 py-1 text-xs font-medium text-brand-teal  hover:bg-brand-teal/20"
                            >
                              Advance
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPENSES */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={openExpNew}
              className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus size={16} />
              Capture Expense
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border  bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                      Truck
                    </th>
                    <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                      Vendor
                    </th>
                    <th className="px-4 py-3  text-right font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4  py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-muted-foreground  py-8"
                      >
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && expenses.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No expenses captured.
                      </td>
                    </tr>
                  )}
                  {expenses.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border/50 last:border-0  hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {e.expense_date
                          ? new Date(e.expense_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={EXP_CAT[e.category]}>
                          {e.category.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {e.truck_registration || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">{e.vendor || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {rand(e.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openExpEdit(e)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                        >
                          <Pencil size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYROLL */}
        <TabsContent value="payroll" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={openPayNew}
              className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Add Payroll Entry
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border  bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                      Driver
                    </th>
                    <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                      Period
                    </th>
                    <th className="px-4 py-3  text-right font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="px-4  py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center text-muted-foreground  py-8"
                      >
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && payroll.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        No payroll entries.
                      </td>
                    </tr>
                  )}
                  {payroll.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 last:border-0  hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-semibold text-brand-navy">
                        {p.driver_name}
                      </td>
                      <td className="px-4 py-3 text-xs">{p.period}</td>
                      <td className="px-4 py-3 text-right font-bold  text-brand-navy">
                        {rand(p.total_pay)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs 
font-medium ${PAY_STATUS[p.status]}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openPayEdit(p)}
                            className="rounded-md p-1.5  text-muted-foreground hover:bg-muted"
                          >
                            <Pencil size={15} />
                          </button>
                          {p.status !== "paid" && (
                            <button
                              onClick={() => advancePay(p)}
                              className="rounded-md  bg-brand-teal/10 px-2 py-1 text-xs font-medium text-brand-teal  hover:bg-brand-teal/20"
                            >
                              Advance
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BUDGET */}
        <TabsContent value="budget" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingBudget(null);
                setBudgetOpen(true);
              }}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Create Budget
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border  bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                      Dept
                    </th>
                    <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                      Period
                    </th>
                    <th className="px-4 py-3  text-right font-medium text-muted-foreground">
                      Budgeted
                    </th>
                    <th className="px-4  py-3 text-right font-medium text-muted-foreground">
                      Actual
                    </th>
                    <th className="px-4 py-3 text-right font-medium  text-muted-foreground">
                      Variance
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center  text-muted-foreground py-8"
                      >
                        No budgets created yet.
                      </td>
                    </tr>
                  )}
                  {budgets.map((b) => {
                    const v = (b.actual_amount || 0) - (b.budgeted_amount || 0);
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-border/50 last:border-0  hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-semibold text-brand-navy">
                          {b.budget_name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              BUDGET_CATEGORIES.find(
                                (c) => c.key === b.category,
                              )?.color
                            }
                          >
                            {
                              BUDGET_CATEGORIES.find(
                                (c) => c.key === b.category,
                              )?.label
                            }
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">{b.department}</td>
                        <td className="px-4 py-3 text-xs">
                          {b.period_month
                            ? new Date(b.period_month).toLocaleDateString(
                                "en-ZA",
                                { month: "short", year: "numeric" },
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right  font-semibold">
                          {rand(b.budgeted_amount)}
                        </td>
                        <td className="px-4 py-3 text-right  font-semibold">
                          {rand(b.actual_amount)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            v > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {rand(v)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setEditingBudget(b);
                              setBudgetOpen(true);
                            }}
                            className="rounded-md p-1.5 text-brand-blue  hover:bg-brand-blue/10"
                          >
                            <Pencil size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setFinDocOpen(true)}
              className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus size={16} />
              Create Document
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border  bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                      Number
                    </th>
                    <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                      Client / Supplier
                    </th>
                    <th className="px-4  py-3 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4  py-3 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {finDocs.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center  text-muted-foreground py-8"
                      >
                        No financial documents yet.
                      </td>
                    </tr>
                  )}
                  {finDocs.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-border/50 last:border-0  hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium  text-brand-navy">
                        {d.document_number}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={FIN_DOC_TYPES[d.document_type]?.color}
                        >
                          {FIN_DOC_TYPES[d.document_type]?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {d.client_supplier}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {d.document_date
                          ? new Date(d.document_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {rand(d.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs 
font-medium 
${FIN_DOC_STATUS[d.status]?.color}`}
                        >
                          {FIN_DOC_STATUS[d.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECONCILIATION */}
        <TabsContent value="reconciliation" className="space-y-4">
          <Card className="border-border/60 bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-brand-navy" />
                <p className="text-sm font-semibold  text-brand-navy">
                  Banking & Accounting Integration
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Record bank transactions manually below for reconciliation. To
                connect an accounting system (QuickBooks, FreshBooks, etc.) or
                import bank statements, contact your workspace admin to set up
                an integration connector.
              </p>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button
              onClick={() => setBankOpen(true)}
              className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
            >
              <Plus size={16} /> Add Transaction
            </Button>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0  overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border  bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left  font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right  font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-3  text-left font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4  py-3 text-center font-medium text-muted-foreground">
                      Reconciled
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bankTxns.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center  text-muted-foreground py-8"
                      >
                        No bank transactions recorded.
                      </td>
                    </tr>
                  )}
                  {bankTxns.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-border/50 last:border-0  hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-xs">
                        {new Date(t.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">{t.description}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            t.transaction_type === "credit"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100  text-rose-700"
                          }
                        >
                          {t.transaction_type}
                        </Badge>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          t.transaction_type === "credit"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {t.transaction_type === "credit" ? "+" : "-"}
                        {rand(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs">{t.category || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {t.reconciled ? (
                          <CheckCircle2
                            size={16}
                            className="mx-auto text-emerald-600"
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CPK ANALYSIS */}
        <TabsContent value="cpk" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                l: "Total Distance",
                v: `${totalDistance.toLocaleString("en-ZA")} km`,
                s: "from telematics",
                i: Calculator,
                t: "text-brand-blue",
              },
              {
                l: "Actual CPK",
                v: `R ${cpk.toFixed(2)}`,
                s: "cost per km",
                i: Receipt,
                t: "text-rose-500",
              },
              {
                l: "Revenue per km",
                v: `R ${rpk.toFixed(2)}`,
                s: "RPK",
                i: Wallet,
                t: "text-emerald-500",
              },
              {
                l: "Margin per km",
                v: `R ${marginPerKm.toFixed(2)}`,
                s: "RPK - CPK",
                i: TrendingDown,
                t: marginPerKm >= 0 ? "text-brand-teal" : "text-rose-500",
              },
            ].map((k) => (
              <Card key={k.l} className="border-border/60 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{k.l}</p>
                    <k.i className={k.t} size={16} />
                  </div>
                  <p className="mt-1 font-display text-xl font-bold  text-brand-navy">
                    {k.v}
                  </p>
                  <p className="text-xs  text-muted-foreground">{k.s}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Budgeted vs Actual CPK
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Budgeted CPK</span>
                <span className="font-display text-lg font-bold text-brand-navy">
                  R{budgetedCpk.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Actual CPK</span>
                <span className="font-display text-lg font-bold text-brand-navy">
                  R{cpk.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40  pt-2 text-sm">
                <span className="font-semibold  text-brand-navy">Variance</span>
                <span
                  className={`font-bold ${
                    cpk > budgetedCpk ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  R {(cpk - budgetedCpk).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {cpk > budgetedCpk
                  ? "Actual CPK  exceeds budget — investigate cost drivers."
                  : "CPK is within budget."}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Cost Breakdown by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(EXP_CAT).map(([key, color]) => {
                const total = expenses
                  .filter((e) => e.category === key)
                  .reduce((s, e) => s + (e.amount || 0), 0);
                if (total === 0) return null;
                const pct =
                  totalCosts > 0 ? Math.round((total / totalCosts) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between  text-xs">
                      <span className="font-medium capitalize">
                        {key.replace("_", "  ")}
                      </span>
                      <span>
                        {rand(total)} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2  w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full gradient-brand"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BudgetDialog
        open={budgetOpen}
        onOpenChange={setBudgetOpen}
        editing={editingBudget}
        onSaved={load}
      />
      <FinancialDocDialog
        open={finDocOpen}
        onOpenChange={setFinDocOpen}
        onSaved={load}
      />
      <BankTransactionDialog
        open={bankOpen}
        onOpenChange={setBankOpen}
        onSaved={load}
      />

      {/* Invoice Dialog */}
      <Dialog open={invOpen} onOpenChange={setInvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Invoice" : "New  Invoice"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid  gap-2">
                <Label>Invoice Number</Label>
                <Input
                  value={invForm.invoice_number}
                  onChange={(e) =>
                    setInvForm({ ...invForm, invoice_number: e.target.value })
                  }
                  className="font-mono"
                />
              </div>
              <div className="grid  gap-2">
                <Label>Client</Label>
                <Input
                  value={invForm.client}
                  onChange={(e) =>
                    setInvForm({ ...invForm, client: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Associated Load</Label>
              <Select
                value={invForm.load_id}
                onValueChange={(v) => setInvForm({ ...invForm, load_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select load" />
                </SelectTrigger>
                <SelectContent>
                  {loads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.load_number} —{l.client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid  gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={invForm.invoice_date || ""}
                  onChange={(e) =>
                    setInvForm({ ...invForm, invoice_date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={invForm.due_date || ""}
                  onChange={(e) =>
                    setInvForm({ ...invForm, due_date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Amount (excl VAT)</Label>
                <Input
                  type="number"
                  value={invForm.amount}
                  onChange={(e) =>
                    setInvForm({ ...invForm, amount: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex  justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{rand(invForm.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (15%)</span>
                <span>{rand(invForm.amount * 0.15)}</span>
              </div>
              <div className="flex justify-between font-bold  text-brand-navy">
                <span>Total</span>
                <span>{rand(Number(invForm.amount) * 1.15)}</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={invForm.notes}
                onChange={(e) =>
                  setInvForm({ ...invForm, notes: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveInv}
              className="bg-brand-navy hover:bg-brand-navy/90"
            >
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={expOpen} onOpenChange={setExpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Expense" : "Capture  Expense"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid  gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={expForm.expense_date || ""}
                  onChange={(e) =>
                    setExpForm({ ...expForm, expense_date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={expForm.category}
                  onValueChange={(v) => setExpForm({ ...expForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "fuel",
                      "toll",
                      "maintenance",
                      "driver_allowance",
                      "border_clearance",
                      "other",
                    ].map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c.replace("_", "  ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid  gap-2">
                <Label>Truck</Label>
                <Select
                  value={expForm.truck_id}
                  onValueChange={(v) => setExpForm({ ...expForm, truck_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select truck" />
                  </SelectTrigger>
                  <SelectContent>
                    {trucks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.registration_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Load</Label>
                <Select
                  value={expForm.load_id}
                  onValueChange={(v) => setExpForm({ ...expForm, load_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select load" />
                  </SelectTrigger>
                  <SelectContent>
                    {loads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.load_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid  gap-2">
                <Label>Vendor</Label>
                <Input
                  value={expForm.vendor}
                  onChange={(e) =>
                    setExpForm({ ...expForm, vendor: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={expForm.amount}
                  onChange={(e) =>
                    setExpForm({ ...expForm, amount: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Reference</Label>
              <Input
                value={expForm.reference}
                onChange={(e) =>
                  setExpForm({ ...expForm, reference: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={expForm.notes}
                onChange={(e) =>
                  setExpForm({ ...expForm, notes: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveExp}
              className="bg-brand-navy hover:bg-brand-navy/90"
            >
              {editing ? "Save" : "Capture"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Payroll Entry" : "Add Payroll  Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid  gap-2">
                <Label>Driver</Label>
                <Select
                  value={payForm.driver_id}
                  onValueChange={(v) =>
                    setPayForm({ ...payForm, driver_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Period</Label>
                <Input
                  type="month"
                  value={payForm.period}
                  onChange={(e) =>
                    setPayForm({ ...payForm, period: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid  gap-2">
                <Label>Base Salary</Label>
                <Input
                  type="number"
                  value={payForm.base_salary}
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      base_salary: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid  gap-2">
                <Label>Trips Completed</Label>
                <Input
                  type="number"
                  value={payForm.trips_completed}
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      trips_completed: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid  gap-2">
                <Label>Trip Incentive</Label>
                <Input
                  type="number"
                  value={payForm.trip_incentive}
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      trip_incentive: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid  gap-2">
                <Label>Overtime Pay</Label>
                <Input
                  type="number"
                  value={payForm.overtime_pay}
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      overtime_pay: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid  gap-2">
                <Label>Overtime Hours</Label>
                <Input
                  type="number"
                  value={payForm.overtime_hours}
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      overtime_hours: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid  gap-2">
                <Label>Deductions</Label>
                <Input
                  type="number"
                  value={payForm.deductions}
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      deductions: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex  justify-between font-bold text-brand-navy">
                <span>Total Pay</span>
                <span>
                  {rand(
                    Number(payForm.base_salary) +
                      Number(payForm.trip_incentive) +
                      Number(payForm.overtime_pay) -
                      Number(payForm.deductions),
                  )}
                </span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={payForm.notes}
                onChange={(e) =>
                  setPayForm({ ...payForm, notes: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={savePay}
              className="bg-brand-navy hover:bg-brand-navy/90"
            >
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
