# BACKLOG.md

Prioritert backlog for videre utvikling av Treningsapp.

## Mål, konkurranse og motivasjon

1. **Dashboard heltekort** - Bygget v134
   - Slått sammen Dagsform, Neste økt og Dagens råd til ett toppkort på Hjem.
   - Detaljer ligger bak utvidbare rader for Øktdetaljer, Forberedelse og Grunnlag.

2. **Dashboard motivasjonskort** - Bygget v135
   - Løft mål-løp, mål-score, kontinuitet og siste høydepunkt inn på Hjem.

3. **Denne uken og challenge-status v2** - Bygget v136
   - Vis ukeprogresjon med ring, kilometer, dagsstolper og challenge-takt.

4. **Dashboard fargesystem og desktop polish** - Bygget v137
   - Gjør statusfargene konsekvente og utnytt desktop-bredden bedre.

5. **Mål-fane v3: Delmål og milepæler** - Bygget v125
   - Vis 3-5 konkrete delmål mot hovedløpet.
   - Eksempler: skadefri uke, 5 km test, 10 km test, stabil 4-ukers volum, spesifikk oppkjøring.

6. **Skadeoppfølging v2: Trend og frislipp** - Bygget v126
   - Vis enkel skadehistorikk over tid.
   - Eksempel: smerte 5 -> 3 -> 1, dager stabil, og tydelig kriterium for når løping/kvalitet kan gjenopptas.

7. **Race/testløp-anbefaler** - Bygget v127
   - Foreslå riktig test nå: 1 km, 2 km, 5 km, 10 km eller ingen test.
   - Bruk mål-løp, skadesignal, siste test og treningsgrunnlag.

8. **Ukeplan smartere mot mål-løp** - Bygget v128
   - La ukeplanen forstå fase mot mål-løp: base, testfase, spesifikk oppkjøring og taper.
   - Foreslå riktigere roller uten AI.

9. **Mål-score med tydelig utvikling** - Bygget v129
   - Vis om brukeren beveger seg i riktig retning fra uke til uke.
   - Dimensjoner: kontinuitet, rolig volum, kontrollert kvalitet, skadefrihet og race-status.

10. **PB-historikk v2** - Bygget v130
   - Gjør PB-kortene mer levende.
   - Vis siste, beste, forbedring fra første, nær PB og tydeligere graf/akser.

11. **Dagens råd koblet tydeligere til Mål / Dagens råd v2** - Bygget v131
   - Knytt Hjem-rådet tydeligere til mål-løp og fase.
   - Eksempel: "Fordi du er i basebygging mot Halv-Birken, er dagens beste valg rolig volum."
   - Utvidet v132: når dagens økt er logget, skifter rådet til etter-økt-vurdering av belastning og smerterespons.

12. **Heltekortets tilstander og v137b polish** - Bygget v138
   - La heltekortet bytte tydelig tilstand etter kontekst:
     fullført økt, konflikt dagsform/plan, hviledag, langt opphold og normal planlagt økt.
   - Konflikt dagsform/plan er høyest verdi: hard planlagt økt + gul/rød dagsform, skadesignal eller for hard intensitetsbalanse bør gi tydelig bytteforslag.
   - Ta samtidig v137b-polish: fjern dobbel `1/3`, krymp dagsstolpene og balanser desktop-rutenettet under heltekortet.

13. **Coach-grunnlag v2** - Bygget v133
   - Utvid forklaringsgrunnlaget bak råd.
   - Inkluder mål-løp, fase, skadesignal, siste test, siste 7/28 dager og kommende økter.
   - Viser nå strukturert grunnlag under Dagens råd på Hjem.

14. **Mål-kort v2 på Hjem** - Bygget v139
    - Vis mini-delmål, mål-score-trend og fase som progresjon.
    - Hold kortet kompakt og motiverende.

15. **Kalender polish og handlingsflyt** - Bygget v141
    - Gjør ukeplan og planlagte økter mer skannbare.
    - Behold nøytral planlagt-status.
    - La kalenderen støtte forståelsen av bytteforslag fra heltekortet.

16. **Logg polish** - Bygget v142/v142b
    - Kompakte, skannbare loggkort med øktnavn, dato, aktivitet/intensitet og hovedtall.
    - Detaljmodal, filtre, sletting/angre og eksisterende dataflyt er beholdt.
    - Mobiloversikten ble trimmet i v142b. Ukesgruppering og Mål/PB-polish ble ikke bygget i denne runden.

