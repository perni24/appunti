---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - moduli
  - manutenibilita
aliases:
  - Moduli piccoli
  - Small modules
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Organizzazione dei file]]"
  - "[[Programmazione/Clean Code/Pagine/Confini tra moduli]]"
  - "[[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]"
title: Moduli piccoli
---

# Moduli piccoli

## Sintesi

Un modulo è abbastanza piccolo quando il suo chiamante può usarlo senza conoscere le decisioni interne. La misura utile non è quante righe contiene, ma che cosa devi capire e modificare per cambiare **una regola**. Un modulo può occupare più file.

## Esempio: nascondere il listino, non la tariffa

Il checkout ha bisogno di un costo in centesimi per un peso in grammi, non di conoscere gli scaglioni. In questo esempio i pacchi fino a 500 g inclusi costano 390 centesimi; quelli più pesanti 590. Il file `rates.mjs` esporta una sola funzione:

```js
const lightLimitGrams = 500;

export function shippingFeeCents(weightGrams) {
  if (!Number.isSafeInteger(weightGrams) || weightGrams <= 0) {
    throw new RangeError("Peso atteso in grammi interi positivi");
  }
  return weightGrams <= lightLimitGrams ? 390 : 590;
}
```

Con 500 g il risultato è 390, con 501 g è 590; zero è un errore, non una spedizione gratuita. Se domani arriva un terzo scaglione, si può usare una tabella interna mantenendo la firma. Il cambio di prezzo è comunque un cambiamento di comportamento: aggiorna i test in base al nuovo requisito.

## Cosa tenere insieme

| Dentro il modulo delle tariffe | Fuori |
| --- | --- |
| Significato dell'unità, validazione del peso e selezione dello scaglione | Conversione del testo di un form in un numero |
| Listino e test sui suoi confini | Salvataggio dell'ordine, invio di notifiche e formato di stampa del prezzo |

Dieci funzioni esportate per leggere e combinare i singoli scaglioni sposterebbero la decisione sui chiamanti. Al contrario, un solo file `order-utils` che calcola prezzi, invia email e genera report costringerebbe a dipendere da operazioni non correlate. Una facciata stretta è utile solo se evita davvero al chiamante di conoscere i dettagli.

## Limiti ed errori comuni

Non estrarre un modulo per ogni costante. Se due parti si importano a vicenda per ogni operazione, la divisione ha probabilmente aggiunto passaggi senza ridurre l'accoppiamento. Cerca un confine nel quale la sostituzione dell'implementazione lasci invariati i chiamanti e i test del contratto.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Organizzazione dei file|Organizzazione dei file]]
- [[Programmazione/Clean Code/Pagine/Confini tra moduli|Confini tra moduli]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]

## Fonti

- Robert C. Martin, *Clean Code*
- David Parnas, [On the Criteria To Be Used in Decomposing Systems into Modules](https://doi.org/10.1145/361598.361623)
