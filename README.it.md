<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/custom_components/pit_lane_live_board/brand/icon.png" alt="Pit Lane Live Board" width="112">
</p>

<h1 align="center">Pit Lane Live Board</h1>

<p align="center"><strong>Porta il tuo Home Assistant al muretto box.</strong></p>

<p align="center"><em>Una pagina di Formula 1 già pronta nella barra laterale: la classifica live con i tempi, bandiere e commissari, la gara del tuo pilota, il calendario e ogni risultato dal 1950. Gratis, senza account, niente da costruire.</em></p>

<p align="center"><a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/README.md">English</a> · <strong>Italiano</strong> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.it.md">📖 Guida</a> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md">Novità</a></p>

<p align="center">
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/releases"><img src="https://img.shields.io/github/v/release/foyer-labs/Pit-Lane-Live-Board?sort=semver&include_prereleases&label=versione" alt="Ultima versione"></a>
  <img src="https://img.shields.io/badge/Home%20Assistant-2026.6%2B-41BDF5" alt="Home Assistant 2026.6 o successivo">
  <img src="https://img.shields.io/badge/HACS-repository%20personalizzato-41BDF5" alt="Repository personalizzato HACS">
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/LICENSE"><img src="https://img.shields.io/badge/licenza-Apache--2.0-blue" alt="Apache-2.0"></a>
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/actions/workflows/ci.yml"><img src="https://github.com/foyer-labs/Pit-Lane-Live-Board/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
</p>

<p align="center">
  <a href="https://my.home-assistant.io/redirect/hacs_repository/?owner=foyer-labs&repository=Pit-Lane-Live-Board&category=integration"><img src="https://my.home-assistant.io/badges/hacs_repository.svg" alt="Apri Home Assistant e apri questo repository in HACS"></a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/tv.it.png" alt="La modalità kiosk su una TV, tema scuro: giro 31 di 57, bandiere e commissari, la classifica con distacchi, settori, mini-settori e gomme, la mappa della pista e la direzione gara" width="900">
  <br>
  <sub><em>La modalità kiosk sulla TV del salotto, 45 secondi dietro ai tempi live per andare a tempo con lo streaming. Dati reali del Gran Premio di Spagna 2026; la mappa richiede un abbonamento F1TV.</em></sub>
</p>

<p align="center"><b>Funziona con</b> Home Assistant 2026.6+ · HACS · telefono e tablet · TV e Raspberry Pi in modalità kiosk · ESP32 con ESPHome · italiano e inglese · tema chiaro e scuro</p>

<p align="center"><sub>Progetto non ufficiale di un appassionato, non associato alle società della Formula 1 né alla FIA (avviso completo in fondo).</sub></p>

### Perché i tifosi lo installano

- 🏁 **È già fatto.** Lo installi, apri **Live Board** nella barra laterale e c'è tutto il
  weekend. Niente plance da montare in YAML, niente card da cercare, niente sensori da
  collegare prima.
- 📺 **Aspetta la tua TV.** Lo streaming arriva dopo i tempi live. Imposti un ritardo fino
  a due minuti e la pagina, i team radio *e le tue automazioni* arrivano quando lo vedi
  sullo schermo. Basta spoiler dalla tua stessa plancia.
- 💡 **La casa corre con te.** Il salotto si accende di arancione con la safety car, il
  telefono vibra quando penalizzano il tuo pilota, a fine sessione ti arriva il podio.
- 🆓 **Gratis e senza account.** Solo la mappa live richiede un abbonamento F1TV.

<p align="center"><strong><a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/README.it.md#per-iniziare">→ Pronto in tre passi</a></strong></p>

---

## Più di un mucchio di sensori

I sensori sono il punto di partenza di quasi ogni automazione; la plancia poi te la
costruisci tu. Qui è già pronta — e i sensori ci sono comunque.

| | Partendo dai sensori | Pit Lane Live Board |
|---|---|---|
| Una classifica da guardare | Tocca a te | Nella barra laterale, appena installato |
| A tempo con lo streaming | Tocca a te | Ritardo TV fino a 2 minuti, per la pagina *e* per le automazioni |
| I commissari | Tocca a te | Un evento per ogni decisione: pilota, secondi, motivo |
| Il tuo pilota | Tocca a te | Una ★ in classifica, un sensore per ognuno, un evento quando si ferma, guadagna una posizione o viene penalizzato |
| La gara in differita | Tocca a te | La modalità senza spoiler tiene dentro Home Assistant i risultati del weekend finché non li scopri tu |
| La storia | Tocca a te | Ogni gara dal 1950; posizioni giro per giro e strategie gomme dal 2018 |

