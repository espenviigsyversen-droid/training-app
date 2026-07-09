# Review: Coach-regler og tilhørende filer i Treningsdagboka

Gjennomgang av `coach-rules.json`, `coach-rammeverk.md`, `domain-core.js`, `app.js` (coach-delene), `index.html`, `service-worker.js` og `ARKITEKT_CONTEXT.md` · juli 2026.

---

## 1. Sammendrag

Coach-motoren er faglig imponerende for en egenutviklet app. Den graderte skadehåndteringen, konflikt-tilstanden i heltekortet, klassifiseringen «baseøkt med høy puls» og prinsipp-siteringene («Prinsipp: ...») er ting kommersielle apper sjelden gjør like gjennomtenkt. Bakken-filosofien er reelt implementert, ikke bare sitert.

De viktigste funnene, i prioritert rekkefølge:

1. **`coach-rules.json` er død konfigurasjon.** Filen lastes aldri av appen. Prinsippene er hardkodet på nytt i `app.js` (`COACH_FRAMEWORK`) med *avvikende ordlyd*, og `decisionPriority`/`bakkenRunningWeek` håndheves ikke fra filen. Du har i praksis tre sannhetskilder som allerede har begynt å drifte.
2. **Alle terskelverdier er hardkodet og spredt.** Tallene som faktisk styrer coachen (65 % hard-andel, ratio < 0,4, RPE ≥ 7, 92 % av terskelpuls, ≥ 5 dager siden sist, osv.) ligger strødd i to filer. `coach-rules.json` burde vært stedet for disse – det ville gjort coachen justerbar, testbar og klar som AI-kontekst.
3. **«For mye hardt» måles på tre ulike måter** i tre ulike deler av appen, med ulike vinduer og definisjoner. Brukeren kan få «4 harde mot 1 rolig» på Hjem og «30 % rolig» på Innsikt samtidig, uten at tallene henger sammen.
4. **Gylne sonen-regelen har en logisk glipp**: den teller *alle* økter med snittpuls over sonen som brudd – inkludert intervalløkter som *skal* ligge der – mens meldingen skylder på de rolige øktene.
5. Verdifulle data samles inn, men brukes ikke i beslutninger: HRV-trend, hvilepuls-trend og testløpsdata vises, men påvirker ikke rådene.
6. Rammeverket mangler regler for det skadefri-prinsippet handler mest om i praksis: **volumprogresjon** (ukesramp), comeback-protokoll og avstand mellom kvalitetsøkter som eksplisitt regel.

Resten av rapporten går gjennom dette i detalj, med konkrete endringsforslag og et utkast til `coach-rules.json` v2.

---

## 2. Slik henger coachen faktisk sammen i dag

For å vurdere reglene må man se hvor beslutningene faktisk tas. Det finnes i praksis **fem beslutningsmotorer** som delvis overlapper:

| Motor | Fil | Rolle |
|---|---|---|
| `todayDecision()` | domain-core.js | Dagens beslutning (nivå/tittel/handling) |
| `homeHeroState()` | domain-core.js | Heltekortets tilstand (post_workout, conflict, comeback, rest_day, planned) |
| `buildCoachNote()` | app.js | Fritekst-rådet («Dagens råd»-analysen) |
| `buildWorkoutSuggestion()` + `roleAwareSuggestions()` | app.js | Øktforslag og ukeplan |
| `injurySignalSummary()` / `injuryAdjustedWorkoutAdvice()` | domain-core.js | Skadejustering |

Hver av disse re-implementerer sin egen prioritering av signaler. `coach-rules.json` sin `decisionPriority` («body_signals_first → recent_load → repeatable_week → template_roles → consistency») er ment å være fasiten, men:

- `todayDecision()` sjekker **rød dagsform før smerte**, mens `buildCoachNote()` sjekker **smerte før dagsform**. Begge rekkefølger er forsvarlige, men de er *ulike*, og ingen av dem leser prioriteringen fra JSON-filen.
- Ved sammenfallende signaler (gul dagsform + tung intensitetsbalanse + planlagt kvalitet) avgjør implementasjonsdetaljer hvilken melding som vinner – ikke en definert regel.

