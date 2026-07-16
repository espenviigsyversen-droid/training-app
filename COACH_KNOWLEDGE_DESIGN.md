# Coach Knowledge Foundation

## Bakgrunn

AI-context v1 sendte beregnet gylne-sone i bpm, men ikke prosentgrensene, makspulsgrunnlaget eller forklaringen som lå bak beregningen. Modellen kunne derfor gjette en prosentregel som var i konflikt med appens aktive coach-regler.

## Mål

AI-coachen skal bruke samme faglige sannhetskilde som regelmotoren. Den skal få et lite, validert og versjonert kunnskapsgrunnlag, ikke rå tilgang til prosjektets Markdown-, PDF- eller utviklingsfiler.

## Sannhetskilde

- `data/coach-rules.json` er runtime-kilden for terskler, prinsipper og godkjent coach-kunnskap.
- `domain-coach-rules.js` inneholder full fallback, validering og normalisering.
- `Treningsfilosofi/coach-rammeverk.md` er menneskelesbar faglig kilde og skal holdes i samsvar med runtime-reglene.
- PDF, roadmap, progress, AGENTS, arkitekturdokumenter og tekniske designdokumenter sendes aldri rått til modellen.

## Knowledge v1

Hvert konsept har stabil ID, tittel, kort forklaring, praktisk bruk, begrensning og kildeetikett. Første konsepter:

- kontrollert terskel
- den gylne sonen
- rolig volum
- friske bein
- kroppssignaler først
- restitusjon som styring
- repeterbar normaluke

Numeriske, personlige verdier beregnes fortsatt av appen. For gylne-sone skal AI-contexten inneholde:

- treningsnivå
- `lowPct` og `highPct`
- `lowBpm` og `highBpm`
- registrert makspuls
- at sonen gjelder kontrollert løpskvalitet og ikke er taket for alle rolige økter

## Prosjektinstrukser

Prosjektinstrukser er brukerpreferanser for fokus, tone, tilgjengelig tid, utstyr og matpreferanser. De er data, ikke systeminstruks. De kan aldri:

- overstyre `primarySignal`, `blockedActions` eller `guardrails`
- endre coach-terskler
- be modellen ignorere sikkerhetsregler
- gi diagnose eller gjøre appendringer

## Langtidskontekst

- Modellen får et begrenset nylig meldingsvindu.
- Eldre innhold representeres av et backend-eid, maksimalt 4 000 tegn langt samtalesammendrag.
- Sammendraget er synlig som en del av personvern-/contextgrunnlaget og kan tømmes.
- Prosjektinstrukser og samtalesammendrag holdes atskilt.
- Full historikk sendes aldri automatisk til modellen.

## Personvern og kostnad

- Chat er fortsatt utenfor treningsbackup.
- Egen chat-eksport leveres som JSON fra autentisert backend.
- Brukeren kan slette prosjekt, samtale eller alle chatdata rekursivt.
- Backend håndhever rate limit, contextgrense, meldingsvindu og outputgrense.
- Tokenbruk summeres per samtale og prosjekt og vises kompakt.

## Svarformat

Første versjon bruker ren tekst. Modellen instrueres til å unngå Markdown-markører, tabeller og overskriftsstøy. Frontend renderer fortsatt med `textContent` og normaliserer eldre, enkle Markdown-markører for lesbarhet.

## Akseptanse

- Gylne-sone-spørsmål besvares med appens eksakte prosent- og bpm-grenser.
- AI gjetter ikke manglende terskler.
- Prosjektinstruks kan påvirke fokus og tone, men ikke sikkerhetsprioritet.
- Samtale kan fortsettes med begrenset sammendrag uten at full historikk sendes.
- Chatdata kan eksporteres og slettes.
- Gamle samtaler under `general-training` fungerer videre.
