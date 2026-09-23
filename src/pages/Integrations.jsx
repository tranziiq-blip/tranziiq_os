import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import ConnectIntegrationDialog from "@/components/integrations/ConnectIntegrationDialog";
import {
  Table2,
  MessageSquare,
  Mail,
  CalendarClock,
  Satellite,
  Calculator,
  Landmark,
  Fuel,
  Route as Road,
  Plug,
  CheckCircle2,
  Link2,
  Settings2,
  Zap,
} from "lucide-react";

const OAUTH_INTEGRATIONS = [
  {
    name: "Google Sheets",
    type: "googlesheets",
    icon: Table2,
    category: "Data  & Export",
    desc: "Sync load data, fuel logs, and financial summaries to Google  Sheets.",
    status: "available",
  },
  {
    name: "Slack",
    type: "slack",
    icon: MessageSquare,
    category: "Communication",
    desc: "Receive real-time alerts for breakdowns, border delays,  and safety incidents.",
    status: "available",
  },
  {
    name: "Gmail",
    type: "gmail",
    icon: Mail,
    category: "Communication",
    desc: "Send automated POD confirmations, invoice notifications, and client updates.",
    status: "available",
  },
  {
    name: "Google Calendar",
    type: "googlecalendar",
    icon: CalendarClock,
    category: "Productivity",
    desc: "Auto-create calendar events for shifts,  vehicle services, and compliance deadlines.",
    status: "available",
  },
];

const API_KEY_PROVIDERS = [
  // Telematics
  {
    name: "Mix Telematics",
    category: "telematics",
    icon: Satellite,
    description: "GPS tracking, fleet telematics & driver behavior analysis",
  },
  {
    name: "Ctrack",
    category: "telematics",
    icon: Satellite,
    description: "Vehicle tracking & stolen vehicle recovery",
  },
  {
    name: "Car Track",
    category: "telematics",
    icon: Satellite,
    description: "Vehicle tracking & recovery services",
  },
  {
    name: "Geotab",
    category: "telematics",
    icon: Satellite,
    description: "Fleet management, compliance & route optimization",
  },
  // ERP & Accounting
  {
    name: "Sage",
    category: "accounting",
    icon: Calculator,
    description: "Accounting, ERP & payroll integration",
  },
  {
    name: "Xero",
    category: "accounting",
    icon: Calculator,
    description: "Cloud  accounting & invoice synchronization",
  },
  {
    name: "Pastel",
    category: "accounting",
    icon: Calculator,
    description: "Accounting & payroll (Sage Pastel)",
  },
  // Banking
  {
    name: "Standard Bank",
    category: "banking",
    icon: Landmark,
    description: "Bank transaction feed & reconciliation",
  },
  {
    name: "FNB",
    category: "banking",
    icon: Landmark,
    description: "Bank  transaction feed & reconciliation",
  },
  {
    name: "ABSA",
    category: "banking",
    icon: Landmark,
    description: "Bank  transaction feed & reconciliation",
  },
  {
    name: "Nedbank",
    category: "banking",
    icon: Landmark,
    description: "Bank  transaction feed & reconciliation",
  },
  // Fuel Card
  {
    name: "Engen Fleet",
    category: "fuel_card",
    icon: Fuel,
    description: "Fuel  card transactions & management",
  },
  {
    name: "BP Fuel Plus",
    category: "fuel_card",
    icon: Fuel,
    description: "Fuel  card transactions & management",
  },
  // Toll
  {
    name: "SANRAL",
    category: "toll",
    icon: Road,
    description: "Toll fees &  e-tag management",
  },
];

const CATEGORY_LABELS = {
  telematics: "Telematics & GPS",
  accounting: "ERP & Accounting",
  banking: "Banking & Finance",
  fuel_card: "Fuel Cards",
  toll: "Toll & Roads",
  communication: "Communication",
};

