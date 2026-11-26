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
  - oop
  - design
aliases:
  - Tell Don't Ask
  - Tell Dont Ask
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Incapsulamento]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Oggetti con responsabilita chiara]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Law of Demeter]]"
title: Tell Don't Ask
---

# Tell Don't Ask

## Sintesi

**Tell Don't Ask** invita a chiedere all'oggetto di **compiere una decisione che gli appartiene**, invece di leggerne lo stato, duplicare la sua regola e riscriverlo dal chiamante. Non significa «non fare mai domande»: una schermata può legittimamente leggere lo stato per mostrarlo.

## Esempio: chi decide se un ordine può diventare pagato?

Immagina un controller che legga `order.status` e il totale, e assegni `"paid"` se lo stato è `"draft"` e il totale è positivo. Un job che gestisce lo stesso evento deve ripetere la regola. In più, un `if` senza `else` ignora l'ordine non pagabile: trasformarlo in un comando che lancia un errore **cambia il contratto**, non è una semplice rinomina.

Supponiamo di avere scelto il contratto di [[Programmazione/Clean Code/Pagine/Incapsulamento|Order]]: il comando registra una conferma già verificata e segnala i rifiuti. Il gestore riceve l'ordine corretto e non deve poter assegnare lo stato:

```ts
type PayableOrder = { markAsPaid(reference: string): void };

function recordConfirmation(order: PayableOrder, reference: string): void {
  order.markAsPaid(reference);
}
```

Il frammento rappresenta il punto di chiamata: non è necessario creare un wrapper se il gestore può chiamare direttamente il metodo. È `Order`, non `recordConfirmation`, a rifiutare totale zero, riferimento vuoto o una seconda conferma. Il chiamante riceve l'errore e può tradurlo nel risultato opportuno. Se invece una notifica ripetuta deve essere accettata senza effetto, va progettato e verificato esplicitamente quel comportamento.

## Comando o lettura?

| Esigenza | Scelta |
| --- | --- |
| Mostrare «bozza» oppure «pagato» | Leggere lo stato. Una proiezione o un DTO va bene. |
| Disabilitare un pulsante in anteprima | Una query può orientare la UI; il comando deve ricontrollare comunque la regola. |
| Registrare la conferma | Inviare il comando all'ordine; non usare una sequenza di getter e setter. |
| Contattare un provider o coordinare più ordini | Lasciare l'orchestrazione al caso d'uso: non aggiungere dipendenze di rete all'oggetto per evitare un `if`. |

## Limiti

La domanda utile è «la decisione è finita lontano dai dati che la governano?». Una query che restituisce un risultato di dominio può essere una buona API. Tell Don't Ask parla di **dove si decide**; la Law of Demeter riguarda soprattutto **quali collaboratori e strutture interne** il chiamante deve conoscere.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/Clean Code/Pagine/Oggetti con responsabilita chiara|Oggetti con responsabilita chiara]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Law of Demeter|Law of Demeter]]
- [[Programmazione/Clean Code/Pagine/Data objects e behavior objects|Data objects e behavior objects]]

## Fonti

- Martin Fowler, [Tell Dont Ask](https://martinfowler.com/bliki/TellDontAsk.html) e *Anemic Domain Model*
- The Pragmatic Programmers, *Tell, Don't Ask*
