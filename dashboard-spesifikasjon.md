# Dashboard-spesifikasjon v2 – basert på dagens app

Revidert etter gjennomgang av skjermbilder fra Hjem, Kalender, Logg, Innsikt og Mål (juli 2026).

---

## 1. Overordnet vurdering av dagens Hjem

### Det som fungerer godt i dag
- **Regelmotoren er appens sjel** – og den forklarer seg («Hvorfor», «Grunnlag», intensitetsbalanse). Dette er sjeldent bra og må beholdes.
- **Dagsform (grønt/gult/rødt lys)** er et glimrende konsept – enkelt, ærlig og handlingsrettet.
- **Ukesmål og månedsutfordring** (1/3 økter, 85 km i juli) gir kontekst, ikke bare rå tall.
- Ren, luftig kortdesign med tydelig primærknapp.

### De fem største svakhetene

1. **Hjem sier det samme tre ganger.** «Neste økt», «Dagens beslutning» og «Gjør nå» beskriver alle den samme intervalløkten. Brukeren leser identisk informasjon tre steder før noe nytt dukker opp. Dette er hovedårsaken til at skjermen føles tung.

2. **For mye brødtekst, for lite grafikk.** «Dagens råd» alene inneholder 6–7 tekstblokker. Innsikten om intensitetsbalansen («4 harde mot 1 rolig») er *gull* – men presentert som et avsnitt i stedet for en visuell indikator man forstår på ett sekund.

3. **De mest motiverende elementene finnes ikke på Hjem.** Appen har allerede:
   - **11 uker på rad** med kontinuitet (Innsikt)
   - **Halv-Birken med nedtelling** og mål-score 80/100 (Mål)
   - **Ferske PB-forbedringer** («5 km: 43 sek raskere», «10 km: +4,4 %») (Mål)
   
   Ingenting av dette vises på Hjem. Det er som å ha pokalene i kjelleren.

4. **«Denne uken» er tallbokser uten liv.** 1/3, 0:55:58, «Rolig» – ingen fremdriftsring, ingen ukedager, ingen kilometer (som finnes på Innsikt), og et tomt felt der et fjerde kort skulle stått.

5. **Ubrukt plass og svak visuell balanse (PC).** Innholdet ligger i en smal kolonne med store tomme flater rundt. Dagsform-kortet er nesten tomt. Grønn brukes både til «utført»-knapp og suksess, mens orange brukes både som merkevare, «planlagt» og fremdrift på 24 % – fargene bærer ikke konsekvent mening.

---

## 2. Konkrete endringer på Hjem (prioritert)

### Endring 1 – Slå sammen «Neste økt» + «Dagens råd» + «Dagsform» til ETT heltekort

Dagens tre kort blir ett kort med tydelig hierarki:

```
┌─────────────────────────────────────────────┐
│ ● Grønt lys · tir. 7. juli        [Endre]   │  ← dagsform som chip i toppen
│                                             │
│ NESTE ØKT · ons. 8. juli                    │
│ Intervall 8×3 min + 8×45 sek Terskel        │  ← stor tittel
│                                             │
│ «Hold kvaliteten kontrollert – kvalitet     │  ← ÉN setning hvorfor
│  skal komme med friske bein.»               │
│                                             │
│ ▸ Øktdetaljer  ▸ Forberedelse  ▸ Grunnlag   │  ← alt annet bak utvidbare rader
│                                             │
│ [ Marker utført ]      [ Endre dato ]       │
└─────────────────────────────────────────────┘
```

- **Dagsform integreres som statuschip** øverst i kortet (grønn/gul/rød prikk + «Grønt lys»). Den styrer jo rådet – da hører den hjemme *i* rådet, ikke i et eget halvtomt kort.
- **Én setning «hvorfor»** synlig. «Gjør nå», «Støtte» (mat/drikke) og hele grunnlagsteksten legges bak utvidbare rader eller et trykk. Informasjonen finnes fortsatt – den bare venter til du ber om den.
- Hvis dagsform og plan *spriker* (f.eks. gult lys + hard økt planlagt), skal kortet vise en tydelig konflikt-tilstand: «Dagsform tilsier lettere økt – vil du bytte til rolig alternativ?» med ett-trykks bytte. Dette gjør motoren levende i stedet for rådgivende tekst.

