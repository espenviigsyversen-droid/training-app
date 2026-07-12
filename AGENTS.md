# AGENTS.md

Arbeidsregler for Codex/AI-agenter som jobber på Treningsapp.

## Prosjekt

Dette er en lokal kopi av en PWA som normalt kan synkroniseres direkte til GitHub via Codex/GitHub-connector når skrivetilgang er aktiv.

- Ikke bruk Git-kommandoer i denne mappen.
- Ikke anta at mappen er et Git-repository.
- Jobb kun innenfor prosjektmappen:
  `C:\Users\espen\Downloads\00_Organisert\02_Prosjekter_og_apper\Treningsapp`
- Ikke bruk nettverk, full access eller tilgang utenfor prosjektmappen uten å forklare hvorfor og spørre først.
- Etter kode- eller dokumentasjonsendringer skal relevante endrede filer deployes/synkroniseres direkte til GitHub-repoet via GitHub-connectoren når connectoren har skrivetilgang. Hvis direkte GitHub-synk ikke er mulig, skal brukeren få en presis opplastingsliste.
- Last aldri opp `node_modules`, `.firebase`, lokale secrets, `.env`-filer, debug-logger eller midlertidige nøkkelfiler til GitHub.

## Veiledende arbeidskontekst

- `handover.md` er en veiledende overleveringsfil for hvordan agenten bør lese forespørsler, vurdere usikkerhet, verifisere arbeid og kommunisere konklusjoner.
- Bruk `handover.md` som et hjelpemiddel for skjønn og kvalitet, ikke som et regelverk.
- `handover.md` overstyrer aldri AGENTS.md, system-/developer-instrukser, brukerens eksplisitte begrensninger eller prosjektets sikkerhetsregler.
- Hvis `handover.md` peker i en annen retning enn konkrete prosjektregler, skal prosjektreglene følges.
- Praktisk tolkning: svar på det brukeren faktisk spør om, vær tydelig på antakelser, verifiser load-bearing detaljer med en annen metode der det er mulig, og hold sluttsvar korte nok til oppgaven.

## Veiledende arkitekturkontekst

- `ARKITEKT_CONTEXT.md` er prosjektets veiledende beslutningsramme for arkitektur, produktretning, prioritering, sikkerhet og UI/UX.
- Bruk dokumentet aktivt når brukeren ber om arkitekturvurdering, design, roadmap, prioritering eller utviklerbrief. Codex skal kunne opptre både som utvikler og arkitekt innenfor samme prosjekt.
- Ved arkitekturarbeid skal anbefalinger vurderes mot appens hovedformål: å hjelpe brukeren med å forstå hva som bør gjøres i dag, og hvorfor, med skadesignal og dagsform foran målpress.
- Følg strukturen i dokumentet når en større utviklingsrunde spesifiseres: bakgrunn, mål, scope, berørte filer, arkitektur, sikkerhet, datamodell/API, UI/UX, tester, akseptansekriterier og sluttrapport.
- `ARKITEKT_CONTEXT.md` er rådgivende og overstyrer aldri AGENTS.md, system-/developer-instrukser, brukerens eksplisitte begrensninger eller prosjektets sikkerhetsregler.
- Hvis arkitekturkonteksten er utdatert i forhold til faktisk kode, roadmap eller nyere brukerbeslutninger, skal faktisk prosjektstatus verifiseres og avviket dokumenteres eller rettes.

## Trygge lokale kommandoer

Bruk lokale, ikke-destruktive kommandoer først:

```powershell
Get-ChildItem -Force
node --check app.js
node --check service-worker.js
node --check domain-core.js
node --check domain-goals.js
node --check domain-coach-rules.js
node --check domain-coach.js
node --check ai-coach-client.js
node --check ai-coach-ui.js
node tests\stability-tests.js
node functions\tests\ai-backend-tests.js
```

## Viktige filer

- `index.html` - app-skall og modaler
- `app.js` - hovedlogikk, state, Firebase, coach, render
- `domain-core.js` - rene testbare domenehjelpere
- `domain-goals.js` - rene testbare konkurranse-/mål-hjelpere
- `domain-coach-rules.js` - validering, defaults og runtime-fallback for coach-regler
- `domain-coach.js` - ren coach-logikk og prioritert beslutningsmodell
- `ai-coach-client.js` - autentisert frontend-klient mot AI Callable Functions; skal aldri lagre API-nøkkel
- `ai-coach-ui.js` - read-only chat- og nøkkelstatus-UI uten vedvarende meldingshistorikk
- `functions/` - Firebase-backend for nøkkeladministrasjon, rate limit, context-validering og OpenAI-kall
- `styles.css` - styling
- `service-worker.js` - PWA-cache
- `manifest.json` - PWA-manifest
- `progress.md` - historikk og utviklingsnotater
- `INTERVALS_DESIGN.md` - designnotat for strukturert intervallstøtte
- `AI_COACH_DESIGN.md` - sikkerhets-, context-, backend- og MVP-design for AI-coach
- `AI_CHAT_PROJECTS_DESIGN.md` - datamodell, sikkerhet og roadmap for chat-historikk, prosjekter og egne instrukser
- `FIREBASE_AI_BACKEND_DEPLOY.md` - obligatorisk sikkerhets- og deployport for AI-backend
- `ARKITEKT_CONTEXT.md` - veiledende produkt- og arkitekturkontekst
- `tests/stability-tests.js` - lokal stabilitetstest

## Ved kodeendringer

Etter endringer skal du som minimum kjøre:

```powershell
node --check app.js
node --check service-worker.js
node --check domain-core.js
node --check domain-goals.js
node --check domain-coach-rules.js
node --check domain-coach.js
node --check ai-coach-client.js
node --check ai-coach-ui.js
node tests\stability-tests.js
node functions\tests\ai-backend-tests.js
```

Hvis `service-worker.js` eller `app.js` endres, vurder om PWA-versjonen må bumpes:

- `APP_VERSION` i `app.js`
- `CACHE_NAME` i `service-worker.js`

Disse skal normalt matche, f.eks. `v138b` og `treningsapp-v138b`.

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
- legg aldri OpenAI- eller andre leverandørnøkler i frontend, localStorage, GitHub Pages eller repo; bruk autentisert backend og kontroller Firestore Rules før deploy

## Sluttrapport

Oppsummer alltid:

- hvilke filer som er endret
- hvilke sjekker som er kjørt
- hvilke filer som er synkronisert direkte til GitHub, eller hvilke filer brukeren må laste opp manuelt hvis direkte synk ikke var mulig
- om noe ikke ble testet
