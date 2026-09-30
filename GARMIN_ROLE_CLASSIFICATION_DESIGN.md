# Roller for Garmin-import og historisk opprydding

Status 2026-09-30: leveranse 1 er implementert lokalt som v176x; leveranse 2 er fortsatt bare design. Dette dokumentet supplerer `GARMIN_CSV_IMPORT_DESIGN.md` og bruker den kanoniske rollemodellen i `domain-training-plan.js`. De to leveransene er (1) manuelt rollevalg ved import av nye, umatchede økter og en tellende Logg-inngang, og (2) historisk opprydding på samme flate. Ingen forslagsmotor eller automatisk omklassifisering inngår i v1.

## 1. Bakgrunn og mål

I dagens import får en ny Garmin-økt uten plan-/malkobling et v2-malsnapshot. Når Garmin-navnet ikke uttrykker intensjon og intensitetsfeltet er tomt, blir rollen `other`. For brukeren er 22 Garmin-importerte økter uten `templateId` blant øktene som trenger gjennomgang. En Garmin-økt kan være en rolig baseøkt uten å være gjennomført etter appens `Easy Run`-mal. Å velge rolle og å knytte økten til en konkret mal må derfor være to separate beslutninger.

Målet er at importen tilbyr et **tomt rollevalg** med øktens fakta ved siden av, uten å kreve svar, og at utsatte valg aldri blir usynlige. Brukeren velger selv om økten var rolig base, langtur, kvalitet eller noe annet. En uklassifisert økt skal fortsatt telle i volum, belastning og sikkerhetsvurderinger, men ikke dekke en plass i normalukens rolleplan.

Dette er ikke en ny motor for å vurdere treningseffekt, ingen automatisk Garmin-synk og ingen anledning til å omskrive fullførte målinger. Eksisterende v1-snapshots og legacy-økter uten snapshot skal beholde sin historiske klassifisering til brukeren eksplisitt velger en endring.

## 2. Roller, opphav og datakontrakt

`completed.templateSnapshot.role` forblir den ene kanoniske, frosne rolleverdien. Et nytt, valgfritt toppnivåfelt `completed.roleSource` forklarer hvordan den verdien ble bestemt:

| `roleSource` | Betydning |
| --- | --- |
| `template` | Rollen er hentet fra en konkret, frosset mal eller en planlagt økts malsnapshot. Krever en reell mal-/plankobling, ikke bare likt navn. |
| `user_confirmed` | Brukeren har valgt rollen direkte. Dette er ikke en påstand om at en mal ble fulgt. Et bevisst valg av `other` bruker også denne verdien. Hvis forslag eventuelt innføres senere, blir et godtatt forslag også `user_confirmed`. |
| `inferred` | En eksisterende deterministisk regel har satt rollen uten brukerbekreftelse. V1 oppretter ikke nye umatchede importroller på denne måten. Et framtidig, ikke-godtatt forslag skal **ikke** stemples `inferred`. |
| `unclassified` | Brukeren har valgt «Bestem senere», eller ny import er lagret uten en bekreftet rolle. Kanonisk rolle er `other`, men denne verdien skiller manglende klassifisering fra bevisst «Annet». |

For nye økter lagres `roleClassificationVersion: 2` i `templateSnapshot`. Et rollevalg skrives atomisk sammen med `roleSource` og et valgfritt `roleReviewedAt`-tidspunkt. Ingen egen konkurrerende `completed.role` innføres. Ved rolle-only retting endres bare `templateSnapshot.role`, klassifiseringsversjon og rolleproveniens; `templateId`, navn, type, intensitet, struktur, planreferanse, dato, varighet, distanse, puls, RPE og notater beholdes. Valgfri «Knytt til mal» er en **annen** handling med egen feltvis diff og egen eksplisitt bekreftelse av de øvrige malfeltene.

