// TranziIQ operations intelligence engine.
// Scans live records for risks and inefficiencies, estimates what each one
// costs using the company's own cost settings, and recommends an action.
// Every rand figure is an estimate and says how it was worked out.

import { base44 } from "@/api/base44Client";
import { opsSettings } from "@/lib/opsSettings";

const H = 3600000;
const DAY = 24 * H;
const IN_FLIGHT = [
  "enroute_to_loading", "arrived_at_loading", "queue_to_load", "weighing_in_empty",
  "loading", "weighing_out_loaded", "at_border", "cleared", "enroute_to_offloading",
  "arrived_at_offloading", "queue_to_offload", "weighing_in_loaded", "offloading",
  "weighing_out_empty", "in_transit", "customs_hold", "at_destination", "unloading", "loaded",
];
const DONE = ["load_completed", "delivered", "pod_captured", "completed"];
const JOB_CLOSED = ["completed", "cancelled", "closed"];

export const CATEGORIES = {
  fatigue: "Driver fatigue & safety",
  delays: "Delays & standing time",
  utilisation: "Fleet utilisation",
  payload: "Payload & weight loss",
  fuel: "Fuel efficiency",
  maintenance: "Maintenance & breakdowns",
  compliance: "Compliance & documents",
  revenue: "Revenue & cash flow",
  safety: "Safety & risk",
};
const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

const safe = (p) => p.catch(() => []);
const t = (v) => (v ? new Date(v).getTime() : null);
const hrs = (ms) => ms / H;
const r = (n) => Math.round(Number(n) || 0);
const rand = (n) => "R " + r(n).toLocaleString("en-ZA").replace(/,/g, " ");
const reg = (x) => x?.truck_registration || x?.registration_number || "Truck";

// Everything the engine needs, in one pass. Finance tables return nothing
// for staff without finance access (enforced by the database).
export async function loadOpsData() {
  const E = base44.entities;
  const [
    profiles, trucks, trailers, drivers, loads, charges, shifts, inspections,
    risks, incidents, jobs, schedules, fuel, invoices, creds, compDocs, parts, riskReg,
  ] = await Promise.all([
    safe(E.CompanyProfile.list()), safe(E.Truck.list()), safe(E.Trailer.list()),
    safe(E.Driver.list()), safe(E.Load.list("-created_date", 1000)),
    safe(E.LoadCharge.list()), safe(E.ShiftLog.list("-clock_in", 500)),
    safe(E.Inspection.list("-created_date", 300)), safe(E.ShiftRiskAssessment.list("-created_date", 300)),
    safe(E.IncidentReport.list()), safe(E.JobCard.list()), safe(E.MaintenanceSchedule.list()),
    safe(E.FuelLog.list("-log_date", 1000)), safe(E.Invoice.list()),
    safe(E.PersonnelCredential.list()), safe(E.ComplianceDocument.list()),
    safe(E.Part.list()), safe(E.RiskRegister.list()),
  ]);
  return {
    profile: profiles[0] || null, trucks, trailers, drivers, loads, charges, shifts,
    inspections, risks, incidents, jobs, schedules, fuel, invoices, creds, compDocs, parts, riskReg,
  };
}

// Time spent in each status, from the timestamped status history
function statusDurations(load, now) {
  const hist = Array.isArray(load.status_history) ? load.status_history : [];
  const out = {};
  hist.forEach((h, i) => {
    const start = t(h.at);
    const end = i + 1 < hist.length ? t(hist[i + 1].at) : IN_FLIGHT.includes(load.status) ? now : start;
    if (start && end && end > start) out[h.status] = (out[h.status] || 0) + (end - start);
  });
  return out;
}