17. **Coach review triage og roadmap** - Dokumentert v143a
    - Coach foundation er prioritert før fryskort og AI.
    - Review-funnene er fordelt på små, testbare runder.

18. **`coach-rules.json` v2** - Bygget v143b
    - Gjør regelfilen til validert kilde for prinsipper, terskler og coach-policy.
    - Bruk hardkodede defaults som trygg fallback.
    - Definer eksplisitt PWA/cache-atferd og test ugyldig/manglende fil.

19. **Gylne-sone-fiks og kanonisk intensitetsbalanse** - Bygget v144
    - Skill rolig-brudd fra terskel-brudd.
    - Bruk én felles intensitetsberegning på Hjem, i Dagens råd og Innsikt.

20. **Volum-ramp og comeback-protokoll** - Bygget v145
    - Varsle forsiktig ved rask volumøkning.
    - Reduser forventning/ukemål etter lengre opphold.

21. **`domain-coach.js` første uttrekk** - Bygget v146
    - `todayDecision`, `homeHeroState`, `coachDecisionBasis`, `trainingVolumeRamp` og `comebackProtocol` er flyttet til ny ren coach-modul.
    - State-, Firebase- og DOM-wrappere er beholdt i `app.js`.

22. **Coach Decision Engine v1** - Bygget v149
    - `coachDecisionEngine()` samler samtidige coach-signaler i én strukturert pakke.
    - Velger hovedsignal etter prioritert modell og beholder sekundærsignaler.
    - Returnerer `blockedActions`, `allowedActions` og `guardrails` for senere AI-chat.
    - Har første myke «i morgen»-signal og grønnere post-workout-feedback etter kontrollert kvalitet.

23. **Fryskort design** - Dokumentert v147
    - `STREAK_FREEZE_DESIGN.md` dokumenterer policy, bakoverkompatibel datamodell, brukerflyt, coach-konsekvens og testplan.
    - Fryskort er definert som motivasjonsbeskyttelse, ikke treningsdata.

24. **Fryskort implementering** - Bygget v148
    - Sykdom, skade, reise, livsbelastning eller annet legitimt avbrudd kan beskytte kontinuitetsstreak innen tydelige grenser.
    - `continuityFreezes` er egen collection og teller ikke som økter, kilometer, tid, PB, challenge-progress eller kvalitet.
    - V1 har modal fra Hjem/Kontinuitet, aktiv/arkivert liste, arkiver/slett med bekreftelse og Hjem/Innsikt-kontinuitetsvisning.
    - Kalenderinngang, egen Setup-oversikt og målscore-nøytralisering er utsatt.

25. **Senere coach-foundation**
    - HRV som forsiktig gult signal.
    - Videre «i morgen»-perspektiv i ukeplan/coach-note hvis det gir verdi.
    - Scoret regelmodell v2 hvis den enkle prioriterte modellen ikke er nok.
    - AI-chat design først når regelfil og coach-context er konsistente.

26. **Ukesvolum-graf på Hjem desktop** - Lavere prioritet
    - Kompakt volumtrend for brede skjermer.
    - Lavere prioritet fordi Innsikt allerede er ett trykk unna.

27. **Ernæring, væske og restitusjonsnotater** - Senere
    - Små støttepåminnelser i Dagens råd/heltekort.
    - Ikke full ernæringsapp.

28. **v150 - AI Coach Context og sikkerhetsdesign** - Implementert lokalt
    - `AI_COACH_DESIGN.md` definerer AI-rolle, context schema v1, whitelist, personvern, systeminstruks, guardrails, backend, nøkkelhåndtering, kostnad, logging og første chat-UI.
    - `buildAiCoachContext()` bygger en versjonert og størrelsesbegrenset context-pakke uten uid, e-post, secrets, rå Firestore-metadata eller komplett historikk.
    - AI skal forklare `coachDecisionEngine()` og kan ikke overstyre `primarySignal`, `blockedActions` eller `guardrails`.
    - Produksjonsfunksjonen testes direkte fra `domain-coach.js`.

