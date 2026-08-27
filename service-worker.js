const CACHE_NAME = "treningsapp-v176v";
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
  "./domain-fitness.js",
  "./domain-exercises.js",
  "./domain-heart-rate-zones.js",
  "./domain-volume-trends.js",
  "./domain-activity.js",
  "./domain-performance-insights.js",
  "./domain-insight-confidence.js",
  "./insight-confidence-ui.js",
  "./training-insights-ui.js",
  "./workspace-sections-ui.js",
  "./garmin-csv-import.js",
  "./training-import-controller.js",
  "./training-import-ui.js",
  "./app-state.js",
  "./local-state-store.js",
  "./training-repository.js",
  "./domain-training-plan.js",
  "./domain-periodized-training-plan.js",
  "./training-plan-controller.js",
  "./training-plan-ui.js",
  "./domain-template-snapshot-update.js",
  "./template-snapshot-update-ui.js",
  "./calendar-ui.js",
  "./workout-template-ui.js",
  "./exercise-library-ui.js",
  "./heart-rate-zones-ui.js",
  "./workout-completion-ui.js",
  "./workout-history-ui.js",
  "./domain-workout-assessment.js",
  "./domain-ai-workout-assessment.js",
  "./domain-ai-workout-context.js",
  "./manifest.json",
  "./Treningsfilosofi/coach-rammeverk.md",
  "./data/coach-rules.json",
  "./Icon1.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await Promise.allSettled(FIREBASE_MODULES.map(url => cache.add(url)));
    })
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
    url.pathname.endsWith("/domain-fitness.js") ||
    url.pathname.endsWith("/domain-exercises.js") ||
    url.pathname.endsWith("/domain-heart-rate-zones.js") ||
    url.pathname.endsWith("/domain-volume-trends.js") ||
    url.pathname.endsWith("/domain-activity.js") ||
    url.pathname.endsWith("/domain-performance-insights.js") ||
    url.pathname.endsWith("/domain-insight-confidence.js") ||
    url.pathname.endsWith("/insight-confidence-ui.js") ||
    url.pathname.endsWith("/training-insights-ui.js") ||
    url.pathname.endsWith("/workspace-sections-ui.js") ||
    url.pathname.endsWith("/garmin-csv-import.js") ||
    url.pathname.endsWith("/training-import-controller.js") ||
    url.pathname.endsWith("/training-import-ui.js") ||
    url.pathname.endsWith("/app-state.js") ||
    url.pathname.endsWith("/local-state-store.js") ||
    url.pathname.endsWith("/training-repository.js") ||
    url.pathname.endsWith("/domain-training-plan.js") ||
    url.pathname.endsWith("/domain-periodized-training-plan.js") ||
    url.pathname.endsWith("/training-plan-controller.js") ||
    url.pathname.endsWith("/training-plan-ui.js") ||
    url.pathname.endsWith("/domain-template-snapshot-update.js") ||
    url.pathname.endsWith("/template-snapshot-update-ui.js") ||
    url.pathname.endsWith("/calendar-ui.js") ||
    url.pathname.endsWith("/workout-template-ui.js") ||
    url.pathname.endsWith("/exercise-library-ui.js") ||
    url.pathname.endsWith("/heart-rate-zones-ui.js") ||
    url.pathname.endsWith("/workout-completion-ui.js") ||
    url.pathname.endsWith("/workout-history-ui.js") ||
    url.pathname.endsWith("/domain-workout-assessment.js") ||
    url.pathname.endsWith("/domain-ai-workout-assessment.js") ||
    url.pathname.endsWith("/domain-ai-workout-context.js") ||
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
