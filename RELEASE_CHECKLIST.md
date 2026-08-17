# RELEASE_CHECKLIST.md

Sjekkliste før opplasting til GitHub Pages.

## Før opplasting

Kjør:

```powershell
node --check app.js
node --check service-worker.js
node --check domain-core.js
node --check domain-goals.js
node --check domain-coach-rules.js
node --check domain-coach.js
node --check domain-fitness.js
node --check domain-exercises.js
node --check domain-heart-rate-zones.js
node --check domain-activity.js
node --check domain-performance-insights.js
node --check domain-volume-trends.js
node --check domain-workout-assessment.js
node --check domain-ai-workout-assessment.js
node --check domain-ai-workout-context.js
node --check domain-insight-confidence.js
node --check insight-confidence-ui.js
node --check training-insights-ui.js
node --check workspace-sections-ui.js
node --check exercise-library-ui.js
node --check heart-rate-zones-ui.js
node --check workout-template-ui.js
node --check workout-completion-ui.js
node --check workout-history-ui.js
node --check garmin-csv-import.js
node --check training-import-controller.js
node --check training-import-ui.js
node --check ai-coach-client.js
node --check ai-coach-ui.js
node --check app-state.js
node --check local-state-store.js
node --check training-repository.js
node --check domain-training-plan.js
node --check domain-periodized-training-plan.js
node --check domain-template-snapshot-update.js
node --check template-snapshot-update-ui.js
node --check calendar-ui.js
node --check functions\ai\chat-store.js
node --check functions\ai\model-profiles.js
node --check functions\ai\ai-preferences.js
node tests\stability-tests.js
node functions\tests\ai-backend-tests.js
```

Når en ny runtime-modul opprettes, skal den samtidig registreres i denne
`node --check`-listen og listen i `AGENTS.md`, i `APP_SHELL` i
`service-worker.js` og i filstrukturen i `ARCHITECTURE.md`.

## Versjon/cache

Hvis en runtime-fil, `index.html`, `styles.css` eller `service-worker.js` er endret:

- sjekk `APP_VERSION` i `app.js`
- sjekk `CACHE_NAME` i `service-worker.js`
- sørg for at de matcher

Eksempel:

```js
const APP_VERSION = 'v138b';
const CACHE_NAME = "treningsapp-v138b";
```

Kontroller også at synlig versjonsinfo i appen viser samme versjon:

- Setup -> Data og system -> Backup og oppdatering
- `Appversjon: v...`
- `Cache: treningsapp-v...`

## Filer som ofte må lastes opp

Ved vanlig appendring:

- `app.js`
- `domain-core.js`
- `domain-coach.js`
- `domain-periodized-training-plan.js`
- `domain-template-snapshot-update.js`
- `template-snapshot-update-ui.js`
- `ai-coach-client.js`
- `ai-coach-ui.js`
- `index.html`
- `styles.css`
- `service-worker.js`

Ved dokumentasjon/testendring:

- `progress.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `DATA_AND_SYNC.md`
- `INTERVALS_DESIGN.md`
- `TESTING.md`
- `RELEASE_CHECKLIST.md`
- `tests/stability-tests.js`

## AI-backend

Ved release med AI-coach:

- følg `FIREBASE_AI_BACKEND_DEPLOY.md`
- kontroller eksisterende Firestore Rules før Functions deployes
- bekreft at frontend ikke kan lese/skrive `apiKeys/{uid}` eller `aiUsage/{uid}`
- deploy og test nøkkel/status-funksjonene før chatfunksjonen
- bekreft at nøkkelen kun vises maskert og kan slettes
- bekreft at `apiKeys/{uid}` bare inneholder `openaiEncrypted`, aldri klartekstnøkkelen
- bekreft at `AI_KEY_ENCRYPTION_SECRET` er bundet via Firebase Secret Manager og ikke finnes i repo/config
- bekreft at `Server-side` er nøytral og at grønn `Tilkoblet` styres av backendstatus
- test Auth-feil, manglende nøkkel, rate limit, timeout og normal chat
- test at Chat ligger etter Mål og at alle seks bunnfaner er lesbare på liten mobil
- bekreft at chatten ikke endrer plan, logg eller andre treningsdata
- kontroller at logger ikke inneholder API-nøkkel, prompt, context eller chatinnhold
- last opp `functions/`, `firebase.json` og `.firebaserc` via Firebase-verktøy/deployflyt, ikke som GitHub Pages-filer

## Etter opplasting

1. Åpne appen på GitHub Pages
2. Bruk Setup -> Backup og oppdatering -> Oppdater app
3. Lukk og åpne appen igjen
4. Sjekk at ny versjon faktisk kjører
5. Sjekk at riktig appversjon vises i Setup -> Data og system -> Backup og oppdatering
6. Sjekk at Lokal sikkerhetskopi viser oppdatert status og lagringslag i samme seksjon
7. Test én trygg handling, f.eks. åpne Kalender eller Innsikt

Ved oppgradering av Firebase Functions SDK:

- kjør backend-syntakssjekker og `node functions/tests/ai-backend-tests.js`
- deploy Functions separat og smoke-test nøkkelstatus, tilkobling og ett vanlig AI-svar

## Ved feil etter opplasting

1. Prøv Oppdater app
2. Sjekk om `APP_VERSION` og `CACHE_NAME` matcher
3. Last opp alle endrede filer på nytt
4. Hvis data ser feil ut: ikke importer backup før årsaken er forstått
5. Bruk eventuelt `Gjenopprett sikkerhetskopi` hvis feilen kom etter import/reset
