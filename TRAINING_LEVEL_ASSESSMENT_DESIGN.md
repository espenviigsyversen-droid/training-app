# Transparent treningsnivåvurdering v1

## Formål

V160 skal hjelpe brukeren å forstå tre ulike ting uten å blande dem:

1. **Treningsmodenhet** - hvor stabilt og repeterbart kroppen tåler treningen.
2. **Kapasitet og prestasjon** - VO2max mot alder/kjønn og egen utvikling i PB/testløp.
3. **Motivasjonsnivå** - et synlig nivå som kan oppnås og beholdes, uten at en dårlig uke nedgraderer brukeren.

Vurderingen er rådgivende. Den er ikke en medisinsk vurdering, biologisk alder eller automatisk fasit for hvor hardt brukeren bør trene.

## v160a-e

### v160a - Evidens, begreper og datamodell

- Fem motivasjonsnivåer: Fundament, Stabil, I utvikling, Godt trent og Erfaren.
- Nivågrunnlaget bygger på et 84-dagers vindu og fem forklarbare dimensjoner.
- Innført bakoverkompatibelt felt `settings.trainingLevelProgress` med versjon, høyeste bekreftede nivå og historikk.
- Nivået i `trainingProfile.level` forblir coachens bekreftede nivå og endres aldri automatisk.

### v160b - Ren domenemotor

`domain-fitness.js` eier ren, testbar logikk:

- `vo2AgeBenchmark()`
- `personalBestEvidence()`
- `assessTrainingLevel()`
- `normalizeTrainingLevelProgress()`
- `confirmedTrainingLevelProgress()`

Motoren returnerer score, foreslått nivå, datadekning, dimensjoner, sikkerhetsblokkeringer, manglende data og neste konkrete kriterier.

### v160c - Forklarbar Innsikt-visning

Innsikt viser:

- beregnet nivågrunnlag og score
- datadekning
- fem dimensjoner med kort forklaring
- VO2max mot alders-/kjønnsreferanse
- egen PB-/testløputvikling
- hva som mangler før neste nivå
- tydelig sikkerhetsforklaring når oppgradering må vente

Detaljer er sammenfoldet som standard for å holde mobilvisningen rolig.

### v160d - Gamification og bekreftet progresjon

- Et nytt nivå blir først et oppnådd nivå etter eksplisitt bekreftelse.
- Høyeste bekreftede motivasjonsnivå beholdes selv om en senere periode er svakere.
- Sikkerhetssignaler blokkerer oppgradering, men fjerner ikke tidligere mestring.
- Historikken lagrer dato, fra-/til-nivå, assessment-versjon og eventuell bekreftet coach-nivåendring.
- PB-fremgang på samme distanse teller som positivt prestasjonssignal.

### v160e - AI-context

AI-coachen får bare et sanitert sammendrag av nivåvurderingen:

- nivågrunnlag, score og datadekning
- dimensjoner og korte begrunnelser
- sikkerhetsblokkeringer
- om nivået er klart for brukerbekreftelse

AI kan forklare vurderingen, men kan aldri bekrefte nivå, skrive profilendringer eller overstyre skadesignal, comeback eller belastningsvern.

## Dimensjoner og vekting

| Dimensjon | Vekt | Hovedgrunnlag |
|---|---:|---|
| Kontinuitet | 30 % | Aktive uker og økter siste 12 uker |
| Kontrollert kvalitet | 25 % | Repeterbare kvalitetsøkter, RPE og smerterespons |
| Tåleevne og kroppssignal | 20 % | Aktive/negative signaler siste 28 dager |
| Kapasitet mot alder | 15 % | VO2max mot relevant alders-/kjønnsreferanse |
| PB og testløp | 10 % | Egen forbedring på gjentatt distanse |

Vektene er produktpolicy, ikke kliniske terskler. De er samlet og versjonert i domenemodulen, og må endres sammen med assessment-versjon og tester.

## Referanser

### VO2max

V1 bruker HUNT 3 som primær alders-/kjønnsreferanse fordi datasettet er norsk og basert på direkte tredemøllemåling av VO2max hos friske voksne. FRIEND brukes som intern kryssjekk av retningen i alders- og kjønnseffekten.

- HUNT 3 Fitness Study: <https://doi.org/10.1371/journal.pone.0064319>
- FRIEND Registry: <https://pmc.ncbi.nlm.nih.gov/articles/PMC4919021/>

Garmin-estimert VO2max og laboratoriemålt VO2max er ikke samme målemetode. UI skal derfor vise referansen som sammenligning, ikke diagnose eller eksakt rangering.

### PB og aldersgradering

PB/testløp brukes i v1 til å vise brukerens egen fremgang på samme distanse. En forenklet, hjemmelaget aldersgradering skal ikke brukes. Offisiell WMA-aldersgradering kan vurderes senere når en komplett og verifisert standardtabell med riktig distanse/kjønn/alder er tilgjengelig.

- World Masters Athletics: <https://world-masters-athletics.org/documents/competition-rules/>

## Bevisste avgrensninger

- **Ingen biologisk alder:** Et samlet biologisk alderstall ville gi mer presisjon enn datagrunnlaget forsvarer.
- **Ingen absolutt HRV-klasse:** HRV er svært individuelt og vurderes bedre mot brukerens egen baseline og trend.
- **Ingen BMI-score:** BMI kan eventuelt vises som nøytral profilinformasjon, men skal ikke drive treningsnivå eller coachbelastning.
- **Ingen automatisk oppgradering:** Brukeren ser grunnlag og konsekvens før bekreftelse.
- **Ingen automatisk nedgradering:** Dagens sikkerhetsvurdering kan være konservativ uten å ta fra brukeren et oppnådd motivasjonsnivå.
- **Ingen race-resultat som sikkerhetsfasit:** En god PB kan ikke overstyre smerte, comeback eller rask belastningsøkning.

## Datamodell

```js
settings.trainingLevelProgress = {
  version: 1,
  highestTier: 'foundation',
  history: [
    {
      id: 'fitness-2026-07-16-developing',
      date: '2026-07-16',
      fromTier: 'stable',
      toTier: 'developing',
      fromCoachLevel: 'building_beginner',
      toCoachLevel: 'intermediate',
      assessmentVersion: 1,
      reason: 'I utvikling er klart for bekreftelse.'
    }
  ]
}
```

Gamle settings uten feltet normaliseres trygt. Feltet følger eksisterende settings-backup, Firestore-synk og lokal snapshot.

## Sikkerhetsregler

Oppgradering blokkeres når ett av disse er aktivt:

- aktivt kroppssignal/skadesignal
- aktiv comeback-protokoll
- høy/rød belastningsøkning

Blokkeringen skal være synlig og forklart. Den påvirker ikke registrerte økter, PB, challenges eller tidligere oppnådd nivå.

## Testkrav

- VO2-referanse velges etter alder og kjønn.
- Manglende personprofil gir trygg fallback.
- Gjentatt PB på samme distanse gir egen fremgang.
- Kontinuitet, kvalitet, kropp, kapasitet og prestasjon kombineres deterministisk.
- Sikkerhetssignal blokkerer oppgradering.
- Bekreftelse er eksplisitt, versjonert og begrenset.
- AI-context inneholder bare sanitert vurdering.
- Backend avviser ugyldig assessment-score eller form.
- Gamle settings fungerer uendret.

