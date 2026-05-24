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
