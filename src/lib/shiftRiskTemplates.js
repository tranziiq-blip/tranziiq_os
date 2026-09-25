// Shift risk assessment templates, one per department.
//
// Every employee completes one of these straight after signing in (which
// clocks them in). The template is picked from the employee's department
// and job title in HR, and the result is saved to SHERQ → Shift Risk
// Assessments.
//
// Each check has a "safe" answer. An unsafe answer adds to the risk score;
// an unsafe answer on a `critical` check makes the whole assessment
// CRITICAL (stop work and report to a supervisor).

// Fitness-for-duty checks every employee answers, whatever their department.
const FITNESS = [
  {
    id: "fit_for_duty",
    text: "I am fit for duty today (no illness or injury that affects my work)",
    safe: "yes",
    critical: true,
  },
  {
    id: "not_impaired",
    text: "I am not under the influence of alcohol, drugs or medication that can impair me",
    safe: "yes",
    critical: true,
  },
  {
    id: "rested",
    text: "I had enough rest before this shift (at least 8 hours off)",
    safe: "yes",
    weight: 2,
  },
  {
    id: "ppe",
    text: "I have the correct PPE for my job today and it is in good condition",
    safe: "yes",
  },
];

export const WEATHER_OPTIONS = [
  { value: "clear", label: "Clear", score: 0 },
  { value: "rain", label: "Rain", score: 1 },
  { value: "fog", label: "Fog / poor visibility", score: 1 },
  { value: "strong_wind", label: "Strong wind", score: 1 },
  { value: "storm", label: "Storm", score: 2 },
];

export const SHIFT_RISK_TEMPLATES = {
  transport: {
    key: "transport",
    title: "Driver Shift Risk Assessment",
    subtitle: "Transport — drivers and operators on the road",
    askWeather: true,
    registerRoles: ["Driver"],
    checks: [
      ...FITNESS,
      {
        id: "route_known",
        text: "I know today's route, stops, loading/offloading sites and site rules",
        safe: "yes",
        field: "route_familiar",
      },
      {
        id: "docs_valid",
        text: "My driver's licence, PrDP and site induction are valid and on me",
        safe: "yes",
        critical: true,
      },
      {
        id: "phone",
        text: "I will not use my cellphone while driving (hands-free only)",
        safe: "yes",
      },
      {
        id: "fatigue_rule",
        text: "I know the fatigue rule and will take my rest breaks",
        safe: "yes",
      },
      {
        id: "securing",
        text: "Load-securing equipment (straps, chains, tarps) is available",
        safe: "yes",
        allowNA: true,
      },
      {
        id: "emergency",
        text: "I know the emergency / breakdown procedure and the SOS button in the app",
        safe: "yes",
      },
    ],
  },

  engineering: {
    key: "engineering",
    title: "Workshop Shift Risk Assessment",
    subtitle: "Engineering — workshop, maintenance and tyre bay",
    registerRoles: ["Mechanic", "Workshop Supervisor"],
    checks: [
      ...FITNESS,
      {
        id: "loto",
        text: "Lock-out / isolation equipment is available and I will isolate before working",
        safe: "yes",
        critical: true,
      },
      {
        id: "tools",
        text: "My hand and power tools have been checked and are in good condition",
        safe: "yes",
      },
      {
        id: "lifting",
        text: "Jacks, axle stands and lifting equipment are inspected and in date",
        safe: "yes",
        allowNA: true,
      },
      {
        id: "housekeeping",
        text: "My work area is clean, with no oil spills or trip hazards",
        safe: "yes",
      },
      {
        id: "hot_work",
        text: "A hot work permit is in place if I will weld, grind or cut",
        safe: "yes",
        allowNA: true,
      },
      {
        id: "fire",
        text: "A fire extinguisher is within reach of my work area",
        safe: "yes",
      },
    ],
  },

  stores: {
    key: "stores",
    title: "Stores Shift Risk Assessment",
    subtitle: "Stores — warehouse, receiving and issuing",
    registerRoles: ["Storekeeper", "Forklift Operator"],
    checks: [
      ...FITNESS,
      {
        id: "forklift",
        text: "Forklift / pallet jack pre-use check is done and my licence is valid",
        safe: "yes",
        allowNA: true,
      },
      {
        id: "racking",
        text: "Racking and shelving are undamaged and not overloaded",
        safe: "yes",
      },
      {
        id: "walkways",
        text: "Walkways and emergency exits are clear",
        safe: "yes",
      },
      {
        id: "manual_handling",
        text: "I know the safe lifting method and will get help for heavy items",
        safe: "yes",
      },
      {
        id: "hazchem",
        text: "Hazardous substances are stored, labelled and have SDS sheets",
        safe: "yes",
        allowNA: true,
      },
    ],
  },

  production: {
    key: "production",
    title: "Operations Shift Risk Assessment",
    subtitle: "Production — dispatch, control room and loading sites",
    registerRoles: ["Dispatcher", "Fleet Manager", "Controller"],
    checks: [
      ...FITNESS,
      {
        id: "traffic_plan",
        text: "I know the traffic management plan for the sites I will visit",
        safe: "yes",
      },
      {
        id: "hi_vis",
        text: "I will wear a reflective vest in all yard and site areas",
        safe: "yes",
      },
      {
        id: "comms",
        text: "Radios / phones for contacting drivers are charged and working",
        safe: "yes",
      },
      {
        id: "separation",
        text: "Pedestrian and vehicle routes are separated in my work area",
        safe: "yes",
        allowNA: true,
      },
      {
        id: "dust_noise",
        text: "Dust and noise controls are in place where I will work",
        safe: "yes",
        allowNA: true,
      },
    ],
  },

  sherq: {
    key: "sherq",
    title: "SHERQ Shift Risk Assessment",
    subtitle: "SHERQ — inspections, audits and site visits",
    registerRoles: ["Safety Officer"],
    checks: [
      ...FITNESS,
      {
        id: "visit_plan",
        text: "My site visit plan for today is known to my supervisor",
        safe: "yes",
        allowNA: true,
      },
      {
        id: "emergency_list",
        text: "The emergency contact list and assembly points are current",
        safe: "yes",
      },
      {
        id: "first_aid",
        text: "First aid kits and fire equipment in my area have been checked",
        safe: "yes",
      },
      {
        id: "reporting",
        text: "Incident reporting forms / the app are available to me",
        safe: "yes",
      },
    ],
  },

  office: {
    key: "office",
    title: "Office Shift Risk Assessment",
    subtitle: "HR, Finance and Admin — office staff",
    registerRoles: ["Administrator"],
    checks: [
      ...FITNESS,
      {
        id: "exits",
        text: "Emergency exits and passages in the office are clear",
        safe: "yes",
      },
      {
        id: "assembly",
        text: "I know where the evacuation assembly point is",
        safe: "yes",
      },
      {
        id: "electrical",
        text: "Plugs, cords and extension leads at my workstation are undamaged",
        safe: "yes",
      },
      {
        id: "workstation",
        text: "My chair, desk and screen are set up so I can work without strain",
        safe: "yes",
      },
      {
        id: "site_travel",
        text: "If I visit a site today, I have the correct PPE and induction",
        safe: "yes",
        allowNA: true,
      },
    ],
  },
};

