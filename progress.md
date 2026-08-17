# Treningsapp — progress.md
Oppdatert: 2026-08-17 (siste runtime-endring: v176u1)

---

## v176u1 – profilprioritet og presis blokkpreview

- Ny blokk bruker treningsprofilens normaluke som standard; blokkstandarden er et synlig alternativ.
- Kalenderdiffen sier nå korrekt hvilke slots som ville blitt opprettet i inneværende/neste uke, og mellomrommet etter «Ny planøkt» er rettet.
- Steg 2 er fortsatt sperret: previewen har ingen lagrings- eller materialiseringshandling.

## v176u – mobil blokkforhåndsvisning uten skriving

- Ny `training-plan-ui.js` gir en firestegs hurtigflyt fra retning og roller til faktisk volumvalidering og full fireukersoversikt.
- Previewen viser baseuker med `easy/easy/long_easy`, én færre slot og redusert effektivt ukesmål i avlastningsuken, samt current+next-diff med eksplisitte konfliktvalg.
- UI-et har ingen lagrings- eller materialiseringshandling; utkast og konfliktvalg holdes kun lokalt i minnet.
- Race kan ikke lenger fortrenge en manglende normalukerolle, og forklaringen sier eksplisitt at race ikke dekker normaluka.
- `APP_VERSION` og PWA-cache er `v176u`.

## v176t – skrivefri port for planmaterialisering

- Ny `training-plan-controller.js` bygger current+next-preview med feltvis diff, planrevisjon og eksplisitte konflikter uten å kunne skrive kalenderdata.
- Fire realistiske manuelle økter uten `planRef` er hovedtilfelle i stabilitetstesten; de beholdes og krever annen dato eller «Hopp over».
- `scheduleAdjustment`, `userModified`, `metadataRevision`, fullførte økter og fjernede slots behandles etter den godkjente konfliktpolicyen.
- `trainingPlans` inngår nå bakoverkompatibelt i Firestore-repository, samlet state, backup, lokal snapshot og recovery.
- Race-observasjonen er diagnostisert som feil forklaringstekst i `suggestionRoleReason()`, ikke som feil i tellende `roleCoverage()`. Den er rapportert, men ikke rettet i denne runden.

---

## v176s2 – kompakt ukeplan og tydelig testvei

- Ukeplankortet viser dato, øktinformasjon og én «Åpne»-handling. Sjeldne snapshot- og resetthandlinger ligger i dagsmodalen.
- Datoen holdes på én linje, også ved 390 px mobilbredde.
- `planIntentBaseline` skrives først ved en faktisk innholdsoverstyring; derfor vises «Tilbakestill til plan» først etter et slikt bytte.

---

## v176s1 – planendringer med tydelig semantikk

- `userModified` betyr nå bare en aktiv overstyring av planens treningsintensjon og kan oppheves med feltvis «Tilbakestill til plan».
- Datoflytting lagres som `scheduleAdjustment`; flytting ut av blokkuken markeres `rescheduled_out` uten stille erstatningsøkt.
- «Oppdater fra mal» lagres som `metadataRevision` uten å frede økten. v176s-markeringer med kun snapshotfelter normaliseres bakoverkompatibelt.
- Fullføring kopierer `planRef` og alle endringsspor til historikken, slik at planslotten kan evalueres mot faktisk gjennomføring.
- Heltekortets malbytte registreres som en reell intensjonsoverstyring.

---

## v176s – eksplisitt oppdatering av malsnapshot

- Planlagte og fullførte økter har fått den bevisste handlingen «Oppdater fra mal» med feltvis før/etter-diff.
- Fullførte målinger, puls, RPE og notater kan ikke endres av snapshot-flyten. Planlagte økter markeres som manuelt endret og fredes i senere planmaterialisering.
- Nye snapshots får rollemodell v2, revisjonsdato og synlig rolle i detaljmodalen.
- Read-only legacy-kontroll fant ett av 105 fullførte dokumenter uten snapshot; ingen var koblet til Easy Run eller Hiking.
- Nytt designnotat: `TEMPLATE_SNAPSHOT_UPDATE_DESIGN.md`.

---

## Marius Bakken-filosofien (kompakt)

Kjernen er konsistens over intensitet. Bakken bruker seks begreper:

| Begrep | Kort forklaring |
|---|---|
| **Den gylne sonen** | 80–87 % av maks-HF. Hverken for lett eller for hardt. Mesteparten av løpsvolumet skal hit. |
| **Trafikklymodellen** | Grønn / gul / rød daglig beredskaps-sjekk (hvile-HF vs. snitt, søvn, følelse) før du velger økt. |
| **45/15-intervaller** | 45 sek arbeid / 15 sek hvile. Høy aerob stimulus uten for stor syre-belastning. |
| **Dobbel terskel** | To terskeldager per uke (f.eks. tirsdag + torsdag). Resten er rolig. |
| **Smart Strides** | Korte stigningsløp (60–80 m) som nevromuskulær stimulans uten akkumulert tretthet. |
| **10-minuttersregelen** | Start alltid. Følelsen snur nesten alltid etter 10 min. Motivasjon følger handling. |
| **Trappetest (overtrening)** | Kan du gå i trapp uten å bli andpusten? Nei → hviledag. Enkel daglig selvsjekk. |

Standard Bakken-uke: Hoved-terskel → Støtte-terskel → Lang rolig → Valgfri X-økt.

---

## App-arkitektur

**Type:** PWA (Progressive Web App) — offline-first, installerbar, ingen build-step.  
**Hosting:** GitHub Pages.  
**Backend:** Firebase (prosjekt `home-tasks-app-18de3`) — Firestore + Google Auth.  
**Frontend:** Vanilla JS + HTML + CSS, single-page app, tab-navigasjon.  
**Versjon:** v176u (konstant i `app.js`).

### Filer

```
Treningsapp/
├── index.html          # App-skall, 5 seksjoner (Hjem, Kalender, Logg, Innsikt, Innstillinger)
├── app.js              # App-logikk, Firebase-init, coach-system, sync, state og UI-wrappere.
├── app-state.js        # Defaults og bakoverkompatibel normalisering av samlet app-state.
├── local-state-store.js # Normalisert lokal snapshot- og recovery-lagring.
├── training-repository.js # Firestore-repository for treningsdata.
├── domain-training-plan.js # Ren ukeplan-, rolle- og øktforslagslogikk.
├── domain-periodized-training-plan.js # Historiske ukesmål og ren blokkdomene-logikk.
├── training-plan-controller.js # Skrivefri current+next-diff og konfliktpolicy.
├── training-plan-ui.js # Mobil hurtigflyt og full blokkforhåndsvisning uten skriving.
├── calendar-ui.js      # Kalendergrid, månedsnavigasjon og dagsmodal.
├── domain-core.js      # Rene testbare domenehjelpere uten DOM/Firebase/state.
├── domain-activity.js  # Kildeuavhengig aktivitetsmiljø og bakoverkompatibel avledning.
├── domain-performance-insights.js # Ren årsoppsummering, høydepunkter og milepæler.
├── domain-insight-confidence.js # Felles evidenskontrakt for dekning og vurderingssikkerhet.
├── insight-confidence-ui.js # Progressiv og tilgjengelig visning av innsiktsgrunnlag.
├── training-insights-ui.js # Avgrenset rendering av prestasjonsinnsikt.
├── workspace-sections-ui.js # Lokal seksjonsnavigasjon og progressive Innsikt-/Mål-paneler.
├── domain-coach.js     # Rene coach-beslutninger, heltekorttilstand, volum-ramp og comeback.
├── domain-goals.js     # Rene testbare konkurranse-/mål-hjelpere uten DOM/Firebase/state.
├── domain-coach-rules.js # Validering, defaults, merge og fallback for coach-regler.
├── styles.css          # Design-tokens (oransje #ff4f2e), mobil-først, 2 000+ linjer.
├── manifest.json       # PWA-manifest
├── service-worker.js   # Offline-cache
├── INTERVALS_DESIGN.md # Designnotat for strukturert intervallstøtte
├── STREAK_FREEZE_DESIGN.md # Designnotat for fryskort/streak freeze
├── data/
│   └── coach-rules.json          # Strukturert versjon av coachreglene (7 prinsipper)
├── Treningsfilosofi/
│   ├── Marius Bakken treningsfilosofi.pdf   # Kildedokument (4,4 MB)
│   └── coach-rammeverk.md                  # Ekstraherte prinsipper, beslutningsprioritet, ukeskjema
├── Kravspesifikasjon/  # Kravdokumenter
└── progress.md         # ← denne filen
```

### Firestore-samlinger (per bruker)
`templates` · `planned` · `completed` · `wellness` · `challenges` · `blockedDays` · `raceResults` · `settings/preferences`

