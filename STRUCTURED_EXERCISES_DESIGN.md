# Gjenbrukbare øvelsesblokker v1

## Formål

v172a-b gjør det mulig å opprette et gjenbrukbart øvelsesbibliotek og bruke øvelsene i strukturerte styrkeøkter. v175 gjenbruker nøyaktig samme øvelsesresept og snapshot til valgfri oppvarming og nedtrapping på alle økttyper, uten å endre eksisterende fritekstmaler eller strukturert intervall.

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

En øktmal kan valgfritt ha `exercisePlan`. Gamle planer kan fortsatt bestå av bare `main`. Nye planer kan ha `warmup`, `main` og `cooldown` i denne rekkefølgen:

```js
{
  version: 1,
  kind: "exercise-blocks",
  sourceUrl: "https://...",
  notes: "",
  blocks: [{
    type: "warmup",
    title: "Oppvarming",
    exercises: [/* samme resept og snapshot som under */]
  }, {
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
  }, {
    type: "cooldown",
    title: "Nedtrapping",
    exercises: [/* samme resept og snapshot som over */]
  }]
}
```

## Guardrails

- `exercisePlan` er valgfritt og normaliseres til `null` når det mangler eller er ugyldig.
- Gamle øktmaler fungerer uendret.
- Eksisterende `structure` og `structuredWorkout` beholdes.
- Hver øktmal lagrer et snapshot av øvelsen. En planlagt eller fullført økt beholder derfor navn og instruksjon selv om bibliotekøvelsen senere endres eller slettes.
- Bare gyldige `https://`-lenker lagres.
- Blokktypene er avgrenset til `warmup`, `main` og `cooldown`. Ukjente gamle typer normaliseres trygt til `main`.
- En løpe- eller kondisjonsmal kan ha bare oppvarming og/eller nedtrapping. En styrkemal kan i tillegg ha hoveddel.
- Planlagte økter lagrer et snapshot av malen. Fullføring arver dette snapshotet, slik at senere malendringer ikke omskriver planlagt eller utført øvelsesinnhold.
- Ren normalisering og formattering ligger i `domain-exercises.js`. Firestore, state og DOM håndteres av eksisterende app-lag og avgrensede UI-moduler.
