# DEVELOPMENT_ROADMAP.md

Strategisk utviklingsroadmap for Treningsapp etter v138.

Oppdatert: 2026-07-07

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

### v146 - `domain-coach.js` første uttrekk

- Flytt små, tydelig rene coach-beregninger ut av `app.js`.
- Behold state-, Firebase- og DOM-wrappere i `app.js`.
- Ikke kombiner dette med stor UI-endring eller full omskriving av coachen.
- Bruk produksjonsfunksjonene direkte i stabilitetstestene.

### Senere coach-foundation

- HRV som forsiktig gult signal, eller fjerning av død `low_hrv`-policy.
- Et eksplisitt «i morgen»-perspektiv ved planlagt kvalitet.
- Grønn/nøytral feiring etter vellykket kvalitetsøkt uten smerterespons.
- Scoret regelmodell med hovedsignal og sekundærsignaler.
- Strukturert klassifisering først, tekstmatching kun som fallback.
- AI-chat design etter at regler, terskler og coach-context er konsistente.

## v147 - Fryskort for kontinuitet: design

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

## v148 - Fryskort for kontinuitet: implementering

- Implementer bare etter godkjent v147-design.
- Begrens gyldige årsaker og omfang slik at streak fortsatt betyr noe.
- Test gamle data, manglende policy og fallback.
- Behold en tydelig, positiv brukeropplevelse ved legitim sykdom, skade eller reise.

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

## Senere - AI-chat design og sikkerhetsramme

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

## Senere - AI-chat MVP

### Mål

Bygg en enkel "Spør coachen"-funksjon.

### Scope

- En enkel chatflate.
- Bruker kan stille spørsmål.
- Appen sender coach-context til backend.
- AI svarer med råd/forklaring.
- Ingen automatisk planendring.

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

1. v146 - `domain-coach.js` første uttrekk
2. v147 - Fryskort design
3. v148 - Fryskort implementering

### Neste 10 runder

1. v143a - Coach review triage og roadmap - Ferdig dokumentasjon
2. v143b - `coach-rules.json` v2 - Bygget
3. v144 - Gylne-sone-fiks og kanonisk intensitetsbalanse - Bygget
4. v145 - Volum-ramp og comeback-protokoll - Bygget
5. v146 - `domain-coach.js` første uttrekk
6. v147 - Fryskort design
7. v148 - Fryskort implementering
8. Senere - HRV / «i morgen» / post-workout-feiring
9. Senere - AI-chat design
10. Senere - Strava/Firebase-integrasjon

## Hva vi bør vente med

### Strava/Garmin-import

Nyttig, men ikke viktigst akkurat nå.

Vent til appen har bedre coachlogikk.

### Full AI-coach

Ikke bygg autopilot.

Start med AI-chat som rådgiver når coach-context er klar.

### Stor redesign

Ikke gjør alt på én gang. Dashboard-spesifikasjonen skal gjennomføres som små, testbare runder:

- heltekortet er bygget, men bør nå få flere konteksttilstander
- motivasjonskort, ukestatus og fargesystem er bygget
- videre dashboardarbeid bør være små polish-runder, ikke stor redesign

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

Anbefalt neste implementeringsrunde:

> v146 - `domain-coach.js` første uttrekk

Den skal flytte den første tydelig avgrensede gruppen av rene coach-beregninger ut av `app.js`, mens state-, DOM- og Firebase-wrappere blir stående.