### Hva som allerede er bygget
- Google-innlogging, offline-sync med statusindikator
- Maler og planlegging av økter (kalendervisning)
- Loggføring med RPE, smerte, treningseffekt (Garmin), HRV
- Belastningsvurdering (lav / moderat / høy) basert på RPE + HRV + Garmin-effekt
- Coach-regler v2 med 7 Bakken-prinsipper, validering og trygg runtime-fallback
- Innsikt-fane med grunnleggende statistikk
- Utfordringer/mål-modul
- **Coach-kontekst v1** (v75): `buildCoachContext()` samler nå-bilde fra 7/14/28 dager, gylne sone, HRV, kroppssignaler, ukesroller, challenges. Coach-noten på Hjem og Innsikt kjører ekte logikk. "?"-knapp viser grunnlaget.
- **Gradert smertevurdering** (v76): `gradedPainContext()` skiller lav/moderat/høy smerte med ulik forfallstid (3/5/7 dager). Coach-noten gir tilpasset råd per nivå. Sjekk-inn-hint vises i fullføre-modal når det er relevant aktiv smerte.
- **Strukturert smertelokasjon** (v77): Fritekstfeltet for område erstattet med dropdown (kroppsdel + side). Konstanter `PAIN_AREA_REGIONS`/`PAIN_AREA_SIDES` + `formatAreaLabel()`. Lagrer `areaRegion`, `areaSide` og beregnet `area`-streng i Firestore. Eksisterende data beholdes uendret (bakoverkompatibelt).
- **Gylne sone i UI** (v78): `goldenZonePercentages(level)` kalibrerer sonen etter treningsnivå (beginner/building: 77–84 %, intermediate: 78–85 %, experienced: 80–87 %). Snittpuls i detaljvisning viser "gylne sone ✓ / over / under". Loggmodalen viser sonen som hint under pulsfeltene.
- **Trafikklymodell** (v79): Daglig beredskaps-sjekk på Hjem-fanen. Tre spørsmål: søvn (1–5), energi (1–5), valgfri hvile-HF. Output: grønn / gul / rød med anbefalt tiltak. Lagres i localStorage per dato. Rød overstyrer coach-noten til hvile-råd. Gul gir myk advarsel. Grunnlaget viser dagsform-nivå i "?"-detaljer. `TRAFFIC_LIGHT_CONFIG`, `assessTrafficLight()`, `loadDailyReadiness()`, `saveDailyReadiness()`, `renderTrafficLight()` lagt til.
- **Ukeplan: hvile-regler + klikkbare chips + forklaring** (v93): Tre forbedringer: (1) `weekPlanDatesInRange` respekterer nå «ingen konsekutive dager»-regelen (Bakken-filosofi) — plasserer forslag på dager som ikke er nabodag til allerede planlagte økter. Fallback til vanlig logikk kun om ingen ledige dager finnes. (2) «Mangler →»-chips er nå klikkbare — trykk åpner planlegg-fanen med best matchende mal pre-valgt via `planForRole(role)`. (3) Ny `skippedRoleNote` vises i oransje boks når coachen ikke foreslår en obligatorisk rolle pga. kroppssignal — forklarer WHY og guider brukeren til manuell planlegging.
- **Profesjonalisering: tryggere lagring + import + tester** (v96): Ny `safeStateWrite()` gir felles mønster for optimistisk UI, lokal snapshot, Firestore-skriving og rollback ved feil. Brukt på sentrale skriveflyter som planlegging, loggføring/fullføring, formmålinger, challenges og ikke-treningsdager. Import erstatter nå Firestore-data ved å slette eksisterende dokumenter i appens collections før backupen skrives inn, slik at gamle poster ikke gjenoppstår. Setup har nå «Gjenopprett sikkerhetskopi» basert på lokal recovery snapshot før import/reset. Ny lokal testpakke: `node tests/stability-tests.js`.
- **Utvidede lokale tester** (v96): `tests/stability-tests.js` dekker nå også challenge-progress inkl. «km igjen», fullførte mål, trafikklysets grønn/gul/rød-regler, gylne sone-prosent per treningsnivå, ukeplan-datoer som hopper over planlagte/blokkerte dager og neste-uke-forslag med ikke-sammenhengende dager.
- **Domain-core v1** (v97): Opprettet `domain-core.js` for rene, testbare funksjoner uten DOM/Firebase/state. Flyttet dato-hjelpere, trafikklys-regel, gylne sone-prosenter, ukeplan-datoer, challenge-progress og challenge-etiketter. `app.js` beholder små wrappere der dagens `state`, templates og blokkerte dager må sendes inn. Service worker cacher ny fil, og lokale stabilitetstester importerer nå produksjonsfunksjonene direkte.
- **Synlig appversjon** (v98): Setup -> Data og system -> Backup og oppdatering viser nå `Appversjon` og cache-navn. Verdien hentes fra `APP_VERSION` i `app.js`, og cache-navnet avledes som `treningsapp-${APP_VERSION}`. Release-checklist og agentregler minner nå om å kontrollere synlig versjon etter versjonsbump/opplasting.
- **Kalenderdag oppdateres etter fullført økt** (v99): Når en planlagt økt markeres som utført fra kalenderdag-modal, tegnes den åpne dagen nå opp igjen umiddelbart. Økten flyttes dermed visuelt fra `Planlagt` til `Utført` uten at brukeren må lukke og åpne kalenderen.
- **Intervall-arkitekturgrunnlag** (v100): `ARCHITECTURE.md` har nå et tydelig feature-mønster for nye funksjoner: ren domene-logikk i `domain-core.js`/egen domene-fil, små wrappers i `app.js`, UI foreløpig i `app.js`/`index.html`, tester fra produksjonsfil og PWA-cache ved nye runtime-filer. Opprettet `INTERVALS_DESIGN.md` med bakoverkompatibel `structuredWorkout`-modell som beholder eksisterende `structure`-tekstfelt. Flyttet rene varighet-/tempo-hjelpere til `domain-core.js` som grunnlag for senere intervallstøtte.
- **Best Practice Guardrails før intervaller** (v101): Tydeligere feature-regler i `ARCHITECTURE.md` og `AGENTS.md`: datamodell først, ren logikk i domene, små `app.js`-wrappers, bakoverkompatible felter, normalisering før bruk og versjon/cache-kontroll. Lagt til `normalizeTemplate()` og `normalizeStructuredWorkout()` i `domain-core.js`. Firestore-load, backup-import og lokal snapshot normaliserer nå templates før bruk. `settings.features.structuredIntervals` er lagt inn som intern feature flag, uten synlig UI.
- **Strukturert intervallstøtte v1** (v102): Øktmaler kan nå valgfritt lagre `structuredWorkout` med oppvarming, én intervallblokk, repetisjoner, arbeidstid, hviletid, hviletype, intensitet, nedjogg og notat. Eksisterende `structure`-tekstfelt beholdes og gamle maler får `structuredWorkout: null`. Strukturert sammendrag vises på øktmaler, planlagte økter og detaljvisning når feltet finnes. `domain-core.js` har rene funksjoner for bygging, normalisering, arbeid/hvile/total tid og formattering. Stabilitetstestene dekker 20 x 45/15, fallback ved ugyldig struktur og at backup/import/lokal snapshot bevarer feltet.
- **Bedre intervallopplevelse og enkel innsikt** (v103): Strukturert intervallinfo vises nå som mer nyttig breakdown med kompakt form (`20 x 45/15`), oppvarming, arbeid, hvile, nedjogg, total varighet, hviletype, intensitet og notat. Innsikt har en liten intervallblokk som vises når det finnes strukturerte intervalløkter siste 28 dager: antall økter, total intervallarbeid, hvile i drag og siste strukturerte intervalløkt. Nye rene funksjoner i `domain-core.js`: `structuredWorkoutCompactText()`, `structuredWorkoutBreakdown()` og `structuredIntervalInsights()`.
- **Coach forstår strukturert intervallarbeid** (v104): Intern coach-context bruker nå `structuredWorkout` som støtteinformasjon. Strukturerte intervalløkter teller som kvalitetsarbeid når de har intervallblokk med arbeidstid. Coach-grunnlaget ser antall strukturerte intervalløkter og total arbeidstid siste 7/14/28 dager, siste strukturerte økt og om kvalitetsøkter ligger tett. Coach-notisen kan derfor anbefale rolig/restitusjon etter tett intervallarbeid, anerkjenne kontrollert kvalitet ved god balanse eller foreslå kontrollert terskel/intervall når kvalitet har manglet lenge og signalene er grønne. Nye rene funksjoner: `hasStructuredIntervals()` og `structuredIntervalContext()`.
- **Diskret sletting fra loggdetalj** (v105): Fullførte historiske økter kan nå slettes fra detaljvisningen via en diskret knapp nederst i modalvinduet. Handlingen bruker eksisterende bekreftelse og trygg `safeStateWrite()`/rollback-flyt. Økter som kommer fra planlagt økt viser fortsatt «Angre utført» og flyttes tilbake til planlagt.
- **Desktop layout enhancement** (v106): Mobilvisningen er beholdt som baseline, mens brede skjermer fra 900 px får bedre utnyttelse av flaten. `.app` og bottom nav utvides til desktopbredde, Innsikt får 2-kolonne kortflyt, Kalender viser kalender og ukeplan side ved side, Setup-overview bruker 2 kolonner, og Historikk får bredere filter/listeoppsett. Endringen er primært CSS og endrer ikke datalogikk.
- **Desktop layout finpuss** (v107): Hjem-siden bruker nå desktop-grid der Neste/Dagens økt og Dagsform ligger ved siden av hverandre på brede skjermer, mens Coach-notis og Denne uken fortsatt går full bredde. I Innsikt er Formutvikling gjort full bredde på desktop slik at Garmin-grafene får bedre lesbarhet. Mobilopplevelsen er uendret.
- **Innsikt uten duplisert coach-notis** (v108): Coach-notis-kortet er fjernet fra Innsikt fordi samme råd allerede ligger på Hjem. Innsikt rendrer nå uten duplisert coachkort, mens `renderInsights()` er null-safe hvis gamle elementer ikke finnes.
- **Konkurranse/race som øktmetadata** (v109): Øktmaler har nå innebygd `race` som Øktrolle (`Konkurranse / race`) og Coach-formål (`Konkurranse / testløp`). Dette gir en trygg måte å logge faktiske løp/testløp, for eksempel 2 km race, uten fri konfigurasjon som coachen ikke forstår. Race teller som hard/kvalitetsøkt i intern coach-/innsiktslogikk og behandles ikke som restitusjon. Bakken-standardmalene inkluderer nå `2 km race / testløp`.
- **Dagens beslutning på Hjem** (v110): Hjem-kortet for coachråd viser nå en tydelig, regelstyrt `Dagens beslutning` før den forklarende coach-notisen. Ren logikk i `todayDecision()` bruker dagsform, aktive kroppssignaler, nylig strukturert intervallarbeid, dagens/neste planlagte økt, dager siden siste økt og ukemål. Målet er at brukeren raskere ser hva appen anbefaler å gjøre i dag, uten AI og uten endret brukerflyt.
- **Race/testløp-opplevelse v1** (v111): Fullførte økter kan nå ha valgfri `raceResult` med løpsnavn, distanse, resultattid, løype/sted, PB-flagg og notat. Innsikt har egen seksjon for `Personlige bestenoteringer` på 1 km, 2 km, 3 km, 5 km, 10 km, 12 km, halvmaraton og maraton, beregnet fra registrerte race/testløp. Setup har `Mål-løp` med ett prioritert løp og nedtelling i Innsikt, for eksempel Halv-Birken 12 km. Gamle økter fungerer uendret via trygg normalisering.
- **Race/testløp-opplevelse v2** (v112): Resultattid i loggføring og måltid for Mål-løp bruker nå samme t/min/sek-format som varighet, som gir mindre feil på mobil. Mål-løp-layouten og modalene er strammet inn for å hindre horisontal scrolling/overlapp på små skjermer. Setup -> Mål-løp har nå manuelle race-resultater for gamle tider som ikke finnes i loggen, lagret i `raceResults`; personlige bestenoteringer kombinerer loggede race/testløp og manuelle resultater.
- **Mobil- og Setup-fiks for race/testløp** (v113): Detailmodalen låses nå til vertikal scroll og lange tags/tekst brytes innenfor skjermen, slik at historikkdetaljer ikke kan skli sideveis på mobil. Dato/distanse-rader i modal/Setup kollapser til én kolonne på små skjermer for å unngå overlapp. Setup -> Mål-løp er ryddet opp med to kompakte accordions: `Mål-løp` og `Manuelle race-resultater`; blyantknappen i PB-visningen åpner automatisk riktig seksjon.
- **PB-historikk per distanse** (v114): Personlige bestenoteringer er nå klikkbare. Trykk på en distanse åpner en enkel historikkmodal med beste tid, siste tid, antall resultater, utvikling fra første til siste, graf og komplett resultatliste. Historikken kombinerer loggede race/testløp og manuelle race-resultater. Blyantknappen på PB-kortene er fortsatt snarvei for å legge inn manuelt resultat.
- **Race-beredskap for mål-løp** (v115): Mål-løp-kortet i Innsikt viser nå en enkel regelstyrt status: målpace, siste relevante test, estimert mål-tid basert på siste testpace, en kort vurdering og neste smarte steg. Beregningen bruker eksisterende mål-løp, loggede race/testløp og manuelle race-resultater, uten AI og uten ny skjerm.
- **Skadesignal-oppfølging i Dagsform** (v116): Hvis det finnes nylig smerte fra logget økt eller daglig oppfølging, viser Dagsform en diskret oppfølgingsdel der dagens smerte, utvikling, område og notat kan lagres uten å logge en fake økt. Data lagres i `settings.dailyReadiness[date].injuryCheckin`, normaliseres sammen med øvrig dagsformdata og brukes i coach-kontekst/ukeplan som kroppssignal før neste planlagte økt.
- **Kompakt smerteoppfølging på Hjem** (v117): Smerteoppfølgingen i Dagsform er nå kollapset som standard etter lagring eller når den bare skal følges opp. Hjem viser en kort signalrad med smerte/trend og `Endre`/`Registrer`, mens hele skjemaet åpnes først når brukeren aktivt vil registrere eller endre smerte. Dette holder Hjem-skjermen mer skannbar uten å fjerne funksjonalitet.
- **Mer presis smertebedring i Dagens råd** (v118): Hvis høy smerte fra tidligere dag følges opp med dagens smerte på 1–3/10 og trend `bedre`, tolker `Dagens råd` dette som forsiktig gul oppfølging i stedet for ren høy-smerte-alarm. Rådet anbefaler fortsatt hvile, alternativ trening eller svært rolig test, men teksten anerkjenner forbedringen og unngår å overstyre dagens innsjekk.
- **Skadesignal-innsikt v2** (v119): Innsikt har nå en egen `Skadesignal`-seksjon når det finnes smerte fra siste 7 dager. Den kombinerer smerte fra loggede økter og daglig Dagsform-oppfølging, viser trend som `5 -> 3`, område, status (`Bedres`, `Følg nøye`, `Forverres`, osv.), anbefaling, konkret lavrisiko handling og når coachen kan slippe signalet. Ren oppsummeringslogikk ligger i `injurySignalSummary()` i `domain-core.js`.
- **Skadejusterte øktvalg** (v120): Dagens råd viser nå en kompakt handlingsboks når skadesignal er aktivt. Den foreslår konkrete lavrisiko alternativer som hvile, rolig sykkel, mobilitet eller 10-20 min svært rolig test. Hvis neste planlagte økt er terskel/intervall/race eller høy belastning, forklarer boksen at økten bør flyttes, gjøres roligere eller byttes ut. Ren regel ligger i `injuryAdjustedWorkoutAdvice()` i `domain-core.js`; appen endrer ikke kalenderen automatisk.
- **Konkurranseplan mot mål-løp** (v121): `Mål-løp`-kortet viser nå en regelstyrt konkurranseplan med fase (`Basebygging`, `Testfase`, `Spesifikk oppkjøring`, `Taper / rolig siste uke`), uker igjen, fokus neste 2-4 uker, anbefalt neste test og risikomerknad ved aktivt skadesignal. Planen bruker eksisterende mål-løp, race readiness og skadesignal, uten AI og uten å endre kalenderen automatisk.
- **Mål-fane og Setup i header** (v122): Setup er flyttet ut av bunnnavigasjonen og åpnes nå fra et diskret tannhjul i headeren. Den frigjorte bunnnav-plassen brukes til ny `Mål`-fane som samler `Mål-løp`, `Personlige bestenoteringer` og `Challenges`. Innsikt rendrer dermed mer som analyse/mønstre, mens måloppfølging får egen motivasjonsflate.
- **Konkurranse-/målmodul** (v123): Ren race- og mål-logikk er flyttet fra `domain-core.js` til ny `domain-goals.js`: race-resultater, manuelle resultater, PB-oppsummering, PB-historikk, mål-løp-nedtelling, race readiness og konkurranseplan. `app.js` importerer mål-funksjonene direkte fra ny modul, mens `domain-core.js` re-eksporterer dem midlertidig for bakoverkompatibilitet. Service worker cacher ny runtimefil, og stabilitetstestene importerer race-/mål-funksjoner direkte fra `domain-goals.js`.
- **Mål-fane v2** (v124): Mål-fanen har nå et handlingsorientert toppsammendrag som viser aktivt mål, fase, målpace, siste relevante test, status og neste smarte steg. Oppsummeringen tar hensyn til siste 7/28 dager og aktivt skadesignal, slik at testløp/hard kvalitet tones ned når kroppen varsler. Ren vurderingslogikk ligger i `goalMotivationSummary()` i `domain-goals.js`; UI-et er kun en kompakt visning i eksisterende Mål-fane.
- **Mål-fane v3: Delmål og milepæler** (v125): Mål-fanen viser nå 3-5 konkrete delmål mot prioritert mål-løp, for eksempel skadefri/stabil uke, stabil 4-ukers base, kontrollert kort test, lengre relevant test og spesifikk oppkjøring/taper. Milepælene tar hensyn til siste 7/28 dager, mål-løp, race readiness og aktivt skadesignal. Ren logikk ligger i `goalMilestones()` i `domain-goals.js`.
- **Skadeoppfølging v2: Trend og frislipp** (v126): Skadesignal-kortet viser nå tydeligere frislipp-vurdering: trend, neste trygge økt, kriterier før løping/kvalitet og om hard kvalitet bør holdes igjen. Ren logikk ligger i `injuryRecoveryGuidance()` i `domain-core.js` og bruker samme smertehistorikk som dagsform/logg.
- **Race/testløp-anbefaler** (v127): Mål-fanen viser nå en regelstyrt anbefaling for om brukeren bør teste nå, hvilken distanse som er mest relevant og hvorfor. Anbefalingen bruker mål-løp, fase, siste relevante test, siste 7/28 dager, nylig hard belastning og aktivt skadesignal. Ren logikk ligger i `raceTestRecommendation()` i `domain-goals.js`; appen endrer ikke kalenderen automatisk.
- **Ukeplan smartere mot mål-løp** (v128): Hjem -> Ukeplan bruker nå mål-løp, konkurransefase, race/testløp-anbefaling og skadesignal som støtteinformasjon. Ukeplanen viser en kompakt forklaringsboks for hvorfor den prioriterer rolig base, kontrollert test, spesifikk oppkjøring eller taper. Race/testløp foreslås bare når `raceWeekPlanContext()` vurderer det som nyttig og trygt; aktivt skadesignal eller taper holder race/hard kvalitet igjen.
- **Mål-score med tydelig utvikling** (v129): Mål-fanen viser nå en 0-100 mål-score med trend mot forrige uke og neste viktigste forbedring. Scoren beregnes fra eksisterende data: kontinuitet, rolig volum, kontrollert kvalitet, skadefrihet og race-/teststatus. Ren logikk ligger i `goalProgressScore()` i `domain-goals.js`; appen lagrer ikke nye scorefelter.
- **PB-historikk v2** (v130): Personlige bestenoteringer viser nå mer levende kort med beste, siste, antall resultater og trendstatus som PB, nær PB, bedre trend eller tregere siste. Historikkmodalen viser forbedring fra første til siste, avstand til PB, tydeligere grafetiketter og status. Ren analyse ligger i `personalBestTrendSummary()` og `personalBestTrendLabel()` i `domain-goals.js`.
- **Dagens råd v2** (v131): Hjem -> Dagens råd viser nå mer konkret daglig støtte under hovedbeslutningen: `Gjør nå`, `Støtte` og `Hvorfor`. Rådet bruker eksisterende dagsform, planlagt økt, skadesignal, mål-score, racefase og ukestatus til å foreslå justering, lavrisiko-alternativ eller kontrollert gjennomføring. Små støttepåminnelser om drikke, karbohydrater, protein, søvn og restitusjon vises når relevant. Ren støttefunksjon ligger i `dailyCoachSupport()` i `domain-core.js`; ingen nye datafelter lagres.
- **Dagens råd etter gjennomført økt** (v132): Når en økt er fullført samme dag, skifter Hjem-rådet fra før-økt-anbefaling til etter-økt-vurdering. Ny ren `todayCompletedWorkoutFeedback()` vurderer siste fullførte økt i dag mot belastning, RPE, gjennomføring og smerte før/etter. Rolig økt med lav smerterespons gir "Bra justert økt", mens smerteøkning etter økt gir tydelig varsel og anbefaling om hvile/alternativ trening. Rådet bruker samme støttefelter for væske, mat, restitusjon og neste smertesjekk.
- **Coach-grunnlag v2** (v133): "Grunnlag" under Dagens råd er nå en strukturert, scannbar liste i stedet for én lang tekstlinje. Ny ren `coachDecisionBasis()` i `domain-core.js` lager forklaringspunkter som Beslutning, I dag, Plan, Dagsform, Kroppssignal, Uke, Mål, Kvalitet og Signaldata. `app.js` mapper eksisterende coach-context inn i denne funksjonen og renderer korte rader med statusfarge. Dette gjør rådet mer forståelig og gir et bedre fremtidig grunnlag for AI-chat uten å endre datamodell.
- **Dashboard heltekort** (v134): Hjem-toppen er slått sammen fra tre separate kort (`Neste økt`, `Dagsform`, `Dagens råd`) til ett heltekort. Dagsform vises som statuschip, dagens/neste økt eller fullført økt vises som hovedbudskap, og én kort anbefaling står synlig. Øktdetaljer, forberedelse og grunnlag ligger bak utvidbare rader. Eksisterende coach-logikk, dagsformskjema, skadeoppfølging, fullføring og grunnlagsvisning gjenbrukes uten ny datamodell. Heltekortet inkluderer også en enkel intensitetsstripe for 14 dager som første steg mot mer visuelt dashboard.
- **Dashboard motivasjonskort** (v135): Hjem har nå tre kompakte motivasjonskort under heltekortet: `Mål-løp` med aktivt mål, uker/nedtelling, mål-score og fase; `Kontinuitet` med streak og 8-ukers minigrid; og `Siste høydepunkt` med ny PB/testløp eller siste registrerte race/test. Kortene gjenbruker eksisterende mål-, PB- og kontinuitetslogikk uten ny datamodell.
- **Denne uken og challenge-status v2** (v136): Hjem-kortet `Denne uken` viser nå øktring, tid, kilometer, belastning og dagsstolper for ukeprogresjon. Aktiv challenge har fått forventet takt-markør og tydelig status som `I rute` eller `Bak takt`, basert på eksisterende challenge-progress, periode og dagens dato. Endringen er kun visuell/regelstyrt og introduserer ingen ny datamodell.
- **Dashboard fargesystem og desktop polish** (v137): Dashboardets statusfarger er strammet inn: planlagt er nøytralt, `I rute`/progresjon er grønt, `Bak takt`/obs er gult og rødt holdes til stopp/avvik/kroppssignal. Ukestolper og ukekortet på Hjem er gjort roligere og mer desktop-vennlige, mens oransje i større grad er beholdt som merkevare- og handlingsfarge.
- **Planlagt neste dashboardrunde**: Roadmap/backlog er oppdatert etter v137-test. Neste anbefalte runde er v138 `Heltekortets tilstander og v137b polish`: fullført økt gir feiring resten av dagen, konflikt mellom dagsform/belastning og hard plan gir handlende bytteforslag, hviledag blir positiv tilstand, langt opphold gir velkommen-tilbake-forslag, og v137b fikser dobbel `1/3`, for dominante dagsstolper og ubalanse i desktop-rutenettet. Fryskort for kontinuitet er lagt inn som planlagt guardrail før en fremhevet streak kan ryke urettferdig.
- **Heltekortets tilstander og v137b polish** (v138): Ny ren `homeHeroState()` i `domain-core.js` klassifiserer heltekortet som fullført økt, konflikt, hviledag, langt opphold eller normal plan. Konflikt mellom hard planlagt/neste økt og gul/rød dagsform, kroppssignal eller skjev 14-dagers intensitetsbalanse gir nå tydelig bytteforslag. Bytteknappen bruker eksisterende mal-matching og bekreftet `safeStateWrite` for å bytte til rolig/restitusjonsmal. Hjem-polish: dobbel `1/3` er fjernet, dagsstolpene er komprimert, og `Denne uken` bruker desktop-rutenettet mer balansert.
- **Dagsform-chip i heltekort** (v138b): Fikset at dagsform-chipen øverst i heltekortet kunne vise `Gult lys` når faktisk registrert dagsform var grønn, fordi konflikt-tilstanden overstyrte chipen. Chipen viser nå alltid faktisk dagsform, mens belastnings-/intensitetskonflikt vises som egen heltekort-tilstand og tekstes som `Belastning` når det er intensitetsbalansen, ikke dagsformen, som varsler.
- **Base med høy puls skilles fra hard kvalitet** (v138c): Ny ren `classifyWorkoutIntensityContext()` i `domain-core.js` skiller rolige/baseøkter med høy puls fra terskel/intervall/race. Slike økter kan fortsatt gi moderat belastning og pulsvarsel, men teller ikke som hard kvalitetsøkt i coach-context, Bakken-mønstre eller heltekortets konfliktlogikk. Coach-grunnlag og notis forklarer når baseøkter har høy puls uten å tolke dem som ny terskelbelastning.
- **Mål-kort v2 på Hjem** (v139): Hjem-kortet for mål-løp viser nå mål-score med trend fra forrige periode, fase, neste relevante milepæl og ett praktisk neste steg. Kortet gjenbruker `goalMotivationSummary()`, `goalMilestones()`, `raceGoalPlan()` og `raceReadinessSummary()` fra `domain-goals.js`, uten ny datamodell. Tomtilstand uten mål viser nå en tydelig “Velg et mål å jobbe mot”-retning.
- **Desktop layout patch** (v139b): Hjem-dashboardet på brede skjermer har nå eksplisitt grid-plassering: heltekortet ligger øverst i venstre kolonne, `Denne uken` rett under, og Mål/Kontinuitet/Siste høydepunkt ligger i høyre kolonne. Dette fjerner stort tomrom under heltekortet etter v139 uten å endre mobilflyt eller innhold.
- **Forklarbar Mål-score** (v139c): Mål-fanen har nå et utvidbart `Vis scoregrunnlag` under Mål-score. Den viser de fem eksisterende score-komponentene fra `goalProgressScore()` (`Kontinuitet`, `Rolig grunnlag`, `Kontrollert kvalitet`, `Skadefrihet`, `Race/test-status`) med poeng/status, forklaring og neste viktigste forbedring. Hjem-kortet forblir kompakt og sender brukeren videre til Mål-fanen.
- **Kalender polish og handlingsflyt** (v141): Kalender og ukeplan er gjort mer skannbare uten ny datamodell. Planlagte økter forblir nøytrale, mens eksisterende template-metadata brukes til kompakte kontekstchips for `Rolig`, `Recovery`, `Kvalitet`, `Race/test`, `Styrke` og `Alternativ`. Ukeplanradene viser nå dato/status, øktnavn, metadata og kort grunnlag mer ryddig, kalendergridet får diskrete kategori-markører, dagsmodalen grupperer økter tydeligere, og desktop-layouten gir ukeplanen litt mer bredde.
- **Mobilkalender readability patch** (v141b): Månedskalenderen på mobil beholder full økttekst, men fjerner den tykke venstre-rail-markøren på kalender-events og bruker svak bakgrunnsfarge som statusmarkering i stedet. Mobilcellene har mindre padding/gap og normal tekstbryting for å gi øktnavnene mer bredde. Desktop-stylingen fra v141 beholdes.
- **Logg polish** (v142): Logg-radene viser nå mer nyttig historikk direkte uten å åpne detaljmodal: kategori, rolle/formål, belastning, race/test/PB-kontekst, strukturert intervall-status, smerterespons og tydelige nøkkeltall for varighet, distanse, pace, puls og RPE der data finnes. Visningen bruker eksisterende helperlogikk for varighet, pace, belastning og template-kategorier, og detaljmodal/slette-/angre-flyt er beholdt uendret. Mål-fanen ble ikke endret i denne runden.
- **Logg oversikts-polish** (v142b): Logg-radene er trimmet tilbake til en tydelig oversiktsflate på mobil. Standardkort viser nå øktnavn, dato, aktivitet/intensitet og én kompakt hovedlinje med distanse, tid og puls der data finnes. Pace, RPE, flere chips og `Utført`-badge er fjernet fra standardkortet, mens fargestripe og maks én prioritert chip (`Race/test`, `Kroppssignal`, `Høy belastning`, `Strukturert` eller `Kvalitet`) beholdes. Detaljmodalen har fortsatt full informasjon.
- **Hjem ukestatus mobilpatch** (v142c): `Denne uken`-kortet på Hjem har fått mobilspesifikke tekst- og boksguarder for de små statkortene. `Balansert`/belastningsfeltet og labelen `BELASTNING` beholder full tekst, men bruker strammere mobiltypografi, normal ordbryting og `hyphens: none` slik at teksten ikke brekkes bokstav-for-bokstav eller presses ut av boksen. Endringen er CSS-only bortsett fra versjon/cache.
- **Roadmap-status etter v142** (dokumentasjon): Logg-delen av v142 er markert ferdig etter v142/v142b, med v142c som separat mobilpatch på Hjem. Ikke-leverte idéer fra opprinnelig v142-scope er flyttet til versjonsløse backlogspor for Mål/PB-historikk, challenge-arkiv og eventuell Logg-gruppering.
- **Coach foundation prioritert** (v143a, dokumentasjon): Ekstern coach-review er analysert. Roadmap/backlog prioriterer nå en validert `coach-rules.json` v2, gylne-sone-fiks, én kanonisk intensitetsbalanse, volum-ramp/comeback og gradvis uttrekk til `domain-coach.js` før fryskort og AI. Fryskort er flyttet til v147 design / v148 implementering. `ARKITEKT_CONTEXT.md` presiserer én sannhetskilde for coach-regler og forbud mot dupliserte terskler. Ingen runtime-filer eller versjon/cache er endret.
- **Coach-regler v2 med trygg fallback** (v143b): `data/coach-rules.json` er oppgradert til et versjonert v2-skjema med prinsipper, prioritet, terskler og fremtidig policy. Ny `domain-coach-rules.js` validerer hovedseksjoner og kjente verdier, fyller manglende nested-felter fra defaults og faller helt tilbake ved ugyldig fil, feil versjon eller lastefeil. `app.js` bygger nå `COACH_FRAMEWORK` fra aktive regler/defaults. Service worker bruker network-first for regelfilen, cache som offline-fallback og hardkodede defaults som siste sikkerhetsnett. Coachens terskelbaserte atferd er ikke tunet eller koblet om i denne runden.
- **Gylne-sone-fiks og kanonisk intensitetsbalanse** (v144): Rolig/base med høy puls klassifiseres nå som eget rolig-brudd, mens intervall, kvalitet og race ikke omtales som for harde rolige økter. Kvalitet over kontrollert gylne-sone-tak får egen vurdering, og manglende puls gir ingen falsk advarsel. Én ren intensitetsbalanse brukes nå av Hjem, Dagens råd/coach-grunnlag og Innsikt. Vindu, minimumsgrunnlag, hardandel og behandling av `highPulseBase` kommer fra aktive, validerte coach-regler med fallback.
- **Volum-ramp og comeback-protokoll** (v145): Ny ren `trainingVolumeRamp()` sammenligner de siste 7 dagene med ukesnittet fra de foregående 4 ukene og varsler bare når grunnlaget er tilstrekkelig. Ny `comebackProtocol()` skiller kontrollert retur fra lengre pause og holder redusert forventning aktiv i første returuke. Terskler og faktorer kommer fra validerte coach-regler. Hjem, Dagens råd, heltekortets konfliktvurdering, coach-grunnlaget og ukeplanen bruker samme vurdering. Under comeback reduseres ukemålet bare i runtime-visningen; lagrede mål og datamodell endres ikke.
- **Første `domain-coach.js`-uttrekk** (v146): Ny ren coach-domene-modul er opprettet. `todayDecision()`, `homeHeroState()`, `coachDecisionBasis()`, `trainingVolumeRamp()` og `comebackProtocol()` er flyttet ut av `domain-core.js` og importeres nå direkte fra `domain-coach.js` i app og tester. `app.js` beholder state-, Firebase- og render-wrappere. PWA-cache inkluderer den nye runtime-filen.
- **Fryskort design** (v147, dokumentasjon): `STREAK_FREEZE_DESIGN.md` dokumenterer fryskort som motivasjonsbeskyttelse for legitime avbrudd, ikke som treningsdata. Foreslått v148-modell er ny `continuityFreezes`-collection med datointervall, årsak, notat, kilde og status. Designet avklarer at fryskort kan beskytte streak, kontinuitetsvisning og urimelig "bak takt"-følelse, men aldri økter, kilometer, minutter, PB, challenge-volum eller comeback-/skadesignal. Ingen runtime-filer, versjon eller cache er endret.
- **Fryskort implementering** (v148): Liten manuell fryskort-v1 er bygget. `continuityFreezes` lastes fra Firestore, normaliseres, inngår i backup/import/recovery/replace/reset og har ren domene-logikk i `domain-coach.js` for datoer, ukevern og status. Hjem/Kontinuitet åpner modal for å fryse periode, viser aktiv/arkivert liste og støtter arkiver/slett med bekreftelse. Kontinuitetsstreak, Hjem-ukestatus og Innsikt/Kontinuitet kan vise beskyttet uke uten å telle fryskort som trening, volum, PB, challenge-progress eller kvalitet.
- **Fryskort Hjem-feedback** (v148b): Hjem viser nå en tydelig status når dagens dato ligger innenfor et aktivt fryskort, også når én dags fryskort ikke beskytter hele uken etter policy. Kontinuitet-kortet skiller mellom “Fryskort aktivt i dag” og “Kontinuitet beskyttet denne uken”, og `Denne uken`-notatet sier at uken fortsatt teller etter vanlig mål når kun dagens dato er fryst. Fryskortmodalen har norsk periodeforhåndsvisning under dato-inputene.
- **Fryskort modal mobilpatch** (v148c): Lagrede fryskort i modalen er mobiltilpasset. På små skjermer vises hvert fryskort som én kolonne med årsak/dato/status og notat øverst, og Arkiver/Slett som kompakte knapper nederst. Tekst og lange notater brytes innenfor kortet, og knappene presser ikke lenger innholdet sammen.
- **Coach Decision Engine v1** (v149): Ny ren `coachDecisionEngine()` i `domain-coach.js` samler flere samtidige coach-signaler i én strukturert pakke med `primarySignal`, sekundærsignaler, `blockedActions`, `allowedActions` og `guardrails`. Hovedsignal velges etter eksplisitt prioritet: skadesignal, dagsform, comeback/volum-ramp, intensitetsbalanse, morgendagens kvalitet og normal plan. Hjem-wrapperen bruker pakken uten stor UI-endring. Planlagt kvalitet i morgen kan nå gi mykt råd om lett dag i dag, og kontrollert kvalitetsøkt uten smerteøkning gir grønnere post-workout-feedback.
- **AI Coach Context v1** (v150, implementert lokalt): `buildAiCoachContext()` i `domain-coach.js` bygger en versjonert, whitelistet og størrelsesbegrenset pakke fra den samme `coachDecisionEngine()` som appen bruker. Context inkluderer relevante 7/14/28-dagerssummer, dagsform, plan, mål, kontinuitet og høydepunkter, men utelater uid, e-post, secrets, rå Firestore-metadata, fritekstnotater og komplett historikk.
- **Sikker AI-backend og nøkkeladministrasjon** (v151, deployet): Ny `functions/`-backend bruker Firebase Callable Functions med Auth, server-side OpenAI-nøkkel, maskert status, kontekstvalidering, rate limit, timeout og sanitert metadata-logging. Nøkkelen skrives inn i Setup, men returneres aldri til frontend og lagres ikke i appens localStorage eller repo.
- **Read-only AI-coach chat** (v152, ende-til-ende-verifisert gjennom v154): Chatflaten bruker serverbygget systeminstruks og coach-context, har ingen web-søk, tools, dataskriving eller automatisk planendring. Før v156 beholdes meldinger kun i minnet.
- **Chat-polish, personvern og brukskontroll** (v153, deployverifisert gjennom v154): Chatten viser tilkoblingsstatus, datagrunnlag, session-forbruk, forslag, tydelige feiltilstander og eksplisitt samtykke. OpenAI-kallet er stateless (`store: false`), bruker ingen tools og sender en pseudonym sikkerhetsidentifikator.
- **AI-chat videre produktspor** (v154-v159, gjennomført): `AI_CHAT_PROJECTS_DESIGN.md` dokumenterer produktsporet. v154 ga Chat-fane og tilkoblingsstatus, v155 sikker lagringsmodell, v156 synkroniserte samtaler, og v159 samler prosjekter, egne instrukser, kontrollert samtalesammendrag, eksport, sletting og kostnadsinnsyn. Prosjektinstrukser kan aldri overstyre coachens guardrails.
- **v156 godkjent** (16. juli 2026): Samtaler er manuelt verifisert på mobil og PC med kryssenhetssynk, arkivering og sletting.
- **Coach Knowledge Foundation og AI-context v2** (v159): `coach-rules.json` v3 er validert sannhetskilde for kuraterte coach-konsepter. AI-contexten sender eksakt makspulsgrunnlag, bpm- og prosentgrenser for gylne-sone samt nivå og kunnskapsbegrensninger. Rå Markdown-/PDF-/tekniske prosjektfiler sendes ikke til modellen.
- **Nivåforklaring for gylne-sone** (v159b): AI-contexten sender nå hele den validerte nivåmodellen (77–84 %, 78–85 %, 80–87 %) i tillegg til brukerens aktive sone. Systeminstruksen skiller midlertidig dagsform/toppform fra varig treningsnivå og beregner hypotetisk bpm fra registrert makspuls.
- **Presis fakta-/vurderingsmerking** (v159c): AI-contexten markerer profilnivå som manuelt konfigurert og sender norsk nivåetikett. Systeminstruksen forbyr interne enum-verdier, automatisk nivåendring og oppdiktede tidskrav, og skal skille appfakta fra faglig vurdering og praktiske forslag.
- **AI-chat oversikts-polish** (v159d): Chatflaten prioriterer nå selve samtalen og skrivefeltet. Prosjektvalg, samtalevalg, arkivering og sletting er samlet i en kollapset `Samtale og prosjekt`-rad som fortsatt viser aktiv kontekst. Forslagsknapper skjules etter at samtalen har startet, skrivefeltet ligger før valgfritt grunnlag og er kompakt/sticky på mobil. Dataflyt, Firestore-synk og backend er uendret.
- **AI-chat fullhøyde arbeidsflate** (v159e): Chat bruker nå en egen viewport-tilstand der meldingshistorikken er det eneste skrollområdet og skrivefeltet alltid er synlig over bunnnavigasjonen. Mobil skjuler det generelle apphodet mens Chat er aktiv, meldinger har et roligere og mindre kortpreget uttrykk, og grunnlag/personvern er flyttet inn under samtaleadministrasjonen. Dataflyt, Firebase-synk, coach-context og backend er uendret.
- **Transparent treningsnivåvurdering** (v160a-v160e): Ny ren `domain-fitness.js` kombinerer 12 ukers kontinuitet, kontrollert kvalitet, RPE/kroppssignal, VO2max mot alders-/kjønnsspesifikk HUNT-referanse og egen PB-fremgang. Innsikt viser fem forklarbare dimensjoner, datadekning, neste kriterium og sikkerhetsblokkering. Fem motivasjonsnivåer kan oppnås og beholdes, men coach-profilen endres bare etter eksplisitt bekreftelse. AI-contexten får kun et sanitert nivågrunnlag; backend validerer det og forbyr AI å bekrefte eller endre nivå. Biologisk alder, BMI-score, absolutt HRV-klasse og uverifisert WMA-aldersgradering er bevisst utelatt. `aiCoachChat` med v160e-validering og systeminstruks ble deployet til Firebase 16. juli 2026.
- **Treningsnivå kalibreringspatch** (v160f): Manglende RPE eller respons etter kvalitetsøkten regnes nå som ukjent datagrunnlag, ikke kontrollert kvalitet. Tåleevne tar hensyn til faktisk registreringsdekning. Nivå 4 og 5 krever lengre observasjon og aktive uker over flere måneder, mens bekreftelse skjer ett nivå om gangen. Innsikt skiller beregnet nivå fra bekreftet progresjon og har fått et tydeligere mobilhierarki. Assessment-policyen er versjonert som v2 uten ny Firestore-modell.
- **Treningsnivå forklaringspatch** (v160g): `89/100` omtales nå som vurderingsgrunnlag og forklares som noe annet enn nivå. Udekkede krav til neste nivå hentes fra nivåmotoren, og Innsikt viser ett anbefalt neste steg basert på svakeste dimensjon med sikkerhetssignaler foran. Assessment-policyen er versjonert som v3 uten ny Firestore-modell.
- **Kontrollert webtilgang for AI-chat** (v161): Chatten har fått et frivillig `Søk på nett` per melding med eget samtykke. Nettsøk skjer bare server-side via OpenAI Responses API, med lavt søkekontekstbudsjett, blokkerte lavtillit-domener og eksisterende rate limit. Brukte kilder sanitiseres, vises klikkbart og lagres bakoverkompatibelt med samtalen, mens rå søkeresultater aldri lagres. Webinnhold er uttrykkelig underordnet `coachDecision`, `blockedActions`, guardrails og medisinske begrensninger.
- **Plan etter v161** (dokumentasjon): v162 skal gjøre nettsøk etterprøvbart og forbedre koblingen mellom planlagt økt, vær, ernæring og kildeproveniens. v163 skal legge kontrollerte modell- og resonneringsprofiler under Chat -> `Administrer +`, med serverstyrt allowlist, trygg fallback og eval før standardmodell endres. Ingen runtime-, versjons- eller cacheendring i denne planrunden.
- **Etterprøvbar webbruk** (v162): Valgt nettsøk krever nå OpenAI-webverktøyet og hvert svar får eksplisitt status for forespurt/brukt/ikke brukt samt antall sanitiserte kilder. Chat viser også tydelig hvis nettsøk ble forespurt uten et faktisk søkekall. Systeminstruksen skiller brukeroppgitt vær fra verifiserte kilder og krever at mat-, væske- og varmeråd bruker tilgjengelig øktvarighet, struktur, intensitet og tidspunkt eller merkes som generelle. Planlagte økter sender nå strukturert intervall- og estimert varighetsgrunnlag til AI.
- **Modell- og resonneringsvalg** (v163): Chat -> `Administrer +` har komprimerte svarinnstillinger for servergodkjente modellprofiler (Automatisk, GPT-5.6 Luna/Terra/Sol og GPT-5.5) og resonneringsnivå Lav/Medium/Høy. Valget lagres under brukerens backend-eide Firestore-område og synkroniseres mellom enheter. Frontend mottar bare profil-ID-er og offentlig katalog; faktiske modellkoblinger eies av backend. Ukjent profil avvises, og utilgjengelig valgt modell faller tilbake til Automatisk med synlig beskjed.
- **Ny samtale som trygg Chat-start** (v163b): Første Chat-besøk i en ny appøkt starter nå med et tomt utkast i stedet for å åpne siste lagrede samtale. Samtalelisten synkroniseres fortsatt og kan åpnes ved behov. Prosjektbytte starter også med et nytt utkast, mens administrasjonspanelet lukkes etter valg slik at skrivefeltet kommer raskere frem. Firestore-data, historikk og AI-backend er uendret.
- **State og lokal lagring trukket ut** (v164a): `app-state.js` eier nå defaults, tom state og normalisering av Firestore-, import- og snapshot-data. `local-state-store.js` eier normalisert snapshot/recovery gjennom et injiserbart storage-grensesnitt. `app.js` beholder den kjørende state-instansen og orchestrering.
- **Treningsplanlegging trukket ut** (v164b): `domain-training-plan.js` eier rolledekning, template-scoring, øktforslag og ukeplansammensetting som ren produksjonslogikk. Fallback- og prioriteringsrekkefølgen fra `app.js` er beholdt og testet.
- **Firestore-repository** (v165): `training-repository.js` kapsler ordinær lasting, CRUD, batch, import/replace og tømming av treningsdata. Auth og Firestore injiseres fra `app.js`; datamodellen er uendret.
- **Kalenderkontroller og PWA-grense** (v166): `calendar-ui.js` eier kalendergrid, månedsnavigasjon og dagsmodal med injiserte data/handlinger. Mutasjoner og persistence-wrappers forblir i `app.js`. Nye moduler er lagt i app shell; lokal shell caches atomisk, mens eksterne Firebase-moduler caches separat som best-effort. Ingen synlig UI- eller brukerflytendring.
- **AI-prosjekter og kontrollert langtidskontekst** (v159): Chat støtter flere prosjekter med egne preferanseinstrukser, backend-eid og begrenset samtalesammendrag, tømming av samtaleminne, separat JSON-eksport, rekursiv sletting og tokenoversikt. Instrukser og sammendrag er data med lavere prioritet enn coachDecision og sikkerhetsreglene.
- **AI-svarpolish** (v159): Serverprompten krever naturlig norsk ren tekst uten rå Markdown-markører. Frontend normaliserer også enkle markører fra eldre svar og renderer fortsatt sikkert med `textContent`.
- **AI-status og egen Chat-fane** (v154, implementert lokalt): Chat er nå sjette hoveddestinasjon etter Mål og har fortsatt fritekstfelt, forslag og read-only adferd. Setup skiller nøytral `Server-side`-merking fra en dynamisk status-tag med `Tilkoblet`, `Ikke tilkoblet`, `Nøkkel avvist` eller `Utilgjengelig`. Lagring og eksplisitt tilkoblingstest persisterer siste status i det maskerte serverdokumentet, uten å eksponere nøkkelen. Seks-fane-layouten har egne mobilregler. Automatisk test er bestått; manuell innlogget mobil/PWA-test gjenstår etter deploy.
- **v154 ende-til-ende godkjent** (12. juli 2026): Setup viser `Tilkoblet`, alle seks faner fungerer, og Chat har svart på et ekte fritekstspørsmål med data fra appens coach-context. Punktvis Markdown-stil i svarene er notert som senere svar-/render-polish.
- **Chat persistence sikkerhetsgrunnlag** (v155, ferdig og deployet 12. juli 2026): Ny ren `functions/ai/chat-persistence.js` låser schema v1, ID-/feltvalidering, backend-only sletting, separat backup-policy og begrenset modellvindu. Produksjonsreglene ble lest i Firebase Console og viste at prosjektet deles med familie-/husholdningsapper og har rekursiv eiertilgang under `users/{uid}`. Chatmodellen er derfor isolert til `aiChatUsers/{uid}/projects/...`. Ny `firestore.rules` bevarer eksisterende appregler, nekter klienttilgang til AI-nøkler/usage og gjør chat skrivebeskyttet fra frontend. Emulatoren tester både isolasjonen og regresjonsvern for de delte appene. Den sammenslåtte regelfilen kompilerte og ble deployet til `home-tasks-app-18de3`.
- **Synkroniserte AI-samtaler v1** (v156, godkjent 16. juli 2026): Backend-eid samtalehistorikk, kryssenhetssynk, åpning, arkivering, sletting og gjenåpning er verifisert på mobil og PC. Full historikk sendes aldri automatisk til modellen.
- **Kryptert OpenAI-nøkkellagring** (v154 backend-sikkerhet): Før AI-deploy er nøkkellagringen oppgradert til AES-256-GCM. Firestore lagrer bare `openaiEncrypted` med ciphertext, IV, autentiseringstag, algoritme og versjon. Krypteringshemmeligheten bindes fra Firebase Secret Manager og finnes ikke i repo eller frontend. Eventuell eldre klartekst migreres ved første serverlesing. Backendtester dekker round-trip, feil hemmelighet, fravær av klartekst og statusflyt.
- **AI backend deployet** (12. juli 2026): Blaze er aktivert for `home-tasks-app-18de3`. `AI_KEY_ENCRYPTION_SECRET` er opprettet i Firebase Secret Manager, og `aiCoachStatus`, `aiCoachSaveOpenAiKey`, `aiCoachTestOpenAiKey`, `aiCoachDeleteOpenAiKey` og `aiCoachChat` er deployet som Node 22 2nd Gen callable-funksjoner i `europe-west1`. Artifact Registry har 7-dagers oppryddingspolicy. Ekte OpenAI-test fra innlogget app er bestått.
- **Arkitekturkontekst indeksert** (dokumentasjon): `AGENTS.md` peker nå eksplisitt på `ARKITEKT_CONTEXT.md` som veiledende beslutningsramme når Codex arbeider som både utvikler og arkitekt. Den overstyrer ikke prosjektregler eller nyere brukerbeslutninger.
- **Fjernet «Foreslå neste økt»** (v92): Kortet er fjernet fra Kalender-fanen. Ukeplanen dekker samme behov bedre og er rollebevisst. `renderWorkoutSuggestion`-kallet er fjernet fra render-løkken for å unngå krasj.
- **Coach: smertegradering + priority-felt + X-økt** (v91): Tre coach-forbedringer: (1) `bodySignalState` skiller nå mellom mild smerte (1–2/10 → `cooling`, foreslår terskel etter en rolig økt) og bekymringsfull smerte (3+/10 → `caution`, kun recovery). Løser at mild smerte blokkerte terskelforslag for hele neste uke. (2) `priority`-feltet i treningsprofilen er nå aktivt: `performance` foreslår terskel straks det er rom, `injury_free_progression` krever 2 rolige øyer før terskel. (3) X-økt vises alltid som 4. forslag i normaluke når det er rom — sikrer at VO2max/teknikk/styrke alltid er synlig som alternativ.
- **Hjem: alle økter samme dag** (v90): «Neste økt» / «Dagens økt» viser nå alle planlagte økter på samme dato, ikke bare én. For fremtidige dager grupperes etter første kommende dato (`nextDateItems`). Tittelen skifter til «Dagens økt» automatisk når det finnes økter på dagens dato (eksisterende logikk).
- **Kalender overflow med øktdata** (v89): Overflow-celler viser nå faktiske økter — forrige måneds datoer viser utførte økter (grønt), neste måneds datoer viser planlagte (oransje). Cellene er klikkbare og åpner dagsmodal. Opacity 0.4 for tydelig visuell distinksjon fra inneværende måned.
- **Kalender overflow-datoer** (v88): Tomme celler i starten og slutten av månedsgridet viser nå nabomånedenes datoer med redusert opacity. Gir visuell kontekst for hvilken ukedag måneden starter på.
- **Kalender nav-fix** (v88): `.calendar-nav` konvertert fra CSS grid til flexbox med eksplisitt `height: 44px` på knappene. Piler er nå korrekt vertikalt sentrert i forhold til månedsfeltet på iOS Safari.
- **Logg-fane layout v2** (v88): Dato på egen linje, kategori + metrikk på linjen under. Konsekvent 3-linjers layout per rad: navn → dato → kategori · metrikk.
- **Logg-fane kompakt** (v88): `historyRow(c)` erstatter `completedCard` i Logg-fanen. Hvert element viser fargestripe etter intensitet (grønn/oransje/rød/lilla/grå), dato, navn, nøkkelmetrikk (distanse · tid · bpm) og pil. Knapper og tagger skjult bak «Detaljer»-klikk. Filtrene er nå bak en «Filter / Sorter»-knapp med badge som viser antall aktive filtre.
- **Hjemskjerm forenklet** (v86): Hjem viser nå kun: Dagens økt → Dagsform → Coach-notis → Denne uken (med mini challenge-progresjonslinje). Formstatus, Ukeplan, Foreslå neste økt, Handlinger og Kommende økter er flyttet til Kalender-fanen. `renderChallenges()` renderer ny `.challenge-mini` inline under «Denne uken».
- **Dagsform synkes via Firestore** (v85): `dailyReadiness` flyttet fra localStorage til `state.settings.dailyReadiness` (lagret i Firestore-dokumentet `settings/preferences`). `loadDailyReadiness()` leser nå fra `state.settings`, `saveDailyReadiness()` er async og skriver til Firestore. Automatisk opprydding av oppføringer eldre enn 7 dager. `submitTrafficLight` og `resetTrafficLight` er async. Dagsform er nå tilgjengelig på alle enheter med samme bruker.
- **Code review + robusthet** (v84): Fire rettelser fra gjennomgang: (1) `avoidWhen`-straff i `templateSuggestionScore` cappet til maks −16 for å unngå urimelig negativ score. (2) `profileWeekRole`-DOM-oppslag gjort null-safe med `?.value`. (3) `saveSettings()` fått try/catch med toast ved Firestore-feil. (4) Templates normaliseres ved Firestore-lasting: `recommendedWhen` og `avoidWhen` alltid konvertert til array via `asArray()` for bakoverkompatibilitet med eldre streng-data.
- **Unngå når — multiple choice** (v83): `avoidWhen` konvertert fra enkelt string til array. `<select>` i øktmal-skjemaet erstattet med checkboxes (samme mønster som «Passer best når»). Coach-score penaliserer nå per matching betingelse (×8 per treff). `templateAvoidWhenLabel` støtter arrays. Bakoverkompatibelt via `asArray()` — eksisterende Firestore-data med string-verdi fungerer uendret.
- **Bakken-mønstre i Innsikt** (v81): Nytt «Bakken-mønstre»-kort øverst i Innsikt-fanen. Fire mønstre siste 30 dager med grønn/gul/rød/nøytral indikator: (1) Rolig:terskel-ratio (mål ≥ 3:1), (2) Rolige dager er faktisk rolige (avgHeartRate mot gylne sone), (3) RPE på rolige dager (bør ikke være ≥ 7), (4) Ukentlig konsistens siste 4 uker. Viser «ikke nok data»-melding ved for lite historikk. `buildBakkenPatterns()` + `renderBakkenPatterns()`.
- **Trappetest + HR-baseline** (v80): Trappetest (Bakken: «kan du gå i trapp uten å bli andpusten?») lagt til som valgfritt ja/nei-spørsmål i dagsform-skjemaet. «Nei» → rød uansett øvrige scores, med begrunnelse «trappetest sviktet» i coach-noten. Hvile-HF-feltet vises kun om brukeren har en baseline i Helse-loggen; ellers forklaringstekst. Trapp-resultat vises i «?»-grunnlaget.

