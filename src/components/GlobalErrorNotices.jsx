import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";

// App-wide safety net for save errors:
//  - trial/pilot ended: always explain why nothing saved
//  - any other unhandled database error: show it instead of failing silently
export default function GlobalErrorNotices() {
  const { toast } = useToast();
  const last = useRef({ text: "", at: 0 });

  useEffect(() => {
    const show = (title, description) => {
      const now = Date.now();
      if (last.current.text === description && now - last.current.at < 4000) return;
      last.current = { text: description, at: now };
      toast({ title, description, variant: "destructive" });
    };
    // Give the screen a moment to show its own message; only add ours if
    // the reason isn't already visible.
    const onBlocked = (e) =>
      setTimeout(() => {
        const shown = Array.from(document.querySelectorAll("li")).some((li) =>
          (li.textContent || "").includes(e.detail),
        );
        if (!shown) show("Not saved", e.detail);
      }, 500);
    const onUnhandled = (e) => {
      const err = e.reason;
      if (!err || err.handledGlobally) {
        if (err?.handledGlobally) e.preventDefault();
        return;
      }
      // Only database/API errors (they carry a code); leave other bugs alone
      if (typeof err === "object" && (err.code || err.details !== undefined)) {
        e.preventDefault();
        show("Could not save", err.message || "Something went wrong. Please try again.");
      }
    };
    window.addEventListener("tranziiq:write-blocked", onBlocked);
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      window.removeEventListener("tranziiq:write-blocked", onBlocked);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, [toast]);

  return null;
}
