# Treningsapp — progress.md
Oppdatert: 2026-05-14 (siste endringer: v75–v79)

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
**Versjon:** v79 (konstant i `app.js`).

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
- **Trafikklymodell** (v79): Daglig beredskaps-sjekk på Hjem-fanen. Tre spørsmål: søvn (1–5), energi (1–5), valgfri hvile-HF. Output: grønn / gul / rød med anbefalt tiltak. Lagres i localStorage per dato (`tl_readiness_YYYY-MM-DD`). Rød overstyrer coach-noten til hvile-råd. Grunnlaget viser dagsform-nivå i "?"-detaljer. `TRAFFIC_LIGHT_CONFIG`, `assessTrafficLight()`, `loadDailyReadiness()`, `saveDailyReadiness()`, `renderTrafficLight()` lagt til.

---

## Gap-analyse: Filosofi vs. app

| Gap | Beskrivelse | Status |
|---|---|---|
| **1. Trafikklymodell** | Daglig beredskaps-sjekk (søvn/energi/hvile-HF) → grønn/gul/rød på Dashboard | Bygget (v79) |
| **2. Den gylne sonen** | Nivåkalibrert, vist i loggmodal og detaljvisning | Bygget (v78) |
| **3. Coach-note** | Kjører ekte logikk via `buildCoachContext` + `buildCoachNote` | Bygget (v75) |
| **4. Innsikt = mønstre** | Siden viser statistikk, ikke Bakken-stil mønsterspørsmål | Delvis |
| **5. Interval-struktur** | Ingen støtte for 45/15-sett, arbeid/hvile-felter | Ikke bygget |
| **6. AI-integrasjon** | Ingen faktisk Claude API-kall | Ikke bygget |
| **7. Gradert smerte** | Smerte vurderes nå etter alvorlighetsgrad med forfallslogikk | Bygget (v76) |
| **8. Strukturert lokasjon** | Fritekst erstattet med kroppsdel+side-dropdown, lagres strukturert | Bygget (v77) |

---

## Neste steg (prioritert)

### 1. Innsikt: mønstre, ikke statistikk
Legg til Bakken-stil mønsterspørsmål basert på siste 30 dager:
- «Er rolige dager faktisk rolige? (snittpuls < 75 % av maks)»
- «Er forholdet rolig:terskel ≥ 3:1?»
- «Følger RPE og HRV hverandre? (indikerer god adaptasjon)»

### 4. AI-integrasjon
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
