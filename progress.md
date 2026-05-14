# Treningsapp — progress.md
Oppdatert: 2026-05-14 (siste endringer: v75–v91)

---

## Marius Bakken-filosofien (kompakt)

Kjernen er konsistens over intensitet. Bakken bruker seks begreper:

| Begrep | Kort forklaring |
|---|---|
| **Den gylne sonen** | 80–87 % av maks-HF. Hverken for lett eller for hardt. Mesteparten av løpsvolumet skal hit. |
| **Trafikklymodellen** | Grønn / gul / rød daglig beredskaps-sjekk (hvile-HF vs. snitt, søvn, følelse) før du velger økt. |
| **45/15-intervaller** | 45 sek arbeid / 15 sek hvile. Høy aerob stimulus uten for stor syre-belastning. |
| **Dobbel terskel** | To terskeldager per uke (f.eks. tirsdag + torsdag). Resten er rolig. |
| **Smart Strides** | Korte stigningsløp (60–80 m) som nevromuskulær stimulans uten akkumulert tretthet. |
| **10-minuttersregelen** | Start alltid. Følelsen snur nesten alltid etter 10 min. Motivasjon følger handling. |
| **Trappetest (overtrening)** | Kan du gå i trapp uten å bli andpusten? Nei → hviledag. Enkel daglig selvsjekk. |

Standard Bakken-uke: Hoved-terskel → Støtte-terskel → Lang rolig → Valgfri X-økt.

---

## App-arkitektur

**Type:** PWA (Progressive Web App) — offline-first, installerbar, ingen build-step.  
**Hosting:** GitHub Pages.  
**Backend:** Firebase (prosjekt `home-tasks-app-18de3`) — Firestore + Google Auth.  
**Frontend:** Vanilla JS + HTML + CSS, single-page app, tab-navigasjon.  
**Versjon:** v91 (konstant i `app.js`).

### Filer

```
Treningsapp/
├── index.html          # App-skall, 5 seksjoner (Hjem, Kalender, Logg, Innsikt, Innstillinger)
├── app.js              # All logikk, ~4 800 linjer. Firebase-init, coach-system, sync, state.
├── styles.css          # Design-tokens (oransje #ff4f2e), mobil-først, 2 000+ linjer.
├── manifest.json       # PWA-manifest
├── service-worker.js   # Offline-cache
├── data/
│   └── coach-rules.json          # Strukturert versjon av coachreglene (7 prinsipper)
├── Treningsfilosofi/
│   ├── Marius Bakken treningsfilosofi.pdf   # Kildedokument (4,4 MB)
│   └── coach-rammeverk.md                  # Ekstraherte prinsipper, beslutningsprioritet, ukeskjema
├── Kravspesifikasjon/  # Kravdokumenter
└── progress.md         # ← denne filen
```

### Firestore-samlinger (per bruker)
`templates` · `planned` · `completed` · `wellness` · `challenges` · `settings/preferences`

