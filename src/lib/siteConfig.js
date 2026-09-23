// Single source of truth for company details, legal references and public
// pricing. Everything in brackets must be completed before going live —
// the landing page, legal pages and footer all read from this file.

export const COMPANY = {
  tradingName: "TranziIQ",
  legalName: "TranziIQ (Pty) Ltd",
  registrationNumber: "2026/373363/07",
  vatNumber: "", // leave empty if not VAT-registered
  directors: "Kea Maoba",
  physicalAddress: "86 Kock Street, Rustenburg East, Rustenburg, 0299",
  postalAddress: "86 Kock Street, Rustenburg East, Rustenburg, 0299",
  email: "tranziiq@gmail.com",
  privacyEmail: "tranziiq@gmail.com",
  phone: "+27 81 605 2162",
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
    unit: "per vehicle, per month",
    range: "1 to 15 vehicles",
    min: 1,
    max: 15,
    features: [
      "Fleet management and dispatch",
      "Driver app with SOS",
      "RTMS trip logging",
      "Core BI dashboard",
      "View-only client portal",
      "Standard support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 320,
    unit: "per vehicle, per month",
    range: "16 to 50 vehicles",
    min: 16,
    max: 50,
    features: [
      "Everything in Starter",
      "Telematics intelligence",
      "Safety and advanced compliance",
      "Finance: invoicing and trip costing",
      "Multi-client dispatch",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    unit: "specially quoted",
    range: "51 vehicles and more",
    min: 51,
    max: Infinity,
    features: [
      "Everything in Growth",
      "HR, stores and inventory",
      "Engineering and maintenance",
      "Advanced BI and custom SLA reporting",
      "API integrations",
      "Dedicated account manager",
      "SLA-backed uptime and white-label client portal",
    ],
  },
];

export const ADDONS = [
  {
    id: "dg_hazmat",
    name: "Dangerous goods and hazmat compliance",
    price: 249,
    unit: "per vehicle, per month",
  },
  {
    id: "cold_chain",
    name: "Cold-chain temperature monitoring",
    price: 249,
    unit: "per vehicle, per month",
  },
  {
    id: "abnormal_load",
    name: "Abnormal-load permits and escorts",
    price: 249,
    unit: "per vehicle, per month",
  },
  {
    id: "starter_growth",
    name: "Growth features before reaching 16 vehicles",
    price: 30,
    unit: "per vehicle, per month",
  },
  {
    id: "growth_enterprise",
    name: "Enterprise features before reaching 51 vehicles",
    price: 20,
    unit: "per vehicle, per month",
  },
];

export const DEVICE = {
  name: "Device-as-a-service: rugged tablet with 10 GB data a month",
  price: 369,
  unit: "per vehicle, per month",
  note: "36-month renewal cycle. Or bring your own Android device at no fee",
};

export function planForTrucks(count) {
  return PLANS.find((p) => count >= p.min && count <= p.max) || PLANS[0];
}

export const formatRand = (n) =>
  "R" + Math.round(n).toLocaleString("en-ZA").replace(/,/g, " ");

// Illustrative all-in monthly costs (from the TranziIQ pricing sheet).
// Totals are calculated from the prices above so they never drift.
export const EXAMPLES = [
  {
    label: "8 vehicles, Starter, own devices",
    trucks: 8,
    plan: "starter",
    addons: [],
    devices: false,
  },
  {
    label: "8 vehicles, Starter with Growth features, company tablets",
    trucks: 8,
    plan: "starter",
    addons: ["starter_growth"],
    devices: true,
  },
  {
    label: "30 vehicles, Growth, company tablets",
    trucks: 30,
    plan: "growth",
    addons: [],
    devices: true,
  },
  {
    label: "30 vehicles, Growth with DG / hazmat, company tablets",
    trucks: 30,
    plan: "growth",
    addons: ["dg_hazmat"],
    devices: true,
  },
].map((e) => {
  const perTruck =
    PLANS.find((p) => p.id === e.plan).price +
    e.addons.reduce((s, id) => s + ADDONS.find((a) => a.id === id).price, 0) +
    (e.devices ? DEVICE.price : 0);
  return { ...e, perTruck, total: perTruck * e.trucks };
});
