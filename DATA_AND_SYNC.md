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
└── settings/preferences
```

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