---

## Gap-analyse: Filosofi vs. app

| Gap | Beskrivelse | Status |
|---|---|---|
| **1. Trafikklymodell** | Daglig beredskaps-sjekk (søvn/energi/hvile-HF) → grønn/gul/rød på Dashboard | Bygget (v79) |
| **2. Den gylne sonen** | Nivåkalibrert, vist i loggmodal og detaljvisning | Bygget (v78) |
| **3. Coach-note** | Kjører ekte logikk via `buildCoachContext` + `buildCoachNote` | Bygget (v75) |
| **4. Innsikt = mønstre** | «Bakken-mønstre»-kort i Innsikt med 4 mønstre siste 30 dager | Bygget (v81) |
| **5. Interval-struktur** | Valgfri strukturert info for oppvarming, én intervallblokk, arbeid/hvile og nedjogg på øktmaler. Coach-grunnlaget forstår nå strukturert intervallarbeid. | Bygget (v102–v104) |
| **6. AI-integrasjon** | Sikker OpenAI-backend, vedvarende samtaler, prosjekter, prosjektinstrukser og kontrollert langtidskontekst er bygget. v159 trenger manuell kvalitets- og akseptansetest. | Pågår |
| **7. Gradert smerte** | Smerte vurderes nå etter alvorlighetsgrad med forfallslogikk | Bygget (v76) |
| **8. Strukturert lokasjon** | Fritekst erstattet med kroppsdel+side-dropdown, lagres strukturert | Bygget (v77) |

