# Streak Freeze / Fryskort Design

Status: v147 design godkjent / v148 manuell v1 implementert  
Neste runde: eventuell v148b polish etter praktisk test  
Runtime-status: implementert som liten manuell v1 på Hjem/Kontinuitet

## Formål

Fryskort skal beskytte motivasjon og kontinuitetsfølelse når trening uteblir av legitime årsaker som sykdom, skade, reise eller ekstraordinær livsbelastning.

Fryskort er ikke trening. Det skal ikke gi volum, kvalitet, kilometer, minutter, PB, målprogresjon eller skjule at det faktisk var en pause.

Kjerneskillet:

- Fryskort beskytter motivasjon, streak og rettferdig tolkning av kontinuitet.
- Comeback-protokollen beskytter kroppen når brukeren skal tilbake i trening.

Begge kan være aktive rundt samme periode, men de har ulike roller.

## Hva Fryskort Er

Et fryskort er en datert periode der appen sier:

> Denne perioden teller ikke som treningssvikt i kontinuitetsvisningene, fordi avbruddet var legitimt.

Det bør brukes når brukeren faktisk ikke hadde normal treningsmulighet eller det var riktig å ikke trene.

## Hva Fryskort Ikke Er

Fryskort skal ikke:

- telle som en fullført økt
- øke kilometer, minutter, timer eller antall økter
- gi PB, målprogresjon eller race/test-status
- skjule pause i Logg, Innsikt eller coach-grunnlag
- overstyre smerte, dagsform, volum-ramp eller comeback-protokoll
- endre lagrede ukemål permanent
- gjøre en høy treningsbelastning tryggere enn den er

## Gyldige Årsaker

Anbefalt v1:

| Verdi | Label | Brukes når |
|---|---|---|
| `sick` | Sykdom | Forkjølelse, feber, infeksjon eller annen sykdom gjør trening uaktuelt. |
| `injury` | Skadepause | Smerte/skade gjør løping eller trening utrygt. |
| `travel` | Reise | Reise gjør planlagt trening praktisk umulig eller urealistisk. |
| `life_load` | Livsbelastning | Ekstraordinær jobb/familie/stress/søvnunderskudd gjør trening ufornuftig. |
| `other` | Annet legitimt avbrudd | Kun med påkrevd notat, slik at årsaken blir tydelig. |

`other` bør være med i v1 fordi virkeligheten ikke alltid passer i faste kategorier. For å unngå misbruk bør `note` være obligatorisk når `reason === 'other'`.

## Hva Fryskort Beskytter

V1 bør beskytte:

- kontinuitetsstreak på Hjem
- motivasjonsvisning i Kontinuitet-kortet
- kontinuitetskomponenten i Mål-score, ved at en fryst uke ikke gir full straff
- ukestatusens “bak takt”-følelse når hele eller relevante deler av uken er legitimt fryst

V1 bør ikke nødvendigvis gi ekstra poeng. Den bør heller nøytralisere urimelig straff.

Eksempel:

- Uke med sykdomsfryskort: “Kontinuitet beskyttet - sykdom”
- Ikke: “Ukemål nådd”

## Hva Fryskort Ikke Påvirker

Fryskort skal ikke påvirke:

- `completed`-økter
- treningstid
- kilometer
- pace/fart
- pulsdata
- RPE
- PB/testløp
- challenge-progress i kilometer/tid/økter
- strukturert intervallarbeid
- treningsbelastning som faktisk er logget

Hvis en challenge handler om kontinuitet/antall uker senere, kan fryskort vurderes eksplisitt for den typen challenge, men det skal ikke være del av v1 uten egen designrunde.

## Foreslått Datamodell

Anbefalt v1: egen collection per bruker.

```js
continuityFreezes: [
  {
    id: 'freeze_2026_07_10',
    startDate: '2026-07-10',
    endDate: '2026-07-14',
    reason: 'sick',
    note: 'Forkjølet og feberfølelse.',
    source: 'manual',
    status: 'active',
    createdAt: '2026-07-10T08:30:00.000Z',
    updatedAt: '2026-07-10T08:30:00.000Z'
  }
]
```

### Felter

| Felt | Type | Påkrevd | Kommentar |
|---|---|---:|---|
| `id` | string | ja | Stabil id, gjerne generert i appen. |
| `startDate` | ISO date | ja | Første fryste dato. |
| `endDate` | ISO date | ja | Siste fryste dato. Må være >= startDate. |
| `reason` | enum | ja | `sick`, `injury`, `travel`, `life_load`, `other`. |
| `note` | string | nei | Valgfri, men påkrevd for `other`. |
| `source` | enum | ja | `manual` i v1. Senere `suggested`. |
| `status` | enum | ja | `active`, `archived`, eventuelt `deleted`. |
| `createdAt` | ISO datetime | ja | Skrives ved opprettelse. |
| `updatedAt` | ISO datetime | ja | Oppdateres ved endring/arkivering. |

