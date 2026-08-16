# TRAINING_PLANS_DESIGN.md

Status: Godkjent designgrunnlag for senere implementering. Dokumentet beskriver v1 av manuelle fireukersblokker. Det innfører ingen runtime-endring i seg selv.

## 1. Obligatorisk kartlegging av eksisterende logikk

| Område | Dagens eier og fil | Faktisk beregning i dag | Handling | Begrunnelse |
|---|---|---|---|---|
| 1. Ukesammensetning og øktroller | `normalWeekRoles()`, `roleCoverage()`, `roleAwareSuggestions()`, `bakkenWeekRecipe()` og `assembleWeekPlanSuggestions()` i `domain-training-plan.js`; små state-wrappere i `app.js` | Lager normal rollefordeling fra profil/mål, måler dekning mot fullførte og planlagte økter, foreslår manglende roller og setter forslag på tilgjengelige datoer | **b – mat parametere** når blokk er aktiv; ellers **a – gjenbruk** | Funksjonene kan fortsatt velge konkrete forslag. En aktiv blokk skal eie prioriterte roller og uketype, men ikke duplisere forslagssystemet. |
| 2. Konkurransefase | `raceGoalPlan()` og løpskontekst i `domain-goals.js`, deretter `applyRaceContextToSuggestionMix()` i `domain-training-plan.js` | Utleder fase og prioritet fra måldato/readiness og justerer normal forslagmiks mot konkurransen | **a – gjenbruk uten blokk**, **c – erstatt i miksen når blokk er aktiv** | Manuell blokk må være eneste eier av rolleprioritet. Konkurransen forblir synlig kontekst, men får ikke foreta en ny rollejustering oppå blokken. |
| 3. Rolledekning | `roleCoverage()` i `domain-training-plan.js` | Sammenholder ønskede roller med planlagte og fullførte økter og finner hull | **a – gjenbruk** med blokkens roller | Dekningsbegrepet er allerede relevant og forklarbart. Blokken leverer ønsket plan; samme funksjon måler om planen faktisk er dekket. |
| 4. Volumprogresjon | `trainingVolumeRamp()` i `domain-coach.js`, terskler fra `coach-rules.json` via `domain-coach-rules.js` | Sammenligner nyere og tidligere treningsvinduer. Velger varighet dersom begge vinduer har minst 50 prosent varighetsdekning, ellers antall økter, og vurderer økning mot validert maksgrense | **a – gjenbruk som sikkerhetsvakt**, supplert med ny prospektiv validering | Blokkrammen foreslår ønsket retning. Volumvakten skal fortsatt bedømme forsvarlighet på sitt faktiske beregningsgrunnlag; en planlagt økt er ikke fritatt fra varsling. |
| 5. Comeback og reduserte forventninger | `comebackProtocol()` i `domain-coach.js`; levende `effectiveWeeklyTarget` settes i coach-/appflyt i `app.js` | Oppdager treningsopphold og foreslår gradvis retur. Dagens effektive ukesmål tar hensyn til comeback enkelte steder, men kontinuitet bruker fortsatt ordinært mål | **c – erstatt målberegningen** med én felles `effectiveWeeklyTargetForWeek()`; **a – gjenbruk** comeback-vurderingen | Avlastning, comeback, Hjem, kontinuitet og coach må bruke samme teller/nevner. Historiske mål må fryses for å unngå retroaktiv endring. |
| 6. Datoplassering, sperrede dager og ikke-sammenhengende økter | `weekPlanDates()` og `weekPlanDatesInRange()` i `domain-core.js`; sammensetting i `domain-training-plan.js` | Finner ledige dager i et intervall, respekterer sperrede dager og eksisterende planlagte økter, og fordeler forslag på datoer | **a – gjenbruk**, med eksplisitt konfliktresultat | Eksisterende datologikk er et egnet lavnivåverktøy. Blokkmaterialisering trenger i tillegg et diff-/konfliktlag og må aldri overskrive en manuell økt. |
| 7. Ukentlig fullført mot planlagt | `weeklyTrainingStatus()` og `calculateWeeklyStreak()` i `app.js`, med `roleCoverage()` som støtte | Teller ukeøkter mot ordinært ukesmål, summerer belastning og bygger ukestatus/streak. Det finnes ingen varig blokkuke-evaluering | **c – erstatt domeneansvaret** med ren `evaluatePlanWeek()` og snapshots; `app.js` blir wrapper | Statusen må vurdere roller, volumramme, brukerendringer og kroppssignal uten å mutere historikk. Ren logikk skal testes direkte fra produksjonsmodul. |

Kartleggingen viser at v1 hovedsakelig skal orkestrere eksisterende byggesteiner. Den skal ikke etablere et parallelt coachsystem.

## 2. Datamodell

### 2.1 Designmål

Brukeren ønsker å planlegge trening i fireukersblokker: tre progressive belastningsuker og én roligere avlastningsuke. Dagens app kan foreslå og legge inn enkeltøkter, men mangler en vedvarende planramme, tydelig rolleprioritet og en trygg kobling mellom plan, ukevisning og coach.

V1 skal gjøre det enkelt å:

