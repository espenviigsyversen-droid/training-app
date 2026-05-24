# INTERVALS_DESIGN.md

Designnotat for strukturert intervallstotte i Treningsapp.

## Maal

Legg til valgfri strukturert intervallinformasjon paa oektmaler uten aa endre gamle maler, brukerflyt eller dagens fritekstfelt.

Fra v102 er første enkle UI-versjon bygget i øktmal-skjemaet. Fra v103 vises mer nyttige sammendrag og enkel intervallinnsikt siste 28 dager. Det finnes fortsatt ingen timer/stoppeklokke, ingen automatisk konvertering fra fritekst og ingen coach-logikk som krever feltet.

## Prinsipper

- Eksisterende `structure`-tekstfelt beholdes.
- Strukturert informasjon er valgfri.
- Gamle oektmaler uten strukturert felt skal fungere uendret.
- Foerste UI-versjon boer starte med en enkel blokkmodell, ikke timer/stoppeklokke.
- Modellen skal kunne testes som ren data uten DOM, Firebase eller `state`.
- Flere intervallblokker skal vaere mulig senere uten migrering.

## Foreslaatt felt paa oektmal

```js
structuredWorkout: {
  version: 1,
  blocks: [
    { type: 'warmup', durationSeconds: 600, note: 'Rolig oppvarming' },
    {
      type: 'interval',
      repetitions: 20,
      workSeconds: 45,
      restSeconds: 15,
      restType: 'float',
      intensity: 'threshold',
      note: 'Kontrollert terskel'
    },
    { type: 'cooldown', durationSeconds: 600, note: 'Rolig nedjogg' }
  ],
  note: ''
}
```

## Blokktyper v1

`warmup`

- `durationSeconds`
- `note` valgfri

`interval`

- `repetitions`
- `workSeconds`
- `restSeconds`
- `restType` valgfri, for eksempel `float`, `walk`, `standing`, `jog`
- `intensity` valgfri, for eksempel `threshold`, `vo2`, `easy`, `hard`
- `note` valgfri

`cooldown`

- `durationSeconds`
- `note` valgfri

## Bakoverkompatibilitet

En gammel mal kan se slik ut:

```js
{
  name: '45/15 terskel',
  structure: '15 min oppvarming, 20 x 45/15, 10 min nedjogg'
}
```

Den er fortsatt gyldig. `structuredWorkout` er ikke paakrevd.

En ny mal kan ha begge:

```js
{
  name: '45/15 terskel',
  structure: '15 min oppvarming, 20 x 45/15, 10 min nedjogg',
  structuredWorkout: { version: 1, blocks: [...] }
}
```

I v1 boer UI vise strukturert sammendrag hvis `structuredWorkout` finnes og er gyldig, ellers dagens `structure`-tekst.

## Rene hjelpefunksjoner i v102/v103

- `normalizeStructuredWorkout(value)`
- `buildStructuredWorkout(input)`
- `structuredWorkoutSummary(structuredWorkout)`
- `structuredWorkoutCompactText(structuredWorkout)`
- `structuredWorkoutBreakdown(structuredWorkout)`
- `structuredWorkoutWorkSeconds(structuredWorkout)`
- `structuredWorkoutRestSeconds(structuredWorkout)`
- `structuredWorkoutTotalSeconds(structuredWorkout)`
- `structuredIntervalInsights(completedItems, todayIso)`

Disse ligger nå i `domain-core.js`. Hvis intervallområdet vokser, kan de senere flyttes samlet til en egen domene-fil.

## Ikke i v1

- Ingen stoppeklokke eller aktiv timer.
- Ingen auto-generering av intervaller fra fritekst.
- Ingen tvungen migrering av gamle maler.
- Ingen coach-logikk som krever strukturert intervallfelt.
