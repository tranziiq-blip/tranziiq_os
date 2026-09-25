// The signed-in person's OWN driver record — nothing else.
//
// Previously this loaded every active driver and let the device pick one
// (remembered in localStorage), so anyone could open another driver's
// profile. It now comes only from the login: profiles.linked_driver_id, or
// the driver record on the person's own employee file. There is no list and
// no way to switch.
import { useShiftSession } from "@/lib/shiftSession";

export function useCurrentDriver() {
  const { driver, phase } = useShiftSession();
  return {
    driver: driver || null,
    driverId: driver?.id || "",
    loading: phase === "loading",
  };
}