- opprette én manuell fireukersblokk med et tydelig fokus
- se hva som er viktig denne og neste uke
- materialisere bare den delen av planen som er nær nok i tid
- bevare alle manuelle endringer og historiske vurderinger
- avslutte blokken med en ærlig oppsummering, uten automatisk å opprette neste blokk

Hovedprinsippet er:

> planen foreslår retning og ramme, volumvakten vurderer om forslaget fortsatt er forsvarlig

### 2.2 Scope og avgrensning

#### Med i v1

- Én aktiv plan per bruker.
- Plan type `manual_four_week` med nøyaktig fire ISO-uker.
- Uke 1–3 er belastningsuker; uke 4 er avlastning.
- Én til fire prioriterte øktroller per uke.
- Manuell opprettelse med forhåndsutfylte forslag fra eksisterende profil og historikk.
- Kalendermaterialisering av gjeldende og neste uke etter eksplisitt forhåndsvisning og bekreftelse.
- Kompakt Hjem-kort, egen planoversikt under Kalender og fullført-oppsummering.
- Felles, historisk stabilt effektivt ukesmål.
- Forklarbar forhåndsvalidering mot volumvakten.

#### Ikke med i v1

- Automatisk generert 12-ukers løpsplan.
- Flere samtidige aktive planer.
- Automatisk overtakelse av eksisterende manuelle kalenderøkter.
- Automatisk konvertering mellom minutter og antall økter.
- Automatisk flytting av økter etter dagsform, kroppssignal eller planendring.
- Automatisk ny blokk når en blokk er fullført.
- AI-generering eller AI-lagring av planen.

### 2.3 Arkitektur og eierskap

Senere implementering skal deles slik:

- `domain-periodized-training-plan.js`: ren normalisering, kalibrering, blokkramme, prospektiv volumvalidering, effektivt ukesmål og `evaluatePlanWeek()`.
- `training-plan-controller.js`: forhåndsvisning, diff, materialisering, snapshot-ferdigstilling og repository-orkestrering.
- `training-plan-ui.js`: mobil-først opprettelsesflyt, planoversikt, Hjem-kort og fullført-oppsummering med injiserte data og handlinger.
- `training-repository.js`: avgrensede Firestore-operasjoner og batcher.
- `app-state.js` og lokal lagring: defaults, normalisering, backup og recovery.
- `calendar-ui.js`: inngang og sammensatt Kalender/Treningsplan-visning.
- `app.js`: små state-wrappere, hendelseskobling og sammensatt rendering. Ingen ny domenelogikk.

`evaluatePlanWeek({ planWeek, plannedItems, completedItems, roleCoverage, volumeRamp, bodyState, comebackState })` skal motta ferdig beregnede vurderinger. Den skal ikke beregne kroppstilstand, comeback eller volumvakt på nytt.

### 2.4 Treningsplan

Ny samling:

`users/{uid}/trainingPlans/{planId}`

Foreslått v1-kontrakt:

```js
{
  version: 1,
  type: "manual_four_week",
  status: "draft" | "active" | "completed" | "cancelled",
  name: "Baseblokk",
  focus: "base" | "threshold" | "custom",
  startDate: "2026-08-17",
  endDate: "2026-09-13",
  planRevision: 3,
  createdAt,
  updatedAt,
  activatedAt,
  completedAt,
  snapshotPolicyVersion: 1,
  calibration: {
    lookbackWeeks: 6,
    metric: "duration" | "sessions",
    baselineValue: 180,
    sourceCoverage: 0.86,
    calculatedAt,
    userConfirmed: true
  },
  volumeFrame: {
    metric: "duration" | "sessions",
    factors: [
      { min: 0.95, max: 1.00 },
      { min: 1.00, max: 1.05 },
      { min: 1.05, max: 1.15 },
      { min: 0.70, max: 0.80 }
    ]
  },
  weeks: [{
    weekStart: "2026-08-17",
    weekEnd: "2026-08-23",
    index: 1,
    type: "load" | "peak" | "deload",
    priorityRoles: ["easy", "long_easy"],
    targetMin: 171,
    targetMax: 180,
    slots: [{ slotId, role, preferredDay, templateId: null }],
    evaluation: null
  }]
}
```

Alle lesere skal normalisere ukjente eller manglende felter til trygge defaults. En ugyldig plan blir `draft` og kan ikke materialiseres før den er rettet.

### 2.5 Planreferanse på økter

`planned` og senere `completed` kan ha:

```js
planRef: {
  planId,
  planRevision,
  weekStart,
  weekIndex,
  slotId,
  role,
  materializedAt
},
userModified: false,
userModifiedFields: []
```

`planRevision` er et monotont heltall som økes hver gang planens materielle innhold endres. En planlagt økt lagrer revisjonen den sist ble materialisert fra; diffen kan dermed finne utdaterte økter.

Plan-eide felter er dato, øktmal/malsnapshot, rolle og tilsiktet mål/ramme. `userModified` blir først sann når brukeren endrer et plan-eid felt. Vanlig fullføring, RPE, følelse, smerte, notat og øvrige subjektive fullføringsfelt setter ikke flagget. Ved fullføring kopieres `planRef` og modifikasjonsmetadata til historikken. En plan kan aldri mutere en fullført økt.

### 2.6 Historisk effektivt ukesmål

Ny, uavhengig samling:

