# AI-vurdering av gjennomført økt (v176e)

## Bakgrunn og mål

Den regelbaserte coach-vurderingen skal fortsatt være rask, lokal og alltid tilgjengelig. v176e legger i tillegg til en eksplisitt knapp som lar brukeren be OpenAI om en mer nyansert vurdering av én gjennomført økt.

Målet er en kort og nyttig vurdering av hva økten viser, samsvar med planen og et konkret neste steg. AI-kallet skjer aldri automatisk.

## Scope og ikke-scope

- Knappen `Få AI-vurdering` vises i detaljene for en gjennomført økt.
- Et nytt kall krever et aktivt trykk. En lagret vurdering kan oppdateres med `Vurder på nytt`.
- Eksisterende nøkkeladministrasjon, autentisering, rate limit, dagsbudsjett og modellprofiler gjenbrukes.
- Ingen nettsøk, chat-historikk eller prosjektinstrukser brukes.
- AI-vurderingen endrer aldri øktdata, plan, dagsform eller appens autoritative sikkerhetsbeslutning.
- Aggregert Garmin CSV inneholder ikke tidsserier. Modellen skal derfor ikke hevde når i økten puls, tempo eller effekt steg eller falt.

## Datakontrakt

Frontend bygger et versjonert og begrenset `workout`-objekt fra normaliserte data:

- dato, navn, aktivitetstype, intensitet, rolle og formål
- varighet, distanse, fart/tempo, høyde og runder
- snitt-/makspuls og prosentvis tid i pulssoner
- RPE, gjennomføring, følelse, strukturerte dagsformverdier og smerte før/etter
- utvalgte objektive belastnings-, effekt-, kadens-, energi- og miljøverdier
- appens regelbaserte belastnings- og planvurdering

Den eksisterende, personvernfiltrerte AI-coach-contexten følger med for plan, treningsbelastning, sikkerhetssignaler og neste planlagte økt. Frie øktnotater, kroppsnotater, identitet, secrets og Firestore-metadata utelates.

Backend validerer størrelsen og tillatte felt på nytt før leverandørkallet.

## Lagret resultat

`completed.aiCoachAssessment` er bakoverkompatibelt og valgfritt:

```js
{
  version: 1,
  headline: string,
  evidence: string[],
  planFit: string,
  nextStep: string,
  uncertainty: string,
  generatedAt: ISODate,
  inputFingerprint: string,
  modelProfileId: string,
  modelLabel: string
}
```

Full prompt, skjult resonnering, rått leverandørsvar og API-nøkkel lagres ikke. Et deterministisk fingerprint av det avgrensede øktgrunnlaget gjør at UI kan merke vurderingen som utdatert etter redigering eller ny import.

## Arkitektur og sikkerhet

- `domain-ai-workout-assessment.js`: ren inputbygging, fingerprint og normalisering.
- `ai-coach-client.js`: autentisert callable-klient.
- `functions/ai/workout-assessment.js`: validering, nøkkel, rate limit, modellvalg og sikkert strukturert svar.
- `functions/ai/workout-assessment-prompt.js`: avgrenset prompt med sikkerhets- og evidenskrav.
- `workout-history-ui.js`: presentasjon og eksplisitt knapp.
- `app.js`: liten wrapper for kall, lagring og ny rendering av modal.

Backend er read-only mot treningsdata. Bare frontend lagrer et validert resultat gjennom eksisterende treningsrepository etter et vellykket kall.

## UI/UX

- Den lokale `Coach-vurdering` beholdes som før.
- `AI-vurdering` ligger rett under og skilles tydelig fra den lokale vurderingen.
- Resultatet viser konklusjon, 2–3 observasjoner, samsvar med planen og neste steg. Usikkerhet vises bare når den har praktisk betydning.
- Knappen viser ventetilstand og kan ikke dobbeltklikkes mens kallet pågår.
- Feil lagres ikke på økten; brukeren får en konkret melding og kan prøve igjen.

## Tester og akseptansekriterier

- Ingen AI-kall uten aktivt knappetrykk.
- Ingen nettsøk eller automatiske endringer i plan/økt.
- Ugyldig/stort input og ustrukturert leverandørsvar avvises trygt.
- Gjenbruk av autentisering, kryptert nøkkel, rate limit, modellprofil, `store: false` og stabil `safety_identifier` er testet.
- Normalisering tåler gamle økter uten feltet og backup/Firestore round-trip.
- Lagret vurdering vises etter ny åpning og merkes utdatert når input-fingerprint endres.