### Endring 2 – Gjør intensitetsbalansen visuell

Avsnittet «Intensitetsbalansen siste 2 uker er tung: 4 harde mot 1 rolige...» erstattes av en liten horisontal fordelingslinje (du har den allerede på Innsikt!):

```
Intensitetsbalanse · 14 dager
[██ rolig 30% |████████ moderat/hard 70%]   ⚠ Litt lite rolig
```

Ett blikk, samme budskap. Detaljteksten legges bak trykk. Denne linjen kan stå som en tynn stripe nederst i heltekortet eller som eget smalt kort.

### Endring 3 – Løft kontinuitet og streak opp på Hjem

**«11 uker på rad» er appens sterkeste motivasjonstall og må stå på Hjem.** Ta med en kompakt versjon av kontinuitetsgriden fra Innsikt:

```
┌──────────────────────────────┐
│ 🔥 11 uker på rad            │
│ ▢▢▢▢▢▢▢◐   ← siste 8 uker    │
│ 2 økter igjen for at denne   │
│ uken skal telle              │
└──────────────────────────────┘
```

Setningen «2 økter igjen for at denne uken skal telle i kontinuiteten» (fra Innsikt) er en perfekt mikro-motivator – den kobler dagens innsats til noe du har bygget i 11 uker og ikke vil miste.

### Endring 4 – Løft målet opp på Hjem

Halv-Birken finnes på Kalender-sidepanelet og Mål-fanen, men ikke på Hjem. Legg til et kompakt målkort:

```
┌──────────────────────────────┐
│ HALV-BIRKEN · 12 km          │
│ 49 uker igjen                │
│ Mål-score 80/100  ▂▂▂▂▂▂▂▂░░ │
│ Fase: Basebygging            │
└──────────────────────────────┘
```

Mål-scoren er genial for et dashboard: ett tall som oppsummerer «er jeg på sporet?». Vis endring fra forrige uke med pil (▲/▼/—). 340 dager er langt frem – bruk «49 uker» eller «Fase: Basebygging, uke X av Y» slik at det føles som fremdrift, ikke venting.

### Endring 5 – Rust opp «Denne uken»

- Legg til **kilometer** (finnes allerede på Innsikt: 6,2 km).
- Bytt «1/3 ØKTER»-boksen til en **fremdriftsring** med 1/3 i midten.
- Legg til **7 små dagsstolper** (man–søn) som viser når du har trent – gir rytmefølelse og fyller det tomme fjerde feltet.
- Behold månedsutfordringen (85 km i juli) som i dag – den fungerer – men gi fremdriftslinjen en «forventet takt»-markør: en liten strek som viser hvor du *burde* være per 7. juli (~23 %), slik at 24 % leses som «i rute» og ikke som «bare 24 %».

### Endring 6 – Nytt kort: «Siste høydepunkt»

Mål-fanen regner allerede ut PB-fremgang («5 km: 0:43 raskere · +1,8 %»). Roter ett slikt funn på Hjem:

> ⭐ **Ny 5 km-PB 4. juli: 38:03** – 43 sek raskere enn i juni.

Etter en fullført økt bytter heltekortet dessuten til feiringsmodus i resten av dagen: øktoppsummering + ett positivt funn, i stedet for å hoppe rett til neste økt. La gjennomført økt få lov å *smake* litt.

---

## 3. Revidert layout

### Mobil (rekkefølge ovenfra)

