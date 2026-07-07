# DEVELOPMENT_ROADMAP.md

Strategisk utviklingsroadmap for Treningsapp etter v136.

Oppdatert: 2026-06-10

## Formål

Treningsapp skal utvikles videre som en personlig, daglig treningscoach som hjelper brukeren å ta riktige valg hver dag.

Appen skal ikke bare være en treningslogg eller en statistikkvisning. Den skal først og fremst svare på:

> Hva bør jeg gjøre i dag, og hvorfor?

Rådene skal bygge på dagsform, skadesignal, treningshistorikk, mål, progresjon, planlagte økter og relevant kontekst fra treningsfilosofien.

## Produktretning

Den ønskede appretningen er:

> En personlig daglig coach som hjelper meg å ta riktig treningsvalg hver dag, basert på dagsform, skadesignal, treningshistorikk, mål, progresjon og kommende økter. Appen skal være tydelig når noe bør justeres, men ellers motivere gjennom fremgang, PB-er, mål og konkrete neste steg.

Dette betyr at appen bør prioritere:

1. Tydelige daglige råd.
2. Konkrete anbefalinger fremfor generelle observasjoner.
3. God forklaring av hvorfor rådet gis.
4. Motivasjon gjennom mål, PB, testløp og progresjon.
5. Skadefri progresjon som sikkerhetsmekanisme.
6. Lav kognitiv friksjon: brukeren skal slippe å tolke alt selv.

## Brukerpreferanser fra brainstorming

### Overordnet approlle

- Appen bør først og fremst være en daglig coach/rådgiver.
- Logg og innsiktssystem er fortsatt viktig, fordi rådene må bygge på gode data.
- Brukeren ønsker å åpne appen om morgenen og vite hva som bør gjøres i dag.
- Rådene må være konkrete og begrunnede.
- Brukeren vil også se tydelig om formen faktisk utvikler seg.

### Coachstil

- Appen bør være balansert: tydelig anbefaling, men brukeren velger.
- Når risiko er høy, bør appen være mer bestemt.
- Ved smerte/skadesignal bør appen kunne si tydelig: "Ikke løp hardt i dag."
- Når signalene er gode, skal appen ikke mase.

### Mål og konkurranse

- Mål-løp skal være motiverende og rådgivende, men ikke overstyre hele appen.
- Hovedmålet er generell bedre form, med løp/testløp som konkrete målepunkter.
- PB, testløp og forbedring over tid er svært motiverende.
- Testløp bør anbefales når kroppen og treningsgrunnlaget er klart, ikke etter fast kalender alene.
- Mål-fanen bør primært vise "du er her nå -> neste steg".

### Skade og dagsform

- Skadeoppfølging skal være stor når signal er aktivt, ellers diskret.
- Neste dag etter smerte bør appen vise diskret oppfølging, ikke presse.
- Retur til løping/kvalitet bør være trendbasert og dagsformbasert, ikke bare rigide regler.
- Dagsform skal avgjøre dagens anbefaling.
- Appen skal være tydelig når økter bør droppes eller justeres.

### Data, import og AI

- Viktigst fremover er å redusere manuell tolkning av data og innsikt.
- Strava/Garmin-import er nyttig, men lav prioritet akkurat nå.
- AI bør først være en chat/rådgiver man kan spørre ved behov.
- AI skal ikke være autopilot som endrer plan automatisk.
- Løping kan være mest avansert, men styrke/sykling/ski bør støttes for logging, alternativ trening og totalbelastning.

### Daglig motivasjon

- Det viktigste for å åpne appen ofte er et tydelig dagens råd som endrer seg med data.
- Etter v132 skal Dagens råd også endre modus når dagens økt er fullført: fra "hva bør jeg gjøre?" til "hvordan responderte kroppen på det jeg gjorde?".
- Etter v133 skal "Grunnlag" under Dagens råd vise korte, strukturerte forklaringspunkter i stedet for én lang tekstlinje.
- Etter dashboard-spesifikasjonen i juli 2026 skal Hjem gradvis gå fra teksttung kortsamling til et mer visuelt daglig beslutningsdashboard.
- Rådene kan gjerne inkludere små støttepåminnelser om:
  - drikke/væske
  - karbohydrater før/etter økt
  - protein etter trening
  - søvn/restitusjon
  - rolig aktivitet ved skadesignal

