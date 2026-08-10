# DEVELOPMENT_ROADMAP.md

Strategisk utviklingsroadmap for Treningsapp etter v138.

Oppdatert: 2026-08-04

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

## v137 - Dashboard fargesystem og desktop polish - Bygget

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

### Status etter v137

- Planlagt-status er gjort visuelt nøytral i tags og kalender.
- Progresjon som er `I rute` bruker grønn status, mens `Bak takt` bruker gul/obs.
- Rødt er fortsatt forbeholdt stopp, høy belastning, kroppssignal eller avvik.
- Ukestolper og ukekort på Hjem er gjort roligere og mer desktop-vennlige.
- Oransje brukes mer som merkevare-/handlingsfarge enn generell status.

## v138 - Heltekortets tilstander og v137b polish - Bygget

### Mål

Gjør heltekortet på Hjem til en ekte kontekststyrt beslutningsflate, ikke bare et fast kort med neste økt.

Heltekortet skal kunne bytte tydelig tilstand etter hva som faktisk er relevant akkurat nå:

1. Fullført økt.
2. Konflikt mellom dagsform/belastning og plan.
3. Planlagt hviledag.
4. Langt opphold / velkommen tilbake.
5. Normal planlagt økt.

Dette er neste store dashboard-steg fordi samme mekanikk brukes for alle tilstandene: ett toppkort som prioriterer dagens viktigste beslutning.

### Viktigste tilstand: konflikt dagsform/plan

Hvis dagsform, skadesignal eller intensitetsbalanse tilsier forsiktighet, samtidig som planlagt/neste økt er hard, skal heltekortet bli handlende:

```text
Dagsform tilsier lettere økt.
Bytt intervall til rolig alternativ?
```

Dette bør i første versjon støtte ett trygt bytteforslag, for eksempel:

- hard løpeøkt -> rolig løp
- hard løpeøkt + aktivt skadesignal -> alternativ trening / hvile
- høy hardandel siste 14 dager -> kontrollert rolig økt

Målet er ikke at appen skal overstyre brukeren, men å gjøre regelmotoren praktisk nyttig i det øyeblikket den ser en konflikt.

### Fullført økt

Når dagens økt er fullført, skal heltekortet resten av dagen skifte fra "hva bør jeg gjøre?" til en rolig feiring og vurdering:

- "Bra gjennomført"
- hva som var positivt
- kort belastnings-/smerterespons
- eventuell påminnelse om restitusjon

Feiring skal være lavmælt og nyttig, ikke masete.

### Planlagt hviledag

Hviledag skal være en fullverdig positiv tilstand, ikke et tomt kort:

```text
Planlagt hviledag.
Dette bygger overskudd til neste økt.
```

Ved skadesignal eller tung belastning bør hviledag forklares som et aktivt godt valg.

### Langt opphold

Hvis det er lenge siden siste økt, bør heltekortet ønske brukeren tilbake og foreslå en nedjustert start:

```text
Velkommen tilbake.
Start med 20-30 min rolig og kjenn etter.
```

Dette skal redusere terskel for å komme i gang igjen, ikke gi dårlig samvittighet.

### v137b polish i samme runde

Basert på skjermbildet etter v137 bør disse små UI-grepene gjøres før eller sammen med v138:

- Fjern dobbel `1/3`: ringen er sannhetskilden for øktmål, så den ekstra `1/3 økter`-boksen fjernes.
- Krymp dagsstolpene til en lav, tett rad slik at de blir et rytmeglimt, ikke en egen seksjon.
- Balanser desktop-rutenettet under heltekortet. Vurder om `Denne uken` skal rykke opp i venstre kolonne ved siden av høydepunktkortet, eller om heltekortet skal strekkes slik at venstre/høyre kolonne føles jevnere.

### Teknisk anbefaling

- Lag ren tilstandsvurdering i `domain-core.js` hvis mulig, for eksempel `homeHeroState()` eller tilsvarende.
- `app.js` bør fortsatt eie DOM/state/Firebase-wrapperen.
- Konfliktlogikk bør gjenbruke eksisterende dagsform, skadesignal, intensitetsbalanse og planlagt økt.
- Ett-trykks bytte skal være konservativt og bekreftende, ikke automatisk endre plan uten brukerhandling.
- Ingen ny datamodell med mindre det er nødvendig for å lagre et eksplisitt bytte.

### Tester

Test minst scenarioene:

- fullført økt i dag gir etter-økt-tilstand
- hard økt + gul/rød dagsform gir konflikt-tilstand
- hard økt + for hard intensitetsbalanse gir konflikt-tilstand
- hviledag gir positiv hviledagstilstand
- langt opphold gir velkommen-tilbake-tilstand
- normal planlagt økt fungerer som før

### Status etter v138

- Heltekortet klassifiseres nå med ren `homeHeroState()` i `domain-core.js`.
- Fullført økt gir post-workout-tilstand i heltekortet resten av dagen.
- Hard planlagt/neste økt kan gi konflikt-tilstand når dagsform, kroppssignal eller 14-dagers intensitetsbalanse tilsier lettere valg.
- v138b presiserer dette skillet: dagsform-chipen viser faktisk registrert dagsform, mens belastnings-/intensitetskonflikt vises som egen heltekort-tilstand.
- Konflikt-tilstanden tilbyr konservativt bytte til en eksisterende rolig/restitusjonsmal, med bekreftelse før planlagt økt oppdateres.
- Planlagt hviledag vises som positiv hviledagstilstand når det finnes en kommende plan, men ingen økt i dag.
- Langt opphold gir velkommen-tilbake-/lett-start-tilstand.
- v137b-polish er gjennomført: dobbel `1/3` er fjernet, dagsstolpene er lavere/tettere, og `Denne uken` ligger bedre i desktop-rutenettet.

## v139 - Mål-kort v2 på Hjem

### Mål

Gjør mål-kortet på Hjem enda mer motiverende uten å gjøre det stort.

### Scope

- Vis tydeligere mini-delmal eller neste milepæl.
- Vis enkel trend for mål-score: opp, ned eller uendret.
- Vis fase på en måte som føles som fremdrift, for eksempel "Basebygging - steg 2 av 5".
- Behold kortet kompakt.

### Hvorfor

Mål-kortet er en av de sterkeste motivasjonsflatene på Hjem. Det bør gi følelsen av at brukeren er på vei et sted, ikke bare telle ned til en dato langt frem i tid.

### Teknisk

- Gjenbruk eksisterende mål-score, raceplan og milepællogikk.
- Ikke innfør ny datamodell i første versjon.
- Test ren måltekst/trendlogikk hvis den trekkes ut.

## v140 - Ukesvolum-graf på Hjem desktop

### Mål

Legg til en kompakt ukesvolum-trend på Hjem, primært for desktop og større skjermer.

### Scope

- Vise enkel trend for siste 6-8 uker med kilometer/tid.
- Skal være kompakt og ikke konkurrere med heltekortet.
- Bør være skjult eller svært nedtonet på mobil hvis det gir mer støy enn verdi.
- Gjenbruk data/logikk fra Innsikt der det er mulig.

### Hvorfor dette kommer etter v138/v139

Innsikt er allerede ett trykk unna, så dette løser et mindre problem enn heltekort-tilstander og mål-kortet. Det er likevel nyttig på desktop, der Hjem har mer plass.

### Teknisk

- Start uten ny datamodell.
- Bruk ren summering hvis mulig.
- Pass på at mobilopplevelsen ikke blir tyngre.

## v141 - Kalender polish og handlingsflyt

### Mål

Gjør kalenderen mer behagelig og handlingsorientert uten stor redesign.

### Scope

- Mindre teksttung ukeplan.
- Tydeligere rolle-/statuschips.
- Planlagt skal fortsatt være nøytral.
- Bedre skanning på desktop.
- Mobil skal fortsatt være enkel én-kolonneflyt.
- Eventuelle konfliktforslag fra heltekortet bør kunne forstås i kalenderen uten at kalenderen blir komplisert.

### Hvorfor

Kalenderen er stedet der råd blir til faktisk plan. Etter at heltekortet kan foreslå justeringer, bør kalenderen være enklere å lese og stole på.

## v142 - Logg polish - Ferdig

### Mål

Gjør treningshistorikken mer ryddig, skannbar og nyttig, særlig på mobil.

### Levert

- v142 gjorde øktkategori, rolle/formål, belastning og nøkkeltall tydeligere i Logg.
- v142b trimmet standardkortet til øktnavn, dato, aktivitet/intensitet og en kompakt hovedlinje med distanse, tid og puls.
- Maks én prioritert kontekstchip og en diskret fargemarkør gir rask skanning uten å gjøre kortene tunge.
- Detaljmodal, filtre, sletting/angre og eksisterende dataflyt er beholdt.
- v142c rettet tekstbryting i ukestatuskortet på Hjem uten å endre Logg-flyten.
- Ingen ny datamodell ble introdusert.

### Utsatt fra opprinnelig scope

Disse punktene ble ikke presset inn i v142 og ligger som egne, versjonsløse spor under `Deferred / senere polish`:

- Mål/PB-historikk polish.
- Challenge-arkiv.
- Logg ukes-/månedsgruppering, bare dersom det faktisk forbedrer dagens kompakte oversikt.

### Hvorfor

Når Hjem blir mer beslutningsorientert, skal Logg være en rask oversiktsflate. Full informasjon finnes fortsatt i detaljvisningen.

## Deferred / senere polish

### Mål/PB-historikk polish

- Forbedre PB-kort og gjøre PB-/testhistorikk enda lettere å lese.
- Synliggjøre utvikling over tid uten å gjøre Mål-fanen mer teksttung.
- Gjenbruke eksisterende PB- og trendlogikk; ingen ny versjon er reservert.

### Challenge-arkiv

- Arkivere fullførte challenges slik at aktive mål ikke drukner.
- Beholde gamle challenges som mestrings- og historikkvisning uten å fylle Hjem.
- Avklare ønsket dataflyt og bakoverkompatibilitet før implementering.

### Logg ukes-/månedsgruppering

- Vurdere gruppering først etter praktisk bruk av den kompakte v142b-loggen.
- Bygge det bare dersom gruppering gir bedre skanning enn dagens kronologiske liste.
- Mobiloversikten skal ikke bli høyere eller tyngre.

## Coach foundation / regelmotor

Den eksterne coach-reviewen avdekket flere load-bearing forhold som bør håndteres før nye coach-avhengige features bygges:

- `coach-rules.json` caches, men brukes ikke av runtime.
- Prinsipper og policy finnes i flere kilder med begynnende språklig drift.
- Coach-terskler er hardkodet og spredt.
- Hjem, Dagens råd og Innsikt bruker ulike definisjoner av intensitetsbalanse.
- Gylne-sone-analysen kan feilklassifisere intervalløkter som brudd på rolige dager.
- Volum-ramp og en konkret comeback-protokoll mangler.
- Viktig coach-logikk ligger fortsatt tungt i `app.js`.

Dette sporet skal bygges i små runder. Det er ikke en stor refaktorering, og hver runde skal bevare eksisterende brukerflyt med eksplisitte tester av beslutningsreglene.

### Arkitekturretning

- `coach-rules.json` skal bli én sannhetskilde for prinsipper, terskler og coach-policy.
- Runtime skal ha validerte, hardkodede defaults som trygg fallback.
- Ugyldig eller utilgjengelig JSON skal aldri kunne knekke appen.
- PWA-strategien for regelfilen skal være eksplisitt og testbar.
- Nye coach-terskler skal ikke hardkodes på flere steder.
- Felles vurderinger skal beregnes én gang i domenelogikk og gjenbrukes av Hjem, Innsikt og coach-grunnlag.
- Coach-logikk skal gradvis flyttes til `domain-coach.js`; `app.js` skal hente state, kalle domene-funksjoner og rendre.
- En senere AI-coach skal bruke samme validerte regler og coach-context som den regelstyrte appen.

### v143a - Coach review triage og roadmap - Ferdig dokumentasjon

- Coach-reviewen er analysert og prioritert.
- Coach foundation er lagt inn som eget roadmap- og backlogspor.
- Fryskort er flyttet til etter de viktigste foundation-rundene.
- Ingen runtime-logikk eller versjon/cache endres i denne runden.

### v143b - `coach-rules.json` v2 - Bygget

- Dokumenter og implementer et versjonert v2-skjema for prinsipper, terskler, prioritet og policy.
- Last og valider filen ved oppstart.
- Bruk hardkodede defaults ved nettverks-, cache- eller valideringsfeil.
- Avklar eksplisitt PWA/cache-strategi og test både gyldig fil og fallback.
- Fjern dupliserte sannhetskilder gradvis; ikke endre alle coach-regler samtidig.

Status etter v143b:

- Ny `domain-coach-rules.js` eier defaults, validering, trygg merge, aktiv regeltilgang og lasting.
- Appen bruker validert regelfil for rammeverksnavn og prinsipptekster, med umiddelbare defaults som fallback.
- Regelfilen lastes network-first, ligger i app shell som offline-fallback og kan ikke blokkere appoppstart.
- Tersklene er samlet og klare for v144/v145, men eksisterende coach-beregninger er bevisst ikke koblet om i denne runden.

### v144 - Gylne-sone-fiks og kanonisk intensitetsbalanse - Bygget

- Skill rolig/base-brudd fra kontrollert terskel-brudd.
- Intervalløkter skal ikke beskrives som for harde rolige økter.
- Lag én ren intensitetsbalanse som brukes av Hjem, Dagens råd og Innsikt.
- Vindu, terskler og behandling av `highPulseBase` skal komme fra den validerte regelfilen.
- Lås sentrale scenarioer med tester før UI-tekster justeres.

Status etter v144:

- `workoutHeartRateCompliance()` skiller rolig/base-brudd fra kontrollert kvalitetsbrudd og gir trygg fallback uten pulsdata.
- `canonicalIntensityBalance()` er felles sannhetskilde for Hjem, Dagens råd/coach-grunnlag og Innsikt.
- `highPulseBase` behandles konsekvent som rolig støtte med pulssignal, ikke som hard kvalitetsøkt.
- Vindu, minimumsgrunnlag og terskler leses fra aktive coach-regler med validerte defaults.
- Eldre, ubrukte intensitetsvurderinger i `app.js` er fjernet for å unngå parallelle definisjoner.

### v145 - Volum-ramp og comeback-protokoll - Bygget

- Legg til en forsiktig vakt mot rask økning sammenlignet med normal belastning.
- Definer comeback etter lengre opphold med redusert forventning første uke.
- Unngå at ukesmål og coach-råd trekker i motsatt retning under comeback.
- Parametere skal komme fra regelfilen og logikken skal være ren og testbar.

Status etter v145:

- `trainingVolumeRamp()` sammenligner rullerende 7 dager med ukesnittet fra de foregående fire ukene.
- Varsel krever et minimum av nyere og historiske økter; tynt grunnlag gir nøytral status.
- `comebackProtocol()` oppdager både ventende retur og første uke etter retur, med sterkere reduksjon etter lengre pause.
- Hjem, Dagens råd, heltekort, coach-grunnlag og ukeplan bruker samme volum-/comeback-vurdering.
- Ukemålet reduseres midlertidig i runtime under comeback uten å endre brukerens lagrede mål eller datamodell.

### v146 - `domain-coach.js` første uttrekk - Bygget

- Flytt små, tydelig rene coach-beregninger ut av `app.js`.
- Behold state-, Firebase- og DOM-wrappere i `app.js`.
- Ikke kombiner dette med stor UI-endring eller full omskriving av coachen.
- Bruk produksjonsfunksjonene direkte i stabilitetstestene.

Status etter v146:

- Ny `domain-coach.js` eier første avgrensede gruppe med rene coach-funksjoner.
- `todayDecision()`, `homeHeroState()`, `coachDecisionBasis()`, `trainingVolumeRamp()` og `comebackProtocol()` er flyttet ut av `domain-core.js`.
- `app.js` importerer coach-funksjonene fra den nye modulen, men beholder wrappers, state, Firebase og render.
- `domain-core.js` beholder fortsatt intensitetsbalanse, pulsvurdering, skadehelpers og trenings-/templatehelpers for å unngå en stor dependency-refaktor.
- `domain-coach.js` ligger i PWA app shell og testes direkte.

### v149 - Coach Decision Engine v1 - Bygget

- Ny ren `coachDecisionEngine()` i `domain-coach.js` samler samtidige coach-signaler i én strukturert beslutningspakke.
- Motoren velger `primarySignal` etter eksplisitt prioritet: skadesignal, rød/gul dagsform, comeback/volum-ramp, intensitetsbalanse, morgendagens kvalitet og normal plan.
- Sekundærsignaler beholdes som strukturerte objekter med anbefaling, alvorlighet og forklaring.
- Beslutningspakken returnerer `blockedActions`, `allowedActions` og `guardrails` slik at senere AI-chat kan forklare appens vurdering uten å overstyre sikkerhetsreglene.
- Hjem-wrapperen bygger pakken fra eksisterende coach-context, men beholder dagens UI-flyt.
- Første myke «i morgen»-signal er lagt inn: planlagt kvalitet i morgen kan anbefale lett dag i dag når ingen høyere prioriterte signaler dominerer.
- Post-workout-feedback etter kontrollert kvalitetsøkt uten smerteøkning er gjort grønn/nøytral i stedet for alarmgul.

### Senere coach-foundation

- HRV som forsiktig gult signal, eller fjerning av død `low_hrv`-policy.
- Videre bruk av «i morgen»-perspektiv i ukeplan/coach-note der det gir verdi.
- Eventuelt mer nyansert post-workout-feiring for ulike økttyper.
- Scoret regelmodell v2 med vekting hvis enkel prioritert modell ikke er nok.
- Strukturert klassifisering først, tekstmatching kun som fallback.
- AI-chat design etter at regler, terskler og coach-context er konsistente.

## v147 - Fryskort for kontinuitet: design - Dokumentert

### Mål

Dokumenter policy, datamodell og begrensninger for fryskort før implementering.

### Bakgrunn

