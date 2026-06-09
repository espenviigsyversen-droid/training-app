# STRAVA_INTEGRATION_DESIGN.md

Designnotat for en trygg Strava-integrasjon i Treningsapp.

## Mål

Hente treningsøkter fra Strava slik at brukeren slipper å legge inn all øktdata manuelt.

Integrasjonen skal:

- hente relevante økter fra Strava
- koble Strava-økter mot planlagte økter i appen
- ferdigutfylle data appen kan få fra Strava
- la Garmin-spesifikke felt og subjektive felt fylles inn manuelt
- unngå duplikater
- beskytte API-hemmeligheter og tokens
- holde Strava-logikk utenfor `app.js` så langt det er praktisk

## Viktig sikkerhetsprinsipp

Strava bruker OAuth2 med `client_id` og `client_secret`.

- `client_id` kan ligge i frontend.
- `client_secret` må ikke ligge i frontend.
- refresh tokens må behandles som hemmelige.
- å maskere en nøkkel i UI etter lagring gjør den ikke sikker hvis den fortsatt ligger i nettleser, localStorage eller Firestore.

Anbefalt løsning er derfor:

- frontend starter OAuth-flyt og viser status
- backend håndterer token exchange og refresh
- backend lagrer refresh token sikkert per bruker
- frontend får bare status og importerte øktdata

Hvis vi senere ønsker en enklere personlig testløsning, kan vi lage en midlertidig manuell token-modus, men den bør merkes som usikker/test-only og ikke være standard.

## Anbefalt arkitektur

### Frontend/PWA

Frontend skal eie:

- knapp for `Koble til Strava`
- knapp for `Hent siste økter`
- statusvisning
- import-preview
- match mot planlagte økter
- brukerbekreftelse før import/oppdatering

Frontend skal ikke eie:

- `client_secret`
- refresh token
- direkte token exchange mot Strava

### Backend

Backend kan være en av:

- Firebase Cloud Functions
- Cloudflare Worker
- Vercel Function
- annen liten HTTPS-endepunktløsning

Backend skal eie:

- OAuth callback
- token exchange
- refresh av access token
- sikker lagring av refresh token per Firebase-bruker
- kall til Strava API
- rate limit-håndtering
- eventuell webhook-mottak senere

## Foreslåtte filer

Når integrasjonen bygges:

```text
domain-strava.js
  Rene normaliserings- og mappingfunksjoner.

STRAVA_INTEGRATION_DESIGN.md
  Dette designnotatet.

app.js
  Kun små wrappers for UI, state og Firebase/backend-kall.

tests/stability-tests.js
  Tester produksjonsfunksjoner fra domain-strava.js.
```

Hvis `domain-strava.js` brukes i runtime, må den legges i `APP_SHELL` i `service-worker.js`.

## OAuth-flyt

1. Bruker trykker `Koble til Strava` i Setup.
2. Frontend åpner Strava OAuth URL med ønskede scopes.
3. Strava sender brukeren tilbake til backend callback.
4. Backend bytter `code` mot access token og refresh token.
5. Backend lagrer refresh token sikkert knyttet til Firebase-bruker.
6. Frontend viser `Strava tilkoblet`.

## Scopes

Start konservativt:

- `activity:read`

Vurder senere:

- `activity:read_all` hvis brukeren vil importere private/Only Me-økter.

Ikke be om:

- `activity:write` før appen faktisk skal skrive til Strava.

## Setup UI

Legg integrasjonen under:

```text
Setup -> Data og system -> API / Integrasjoner
```

Foreslått UI:

- Status: `Ikke tilkoblet`, `Tilkoblet`, `Token utløpt`, `Offline`, `Feil`
- Sist synket: dato/tid
- Tilkoblet konto: Strava-navn eller athlete id
- Knapp: `Koble til Strava`
- Knapp: `Hent siste økter`
- Knapp: `Koble fra`
- Valg: `Importer private økter` hvis `activity:read_all` er aktivert

Hvis vi senere tillater manuell test-token:

- feltet skal være tydelig merket `Kun test`
- verdien skal ikke vises etter lagring
- brukeren må kunne slette den
- det bør ikke brukes som permanent løsning

## Statusmodell

Foreslått statusobjekt i settings eller egen integrasjonsmetadata:

```js
strava: {
  connected: false,
  athleteId: '',
  athleteName: '',
  scopes: [],
  lastSyncAt: '',
  lastError: '',
  mode: 'backend'
}
```

Tokens skal ikke lagres i dette objektet i frontend.

## Strava-data vi kan hente

Typiske felter fra aktivitetsliste/detalj:

- `id`
- `name`
- `sport_type`
- `type`
- `start_date_local`
- `distance`
- `moving_time`
- `elapsed_time`
- `total_elevation_gain`
- `average_speed`
- `max_speed`
- `average_heartrate`
- `max_heartrate`
- `has_heartrate`
- `suffer_score` hvis tilgjengelig
- `external_id`
- `device_name` hvis tilgjengelig i detaljrespons

Senere kan streams brukes for:

- pulsserie
- distanseserie
- tid
- fart
- høydemeter/grade

Streams bør ikke være v1, fordi det øker datamengde, kompleksitet og rate-limit-bruk.

## Mapping til appens `completed`

Foreslått mapping:

```js
{
  id: generatedOrExistingId,
  source: 'strava',
  stravaActivityId: String(activity.id),
  externalId: activity.external_id || '',
  date: isoDate(activity.start_date_local),
  name: activity.name || 'Strava-økt',
  type: mapStravaSportType(activity.sport_type),
  durationSeconds: activity.moving_time || activity.elapsed_time || 0,
  elapsedSeconds: activity.elapsed_time || '',
  distanceKm: metersToKm(activity.distance),
  elevationGain: activity.total_elevation_gain || '',
  avgHeartRate: activity.average_heartrate || '',
  maxHeartRate: activity.max_heartrate || '',
  averageSpeedKmh: speedMsToKmh(activity.average_speed),
  paceSecondsPerKm: speedMsToPace(activity.average_speed),
  strava: {
    id: String(activity.id),
    sportType: activity.sport_type || '',
    importedAt: nowIso,
    rawSummaryHash: stableHash
  }
}
```

Manuelle felt beholdes for brukeren:

- RPE
- følelse i beina før økt
- følelse etter økt
- smerte/kroppssignal
- Garmin Training Effect
- HRV / hvilepuls hvis relevant
- kommentar/notat
- race/testløp-detaljer hvis Strava-navnet ikke er nok

## Match mot planlagte økter

Når en Strava-økt importeres bør appen prøve å matche mot planlagte økter.

Foreslått matchrekkefølge:

1. samme dato
2. samme aktivitetstype
3. planlagt økt ikke allerede utført
4. navn/rolle/intensitet ligner
5. varighet eller distanse er omtrent plausibel

Resultat:

- sikker match: vis `Fyll ut planlagt økt`
- usikker match: vis valg mellom kandidater
- ingen match: vis `Importer som ny loggført økt`

Appen bør ikke automatisk overskrive en planlagt økt uten brukerbekreftelse.

## Duplikatbeskyttelse

Alle importerte Strava-økter må lagre:

```js
stravaActivityId: String(activity.id)
```

Ved import:

- hvis `completed` allerede har samme `stravaActivityId`, ikke lag ny økt
- vis heller `Allerede importert`
- tilby eventuell `Oppdater data fra Strava` senere

For aktiviteter uten Strava-id skal appen bruke svakere duplikatsjekk:

- dato
- distanse
- varighet
- navn

## Importflyt v1

1. Bruker trykker `Hent siste økter`.
2. Backend henter siste 30 dager eller siste N aktiviteter.
3. Frontend viser importliste:
   - ny
   - matcher planlagt økt
   - allerede importert
   - trenger gjennomgang
4. Bruker velger hva som skal importeres.
5. Appen oppretter/oppdaterer `completed`.
6. Bruker kan etterpå fylle ut manuelle felt.

## Import-preview

Hver rad bør vise:

- dato
- navn
- sport
- distanse
- tid
- snittpuls hvis finnes
- matchstatus
- knapp: `Importer`, `Koble til planlagt`, `Hopp over`

## Hva Strava ikke erstatter

Strava-integrasjonen erstatter ikke alt fra Garmin.

Må fortsatt legges inn manuelt eller via senere Garmin-løsning:

- HRV
- hvilepuls gjennom dagen
- søvn
- Body Battery
- Garmin Training Effect hvis Strava ikke leverer det
- subjektiv dagsform
- kroppssignaler
- RPE
- følelse før/etter

## Rate limits

Strava har både korttids- og dagsgrenser per app.

For v1:

- ikke poll ofte
- hent manuelt når bruker trykker
- begrens til siste 30 dager eller siste 20 aktiviteter
- ikke hent streams som standard

Senere:

- vurder webhooks for nye aktiviteter
- bruk backoff hvis Strava returnerer rate limit-feil

## Personvern og kontroll

Brukeren må kunne:

- koble til Strava
- se tilkoblingsstatus
- se sist synket
- velge hva som importeres
- slette importerte økter i appen
- koble fra Strava

Ved frakobling:

- backend bør slette lagrede tokens
- appen bør beholde allerede importerte økter, med mindre brukeren eksplisitt ber om sletting

## Anbefalt implementeringsrekkefølge

### v125 - Strava design og lokal normalisering

- Opprett `domain-strava.js`
- Lag rene mappingfunksjoner
- Test mapping fra eksempeldata til `completed`
- Ingen ekte API-kall ennå

### v126 - Import-preview uten ekte OAuth

- Lag UI for import-preview basert på lokal mock-data
- Test match mot planlagte økter
- Test duplikatbeskyttelse

### v127 - Backend OAuth

- Opprett backend-endepunkter for OAuth og token refresh
- Lag Strava app i Strava Developer Dashboard
- Lag trygg tokenlagring per Firebase-bruker

### v128 - Ekte sync

- `Koble til Strava`
- `Hent siste økter`
- importer etter brukerbekreftelse
- vis status og feil

### Senere - Webhooks og streams

- Webhooks for nye aktiviteter
- Streams for puls-/paceanalyse
- Gylne sone-analyse basert på pulsserie

## Åpne avklaringer

Før faktisk API-bygging bør vi avklare:

1. Hvilken backend skal brukes: Firebase Cloud Functions, Cloudflare Worker, Vercel eller annet?
2. Skal private Strava-økter importeres, eller holder `activity:read`?
3. Skal import automatisk opprette fullførte økter, eller alltid kreve bekreftelse?
4. Skal importerte Strava-økter kunne overskrive manuelle felt senere?
5. Hvor lenge skal appen hente bakover første gang: 30 dager, 90 dager eller manuelt valgt periode?
