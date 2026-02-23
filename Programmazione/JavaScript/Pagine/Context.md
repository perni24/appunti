---
date: 2026-02-19
tags: [javascript, programming, logic]
type: #permanent-note
status: budding
---

# Context e `this` in JavaScript

Il **Context** (Contexto di Esecuzione) determina come il keyword `this` fa riferimento a un oggetto in un dato momento. È fondamentale distinguere tra *Scope* (dove una variabile è visibile) e *Context* (a quale oggetto appartiene l'esecuzione attuale).

## 1. Execution Context

Ogni volta che il codice JavaScript viene eseguito, lo fa all'interno di un contesto:
- **Global Context**: Il contesto predefinito. Nel browser, `this` si riferisce all'oggetto `window`.
- **Function Context**: Creato ogni volta che una funzione viene chiamata. Il valore di `this` qui dipende da *come* la funzione viene invocata.

## 2. Il Keyword `this`

Il valore di `this` non è fisso; viene stabilito nel momento in cui la funzione viene invocata (runtime).

### Regole di base:
1.  **Metodo di un oggetto**: `this` punta all'oggetto che possiede il metodo.
2.  **Funzione semplice**: In modalità non strict, `this` è `window`. In `use strict`, è `undefined`.
3.  **Arrow Functions**: Non hanno un proprio `this`. Lo ereditano dallo scope genitore (Lexical `this`).

## 3. Explicit Binding (`call`, `apply`, `bind`)

JavaScript fornisce metodi per forzare il valore di `this` indipendentemente da come la funzione viene chiamata.

### `call()` e `apply()`
Eseguono la funzione immediatamente con un contesto specifico.
- `call`: Passa gli argomenti individualmente.
- `apply`: Passa gli argomenti come un array.

```javascript
const persona = { nome: "Luca" };

function saluta(citta, anno) {
    console.log(`Ciao, sono ${this.nome} da ${citta}, classe ${anno}`);
}

saluta.call(persona, "Milano", 1990);           // Ciao, sono Luca da Milano, 1990
saluta.apply(persona, ["Roma", 1995]);          // Ciao, sono Luca da Roma, 1995
```

### `bind()`
Non esegue la funzione, ma ne restituisce una **nuova** con il `this` permanentemente legato all'oggetto passato.

```javascript
const utente = { nome: "Marco" };
const funzioneLegata = saluta.bind(utente, "Bologna", 1988);

funzioneLegata(); // "Ciao, sono Marco..."
```

> [!TIP] `bind` negli Event Listeners
> `bind` è utilissimo quando si passano metodi come callback in `addEventListener`, dove il `this` diventerebbe altrimenti l'elemento DOM invece dell'oggetto originale.

---