Streak vises nå tydelig på Hjem. Da blir en urettferdig brutt streak mer demotiverende enn om appen ikke hadde vist streak i det hele tatt.

### Scope

- Enkel måte å markere sykdom/reise/ikke-treningsuke som ikke skal bryte streak.
- Bør være begrenset og tydelig, slik at streak fortsatt betyr noe.
- Må ikke misbrukes til å skjule vanlige treningshull.
- Kalenderens "ikke treningsdag" kan være relevant input, men fryskort bør sannsynligvis gjelde på ukenivå.

### Teknisk

- Avhenger av validert coach-policy/regelfil fra foundation-sporet.
- Krever sannsynligvis en liten, bakoverkompatibel datamodell.
- Kontinuitetsberegningen må håndtere gamle data uten fryskort.

### Status etter v147

- `STREAK_FREEZE_DESIGN.md` dokumenterer policy, datamodell, brukerflyt, visning, coach-konsekvens, normalisering, import/export og testplan.
- Anbefalt datamodell er ny `continuityFreezes`-collection med datointervall, årsak, notat, kilde og status.
- Fryskort defineres som motivasjonsbeskyttelse, ikke treningsdata.
- Fryskort skal kunne beskytte streak, kontinuitetskort og urimelig "bak takt"-følelse, men aldri gi økter, kilometer, minutter, PB eller kvalitet.
- Comeback-protokollen fra v145 skal fortsatt styre trygg retur etter pause.
- v148 implementerer en liten manuell v1 med modal, normalisering, dataflyt og Hjem/Kontinuitet-visning.

## v148 - Fryskort for kontinuitet: implementering - Bygget

- Manuell v1 er bygget etter godkjent v147-design.
- Ny `continuityFreezes`-collection lagrer datointervall, årsak, notat, kilde og status.
- Normalisering håndterer gamle data uten feltet, ugyldige datoer og krav om notat for `other`.
- Hjem/Kontinuitet har inngang til modal, aktiv/arkivert liste og arkiver/slett med bekreftelse.
- Kontinuitetsstreak og ukestatus kan vise beskyttet uke uten å telle fryskort som trening.
- Fryskort påvirker ikke økter, kilometer, tid, PB, challenge-progress, kvalitet, comeback eller skadesignal.
- Kalenderinngang, egen Setup-oversikt og målscore-nøytralisering er utsatt til senere polish/design.

## Senere - Ernæring, væske og restitusjonsnotater

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

## v150-v153 - AI-coach som forklarer samme regelstyrte coach

Detaljert design og sikkerhetsbeslutninger ligger i `AI_COACH_DESIGN.md`.

Felles prinsipp for hele sporet:

- AI skal forklare og utdype `coachDecisionEngine()`, ikke lage en parallell coach fra rådata.
- `primarySignal`, `blockedActions` og `guardrails` er autoritative sikkerhetsgrenser.
- Ingen OpenAI-nøkkel skal lagres i frontend, appfiler, GitHub Pages, localStorage, backup eller recovery snapshot.
- AI-kall skal gå via autentisert Firebase Cloud Function eller Cloud Run.
- Første chat-MVP er read-only, uten web-søk og uten automatisk endring av appdata.

### v150 - AI Coach Context og sikkerhetsdesign - Bygget lokalt

Mål:

- Definer en versjonert, minimert og testbar AI-context rundt beslutningspakken fra v149.
- Dokumenter nøyaktig hvilke data som kan sendes, og hvilke som skal ekskluderes.
- Dokumenter systeminstruks, guardrails, backend, nøkkelhåndtering, kostnad, logging, personvern og første chat-UI.

Leveranse:

- `AI_COACH_DESIGN.md` er opprettet.
- Context v1 har eksplisitt whitelist for `coachDecision`, i dag, 7/14/28-dagerssummer, mål, kontinuitet og relevante høydepunkter.
- UID, e-post, secrets, rå Firestore-metadata, full historikk, backup/recovery og unødvendige helsedata er ekskludert.
- API-nøkkelfelt er designet, men bygges ikke før sikker backend finnes i v151.
- Ren `buildAiCoachContext()` er implementert i `domain-coach.js` med schema v1, profilblokk, felt-whitelist, størrelsesgrenser og lekkasjetester.

### v151 - Sikker backend og nøkkeladministrasjon - Implementert lokalt, deploy gjenstår

Mål:

- Etabler autentisert backend/proxy og trygg per-user OpenAI-nøkkelhåndtering.

Scope:

- Firebase Auth-verifisering på alle AI-endepunkter.
- Velg Callable Functions eller HTTPS-funksjon med streng CORS-allowlist for GitHub Pages.
- Server-only `apiKeys/{uid}.openai` med deny-all for frontend.
- Frontend-lesbar status inneholder bare `configured`, maskert nøkkel, status og tidspunkt.
- Setup får `Lagre og valider`, `Test tilkobling` og `Slett nøkkel`.
- Nøkkelen tømmes fra DOM etter lagring og inngår aldri i app-state, snapshot eller backup.
- Rate limit, størrelsesgrense, timeout, kostnadsvern og sanitert teknisk logging etableres.
- Ingen faktisk chatflyt eller appskriving i denne runden.
- Lokal Functions-struktur, callable auth, nøkkellagring/status, rate limit og deployguide er bygget. Produksjonsregler må kontrolleres før deploy.

### v152 - Read-only AI-coach chat MVP - Ferdig og ende-til-ende-verifisert gjennom v154

Mål:

- Bygg en enkel `Spør coachen`-flyt som bruker AI Coach Context v1 og serverbygget systeminstruks.

Scope:

- Kompakt inngang fra Hjem/Grunnlag til fullskjerms chat eller sekundær side.
- Norsk, forklarende svar med kort konklusjon, hvorfor og ett praktisk neste steg.
- Ingen web-søk, modellvelger, skriveverktøy eller automatisk planendring.
- Chat-backend har ingen Firestore-write-path til treningsdata.
- Ingen vedvarende chat-historikk i første MVP.
- Tydelige loading-, offline-, manglende nøkkel-, timeout- og rate-limit-tilstander.
- Brukeren kan se hvilke datakategorier svaret bygget på, uten å vise hele rå-contexten.
- OpenAI Responses API bruker `store: false`, ingen tools og serverstyrt modell/prompt.

### v153 - Chat polish, personvern og kostnadskontroll - Ferdig og deployverifisert gjennom v154

Mål:

- Gjør chatten robust og behagelig etter faktisk bruk før funksjonen utvides.

Scope:

- Bedre samtaleflyt og synlig context/provenance.
- Usage- og kostnadsfeedback.
- Forbedret rate-limit- og budsjettstatus.
- Eksplisitt beslutning om historikk, retention og sletting før eventuell Firestore-lagring.
- Personvern-/samtykketekst og enkel kontroll over hvilke kategorier som sendes.
- I v153 ble Chat beholdt som sekundær side. Etter praktisk vurdering er egen navigasjonsfane implementert i v154.
- Chat beholdes som sekundær side fra Hjem/Grunnlag, meldinger holdes bare i minnet, og tokenbruk/context-kategorier vises kompakt.

## v154-v158 - AI-chat som varig produktflate

Detaljert datamodell, sikkerhetsgrenser og rekkefølge ligger i `AI_CHAT_PROJECTS_DESIGN.md`.

### v154 - AI-status og egen Chat-fane - Ferdig og ende-til-ende-verifisert

- Skill tydelig mellom nøytral `Server-side`-merking og dynamisk grønn `Tilkoblet`-status.
- Legg Chat som sjette bunnnavigasjonspunkt etter Mål.
- Behold fritekstspørsmål, forslag og read-only svar.
- Verifiser mobilbredde, desktop og PWA etter navigasjonsendringen.
- Gjennomfør praktisk ende-til-ende-test med ekte nøkkel og dagens coach-context.

### v155 - Chat persistence design og sikkerhetsgrunnlag - Ferdig og Rules deployet

- Lås Firestore-modell for prosjekter, samtaler og meldinger.
- Etabler Rules-/emulatortester, normalisering og callable-kontrakter før historikk skrives.
- Avklar retention, arkivering, rekursiv sletting og separat eksport/personvern.
- Ikke kombiner designrunden med full prosjekt-UI.
- Klientskriving til chat er sperret; v156 skal bruke autentiserte Callable Functions.
- Chat er fortsatt utenfor treningsbackup/import, og sletting er definert som rekursiv backendoperasjon.
- Aktiv historikk beholdes til eksplisitt sletting; arkivert innhold har anbefalt 365 dagers retention før senere, synlig oppryddingsmekanisme.

### v156 - Synkroniserte samtaler v1 - Ferdig og manuelt godkjent

- Lagre meldinger via autentisert backend og les dem på tvers av PC/mobil.
- Opprett, fortsett, gi navn til, arkiver og slett samtaler.
- Bruk sammendrag og et begrenset nylig meldingsvindu i modellcontexten.
- Behold AI som read-only uten automatisk endring av treningsdata.

### v157 - Prosjekter og egne instrukser - Levert samlet i v159