Dette er ikke krise i dag fordi logikken stort sett peker samme vei, men det er den typen inkonsistens som blir dyr når AI-coachen skal bygges på toppen: da må prioriteringen være eksplisitt og ett sted.

---

## 3. Funn i `coach-rules.json`

### 3.1 Filen er ikke koblet til appen (høy prioritet)

Ingen `fetch` av `data/coach-rules.json` finnes i `app.js` eller `index.html`. Filen ligger i service workerens `APP_SHELL` og caches trofast ved hver install – men ingenting leser den. I stedet er prinsippene hardkodet i `app.js`:

```js
// app.js linje ~130
const COACH_FRAMEWORK = {
  principles: {
    controlled_threshold: 'Terskel skal være kontrollert, ikke maksimal.',
    ...
```

mot JSON-filens:

```json
"controlled_threshold": "Terskel skal være kontrollert og repeterbar, ikke maksimal."
```

Ordlyden har allerede driftet («og repeterbar» mangler i app.js). Med tre kilder (rammeverk.md → rules.json → app.js) vil dette bare øke.

**Anbefaling:** Gjør et valg – enten (a) last `coach-rules.json` ved oppstart med hardkodede verdier som fallback, og la `COACH_FRAMEWORK` bygges fra den, eller (b) slett JSON-filen og la `coach-rammeverk.md` + kode være de to nivåene. Alternativ (a) er klart best gitt AI-planene dine (se 3.2), men (b) er ærligere enn dagens tilstand. Uansett: fjern filen fra `APP_SHELL` hvis den ikke brukes.

### 3.2 Filen inneholder prosa, ikke parametere (høy prioritet)

Dagens JSON er en kortversjon av rammeverket – prinsippsetninger og to lister. Men det som *faktisk* styrer coachens oppførsel er tallene, og de ligger hardkodet og spredt:

| Terskelverdi | Verdi | Hvor |
|---|---|---|
| Hard-andel som utløser konflikt i heltekort | ≥ 65 % (14 d) | domain-core `homeHeroState` |
| Rolig-ratio som utløser balanse-advarsel | < 0,4 (14 d) | app.js `buildCoachNote` |
| Rolig-per-hard i Bakken-mønstre | 3 per 1 (30 d) | Innsikt-render |
| Gylne sonen (andel av makspuls) | 0,77–0,87 etter nivå | domain-core `goldenZonePercentages` |
| «Høy puls» på baseøkt | ≥ 92 % av terskelpuls / ≥ 82 % av makspuls | `classifyWorkoutIntensityContext` |
| Hard RPE | ≥ 7 | flere steder |
| Smertenivåer (lav/moderat/høy) | 1–2 / 3–4 / ≥ 5 | `injurySignalSummary` m.fl. |
| Frisk-kriterium etter skade | ≤ 1/10 i ≥ 2 registreringer | `injuryRecoveryGuidance` |
| Comeback-trigger | ≥ 5 dager siden sist | `todayDecision`, `homeHeroState` |
| Dager på rad uten rolig | ≥ 3 | `buildCoachNote` |
| Rød/gul dagsform | snitt ≤ 2 / ≤ 3,5; hvilepuls +10/+5 | `assessTrafficLight` |

**Anbefaling:** La `coach-rules.json` bli den faktiske parameterfilen. Dette gir tre gevinster: du kan justere coachen uten deploy av logikk, testene kan asserte mot samme kilde som runtime, og filen blir perfekt kontekst for AI-coachen («her er reglene jeg styres av»). Se utkast i seksjon 6.

### 3.3 `bakkenRunningWeek` mangler begrensninger (middels)

