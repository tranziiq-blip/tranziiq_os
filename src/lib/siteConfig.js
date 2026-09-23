// Single source of truth for company details, legal references and public
// pricing. Everything in brackets must be completed before going live —
// the landing page, legal pages and footer all read from this file.

export const COMPANY = {
  tradingName: "TranziIQ",
  legalName: "TranziIQ (Pty) Ltd",
  registrationNumber: "[Add CIPC registration number]",
  vatNumber: "", // leave empty if not VAT-registered
  directors: "Kea Maoba",
  physicalAddress: "[Add street address], Rustenburg, North West, South Africa",
  postalAddress: "[Add postal address]",
  email: "[Add contact email]",
  privacyEmail: "[Add privacy / information officer email]",
  phone: "[Add phone number]",
  informationOfficer: "Kea Maoba",
  website: "https://tranziiq-os.vercel.app",
};

export const LEGAL = {
  effectiveDate: "23 September 2026",
  termsVersion: "2026-09-23",
  privacyVersion: "2026-09-23",
  cookieVersion: "2026-09-23",
  regulator: {
    name: "Information Regulator (South Africa)",
    website: "https://inforegulator.org.za",
    complaintsEmail: "POPIAComplaints@inforegulator.org.za",
  },
};

// Pricing mirrors src/components/admin/BillingTab.jsx — keep both in sync.
// Amounts in ZAR.
export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 380,
    unit: "per truck, per month",
    range: "1 to 15 trucks",
    min: 1,
    max: 15,
    features: [
      "Core operations modules",
      "Driver mobile app",
      "AI insights",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 320,
    unit: "per truck, per month",
    range: "16 to 50 trucks",
    min: 16,
    max: 50,
    features: [
      "Everything in Starter",
      "Client portal access",
      "Advanced AI reporting",
      "Priority support",
      "API integrations",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    unit: "quoted per fleet",
    range: "51 trucks and more",
    min: 51,
    max: Infinity,
    features: [
      "Everything in Growth",
      "White-label options",
      "Dedicated support",
      "Custom integrations",
      "Service level agreement",
    ],
  },
];

export const ADDONS = [
  {
    id: "dg_hazmat",
    name: "Dangerous goods and hazmat compliance",
    price: 249,
    unit: "per truck, per month",
  },
  {
    id: "cold_chain",
    name: "Cold-chain temperature monitoring",
    price: 249,
    unit: "per truck, per month",
  },
  {
    id: "abnormal_load",
    name: "Abnormal-load permits and escorts",
    price: 249,
    unit: "per truck, per month",
  },
  {
    id: "starter_growth",
    name: "Growth features on a Starter plan",
    price: 30,
    unit: "per truck, per month",
  },
  {
    id: "growth_enterprise",
    name: "Enterprise features on a Growth plan",
    price: 20,
    unit: "per truck, per month",
  },
];

export const DEVICE = {
  name: "Rugged driver tablet with 10 GB monthly data",
  price: 369,
  unit: "per device, per month",
  note: "Renewable after 36 months",
};

export function planForTrucks(count) {
  return PLANS.find((p) => count >= p.min && count <= p.max) || PLANS[0];
}

export const formatRand = (n) =>
  "R" + Math.round(n).toLocaleString("en-ZA").replace(/,/g, " ");
