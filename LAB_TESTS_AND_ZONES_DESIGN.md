# Labtester, pulssoner og sonefordeling

Designgrunnlag for v173a-v174b. Dokumentet beskriver datamodell, brukerflyt og sikkerhetsgrenser før runtime-implementering.

## Formål

Appen skal kunne:

- lagre daterte laboratorietester uten å redusere dem til ett enkelt tall
- skille laboratoriemålinger fra Garmin-estimater og manuelle anslag
- ha historikk over flere tester og flere pulssoneoppsett
- la brukeren velge hvilket soneoppsett som er aktivt
- registrere Garmin-fordeling i pulssoner på en fullført økt
- vurdere om en økt støtter planlagt intensjon, uten å gjøre sonefordeling til en hard fasit

Laboratoriedata skal være en autoritativ målekilde, men skal aldri overskrive profil, historikk eller aktive soner uten eksplisitt bekreftelse.

## Verifisert eksempel fra Idrettens testsenter

Rapport datert 1. august 2026 inneholder blant annet:

- vekt: 73,8 kg
- høyde: 188 cm
- laboratoriemålt HFmax: 183 bpm
- VO2max: 3,05 L/min og 41,5 ml/kg/min
- VO2-protokoll: tredemølle med 5,3 % stigning
- maksimal Borg: 19
- maksimal laktat: 10,33 mmol/L
- laktatprofil på 1,7 % stigning
- femminutters trinn ved 8, 9 og 10 km/t med puls 160, 165 og 169 samt laktat 3,00, 3,69 og 5,72 mmol/L
- oppgitt anaerob terskelfart: 9,2 km/t
- foreslåtte intensitetssoner: 110-130, 130-156, 156-166, 166-174 og 174-183 bpm

Rapporten har også en treningsanbefaling med nærliggende grenser: 110-130, 130-155, 155-164, 164-173 og 173-182 bpm. Appen skal derfor bevare råverdiene og skille mellom `målt/foreslått soneoppsett` og `treningsresept`. Den skal ikke gjette at tabellene er identiske eller automatisk slå dem sammen.

## Datamodell

### Labtest

```js
{
  id: 'labtest_...',
  version: 1,
  date: '2026-08-01',
  testType: 'vo2_lactate',
  source: {
    type: 'laboratory',
    name: 'Idrettens testsenter',
    location: 'Steinkjer'
  },
  body: {
    weightKg: 73.8,
    heightCm: 188
  },
  vo2: {
    relativeMlKgMin: 41.5,
    absoluteLMin: 3.05,
    maxHeartRateBpm: 183,
    treadmillGradePercent: 5.3,
    maxSpeedKmh: 11,
    respiratoryExchangeRatio: 1.13,
    ventilationLMin: 112,
    breathingFrequency: 41,
    borg: 19,
    lactateMmolL: 10.33
  },
  lactateProfile: {
    treadmillGradePercent: 1.7,
    thresholdSpeedKmh: 9.2,
    steps: [
      { durationMinutes: 5, speedKmh: 8, heartRateBpm: 160, borg: 12, lactateMmolL: 3.00 },
      { durationMinutes: 5, speedKmh: 9, heartRateBpm: 165, borg: 14, lactateMmolL: 3.69 },
      { durationMinutes: 5, speedKmh: 10, heartRateBpm: 169, borg: 16, lactateMmolL: 5.72 }
    ]
  },
  notes: '',
  createdAt: '...'
}
```

Alle underobjekter og målefelt er valgfrie. Ukjente verdier skal være `null`, ikke nulltall. Tall normaliseres med norsk desimalstøtte, men rå rapport skal ikke lagres i Firestore i første versjon.

### Pulssoneoppsett

