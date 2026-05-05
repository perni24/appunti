---
date: 2026-05-04
tags: [javascript, es-modules, circular-dependencies, modules, architecture]
type: #permanent-note
status: budding
---

# Circular Dependencies

Una **circular dependency** si verifica quando due o piu moduli dipendono l'uno dall'altro formando un ciclo.

Esempio minimo:

```txt
a.js -> importa da b.js
b.js -> importa da a.js
```

Oppure in forma piu indiretta:

```txt
a.js -> b.js -> c.js -> a.js
```

I cicli non sono sempre errori immediati, ma spesso indicano accoppiamento eccessivo tra moduli.

> [!INFO]
> Gli ES Modules supportano le dipendenze circolari meglio di molti sistemi legacy perche usano live bindings. Questo non significa che i cicli siano sempre sicuri o facili da mantenere.

## 1. Esempio Base

```javascript
// a.js
import { valueB } from "./b.js";

export const valueA = "A";

console.log(valueB);
```

```javascript
// b.js
import { valueA } from "./a.js";

export const valueB = "B";

console.log(valueA);
```

Qui `a.js` importa `b.js` e `b.js` importa `a.js`.

Il comportamento dipende da:

- ordine di linking dei moduli;
- ordine di inizializzazione;
- tipo di export;
- momento in cui il valore importato viene letto;
- sistema di moduli usato.

Collegamento: [[Moduli]]

## 2. Perche Succedono

Le dipendenze circolari compaiono spesso quando:

- due moduli contengono logica dello stesso dominio;
- un modulo "utility" inizia a importare codice applicativo;
- classi padre e figlio si importano a vicenda;
- un registry importa implementazioni che importano il registry;
- si crea un file `index.js` che riesporta tutto e viene importato internamente;
- business logic e infrastruttura non sono separati.

Esempio tipico:

```txt
user-service.js
  -> importa permissions.js

permissions.js
  -> importa user-service.js
```

Il problema non e solo tecnico: spesso segnala un confine architetturale poco chiaro.

## 3. ES Modules e Live Bindings

Gli ES Modules non copiano i valori importati. Creano **live bindings**.

Significa che l'import punta al binding esportato dal modulo originale.

```javascript
// counter.js
export let count = 0;

export function increment() {
  count += 1;
}
```

```javascript
// app.js
import { count, increment } from "./counter.js";

increment();
console.log(count); // 1
```

Il valore importato riflette gli aggiornamenti del modulo sorgente.

Questo aiuta con alcuni cicli, ma non elimina i problemi di inizializzazione.

## 4. Linking, Instantiation, Evaluation

Gli ES Modules vengono gestiti in fasi.

Schema semplificato:

```txt
Parsing
  -> costruzione del grafo dei moduli
  -> linking degli import/export
  -> inizializzazione dei binding
  -> valutazione del codice top-level
```

Il ciclo viene rilevato nel grafo, ma l'esecuzione top-level puo comunque leggere un binding prima che sia inizializzato.

Questo porta a errori come:

```txt
ReferenceError: Cannot access 'x' before initialization
```

## 5. Temporal Dead Zone

Con `let`, `const` e `class`, un binding esiste ma non puo essere letto prima dell'inizializzazione.

Esempio problematico:

```javascript
// a.js
import { b } from "./b.js";

export const a = b + 1;
```

```javascript
// b.js
import { a } from "./a.js";

export const b = a + 1;
```

Qui ogni modulo prova a calcolare il proprio export leggendo l'altro durante l'inizializzazione.

Risultato possibile:

```txt
ReferenceError
```

Il ciclo non e gestibile perche i valori sono necessari subito.

## 6. Cicli Gestibili

Un ciclo puo funzionare se i valori importati non vengono letti immediatamente durante l'inizializzazione top-level.

```javascript
// a.js
import { getB } from "./b.js";

export function getA() {
  return "A";
}

export function printB() {
  console.log(getB());
}
```

```javascript
// b.js
import { getA } from "./a.js";

export function getB() {
  return `B uses ${getA()}`;
}
```

Il ciclo esiste, ma la lettura avviene solo quando le funzioni vengono chiamate, dopo che i moduli sono stati inizializzati.

Questo puo funzionare, ma resta da valutare se l'architettura sia chiara.

## 7. CommonJS vs ES Modules

In Node.js, CommonJS (`require`) ha una semantica diversa dagli ES Modules.

CommonJS esporta oggetti mutabili e puo restituire export parzialmente inizializzati durante un ciclo.

Esempio:

```javascript
// a.cjs
const b = require("./b.cjs");

module.exports.valueA = "A";
console.log(b.valueB);
```

```javascript
// b.cjs
const a = require("./a.cjs");

module.exports.valueB = "B";
console.log(a.valueA);
```

Durante un ciclo, `a.valueA` potrebbe essere `undefined` se `a.cjs` non ha ancora completato la sua esecuzione.

Differenza pratica:

| Sistema | Comportamento nei cicli |
|---|---|
| ES Modules | live bindings, TDZ, errori se si legge troppo presto |
| CommonJS | export parziali, rischio di `undefined` |

## 8. Sintomi Comuni

Le circular dependencies possono causare:

- `undefined` inatteso;
- `ReferenceError`;
- funzioni non definite;
- classi non inizializzate;
- test instabili;
- ordine di import fragile;
- bundle piu difficile da ottimizzare;
- hot reload incoerente;
- dipendenze architetturali difficili da seguire.

Il sintomo spesso compare lontano dalla causa reale.

## 9. File index.js e Barrel Exports

I file `index.js` usati come barrel export possono introdurre cicli indiretti.

Esempio:

