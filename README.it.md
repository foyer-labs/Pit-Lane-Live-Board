<h1 align="center">Pit Lane Live Board</h1>

<p align="center"><em>La Formula 1 nella barra laterale di Home Assistant: la classifica live con i tempi, il calendario, ogni gara dal 1950 e i due campionati, in una pagina già pronta.</em></p>

<p align="center"><a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/README.md">English</a> · <strong>Italiano</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/stato-in%20progettazione-orange" alt="Stato: in progettazione">
  <img src="https://img.shields.io/badge/Home%20Assistant-2026.6%2B-41BDF5" alt="Home Assistant 2026.6 o successivo">
  <img src="https://img.shields.io/badge/HACS-repository%20personalizzato-41BDF5" alt="Repository personalizzato HACS">
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/LICENSE"><img src="https://img.shields.io/badge/licenza-Apache--2.0-blue" alt="Apache-2.0"></a>
</p>

> **Stato: in progettazione.** Non c'è ancora una release e niente di quello che segue si
> può installare oggi. Questa pagina descrive cosa farà la prima versione; lo dirà
> chiaramente man mano che ogni parte diventa reale.

Le altre integrazioni di Formula 1 ti danno dei sensori, e la dashboard poi la costruisci
tu. Pit Lane Live Board ti dà la dashboard: la installi, apri **Live Board** nella barra
laterale e c'è tutto il weekend — la classifica live durante la sessione, il calendario
prima, risultati e classifiche dopo.

## Cosa ottieni

- **La classifica live con i tempi.** Posizione, distacco dal primo e dall'auto davanti,
  ultimo e miglior giro, i tre settori in viola e in verde, la gomma di ogni pilota e da
  quanti giri la usa, i pit stop, le posizioni guadagnate o perse dalla partenza.
- **Qualifiche e prove libere come si deve.** Q1, Q2 e Q3 con la zona di eliminazione,
  migliori giri e distacchi dalla pole.
- **Direzione gara e meteo.** Bandiere, safety car, virtual safety car, bandiere rosse,
  penalità e tutti i messaggi dei commissari; temperatura dell'aria e dell'asfalto, vento
  e pioggia.
- **Team radio.** I messaggi che la F1 pubblica durante la sessione, con un pulsante
  per ascoltarli accanto a ogni pilota.
- **La mappa della pista in diretta**, con un abbonamento F1TV. Tutte le auto sul
  circuito, nel colore della loro squadra. Tutto il resto funziona senza account.
- **In sincronia con la TV.** Lo streaming arriva dopo i tempi live. Imposti un ritardo
  fino a due minuti e la pagina, i team radio e le tue automazioni aspettano il tuo schermo.
- **Niente spoiler.** Guardi la gara più tardi? Attivi la modalità senza spoiler e i
  risultati del weekend restano nascosti finché non li scopri tu.
- **Il calendario.** Ogni sessione della stagione nel tuo fuso orario, con il conto alla
  rovescia per la prossima.
- **Ogni gara dal 1950.** Risultati, qualifiche e sprint di qualunque stagione; per l'era
  moderna anche grafico delle posizioni, strategie gomme, tempi sul giro, pit stop e
  direzione gara.
- **I due campionati.** Piloti e costruttori, di qualunque stagione, dopo qualunque gara.
- **Automazioni.** Un calendario delle sessioni, lo stato della pista e un evento della
  direzione gara: le luci diventano gialle con la safety car e il telefono ti avvisa che
  la gara parte tra 15 minuti.
- **Italiano e inglese**, tema chiaro e scuro, sul telefono o su un tablet a parete.

## Per iniziare

*Non ancora disponibile: questi sono i passi che avrà la prima release.*

1. In HACS aggiungi questo repository come *Repository personalizzato* (categoria
   *Integrazione*), installa *Pit Lane Live Board* e riavvia Home Assistant.
2. *Impostazioni → Dispositivi e servizi → Aggiungi integrazione → Pit Lane Live Board.*
3. Apri **Live Board** nella barra laterale. Per la mappa live, aggiungi il token F1TV in
   *Configura* (la guida spiega come).

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

In progettazione. La [specifica](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/develop/docs/SPEC.md)
(in inglese) descrive ogni parte e l'ordine in cui viene costruita. Le versioni saranno
release GitHub, proposte da HACS per numero di versione, con un
[changelog](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md) che mette
per primo quello che richiede un tuo intervento.

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
