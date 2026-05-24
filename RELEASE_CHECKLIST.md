# RELEASE_CHECKLIST.md

Sjekkliste før opplasting til GitHub Pages.

## Før opplasting

Kjør:

```powershell
node --check app.js
node --check service-worker.js
node --check domain-core.js
node tests\stability-tests.js
```

## Versjon/cache

Hvis `app.js`, `domain-core.js`, `index.html`, `styles.css` eller `service-worker.js` er endret:

- sjekk `APP_VERSION` i `app.js`
- sjekk `CACHE_NAME` i `service-worker.js`
- sørg for at de matcher

Eksempel:

```js
const APP_VERSION = 'v108';
const CACHE_NAME = "treningsapp-v108";
```

Kontroller også at synlig versjonsinfo i appen viser samme versjon:

- Setup -> Data og system -> Backup og oppdatering
- `Appversjon: v...`
- `Cache: treningsapp-v...`

## Filer som ofte må lastes opp

Ved vanlig appendring:

- `app.js`
- `domain-core.js`
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

## Etter opplasting

1. Åpne appen på GitHub Pages
2. Bruk Setup -> Backup og oppdatering -> Oppdater app
3. Lukk og åpne appen igjen
4. Sjekk at ny versjon faktisk kjører
5. Sjekk at riktig appversjon vises i Setup -> Data og system -> Backup og oppdatering
6. Test én trygg handling, f.eks. åpne Kalender eller Innsikt

## Ved feil etter opplasting

1. Prøv Oppdater app
2. Sjekk om `APP_VERSION` og `CACHE_NAME` matcher
3. Last opp alle endrede filer på nytt
4. Hvis data ser feil ut: ikke importer backup før årsaken er forstått
5. Bruk eventuelt `Gjenopprett sikkerhetskopi` hvis feilen kom etter import/reset
