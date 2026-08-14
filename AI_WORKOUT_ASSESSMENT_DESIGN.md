# AI-vurdering av gjennomført økt (v176e / v176n)

## Bakgrunn og mål

Den regelbaserte coach-vurderingen skal fortsatt være rask, lokal og alltid tilgjengelig. v176e legger i tillegg til en eksplisitt knapp som lar brukeren be OpenAI om en mer nyansert vurdering av én gjennomført økt.

Målet er en kort og nyttig vurdering av hva økten viser, samsvar med planen og et konkret neste steg. AI-kallet skjer aldri automatisk.

v176n skiller rollene tydeligere. Den lokale vurderingen eier sikkerhet og plansamsvar. AI-vurderingen skal bruke dette som rekkverk, men tilføre en selvstendig syntese av hva som skiller seg ut, hva økten kan bety og hvordan den eventuelt henger sammen med nylige sammenlignbare økter eller brukerens mål.

## Scope og ikke-scope

- Knappen `Få AI-vurdering` vises i detaljene for en gjennomført økt.
- Et nytt kall krever et aktivt trykk. En lagret vurdering kan oppdateres med `Vurder på nytt`.
- Eksisterende nøkkeladministrasjon, autentisering, rate limit, dagsbudsjett og modellprofiler gjenbrukes.
- Ingen nettsøk, chat-historikk eller prosjektinstrukser brukes.
- AI-vurderingen endrer aldri øktdata, plan, dagsform eller appens autoritative sikkerhetsbeslutning.
- Aggregert Garmin CSV inneholder ikke tidsserier. Modellen skal derfor ikke hevde når i økten puls, tempo eller effekt steg eller falt.
- AI-en skal ikke parafrasere appens `loadReason`, `planSummary` eller `planReasons` som hovedinnhold når ingen sikkerhetsgrunn krever det.
- Tomtilstanden i øktdetaljen skal være en kompakt handlingsrad med et tilgjengelig gnistikon, ikke et stort resultatkort.

## Datakontrakt

Frontend bygger et versjonert og begrenset `workout`-objekt fra normaliserte data:

- dato, navn, aktivitetstype, intensitet, rolle og formål
- varighet, distanse, fart/tempo, høyde og runder
- snitt-/makspuls og prosentvis tid i pulssoner
- RPE, gjennomføring, følelse, strukturerte dagsformverdier og smerte før/etter
- utvalgte objektive belastnings-, effekt-, kadens-, energi- og miljøverdier
- appens regelbaserte belastnings- og planvurdering
- et valgfritt, aggregert `comparisonContext` uten rå historikk: miljø, pacekilde, antall sammenlignbare rolige løpeøkter, medianer, differanser og vurderingssikkerhet

Den eksisterende, personvernfiltrerte AI-coach-contexten følger med for plan, treningsbelastning, sikkerhetssignaler og neste planlagte økt. Frie øktnotater, kroppsnotater, identitet, secrets og Firestore-metadata utelates.

`comparisonContext` beregnes lokalt fra maksimalt seks tidligere rolige løpeøkter i samme aktivitetsmiljø innen 180 dager. Utendørs brukes GAP når måløkten har GAP; ellers brukes vanlig pace bare som et uttrykkelig svakere grunnlag. Kandidater må ha omtrent samme puls og forsvarlig varighetsområde. Færre enn tre treff gir `insufficient`, og AI-en får ikke lov til å hevde utvikling fra dette.

Backend validerer størrelsen og tillatte felt på nytt før leverandørkallet.

## Lagret resultat

`completed.aiCoachAssessment` er bakoverkompatibelt og valgfritt. v1 beholdes lesbart. Nye vurderinger lagres som v2:

```js
{
  version: 2,
  headline: string,
  summary: string,
  standouts: string[],
  trainingMeaning: string,
  goalConnection: string,
  nextStep: string,
  uncertainty: string,
  generatedAt: ISODate,
  inputFingerprint: string,
  modelProfileId: string,
  modelLabel: string
}
```

Full prompt, skjult resonnering, rått leverandørsvar og API-nøkkel lagres ikke. Et deterministisk fingerprint av det avgrensede øktgrunnlaget gjør at UI kan merke vurderingen som utdatert etter redigering eller ny import.

Backend godtar både workout-schema v1 og v2. v1-klienter får det opprinnelige svarformatet; v2-klienter får den nye kontrakten. Dette gjør det mulig å deploye backend før GitHub Pages uten et inkompatibelt mellomrom.

## Arkitektur og sikkerhet

- `domain-ai-workout-assessment.js`: ren inputbygging, fingerprint og normalisering.
- `domain-ai-workout-context.js`: ren og personvernbegrenset historisk sammenligningskontekst.
- `ai-coach-client.js`: autentisert callable-klient.
- `functions/ai/workout-assessment.js`: validering, nøkkel, rate limit, modellvalg og sikkert strukturert svar.
- `functions/ai/workout-assessment-prompt.js`: avgrenset prompt med sikkerhets- og evidenskrav.
- `workout-history-ui.js`: presentasjon og eksplisitt knapp.
- `app.js`: liten wrapper for kall, lagring og ny rendering av modal.

Backend er read-only mot treningsdata. Bare frontend lagrer et validert resultat gjennom eksisterende treningsrepository etter et vellykket kall.

## UI/UX

- Den lokale `Coach-vurdering` beholdes som før.
- `AI-vurdering` ligger rett under og skilles tydelig fra den lokale vurderingen.
- Uten lagret resultat vises bare en kompakt rad med kort forklaring og et generisk gnistikon med minst 44 × 44 px trykkflate, `aria-label` og `title`.
- Resultatet viser en kort overskrift, syntese, 2–3 konkrete særtrekk, treningsbetydning, valgfri målkobling og neste steg. Usikkerhet vises bare når den har praktisk betydning.
- `Vurder på nytt` blir et lite ikon i resultatets toppkant. Ventetilstand skal kunne forstås av både syn og skjermleser.
- Knappen viser ventetilstand og kan ikke dobbeltklikkes mens kallet pågår.
- Feil lagres ikke på økten; brukeren får en konkret melding og kan prøve igjen.

## Tester og akseptansekriterier

- Ingen AI-kall uten aktivt knappetrykk.
- Ingen nettsøk eller automatiske endringer i plan/økt.
- Ugyldig/stort input og ustrukturert leverandørsvar avvises trygt.
- Gjenbruk av autentisering, kryptert nøkkel, rate limit, modellprofil, `store: false` og stabil `safety_identifier` er testet.
- Normalisering tåler gamle økter uten feltet og backup/Firestore round-trip.
- Lagret vurdering vises etter ny åpning og merkes utdatert når input-fingerprint endres.
- Sammenligningskonteksten inneholder aldri rå økter eller fritekst og avstår fra historisk konklusjon ved færre enn tre treff.
- Prompten for v2 forbyr unødvendig gjentakelse av den regelbaserte vurderingen og krever et gyldig v2-JSON-objekt.
- Kompakt tomtilstand og resultatkort fungerer uten horisontal overflow på mobil og med tastatur/skjermleser.