```
1. HELTEKORT  (dagsform-chip + neste økt + én-linjes hvorfor + knapper)
2. Denne uken (ring 1/3 · tid · km · 7 dagsstolper)
3. Kontinuitet (🔥 11 uker + minigrid)
4. Mål (Halv-Birken · 49 uker · mål-score 80)
5. Månedsutfordring (85 km i juli, med takt-markør)
6. Siste høydepunkt (roterende PB/rekord)
```

Punkt 1–2 skal være synlige uten scrolling.

### PC (12-kolonners rutenett – fyll bredden)

```
┌──────────────────────────────┬────────────────┐
│ HELTEKORT (8 kol)            │ Mål/nedtelling │
│ inkl. dagsform-chip og       │ + mål-score    │
│ intensitetsstripe            │ (4 kol)        │
├─────────┬─────────┬──────────┼────────────────┤
│ Denne   │ Konti-  │ Måneds-  │ Siste          │
│ uken    │ nuitet  │ utford.  │ høydepunkt     │
├─────────┴─────────┴──────────┤                │
│ Ukesvolum-graf (fra Innsikt, │                │
│ «Kilometer per uke», 8 uker) │                │
└──────────────────────────────┴────────────────┘
```

På PC er det plass til å hente inn «Kilometer per uke»-grafen fra Innsikt nederst – den finnes allerede og gir den lange historien uten ny utvikling.

---

## 4. Visuell tydelighet – fargesystem og typografi

Dagens app blander betydninger. Forslag til fast system:

| Farge | Betyr | Brukes til |
|---|---|---|
| Orange (merkevare) | Handling & identitet | Primærknapper, aktiv fane, headerlinje |
| Grønn | Fullført / i mål / grønt lys | Utførte økter, «i mål»-uker, dagsform |
| Gul | Obs / nær grensen | Gult lys, «litt lite rolig», belastning |
| Rød | Stopp / avvik | Rødt lys, brutt plan, høy belastning |
| Nøytral grå | Planlagt / passiv | Planlagte økter, sekundærknapper |

- I dag er «Planlagt»-taggen og kalenderens planlagte økter røde/orange – det leses ubevisst som *fare*. Bytt planlagte økter til nøytral/omriss-stil og la rødt kun bety avvik.
- Fremdriftslinjer: bruk **grønn ved ≥ forventet takt**, orange bare når du ligger etter. Da blir farge = informasjon.
- **Tallene bør opp 30–50 % i størrelse** på Hjem («1/3», «0:55:58», «11»). De er heltene og skal kunne leses på en armlengdes avstand. Bruk tabulære siffer.
- Mikroanimasjon: fremdriftsringen fylles ved lasting; kort konfetti/puls når ukesmålet nås eller streaken forlenges. Én feiring per hendelse.

---

## 5. Forbedringer i resten av appen

### Kalender
- **Ukeplan-panelet er bra, men tekst-tungt** – samme kur som Hjem: én setning synlig, resten bak utvidbare rader. Mål-løp-boksen med begrunnelse kan kortes til to linjer + trykk.
- **Fiks tekstbryting i økttype-chipene**: «STØTTETE RSKEL» brytes midt i ordet. Bruk kortere etiketter (Hovedterskel → «Terskel A» e.l.) eller mindre font/bredere chip.
- Gi chipene tre tydelige tilstander med ikon, ikke bare tekst: ✓ dekket · ◷ planlagt · ○ mangler.
- **Fargelegg kalenderøkter etter status, ikke vilkårlig**: grønn = utført, grå omriss = planlagt, rød kun ved avvik (hoppet over). Legg gjerne en liten volum-sum per ukerad (f.eks. «21 km») i høyre kant – da blir kalenderen også et volumkart.
- Vurder drag-and-drop for å flytte planlagte økter mellom dager – «Endre dato»-behovet forsvinner nesten.

