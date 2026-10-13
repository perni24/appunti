---
date: 2026-06-02
area: Programmazione
topic: JavaScript
tags:
  - javascript
  - es-modules
  - circular-dependencies
  - modules
  - architecture
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
aliases:
  - Dipendenze circolari
  - Cicli nei moduli
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Dynamic Import]]"
title: Circular Dependencies
---

# Circular Dependencies

## Sintesi

Una dipendenza circolare esiste quando seguendo gli import si torna al modulo di partenza: `a -> b -> a`, oppure attraverso piu moduli. **Un ciclo nel grafo non implica automaticamente un errore**, ma rende importante quando vengono inizializzati e letti i valori.

Negli ES Modules gli import sono live bindings. Questo non rende immediatamente disponibili tutti gli export: leggere troppo presto un binding di let, const o class genera ReferenceError. In CommonJS il problema tipico e invece osservare export ancora parziali.

## Quando usarlo

Consulta questa nota per diagnosticare errori all'avvio, classi non inizializzate, valori inattesi o dipendenze che attraversano layer in entrambe le direzioni.

Prima identifica sistema di moduli, entry point e catena di import. Un undefined o un errore di caricamento non dimostra da solo un ciclo: possono esserci un export sbagliato, un percorso errato o un problema di rete.

## Come funziona

### Il grafo non e la sequenza delle righe

Schema concettuale degli ES Modules:

1. Risoluzione/caricamento dei moduli e delle loro dipendenze statiche.
2. Linking: verifica degli import/export e creazione degli ambienti e collegamenti fra binding.
3. Valutazione: esecuzione del codice dei moduli, rispettando le dipendenze e gli eventuali await.

Nel linking non vengono gia eseguiti tutti gli inizializzatori. Scrivere un import piu in basso nel file non ne rinvia la dipendenza statica. Con un ciclo non puoi imporre semplicemente che ogni modulo venga eseguito interamente prima dell'altro.

| Dichiarazione esportata | Disponibilita prima della valutazione della dichiarazione |
| --- | --- |
| function dichiarata | Il binding della funzione e gia inizializzato; il suo corpo puo comunque leggere dati ancora in TDZ |
| var | Il binding e inizializzato a undefined; l'assegnazione arriva durante la valutazione |
| let, const | Il binding e creato ma non inizializzato; la lettura anticipata genera ReferenceError |
| class | Ha un binding lessicale; extends richiede subito il valore della classe base |

Sostituire const con var puo trasformare un errore evidente in undefined o NaN, non risolvere la dipendenza fra i valori.

### Live binding non significa snapshot

Un import nominato riflette gli aggiornamenti del binding esportato. L'importatore non puo riassegnarlo direttamente. Non equivale a copiare un valore con destructuring di un oggetto o del risultato di import().

Una funzione esportata puo quindi leggere un dato aggiornato quando viene chiamata, ma fallire se qualcuno la chiama **prima** che quel dato sia inizializzato. Hoisting della funzione e disponibilita dei dati usati dal suo corpo sono due fatti diversi.

Per le basi di import/export vedi [[Programmazione/JavaScript/Pagine/Moduli|Moduli]] e [[Programmazione/JavaScript/Pagine/Hoisting|Hoisting]].

## API / Sintassi

### Come eseguire i casi della nota

Ogni cartella di esempio e indipendente. La prima riga dei blocchi indica il file da creare; i file `.mjs` sono ES Modules espliciti in Node, quelli `.cjs` sono CommonJS. Non unire in un solo file blocchi appartenenti a moduli differenti.

I comandi Node vanno eseguiti dalla directory che contiene le cartelle degli esempi. Nel browser usa un server HTTP che restituisca i moduli con MIME JavaScript e un entry point module, per esempio per il caso riuscito `late`:

```html
<script type="module" src="./late/main.mjs"></script>
```

CommonJS non viene eseguito direttamente dal browser. I casi che devono fallire sono marcati esplicitamente; il testo esatto degli errori puo cambiare tra runtime.

### Lettura anticipata: errore certo nel caso mostrato

```js
// tdz/a.mjs
import { b } from "./b.mjs";
export const a = b + 1;
```

```js
// tdz/b.mjs
import { a } from "./a.mjs";
export const b = a + 1;
```

```sh
node tdz/a.mjs
```

