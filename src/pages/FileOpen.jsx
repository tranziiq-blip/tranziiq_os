import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/api/base44Client";

// Opens a private file in a new tab or from a shared link. The database
// only signs files inside the user's own company folder.
export default function FileOpen() {
  const location = useLocation();
  const [message, setMessage] = useState("Opening file…");

  useEffect(() => {
    (async () => {
      const path = decodeURIComponent(location.pathname.replace(/^\/files\//, ""));
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.replace(
          `/login?returnTo=${encodeURIComponent(location.pathname)}`,
        );
        return;
      }
      const { data, error } = await supabase.storage
        .from("uploads")
        .createSignedUrl(path, 300);
      if (error || !data?.signedUrl) {
        setMessage(
          "This file is not available. It may have been removed, or it belongs to another company.",
        );
        return;
      }
      window.location.replace(data.signedUrl);
    })();
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
