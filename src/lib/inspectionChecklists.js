export const TRUCK_CAB_CHECKS = [
 { id: "license_disk", label: "License disk valid & displayed" },
 { id: "prdp", label: "Professional Driving Permit (PrDP) valid" },
 { id: "service_history", label: "Service history up to date" },
 { id: "dashboard", label: "Dashboard warning lights — no faults" },
 { id: "speedo_tacho", label: "Speedometer & tachograph operational" },
 { id: "horn", label: "Horn operational" },
 { id: "seatbelt", label: "Seatbelt functional" },
 { id: "mirrors", label: "Mirrors clean & adjusted" },
 { id: "wipers", label: "Wipers & washers operational" },
 { id: "fire_extinguisher", label: "Fire extinguisher — in date & mounted" },
 { id: "first_aid", label: "First aid kit stocked" },
 { id: "triangles", label: "Warning triangles on board" },
 { id: "reflectors", label: "Reflectors & chevrons intact" }
];

export const TRUCK_EXTERNAL_CHECKS = [
 { id: "engine_oil", label: "Engine oil level correct" },
 { id: "coolant", label: "Coolant level correct" },
 { id: "power_steering_fluid", label: "Power steering fluid level" },
 { id: "brake_fluid", label: "Brake fluid level" },
 { id: "battery", label: "Battery secure & terminals clean" },
 { id: "exhaust", label: "Exhaust system — no leaks" },
 { id: "driveline", label: "Driveline — no play or damage" },
 { id: "suspension_truck", label: "Suspension — air bags / springs OK" },
 { id: "steering", label: "Steering — free play & response" },
 { id: "brake_hoses", label: "Brake hoses & airlines — no leaks" },
 { id: "service_brakes", label: "Service & park brakes operational" },
 { id: "headlights", label: "Headlights, indicators & tail lights" },
 { id: "fuel_cap", label: "Fuel tank cap secure" },
 { id: "cab_mounts", label: "Cab mounts — secure" }
];

export const TRAILER_CHECKS = [
 { id: "trailer_disk", label: "Trailer license disk valid" },
 { id: "landing_legs", label: "Landing legs operational" },
 { id: "king_pin", label: "King pin / fifth wheel secure" },
 { id: "air_electrical", label: "Air & electrical connections secure" },
 { id: "brake_chambers", label: "Trailer brake chambers functional" },
 { id: "suspension_trailer", label: "Trailer suspension — OK" },
 { id: "chassis", label: "Chassis / frame — no cracks" },
 { id: "rear_bumper", label: "Rear bumper / underrun protection" },
 { id: "mudguards", label: "Mudguards secure" },
 { id: "trailer_lights", label: "Trailer lights — tail, brake, indicator" }
];

export const FLEET_CHECKS = {
 mining_bulk: {
 title: "Mining Bulk — Compliance",
 items: [
 { id: "safety_file", label: "Mining-house safety file on board" },
 { id: "icam", label: "ICAM kit available" },
 { id: "weighbridge", label: "Weighbridge ticket booked" },
 { id: "contract_kpi", label: "Contract KPI briefing acknowledged" }
 ]
 },
 reefer: {
 title: "Refrigerated — Cold Chain",
 items: [
 { id: "reefer_temp", label: "Reefer set-point temperature correct" },
 { id: "pre_cool", label: "Pre-cool check completed" },
 { id: "temp_log", label: "Temperature logger fitted & recording" },
 { id: "door_seals", label: "Door seals intact — no cold leak" }
 ]
 },
 petroleum_tanker: {
 title: "Petroleum Tanker — Dangerous Goods",
 items: [
 { id: "dg_placards", label: "DG placards correct & visible" },
 { id: "earth_strap", label: "Earth strap connected & intact" },
 { id: "vapour", label: "Vapour recovery system" },
 { id: "decanting", label: "Decanting checklist on board" },
 { id: "product_loss", label: "Product loss/gain form ready" }
 ]
 },
 gas_tanker: {
 title: "Gas Tanker (LPG) — DG Compliance",
 items: [
 { id: "pressure", label: "Pressure gauge within limits" },
 { id: "leak_check", label: "Leak detection check passed" },
 { id: "ppe", label: "Specialised DG PPE on board" },
 { id: "emergency_proc", label: "Emergency procedures card present" }
 ]
 },
 food_grade_tanker: {
 title: "Food-Grade Tanker — Food Safety",
 items: [
 { id: "wash_cert", label: "Wash-out / cleaning certificate valid" },
 { id: "contamination", label: "Contamination prevention verified" },
 { id: "food_safety", label: "Food safety compliance docs on board" }
 ]
 },
 cement_bulk: {
 title: "Cement / Bulk Powder",
 items: [
 { id: "pneumatic", label: "Pneumatic offload system tested" },
 { id: "blow_line", label: "Blow-line checks completed" },
 { id: "pressure_relief", label: "Pressure relief valve functional" }
 ]
 },
 low_bed: {
 title: "Low-Bed / Abnormal Load",
 items: [
 { id: "abnormal_permit", label: "Abnormal load permit valid" },
 { id: "route_survey", label: "Route survey completed" },
 { id: "pilot_escort", label: "Pilot / escort vehicle coordinated" },
 { id: "axle_load", label: "Axle load compliance verified" }
 ]
 },
 flatbed: {
 title: "Flatbed — Load Securement",
 items: [
 { id: "lashing", label: "Load securement / lashing checked" },
 { id: "tarping", label: "Tarping record completed" },
 { id: "edge_protection", label: "Edge protectors fitted" }
 ]
 },
 tautliner: {
 title: "Tautliner — General Freight",
 items: [
 { id: "curtains", label: "Curtains secure & undamaged" },
 { id: "load_secured", label: "Load secured against movement" },
 { id: "pod_docs", label: "POD / delivery docs on board" }
 ]
 }
};

import { combinationMeta } from "@/lib/fleetTypes";

export const getTyreCheckItems = (combinationType) => {
 const combo = combinationMeta(combinationType);
 const items = [];
 combo.axles.forEach((axle) => {
 axle.positions.forEach((pos) => {
 const id = `tyre_${axle.id}_${pos.toLowerCase().replace(/\s+/g, "_")}`;
 items.push({ id, label: `${axle.label} — ${pos}`, isTyre: true });
 });
 });
 return items;
};

export const getInspectionSections = (fleetType, combinationType, 
tyreItemsOverride) => {
 const combo = combinationMeta(combinationType);
 const fleetSpecific = FLEET_CHECKS[fleetType] || { title: "Fleet-Specific", 
items: [] };
 const tyreItems = tyreItemsOverride && tyreItemsOverride.length > 0 ? 
tyreItemsOverride : getTyreCheckItems(combinationType);

 const sections = [
 { id: "truck_cab", title: "Truck — Cab & Documents", items: TRUCK_CAB_CHECKS 
},
 { id: "truck_external", title: "Truck — External & Mechanical", items: 
TRUCK_EXTERNAL_CHECKS }
 ];

 if (combo.has_trailer) {
 sections.push({ id: "trailer", title: "Trailer Checks", items: TRAILER_CHECKS 
});
 }

 sections.push({ id: "tyres", title: "Tyre Inspection", items: tyreItems });
 sections.push({ id: "fleet_specific", title: fleetSpecific.title, items: 
fleetSpecific.items });

 const allItems = sections.flatMap((s) => s.items);
 return { sections, allItems, combo };
};
