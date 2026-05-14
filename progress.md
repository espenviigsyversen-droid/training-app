# Treningsapp — progress.md
Oppdatert: 2026-05-14

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
**Versjon:** v74 (konstant i `app.js`).

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

---

## Gap-analyse: Filosofi vs. app

| Gap | Beskrivelse | Status |
|---|---|---|
| **1. Trafikklymodell** | Ingen daglig beredskaps-sjekk før økt | Ikke bygget |
| **2. Den gylne sonen** | Max-HF lagres i innstillinger, men sonen beregnes/vises aldri | Ikke bygget |
| **3. Coach-note** | Dashboard-kortet er eksplisitt placeholder — ingen logikk kjører | Ikke bygget |
| **4. Innsikt = mønstre** | Siden viser statistikk, ikke Bakken-stil mønsterspørsmål | Delvis |
| **5. Interval-struktur** | Ingen støtte for 45/15-sett, arbeid/hvile-felter | Ikke bygget |
| **6. AI-integrasjon** | Ingen faktisk Claude API-kall | Ikke bygget |

---

## Neste steg (prioritert)

### 1. Aktiv coach-note på Dashboard
Fyll placeholder-kortet med faktisk logikk:
- Hent siste 7–14 dagers `completed` + `wellness`
- Kjør gjennom `COACH_FRAMEWORK`-reglene i `app.js`
- Skriv én konkret setning: «Du har trent 3 dager på rad — i dag er det grønt lys for hvile eller rolig økt»

### 2. Trafikklymodell — pre-økt beredskaps-sjekk
Modal eller inline før økt starter:
- Tre spørsmål: søvn (1–5), energi (1–5), hvile-HF vs. personlig snitt
- Output: grønn / gul / rød med konsekvens (planlagt økt / reduser intensitet / hvil)

### 3. Den gylne sonen i logging og innsikt
- Beregn `goldenZoneLow = maxHR * 0.80` og `goldenZoneHigh = maxHR * 0.87`
- Vis sonen i logg-modal og innsikt-fane
- Marker om gjennomsnittspuls på en økt lå innenfor, under eller over sonen

### 4. Innsikt: mønstre, ikke statistikk
Legg til Bakken-stil mønsterspørsmål basert på siste 30 dager:
- «Er rolige dager faktisk rolige? (gjennomsnittspuls < 75 % av maks)»
- «Er forholdet rolig:terskel ≥ 3:1?»
- «Følger RPE og HRV hverandre? (indikerer god adaptasjon)»

### 5. AI-integrasjon
Lag en «Spør coachen»-funksjon:
- Send siste 14 dager komprimert treningshistorikk + `coach-rammeverk.md` som system-prompt til Claude API
- Vis svaret i Innsikt-fanen
- Kan bruke `claude-haiku-4-5` for lavere kostnad per kall