---

## Neste steg (prioritert)

1. **Verifiser første ekte ukesmålsnapshot**
   - Kontroller snapshotet for uken 10.–16. august før controller/persistence kan kobles på.
2. **Periodisert treningsplan v1 - Runde 4-6**
   - Bygg trygg preview/materialisering, mobil produktflate, coach-kontekst og fullført-oppsummering etter `TRAINING_PLANS_DESIGN.md`.
3. **v177 - Nedoverbelastning**
   - Skill stigning/nedstigning og kondisjons-/muskelbelastning.
4. **v178 - Kroppsmål for klær og utstyr**
   - Praktisk målehistorikk under Setup, uten kobling til coach- eller nivåscore.

### v167 - Øktmaler som egen UI-feature - Bygget

- Ny `workout-template-ui.js` eier skjema-lesing og -fylling, strukturert intervall-preview, select-options, sortering, søk/filter, coach-klarhet og bibliotek-rendering.
- `app.js` er fortsatt orchestrator for ID-oppretting, normalisering, standardmal-import, bekreftelser, state-mutasjon og Firestore/repository-skriving.
- Datamodell, eksisterende maler, strukturert intervallstøtte og synlig brukerflyt er uendret.
- Modulen ligger i PWA app shell, og stabilitetstestene bruker produksjonsfunksjonene for sortering, filter og coach-klarhet.