29. **v151 - Sikker backend og nøkkeladministrasjon** - Implementert lokalt, deploy gjenstår
    - Firebase Auth-verifiserte Callable Functions er klargjort i `functions/`.
    - OpenAI-nøkkel skrives inn i Setup, men lagres bare server-side og vises senere kun maskert.
    - Rate limit, størrelsesgrense, timeout, budsjettvern og sanitert logging.
    - Ingen chat- eller treningsdata-skriving.
    - Produksjonsbruk er blokkert til eksisterende Firestore Rules er kontrollert og backend er installert/deployet.

30. **v152 - Read-only AI-coach chat MVP** - Ferdig og verifisert gjennom v154
    - Enkel rådgivende chat basert på AI Coach Context v1 og serverbygget systeminstruks.
    - Ingen web-søk, write-tools, automatisk planendring eller vedvarende historikk.

31. **v153 - Chat polish og kontroll** - Ferdig og deployverifisert gjennom v154
    - Context/provenance, usage, kostnadsfeedback, rate-limit-feedback og personvernpolish.
    - Meldingshistorikk beholdes bare i minnet i denne versjonen; det lagres ikke chatinnhold i Firestore eller lokal lagring.
    - I v153 åpnes chatten som sekundær side fra Hjem; egen navigasjonsfane er senere besluttet for v154.

32. **v154 - AI-status og egen Chat-fane** - Ferdig og ende-til-ende-verifisert
    - Dynamisk grønn `Tilkoblet`-tag som er forskjellig fra nøytral `Server-side`-merking.
    - Chat legges etter Mål i bunnnavigasjonen og beholder fritekstspørsmål.
    - Mobil, desktop, PWA og ekte ende-til-ende-svar verifiseres.

33. **v155 - Chat persistence design og sikkerhetsgrunnlag** - Ferdig og Rules deployet
    - Firestore-modell, Rules, callable-kontrakter, retention, arkiv, sletting og separat eksport.
    - Emulator-/regeltester skal være på plass før vedvarende historikk aktiveres.

34. **v156 - Synkroniserte samtaler v1** - Ferdig og manuelt godkjent
    - Samtaler og meldinger lagres sikkert og kan fortsettes på PC og mobil.
    - Samtaler kan opprettes, navngis, arkiveres og slettes.
    - Begrenset meldingsvindu og samtalesammendrag hindrer ukontrollert context/kostnad.

35. **v157 - Prosjekter og egne instrukser** - Levert samlet i v159
    - Flere prosjekter med egne samtaler og instruksjoner for fokus, tone og preferanser.
    - Instrukser kan ikke overstyre coachens sikkerhetsregler.

36. **v158 - Kontrollert langtidskontekst og kvalitet** - Levert samlet i v159
    - Bedre oppsummering av lange samtaler og eventuelt eksplisitt brukeradministrert minne.
    - Personvern, innsyn, sletting, eksport, kostnad og tematester for trening/mat/restitusjon.

37. **v170a-v170b - Datatrygghet for lokal snapshot-kvote** - Bygget
    - Produksjonssjekk 12. juli 2026 viste `QuotaExceededError` for `treningsapp:last-state:v1` i localStorage mens Firestore fortsatt synkroniserte.
    - Snapshot normaliseres før lagring, størrelsen måles, og Setup viser om lokal kopi er oppdatert og hvilket lagringslag som brukes.
    - `QuotaExceededError` faller kontrollert tilbake til IndexedDB. Lesing velger nyeste gyldige kopi, og recovery bruker samme sikre lagringsvei.

38. **v171 - Oppgrader Firebase Functions SDK** - Ferdig, testet og deployet
    - Firebase CLI varslet under v156-deploy at `firebase-functions` er utdatert.
    - `firebase-functions` er oppgradert isolert fra 6.x til 7.3.0 på eksisterende Node 22-runtime.
    - Backendens syntakssjekker og AI-testpakke skal passere før produksjonsdeploy.

39. **v160a-v160g - Transparent treningsnivåvurdering** - Bygget og kalibrert
    - Ren `domain-fitness.js` kombinerer kontinuitet, kontrollert kvalitet, RPE/kroppssignal, VO2 mot alder og egen PB-fremgang.
    - v160f krever faktisk signaldekning for kontrollert kvalitet, lengre historikk for nivå 4/5 og trinnvis bekreftelse.
    - Innsikt viser nivå, datadekning, fem forklarbare dimensjoner, manglende data og neste kriterium.
    - Fem motivasjonsnivåer kan oppnås og beholdes; profilendring krever eksplisitt bekreftelse.
    - AI får bare sanitert nivågrunnlag og kan ikke endre eller bekrefte nivå.
    - Biologisk alder, absolutt HRV-klasse, BMI-score og uverifisert WMA-aldersgradering er bevisst ikke implementert.
    - v160g forklarer at vurderingspoeng ikke er nivå, viser konkrete krav til neste nivå og ett prioritert neste steg.