`users/{uid}/weeklyTargetSnapshots/{weekStart}`

```js
{
  version: 1,
  weekStart: "2026-09-07",
  weekEnd: "2026-09-13",
  status: "final",
  normalTarget: 4,
  effectiveTarget: 3,
  reductions: {
    plan: { active: true, planId, type: "deload", slotCount: 3, target: 3 },
    comeback: { active: false, target: null }
  },
  winningReason: "deload",
  finalizedAt
}
```

Avlastningsukens reduserte **øktmål** kommer fra antall aktive slots i uke 4, ikke fra `volumeFrame`. En varighetsbasert ramme kan dermed fortsatt ha tre planlagte øktroller og gi `effectiveWeeklyTarget: 3` uten konvertering mellom minutter og økter. Volumrammen styrer samlet tid/antall etter sin egen metrikk; slotantallet styrer kontinuitetsmålet.

Samlingen er valgt fremfor et nøklet kart i `settings/preferences` fordi postene har eget livsløp, versjonering, målrettede skriv, konfliktbehandling og historisk uforanderlighet. Den unngår også et stadig voksende/hyppig skrevet settings-dokument og Firestores dokumentgrense. Snapshotet må overleve endring og sletting av planen som skapte reduksjonen.

Selve innføringsgrensen lagres én gang som et lite policyfelt, for eksempel `settings.preferences.weeklyTargetSnapshotPolicy = { version: 1, effectiveFrom: "2026-08-17" }`. Dette er metadata, ikke et voksende ukekart. `effectiveFrom` settes til starten på inneværende ISO-uke når mekanismen aktiveres og flyttes aldri senere. Dermed kan snapshotplikten avgjøres også etter at en plan er slettet. `snapshotPolicyVersion` på planen dokumenterer hvilken policy planen ble opprettet under.

## 3. Policy

### 3.1 Effektivt ukesmål og historikk

`effectiveWeeklyTargetForWeek()` er eneste kilde til målnevner for kontinuitet, Hjem, ukestatus, coach og blokkoppfølging.

For en åpen uke beregnes kandidater fra:

- ordinært `goals.weeklySessionsTarget`
- aktiv avlastningsukes reduserte mål
- aktiv comeback-reduksjon

Laveste gyldige verdi vinner. Dersom ordinært mål er større enn null, er minste effektive mål 1. Prioritetsrekkefølge skal ikke kunne velge et høyere mål enn den strengeste aktive reduksjonen.

For en avsluttet uke brukes alltid et `final` snapshot. Snapshotet ferdigstilles deterministisk:

1. ved første relevante apphandling etter at uken er avsluttet
2. før en plan redigeres, avsluttes eller slettes
3. før streak beregnes dersom snapshot mangler for en snapshot-pliktig uke

Sletting midt i en pågående uke er et særtilfelle. Før planen fjernes, ferdigstilles inneværende uke med reduksjonen som faktisk gjaldt. Bekreftelsen skal vise:

> Avlastningsmålet for denne uken fryses til 3 økter før planen slettes. Historisk kontinuitet påvirkes ikke.

Hvis ingen reduksjon gjelder, viser dialogen ordinært mål. Handlingen er atomisk eller gjenopptakbar: snapshot må være lagret før planstatus kan settes til slettet/kansellert.

Uker før `snapshotEffectiveFrom` bruker eksisterende legacy-logikk og `goals.weeklySessionsTarget`. Systemet skal ikke rekonstruere gamle avlastnings- eller comebackmål. Eksisterende streak skal derfor ikke endres i denne runden.

#### Obligatorisk sekvensering

Snapshotmekanismen og `effectiveWeeklyTargetForWeek()` skal være i produksjon **før den første aktive blokkens uke 4 starter**. Planen skal ikke kunne aktiveres før denne infrastrukturen finnes.

- Planlagt levering: implementeringsrunde 2.
- Absolutt siste trygge tidspunkt: implementeringsrunde 4, før første blokk kan aktiveres/materialiseres.
- Runde 5 skal aldri brukes som sikkerhetsnett; da kan en bruker allerede nærme seg avlastningsuken.

### 3.2 Blokkramme og volumvalidering

#### Kalibrering og ramme

Opprettelsesflyten foreslår en baseline fra de siste fire til seks representative ukene. Brukeren ser både metrikk, dekning og verdi og må bekrefte den. Blokkrammen lagrer én eksplisitt metrikk: `duration` eller `sessions`.

Eksempel med 180 minutter per uke:

| Uke | Faktor | Ramme |
|---|---:|---:|
| 1 | 95–100 % | 171–180 min |
| 2 | 100–105 % | 180–189 min |
| 3 | 105–115 % | 189–207 min |
| 4 | 70–80 % | 126–144 min |

Faktorene er design-defaults, ikke skjulte sannheter. Endelige grenser eies av `coach-rules.json` med validert fallback fra `domain-coach-rules.js`.

#### Samme regelkilde er ikke nok

Blokkfaktorer og volumvaktens maksgrense skal lese samme validerte regelkilde. Det løser likevel ikke ulik nevner. Før materialisering må den foreslåtte øvre rammen valideres på `trainingVolumeRamp()` sitt faktiske beregningsgrunnlag.

Med en tidligere fireukersverdi rundt 180 minutter og uke 1 faktisk 176:

- Uke 2: tidligere snitt omtrent 179; `189 / 179 = 1,056`.
- Uke 3: `(180 + 180 + 176 + 189) / 4 = 181,25`; `207 / 181,25 = 1,142`, under eksempelgrensen 1,25.
- Uke 4: `(180 + 176 + 189 + 207) / 4 = 188`; `144 / 188 = 0,766`.

Valideringen skiller mellom om kontrollen kunne kjøres og hva den konkluderte med:

- `validationStatus: validated`: vakt og blokk bruker samme metrikk og det finnes nok data.
- `validationStatus: metric_mismatch`: vaktens valgte metrikk avviker fra blokkrammen. Ingen konvertering utføres.
- `validationStatus: insufficient_data`: volumvakten mangler nok nyere eller tidligere økter.

Når `validationStatus` er `validated`, settes et eget utfall:

- `outcome: within_guardrail`: øvre ramme er innenfor volumvaktens grense.
- `outcome: reduced_by_guardrail`: opprinnelig øvre ramme ville utløst volumvakten. Forhåndsvisningen reduserer automatisk det foreslåtte maksimumet til høyeste verdi som består kontrollen, viser både opprinnelig og justert verdi og lar brukeren overstyre etter eksplisitt bekreftelse. En overstyring demper ikke senere volumvarsler.

`reduced_by_guardrail` viser:

> **Forslaget er justert fra 207 til 200 minutter.**  
> Den opprinnelige øvre rammen ville gitt raskere økning enn volumvakten anbefaler ut fra de siste ukene. Du kan beholde den tryggere rammen eller overstyre etter å ha sett begrunnelsen.

`metric_mismatch` viser:

> Volumrammen er satt i minutter, mens historikken akkurat nå vurderes i antall økter. Rammen kunne derfor ikke valideres uten å gjette.

`insufficient_data` viser:

> Vi har ikke nok sammenlignbar historikk til å validere volumrammen ennå. Du kan opprette blokken, men vurderingssikkerheten er lav.

`metric_mismatch` og `insufficient_data` avviser ikke rammen automatisk. Et validert overskridende forslag justeres som beskrevet over. Sikkerhetsadvarsler kan fortsatt stoppe en konkret materialisering. Valideringen kjøres på nytt etter nye fullførte eller importerte økter, ved planredigering, ved ukesevaluering og før hver materialisering. Allerede materialiserte økter endres ikke automatisk.

### 3.3 Rolle-, race- og challenge-policy

#### Kanoniske roller og deterministisk klassifisering

Den kanoniske rollelisten utvides med `easy` (**Rolig baseøkt**). `recovery` beholder betydningen bevisst kort/lett restitusjon, og `long_easy` beholder betydningen rolig langtur. Vanlig rolig volum skal aldri representeres som `recovery` bare fordi RPE er lav.

Nye planlagte og fullførte malsnapshots får `roleClassificationVersion: 2`. Eksisterende snapshots uten feltet behandles som v1 og bruker nøyaktig dagens utledning. Det gjennomføres ingen bulk-migrering, og eksplisitt lagret rolle vinner alltid, også på v1-data. Dermed endres ingen historisk rolle, Innsikt-beregning eller intensitetsbalanse bakover i tid av denne runden.

V2 følger denne prioriteten:

1. Gyldig eksplisitt `role` brukes uendret.
2. Deretter brukes normalisert, eksakt `intensity` fra malsnapshotet:
   - `Restitusjon` gir `recovery`.
   - `Rolig` etablerer rolig basefamilie. Økten blir `long_easy` bare ved et entydig langt navn eller når den relative langtursgrensen nedenfor er nådd; ellers blir den `easy`.
   - øvrige intensiteter beholder dagens terskel-/styrkeutledning.
3. Mangler både rolle og intensitet, brukes normaliserte, versjonerte markører i denne rekkefølgen:
   - restitusjon: `restitusjon`, `recovery`, `gåtur`
   - langtur: `langtur`, `rolig lang`, `long run`
   - rolig base: `easy run`, `rolig løp`, `rolig tur`, `rolig kort`, `base`, `low aerobic`, `lav aerob`
   - ingen entydig markør gir `other`.

Markører skal treffes som hele normaliserte ord/fraser, ikke vilkårlig delstreng. En lagret rolle kan derfor ikke overstyres av navn, intensitet, RPE, fart eller varighet. Fart og RPE beskriver gjennomføring/belastning og brukes ikke til å velge rolle.

Relativ langtursgrense eies av `coach-rules.json` og valideres med samme fallback-prinsipp som øvrige coach-regler:

```json
{
  "thresholds": {
    "workoutRoles": {
      "longEasy": {
        "lookbackWeeks": 8,
        "minimumBaselineSessions": 6,
        "durationFactorVsMedianEasy": 1.35
      }
    }
  }
}
```

Referansen er median varighet for brukerens fullførte løpeøkter i de foregående åtte avsluttede ISO-ukene som har rolig/base-intensjon, gyldig varighet og ikke er eksplisitt restitusjon, langtur, kvalitet eller race. Måløkten inngår aldri i egen referanse. Minst seks referanseøkter kreves. Uten nok referanse klassifiseres `Rolig` som `easy`, med mindre navnet entydig sier langtur. Ved nøyaktig grense (`durationSeconds >= median * factor`) blir økten `long_easy`; under grensen blir den `easy`. Det konverteres ikke fra fart eller distanse for å tvinge frem en vurdering.

