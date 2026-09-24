export const MODULES = [
  { key: "command_center", label: "Command Center", route: "/" },
  { key: "insights", label: "AI Insights", route: "/insights" },
  { key: "driver_mobile", label: "Driver Mobile", route: "/driver" },
  { key: "production", label: "Production", route: "/production" },
  { key: "engineering", label: "Engineering", route: "/engineering" },
  { key: "sheq", label: "SHERQ", route: "/safety" },
  { key: "stores", label: "Stores", route: "/stores" },
  { key: "hr", label: "HR", route: "/hr" },
  { key: "finance", label: "Finance", route: "/finance" },
  { key: "admin", label: "Admin", route: "/admin" },
  { key: "reports", label: "Reports", route: "/reports" },
  { key: "integrations", label: "Integrations", route: "/integrations" },
  { key: "billing", label: "Billing", route: "/billing" },
  {
    key: "compliance_ops",
    label: "Specialized Compliance",
    route: "/compliance-ops",
  },
  { key: "client_portal", label: "Client Portal", route: "/portal" },
  { key: "weighbill", label: "Freight Clearance Portal", route: "/weighbill" },
];

// Money and management areas are never opened by default: a staff
// member only gets them when the owner ticks that module for them.
const RESTRICTED = ["finance", "admin", "billing"];

export function userHasAccess(user, route) {
  if (!user) return true;
  if (user.role === "admin") return true;
  // The client directory (routes, rates, client terms) lives under Admin
  if (route === "/directory" || route.startsWith("/directory/")) route = "/admin";
  const access = user.module_access;
  if (!access || access.length === 0) {
    const mod = MODULES.find((m) => route === m.route || (m.route !== "/" && route.startsWith(m.route)));
    return !mod || !RESTRICTED.includes(mod.key);
  }
  const mod = MODULES.find(
    (m) =>
      route === m.route ||
      route.startsWith(m.route + "/") ||
      (m.route !== "/" && route.startsWith(m.route)),
  );
  if (!mod) return true;
  return access.includes(mod.key);
}