- Opprett prosjekter som grupperer flere samtaler.
- Legg til egne prosjektinstrukser for fokus, tone, mål, tilgjengelig tid, utstyr og matpreferanser.
- Prosjektinstrukser er brukerdata og kan aldri overstyre serverens guardrails eller `blockedActions`.

### v158 - Kontrollert langtidskontekst og kvalitet - Levert samlet i v159

- Forbedre samtalesammendrag for lange diskusjoner.
- Vurder eksplisitt brukeradministrert minne på tvers av samtaler, med innsyn og sletting.
- Legg til personvern-, eksport-, kostnads- og kvalitetskontroller.
- Test trening, skade, mål-løp og generelle mat-/restitusjonsspørsmål mot samme sikkerhetsmodell.

## v159c-v160 - Svarpresisjon og transparent nivåvurdering

### v159c - Presise skiller mellom fakta, vurdering og forslag - Bygget

- AI-contexten merker treningsnivå som manuelt konfigurert og sender norsk nivåetikett.
- AI skal si «profilen er satt til», ikke hevde at appen automatisk har vurdert nivået.
- Interne enum-verdier som `building_beginner` skal ikke vises til brukeren.
- Forslag til ny vurdering skal ikke presenteres som formelle terskler eller appregler.
- Treningsnivå eller andre appdata kan aldri endres uten eksplisitt brukerbekreftelse.

### v160a - Evidens, begreper og datamodell - Bygget

- Skiller treningsmodenhet, kapasitet/prestasjon og motivasjonsnivå.
- Bruker 84-dagers treningsgrunnlag, HUNT 3 for VO2 mot alder/kjønn og egen PB-fremgang på gjentatt distanse.
- Innfører bakoverkompatibel `settings.trainingLevelProgress` med høyeste bekreftede nivå og historikk.
- Bruker ikke biologisk alder, absolutt HRV-klasse eller BMI som nivåscore.
- Full modell og kildegrunnlag er dokumentert i `TRAINING_LEVEL_ASSESSMENT_DESIGN.md`.

### v160b - Ren nivåmotor - Bygget

- Ny `domain-fitness.js` vurderer fem forklarbare dimensjoner: kontinuitet, kontrollert kvalitet, kroppssignal, kapasitet mot alder og PB/testløp.
- Motoren returnerer score, datadekning, nivå, sikkerhetsblokkeringer, manglende data og neste kriterier.
- Aktive skadesignal, comeback eller høy volum-ramp blokkerer oppgradering.
- Terskler og vekter er samlet som versjonert produktpolicy i domenemodulen og finnes ikke i UI.

### v160c - Forklarbar Innsikt-visning - Bygget

- Innsikt viser nivågrunnlag, datadekning og fem dimensjoner i et mobilvennlig kort.
- VO2 sammenlignes med relevant HUNT-referanse med målemetodeforbehold.
- PB/testløp viser egen fremgang, og WMA-aldersgradering er eksplisitt deaktivert til komplett standard er verifisert.
- Detaljer og historikk er sammenfoldet som standard.

### v160d - Gamification og bekreftet progresjon - Bygget

- Fem nivåer: Fundament, Stabil, I utvikling, Godt trent og Erfaren.
- Nytt nivå krever eksplisitt brukerbekreftelse før coach-profil eventuelt endres.
- Høyeste bekreftede nivå beholdes; svakere perioder gir sikkerhetsjustering, ikke demotiverende automatisk nedgradering.
- Bekreftelser lagres versjonert i settings-historikken og synkroniseres med eksisterende dataflyt.

### v160e - AI-context og backend-guardrails - Bygget

- AI-context får et sanitert nivågrunnlag med score, dimensjoner, datadekning og sikkerhetsblokkeringer.
- Backend validerer assessment-form og scoreområde.
- Systeminstruksen skiller beregnet nivågrunnlag fra bekreftet profilnivå.
- AI kan forklare vurderingen, men aldri bekrefte nivå, skrive profilendring eller overstyre coachens sikkerhetsprioritet.

### v160f - Kalibrering, datadekning og trinnvis nivåprogresjon - Bygget

- Manglende RPE eller respons etter kvalitetsøkten behandles som ukjent datagrunnlag, ikke som kontrollert kvalitet.
- Kvalitetsscoren skiller antall klassifiserte kvalitetsøkter fra antall økter med tilstrekkelig dokumentasjon.
- Tåleevne får ikke full score uten registrerte responser etter økter.
- Nivå 4 og 5 krever lengre observasjon og aktive uker over flere måneder; 12 gode uker kan ikke alene gi høyeste nivå.
- Beregnet nivå, bekreftet progresjon og neste bekreftbare nivå vises separat.
- Bekreftelse skjer ett nivå om gangen, og mobilkortet har tydeligere hierarki og tekstvern.

### v160g - Forklarbart vurderingsgrunnlag og neste steg - Bygget

- Skiller eksplisitt poengsummen for vurderingsgrunnlag fra beregnet treningsnivå.
- Viser konkrete udekkede krav til neste nivå fra produksjonens nivåmotor.
- Fremhever ett forsiktig neste steg basert på svakeste dimensjon; sikkerhetssignaler går foran.

## v161 - Kontrollert webtilgang for AI-chat - Implementert

### Mål

La brukeren stille spørsmål som trenger oppdatert kunnskap, blant annet om mat og ernæring, uten å gi modellen fri eller uoversiktlig nett-tilgang.

### Retning

- Websøk skal skje server-side via et eksplisitt søkeverktøy, aldri direkte fra frontend.
- Modellen skal markere når web er brukt og vise klikkbare kilder nær påstandene.
- CoachDecision, `blockedActions` og medisinske guardrails gjelder også når nettsøk brukes.
- Søkeresultater er ekstern, ubetrodd tekst og kan aldri overstyre systeminstruks eller appdata.
- Ernæringssvar skal skille generell informasjon fra individuell medisinsk rådgivning.
- Backend skal ha domene-/resultatgrenser, timeout, rate limit, kostnadstak og logging uten sensitive treningsdata.
- Før implementering skal OpenAI-verktøyvalg, personvern, kildesitering og fallback uten web dokumenteres og testes.

Status:

- Frivillig `Søk på nett` per melding med separat samtykke.
- Server-side OpenAI `web_search` med lavt søkekontekstbudsjett og blokkerte lavtillit-domener.
- Sanitert, klikkbar kildevisning og bakoverkompatibel Firestore-lagring.
- Webinnhold er eksplisitt underordnet appens coach-beslutning og sikkerhetsregler.
- Full kontrakt er dokumentert i `AI_WEB_SEARCH_DESIGN.md`.

## v162 - Etterprøvbar webbruk og mer presise ernærings-/varmesvar - Implementert

### Mål

Når brukeren ber om nettsøk, skal appen kunne vise om søket faktisk ble utført, hvilke kilder som ble brukt og hvilke opplysninger som bare kom fra brukeren eller appens treningsdata. Ernærings- og varmeråd skal samtidig bruke planlagt økt mer presist.

### Scope

- Backend returnerer eksplisitt `webSearchRequested`, `webSearchUsed`, `sourceCount` og sanitiserte kilder.
- UI viser `Nettsøk brukt`, `Nettsøk ikke brukt` eller en tydelig feil-/retry-tilstand. Appen skal aldri antyde at web ble brukt uten et faktisk verktøykall.
- Når brukeren aktivt velger nettsøk, skal backend enten kreve minst ett kontrollert søk eller forklare tydelig hvorfor søk ikke kunne gjennomføres.
- Svar skiller mellom verifiserte nettkilder, brukeroppgitt informasjon og appdata, for eksempel brukeroppgitt vær mot verifisert prognose.
- Kilder vises nær relevante påstander og prioriterer primærkilder, offentlige helse-/idrettsorganer og fagfellevurdert materiale.
- AI-contexten bruker strukturert øktvarighet, intervallstruktur, intensitet og planlagt tidspunkt når data finnes.
- Hvis nødvendig øktvarighet eller annen avgjørende informasjon mangler, skal AI-en stille ett kort oppklaringsspørsmål eller tydelig merke rådet som generelt.
- Ernærings- og væskemengder omtales som veiledende og knyttes til varighet, intensitet, varme, svetterate og individuell toleranse.

### Arkitektur og sikkerhet

- Webverktøyet forblir server-side. Frontend sender bare brukerens eksplisitte valg.
- `coachDecision`, `blockedActions`, medisinske guardrails og prosjektets kunnskapsgrunnlag har høyere prioritet enn nettsider.
- Rå søkeresultater lagres ikke. Bare sanitert kildeproveniens kan lagres sammen med meldingen.
- Manglende webstøtte hos valgt modell skal gi kontrollert fallback, ikke skjult modellbytte eller falsk kildevisning.

### Tester og akseptanse

- Web valgt + faktisk verktøykall viser kilder og `Nettsøk brukt`.
- Web valgt + intet verktøykall gir tydelig status eller kontrollert retry.
- Web ikke valgt sender ingen tools og viser ingen webmerking.
- Brukeroppgitt vær omtales ikke som verifisert prognose uten kilde.
- Planlagt strukturert økt med varighet gir mer presist før-/under-økt-råd.
- Manglende varighet gir trygg, eksplisitt generell anbefaling.
- Firestore-lagring, rate limit, coach-guardrails og read-only-policy fungerer videre.

