# Treningsapp — progress.md
Oppdatert: 2026-07-08 (siste endringer: v75–v139)

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
**Versjon:** v139 (konstant i `app.js`).

### Filer

```
Treningsapp/
├── index.html          # App-skall, 5 seksjoner (Hjem, Kalender, Logg, Innsikt, Innstillinger)
├── app.js              # App-logikk, Firebase-init, coach-system, sync, state og UI-wrappere.
├── domain-core.js      # Rene testbare domenehjelpere uten DOM/Firebase/state.
├── domain-goals.js     # Rene testbare konkurranse-/mål-hjelpere uten DOM/Firebase/state.
├── styles.css          # Design-tokens (oransje #ff4f2e), mobil-først, 2 000+ linjer.
├── manifest.json       # PWA-manifest
├── service-worker.js   # Offline-cache
├── INTERVALS_DESIGN.md # Designnotat for strukturert intervallstøtte
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
- Coach-rammeverk-objekt med 7 Bakken-prinsipper i koden
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
| **6. AI-integrasjon** | Ingen faktisk Claude API-kall | Ikke bygget |
| **7. Gradert smerte** | Smerte vurderes nå etter alvorlighetsgrad med forfallslogikk | Bygget (v76) |
| **8. Strukturert lokasjon** | Fritekst erstattet med kroppsdel+side-dropdown, lagres strukturert | Bygget (v77) |

---

## Neste steg (prioritert)

### 1. Strukturert intervallstøtte v2
- Test v104 manuelt i øktmalflyten, planlagt økt, fullført detaljvisning, Innsikt og coach-notis.
- Vurder om strukturen også skal kunne brukes direkte når en planlagt økt logges.
- Vurder flere intervallblokker senere hvis én blokk blir for begrensende.

### 2. AI-integrasjon senere
Lag en «Spør coachen»-funksjon når datagrunnlaget og intervallstøtten er stabile:
- Send siste 14 dager komprimert treningshistorikk + `coach-rammeverk.md` som system-prompt til Claude API
- Vis svaret i Innsikt-fanen
- Kan bruke `claude-haiku-4-5` for lavere kostnad per kall

---

## Arbeidsnotater

**Prosjektstruktur**
- Lokal kopi — ikke et Git-repo. Filer lastes opp manuelt til GitHub Pages.
- Filer som typisk endres per økt: `app.js`, `index.html`, `styles.css`, `service-worker.js`
- Husk alltid å bumpe `APP_VERSION` i `app.js` og `CACHE_NAME` i `service-worker.js`
