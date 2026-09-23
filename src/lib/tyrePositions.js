import { combinationMeta } from "@/lib/fleetTypes";

const DUAL_PATTERN = [
  "Outer Left",
  "Inner Left",
  "Inner Right",
  "Outer  Right",
];
const SINGLE_PATTERN = ["Left", "Right"];

// Generate position names for a horse: first 2 = steer, remainder grouped per drive axle
export function generateTruckPositionNames(count) {
  const names = [];
  for (let i = 0; i < Math.min(count, 2); i++)
    names.push(`Steer Axle — 
${SINGLE_PATTERN[i]}`);
  let remaining = count - names.length;
  let axle = 1;
  while (remaining > 0 && axle <= 10) {
    const pattern =
      remaining >= 4
        ? DUAL_PATTERN
        : SINGLE_PATTERN.slice(0, Math.min(remaining, 2));
    pattern.forEach((side) => names.push(`Drive Axle ${axle} — ${side}`));
    remaining -= pattern.length;
    axle++;
  }
  return names;
}

// Generate position names for a trailer, grouped per axle by tyre type
export function generateTrailerPositionNames(count, tyreType) {
  const pattern = tyreType === "super_single" ? SINGLE_PATTERN : DUAL_PATTERN;
  const names = [];
  let axle = 1;
  let remaining = count;
  while (remaining > 0 && axle <= 10) {
    const use = pattern.slice(0, Math.min(remaining, pattern.length));
    use.forEach((side) => names.push(`Axle ${axle} — ${side}`));
    remaining -= use.length;
    axle++;
  }
  return names;
}

// Default positions for a horse, derived from its combination type
export function defaultTruckTyrePositions(combinationType) {
  const combo = combinationMeta(combinationType);
  const truckAxles = combo.axles.filter(
    (a) => !a.id.startsWith("trailer") && !a.id.startsWith("link"),
  );
  return truckAxles.flatMap((a) => a.positions.map((p) => `${a.label} — ${p}`));
}

// Default positions for a trailer, derived from axle count and tyre type
export function defaultTrailerTyrePositions(axleCount, tyreType) {
  const pattern = tyreType === "super_single" ? SINGLE_PATTERN : DUAL_PATTERN;
  const names = [];
  for (let ax = 1; ax <= (axleCount || 2); ax++)
    pattern.forEach((p) => names.push(`Axle ${ax} — ${p}`));
  return names;
}

// Combined horse → trailer position list for a combination
export function getCombinedPositions(truck, trailer) {
  const horse = truck?.tyre_positions?.length
    ? truck.tyre_positions
    : defaultTruckTyrePositions(truck?.combination_type);
  const trailerPos = trailer
    ? trailer.tyre_positions?.length
      ? trailer.tyre_positions
      : defaultTrailerTyrePositions(trailer.number_of_axles, trailer.tyre_type)
    : [];
  return [
    ...horse.map((p) => `Horse — ${p}`),
    ...trailerPos.map((p) => `Trailer — ${p}`),
  ];
}

// Per-position tyre check items for inspection checklists (horse → trailer order)
export function getAssetTyreCheckItems(truck, trailer) {
  return getCombinedPositions(truck, trailer).map((p, i) => ({
    id: `tyre_pos_${i}`,
    label: p,
    isTyre: true,
  }));
}