## Nåværende appstatus etter v131

Appen har allerede:

- PWA uten build-step.
- Firebase Auth/Firestore.
- Lokal snapshot/recovery.
- Øktmaler og planlagte økter.
- Fullføring/logg av økter.
- Kalender og ukeplan.
- Dagsform/trafikklys.
- Skadesignal og skadeoppfølging.
- Strukturert intervallstøtte.
- Coach-notis og dagens beslutning.
- Coach-grunnlag v1-lignende datagrunnlag.
- Mål-fane.
- Mål-løp.
- PB og testløp.
- Manuelle race-resultater.
- PB-historikk og trendanalyse.
- Mål-score.
- Race/testløp-anbefaler.
- Race-aware ukeplan.
- Dagens råd v2 med konkret handling, støttepåminnelse og motivasjon.
- Challenges.
- Garmin-relaterte manuelle data.
- Gylne soner og pulsbasert innsikt.

Dette gir et godt grunnlag for å bygge en mer helhetlig regelstyrt coach før eventuell AI-chat.

## Strategiske prinsipper videre

### 1. Råd før rådata

Appen bør ikke bare vise flere tall. Den bør først oversette tallene til anbefalinger.

Eksempel:

Ikke bare:

- "2 harde økter siste 7 dager"
- "Kne 3/10"
- "Mål-score 64"

Men:

- "Velg rolig eller alternativ trening i dag. Kneet er bedre, men ikke klart for terskel."

### 2. Dagsform styrer dagen

Dagens råd bør bruke dagsform som en primær inngang. Hvis dagsform er gul/rød, skal planlagte økter justeres.

Hvis dagsform er grønn, kan appen bruke mål, ukeplan og progresjon til å gi mer offensiv anbefaling.

### 3. Skadesignal trumfer mål

Mål-løp er motiverende, men skal ikke presse frem hard trening ved aktiv smerte.

Ved aktivt skadesignal skal appen:

- redusere hard kvalitet
- foreslå alternativ trening
- minne om gradvis retur
- forklare hvorfor dette støtter målet på sikt

### 4. Mål-løp som kontekst, ikke diktator

Mål-løp skal gi retning, men ikke gjøre alle råd race-spesifikke.

Riktig balanse:

- "Dette støtter Halv-Birken og generell form."
- Ikke: "Alt må optimaliseres for Halv-Birken."

### 5. Motivasjon gjennom synlig fremgang

Brukeren motiveres av:

- PB
- testløp
- mål-score
- nedtelling
- delmål
- forbedring over tid
- konkrete neste steg

Dette bør brukes som positiv feedback, ikke som stress.

### 6. AI som rådgivende samtalepartner

AI bør senere brukes til spørsmål og refleksjon:

- "Bør jeg løpe i dag?"
- "Hvordan tolker du kneet?"
- "Hva bør jeg prioritere neste uke?"
- "Hvordan bør jeg legge opp Halv-Birken-forberedelsen?"

AI skal ikke automatisk endre kalender eller data uten bekreftelse.

## Anbefalt utviklingsrekkefølge

## v131 - Dagens råd v2 - Bygget

### Mål

Gjør Hjem-skjermen til appens viktigste daglige coachflate.

Status etter v131:

- Dagens råd viser nå `Gjør nå`, `Støtte` og `Hvorfor`.
- Rådet bruker dagsform, planlagt økt, skadesignal, mål-score, racefase og ukestatus.
- Støttepåminnelser om drikke, karbohydrater, protein, søvn og restitusjon vises når relevant.
- Ren logikk ligger i `dailyCoachSupport()` i `domain-core.js`.

Når brukeren åpner appen, bør "Dagens råd" gi:

- tydelig anbefaling
- hvorfor
- hva som bør justeres
- hva neste handling er
- kort støttepåminnelse når relevant

### Hvorfor dette er neste steg

Brukeren prioriterer:

- daglig råd
- mindre manuell tolkning
- presise anbefalinger
- tydelighet ved skadesignal
- motivasjon for å åpne appen flere ganger om dagen

Dette gir mer verdi enn å bygge flere grafer akkurat nå.

### Foreslått innhold

