# FIREBASE_HOSTING_GUIDE.md

Guide for eventuell senere flytting av Treningsapp fra GitHub Pages til Firebase Hosting.

## Kort vurdering

Det er ikke nødvendig å flytte hosting til Firebase for å bruke Firebase Cloud Functions.

Appen kan fortsatt ligge på GitHub Pages og kalle Firebase Functions via HTTPS.

Firebase Hosting blir likevel attraktivt senere hvis appen skal ha:

- Strava OAuth/backend
- OpenAI/AI-coach backend
- API-ruter som `/api/strava/...` eller `/api/openai/...`
- samlet Firebase-oppsett for Auth, Firestore, Functions og Hosting

## Anbefalt Firebase-prosjekt

Bruk samme Firebase-prosjekt som appen allerede bruker:

```text
home-tasks-app-18de3
```

Fordeler:

- samme Firebase Auth
- samme Firestore-data
- samme brukerbase
- samme Cloud Functions-backend senere

## Hva Codex kan gjøre

Codex kan forberede prosjektet lokalt:

- lage `firebase.json`
- lage `.firebaserc`
- kontrollere at runtime-filer ikke ekskluderes
- dokumentere deployflyt
- kjøre lokale `node --check` og stabilitetstester

Codex bør ikke gjøre uten eksplisitt godkjenning:

- installere Firebase CLI
- kjøre nettverkskommandoer
- logge inn i Firebase
- deploye appen
- endre Firebase Console-oppsett

## Hva brukeren må gjøre eller godkjenne

Brukeren må gjøre eller eksplisitt godkjenne:

- installasjon av Firebase CLI
- `firebase login`
- valg av Firebase-prosjekt
- første deploy
- autorisert domene i Firebase Auth
- eventuelt custom domain

## Steg for steg

### 1. Installer Firebase CLI

Kjøres lokalt av bruker eller etter eksplisitt godkjenning:

```powershell
npm install -g firebase-tools
```

Firebase CLI krever en moderne Node.js-versjon.

### 2. Logg inn i Firebase

```powershell
firebase login
```

Dette åpner nettleser og krever Google-konto.

### 3. Kontroller prosjekt

```powershell
firebase projects:list
```

Se etter:

```text
home-tasks-app-18de3
```

### 4. Legg til Firebase Hosting-konfig

Anbefalt `firebase.json` for denne appen:

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      ".firebaserc",
      "**/.*",
      "tests/**",
      "Kravspesifikasjon/**",
      "Treningsfilosofi/*.pdf",
      "AGENTS.md",
      "ARCHITECTURE.md",
      "BACKLOG.md",
      "DATA_AND_SYNC.md",
      "FIREBASE_HOSTING_GUIDE.md",
      "INTERVALS_DESIGN.md",
      "RELEASE_CHECKLIST.md",
      "STRAVA_INTEGRATION_DESIGN.md",
      "TESTING.md",
      "progress.md"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Anbefalt `.firebaserc`:

```json
{
  "projects": {
    "default": "home-tasks-app-18de3"
  }
}
```

### 5. Deploy hosting

```powershell
firebase deploy --only hosting
```

Etter deploy vil Firebase typisk gi:

```text
https://home-tasks-app-18de3.web.app
https://home-tasks-app-18de3.firebaseapp.com
```

### 6. Legg til autorisert domene for Firebase Auth

I Firebase Console:

```text
Authentication -> Settings -> Authorized domains
```

Kontroller at disse er lagt til:

```text
home-tasks-app-18de3.web.app
home-tasks-app-18de3.firebaseapp.com
```

Dette er viktig for Google-login.

### 7. Test etter deploy

Sjekk:

- appen åpner på Firebase URL
- Google-login fungerer
- Firestore sync fungerer
- PWA installasjon fungerer
- service worker oppdaterer riktig versjon
- Setup viser riktig `APP_VERSION` og cache
- Hjem, Kalender, Logg, Innsikt, Mål og Setup fungerer
- import/backup fungerer

### 8. Hva gjør vi med GitHub Pages?

Etter at Firebase Hosting fungerer kan GitHub Pages:

- beholdes som backup
- stoppes
- eller erstattes helt av Firebase Hosting

Ikke slett GitHub Pages før Firebase-versjonen er testet på både PC og mobil/PWA.

## Senere API-ruter

Når Cloud Functions legges til kan Firebase Hosting senere bruke rewrites til API:

```json
{
  "source": "/api/strava/**",
  "function": "stravaApi"
}
```

eller tilsvarende for OpenAI:

```json
{
  "source": "/api/openai/**",
  "function": "openAiApi"
}
```

Dette bør designes først når backend-funksjonene faktisk bygges.

## Anbefalt rekkefølge når dette tas opp igjen

1. Lag `firebase.json` og `.firebaserc`.
2. Kjør lokale tester.
3. Deploy til Firebase Hosting.
4. Test Auth, Firestore og PWA.
5. La GitHub Pages ligge som backup til Firebase-versjonen er stabil.
6. Bygg Firebase Cloud Functions for Strava/OpenAI senere.