Baseblokkens tre standard-slots er `easy`, `easy`, `long_easy`; en eventuell fjerde base-slot er også `easy` med mindre brukeren velger noe annet. Avlastningsuke kan bruke `recovery` fordi restitusjon da er øktens faktiske formål. Gjentatte `easy` beholdes som separate slots. `priorityRoles` er fortsatt en unik prioritetsliste og uttrykker ikke antall; slotlisten eier antallet.

#### Tellende rolledekning

`roleCoverage()` skal gjøre stabil én-til-én-allokering i rolleplanens rekkefølge: hver slot bruker først én ennå ubrukt fullført økt med samme rolle, deretter én ennå ubrukt planlagt økt. Treffet markeres brukt og kan ikke dekke en ny slot. Den Set-baserte `completedRoles`/`missingRoles`-beregningen i coachkonteksten fjernes som egen sannhet og bygges fra samme tellende dekningsresultat.

Kodesøk viser ett direkte `.find()`-mønster som gjenbruker samme økt i `roleCoverage()`, samt den separate Set-baserte coachberegningen. `evaluatePlanWeek()` beregner ikke treff selv, men må fortsette å motta det samkjørte dekningsresultatet.

Når en aktiv blokk finnes, er kjeden:

```js
activeBlock
  ? blockAwareSuggestionMix(normalSuggestions, activeBlockContext, count)
  : applyRaceContextToSuggestionMix(normalSuggestions, raceContext, count)
```

Race-kontekst kan fortsatt vises på planen, men kan ikke justere rolleblandingen en gang til. Uten aktiv blokk er dagens race-logikk uendret.

En challenge har eget mål og egen periode gjennom `challengeProgress()` og er uavhengig av ukesmålet. Appen skal aldri redusere et selvvalgt challenge-mål automatisk. Ved konflikt vises:

> Denne uken er planlagt som avlastning. Challenge-takten er høyere enn blokkens anbefalte ramme.

## 4. Materialisering, diff og konfliktpolicy

Bare inneværende og neste uke materialiseres som `planned`. Senere uker forblir en planramme. Alle skriver krever forhåndsvisning og eksplisitt bekreftelse.

En materialiseringsdiff kan foreslå `create`, `update`, `remove`, `detach`, `keep` eller `conflict`. Ingen handling mot `userModified: true` utføres uten et separat valg.

| Situasjon | Policy |
|---|---|
| Fullført økt | Endres aldri. Planreferansen beholdes som historikk. |
| Planøkt i fortiden | Endres aldri. |
| Fremtidig, umodifisert planøkt | Kan foreslås oppdatert eller fjernet i preview. |
| Fremtidig `userModified` planøkt | Beholdes og vises som konflikt; brukeren velger. |
| Slot fjernes fra planen | Foreslå «Behold som løs økt» eller «Slett planøkten». |
| Plan avsluttes/kanselleres | Vis konsekvenser; ingen stille sletting. |
| Planlagt økt uten `planRef` | Urørt og telles aldri som planens slot, men teller fysisk belastning/sikkerhet. |
| Ny plan treffer eksisterende manuell økt | Blokker den sloten; krev annen dato eller «Hopp over». Ingen adopsjon i v1. |
| Plan slettes i pågående uke | Frys effektivt ukesmål først, og vis verdien i bekreftelsen. |

Maks fire slots per uke betyr normalt høyst åtte økter i materialiseringsvinduet. Batcher skal likevel bruke repositoryets etablerte chunking og lokal recovery-snapshot før første skriv.

## 5. Coach-kontrakt

Planen er sekundær kontekst, ikke primært sikkerhetssignal:

```js
{
  planId,
  blockName,
  blockType,
  weekIndex,
  weekCount: 4,
  weekType,
  priorityRoles,
  volumeDirection,
  isDeloadWeek
}
```

Planen kan forklare hvorfor en rolle er viktig, men kan aldri overstyre `primarySignal`, `blockedActions`, kroppssignal, dagsform, comeback eller andre guardrails.

Normal forklaring:

> Uke 3 av 4 i baseblokken er toppuke, derfor er den lange rolige viktigere enn vanlig i dag.

Ved konflikt:

> Planen foreslår lang rolig tur i toppuken, men dagens kroppssignal gjør at coachen anbefaler kort rolig økt eller hvile. Planøkten blir stående og flyttes ikke automatisk.

## 6. UX – mobil først

UX-en skal gi verdi uten at brukeren må forstå datamodellen. Primærinformasjonen er neste beslutning; forklaring og teknisk grunnlag ligger progressivt under «Hvorfor?» eller «Datagrunnlag».

### 6.1 Opprett en fireukersblokk

Flyten har fire steg. Alle steg beholdes fordi hvert av dem representerer en beslutning som ikke bør gjemmes eller gjettes.

