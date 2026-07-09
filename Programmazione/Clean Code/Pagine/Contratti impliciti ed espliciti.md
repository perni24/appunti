---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, contratti, api-design]
aliases: [Contratti impliciti ed espliciti, Contratti nel codice]
prerequisites: [Clean Code, Codice esplicito vs codice implicito]
related: [Validazione ai confini, Tipi significativi, Messaggi di errore utili]
---

# Contratti impliciti ed espliciti

## Sintesi

Un **contratto** descrive cosa una funzione, classe o modulo si aspetta in input e cosa promette in output.

Nel Clean Code conviene rendere i contratti piu espliciti possibile, per evitare che il comportamento corretto dipenda da convenzioni non dette.

## Problema che risolve

I contratti impliciti obbligano il lettore a indovinare regole nascoste:

- quali valori sono ammessi;
- quali campi sono obbligatori;
- quali errori possono uscire;
- se una funzione muta i parametri;
- se un metodo puo restituire `null`;
- se una chiamata produce side effects.

Quando queste informazioni non sono visibili, il codice diventa fragile.

## Concetto chiave

Un contratto esplicito puo essere espresso con tipi, nomi, validazione, documentazione minima, test e messaggi di errore.

L'obiettivo non e scrivere commenti lunghi, ma far capire rapidamente le regole essenziali di utilizzo.

## Esempio

Contratto debole:

```js
function createUser(data) {
  // ...
}
```

Contratto piu chiaro:

```js
function createUser({ email, displayName, role }) {
  if (!email) throw new Error("User email is required");
  if (!role) throw new Error("User role is required");

  return userRepository.create({ email, displayName, role });
}
```

La seconda versione rende visibili requisiti e fallimenti principali.

## Limiti

- Non tutto puo essere espresso nei tipi.
- Troppa validazione duplicata puo rendere il codice rumoroso.
- I contratti cambiano: devono restare allineati con test e implementazione.
- Nei sistemi dinamici serve disciplina aggiuntiva.

## Errori comuni

- Usare `null` come valore speciale senza documentarlo.
- Accettare oggetti generici e assumere campi nascosti.
- Restituire tipi diversi in base a casi non dichiarati.
- Nascondere side effects dietro nomi neutri.
- Considerare i test come unico contratto leggibile.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Codice esplicito vs codice implicito]]
- [[Validazione ai confini]]
- [[Tipi significativi]]
- [[Messaggi di errore utili]]

## Fonti

- Bertrand Meyer, *Object-Oriented Software Construction*
- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
