---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, validazione, confini]
aliases: [Validazione ai confini, Boundary validation]
prerequisites: [Contratti impliciti ed espliciti]
related: [Messaggi di errore utili, Modellazione del dominio, Guard clauses]
---

# Validazione ai confini

## Sintesi

La **validazione ai confini** consiste nel controllare dati esterni appena entrano nel sistema.

Un confine puo essere una API HTTP, un form, un file, una coda, una CLI, un database o una chiamata tra moduli con responsabilita diverse.

## Problema che risolve

Se dati non affidabili attraversano il sistema senza controllo, ogni funzione interna deve difendersi da tutto.

Questo produce:

- controlli duplicati;
- errori lontani dalla causa;
- messaggi poco utili;
- stati di dominio invalidi;
- test piu difficili;
- codice pieno di condizioni difensive.

## Concetto chiave

Valida al confine, poi lavora internamente con dati affidabili e modellati.

Il codice interno non dovrebbe continuare a chiedersi se un campo obbligatorio esiste: quella verifica dovrebbe essere gia stata fatta prima.

## Esempio

```js
function handleCreateInvoiceRequest(request) {
  const input = validateCreateInvoiceInput(request.body);
  const command = toCreateInvoiceCommand(input);

  return createInvoice(command);
}
```

Il controller valida e traduce. La logica applicativa riceve un comando gia coerente.

## Dettagli importanti

- La validazione sintattica controlla forma, tipo e presenza.
- La validazione semantica controlla regole del dominio.
- Le regole di sicurezza vanno applicate prima di fidarsi dell'input.
- I dati esterni non dovrebbero essere usati direttamente nei modelli interni.
- La validazione dovrebbe produrre errori comprensibili.

## Limiti

- Alcune regole richiedono dati esterni, quindi non sono solo controlli locali.
- Validare troppo presto puo duplicare regole che appartengono al dominio.
- La validazione non sostituisce autorizzazione, transazioni e controlli di concorrenza.

## Errori comuni

- Validare lo stesso campo in dieci punti diversi.
- Lasciare passare stringhe grezze invece di creare tipi o value objects.
- Confondere validazione input con regole di business.
- Restituire errori generici come `Invalid input`.
- Fidarsi di dati provenienti dal database senza considerare migrazioni e legacy.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Contratti impliciti ed espliciti]]
- [[Messaggi di errore utili]]
- [[Modellazione del dominio]]
- [[Guard clauses]]
- [[Modellare stati impossibili]]

## Fonti

- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Eric Evans, *Domain-Driven Design*
- Robert C. Martin, *Clean Architecture*
