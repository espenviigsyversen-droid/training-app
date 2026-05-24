# ARCHITECTURE.md

Teknisk oversikt over Treningsapp.

## Kortversjon

Treningsapp er en installbar PWA uten build-step. Appen kjøres direkte fra statiske filer og bruker Firebase for innlogging og datalagring.

## Teknologistack

- Frontend: Vanilla HTML, CSS og JavaScript
- App-type: Single Page App / PWA
- Hosting: GitHub Pages
- Auth: Firebase Google Auth
- Database: Firestore
- Offline: Firestore IndexedDB persistence + egen lokal snapshot i `localStorage`
- Build: Ingen

## Filstruktur

```text
Treningsapp/
├── index.html
├── app.js
├── styles.css
├── manifest.json
├── service-worker.js
├── progress.md
├── AGENTS.md
├── ARCHITECTURE.md
├── DATA_AND_SYNC.md
├── TESTING.md
├── RELEASE_CHECKLIST.md
├── tests/
│   └── stability-tests.js
├── data/
│   └── coach-rules.json
├── icons/
├── Kravspesifikasjon/
└── Treningsfilosofi/
```

## Hovedansvar i appen

### `index.html`

Inneholder app-skallet, faner, skjemaer og modaler.

### `app.js`

Inneholder foreløpig nesten all applikasjonslogikk:

- Firebase-init
- Auth
- Firestore-lesing og -skriving
- lokal state
- offline snapshot
- coach-regler
- kalender
- loggføring
- challenges
- innsikt
- rendering

Dette er praktisk for en liten statisk app, men bør gradvis deles opp når kompleksiteten øker.

### `styles.css`

Inneholder design tokens, layout, komponentstiler og responsive regler.

### `service-worker.js`

Håndterer app shell-cache og offline fallback.

## Anbefalt arkitekturretning

Ikke gjør en stor rewrite. Del heller appen gradvis i tydelige soner:

1. `storage` - Firestore, local snapshot, import/export
2. `domain/dates` - datoer, uker, perioder
3. `domain/coach` - coach-context, anbefalinger, Bakken-regler
4. `domain/training` - økter, roller, belastning, intensitet
5. `ui/render` - render-funksjoner og DOM-hjelpere
6. `tests` - rene tester for kritiske regler

Målet er lavere risiko, lettere testing og mindre sjanse for regresjoner.

