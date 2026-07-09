---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, errori, standard-library]
aliases: [Gestione esplicita degli errori, Explicit error handling]
prerequisites: [Errori recuperabili e non recuperabili, Contratti impliciti ed espliciti]
related: [Eccezioni vs valori di errore, Messaggi di errore utili, Logging leggibile]
---

# Gestione esplicita degli errori

## Sintesi

La **gestione esplicita degli errori** rende visibili i casi di fallimento nel flusso del codice.

Invece di trattare gli errori come dettagli secondari, il codice pulito li considera parte del contratto di funzioni, moduli e integrazioni.

## Quando usarlo

- Quando una funzione puo fallire per input non valido.
- Quando una dipendenza esterna puo non rispondere.
- Quando il chiamante deve decidere come reagire.
- Quando il fallimento e previsto dal dominio.
- Quando serve distinguere errori recuperabili e non recuperabili.

## Come funziona

La forma concreta dipende dal linguaggio:

- eccezioni;
- valori di ritorno;
- `Result` / `Either`;
- codici errore;
- oggetti errore strutturati;
- validazioni accumulate.

La regola pratica e non nascondere il fallimento. Se il chiamante deve gestirlo, deve poterlo vedere.

## API / Sintassi

```text
operation(input) -> success value
operation(input) -> error value
operation(input) throws error
```

La cosa importante e che il contratto dichiari chiaramente quale comportamento aspettarsi.

## Esempio pratico

```js
function parseAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "invalid_amount" };
  }

  return { ok: true, value: amount };
}
```

Il chiamante deve gestire esplicitamente il caso `ok: false`.

## Varianti

- Eccezioni: adatte a errori inattesi o flussi in cui il fallimento interrompe l'operazione.
- Valori di errore: adatti a errori previsti e recuperabili.
- Validazione accumulata: utile quando bisogna mostrare piu errori insieme.
- Errori tipizzati: utili quando il chiamante deve distinguere molte cause.

## Errori comuni

- Catturare errori e restituire valori fittizi.
- Mescolare eccezioni e valori di errore senza convenzione.
- Perdere la causa originale dell'errore.
- Loggare e rilanciare in ogni layer.
- Usare messaggi generici senza contesto.

## Checklist

- Il chiamante sa che l'operazione puo fallire?
- Gli errori recuperabili sono distinguibili?
- Il messaggio contiene contesto utile?
- Gli errori non recuperabili falliscono in modo visibile?
- I test coprono almeno un caso di errore significativo?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Errori recuperabili e non recuperabili]]
- [[Eccezioni vs valori di errore]]
- [[Messaggi di errore utili]]
- [[Logging leggibile]]

## Fonti

- Robert C. Martin, *Clean Code*
- Michael Nygard, *Release It!*
- Scott Wlaschin, *Domain Modeling Made Functional*
