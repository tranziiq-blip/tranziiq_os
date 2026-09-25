// The signed-in person's own identity and shift for this session.
//
// Filled by <ClockInGate /> (which wraps every signed-in page). Everything
// that needs "who am I" — the driver app, the sign-out button, the shift
// timer — reads it from here. It only ever holds the signed-in person's own
// employee / driver record: there is no way to pick or switch to another
// person's profile.
import { createContext, useContext } from "react";

export const ShiftSessionContext = createContext({
  phase: "loading",
  employee: null,
  driver: null,
  shift: null,
  template: null,
  exempt: true,
  refresh: async () => {},
  signOut: async () => {},
});

export const useShiftSession = () => useContext(ShiftSessionContext);

// Local calendar date (SA time), not UTC, so early-morning shifts get the
// right date.
export function localDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
