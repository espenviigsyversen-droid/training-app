# Strukturert styrke v1

## Formål

v172a-b gjør det mulig å opprette et gjenbrukbart øvelsesbibliotek og bruke øvelsene i strukturerte styrkeøkter. Løsningen skal støtte skadeforebyggende løpsstyrke uten å endre eksisterende fritekstmaler eller strukturert intervall.

## Datamodell

Øvelser lagres som egne dokumenter i brukerens `exercises`-samling:

```js
{
  id: "exercise-id",
  name: "Ettbeins tåhev",
  description: "Rolig opp og kontrollert ned.",
  muscleGroups: ["Legg", "Fot/ankel"],
  purposeTags: ["Løpsstyrke", "Skadeforebygging"],
  equipment: "Trappetrinn",
  mediaUrl: "https://...",
  createdAt: "ISO-dato",
  updatedAt: "ISO-dato"
}
```

En øktmal kan valgfritt ha `exercisePlan`:

```js
{
  version: 1,
  kind: "strength",
  sourceUrl: "https://...",
  notes: "",
  blocks: [{
    type: "main",
    title: "Hoveddel",
    exercises: [{
      exerciseId: "exercise-id",
      exerciseSnapshot: {
        id: "exercise-id",
        name: "Ettbeins tåhev",
        description: "...",
        muscleGroups: ["Legg", "Fot/ankel"],
        purposeTags: ["Løpsstyrke"],
        equipment: "Trappetrinn",
        mediaUrl: "https://..."
      },
      sets: 3,
      reps: "10 per side",
      durationSeconds: 0,
      restSeconds: 60,
      loadText: "Kroppsvekt",
      note: ""
    }]
  }]
}
```

## Guardrails

- `exercisePlan` er valgfritt og normaliseres til `null` når det mangler eller er ugyldig.
- Gamle øktmaler fungerer uendret.
- Eksisterende `structure` og `structuredWorkout` beholdes.
- Hver øktmal lagrer et snapshot av øvelsen. En planlagt eller fullført økt beholder derfor navn og instruksjon selv om bibliotekøvelsen senere endres eller slettes.
- Bare gyldige `https://`-lenker lagres.
- v1 bruker én hovedblokk. Oppvarming og nedvarming legges til i v173 uten å endre v1-data.
- Ren normalisering og formattering ligger i `domain-exercises.js`. Firestore, state og DOM håndteres av eksisterende app-lag og avgrensede UI-moduler.

