export const TRUCK_SERVICE_SECTIONS = [
  {
    id: "engine",
    title: "Engine",
    items: [
      { id: "eng_oil_level", label: "Engine oil level & condition" },
      { id: "eng_oil_filter", label: "Oil filter replaced" },
      { id: "eng_coolant", label: "Coolant level & concentration" },
      { id: "eng_coolant_hoses", label: "Coolant hoses condition" },
      { id: "eng_belts", label: "Drive belts condition & tension" },
      { id: "eng_air_filter", label: "Air filter element" },
      { id: "eng_fuel_filter", label: "Fuel filter(s) replaced" },
      { id: "eng_mounts", label: "Engine mounts" },
      { id: "eng_turbo", label: "Turbocharger inspection" },
      { id: "eng_intercooler", label: "Intercooler hoses & clamps" },
    ],
  },
  {
    id: "transmission",
    title: "Transmission & Driveline",
    items: [
      { id: "trans_fluid", label: "Transmission fluid level" },
      { id: "trans_gears", label: "Gear selection operation" },
      { id: "trans_clutch", label: "Clutch operation & free play" },
      { id: "trans_uj", label: "Universal joints" },
      { id: "trans_prop", label: "Prop shaft condition" },
      { id: "trans_diff_oil", label: "Diff oil level" },
      { id: "trans_bearings", label: "Wheel bearings" },
    ],
  },
  {
    id: "brakes",
    title: "Brakes",
    items: [
      { id: "br_service", label: "Service brake operation" },
      { id: "br_park", label: "Park brake operation" },
      { id: "br_pads", label: "Brake pad thickness" },
      { id: "br_discs", label: "Brake disc/drum condition" },
      { id: "br_air_pressure", label: "Air pressure build-up" },
      { id: "br_air_leak", label: "Air leak test" },
      { id: "br_abs", label: "ABS functionality" },
      { id: "br_chambers", label: "Brake chambers" },
      { id: "br_slack", label: "Slack adjusters" },
      { id: "br_compressor", label: "Compressor operation" },
    ],
  },
  {
    id: "steering",
    title: "Steering & Suspension",
    items: [
      { id: "st_ps_fluid", label: "Power steering fluid" },
      { id: "st_box", label: "Steering box play" },
      { id: "st_tie_rod", label: "Tie rod ends" },
      { id: "st_ball_joints", label: "Ball joints" },
      { id: "st_shocks", label: "Shock absorbers" },
      { id: "st_air_bags", label: "Air suspension bags" },
      { id: "st_springs", label: "Leaf springs" },
      { id: "st_bushings", label: "Suspension bushings" },
      { id: "st_alignment", label: "Wheel alignment check" },
    ],
  },
  {
    id: "electrical",
    title: "Electrical",
    items: [
      { id: "el_battery", label: "Battery condition & terminals" },
      { id: "el_alternator", label: "Alternator charging" },
      { id: "el_starter", label: "Starter motor" },
      { id: "el_wiring", label: "Wiring harness inspection" },
      { id: "el_headlights", label: "Headlights (high/low beam)" },
      { id: "el_indicators", label: "Indicators & hazard lights" },
      { id: "el_tail", label: "Tail lights & brake lights" },
      { id: "el_reverse", label: "Reverse light" },
      { id: "el_dash", label: "Dashboard warning lights" },
      { id: "el_horn", label: "Horn" },
    ],
  },
  {
    id: "cooling",
    title: "Cooling System",
    items: [
      { id: "co_radiator", label: "Radiator condition" },
      { id: "co_water_pump", label: "Water pump" },
      { id: "co_thermostat", label: "Thermostat" },
      { id: "co_fan", label: "Fan & fan clutch" },
      { id: "co_ph", label: "Coolant pH" },
    ],
  },
  {
    id: "fuel",
    title: "Fuel System",
    items: [
      { id: "fu_lines", label: "Fuel lines & connections" },
      { id: "fu_filter", label: "Fuel filter / water separator" },
      { id: "fu_injectors", label: "Injector leak-off" },
      { id: "fu_tank_cap", label: "Fuel tank cap & breather" },
    ],
  },
  {
    id: "exhaust",
    title: "Exhaust",
    items: [
      { id: "ex_system", label: "Exhaust system leaks" },
      { id: "ex_dpf", label: "DPF condition" },
      { id: "ex_smoke", label: "Smoke emission check" },
    ],
  },
  {
    id: "cab",
    title: "Cab & Body",
    items: [
      { id: "ca_seatbelts", label: "Seatbelts" },
      { id: "ca_wipers", label: "Wipers & washers" },
      { id: "ca_mirrors", label: "Mirrors" },
      { id: "ca_doors", label: "Door operation & locks" },
      { id: "ca_cab_mounts", label: "Cab mounts" },
      { id: "ca_chassis", label: "Chassis frame inspection" },
    ],
  },
  {
    id: "tyres",
    title: "Tyres & Wheels",
    items: [
      { id: "ty_pressure", label: "Tyre pressure (all positions)" },
      { id: "ty_tread", label: "Tread depth" },
      { id: "ty_damage", label: "Tyre damage / cuts" },
      { id: "ty_nuts", label: "Wheel nut torque" },
    ],
  },
];

