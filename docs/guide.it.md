# Pit Lane Live Board — guida

*[English](guide.md)*

La Formula 1 nella barra laterale di Home Assistant: la classifica live con i tempi, il
calendario, ogni gara dal 1950 e i due campionati. Questa guida copre tutto, in ordine:
leggi le prime due sezioni e sei a posto; torna sulle altre quando ti servono.

- [Installazione](#installazione)
- [Le quattro pagine](#le-quattro-pagine)
- [Leggere la classifica live](#leggere-la-classifica-live)
- [Ritardo TV](#ritardo-tv)
- [Modalità senza spoiler](#modalità-senza-spoiler)
- [F1TV e la mappa live](#f1tv-e-la-mappa-live)
- [Entità e automazioni](#entità-e-automazioni)
- [Risoluzione dei problemi](#risoluzione-dei-problemi)
- [Domande frequenti](#domande-frequenti)

> Pit Lane Live Board non è ufficiale e non è in alcun modo associato alle società
> della Formula 1. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND
> PRIX e i marchi correlati sono marchi di Formula One Licensing B.V.

## Installazione

Ti servono Home Assistant 2026.6 o successivo e HACS. Nessun account: calendario,
risultati, classifiche e tempi live sono gratuiti. Un abbonamento F1TV è facoltativo e
aggiunge solo la mappa live della pista.

1. In HACS apri il menu (⋮) → *Repository personalizzati* e aggiungi
   `https://github.com/foyer-labs/Pit-Lane-Live-Board` con categoria *Integrazione*.
2. Cerca **Pit Lane Live Board** in HACS, scaricalo e riavvia Home Assistant.
3. *Impostazioni → Dispositivi e servizi → Aggiungi integrazione → Pit Lane Live
   Board.* Non c'è niente da compilare: leggi l'avviso e conferma.
4. **Live Board** compare nella barra laterale, per tutti gli utenti di casa.

Per rimuoverlo: elimina l'integrazione in *Dispositivi e servizi*, poi toglilo da HACS.
La cache (in `.cache/pit_lane_live_board` nella cartella di configurazione) si può
cancellare in qualsiasi momento; non finisce nei backup.

## Le quattro pagine

![La pagina Live durante una gara](screenshots/live.it.png)

**Live.** Durante una sessione: la striscia della sessione (giro o tempo rimanente,
stato della pista), la classifica con i tempi, la direzione gara, i team radio, il
meteo, i pit stop e — con F1TV — la mappa della pista. Tra una sessione e l'altra: la
prossima sessione con il conto alla rovescia. La pagina si collega al live timing della
F1 da 30 minuti prima di ogni sessione e si stacca pochi minuti dopo la fine.

![Qualifiche, tema scuro](screenshots/qualifying.it.png)

In qualifica la classifica mostra il miglior tempo di ogni pilota in Q1, Q2 e Q3, il
distacco dal più veloce nella parte in corso, e una linea rossa tratteggiata dove
inizia la zona di eliminazione.

![Il calendario](screenshots/calendar.it.png)

**Calendario.** Ogni weekend della stagione, le sessioni nel fuso orario del tuo Home
Assistant, il conto alla rovescia per la prossima e il podio di ogni weekend già corso.
Scegli qualsiasi stagione dal menu.

![La strategia gomme di una gara](screenshots/strategy.it.png)

**Risultati.** Qualsiasi stagione dal 1950. Apri una gara per le sue schede; una scheda
compare solo quando i dati esistono:

| Scheda | Da |
|---|---|
| Gara, Qualifiche | 1950 (tempi di qualifica da metà anni '90) |
| Sprint | 2021 |
| Posizioni giro per giro | 1996 |
| Pit stop | 2011 |
| Strategia gomme, Tempi sul giro, Direzione gara, Meteo | 2018 |

Le schede dal 2018 arrivano dall'archivio delle sessioni della F1: la prima volta che
apri una gara viene scaricato una volta sola (qualche MB) e resta in cache, così le
aperture successive sono immediate.

![Posizioni giro per giro](screenshots/lap-chart.it.png)

Nel grafico delle posizioni, clicca una linea per evidenziare quel pilota.

![La classifica piloti](screenshots/standings.it.png)

**Classifiche.** Piloti e costruttori, qualsiasi stagione, dopo qualsiasi gara, con
punti, vittorie, distacco dal primo e posizioni guadagnate o perse rispetto alla gara
precedente.

## Leggere la classifica live

| Colonna | Significato |
|---|---|
| Pos | Posizione. ▲/▼ accanto al pilota: posizioni guadagnate o perse dalla partenza (gare e sprint). |
| Distacco | Tempo dal primo. `1 L`: un giro di ritardo. |
| Int | Intervallo: tempo dall'auto immediatamente davanti. |
| Ultimo, Migliore | Ultimo e miglior giro. |
| S1, S2, S3 | I tre settori del giro in corso; i valori in grigio sono del giro appena concluso. |
| Gomma | Mescola (S soft rossa, M medium gialla, H hard bianca, I intermedia verde, W da bagnato blu), poi i **giri su quel treno**. *usata* indica un treno che aveva già giri prima di questo stint. |
| Soste | Pit stop fatti finora. |

I colori seguono la convenzione della F1: **viola** è il più veloce della sessione,
**verde** è il miglior personale del pilota. Etichette: `BOX` in corsia box, `USCITA`
mentre ne esce, `RIT` ritirato, `FERMO` fermo in pista, `FUORI` eliminato in qualifica.

Clicca una riga per seguire un pilota: la riga, il suo punto sulla mappa e i suoi team
radio vengono evidenziati. La direzione gara si filtra per bandiere o per penalità; le
penalità sono riconosciute dal testo dei commissari, quindi il filtro fa del suo
meglio.

Quando il flusso tace, un avviso lo dice dopo 30 secondi e la pagina diventa grigia
dopo 60: niente che non sia live viene mai mostrato come live.

![La versione da telefono](screenshots/phone.it.png)

Sul telefono la classifica tiene posizione, pilota, distacco, ultimo giro e gomma.

## Ritardo TV

![Impostare il ritardo TV](screenshots/delay.it.png)

Il live timing arriva prima della TV: qualche secondo prima della diretta, fino a un
minuto o più prima di uno streaming. Clicca l'orologio in alto e imposta un ritardo da 0
a 120 secondi: la pagina, i team radio, le entità e gli eventi per le automazioni
aspettano tutti di quel tanto.

Regolalo durante una sessione: quando un'auto taglia il traguardo in TV, la classifica
dovrebbe cambiare nello stesso istante. L'impostazione è una per tutta la casa, perché
le luci seguono la stessa TV. È anche l'entità numero **Ritardo TV**.

Quando si apre una connessione, anche i primi dati aspettano il ritardo: fino ad
allora la pagina dice "Sincronizzazione con il ritardo TV".

## Modalità senza spoiler

Registri la gara per guardarla dopo cena? Clicca l'occhio in alto (o accendi
l'interruttore **Modalità senza spoiler**). Finché non la spegni:

- la pagina Live mostra solo quale sessione è in corso;
- i risultati del weekend in corso sono nascosti, gara per gara e scheda per scheda,
  ognuno con il pulsante *Mostra questa sessione*;
- il calendario nasconde il podio del weekend;
- le classifiche mostrano la situazione di prima del weekend;
- le entità live non hanno valore e non parte nessun evento della direzione gara.

I dati nascosti non escono mai da Home Assistant: li trattiene l'integrazione, non la
pagina che li copre.

## F1TV e la mappa live

Tutto funziona senza account. Un **abbonamento F1TV** aggiunge una sola cosa: la mappa
live della pista, perché la F1 manda le posizioni delle auto solo agli abbonati. I team
radio non ne hanno bisogno.

Un amministratore aggiunge il token una volta:

1. Dal browser, accedi a F1TV (`f1tv.formula1.com`) con un abbonamento attivo.
2. Apri gli strumenti per sviluppatori del browser (F12) → *Applicazione*
   (*Archiviazione* in Firefox) → *Cookie* → `https://f1tv.formula1.com`.
3. Copia il **valore** del cookie `loginSession`.
4. In Home Assistant: *Impostazioni → Dispositivi e servizi → Pit Lane Live Board →
   Configura*, incollalo in *Token F1TV* e conferma.

Va bene anche il solo token o un'intestazione `Bearer …`. Il token non viene più
mostrato. Si rinnova da solo (ogni pochi giorni); circa una volta al mese la F1 chiude
l'accesso da cui proviene, e un avviso in *Impostazioni → Riparazioni* te ne chiede uno
nuovo — nel frattempo tutto tranne la mappa continua a funzionare. Da *Configura* lo
puoi anche rimuovere.

Dove viene conservato: in `.storage/core.config_entries` di Home Assistant, in chiaro,
come il token di ogni altra integrazione. Non viene mai mandato alla pagina, alle
entità, ai registri o alla diagnostica — solo alla F1.

Il circuito è disegnato dalle posizioni delle auto nell'archivio della F1 di una
sessione precedente sulla stessa pista; per un circuito nuovo viene disegnato dal vivo
dopo il primo giro.

## Entità e automazioni

L'integrazione aggiunge un dispositivo, **Pit Lane Live Board**, con queste entità (i
loro id seguono la lingua di Home Assistant al momento dell'installazione; li trovi
nella pagina del dispositivo):

| Entità | Cosa dice |
|---|---|
| Sessioni (calendario) | Ogni sessione della stagione. |
| Prossima sessione | Inizio della prossima sessione; attributi meeting, session, circuit, round. |
| Stato della sessione | `inactive`, `started`, `aborted`, `finished`, `finalised`. |
| Stato della pista | `clear`, `yellow`, `safety_car`, `virtual_safety_car`, `vsc_ending`, `red_flag`, `chequered`. |
| Giro | Giro in corso; attributo `total_laps`. |
| Sessione in corso | Acceso mentre una sessione è in corso. |
| Direzione gara (evento) | `green_flag`, `yellow_flag`, `safety_car`, `virtual_safety_car`, `vsc_ending`, `red_flag`, `chequered_flag`, `session_started`, `session_ended`. |
| Modalità senza spoiler | Interruttore. |
| Ritardo TV | Secondi di ritardo. |
| F1TV | Stato di F1TV (diagnostica). |

Le entità live seguono il ritardo TV, diventano non disponibili quando il flusso si
perde e tacciono in modalità senza spoiler.

Negli esempi qui sotto gli id sono quelli di un'installazione in inglese: sostituiscili
con i tuoi.

**Una notifica 15 minuti prima della gara** — il trigger del calendario pensa ai tempi:

```yaml
alias: Gara tra 15 minuti
triggers:
  - trigger: calendar
    event: start
    offset: "-0:15:0"
    entity_id: calendar.pit_lane_live_board_sessions
conditions:
  - condition: template
    value_template: "{{ trigger.calendar_event.summary.endswith('Gara') }}"
actions:
  - action: notify.mobile_app_mio_telefono
    data:
      message: "{{ trigger.calendar_event.summary }} inizia tra 15 minuti"
```

**Luci che seguono la pista:**

```yaml
alias: Le luci seguono lo stato della pista
triggers:
  - trigger: state
    entity_id: sensor.pit_lane_live_board_track_status
actions:
  - choose:
      - conditions: "{{ trigger.to_state.state in ['yellow', 'safety_car', 'virtual_safety_car', 'vsc_ending'] }}"
        sequence:
          - action: light.turn_on
            target: { entity_id: light.soggiorno }
            data: { color_name: yellow }
      - conditions: "{{ trigger.to_state.state == 'red_flag' }}"
        sequence:
          - action: light.turn_on
            target: { entity_id: light.soggiorno }
            data: { color_name: red }
      - conditions: "{{ trigger.to_state.state == 'clear' }}"
        sequence:
          - action: light.turn_on
            target: { entity_id: light.soggiorno }
            data: { color_name: green }
```

**Qualcosa di speciale per la bandiera rossa**, dall'evento della direzione gara:

```yaml
alias: Bandiera rossa
triggers:
  - trigger: state
    entity_id: event.pit_lane_live_board_race_control
conditions:
  - condition: state
    entity_id: event.pit_lane_live_board_race_control
    attribute: event_type
    state: red_flag
actions:
  - action: notify.mobile_app_mio_telefono
    data:
      message: Bandiera rossa!
```

## Risoluzione dei problemi

**La pagina Live dice "Nessuna sessione in corso" durante una sessione.** La
connessione si apre 30 minuti prima dell'orario previsto: controlla l'orario nella
pagina Calendario. Se una sessione è in corso e la pagina aspetta ancora dopo un paio
di minuti, guarda *Impostazioni → Riparazioni* e la diagnostica dell'integrazione
(*Dispositivi e servizi → Pit Lane Live Board → ⋮ → Scarica diagnostica*):
`live.last_error` dice cosa non va.

**"Tempi live non raggiungibili" in Riparazioni.** Tre finestre di sessione di fila si
sono chiuse senza connessione. O questo Home Assistant non raggiunge
`livetiming.formula1.com`, o la F1 ha cambiato il flusso. Calendario, risultati e
classifiche continuano a funzionare; guarda le issue del progetto per le novità.

**"F1TV ha bisogno di un nuovo token" in Riparazioni.** L'accesso mensile alla F1 è
scaduto o la F1 ha rifiutato il rinnovo: incolla un nuovo token (vedi
[F1TV](#f1tv-e-la-mappa-live)).

**Niente mappa.** Serve F1TV, e la F1 deve mandare le posizioni per quella sessione;
la scheda dice quale delle due manca.

**Una scheda dice che l'archivio della F1 non ha il dettaglio.** Alcune sessioni
mancano semplicemente dall'archivio della F1, e prima del 2018 non c'è niente.

**"La fonte dei dati non ha risposto."** Jolpica (risultati, classifiche, calendario)
potrebbe essere occupata; l'integrazione si limita anche da sola a 200 richieste
all'ora. Riprova tra un minuto: quello che era già stato caricato arriva dalla cache.

**L'elenco dei team radio è vuoto.** La F1 pubblica una selezione dei messaggi, e per
alcune sessioni nessuno.

## Domande frequenti

**È ufficiale?** No. Legge il live timing pubblico e l'archivio della F1 come farebbe
un singolo spettatore, e il database dei risultati di Jolpica-F1, per uso personale e
non commerciale. Entrambi possono cambiare o fermarsi senza preavviso.

**Costa qualcosa?** No. F1TV è facoltativo e serve solo per la mappa live.

**È davvero in diretta?** Quanto il sito dei tempi della F1. Usa il ritardo TV per
allinearti al tuo schermo.

**Quanti dati consuma?** Una sessione live qualche kilobyte al secondo. Aprire il
dettaglio di una gara dal 2018 scarica qualche megabyte una volta sola. Tutto il resto
è piccolo e in cache.

**Funziona su un Raspberry Pi?** Sì: nessuna libreria pesante, e fuori dalle finestre
di sessione controlla solo il calendario.

**Perché niente foto dei piloti o loghi delle squadre?** Appartengono alla F1 e alle
squadre. I piloti sono indicati con la sigla di tre lettere, il numero, il nome e il
colore della squadra.

**Posso rivedere una vecchia gara giro per giro, come se fosse live?** No: lo storico
mostra i risultati e il dettaglio di ogni giro, non un replay.
