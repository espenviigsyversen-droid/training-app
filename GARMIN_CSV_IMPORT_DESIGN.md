# Garmin CSV-import

Design- og datakontrakt for v176a-v176b. Dokumentet bygger på den faktiske Garmin Connect-eksporten `Activities_5_8_2026.csv`, kontrollert 5. august 2026.

**Implementeringsstatus:** v176a-adapteren, v176b-importveiviseren og senere detalj-/innsiktsrunder gjennom v176g er bygget. Runtime-versjonen er `v176g`.

## Mål

Importen skal redusere manuell registrering uten å gjøre Garmin til en parallell treningsmodell. Den skal:

- lese Garmin Activities CSV lokalt i nettleseren
- normalisere sikre, objektive felt til en forhåndsvisning
- foreslå duplikater og treff mot eksisterende eller planlagte økter
- la brukeren velge `berik eksisterende`, `opprett ny` eller `hopp over`
- bevare manuelle og subjektive felt som sannhetskilde
- lagre et minimert `externalData.garmin`-objekt, aldri rå CSV-rad
- kunne utvides med en annen adapter senere uten å endre importveiviserens grunnkontrakt

## Avgrensning

v176 omfatter lokal filimport med eksplisitt forhåndsvisning og bekreftelse.

Utenfor scope:

- Garmin API, OAuth, tokens eller automatisk bakgrunnssynk
- Strava API
- automatisk endring av plan eller coach-policy
- automatisk klassifisering som race/testløp
- import av pulssonefordeling når eksporten ikke inneholder sonedata
- detaljert styrkeøvelse per sett; eksporten har bare totalsummer
- nedoverbelastningsmodellen fra v177

`Activities_5_8_2026.csv` er personlig treningsdata og skal ikke lastes opp til GitHub.

## Verifisert eksportformat

Eksempelfilen har:

- 106 aktiviteter og 44 kolonner
- engelske overskrifter
- komma som skilletegn og doble anførselstegn rundt verdier
- `--` som manglende verdi
- lokal dato og klokkeslett uten tidssone, eksempelvis `2026-08-04 16:21:02`
- heltall med tusenskilletegn, eksempelvis `"8,006"`
- negative Body Battery-verdier med innledende apostrof, eksempelvis `'-9`
- varighet som både `HH:MM:SS` og `HH:MM:SS.d`
- ingen Garmin activity ID
- ingen pulssoneprosent eller tid per pulssone
- `Aerobic TE`, men ikke separat anaerob Training Effect eller appens semantiske effektkategori

Aktivitetstyper i filen er løping, mølleløping, gange, styrke, bassengsvømming, sykling, innendørssykling, fottur, klassisk langrenn og alpint.

## Adapterkontrakt

`garmin-csv-import.js` er en ren ES-modul uten DOM, Firebase eller global state.

```js
parseGarminActivitiesCsv(csvText) => {
  version: 1,
  source: 'garmin_activities_csv',
  headers: [],
  activities: [{
    rowNumber,
    fingerprint,
    activityCode,
    completedDraft
  }],
  rejectedRows: [{ rowNumber, reason }]
}
```

`completedDraft` er en forhåndsvisning, ikke et ferdig Firestore-dokument. ID, eventuell kobling til planlagt økt, templatesnapshot, `completedAt` og `importedAt` opprettes først etter brukerens valg i v176b.

Parseren:

- håndterer UTF-8 BOM, CRLF/LF, siterte komma og doble anførselstegn
- krever `Activity Type`, `Date`, `Title`, `Time` og `Distance`
- avviser feil feltantall, ugyldig starttid, varighet eller distanse per rad
- returnerer radnummer og feilårsak uten å sende rå rad videre

## Aktivitetstyper og enheter

| Garmin | App-type | Aktivitetsmiljø | Distanse | Pace-felt |
|---|---|---|---:|---|
| Running | Løping | Utendørs | km | sek/km |
| Treadmill Running | Løping | Tredemølle | km | sek/km |
| Walking / Hiking | Gange | Utendørs | km | sek/km |
| Pool Swim | Svømming | Basseng | meter til km | sek/100 m, bare Garmin-data |
| Cycling | Sykling | Utendørs | km | Garmin-feltet tolkes som km/t |
| Indoor Cycling | Sykling | Innendørs | km | Garmin-feltet tolkes som km/t |
| Cross Country Classic Skiing | Ski | Utendørs | km | Garmin-feltet tolkes som km/t |
| Resort Skiing | Alpint | Utendørs | km | Garmin-feltet tolkes som km/t |
| Strength Training | Styrke | Ikke angitt | km/0 | ingen pace |
| Ukjent | Annet | Ikke angitt | km | ingen automatisk pace-tolkning |

