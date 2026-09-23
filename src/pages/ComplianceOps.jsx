import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Flame,
  Snowflake,
  Package,
  ShieldAlert,
  FileWarning,
  BadgeCheck,
} from "lucide-react";
import ProfilesTab from "@/components/compliance/ProfilesTab";
import ExpiryRegisterTab from "@/components/compliance/ExpiryRegisterTab";
import IncidentsTab from "@/components/compliance/IncidentsTab";

const TYPE_ICONS = {
  dg_hazmat: Flame,
  cold_chain: Snowflake,
  abnormal_load: Package,
};
const TYPE_LABELS = {
  dg_hazmat: "DG / Hazmat",
  cold_chain: "Cold Chain",
  abnormal_load: "Abnormal Loads",
};

export default function ComplianceOps() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loads, setLoads] = useState([]);
  const [addons, setAddons] = useState([]);
  const [tab, setTab] = useState("");

  const load = async () => {
    try {
      const [p, d, i, l, cp] = await Promise.all([
        base44.entities.ComplianceProfile.list("-created_date"),
        base44.entities.ComplianceDocument.list("-expiry_date"),
        base44.entities.ComplianceIncident.list("-created_date"),
        base44.entities.Load.list("-created_date", 100),
        base44.entities.CompanyProfile.list(),
      ]);
      setProfiles(p);
      setDocuments(d);
      setIncidents(i);
      setLoads(l);
      setAddons(cp[0]?.selected_addons || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-muted border-t-brand-teal rounded-full  animate-spin" />
      </div>
    );

  const subscribed = Object.keys(TYPE_ICONS).filter((t) => addons.includes(t));

  if (subscribed.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Specialized Compliance
          </h1>
          <p className="text-sm text-muted-foreground">
            DG/hazmat · cold-chain monitoring · abnormal-load permits
          </p>
        </div>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-10 text-center">
            <ShieldAlert
              className="mx-auto text-muted-foreground/40"
              size={40}
            />
            <p className="mt-3 font-semibold text-brand-navy">
              No specialized compliance modules subscribed
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Enable the DG / Hazmat, Cold-Chain Monitoring or Abnormal-Load
              Permits add-ons under Admin → Billing to activate this workspace.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
            Specialized Compliance
          </h1>
          <p className="text-sm text-muted-foreground">
            Jurisdiction-aware compliance for subscribed specialized operations
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-teal/10 px-3  py-1 text-xs font-medium text-brand-navy">
          <BadgeCheck size={14} className="text-brand-teal" />{" "}
          {subscribed.length}
          module{subscribed.length !== 1 ? "s" : ""} active
        </span>
      </div>

      <Tabs value={tab || subscribed[0]} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {subscribed.map((t) => {
            const Icon = TYPE_ICONS[t];
            return (
              <TabsTrigger key={t} value={t} className="gap-1.5">
                <Icon size={14} /> {TYPE_LABELS[t]}
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="expiry" className="gap-1.5">
            <FileWarning size={14} />
            Expiry Register
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-1.5">
            <ShieldAlert size={14} />
            Incidents
          </TabsTrigger>
        </TabsList>
        {subscribed.map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            <ProfilesTab
              profileType={t}
              profiles={profiles}
              loads={loads}
              onRefresh={load}
            />
          </TabsContent>
        ))}
        <TabsContent value="expiry" className="mt-4">
          <ExpiryRegisterTab documents={documents} onRefresh={load} />
        </TabsContent>
        <TabsContent value="incidents" className="mt-4">
          <IncidentsTab incidents={incidents} onRefresh={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
