# Felles datagrunnlag og vurderingssikkerhet

Design- og akseptansekriterier for v176m.

## Bakgrunn

Innsikt viser flere vurderinger med ulike tidsvinduer og datakrav. Enkelte kort forklarer grunnlaget godt, mens andre viser en konklusjon uten samme synlige skille mellom datadekning og vurderingssikkerhet. Mer tekst i standardvisningen vil gjøre Innsikt tyngre, så forklaringen skal være konsekvent og progressiv.

## Mål

- skille datadekning fra vurderingssikkerhet
- vise periode, relevant utvalg, minimumskrav og sentrale mangler
- bruke samme kompakte UI-mønster på tvers av prioriterte vurderinger
- avstå fra høy sikkerhet når utvalget eller feltdekningen er for svak
- beregne alt lokalt uten nye lagrede felt

## Første scope

Den felles kontrakten brukes på:

- Form ved samme innsats
- Treningsnivå
- Intensitetsbalanse
- Soneetterlevelse
- Formutvikling for VO2max, HRV og hvilepuls

Volumgrafer, ukestatus, skadesignal og mål-score beholdes uendret i denne runden fordi de enten allerede viser eksplisitt periode/grunnlag eller trenger en egen senere vurdering.

## Kontrakt

`domain-insight-confidence.js` returnerer et normalisert evidensobjekt med:

- `period`: navn og valgfrie fra-/til-datoer
- `sample`: totalt, relevant, minimumskrav, enhet og relevantetikett
- `coverage`: prosent og nivå `high`, `medium` eller `low`
- `confidence`: `high`, `medium`, `low` eller `insufficient`
- `facts`: korte, etterprøvbare nøkkeltall
- `missing`: sentrale mangler eller utelatelsesårsaker
- `caveat`: én avgrenset tolkningsgrense

Datadekning sier hvor mye relevant informasjon som finnes. Vurderingssikkerhet sier hvor sterkt akkurat denne vurderingen kan tolkes. Høy dekning gir ikke automatisk høy sikkerhet.

## Arkitektur

- `domain-insight-confidence.js` eier ren normalisering og builders for de fem innsiktene.
- `insight-confidence-ui.js` renderer én progressiv og tilgjengelig disclosure.
- `training-insights-ui.js` gjenbruker disclosure for Form ved samme innsats.
- `app.js` bygger eksisterende innsikter, leverer data til evidensmodulen og kobler HTML-resultatet til eksisterende kort.
- Ingen evidensobjekter lagres i Firestore, lokal snapshot eller backup.

## UI/UX

Standardvisningen viser bare `Datagrunnlag` og en kompakt status som `Høy dekning · Middels sikkerhet`. Ved åpning vises periode, utvalg, dekning, relevante fakta, mangler og en kort tolkningsgrense.

Komponenten skal ikke be brukeren trene mer eller hardere for å forbedre en score. Manglende data beskrives nøytralt.

## Sikkerhet

- kroppssignal og smerte skjules aldri bak en høy datadekning
- måletrender er signaler, ikke medisinsk fasit
- soneprosent vurderes under RPE og kroppssignal
- Form ved samme innsats forblir en lokal responsanalyse, ikke generell formscore
- treningsnivå kan ikke oppgraderes av én enkelt måling

## Tester og akseptansekriterier

- datadekning og vurderingssikkerhet beregnes separat
- for lite relevant utvalg gir `insufficient`
- alle fem prioriterte flater bruker samme renderer
- Form ved samme innsats beholder miljø-, GAP-, puls- og varighetsforklaring
- ingen state eller input muteres
- nye runtimefiler ligger i PWA app shell og oppdateringssjekk
- desktop og smal mobilbredde har ingen horisontal overflow
- PWA-versjon og cache er `v176m`
