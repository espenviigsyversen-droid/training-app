# AI Web Search Design

Design og sikkerhetskontrakt for v161 kontrollert webtilgang i AI-chatten.

## Formål

Nettsøk skal gi AI-coachen oppdatert, kildebelagt informasjon når brukeren eksplisitt trenger det, blant annet om generell mat og ernæring. Nettsøk skal utdype appens coach-vurdering, aldri bli en alternativ coach eller en skrivekanal til appdata.

## Brukerflyt

- `Søk på nett` er et frivillig valg per melding og er av som standard.
- Første nettsøk krever et eget informert samtykke.
- Svaret merkes med `Nettsøk brukt` når verktøyet faktisk ble brukt.
- Siteringer og inntil åtte sanitiserte kilder vises klikkbart sammen med AI-svaret.
- Dersom web ikke brukes eller feiler, skal modellen svare konservativt fra appkontekst og kuratert coach-kunnskap uten å dikte kilder.

## Arkitektur

```text
Chat UI (kun boolsk opt-in)
  -> Firebase Callable Function + Auth
  -> kontekstvalidering, rate limit og serverregler
  -> OpenAI Responses API med valgfritt web_search
  -> sanitert svar, siteringer og kilder
  -> backend-eid Firestore-samtale
```

Frontend får aldri søkenøkkel, leverandørkonfigurasjon eller rå søkeresultater. OpenAI-nøkkelen forblir kryptert og server-side.

## OpenAI-kontrakt

Når `webSearchEnabled === true` brukes `web_search`, `tool_choice: auto`, `search_context_size: low` og `include: [web_search_call.action.sources]`. Når valget er av, sendes ingen `tools` i requesten. `store: false`, outputgrense, timeout, pseudonym sikkerhetsidentifikator og eksisterende rate limit beholdes.

## Tillit og sikkerhet

Prioritetsrekkefølge:

1. systeminstruks og appens sikkerhetsregler
2. `coachDecision`, `blockedActions` og `guardrails`
3. validert appkontekst og kuratert coach-kunnskap
4. prosjektpreferanser og samtalehistorikk
5. eksterne nettsider og søkeresultater

Webinnhold er ubetrodd data. Instruksjoner på nettsider skal ignoreres. Eksterne påstander kan ikke overstyre skadesignal, dagsform, comeback, volumvern eller blokkert hardtrening.

Ernæringssvar skal være generell trenings- og kostinformasjon. Ved allergi, sykdom, spiseforstyrrelse, medikamentbruk eller andre høyrisikoforhold skal AI-en oppgi begrensningen og anbefale relevant fagperson. Den skal ikke diagnostisere eller gi individuell medisinsk behandling.

## Personvern og lagring

- Bare brukerens chatspørsmål og den eksisterende minimerte AI-contexten sendes til OpenAI.
- UID, e-post, API-nøkkel, backup, full historikk og rå Firestore-metadata sendes ikke.
- Firestore lagrer bare svartekst, `webUsed`, sanitiserte sitater og maksimalt åtte `http`/`https`-kilder.
- Rå søkeresultater, søkehandlinger og komplette nettsidetekster lagres ikke.
- Logger inneholder kun boolsk webvalg, om verktøyet ble brukt og antall kilder, aldri spørsmål eller kildetekst.

## Kostnad og robusthet

- Nettsøk er eksplisitt opt-in, ikke automatisk standard.
- Lavt søkekontekstbudsjett begrenser kostnad og svartid.
- Maks åtte kilder returneres og lagres.
- Eksisterende korttids- og dagsrate gjelder også nettsøk.
- Eksisterende timeout og ett kontrollert retry-forsøk beholdes.
- Webfeil skal ikke endre appdata eller coach-regler.

## Akseptanse

- Vanlig chat fungerer uten verktøy som før.
- Nettsøk kan bare aktiveres eksplisitt per melding.
- Brukte kilder er synlige, klikkbare og protokollvaliderte.
- Kilder synkroniseres med samtalen på mobil og PC.
- Webinnhold kan ikke overstyre appens sikkerhetsprioritet.
- Ingen ny tilgang til treningsdata eller skrivehandlinger introduseres.
