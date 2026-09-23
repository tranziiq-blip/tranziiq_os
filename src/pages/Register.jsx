import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { OPERATION_TYPES } from "@/lib/operationTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase } from "lucide-react";
import { LEGAL } from "@/lib/siteConfig";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [operationType, setOperationType] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const result = await base44.auth.register({
        email,
        password,
        metadata: {
          operation_type: operationType,
          terms_version: LEGAL.termsVersion,
          privacy_version: LEGAL.privacyVersion,
          terms_accepted_at: new Date().toISOString(),
        },
      });
      // If email confirmation is switched off, Supabase signs in immediately.
      if (result?.session) {
        window.location.href = "/onboarding";
        return;
      }
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      if (operationType) {
        try {
          await base44.auth.updateMe({ operation_type: operationType });
        } catch (e) {
          /* non-critical */
        }
      }
      window.location.href = "/onboarding";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Email sent",
        description: "Check your inbox (and spam folder) for the new email.",
      });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Check your email"
        subtitle={`We sent a confirmation email to ${email}`}
      >
        <p className="text-sm text-muted-foreground text-center mb-5">
          Open the email and tap <strong>Confirm your mail</strong>. You'll be
          signed in and taken straight to setup. You can close this page.
        </p>
        <p className="text-xs text-muted-foreground text-center mb-3">
          If your email shows a 6-digit code instead, enter it here:
        </p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive  text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the email?{" "}
          <button
            onClick={handleResend}
            className="text-primary font-medium  hover:underline"
          >
            {" "}
            Resend{" "}
          </button>{" "}
        </p>{" "}
      </AuthLayout>
    );
  }
  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          {" "}
          Already have an account?{" "}
          <Link
            to={
              "/login" +
              (safeReturnTo() !== "/"
                ? "?returnTo=" + encodeURIComponent(safeReturnTo())
                : "")
            }
            className="text-primary font-medium hover:underline"
          >
            {" "}
            Log in{" "}
          </Link>{" "}
        </>
      }
    >
      {" "}
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
        disabled={!agreed}
      >
        {" "}
        <GoogleIcon className="w-5 h-5 mr-2" /> Continue with Google{" "}
      </Button>{" "}
      <div className="relative mb-6">
        {" "}
        <div className="absolute inset-0 flex items-center">
          {" "}
          <div className="w-full border-t border-border" />{" "}
        </div>{" "}
        <div className="relative flex justify-center text-xs uppercase">
          {" "}
          <span className="bg-card px-3 text-muted-foreground">or</span>{" "}
        </div>{" "}
      </div>{" "}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive  text-sm">
          {" "}
          {error}{" "}
        </div>
      )}{" "}
      <form onSubmit={handleSubmit} className="space-y-4">
        {" "}
        <div className="space-y-2">
          {" "}
          <Label htmlFor="email">Email</Label>{" "}
          <div className="relative">
            {" "}
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4  text-muted-foreground"
              aria-hidden="true"
            />{" "}
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />{" "}
          </div>{" "}
        </div>{" "}
        <div className="space-y-2">
          {" "}
          <Label htmlFor="password">Password</Label>{" "}
          <div className="relative">
            {" "}
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4  text-muted-foreground"
              aria-hidden="true"
            />{" "}
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />{" "}
          </div>{" "}
        </div>{" "}
        <div className="space-y-2">
          {" "}
          <Label htmlFor="confirm">Confirm Password</Label>{" "}
          <div className="relative">
            {" "}
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4  text-muted-foreground"
              aria-hidden="true"
            />{" "}
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />{" "}
          </div>{" "}
        </div>{" "}
        <div className="space-y-2">
          {" "}
          <Label htmlFor="operation-type">
            <Briefcase className="w-4 h-4 inline mr-1" />
            Operation Type
          </Label>{" "}
          <Select value={operationType} onValueChange={setOperationType}>
            {" "}
            <SelectTrigger id="operation-type" className="h-12">
              <SelectValue placeholder="Select your operation…" />
            </SelectTrigger>{" "}
            <SelectContent>
              {" "}
              {OPERATION_TYPES.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.label}
                </SelectItem>
              ))}{" "}
            </SelectContent>{" "}
          </Select>{" "}
          <p className="text-xs text-muted-foreground">
            This configures your workspace with the right modules for your
            operation.
          </p>{" "}
        </div>{" "}
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          <span>
            I agree to the{" "}
            <Link
              to="/terms"
              target="_blank"
              className="text-primary font-medium hover:underline"
            >
              terms of service
            </Link>{" "}
            and confirm I have read the{" "}
            <Link
              to="/privacy"
              target="_blank"
              className="text-primary font-medium hover:underline"
            >
              privacy policy
            </Link>
            , on behalf of my company.
          </span>
        </label>
        <Button
          type="submit"
          className="w-full h-12 font-medium"
          disabled={loading || !operationType || !agreed}
        >
          {" "}
          {loading ? (
            <>
              {" "}
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating
              account...{" "}
            </>
          ) : (
            "Create account"
          )}{" "}
        </Button>{" "}
      </form>{" "}
    </AuthLayout>
  );
}