### Hva som allerede er bygget
- Google-innlogging, offline-sync med statusindikator
- Maler og planlegging av økter (kalendervisning)
- Loggføring med RPE, smerte, treningseffekt (Garmin), HRV
- Belastningsvurdering (lav / moderat / høy) basert på RPE + HRV + Garmin-effekt
- Coach-rammeverk-objekt med 7 Bakken-prinsipper i koden
- Innsikt-fane med grunnleggende statistikk
- Utfordringer/mål-modul
- **Coach-kontekst v1** (v75): `buildCoachContext()` samler nå-bilde fra 7/14/28 dager, gylne sone, HRV, kroppssignaler, ukesroller, challenges. Coach-noten på Hjem og Innsikt kjører ekte logikk. "?"-knapp viser grunnlaget.
- **Gradert smertevurdering** (v76): `gradedPainContext()` skiller lav/moderat/høy smerte med ulik forfallstid (3/5/7 dager). Coach-noten gir tilpasset råd per nivå. Sjekk-inn-hint vises i fullføre-modal når det er relevant aktiv smerte.
- **Strukturert smertelokasjon** (v77): Fritekstfeltet for område erstattet med dropdown (kroppsdel + side). Konstanter `PAIN_AREA_REGIONS`/`PAIN_AREA_SIDES` + `formatAreaLabel()`. Lagrer `areaRegion`, `areaSide` og beregnet `area`-streng i Firestore. Eksisterende data beholdes uendret (bakoverkompatibelt).
- **Gylne sone i UI** (v78): `goldenZonePercentages(level)` kalibrerer sonen etter treningsnivå (beginner/building: 77–84 %, intermediate: 78–85 %, experienced: 80–87 %). Snittpuls i detaljvisning viser "gylne sone ✓ / over / under". Loggmodalen viser sonen som hint under pulsfeltene.
- **Trafikklymodell** (v79): Daglig beredskaps-sjekk på Hjem-fanen. Tre spørsmål: søvn (1–5), energi (1–5), valgfri hvile-HF. Output: grønn / gul / rød med anbefalt tiltak. Lagres i localStorage per dato. Rød overstyrer coach-noten til hvile-råd. Gul gir myk advarsel. Grunnlaget viser dagsform-nivå i "?"-detaljer. `TRAFFIC_LIGHT_CONFIG`, `assessTrafficLight()`, `loadDailyReadiness()`, `saveDailyReadiness()`, `renderTrafficLight()` lagt til.
- **Coach: smertegradering + priority-felt + X-økt** (v91): Tre coach-forbedringer: (1) `bodySignalState` skiller nå mellom mild smerte (1–2/10 → `cooling`, foreslår terskel etter en rolig økt) og bekymringsfull smerte (3+/10 → `caution`, kun recovery). Løser at mild smerte blokkerte terskelforslag for hele neste uke. (2) `priority`-feltet i treningsprofilen er nå aktivt: `performance` foreslår terskel straks det er rom, `injury_free_progression` krever 2 rolige øyer før terskel. (3) X-økt vises alltid som 4. forslag i normaluke når det er rom — sikrer at VO2max/teknikk/styrke alltid er synlig som alternativ.
- **Hjem: alle økter samme dag** (v90): «Neste økt» / «Dagens økt» viser nå alle planlagte økter på samme dato, ikke bare én. For fremtidige dager grupperes etter første kommende dato (`nextDateItems`). Tittelen skifter til «Dagens økt» automatisk når det finnes økter på dagens dato (eksisterende logikk).
- **Kalender overflow med øktdata** (v89): Overflow-celler viser nå faktiske økter — forrige måneds datoer viser utførte økter (grønt), neste måneds datoer viser planlagte (oransje). Cellene er klikkbare og åpner dagsmodal. Opacity 0.4 for tydelig visuell distinksjon fra inneværende måned.
- **Kalender overflow-datoer** (v88): Tomme celler i starten og slutten av månedsgridet viser nå nabomånedenes datoer med redusert opacity. Gir visuell kontekst for hvilken ukedag måneden starter på.
- **Kalender nav-fix** (v88): `.calendar-nav` konvertert fra CSS grid til flexbox med eksplisitt `height: 44px` på knappene. Piler er nå korrekt vertikalt sentrert i forhold til månedsfeltet på iOS Safari.
- **Logg-fane layout v2** (v88): Dato på egen linje, kategori + metrikk på linjen under. Konsekvent 3-linjers layout per rad: navn → dato → kategori · metrikk.
- **Logg-fane kompakt** (v88): `historyRow(c)` erstatter `completedCard` i Logg-fanen. Hvert element viser fargestripe etter intensitet (grønn/oransje/rød/lilla/grå), dato, navn, nøkkelmetrikk (distanse · tid · bpm) og pil. Knapper og tagger skjult bak «Detaljer»-klikk. Filtrene er nå bak en «Filter / Sorter»-knapp med badge som viser antall aktive filtre.
- **Hjemskjerm forenklet** (v86): Hjem viser nå kun: Dagens økt → Dagsform → Coach-notis → Denne uken (med mini challenge-progresjonslinje). Formstatus, Ukeplan, Foreslå neste økt, Handlinger og Kommende økter er flyttet til Kalender-fanen. `renderChallenges()` renderer ny `.challenge-mini` inline under «Denne uken».
- **Dagsform synkes via Firestore** (v85): `dailyReadiness` flyttet fra localStorage til `state.settings.dailyReadiness` (lagret i Firestore-dokumentet `settings/preferences`). `loadDailyReadiness()` leser nå fra `state.settings`, `saveDailyReadiness()` er async og skriver til Firestore. Automatisk opprydding av oppføringer eldre enn 7 dager. `submitTrafficLight` og `resetTrafficLight` er async. Dagsform er nå tilgjengelig på alle enheter med samme bruker.
- **Code review + robusthet** (v84): Fire rettelser fra gjennomgang: (1) `avoidWhen`-straff i `templateSuggestionScore` cappet til maks −16 for å unngå urimelig negativ score. (2) `profileWeekRole`-DOM-oppslag gjort null-safe med `?.value`. (3) `saveSettings()` fått try/catch med toast ved Firestore-feil. (4) Templates normaliseres ved Firestore-lasting: `recommendedWhen` og `avoidWhen` alltid konvertert til array via `asArray()` for bakoverkompatibilitet med eldre streng-data.
- **Unngå når — multiple choice** (v83): `avoidWhen` konvertert fra enkelt string til array. `<select>` i øktmal-skjemaet erstattet med checkboxes (samme mønster som «Passer best når»). Coach-score penaliserer nå per matching betingelse (×8 per treff). `templateAvoidWhenLabel` støtter arrays. Bakoverkompatibelt via `asArray()` — eksisterende Firestore-data med string-verdi fungerer uendret.
- **Bakken-mønstre i Innsikt** (v81): Nytt «Bakken-mønstre»-kort øverst i Innsikt-fanen. Fire mønstre siste 30 dager med grønn/gul/rød/nøytral indikator: (1) Rolig:terskel-ratio (mål ≥ 3:1), (2) Rolige dager er faktisk rolige (avgHeartRate mot gylne sone), (3) RPE på rolige dager (bør ikke være ≥ 7), (4) Ukentlig konsistens siste 4 uker. Viser «ikke nok data»-melding ved for lite historikk. `buildBakkenPatterns()` + `renderBakkenPatterns()`.
- **Trappetest + HR-baseline** (v80): Trappetest (Bakken: «kan du gå i trapp uten å bli andpusten?») lagt til som valgfritt ja/nei-spørsmål i dagsform-skjemaet. «Nei» → rød uansett øvrige scores, med begrunnelse «trappetest sviktet» i coach-noten. Hvile-HF-feltet vises kun om brukeren har en baseline i Helse-loggen; ellers forklaringstekst. Trapp-resultat vises i «?»-grunnlaget.