Dagens råd bør kunne vise:

1. **Beslutning**
   - Gjennomfør planlagt økt.
   - Gjør økten roligere/kortere.
   - Bytt til alternativ trening.
   - Hvil.
   - Planlegg en enkel økt.

2. **Begrunnelse**
   - dagsform
   - søvn/energi
   - hvilepuls/HRV hvis registrert
   - skadesignal
   - siste harde økt
   - siste 7/14 dager
   - planlagt økt
   - mål-score/mål-løp

3. **Konkret handling**
   - "20-30 min rolig sykkel."
   - "Gjør planlagt økt, men hold første drag kontrollert."
   - "Bytt terskel til 30 min rolig løp."
   - "Hvile eller mobilitet."

4. **Støttepåminnelse**
   - ved hard/kvalitetsøkt: karbohydrater før økt, drikke, rolig oppvarming
   - etter hard/lang økt: protein/karbohydrater, væske, søvn
   - ved skadesignal: alternativ trening, ikke test smerte for hardt
   - ved hviledag: hvile er del av planen

### Eksempel på ønsket resultat

> Dagens beslutning: Gjør rolig alternativ trening.
>
> Kneet er bedre, men fortsatt 3/10. Vent med løping/hard kvalitet til signalet er lavere og stabilt. Velg 20-30 min rolig sykkel eller mobilitet.
>
> Støtte: Spis normalt, drikk godt og prioriter søvn. Målet støttes best av skadefri kontinuitet nå.

### Teknisk anbefaling

- Legg ren logikk i `domain-core.js` eller eventuell fremtidig `domain-coach.js`.
- Behold wrapper i `app.js` som henter state:
  - dagsform
  - planlagt økt
  - siste økt
  - skadesignal
  - mål-score
  - ukeplan
  - siste 7/14/28 dager
- Test ren funksjon mot scenarioer:
  - grønn dagsform + planlagt rolig økt
  - gul dagsform + terskel
  - aktiv smerte
  - hviledag
  - ingen planlagt økt
  - etter hard økt

### Avgrensning

Ikke bygg AI.
Ikke bygg ny stor UI.
Ikke endre datamodell med mindre nødvendig.

## v132/v133 - Coach-grunnlag v2 og forklaringsmodus - Bygget

### Mål

Samle coachens datagrunnlag tydeligere, slik at både regelstyrte råd og senere AI-chat kan bruke samme pakke.

### Hva coach-grunnlaget bør inneholde

- brukerprofil/treningsprofil
- normaluke og roller
- dagsform
- skadesignal og skadeutvikling
- siste økt
- planlagt økt i dag/neste økt
- siste 7/14/28 dager
- intensitetsbalanse
- strukturert intervallarbeid
- mål-løp og fase
- mål-score
- PB/teststatus
- challenges
- rådets grunnlagsforklaring

### Hvor dette bør vises

Ikke som stor ny skjerm.

Bruk eksisterende "Grunnlag"-knapp i Dagens råd.

Den bør åpne en kompakt forklaring:

- "Dagsform: gul"
- "Skadesignal: venstre kne 3/10, bedres"
- "Siste 7 dager: 2 økter, 1 hard"
- "Mål: Halv-Birken, basebygging"
- "Konklusjon: rolig/alternativ økt"

### Teknisk anbefaling

- Ren funksjon for `buildCoachContext()`.
- App-wrapper sender inn state.
- Resultatet skal være serialiserbart.
- Dette blir senere input til AI-chat.

### Viktig

Dette er ikke AI.
Dette er intern regel- og forklaringsstruktur.

## v133 - Dagens råd forklaringsmodus - Bygget

### Mål

Gjør det tydelig hvorfor appen anbefaler det den anbefaler.

### Bakgrunn

Brukeren har sagt at rådene ikke må bli generelle. Forklaring bygger tillit og gjør appen mer lærerik.

### Foreslått UI

I Dagens råd:

- knapp/lenke: "Grunnlag"
- viser kompakt liste eller modal

Eksempel:

```text
Hvorfor dette rådet?

1. Dagsform: gult lys
2. Skadesignal: venstre kne 3/10, bedres
3. Planlagt økt: terskel
4. Siste 7 dager: 1 hard økt
5. Mål: basebygging mot Halv-Birken

Vurdering:
Bytt terskel til rolig/alternativ trening i dag.
```