Ved gjentatt bruk får brukeren en rask vei gjennom de samme fire stegene. Navn/fokus, ukerytme og roller forhåndsutfylles fra siste fullførte blokk, mens baseline alltid beregnes på nytt. Stegoversikten merker uendrede forslag med `Som forrige blokk` og reelle avvik med `Endret siden sist`. Et uendret steg kan bekreftes med ett trykk, men alle feltene er fortsatt tilgjengelige.

Hvis ny baseline avviker vesentlig, åpnes volumsteget automatisk og viser:

> **Treningsgrunnlaget har endret seg siden forrige blokk**  
> Nytt forslag er 165 minutter per uke, mot 180 sist. Se hva som har endret seg før du fortsetter.

«Vesentlig» skal eies av validert regel/default og testes; første designforslag er mer enn 10 prosent eller skifte av metrikk. Hurtigflyten kan aldri skjule metrikkendring, lav dekning, kroppssignal eller volumvaktjustering. Dette bevarer fire eksplisitte beslutninger uten å gjøre blokk to og tre unødvendig tunge.

#### Steg 1 – Retning og tidsrom

Felter: navn, fokus og startdato. Appen foreslår neste mandag og viser nøyaktig fire ISO-uker.

Tekst:

> **Hva vil du bygge de neste fire ukene?**  
> Tre uker bygger belastning. Den fjerde uken gir kroppen rom til å ta til seg treningen.

Feil:

> Startdatoen må være en mandag. Velg en ny dato for å få fire hele treningsuker.

#### Steg 2 – Ukerytme og roller

Appen forhåndsutfyller én til fire roller fra profil og vanlig frekvens. Brukeren kan velge for eksempel rolig, lang rolig og kontrollert terskel.

Tekst:

> **Hva skal få fast plass?**  
> Rollene gir blokken retning. Du velger konkrete økter senere.

Dette steget beholdes fordi «base» alene ikke sier om brukeren ønsker tre eller fire økter, eller hvilke roller som er viktigst.

#### Steg 3 – Volumramme og trygghet

Vis baseline, valgt metrikk, fire ukers rammer og valideringsstatus. Brukeren bekrefter eller justerer.

Tekst ved god dekning:

> **Forslag: 180 minutter per uke som utgangspunkt**  
> Basert på de siste seks ukene med god tidsdekning.

Tekst ved lav dekning:

> **Vi kan foreslå en ramme, men ikke validere den sikkert ennå.**  
> Nye økter gjør kontrollen bedre underveis.

Dette steget beholdes fordi en prosent uten synlig baseline er vanskelig å forstå og lett å overtolke.

#### Steg 4 – Forhåndsvis og bekreft

Vis alle fire ukeoversikter, men merk bare inneværende/neste uke med «Legges i kalenderen». Vis nye, endrede, urørte og konflikter før skriving.

Tekst:

> **Sjekk planen før den lagres**  
> 6 økter legges i kalenderen nå. Resten ligger som ramme og konkretiseres nærmere uken.

Konflikt:

> **Tirsdag har allerede en planlagt økt.**  
> Velg en annen dag eller hopp over denne planplassen. Den eksisterende økten endres ikke.

Feil ved lagring:

> Planrammen ble lagret, men kalenderøktene kunne ikke opprettes. Ingen eksisterende økter er endret. Prøv materialiseringen på nytt.

### 6.2 Planoversikt under Kalender

Kalender får en kompakt veksler: `Kalender | Treningsplan`. Planvisningen åpner med nåsituasjonen, ikke hele dokumentet.

Mobilrekkefølge:

1. blokkhode: navn, uke og uketype
2. denne uken med roller, volumramme og avvik
3. neste uke
4. resten av blokken sammenfoldet
5. «Datagrunnlag» og planhandlinger nederst

Eksempel:

> **Baseblokk · uke 3 av 4**  
> Toppuke · 4 økter · 189–207 min  
> Neste viktigste: Lang rolig

Materialiserte uker merkes `Lagt i kalenderen`; senere uker merkes `Planlagt fremover`.

Tomtilstand:

> **Ingen aktiv treningsblokk**  
> Lag en fireukersblokk for å gi ukeplanen en tydelig retning.  
> `Lag blokk`

Konfliktbanner:

> **2 planplasser trenger et valg**  
> Eksisterende kalenderøkter er beholdt. Se konfliktene før neste materialisering.

### 6.3 Kompakt kort på Hjem

Kortet skal være handlingsrettet og bruke lite høyde:

> **Baseblokk · uke 3 av 4**  
> Toppuke · 4 økter · 189–207 min  
> Lang rolig gjenstår  
> `Se planen`

Avlastningsuke:

> **Avlastningsuke · uke 4 av 4**  
> Målet er å møte neste blokk frisk, ikke å fylle kalenderen.

Ved kroppssignalkonflikt kommer sikkerhetsbudskapet først:

> **Planen er justert av dagens råd**  
> Kroppssignalet veier tyngre enn toppuken. Se et roligere alternativ.

### 6.4 Blokk fullført

Når uke 4 er avsluttet, får planen status `completed`. Oppsummeringen viser rolledekning, gjennomført volum mot rammene, brukerendringer og relevante kroppssignal/sikkerhetsavvik. Den skal ikke gi karakter eller automatisk foreslå ny belastning.

Eksempel:

> **Baseblokken er fullført**  
> Du gjennomførte 13 av 14 planroller og holdt deg innenfor volumrammen i 3 av 4 uker. Avlastningsuken ble roligere som planlagt.  
> **Dette fungerte:** Jevn rolig trening og langtur i alle belastningsukene.  
> **Ta med videre:** Én terskeløkt ble justert på grunn av kroppssignal.

Handlinger:

- `Lag neste blokk`
- `Avslutt planlegging`
- `Se blokkhistorikk`

Hvis data mangler:

> Blokken er fullført, men noen økter mangler varighet eller rolle. Oppsummeringen viser derfor gjennomføring, ikke sikker volumkonklusjon.

### 6.5 Redigering og sletting

Før sletting vises plan, berørte fremtidige økter, eventuelle brukerendringer og snapshot av pågående mål. Ingen destruktiv handling skjules bak en generell «Slett».

> **Hva skal skje med 5 fremtidige planøkter?**  
> 3 er uendret, 2 er redigert av deg. Redigerte økter er forhåndsvalgt beholdt som løse økter.

## 7. Testplan

### 7.1 Rene tester

- Normalisering av gyldig, eldre, delvis og ugyldig plan.
- Nøyaktig fire ISO-uker og korrekt uke 1–4.
- Baseline og ramme i `duration` og `sessions`.
- `validated`, `metric_mismatch` og `insufficient_data` uten konvertering/gjetting.
- `validated + reduced_by_guardrail` reduserer automatisk forhåndsvisningens øvre forslag, viser begrunnelse og krever eksplisitt valg for overstyring.
- Varighetsbasert volumramme utleder avlastningsukens reduserte øktmål fra antall slots, ikke fra minutter.
- Prospektiv øvre grense mot volumvaktens faktiske nevner.
- Laveste effektive mål ved samtidig normal, avlastning og comeback; minimum 1.
- Snapshot vinner over levende plan for avsluttet uke.
- Legacy-uke bruker ordinært mål og endrer ikke eksisterende streak.
- Aktiv blokk bruker blokkrolle; uten blokk brukes race-kjeden uendret.
- V1-fixtures uten `roleClassificationVersion` beholder nøyaktig dagens roller og gir identisk historisk intensitetsbalanse før og etter rolleutvidelsen.
- V2-prioritet låses med representative fixtures: eksplisitt rolle vinner; `Restitusjon` gir `recovery`; vanlig `Rolig` gir `easy`; entydig langtursnavn gir `long_easy`; manglende rolle/intensitet/markør gir `other`.
- Relativ langtursgrense bruker validert regelkilde og tidligere historikk: under grensen gir `easy`, nøyaktig på og over grensen gir `long_easy`, og utilstrekkelig baseline gjetter ikke langtur.
- Normaluke `easy/easy/long_easy` med to fullførte økter viser nøyaktig én manglende rolle. Samme økt kan ikke dekke to slots.
- Coachens rolledekning er identisk med `roleCoverage()` også når samme rolle forekommer flere ganger.
- Challenge-mål endres aldri av avlastning.
- `evaluatePlanWeek()` bruker injiserte vurderinger og muterer ikke input.

### 7.2 Materialisering og dataintegritet

- Bare inneværende og neste uke materialiseres.
- Fullført og historisk økt endres aldri.
- Manuell økt uten `planRef` beholdes og skaper konflikt.
- `userModified` og `userModifiedFields` bevares.
- Utdatert `planRevision` finnes og forhåndsvises.
- Sletting i pågående avlastningsuke skriver snapshot før planendring.
- Feil midt i batch kan gjenopptas uten duplikater.
- Gammel og ny backup kan importeres; clear/replace/recovery inkluderer begge samlinger.

### 7.3 Sikkerhet og synk

- Deployede Rules og lokale Rules sammenlignes igjen før release.
- Eier kan lese/skrive egne planer/snapshots; annen bruker avvises.
- Ingen API-nøkkel, AI-rådata eller private notater introduseres.
- Batchstørrelse holder seg under repositorygrensen også ved retries.

### 7.4 Manuell UX/PWA

- 360–430 px bredde: fire steg kan fullføres uten horisontal scrolling.
- Tastaturfokus, tilbakeknapp og skjermleseretiketter for steg og konflikter.
- Hjem-kortet tar liten høyde og sikkerhetsbudskap kommer først.
- Kalender skiller tydelig mellom `Lagt i kalenderen` og `Planlagt fremover`.
- Offline/feiltilstand gjør ingen skjult skriving.
- Plan sletting viser snapshotverdi og konsekvens for alle fremtidige økter.
- Fullført-oppsummeringen kan forstås uten å åpne datagrunnlaget.

## 8. Synk, backup, recovery og Firestore

### 8.1 Verifiserte Firestore Rules

Deployede Rules er kontrollert mot aktiv release `projects/home-tasks-app-18de3/releases/cloud.firestore` i prosjektet `home-tasks-app-18de3`. Releasen peker på ruleset `projects/home-tasks-app-18de3/rulesets/a30fa06d-e85d-4049-a624-419e2d6fbfea`, opprettet 12. juli 2026, og innholdet samsvarer med lokal `firestore.rules`. Den rekursive eierregelen:

```text
match /users/{userId}/{document=**} {
  allow read, write: if owns(userId);
}
```