// Picks the template for an employee. Anyone with a driver record, or whose
// job title / department says driver or transport, gets the driver template.
export function templateFor(employee, driver) {
  const dept = String(employee?.department || "").toLowerCase();
  const title = String(employee?.job_title || "").toLowerCase();
  if (driver || /driver/.test(title) || dept === "transport")
    return SHIFT_RISK_TEMPLATES.transport;
  if (dept === "engineering" || /mechanic|workshop|tyre|artisan/.test(title))
    return SHIFT_RISK_TEMPLATES.engineering;
  if (dept === "stores" || /store|forklift/.test(title))
    return SHIFT_RISK_TEMPLATES.stores;
  if (dept === "production" || /dispatch|controller|fleet|operations/.test(title))
    return SHIFT_RISK_TEMPLATES.production;
  if (dept === "sherq" || /safety|sheq|sherq/.test(title))
    return SHIFT_RISK_TEMPLATES.sherq;
  return SHIFT_RISK_TEMPLATES.office;
}

// Scores the answers. Returns { level, stopWork, unsafe }.
export function scoreAssessment(template, answers, weather) {
  let score = 0;
  let critical = false;
  const unsafe = [];
  for (const c of template.checks) {
    const a = answers[c.id];
    if (!a || a === "na") continue;
    if (a !== c.safe) {
      unsafe.push(c);
      if (c.critical) critical = true;
      score += c.weight || 1;
    }
  }
  if (template.askWeather) {
    score += WEATHER_OPTIONS.find((w) => w.value === weather)?.score || 0;
  }
  const level = critical ? "critical" : score >= 3 ? "high" : score >= 1 ? "medium" : "low";
  return { level, stopWork: critical, unsafe, score };
}