```javascript
// components/index.js
export { Button } from "./Button.js";
export { Modal } from "./Modal.js";
```

Se `Button.js` importa da `components/index.js`, puo importare indirettamente anche se stesso o moduli fratelli non ancora inizializzati.

Pattern rischioso:

```javascript
// Button.js
import { Modal } from "./index.js";
```

Meglio:

```javascript
// Button.js
import { Modal } from "./Modal.js";
```

Regola pratica: i barrel exports sono utili per API pubbliche, ma vanno evitati negli import interni tra file dello stesso package quando creano cicli.

## 10. Cicli tra Classi

Le classi sono particolarmente sensibili ai cicli perche sono soggette a TDZ.

Esempio problematico:

```javascript
// User.js
import { Admin } from "./Admin.js";

export class User {
  createAdmin() {
    return new Admin();
  }
}
```

```javascript
// Admin.js
import { User } from "./User.js";

export class Admin extends User {}
```

Qui `Admin` estende `User`, ma `User` importa `Admin`.

Soluzioni possibili:

- spostare factory logic in un terzo modulo;
- invertire la dipendenza;
- usare dependency injection;
- separare tipi/base class da implementazioni concrete.

## 11. Refactoring con Terzo Modulo

Se due moduli condividono costanti, tipi o funzioni comuni, estrai quelle parti in un terzo modulo.

Prima:

```txt
a.js <-> b.js
```

Dopo:

```txt
a.js -> shared.js
b.js -> shared.js
```

Esempio:

```javascript
// shared.js
export const ROLE_ADMIN = "admin";
```

```javascript
// user.js
import { ROLE_ADMIN } from "./shared.js";
```

```javascript
// permissions.js
import { ROLE_ADMIN } from "./shared.js";
```

Questo elimina il ciclo e chiarisce la responsabilita del codice condiviso.

## 12. Dependency Inversion

Se un modulo alto livello e uno basso livello si importano a vicenda, spesso serve invertire la dipendenza.

Invece di:

```txt
service.js -> repository.js
repository.js -> service.js
```

usa:

```txt
service.js -> repository-interface.js
repository.js -> repository-interface.js
composition-root.js -> collega le implementazioni
```

In JavaScript puro non hai interfacce native come in TypeScript, ma puoi comunque separare:

- contratti;
- factory;
- configurazione;
- implementazioni concrete.

## 13. Lazy Import come Soluzione

In alcuni casi puoi rompere il ciclo spostando l'import dentro una funzione.

```javascript
export async function runFeature() {
  const { feature } = await import("./feature.js");
  return feature();
}
```

Questo rinvia il caricamento.

Collegamento: [[Dynamic Import]]

Va usato con criterio:

- migliora cicli legati a feature opzionali;
- puo introdurre asincronia dove prima non c'era;
- non deve nascondere un problema architetturale piu serio.

## 14. Dipendenze Circolari e Bundler

Bundler come Vite, Rollup o Webpack gestiscono i cicli in modi compatibili con la semantica dei moduli, ma possono emettere warning.

Possibili effetti:

- chunking meno prevedibile;
- tree shaking meno efficace;
- warning durante la build;
- ordine di inizializzazione fragile;
- problemi con hot module replacement.

Un ciclo che "funziona" in sviluppo puo comunque rendere piu difficile mantenere il progetto.

## 15. Come Rilevarle

Strumenti comuni:

- analisi statica del grafo degli import;
- warning del bundler;
- lint rule dedicate;
- strumenti come `madge` o dependency graph;
- review architetturale dei confini tra moduli.

Esempio concettuale:

```txt
module graph
  -> trova a.js -> b.js -> c.js -> a.js
```

Non tutti gli strumenti sono nativi, ma il problema e visibile gia leggendo import/export.

## 16. Quando un Ciclo e Accettabile

Un ciclo puo essere accettabile se:

- non legge valori prima dell'inizializzazione;
- coinvolge solo funzioni chiamate dopo il setup;
- e documentato;
- non attraversa layer architetturali diversi;
- non rende fragile il bootstrap;
- non produce warning o comportamenti incoerenti.

Ma in generale, meno cicli ci sono, piu il grafo dei moduli resta leggibile.

## 17. Best Practices

1. Mantieni dipendenze direzionali tra layer.
2. Evita import interni da barrel file.
3. Estrai codice condiviso in moduli comuni.
4. Evita logica pesante al top-level dei moduli.
5. Non leggere import circolari durante l'inizializzazione.
6. Usa dependency injection quando due moduli si conoscono troppo.
7. Usa dynamic import solo se il ritardo asincrono ha senso.
8. Monitora warning di bundler e lint.

## 18. Errori Comuni

### Pensare che ES Modules impediscano i cicli

Li supportano meglio, ma non li rendono sempre sicuri.

### Usare index.js ovunque

I barrel file sono comodi per API pubbliche, ma possono creare cicli negli import interni.

### Leggere valori importati al top-level

Questo e il modo piu comune per causare `ReferenceError` o `undefined`.

### Risolvere tutto con dynamic import

Se il ciclo nasce da architettura confusa, lazy loading puo solo spostare il problema.

## 19. Mappa Mentale

```txt
Circular Dependencies
  -> a importa b, b importa a
  -> ES Modules: live bindings + TDZ
  -> CommonJS: export parziali
  -> sintomi: undefined, ReferenceError, warning bundler
  -> cause: layer confusi, barrel exports, top-level logic
  -> soluzioni: shared module, dependency inversion, lazy import
```

## Collegamenti

- [[Moduli]]
- [[Dynamic Import]]
- [[Hoisting]]
- [[Scope]]
- [[Classi]]
- [[Design Patterns]]
- [[Optimization]]