### Teknisk

- Bør bruke samme coach-context som v132.
- Ingen ny datamodell.
- Tester bør sjekke at forklaringspunkter produseres i riktige scenarioer.

## v134 - Dashboard heltekort - Bygget

### Mål

Slå sammen `Dagsform`, `Neste økt` og `Dagens råd` til ett tydelig heltekort på Hjem.

Dette skal redusere repetisjon og gjøre Hjem mer umiddelbart: brukeren skal raskt se status, anbefalt handling og neste økt uten å lese tre separate kort.

### Scope

- Dagsform vises som grønn/gul/rød statuschip øverst i heltekortet.
- Neste/dagens økt vises med tittel, dato og én kort begrunnelse.
- `Øktdetaljer`, `Forberedelse` og `Grunnlag` legges bak utvidbare rader.
- Primærhandlingene `Marker utført` og `Endre dato` beholdes.
- Eksisterende coach-logikk, dagsformlogikk og fullføringsflyt beholdes.
- Ingen ny datamodell.

### Viktig

- Mobil skal fortsatt være førsteprioritet.
- Første skjerm skal svare på "Hva skal jeg gjøre nå?" uten tung tekst.
- Etter fullført økt skal heltekortet bruke etter-økt-vurderingen fra v132.
- Dette er en UI-sammenslåing, ikke ny coach-motor.

### Status etter v134

- Hjem-toppen er nå ett heltekort.
- Dagsform vises som statuschip.
- Hovedbudskapet viser dagens/neste økt eller fullført økt.
- Øktdetaljer, forberedelse og grunnlag ligger bak utvidbare rader.
- Eksisterende dagsformskjema, skadeoppfølging og coach-grunnlag er beholdt.

## v135 - Dashboard motivasjonskort - Bygget

### Mål

Løft de mest motiverende eksisterende elementene opp på Hjem.

### Scope

- Kompakt mål-kort med mål-løp, nedtelling/uker igjen, mål-score og fase.
- Kontinuitetskort med streak og minigrid fra Innsikt.
- Siste høydepunkt fra PB/testløp eller nylig forbedring.
- Gjenbruk eksisterende `goalScore`, `racePlan`, PB-historikk og kontinuitetslogikk.
- Ingen ny datamodell.

### Status etter v135

- Hjem har nå tre kompakte motivasjonskort under heltekortet.
- `Mål-løp` viser aktivt løpsmål, uker/nedtelling, mål-score og fase.
- `Kontinuitet` viser antall uker på rad og en enkel 8-ukers minigrid.
- `Siste høydepunkt` viser ny PB/testløp eller siste registrerte race/test.
- Løsningen gjenbruker eksisterende mål-, PB- og kontinuitetslogikk uten ny datamodell.

## v136 - Denne uken og challenge-status v2 - Bygget

### Mål

Gjør ukestatus og månedens challenge mer visuelt og motiverende.

### Scope

- Ukestatus med ring for økter, tid, kilometer og små dagsstolper.
- Challenge-kort med forventet takt-markør og tydelig `i rute / bak takt`.
- Kilometer vises på Hjem sammen med økter og tid.
- Bruk eksisterende challenge-progress og ukesammendrag.

### Status etter v136

- `Denne uken` på Hjem viser nå øktring, tid, kilometer, belastning og dagsstolper.
- Ukeprogresjonen bruker eksisterende ukesammendrag og ukemål.
- Aktiv challenge viser faktisk progresjon mot forventet takt med markør og `I rute` / `Bak takt`.
- Endringen introduserer ingen ny datamodell.

## v137 - Dashboard fargesystem og desktop polish

### Mål

Profesjonalisere den visuelle tydeligheten etter at ny Hjem-struktur er på plass.

### Scope

- Planlagt økt skal være nøytral, ikke rød/orange alarm.
- Grønn = utført/i rute/grønt lys.
- Gul = obs/nær grense.
- Rød = stopp/avvik.
- Orange = merkevare og primærhandling, ikke generell status.
- Desktop bruker bredde bedre med dashboard-grid.
- Tall på Hjem gjøres større og mer lesbare.

## v138 - Ernæring, væske og restitusjonsnotater

