# AI Chat Projects - design og utviklingsplan

**Status:** v154 er deployet og ende-til-ende-verifisert. v155-sikkerhetsgrunnlaget er implementert og emulatortestet lokalt; v156-v158 gjenstår.  
**Foreslått spor:** v154-v158.  
**Forutsetning:** Sikkerhets- og deployporten i `FIREBASE_AI_BACKEND_DEPLOY.md` skal være bestått.

## 1. Produktmål

AI-chatten skal være en lett tilgjengelig samtaleflate for spørsmål om blant annet:

- dagens råd og planlagte økter
- forklaring og tilpasning av økter
- forslag til kommende trening
- mål-løp, progresjon og testløp
- generell mat, væske og restitusjon før og etter trening
- tidligere diskusjoner i samme samtale eller prosjekt

Chatten skal ligge som egen destinasjon i bunnnavigasjonen etter `Mål`. Brukeren skal kunne skrive egne spørsmål, ikke bare velge forhåndsdefinerte forslag.

AI-en er fortsatt rådgivende og read-only. Forslag skal ikke automatisk endre plan, logg, mål eller andre treningsdata.

## 2. Ufravikelige sikkerhetsgrenser

- `coachDecision`, `blockedActions` og `guardrails` har høyere prioritet enn prosjektinstruksjoner og brukerønsker.
- Prosjektinstruksjoner behandles som brukerdata, ikke som systeminstruksjoner.
- Skade, rød/gul dagsform, comeback og volum-ramp kan blokkere hard kvalitet.
- Fryskort skal aldri omtales som trening.
- Ernæringsråd skal være generelle og praktiske, ikke medisinsk behandling eller individuell klinisk ernæring.
- Chatten skal uttrykke usikkerhet når datagrunnlaget er svakt.
- Ingen OpenAI-nøkkel, uid, e-post eller rå Firestore-metadata sendes som chat-context.
- Ingen web-søk eller skriveverktøy introduseres i dette sporet.

## 3. Navigasjon og status

### Dynamisk tilkoblingsstatus

Setup skal skille mellom to ulike forhold:

- `Server-side`: nøytral sikkerhetsinformasjon om hvor nøkkelen håndteres.
- `Tilkoblet`: grønn, dynamisk status som bare vises når Firebase-backend bekrefter konfigurert nøkkel og en eksplisitt tilkoblingstest lykkes.

Feiltilstander skal være tydelige: `Ikke konfigurert`, `Kunne ikke nå backend`, `Nøkkel avvist` og `OpenAI midlertidig utilgjengelig`.

### Egen Chat-fane

Bunnnavigasjonen får seks destinasjoner:

1. Hjem
2. Kalender
3. Logg
4. Innsikt
5. Mål
6. Chat

Mobilbredden må verifiseres særskilt. Ikon og kort label skal ha stabile dimensjoner uten horisontal scrolling eller tekstkollisjon.

## 4. Foreslått Firestore-modell

Chatdata holdes adskilt fra treningsdata og normal backup/import.

```text
users/{uid}/aiProjects/{projectId}
  title
  instructions
  status              // active | archived
  createdAt
  updatedAt
  lastConversationAt

users/{uid}/aiProjects/{projectId}/conversations/{conversationId}
  title
  status              // active | archived
  summary
  messageCount
  createdAt
  updatedAt
  lastMessageAt

users/{uid}/aiProjects/{projectId}/conversations/{conversationId}/messages/{messageId}
  role                // user | assistant
  content
  createdAt
  requestId
  modelLabel
  usage               // begrenset teknisk metadata
```

Regler:

- Dokument-ID-er genereres av backend eller Firestore, aldri fra rå meldingstekst.
- Meldinger lagrer ikke API-nøkkel eller full AI-context.
- Teknisk usage lagres bare når det gir reell verdi for feilsøking/kostnad.
- Chatdata tas ikke inn i eksisterende treningsbackup før separat eksport-/personverndesign er avklart.
- Slett prosjekt/samtale skal være en rekursiv backendoperasjon med bekreftelse.
- Brukeren skal kunne arkivere uten å slette.

## 5. Samtalekontekst og langtidsminne

Hele historikken skal ikke sendes til OpenAI ved hvert spørsmål. Serveren bygger en begrenset pakke:

1. serverstyrt systeminstruks og sikkerhetsregler
2. dagens `AI Coach Context`
3. prosjektinstruksjoner som lavere prioritert brukerpreferanse
4. kontrollert samtalesammendrag
5. de siste relevante meldingene, for eksempel 8-12
6. brukerens nye spørsmål

Når en samtale blir lang, oppdateres et kort sammendrag. Råmeldinger beholdes i Firestore for historikk og enhetssynk, men eldre råmeldinger sendes ikke automatisk til modellen.

Langtidsminne på tvers av samtaler skal ikke bygges implisitt i første versjon. Senere kan brukeren eksplisitt lagre eller slette et begrenset minne, for eksempel mål, preferanser eller noe som ikke bør foreslås.

## 6. Prosjekter og egne instrukser

Et prosjekt grupperer relaterte samtaler. Eksempler:

- `Halv-Birken`
- `Mat og restitusjon`
- `Generell trening`
- `Styrke og alternativ trening`

Prosjektet kan ha egne instrukser, for eksempel:

