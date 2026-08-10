# Form ved samme innsats

Design- og akseptansekriterier for v176l, presisert i v176l2 og v176l3.

## Bakgrunn

Garmin-importen har gitt historiske løpeøkter et rikere datagrunnlag med aktivitetsmiljø, puls, fart, GAP, varighet, distanse og høyde. En enkelt økt sier likevel lite om form. v176l sammenligner derfor grupper av rolige løpeøkter som er tilstrekkelig like, uten å gjøre resultatet til en generell formscore.

## Mål

- vise om farten ved omtrent samme pulsrespons er bedre, stabil eller svakere
- skille utendørs og tredemølle, slik at ulike miljøer aldri blandes
- prioritere GAP utendørs og ordinær pace på tredemølle
- vise periode, antall økter og lokal vurderingssikkerhet sammen med konklusjonen
- avstå fra konklusjon når datagrunnlaget ikke er sammenlignbart

## Scope

Kun fullførte løpeøkter som appens felles intensitetsklassifisering vurderer som rolig/base/restitusjon kan inngå. Økten må ha kjent aktivitetsmiljø, distanse, varighet, snittpuls og gyldig pace. Økter med registrert smerte eller aktiv kroppstilpasning utelates. Et utfylt kroppsområde eller fritekstnotat uten smerte eller tilpasning er ikke alene et skadesignal og skal ikke utelate økten.

Planlagt øktintensjon og struktur avgjør om hensikten er rolig eller kvalitet. Garmin-treningseffekt er observert belastning og skal ikke alene gjøre en planlagt rolig økt til kvalitetsøkt. RPE 6 kan inngå når resten av intensjons- og sikkerhetsgrunnlaget er rolig. RPE 7 eller høyere uten kvalitetsintensjon klassifiseres fortsatt som hard risiko og utelates.

Utendørsøkter bruker Garmin GAP når det finnes. Dersom GAP mangler, brukes ordinær pace bare for økter med begrenset stigning per kilometer. GAP og ordinær pace blandes aldri i samme sammenligning. Tredemølle bruker ordinær pace.

## Arkitektur

- `domain-performance-insights.js` eier filtrering, gruppering, medianer, sammenlignbarhet, konklusjon og vurderingssikkerhet.
- Den kanoniske intensitetsklassifiseringen gjenbrukes fra `domain-core.js`; featuret skal ikke vedlikeholde en egen navnebasert parallellklassifisering.
- `training-insights-ui.js` renderer resultat, tomtilstand og datagrunnlag.
- `app.js` leverer normalisert state og kobler domenefunksjonen til rendereren.
- `workspace-sections-ui.js` plasserer kortet i området Utvikling.
- Ingen beregnet innsikt lagres i Firestore eller backup.

## Beregningsmodell

For hvert aktivitetsmiljø sorteres kvalifiserte økter kronologisk. De nyeste og foregående øktene deles i to like grupper på minst fire og høyst seks økter.

En konklusjon krever:

- minst fire økter i hver periode
- forskjell i median snittpuls på høyst 5 bpm
- sammenlignbar median varighet
- samme pacekilde i begge perioder

Median pace sammenlignes. Minst 2 prosent raskere gir `bedre respons`, minst 2 prosent saktere gir `svakere respons`, ellers `stabil respons`. Dette beskriver bare disse sammenlignbare rolige øktene.

Vurderingssikkerheten er høy ved minst seks økter i hver gruppe og høyst 3 bpm pulsforskjell. Ellers er den middels. Lav sikkerhet gir ingen formkonklusjon.

## Sikkerhet og produktgrenser

- kroppssignal og skadesignal trumfer ønsket om å vise fremgang
- resultatet gir ingen anbefaling om å øke belastning
- svakere respons forklares som et signal som kan påvirkes av blant annet varme, bakker, underlag og dagsform
- manglende data vises som manglende grunnlag, ikke som null eller dårlig form
- tredemølle og utendørs sammenlignes aldri mot hverandre

## UI/UX

Kortet ligger først i Utvikling og viser maksimalt én kompakt sammenligning per aktivitetsmiljø. Konklusjon, paceendring og pulsgrunnlag er synlig. Periode, antall økter og metode ligger i et progressivt `Datagrunnlag`-felt.

Tomtilstanden skal fortelle hva som mangler uten å be brukeren trene mer eller hardere. Den viser antall vurderte løpeøkter, antall kandidater som oppfyller grunnkravene, både kandidat- og sammenlignbart antall per aktivitetsmiljø og summerte utelatelsesårsaker. Hver økt teller i høyst én utelatelsesårsak, slik at tallene er lesbare og etterprøvbare.

## Tester og akseptansekriterier

- bedre, stabil og svakere respons klassifiseres ved tersklene
- utendørs og tredemølle holdes separat
- GAP og vanlig pace blandes ikke
- hardøkt, kroppssignal, ukjent miljø og manglende puls utelates
- kanonisk rolig intensjon fra øktmalen godtas selv om øktnavnet ikke inneholder et bestemt nøkkelord
- kroppsområde eller notat uten smerte/tilpasning utelater ikke økten
- tomtilstanden forklarer kandidatgrunnlag og utelatelsesårsaker per miljø
- Garmin `Tempo`/`High Aerobic` overstyrer ikke en eksplisitt rolig øktintensjon
- RPE 6 kan inngå, mens RPE 7+ uten kvalitetsintensjon fortsatt utelates
- miljøstatus skiller mellom kandidater og økter som passer valgt GAP-/pacegrunnlag
- stor pulsforskjell eller for få økter gir ingen konklusjon
- state og Firestore-data muteres ikke
- domenelogikken testes direkte fra produksjonsfilen
- mobil og desktop viser kortet uten horisontal overflow
- PWA-versjon og cache er `v176l3`
