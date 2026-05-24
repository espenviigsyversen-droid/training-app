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
├── domain-core.js
├── styles.css
├── manifest.json
├── service-worker.js
├── progress.md
├── AGENTS.md
├── ARCHITECTURE.md
├── DATA_AND_SYNC.md
├── INTERVALS_DESIGN.md
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

Inneholder applikasjonslogikk og UI-kobling:

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

`app.js` skal fortsatt eie state, DOM og Firebase-kobling. Rene regler bør gradvis flyttes til testbare domene-filer.

### `domain-core.js`

Inneholder rene, testbare hjelpefunksjoner uten DOM, Firebase eller direkte `state`:

- dato- og ukeplanlegging
- trafikklys/dagsform-regler
- gylne sone-prosenter
- varighet, tempo og enkle treningsberegninger
- challenge-progress og etiketter

Filen lastes som ES module fra `app.js` og caches av `service-worker.js`.

### `styles.css`

Inneholder design tokens, layout, komponentstiler og responsive regler.

### `service-worker.js`

Håndterer app shell-cache og offline fallback.

## Anbefalt arkitekturretning

Ikke gjør en stor rewrite. Del heller appen gradvis i tydelige soner:

1. `storage` - Firestore, local snapshot, import/export
2. `domain-core.js` / senere `domain/dates` - datoer, uker, perioder
3. senere `domain/coach` - coach-context, anbefalinger, Bakken-regler
4. senere `domain/training` - økter, roller, belastning, intensitet
5. `ui/render` - render-funksjoner og DOM-hjelpere
6. `tests` - rene tester for kritiske regler

Målet er lavere risiko, lettere testing og mindre sjanse for regresjoner.

## Feature-mønster

Nye features skal bygges smått og med lav regresjonsrisiko:

1. Start med datamodell/design før UI når featuret introduserer nye felter eller ny beslutningslogikk.
2. Legg ren domene-logikk i `domain-core.js`, eller i en egen domene-fil hvis området blir stort nok til å fortjene det.
3. La `app.js` beholde små wrapper-funksjoner når logikken trenger `state`, DOM, Firebase eller eksisterende render-flyt.
4. UI og rendering kan foreløpig ligge i `app.js` og `index.html`. Ikke splitt UI bare for å splitte.
5. Ny ren logikk skal testes fra faktisk produksjonsfil i `tests/stability-tests.js`.
6. Ikke kopier produksjonslogikk inn i testene hvis den kan importeres.
7. Alle nye datafelter skal være valgfrie eller ha trygge defaults, slik at gamle Firestore-data og backupfiler fungerer uendret.
8. Data fra Firestore, import og lokal snapshot skal normaliseres før bruk.
9. Hvis en ny JS-fil brukes i runtime, må den lastes riktig og vurderes lagt i `APP_SHELL` i `service-worker.js`.
10. Hvis runtime-filer endres, bump `APP_VERSION` og `CACHE_NAME`, og kontroller synlig versjon under Setup -> Data og system -> Backup og oppdatering.

For intervallstøtte betyr dette at selve datastrukturen, normalisering og format-/beregningsregler bør være rene funksjoner først. Skjema, visning og lagring kan kobles på i små steg etterpå.

## Data-normalisering

Appen skal ikke stole direkte på rå Firestore-, backup- eller snapshot-data. Data som leses inn skal normaliseres til trygg form før rendering eller coach-logikk bruker den.

`normalizeTemplate()` i `domain-core.js` er første guardrail for øktmaler. Den sørger for trygge defaults på kjernefelter, konverterer `recommendedWhen` og `avoidWhen` til arrays, beholder eksisterende `structure` og gjør fremtidig `structuredWorkout` valgfri og bakoverkompatibel.

`settings.features` er en intern feature flag-struktur. Den vises ikke i UI, men gjør det mulig å bygge nye funksjoner kontrollert. Første flagg er `structuredIntervals: false`.
