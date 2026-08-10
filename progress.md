# Treningsapp — progress.md
Oppdatert: 2026-08-10 (siste runtime-endring: v176f)

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
**Versjon:** v176f (konstant i `app.js`).

### Filer

```
Treningsapp/
├── index.html          # App-skall, 5 seksjoner (Hjem, Kalender, Logg, Innsikt, Innstillinger)
├── app.js              # App-logikk, Firebase-init, coach-system, sync, state og UI-wrappere.
├── app-state.js        # Defaults og bakoverkompatibel normalisering av samlet app-state.
├── local-state-store.js # Normalisert lokal snapshot- og recovery-lagring.
├── training-repository.js # Firestore-repository for treningsdata.
├── domain-training-plan.js # Ren ukeplan-, rolle- og øktforslagslogikk.
├── calendar-ui.js      # Kalendergrid, månedsnavigasjon og dagsmodal.
├── domain-core.js      # Rene testbare domenehjelpere uten DOM/Firebase/state.
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
- **Skadeoppfølging v2: Trend og frislipp** (v126): Skadesignal-kortet viser nå tydeligere frislipp-vurdering: trend, neste trygge økt, kriterier før løping/kvalitet og om hard kvalitet bør holdes igjen. Ren logikk ligger i `i…8118 tokens truncated…siste 30 dager med grønn/gul/rød/nøytral indikator: (1) Rolig:terskel-ratio (mål ≥ 3:1), (2) Rolige dager er faktisk rolige (avgHeartRate mot gylne sone), (3) RPE på rolige dager (bør ikke være ≥ 7), (4) Ukentlig konsistens siste 4 uker. Viser «ikke nok data»-melding ved for lite historikk. `buildBakkenPatterns()` + `renderBakkenPatterns()`.
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

1. **v177 - Nedoverbelastning**
   - Skill stigning/nedstigning og kondisjons-/muskelbelastning.
2. **v178 - Kroppsmål for klær og utstyr**
   - Praktisk målehistorikk under Setup, uten kobling til coach- eller nivåscore.

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

---

## Arbeidsnotater

**Prosjektstruktur**
- Lokal kopi — ikke et Git-repo. Endrede filer synkroniseres til GitHub Pages via GitHub-connectoren når skrivetilgang er tilgjengelig.
- Filer som typisk endres per økt: `app.js`, `index.html`, `styles.css`, `service-worker.js`
- Husk alltid å bumpe `APP_VERSION` i `app.js` og `CACHE_NAME` i `service-worker.js`