---

## Gap-analyse: Filosofi vs. app

| Gap | Beskrivelse | Status |
|---|---|---|
| **1. Trafikklymodell** | Daglig beredskaps-sjekk (søvn/energi/hvile-HF) → grønn/gul/rød på Dashboard | Bygget (v79) |
| **2. Den gylne sonen** | Nivåkalibrert, vist i loggmodal og detaljvisning | Bygget (v78) |
| **3. Coach-note** | Kjører ekte logikk via `buildCoachContext` + `buildCoachNote` | Bygget (v75) |
| **4. Innsikt = mønstre** | «Bakken-mønstre»-kort i Innsikt med 4 mønstre siste 30 dager | Bygget (v81) |
| **5. Interval-struktur** | Ingen støtte for 45/15-sett, arbeid/hvile-felter | Ikke bygget |
| **6. AI-integrasjon** | Ingen faktisk Claude API-kall | Ikke bygget |
| **7. Gradert smerte** | Smerte vurderes nå etter alvorlighetsgrad med forfallslogikk | Bygget (v76) |
| **8. Strukturert lokasjon** | Fritekst erstattet med kroppsdel+side-dropdown, lagres strukturert | Bygget (v77) |

---

## Neste steg (prioritert)

### 1. AI-integrasjon
Lag en «Spør coachen»-funksjon:
- Send siste 14 dager komprimert treningshistorikk + `coach-rammeverk.md` som system-prompt til Claude API
- Vis svaret i Innsikt-fanen
- Kan bruke `claude-haiku-4-5` for lavere kostnad per kall

---

## Arbeidsnotater

**Prosjektstruktur**
- Lokal kopi — ikke et Git-repo. Filer lastes opp manuelt til GitHub Pages.
- Filer som typisk endres per økt: `app.js`, `index.html`, `styles.css`, `service-worker.js`
- Husk alltid å bumpe `APP_VERSION` i `app.js` og `CACHE_NAME` i `service-worker.js`