40. **v161 - Kontrollert webtilgang for AI-chat** - Implementert
    - Design server-side nettsøk med tydelig kildevisning, personvern, rate limit og kostnadstak.
    - Bevar coachDecision, blockedActions og medisinske guardrails som høyere prioritet enn eksternt innhold.
    - Behandle nettsider som ubetrodd input og bygg trygg fallback når web ikke er tilgjengelig.
    - Ikke legg søkenøkler, leverandørkonfigurasjon eller rå søkeresultater i frontend eller Firestore-chatloggen.
    - Frivillig per melding, separat samtykke, lavt søkekontekstbudsjett og inntil åtte sanitiserte kilder er implementert.

41. **v162 - Etterprøvbar webbruk og presise ernærings-/varmesvar** - Implementert
    - Returner eksplisitt om web ble forespurt og faktisk brukt; vis aldri falsk webstatus.
    - Skill verifiserte nettkilder fra brukeroppgitt vær og appens treningsdata.
    - Knytt råd til strukturert øktvarighet, intensitet, tidspunkt, varme og individuell toleranse.
    - Bruk kontrollert retry eller tydelig fallback når valgt nettsøk ikke produserer et søkekall.
    - Prioriter autoritative primærkilder og behold coach-/medisinske guardrails.

42. **v163 - Modell- og resonneringsvalg i Chat** - Implementert
    - Komprimert `Svarinnstillinger` under `Administrer +`.
    - Serverstyrt allowlist for GPT-5.6 Luna, Terra og Sol; GPT-5.5 bare etter tilgangs- og kompatibilitetstest.
    - Resonneringsnivå `Lav`, `Medium` og `Høy` med enkel relativ kostnadsinformasjon.
    - Frontend sender profil-ID-er; backend eier modellnavn, støtte for web, outputgrenser og fallback.
    - Logg faktisk brukt profil per melding og evaluer kvalitet, latency, sikkerhet og kostnad før standardprofil endres.

43. **v164a-v164b - State, lokal lagring og treningsplanlegging** - Bygget
    - `app-state.js` eier defaults og normalisering av Firestore-, import- og snapshot-data.
    - `local-state-store.js` eier normalisert lokal snapshot/recovery.
    - `domain-training-plan.js` eier ren rolledekning, template-scoring og ukeplan-/øktforslag.

44. **v165 - Firestore-repository** - Bygget
    - `training-repository.js` kapsler ordinær CRUD, batch, import/replace og tømming av treningsdata.
    - `app.js` beholder Auth, state-wrappers og UI-orchestrering.

45. **v166 - Kalenderkontroller** - Bygget
    - `calendar-ui.js` eier kalendergrid, månedsnavigasjon og dagsmodal gjennom injiserte avhengigheter.
    - Mutasjoner, bekreftelser og persistence forblir i `app.js`.
    - UI/flyt og datamodell er uendret.

46. **Neste UI-runder - separat scope**
    - v167: Øktmaler - Bygget.
      - `workout-template-ui.js` eier skjema, preview, bibliotek, sortering, søk/filter og coach-klarhet.
      - `app.js` beholder normalisering, bekreftelser, state og repository-skriving.
    - v168: Fullføringsflyt - Bygget.
      - `workout-completion-ui.js` eier skjema, varighet, pace-preview og redigeringsfylling.
      - Lagring, state, coach-signaler og kalenderoppfriskning forblir i `app.js`/repository.
    - v169: Historikk - Bygget.
      - `workout-history-ui.js` eier filter/sortering, kompakt liste og detaljvisning.
      - Bekreftet sletting/angre og persistence forblir i `app.js`.
    - Hver runde skal bruke de nye modulgrensene og testes separat på mobil/PWA og desktop.