export const TRAILER_SERVICE_SECTIONS = [
  {
    id: "chassis",
    title: "Chassis",
    items: [
      { id: "ch_main_frame", label: "Main chassis frame" },
      { id: "ch_cross_members", label: "Cross members" },
      { id: "ch_welds", label: "Welds & cracks" },
      { id: "ch_rivets", label: "Chassis rivets / bolts" },
    ],
  },
  {
    id: "axles",
    title: "Axles & Hubs",
    items: [
      { id: "ax_alignment", label: "Axle alignment" },
      { id: "ax_bearings", label: "Wheel bearings" },
      { id: "ax_seals", label: "Oil seals" },
      { id: "ax_hub_oil", label: "Hub oil level" },
    ],
  },
  {
    id: "suspension",
    title: "Suspension",
    items: [
      { id: "su_air_bags", label: "Air suspension bags" },
      { id: "su_springs", label: "Mechanical springs" },
      { id: "su_shocks", label: "Shock absorbers" },
      { id: "su_ride_height", label: "Ride height valve" },
      { id: "su_bushings", label: "Suspension bushings" },
    ],
  },
  {
    id: "brakes",
    title: "Brakes",
    items: [
      { id: "br_chambers", label: "Brake chambers" },
      { id: "br_slack", label: "Slack adjusters" },
      { id: "br_drums", label: "Brake drums / discs" },
      { id: "br_pads", label: "Brake pads" },
      { id: "br_abs_sensors", label: "ABS sensors" },
      { id: "br_air_tanks", label: "Air tanks & drain valves" },
    ],
  },
  {
    id: "tyres",
    title: "Tyres & Wheels",
    items: [
      { id: "ty_pressure", label: "Tyre pressure (all positions)" },
      { id: "ty_tread", label: "Tread depth" },
      { id: "ty_damage", label: "Tyre damage" },
      { id: "ty_nuts", label: "Wheel nut torque" },
    ],
  },
  {
    id: "lights",
    title: "Lights & Electrical",
    items: [
      { id: "li_tail", label: "Tail lights" },
      { id: "li_brake", label: "Brake lights" },
      { id: "li_indicator", label: "Indicator lights" },
      { id: "li_plate", label: "Number plate light" },
      { id: "li_reverse", label: "Reverse light" },
      { id: "li_reflectors", label: "Reflectors" },
      { id: "li_wiring", label: "Wiring & connectors" },
    ],
  },
  {
    id: "coupling",
    title: "Coupling",
    items: [
      { id: "co_king_pin", label: "King pin / fifth wheel" },
      { id: "co_landing_legs", label: "Landing legs operation" },
      { id: "co_air_conn", label: "Air connections (glad hands)" },
      { id: "co_electrical", label: "Electrical connection" },
      { id: "co_safety", label: "Safety chains / cables" },
    ],
  },
  {
    id: "body",
    title: "Body",
    items: [
      { id: "bo_floor", label: "Floor / deck condition" },
      { id: "bo_sides", label: "Side panels" },
      { id: "bo_doors", label: "Rear doors / curtains" },
      { id: "bo_mudguards", label: "Mudguards" },
      { id: "bo_bumper", label: "Rear bumper / underrun" },
      { id: "bo_securing", label: "Load securing points" },
    ],
  },
];