## v163 - Modell- og resonneringsvalg under Administrer - Implementert

### Mål

La brukeren velge ønsket balanse mellom svartid, kostnad og grundighet uten å eksponere frie modellnavn eller flytte leverandørkontroll til frontend.

### Anbefalt UI

Legg en komprimert seksjon `Svarinnstillinger` under Chat -> `Administrer +`:

- **Modell**
  - `Automatisk / anbefalt`
  - `GPT-5.6 Luna - rask og rimelig`
  - `GPT-5.6 Terra - balansert`
  - `GPT-5.6 Sol - mest grundig`
  - `GPT-5.5 - tidligere toppmodell`, bare dersom brukerens nøkkel faktisk har tilgang og modellen består kompatibilitetstest
- **Resonneringsnivå**
  - `Lav - raskere og rimeligere`
  - `Medium - balansert` (anbefalt for de fleste coach-spørsmål)
  - `Høy - grundigere og dyrere`
- Vis valgt profil kompakt i chatten, men hold kontrollene sammenfoldet som standard.
- Vis en enkel relativ kostnadsmerking og advarsel før `Sol + Høy` brukes som permanent standard.

Begrepet i UI skal være `Resonneringsnivå`, ikke hvor "smart" modellen er. Høyere effort kan bruke mer tid og kostnad, men garanterer ikke et bedre svar.

### Arkitektur

- Frontend sender stabile profil-ID-er, ikke vilkårlige modellstrenger eller API-parametere.
- Backend har en eksplisitt allowlist som mapper profil-ID til modell-ID, støttede reasoning-nivåer, webstøtte, outputgrense og kostnadsprofil.
- Backend validerer modelltilgang med brukerens serverlagrede nøkkel og faller trygt tilbake til serverstandard med synlig beskjed.
- Første versjon lagrer ett globalt brukerstandardvalg. Prosjektspesifikke overrides vurderes senere dersom det gir reell verdi.
- Hver AI-melding lagrer hvilken modellprofil og reasoning-profil som faktisk ble brukt, uten å lagre secrets.
- Systemprompt, coach-context, guardrails, rate limit og `store: false` er identiske på tvers av modeller.
- Modellkatalogen er serverstyrt slik at utgåtte modeller kan fjernes uten ny frontend-release.

### Evaluering før standard endres

- Kjør et fast eval-sett med spørsmål om dagens råd, skade, mål, gylne-sone, ernæring, varme og oppfølgingsspørsmål.
- Sammenlign korrekt bruk av appcontext, kildebruk, sikkerhet, språk, latency og estimert kostnad.
- Behold dagens `GPT-5.6 Luna + low` som teknisk fallback til evalueringen viser hvilken profil som bør være anbefalt standard.

### Tester og akseptanse

- Ukjent eller manipulert profil avvises av backend.
- Alle tillatte modell-/reasoning-kombinasjoner bygger gyldig Responses API-request.
- Modell uten webstøtte kan ikke brukes til skjult eller falskt nettsøk.
- Manglende modelltilgang gir trygg fallback og tydelig UI-status.
- Valget synkroniseres mellom PC og mobil.
- Samme coach-guardrails gjelder for alle profiler.

Etter v162/v163 gikk prioriteringen til **v170a-v170b Datatrygghet - lokal snapshot-kvote**, etterfulgt av **v171 isolert oppgradering av Firebase Functions SDK**. Begge rundene er bygget og testet, og v171-backenden er deployet.

Utenfor v150-v153:

- web-søk
- automatisk kalender- eller planendring
- write-tools
- AI-generert lang treningsplan som lagres automatisk
- medisinsk diagnostikk

## Senere - Andre treningsformer v1

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

## Senere - Strava/Garmin-forberedelse

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

1. v167 - Øktmaler som egen avgrenset UI-feature - Bygget
2. v168 - Fullføringsflyt som egen UI-feature - Bygget
3. v169 - Historikk som egen UI-feature - Bygget

### Neste 10 runder

1. v143a - Coach review triage og roadmap - Ferdig dokumentasjon
2. v143b - `coach-rules.json` v2 - Bygget
3. v144 - Gylne-sone-fiks og kanonisk intensitetsbalanse - Bygget
4. v145 - Volum-ramp og comeback-protokoll - Bygget
5. v146 - `domain-coach.js` første uttrekk - Bygget
6. v149 - Coach Decision Engine v1 - Bygget
7. v147 - Fryskort design - Dokumentert
8. v148 - Fryskort implementering - Bygget
9. v150 - AI Coach Context og sikkerhetsdesign - Bygget lokalt
10. v151-v155 - Backend, chat-MVP og persistence-sikkerhetsgrunnlag bygget og deployet

## v164a-v169 - Trygg modularisering av appkjernen - Bygget

### v164a - State, normalisering og lokal lagring

- `app-state.js` eier defaults, tom app-state og bakoverkompatibel normalisering.
- `local-state-store.js` eier normalisert snapshot- og recovery-lagring gjennom et injiserbart storage-grensesnitt.
- `app.js` beholder den kjørende state-instansen og orchestrering, men dupliserer ikke normaliseringsreglene.

### v164b - Ren treningsplanlegging

- `domain-training-plan.js` eier rolledekning, template-scoring, øktforslag og ukeplansammensetting.
- Eksisterende prioriteringer og fallback-rekkefølge er beholdt og låst med produksjonstester.
- `app.js` samler fortsatt state og coach-context gjennom små wrappers.

### v165 - Firestore-repository

- `training-repository.js` kapsler all ordinær lesing, skriving, sletting, batch og utskifting av treningsdata.
- Auth- og Firestore-avhengigheter injiseres, slik at repository-grensen er tydelig uten ny backend eller datamodell.
- Import, reset og eksisterende `safeStateWrite` bruker samme persistence-grense.

### v166 - Kalenderkontroller

- `calendar-ui.js` eier kalendergrid, månedsnavigasjon og dagsmodal.
- Data, formattering og handlinger injiseres; mutasjoner, bekreftelser og Firestore-wrappers forblir i `app.js`.
- Ingen synlig redesign eller brukerflyt er introdusert.
- Nye runtime-moduler ligger i PWA app shell, og lokal app shell caches atomisk mens eksterne Firebase-moduler caches separat som best-effort.

### v167 - Øktmaler som egen UI-feature - Bygget

- `workout-template-ui.js` eier skjema-lesing/-fylling, strukturert intervall-preview, sortering, select-options, søk/filter, coach-klarhet og bibliotek-rendering.
- `app.js` beholder ID-er, normalisering, standardmal-import, bekreftelser, state-mutasjon og repository-/Firestore-wrappers.
- Eksisterende øktmalmodell, gamle maler, strukturert intervallinfo og brukerflyt er uendret.
- Produksjonstester låser sortering, filter og coach-klarhet, og modulen ligger i PWA app shell.

### v168 - Fullføringsflyt som egen UI-feature - Bygget

- `workout-completion-ui.js` eier skjema-lesing/-fylling, nullstilling, modalmodus, varighetsfelt, pace-preview og gylne-sone-hint.
- `app.js` beholder oppretting av fullførtobjekter, state-mutasjon, coach-signaler, kalenderoppfriskning og repository-/Firestore-skriving.
- Datamodell og brukerflyt er uendret.

### v169 - Historikk som egen UI-feature - Bygget

- `workout-history-ui.js` eier ren filtrering/sortering, filterstatus, kompakte historikkrader og fullført-detaljvisning.
- `app.js` beholder state, modal-wrappers, bekreftet sletting/angre og persistence.
- Historikkens kompakte mobiluttrykk, detaljinnhold og sletteflyt er uendret.
- Begge modulene ligger i PWA app shell og testes gjennom produksjonsfunksjonene.

### Videre UI-retning

Øktmaler, fullføring og historikk er nå avgrenset i v167-v169. Videre uttrekk skal fortsatt være små, begrunnede runder; `app.js` skal beholde orchestrering, state, bekreftelser og persistence-wrappers.

## v170a-v171 - Datatrygghet og backend-vedlikehold - Ferdig og deployet

### v170a - Snapshot-observability

- Lokal snapshot normaliseres før serialisering, og faktisk UTF-8-størrelse måles.
- Setup viser om den lokale sikkerhetskopien er oppdatert, hvilket lagringslag som brukes og om lagringen feiler.
- Firestore forblir primær datakilde; snapshot-statusen beskriver bare det lokale sikkerhetsnettet.

### v170b - IndexedDB-fallback

- Ved `QuotaExceededError` lagres snapshot og recovery i IndexedDB i stedet for at feilen bare logges.
- Lesing velger nyeste gyldige kopi mellom localStorage og IndexedDB og ignorerer korrupt lagringsinnhold.
- Import, reset og gjenoppretting avbrytes dersom en nødvendig recovery-kopi ikke kan opprettes.

### v171 - Firebase Functions SDK

