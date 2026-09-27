<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/custom_components/pit_lane_live_board/brand/icon.png" alt="Pit Lane Live Board" width="112">
</p>

<h1 align="center">Pit Lane Live Board</h1>

<p align="center"><em>La Formula 1 nella barra laterale di Home Assistant: la classifica live con i tempi, il calendario, ogni gara dal 1950 e i due campionati, in una pagina già pronta.</em></p>

<p align="center"><a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/README.md">English</a> · <strong>Italiano</strong> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.it.md">📖 Guida</a> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md">Novità</a></p>

<p align="center">
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/releases"><img src="https://img.shields.io/github/v/release/foyer-labs/Pit-Lane-Live-Board?sort=semver&include_prereleases&label=versione" alt="Ultima versione"></a>
  <img src="https://img.shields.io/badge/Home%20Assistant-2026.6%2B-41BDF5" alt="Home Assistant 2026.6 o successivo">
  <img src="https://img.shields.io/badge/HACS-repository%20personalizzato-41BDF5" alt="Repository personalizzato HACS">
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/LICENSE"><img src="https://img.shields.io/badge/licenza-Apache--2.0-blue" alt="Apache-2.0"></a>
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/actions/workflows/ci.yml"><img src="https://github.com/foyer-labs/Pit-Lane-Live-Board/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
</p>

Le altre integrazioni di Formula 1 ti danno dei sensori, e la dashboard poi la costruisci
tu. Pit Lane Live Board ti dà la dashboard: la installi, apri **Live Board** nella barra
laterale e c'è tutto il weekend — la classifica live durante la sessione, il calendario
prima, risultati e classifiche dopo. Gratis e senza account.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/live.it.png" alt="La pagina Live durante una gara: la classifica con distacchi, settori in viola e verde e gomme, la mappa della pista, la direzione gara e i team radio" width="900">
</p>

## Cosa ottieni

- **La classifica live con i tempi.** Posizione, distacco dal primo e dall'auto davanti,
  ultimo e miglior giro, i tre settori in viola e in verde, la gomma di ogni pilota e da
  quanti giri la usa, i pit stop, le posizioni guadagnate o perse dalla partenza.
- **Qualifiche come si deve.** Q1, Q2 e Q3 con la linea di eliminazione, migliori giri e
  distacchi.
- **Bandiere e commissari a colpo d'occhio.** Lo stato della pista, i settori in giallo,
  la safety car e il suo ultimo giro, ogni penalità (un `+5s` accanto al pilota finché non
  la sconta), gli incidenti sotto investigazione e i giri cancellati, in un'unica scheda
  sopra la classifica.
- **Direzione gara e meteo.** Tutti i messaggi della direzione gara, filtrabili per
  bandiere o penalità; temperatura dell'aria e dell'asfalto, vento e pioggia.
- **Team radio.** I messaggi che la F1 pubblica durante la sessione, con un pulsante per
  ascoltarli.
- **La mappa della pista in diretta**, con un abbonamento F1TV. Tutte le auto sul
  circuito, nel colore della loro squadra. Tutto il resto funziona senza account.
- **In sincronia con la TV.** Lo streaming arriva dopo i tempi live. Imposti un ritardo
  fino a due minuti e la pagina, i team radio e le tue automazioni aspettano il tuo schermo.
- **Niente spoiler.** Guardi la gara più tardi? La modalità senza spoiler tiene dentro
  Home Assistant i risultati del weekend finché non li scopri tu.
- **Il calendario.** Ogni sessione della stagione nel tuo fuso orario, il conto alla
  rovescia per la prossima, il podio di ogni weekend già corso.
- **Ogni gara dal 1950.** Risultati, qualifiche e sprint di qualunque stagione; per l'era
  moderna anche posizioni giro per giro, strategie gomme, tempi sul giro, pit stop,
  direzione gara e meteo.
- **I due campionati.** Piloti e costruttori, di qualunque stagione, dopo qualunque gara.
- **Dopo la bandiera a scacchi.** Tra una sessione e l'altra la pagina Live conserva la
  classifica finale, le decisioni dei commissari e i pit stop, con il conto alla rovescia
  per la sessione successiva.
- **Automazioni.** Un calendario delle sessioni, lo stato della pista, sensori per
  safety car, VSC, bandiera rossa e gialla, penalità e investigazioni, ed eventi per la
  direzione gara e per ogni decisione dei commissari: le luci diventano gialle con la
  safety car, il telefono ti avvisa che il tuo pilota è stato penalizzato o che la gara
  parte tra 15 minuti.
- **Leggero anche su un Raspberry Pi.** I tempi live partono in pausa: niente si collega
  a F1 e niente viene scritto su disco finché non premi play, o finché non li lasci
  partire da soli a ogni sessione.
- **Card per le tue plance.** Classifica live, mappa, bandiere e commissari, team radio,
  direzione gara, sessione, meteo e campionato, ognuna una card con editor visuale,
  già pronta nel selettore delle card senza installare niente.
- **Decidi tu chi lo vede.** Il pannello è per tutta la casa o solo per gli
  amministratori; ogni plancia mantiene la sua visibilità.
- **Italiano e inglese**, tema chiaro e scuro, sul telefono o su un tablet a parete.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/strategy.it.png" alt="Risultati: la strategia gomme di ogni pilota in una gara, stint colorati per mescola" width="820">
</p>

## Per iniziare

Ti servono Home Assistant 2026.6 o successivo e HACS.

1. In HACS aggiungi questo repository come *Repository personalizzato* (categoria
   *Integrazione*), scarica *Pit Lane Live Board* e riavvia Home Assistant.
2. *Impostazioni → Dispositivi e servizi → Aggiungi integrazione → Pit Lane Live Board.*
3. Apri **Live Board** nella barra laterale, apri le **Impostazioni** (l'ingranaggio) e
   premi play, oppure attiva *Avvia automaticamente a ogni sessione*. Calendario,
   risultati e classifiche funzionano anche senza.

Per la mappa live, un amministratore incolla un token F1TV nelle **Impostazioni** del
pannello; la
**[guida](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.it.md)**
spiega dove trovarlo, come leggere la classifica live, come impostare il ritardo TV, e
propone automazioni pronte.

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
- **F1TV è facoltativo.** Serve solo per la mappa live. Il token resta nel tuo Home
  Assistant e si rinnova da solo; circa una volta al mese ne incolli uno nuovo.
- **I team radio li sceglie la F1.** In alcune sessioni sono pochi, in altre nessuno.

## Stato

In uso e rilasciato per versioni. Ogni versione è una release GitHub, proposta da HACS
per numero di versione, e il [changelog](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md)
dice cosa cambia, mettendo per primo quello che richiede un tuo intervento.

## Aiuto, contributi e licenza

Issue e pull request sono benvenute e ricevono risposta al meglio delle possibilità,
senza garanzia di una risposta né di una correzione
([SUPPORT.it.md](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/SUPPORT.it.md),
[CONTRIBUTING.md](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CONTRIBUTING.md)).
Pit Lane Live Board è il progetto personale e non commerciale di una persona, pubblicato
come Foyer Labs; non c'è una società dietro.

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
