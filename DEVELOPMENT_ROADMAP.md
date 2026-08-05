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
- Gjenbruk data/l…9100 tokens truncated…rte og bakoverkompatible.
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

`v173a` er dokumentert i `LAB_TESTS_AND_ZONES_DESIGN.md`, og `v173b` er bygget som testbasert sonehistorikk med et eksplisitt aktivt, manuelt redigerbart femsonesett. `v174a` registrerer Garmins prosent per sone og bevarer brukt soneprofil som snapshot. `v174b` legger til forklarbar og forsiktig etterlevelsesvurdering i Logg, Innsikt og coach-context. `v174c` samler kildehierarkiet og skiller labsoner fra Bakken-beregnet gylne sone på alle relevante flater. `v175` gjenbruker øvelsesmodellen for oppvarming, hoveddel og nedtrapping og bevarer innholdet i planlagte og fullførte snapshots. `v175b` rydder Setup-biblioteket i separate arbeidsflater for øktmaler og enkeltøvelser uten å endre dataflyten. `v176a` låste Garmin CSV-kontrakten i en ren adapter, `v176b` koblet den til en lokal forhåndsvisningsveiviser med recovery og kontrollert repository-skriving, `v176c` viser de bevarte aktivitetsfeltene i naturlige kategorier, og `v176d` rydder pulsvisningen og flytter den regelbaserte øktvurderingen til en ren domenemodul. Eksempeløktene i laboratorierapporten er bevisst utelatt. Neste implementeringsrunde er v177: nedoverbelastning.

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