// Extensive technician inspection checklist — deeper than the driver checklist.
// Used for inspection-type job cards on trucks.
export const TECHNICIAN_INSPECTION_SECTIONS = [
  {
    id: "ti_docs",
    title: "Documentation & Diagnostics",
    items: [
      {
        id: "ti_odometer",
        label: "Odometer recorded & checked against service  schedule",
      },
      {
        id: "ti_service_history",
        label: "Service history & previous job cards  verified",
      },
      {
        id: "ti_fault_codes",
        label: "Full diagnostic scan — fault codes recorded &  cleared",
      },
      {
        id: "ti_dash_lights",
        label: "Dashboard warning lights — functional & no  active faults",
      },
      { id: "ti_oil_sample", label: "Engine oil sample drawn for analysis" },
      {
        id: "ti_campaigns",
        label: "Outstanding OEM recalls / campaigns checked",
      },
    ],
  },
  {
    id: "ti_engine",
    title: "Engine & Engine Bay",
    items: [
      { id: "ti_eng_oil", label: "Engine oil level, condition & leaks" },
      { id: "ti_eng_oil_filter", label: "Oil filter & housing" },
      { id: "ti_eng_coolant", label: "Coolant level & concentration (tested)" },
      { id: "ti_eng_hoses", label: "All coolant hoses & clamps" },
      { id: "ti_eng_belts", label: "Drive belts condition & tension" },
      {
        id: "ti_eng_air_filter",
        label: "Air filter element & restriction  indicator",
      },
      {
        id: "ti_eng_fuel_filter",
        label: "Fuel filters / water separator drained",
      },
      {
        id: "ti_eng_turbo",
        label: "Turbo — shaft play, boost pipes & oil feed  lines",
      },
      { id: "ti_eng_intercooler", label: "Intercooler / CAC hoses & clamps" },
      { id: "ti_eng_mounts", label: "Engine mounts & brackets" },
      { id: "ti_eng_breather", label: "Crankcase breather system" },
      { id: "ti_eng_valves", label: "Valve clearances (where due)" },
    ],
  },
  {
    id: "ti_cooling",
    title: "Cooling System",
    items: [
      { id: "ti_cool_radiator", label: "Radiator core — fin damage & debris" },
      { id: "ti_cool_cap", label: "Radiator cap pressure test" },
      { id: "ti_cool_pump", label: "Water pump bearing & weep hole" },
      { id: "ti_cool_thermostat", label: "Thermostat operation" },
      { id: "ti_cool_fan", label: "Fan clutch / visco operation" },
      { id: "ti_cool_ph", label: "Coolant pH & nitrite level" },
    ],
  },
  {
    id: "ti_driveline",
    title: "Clutch, Gearbox & Driveline",
    items: [
      { id: "ti_dl_clutch", label: "Clutch free play & pedal travel" },
      { id: "ti_dl_gearbox", label: "Gearbox — all ranges & splitter tested" },
      { id: "ti_dl_gbox_oil", label: "Gearbox oil level & leaks" },
      { id: "ti_dl_prop", label: "Prop shafts — run-out & UJ play" },
      { id: "ti_dl_center_bearing", label: "Centre bearing condition" },
      { id: "ti_dl_diff_oil", label: "Diff oil level, leaks & breather" },
      { id: "ti_dl_grease", label: "Driveline grease points serviced" },
    ],
  },
  {
    id: "ti_brakes",
    title: "Brakes — All Axles",
    items: [
      { id: "ti_br_pad_front", label: "Front pad thickness measured (mm)" },
      {
        id: "ti_br_pad_rear",
        label: "Rear pad / shoe thickness measured (mm)",
      },
      { id: "ti_br_drums", label: "Drums / discs — scoring & heat cracks" },
      { id: "ti_br_chamber", label: "Brake chamber stroke per axle" },
      { id: "ti_br_slack", label: "Slack adjusters — free travel" },
      { id: "ti_br_air_build", label: "Air build-up time from empty (spec)" },
      {
        id: "ti_br_leak_test",
        label: "Leak-down test — service & park applied",
      },
      { id: "ti_br_drain", label: "Air tanks drained — water / oil content" },
      { id: "ti_br_valves", label: "Foot, hand & relay valve operation" },
      { id: "ti_br_abs", label: "ABS / EBS diagnostic & sensor check" },
      {
        id: "ti_br_compressor",
        label: "Compressor & governor cut-out pressure",
      },
      { id: "ti_br_park", label: "Park brake holding test" },
    ],
  },
  {
    id: "ti_air",
    title: "Air System",
    items: [
      { id: "ti_air_dryer", label: "Air dryer cartridge & purge valve" },
      {
        id: "ti_air_gladhand",
        label: "Glad hands & coiled hoses — wear & seals",
      },
      { id: "ti_air_coils", label: "Air coil leaks & routing" },
      { id: "ti_air_ppv", label: "Pressure protection valves" },
    ],
  },
  {
    id: "ti_steering",
    title: "Steering & Suspension",
    items: [
      { id: "ti_st_box", label: "Steering box — free play & mounts" },
      { id: "ti_st_tie", label: "Tie rod ends & drag link" },
      { id: "ti_st_ball", label: "Ball joints / king pins" },
      { id: "ti_st_bearings", label: "Wheel bearings — play & end-float" },
      { id: "ti_st_shocks", label: "Shock absorbers — leak & bounce test" },
      { id: "ti_st_bags", label: "Air bags — cracks, rub marks, inflation" },
      { id: "ti_st_ride_height", label: "Ride height & valve linkage" },
      { id: "ti_st_springs", label: "Leaf springs, U-bolts & hangers" },
      { id: "ti_st_bushings", label: "Suspension bushings & torque arms" },
      { id: "ti_st_alignment", label: "Steering alignment / pull check" },
    ],
  },
  {
    id: "ti_electrical",
    title: "Electrical",
    items: [
      {
        id: "ti_el_battery",
        label: "Batteries — load test, hold-down & terminals",
      },
      {
        id: "ti_el_alternator",
        label: "Alternator output voltage (13.8–14.4V)",
      },
      { id: "ti_el_starter", label: "Starter motor operation" },
      { id: "ti_el_wiring", label: "Wiring harness — chafe & connectors" },
      { id: "ti_el_lights", label: "All exterior lights & reflectors" },
      { id: "ti_el_horn", label: "Horn" },
      { id: "ti_el_wipers", label: "Wipers & washers" },
      { id: "ti_el_tacho", label: "Tachograph calibration due date" },
      { id: "ti_el_fuses", label: "Fuse box & relays" },
    ],
  },
  {
    id: "ti_cab",
    title: "Cab, Chassis & Coupling",
    items: [
      { id: "ti_cab_seatbelts", label: "Seatbelts — retract & buckle" },
      { id: "ti_cab_mounts", label: "Cab mounts & dampers" },
      { id: "ti_cab_doors", label: "Doors, locks & seals" },
      { id: "ti_cab_fire", label: "Fire extinguisher — gauge & seal" },
      { id: "ti_cab_firstaid", label: "First aid kit stocked" },
      { id: "ti_chassis_cracks", label: "Chassis rails — cracks & corrosion" },
      { id: "ti_chassis_cross", label: "Cross members & rivets" },
      { id: "ti_coupling_fifth", label: "Fifth wheel — jaws, plate & locking" },
      { id: "ti_coupling_grease", label: "Fifth wheel & slider greased" },
      { id: "ti_coupling_kingpin", label: "King pin wear gauge" },
      { id: "ti_coupling_legs", label: "Landing legs & crank" },
    ],
  },
  {
    id: "tyres",
    title: "Tyres & Wheels (per position)",
    items: [
      { id: "ty_pressure", label: "Tyre pressure — all positions (spec)" },
      { id: "ty_tread", label: "Tread depth measured — all positions (mm)" },
      { id: "ty_damage", label: "Tyre damage — cuts, bulges, sidewalls" },
      {
        id: "ti_ty_mismatch",
        label: "Twin matching & mismatch across positions",
      },
      {
        id: "ti_ty_nuts",
        label: "Wheel nut torque to spec & indicators aligned",
      },
      { id: "ti_ty_rims", label: "Rims — cracks, bent flanges, stud holes" },
      { id: "ti_ty_hub", label: "Hub oil level & seals" },
      { id: "ti_ty_spare", label: "Spare wheel / carrier condition" },
    ],
  },
  {
    id: "ti_road",
    title: "Road Test",
    items: [
      { id: "ti_road_start", label: "Cold start & idle quality" },
      { id: "ti_road_accel", label: "Acceleration & turbo performance" },
      { id: "ti_road_braking", label: "Braking performance — pull & fade" },
      { id: "ti_road_vibration", label: "Vibration / wheel balance" },
      { id: "ti_road_noise", label: "Abnormal noises — gearbox, diff, wheels" },
      { id: "ti_road_speed", label: "Speed limiter set at 100 km/h" },
      { id: "ti_road_smoke", label: "Exhaust smoke colour under acceleration" },
    ],
  },
];

