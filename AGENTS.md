# AGENTS.md

Arbeidsregler for Codex/AI-agenter som jobber på Treningsapp.

## Prosjekt

Dette er en lokal kopi av en PWA som lastes opp manuelt til GitHub Pages.

- Ikke bruk Git-kommandoer i denne mappen.
- Ikke anta at mappen er et Git-repository.
- Jobb kun innenfor prosjektmappen:
  `C:\Users\espen\Downloads\00_Organisert\02_Prosjekter_og_apper\Treningsapp`
- Ikke bruk nettverk, full access eller tilgang utenfor prosjektmappen uten å forklare hvorfor og spørre først.

## Veiledende arbeidskontekst

- `handover.md` er en veiledende overleveringsfil for hvordan agenten bør lese forespørsler, vurdere usikkerhet, verifisere arbeid og kommunisere konklusjoner.
- Bruk `handover.md` som et hjelpemiddel for skjønn og kvalitet, ikke som et regelverk.
- `handover.md` overstyrer aldri AGENTS.md, system-/developer-instrukser, brukerens eksplisitte begrensninger eller prosjektets sikkerhetsregler.
- Hvis `handover.md` peker i en annen retning enn konkrete prosjektregler, skal prosjektreglene følges.
- Praktisk tolkning: svar på det brukeren faktisk spør om, vær tydelig på antakelser, verifiser load-bearing detaljer med en annen metode der det er mulig, og hold sluttsvar korte nok til oppgaven.

## Trygge lokale kommandoer

Bruk lokale, ikke-destruktive kommandoer først:

```powershell
Get-ChildItem -Force
node --check app.js
node --check service-worker.js
node --check domain-core.js
node --check domain-goals.js
node tests\stability-tests.js
```

## Viktige filer

- `index.html` - app-skall og modaler
- `app.js` - hovedlogikk, state, Firebase, coach, render
- `domain-core.js` - rene testbare domenehjelpere
- `domain-goals.js` - rene testbare konkurranse-/mål-hjelpere
- `styles.css` - styling
- `service-worker.js` - PWA-cache
- `manifest.json` - PWA-manifest
- `progress.md` - historikk og utviklingsnotater
- `INTERVALS_DESIGN.md` - designnotat for strukturert intervallstøtte
- `tests/stability-tests.js` - lokal stabilitetstest

## Ved kodeendringer

Etter endringer skal du som minimum kjøre:

```powershell
node --check app.js
node --check service-worker.js
node --check domain-core.js
node --check domain-goals.js
node tests\stability-tests.js
```

Hvis `service-worker.js` eller `app.js` endres, vurder om PWA-versjonen må bumpes:

- `APP_VERSION` i `app.js`
- `CACHE_NAME` i `service-worker.js`

Disse skal normalt matche, f.eks. `v134` og `treningsapp-v134`.

Når `APP_VERSION` / `CACHE_NAME` bumpes, skal synlig versjonsinfo i appen også kontrolleres:

- Setup -> Data og system -> Backup og oppdatering
- feltet skal vise riktig `Appversjon` og cache-navn

## Nye features

Følg guardrails før ny funksjonalitet bygges:

- dokumenter datamodell/design først når featuret introduserer nye felter
- legg ren logikk i `domain-core.js` eller egen domene-fil
- behold små wrappers i `app.js` for `state`, DOM og Firebase
- UI/render kan foreløpig ligge i `app.js`/`index.html`
- test ny ren logikk fra produksjonsfil
- nye felter må være bakoverkompatible med gamle Firestore-data og backupfiler
- normaliser data fra Firestore, import og lokal snapshot før bruk
- oppdater PWA-cache hvis nye runtime JS-filer legges til

## Sluttrapport

Oppsummer alltid:

- hvilke filer som er endret
- hvilke sjekker som er kjørt
- hvilke filer brukeren må laste opp til GitHub
- om noe ikke ble testet