Listen definerer de fire rollene, men ikke reglene *mellom* dem, som koden delvis håndhever implisitt: minst én dag mellom kvalitetsøkter (`closeQualityDays`), maks 2 kvalitet per 7 dager, rolig dag etter kvalitet. Disse hører hjemme i regelfilen som eksplisitte constraints – i dag finnes de bare som spredte if-setninger.

### 3.4 Småting

`version: 1` brukes ikke til noe (ingen versjonssjekk ved lasting). `source`-stien peker på `../Treningsfilosofi/...` relativt til `data/`-mappen – riktig, men skjørt hvis mapper flyttes. Ingen skjemavalidering; en tastefeil i filen ville i dag vært usynlig (siden den uansett ikke leses – men i v2 bør lasting validere og falle tilbake til defaults med en logglinje).

---

## 4. Funn i regellogikken (domain-core.js / app.js)

### 4.1 Gylne sonen-regelen teller feil økter (høy prioritet – reell logikkfeil)

```js
// app.js ~6840
const goldenZoneViolations = goldenZone
  ? last7Days.filter(c => numberOrZero(c.avgHeartRate) > goldenZone.high).length
  : 0;
```

Dette filtrerer **alle** økter siste 7 dager med snittpuls over sonens tak – uten å sjekke om økten var ment som rolig. Konsekvenser:

- En hard intervalløkt med snittpuls over 87 % teller som «brudd», og meldingen blir «Flere *rolige* økter siste uke hadde snittpuls over den gylne sonen» – om økter som aldri var rolige.
- Motsatt fanges ikke det reelle problemet: en «rolig» økt med snittpuls på 84 % av maks er altfor hard for en rolig dag, men ligger *under* sonens tak og teller ikke som brudd.

Gylne sonen er i Bakken-forstand *terskel*-sonen, ikke rolig-sonen. Regelen bør derfor deles i to, og verktøyet finnes allerede – `classifyWorkoutIntensityContext` skiller `baseIntent` fra `qualityIntent`:

- **Rolig-brudd:** økter med `baseIntent` og snittpuls over rolig-tak (f.eks. ~75 % av makspuls, eller under sonens *gulv*) → «hold rolige dager virkelig rolige». (Kategorien `high_pulse_base` fanger dette allerede – bruk den her i stedet for rå puls.)
- **Terskel-brudd:** økter med `qualityIntent` og snittpuls over sonens tak → «terskelen var hardere enn kontrollert» (prinsippet `controlled_threshold`).

Dette er en liten kodeendring med stor presisjonsgevinst, og begge takene hører hjemme i regelfilen.

### 4.2 Tre ulike definisjoner av intensitetsbalanse (høy prioritet)

Appen svarer på «trener jeg for hardt?» med tre ulike regnestykker:

1. Heltekortets konflikt: `hardShare14 ≥ 65` (andel av økter, 14 dager)
2. Dagens råd: `hardCount14 ≥ 2 && easyCount14/total < 0.4` (der `easyCount14` inkluderer `highPulseBase`)
3. Bakken-mønstre på Innsikt: «minst 3 rolige per harde økt» (30 dager)

Ulike vinduer, ulike tellinger, ulike terskler. Dette forklarer hvorfor skjermbildene dine kunne vise «4 harde mot 1 rolig» ett sted og «Rolig 30 %» et annet – begge riktige etter sin egen definisjon, men brukeren opplever det som at appen ikke er enig med seg selv.

**Anbefaling:** Én kanonisk funksjon i `domain-core.js`, f.eks. `intensityBalance(completedItems, todayIso, windowDays)`, som returnerer `{ easyCount, hardCount, easyShare, verdict }` basert på `classifyWorkoutIntensityContext`-kategoriene. Alle tre flatene bruker den, med vindu og terskler fra regelfilen. Vurder samtidig om `highPulseBase` skal telle som rolig (i ratioen gjør den det, i ånden er den «grå») – uansett hva du lander på, bør det være ett svar.

### 4.3 Første-treff-vinner skjuler sammensatte bilder (middels)