Aktivitetsspesifikk tolkning er nødvendig fordi kolonnen `Avg Pace` inneholder `7:37` for løping, `3:04` for bassengsvømming og desimaltall som `9.8` for sykling.

## Kanoniske felt

Disse feltene kan inngå direkte i et nytt eller beriket `completed`-dokument:

| Garmin | Kanonisk felt | Regel |
|---|---|---|
| Date | `date` | dato beholdes; eksakt lokal starttid lagres i Garmin-proveniens |
| Title | `manualName` | brukes bare ved ny økt, ikke til å overskrive eksisterende navn |
| Activity Type | `activityType` i draft | omsettes til norsk app-type; templatesnapshot avgjøres i v176b |
| Activity Type | `activitySetting` | omsettes til kildeuavhengig aktivitetsmiljø når typen er kjent |
| Time | `durationSeconds` | primær varighet |
| Distance | `distanceKm` | bassengsvømming konverteres fra meter |
| Avg HR / Max HR | `avgHeartRate` / `maxHeartRate` | heltall |
| Avg Pace | `paceSecondsPerKm` | bare løping, gange og fottur |
| Total Ascent | `elevationGainM` | stigning |

`averageSpeedKmh`, visningsvarighet og visningspace avledes deterministisk.

Importen setter ikke automatisk:

- RPE, følelse, readiness eller smerte/kroppssignal
- notater
- race-resultat
- planrolle, intensitet eller coach-formål
- `trainingEffectType` eller `trainingEffectCategory`
- `heartRateZoneDistribution`

Garmins numeriske `Aerobic TE` er ikke samme felt som appens kategoriske Training Effect. Verdien bevares derfor under Garmin-proveniens.

## `externalData.garmin` v1

Objektet er valgfritt og bakoverkompatibelt:

```js
externalData: {
  garmin: {
    version: 1,
    adapter: 'activities_csv',
    fingerprint: 'garmin_csv_v1_...',
    fingerprintVersion: 1,
    startedAtLocal: '2026-08-04T16:21:02',
    activityType: 'Running',
    activityCode: 'running',
    sourceDistance: { value: 6.44, unit: 'km' },
    aerobicTrainingEffect: 3.2,
    movingTimeSeconds: 2936,
    elapsedTimeSeconds: 2942,
    cadence: { averageSpm: 164, maxSpm: 181 },
    pace: { averagePaceSecondsPerKm: 457 },
    totalDescentM: 94,
    averagePowerW: 246,
    bodyBatteryDrain: -9,
    importedAt: '...'
  }
}
```

Tomme felt fjernes. CSV-raden, ukjente kolonner, filsti og personlig filnavn lagres ikke.

## Fingeravtrykk og duplikater

Eksporten mangler stabil Garmin-ID. Fingeravtrykk v1 bygges av:

```text
normalisert aktivitetstype
+ lokal starttid med sekund
+ avrundet varighet i sekunder
+ avrundet distanse i meter
```

Resultatet hashes til `garmin_csv_v1_<16 hex>`. Både algoritmeversjon og normaliserte grunnfelt bevares slik at senere adaptere kan migreres kontrollert.

Duplikatpolicy:

1. Samme lagrede Garmin-fingeravtrykk er `allerede importert`.
2. Fingeravtrykk skal aldri alene koble til en planlagt økt; bruker velger fortsatt handling.
3. Eldre manuelle økter uten proveniens vurderes gjennom matchreglene.
4. Importen skal være idempotent: samme CSV importert på nytt oppretter ikke en ny kopi av allerede godkjente aktiviteter.

## Matchnivå

Matchfunksjonen vurderer dato, aktivitetstype, varighet, distanse og navn:

- `secure`: samme dato og kompatibel aktivitetstype, samt minst én sterk støtte fra varighet, distanse eller navn
- `possible`: samme dato med delvis støtte, men ikke nok til sikker kobling
- `none`: annen dato eller utilstrekkelig likhet

`secure` betyr bare et sterkt forslag i UI. Brukeren må fortsatt velge `berik eksisterende`.

Løping og mølleløping regnes som kompatible, men kildeaktiviteten bevares. Match mot planlagt økt må ignorere planlagte dokumenter som allerede er fullført.