Normalisering ved Firestore-lesing, lokal snapshot, backup, import og recovery må validere enum-verdiene og bevare ukjente eldre data. Manglende `roleSource` i gamle økter skal ikke gis en oppdiktet proveniens; detaljen viser «Opphav ikke dokumentert (eldre økt)». Gamle Garmin-økter med `role: other`, tom `templateId` og manglende `roleSource` listes som **til gjennomgang**, ikke migreres i det stille. Et eksplisitt bekreftet `other` skal ikke stå på listen. Legacy-økter uten `templateSnapshot` holdes i en separat gruppe; live-mal-fallback og v1-klassifisering endres ikke i denne runden.

## 3. Manuelt valg i v1; forslagsmotor ikke besluttet

V1 har ingen forslagsmotor, intet puls-veto og ingen endring i `coach-rules.json`. Rollen er ikke forhåndsvalgt. Aktivitetstype, varighet, distanse og snittpuls vises som **fakta**, ikke som begrunnelse for et bestemt svar. Fart og RPE velger heller ikke rolle. En faktisk koblet planlagt økt beholder sitt frosne malsnapshot; et direkte brukerrollevalg vinner over all utledning. «Bestem senere» er et gyldig valg og gir `roleSource: unclassified`.

Eksempel på mobil:

> Oppegård Running  
> Løping · 34 min · 5,1 km · snittpuls 157  
> Hvilken rolle hadde økten? [Velg rolle] [Bestem senere]  
> Knytt til mal (valgfritt, eget valg)

Den eksisterende relative langtursgrensen beholdes uendret i v1. Rolleopphav lagres, men `roleSource` brukes **ikke** som nytt filter eller ny vekt i `easyRunDurationBaseline()`. Endring av en økts bekreftede rolle kan likevel gjøre den til en gyldig referanse etter dagens regel. Å innføre kildevekting krever eget designvedtak med før/etter-visning.

En mulig senere forslagsmotor er **ikke besluttet og ikke del av noen av de to implementeringsrundene**. Først etter noen ukers manuell bruk kan behovet vurderes med faktisk antall utsatte valg og konkrete feil-/friksjonstilfeller. Da må forslag kalibreres mot reelle økter før regler velges. Tidligere idé om `avgHeartRate >= thresholdHeartRate` forkastes som v1-regel: ved personlig terskel 174 bpm ville den sjelden slå inn, mens en intervalløkt med snittpuls 165–170 kunne feilaktig fått easy-forslag ut fra varighet. Heller ikke dagens `easyCeiling.pctOfMaxHr = 0.82` kan brukes til rolleforslag: 0,82 × 188 = cirka 154 bpm, under brukerens dokumenterte rolige 156–158 bpm. Ingen av disse pulsreglene bygges nå. Et framtidig, ikke-godtatt forslag skal aldri lagres som `user_confirmed` eller `inferred`.

**Ubesluttet alternativ, bare til senere vurdering:** En ren motor kunne kombinert aktivitetstype, entydige hele navnemarkører, varighet mot `easyRunDurationBaseline()` og eventuelt individuelt kalibrerte eksklusjonssignaler, og vist både begrunnelse og manglende grunnlag. Den måtte aldri bruke fart/RPE som rollevalg, lav/moderat puls som kvalitetsbevis eller et forslag som automatisk fasit. `Hiking`/`Fottur` mot aktivitetstype Løping måtte vises som datakvalitetskonflikt. Først hvis manuell bruk viser reell friksjon, skal vi teste dette mot både faktiske rolige økter og generiske intervalløkter, beslutte om pulssignal i det hele tatt hjelper, og så eventuelt lage et eget designvedtak. Dette avsnittet gir **ingen** implementeringsfullmakt.

## 4. Mobilflyt ved ny Garmin-import – leveranse 1

Eksisterende importhandlinger («Opprett», «Berik», «Knytt til planlagt», «Hopp over») beholdes. Rollevalget vises bare når det er relevant:

1. For en ny, umatchet økt vises aktivitetstype, varighet, distanse og snittpuls fra Garmin. Rollelisten starter med «Velg rolle», uten forhåndsvalg, rangering eller anbefaling. Valg: kanoniske roller, bevisst «Annet» og «Bestem senere». En valgfri, separat handling «Knytt til mal» viser ekstra metadata-diff og krever egen bekreftelse. Importhandling må fortsatt velges som før; **rollebeslutning kan utsettes**.
2. Ved kobling til en eksisterende planlagt økt vises at dens frosne malrolle overtas. Eventuell konflikt mellom Garmin-data og planens intensjon er synlig, men Garmin-målinger overskriver ikke rollen.
3. Ved beriking av en allerede fullført økt gjelder eksisterende merge-policy: målbare Garmin-felt kan fylles, men frosset rolle og `roleSource` endres ikke automatisk. Eventuell rolleendring må velges som særskilt feltvis bekreftet handling.
4. Duplikat/«Hopp over» endrer ingen rolle. Importbekreftelsen viser antall bekreftede roller og antall som legges i «Mangler rolle». Tomt rollevalg ved «Opprett» behandles som «Bestem senere», ikke som et skjult `easy`-forslag.

«Bestem senere» lagrer `templateSnapshot.role: other` + `roleSource: unclassified`. Importen blokkeres ikke av dette valget. Økten får fremdeles korrekt aktivitetstype og alle faktiske målinger. Den skal telle i distanse, treningstid, belastning, volumvakt og sikkerhetsvurdering; den skal ikke dekke `easy`, `long_easy` eller en kvalitetsrolle i `roleCoverage()`. Dagens intensitetsberegning bruker flere data enn rollen og må regresjonstestes, ikke nullstilles fordi rollen mangler.

## 5. Varig Logg-liste fra leveranse 1; opprydding i leveranse 2

Plassering: **Logg**, ved historikkfilteret, ikke som daglig press på Hjem. I leveranse 1 teller «N økter mangler rolle som kan påvirke vurderinger nå» **bare nye økter med `roleSource: unclassified` som kan rettes nå**. Eldre Garmin-importerte økter med `role: other`, tom `templateId` og udokumentert opphav står i en rolig, ikke-tellende notis: «N tidligere importerte økter kan gjennomgås når neste runde er klar.» Først i leveranse 2 går de inn i hovedtelleren etter den vanlige relevansregelen. Listen viser dato, navn, aktivitetstype, varighet, eksisterende rolle, kilde og status. Den oppdateres når en rolle bekreftes; et bevisst «Annet» fjerner økten fra køen.

«Relevant nå» er ett datovindu utledet som **det lengste aktive regelvinduet**: inneværende treningsuke, regelkildens lookback for `easyRunDurationBaseline()` (i dag åtte avsluttede uker) og regelkildens intensitetsvindu (i dag 14 dager). Det lages ingen union av øktmengder; vinduet utvides automatisk dersom en senere regel får lengre horisont. Starten på langtursvinduet forankres til mandag i inneværende uke, slik produksjonsfunksjonen gjør. Dato- og regelendringer kan flytte en økt mellom gruppene uten å endre lagrede data. Tallene beregnes fra normalisert state, ikke lagres som egen sannhet.

Økter utenfor disse vinduene ligger i en rolig, sammenfoldet gruppe: «Eldre økter uten rolle · Se alle». Den har antall, men ingen vedvarende varselbrikke. UI-tekst: «Du trenger ikke rette disse for ukens plan eller dagens langtursgrunnlag. Lar du dem stå, skjer ingenting kritisk. En senere retting kan endre historiske visninger og sammenligninger.» Presisering: `comparableEasyRunFormInsight()` har i dag ingen fast datogrense og kan bruke eldre kandidater i «Form ved samme innsats»; vi skal derfor **ikke** påstå at økter eldre enn åtte uker er helt uten virkning. Historisk intensitetsbalanse kan også endres ved bevisst retting, mens dagens 14-dagersbalanse ikke påvirkes av en eldre økt.

Første runde leverer inngangen og lesbar liste. Gamle Garmin-økter som ennå ikke kan rettes der, merkes «Gjennomgang åpnes i neste runde» i stedet for å se ut som en fungerende handling. Et eget filter «Eldre økter uten malsnapshot» holder legacy-gruppen adskilt og utfører ingen stille migrering.