`buildCoachNote()` er en lang kjede av `if (...) return tekst`. Det gir alltid nøyaktig én grunn, selv når virkeligheten er sammensatt (gul dagsform *og* tung balanse *og* kvalitet planlagt i morgen). `coachDecisionBasis()` bøter delvis på dette ved å liste grunnlaget, men selve rådet reflekterer bare det første treffet.

**Anbefaling:** Evaluer alle regler, gi hvert treff en alvorlighet (fra `decisionPriority` i regelfilen), velg det høyest prioriterte som hovedbudskap og la 1–2 sekundære treff bli en kort bisetning eller vises i Grunnlag. Dette gjør også prioriteringen testbar: en fixture med to samtidige signaler skal alltid gi samme vinner.

### 4.4 Tekst-matching er skjørt fundament for klassifisering (middels)

`plannedWorkoutIsQuality()`, `injuryAdjustedWorkoutAdvice()` og `inferredWorkoutRole()` lener seg på norske nøkkelord og til og med konkrete øktnavn:

```js
if (name.includes('6x6') || name.includes('4x10') ...) return 'main_threshold';
```

Dette virker for dagens malbibliotek, men knekker stille: en mal kalt «Bakkedrag 8x45s» uten ordene terskel/intervall klassifiseres som `other`, faller utenfor kvalitetstelling, og coachen kan foreslå ny kvalitet dagen etter. Datamodellen har allerede strukturerte felter (`role`, `purpose`, `load`, `structuredWorkout`).

**Anbefaling:** Prioriter strukturerte felter, bruk tekst kun som siste fallback, og gjør uklassifiserte økter *synlige*: en liten «Uklassifisert – sett rolle på malen»-hint i UI ville både rydde data og gjøre coachen sikrere over tid. `classifyWorkoutIntensityContext` gjør mye av dette riktig allerede; problemet er de eldre hjelperne som ikke går via den.

### 4.5 Innsamlede data som ikke påvirker råd (middels)

- **HRV-trend og hvilepuls-trend** (Formutvikling) vises og siteres i Grunnlag, og maler kan merkes `avoidWhen: low_hrv` – men ingen beslutningsmotor setter noen gang tilstanden «lav HRV». Tag-en er i praksis død. Et enkelt første steg: HRV 7d mer enn ~10 % under 4-ukers snitt → behandle som gult signal i `todayDecision` (med regelfil-terskel). Forsiktighet er riktig her – HRV er støyete – men da bør enten regelen finnes eller tag-en fjernes.
- **Testløp/PB-data** brukes i mål-score, men ikke til å kalibrere sonene. Du har en fersk 5 km-test (38:03); den kunne validere/justere terskelpuls og gylne sonen i stedet for at sonene kun avledes av makspuls og nivå. Dette er naturlig v2/AI-territorium, men verdt å notere som retning.

### 4.6 Skadefri progresjon mangler volum-dimensjonen (middels–høy, faglig)

Rammeverkets prinsipp 4/5 handler om skadefri progresjon, og koden håndterer *intensitet* og *smerte* godt. Men den vanligste skadeårsaken for løpere – **for rask volumøkning** – har ingen regel. Coachen ville i dag ikke reagert på en uke med 45 km etter fire uker på 20.

**Anbefaling:** Legg til en ramp-vakt: hvis inneværende/kommende ukes km overstiger f.eks. 1,25 × snittet av siste 4 uker → råd om å holde volumet, med prinsipp-referanse. Tersklene i regelfilen. Samme mekanisme gir en naturlig **comeback-protokoll**: etter ≥ 10 dager borte, foreslå redusert ukemål (f.eks. 60–70 % av normaluke) første uke tilbake – i dag sier comeback-tilstanden bare «start kontrollert» uten å justere ukens forventning, så «2 økter igjen til ukesmålet» står og presser samtidig.

### 4.7 Feiring etter kvalitetsøkt er farget gul (lav, men rimer med v138)