export default function Integrations() {
  const { toast } = useToast();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectProvider, setConnectProvider] = useState(null);
  const [editingConn, setEditingConn] = useState(null);

  const loadConnections = useCallback(async () => {
    try {
      setConnections(await base44.entities.IntegrationConfig.list());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleConnect = (provider) => {
    const existing = connections.find((c) => c.provider_name === provider.name);
    setEditingConn(existing || null);
    setConnectProvider(provider);
  };

  const handleDisconnect = async (conn) => {
    await base44.entities.IntegrationConfig.update(conn.id, {
      connection_status: "disconnected",
      is_active: false,
    });
    toast({ title: `${conn.provider_name} disconnected` });
    loadConnections();
  };

  const getConnection = (providerName) =>
    connections.find((c) => c.provider_name === providerName);

  // Group API key providers by category
  const grouped = API_KEY_PROVIDERS.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const handleOAuthConnect = (integration) => {
    window.dispatchEvent(
      new CustomEvent("integration-connect", { detail: integration }),
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
          Integrations
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect telematics · ERP · banking · fuel · and more
        </p>
      </div>

      {/* API Key Integrations by category */}
      {Object.entries(grouped).map(([cat, providers]) => (
        <div key={cat}>
          <h2 className="mb-3 font-display text-lg font-semibold  text-brand-navy">
            {CATEGORY_LABELS[cat] || cat}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => {
              const conn = getConnection(p.name);
              const isConnected = conn?.connection_status === "connected";
              return (
                <Card
                  key={p.name}
                  className={`border-border/60 shadow-sm transition-shadow 
hover:shadow-md ${isConnected ? "border-emerald-200" : ""}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl  bg-muted">
                        <p.icon className="text-brand-navy" size={20} />
                      </div>
                      {isConnected ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200  gap-1">
                          <CheckCircle2 size={12} /> Connected
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    <p className="mt-3 font-semibold text-brand-navy">
                      {p.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                    {isConnected && (
                      <div className="mt-2 space-y-1">
                        {conn.sync_frequency &&
                          conn.sync_frequency !== "manual" && (
                            <p className="text-[10px] text-muted-foreground">
                              Sync: {conn.sync_frequency}
                            </p>
                          )}
                        {conn.last_sync_date && (
                          <p className="text-[10px] text-muted-foreground">
                            Last sync:{" "}
                            {new Date(conn.last_sync_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => handleConnect(p)}
                        variant={isConnected ? "outline" : "default"}
                        size="sm"
                        className="flex-1 gap-2"
                      >
                        {isConnected ? (
                          <>
                            <Settings2 size={14} /> Settings
                          </>
                        ) : (
                          <>
                            <Link2 size={14} />
                            Connect
                          </>
                        )}
                      </Button>
                      {isConnected && (
                        <Button
                          onClick={() => handleDisconnect(conn)}
                          variant="outline"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          Disconnect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* OAuth Connectors */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold  text-brand-navy">
          Platform Connectors (OAuth)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OAUTH_INTEGRATIONS.map((i) => (
            <Card
              key={i.type}
              className="border-border/60 shadow-sm transition-shadow  hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl  bg-muted">
                    <i.icon className="text-brand-navy" size={20} />
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700  border-emerald-200"
                  >
                    Available
                  </Badge>
                </div>
                <p className="mt-3 font-semibold text-brand-navy">{i.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{i.desc}</p>
                <div className="mt-3">
                  <Badge variant="secondary" className="text-[10px]">
                    {i.category}
                  </Badge>
                </div>
                <Button
                  onClick={() => handleOAuthConnect(i)}
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full gap-2"
                >
                  <Plug size={14} /> Connect
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <Card className="border-brand-teal/30 bg-brand-teal/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Zap className="mt-0.5 text-brand-teal" size={20} />
          <div>
            <p className="text-sm font-semibold text-brand-navy">
              How API Key Integrations Work
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter your provider's API key and credentials to connect. The
              system securely stores your credentials and syncs data based on
              your chosen frequency. Telematics integrations feed GPS data into
              the TelematicsReading entity; banking integrations populate
              BankTransaction records; accounting integrations sync invoices and
              expenses. OAuth connectors (Google Sheets, Slack, Gmail) are
              managed through the platform's secure consent flow.
            </p>
          </div>
        </CardContent>
      </Card>

      <ConnectIntegrationDialog
        open={!!connectProvider}
        onOpenChange={(v) => !v && setConnectProvider(null)}
        provider={connectProvider}
        existing={editingConn}
        onSaved={loadConnections}
      />
    </div>
  );
}