Avviando a, la valutazione entra in b prima che a abbia inizializzato il proprio export. Il tentativo di leggere a genera **ReferenceError**. Entrare da b inverte il percorso, ma anche in quel caso la lettura anticipata fallisce.

Non e una gara casuale di rete e non si risolve riordinando le righe import. In questo esempio ogni valore richiede subito l'altro: devi cambiare la dipendenza fra i dati.

### Lettura successiva: un ciclo che funziona

```js
// late/a.mjs
import { getB } from "./b.mjs";
export let labelA = "A";

export function getA() {
  return labelA;
}
export function renameA(value) {
  labelA = value;
}
export function describe() {
  return getB();
}
```

```js
// late/b.mjs
import { getA } from "./a.mjs";

export function getB() {
  return `B usa ${getA()}`;
}
```

```js
// late/main.mjs
import { describe, renameA } from "./a.mjs";

console.log(describe()); // "B usa A"
renameA("A2");
console.log(describe()); // "B usa A2"
```

```sh
node late/main.mjs
```

Il ciclo a/b rimane. La lettura di labelA avviene pero quando main chiama describe, dopo la valutazione delle sue dipendenze statiche in questo grafo sincrono. Il secondo risultato mostra che getA legge il valore corrente, non quello fotografato all'import.

Spostare semplicemente il codice in una funzione non basta se la richiami subito da b durante l'inizializzazione. Inoltre una chiamata ricorsiva senza condizione di arresto e un problema distinto dal ciclo di import.

### Classi: extends legge subito la classe base

```js
// classes/user.mjs
import { Admin } from "./admin.mjs";

export class User {
  createAdmin() {
    return new Admin();
  }
}
```

```js
// classes/admin.mjs
import { User } from "./user.mjs";

export class Admin extends User {}
```

```sh
node classes/user.mjs
```

Questo avvio fallisce: admin deve leggere User per extends mentre User e ancora in TDZ. Rinviare createAdmin non rinvia la valutazione di extends.

Con gli stessi due file, partire da admin permette invece a user di inizializzarsi prima di valutare la sottoclasse. Questa differenza spiega perche l'entry point va registrato, **non** perche cambiare entry point sia un buon refactoring.

Una struttura piu chiara lascia User indipendente da Admin, fa dipendere Admin da User e colloca la factory che crea gli oggetti in un terzo modulo. Non trasformare il modulo della classe base in un registro delle sue implementazioni.

## Esempio pratico

### Eliminare il ciclo con una composizione esplicita

Problema tipico: il servizio dei permessi importa il repository, e il repository richiama quel servizio. Il refactoring separa una costante condivisa, l'accesso ai dati e una factory che riceve la dipendenza dall'esterno.

```text
main.mjs -> permissions.mjs -> roles.mjs
main.mjs -> repository.mjs  -> roles.mjs

main passa findUser a createPermissionService
```

```js
// composed/roles.mjs
export const ROLE_ADMIN = "admin";
```

```js
// composed/permissions.mjs
import { ROLE_ADMIN } from "./roles.mjs";

export function createPermissionService(findUser) {
  if (typeof findUser !== "function") {
    throw new TypeError("findUser deve essere una funzione");
  }
  return {
    async canEdit(id) {
      const user = await findUser(id);
      return user?.role === ROLE_ADMIN;
    },
  };
}
```

```js
// composed/repository.mjs
import { ROLE_ADMIN } from "./roles.mjs";

const users = new Map([
  ["u1", { id: "u1", role: ROLE_ADMIN }],
]);
export async function findUser(id) {
  return users.get(id) ?? null;
}
```

```js
// composed/main.mjs
import { createPermissionService } from "./permissions.mjs";
import { findUser } from "./repository.mjs";

const permissions = createPermissionService(findUser);
console.log(await permissions.canEdit("u1")); // true
console.log(await permissions.canEdit("missing")); // false
```

```sh
node composed/main.mjs
```

Il servizio non conosce il repository concreto e si puo testare passando una funzione diversa. Il contratto di findUser e un record con role oppure null, eventualmente tramite Promise; gli errori propagano al chiamante. Il demo usa dati interni fidati e non valida uno schema di rete.

E un esempio di composizione, **non un sistema completo di autorizzazione**: in un'app reale la decisione va applicata nel contesto appropriato, con identita verificata e regole del dominio. La Map serve soltanto come repository dimostrativo.

