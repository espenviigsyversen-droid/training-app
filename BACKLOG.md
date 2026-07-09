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

22. **Fryskort design** - Planlagt v147
    - Dokumenter policy og bakoverkompatibel datamodell.
    - Gjør designet avhengig av validert coach-policy/regelfil.

23. **Fryskort implementering** - Planlagt v148
    - Sykdom, skade, reise eller andre legitime avbrudd kan fryse streak innen tydelige grenser.
    - Implementeres først etter godkjent design.

24. **Senere coach-foundation**
    - HRV som forsiktig gult signal.
    - «I morgen»-perspektiv, grønnere post-workout-feiring og scoret regelprioritet.
    - AI-chat design først når regelfil og coach-context er konsistente.

25. **Ukesvolum-graf på Hjem desktop** - Lavere prioritet
    - Kompakt volumtrend for brede skjermer.
    - Lavere prioritet fordi Innsikt allerede er ett trykk unna.

26. **Ernæring, væske og restitusjonsnotater** - Senere
    - Små støttepåminnelser i Dagens råd/heltekort.
    - Ikke full ernæringsapp.

27. **AI-chat design og sikkerhetsramme** - Senere
    - Dokumenter rolle, dataflyt, API-sikkerhet og grenser etter Coach foundation.

28. **AI-chat MVP** - Senere
    - Enkel rådgivende chat basert på samme regler og coach-context som appen.
    - Ingen automatisk planendring.

29. **Mobil polish og mikro-UX**
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

Neste anbefalte implementeringspunkt er **v147 - Fryskort design**.

Begrunnelse:
- v143b har etablert en validert parameterkilde med trygg fallback
- v144 har samlet intensitetsgrunnlaget og rettet klassifiseringen av puls etter øktintensjon
- v145 har lagt til felles vern mot rask volumøkning og for aggressive råd etter opphold
- første coach-modul-uttrekk er gjort uten stor refaktorering
- fryskort er neste, men bør starte med design/policy før implementering