I leveranse 2 vises for hver av de 22 aktuelle øktene de samme faktiske feltene som ved import, en tom rollevelger og feltvis gammel/ny-verdi (`templateSnapshot.role`, `roleClassificationVersion`, `roleSource`, eventuelt vurderingstidspunkt). Valg: «Bekreft valgt rolle», «Annet» eller «Bestem senere». En samlet lagrehandling er tillatt først når **hver endret økt er listet og eksplisitt bekreftet**. Ingen «bruk på alle». Utsatte økter blir i listen. Brukeren kan også velge en separat malkobling, men bare med full snapshot-diff og egen bekreftelse; det er ikke nødvendig for å rette rollen.

**Rolle og lagret intensitet må vurderes sammen ved opprydding.** Hvis valgt rolle er `easy` mens frosset `templateSnapshot.intensity` er `Terskel`, eller tilsvarende felt åpenbart motsier hverandre, skal forhåndsvisningen flagge dette før bekreftelse. En rolle-only retting endrer fortsatt aldri intensitet automatisk. Brukeren kan i samme individuelt bekreftede handling velge en eksplisitt intensitetsretting; diffen viser begge felt med gammel og ny verdi, og konsekvensvisningen beregnes fra **begge** valgene. Det skal være mulig å la intensiteten stå uendret etter synlig advarsel. En eksisterende `templateId` eller malkobling må ikke skjules når det frosne snapshotet blir rettet separat fra malen. Eksempelet fra 25. og 27. september 2026 viser hvorfor: «Oppdater fra mal» ga begge økter `Terskel`-intensitet, mens en senere ren rolleendring til `easy` ellers ville gitt motstridende metadata.

Før skriving vises en konsekvensvisning fra det faktisk valgte settet, beregnet mot dagens state uten å endre den:

- antall som får bekreftet `easy`, `long_easy`, kvalitet, `other` eller forblir uklassifisert
- endret rolledekning for berørte uker og eventuell påvirkning på intensitetsbalanse og «Form ved samme innsats»; dette er mulige avledede endringer, ikke løfte om at alle økter passerer innsiktens øvrige filtre
- easy-referanser før/etter, median og relativ langtursgrense; **egen tydelig tilstand** når minimum seks krysses, for eksempel «Langtursgrensen aktiveres: 5 → 6 gyldige referanseøkter. Se ny grense før du lagrer.»
- om en allerede aktiv grense flytter seg, og hvilke foreløpige, ikke-bekreftede v2-klassifiseringer som dermed kunne fått annet resultat. Frosne historiske roller endres ikke uten individuelt valg.

Brukerens oppgitte fem gyldige referanser er et testscenario, ikke et tall som hardkodes; før/etter må beregnes fra ferske normaliserte data ved forhåndsvisning og på nytt før commit. Antall gjennomgåtte Garmin-økter kan ha endret seg fra 22 når runden bygges.

## 6. Arkitektur, skrivevern og berørte filer

En liten ren domenefunksjon normaliserer og validerer **manuelt rollevalg og rolleopphav** for begge flyter; den foreslår ikke roller. Eksisterende `easyRunDurationBaseline()` brukes bare for konsekvensvisningen i leveranse 2. `training-import-ui.js` og en avgrenset historikk-UI viser faktiske øktdata og tomt rollevalg. `app.js` beholder state-/DOM-wrappere. `training-repository.js` eier Firestore-skriving; `app-state.js` normaliserer de nye valgfrie feltene. Øktdetaljen viser «Rolle: Rolig baseøkt · Opphav: valgt av deg» eller tilsvarende for mal, utledning og uklassifisert.

Mulige runtimefiler i de senere rundene er `domain-training-plan.js`, `training-import-controller.js`, `training-import-ui.js`, `workout-history-ui.js`, `app-state.js`, `training-repository.js`, `app.js` og stabilitetstester. **`domain-coach-rules.js` og `coach-rules.json` er utenfor v1-scope.** Hvis en ny runtime-domene­modul opprettes, registreres den samtidig i `APP_SHELL`, begge `node --check`-lister og `ARCHITECTURE.md` etter `AGENTS.md`. Dette dokumentet oppretter ingen modul.

