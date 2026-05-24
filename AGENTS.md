# AGENTS.md

Arbeidsregler for Codex/AI-agenter som jobber på Treningsapp.

## Prosjekt

Dette er en lokal kopi av en PWA som lastes opp manuelt til GitHub Pages.

- Ikke bruk Git-kommandoer i denne mappen.
- Ikke anta at mappen er et Git-repository.
- Jobb kun innenfor prosjektmappen:
  `C:\Users\espen\Downloads\00_Organisert\02_Prosjekter_og_apper\Treningsapp`
- Ikke bruk nettverk, full access eller tilgang utenfor prosjektmappen uten å forklare hvorfor og spørre først.

## Trygge lokale kommandoer

Bruk lokale, ikke-destruktive kommandoer først:

```powershell
Get-ChildItem -Force
node --check app.js
node --check service-worker.js
node --check domain-core.js
node tests\stability-tests.js
```

## Viktige filer

- `index.html` - app-skall og modaler
- `app.js` - hovedlogikk, state, Firebase, coach, render
- `domain-core.js` - rene testbare domenehjelpere
- `styles.css` - styling
- `service-worker.js` - PWA-cache
- `manifest.json` - PWA-manifest
- `progress.md` - historikk og utviklingsnotater
- `tests/stability-tests.js` - lokal stabilitetstest

## Ved kodeendringer

Etter endringer skal du som minimum kjøre:

```powershell
node --check app.js
node --check service-worker.js
node --check domain-core.js
node tests\stability-tests.js
```

Hvis `service-worker.js` eller `app.js` endres, vurder om PWA-versjonen må bumpes:

- `APP_VERSION` i `app.js`
- `CACHE_NAME` i `service-worker.js`

Disse skal normalt matche, f.eks. `v99` og `treningsapp-v99`.

Når `APP_VERSION` / `CACHE_NAME` bumpes, skal synlig versjonsinfo i appen også kontrolleres:

- Setup -> Data og system -> Backup og oppdatering
- feltet skal vise riktig `Appversjon` og cache-navn

## Sluttrapport

Oppsummer alltid:

- hvilke filer som er endret
- hvilke sjekker som er kjørt
- hvilke filer brukeren må laste opp til GitHub
- om noe ikke ble testet
