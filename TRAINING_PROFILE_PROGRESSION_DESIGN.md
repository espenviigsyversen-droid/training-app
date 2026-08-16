# Treningsprofil, normaluke og bevisbasert progresjon

## Bakgrunn og mål

Treningsprofilen skal beskrive en uke brukeren faktisk ønsker og normalt klarer å gjennomføre. Den skal ikke gjøre en treøktersuke kunstig kvalitetstung fordi en treningsfilosofi opprinnelig er utviklet for langt høyere øktfrekvens.

Målet er å:

- oppdage vedvarende avvik mellom konfigurert normaluke og faktisk trening
- foreslå, men aldri automatisk utføre, profilendringer
- la eksisterende `domain-fitness.js` eie bevisbasert nivåprogresjon
- samle ukesmål og ukeoppskrift i én forståelig flyt
- gi blokkplanleggingen et stabilt, eksplisitt utgangspunkt uten å endre aktive planer i ettertid

## 1. Verifisert bruk av dagens profilfelt

| Felt | Faktisk virkning i dag | Vurdering |
|---|---|---|
| Hovedfokus | Brukes i coachkontekst og til å aktivere løps-/Bakken-spesifikke vurderinger | Behold, forklar virkningen |
| Nivå | Velger prosentgrenser for gylne pulssone og grensen for kvalitetsøkter over kontrollert sone. Sendes også til AI-coach som brukerdefinert kontekst | Skal omtales som coachnivå og valideres mot `domain-fitness.js` |
| Treningsfilosofi | Påvirker intensitetsbalanse, coachtekst og forslag | Behold, men oversett prinsippet proporsjonalt til valgt øktfrekvens |
| Viktigst nå | Sendes til coachkontekst, men har begrenset direkte beslutningskraft | Forklar at det er prioriteringskontekst, ikke en plan |
| Treningsfokus nå | Brukes som fase-/mål-kontekst | Behold og knytt til nye blokkers standardretning |
| Normal treningsuke | De første `weeklySessionsTarget` rollene blir obligatoriske i `normalWeekRoles()`; en fjerde rolle kan ligge lagret uten å være obligatorisk | Slås sammen visuelt med ukesmålet |
| Ukesmål økter | Styrer kontinuitet, ukestatus og hvor mange roller i normaluken som kreves | Én sannhetskilde, med historiske snapshots som allerede designet |
| Stretch økter | Brukes som frivillig bonusgrense i coachtekst; teller ikke som ordinært ukesmål | Gi nytt navn og forklaring |
| Timer/km per uke | Vises som valgfrie fremdriftsmål, men styrer ikke dagens coach eller blokkramme | Må ikke se ut som aktiv styring før bruker velger kobling |

`beginner` og `building_beginner` bruker i praksis samme gylne sone. `intermediate` og `experienced` flytter den kontrollerte kvalitetsgrensen opp. Feil nivå kan derfor gi reelt ulike pulsvurderinger selv om resten av inputen er lik.

## 2. Avviksdeteksjon for normaluken

### Vindu og datakrav

- Bruk de siste åtte avsluttede ISO-ukene.
- Krev minst seks datakvalifiserte uker og minst 18 klassifiserbare økter totalt.
- En uke er datakvalifisert når den har minst to fullførte økter med utledbar rolle/intensjonsklasse.
- Pågående uke holdes utenfor. Uker med aktiv skade-/comebackreduksjon eller eksplisitt avlastningsuke vises i grunnlaget, men teller ikke som bevis for permanent profilendring.
- Klassifisering skal gjenbruke eksisterende `inferredWorkoutRole()` og kanonisk intensitetsklassifisering. Ingen ny parallell rollemodell.

### Utløser

Et forslag vises når begge vilkår er oppfylt:

1. Median faktisk antall kvalitetsøkter per datakvalifisert uke avviker med minst én økt fra den konfigurerte normaluken.
2. Avviket går samme vei i minst seks av de åtte ukene, eller i alle seks datakvalifiserte uker dersom bare seks/sju finnes.

For en normaluke med to kvalitetsroller og faktisk stabil gjennomføring med én kvalitet og to rolige vil forslaget derfor utløses. En enkelt sykdoms-, ferie- eller avlastningsuke gjør det ikke.

### Visning og handling

Primær plassering er inline øverst i Setup → Treningsprofil, fordi endringen hører til der. Innsikt kan vise en kompakt lenke: «Faktisk ukerytme avviker fra profilen». Forslaget skal ikke ligge som daglig press på Hjem.

Tekstforslag:

> **Ukeprofilen ser annerledes ut i praksis**  
> De siste 8 ukene har du vanligvis gjennomført 1 kvalitetsøkt og 2 rolige økter. Profilen forventer 2 kvalitetsøkter. Vil du bruke den faktiske rytmen som ny normaluke?

Handlinger: `Se sammenligning`, `Oppdater profil`, `Behold som den er`. Oppdatering viser en diff og krever bekreftelse. Ingen automatisk endring.

## 3. Nivå og bevisbasert progresjon

### Eierskap

`domain-fitness.js` forblir eneste progresjonsmotor. Den kombinerer blant annet kontinuitet, kontrollerte kvalitetsøkter, kroppssignaler, VO2max og gjentatte test-/løpsresultater. Den foreslår trinnvis progresjon og endrer allerede coachnivå først etter eksplisitt bekreftelse.

