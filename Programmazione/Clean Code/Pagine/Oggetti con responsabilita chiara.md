---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - oggetti
  - responsabilita
aliases:
  - Oggetti con responsabilita chiara
  - Responsabilita degli oggetti
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Data objects e behavior objects]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola]]"
title: Oggetti con responsabilita chiara
---

# Oggetti con responsabilita chiara

## Sintesi

Una responsabilità è chiara quando si può dire **quale decisione appartiene all'oggetto** e quali cambiamenti non dovrebbero riguardarlo. Conta la coesione delle decisioni, non il numero di metodi. Due operazioni come prenotare e liberare un posto possono stare bene insieme se proteggono la stessa disponibilità.

## Esempio: scomporre un UserManager

Immagina un `UserManager` che valida iscrizioni, salva utenti, invia email, calcola sconti e prepara report. Rinominare la classe non riduce l'accoppiamento. Prova invece a seguire tre richieste di modifica: cambiare il testo del benvenuto, passare a un altro database, riservare uno sconto ai clienti abituali. Quale contratto ciascuna modifica deve lasciare intatto?

| Componente | Decisione che possiede | Dettaglio che non deve conoscere |
| --- | --- | --- |
| `UserRegistration` | Quali passi servono per completare l'iscrizione e in quale ordine | Il testo dell'email o la sintassi SQL |
| `UserRepository` | Come salvare e ritrovare un utente | Quando il prodotto considera conclusa l'iscrizione |
| `WelcomeEmailSender` | Come comporre e inviare il benvenuto | Come calcolare lo sconto |
| `DiscountPolicy` | Quali clienti hanno diritto allo sconto | Il formato del report |
| `UserReport` | Quali dati mostrare e come presentarli | Una seconda implementazione della regola di sconto |

## Verifica pratica

Se cambia l'aliquota, una prova della politica dovrebbe usare solo i dati rilevanti del cliente, senza database o server email. Se cambia il fornitore di posta, verifica il nuovo adattatore e il contratto di invio; non dovrebbero cambiare le regole di iscrizione. Se invece il prodotto decide che un invio fallito **non deve più bloccare** l'iscrizione, è cambiata la politica del caso d'uso: non nascondere la scelta nel mittente facendo sparire l'errore.

## Limiti ed errori comuni

La tabella è una mappa delle responsabilità, non una prescrizione di cinque classi, interfacce o servizi distribuiti. Per un'applicazione piccola possono bastare funzioni nello stesso modulo. Separale quando puoi nominare una decisione autonoma o provarla senza infrastrutture estranee; tenerle vicine è ragionevole se cambiano sempre insieme. Un nome come `Manager` è un invito a porre la domanda, non la prova di un problema.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Data objects e behavior objects|Data objects e behavior objects]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]
- [[Programmazione/Clean Code/Pagine/Manutenibilita del codice|Manutenibilita del codice]]

## Fonti

- Rebecca Wirfs-Brock, *Object Design*; Eric Evans, *Domain-Driven Design*
- Robert C. Martin, [The Single Responsibility Principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html)
