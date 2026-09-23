export const FLEET_TYPES = [
 { key: "mining_bulk", label: "Mining Bulk", color: "bg-amber-100  text-amber-700 border-amber-200", dot: "bg-amber-500" },
 { key: "reefer", label: "Refrigerated", color: "bg-sky-100 text-sky-700  border-sky-200", dot: "bg-sky-500" },
 { key: "tautliner", label: "Tautliner", color: "bg-slate-100 text-slate-700  border-slate-200", dot: "bg-slate-500" },
 { key: "petroleum_tanker", label: "Petroleum Tanker", color: "bg-red-100  text-red-700 border-red-200", dot: "bg-red-500" },
 { key: "gas_tanker", label: "Gas Tanker (LPG)", color: "bg-orange-100  text-orange-700 border-orange-200", dot: "bg-orange-500" },
 { key: "food_grade_tanker", label: "Food-Grade Tanker", color: 
"bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
 { key: "cement_bulk", label: "Cement / Bulk Powder", color: "bg-stone-100  text-stone-700 border-stone-200", dot: "bg-stone-500" },
 { key: "low_bed", label: "Low-Bed / Abnormal", color: "bg-violet-100  text-violet-700 border-violet-200", dot: "bg-violet-500" },
 { key: "flatbed", label: "Flatbed", color: "bg-cyan-100 text-cyan-700  border-cyan-200", dot: "bg-cyan-500" }
];

export const fleetTypeMeta = (key) => FLEET_TYPES.find((f) => f.key === key) 
|| { label: key, color: "bg-muted text-muted-foreground border-border", dot: 
"bg-muted-foreground" };

export const COMBINATION_TYPES = [
 {
 key: "rigid",
 label: "Rigid Truck (No Trailer)",
 has_trailer: false,
 axles: [
 { id: "steer", label: "Steer Axle", positions: ["Left", "Right"] },
 { id: "drive", label: "Drive Axle", positions: ["Outer Left", "Inner Left", 
"Inner Right", "Outer Right"] }
 ]
 },
 {
 key: "semi",
 label: "Horse & Semi-Trailer",
 has_trailer: true,
 axles: [
 { id: "steer", label: "Truck Steer", positions: ["Left", "Right"] },
 { id: "drive", label: "Truck Drive", positions: ["Outer Left", "Inner Left", 
"Inner Right", "Outer Right"] },
 { id: "trailer_1", label: "Trailer Axle 1", positions: ["Left", "Right"] },
 { id: "trailer_2", label: "Trailer Axle 2", positions: ["Left", "Right"] },
 { id: "trailer_3", label: "Trailer Axle 3", positions: ["Left", "Right"] }
 ]
 },
 {
 key: "super_link",
 label: "Super-Link (Interlink)",
 has_trailer: true,
 axles: [
 { id: "steer", label: "Truck Steer", positions: ["Left", "Right"] },
 { id: "drive", label: "Truck Drive", positions: ["Outer Left", "Inner Left", 
"Inner Right", "Outer Right"] },
 { id: "link_1a", label: "Trailer 1 — Axle 1", positions: ["Left", "Right"] },
 { id: "link_1b", label: "Trailer 1 — Axle 2", positions: ["Left", "Right"] },
 { id: "link_2a", label: "Trailer 2 — Axle 1", positions: ["Left", "Right"] },
 { id: "link_2b", label: "Trailer 2 — Axle 2", positions: ["Left", "Right"] },
 { id: "link_2c", label: "Trailer 2 — Axle 3", positions: ["Left", "Right"] }
 ]
 },
 {
 key: "truck_drawbar",
 label: "Truck & Drawbar Trailer",
 has_trailer: true,
 axles: [
 { id: "steer", label: "Truck Steer", positions: ["Left", "Right"] },
 { id: "drive", label: "Truck Drive", positions: ["Outer Left", "Inner Left", 
"Inner Right", "Outer Right"] },
 { id: "trailer_1", label: "Trailer Axle 1", positions: ["Left", "Right"] },
 { id: "trailer_2", label: "Trailer Axle 2", positions: ["Left", "Right"] }
 ]
 }
];

export const combinationMeta = (key) => COMBINATION_TYPES.find((c) => c.key 
=== key) || COMBINATION_TYPES[1];

export const LOAD_PROCESS_STEPS = [
 { key: "enroute_to_loading", label: "Enroute to Loading Site" },
 { key: "arrived_at_loading", label: "Arrived at Loading Site" },
 { key: "queue_to_load", label: "On Queue to Load" },
 { key: "weighing_in_empty", label: "Weighing In (Empty)" },
 { key: "loading", label: "Loading" },
 { key: "weighing_out_loaded", label: "Weighing Out (Loaded)" },
 { key: "enroute_to_offloading", label: "Enroute to Offloading Site" },
 { key: "arrived_at_offloading", label: "Arrived at Offloading Site" },
 { key: "queue_to_offload", label: "On Queue to Offload" },
 { key: "weighing_in_loaded", label: "Weighing In (Loaded)" },
 { key: "offloading", label: "Offloading" },
 { key: "weighing_out_empty", label: "Weighing Out (Empty)" },
 { key: "load_completed", label: "Load Completed" }
];

export const LOAD_STATUSES = [
 { key: "accepting_load", label: "Accepting Load", color: "bg-slate-100  text-slate-700" },
 { key: "enroute_to_loading", label: "Enroute to Loading", color: 
"bg-slate-100 text-slate-700" },
 { key: "arrived_at_loading", label: "Arrived at Loading", color: "bg-blue-100  text-blue-700" },
 { key: "queue_to_load", label: "Queue to Load", color: "bg-amber-100  text-amber-700" },
 { key: "weighing_in_empty", label: "Weighing In (Empty)", color: "bg-cyan-100  text-cyan-700" },
 { key: "loading", label: "Loading", color: "bg-indigo-100 text-indigo-700" },
 { key: "weighing_out_loaded", label: "Weighing Out (Loaded)", color: 
"bg-cyan-100 text-cyan-700" },
 { key: "enroute_to_offloading", label: "Enroute to Offloading", color: 
"bg-slate-100 text-slate-700" },
 { key: "arrived_at_offloading", label: "Arrived at Offloading", color: 
"bg-blue-100 text-blue-700" },
 { key: "queue_to_offload", label: "Queue to Offload", color: "bg-amber-100  text-amber-700" },
 { key: "weighing_in_loaded", label: "Weighing In (Loaded)", color: 
"bg-cyan-100 text-cyan-700" },
 { key: "offloading", label: "Offloading", color: "bg-purple-100  text-purple-700" },
 { key: "weighing_out_empty", label: "Weighing Out (Empty)", color: 
"bg-cyan-100 text-cyan-700" },
 { key: "load_completed", label: "Load Completed", color: "bg-emerald-200  text-emerald-800" },
 { key: "loaded", label: "Loaded", color: "bg-blue-100 text-blue-700" },
 { key: "in_transit", label: "In Transit", color: "bg-indigo-100  text-indigo-700" },
 { key: "at_border", label: "At Border", color: "bg-amber-100 text-amber-700" 
},
 { key: "customs_hold", label: "Customs Hold", color: "bg-orange-100  text-orange-700" },
 { key: "cleared", label: "Cleared", color: "bg-teal-100 text-teal-700" },
 { key: "at_destination", label: "At Destination", color: "bg-cyan-100  text-cyan-700" },
 { key: "unloading", label: "Unloading", color: "bg-purple-100  text-purple-700" },
 { key: "delivered", label: "Delivered", color: "bg-emerald-100  text-emerald-700" },
 { key: "pod_captured", label: "POD Captured", color: "bg-green-100  text-green-700" },
 { key: "completed", label: "Completed", color: "bg-green-200 text-green-800" 
},
 { key: "delayed", label: "Delayed", color: "bg-rose-100 text-rose-700" },
 { key: "breakdown", label: "Breakdown", color: "bg-red-100 text-red-700" },
 { key: "cancelled", label: "Cancelled", color: "bg-zinc-200 text-zinc-600" }
];

export const loadStatusMeta = (key) => LOAD_STATUSES.find((s) => s.key === 
key) || { label: key, color: "bg-muted text-muted-foreground" };

export const TRAILER_TYPES = [
 { key: "flatbed", label: "Flatbed", color: "bg-cyan-100 text-cyan-700  border-cyan-200" },
 { key: "tautliner", label: "Tautliner", color: "bg-slate-100 text-slate-700  border-slate-200" },
 { key: "tipper", label: "Tipper", color: "bg-amber-100 text-amber-700  border-amber-200" },
 { key: "tanker", label: "Tanker", color: "bg-red-100 text-red-700  border-red-200" },
 { key: "lowbed", label: "Low-Bed", color: "bg-violet-100 text-violet-700  border-violet-200" },
 { key: "skeletal", label: "Skeletal", color: "bg-stone-100 text-stone-700  border-stone-200" },
 { key: "reefer", label: "Refrigerated", color: "bg-sky-100 text-sky-700  border-sky-200" },
 { key: "drop_side", label: "Drop Side", color: "bg-teal-100 text-teal-700  border-teal-200" },
 { key: "other", label: "Other", color: "bg-muted text-muted-foreground  border-border" }
];

export const trailerTypeMeta = (key) => TRAILER_TYPES.find((t) => t.key === 
key) || { label: key, color: "bg-muted text-muted-foreground border-border" };

export const DIFF_TYPES = [
 { key: "single_diff", label: "Single Diff" },
 { key: "double_diff", label: "Double Diff" }
];

export const diffTypeMeta = (key) => DIFF_TYPES.find((d) => d.key === key) || 
{ label: key };

export const TYRE_TYPES = [
 { key: "super_single", label: "Super Single" },
 { key: "double_tyres", label: "Double Tyres" }
];

export const tyreTypeMeta = (key) => TYRE_TYPES.find((t) => t.key === key) || 
{ label: key };

export const expiryStatus = (dateStr) => {
 if (!dateStr) return { label: "Not set", color: "bg-muted  text-muted-foreground", days: null };
 const expiry = new Date(dateStr);
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
 if (days < 0) return { label: "Expired", color: "bg-rose-100 text-rose-700", 
days };
 if (days <= 30) return { label: `${days}d left`, color: "bg-amber-100  text-amber-700", days };
 return { label: "Valid", color: "bg-emerald-100 text-emerald-700", days };
};

export const CROSS_BORDER_STEPS = [
 { key: "at_border", label: "At Border Post" },
 { key: "cleared", label: "Cleared Customs" }
];

// Sequential load process — cross-border loads include border/customs steps after weighing out loaded
export const getLoadSequence = (crossBorder) => {
 const base = LOAD_PROCESS_STEPS;
 if (!crossBorder) return base;
 const idx = base.findIndex((s) => s.key === "weighing_out_loaded") + 1;
 return [...base.slice(0, idx), ...CROSS_BORDER_STEPS, ...base.slice(idx)];
};

// Maps legacy/simplified statuses onto the sequential process
export const LEGACY_STATUS_MAP = {
 loaded: "enroute_to_offloading",
 in_transit: "enroute_to_offloading",
 at_border: "at_border",
 customs_hold: "at_border",
 at_destination: "arrived_at_offloading",
 unloading: "offloading",
 delivered: "load_completed",
 pod_captured: "load_completed",
 completed: "load_completed"
};
