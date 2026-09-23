import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import BrandLogo from "./BrandLogo";
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  Smartphone,
  CalendarClock,
  Wrench,
  Boxes,
  UserCog,
  ShieldCheck,
  Wallet,
  Settings,
  Sparkles,
  FileText,
  Globe,
  Plug,
  CreditCard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Scale,
  ClipboardCheck,
  Flame,
} from "lucide-react";
import { userHasAccess } from "@/lib/moduleAccess";

const ACTIVE = [
  { to: "/", label: "Command Center", icon: LayoutDashboard, end: true },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
  { to: "/driver", label: "Driver Mobile", icon: Smartphone },
  {
    to: "/production",
    label: "Production",
    icon: CalendarClock,
    children: [
      { to: "/fleet", label: "Fleet Register", icon: Truck },
      { to: "/loads", label: "Dispatch", icon: Package },
    ],
  },
  { to: "/engineering", label: "Engineering", icon: Wrench },
  {
    to: "/safety",
    label: "SHERQ",
    icon: ShieldCheck,
    children: [
      { to: "/compliance", label: "Compliance", icon: ClipboardCheck },
    ],
  },
  {
    to: "/compliance-ops",
    label: "Specialized Compliance",
    icon: Flame,
    requiresAddon: "compliance",
  },
  { to: "/stores", label: "Stores", icon: Boxes },
  {
    to: "/hr",
    label: "HR",
    icon: UserCog,
    children: [{ to: "/drivers", label: "Drivers", icon: Users }],
  },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/admin", label: "Admin", icon: Settings },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/portal", label: "Client Portal", icon: Globe },
  { to: "/weighbill", label: "Freight Clearance Portal", icon: Scale },
];

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [manualExpanded, setManualExpanded] = useState({});
  const [specializedActive, setSpecializedActive] = useState(true);

  useEffect(() => {
    base44.entities.CompanyProfile.list()
      .then((cp) => {
        const addons = cp[0]?.selected_addons || [];
        setSpecializedActive(
          ["dg_hazmat", "cold_chain", "abnormal_load"].some((a) =>
            addons.includes(a),
          ),
        );
      })
      .catch(() => {});
  }, []);

  const expandedGroups = useMemo(() => {
    const auto = {};
    const path = location.pathname;
    ACTIVE.forEach((item) => {
      if (item.children?.some((child) => path.startsWith(child.to))) {
        auto[item.to] = true;
      }
    });
    return { ...auto, ...manualExpanded };
  }, [location.pathname, manualExpanded]);

  const toggleGroup = (to) =>
    setManualExpanded((prev) => ({ ...prev, [to]: !prev[to] }));

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate("/login");
  };

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium 
transition-all ${
          isActive
            ? "bg-sidebar-accent text-white shadow-sm"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
        }`
      }
    >
      <item.icon className="h-4.5 w-4.5" size={18} />
      {item.label}
    </NavLink>
  );

  const NavGroup = ({ item }) => {
    const isExpanded = expandedGroups[item.to];
    return (
      <div>
        <div className="flex items-center gap-1">
          <NavLink
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium 
transition-all ${
                isActive
                  ? "bg-sidebar-accent text-white shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
          <button
            onClick={() => toggleGroup(item.to)}
            className="rounded-md p-1.5 text-sidebar-foreground/60  hover:bg-sidebar-accent/60 hover:text-white"
          >
            <ChevronDown
              className={`transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              size={14}
            />
          </button>
        </div>
        {isExpanded && (
          <div className="ml-4 mt-0.5 space-y-1 border-l border-sidebar-border pl-3">
            {item.children.map((child) => (
              <NavItem key={child.to} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const visibleNav = ACTIVE.filter((item) =>
    userHasAccess(user, item.to),
  ).filter((item) => !item.requiresAddon || specializedActive);

  const Sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border  px-5">
        <BrandLogo size={36} withText light />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider  text-sidebar-foreground/50">
          Operations
        </p>
        <div className="space-y-1">
          {visibleNav.map((item) =>
            item.children ? (
              <NavGroup key={item.to} item={item} />
            ) : (
              <NavItem key={item.to} item={item} />
            ),
          )}
        </div>
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full  bg-brand-teal text-sm font-bold text-white">
            {(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user?.full_name || "Operator"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-2  text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 lg:block">{Sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64">{Sidebar}</div>
        </div>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-3 border-b border-border  bg-card px-4 lg:px-8">
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">TranziIQ OS</span>
            <ChevronRight size={14} />
            <span>Transport & Logistics Intelligence</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3  py-1 text-xs font-medium text-emerald-700 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