47. **v172a-v172b - Strukturert styrke og øvelsesbibliotek** - Ferdig
    - Design en versjonert, bakoverkompatibel øvelsesmodell før UI.
    - Støtt navn, sett, repetisjoner/varighet, pause, beskrivelse, muskelgrupper, formål, utstyr og sikre eksterne lenker.
    - Bygg flere gjenbrukbare styrkemaler uten å endre gamle maler.
    - Ren normalisering og validering legges i ny `domain-exercises.js`.
    - Bibliotek og valg legges i ny `exercise-library-ui.js`; `workout-template-ui.js` utvides, mens `app.js` beholder orchestrering og persistence-wrappers.

48. **v173a - Testbaserte pulssoner: design** - Ferdig dokumentert
    - `LAB_TESTS_AND_ZONES_DESIGN.md` kartlegger de faktiske pulssonene, kilde, historikk, grensepolicy og versjonerte sonesett.
    - Eksempeløktene i laboratorierapporten er eksplisitt utenfor scope.

49. **v173b - Testbasert sonehistorikk og aktivt pulssoneoppsett** - Bygget
    - Versjonerte femsonesett med kilde, testdato, gyldighetsdato og eksplisitt aktivering.
    - Alle grenser kan redigeres manuelt, mens eldre sonesett beholdes som historikk.
    - Ren logikk i `domain-heart-rate-zones.js` og egen `heart-rate-zones-ui.js`; `app.js` beholder små persistence-wrappers.

50. **v174a-v174c - Sonefordeling, etterlevelse og kanonisk kilde** - Bygget
    - v174a registrerer Garmin-prosent per sone på fullførte økter, lagrer sone-snapshot og viser en kompakt Garmin-inspirert fordeling.
    - v174b vurderer økten forsiktig mot planlagt intensjon i Logg, Innsikt og coach-context.
    - v174c bruker øktens snapshot eller aktiv labprofil konsekvent for sone 1–5, og holder Bakken-beregnet gylne sone tydelig separat.
    - RPE, smerte og kroppssignaler beholder høyere sikkerhetsprioritet enn soneprosent.

51. **v175 - Oppvarming og nedtrapping** - Bygget
    - Gjenbruk samme øvelsesbibliotek for valgfri oppvarming, hoveddel og nedtrapping.
    - Ikke bland øvelsesblokker inn i dagens intervallmodell.
    - Behold kompakt mobilvisning og snapshots i planlagte/fullførte økter.

51b. **v175b - Bibliotek- og øktmal-UX** - Bygget
    - Skill tydelig mellom komplette øktmaler og gjenbrukbare enkeltøvelser med intern fanenavigasjon.
    - Vis bibliotekene først og åpne editorene bare via `Ny øktmal`, `Ny øvelse` eller `Rediger`.
    - Grupper mal-editoren i tre forståelige steg og hold mal-kortene kompakte med detaljer ved behov.
    - Behold datamodell, snapshots og persistence uendret i de eksisterende modulgrensene.

52. **v176a-v176e - Garmin CSV-import, aktivitetsdetaljer og AI-vurdering** - Bygget
    - v176a er bygget: verifisert importkontrakt, mapping, ren CSV-adapter, fingeravtrykk, duplikatpolicy, matchnivåer og sikker merge-policy.
    - v176b er bygget: lokal forhåndsvisning, `berik eksisterende`, `koble til plan`, `opprett ny` og `hopp over`, med recovery før batchskriving.
    - v176c er bygget: alle bevarte aktivitetsfelt vises i naturlige, datadrevne kategorier uten synlig merking av datakilde.
    - v176d er bygget: pulsseksjonen prioriterer øktens pulsverdier fremfor profilenes proveniens, og en ny ren domenemodul gir en strukturert regelbasert coach-vurdering.
    - v176e er bygget: en eksplisitt knapp gir en strukturert AI-vurdering via dedikert backend, med minimert input, ingen nettsøk, lagret fingerprint og tydelig oppdateringsstatus.
    - Manuelle felt overskrives aldri uten eksplisitt bekreftelse.
    - Parsing og matching ligger i `garmin-csv-import.js`, handlingsplan i `training-import-controller.js` og UI i `training-import-ui.js`; `app.js` eier ikke CSV-logikken.

52b. **v176f - Navigerbar treningsmengde** - Bygget
    - Bruk seks perioder konsekvent for uke, måned og år.
    - Flytt hele volumvinduet én periode frem eller tilbake, med sperre mot fremtid og snarvei tilbake til dagens vindu.
    - La totalsammendrag, økter, tid og kilometer dele samme datogrenser og aktivitetsfilter.
    - Legg ren datologikk og vindusmodell i `domain-volume-trends.js`; behold bare state og rendering i `app.js`.

