// TranziIQ secure-file service worker.
// Files live in a PRIVATE Supabase bucket. Records store links like
// /files/<company-id>/<file>. This worker fetches them with the signed-in
// user's token, so <img> tags and download links keep working, while the
// database only releases files that belong to the user's own company.

const AUTH_CACHE = "tranziiq-auth";
const AUTH_KEY = "/__tranziiq_auth__";
const LEGACY = /\/storage\/v1\/object\/(?:public|authenticated)\/uploads\/(.+)$/;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

async function readAuth() {
  try {
    const cache = await caches.open(AUTH_CACHE);
    const res = await cache.match(AUTH_KEY);
    return res ? await res.json() : null;
  } catch {
    return null;
  }
}

function filePath(request) {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/files/")) {
    return url.pathname.slice("/files/".length);
  }
  // Links saved before files became private
  if (url.hostname.endsWith(".supabase.co")) {
    const m = url.pathname.match(LEGACY);
    if (m) return m[1];
  }
  return null;
}

async function serve(request, path) {
  const auth = await readAuth();
  const isNavigation = request.mode === "navigate";
  if (auth && auth.token && auth.url) {
    try {
      const res = await fetch(`${auth.url}/storage/v1/object/authenticated/uploads/${path}`, {
        headers: { Authorization: `Bearer ${auth.token}`, apikey: auth.anon || "" },
        cache: "no-store",
      });
      if (res.ok) {
        const headers = new Headers(res.headers);
        headers.set("Cache-Control", "private, max-age=300");
        return new Response(res.body, { status: 200, headers });
      }
      if (!isNavigation) return res;
    } catch (e) {
      if (!isNavigation) return new Response("File unavailable", { status: 503 });
    }
  }
  // Opening a file directly (new tab) without a fresh token: let the app
  // sign the user in and open the file itself (/files/* route).
  if (isNavigation) {
    const url = new URL(request.url);
    if (url.origin === self.location.origin) return fetch(request);
    return Response.redirect(`${self.location.origin}/files/${path}`, 302);
  }
  return new Response("Sign in to view this file", { status: 401 });
}

self.addEventListener("fetch", (event) => {
  const path = filePath(event.request);
  if (path) event.respondWith(serve(event.request, path));
});
