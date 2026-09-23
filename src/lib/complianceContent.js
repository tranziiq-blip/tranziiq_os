// Specialized compliance content — structured as DATA (not UI text) so regulatory
// content can be updated centrally and new SADC jurisdictions added as configurations.

export const JURISDICTIONS = [
  {
    code: "ZA",
    name: "South Africa",
    level: "country",
    rules: {
      dg: {
        transportPermitRequired: true,
        transitPermitRequired: false,
        emergencyContact:
          "10177 national emergency · local HAZMAT response team",
        placardingStandard: "SANS 10231 class diamonds, UN number",
      },
      coldChain: { importPermitRequired: false, healthCertRequired: false },
      abnormal: {
        permitAuthority:
          "Provincial road authority — one permit per  province crossed",
        escortRequired: "case-by-case per Code of Practice",
        daylightOnly: false,
      },
    },
  },
  {
    code: "ZA-GP",
    name: "Gauteng (SA)",
    level: "province",
    rules: {
      abnormal: { permitAuthority: "Gauteng Dept of Roads & Transport" },
    },
  },
  {
    code: "ZA-LP",
    name: "Limpopo (SA)",
    level: "province",
    rules: {
      abnormal: {
        permitAuthority: "Limpopo Dept of Public Works, Roads & Infrastructure",
      },
    },
  },
  {
    code: "ZA-MP",
    name: "Mpumalanga (SA)",
    level: "province",
    rules: {
      abnormal: {
        permitAuthority: "Mpumalanga Dept of Public Works, Roads &  Transport",
      },
    },
  },
  {
    code: "ZA-KZN",
    name: "KwaZulu-Natal (SA)",
    level: "province",
    rules: {
      abnormal: { permitAuthority: "KZN Dept of Transport" },
    },
  },
  {
    code: "ZA-FS",
    name: "Free State (SA)",
    level: "province",
    rules: {
      abnormal: {
        permitAuthority: "Free State Dept of Police, Roads & Transport",
      },
    },
  },
  {
    code: "ZA-NW",
    name: "North West (SA)",
    level: "province",
    rules: {
      abnormal: {
        permitAuthority: "North West Dept of Community Safety & Transport",
      },
    },
  },
  {
    code: "ZA-NC",
    name: "Northern Cape (SA)",
    level: "province",
    rules: {
      abnormal: {
        permitAuthority: "Northern Cape Dept of Transport, Safety &  Liaison",
      },
    },
  },
  {
    code: "ZA-EC",
    name: "Eastern Cape (SA)",
    level: "province",
    rules: {
      abnormal: { permitAuthority: "Eastern Cape Dept of Transport" },
    },
  },
  {
    code: "ZA-WC",
    name: "Western Cape (SA)",
    level: "province",
    rules: {
      abnormal: { permitAuthority: "Western Cape Dept of Infrastructure" },
    },
  },
  {
    code: "NA",
    name: "Namibia",
    level: "country",
    rules: {
      dg: {
        transportPermitRequired: true,
        transitPermitRequired: true,
        emergencyContact: "Namibian Police / national emergency services",
        placardingStandard: "UN Model Regulations class diamonds",
      },
      coldChain: { importPermitRequired: true, healthCertRequired: true },
      abnormal: {
        permitAuthority: "Roads Authority of Namibia (RA)",
        escortRequired: "mandatory above statutory dimensions",
        daylightOnly: true,
      },
    },
  },
  {
    code: "BW",
    name: "Botswana",
    level: "country",
    rules: {
      dg: {
        transportPermitRequired: true,
        transitPermitRequired: true,
        emergencyContact: "Botswana Police Service",
        placardingStandard: "UN Model  Regulations class diamonds",
      },
      coldChain: { importPermitRequired: true, healthCertRequired: true },
      abnormal: {
        permitAuthority:
          "Dept of Roads, Ministry of Transport &  Communications",
        escortRequired: "case-by-case",
        daylightOnly: true,
      },
    },
  },
  {
    code: "ZW",
    name: "Zimbabwe",
    level: "country",
    rules: {
      dg: {
        transportPermitRequired: true,
        transitPermitRequired: true,
        emergencyContact: "Zimbabwe Republic Police / civil protection",
        placardingStandard: "UN Model Regulations class diamonds",
      },
      coldChain: { importPermitRequired: true, healthCertRequired: true },
      abnormal: {
        permitAuthority: "Dept of Roads / Ministry of Transport",
        escortRequired: "mandatory for abnormal loads",
        daylightOnly: true,
      },
    },
  },
  {
    code: "ZM",
    name: "Zambia",
    level: "country",
    rules: {
      dg: {
        transportPermitRequired: true,
        transitPermitRequired: true,
        emergencyContact: "Zambia Police / RSPCA emergency",
        placardingStandard: "UN  Model Regulations class diamonds",
      },
      coldChain: { importPermitRequired: true, healthCertRequired: true },
      abnormal: {
        permitAuthority: "Road Development Agency (RDA)",
        escortRequired: "case-by-case",
        daylightOnly: true,
      },
    },
  },
  {
    code: "MZ",
    name: "Mozambique",
    level: "country",
    rules: {
      dg: {
        transportPermitRequired: true,
        transitPermitRequired: true,
        emergencyContact: "Polícia de Moçambique / emergency services",
        placardingStandard: "UN Model Regulations class diamonds",
      },
      coldChain: { importPermitRequired: true, healthCertRequired: true },
      abnormal: {
        permitAuthority: "Administração Nacional de Estradas (ANE)",
        escortRequired: "mandatory",
        daylightOnly: true,
      },
    },
  },
  {
    code: "LS",
    name: "Lesotho",
    level: "country",
    rules: {
      dg: {
        transportPermitRequired: true,
        transitPermitRequired: true,
        emergencyContact: "Lesotho Mounted Police",
      },
      coldChain: { importPermitRequired: true, healthCertRequired: true },
      abnormal: {
        permitAuthority: "Ministry of Public  Works & Transport",
        escortRequired: "case-by-case",
        daylightOnly: true,
      },
    },
  },
  {
    code: "SZ",
    name: "Eswatini",
    level: "country",
    rules: {
      dg: {
        transportPermitRequired: true,
        transitPermitRequired: true,
        emergencyContact: "Royal Eswatini Police",
      },
      coldChain: { importPermitRequired: true, healthCertRequired: true },
      abnormal: {
        permitAuthority: "Ministry of Public  Works & Transport",
        escortRequired: "case-by-case",
        daylightOnly: true,
      },
    },
  },
];