52c. **v176g - Aktivitetsmiljø og Året så langt** - Bygget
    - Innfør valgfritt, kildeuavhengig aktivitetsmiljø og avled eldre importerte økter uten migrering.
    - Vis utendørs/tredemølle/innendørs/basseng naturlig i Logg og la manuelt registrerte økter bruke samme felt.
    - Gi Innsikt en motiverende årsoppsummering med objektive nøkkeltall, høydepunkter og milepæler.
    - Hold aktivitetstolkning, årsberegning og rendering i egne moduler; behold `app.js` som orchestrator.
    - Ta `Form ved samme innsats` og synlig vurderingssikkerhet i senere, avgrensede runder.

52d. **v176h - Komplett milepælsoversikt og aktivitetsmiljøfilter** - Bygget
    - Vis alle årets kilometer-, økt- og ukemilepæler i et kompakt overlegg med nådd, neste og senere.
    - Presiser at øktmilepæler gjelder treningsøkter, og behold milepælene som motivasjon uten tidsfrist eller belastningskrav.
    - Vis alle registrerte aktivitetsmiljøer dynamisk og gjør `uten angivelse` til en trygg inngang til ferdig filtrert Logg.
    - Legg aktivitetsmiljø til det ordinære historikkfilteret uten automatisk klassifisering.

52e. **v176i - Kompakt informasjonsarkitektur for Innsikt og Mål** - Bygget
    - Prioriter Status og Målstatus som alltid synlige beslutningsflater.
    - Legg lokal seksjonsnavigasjon til Kontinuitet, Utvikling, Året, Mål-løp, PB og Challenges.
    - Flytt metodeforklaringer, detaljerte delmål, tomme PB-distanser og tidligere challenges til progressiv visning.
    - Behold kroppssignaler, skadesignal, belastningsvarsler, testvurdering og neste steg synlig.
    - Eie DOM-gruppering og midlertidig disclosure-state i `workspace-sections-ui.js` uten ny datamodell.

52f. **v176j - Profesjonell øktmodal** - Bygget
    - Bruk samme avrundede modalflate og visuelle rytme som milepælsoversikten.
    - Behold øktens mørke identitet som et innfelt, klebrig toppkort med synlig lukkekryss.
    - Støtt lukking med kryss, Escape og bakgrunnsklikk, og returner fokus til åpningselementet.
    - Behold øktinnhold, domenevurderinger og lagringsmodell uendret.

52g. **v176k - Desktopbalanse i Innsikt** - Bygget
    - La Intensitetsbalanse bruke full bredde når andre statuskort er skjult eller ligger over.
    - Forenkle statusoverskriften til ett nivå og bruk en diskret chevron for sammenleggbare områder.
    - Behold samme mobilstruktur, innhold og domenegrunnlag.

52h. **v176l - Form ved samme innsats** - Bygget
    - Sammenlign rolige løpeøkter konservativt innen samme aktivitetsmiljø.
    - Bruk GAP utendørs når minst åtte sammenlignbare økter har feltet; ellers bruk pace bare på egnede økter.
    - Vis lokal datadekning og vurderingssikkerhet sammen med resultatet.
    - Ikke lagre avledet innsikt eller gjøre resultatet til en generell formscore.

52h.1. **v176l2 - Forklarbart sammenligningsgrunnlag** - Bygget
    - Gjenbruk kanonisk intensitetsklassifisering og skill reelle kroppssignal fra ufarlig fritekst.
    - Vis vurderte økter, kandidater, miljøstatus og utelatelsesårsaker uten å lempe på kravet om fire pluss fire sammenlignbare økter.

52h.2. **v176l3 - Intensjon foran observert Garmin-effekt** - Bygget
    - Behold planlagt rolig intensjon selv om Garmin-effekten er `Tempo`/`High Aerobic`, og la RPE 6 inngå uten å svekke sikkerhetsporten ved RPE 7+.
    - Vis både kandidat- og sammenlignbart antall per miljø, med uendret krav om fire pluss fire.

