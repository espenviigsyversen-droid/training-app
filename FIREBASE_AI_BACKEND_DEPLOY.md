# Firebase AI-backend - deploy og sikkerhetsport

## Status

v151-v154-koden er klargjort lokalt. Brukeren har rapportert at nøkkel kan lagres og testes i den deployede appen, men oppdatert v154-statuspersistens må fortsatt deployes og smoke-testes.

GitHub Pages kan beholdes. Frontend bruker Firebase Callable Functions i region `europe-west1`, slik at Firebase Auth-token og CORS håndteres av Firebase SDK.

## Viktig før deploy

Ikke ta nøkkellagringen i bruk før eksisterende Firestore Rules for Firebase-prosjektet `home-tasks-app-18de3` er kontrollert.

Backend lagrer:

```text
apiKeys/{uid}.openai
aiUsage/{uid}
users/{uid}/settings/openai
```

Krav:

- `apiKeys/{uid}` skal ikke kunne leses eller skrives av frontend.
- `aiUsage/{uid}` skal ikke kunne leses eller skrives av frontend.
- `users/{uid}/settings/openai` kan eventuelt være lesbar for eieren, men skal bare inneholde maskert status og aldri klartekstnøkkelen.
- Cloud Functions bruker Admin SDK og trenger ingen frontend-tillatelse i Rules.

En eksplisitt `allow false` er ikke nok dersom en bredere wildcard-regel samtidig gir tilgang, fordi Firestore-tillatelser evalueres som OR. Kontroller derfor hele den eksisterende regelfilen.

Foreslått avgrensning som må flettes inn i dagens regler, ikke erstatte dem:

```text
match /apiKeys/{userId} {
  allow read, write: if false;
}

match /aiUsage/{userId} {
  allow read, write: if false;
}
```

Hvis dagens regler har en global regel som `match /{document=**}` med frontend-tilgang, må den strammes eller gis riktig avgrensning før nøkkelbackend deployes.

## Lokal installasjon senere

Krever nettverk og Firebase CLI:

```powershell
cd functions
npm install
cd ..
firebase login
firebase use home-tasks-app-18de3
```

Ikke kjør deploy før Firestore Rules-porten over er godkjent.

## Deployrekkefølge

1. Kontroller og test eksisterende Firestore Rules.
2. Installer Functions-avhengigheter.
3. Kjør backendtestene.
4. Deploy nøkkel/statusfunksjonene først.
5. Test lagre, maskert status, test og slett nøkkel.
6. Verifiser at frontend ikke kan lese `apiKeys/{uid}` eller `aiUsage/{uid}`.
7. Deploy `aiCoachChat`.
8. Last opp frontendfilene til GitHub Pages.
9. Test v154 på mobil/PWA og desktop, inkludert dynamisk `Tilkoblet`-tag og Chat som sjette fane.

Foreslått Functions-deploy:

```powershell
firebase deploy --only functions:aiCoachStatus,functions:aiCoachSaveOpenAiKey,functions:aiCoachTestOpenAiKey,functions:aiCoachDeleteOpenAiKey
firebase deploy --only functions:aiCoachChat
```

## Konfigurasjon

Serverstandard er `gpt-5.6-luna`, valgt for effektiv chat der appens egen regelmotor allerede har gjort sikkerhetsvurderingen.

Modellen kan overstyres server-side med miljøvariabelen:

```text
OPENAI_COACH_MODEL
```

Ikke legg modellvalg eller API-nøkkel i frontendinnstillinger i første MVP.

## App Check

Callable Functions krever Firebase Auth, men `enforceAppCheck` er foreløpig `false` fordi Treningsapp ikke har App Check konfigurert i frontend.

Før bredere bruk bør Firebase App Check designes og aktiveres i en egen sikkerhetsrunde. Det må gjøres på begge sider samtidig, ellers blokkeres legitime PWA-kall.

## Manuell sikkerhetstest

- Uinnlogget kall avvises.
- Bruker A kan ikke bruke eller teste bruker Bs nøkkel.
- Nøkkelen tømmes fra inputfeltet etter lagring.
- `Server-side` er nøytral sikkerhetsmerking; grønn `Tilkoblet` vises bare når serverstatus er `connected`.
- En mislykket eksplisitt tilkoblingstest oppdaterer status til `invalid` eller `unavailable` uten å returnere nøkkelen.
- Klartekst finnes ikke i `users/{uid}/settings/openai`.
- Frontendlesing av `apiKeys/{uid}` avvises.
- Backup og lokal snapshot inneholder ikke nøkkel eller chat.
- Backendlogger inneholder ikke spørsmål, context eller API-nøkkel.
- Chat har ingen write-path til treningsdata.
- `store: false` sendes til OpenAI Responses API.
- Rate limit og dagsgrense gir lesbar feil.

## Ikke utført i lokal runde

- `npm install`
- Firebase emulator
- deploy
- kontroll av produksjonsregler
- ekte OpenAI-kall
- kontroll av faktiske kostnader