export const getJurisdiction = (code) =>
  JURISDICTIONS.find((j) => j.code === code) || null;
export const jurisdictionName = (code) => getJurisdiction(code)?.name || code;

export const PROFILE_TYPES = {
  dg_hazmat: {
    key: "dg_hazmat",
    label: "DG / Hazmat",
    icon: "Flame",
    regulatoryBasis:
      "National Road Traffic Act Regs (Ch. VIII) · SANS 10228  (classification) · SANS 10229 (packaging/tank containers) · SANS 10231  (transport of DG by road) · UN Model Regulations (SADC-aligned classification)",
    documents: [
      {
        id: "dgd",
        label: "Dangerous Goods Declaration (DGD) for this consignment",
        scope: "load",
      },
      {
        id: "sds",
        label: "Safety Data Sheet (SDS) for each substance carried",
        scope: "load",
      },
      {
        id: "driver_dg_permit",
        label: "Driver DG transport permit / training  certificate",
        scope: "driver",
        expiryTracked: true,
      },
      {
        id: "vehicle_dg_permit",
        label:
          "Vehicle DG certification / permit (annual,  tank/vehicle specific)",
        scope: "vehicle",
        expiryTracked: true,
      },
      {
        id: "trem_card",
        label:
          "Emergency Response Guide / TREM card matched to  the substance carried",
        scope: "vehicle",
      },
      {
        id: "placarding",
        label:
          "Placarding & marking sign-off (UN number, class  diamond, correct on all sides)",
        scope: "vehicle",
      },
      {
        id: "segregation",
        label:
          "Segregation compliance check (multiple  substances on one vehicle)",
        scope: "load",
      },
      {
        id: "spill_kit",
        label: "Spill kit inventory check (in-date, complete)",
        scope: "equipment",
        expiryTracked: true,
      },
      {
        id: "packaging",
        label: "Proof of consignor's DG packaging compliance",
        scope: "load",
      },
      {
        id: "transit_dg_permit",
        label: "Transit country DG permit /  authorisation",
        scope: "permit",
        crossBorderOnly: true,
        perJurisdiction: true,
        expiryTracked: true,
      },
      {
        id: "customs_dg",
        label: "Customs DG declaration",
        scope: "load",
        crossBorderOnly: true,
      },
      {
        id: "border_docs",
        label:
          "Border post-specific documentation required by  destination country",
        scope: "load",
        crossBorderOnly: true,
        perJurisdiction: true,
      },
    ],
    dvi: [
      {
        id: "dv_placards",
        label: "Placards fitted correctly on all four sides and  legible",
      },
      {
        id: "dv_trem",
        label: "TREM card / emergency info in cab and accessible to  driver",
      },
      { id: "dv_spill_kit", label: "Spill kit present, sealed, in-date" },
      {
        id: "dv_extinguisher",
        label:
          "Fire extinguisher present, serviced,  in-date, correct rating for load class",
      },
      {
        id: "dv_valves",
        label:
          "Tank/container valves, seals and couplings  inspected for leaks",
      },
      {
        id: "dv_ppe",
        label:
          "PPE for the specific substance class present in cab  (gloves, goggles, respirator as required)",
      },
      {
        id: "dv_permit",
        label: "Vehicle DG permit displayed/available and not  expired",
      },
      {
        id: "dv_signage",
        label: "No smoking / ignition source signage present and  intact",
      },
      {
        id: "dv_segregation",
        label:
          "Load segregation physically verified against  DGD (incompatible substances not co-loaded)",
      },
      {
        id: "dv_briefing",
        label:
          "Driver verbal briefing on substance hazards for  this specific trip",
      },
      {
        id: "dv_border",
        label:
          "All border/transit documentation present and  matched to route plan",
        crossBorderOnly: true,
      },
    ],
    expiryRegister: [
      { documentType: "Driver DG training certificate", scope: "driver" },
      { documentType: "Vehicle DG permit / certification", scope: "vehicle" },
      {
        documentType: "Spill kit contents (in-date items)",
        scope: "equipment",
      },
      { documentType: "Fire extinguisher service", scope: "equipment" },
      { documentType: "Cross-border transit DG permit", scope: "permit" },
    ],
    monitoring: [
      "Geofencing — alert on entry to DG-restricted zone or  non-approved route",
      "Real-time spill/incident button in driver app (auto  incident record + emergency contact list per jurisdiction)",
      "Route deviation  alert",
      "Optional temperature/pressure sensor feed for pressurised substances",
    ],
  },
  cold_chain: {
    key: "cold_chain",
    label: "Cold Chain",
    icon: "Snowflake",
    regulatoryBasis:
      "SANS 10330 (HACCP-based food safety management) ·  Foodstuffs, Cosmetics & Disinfectants Act 54 of 1972 · Medicines & Related  Substances Act 101 of 1965 (pharma/health cargo) · client-specific cold-chain  SOPs",
    documents: [
      {
        id: "logger_calibration",
        label:
          "Temperature logger calibration  certificate (current, not expired)",
        scope: "logger",
        expiryTracked: true,
      },
      {
        id: "pre_cool",
        label:
          "Pre-cool confirmation record (reefer reached  required temp before loading)",
        scope: "load",
      },
      {
        id: "pickup_temp",
        label:
          "Load temperature reading at point of pickup,  matched against required product range",
        scope: "load",
      },
      {
        id: "seal_number",
        label: "Seal number recorded and matched to consignment  note",
        scope: "load",
      },
      {
        id: "reefer_service",
        label: "Reefer unit service / maintenance record  (current)",
        scope: "vehicle",
        expiryTracked: true,
      },
      {
        id: "client_sop",
        label:
          "Client-specific cold-chain SOP acknowledgment (if  contractually required)",
        scope: "load",
      },
      {
        id: "phyto_health_cert",
        label: "Phytosanitary / health certificate",
        scope: "permit",
        crossBorderOnly: true,
        perJurisdiction: true,
        expiryTracked: true,
      },
      {
        id: "import_permit",
        label: "Destination country import permit for  perishable/pharma goods",
        scope: "permit",
        crossBorderOnly: true,
        perJurisdiction: true,
        expiryTracked: true,
      },
    ],
    dvi: [
      {
        id: "dv_reefer_on",
        label:
          "Reefer unit powered on and running, set to  correct temperature for product type",
      },
      {
        id: "dv_reefer_fuel",
        label: "Fuel level for reefer unit sufficient for  trip duration",
      },
      {
        id: "dv_door_seals",
        label: "Door seals and insulation checked for damage",
      },
      {
        id: "dv_logger",
        label: "Temperature logger fitted, active and  transmitting/recording",
      },
      {
        id: "dv_pretrip_temp",
        label: "Pre-trip temperature reading logged and  within tolerance",
      },
      {
        id: "dv_interior",
        label: "Trailer/body interior clean and free of  contamination risk",
      },
      {
        id: "dv_seal",
        label: "Seal applied and seal number recorded on waybill",
      },
      {
        id: "dv_backup_power",
        label: "Backup power/generator (if applicable)  checked and fuelled",
      },
      {
        id: "dv_temp_briefing",
        label:
          "Driver briefed on temperature tolerance  range and breach escalation procedure",
      },
      {
        id: "dv_border",
        label:
          "Cross-border health/import documentation present  and matched to route plan",
        crossBorderOnly: true,
      },
    ],
    expiryRegister: [
      {
        documentType: "Temperature logger calibration certificate",
        scope: "logger",
      },
      {
        documentType: "Reefer unit service / maintenance certificate",
        scope: "vehicle",
      },
      {
        documentType: "Destination country import / health permit",
        scope: "permit",
      },
    ],
    monitoring: [
      "IoT/API feed from Bluetooth/GSM temperature logger, logged at  the defined interval",
      "Automated high/low threshold-breach alert to compliance  officer and driver in real time",
      "Auto Cold-Chain Excursion Report when breach  exceeds the defined duration",
      "Chain-of-custody temperature log at every  handover point (loading, checkpoints, border, offloading)",
    ],
  },
  abnormal_load: {
    key: "abnormal_load",
    label: "Abnormal Load",
    icon: "Package",
    regulatoryBasis:
      "National Road Traffic Act · Code of Practice for the  Transportation of Abnormal Loads & Abnormal Vehicles on South African Roads ·  provincial road authority permitting (one permit per province crossed) ·  per-country SADC rules (each country configured separately)",
    documents: [
      {
        id: "permit",
        label:
          "Abnormal load permit — one per province/country the  route crosses, valid for travel dates",
        scope: "permit",
        perJurisdiction: true,
        expiryTracked: true,
      },
      {
        id: "route_survey",
        label:
          "Route survey report (bridges, overhead  obstructions, turning points) — per jurisdiction if cross-border",
        scope: "permit",
        perJurisdiction: true,
      },
      {
        id: "escort_booking",
        label:
          "Escort vehicle booking confirmation & escort  driver competency certificate(s)",
        scope: "escort",
        expiryTracked: true,
      },
      {
        id: "dimension_cert",
        label:
          "Load dimension and mass certificate, verified  against the most restrictive permit limit on the route",
        scope: "load",
      },
      {
        id: "signage_signoff",
        label:
          "Signage and lighting compliance sign-off  (oversize markers, flags, beacons)",
        scope: "vehicle",
      },
      {
        id: "authority_notification",
        label:
          "Traffic authority notification (where  required by permit conditions, e.g. police escort points)",
        scope: "permit",
      },
      {
        id: "border_permit",
        label: "Destination/transit country abnormal load  permit",
        scope: "permit",
        crossBorderOnly: true,
        perJurisdiction: true,
        expiryTracked: true,
      },
      {
        id: "border_arrangement",
        label: "Border crossing arrangement  confirmation",
        scope: "load",
        crossBorderOnly: true,
      },
    ],
    dvi: [
      {
        id: "dv_dimensions",
        label:
          "Load dimensions (height, width, length, mass)  measured and matched against the most restrictive permit limit on the route",
      },
      {
        id: "dv_signage",
        label:
          "Signage fitted — 'ABNORMAL LOAD' boards front and  rear, correctly sized and legible per jurisdiction requirements",
      },
      { id: "dv_flags", label: "Warning flags/beacons fitted and functioning" },
      {
        id: "dv_escort",
        label:
          "Escort vehicle(s) present, correctly marked and  briefed on route (incl. country-specific escort markings)",
      },
      {
        id: "dv_tie_down",
        label:
          "Tie-down/securing of load inspected and  confirmed adequate for mass and shape",
      },
      {
        id: "dv_permit_cab",
        label:
          "Permit document(s) present in cab and valid  for date/route/province/country",
      },
      {
        id: "dv_route_match",
        label:
          "Route matches the permit-approved route  exactly (no shortcuts or detours)",
      },
      {
        id: "dv_travel_times",
        label:
          "Driver briefed on permitted travel times  (daylight-only restrictions can differ by country)",
      },
      {
        id: "dv_comms",
        label: "Communication method with escort vehicle(s)  confirmed working",
      },
      {
        id: "dv_border",
        label:
          "Border crossing logistics confirmed — arrival time  window, documentation ready for inspection",
        crossBorderOnly: true,
      },
    ],
    expiryRegister: [
      {
        documentType: "Provincial / country abnormal load permit",
        scope: "permit",
      },
      { documentType: "Escort driver competency certificate", scope: "escort" },
    ],
    monitoring: [
      "GPS route-adherence tracking against the permit-approved  route",
      "Alert on route deviation or travel outside the permitted time window",
      "Auto-log of actual travel times vs permit conditions for audit, segmented by  jurisdiction crossed",
    ],
  },
};

export const COMPLIANCE_ADDON_MAP = {
  dg_hazmat: "dg_hazmat",
  cold_chain: "cold_chain",
  abnormal_load: "abnormal_load",
};