export function analyseOperations(data, now = Date.now()) {
  const S = opsSettings(data.profile);
  const f = [];
  const add = (x) => f.push({ severity: "medium", cost: null, ...x });
  const chargeFor = Object.fromEntries((data.charges || []).map((c) => [c.load_id, c]));
  const truckById = Object.fromEntries((data.trucks || []).map((x) => [x.id, x]));

  // Average revenue per completed load (finance users only; drives idle-truck cost)
  const doneCharges = data.loads.filter((l) => DONE.includes(l.status)).map((l) => Number(chargeFor[l.id]?.estimated_amount || 0)).filter((x) => x > 0);
  const avgLoadRevenue = doneCharges.length ? doneCharges.reduce((a, b) => a + b, 0) / doneCharges.length : null;

  // ---------- Fatigue ----------
  data.shifts
    .filter((s) => s.status === "active" && s.clock_in && !s.clock_out)
    .forEach((s) => {
      const on = now - t(s.clock_in);
      const who = s.driver_name || "Driver";
      const onH = hrs(on);
      if (onH >= S.max_shift_hours) {
        const over = onH - S.max_shift_hours;
        add({
          id: `shift-max-${s.id}`, category: "fatigue", severity: "critical",
          title: `${who} is ${over.toFixed(1)}h over the ${S.max_shift_hours}h shift limit`,
          detail: `On shift for ${onH.toFixed(1)} hours since ${new Date(s.clock_in).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}.`,
          cost: over * S.driver_overtime_rate_per_hour + S.fatigue_incident_exposure,
          costBasis: `${over.toFixed(1)}h overtime at ${rand(S.driver_overtime_rate_per_hour)}/h + ${rand(S.fatigue_incident_exposure)} incident exposure`,
          action: "Stop the vehicle at the next safe place and clock the driver out. Arrange a relief driver for the rest of the trip.",
          link: "/drivers",
        });
      } else if (onH >= S.shift_warn_hours) {
        add({
          id: `shift-warn-${s.id}`, category: "fatigue", severity: "high",
          title: `${who} has ${(S.max_shift_hours - onH).toFixed(1)}h left before the shift limit`,
          detail: `On shift for ${onH.toFixed(1)} hours.`,
          action: "Plan the driver's last trip so they finish before the limit, or line up a relief driver now.",
          link: "/drivers",
        });
      }
      const restEvery = S.rest_interval_hours * H;
      const sinceRest = on - (Number(s.rests_taken) || 0) * restEvery;
      if (sinceRest >= restEvery) {
        const overdue = hrs(sinceRest - restEvery);
        add({
          id: `rest-${s.id}`, category: "fatigue", severity: overdue >= 1 ? "critical" : "high",
          title: `${who} is ${overdue >= 1 ? overdue.toFixed(1) + "h" : Math.round(overdue * 60) + " min"} overdue for a rest break`,
          detail: `${s.rests_taken || 0} rest break(s) logged in ${onH.toFixed(1)} hours. Rule: ${S.rest_break_minutes} min every ${S.rest_interval_hours}h.`,
          cost: S.fatigue_incident_exposure * Math.min(1, overdue / S.rest_interval_hours + 0.25),
          costBasis: `Share of ${rand(S.fatigue_incident_exposure)} incident exposure, rising with time overdue`,
          action: `Call the driver and instruct a ${S.rest_break_minutes}-minute rest at the next safe stop. Log it in the driver app.`,
          link: "/drivers",
        });
      }
    });
  // Drivers on shift without a passed inspection or risk assessment today
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const isToday = (v) => t(v) >= today.getTime();
  data.shifts
    .filter((s) => s.status === "active" && !s.clock_out && isToday(s.clock_in))
    .forEach((s) => {
      const insp = data.inspections.find((i) => i.driver_id === s.driver_id && isToday(i.created_at || i.created_date));
      const ra = data.risks.find((x) => x.driver_id === s.driver_id && isToday(x.created_at || x.created_date));
      if (!insp || insp.status !== "pass") {
        add({
          id: `noinsp-${s.id}`, category: "safety", severity: "high",
          title: `${s.driver_name || "Driver"} is on shift without a passed pre-trip inspection`,
          detail: insp ? "Today's inspection failed." : "No inspection recorded today.",
          cost: S.breakdown_cost_estimate * 0.2,
          costBasis: `20% of a ${rand(S.breakdown_cost_estimate)} breakdown, the risk of running an unchecked truck`,
          action: "Hold the vehicle until the pre-trip inspection is done and passed.",
          link: "/driver/inspect",
        });
      } else if (!ra) {
        add({
          id: `nora-${s.id}`, category: "safety", severity: "medium",
          title: `${s.driver_name || "Driver"} has no shift risk assessment today`,
          action: "Ask the driver to complete the risk assessment in the driver app before departing.",
          link: "/driver",
        });
      }
    });
  data.risks
    .filter((x) => isToday(x.created_at || x.created_date) && ["high", "critical", "extreme"].includes(String(x.risk_level).toLowerCase()))
    .forEach((x) => add({
      id: `hira-${x.id}`, category: "safety", severity: "high",
      title: `${x.driver_name || "Driver"} rated today's trip ${String(x.risk_level).toUpperCase()} risk`,
      detail: [x.hazards_identified, x.rest_adequate === false && "driver reports inadequate rest", x.vehicle_condition && x.vehicle_condition !== "good" && `vehicle: ${x.vehicle_condition}`].filter(Boolean).join(" · "),
      action: "Review the hazards with the driver before departure. Consider a different driver or delaying the trip.",
      link: "/safety",
    }));

  // ---------- Delays & standing time ----------
  data.loads.forEach((l) => {
    const d = statusDurations(l, now);
    const q = (d.queue_to_load || 0) + (d.queue_to_offload || 0);
    if (q > S.queue_threshold_minutes * 60000) {
      const excess = hrs(q - S.queue_threshold_minutes * 60000);
      add({
        id: `queue-${l.id}`, category: "delays", severity: excess > 3 ? "high" : "medium",
        title: `Load ${l.load_number} queued ${hrs(q).toFixed(1)}h at ${d.queue_to_offload ? "offloading" : "loading"}`,
        detail: `${excess.toFixed(1)}h beyond the ${S.queue_threshold_minutes}-minute target.`,
        cost: excess * S.truck_standing_cost_per_hour,
        costBasis: `${excess.toFixed(1)}h × ${rand(S.truck_standing_cost_per_hour)}/h standing cost`,
        action: "Book loading slots with the site, and claim standing time from the client if the contract allows.",
        link: "/loads",
      });
    }
    const border = d.at_border || 0;
    if (border > S.border_threshold_hours * H) {
      const excess = hrs(border - S.border_threshold_hours * H);
      add({
        id: `border-${l.id}`, category: "delays", severity: excess > 12 ? "critical" : "high",
        title: `Load ${l.load_number} has been ${hrs(border).toFixed(1)}h at ${l.border_post || "the border"}`,
        detail: `${excess.toFixed(1)}h beyond the ${S.border_threshold_hours}h target.`,
        cost: excess * S.truck_standing_cost_per_hour,
        costBasis: `${excess.toFixed(1)}h × ${rand(S.truck_standing_cost_per_hour)}/h standing cost`,
        action: "Contact the freight clearer for the hold-up and check all customs documents are uploaded.",
        link: "/weighbill",
      });
    }
    if (IN_FLIGHT.includes(l.status)) {
      const last = t(l.status_updated_at || l.updated_at || l.updated_date);
      const idle = last ? now - last : 0;
      if (idle > S.stalled_load_hours * H) {
        add({
          id: `stall-${l.id}`, category: "delays", severity: "high",
          title: `Load ${l.load_number} has had no update for ${Math.round(hrs(idle))}h`,
          detail: `Last status: ${String(l.status).replace(/_/g, " ")}.`,
          cost: hrs(idle - S.stalled_load_hours * H) * S.truck_standing_cost_per_hour,
          costBasis: `Hours beyond ${S.stalled_load_hours}h × ${rand(S.truck_standing_cost_per_hour)}/h standing cost`,
          action: "Call the driver to confirm where the truck is, and ask them to update the load status.",
          link: "/loads",
        });
      }
    }
  });

  // ---------- Utilisation ----------
  data.trucks
    .filter((x) => x.status === "active")
    .forEach((truck) => {
      const theirs = data.loads.filter((l) => l.truck_id === truck.id);
      const lastUse = Math.max(0, ...theirs.map((l) => t(l.status_updated_at || l.updated_at || l.created_at) || 0));
      const busy = theirs.some((l) => IN_FLIGHT.includes(l.status));
      if (busy) return;
      const idleDays = lastUse ? (now - lastUse) / DAY : null;
      if (idleDays === null || idleDays >= S.idle_truck_days) {
        const days = idleDays === null ? S.idle_truck_days : Math.floor(idleDays);
        const perDay = avgLoadRevenue || S.truck_fixed_cost_per_day;
        add({
          id: `idle-${truck.id}`, category: "utilisation", severity: days >= 3 ? "high" : "medium",
          title: `${reg(truck)} is idle${idleDays === null ? " with no loads recorded" : ` for ${days} day${days === 1 ? "" : "s"}`}`,
          detail: "Active truck with no load in progress.",
          cost: Math.max(1, days) * perDay,
          costBasis: avgLoadRevenue
            ? `${Math.max(1, days)} day(s) × ${rand(avgLoadRevenue)} average revenue per load`
            : `${Math.max(1, days)} day(s) × ${rand(S.truck_fixed_cost_per_day)} fixed cost per day`,
          action: "Dispatch this truck on the next pending load, or offer spare capacity to a client or subcontract.",
          link: "/loads",
        });
      }
    });

  // ---------- Payload & weight loss ----------
  data.loads.forEach((l) => {
    const truck = truckById[l.truck_id];
    const loaded = Number(l.loaded_weight_tons || l.weight_tons || 0);
    const payload = truck && Number(truck.gvm) > 0 && Number(truck.tare) >= 0
      ? (Number(truck.gvm) - Number(truck.tare)) / (Number(truck.gvm) > 200 ? 1000 : 1)
      : null;
    const ch = chargeFor[l.id];
    const perTon = ch?.rate_type === "per_ton" ? Number(ch.rate) : null;
    if (payload && loaded > 0 && DONE.concat(IN_FLIGHT).includes(l.status)) {
      const pct = (loaded / payload) * 100;
      if (pct < S.payload_target_pct) {
        const missing = payload * (S.payload_target_pct / 100) - loaded;
        add({
          id: `under-${l.id}`, category: "payload", severity: pct < 85 ? "high" : "medium",
          title: `Load ${l.load_number} used only ${pct.toFixed(0)}% of ${reg(truck)}'s payload`,
          detail: `${loaded.toFixed(1)} t loaded of ${payload.toFixed(1)} t legal payload.`,
          cost: perTon ? missing * perTon : null,
          costBasis: perTon ? `${missing.toFixed(1)} t unused × ${rand(perTon)}/t` : null,
          action: "Load to the legal limit at the weighbridge. Check the loader operator's target weights.",
          link: "/loads",
        });
      } else if (pct > 100.5) {
        add({
          id: `over-${l.id}`, category: "compliance", severity: "critical",
          title: `Load ${l.load_number} is overloaded at ${pct.toFixed(0)}% of payload`,
          detail: `${loaded.toFixed(1)} t on ${reg(truck)} (payload ${payload.toFixed(1)} t).`,
          cost: S.compliance_breach_cost,
          costBasis: `${rand(S.compliance_breach_cost)} fine / stoppage exposure`,
          action: "Offload the excess before departure. Overloading risks fines, tyre and axle damage, and road safety.",
          link: "/loads",
        });
      }
    }
    const off = Number(l.offloaded_weight_tons || 0);
    if (loaded > 0 && off > 0 && DONE.includes(l.status)) {
      const lossPct = ((loaded - off) / loaded) * 100;
      if (lossPct > S.weight_loss_tolerance_pct) {
        const lost = loaded - off;
        add({
          id: `loss-${l.id}`, category: "payload", severity: lossPct > 2 ? "high" : "medium",
          title: `Load ${l.load_number} lost ${lost.toFixed(2)} t (${lossPct.toFixed(1)}%) between loading and offloading`,
          detail: `Loaded ${loaded.toFixed(2)} t, offloaded ${off.toFixed(2)} t.`,
          cost: perTon ? lost * perTon : null,
          costBasis: perTon ? `${lost.toFixed(2)} t × ${rand(perTon)}/t not billable` : null,
          action: "Check tarping and spillage, compare both weighbill tickets, and investigate the driver and route if it repeats.",
          link: "/weighbill",
        });
      }
    }
  });

  // ---------- Fuel ----------
  // Worked fill-up by fill-up (litres at a fill-up = fuel used since the
  // previous one). Implausible odometer readings are skipped and flagged.
  const byTruck = {};
  data.fuel.forEach((x) => {
    if (!x.truck_id) return;
    (byTruck[x.truck_id] = byTruck[x.truck_id] || []).push(x);
  });
  Object.entries(byTruck).forEach(([tid, logs]) => {
    const sorted = logs.slice().sort((a, b) => (t(a.log_date || a.created_at) - t(b.log_date || b.created_at)) || (Number(a.odometer) - Number(b.odometer)));
    let km = 0, litres = 0, prev = null;
    const bad = [];
    for (const x of sorted) {
      const odo = Number(x.odometer);
      if (!(odo > 0)) continue;
      if (prev) {
        const leg = odo - prev;
        if (leg >= 20 && leg <= 5000) {
          km += leg;
          litres += Number(x.litres || 0);
        } else {
          bad.push(x);
          continue; // keep the last good reading as the reference
        }
      }
      prev = odo;
    }
    const truckName = reg(truckById[tid] || sorted[0]);
    if (bad.length) add({
      id: `odo-${tid}`, category: "fuel", severity: "medium",
      title: `${truckName} has ${bad.length} fuel slip(s) with an impossible odometer reading`,
      detail: bad.slice(0, 3).map((x) => `${Number(x.odometer).toLocaleString("en-ZA")} km on ${x.log_date || ""}`).join(", "),
      action: "Check the slips and the truck's actual odometer. A wrong or reversed reading can hide fuel theft, so confirm with the driver.",
      link: "/fleet",
    });
    if (km < 300 || litres <= 0) return;
    const per100 = (litres / km) * 100;
    const limit = S.target_fuel_l_per_100km * (1 + S.fuel_excess_pct / 100);
    if (per100 > limit) {
      const excessL = ((per100 - S.target_fuel_l_per_100km) * km) / 100;
      add({
        id: `fuel-${tid}`, category: "fuel", severity: per100 > limit * 1.15 ? "high" : "medium",
        title: `${truckName} uses ${per100.toFixed(1)} L/100 km (target ${S.target_fuel_l_per_100km})`,
        detail: `${litres.toFixed(0)} L over ${km.toLocaleString("en-ZA")} km.`,
        cost: excessL * S.diesel_price_per_litre,
        costBasis: `${excessL.toFixed(0)} L above target × ${rand(S.diesel_price_per_litre)}/L`,
        action: "Check for fuel theft (compare slips with tank capacity), idling, tyre pressure and injector condition. Coach the driver on harsh driving.",
        link: "/fleet",
      });
    }
  });

  // ---------- Maintenance ----------
  data.schedules
    .filter((m) => !["completed", "cancelled"].includes(m.status))
    .forEach((m) => {
      const due = t(m.next_service_date || m.scheduled_date);
      if (!due) return;
      const days = Math.floor((due - now) / DAY);
      if (days < 0) {
        add({
          id: `svc-${m.id}`, category: "maintenance", severity: days < -7 ? "critical" : "high",
          title: `${m.truck_registration || "Asset"} ${String(m.maintenance_type || "service").replace(/_/g, " ")} is ${-days} day(s) overdue`,
          cost: S.breakdown_cost_estimate * Math.min(1, 0.25 + -days / 30),
          costBasis: `Rising share of a ${rand(S.breakdown_cost_estimate)} unplanned breakdown`,
          action: "Book the truck into the workshop at the next return to depot.",
          link: "/engineering",
        });
      } else if (days <= 7) {
        add({
          id: `svc-soon-${m.id}`, category: "maintenance", severity: "low",
          title: `${m.truck_registration || "Asset"} ${String(m.maintenance_type || "service").replace(/_/g, " ")} due in ${days} day(s)`,
          action: "Schedule the service around the truck's planned loads to avoid downtime.",
          link: "/engineering",
        });
      }
    });
  data.jobs
    .filter((j) => !JOB_CLOSED.includes(j.status))
    .forEach((j) => {
      const openH = hrs(now - (t(j.created_at || j.created_date) || now));
      if (openH > S.open_job_card_hours) {
        const days = openH / 24;
        add({
          id: `job-${j.id}`, category: "maintenance", severity: days > 5 ? "high" : "medium",
          title: `Job card "${j.title || j.job_type || "repair"}" on ${j.truck_registration || "a truck"} open for ${days.toFixed(1)} days`,
          cost: days * (avgLoadRevenue || S.truck_fixed_cost_per_day),
          costBasis: `${days.toFixed(1)} day(s) of downtime × ${rand(avgLoadRevenue || S.truck_fixed_cost_per_day)}/day`,
          action: "Chase parts and technician allocation. Consider an outside workshop if parts are delayed.",
          link: "/engineering",
        });
      }
    });
  data.inspections
    .filter((i) => i.status === "fail" && now - t(i.created_at || i.created_date) < 3 * DAY)
    .forEach((i) => {
      const fixed = data.jobs.some((j) => j.truck_id === i.truck_id && t(j.created_at || j.created_date) >= t(i.created_at || i.created_date));
      if (!fixed) add({
        id: `inspfail-${i.id}`, category: "maintenance", severity: "high",
        title: `${i.truck_registration || "Truck"} failed its inspection with no job card raised`,
        action: "Raise a job card for the defects so the truck can be repaired and returned to service.",
        link: "/engineering",
      });
    });

  // ---------- Compliance ----------
  const expiry = (value, what, link) => {
    const d = t(value);
    if (!d) return;
    const days = Math.floor((d - now) / DAY);
    if (days > 30) return;
    add({
      id: `exp-${what}-${value}`, category: "compliance",
      severity: days < 0 ? "critical" : days <= 7 ? "high" : "medium",
      title: `${what} ${days < 0 ? `expired ${-days} day(s) ago` : days === 0 ? "expires today" : `expires in ${days} day(s)`}`,
      cost: days < 0 ? S.compliance_breach_cost : null,
      costBasis: days < 0 ? `${rand(S.compliance_breach_cost)} fine / stoppage exposure` : null,
      action: days < 0 ? "Take the vehicle or driver off the road until renewed." : "Book the renewal now so there's no gap in cover.",
      link,
    });
  };
  data.trucks.forEach((x) => {
    expiry(x.license_expiry, `${reg(x)} licence disc`, "/fleet");
    expiry(x.cof_expiry, `${reg(x)} roadworthy / COF`, "/fleet");
    expiry(x.operator_license_expiry, `${reg(x)} operator card`, "/fleet");
  });
  data.trailers.forEach((x) => {
    expiry(x.license_expiry, `Trailer ${reg(x)} licence disc`, "/fleet");
    expiry(x.cof_expiry, `Trailer ${reg(x)} roadworthy / COF`, "/fleet");
  });
  data.creds.forEach((c) => expiry(c.expiry_date, `${c.driver_name || "Driver"} ${String(c.credential_type || "credential").replace(/_/g, " ")}`, "/drivers"));
  data.compDocs.forEach((c) => expiry(c.expiry_date, `${String(c.document_type || "Compliance document").replace(/_/g, " ")}${c.holder_name ? ` (${c.holder_name})` : ""}`, "/compliance"));

  // ---------- Revenue & cash flow (finance data only) ----------
  const uninvoiced = data.loads.filter((l) => DONE.includes(l.status) && !l.invoice_id &&
    now - (t(l.status_updated_at || l.updated_at) || now) > S.uninvoiced_days * DAY);
  if (uninvoiced.length && data.charges.length) {
    const value = uninvoiced.reduce((s, l) => s + Number(chargeFor[l.id]?.estimated_amount || 0), 0);
    add({
      id: "uninvoiced", category: "revenue", severity: uninvoiced.length > 5 ? "high" : "medium",
      title: `${uninvoiced.length} completed load(s) not invoiced after ${S.uninvoiced_days} days`,
      detail: uninvoiced.slice(0, 5).map((l) => l.load_number).join(", ") + (uninvoiced.length > 5 ? "…" : ""),
      cost: value || null,
      costBasis: value ? "Revenue earned but not yet billed" : null,
      action: "Invoice these loads today. Every day unbilled delays payment by a day.",
      link: "/finance",
    });
  }
  const noRate = data.loads.filter((l) => !chargeFor[l.id] && (DONE.includes(l.status) || IN_FLIGHT.includes(l.status)));
  if (noRate.length && data.charges.length) add({
    id: "norate", category: "revenue", severity: "medium",
    title: `${noRate.length} load(s) have no agreed rate`,
    detail: "Dispatched without a route rate, so they can't be invoiced automatically.",
    action: "Add routes with rates under Admin → Directory, and dispatch loads on a route.",
    link: "/admin",
  });
  const overdue = data.invoices.filter((i) => !["paid", "cancelled", "draft"].includes(i.status) && i.due_date && t(i.due_date) < now);
  if (overdue.length) {
    const value = overdue.reduce((s, i) => s + Number(i.total_amount || i.amount || 0), 0);
    const oldest = Math.max(...overdue.map((i) => Math.floor((now - t(i.due_date)) / DAY)));
    add({
      id: "overdue", category: "revenue", severity: oldest > 30 ? "critical" : "high",
      title: `${overdue.length} overdue invoice(s) worth ${rand(value)}`,
      detail: `Oldest is ${oldest} day(s) past due.`,
      cost: value,
      costBasis: "Cash owed to you and past due",
      action: "Send statements today, phone the oldest debtors, and pause new loads for clients more than 60 days overdue.",
      link: "/finance",
    });
  }

  // ---------- Safety register ----------
  data.incidents.filter((x) => x.status !== "closed" && ["high", "critical", "major", "fatal"].includes(String(x.severity).toLowerCase())).forEach((x) => add({
    id: `inc-${x.id}`, category: "safety", severity: "high",
    title: `Open ${String(x.severity).toLowerCase()} incident: ${x.incident_type || "incident"}${x.truck_registration ? ` on ${x.truck_registration}` : ""}`,
    action: "Complete the investigation and root-cause analysis, and close out the corrective actions.",
    link: "/safety",
  }));
  data.riskReg.filter((x) => x.status === "open" && ["critical", "high"].includes(x.residual_risk_rating)).forEach((x) => add({
    id: `risk-${x.id}`, category: "safety", severity: "medium",
    title: `High residual risk still open: ${x.hazard || x.title || x.activity || "risk item"}`,
    action: "Add or strengthen controls and re-rate the risk.",
    link: "/safety",
  }));
  const lowStock = data.parts.filter((p) => p.active !== false && Number(p.reorder_level || 0) > 0 && Number(p.quantity_on_hand || 0) <= Number(p.reorder_level));
  if (lowStock.length) add({
    id: "lowstock", category: "maintenance", severity: "low",
    title: `${lowStock.length} stock item(s) at or below reorder level`,
    detail: lowStock.slice(0, 4).map((p) => p.name || p.part_number).join(", "),
    action: "Raise purchase orders so repairs aren't held up waiting for parts.",
    link: "/stores",
  });

  // Round, sort: most severe first, then most expensive
  f.forEach((x) => { if (x.cost != null) x.cost = r(x.cost); });
  f.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || (b.cost || 0) - (a.cost || 0));
  const totalCost = f.reduce((s, x) => s + (x.cost || 0), 0);
  const byCategory = Object.keys(CATEGORIES).map((k) => {
    const items = f.filter((x) => x.category === k);
    return { key: k, label: CATEGORIES[k], count: items.length, cost: items.reduce((s, x) => s + (x.cost || 0), 0) };
  }).filter((c) => c.count);
  return { findings: f, totalCost, byCategory, settings: S, generatedAt: new Date(now).toISOString() };
}

export const formatRand = rand;
