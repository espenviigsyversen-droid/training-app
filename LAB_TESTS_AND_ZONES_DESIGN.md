# Testbaserte pulssoner og sonefordeling

Designgrunnlag for v173a-v174c. Dokumentet avgrenser løsningen til faktiske pulssoner, registrering av tid/prosent i sonene og et tydelig kildehierarki mot appens separate coach-begrep «gylne sone».

## Avgrensning

Brukeren trenger:

- daterte femsonesett fra labtest eller manuelt oppsett
- historikk når sonene endres
- én eksplisitt aktiv pulssoneprofil
- mulighet til å redigere alle grenser manuelt
- senere registrering av Garmins prosentfordeling per sone på en fullført økt

Appen skal ikke lagre eksempeløktene nederst i laboratorierapporten. De er veiledende økteksempler, ikke testresultater eller en treningsresept som appen skal modellere. Rå VO2max-, laktat- og testprotokolldata er også utenfor v173b etter siste avgrensning.

## Verifisert soneoppsett fra rapporten

Rapporten fra Idrettens testsenter, datert 1. august 2026, angir:

| Sone | Puls |
|---|---:|
| Sone 1 | 110-130 bpm |
| Sone 2 | 130-156 bpm |
| Sone 3 | 156-166 bpm |
| Sone 4 | 166-174 bpm |
| Sone 5 | 174-183 bpm |

Disse verdiene er brukerdata og hardkodes ikke som appens standard. De registreres i Setup og kan redigeres senere.

## Datamodell v1

```js
{
  id: 'heart-rate-zones_...',
  version: 1,
  name: 'Labtest Steinkjer august 2026',
  sourceType: 'lab', // lab | manual
  sourceName: 'Idrettens testsenter',
  testedAt: '2026-08-01',
  effectiveFrom: '2026-08-01',
  maxHeartRate: 183, // informativt, endrer ikke personprofil automatisk
  boundaryPolicy: 'lower_inclusive_upper_exclusive',
  zones: [
    { id: 'z1', label: 'Sone 1', minBpm: 110, maxBpm: 130 },
    { id: 'z2', label: 'Sone 2', minBpm: 130, maxBpm: 156 },
    { id: 'z3', label: 'Sone 3', minBpm: 156, maxBpm: 166 },
    { id: 'z4', label: 'Sone 4', minBpm: 166, maxBpm: 174 },
    { id: 'z5', label: 'Sone 5', minBpm: 174, maxBpm: 183 }
  ],
  active: true,
  note: '',
  createdAt: '...',
  updatedAt: '...'
}
```

Samlingen heter `heartRateZoneSets`. Bare ett oppsett kan være aktivt. Gamle oppsett beholdes som historikk og følger backup, import og lokal recovery.

## Grensepolicy

Rapporter viser ofte samme puls som øvre grense i én sone og nedre grense i neste. For deterministisk klassifisering gjelder:

- nedre grense er inkludert
- øvre grense er ekskludert
- øvre grense i siste sone er inkludert

Dermed tilhører 130 bpm sone 2 i eksemplet over. Visningen beholder likevel rapportens naturlige intervaller som `110-130` og `130-156`.

## UI og brukerflyt

Setup -> Person og form -> Pulssoner viser:

1. aktiv pulssoneprofil
2. skjema for navn, kilde, dato, maks puls, fem soner og notat
3. valg om profilen skal aktiveres
4. historikk med aktiver, rediger og slett

Manuell redigering bruker samme validerte modell som labtest. Sonene må være stigende og sammenhengende. Aktivering påvirker ikke profilens makspuls eller terskelpuls automatisk.

## Arkitektur

- `domain-heart-rate-zones.js`: ren normalisering, validering, aktiv profil, grenseklassifisering og formattering
- `heart-rate-zones-ui.js`: skjema og historikk med injiserte avhengigheter
- `app-state.js`: bakoverkompatibelt `heartRateZoneSets: []`
- `training-repository.js`: Firestore-samlingen inngår i load, backup/import, reset og recovery
- `app.js`: små state- og persistence-wrappers; ingen soneberegning

## Status og neste steg

- v173b: sonehistorikk, aktiv profil og manuell redigering - bygget
- v174a: prosent per sone fra Garmin på fullført økt, snapshot av brukt soneprofil og Garmin-inspirert detaljvisning - bygget
- v174b: bygget forklarbar etterlevelse mot planlagt intensjon, med RPE og kroppssignaler foran soneprosent
- v174c: bygget ett kanonisk kildehierarki der øktens snapshot går foran aktiv lab-/brukerprofil. Sone 1–5 og gylne sone vises og sendes til coach/AI som uttrykkelig separate begreper.
- v176: Garmin CSV-import beriker den etablerte økt- og sonemodellen

## Kildehierarki og begreper

1. Historiske og fullførte økter bruker soneprofil-snapshotet som ble lagret på økten.
2. Nye vurderinger bruker aktiv lab-/brukerdefinert femsoneprofil.
3. Hvis ingen femsoneprofil finnes, kan appen fortsatt vise prosent av registrert maks- og terskelpuls uten å late som den kjenner sone 1–5.
4. «Gylne sone» er Bakken-beregnet fra makspuls og treningsnivå. Den er et separat coach-begrep og er ikke synonym med sone 3 eller en annen labsone.

Samme kildehierarki brukes i fullføringsflyt, Logg, Innsikt og coach-/AI-kontekst. Ingen av disse flatene skal klassifisere den samme pulsen med ulike sonekilder.

## Testkrav

- gammel state uten soner normaliseres til tom liste
- ugyldige, usammenhengende soner avvises
- delte grenser klassifiseres i høyere sone
- bare én profil er aktiv
- manuell redigering bevarer id og historikk
- backup/import/recovery bevarer alle soneprofiler
- Garmin-prosent på 98-102 godtas som avrunding, mens større avvik avvises
- fullført økt bevarer brukt soneprofil som snapshot
- gammel økt uten sonefordeling åpnes uten feil
- eksempeløkter fra rapporten finnes ikke i datamodellen
