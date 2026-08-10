# Aktivitetsmiljø og prestasjonsinnsikt

Design- og datakontrakt for v176g og senere prestasjonsinnsikt.

## Bakgrunn

Garmin-importen bevarer detaljert aktivitetstype, men appens kanoniske hovedtype slår for eksempel `Running` og `Treadmill Running` sammen til `Løping`. Det gir riktig volumgruppering, men skjuler en viktig forskjell når økten leses og senere sammenlignes.

Den rikere treningshistorikken gjør det samtidig mulig å lage motiverende, forklarbar årsinnsikt uten AI eller nye backend-kall.

## Mål

v176g skal:

- innføre et kildeuavhengig, valgfritt `activitySetting` på fullførte økter
- vise aktivitetsmiljø naturlig i Logg uten å merke datakilden
- avlede feltet bakoverkompatibelt fra allerede lagret importdata
- gi en objektiv `Året så langt`-oppsummering med milepæler og personlige høydepunkter
- holde beregning og rendering utenfor `app.js`

## Datamodell

`completed.activitySetting` kan ha følgende normaliserte verdier:

| Verdi | Norsk visning | Betydning |
|---|---|---|
| `outdoor` | Utendørs | Utendørs aktivitet |
| `treadmill` | Tredemølle | Løping eller gange på tredemølle |
| `indoor` | Innendørs | Annen innendørs aktivitet |
| `pool` | Basseng | Bassengsvømming |
| tom verdi | Ikke angitt | Ukjent eller ikke relevant |

Feltet er kildeuavhengig. Garmin-adapteren kan fylle det, men manuell registrering og senere adaptere bruker samme felt.

Ved lasting brukes følgende rekkefølge:

1. eksplisitt, gyldig `completed.activitySetting`
2. avledning fra `externalData.garmin.activityCode`
3. `treadmill` når en eldre økt har positiv `treadmillInclinePercent`
4. tom verdi

Bakoverkompatibel avledning skal ikke kreve en Firestore-migrering eller ny import. Når en eldre økt senere redigeres, lagres det normaliserte feltet sammen med økten.

## Importpolicy

Garmin-aktivitetene avledes slik:

- `running`, `walking`, `hiking`, `cycling`, `cross_country_skiing`, `resort_skiing` -> `outdoor`
- `treadmill_running` -> `treadmill`
- `indoor_cycling` -> `indoor`
- `pool_swim` -> `pool`
- ukjent aktivitet -> tom verdi

Eksisterende manuell verdi beholdes ved beriking. En konflikt kan bare overskrives etter eksplisitt valg i importveiviseren.

## Året så langt

Ren beregning ligger i `domain-performance-insights.js` og bruker bare normaliserte fullførte økter til og med valgt dato.

Oppsummeringen skal inneholde:

- totalt antall økter
- samlet treningstid
- kilometer for primæraktiviteten `Løping`
- antall aktive kalenderuker
- høydepunkter som lengste løpeøkt, sterkeste løpemåned og lengste registrerte økt
- oppnådde milepæler for kilometer, økter og aktive uker
- ett forklarbart neste milepælsmål
- fordeling mellom utendørs- og tredemølleløping når data finnes

Milepælene er motivasjon, ikke treningsråd. De skal aldri presse frem mer belastning og skal ikke overstyre dagsform eller skadesignal.

## Arkitektur

- `domain-activity.js`: normalisering, avledning og etiketter for `activitySetting`
- `domain-performance-insights.js`: ren, deterministisk årsberegning
- `training-insights-ui.js`: sikker rendering av prestasjonsinnsikt
- `app-state.js`: bakoverkompatibel normalisering av øktfeltet
- `garmin-csv-import.js` og `training-import-controller.js`: kontrollert import og merge
- `workout-completion-ui.js`: manuelt valg og redigering
- `workout-history-ui.js`: naturlig visning i liste og detalj
- `app.js`: leverer state og kobler renderer
- `domain-volume-trends.js`: beholder eneansvar for navigerbare uke-, måneds- og årsvinduer

## UI/UX

- Logg viser `Utendørs`, `Tredemølle`, `Innendørs` eller `Basseng` som vanlig øktmetadata.
- Datakilden omtales ikke.
- `Året så langt` plasseres tidlig i Innsikt og bruker kompakte nøkkeltall, milepæler og høyst tre høydepunkter.
- Tom historikk gir en rolig tomtilstand uten falske prestasjonspåstander.
- Mobilvisningen er utgangspunktet; desktop kan bruke flere kolonner.

## Sikkerhet og personvern

- Ingen nye backend-kall, AI-kall eller nettverkstilganger.
- Ingen rå CSV-rader eller nye identifikatorer lagres.
- All HTML-generering bruker injisert escaping.
- Beregningen ignorerer ugyldige datoer og fremtidige økter.

## Senere scope

Følgende tas i egne runder:

1. `Form ved samme innsats` for sammenlignbare rolige løpeøkter.
2. Synlig datagrunnlag, datadekning og vurderingssikkerhet.

Disse skal gjenbruke `activitySetting`, men skal ikke bygges inn i v176g.

## Tester og akseptansekriterier

- gamle økter uten felt normaliseres trygt
- eksplisitt verdi vinner over avledet importverdi
- løping og tredemølleløping forblir samme hovedaktivitet, men får ulikt miljø
- Garmin-beriking bevarer manuelle verdier uten eksplisitt overskriving
- årsberegningen ekskluderer andre år og fremtidige økter
- milepæler og høydepunkter er deterministiske og tåler manglende varighet/distanse
- ny UI- og domenekode er egne runtime-moduler og ligger i PWA-cache
- `app.js` inneholder bare små integrasjonskoblinger