### Logg
- **Vis pace (min/km) på øktkortene**, ikke bare puls – for en løper er pace ofte den raskeste kvitteringen. F.eks. «6,17 km · 55:58 · 9:04 /km · 137 bpm».
- **Forklar fargeprikkene** (grønn/rød ved «Løping») – legg en liten legend under Filter, eller bruk chips med tekst («Rolig», «Hard»). Ukjente symboler koster tillit.
- **Grupper listen per uke** med en tynn overskrift («Uke 27 · 3 økter · 21 km») – da blir loggen også en fortelling om rytme, ikke bare en liste.
- Marker PB-økter og testløp med ⭐/🏁 direkte i listen (dataen finnes i Mål-fanen).

### Innsikt
- **Fjern dobbeltvisninger.** «Denne uken» vises i dag på Hjem, i «Denne uken»-kortet, i «Ukestatus» og i «Siste 4 uker». Slå sammen «Denne uken» + «Ukestatus» til ett kort, og la «Siste 4 uker» være den historiske visningen.
- **Bakken-mønstre er kjempebra** (rolig-andel, RPE, konsistens) – vurder å gjøre det til toppkortet på Innsikt: tre trafikklys som svarer på «trener jeg riktig?».
- Gi stolpediagrammene **intensitetsfarger**: del hver ukestolpe i grønn (rolig) og orange (moderat/hard). Da viser samme graf både volum og balanse – to innsikter, én grafikk.
- Legg en **glidende gjennomsnittslinje** (4 uker) over «Kilometer per uke» – trenden blir synlig selv med naturlig variasjon.
- Formutvikling (VO2 Max, HRV, hvilepuls): fint at det står «signaler, ikke fasit». Legg gjerne en diskret markering av harde økter på HRV-grafen, så du ser samspillet.

### Mål
- **Fiks PB-kortene** – tekst brytes stygt («Inge n regis trert», «38:0 3»). Gjør kortene enklere: distanse, tid, dato, trend-pil. Detaljer ved trykk.
- Tomme distanser (3 km, halvmaraton, maraton): erstatt «Ingen registrert» med en invitasjon – «Løp din første 3 km-test →». Et tomt felt er en mulighet, ikke et hull.
- Delmål-listen («5 steg») er glimrende og bør speiles i miniformat på Hjem-målkortet (f.eks. «Steg 2 av 5: Stabil base ✓»).
- Fullførte challenges (80 km i mai, 85 km i juni – begge 100 %): flytt til en «Fullført»-seksjon eller et trofé-arkiv i stedet for å ligge blant aktive. Arkivet blir i seg selv motiverende å bla i.

---

## 6. Anbefalt rekkefølge for gjennomføring

1. **Slå sammen de tre kortene til ett heltekort** med dagsform-chip og utvidbare rader (endring 1) – størst effekt, fjerner mest støy.
2. **Kontinuitet + mål-kort inn på Hjem** (endring 3 og 4) – gjenbruk av eksisterende data, høy motivasjonsgevinst.
3. **Denne uken med ring, km og dagsstolper** (endring 5).
4. **Fargesystemet** (seksjon 4) – gjennomgående, men mekanisk jobb.
5. **Intensitetsstripe + høydepunktkort** (endring 2 og 6).
6. Forbedringene i Kalender/Logg/Innsikt/Mål etter behov.

---

## 7. Sjekkliste for det nye Hjem

- [ ] Beskrives dagens økt bare **ett** sted?
- [ ] Er all forklarende tekst begrenset til én synlig setning (resten bak trykk)?
- [ ] Vises streak, mål-nedtelling og mål-score på Hjem?
- [ ] Har «Denne uken» ring, kilometer og dagsstolper?
- [ ] Betyr grønn/gul/rød/orange alltid det samme overalt?
- [ ] Leses en planlagt økt som nøytral, ikke som «rød alarm»?
- [ ] Feirer Hjem en fullført økt resten av dagen?
- [ ] Utnytter PC-versjonen bredden med rutenett?
- [ ] Kan du svare på «hvordan går det / hva skal jeg gjøre / hva har jeg oppnådd» på 5 sekunder?