### v168 - Fullføringsflyt som egen UI-feature - Bygget

- Ny `workout-completion-ui.js` eier skjema-lesing og -fylling, nullstilling, modalmodus, varighetsfelt, pace-preview og gylne-sone-hint.
- `app.js` beholder state, coach-signaler, kalenderoppfriskning og all repository-/Firestore-skriving.
- Datamodell, fullføringsresultat og brukerflyt er uendret.

### v169 - Historikk som egen UI-feature - Bygget

- Ny `workout-history-ui.js` eier ren filtrering/sortering, filterstatus, kompakte historikkrader og detaljvisning.
- `app.js` beholder state, modal-wrappers, bekreftet sletting/angre og persistence.
- Produksjonsfunksjonene for periode og filter testes direkte. Begge nye runtime-moduler ligger i PWA app shell.
- Sluttversjon for den samlede v168/v169-runden er v169.

### v170a-v170b - Lokal snapshot-kvote - Bygget

- `local-state-store.js` normaliserer og størrelsesmåler snapshots før lagring.
- LocalStorage brukes normalt; ved kvoteproblem lagres snapshot/recovery i IndexedDB.
- Nyeste gyldige kopi velges ved lesing, og korrupt lokal kopi gir trygg fallback.
- Setup viser oppdatert lokal sikkerhetskopi, lagringslag og størrelse, eller en tydelig feilstatus.