```js
{
  id: 'zones_...',
  version: 1,
  name: 'Idrettens testsenter 01.08.2026',
  sourceType: 'lab',
  sourceTestId: 'labtest_...',
  effectiveFrom: '2026-08-01',
  maxHeartRateBpm: 183,
  boundaryPolicy: 'higher_zone_on_shared_boundary',
  zones: [
    { zone: 1, label: 'Restitusjon', fromBpm: 110, toBpm: 130 },
    { zone: 2, label: 'Langkjøring', fromBpm: 130, toBpm: 156 },
    { zone: 3, label: 'Anaerob terskel', fromBpm: 156, toBpm: 166 },
    { zone: 4, label: 'Over terskel', fromBpm: 166, toBpm: 174 },
    { zone: 5, label: 'Intervall', fromBpm: 174, toBpm: 183 }
  ],
  active: true,
  createdAt: '...'
}
```

Rapporter kan vise en puls som øvre grense i én sone og nedre grense i neste. `boundaryPolicy` gjør klassifiseringen deterministisk uten å omskrive rapportens viste verdier. Standardpolicy er at en delt grensepuls klassifiseres i den høyere sonen.

Bare ett soneoppsett kan være aktivt om gangen. Gamle oppsett beholdes som historikk. Aktivering krever eksplisitt bekreftelse og skal ikke automatisk endre profilens makspuls.

### Treningsresept fra test

En laboratorierapport kan inneholde anbefalte drag og pauser i tillegg til pulssoner. Dette lagres separat fra aktive soner:

```js
{
  zone: 3,
  label: 'Anaerob terskel',
  pulseText: '155-164 bpm',
  workText: '4 x 8 min',
  restText: '2 min'
}
```

Feltet er informativt. Det oppretter ikke øktmaler automatisk.

### Sonefordeling på fullført økt

```js
{
  heartRateZoneDistribution: {
    version: 1,
    source: 'garmin_manual',
    zoneSetId: 'zones_...',
    zoneSetSnapshot: { /* navn, maks HF, grensepolicy og soner */ },
    entries: [
      { zone: 1, percent: 12, seconds: null },
      { zone: 2, percent: 63, seconds: null },
      { zone: 3, percent: 20, seconds: null },
      { zone: 4, percent: 5, seconds: null },
      { zone: 5, percent: 0, seconds: null }
    ],
    unclassifiedPercent: null,
    recordedAt: '...'
  }
}
```

Prosent og sekunder kan støttes parallelt. Første UI-versjon bruker prosent fordi Garmin viser dette lett tilgjengelig. Summen kan avvike litt fra 100 på grunn av avrunding; appen viser avvik og krever korrigering først ved et større avvik. Manuelle felt overskrives ikke av senere import uten bekreftelse.

Et snapshot av soneoppsettet lagres på økten. En senere endring av aktive soner skal ikke omskrive hvordan en historisk økt ble tolket.

## Planintensjon og samsvar

Sonefordeling er støttebevis, ikke alene en fasit. Oppvarming, pauser og nedjogg gjør at en terskeløkt naturlig har tid i lavere soner. En ren funksjon kan returnere:

```js
{
  verdict: 'aligned' | 'mostly_aligned' | 'above_plan' | 'below_plan' | 'unknown',
  confidence: 'low' | 'medium' | 'high',
  targetZones: [2],
  targetSharePercent: 63,
  aboveTargetPercent: 25,
  reasons: []
}
```

Vurderingen skal bruke:

- øktens rolle, intensitet og eventuelle eksplisitte målsoner
- strukturert intervallinnhold når det finnes
- sonefordeling og snapshot fra øktdato
- RPE, smerterespons og kroppssignaler
- manglende eller avrundede data som usikkerhet

Coachen skal ikke si at en intervalløkt var feil bare fordi hele økten hadde lav andel i målsone. Uten tid per arbeidsdrag er konklusjonen forsiktig og forklarbar.

## Kildehierarki

For pulssoner og terskler:

1. aktivt, eksplisitt bekreftet laboratorieoppsett
2. annet eksplisitt manuelt soneoppsett
3. profilbaserte prosentberegninger

For selve øktdataene:

1. manuelt bekreftede verdier
2. eksplisitt godkjent import
3. automatisk beregning/estimat