### Datointervall vs Ukeintervall

Datamodellen bør bruke datointervall.

Begrunnelse:

- sykdom, reise og skade følger ofte datoer, ikke kalenderuker
- kalenderen kan vise perioden presist
- ukestatus/streak kan mappe datointervaller til uker ved beregning
- modellen er mer fleksibel for senere coach-logikk

Kontinuitetsberegningen kan senere avgjøre om en uke er:

- helt fryst
- delvis fryst
- ikke fryst

For v1 bør en uke regnes som “beskyttet” hvis fryskortet dekker nok av uken til at ukemålet ikke var realistisk. Dette bør defineres i coach-regler/policy, ikke hardkodes flere steder.

## Policy / Regler

Foreslåtte policy-felter i `coach-rules.json` når v148 bygges:

```js
streakFreeze: {
  validReasons: ['sick', 'injury', 'travel', 'life_load', 'other'],
  requireNoteForReasons: ['other'],
  maxDaysPerFreeze: 14,
  maxActiveFreezesPerMonth: 2,
  protectedWeekCoverageDays: 3,
  allowAutomaticActivation: false
}
```

Anbefaling:

- v148 kan starte med hardkodede defaults i `domain-coach-rules.js`, og valgfritt speile dem i `data/coach-rules.json`.
- Regler skal valideres og ha fallback slik v143b etablerte.
- Automatikk skal i v1 kun foreslå fryskort, ikke aktivere det uten bekreftelse.

### Overlappende Fryskort

V1 bør håndtere overlapp trygt.

Anbefalt oppførsel:

1. Hvis bruker oppretter et fryskort som overlapper et eksisterende aktivt fryskort, vis bekreftelse.
2. Slå sammen periodene hvis årsaken er lik.
3. Hvis årsaken er ulik, behold separat men beregn union av datoene i kontinuitetslogikken.

Dette er mer robust enn å avvise, fordi sykdom + reise eller skade + livsbelastning kan skje samtidig.

## Brukerflyt v148

Anbefalt enkel v1:

1. Brukeren trykker “Frys periode” fra Kontinuitet-kortet på Hjem eller fra Kalender.
2. Modal åpnes.
3. Brukeren velger:
   - startdato
   - sluttdato
   - årsak
   - valgfritt notat
4. Appen viser tydelig forklaring:
   - “Dette beskytter kontinuiteten, men teller ikke som trening.”
5. Brukeren lagrer.
6. Hjem viser en nøytral/positiv status for perioden.

### Hvor UI Bør Ligge

V1 bør ha lav UI-risiko:

- Primær inngang: Hjem -> Kontinuitet-kort -> liten handling “Frys periode”
- Sekundær inngang: Kalender -> dag/modal -> “Marker periode”
- Oversikt: Setup eller Mål/innsikt senere, men ikke nødvendig i første implementering hvis det forsinker v148

Implementert v148-scope:

- Modal for opprettelse
- Enkel liste over aktive/arkiverte fryskort i samme modal
- Arkiver/slett med bekreftelse
- Hjem/Kontinuitet og ukestatus kan vise beskyttet uke
- Kalenderinngang og egen Setup-oversikt er utsatt

Ikke bygg stor egen skjerm i v148.

## Visning

Fryskort skal være ærlig og motivasjonsvennlig.

Eksempler på tekst:

- “Kontinuitet beskyttet denne uken - sykdom”
- “Fryskort aktivt: reise. Teller ikke som trening.”
- “Pause registrert. Comeback bør fortsatt være rolig.”

Unngå tekst som:

- “Ukemål nådd”
- “Økt registrert”
- “Fullført”

### Hjem

Kontinuitetskortet kan vise:

- streak fortsatt intakt
- liten chip: “Beskyttet”
- undertekst: “Sykdom/reise/skadepause teller ikke som treningssvikt.”

### Denne Uken

Ukestatus bør ikke vise aggressivt “bak takt” hvis uken er beskyttet.

Anbefalt:

- “Uke beskyttet”
- “Ukemålet er justert i visningen, men ikke endret i innstillingene.”

### Innsikt

Innsikt bør vise perioden som pause, ikke som treningsuke.

Eksempel:

- “Fryst periode: sykdom 10.-14. juli”
- “Volum vises som faktisk gjennomført trening.”

### Mål-score

Kontinuitetskomponenten kan nøytraliseres for beskyttet uke.

Fryskort skal ikke:

- øke rolig volum
- øke kvalitet
- forbedre race/test-status
- gi skadefrihetspoeng hvis fryskortårsaken er `injury`

Hvis `reason === 'injury'`, bør skadefrihet fortsatt vurderes konservativt.

## Coach-Konsekvens

Fryskort skal ikke presse brukeren tilbake hardt.

Regel:

