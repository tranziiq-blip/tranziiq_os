// Private file access. Files are stored under /<company-id>/ in a private
// bucket; the service worker (public/file-sw.js) adds the user's token when
// the browser loads a /files/... link.

const AUTH_CACHE = "tranziiq-auth";
const AUTH_KEY = "/__tranziiq_auth__";

export async function syncFileAuth(session, url, anon) {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(AUTH_CACHE);
    if (session?.access_token) {
      await cache.put(
        AUTH_KEY,
        new Response(JSON.stringify({ token: session.access_token, url, anon }), {
          headers: { "Content-Type": "application/json" },
        }),
      );
    } else {
      await cache.delete(AUTH_KEY);
    }
  } catch {
    /* private browsing may block Cache Storage; /files route still works */
  }
}

export function registerFileWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/file-sw.js", { scope: "/" }).catch((e) =>
      console.warn("File worker not registered:", e),
    );
  });
}

// Safe file name for storage keys
export const safeFileName = (name = "file") =>
  String(name)
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(-120) || "file";