- `firebase-functions` er oppgradert fra 6.x til 7.3.0 uten endring i callable-kontrakter, AI-policy eller datamodell.
- Node 22 beholdes. Backend-syntaks og hele AI-testpakken skal passere før deploy.

## v172-v178 - Strukturert styrke, laboratoriedata og rikere treningshistorikk

Dette er neste prioriterte produktspor etter v171. Rekkefølgen er valgt etter umiddelbar brukerverdi, gjenbruk av samme datamodell og lav risiko for `app.js`.

Felles guardrails:

- Nye felter skal være valgfrie, versjonerte og bakoverkompatible.
- Firestore-, backup-, snapshot- og importdata skal normaliseres før bruk.
- Ren modell-, validerings-, import- og belastningslogikk skal ligge utenfor `app.js`.
- `app.js` skal fortsatt være orchestrator for samlet state, bekreftelser, navigasjon og persistence-wrappers.
- Nye runtime-moduler skal inn i PWA app shell og testes fra produksjonsfilene.
- Manuelt registrerte treningsverdier skal ikke overskrives av import uten eksplisitt bekreftelse.
- Helse- og kapasitetsdata skal presenteres forklarbart og uten medisinske diagnoser.

### v172a - Design og datamodell for øvelsesbibliotek og strukturert styrke - Bygget

Mål:

- Dokumenter en gjenbrukbar, versjonert modell for øvelser og øvelsesblokker.
- Støtt øvelsesnavn, sett, repetisjoner eller varighet, pause, belastning/utstyr, beskrivelse, muskelgrupper, formål og ekstern `https`-lenke.
- Støtt resepter som tekst der et enkelt tall ikke er nok, for eksempel `8-10 per side` eller `30 sekunder`.
- Behold eksisterende fritekstfelt og gamle øktmaler uendret.
- Avklar hvordan bibliotekøvelser settes inn som et snapshot i maler, slik at en senere biblioteksendring ikke endrer gamle maler eller fullførte økter.

Foreslått modulgrense:

- Ny `domain-exercises.js`: normalisering, validering, sikre defaults, URL-policy og rene sammendragsfunksjoner.
- `app-state.js`: normalisering av valgfritt øvelsesbibliotek og nye malfelter.
- Ingen omfattende UI- eller persistence-endring i designrunden.

### v172b - Øvelsesbibliotek og strukturert styrke i øktmaler - Bygget

Mål:

- Opprett, rediger, gjenbruk og søk i øvelser.
- Bygg flere styrkemaler, eksempelvis generell løpsstyrke og spesifikke kne-/IT-bånd-relaterte oppsett.
- Vis kompakt øvelsesrekkefølge i mal, planlagt økt og fullført detaljvisning.
- La beskrivelse, muskelgrupper og videolenke åpnes ved behov uten å gjøre kortene tunge.
- Eksterne lenker åpnes sikkert med `noopener`/`noreferrer`; appen bygger ikke videoinnbygging i første versjon.

Foreslått modulgrense:

- Ny `exercise-library-ui.js`: bibliotek, søk, redigering og valg.
- Utvid `workout-template-ui.js` med styrkeblokker gjennom injiserte avhengigheter.
- `workout-completion-ui.js` og `workout-history-ui.js` viser snapshots, men eier ikke lagring.
- `training-repository.js` brukes for Firestore-operasjoner; `app.js` beholder små wrappers og bekreftelser.

### v173a - Testbaserte pulssoner: design og rapportmapping - Dokumentert

Mål:

- Dokumenter datamodell og kildehierarki før Firestore/UI endres.
- Kartlegg de faktiske pulssonene fra Idrettens testsenter som ett datert og redigerbart soneoppsett.
- Avgrens v173 til pulssoner. VO2max, laktatkurve, testprotokoll og eksempeløkter fra rapporten registreres ikke i denne runden.
- Dokumenter historikk, aktivering, grensepolicy og bakoverkompatibilitet i `LAB_TESTS_AND_ZONES_DESIGN.md`.

### v173b - Testbasert sonehistorikk og aktivt pulssoneoppsett - Bygget

Mål:

- Opprett, rediger, aktiver og slett versjonerte femsonesett med kilde, testdato og gyldighetsdato.
- Behold tidligere sonesett som historikk når et nytt sett aktiveres.
- Bruk en eksplisitt grensepolicy slik at delt grenseverdi, for eksempel 130 bpm, klassifiseres entydig i den høyere sonen.
- Vis aktivt soneoppsett og lagrede soneprofiler under Setup -> Person og form -> Pulssoner.
- Sonene kan alltid endres manuelt. Ingen eksempeløkter eller treningsresepter fra testrapporten lagres.

Arkitektur:

- Ny `domain-heart-rate-zones.js` for ren normalisering, validering, aktivering og bpm-klassifisering.
- Ny `heart-rate-zones-ui.js` med injiserte state-/handlingsavhengigheter.
- `app-state.js` og `training-repository.js` utvides bakoverkompatibelt; `app.js` beholder små wrappers.

### v174a - Sonefordeling på fullførte økter - Bygget

Mål:

- Registrer prosent per pulssone fra Garmin i fullførings- og redigeringsflyten.
- Lagre soneoppsett-snapshot på økten, slik at historiske økter ikke endres når soner justeres.
- Tillat små avrundingsavvik rundt 100 %, men vis tydelig sum og valider større avvik.
- Vis en kompakt Garmin-inspirert radgraf med prosent og estimert sonetid i fullført detaljvisning.
- Gamle økter uten sonefordeling normaliseres trygt, og redigering gjenbruker øktens lagrede snapshot.

### v174b - Forklarbar soneetterlevelse - Bygget

Mål:

- Sammenlign sonefordeling med øktens rolle, intensitet, målsoner og strukturerte intervallinnhold.
- Returner `aligned`, `mostly_aligned`, `above_plan`, `below_plan` eller `unknown` med sikkerhetsnivå og grunner.
- Bruk vurderingen forsiktig i Logg, Innsikt og coach-context; totalfordeling alene skal ikke være hard fasit for intervallarbeid.
- Behold RPE, smerte og kroppssignaler foran soneprosent i sikkerhetsprioriteten.

Levert:

- Ren produksjonsfunksjon i `domain-heart-rate-zones.js` returnerer status, vurderingssikkerhet, forklaring og grunner.
- Rolig/base, restitusjon, kvalitet og race vurderes etter øktintensjon; intervalløkter får bevisst lavere sikkerhet fordi totalfordelingen også inkluderer oppvarming, pauser og nedjogg.
- Samme vurdering brukes i fullført øktdetalj, aggregert Innsikt og coach-context.
- RPE, smerteøkning og kroppstilpasning går foran pulssoneprosentene.

### v174c - Kanonisk pulssonekilde og tydelige begreper - Bygget

Mål og levert:

- Aktiv lab-/brukerdefinert profil er sannhetskilden for sone 1–5, mens historiske økter bruker sitt lagrede soneprofil-snapshot.
- Snittpuls og makspuls viser faktisk testsone når et gyldig sonesett finnes. Uten profil vises bare sikre maks-/terskelprosenter.
- «Gylne sone» beholdes som et separat, Bakken-beregnet coach-begrep og omtales ikke som sone 3.
- Fullføring, Logg, Innsikt og coach-/AI-kontekst bruker samme rene kilde- og klassifiseringsfunksjoner fra `domain-heart-rate-zones.js`.
- Ingen sonegrenser, coach-terskler eller sikkerhetsprioriteringer er endret.

### v175 - Oppvarming og nedtrapping som gjenbrukbare øvelsesblokker - Bygget

Mål:

- Bruk samme øvelsesmodell til valgfri oppvarming, hoveddel og nedtrapping.
- La løpe- og andre kondisjonsmaler ha forberedelses- og avslutningsøvelser uten å endre dagens `structuredWorkout` for intervaller.
- Støtt instruksjon, dosering og ekstern øvelseslenke på hver øvelse.
- Behold mobilvisningen kompakt med sammenfoldede blokker som standard.

Arkitektur:

- Gjenbruk `domain-exercises.js` og `exercise-library-ui.js`.
- Ikke legg en ny parallell normalisering eller egen øvelsesmodell direkte i `app.js`.

Levert:

- Øktmaler kan ha valgfrie, sammenfoldede blokker for oppvarming, hoveddel og nedtrapping for alle aktivitetstyper.
- Hver øvelse kan bruke bibliotek-snapshot med instruksjon, muskelgrupper, dosering, notat og ekstern lenke.
- Planlagte økter får et normalisert malsnapshot, og fullførte økter viderefører dette snapshotet slik at senere mal- eller bibliotekendringer ikke omskriver historikken.
- Eksisterende styrkemaler normaliseres som hoveddel, og gamle planlagte/fullførte økter uten snapshot fortsetter med trygg fallback til gjeldende mal.
- `structuredWorkout` for intervaller er uendret og holdes separat fra øvelsesblokkene.
- Fullførte økter beholder snapshot av faktisk planlagt øvelsesinnhold.

### v175b - Tydelig skille mellom øktmaler og enkeltøvelser - Bygget

Mål og levert:

- Setup-biblioteket har en intern, mobilvennlig veksling mellom `Øktmaler` og `Øvelser`; øktmaler er standardflaten.
- Malbiblioteket og øvelsesbiblioteket vises før opprettingsskjemaene. `Ny øktmal` og `Ny øvelse` åpner eksplisitte editorer ved behov.
- Øktmal-editoren er gruppert i `Grunninformasjon`, `Coach-metadata` og `Øktinnhold`, og fritekstfeltet heter nå `Overordnet øktbeskrivelse`.
- Øvelsesflaten forklarer at biblioteket inneholder gjenbrukbare enkeltøvelser som kan settes inn i oppvarming, hoveddel og nedtrapping.
- Øktmalkort er komprimert: kort sammendrag er synlig, mens innhold og coachgrunnlag kan utvides ved behov.
- Datamodell, snapshots, normalisering og persistence er uendret. UI-state eies fortsatt av `workout-template-ui.js` og `exercise-library-ui.js`; `app.js` inneholder bare små wrappers.

### v176a - Garmin CSV-import: design, mapping og sikker importkontrakt - Bygget

Mål:

- Dokumenter en adapterbasert importflyt for Garmin CSV, med senere mulighet for Strava eller annen kilde.
- Kartlegg et avgrenset sett felt til appens kanoniske data og et valgfritt `externalData.garmin`-objekt.
- Lag importfingeravtrykk fra normalisert aktivitetstype, starttid, varighet og distanse når stabil Garmin-ID mangler.
- Definer matchnivåene `sikkert treff`, `mulig treff` og `ingen treff`.
- Ekskluder rå CSV-rad og unødvendige felter fra Firestore for å begrense datastørrelse.

Foreslått modulgrense:

- Ny `garmin-csv-import.js`: CSV-parsing, feltmapping, normalisering, fingeravtrykk og duplikatkontroll uten DOM/Firebase.
- Ny `training-import-ui.js`: filvalg, forhåndsvisning, matching og eksplisitte brukervalg.
- `training-repository.js`: batchskriving etter godkjent import.
- `app.js`: orchestrering og bekreftelser, ikke CSV-parsing eller matchalgoritme.

Levert:

- `GARMIN_CSV_IMPORT_DESIGN.md` låser adapterkontrakt, aktivitetsspesifikke enheter, dataminimering, matching og merge-policy mot en verifisert Garmin Activities CSV.
- Ny ren `garmin-csv-import.js` parser, mapper, normaliserer, lager versjonert fingeravtrykk, oppdager duplikater og klassifiserer treff uten DOM, Firebase eller global state.
- Den verifiserte eksporten inneholder 106 aktiviteter og 44 kolonner, men ingen stabil Garmin-ID eller pulssonefordeling. Fingeravtrykk er derfor obligatorisk, og v174-sonedata blir ikke oppdiktet.
- Testene bruker produksjonsmodulen og kontrollerer både syntetiske grenseverdier og den lokale eksporten når den finnes.
- v176a endrer ikke runtime, app-state, Firestore, UI eller PWA-versjon. Dette kobles på kontrollert i v176b.

### v176b - Garmin CSV-importveiviser - Bygget

Mål:

- Importer CSV lokalt og vis en forhåndsvisning før data lagres.
- La brukeren velge `berik eksisterende`, `opprett ny` eller `hopp over`.
- Fyll bare tomme kanoniske felt automatisk; manuelt innhold vinner som standard.
- Vis importresultat, duplikater og usikre treff tydelig.
- Støtt blant annet puls, varighet, distanse, pace, Training Effect, stigning, nedstigning, kadens, kraft, temperatur, Body Battery og styrkesett/repetisjoner når data finnes.

Levert:

- Ny `training-import-controller.js` bygger en ren forhåndsvisnings- og commitplan med duplikatlås, sikre/mulige treff, konfliktfelt og vern mot at flere aktiviteter kobles til samme økt.
- Ny `training-import-ui.js` leser CSV lokalt, viser treffgrunnlag og handling per aktivitet og krever eksplisitt valg ved alle foreslåtte treff.
- Nye aktiviteter materialiseres med templatesnapshot og minimert Garmin-proveniens; planlagte økter kan kobles og fullføres i samme kontrollerte batch.
- `training-repository.js` skriver godkjente `completed`- og `planned`-dokumenter i avgrensede batcher og rapporterer eventuell delvis fremdrift.
- `app-state.js` whitelist-normaliserer `externalData.garmin`; rå CSV-rad og ukjente Garmin-felt overlever ikke backup eller Firestore-normalisering.
- Recovery snapshot opprettes før første write. Vanlig offline-visning og manglende nett/innlogging blokkerer import.
- `app.js` beholder bare factory, state-apply/recovery og repository-kall. Parsing, matching, konfliktpolicy og UI ligger i egne moduler.
- PWA-runtime og synlig versjon er oppdatert til `v176b`.

### v176c - Kategorisert aktivitetsinformasjon - Bygget

Mål og levert:

- Gjør de allerede lagrede aktivitetsfeltene synlige i øktdetaljene uten å skille visuelt mellom manuell og importert opprinnelse.
- Grupper data etter betydning og aktivitet: tid, belastning, puls/pust, fart, løpsdynamikk, terreng, effekt, energi/omgivelser, svømming og styrke.
- Skjul tomme felt og kategorier, og behold en kompakt mobiltilpasset oppstilling.
- Behold presentasjonslogikken i `workout-history-ui.js`; ingen ny orkestrering eller datalogikk er lagt i `app.js`.
- Datamodell, importpolicy og persistence er uendret. PWA-versjonen er `v176c`.

### v176d - Ryddigere puls og forklarbar øktvurdering - Bygget

Mål og levert:

- Øktdetaljen viser snitt- og makspuls som kompakte kort med sone, prosent av maks og prosent av terskel.
- Profildata som sonekilde, testnavn og personlig maks/terskel gjentas ikke i økten; dette forblir tilgjengelig i Setup.
- Gyllen sone beholdes som en kompakt referanse, mens den eksisterende sonefordelingen fortsatt viser detaljene.
- Ny `domain-workout-assessment.js` lager en strukturert, regelbasert vurdering med `Hva økten viser`, `Samsvar med planen` og `Neste steg`.
- Vurderingen bruker tilgjengelig sonefordeling, RPE, aerob treningseffekt, høyde, belastning, tilpasning og kroppssignaler. Kroppssignaler har fortsatt høyest sikkerhetsprioritet.
- Ingen nye lagrede felt eller backend-kall er innført. PWA-versjonen er `v176d`.

### v176e - Eksplisitt AI-vurdering av gjennomført økt - Bygget

- Beholder den lokale, regelbaserte coach-vurderingen og legger til `Få AI-vurdering` som et eksplisitt valg i øktdetaljene.
- Ny, ren `domain-ai-workout-assessment.js` bygger et minimert øktgrunnlag, fingerprint og bakoverkompatibel normalisering av lagret resultat.
- Ny dedikert callable backend gjenbruker autentisering, kryptert OpenAI-nøkkel, rate limit, dagsbudsjett, modellprofil, `store: false` og stabil safety identifier uten nettsøk eller chat-historikk.
- AI-en returnerer en kort struktur med konklusjon, 2–3 observasjoner, plansamsvar, neste steg og bare relevant usikkerhet. Aggregert Garmin CSV behandles uttrykkelig som data uten tidsserie.
- Resultatet lagres versjonert på den fullførte økten etter et vellykket kall. Endrede øktdata gir et nytt fingerprint og synlig beskjed om at vurderingen bør oppdateres.
- Datakontrakt, sikkerhet og akseptansekriterier er dokumentert i `AI_WORKOUT_ASSESSMENT_DESIGN.md`. PWA-versjonen er `v176e`.

### v176f - Navigerbar treningsmengde - Bygget

- Treningsmengde under Innsikt bruker nå seks perioder konsekvent for uke, måned og år.
- Venstre og høyre pil flytter det valgte seksperiodersvinduet én periode om gangen. Høyrepilen stopper ved dagens vindu, og `Til nå` gir en rask retur.
- Alle tre volumgrafer og totalsammendraget bruker nøyaktig samme vindu, aktivitetsfilter og datogrenser.
- Historiske vinduer viser faktiske periodenavn i kortsammenligningene i stedet for feilaktig `Nå` og `Forrige`.
- Ren dato-, vindu- og navigasjonslogikk ligger i ny `domain-volume-trends.js`. `app.js` beholder bare state-, filtrerings- og render-wrappere. Ingen lagret datamodell er endret.
- PWA-versjonen er `v176f`.

### v176g - Aktivitetsmiljø og Året så langt - Bygget