`todayCompletedWorkoutFeedback()` returnerer `level: 'yellow'` med tittel «Kvalitet er gjennomført» etter en vellykket kvalitetsøkt uten smerterespons. Innholdet er godt (restitusjonsråd), men gult signal på en god dag leses som advarsel. Gi den grønn/nøytral med feirende tittel og la *rådet* bære forsiktigheten – dette er i praksis en del av v138.

### 4.8 «I morgen»-perspektivet mangler (lav–middels)

`todayDecision` ser bakover (belastning, smerte) og på i dag, men aldri fremover: hvis det ligger en hard økt *i morgen*, er dagens beste råd ofte «hold i dag ekstra lett». `nextPlanned` finnes allerede i konteksten; en enkel regel («kvalitet i morgen + ingen økt i dag → aktiv hvile-råd med begrunnelse») ville gjøre coachen merkbart smartere uten ny data.

---

## 5. Funn i øvrige filer

**app.js (7 900 linjer):** Coach-logikken (`buildCoachContext`, `buildCoachNote`, forslags-funksjonene, rolle-logikken – anslagsvis 1 200–1 500 linjer) ligger i orchestrator-filen, stikk i strid med ditt eget arkitekturprinsipp 6.2. Den er også vanskelig å teste der (avhenger av `state`, `getTemplate`, DOM-hjelpere). Flytt til `domain-coach.js` med rene signaturer (`buildCoachNote(ctx)` er nesten ren allerede – det er `buildCoachContext` som må dele seg i ren beregning + state-henting). Dette bør skje **før** AI-coachen bygges, siden AI-konteksten skal bygges av nøyaktig samme funksjoner.

**service-worker.js:** Solid mønster (network-first for appfiler, cache-first for Firebase-moduler). To småting: `APP_SHELL` cacher `coach-rules.json` og `coach-rammeverk.md` som runtime ikke bruker (rydd eller ta i bruk, jf. 3.1), og fetch-fallbacken returnerer `index.html` for *alle* feilede GET-forespørsler – også bilder/ikoner, som da får HTML som svar. Ufarlig i praksis, men en `Response`-sjekk på `request.destination` ville vært renere.

**index.html / struktur:** Ikke dypdykket i denne runden. Ett generelt punkt: med `escapeHtml` konsekvent i render-funksjonene (som jeg ser brukes) er XSS-flatene håndtert der jeg har lest; behold disiplinen når coach-tekster begynner å inneholde brukerdata (øktnavn, områder).

**ARKITEKT_CONTEXT.md:** God fil. Den beskriver riktig mønster (domene-moduler, små steg, datamodell først) – hovedfunnet i denne rapporten er egentlig at coach-koden ikke helt lever opp til sin egen arkitekturfil ennå.

---

## 6. Utkast: `coach-rules.json` v2

Et konkret skjelett som samler prinsipper, prioritering, terskler og ukestruktur. Lastes ved oppstart, valideres, med hardkodede defaults som fallback:

```json
{
  "version": 2,
  "framework": "Bakken-inspirert kontrollert terskel og skadefri progresjon",
  "principles": {
    "controlled_threshold": "Terskel skal være kontrollert og repeterbar, ikke maksimal.",
    "golden_zone": "Den gylne sonen prioriterer litt lavere intensitet for bedre kontinuitet.",
    "easy_support": "Rolig volum støtter kvalitet og kontinuitet.",
    "fresh_legs": "Kvalitet bør komme med friske bein.",
    "body_signals_first": "Kroppssignaler trumfer planen.",
    "recovery_is_training": "Restitusjon er aktiv belastningsstyring.",
    "repeatable_week": "Normaluken skal være enkel, repeterbar og justerbar."
  },
  "decisionPriority": [
    "injury_active", "readiness_red", "readiness_yellow",
    "recent_load", "volume_ramp", "week_structure", "consistency"
  ],
  "thresholds": {
    "pain":       { "lowMax": 2, "moderateMax": 4, "highMin": 5,
                    "releaseMaxScore": 1, "releaseStableCheckins": 2 },
    "readiness":  { "redAvgMax": 2, "yellowAvgMax": 3.5,
                    "redHrDelta": 10, "yellowHrDelta": 5 },
    "intensityBalance": { "windowDays": 14, "minEasyShare": 0.6,
                          "heroConflictHardShare": 0.65,
                          "countHighPulseBaseAsEasy": true },
    "easyCeiling": { "pctOfMaxHr": 0.75 },
    "goldenZone":  { "beginner": [0.77, 0.84], "intermediate": [0.78, 0.85],
                     "experienced": [0.80, 0.87] },
    "quality":     { "maxPer7Days": 2, "minDaysBetween": 2, "hardRpeMin": 7 },
    "volumeRamp":  { "windowWeeks": 4, "maxWeeklyIncreaseFactor": 1.25 },
    "comeback":    { "triggerDaysSinceLast": 5, "longBreakDays": 10,
                     "reducedWeekFactor": 0.65 },
    "streakFreeze": { "cardsPerMonth": 1, "validReasons": ["sick", "travel", "injury"] }
  },
  "bakkenRunningWeek": {
    "roles": ["main_threshold", "support_threshold", "long_easy", "x_workout"],
    "constraints": { "easyDayAfterQuality": true, "xWorkoutRequiresSurplus": true }
  }
}
```

Poenget er ikke at akkurat disse tallene er riktige – de er dagens hardkodede verdier gjort eksplisitte – men at de nå *kan* diskuteres, testes og justeres ett sted. Merk at `streakFreeze` er med: datamodellen for fryskort bør per din egen arkitekturregel designes før bygging, og regelfilen er riktig hjem for policyen.

---

## 7. Prioritert tiltaksliste

1. **Koble eller fjern `coach-rules.json`** (3.1). Anbefalt: v2-skjema fra seksjon 6, lastes med fallback, `COACH_FRAMEWORK` bygges fra den. Lav risiko, rydder sannhetskildene.
2. **Fiks gylne sonen-regelen** (4.1) – del i rolig-brudd og terskel-brudd via `classifyWorkoutIntensityContext`. Liten endring, fjerner en reell feilkilde i rådene.
3. **Én kanonisk intensitetsbalanse** (4.2) i domain-core, brukt av Hjem, Dagens råd og Innsikt. Dette fjerner den mest brukersynlige inkonsistensen.
4. **Volum-ramp og comeback-protokoll** (4.6) – det største faglige hullet målt mot skadefri-prinsippet.
5. **Flytt coach-logikk til `domain-coach.js`** (5) – gjør 1–4 testbare og forbereder AI-coachen.
6. Deretter: scoret regelmodell med sekundærsignaler (4.3), strukturert klassifisering med «uklassifisert»-hint (4.4), «i morgen»-regelen (4.8), grønn feiring (4.7), og HRV-som-gult-signal eller fjern `low_hrv`-taggen (4.5).

Punkt 1–3 er små nok til én utviklingsrunde hver etter din egen små-steg-modell, og 1+3 bør komme før AI-arbeidet uansett: AI-coachen skal arve nøyaktig disse reglene og tallene som kontekst, og da må de være konsistente og ligge ett sted.

## 8. Testforslag (til stability-tests)

Når reglene samles, bør disse scenarioene låses som fixtures: smerte 5/10 i går + grønt lys i dag → skade vinner over dagsform (og samme vinner i både `todayDecision` og `buildCoachNote`); gul dagsform + planlagt terskel → konflikt-tilstand med bytteforslag; rolig-merket økt med snittpuls 84 % av maks → rolig-brudd, ikke terskel-brudd; intervalløkt med høy snittpuls → *ikke* rolig-brudd; 4 harde / 1 rolig siste 14 dager → samme dom fra alle tre flater; uke på 1,4 × 4-ukers snitt → ramp-advarsel; 12 dager siden sist → comeback med redusert ukemål; fullført kontrollert kvalitetsøkt uten smerte → grønn feiring. Åtte fixtures som til sammen beskytter hele kjernen.