- Fryskort beskytter streak/motivasjon.
- Comeback-protokoll fra v145 styrer retur og belastning.

Eksempel:

Hvis brukeren har sykdomsfryskort i fem dager:

- Hjem kan si at kontinuiteten er beskyttet.
- Dagens råd etter perioden bør fortsatt bruke comeback-protokoll hvis gapet tilsier det.
- Ukeplanen bør starte rolig.

Hvis brukeren har skadefryskort:

- Skadesignal og comeback skal fortsatt ha prioritet.
- Fryskort skal ikke gjøre hard kvalitet “trygg”.

## Normalisering og Bakoverkompatibilitet

V148 må tåle:

- manglende `continuityFreezes` collection
- tom liste
- gamle backupfiler uten fryskort
- ugyldige eller delvis manglende felt
- gamle lokale snapshots uten feltet

Foreslått normalizer:

```js
normalizeContinuityFreeze(value) -> null | {
  id,
  startDate,
  endDate,
  reason,
  note,
  source,
  status,
  createdAt,
  updatedAt
}
```

Trygge defaults:

- ugyldig dato -> avvis/null
- `endDate < startDate` -> avvis/null
- ukjent reason -> `other` hvis note finnes, ellers avvis/null
- manglende source -> `manual`
- manglende status -> `active`

## Import / Export / Firestore

Hvis v148 oppretter ny collection:

- legg `continuityFreezes` i `DATA_COLLECTIONS`
- inkluder i backup/import
- inkluder i lokal recovery snapshot
- normaliser etter Firestore-load, import og lokal snapshot
- sørg for at replace/import sletter gamle fryskort ved full import

Dette må testes fordi dataflyt-feil her kan gi “tapt” motivasjonsdata eller stale freezes.

## Ren Domenelogikk v148

Anbefalte rene funksjoner:

```js
normalizeContinuityFreeze(value)
normalizeContinuityFreezes(values)
continuityFreezeDays(freezes, startDate, endDate)
isDateFrozen(dateIso, freezes)
isWeekProtectedByFreeze(weekStartIso, freezes, rules)
streakWeeksWithFreezes(completedItems, freezes, options)
weeklyTargetDisplayWithFreeze(weekStatus, freezes, options)
```

Plassering:

- Hvis logikken primært handler om coach/streak: `domain-coach.js`.
- Hvis den blir generell dato-/ukehelper: vurder `domain-core.js`.
- Ikke legg beregningene tungt i `app.js`.

## Testplan v148

Automatiske tester bør dekke:

1. Ingen fryskort gir dagens streak/ukestatus uendret.
2. Gyldig fryskort over en uke beskytter kontinuitetsstreak.
3. Fryskort teller ikke som økt, km, minutter eller timer.
4. Fryskort påvirker ikke PB/testløp.
5. Fryskort + comeback gir fortsatt konservativ retur.
6. Fryskort med `injury` overstyrer ikke skadesignal.
7. Delvis uke fryses bare hvis policygrensen er møtt.
8. Overlappende fryskort håndteres trygt.
9. `other` uten notat avvises eller feiler validering.
10. Gamle data uten `continuityFreezes` fungerer.
11. Import/export/local snapshot bevarer fryskort.
12. Arkivering/sletting krever bekreftelse og fjerner effekten fra visningen.
13. UI-tekst gjør det tydelig at fryskort ikke er trening.

Manuelle tester etter v148:

- Hjem på mobil
- Hjem på desktop
- Kalenderperiode med fryskort
- Kontinuitetskort
- Denne uken-kort
- Mål-score hvis kontinuitetskomponent påvirkes
- Logg/Innsikt for å bekrefte at pause ikke skjules
- PWA/offline etter lukking og åpning

## Akseptansekriterier v148

V148 er godkjent når:

- bruker kan registrere et fryskort for datointervall
- appen forklarer tydelig at dette ikke teller som trening
- kontinuitetsvisningen beskyttes når policyen tilsier det
- ukestatus ikke gir urimelig “bak takt”-følelse ved gyldig fryst uke
- kilometer, minutter, antall økter, PB, challenges og kvalitet ikke øker
- comeback-protokoll fortsatt gjelder etter pause
- gamle data uten fryskort fungerer uendret
- import/export/local snapshot inkluderer ny collection hvis den bygges
- tester dekker normalisering, beregning og dataflyt

## Anbefalt v148 Scope

Hold implementeringen liten:

1. Datamodell + normalisering.
2. Firestore/import/export/local snapshot.
3. Ren fryskortberegning.
4. Enkel modal for manuell registrering.
5. Hjem/Kontinuitet + Denne uken viser beskyttet status.
6. Tester.

Vent med:

- avansert automatisk forslag
- stor fryskort-historikkskjerm
- challenge-integrasjon
- AI-tolkning
- detaljert innsiktsgraf

Dette gir verdi raskt uten å gjøre kontinuitetsmodellen uklar.
