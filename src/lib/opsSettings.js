// Cost & threshold settings that drive the operations intelligence engine.
// Each company can adjust these in Admin → Cost & Risk Settings; the
// defaults are conservative South African bulk-haulage figures and every
// cost shown in the app is labelled as an estimate based on them.

export const OPS_DEFAULTS = {
  // Fatigue (also used by the driver app timers)
  rest_interval_hours: 2, // a rest break is due after this much driving
  rest_break_minutes: 20,
  shift_warn_hours: 12,
  max_shift_hours: 14,

  // Costs (rand)
  truck_standing_cost_per_hour: 450, // truck + driver standing, not earning
  truck_fixed_cost_per_day: 3500, // finance, insurance, licensing, driver wage
  driver_overtime_rate_per_hour: 120,
  diesel_price_per_litre: 22,
  fatigue_incident_exposure: 25000, // cost exposure if a fatigued driver has an incident
  compliance_breach_cost: 5000, // fine / vehicle stopped for expired documents
  breakdown_cost_estimate: 15000, // unplanned breakdown vs planned service

  // Thresholds
  target_fuel_l_per_100km: 45,
  fuel_excess_pct: 10, // flag trucks this % worse than target
  queue_threshold_minutes: 90,
  border_threshold_hours: 6,
  stalled_load_hours: 12,
  payload_target_pct: 95, // loads below this % of legal payload are underloaded
  weight_loss_tolerance_pct: 0.5,
  idle_truck_days: 1, // active truck without a load this many days
  uninvoiced_days: 3,
  open_job_card_hours: 48,
};

export const OPS_FIELDS = [
  { group: "Fatigue rules", key: "rest_interval_hours", label: "Rest break due every (hours)" },
  { group: "Fatigue rules", key: "rest_break_minutes", label: "Minimum rest break (minutes)" },
  { group: "Fatigue rules", key: "shift_warn_hours", label: "Warn when shift reaches (hours)" },
  { group: "Fatigue rules", key: "max_shift_hours", label: "Maximum shift length (hours)" },
  { group: "Costs (R)", key: "truck_standing_cost_per_hour", label: "Truck standing cost per hour" },
  { group: "Costs (R)", key: "truck_fixed_cost_per_day", label: "Truck fixed cost per day" },
  { group: "Costs (R)", key: "driver_overtime_rate_per_hour", label: "Driver overtime rate per hour" },
  { group: "Costs (R)", key: "diesel_price_per_litre", label: "Diesel price per litre" },
  { group: "Costs (R)", key: "fatigue_incident_exposure", label: "Exposure per fatigue breach" },
  { group: "Costs (R)", key: "compliance_breach_cost", label: "Cost per expired document (fine / stoppage)" },
  { group: "Costs (R)", key: "breakdown_cost_estimate", label: "Cost of an unplanned breakdown" },
  { group: "Thresholds", key: "target_fuel_l_per_100km", label: "Target fuel use (L/100 km)" },
  { group: "Thresholds", key: "fuel_excess_pct", label: "Flag fuel use above target by (%)" },
  { group: "Thresholds", key: "queue_threshold_minutes", label: "Queue time before flagging (minutes)" },
  { group: "Thresholds", key: "border_threshold_hours", label: "Border time before flagging (hours)" },
  { group: "Thresholds", key: "stalled_load_hours", label: "Load with no update for (hours)" },
  { group: "Thresholds", key: "payload_target_pct", label: "Target payload use (%)" },
  { group: "Thresholds", key: "weight_loss_tolerance_pct", label: "Allowed load weight loss (%)" },
  { group: "Thresholds", key: "idle_truck_days", label: "Truck idle without a load (days)" },
  { group: "Thresholds", key: "uninvoiced_days", label: "Completed load not invoiced after (days)" },
  { group: "Thresholds", key: "open_job_card_hours", label: "Job card open longer than (hours)" },
];

export function opsSettings(companyProfile) {
  const saved = companyProfile?.ops_settings || {};
  const out = { ...OPS_DEFAULTS };
  for (const k of Object.keys(OPS_DEFAULTS)) {
    const v = Number(saved[k]);
    if (saved[k] !== undefined && saved[k] !== null && saved[k] !== "" && !Number.isNaN(v)) out[k] = v;
  }
  return out;
}
