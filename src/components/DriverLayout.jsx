import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  ClipboardCheck,
  Package,
  Fuel,
  AlertTriangle,
  ChevronLeft,
  LogOut,
  UserX,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import { useCurrentDriver } from "@/lib/useCurrentDriver";
import { useShiftSession } from "@/lib/shiftSession";
import { useAuth } from "@/lib/AuthContext";
import { userHasAccess } from "@/lib/moduleAccess";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TrialBanner from "@/components/TrialBanner";

const nav = [
  { to: "/driver", label: "Home", icon: Home, end: true },
  { to: "/driver/inspect", label: "Inspect", icon: ClipboardCheck },
  { to: "/driver/load", label: "Load", icon: Package },
  { to: "/driver/fuel", label: "Fuel", icon: Fuel },
  { to: "/driver/report", label: "Report", icon: AlertTriangle },
];

export default function DriverLayout() {
  const { driver, loading } = useCurrentDriver();
  const { shift, signOut } = useShiftSession();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmOut, setConfirmOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const canGoBack = userHasAccess(user, "/");

  const doSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-4">
        {canGoBack && (
          <button
            onClick={() => navigate("/")}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <BrandLogo size={28} withText />
        <div className="ml-auto flex items-center gap-2">
          {!loading && driver && (
            <span className="max-w-[9rem] truncate rounded-md bg-muted px-2 py-1 text-xs font-medium text-brand-navy">
              {driver.full_name}
            </span>
          )}
          <button
            onClick={() => setConfirmOut(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Clock out and sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <TrialBanner compact />
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="mx-auto max-w-md p-4">
          {!loading && !driver ? (
            <div className="space-y-3 py-12 text-center">
              <UserX className="mx-auto text-amber-600" size={36} />
              <p className="font-semibold text-brand-navy">No driver profile is linked to your login</p>
              <p className="text-sm text-muted-foreground">
                The driver app only opens your own driver profile. Ask your administrator to link your
                login to your driver record.
              </p>
            </div>
          ) : (
            <Outlet context={{ driver }} />
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-border bg-card shadow-lg">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition ${
                isActive ? "text-brand-teal" : "text-muted-foreground"
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <AlertDialog open={confirmOut} onOpenChange={setConfirmOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clock out and sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              {shift
                ? `Signing out ends your shift and records your clock-out time in HR → Time & Attendance.`
                : "You will be signed out."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={signingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={doSignOut} disabled={signingOut} className="bg-brand-navy hover:bg-brand-navy/90">
                {signingOut ? "Clocking out…" : "Clock out & sign out"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