### v171 - Firebase Functions SDK - Bygget, testet og deployet

- `firebase-functions` er oppgradert fra 6.x til 7.3.0 uten endring i API-kontrakter eller AI-funksjonalitet.
- Node 22 er beholdt. AI-backend-testene passerer med ny SDK.
- Sluttversjon for den samlede runden er v171 / `treningsapp-v171`.

### v172a-v172b - Strukturert styrke og øvelsesbibliotek - Bygget og testet

- Ny `STRUCTURED_EXERCISES_DESIGN.md` dokumenterer valgfri, versjonert og bakoverkompatibel `exercisePlan` på øktmaler samt separat `exercises`-samling.
- Ny `domain-exercises.js` normaliserer øvelser, blokker, snapshots, https-lenker og kompakte sammendrag uten DOM, Firebase eller global state.
- Ny `exercise-library-ui.js` gir søkbart bibliotek med navn, beskrivelse, muskelgrupper, formål, utstyr og demonstrasjonslenke.
- `workout-template-ui.js` støtter strukturert styrke med øvelsesrekkefølge, sett, repetisjoner, pause, belastning og notat. Øktmalen kan også ha en generell https-lenke.
- Planlagte økter og fullført detaljvisning viser kompakt styrkesammendrag. Snapshots bevarer historisk innhold dersom bibliotekøvelsen senere redigeres eller slettes.
- Gamle maler uten `exercisePlan`, gamle snapshots og backupfiler normaliseres fortsatt trygt. Sluttversjonen er v172b / `treningsapp-v172b`.

### v172c-v172e - Oppstarts- og stilpatch etter publiseringsfeil

- Rettet en produksjonsfeil der nettleserens modulparser avviste et nestet template-uttrykk i `domain-core.js` og stoppet appen på lasteskjermen før første render.
- Uttrykket er forenklet uten at rådlogikken endres.
- Rettet deretter en separat publiseringsfeil der GitHub-versjonen av `styles.css` var fysisk avkortet midt i filen. Dette gjorde at nettleseren forkastet sentrale regler for innlogging, appskall, navigasjon og modaler.
- Stabilitetstesten kontrollerer nå at stilarket har forventet minimumslengde, ikke inneholder overføringsmarkører og fortsatt har kritiske skallregler.
- App/cache bumpes til v172e / `treningsapp-v172e` slik at PWA-en henter det komplette stilarket.

### v172f - Komplett app-skall og tydelig feilgrense

- Rettet en publiseringsfeil der GitHub-versjonen av `index.html` var fysisk avkortet. Det manglende DOM-skallet gjorde at innlogget rendering stoppet, navigasjon ble passiv og renderfeilen feilaktig ble vist som synkfeil.
- Firestore-lasting og rendering har nå separate feilgrenser, slik at en UI-feil ikke lenger rapporteres som «Feil ved synk».
- Stabilitetstesten avviser nå avkortet `index.html` og kontrollerer kritiske elementer samt komplett avslutning av dokumentet.
- App/cache bumpes til v172f / `treningsapp-v172f`.
- Ingen datamodell, brukerflyt eller styrkefunksjonalitet er endret.

### Planlagt arkitektur for v172-v178

- Nye datamodeller normaliseres i egne domenemoduler før UI og persistence kobles på.
- CSV-parsing, importmatching, øvelseslogikk, pulssonevalidering og kroppsmål skal ikke implementeres direkte i `app.js`.
- Nye avgrensede UI-kontrollere får state og handlinger injisert, i samme mønster som `workout-template-ui.js`, `workout-completion-ui.js` og `calendar-ui.js`.
- `training-repository.js` brukes eller utvides avgrenset for Firestore-skriving.
- Nye runtime-moduler skal inn i PWA app shell og testes fra faktisk produksjonskode.
- v172a-v172b følger nå dette mønsteret med egne domene- og UI-moduler; senere runder skal bygge videre på samme grense.

### v173a - Testbaserte pulssoner design - Dokumentert

- Den faktiske rapportens fem pulssoner er kartlagt som ett datert soneoppsett. Eksempeløktene nederst i rapporten er eksplisitt utelatt.
- `LAB_TESTS_AND_ZONES_DESIGN.md` definerer versjonerte, manuelt redigerbare soneoppsett, grensepolicy, senere sone-snapshots på økter og prosentfordeling fra Garmin.
- Garmin CSV-import er flyttet etter sonemodellen, slik at importen senere beriker kanoniske felt i stedet for å opprette parallelle data.

### v173b - Testbasert sonehistorikk og aktivt pulssoneoppsett - Bygget

- Ny `domain-heart-rate-zones.js` normaliserer og validerer femsonesett, sikrer maks ett aktivt sett og klassifiserer bpm med entydig grensepolicy.
- Ny `heart-rate-zones-ui.js` gir Setup en avgrenset flate for å opprette, redigere, aktivere og slette sonesett.
- De faktiske sonene kan registreres med kilde og testdato, og alle grenser kan endres manuelt senere.
- `app-state.js`, lokal recovery/backup og `training-repository.js` håndterer `heartRateZoneSets` bakoverkompatibelt.
- Ingen eksempeløkter, treningsresepter, laktattrinn eller full testprotokoll er lagt til i datamodellen.

### v174a - Sonefordeling på fullførte økter - Bygget

- Fullførings- og redigeringsflyten kan registrere Garmins prosentandel for sone 1-5, med synlig sum og toleranse for små avrundingsavvik på 98-102 prosent.
- Den aktive pulssoneprofilen lagres som snapshot på økten, slik at senere endringer av sonene ikke omskriver historikken.
- Fullført detaljvisning viser en kompakt Garmin-inspirert radgraf med sonegrenser, prosent og estimert tid basert på øktens varighet.
- Gamle økter uten sonefordeling normaliseres til `null` og fungerer uendret. v174a gjør ingen vurdering av etterlevelse; dette ligger fortsatt i v174b.

### v174a1 - Kompakt pulssonevisning - Bygget

- Tidsverdiene i pulssonediagrammet vises uten prefikset `ca.`.
- Profilnavn og estimatforklaring under diagrammet er fjernet for en renere detaljvisning.
- Datamodell, sone-snapshot og beregning er uendret; v174b er fortsatt neste vurderingsrunde.

### v174b - Forklarbar soneetterlevelse - Bygget

- Ny ren vurdering i `domain-heart-rate-zones.js` klassifiserer soneetterlevelse som i tråd, stort sett i tråd, hardere, roligere eller ukjent.
- Vurderingen følger øktens rolle og intensjon, og bruker lavere sikkerhet for intervall/kvalitet fordi totalfordelingen også inkluderer oppvarming, pauser og nedjogg.
- RPE, smerteøkning og kroppstilpasning veier tyngre enn soneprosentene.
- Fullført øktdetalj viser forklaring og vurderingssikkerhet. Innsikt viser en kompakt 28-dagers oppsummering, og coach-context bruker samme produksjonsoppsummering som sekundærsignal.
- Gamle økter uten sonefordeling fungerer uendret og gir ingen falsk vurdering.

### v174c - Kanonisk pulssonekilde og tydelige begreper - Bygget

- Ny ren referansemodell i `domain-heart-rate-zones.js` samler faktisk soneprofil, maks-/terskelprosenter og Bakken-beregnet gylne sone uten å blande begrepene.
- Historiske økter bruker lagret soneprofil-snapshot. Ellers brukes aktiv lab-/brukerprofil; manglende profil gir en trygg fallback uten oppdiktet sone 1–5.
- Snittpuls og makspuls i Logg viser faktisk testsone, og visningen oppgir både kilde for sone 1–5 og separat kilde for gylne sone.
- Fullføring, Innsikt og coach-/AI-kontekst bruker samme kildehierarki. AI-konteksten mottar bare en normalisert, sensitivt avgrenset soneprofil.
- Ingen sonegrenser, coach-terskler eller belastningspolicy er endret.

### v175 - Gjenbrukbare øvelsesblokker - Bygget

- Øktmaler støtter valgfrie blokker for oppvarming, hoveddel og nedtrapping for løping, styrke og andre aktivitetstyper.
- Den eksisterende øvelsesmodellen brukes videre med bibliotek-snapshot, instruksjon, muskelgrupper, dosering, notat og ekstern lenke.
- Blokkene er sammenfoldet som standard for en kompakt mobilflyt, mens full informasjon er tilgjengelig ved behov.
- Planlagte økter lagrer et normalisert malsnapshot; fullføring viderefører dette slik at historiske øvelser ikke endres når malen eller biblioteket redigeres senere.
- Gamle styrkemaler blir trygt behandlet som hoveddel, og gamle planlagte/fullførte økter uten snapshots fortsetter med bakoverkompatibel fallback.
- Strukturert intervallinformasjon er ikke endret og ligger fortsatt separat i `structuredWorkout`.

### v175b - Tydelig bibliotek- og editorflyt - Bygget

- Setup-biblioteket åpner nå på `Øktmaler`, med en tydelig intern veksling til `Øvelser`.
- Bibliotekinnholdet vises først. Opprettings- og redigeringsskjema åpnes eksplisitt via `Ny øktmal`, `Ny øvelse` eller `Rediger`.
- Øktmal-editoren er delt i grunninformasjon, coach-metadata og øktinnhold. Fritekstfeltet er omdøpt til `Overordnet øktbeskrivelse`.
- Øvelsesflaten forklarer forskjellen mellom en gjenbrukbar enkeltøvelse og en komplett øktmal.
- Mal-kortene viser et kort innholdssammendrag, mens full struktur og coachgrunnlag ligger i en valgfri detaljvisning.
- Datamodell, snapshots, normalisering, Firestore og backupformat er uendret.