## Merge- og overskrivingspolicy

Ved `berik eksisterende`:

- bare tomme kanoniske felt fylles automatisk
- manuelle verdier vinner som standard
- subjektive felt kan aldri overskrives av adapteren
- et objektivt felt kan bare overskrives når brukeren eksplisitt har valgt akkurat det feltet i konfliktvisningen
- annen ekstern proveniens under `externalData` bevares
- Garmin-proveniens oppdateres som én kontrollert blokk

Tillatte objektive berikingsfelt er varighet, distanse, fart/pace, snitt-/makspuls og stigning. Navn, dato, templatesnapshot, RPE, kroppssignal og notater ligger utenfor automatisk merge.

## Pulssoner

Den verifiserte CSV-en inneholder ikke pulssoneprosent eller sonetid. v176 skal derfor:

- la `heartRateZoneDistribution` være urørt
- ikke beregne sonefordeling fra bare snitt-/makspuls
- ikke knytte ukjente Garmin-soner til aktiv labprofil
- beholde dagens manuelle v174-flyt

Hvis en senere eksport har sonetider, kreves en ny adapterkontrakt og eksplisitt avklaring av om Garmins sonegrenser matcher øktens soneprofil-snapshot.

## Sikkerhet og datatrygghet

- Alle ikke-dupliserte aktiviteter starter som `Krever valg`, også når ingen eksisterende økt matcher. `Opprett ny økt` er tilgjengelig, men velges aldri automatisk.
- Import kan ikke bekreftes før brukeren eksplisitt har valgt handling for hver ikke-dupliserte aktivitet. Bekreftede duplikater kan fortsatt låses automatisk til `Hopp over`.
- CSV parses lokalt og sendes ikke til backend eller AI.
- Eksterne tekstfelt er ubetrodd input og skal escapes ved HTML-rendering.
- Filstørrelse, radantall og tekstlengder skal begrenses i v176b.
- Forhåndsvisning skriver ingenting.
- Før godkjent batch tas recovery snapshot.
- Bulkimport er inkrementell og må ikke bruke JSON-backupens `replace()`-flyt.
- Repository må rapportere delvis feil dersom flere Firestore-batcher er nødvendige.
- Offline snapshot-fallback er read-only og skal blokkere importskriving.

## Modulgrenser

- `garmin-csv-import.js`: parsing, mapping, normalisering, fingeravtrykk, duplikater, matching og sikker merge
- `training-import-controller.js`: ren forhåndsvisningsmodell, handlingsplan, konfliktfelt og materialisering av nye, berikede eller plan-koblede økter
- `training-import-ui.js`: lokal fillesing, forhåndsvisning, treffgrunnlag, konflikter og eksplisitte handlinger med injiserte callbacks
- `training-repository.js`: kontrollert, chunket batch for godkjente `completed`- og `planned`-writes med delvis fremdriftsmetadata ved feil
- `app-state.js`: whitelist-normalisering av valgfritt `externalData.garmin`
- `app.js`: kun state-orchestrering, recovery, bekreftelse og liten persistence-wrapper

`app.js` skal ikke parse CSV, beregne fingeravtrykk, matche aktiviteter eller implementere merge-policy.

## v176a testkrav

- korrekt parsing av siterte komma, BOM, CRLF og desimaltid
- alle 44 kolonner i eksempelkontrakten kan leses uten forskyvning
- `--`, tusenskilletegn og apostrof-negativ normaliseres riktig
- løpedistanse beholdes i km; bassengsvømming konverteres fra meter
- aktivitetstyper mappes deterministisk
- fingerprint er stabilt og endres når et grunnfelt endres
- feil rad avvises uten å stoppe øvrige gyldige rader
- sikkert, mulig og manglende treff klassifiseres
- lagret fingerprint oppdages som duplikat
- merge fyller tomme objektive felt uten å overskrive manuelle eller subjektive felt
- rå CSV-rad og pulssonefordeling finnes ikke i output

## v176b akseptansekriterier

- filen leses lokalt og ingenting skrives før bekreftelse
- hver aktivitet viser handling og matchgrunnlag
- allerede importerte aktiviteter kan ikke opprettes på nytt som standard
- usikre treff krever aktivt valg
- manuelle felt beholdes og konflikter vises før skriving
- importresultat skiller importert, beriket, hoppet over, duplikat og feil
- recovery snapshot finnes før første write
- nye runtime-moduler ligger i PWA app shell
- appversjon, cache og synlig Setup-versjon samsvarer
