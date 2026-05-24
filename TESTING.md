# TESTING.md

Hvordan appen testes lokalt.

## Minimum før opplasting

Kjør alltid:

```powershell
node --check app.js
node --check service-worker.js
node tests\stability-tests.js
```

## Hva testene dekker

`tests/stability-tests.js` sjekker blant annet:

- at `APP_VERSION` matcher `CACHE_NAME`
- at import erstatter alle relevante collections
- at `safeStateWrite()` finnes og brukes bredt
- at lokal recovery snapshot kan nås fra UI
- at service worker cacher nødvendige app shell-filer
- at challenge-progress viser gjenstående distanse og håndterer fullførte mål
- at trafikklyset gir grønn/gul/rød etter søvn, energi, hvilepuls og trappetest
- at gylne sone-prosentene matcher treningsnivå
- at ukeplan-datoer hopper over planlagte og blokkerte dager
- at neste uke-planlegging prioriterer ikke-sammenhengende dager når mulig

## Hva testene ikke dekker ennå

Disse bør legges til senere:

- coach-context og coach-note
- import av reell backupfil
- full Firestore-sync med testbruker
- visuell regresjon i mobilvisning

## Lokal nettlesertest

Appen bør testes via lokal server, ikke bare åpnes som fil.

Eksempel:

```text
http://127.0.0.1:8765/
```

Full innlogging/Firebase-test krever nettverk og bør bare kjøres etter avtale.

## Manuell smoke-test

Etter større endringer:

1. Åpne appen lokalt
2. Logg inn hvis nettverkstest er avtalt
3. Sjekk Hjem
4. Planlegg en økt
5. Marker en dag som ikke-treningsdag
6. Loggfør en historisk økt
7. Lag eller oppdater en challenge
8. Eksporter backup
9. Kjør `Oppdater app`