E i sensori ci sono comunque: [tanti](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/README.it.md#sensori-ed-eventi-per-le-automazioni).

## Per iniziare

Ti servono **Home Assistant 2026.6 o successivo** e **[HACS](https://hacs.xyz/)**. Per ora
Pit Lane Live Board è un *repository personalizzato* di HACS: ci vuole un minuto.

**1. Aggiungilo a HACS e scaricalo**

<a href="https://my.home-assistant.io/redirect/hacs_repository/?owner=foyer-labs&repository=Pit-Lane-Live-Board&category=integration"><img src="https://my.home-assistant.io/badges/hacs_repository.svg" alt="Apri Home Assistant e apri questo repository in HACS"></a>

Oppure a mano: HACS → ⋮ → *Repository personalizzati* → `https://github.com/foyer-labs/Pit-Lane-Live-Board`,
categoria *Integrazione*. Scarica **Pit Lane Live Board** e **riavvia Home Assistant**.

**2. Aggiungi l'integrazione**

<a href="https://my.home-assistant.io/redirect/config_flow_start/?domain=pit_lane_live_board"><img src="https://my.home-assistant.io/badges/config_flow_start.svg" alt="Apri Home Assistant e inizia la configurazione di Pit Lane Live Board"></a>

Oppure *Impostazioni → Dispositivi e servizi → Aggiungi integrazione → Pit Lane Live
Board*. Non c'è niente da compilare.

**3. Apri Live Board nella barra laterale**

Calendario, risultati e classifiche funzionano subito. **I tempi live partono in pausa**:
premi play nelle **Impostazioni** del pannello (l'ingranaggio), oppure attiva *Avvia
automaticamente a ogni sessione*. Per la mappa live, un amministratore incolla lì anche un
token F1TV ([come](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.it.md#f1tv-e-la-mappa-live)).

Fatto: la prossima sessione è già sulla tua plancia.

## Un weekend di gara, visto dal muretto

**Giovedì.** Chi si trova a casa su questa pista? Lo storico del circuito ordina i piloti
della stagione per **indice di affinità** — come sono andati qui rispetto alla macchina che
avevano quell'anno — con ogni gara passata a un clic: qualifica, arrivo, giro veloce,
penalità.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/circuit-driver.it.png" alt="Storico del circuito di Baku: piloti ordinati per indice di affinità, un pilota aperto su ogni suo anno lì con qualifica, griglia, arrivo, punti, il posto atteso della macchina e le penalità" width="820">
  <br>
  <sub><em>50 = come la macchina. Sopra, il circuito si addice al pilota.</em></sub>
</p>

**Venerdì.** Il calendario mostra ogni sessione nel tuo fuso orario — o nell'ora locale del
circuito, o entrambe affiancate — con il conto alla rovescia per la prossima e il podio di
ogni weekend già corso.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/calendar.it.png" alt="La pagina Calendario: ogni gara della stagione con il suo podio, il weekend in corso e il prossimo evidenziati" width="820">
  <br>
  <sub><em>Tutta la stagione a colpo d'occhio, podi compresi.</em></sub>
</p>

**Sabato.** Le qualifiche come vanno viste: Q1, Q2 e Q3 con la linea di eliminazione,
migliori giri e distacchi, e sotto ogni settore i mini-settori in viola, verde e giallo.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/qualifying.it.png" alt="Le qualifiche nella pagina Live: tempi di Q1, Q2 e Q3, distacchi, settori con i mini-settori, piloti eliminati, investigazioni e limiti della pista" width="820">
  <br>
  <sub><em>Q3, la zona eliminazione e ogni giro cancellato, in un'unica schermata.</em></sub>
</p>

**Domenica, meno 15 minuti.** Un'automazione sul calendario ti scrive sul telefono: *la gara
parte tra 15 minuti*. Senza codice, è una delle automazioni pronte nella guida.

**Spegnimento dei semafori.** Premi play (o lascialo partire da solo a ogni sessione). La
classifica si riempie: posizione, distacco dal primo e dall'auto davanti, ultimo e miglior
giro, i tre settori, la gomma e da quanti giri la usa, i pit stop, le posizioni guadagnate
dalla partenza.

**Il tuo pilota si ferma.** Clicca la sua riga: ogni stint con mescola, giri e giro
migliore, e dove rientrerebbe se si fermasse *adesso*.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/driver.it.png" alt="Un pilota aperto nella classifica: tre stint con mescola, giri e giro migliore, e la stima del pit stop: rientra P9, dietro BOR, davanti a COL" width="900">
  <br>
  <sub><em>"Se si ferma ora: rientra P9." Una stima dal tempo perso tipico ai box su quel circuito, più basso con safety car o VSC.</em></sub>
</p>

**Safety car.** Il sensore scatta e le luci del salotto diventano arancioni finché non
rientra. Bandiera rossa? Rosse. Di nuovo verde? Verdi.

**Cinque secondi di penalità.** Accanto al pilota compare un `+5s` finché non la sconta, e
l'evento dei commissari parte con pilota, secondi e motivo — dritto sul telefono, se vuoi.

**Bandiera a scacchi.** Il riepilogo della sessione arriva sul telefono: podio, giro
veloce, ritiri, penalità e i tuoi piloti — oppure la classifica completa con tutti i tempi.
Con la modalità senza spoiler aspetta che tu scopra la sessione.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/final.it.png" alt="La pagina Live dopo la gara: classifica finale con la bandiera a scacchi, penalità, investigazioni, limiti della pista e il conto alla rovescia per la sessione successiva" width="820">
  <br>
  <sub><em>Dopo la bandiera a scacchi restano l'ordine d'arrivo, le decisioni dei commissari e il conto alla rovescia per la prossima sessione.</em></sub>
</p>

**Lunedì.** Rivivila: posizioni giro per giro, strategie gomme, tempi sul giro, pit stop,
direzione gara e meteo dal 2018; risultati, qualifiche e sprint di ogni stagione
dal 1950; i due campionati dopo qualunque gara.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/lap-chart.it.png" alt="Risultati: le posizioni giro per giro di una gara, ogni pilota nel colore della sua squadra" width="440">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/strategy.it.png" alt="Risultati: la strategia gomme di ogni pilota in una gara, stint colorati per mescola" width="440">
  <br>
  <sub><em>Ogni sorpasso, ogni stint.</em></sub>
</p>

## Tutto quello che c'è

**In diretta**
- **Classifica live** con distacchi, intervalli, ultimo e miglior giro, settori e
  mini-settori nel viola, verde e giallo della F1, gomme e loro età, pit stop, posizioni
  guadagnate o perse.
- **Bandiere e commissari** sopra la classifica: stato della pista, settori in giallo, la
  safety car e il suo ultimo giro, ogni penalità, gli incidenti sotto investigazione, i giri
  cancellati.
- **Direzione gara**, filtrabile per bandiere o penalità, e **meteo**: temperatura
  dell'aria e dell'asfalto, vento, pioggia.
- **Team radio**: i messaggi che la F1 pubblica durante la sessione, con il tasto play.
- **Mappa della pista in diretta**, ogni auto nel colore della squadra — con un
  abbonamento F1TV.
- **I miei piloti**: ne segui fino a cinque, ognuno con la sua ★ in classifica e il suo
  sensore.

**Intorno al weekend**
- **Calendario** nel tuo fuso orario, con il conto alla rovescia; **risultati dal 1950**;
  **i due campionati**, piloti e costruttori, di qualunque stagione.
- **Storico del circuito** con un **indice di affinità**: come va ogni pilota su questa
  pista, al netto della macchina.
- **Modalità senza spoiler** per quando guardi la gara più tardi.
- **Italiano e inglese**, tema chiaro e scuro, sul telefono o su un tablet a parete.

**Fatto per un server di casa**
- **Leggero anche su un Raspberry Pi.** I tempi live partono in pausa: niente si collega a
  F1 e niente di live viene scritto su disco finché non premi play, o finché non li lasci partire
  da soli a ogni sessione.
- **Decidi tu chi lo vede**: tutta la casa, o solo gli amministratori.

## La tua plancia, le tue card

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/cards.it.png" alt="Le card per le plance: sessione, classifica live, bandiere e commissari, mappa, direzione gara, team radio, meteo e classifica piloti" width="900">
  <br>
  <sub><em>Otto card, un editor visuale per ognuna, niente da aggiungere a mano.</em></sub>
</p>

Ogni pezzo della pagina Live è anche una card. *Modifica plancia → Aggiungi card → Pit
Lane*, e la metti dove vuoi:

| Card | Cosa mostra |
|---|---|
| **Classifica live** | Posizioni, distacchi, tempi, settori e gomme; scegli righe e colonne, evidenzia il tuo pilota. |
| **Mappa della pista** | Tutte le auto sul circuito, in diretta (con F1TV). |
| **Bandiere e commissari** | Stato della pista, settori in giallo, safety car, penalità, investigazioni, limiti della pista. |
| **Team radio** | Gli ultimi messaggi, con play. |
| **Direzione gara** | Gli ultimi messaggi, filtrabili per bandiere o penalità. |
| **Sessione** | La sessione, il giro o il tempo e lo stato della pista; dopo, il conto alla rovescia per la prossima. |
| **Meteo** | Temperatura dell'aria e dell'asfalto, pioggia, umidità, vento. |
| **Campionato** | Classifica piloti o costruttori, primi N. |

Le card seguono lo stesso ritardo TV e la stessa modalità senza spoiler del pannello. Un
tablet a parete con classifica e bandiere, il telefono con solo la sessione e il tuo
pilota: [la guida](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.it.md#card-per-le-plance)
ha degli esempi.

## Su ogni schermo di casa

| | |
|---|---|
| 📺 **TV o monitor** | Aggiungi `?kiosk` all'indirizzo del pannello e occupa tutto lo schermo, con il puntatore che sparisce quando è fermo; `&scale=1.3` lo rende leggibile dal divano. Su un Raspberry Pi basta una riga `chromium --kiosk`. |
| 📱 **Telefono** | La stessa pagina, impaginata per uno schermo stretto. |
| 🔌 **ESP32 o e-paper** | Il sensore facoltativo **Schermo piccolo** passa a ESPHome il giro, lo stato della pista (con un colore per un anello di LED), i primi dieci e i tuoi piloti, già pronti da stampare. [Esempio ESPHome](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.it.md#schermi-dedicati). |

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/phone.it.png" alt="La pagina Live sul telefono: stato della pista, penalità e investigazioni come etichette, e la classifica con distacco, ultimo giro e gomma" width="300">
  <br>
  <sub><em>Sul telefono, durante la gara.</em></sub>
</p>

## Sensori ed eventi per le automazioni

| Entità | Per cosa usarla |
|---|---|
| `binary_sensor` Safety car · Virtual safety car · Bandiera rossa · Bandiera gialla | Luci che seguono la pista: arancioni con la safety car, rosse con la bandiera rossa. |
| `sensor` Stato della pista · Stato della sessione · Giro | Lo stato della sessione, in qualsiasi card o condizione. |
| `sensor` Penalità · Investigazioni · Messaggio della direzione gara | Cosa stanno guardando i commissari, con i dettagli negli attributi. |
| `event` Direzione gara | Bandiera verde, gialla, safety car, VSC, rossa, a scacchi, inizio e fine sessione. |
| `event` Commissari | Un evento per ogni decisione: penalità in tempo, drive-through, investigazione, ammonizione, giro cancellato… con pilota, secondi e motivo. |
| `sensor` Pilota LEC · `event` I miei piloti | Fino a cinque piloti che segui: posizione, distacco, gomme e soste, e un evento quando guadagnano una posizione, passano in testa, si fermano, fanno il giro veloce o vengono penalizzati. |
| `event` Riepilogo della sessione | Podio, giro veloce, penalità e i tuoi piloti a fine sessione — anche sui tuoi telefoni, se vuoi. |
| `calendar` Sessioni · `sensor` Prossima sessione | "La gara parte tra 15 minuti", senza codice. |
| `switch` Tempi live · Modalità senza spoiler · `number` Ritardo TV | Comanda il pannello dalle tue automazioni e dall'assistente vocale. |

Tutto passa attraverso il ritardo TV, quindi le luci cambiano quando lo mostra il *tuo*
schermo. Automazioni pronte — luci della safety car, bandiera rossa, gara tra 15 minuti,
penalità per il tuo pilota — [nella guida](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.it.md#entità-e-automazioni):

```yaml
triggers:
  - trigger: state
    entity_id: event.pit_lane_live_board_stewards
conditions:
  - "{{ 'LEC' in trigger.to_state.attributes.drivers }}"
actions:
  - action: notify.mobile_app_mio_telefono
    data:
      message: "Penalità per Leclerc: {{ trigger.to_state.attributes.reason }}"
```

## Documentazione

| | |
|---|---|
| [Guida](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.it.md) | Installazione, impostazioni, le quattro pagine, leggere la classifica live, bandiere e commissari, ritardo TV, modalità senza spoiler, F1TV, card per le plance, entità e automazioni, problemi, domande frequenti |
| [Novità](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md) | Cosa cambia in ogni versione (in inglese) |
| [Aiuto](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/SUPPORT.it.md) | Come chiedere aiuto e segnalare un problema |

## Da sapere

- **I dati non sono ufficiali.** I tempi live e l'archivio delle sessioni sono i flussi
  che la F1 usa sul proprio sito: non sono documentati e possono cambiare o smettere di
  funzionare senza preavviso. Risultati e classifiche arrivano da
  [Jolpica-F1](https://github.com/jolpica/jolpica-f1). Il progetto li legge come farebbe
  un singolo spettatore, con una cache, per uso personale e non commerciale.
- **I tempi live partono in pausa.** Premi play nelle Impostazioni del pannello, oppure
  attiva *Avvia automaticamente a ogni sessione*. Calendario, risultati e classifiche
  funzionano anche senza.
- **F1TV è facoltativo.** Serve solo per la mappa live. Il token resta nel tuo Home
  Assistant e si rinnova da solo; circa una volta al mese ne incolli uno nuovo.
- **I team radio li sceglie la F1.** In alcune sessioni sono pochi, in altre nessuno.
- **La stima del pit stop è una stima**, basata sul tempo perso tipico ai box su quel
  circuito.
- **Non è un video.** Mostra i dati dei tempi, non la gara: usa il ritardo TV per andare a
  tempo con il tuo streaming.
- **Il dettaglio giro per giro parte dal 2018**, con l'archivio della F1, che ha dei buchi.
- **Niente foto dei piloti né loghi delle squadre.** Appartengono alla F1 e alle squadre: i
  piloti sono indicati con sigla, numero, nome e colore della squadra.

## Stato del progetto

**Giovane e in rapida evoluzione (0.x)**, con novità ogni pochi giorni. Qualcosa non
torna, o hai un'idea? [Apri una issue](https://github.com/foyer-labs/Pit-Lane-Live-Board/issues).

Ogni versione è una release GitHub proposta da HACS per numero di versione; il
[changelog](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md) mette
per primo quello che richiede un tuo intervento.

## Aiuto, contributi e licenza

Issue e pull request sono benvenute e ricevono risposta al meglio delle possibilità,
senza garanzia di una risposta né di una correzione
([SUPPORT.it.md](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/SUPPORT.it.md),
[CONTRIBUTING.md](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CONTRIBUTING.md)).
Pit Lane Live Board è il progetto personale e non commerciale di una persona, pubblicato
come Foyer Labs; non c'è una società dietro.

Se ti ha reso più bello il weekend di gara, un caffè lo aiuta ad andare avanti:

<p align="center">
  <a href="https://www.buymeacoffee.com/foyerlabs" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-green.png" alt="Buy Me a Coffee" height="60"></a>
</p>

Una donazione è un ringraziamento e non compra né supporto né priorità.

Apache-2.0. Vedi [LICENSE](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/LICENSE)
e [NOTICE](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/NOTICE).
Dati di risultati e classifiche: Jolpica-F1, [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

---

<sub>Pit Lane Live Board non è ufficiale e non è in alcun modo associato alle società della
Formula 1. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX e i
marchi correlati sono marchi di Formula One Licensing B.V.</sub>
