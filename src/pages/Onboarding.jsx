import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { OPERATION_TYPES, getOperationType } from "@/lib/operationTypes";
import { MODULES } from "@/lib/moduleAccess";
import { Check, ChevronRight, Building2, Boxes, Rocket } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState({
    company_name: "",
    registration_number: "",
    vat_number: "",
    address_line1: "",
    city: "",
    province: "",
    phone: "",
    email: "",
  });
  const [operationType, setOperationType] = useState("");
  const [selectedModules, setSelectedModules] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.operation_type) {
      setOperationType(user.operation_type);
      const opType = getOperationType(user.operation_type);
      if (opType) setSelectedModules(opType.modules);
    }
  }, [user]);

  const toggleModule = (key) => {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const complete = async () => {
    setSaving(true);
    try {
      // Save company profile
      const existing = await base44.entities.CompanyProfile.list();
      if (existing.length > 0) {
        await base44.entities.CompanyProfile.update(existing[0].id, {
          ...company,
          operation_type: operationType,
          fleet_size: 0,
        });
      } else {
        await base44.entities.CompanyProfile.create({
          ...company,
          operation_type: operationType,
          fleet_size: 0,
          billing_plan: "free",
          billing_status: "trialing",
        });
      }

      // Save module access and mark onboarding complete
      await base44.auth.updateMe({
        module_access: selectedModules,
        onboarding_completed: true,
        operation_type: operationType,
      });

      toast({
        title: "Workspace setup complete!",
        description: "Welcome to your  logistics command center",
      });
      window.location.href = "/";
    } catch (e) {
      toast({
        title: "Error completing setup",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const opType = getOperationType(operationType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100  flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full 
text-sm font-bold ${step >= s ? "gradient-brand text-white" : "bg-muted  text-muted-foreground"}`}
              >
                {step > s ? <Check size={16} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 w-12 rounded-full ${
                    step > s ? "bg-brand-teal" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <Card className="border-border/60 shadow-xl">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building2 size={20} className="text-brand-navy" /> Company
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Let's set up your company. You can change these details later
                  in Admin Settings.
                </p>{" "}
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  <div className="grid gap-1.5 col-span-2">
                    <Label>Company Name *</Label>
                    <Input
                      value={company.company_name}
                      onChange={(e) =>
                        setCompany({ ...company, company_name: e.target.value })
                      }
                      placeholder="Acme Logistics Pty Ltd"
                    />
                  </div>{" "}
                  <div className="grid gap-1.5">
                    <Label>Registration No.</Label>
                    <Input
                      value={company.registration_number}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          registration_number: e.target.value,
                        })
                      }
                      placeholder="2018/123456/07"
                    />
                  </div>{" "}
                  <div className="grid gap-1.5">
                    <Label>VAT Number</Label>
                    <Input
                      value={company.vat_number}
                      onChange={(e) =>
                        setCompany({ ...company, vat_number: e.target.value })
                      }
                      placeholder="4780123456"
                    />
                  </div>{" "}
                  <div className="grid gap-1.5 col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={company.address_line1}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          address_line1: e.target.value,
                        })
                      }
                      placeholder="123 Industrial Road"
                    />
                  </div>{" "}
                  <div className="grid gap-1.5">
                    <Label>City</Label>
                    <Input
                      value={company.city}
                      onChange={(e) =>
                        setCompany({ ...company, city: e.target.value })
                      }
                      placeholder="Johannesburg"
                    />
                  </div>{" "}
                  <div className="grid gap-1.5">
                    <Label>Province</Label>
                    <Input
                      value={company.province}
                      onChange={(e) =>
                        setCompany({ ...company, province: e.target.value })
                      }
                      placeholder="Gauteng"
                    />
                  </div>{" "}
                  <div className="grid gap-1.5">
                    <Label>Phone</Label>
                    <Input
                      value={company.phone}
                      onChange={(e) =>
                        setCompany({ ...company, phone: e.target.value })
                      }
                      placeholder="011 123 4567"
                    />
                  </div>{" "}
                  <div className="grid gap-1.5">
                    <Label>Email</Label>
                    <Input
                      value={company.email}
                      onChange={(e) =>
                        setCompany({ ...company, email: e.target.value })
                      }
                      placeholder="info@acme.co.za"
                    />
                  </div>{" "}
                </div>{" "}
                <Button
                  onClick={() => setStep(2)}
                  disabled={!company.company_name}
                  className="w-full gap-2 bg-brand-navy hover:bg-brand-navy/90"
                >
                  Continue <ChevronRight size={16} />
                </Button>{" "}
              </CardContent>{" "}
            </>
          )}{" "}
          {step === 2 && (
            <>
              {" "}
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Boxes size={20} className="text-brand-navy" /> Operation Type
                  & Modules
                </CardTitle>
              </CardHeader>{" "}
              <CardContent className="space-y-4">
                {" "}
                <div className="grid gap-1.5">
                  {" "}
                  <Label>Your Operation Type</Label>{" "}
                  <div className="grid gap-2">
                    {" "}
                    {OPERATION_TYPES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => {
                          setOperationType(t.key);
                          setSelectedModules(t.modules);
                        }}
                        className={`flex items-start gap-3 rounded-lg  border p-3 text-left transition ${operationType === t.key ? "border-brand-teal  bg-brand-teal/5 ring-1 ring-brand-teal/30" : "border-border  hover:bg-muted/30"}`}
                      >
                        {" "}
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center  rounded-full border-2 ${operationType === t.key ? "border-brand-teal  bg-brand-teal" : "border-muted"}`}
                        >
                          {" "}
                          {operationType === t.key && (
                            <Check size={12} className="text-white" />
                          )}{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <p className="text-sm font-semibold text-brand-navy">
                            {t.label}
                          </p>{" "}
                          <p className="text-xs text-muted-foreground">
                            {t.description}
                          </p>{" "}
                        </div>{" "}
                      </button>
                    ))}{" "}
                  </div>{" "}
                </div>{" "}
                {opType && (
                  <div className="rounded-lg border border-border p-3">
                    {" "}
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider  text-muted-foreground">
                      Modules for Your Operation ({selectedModules.length}{" "}
                      selected)
                    </p>{" "}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {" "}
                      {MODULES.map((m) => (
                        <label
                          key={m.key}
                          className={`flex items-center gap-2 rounded-md border  px-2.5 py-1.5 text-xs cursor-pointer ${selectedModules.includes(m.key) ? "border-brand-teal bg-brand-teal/5" : "border-border"}`}
                        >
                          {" "}
                          <input
                            type="checkbox"
                            checked={selectedModules.includes(m.key)}
                            onChange={() => toggleModule(m.key)}
                            className="h-3.5 w-3.5 rounded border-input"
                          />{" "}
                          <span className="font-medium">{m.label}</span>{" "}
                        </label>
                      ))}{" "}
                    </div>{" "}
                  </div>
                )}{" "}
                <div className="flex gap-2">
                  {" "}
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>{" "}
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!operationType}
                    className="flex-1 gap-2 bg-brand-navy hover:bg-brand-navy/90"
                  >
                    Continue <ChevronRight size={16} />
                  </Button>{" "}
                </div>{" "}
              </CardContent>{" "}
            </>
          )}{" "}
          {step === 3 && (
            <>
              {" "}
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Rocket size={20} className="text-brand-navy" /> Ready to
                  Launch
                </CardTitle>
              </CardHeader>{" "}
              <CardContent className="space-y-4">
                {" "}
                <div className="rounded-lg border border-brand-teal/30 bg-brand-teal/5 p-4">
                  {" "}
                  <p className="text-sm font-semibold  text-brand-navy">
                    {company.company_name}
                  </p>{" "}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {opType?.label} · {selectedModules.length} modules
                  </p>{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <p className="text-xs font-semibold uppercase tracking-wider  text-muted-foreground">
                    Selected Modules
                  </p>{" "}
                  <div className="flex flex-wrap gap-1.5">
                    {" "}
                    {selectedModules.map((key) => {
                      const mod = MODULES.find((m) => m.key === key);
                      return (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {mod?.label || key}
                        </Badge>
                      );
                    })}{" "}
                  </div>{" "}
                </div>{" "}
                <p className="text-xs text-muted-foreground">
                  You can customize your modules anytime in Admin Settings →
                  Users. Add your fleet, drivers, and loads next.
                </p>{" "}
                <div className="flex gap-2">
                  {" "}
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Back
                  </Button>{" "}
                  <Button
                    onClick={complete}
                    disabled={saving}
                    className="flex-1 gap-2  bg-brand-teal hover:bg-brand-teal/90"
                  >
                    {" "}
                    {saving ? (
                      "Setting up…"
                    ) : (
                      <>
                        <Rocket size={16} /> Launch Workspace
                      </>
                    )}{" "}
                  </Button>{" "}
                </div>{" "}
              </CardContent>{" "}
            </>
          )}{" "}
        </Card>{" "}
      </div>{" "}
    </div>
  );
}
