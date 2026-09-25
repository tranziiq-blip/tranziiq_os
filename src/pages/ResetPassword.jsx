import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44, supabase, clearPasswordRecovery, passwordSetupMode } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const MIN_LENGTH = 8;

// Supabase puts link errors (expired / already used) in the URL
function linkError() {
  const params = new URLSearchParams(
    window.location.hash.replace(/^#/, "") + "&" + window.location.search.replace(/^\?/, ""),
  );
  const code = params.get("error_code") || params.get("error");
  if (!code) return null;
  return code === "otp_expired"
    ? "This link has expired or has already been used."
    : params.get("error_description")?.replace(/\+/g, " ") || "This reset link is not valid.";
}

export default function ResetPassword({ mode }) {
  // Newly invited people create their first password here
  const isInvite = mode === "invite" || passwordSetupMode() === "invite";
  const [who, setWho] = useState({ name: "", company: "", driver: false });
  const [stage, setStage] = useState("checking"); // checking | form | invalid | done
  const [invalidReason, setInvalidReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = linkError();
    if (err) {
      clearPasswordRecovery();
      setInvalidReason(err);
      setStage("invalid");
      return;
    }
    let settled = false;
    const decide = (session) => {
      if (settled) return;
      if (session) {
        settled = true;
        const meta = session.user?.user_metadata || {};
        setWho((w) => ({ ...w, name: meta.full_name || "", company: meta.company_name || "" }));
        supabase
          .from("profiles")
          .select("full_name, module_access, organization:org_id(name)")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (!data) return;
            setWho({
              name: data.full_name || meta.full_name || "",
              company: data.organization?.name || meta.company_name || "",
              driver: (data.module_access || []).includes("driver_mobile"),
            });
          });
        setStage("form");
      }
    };
    // The link's session is set up asynchronously; wait for it briefly
    supabase.auth.getSession().then(({ data }) => decide(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => decide(session));
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        clearPasswordRecovery();
        setInvalidReason("This reset link is missing, incomplete or has expired.");
        setStage("invalid");
      }
    }, 6000);
    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword(newPassword);
      // Account is now active (clears the "invited" status for the admin)
      await base44.auth.updateMe({ invite_status: "active" }).catch(() => {});
      setStage("done");
      setTimeout(() => window.location.replace(who.driver ? "/driver" : "/"), 1500);
    } catch (err) {
      setError(
        /different from the old/i.test(err.message || "")
          ? "Choose a password different from your previous one"
          : err.message || "Failed to reset password",
      );
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    await base44.auth.cancelPasswordRecovery();
    window.location.replace("/login");
  };

  if (stage === "checking") {
    return (
      <AuthLayout icon={Lock} title="Checking your link" subtitle="One moment…">
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (stage === "invalid") {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Link not valid"
        subtitle={invalidReason}
        footer={
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-center text-sm text-foreground">
          {isInvite
            ? "Invitation links work once and expire after 24 hours. Ask your administrator to resend your invitation."
            : "Reset links work once and expire after a short time. Request a new one and open it on this device."}
        </p>
      </AuthLayout>
    );
  }

  if (stage === "done") {
    return (
      <AuthLayout
        icon={CheckCircle2}
        title={isInvite ? "You're all set" : "Password updated"}
        subtitle={isInvite ? "Opening your workspace…" : "Taking you to your dashboard…"}
      >
        <p className="text-center text-sm text-muted-foreground">
          Any other devices signed in to this account have been signed out.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title={
        isInvite
          ? `Welcome${who.name ? `, ${who.name.split(" ")[0]}` : ""}`
          : "Set a new password"
      }
      subtitle={
        isInvite
          ? `${who.company ? `${who.company} has set up your TranziIQ account. ` : ""}Create a password to finish.`
          : "You need to choose a new password before continuing"
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-12 pl-10"
              minLength={MIN_LENGTH}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 pl-10"
              required
            />
          </div>
        </div>
        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            isInvite ? "Create password and continue" : "Save new password"
          )}
        </Button>
        <button
          type="button"
          onClick={cancel}
          className="w-full text-center text-sm text-muted-foreground hover:underline"
        >
          Cancel and sign out
        </button>
      </form>
    </AuthLayout>
  );
}