Il modulo condiviso deve rimanere indipendente dai suoi utilizzatori. Spostare tutto in shared.mjs, poi importare nuovamente servizi da shared, ricrea il ciclo con un nome diverso.

## Varianti

### CommonJS: export parziali e riferimenti gia consegnati

```js
// cjs/a.cjs
exports.phase = "starting";
const b = require("./b.cjs");
exports.phase = "ready";
exports.seenByB = b.seenA;
```

```js
// cjs/b.cjs
const a = require("./a.cjs");
exports.seenA = a.phase;
exports.getA = () => a.phase;
```

```js
// cjs/main.cjs
const a = require("./a.cjs");
const b = require("./b.cjs");
console.log(a.phase, b.seenA, b.getA()); // "ready", "starting", "ready"
```

```sh
node cjs/main.cjs
```

Durante il require circolare, b riceve l'oggetto exports di a prima del completamento. seenA copia la stringa presente in quel momento; getA legge piu tardi la proprieta dello stesso oggetto. Se a non avesse ancora creato phase, una lettura potrebbe ottenere undefined; Node puo anche emettere warning per accessi a export mancanti nei cicli.

Un'ulteriore variante: sostituisci soltanto a.cjs con il seguente contenuto, mantenendo b.cjs e main.cjs del caso precedente, ed esegui in un processo nuovo:

```js
// replacement/a.cjs: variante di cjs/a.cjs, stessi b.cjs e main.cjs
exports.phase = "starting";
const b = require("./b.cjs");
module.exports = { phase: "ready", seenByB: b.seenA };
```

Ora main stampa `"ready", "starting", "starting"`: b conserva il riferimento al vecchio oggetto, non viene ricollegato al nuovo module.exports. Una proprieta mutata su un oggetto condiviso non e la stessa cosa di un live binding ESM.

| Caso | Rischio principale |
| --- | --- |
| ESM con binding lessicali | Lettura prima dell'inizializzazione: ReferenceError |
| ESM con var | Valore undefined prima dell'assegnazione |
| CommonJS puro via require | Oggetto esportato ancora parziale |
| CommonJS con sostituzione di module.exports | Chi ha gia ricevuto il vecchio oggetto lo conserva |
| Grafo con await/import dinamici | Oltre ai valori, vanno considerate le dipendenze di attesa |

L'interoperabilita ESM/CommonJS aggiunge regole dipendenti da Node e dalla toolchain; questa tabella non la riduce a un unico comportamento.

### Barrel e dipendenze indirette

Un index.mjs che riesporta Button e Modal fa parte del grafo. Se Button importa Modal passando dallo stesso index, puoi ottenere:

```text
button.mjs -> index.mjs -> button.mjs
                       -> modal.mjs
```

Per gli import interni puo essere piu chiaro riferirsi direttamente a modal.mjs. Verifica comunque che Modal non dipenda a sua volta da Button: eliminare il passaggio nel barrel non garantisce un grafo aciclico.

Un barrel e utile come API pubblica; non e intrinsecamente scorretto. Le riesportazioni statiche contribuiscono alle dipendenze anche se il file non contiene una funzione di inizializzazione esplicita.

### Import dinamico: rinvio, non cancellazione della dipendenza

```js
// lazy/core.mjs
export const label = "core";

export async function runFeature() {
  const { render } = await import("./feature.mjs");
  return render();
}
```

```js
// lazy/feature.mjs
import { label } from "./core.mjs";
export function render() {
  return label.toUpperCase();
}
```

```js
// lazy/main.mjs
import { runFeature } from "./core.mjs";

try {
  console.log(await runFeature()); // "CORE"
} catch (error) {
  console.error(error);
}
```

```sh
node lazy/main.mjs
```

Main chiama runFeature dopo la valutazione di core. La funzione aspetta l'import e il chiamante gestisce eventuali errori. La dipendenza di ritorno feature -> core rimane: hai cambiato **quando** la percorri, non eliminato il legame architetturale.

Usalo quando il caricamento differito ha senso. Non aggiungere timer arbitrari per sperare che un modulo sia pronto.

### Top-level await: possibile ciclo di attesa

Controesempio intenzionale, da eseguire separatamente:

```js
// waiting/a.mjs
await import("./b.mjs");
export const label = "A";
```

```js
// waiting/b.mjs
import { label } from "./a.mjs";
console.log(label);
```

```sh
node waiting/a.mjs
```

A aspetta il completamento dell'import di b, mentre b dipende dal completamento della valutazione async di a. Il codice non arriva al log: non e semplicemente una lettura anticipata che produce ReferenceError.

In Node, quando rimane un top-level await irrisolto senza lavoro che mantenga attivo il processo, l'uscita avviene con codice 13; il browser non fornisce un analogo codice di uscita del processo. Eventuali timer o altre risorse possono modificare quando un processo termina, non risolvere la dipendenza.

Un import dinamico spostato al top-level puo quindi peggiorare il bootstrap. I cicli con await non falliscono tutti allo stesso modo: ricostruisci quali valutazioni e Promise si stanno aspettando.

### Diagnosi, lint e bundler

1. Parti dall'entry point reale in un processo/pagina puliti, senza riuso accidentale della cache dei moduli.
2. Segui import, require e re-export; includi barrel e dipendenze indirette.
3. Separa le letture immediate da quelle nelle funzioni richiamate dopo il setup.
4. Controlla extends, inizializzatori statici, registri globali e chiamate al top-level.
5. Per await traccia anche chi aspetta il completamento di chi.
6. Riproduci il caso con ESM/CommonJS nativi e poi con la build effettiva.

Una regola come `import/no-cycle` di eslint-plugin-import aiuta a trovare cicli statici; resolver, estensioni, profondita e opzioni di analisi influenzano il risultato. Gli import con percorsi calcolati e certi require non sono sempre ricostruibili. Strumenti di grafo come Madge sono un'altra possibilita: vanno configurati per il progetto, non considerati una prova di correttezza del runtime.

Non ogni ciclo riduce automaticamente il tree shaking o rompe HMR. Warning, trasformazioni e suddivisione in chunk dipendono dalla toolchain. Verifica anche il bundle di produzione: assenza di warning o successo del dev server non certificano tutti gli entry point.

## Errori comuni

- Confondere un ciclo di import con ricorsione infinita di chiamate.
- Credere che live binding significhi valore gia inizializzato.
- Spostare una lettura in una funzione e richiamarla comunque troppo presto.
- Cambiare const in var per nascondere ReferenceError.
- Attribuire alla rete un ordine di inizializzazione determinato dal grafo.
- Usare un barrel in ogni import interno senza controllare il percorso risultante.
- Aspettarsi che sostituire module.exports aggiorni i riferimenti gia restituiti.
- Usare import() o un timeout come correzione universale.
- Limitarsi a provare un entry point o una cache gia riscaldata.

## Checklist

- Sono espliciti sistema di moduli, versione del runtime ed entry point.
- Il ciclo e stato ricostruito anche attraverso riesportazioni e import indiretti.
- Le letture prima dell'inizializzazione sono state eliminate o motivate.
- Le dipendenze di attesa async non formano un blocco reciproco.
- Shared/base module non importano i propri utilizzatori.
- La composizione delle implementazioni avviene in un punto dedicato.
- Un eventuale ciclo mantenuto e documentato e testato nei percorsi di avvio supportati.
- Lint e build di produzione completano, ma non sostituiscono, i test del comportamento.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]
- [[Programmazione/JavaScript/Pagine/Hoisting|Hoisting]]
- [[Programmazione/JavaScript/Pagine/Scope|Scope]]
- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Design Patterns|Design Patterns]]
- [[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]

## Fonti

Esempi nativi verificati con Node.js 24.14.0; per configurazioni miste e trasformazioni controllare la versione effettiva della toolchain.

- [MDN: moduli e import ciclici](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#cyclic_imports).
- [MDN: import, live binding e hoisting](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import).
- [MDN: import dinamico](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import).
- [ECMAScript: inizializzazione degli ambienti dei moduli](https://tc39.es/ecma262/multipage/ecmascript-language-scripts-and-modules.html#sec-source-text-module-record-initialize-environment).
- [Node.js: cicli CommonJS](https://nodejs.org/api/modules.html#cycles).
- [Node.js: top-level await e codice di uscita](https://nodejs.org/api/esm.html#top-level-await).
- [eslint-plugin-import: regola no-cycle e limiti](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