const AGGREGATE_TYRE_IDS = ["ty_pressure", "ty_tread", "ty_damage"];

// Builds per-position tyre items when the asset's tyre_positions are known
const withTyrePositions = (sections, tyrePositions) => {
  if (!tyrePositions || tyrePositions.length === 0) return sections;
  return sections.map((s) =>
    s.id !== "tyres"
      ? s
      : {
          ...s,
          items: [
            ...s.items.filter((it) => !AGGREGATE_TYRE_IDS.includes(it.id)),
            ...tyrePositions.map((p, i) => ({
              id: `ty_pos_${i}`,
              label: `Tyre — ${p}: 
pressure, tread & damage`,
              isTyre: true,
            })),
          ],
        },
  );
};

export const getEngineeringChecklist = (assetType, jobType, tyrePositions) => {
  const base =
    assetType === "trailer"
      ? TRAILER_SERVICE_SECTIONS
      : jobType === "inspection"
        ? TECHNICIAN_INSPECTION_SECTIONS
        : TRUCK_SERVICE_SECTIONS;
  return withTyrePositions(base, tyrePositions);
};

export const JOB_CARD_STATUS = {
  open: { label: "Open", color: "bg-rose-100 text-rose-700" },
  allocated: { label: "Allocated", color: "bg-amber-100 text-amber-700" },
  accepted: { label: "Accepted", color: "bg-sky-100 text-sky-700" },
  en_route: { label: "En Route", color: "bg-indigo-100 text-indigo-700" },
  arrived: { label: "Arrived", color: "bg-cyan-100 text-cyan-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  parts_ordered: {
    label: "Parts Ordered",
    color: "bg-violet-100  text-violet-700",
  },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
};

export const PRIORITY_COLORS = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export const FAILURE_CATEGORIES = [
  { key: "engine", label: "Engine" },
  { key: "transmission", label: "Transmission" },
  { key: "brakes", label: "Brakes" },
  { key: "suspension", label: "Suspension" },
  { key: "electrical", label: "Electrical" },
  { key: "tyres", label: "Tyres" },
  { key: "trailer", label: "Trailer" },
  { key: "cooling", label: "Cooling" },
  { key: "fuel_system", label: "Fuel System" },
  { key: "other", label: "Other" },
];
