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

14. **Mål-kort v2 på Hjem** - Planlagt v139
    - Vis mini-delmål, mål-score-trend og fase som progresjon.
    - Hold kortet kompakt og motiverende.

15. **Kalender polish og handlingsflyt** - Planlagt v141
    - Gjør ukeplan og planlagte økter mer skannbare.
    - Behold nøytral planlagt-status.
    - La kalenderen støtte forståelsen av bytteforslag fra heltekortet.

16. **Logg og Mål polish** - Planlagt v142
    - Bedre pace/fart i logg, mer ryddig ukesgruppering og tydeligere PB-/måloppfølging.

17. **Fryskort for kontinuitet** - Planlagt v143
    - Sykdom, reise eller legitime avbrudd bør kunne fryse streak slik at et fremhevet kontinuitetskort ikke blir demotiverende.
    - Må dokumenteres før bygging fordi det sannsynligvis krever liten datamodell.

18. **Ukesvolum-graf på Hjem desktop** - Planlagt v140, lavere prioritet
    - Kompakt volumtrend for brede skjermer.
    - Lavere prioritet fordi Innsikt allerede er ett trykk unna.

19. **Ernæring, væske og restitusjonsnotater** - Planlagt v144
    - Små støttepåminnelser i Dagens råd/heltekort.
    - Ikke full ernæringsapp.

20. **AI-chat design og sikkerhetsramme** - Planlagt v145
    - Dokumenter rolle, dataflyt, API-sikkerhet og grenser før AI bygges.

21. **AI-chat MVP** - Planlagt v146
    - Enkel rådgivende chat basert på coach-context.
    - Ingen automatisk planendring.

22. **Mobil polish og mikro-UX**
    - Små forbedringer som gjør appen mer behagelig i daglig bruk.
    - Eksempler: kortere tekster, bedre prioritering på Hjem/Mål, sticky handlinger i modaler og bedre tomtilstander.

## Anbefalt neste steg

Neste anbefalte backlogpunkt er **Mål-kort v2 på Hjem**.

Begrunnelse:
- bygger videre på motivasjonen rundt Halv-Birken og mål-score
- kan vise mini-delmål, mål-score-trend og fase uten ny stor datamodell
- passer godt etter v138 fordi heltekortet nå håndterer dagens beslutning, mens mål-kortet kan handle mer om fremdrift
