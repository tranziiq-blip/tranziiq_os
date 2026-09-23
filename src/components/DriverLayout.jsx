import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  ClipboardCheck,
  Package,
  Fuel,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import { useCurrentDriver } from "@/lib/useCurrentDriver";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TrialBanner from "@/components/TrialBanner";

const nav = [
  { to: "/driver", label: "Home", icon: Home, end: true },
  { to: "/driver/inspect", label: "Inspect", icon: ClipboardCheck },
  { to: "/driver/load", label: "Load", icon: Package },
  { to: "/driver/fuel", label: "Fuel", icon: Fuel },
  { to: "/driver/report", label: "Report", icon: AlertTriangle },
];

export default function DriverLayout() {
  const { driver, drivers, setDriverId, loading } = useCurrentDriver();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 items-center gap-2 border-b border-border  bg-card px-4">
        <button
          onClick={() => navigate("/")}
          className="rounded-md p-1.5  text-muted-foreground hover:bg-muted"
        >
          <ChevronLeft size={20} />
        </button>
        <BrandLogo size={28} withText />
        <div className="ml-auto">
          {!loading && driver && (
            <Select value={driver.id} onValueChange={setDriverId}>
              <SelectTrigger className="h-8 w-36 border-0 bg-muted text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      <TrialBanner compact />
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="mx-auto max-w-md p-4">
          <Outlet context={{ driver }} />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t  border-border bg-card shadow-lg">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 text-[10px] 
font-medium transition ${
                isActive ? "text-brand-teal" : "text-muted-foreground"
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
