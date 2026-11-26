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
  - validazione
  - confini
aliases:
  - Validazione ai confini
  - Boundary validation
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
  - "[[Programmazione/Clean Code/Pagine/Modellazione del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Guard clauses]]"
title: Validazione ai confini
---

# Validazione ai confini

## Sintesi

Al confine del sistema ricevi una rappresentazione, non ancora un oggetto di dominio. **Validare** significa decidere quali dati accettare e tradurli in una forma interna affidabile. Un cast TypeScript non ispeziona il JSON; un controllo di forma non conferma che una risorsa esista o che l'utente possa modificarla.

## Esempio: una riga da aggiungere a una fattura

Il trasporto ammette un codice articolo testuale e una quantità intera da 1 a 99 inclusi. Il parser opera su JSON già decodificato, non sulla stringa del corpo HTTP. Copia soltanto i due campi previsti; gli altri sono ignorati per scelta del contratto.

```js
function parseInvoiceLine(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, field: "body" };
  }
  if (typeof raw.sku !== "string" || !raw.sku.trim()) {
    return { ok: false, field: "sku" };
  }
  if (!Number.isSafeInteger(raw.quantity) || raw.quantity < 1 || raw.quantity > 99) {
    return { ok: false, field: "quantity" };
  }
  return { ok: true, line: { sku: raw.sku.trim(), quantity: raw.quantity } };
}
```

`{ sku: " 007 ", quantity: 1 }` conserva il codice `"007"`; `quantity: "1"` è rifiutato, non convertito. Il chiamante usa `line` solo nel ramo `ok: true`. Un JSON sintatticamente malformato va invece rifiutato dal decodificatore, prima di chiamare questa funzione.

## Che cosa resta da verificare?

Il comando è ben formato, ma l'articolo potrebbe essere inesistente, la fattura già emessa o l'utente privo di permesso. Queste decisioni richiedono il modello, lo stato aggiornato o il contesto di accesso. Non ripetere la stessa verifica di tipo in ogni funzione interna; non eliminare, per contro, il controllo sullo stato al momento della scrittura.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]
- [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]]
- [[Programmazione/Clean Code/Pagine/Guard clauses|Guard clauses]]
- [[Programmazione/Clean Code/Pagine/Modellare stati impossibili|Modellare stati impossibili]]

## Fonti

- OWASP, [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- Martin Fowler, *Patterns of Enterprise Application Architecture*; Eric Evans, *Domain-Driven Design*; Robert C. Martin, *Clean Architecture*