52i. **v176m - Felles datagrunnlag og vurderingssikkerhet** - Bygget
    - Standardiser synlig datadekning, tidsperiode og vurderingssikkerhet på tvers av Innsikt.
    - Gjenbruk én evidenskontrakt og én progressiv UI-visning for Form ved samme innsats, Treningsnivå, Intensitetsbalanse, Soneetterlevelse og Formutvikling.
    - Skill datadekning fra vurderingssikkerhet uten å skjule kroppssignal eller viktige forbehold.

52j. **v176n - Selvstendig AI-vurdering av økt** - Bygget
    - Bruk den lokale coach-vurderingen som sikkerhetsrekkverk, men la AI-en levere en selvstendig syntese fremfor en parafrase.
    - Del bare aggregert historisk sammenligningsgrunnlag fra inntil seks relevante økter.
    - Komprimer tomtilstanden til en tilgjengelig ikonhandling og behold bakoverkompatibilitet med v1-resultater.

52j.1. **v176n1 - Mobil øktmodal** - Bygget
    - La det store økthodet rulle bort på mobil og gi detaljene nesten full skjermhøyde med safe-area-hensyn.
    - Behold desktopvisningen, toppkrysset og den nederste Lukk-handlingen uendret.

53. **v177 - Nedoverbelastning**
    - Registrer stigning og nedstigning separat.
    - Skill kondisjonsbelastning fra muskel-/støtbelastning.
    - Bruk nedstigning konservativt sammen med kroppssignaler og tilvenning; manglende data er ukjent.

54. **v178 - Kroppsmål for klær og utstyr**
    - Daterte omkrets- og lengdemål under Setup/profil.
    - Dataene brukes ikke til treningsnivå eller coach-råd.
    - Egen domene- og UI-modul dersom runden bygges.

55. **Mobil polish og mikro-UX**
    - Små forbedringer som gjør appen mer behagelig i daglig bruk.
    - Eksempler: kortere tekster, bedre prioritering på Hjem/Mål, sticky handlinger i modaler og bedre tomtilstander.

## Deferred / senere polish

Disse punktene var del av den tidlige v142-idéen, men er bevisst flyttet ut av den ferdige Logg-runden og har ikke reserverte versjonsnumre.

1. **Mål/PB-historikk polish**
   - Bedre PB-kort og mer lesbar PB-/testhistorikk.
   - Tydeligere utvikling over tid uten å gjøre Mål-fanen unødvendig tung.

2. **Challenge-arkiv**
   - Arkiver fullførte challenges.
   - La gamle challenges gi mestring og historikk uten å fylle Hjem.

3. **Logg ukes-/månedsgruppering**
   - Vurder gruppering bare dersom det forbedrer oversikten sammenlignet med den kompakte v142b-listen.
   - Mobilvisningen skal fortsatt være lett og skannbar.

## Anbefalt neste steg

`v173a` er dokumentert, og utviklingsløpet gjennom `v176n` er bygget. Neste runde er v177: konservativ modell for nedoverbelastning.

v164a-v169 har etablert modulgrensene som de nye rundene skal bygge videre på. v170a-v171 har lukket de åpne tekniske sporene for lokal snapshot-kvote og Firebase Functions SDK.

Begrunnelse:
- v143b har etablert en validert parameterkilde med trygg fallback
- v144 har samlet intensitetsgrunnlaget og rettet klassifiseringen av puls etter øktintensjon
- v145 har lagt til felles vern mot rask volumøkning og for aggressive råd etter opphold
- første coach-modul-uttrekk er gjort uten stor refaktorering
- v149 har etablert en strukturert beslutningspakke med hovedsignal, sekundærsignaler og guardrails
- v147 har dokumentert design/policy for fryskort
- v148 har implementert en liten manuell fryskort-v1
- v150-v153 er implementert lokalt med whitelistet context, server-side nøkkel, read-only chat og kontrollert feil-/forbruksvisning
- v155-reglene er testet i Firestore-emulator: eierens appdata fungerer, andre brukere avvises, chat-writes er backend-only og `apiKeys/{uid}` / `aiUsage/{uid}` er sperret
- v154 har fungerende dynamisk tilkoblingsstatus, egen Chat-fane og bestått ende-til-ende-test med ekte OpenAI-svar
- Produksjonsreglene er sammenlignet og deployet. Chat ligger i isolert `aiChatUsers/{uid}`-rot, og den sammenslåtte regelfilen bevarer eksisterende regler for `users`, `households`, `families`, `familyCodes` og `adminFamilyHealth`.

