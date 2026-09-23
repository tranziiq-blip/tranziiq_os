import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Session-scoped cache so repeated hook mounts (route switches, StrictMode
// double-invoke) don't each fire a Driver.filter request and trip the
// platform rate limit. A single in-flight promise dedupes concurrent mounts.
let cachedDrivers = null;
let inflight = null;

async function loadDrivers() {
 if (cachedDrivers) return cachedDrivers;
 if (!inflight) {
 inflight = base44.entities.Driver
 .filter({ status: "active" })
 .then((list) => {
 cachedDrivers = list;
 return list;
 })
 .finally(() => {
 inflight = null;
 });
 }
 return inflight;
}

export function useCurrentDriver() {
 const [drivers, setDrivers] = useState(cachedDrivers || []);
 const [loading, setLoading] = useState(!cachedDrivers);
 const [driverId, setDriverId] = useState(() => 
localStorage.getItem("tranziiq_driver_id") || "");

 useEffect(() => {
 let active = true;
 (async () => {
 try {
 const list = await loadDrivers();
 if (!active) return;
 setDrivers(list);
 if (!driverId && list.length) {
 setDriverId(list[0].id);
 localStorage.setItem("tranziiq_driver_id", list[0].id);
 }
 } finally {
 if (active) setLoading(false);
 }
 })();
 return () => {
 active = false;
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const changeDriver = (id) => {
 setDriverId(id);
 localStorage.setItem("tranziiq_driver_id", id);
 };

 const driver = drivers.find((d) => d.id === driverId);
 return { driver, drivers, driverId, setDriverId: changeDriver, loading };
}