Appen viser alltid kilde og dato. Laboratorie-HFmax på 183 skal ikke stille overskrive en profilverdi på 195; brukeren får et konkret valg om å oppdatere profilen.

## UI/UX

### Setup - Tester og pulssoner

- én kompakt inngangsrad under profil/data
- egen side for `Labtester` og `Pulssoner`
- registrer test, se historikk og åpne detaljvisning
- opprett soneforslag fra test, men krev bekreftelse før aktivering
- vis alltid aktivt oppsett, kilde og dato
- støtte for redigering av en kopi; historiske oppsett endres ikke i stillhet

### Logg/fullføring

- sammenfoldet seksjon `Pulssoner fra Garmin`
- fem prosentfelt med løpende sum
- valgfritt soneoppsett, forhåndsvalgt fra aktivt oppsett
- kompakt stablet sonegraf i detaljvisning
- kort, forsiktig samsvarstekst når datagrunnlaget er godt nok

### Innsikt

- siste labtest og endring fra forrige sammenlignbare test
- aktivt soneoppsett
- historikk for VO2max og terskelfart
- sonefordeling over tid først når nok økter har data

## Modulgrenser

- `domain-lab-tests.js`: normalisering, validering, trinnmodell, testhistorikk og formattering
- `domain-heart-rate-zones.js`: soneoppsett, grensepolicy, snapshots, prosentvalidering og samsvarsvurdering
- `lab-tests-ui.js`: labtestskjema, historikk og detaljvisning
- `heart-rate-zones-ui.js`: aktive soner, redigering og øktens sonefordeling
- `app-state.js`: bakoverkompatible defaults for `labTests` og `heartRateZoneSets`
- `training-repository.js`: eksplisitte samlinger og batchoperasjoner
- `app.js`: navigasjon, state-wrappers, bekreftelser og orchestrering, ikke laktat- eller soneberegning

Nye runtime-filer skal inn i PWA app shell og testes fra faktisk produksjonskode.

## Firestore, backup og personvern

- foreslåtte samlinger: `labTests` og `heartRateZoneSets`
- sonefordeling lagres som valgfritt felt på fullført økt
- begge nye samlinger inngår i backup, import, lokal snapshot, reset og recovery
- data fra gamle brukere uten feltene normaliseres til tomme lister eller `null`
- rapport-PDF, fødselsdato og kontaktinformasjon lagres ikke i Firestore i første versjon
- AI-context får bare nødvendig sammendrag av aktivt soneoppsett og relevante testverdier

## Testkrav

- gammel state uten labtester og soner normaliseres trygt
- norske desimaltall leses korrekt
- ugyldige/ufullstendige laktattrinn gir trygg valideringsfeil
- bare ett soneoppsett er aktivt
- delte grensepulser klassifiseres etter dokumentert policy
- prosentfordeling rundt 100 tolererer liten avrunding, men avviser større avvik
- øktens sone-snapshot endres ikke når aktivt oppsett senere endres
- manglende sonefordeling gir `unknown`, ikke negativ vurdering
- planlagt rolig økt med stor andel over målsone kan varsles forsiktig
- strukturert kvalitetsøkt vurderes med lavere sikkerhet når bare total øktfordeling finnes
- backup/import/recovery bevarer labtester, soner og sonefordeling

## Foreslått gjennomføring

1. `v173a` - dette designet og verifisert mapping fra laboratorierapport.
2. `v173b` - labtesthistorikk, aktivt soneoppsett og eksplisitt profilbekreftelse.
3. `v174a` - manuell sonefordeling på fullført økt og visning i historikk.
4. `v174b` - ren, forklarbar samsvarsvurdering i Logg/Innsikt/coach-context.
5. `v175` - oppvarming og nedtrapping fra øvelsesbiblioteket.
6. `v176a-v176b` - Garmin CSV-import som fyller den etablerte modellen etter forhåndsvisning og bekreftelse.

