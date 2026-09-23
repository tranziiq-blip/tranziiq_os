import BillingTab from "@/components/admin/BillingTab";

export default function Billing() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">
          Billing
        </h1>
        <p className="text-sm text-muted-foreground">
          Subscription plans · payment configuration · usage
        </p>
      </div>
      <BillingTab />
    </div>
  );
}
