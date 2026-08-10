# Innsikt og Mål - informasjonsarkitektur

Design- og akseptansekriterier for v176i.

## Bakgrunn

Innsikt og Mål har fått flere verdifulle analyser over tid, men de vises som en lang, flat rekke av likeverdige kort. På mobil må brukeren derfor scrolle gjennom mye historikk og metodeforklaring før neste relevante status eller handling blir synlig.

v176i endrer ikke domenedata, score, coachregler eller Firestore. Runden organiserer eksisterende innhold etter brukeroppgave og bruker progressiv visning for sekundære detaljer.

## Mål

- status og neste steg skal være synlig uten å åpne et panel
- brukeren skal kunne hoppe direkte til et hovedområde
- historikk, metode og forklaringer skal være tilgjengelige uten å dominere siden
- kroppssignaler, skadesignal og belastningsvarsler skal aldri skjules som standard
- åpne/lukkede paneler er midlertidig UI-state og skal ikke lagres
- `app.js` skal bare initialisere og oppdatere den avgrensede UI-modulen

## Informasjonsarkitektur

### Innsikt

1. **Status** - denne uken, ukestatus, kroppssignaler, skadesignal og intensitetsbalanse. Alltid åpen.
2. **Kontinuitet** - kontinuitet, siste fire uker, Bakken-mønstre, intervaller og soneetterlevelse.
3. **Utvikling** - treningsnivå, treningsmengde og formmålinger.
4. **Året** - årsoppsummering, høydepunkter og milepæler.

### Mål

1. **Oversikt** - målstatus, score, neste smarte steg og testvurdering. Alltid åpen.
2. **Mål-løp** - testgrunnlag og konkurranseplan.
3. **PB** - distanser med resultat først; tomme distanser vises på eksplisitt valg.
4. **Challenges** - aktive challenges først; tidligere challenges ligger i sammenleggbar historikk.

## Lokal navigasjon

Hver fane har en kompakt, klebrig knappelinje. Et valg:

- åpner målområdet når det er sammenleggbart
- flytter visningen til riktig seksjon
- markerer valgt område med `aria-selected`
- skjules dersom hele området mangler data

Seksjonsnavigasjonen erstatter ikke bunnnavigasjonen og oppretter ingen ny app-rute.

## Progressiv visning

Følgende kan skjules bak korte forklaringsvalg:

- metode og datakilde
- hva en graf eller challenge betyr
- detaljerte delmål
- tomme PB-distanser
- fullførte eller utløpte challenges

Følgende skal være synlig:

- aktuell status og konklusjon
- neste anbefalte steg
- testvurdering som sier at brukeren bør vente
- kroppssignal og skadesignal
- varsler om intensitets- eller belastningsbalanse

## Arkitektur

- `workspace-sections-ui.js` eier DOM-gruppering, lokal navigasjon, disclosure-state og progressive hjelpefelt.
- Eksisterende renderere beholder sine DOM-id-er og domenekontrakter.
- `app.js` initialiserer modulen og kaller `refresh()` etter sammensatt rendering.
- `styles.css` eier presentasjon på mobil og desktop.
- Ingen data lagres eller migreres.

## Tilgjengelighet

- sammenleggbare hovedområder bruker native `details` og `summary`
- lokal navigasjon bruker knapper med `aria-controls` og `aria-selected`
- skjulte områder åpnes før scroll
- sikkerhetsinnhold ligger i et ikke-sammenleggbart prioritetsområde
- eksisterende tastaturhandlinger for PB og modaler bevares

## Tester og akseptansekriterier

- alle tidligere DOM-id-er finnes nøyaktig én gang
- Status og Målstatus er synlige uten brukerhandling
- lokal navigasjon kan åpne hvert tilgjengelig område
- dynamisk skjulte Mål-løp/PB-områder gir ikke tom navigasjon
- PB viser distanser med resultat som standard
- tidligere challenges er sammenleggbare
- metodeforklaringer bruker progressiv visning
- v176i-modulen ligger i PWA app shell og network-first-listen
- ingen domene-, Firestore- eller backupkontrakt endres
