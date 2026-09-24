// Who may see money: rates, invoices, expenses, payroll, budgets.
// Mirrors public.can_see_finance() in the database, which is what
// actually enforces it; this only decides what the screens show.
export function canSeeFinance(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const access = user.module_access || [];
  return access.includes("finance") || access.includes("admin");
}

// Owner / operations manager: set routes and rates
export function canManageRoutes(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.module_access || []).includes("admin");
}