### Mål

Legg til små, smarte støttepåminnelser i Dagens råd og heltekortets forberedelsesrad.

Dette skal ikke bli en full ernæringsapp.

### Når notater bør vises

Ved kvalitetsøkt:

- "Spis karbohydrater før økta."
- "Drikk godt før og etter."
- "Start kontrollert."

Ved lang økt:

- "Tenk væske og energi hvis økta blir lang."
- "Fyll på med karbohydrater/protein etterpå."

Ved restitusjon:

- "Hvile er del av progresjonen."
- "Protein, søvn og rolig bevegelse hjelper."

Ved skadesignal:

- "Ikke bruk smerte som test i dag."
- "Velg alternativ trening hvis du vil bevege deg."

### Teknisk

- Ren funksjon som tar dagens beslutning og planlagt økt som input.
- Ingen logging av ernæring i første versjon.

## v139 - AI-chat design og sikkerhetsramme

### Mål

Dokumentere og forberede AI-chat før implementering.

### Hvorfor ikke bygge direkte

AI-chat bør ikke kobles rett inn uten tydelige rammer:

- Hvilke data sendes?
- Hva får AI lov til å svare på?
- Hva skal ikke AI gjøre?
- Hvordan håndteres API-nøkkel/backend?
- Hvordan unngå at AI overstyrer sikkerhetsregler?

### Anbefalt rolle

AI-chat skal være:

- rådgivende
- forklarende
- diskuterende
- basert på coach-context

AI-chat skal ikke:

- automatisk endre kalender
- automatisk slette/endre data
- ignorere skadesignal
- gi medisinske diagnoser

### Eksempler på spørsmål

- "Bør jeg løpe i dag?"
- "Hvordan bør jeg tolke kneet?"
- "Hva bør jeg prioritere de neste to ukene?"
- "Hvordan kan jeg bli bedre mot Halv-Birken uten å trigge skade?"
- "Hvorfor gikk mål-score ned?"

### Teknisk

- Eget dokument før bygging, f.eks. `AI_COACH_DESIGN.md`.
- Sannsynligvis backend via Firebase Cloud Functions senere.
- Ikke eksponer OpenAI API-nøkkel i frontend.

## v140 - AI-chat MVP

### Mål

Bygg en enkel "Spør coachen"-funksjon.

### Scope

- En enkel chatflate.
- Bruker kan stille spørsmål.
- Appen sender coach-context til backend.
- AI svarer med råd/forklaring.
- Ingen automatisk planendring.

### Forutsetninger

Bør vente til:

- Coach-grunnlag v2 finnes.
- AI-design er dokumentert.
- Backendvalg er bestemt.

## v141 - Mål-fane videre: Du er her nå

### Mål

Gjør Mål-fanen enda mer handlingsorientert.

### Nåværende status

Mål-fanen har:

- mål-løp
- mål-score
- milepæler
- race/testløp-anbefaling
- PB-historikk
- challenges

### Neste forbedring

Vis tydeligere:

- nåværende fase
- viktigste svakhet
- neste test
- neste 2-ukers fokus
- hva som vil flytte score mest

Eksempel:

```text
Du er her nå:
Basebygging mot Halv-Birken.

Det som flytter deg mest:
2 stabile uker med rolig volum og smertefri løping.

Neste relevante test:
5 km kontrollert test når kneet er stabilt.
```

## v142 - Challenges som delmål

### Mål

Koble kortsiktige challenges til langsiktige mål.

### Eksempler

- "85 km i juni støtter basebygging mot Halv-Birken."
- "Denne challengen bør roes ned ved aktivt skadesignal."
- "Du ligger 65 km unna målet, men treningsgrunnlaget bør fortsatt bygges kontrollert."

### Hvorfor

Challenges er motiverende, men kan også gi feil press hvis kroppen signaliserer skade.

Appen bør balansere motivasjon og trygg progresjon.

## v143 - Andre treningsformer v1

### Mål

Støtte styrke, sykling, ski og mobilitet bedre uten å bygge full spesialcoach.

### Prinsipp

Løping kan fortsatt være mest avansert.

Andre treningsformer bør brukes til:

- logging
- totalbelastning
- alternativ trening
- restitusjon
- generell form