### v176a - Garmin CSV-importkontrakt og ren adapter - Bygget

- `GARMIN_CSV_IMPORT_DESIGN.md` dokumenterer den verifiserte 44-kolonners Garmin Activities-eksporten, aktivitetsspesifikke enheter, kanonisk mapping, minimert `externalData.garmin`, fingeravtrykk, matchnivåer og merge-policy.
- Ny `garmin-csv-import.js` parser CSV uten DOM/Firebase/state og håndterer BOM, siterte komma, desimaltid, `--`, tusenskilletegn og apostrof-prefikset negativ verdi.
- Den lokale eksporten med 106 aktiviteter parses uten avviste rader og brukes bare som lokal verifikasjon; personlig CSV skal ikke lastes opp.
- Eksporten har ikke stabil Garmin-ID eller pulssonefordeling. Adapteren bruker derfor versjonert fingeravtrykk og oppretter aldri `heartRateZoneDistribution`.
- Match klassifiseres som sikkert, mulig eller ingen treff. Eksisterende Garmin-fingeravtrykk oppdages som duplikat.
- Ren merge fyller bare tomme objektive felt som standard. Manuelle verdier, RPE, kroppssignal, notater og annen ekstern proveniens bevares.
- Ingen UI, Firestore-skriving, state-normalisering, runtime-import eller PWA-versjonsbump er gjort i v176a. v176b bygger den eksplisitte importveiviseren på denne kontrakten.

### v176b - Garmin CSV-importveiviser og kontrollert lagring - Bygget

- Setup har en egen Garmin-importflate som leser Activities CSV lokalt og viser gyldige, avviste, nye, matchede og allerede importerte aktiviteter før lagring.
- `training-import-controller.js` eier forhåndsvisningsmodell, handlingsplan, konfliktfelt, ny økt-materialisering og kobling mot planlagt økt.
- `training-import-ui.js` eier filvalg, lokal lesing, escaping av Garmin-tekst, treffgrunnlag, eksplisitte handlinger og sluttrapport.
- Sikkert eller mulig treff starter med `Velg handling`; ingen eksisterende eller planlagt økt berikes/fullføres automatisk.
- Konflikter i objektive felt vises før skriving. Manuelle og subjektive felt beholdes, og hvert objektivt overskrivingsfelt krever egen avkrysning.
- `training-repository.js` har en avgrenset, chunket importbatch for `completed` og `planned`, med fremdriftsmetadata dersom en senere batch feiler.
- `app-state.js` whitelist-normaliserer valgfri Garmin-proveniens og fjerner rå/ukjente Garmin-felt.
- Recovery snapshot er obligatorisk før import. Import blokkeres uten innlogging, nett eller i offline snapshot-visning.
- `app.js` inneholder bare factory, state-apply/recovery og repository-wrapper; CSV, matching, konfliktpolicy og rendering ligger i egne moduler.
- PWA app shell, cache og synlig versjon er oppdatert til `v176b`.

### v176c - Kategorisert aktivitetsinformasjon i øktdetaljer - Bygget

- `workout-history-ui.js` viser de bevarte aktivitetsfeltene i naturlige kategorier for tid og bevegelse, belastning, puls og pust, fart og tempo, løpsdynamikk, terreng og høyde, effekt, energi og omgivelser, svømming og styrke.
- Bare kategorier og felt som har data vises. Datakilde eller importopprinnelse bruker ikke plass i detaljvisningen.
- Eksisterende kanoniske felter, manuelle registreringer, sikker merge-policy, Firestore-format og backupformat er uendret.
- PWA-cache og synlig versjon er oppdatert til `v176c`.

### v176d - Ryddigere puls og strukturert coach-vurdering - Bygget

- Pulsseksjonen viser snitt- og makspuls i kompakte kort med sone og prosent av maks/terskel, samt en liten referanse til gyllen sone.
- Sonekilde, testnavn og personlig maks/terskel er fjernet fra øktdetaljen og forblir tilgjengelig i Setup.
- Ny `domain-workout-assessment.js` lager en forklarbar vurdering av hva økten viser, samsvar med planen og anbefalt neste steg.
- Vurderingen bruker tilgjengelige objektive data sammen med RPE og kroppssignaler; smerte og tilpasning overstyrer mindre viktige prestasjonssignaler.
- `app.js` beholder bare en liten wrapper for eksisterende coachflater. Ingen datamodell eller persistence er endret.
- PWA-cache og synlig versjon er oppdatert til `v176d`.

### v176d1 - Én scrollbar i øktdetaljen - Bygget

- Den generelle modalregelen overstyrte detaljmodalens `overflow: hidden`, slik at både ytre modal og innhold fikk hver sin scrollbar.
- Selektoren er gjort spesifikk for `.modal.detail-modal`; bare `#workoutDetailContent` ruller nå.
- Ingen innhold, datamodell eller coach-logikk er endret. PWA-cache og synlig versjon er `v176d1`.

### v176e - Eksplisitt AI-vurdering i øktdetaljer - Bygget

- Den lokale coach-vurderingen er fortsatt alltid tilgjengelig. En egen `Få AI-vurdering`-knapp starter først et OpenAI-kall når brukeren ber om det.
- `AI_WORKOUT_ASSESSMENT_DESIGN.md` dokumenterer dataminimering, nytt valgfritt `completed.aiCoachAssessment`, fingerprint/staleness, sikkerhet og UI.
- `domain-ai-workout-assessment.js` eier ren inputbygging, fingerprint og bakoverkompatibel resultnormalisering. Frie økt- og kroppsnotater blir ikke del av AI-grunnlaget.
- `functions/ai/workout-assessment.js` og `workout-assessment-prompt.js` eier dedikert validering og strukturert svar. Flyten gjenbruker kryptert nøkkel, auth, rate limit, modellprofil, `store: false` og safety identifier, uten nettsøk eller skriving av treningsdata i backend.
- `aiCoachAssessWorkout` ble deployet som Node.js 22 2nd Gen callable i `europe-west1` 5. august 2026.
- Resultatet lagres på økten via eksisterende repository-wrapper og vises med konklusjon, observasjoner, plansamsvar og neste steg. Endret øktgrunnlag merkes som utdatert frem til ny vurdering.
- PWA-cache og synlig versjon er `v176e`.

### v176e1 - Eksplisitt handling for alle nye Garmin-aktiviteter - Bygget

- Aktiviteter uten sikkert treff settes ikke lenger automatisk til `Opprett ny økt` eller `Klar`.
- Alle ikke-dupliserte aktiviteter starter som `Krever valg`; brukeren må eksplisitt velge opprett, berik, koble eller hopp over før importknappen aktiveres.
- Bekreftede Garmin-duplikater forblir trygt låst til `Hopp over`.
- PWA-cache og synlig versjon er `v176e1`.

### v176f - Navigerbar treningsmengde - Bygget

- Uke, måned og år viser nå seks perioder hver; årsvisningen er økt fra fem til seks.
- Venstrepilen flytter hele vinduet én periode bakover, høyrepilen flytter én periode fremover og er deaktivert ved dagens vindu. `Til nå` nullstiller den valgte visningen.
- Uke-, måneds- og årsvisningen husker hver sin midlertidige posisjon mens appen er åpen. Dette er UI-state og lagres ikke i Firestore eller backup.
- Totalsammendraget og grafene for økter, tid og kilometer bruker samme seks datoperioder og aktivitetsfilter.
- Historiske grafer bruker faktiske periodenavn i sammenligningen, ikke `Nå` for en historisk måned eller uke.
- Ny `domain-volume-trends.js` eier ren periodeberegning, normalisering, etiketter og trygg navigasjon. `app.js` eier bare state, aktivitetsfiltrering og rendering.
- Modulen er lagt til i PWA app shell. PWA-cache og synlig versjon er `v176f`.

### v176g - Aktivitetsmiljø og Året så langt - Bygget

- Nytt valgfritt `activitySetting` skiller utendørs, tredemølle, innendørs og basseng uten å gjøre feltet Garmin-spesifikt.
- Eldre Garmin-importer avledes ved normalisering fra eksisterende `activityCode`; eksplisitt verdi og manuell redigering støttes uten Firestore-migrering.
- Importadapter og merge-policy fyller feltet kontrollert og bevarer manuelle valg som standard.
- Logg viser aktivitetsmiljø i øktraden og detaljhodet. Fullføringsskjemaet kan angi eller endre miljøet.
- Innsikt viser `Året så langt` med totaløkter, tid, løpekilometer, aktive uker, løpemiljø, tre objektive høydepunkter, oppnådde milepæler og neste naturlige markør.
- `domain-activity.js`, `domain-performance-insights.js` og `training-insights-ui.js` holder ny logikk og rendering utenfor `app.js`. Eksisterende `domain-volume-trends.js` er uendret.
- Designet er dokumentert i `PERFORMANCE_INSIGHTS_DESIGN.md`. PWA-cache og synlig versjon er `v176g`.

### v176h - Komplett milepælsoversikt og aktivitetsmiljøfilter - Bygget

- `Året så langt` har nå knappen `Se alle milepæler`, som åpner et avgrenset overlegg med alle definerte kilometer-, treningsøkt- og ukeverdier.
- Hvert milepælsspor viser dagens verdi, oppnådde datoer, neste naturlige markør og senere markører uten prognose eller belastningskrav.
- Øktmarkører er presisert som `treningsøkter`, og alle registrerte aktivitetsmiljøer vises dynamisk.
- `Uten angivelse` er en handlingsbar inngang til Logg med filtrene `Løping` og `Uten angivelse` ferdig valgt.
- Logg har fått et eget aktivitetsmiljøfilter. Ingen økter klassifiseres automatisk som del av oppryddingen.
- Ren milepælsmodell er fortsatt i `domain-performance-insights.js`, og overlegg/hendelser ligger i `training-insights-ui.js`. PWA-cache og synlig versjon er `v176h`.

### v176i - Kompakt informasjonsarkitektur for Innsikt og Mål - Bygget

- Innsikt har fått kompakt lokal navigasjon mellom Status, Kontinuitet, Utvikling og Året. Statusområdet er alltid åpent og samler denne uken, ukestatus, kroppssignal, skadesignal og intensitetsbalanse.
- Mål har tilsvarende navigasjon mellom Oversikt, Mål-løp, PB og Challenges. Oversikten beholder score, neste steg og testvurdering synlig.
- Sekundære hovedområder bruker native `details`/`summary`, åpnes før navigasjon og beholder åpen tilstand bare mens siden lever.
- Metode og forklaring er flyttet til korte disclosure-felt. Detaljerte delmål kan åpnes ved behov.
- PB viser distanser med registrerte resultater først; tomme distanser kan åpnes med én knapp. Challenges viser aktive mål først og tidligere mål i sammenleggbar historikk.
- Ny `workspace-sections-ui.js` eier DOM-gruppering, lokal navigasjon, synlighetsoppdatering og progressive hjelpefelt. `app.js` initialiserer og oppdaterer bare modulen.
- Ingen domene-, Firestore- eller backupdata er endret. Designet ligger i `INSIGHTS_GOALS_UX_DESIGN.md`. PWA-cache og synlig versjon er `v176i`.

### v176j - Profesjonell og tilgjengelig øktmodal - Bygget

- Fullført økt har fått samme avrundede modalramme og innvendige rytme som milepælsoversikten, med én naturlig scrollflate.
- Den mørke økttoppen er nå et innfelt, klebrig kort med et tydelig lukkekryss som forblir tilgjengelig under scrolling.
- Kryss, Escape, bakgrunnsklikk og bunnknapp lukker modalvinduet. Fokus returneres til åpningselementet når det fortsatt finnes.
- Dialogsemantikk og tastaturåpning fra historikk er lagt til. Øktinnhold, domene-, Firestore- og backupdata er uendret.
- PWA-cache og synlig versjon er `v176j`.

### v176k - Desktopbalanse i Innsikt - Bygget

- Intensitetsbalanse bruker nå hele bredden på desktop og fjerner den store tomme høyreflaten i statusområdet.
- `Viktigst nå` er fjernet slik at statusområdet har én tydelig overskrift.
- Sammenleggbare områder viser en diskret chevron som roteres ved åpning i stedet for teksten `Åpne`/`Skjul`.
- Mobilstruktur, innhold, beregninger og lagringsmodell er uendret. PWA-cache og synlig versjon er `v176k`.

### v176l - Form ved samme innsats - Bygget

- Utvikling har fått en forklarbar sammenligning av rolige løpeøkter ved omtrent samme medianpuls og varighet.
- Utendørs og tredemølle behandles separat. Utendørs bruker GAP når minst åtte egnede økter har feltet; ellers brukes ordinær pace bare på relativt flate økter.
- Resultatet klassifiseres konservativt som bedre, stabil eller svakere respons med synlig paceendring. Dette presenteres uttrykkelig som øktrespons, ikke generell formscore eller råd om å øke belastning.
- Minst fire økter i hver periode, høyst 5 bpm pulsforskjell og sammenlignbar varighet kreves. Kroppssignal, hard øktintensjon, ukjent miljø og manglende objektive felt utelates.
- Periode, antall økter, pacekilde og lokal vurderingssikkerhet vises i kortet. Utilstrekkelig grunnlag gir en nøytral tomtilstand.
- Ren beregning ligger i `domain-performance-insights.js`, rendering i `training-insights-ui.js`, og `app.js` leverer bare state. Designet ligger i `SAME_EFFORT_FORM_DESIGN.md`.
- Ingen Firestore-, backup- eller lagringsdata er endret. PWA-cache og synlig versjon er `v176l`.