dekker både `trainingPlans` og `weeklyTargetSnapshots`. V1 trenger derfor ingen Rules-endring eller Rules-deploy. Testplanen skal likevel bevise at eier får tilgang og en annen bruker avvises. AI-chatens separate rot er ikke presedens for disse bruker-eide treningsdataene.

Det trengs ikke sammensatt indeks dersom repositoryet laster brukerens avgrensede samlinger og filtrerer lokalt. Indeksbehov vurderes på nytt dersom v2 innfører server-spørringer på kombinasjoner av status og dato.

### 8.2 Hele datasirkelen

Begge nye samlinger skal legges til `TRAINING_DATA_COLLECTIONS`, samlet app-state, normalisering, full replace/clear, eksport/import, lokal snapshot og recovery.

- Gammel backup uten feltene normaliseres til tom plan- og snapshotliste.
- Ny backup bevarer aktive/fullførte planer og snapshots.
- Recovery-snapshot tas før materialisering, diff-batch og plansletting.
- Lokal/offline recovery kan vise data, men skal ikke materialisere før autentisert repository-synk er gjenopprettet.
- Garmin-import påvirkes ikke direkte; nye fullførte økter kan bare utløse ny prospektiv validering.

## 9. Implementeringsrunder

### Runde 1 – Design og kontrakter

Dette dokumentet, roadmap, backlog og progress. Ingen runtime-kode.

### Runde 2 – Historisk målfundament

Bygg `effectiveWeeklyTargetForWeek()`, `weeklyTargetSnapshots`, repository/state/backup/recovery og samkjør kontinuitet, Hjem, ukestatus og coach. Dette er planlagt produksjonstidspunkt og skal skje før noen blokk aktiveres. **Levert i v176o:** legacy-uker forblir uendret, avsluttede nye uker ferdigstilles før historikken renderes, og nådd redusert mål bruker ikke fryskort.

### Runde 3 – Ren blokkdomene-logikk

Normalisering, baseline, rammer, regelkilde, prospektiv validering, rollepolicy, race-kjede og `evaluatePlanWeek()` med direkte stabilitetstester. Når `domain-periodized-training-plan.js` utvides, skal filen stå i `AGENTS.md` og `RELEASE_CHECKLIST.md` sine `node --check`-lister og i service-workerens `APP_SHELL`.

### Rolleport mellom runde 3 og 4

Etter at første ekte ukesmåls-snapshot er verifisert, leveres `easy`, v2-klassifisering, validert relativ langtursgrense og tellende rolledekning som en egen liten runtime-runde. Runde 4 starter ikke før denne porten er verifisert, slik at ingen plan materialiseres med `recovery` som erstatning for vanlig rolig volum.

### Runde 4 – Controller og persistence

Planlagring, `planRevision`, planreferanser, preview/diff, konfliktpolicy, current+next-materialisering og atomisk snapshot ved redigering/sletting. `training-plan-controller.js` skal samtidig legges til i `AGENTS.md` og `RELEASE_CHECKLIST.md` sine `node --check`-lister og i service-workerens `APP_SHELL`; samme krav gjelder `training-plan-ui.js` når den opprettes i UI-runden. **Dette er absolutt siste trygge tidspunkt for snapshotmekanismen før aktivering, selv om den etter planen allerede er levert i runde 2. Aktiveringsporten forblir lukket til mekanismen er i produksjon.**

### Runde 5 – Mobil-først produktflate

Opprettelsesflyt, Kalender-visning, Hjem-kort, tom-/konflikt-/feiltilstander og progressiv forklaring. Kan utvikles bak deaktivert feature-flag til runde 4 er verifisert.

### Runde 6 – Coach, ukesevaluering og ferdigstilling

Sekundær plankontekst, ukentlig evaluering, blokk-fullført-oppsummering, ende-til-ende-test, release og dokumentert rollback.

## 10. Akseptansekriterier for v1

- Brukeren kan opprette og forstå en fireukersblokk i fire mobiltilpassede steg.
- Blokken materialiserer aldri mer enn gjeldende og neste uke uten ny bekreftelse.
- Eksisterende, fullførte og brukerendrede økter kan ikke overskrives stille.
- Uke 4 bruker et redusert mål konsekvent i alle flater.
- Avsluttede og planslettede uker har stabil historikk gjennom snapshots.
- Snapshotinfrastruktur er i produksjon før første aktive uke 4; aktivering er sperret inntil dette er sant.
- Volumrammen forklarer om den er validert, har metrikkavvik eller mangler data.
- Planen demper aldri en legitim volum- eller kroppssignaladvarsel.
- Aktiv blokk og race-logikk dobbeljusterer ikke rolleprioriteter.
- Challenges endres ikke automatisk.
- Fullført blokk oppsummeres og avsluttes uten automatisk neste blokk.
- Rules, backup, eksport/import, lokal snapshot og recovery er verifisert ende til ende.

## 11. Senere utvikling

Når v1 er stabil og brukt i minst én full blokk, kan v2 vurdere flere blokker i en 12-ukers løpsplan, blokkbibliotek, forsiktig forslag til neste blokk og bedre kobling mot mål-løp. Dette er eksplisitt utenfor v1 og skal bygge på faktisk erfaring med opprettelse, konflikter, avlastning og fullført-oppsummering.