Import og opprydding krever innlogging, nett og normal synkroniseringsmodus ved skriving. Forhåndsvisning er skrivefri. Recovery snapshot tas før første endring. Commitplanen identifiserer økter med ID og revaliderer at de ikke er endret siden forhåndsvisningen; ved avvik stoppes skriving og diff vises på nytt. 22 oppdateringer bør utføres som én Firestore-batch når de får plass, slik at en delvis rolleopprydding unngås. Ingen målinger, Garmin-proveniens eller andre historiske felt fjernes. CSV-navn er ubetrodd tekst og escapes ved visning; rå CSV sendes ikke til AI eller backend.

## 7. Tester og aksept

Rene tester skal kalle produksjonsmodulen, ikke kopiere reglene:

- Garmin «Running», 34 min, snittpuls 157 og makspuls 188 viser fakta, men rollevelgeren er tom. Verken navn, varighet, puls, fart eller RPE setter et forslag eller en rolle. Ingen puls-veto eller 82 %-regel brukes i rolleflyten.
- Direkte valgt rolle blir `user_confirmed`; faktisk malsnapshot blir `template`; «Bestem senere» blir `unclassified`; bevisst «Annet» blir `user_confirmed` og teller ikke som manglende rolle. Enum-verdien `inferred` bevares for eksisterende deterministiske tilfeller, men brukes ikke til umatchede nye importer.
- En uklassifisert økt teller i volum og sikkerhet, ikke i rolledekning. Importert økt uten malkobling får ikke oppdiktet `templateId` eller malstruktur.
- Gammel v1-økt og legacy-økt uten malsnapshot beholder samme historiske klassifisering og statistikk før/etter runden uten eksplisitt retting.
- Hovedtelleren bruker det lengste regelstyrte datovinduet, men i leveranse 1 teller den bare nye `unclassified`-økter som kan rettes. Gamle importer er en ikke-tellende notis fram til leveranse 2. Eldre økter ligger uten varselbrikke i separat gruppe. En eldre kandidat kan fortsatt påvirke «Form ved samme innsats», som ikke har datogrense i dagens kode.
- Konsekvensvisningen viser aktivering ved 5 → 6 gyldige referanser, og ingen eksisterende frosset historisk rolle omskrives av den nye grensen.
- Enkeltvise diff-bekreftelser og batchrevalidering beskytter mot stille overskriving; ugyldig/ukjent `roleSource` normaliseres uten datatap.
- Leveranse 2: `easy` valgt mot lagret `Terskel` gir synlig konflikt. Valgt intensitetsretting vises feltvis sammen med rolle og krever individuell bekreftelse; å bare velge rolle får aldri intensiteten til å endres automatisk.

Manuell kontroll på 390 px i leveranse 1: importer en umatchet rolig løpetur, se faktiske øktdata og **tomt** rollevalg, velg «Bestem senere» og finn den i Logg; importer også en økt med direkte rollevalg uten mal, se opphav i detaljen og kontroller at volum beholdes. I leveranse 2: rett den utsatte økten fra Logg, kontroller oppdatert rolledekning, og gjennomgå de eksisterende Garmin-øktene med før/etter-konsekvens og backup. Eldre gruppe, v1-historikk og legacy uten snapshot kontrolleres separat.

## 8. Sekvens og port

1. **Importflyt først:** datamodell, manuelt rollevalg uten forslag, `roleSource` for nye umatchede aktiviteter og tellende Logg-inngang. Utsatte økter må allerede være synlige, ellers skal denne runden ikke regnes som ferdig. Manuell produksjonsverifisering før runde 2.
2. **Deretter historisk opprydding:** samme rollevelger og Logg-flate for de eksisterende Garmin-øktene, feltvis diff, individuell bekreftelse og eksplisitt visning av mulig aktivering/flytting av langtursgrensen. Legacy uten malsnapshot forblir en egen gruppe.

Begge runder må være manuelt verifisert før planens avslutningsflyt. Deretter kommer mål-score-trend, comeback-design, sonetid under sone 1 og først så planarbeidets runde 5, i den avtalte rekkefølgen. Implementering, versjons-/cachebump og GitHub-deploy hører til runtime-rundene, ikke dette designnotatet.