### v176l2 - Forklarbart sammenligningsgrunnlag - Bygget

- Kvalifisering av rolige økter gjenbruker nå appens kanoniske intensitetsklassifisering fra `domain-core.js`, slik at øktmalens rolle, belastning og struktur teller sammen med navn og type.
- Kroppsområde og fritekstnotat uten registrert smerte eller aktiv tilpasning utelukker ikke lenger en ellers egnet økt. Reell smerte og kroppstilpasning beholdes som sikkerhetsport.
- Tomtilstanden viser antall vurderte løpeøkter, kandidater, status per aktivitetsmiljø og summerte utelatelsesårsaker. Hver økt får én primær årsak.
- Kravet om minst fire økter i begge perioder, miljøskille, puls-/varighetssammenlignbarhet og GAP-policy er uendret.
- Ingen Firestore-, backup- eller lagringsdata er endret. PWA-cache og synlig versjon er `v176l2`.

### v176l3 - Intensjon foran observert Garmin-effekt - Bygget

- Planlagt rolig/base-/restitusjonsintensjon beholdes når Garmin beskriver den observerte effekten som `Tempo` eller `High Aerobic`; treningseffekt brukes fortsatt som belastningssignal, men omskriver ikke øktens hensikt.
- Den separate RPE > 5-porten er fjernet. RPE 6 kan inngå i en ellers rolig sammenligning, mens den kanoniske sikkerhetsregelen fortsatt utelater RPE 7+ uten kvalitetsintensjon.
- Miljøstatus viser nå både antall kandidater og antall som passer valgt GAP-/pacegrunnlag, slik at `0 sammenlignbare` ikke kan misforstås som `0 historiske utendørsøkter`.
- Kravet om minst fire økter i hver periode, miljøskille, puls-/varighetssammenlignbarhet, kroppssignalport og GAP-policy er uendret.
- Ingen Firestore-, backup- eller lagringsdata er endret. PWA-cache og synlig versjon er `v176l3`.

### v176m - Felles datagrunnlag og vurderingssikkerhet - Bygget

- Form ved samme innsats, Treningsnivå, Intensitetsbalanse, Soneetterlevelse og Formutvikling bruker nå samme evidenskontrakt for periode, relevant utvalg, datadekning, vurderingssikkerhet og manglende grunnlag.
- `domain-insight-confidence.js` eier ren normalisering og fem innsiktsspesifikke builders. `insight-confidence-ui.js` eier én gjenbrukbar, progressivt sammenleggbar visning. `app.js` leverer bare eksisterende state og kobler rendering.
- Datadekning og vurderingssikkerhet vises separat: et lite, men godt sammenlignbart utvalg kan derfor ha lav totaldekning og samtidig høy vurderingssikkerhet.
- Form ved samme innsats forklarer også når periodene stopper på puls, varighet eller manglende fire pluss fire økter, uten å lempe på kroppssignal- eller RPE-portene.
- Ingen Firestore-, backup- eller lagringsdata er endret. PWA-cache og synlig versjon er `v176m`.

### v176n - Selvstendig AI-vurdering og kompakt handling - Bygget og deployet

- AI-vurderingen har en ny v2-kontrakt med kort syntese, konkrete funn, treningsbetydning, valgfri målkobling, neste steg og eksplisitt usikkerhet. Den lokale coach-vurderingen forblir autoritativ for sikkerhet og plansamsvar.
- Ny `domain-ai-workout-context.js` bygger kun aggregert sammenligningsgrunnlag fra inntil seks tidligere rolige løpeøkter i samme miljø. Rå historikk, øktnavn og notater sendes ikke til AI-backend.
- Backend godtar både v1 og v2 i overgangsperioden. Gamle lagrede AI-vurderinger vises fortsatt, mens nye vurderinger lagres som v2.
- Tomtilstanden er komprimert til én rad med et tilgjengelig stjerneikon og 44 px trykkflate. Ferdige vurderinger har samme ikon for ny vurdering og egen lastetilstand.
- Ingen nye Firestore-samlinger er introdusert. PWA-cache og synlig versjon er `v176n`.

### v176n1 - Mobil øktmodal - Bygget

- På mobil ruller det mørke økthodet nå bort sammen med resten av innholdet i stedet for å dekke skjermen permanent.
- Øktmodalen bruker nesten hele den tilgjengelige skjermhøyden, tar hensyn til safe area og har mindre luft mot topp og sider.
- Desktopvisningen, modalinnholdet, øktdataene og AI-vurderingen er uendret. PWA-cache og synlig versjon er `v176n1`.

### Periodisert treningsplan v1 - Design dokumentert

- Ny `TRAINING_PLANS_DESIGN.md` kartlegger syv eksisterende logikkområder før den fastsetter datamodell, policy, materialisering, coach-kontrakt, mobil UX og testplan.
- V1 er avgrenset til én manuell fireukersblokk med tre belastningsuker og én avlastningsuke. 12-ukers løpsplan, flere aktive planer og automatisk neste blokk er utsatt.
- `weeklyTargetSnapshots` og felles `effectiveWeeklyTargetForWeek()` skal produseres i runde 2 og må finnes før blokkaktivering; runde 4 er absolutt siste trygge tidspunkt.
- Pågående uke fryses med gjeldende reduksjon før plansletting. Legacy-uker endres ikke retroaktivt.
- Prospektiv volumkontroll sammenligner bare samme metrikk og viser eksplisitt `metric_mismatch` eller `insufficient_data` uten konvertering eller gjetting.
- Deployede Firestore Rules er kontrollert og dekker de nye brukerundersamlingene gjennom eksisterende rekursiv eierregel; v1 trenger ingen Rules-endring.
- Opprettelsesflyt, Kalender-planoversikt, kompakt Hjem-kort, fullført-oppsummering og norske tom-/konflikt-/feiltekster er spesifisert mobil først.
- Dette er en ren dokumentasjonsrunde: ingen JS-, runtime-, versjons- eller cacheendring.

### v176o - Periodisert treningsplan runde 2: historisk målfundament - Bygget

- Ny `domain-periodized-training-plan.js` eier normalisering av ukesmålsnapshots, felles `effectiveWeeklyTargetForWeek()` og ren kontinuitetsavgjørelse.
- `weeklyTargetSnapshots` er koblet til samlet state, Firestore-repository, full backup/import, lokal snapshot og recovery. Gamle backuper får trygg tom liste.
- Første produksjonsuke lagres i `weeklyTargetSnapshotPolicy.effectiveFrom`. Tidligere uker bruker uendret legacy-mål, slik at eksisterende streak ikke endres.
- Avsluttede nye uker ferdigstilles ved første autentiserte synkronisering og før historisk rendering eller nye treningsskriver. Et endelig snapshot vinner alltid over senere plan- og målendringer.
- Hjem, ukestatus, kontinuitet, Bakken-mønster og coach bruker samme effektive ukesmål. Laveste aktive reduksjon vinner; et nådd redusert mål teller som trening og forbruker ikke fryskort.
- Dokumentet er presisert med eget volumvalideringsutfall, automatisk tryggere forslag med overstyring, slot-basert øktmål i avlastningsuke og rask gjenbruksflyt for blokk to og senere.
- PWA-cache og synlig versjon er `v176o`.

### v176o1 - Serversikret snapshot-ferdigstilling - Bygget

- Snapshot-ferdigstilling kjører asynkront etter første render og blokkerer ikke Hjem eller kontinuitet. En rolig ventetilstand vises mens servergrunnlaget bekreftes.
- Kandidatverdien for ordinært ukesmål fryses lokalt ved ukeslutt. Senere målendringer kan derfor ikke omskrive grunnlaget før ferdigstilling.
- Ventende Firestore-skriv tømmes før en avgrenset serverlesing. Lesevinduet utledes fra validerte comeback-regler, ikke et hardkodet antall dager.
- Transaksjonen er den bærende integritetsmekanismen: et eksisterende `final`-snapshot beholdes, slik at samtidig ferdigstilling på flere enheter gir nøyaktig ett uforanderlig resultat.
- Manglende serverkontakt eller ufullstendig grunnlag gir ingen final-skriving. Stabilitetstestene dekker eksisterende final, serverfeil og samtidig ferdigstilling.
- PWA-cache og synlig versjon er `v176o1`.

### v176p - Periodisert treningsplan runde 3: ren blokkdomene-logikk - Bygget

- `domain-periodized-training-plan.js` normaliserer nå gyldige og eldre fireukersblokker, beregner representativ baseline og bygger nøyaktig fire ISO-uker med load/load/peak/deload.
- Blokkfaktorer, baselinegrenser og volumvaktens maksimum kommer fra samme validerte `coach-rules.json`-kilde med produksjonsfallback.
- Prospektiv volumvalidering skiller `validated`, `metric_mismatch` og `insufficient_data`. Et validert overskridende forslag får utfallet `reduced_by_guardrail`, automatisk tryggere maksimum, synlig begrunnelse og eksplisitt overstyring.
- Avlastningsukens effektive øktmål kommer fra antall slots, også når volumrammen måles i minutter.
- Aktiv blokk eier rolleprioriteten; uten aktiv blokk brukes eksisterende race-kjede uendret. `evaluatePlanWeek()` bruker bare injiserte vurderinger og muterer ikke input.
- Ren konfliktklassifisering behandler eksisterende manuelle økter uten `planRef` som blokkerende hovedtilfelle og tilbyr bare ny dato eller hopp over.
- Runde 3 har ingen Firestore-, controller-, materialiserings- eller UI-kobling. Runde 4 er fortsatt sperret til første ekte snapshot er verifisert.
- PWA-cache og synlig versjon er `v176p`.

### v176q - Dagens råd etter fullført økt - Bygget

- Øktdetaljens «Neste steg» går nå gjennom `coachDecisionEngine()` og skiller blant annet svært rolig økt, kontrollert rolig økt og en rolig økt som fikk merkbar tid i høyere soner.
- 99 prosent i sone 1–2 med lav RPE kan beholde neste kvalitet, mens 80 prosent gir et eksplisitt roligere neste steg. Observasjon og anbefaling kan dermed ikke lenger motsi hverandre i dette tilfellet.
- Generiske forbehold om «friske bein» er erstattet med registrert smerte, tilpasning eller en nøytral anbefaling når kroppssignal ikke er registrert.
- Etter fullført økt navngir Hjem neste planlagte økt og dato. Før-økt-råd fra trafikklys, forberedelsesfelt og duplisert coachtekst skjules etter gjennomføring.
- Filosofi-boilerplate er fjernet fra etter-økt-teksten. Coachgrunnlaget er fortsatt tilgjengelig progressivt, men hovedflaten viser ett handlingsbudskap.
- Nytt `TRAINING_PROFILE_PROGRESSION_DESIGN.md` dokumenterer avviksdeteksjon for normaluke, verifisert bruk av coachnivå, gjenbruk av `domain-fitness.js`, forenkling av mål/profil og grensesnittet mot blokkplaner. Dokumentet har ingen runtime-kobling.
- Ingen datamodell, Firestore-samling eller snapshotlogikk er endret. Runde 4 i planarbeidet er fortsatt sperret til første ekte snapshot er verifisert.
- PWA-cache og synlig versjon er `v176q`.

### v176r - Rolleport: Rolig baseøkt og historisk stabil klassifisering - Bygget

- Ny kanonisk rolle `easy` vises som «Rolig baseøkt» og skilles fra `long_easy` og `recovery`.
- V1-snapshots beholder nøyaktig tidligere utledning; nye planlagte/fullførte snapshots får v2 og en eksplisitt, frosset rolle.
- Relativ langtursgrense bruker åtte avsluttede ISO-uker, minst seks gyldige referanser og faktor `1,35` fra validert coach-regel. `Hiking`/`Fottur` som hele ord gir `other`.
- Produksjonskalibreringen ga fem gyldige easy-referanser, median `49:02` og en foreløpig grense `1:06:12`; grensen aktiveres først når seks referanser finnes.
- Rolledekning teller forekomster én til én, og coachkontekstens separate Set-beregning er fjernet.
- Baseblokkens standard-slots er `easy/easy/long_easy`; dobbelt punktum i neste planlagte økt er rettet.
- PWA-cache og synlig versjon er `v176r`.

---

## Arbeidsnotater

**Prosjektstruktur**
- Lokal kopi — ikke et Git-repo. Endrede filer synkroniseres til GitHub Pages via GitHub-connectoren når skrivetilgang er tilgjengelig.
- Filer som typisk endres per økt: `app.js`, `index.html`, `styles.css`, `service-worker.js`
- Husk alltid å bumpe `APP_VERSION` i `app.js` og `CACHE_NAME` i `service-worker.js`
