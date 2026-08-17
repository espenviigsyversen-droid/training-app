# Eksplisitt oppdatering av malsnapshot

## Bakgrunn og mål

Planlagte og fullførte økter fryser malmetadata for å beskytte historikken mot senere malendringer. Denne låsen beholdes. v176s innfører én eksplisitt ventil: brukeren kan velge «Oppdater fra mal», se en feltvis diff og bekrefte én økt om gangen.

Ingen snapshot oppdateres automatisk. Det finnes ingen skjult bulkoperasjon.

## Kontrakt

- Kilden er en konkret, eksisterende øktmal som brukeren velger.
- Forhåndsvisningen viser gammel og ny verdi for mal, navn, aktivitetstype, intensitet, rolle, formål, belastning, struktur, lenke, strukturert intervall og øvelsesplan.
- Et bekreftet snapshot får `roleClassificationVersion: 2`, `snapshotUpdatedAt` og `snapshotUpdateSource: "manual_template_refresh"`.
- Planlagte økter får `metadataRevision` med kilde, tidspunkt, mal og rollemodell. En eksplisitt faktakorrigering setter ikke `userModified`; bare en reell overstyring av planens intensjon fredes.
- Fullførte økter får bare nytt `templateId`, `templateSnapshot` og revisjonsmetadata. Dato, målinger, varighet, distanse, puls, RPE, kroppssignal og notater bevares byte-for-byte av domenefunksjonen.
- Oppdateringen vises i øktdetaljene med rolle og dato.
- Avbrytelse eller lagringsfeil etterlater originalen uendret.

## Konsekvens for historikk og langtursgrunnlag

Et uttrykkelig oppdatert historisk snapshot er en bevisst semantisk datakorrigering. Det skal derfor brukes av rolledekning, ukeplan, avviksdeteksjon og det fremtidige referansegrunnlaget for relativ langtursgrense. Gamle snapshots endres aldri uten handlingen. Bekreftelsesdialogen varsler om denne konsekvensen.

## Datakvalitet og konkrete funn

Read-only kontroll av backup 17. august 2026:

- 105 fullførte økter totalt.
- Én økt mangler `templateSnapshot`: 5. mai 2026, «Intervall 6x6 Terskel».
- Ingen legacy-økt uten snapshot peker på Easy Run eller Hiking, som er malene som nylig er endret.

Hiking er en rolig gåtur og bør ha rollen `recovery` («Restitusjon»), ikke `x_workout`. Selve brukerdatarettingen gjøres eksplisitt i UI; den hardkodes ikke som migrering.

Navn som åpenbart motsier aktivitetstype bør senere kunne gi en ikke-blokkerende advarsel ved logging/import. Dette er backlog, ikke scope for v176s.

## UX, mobil først

1. Brukeren åpner en planlagt eller fullført økt og velger «Oppdater fra mal».
2. En egen modal viser økten, valgbar kildemal og feltvis gammel/ny verdi.
3. Teksten forklarer at fullførte målinger ikke endres, men at rollebasert historikk kan gjøre det.
4. «Bekreft oppdatering» er deaktivert når ingen felt er endret.
5. Etter lagring vises oppdateringsdato i detaljene.

Tomtilstand: «Ingen maler er tilgjengelige. Opprett eller gjenopprett en øktmal først.»

Feiltilstand: «Kunne ikke oppdatere malsnapshot. Økten er ikke endret.»

## Tester og akseptanse

- Diffen viser bare faktiske metadataendringer og inkluderer malreferansen.
- Oppdatering av en fullført økt bevarer alle registrerte felt.
- Planlagt økt får sporbar `metadataRevision` uten å bli permanent fredet. Rolleavvik mot en senere planslot skal likevel vises som konflikt.
- Snapshot versjoneres til v2 og tidsstemples.
- Samme mal/samme metadata gir tom diff og deaktivert bekreftelse.
- Rolle og oppdateringsdato vises i fullført detaljmodal.
- Begge økttyper kan oppdateres fra mobil.

## Implementeringsstatus før runde 4

v176s1 retter semantikken: snapshot-oppdatering er `metadataRevision`, datoflytting er `scheduleAdjustment`, og bare endret treningsintensjon setter reverserbart `userModified`. Fullføring kopierer alle sporene og `planRef` til historikken.