- ønsket svarlengde og tone
- hvilke mål eller treningsformer samtalene skal prioritere
- praktiske preferanser, tilgjengelig tid og utstyr
- matpreferanser eller matvarer brukeren ikke ønsker forslag om

Instruksene kan ikke slå av sikkerhetsregler, kreve medisinsk diagnose eller tillate handlinger som `blockedActions` forbyr.

## 7. Utviklingsrunder

### v154 - AI-status og egen Chat-fane

- Dynamisk grønn `Tilkoblet`-tag basert på backendstatus/test.
- Gjør `Server-side` til nøytral sikkerhetsmerking.
- Legg Chat etter Mål i bunnnavigasjonen.
- Behold fritekstfelt, forslag, context-visning og read-only adferd.
- Verifiser seks faner på liten mobil, desktop og PWA.

Status: Ferdig. Egen Chat-fane, dynamisk `Tilkoblet`-status og ekte svar basert på appdata er verifisert 12. juli 2026.

### v155 - Chat persistence design og sikkerhetsgrunnlag

- Lås Firestore-modell, normalisering, Rules og callable-kontrakter.
- Avklar retention, arkiv, rekursiv sletting og separat eksport.
- Lag emulator-/regeltester før vedvarende meldinger aktiveres.
- Ingen stor UI-utvidelse i denne runden.

Status: Implementert og emulatortestet lokalt. Vedvarende historikk er fortsatt ikke aktivert i klienten.

Låste beslutninger i v155:

- `schemaVersion: 1` brukes på prosjekt-, samtale- og meldingsdokumenter.
- Klienten kan lese egne chatdokumenter, men kan ikke skrive dem direkte. Oppretting, endring, arkivering og sletting skal gå via autentiserte Callable Functions.
- `apiKeys/{uid}` og `aiUsage/{uid}` er utilgjengelige fra klienten. `users/{uid}/settings/openai` er kun lesbar for eieren og skrives av backend.
- Første prosjekt i v156 bruker stabil ID `general-training`; øvrige dokument-ID-er skal valideres eller genereres av backend.
- Aktiv samtalehistorikk beholdes til brukeren sletter den. Arkiverte samtaler/prosjekter har anbefalt retention på 365 dager før backendstyrt opprydding; automatisk sletting bygges ikke før brukeren har tydelig innsyn.
- Arkivering er reversibel. Sletting krever eksplisitt bekreftelse og utføres rekursivt av backend i kontrollerte batcher.
- Chat holdes utenfor dagens treningsbackup/import. Separat chat-eksport og personvernflate tas i v158.
- Modellen får aldri full historikk automatisk. Policyen er kort sammendrag og maksimalt 10 nylige meldinger.
- Meldingsinnhold begrenses til 6000 tegn, prosjektinstruks til 2000 tegn og sammendrag til 4000 tegn.
- Prosjektinstruksjoner er brukerdata og kan ikke bli systeminstruks eller overstyre coachens guardrails.

Callable-kontrakter som v156 skal bygge:

- `aiChatCreateConversation`: valider prosjekt-ID og tittel, opprett backend-eid samtale.
- `aiChatSendMessage`: valider eierskap, context og tekst; lagre bruker-/assistentsvar atomisk nok til å kunne gjenoppta samtalen.
- `aiChatArchiveConversation`: sett status uten å slette meldinger.
- `aiChatDeleteConversation`: krev bekreftelse og slett meldinger rekursivt før samtaledokumentet.
- Senere prosjektfunksjoner følger samme kontrakt, men introduseres først i v157.

### v156 - Synkroniserte samtaler v1

- Opprett, åpne, gi navn til, arkiver og slett samtaler.
- Lagre bruker- og assistentmeldinger via autentisert backend.
- Vis siste samtaler og fortsett dem på PC og mobil.
- Send sammendrag og begrenset meldingsvindu, ikke full historikk.
- Behold én standardprosjektflate for å redusere første scope.

### v157 - Prosjekter og egne instrukser

- Opprett, rediger, arkiver og slett prosjekter.
- Flytt/opprett samtale i valgt prosjekt.
- Egen prosjektinstruks med tydelig forklaring på prioritet og sikkerhetsgrenser.
- Prosjektliste, siste samtaler og gode tomtilstander på mobil.

### v158 - Kontrollert langtidskontekst og kvalitet

- Bedre samtalesammendrag og kontekstvindu for lange diskusjoner.
- Eksplisitt, brukeradministrert minne på tvers av samtaler hvis praktisk test viser behov.
- Personvernside for lagrede samtaler, sletting og eventuell eksport.
- Kostnads-/tokenkontroll per samtale og prosjekt.
- Testmatrise for trening, skade, mat/restitusjon, mål-løp og motstridende instrukser.

## 8. Akseptanse før v156

- Firestore Rules er eksplisitt kontrollert og testet.
- Kun innlogget eier kan lese egne prosjekter og samtaler.
- Klienten kan ikke lese API-nøkkel eller andre brukeres chatdata.
- Backend validerer prosjekt-, samtale- og meldings-ID-er.
- Prosjektinstruksjoner kan ikke overstyre serverens systeminstruks.
- Rekursiv sletting er testet.
- Maks meldingslengde, rate limit og context-størrelse håndheves på server.