- Fullførte økter har et valgfritt, kildeuavhengig `activitySetting` for `outdoor`, `treadmill`, `indoor` og `pool`.
- Eldre importerte økter avledes bakoverkompatibelt fra lagret aktivitetskode uten migrering eller ny import. Eksplisitt manuell verdi vinner.
- Garmin-import, kontrollert merge, nye økter og manuelt fullføringsskjema bruker samme kanoniske felt.
- Logg viser aktivitetsmiljø som naturlig øktmetadata uten å vise datakilde.
- Innsikt har en ny `Året så langt`-flate med økter, treningstid, løpekilometer, aktive uker, aktivitetsmiljø, personlige høydepunkter og forsiktige milepæler.
- Ren aktivitetstolkning ligger i `domain-activity.js`, årsberegning i `domain-performance-insights.js` og rendering i `training-insights-ui.js`. `app.js` leverer bare state og kobler renderer.
- `domain-volume-trends.js` beholder eneansvar for de navigerbare seksperiodersvinduene. Form ved samme innsats og synlig vurderingssikkerhet er utsatt til egne runder.
- Datakontrakt og akseptansekriterier ligger i `PERFORMANCE_INSIGHTS_DESIGN.md`. PWA-versjonen er `v176g`.

### v176h - Komplett milepælsoversikt og aktivitetsmiljøfilter - Bygget

- `Året så langt` har en kompakt inngang til alle definerte milepæler for løpekilometer, treningsøkter og aktive uker.
- Milepælsoverlegget viser oppnådd dato, neste naturlige markør og senere muligheter uten prognosedato eller anbefalt belastningsøkning.
- Løpemiljø viser alle registrerte miljøtyper dynamisk. `Uten angivelse` åpner Logg filtrert til løping og manglende aktivitetsmiljø.
- Logg har et ordinært filter for utendørs, tredemølle, innendørs, basseng og uten angivelse.
- Domeneberegning og rendering forblir i `domain-performance-insights.js` og `training-insights-ui.js`; `app.js` har bare navigasjonskoblingen. PWA-versjonen er `v176h`.

### v176i - Kompakt informasjonsarkitektur for Innsikt og Mål - Bygget

- Innsikt er organisert i Status, Kontinuitet, Utvikling og Året. Status med uke, belastning og sikkerhetssignaler er alltid synlig.
- Mål er organisert i Oversikt, Mål-løp, PB og Challenges. Målstatus, score, neste steg og testvurdering er alltid synlig.
- En kompakt lokal knappelinje åpner og flytter til hvert tilgjengelig område uten å opprette nye app-ruter.
- Forklarings- og metodestrenger ligger bak native disclosure-felt. Tomme PB-distanser og tidligere challenges vises bare etter eksplisitt valg.
- Detaljerte delmål er sammenleggbare, mens sikkerhetskritiske vurderinger og neste handling forblir synlige.
- Ny `workspace-sections-ui.js` eier DOM-gruppering, seksjonsnavigasjon og midlertidig UI-state. Ingen Firestore-, backup- eller domenekontrakt er endret.
- Design og akseptansekriterier ligger i `INSIGHTS_GOALS_UX_DESIGN.md`. PWA-versjonen er `v176i`.

### v177 - Nedoverbelastning og todimensjonal høydevurdering

Mål:

- Registrer `elevationGainM` og valgfri `elevationLossM` separat.
- Skill kardiovaskulær belastning fra muskel-/støtbelastning.
- Bruk nedstigning som et sekundært, konservativt signal sammen med distanse, underlag, tilvenning og kroppssignaler.
- Manglende nedstigningsdata skal være `ukjent`, ikke null.
- Ikke gi medisinsk diagnose eller gjøre én terskel til hard fasit.

Foreslått modulgrense:

- Ren belastningsklassifisering i `domain-core.js` eller en avgrenset `domain-workout-load.js` dersom logikken blir stor.
- Coach-policy og terskler skal ligge i validerte coach-regler/defaults, ikke spres i UI eller `app.js`.
- UI skal først vise og forklare signalet; aggressiv automatisk coach-endring er utenfor første runde.

### v178 - Kroppsmål for klær og utstyr

Mål:

- Lagre daterte mål i centimeter, primært omkrets og lengde.
- Støtt blant annet bryst, midje/mage, hofte, innside ben, armlengde, lår, legg og fotlengde.
- Plasser funksjonen under Setup/profil som praktisk utstyrsdata.
- Hold dataene utenfor treningsnivå, motivasjonsscore og coach-råd med mindre en senere, eksplisitt designrunde bestemmer annet.
- Behold historikk, eksport, backup og Firestore-synk.

Foreslått modulgrense:

- Ny `domain-body-measurements.js` for normalisering og enhetsregler.
- Ny `body-measurements-ui.js` for registrering og historikk.
- `app.js` beholder kun navigasjon og persistence-wrappers.

### Status og anbefalt neste steg

`v172a-v172b` er bygget samlet. `STRUCTURED_EXERCISES_DESIGN.md` dokumenterer den versjonerte modellen, og produksjonen bruker `domain-exercises.js` og `exercise-library-ui.js`. Øvelser kan gjenbrukes i styrkemaler med sett, repetisjoner, pause, belastning, notat og sikre lenker. Malen lagrer snapshots slik at senere bibliotekendringer ikke endrer planlagte eller historiske økter.

`v173a` er dokumentert i `LAB_TESTS_AND_ZONES_DESIGN.md`, og `v173b` er bygget som testbasert sonehistorikk med et eksplisitt aktivt, manuelt redigerbart femsonesett. `v174a` registrerer Garmins prosent per sone og bevarer brukt soneprofil som snapshot. `v174b` legger til forklarbar og forsiktig etterlevelsesvurdering i Logg, Innsikt og coach-context. `v174c` samler kildehierarkiet og skiller labsoner fra Bakken-beregnet gylne sone på alle relevante flater. `v175` gjenbruker øvelsesmodellen for oppvarming, hoveddel og nedtrapping og bevarer innholdet i planlagte og fullførte snapshots. `v175b` rydder Setup-biblioteket i separate arbeidsflater for øktmaler og enkeltøvelser uten å endre dataflyten. `v176a` låste Garmin CSV-kontrakten i en ren adapter, `v176b` koblet den til en lokal forhåndsvisningsveiviser med recovery og kontrollert repository-skriving, `v176c` viser de bevarte aktivitetsfeltene i naturlige kategorier, `v176d` rydder pulsvisningen og flytter den regelbaserte øktvurderingen til en ren domenemodul, `v176e` gir en eksplisitt, lagret AI-vurdering via en egen sikker backendflyt, og `v176f` gjør treningsmengde historisk navigerbar med seks perioder i alle visninger. Eksempeløktene i laboratorierapporten er bevisst utelatt. Neste implementeringsrunde er v177: nedoverbelastning.

## Hva vi bør vente med

### Strava/Garmin-import

Direkte API-integrasjon mot Garmin/Strava venter fortsatt. Kontrollert Garmin CSV-import er flyttet til v176 slik at den kan fylle en ferdig, testet modell for pulssoner og øktens sonefordeling i stedet for å etablere parallelle felt.

### Full AI-coach

Ikke bygg autopilot.

Start med AI-chat som rådgiver når coach-context er klar.

### Stor redesign

Ikke gjør alt på én gang. Dashboard-spesifikasjonen skal gjennomføres som små, testbare runder:

- heltekortet er bygget, men bør nå få flere konteksttilstander
- motivasjonskort, ukestatus og fargesystem er bygget
- videre dashboardarbeid bør være små polish-runder, ikke stor redesign

### Full styrkecoach

Ikke nødvendig i v172-v173.

Styrke bygges først som strukturert bibliotek, mal, plan, logging og historikk. Egen styrkecoach og automatiske progresjonsprogrammer krever en senere designrunde.

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

Anbefalt neste implementeringsrunde:

> v168 og v169 er bygget: Fullføringsflyt og Historikk er avgrenset i egne UI-moduler uten endret lagring, coach-signaler eller brukerflyt.

v154-v156 er deployet og manuelt verifisert, inkludert kryssenhetssynk, arkiv og sletting. v159 leverer Coach Knowledge Foundation, AI-context v2, prosjekter, egne instrukser, kontrollert samtalesammendrag og personvern-/kostnadskontroller i én samlet runde. v159b presiserer hele nivåmodellen for gylne-sone og skillet mellom dagsform og varig treningsnivå.
### v159d - AI-chat oversikts- og mobilpolish - Bygget

- prosjekt- og samtaleadministrasjon er komprimert bak én sekundær kontroll
- aktivt prosjekt og samtale er fortsatt synlig uten å åpne kontrollen
- forslag vises i tom samtale, men fjernes når dialogen er i gang
- skrivefeltet er flyttet foran valgfritt grunnlag og gjort kompakt/sticky på mobil
- backend, Firestore-modell, synkronisering og coach-context er uendret

### v159e - AI-chat fullhøyde arbeidsflate - Bygget

- Chat er en egen fullhøyde arbeidsflate i stedet for et vanlig kort i en skrollende appside
- meldingshistorikken er eneste skrollområde, mens skrivefeltet alltid er tilgjengelig over bunnnavigasjonen
- mobil skjuler det generelle apphodet i Chat og bruker et kompakt samtalehode
- assistant-svar vises roligere og mindre kortpreget; brukermeldinger beholdes som diskrete bobler
- grunnlag og personvern ligger under den eksisterende samtale-/prosjektadministrasjonen
- backend, Firestore-modell, synkronisering, coach-context og sikkerhetsregler er uendret
