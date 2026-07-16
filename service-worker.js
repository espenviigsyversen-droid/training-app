const CACHE_NAME = "treningsapp-v159e";
const FIREBASE_MODULES = [
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js"
];
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./ai-coach-client.js",
  "./ai-coach-ui.js",
  "./domain-core.js",
  "./domain-coach.js",
  "./domain-goals.js",
  "./domain-coach-rules.js",
  "./manifest.json",
  "./Treningsfilosofi/coach-rammeverk.md",
  "./data/coach-rules.json",
  "./Icon1.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  ...FIREBASE_MODULES
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME && key.startsWith("treningsapp-")).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isCoachRules = url.origin === self.location.origin &&
    url.pathname.endsWith("/data/coach-rules.json");
  const isAppFile = url.origin === self.location.origin && (
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/app.js") ||
    url.pathname.endsWith("/ai-coach-client.js") ||
    url.pathname.endsWith("/ai-coach-ui.js") ||
    url.pathname.endsWith("/domain-core.js") ||
    url.pathname.endsWith("/domain-coach.js") ||
    url.pathname.endsWith("/domain-goals.js") ||
    url.pathname.endsWith("/domain-coach-rules.js") ||
    url.pathname.endsWith("/styles.css") ||
    url.pathname.endsWith("/manifest.json") ||
    url.pathname.endsWith("/service-worker.js")
  );
  const isFirebaseModule = url.origin === "https://www.gstatic.com" &&
    url.pathname.startsWith("/firebasejs/10.12.2/");

  if (isCoachRules) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error(`Coach rules request failed: ${response.status}`);
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) =>
          cached || new Response("", { status: 503, statusText: "Coach rules unavailable" })
        ))
    );
    return;
  }

  if (isAppFile) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  if (isFirebaseModule) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).catch(() => caches.match("./index.html"))
    )
  );
});

