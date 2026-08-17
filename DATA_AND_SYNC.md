# DATA_AND_SYNC.md

Oversikt over data, lagring, sync og datatrygghet.

## Firestore-struktur

Data lagres per bruker under:

```text
users/{uid}/
├── templates/
├── planned/
├── completed/
├── wellness/
├── challenges/
├── blockedDays/
├── raceResults/
├── continuityFreezes/
├── heartRateZoneSets/
├── trainingPlans/
├── weeklyTargetSnapshots/
└── settings/preferences
```

`weeklyTargetSnapshots/{weekStart}` fryser det effektive øktmålet for hver avsluttet uke fra og med `settings.preferences.weeklyTargetSnapshotPolicy.effectiveFrom`. Uker før denne datoen bruker den gamle logikken og det ordinære `goals.weeklySessionsTarget`, slik at eksisterende streak ikke endres. Snapshotet skrives ved første autentiserte synkronisering etter at uken er avsluttet, før historisk kontinuitet renderes eller nye treningsdata skrives. Et nådd redusert mål teller som ordinær trening; et kontinuitetsfryskort vurderes bare når målet ikke er nådd.

`trainingPlans/{planId}` lagrer normaliserte fireukersblokker og revisjoner. Samlingen er med i samme backup-, replace-, lokal snapshot- og recovery-sirkel som øvrige treningsdata. v176t innfører samlingen og en skrivefri materialiseringspreview; ingen kalenderøkt kan opprettes fra controlleren før preview-porten er verifisert.

AI-chat lagres separat under `aiChatUsers/{uid}/projects/...` og inngår ikke i vanlig treningsbackup/import. Den separate roten er nødvendig fordi Firebase-prosjektet deles med andre apper og har en eksisterende rekursiv eierregel under `users/{uid}`. Frontend kan lese egne chatdokumenter, mens oppretting, endring, arkivering og rekursiv sletting skal gå via autentisert backend.

## Lokal state

Appen holder aktiv datastruktur i `state` i `app.js`.

Hovedfelter:

- `templates`
- `planned`
- `completed`
- `wellness`
- `challenges`
- `blockedDays`
- `raceResults`
- `continuityFreezes`
- `heartRateZoneSets`
- `trainingPlans`
- `weeklyTargetSnapshots`
- `settings`

## Offline og snapshot

Appen bruker to lag:

1. Firestore IndexedDB persistence
2. Egen lokal snapshot i `localStorage`

Lokal snapshot brukes som fallback når appen ikke klarer å laste fra Firestore.

## Trygg skriveflyt

Sentrale brukerhandlinger bør bruke `safeStateWrite()`.

Mønster:

```text
1. Ta snapshot av gammel state
2. Endre state lokalt
3. Lagre lokal snapshot
4. Render UI
5. Skriv til Firestore
6. Hvis feil: restore gammel state og varsle bruker
```

Dette reduserer risikoen for at appen viser en endring som ikke faktisk ble lagret.

## Import

Import skal erstatte data, ikke bare skrive oppå.

Dette avsnittet beskriver full JSON-backupimport. Garmin CSV-import fra v176 er en separat, inkrementell aktivitetsimport: forhåndsvisning skriver ingenting, brukeren velger handling per aktivitet, og bare godkjente nye eller berikede `completed`-dokumenter skrives. Garmin-import skal aldri kalle repositoryets fullstendige `replace()`-flyt.

I v176b opprettes recovery snapshot før første Garmin-write. Godkjente `completed`-dokumenter og eventuelle `planned`-oppdateringer sendes gjennom `trainingRepository.importActivities()` i batcher på maks 400 operasjoner. Ved feil før første commit rulles lokal state tilbake. Ved feil etter en fullført batch lastes Firestore på nytt, og brukeren får oppgitt hvor mange operasjoner som ble lagret. Import blokkeres uten innlogging, nettforbindelse eller i offline snapshot-visning.

Korrekt importflyt:

```text
1. Ta recovery snapshot
2. Parse og normaliser backup
3. Slett eksisterende dokumenter i appens collections
4. Skriv inn backupdata
5. Lagre settings/preferences
6. Render ny state
```

Dette hindrer at gamle Firestore-dokumenter gjenoppstår etter import.

`trainingPlans` og `weeklyTargetSnapshots` følger samme fullstendige eksport-, replace-, lokal snapshot- og recovery-flyt som øvrige treningssamlinger. Gamle backuper uten samlingene normaliseres til tomme lister. Ved første påfølgende autentiserte synkronisering settes `snapshotEffectiveFrom` til inneværende ukes mandag; tidligere uker forblir legacy og rekonstrueres ikke.

## Recovery

Før import og reset lagres en lokal recovery snapshot. Denne kan gjenopprettes fra Setup med:

```text
Gjenopprett sikkerhetskopi
```

Dette er ikke en erstatning for manuell eksport, men et ekstra sikkerhetsnett.

## Risikoer å følge med på

- Delvis Firestore-feil etter lokal UI-endring
- Import av gamle backupfiler som mangler nyere collections
- Endringer i dataformat uten bakoverkompatibel normalisering
- Offline-visning som forveksles med redigerbar sync-modus
- `localStorage` kan nå kvoten når komplett state-snapshot vokser. Firestore/IndexedDB fortsetter, men den egne fallback-snapshoten kan bli utdatert; dette er registrert som eget backlogpunkt.