### Aktuelle forbedringer

- bedre kort for styrkeøkt
- enkel styrkevolumhistorikk
- sykling/ski som alternativ ved skade
- coach-råd som sier "velg sykkel" ved smerte

## v144 - Strava/Garmin-forberedelse

### Mål

Holde importsporet dokumentert, men ikke prioritere bygging før coachen er bedre.

### Hvorfor lavere prioritet

Brukeren prioriterer mindre manuell tolkning over mindre manuell logging.

Appen må først bli flinkere til å forstå dataene.

### Når dette bør tas opp igjen

Når:

- daglig råd er bedre
- coach-context er tydelig
- AI-chat-design er klart
- backendvalg er mer aktuelt

## Prioriteringsmodell videre

Når nye ideer vurderes, bør vi spørre:

1. Gjør dette Dagens råd bedre?
2. Reduserer dette manuell tolkning?
3. Øker dette motivasjonen uten å øke stress?
4. Gjør dette appen tryggere ved skadesignal?
5. Bygger dette videre på eksisterende data?
6. Kan det testes som ren logikk?
7. Kan det bygges uten stor rewrite?

Hvis svaret er ja på flere av disse, bør ideen prioriteres.

## Anbefalt kort roadmap

### Neste 3 runder

1. v137 - Dashboard fargesystem og desktop polish
2. v138 - Ernæring, væske og restitusjonsnotater
3. v139 - AI-chat design

### Neste 10 runder

1. Dashboard heltekort
2. Dashboard motivasjonskort
3. Denne uken og challenge-status v2
4. Dashboard fargesystem og desktop polish
5. Ernæring/væske/restitusjonsnotater
6. AI-chat design
7. AI-chat MVP
8. Mål-fane videre: "Du er her nå"
9. Challenges som delmål
10. Andre treningsformer v1

## Hva vi bør vente med

### Strava/Garmin-import

Nyttig, men ikke viktigst akkurat nå.

Vent til appen har bedre coachlogikk.

### Full AI-coach

Ikke bygg autopilot.

Start med AI-chat som rådgiver når coach-context er klar.

### Stor redesign

Ikke gjør alt på én gang. Dashboard-spesifikasjonen skal gjennomføres som små, testbare runder:

- først heltekort
- deretter motivasjonskort
- deretter ukestatus/challenge
- til slutt fargesystem og desktop-polish

### Full styrkecoach

Ikke nødvendig nå.

Styrke bør støttes som logging/alternativ trening først.

## Risikoer

### For mye informasjon på Hjem

Dagens råd må bli bedre, men ikke større og tyngre.

Løsning:

- prioritert toppbeslutning
- kort begrunnelse
- "Grunnlag" for detaljer

### For hard mål-/race-styring

Mål-løp må ikke presse frem feil trening.

Løsning:

- dagsform og skadesignal trumfer mål
- mål-løp brukes som kontekst, ikke diktator

### AI for tidlig

AI uten godt coach-context kan gi generiske råd.

Løsning:

- bygg coach-context v2 først
- dokumenter AI-rammer
- AI skal svare, ikke styre automatisk

### Appen blir for løpe-spesifikk

Løping er viktigst nå, men appen skal også støtte annen trening.

Løsning:

- la løping ha mest avansert logikk
- bruk andre aktiviteter i totalbelastning og alternative anbefalinger

## Teknisk utviklingsprinsipp

Følg eksisterende guardrails:

- Ikke gjør stor rewrite.
- Ren logikk i `domain-core.js` eller egen domene-fil.
- `app.js` kan ha wrappers for state, DOM og Firebase.
- Ny ren logikk skal testes fra produksjonsfil.
- Nye datafelter må være bakoverkompatible.
- Runtime-endringer krever versjonsbump i `APP_VERSION` og `CACHE_NAME`.
- PWA-cache må oppdateres ved nye runtime-filer.

## Konklusjon

Neste store verdiøkning er ikke mer logging eller flere grafer.

Neste store verdiøkning er en bedre daglig coach.

Anbefalt neste utviklingsrunde:

> v137 - Dashboard fargesystem og desktop polish

Den bør gjøre dashboardet mer profesjonelt ved å stramme inn statusfarger, tallhierarki og desktop-polish uten ny datamodell.