Profilfeltet bør få navnet **Coachnivå for intensitet** med hjelpetekst:

> Påvirker hvilke pulsnivåer appen regner som kontrollert kvalitet. Innsikt kan foreslå endring når datagrunnlaget er sterkt; ingenting endres uten at du bekrefter.

### Validering

- Ved middels/høy vurderingssikkerhet sammenlignes valgt coachnivå med `recommendedCoachLevel` fra `domain-fitness.js`.
- Ved dokumentert oppgradering brukes eksisterende bekreftelsesflyt og `confirmedTrainingLevelProgress()`.
- Et manuelt valgt nivå som ligger høyere enn datavurderingen gir en nøytral kontrollmelding, ikke automatisk nedgradering. Kort treningshistorikk, skade eller avlastning skal ikke senke nivået.
- Meldingen skal forklare den konkrete virkningen, for eksempel at `Viderekommen` gir høyere øvre pulsgrense for kontrollert kvalitet.

Signalene som kan utløse oppgraderingsforslag er de eksisterende kravene i `domain-fitness.js`: nok økter og aktive uker, repeterbar kontrollert kvalitet, tilstrekkelige kroppssignaldata og – på høyere trinn – VO2max eller gjentatt test-/løpsresultat. Tid alene er aldri nok.

## 4. Én flyt for mål og normaluke

Setup bør samle «Treningsmål» og den ukentlige delen av «Treningsprofil» i ett panel: **Normaluke og kapasitet**.

Foreslått rekkefølge:

1. **Ordinært ukesmål** – antall økter som kontinuitet og ukestatus måles mot.
2. **Ukeoppskrift** – nøyaktig samme antall obligatoriske roller som ukesmålet.
3. **Bonusøkt ved overskudd** – dagens «Stretch økter», frivillig og uten betydning for streak. Forklar at bonus aldri skal tas igjen.
4. **Veiledende volum** – timer eller kilometer, valgfritt. Vis hvilken enhet som er aktiv og hva den påvirker.

Hvis ukesmålet er tre, vises tre obligatoriske øktroller. En fjerde rolle vises bare under «Bonusøkt ved overskudd». Dermed kan ikke «Økt 4» se obligatorisk ut når målet er tre.

Timer/km skal foreløpig merkes «vises i fremdrift, styrer ikke råd». Når blokkplanlegging tas i bruk, kan brukeren velge å bruke ett av dem som utgangspunkt for blokkens volumramme. Verdien kopieres da inn i blokk-utkastet og valideres der; den endrer ikke en aktiv blokk automatisk.

Hvert felt får en kort «Påvirker»-linje:

- Ukesmål: «Påvirker kontinuitet, ukestatus og antall obligatoriske roller.»
- Ukeoppskrift: «Påvirker øktforslag og hva coachen regner som en normal uke.»
- Bonusøkt: «Brukes bare som frivillig motivasjonsmarkør.»
- Volum: «Vises i fremdrift og kan foreslås som ramme for neste blokk.»

## 5. Grensesnitt mot periodiserte planer

- Treningsprofilen er standardforslag ved opprettelse av en ny blokk, ikke en levende regel for en aktiv blokk.
- Når en blokk bekreftes, snapshotter den valgte roller, frekvens, volumetrikk og relevante profilverdier. Senere profilendringer endrer ikke aktive eller historiske planer.
- `roleAwareSuggestions` og blokkutkast skal lese samme normaliserte profil. Blokkens egne roller har prioritet etter bekreftelse.
- En profilkonflikt vises i opprettelsesforhåndsvisningen: «Profilen foreslår to kvalitetsøkter, men faktisk rytme har vært én. Velg utgangspunkt.»
- Avviksforslag kan forhåndsutfylle neste blokk, men kan aldri endre plan, challenge eller historisk ukesmål uten bekreftelse.

### Anbefalt sekvensering

Runde 4 (controller og persistence) kan bygges etter at snapshotsperren er løftet, fordi den kan lagre eksplisitte planverdier uavhengig av profil-UI. Samlingen av ukesmål og ukeoppskrift bør derimot gjennomføres **før runde 5**, slik at den mobil-første blokkflyten ikke bygges rundt dagens tvetydige «tre mål, fire roller»-modell. Avviksdeteksjon og nivåvalidering kan følge som en egen ren domene-/UI-runde før eller sammen med runde 5, men skal ikke utvide runde 4.

## 6. Akseptansekriterier for senere implementering

- Profilavvik foreslås først etter minst seks stabile datakvalifiserte uker og endrer ingenting automatisk.
- Skade-, comeback- og avlastningsuker kan ikke alene omskrive normaluken.
- Valgt coachnivå forklarer sin faktiske virkning og valideres mot eksisterende fitnessvurdering.
- Oppgradering skjer bare gjennom eksisterende bekreftelsesflyt fra `domain-fitness.js`.
- Ukesmål tre gir tre obligatoriske roller; en eventuell fjerde er tydelig frivillig bonus.
- Timer og kilometer oppgir om de bare måler fremdrift eller er kopiert inn som blokkramme.
- Aktiv og historisk blokk endres aldri når profilen redigeres.
