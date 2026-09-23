// Cookie / local-storage consent record.
// "necessary" is always on: sign-in sessions and this consent record itself.
// "analytics" and "functional" are off until the visitor opts in — anything
// added later (e.g. Vercel Analytics) must check hasConsent("analytics") first.
import { useEffect, useState } from "react";
import { LEGAL } from "@/lib/siteConfig";

const KEY = "tranziq_cookie_consent";
const EVENT = "tranziq:cookie-consent";

export function readConsent() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // A newer cookie policy means asking again.
    if (parsed.version !== LEGAL.cookieVersion) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent({ functional, analytics }) {
  const record = {
    version: LEGAL.cookieVersion,
    necessary: true,
    functional: !!functional,
    analytics: !!analytics,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    /* storage blocked — banner will simply show again next visit */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: record }));
  return record;
}

export function hasConsent(category) {
  const c = readConsent();
  if (category === "necessary") return true;
  return !!c?.[category];
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(EVENT + ":open"));
}

export function useCookieConsent() {
  const [consent, setConsent] = useState(() => readConsent());
  const [settingsRequested, setSettingsRequested] = useState(false);
  useEffect(() => {
    const onChange = (e) => setConsent(e.detail);
    const onOpen = () => setSettingsRequested(true);
    window.addEventListener(EVENT, onChange);
    window.addEventListener(EVENT + ":open", onOpen);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener(EVENT + ":open", onOpen);
    };
  }, []);
  return {
    consent,
    settingsRequested,
    clearSettingsRequest: () => setSettingsRequested(false),
  };
}
