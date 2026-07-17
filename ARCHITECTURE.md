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
- Serverfunksjoner: Firebase Callable Functions for AI-backend (deployet til produksjon)
- Offline: Firestore IndexedDB persistence + normalisert lokal snapshot i `localStorage`, med IndexedDB-reserve ved kvoteproblem
- Build: Ingen

## Filstruktur

```text
Treningsapp/
├── index.html
├── app.js
├── app-state.js
├── local-state-store.js
├── training-repository.js
├── domain-training-plan.js
├── calendar-ui.js
├── workout-template-ui.js
├── domain-core.js
├── domain-goals.js
├── domain-coach-rules.js
├── domain-coach.js
├── domain-fitness.js
├── ai-coach-client.js
├── ai-coach-ui.js
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
├── functions/
│   ├── index.js
│   ├── ai/
│   └── tests/
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

Er appens orchestrator og UI-kobling:

- Firebase-init
- Auth
- wrappers som kobler samlet state til repository og domene-funksjoner
- DOM-hendelser og sammensatt rendering
- loggføring
- challenges
- innsikt

`app.js` eier fortsatt den kjørende state-instansen, DOM-hendelser og koordinering. Defaults/normalisering, lagring, planleggingsregler og kalenderens avgrensede renderflyt ligger i egne moduler.

### State, lagring, planlegging og kalender

- `app-state.js` eier tom state, settings-defaults og normalisering av data fra Firestore, import og lokal snapshot.
- `local-state-store.js` eier normalisert lokal snapshot/recovery, UTF-8-størrelsesmåling og kontrollert IndexedDB-fallback gjennom injiserbare storage-grensesnitt.
- `training-repository.js` kapsler Firestore-lesing, skriving, sletting, batch-operasjoner og utskifting av treningsdata. Auth og Firestore-avhengigheter injiseres fra `app.js`.
- `domain-training-plan.js` inneholder ren rolledekning, template-scoring og ukeplan-/øktforslag uten DOM, Firebase eller global state.
- `calendar-ui.js` renderer kalendergrid og dagsmodal med injiserte data og callbacks. Selve mutasjonene, bekreftelsene og persistence-wrappere forblir i `app.js`.

### `domain-core.js`

Inneholder rene, testbare hjelpefunksjoner uten DOM, Firebase eller direkte `state`:

- dato- og ukeplanlegging
- trafikklys/dagsform-regler
- daglig coach-støtte for konkret justering, støttepåminnelse og motivasjon
- etter-økt-vurdering for Dagens råd når en økt er fullført samme dag
- strukturert coach-grunnlag for å forklare hvorfor Dagens råd gis
- gylne sone-prosenter
- varighet, tempo og enkle treningsberegninger
- challenge-progress og etiketter

Filen lastes som ES module fra `app.js` og caches av `service-worker.js`.

### `domain-goals.js`

Inneholder ren konkurranse- og mål-logikk uten DOM, Firebase eller direkte `state`:

- race-/testløp-resultater og normalisering
- personlige bestenoteringer og historikk per distanse
- mål-løp-nedtelling, målpace og race readiness
- enkel konkurranseplan mot prioritert mål-løp
- handlingsorientert målstatus for Mål-fanen
- delmål og milepæler mot prioritert mål-løp
- anbefaling av neste relevante race-/testløp
- race-aware ukeplan-kontekst som lar ukeplanen prioritere base, test, spesifikk oppkjøring eller taper uten AI
- mål-score/progresjon som summerer kontinuitet, rolig volum, kontrollert kvalitet, skadefrihet og race-/teststatus
- PB-historikk og trendanalyse for beste/siste/nær PB/tilbakegang per distanse

`app.js` importerer race-/mål-funksjoner direkte herfra. `domain-core.js` re-eksporterer dem foreløpig for bakoverkompatibilitet med eldre tester/importmønster.

### Coach- og AI-moduler

- `domain-coach-rules.js` validerer og leverer aktive coach-regler med trygg fallback.
- `domain-coach.js` inneholder ren beslutningslogikk og bygger den whitelistede `AI Coach Context v1`.
- `domain-fitness.js` skiller forklarbar treningsmodenhet, aldersrelatert kapasitet og PB-fremgang fra dagens sikkerhetsbeslutning. Modulen kan foreslå, men aldri automatisk endre coach-profilen.
- `ai-coach-client.js` kaller autentiserte Firebase Callable Functions, men kjenner aldri den lagrede OpenAI-nøkkelen.
- `ai-coach-ui.js` eier chatflyt, prosjekter, synkronisert historikk, feiltilstander og forbruksvisning.
- `functions/` validerer Auth og context, håndterer server-side nøkkel, rate limit og OpenAI-kall. Systeminstruks, modell og sikkerhetspolicy eies av serveren.
- OpenAI-nøkler krypteres med AES-256-GCM før Firestore-lagring. Krypteringshemmeligheten leveres fra Firebase Secret Manager bare til relevante Functions; klienten ser kun maskert status.

Dataflyten er `app state -> buildAiCoachContext() -> callable backend -> OpenAI Responses API -> read-only svar`. AI-en forklarer appens strukturerte coach-beslutning og får ikke tools eller skriveadgang til treningsdata.

Backend kan deployes mens frontend fortsatt hostes på GitHub Pages. Før deploy må eksisterende Firestore Rules kontrolleres slik at nøkkel- og usage-dokumenter ikke er tilgjengelige for klienten; se `FIREBASE_AI_BACKEND_DEPLOY.md`.

### `styles.css`

Inneholder design tokens, layout, komponentstiler og responsive regler.

### `service-worker.js`

Håndterer app shell-cache og offline fallback.

## Anbefalt arkitekturretning

Ikke gjør en stor rewrite. Del heller appen gradvis i tydelige soner:

1. `app-state.js`, `local-state-store.js` og `training-repository.js` - normalisering, lokal sikkerhetskopi og Firestore
2. `domain-core.js` - datoer, uker, perioder og generelle treningshjelpere
3. `domain-goals.js` - konkurranser, personlige rekorder, mål-løp og målplan
4. `domain-coach.js` - coach-context, anbefalinger og prioritert beslutningsmodell
5. `domain-fitness.js` - transparent nivågrunnlag, VO2-referanse og PB-progresjon
6. `domain-training-plan.js` - øktforslag, roller og ukeplansammensetting
7. `calendar-ui.js`, `workout-template-ui.js`, `workout-completion-ui.js` og `workout-history-ui.js` - avgrensede render-/skjemakontrollere med injiserte avhengigheter
8. `tests` - rene tester for kritiske regler

Målet er lavere risiko, lettere testing og mindre sjanse for regresjoner.

## Feature-mønster

Nye features skal bygges smått og med lav regresjonsrisiko:

1. Start med datamodell/design før UI når featuret introduserer nye felter eller ny beslutningslogikk.
2. Legg ren domene-logikk i `domain-core.js`, eller i en egen domene-fil hvis området blir stort nok til å fortjene det.
3. La `app.js` beholde små wrapper-funksjoner når logikken trenger samlet `state`, DOM eller eksisterende render-flyt. Firestore-operasjoner for treningsdata går via `training-repository.js`.
4. UI og rendering kan ligge i `app.js` og `index.html`. Bruk bare en egen kontroller når området har en tydelig grense og injiserbare avhengigheter, slik kalenderen og øktmalene har. Ikke splitt UI bare for å splitte.
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

`workout-template-ui.js` eier fra v167 lesing og fylling av øktmal-skjemaet, strukturert intervall-preview, sortering, søk/filter, coach-klarhet og bibliotek-rendering. Modulen får state og formatteringshjelpere injisert. Oppretting av ID, normalisering, bekreftelser, offline-beskyttelse og Firestore-skriving forblir i `app.js` og `training-repository.js`.

`workout-completion-ui.js` eier fra v168 fullføringsskjemaets lesing, nullstilling, redigeringsfylling, varighetsfelt, pace-preview, modalmodus og gylne-sone-hint. `app.js` beholder oppretting av fullførtobjekt, state-mutasjon, kalenderoppfriskning og all repository-/Firestore-skriving.

`workout-history-ui.js` eier fra v169 ren filtrering/sortering, filterpresentasjon, kompakte historikkrader og detaljvisningen for fullførte økter. `app.js` beholder state, åpne/lukke-wrappers, bekreftet sletting/angre og persistence.

`settings.features` er en intern feature flag-struktur. Den vises ikke i UI, men gjør det mulig å bygge nye funksjoner kontrollert. Første flagg er `structuredIntervals`; strukturert intervallstøtte er aktivert og videreutviklet fra v102/v104.
