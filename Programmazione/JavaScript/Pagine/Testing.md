---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - testing
  - quality
  - unit-test
  - e2e
aliases:
  - Testing JS
  - Test JavaScript
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Moduli|Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Design Patterns|Design Patterns]]"
  - "[[Programmazione/JavaScript/Pagine/Functional Programming|Functional Programming]]"
  - "[[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]"
title: Testing
---

# Testing

## Sintesi

Un test confronta un comportamento osservato con un risultato atteso. Serve a trovare regressioni e rendere espliciti i contratti del codice; **una suite verde non dimostra l'assenza di bug**.

Distingui runner, assertion e ambiente: il runner avvia i test, le assertion verificano i risultati, l'ambiente determina quali API esistono. Un test Node non dispone automaticamente del DOM e un DOM simulato non e un browser completo.

## Quando usarlo

Dai priorita a logica di business, parsing, validazione, errori, integrazioni e flussi critici. Per ogni bug riproducibile aggiungi un caso che fallisce prima della correzione e passa dopo. Anche pochi test mirati possono essere utili in uno script piccolo.

Scegli i confini in base al rischio. Non serve testare ogni metodo privato: verifica cio che un chiamante o un utente puo osservare.

## Come funziona

### Tipi di verifica

| Tipo | Cosa verifica | Limite tipico |
| --- | --- | --- |
| Unit | Una funzione o un'unita di comportamento con dipendenze controllate | Non prova l'integrazione reale sostituita |
| Integration | Collaborazione fra moduli, adapter, database o servizi di test | Richiede ambiente e cleanup affidabili |
| Component | Un componente UI e le sue interazioni | DOM simulato e browser reale non sono equivalenti |
| End-to-end | Un percorso attraverso il sistema distribuito nell'ambiente scelto | Piu costoso e sensibile all'ambiente |
| Contract | Schema e comportamento concordati tra consumer e provider | Un mock del solo consumer non verifica il provider |
| Regression | Che un difetto noto non ricompaia | E uno scopo, non un livello separato |

La piramide dei test suggerisce molti controlli piccoli e pochi percorsi E2E mirati, ma non e una proporzione obbligatoria. Per un adapter puo essere piu utile un'integrazione reale che molti mock.

### Arrange, Act, Assert

1. **Arrange:** prepara input, stato iniziale e dipendenze.
2. **Act:** esegui l'operazione.
3. **Assert:** controlla risultato, errore o effetto osservabile.

L'atteso deve derivare dal requisito, non dalla stessa formula copiata dall'implementazione. Nomi come "restituisce null per utente assente" spiegano meglio il contratto di "test 3".

### Mock, stub, spy e fake

Uno **stub** restituisce risposte controllate; uno **spy** registra chiamate; un **fake** e una piccola implementazione alternativa, per esempio un repository in memoria. "Mock" viene usato anche come termine generale, ma non rende equivalenti questi ruoli.

Sostituisci un confine esterno, non tutte le funzioni interne. Una suite che verifica solo quali metodi si chiamano puo rompersi durante un refactoring corretto o passare con un risultato sbagliato. Aggiungi integrazioni contro l'adapter reale quando il suo comportamento conta.

### Strumenti e runtime

| Strumento | Impiego | Attenzione |
| --- | --- | --- |
| `node:test` e `node:assert/strict` | Test Node senza dipendenze esterne | Non fornisce `expect`, `vi` o DOM |
| Vitest | Runner integrato nell'ecosistema Vite | Import e ambiente vanno configurati |
| Jest | Runner con assertion, mock e strumenti propri | ESM e trasformazioni richiedono la sua configurazione |
| Playwright Test | Test in browser reali e flussi web | Browser, server e dati di prova devono essere disponibili |

Non mescolare `jest.fn()`, `vi.fn()` e le API Node nello stesso esempio senza una scelta esplicita. Jest e Vitest hanno sintassi simili, non una promessa di identico comportamento o configurazione. Vedi le rispettive fonti.

## API / Sintassi

Negli esempi seguenti si usa **Node.js 24.14.0**, con file ESM `.mjs`. Non occorre installare un framework npm.

| Controllo Node | Uso |
| --- | --- |
| `assert.equal(actual, expected)` | Con `node:assert/strict` confronta senza coercizione; gli oggetti per identita |
| `assert.deepEqual(actual, expected)` | Confronta la struttura con le regole della deep equality strict |
| `assert.throws(() => operation(), TypeError)` | Eccezione sincrona |
| `await assert.rejects(operation(), TypeError)` | Rifiuto di una Promise |
| `t.mock.fn(implementation)` | Funzione controllata con registro delle chiamate del test |
| `t.after(cleanup)` | Cleanup dopo il test, anche se un'assertion fallisce |

In Jest/Vitest i corrispondenti matcher comuni sono `toBe`, `toEqual`, `toThrow`, `resolves` e `rejects`. Non sono alias perfetti delle assertion Node. In ogni runner, restituisci o attendi la Promise: un'assertion avviata senza attesa puo non appartenere piu al lifecycle corretto del test.

Una funzione `async` che lancia un errore restituisce una Promise rifiutata: non si verifica con una normale `throws` intorno alla sola chiamata. Analogamente, un test che avvia una callback e termina subito non ha ancora verificato il risultato della callback.

## Esempio pratico

### 1. Funzione pura: src/discount.mjs

Contratto didattico: importo intero in centesimi da 0 a un miliardo, percentuale intera da 0 a 100. Il risultato viene arrotondato al centesimo piu vicino, con i mezzi centesimi verso l'alto. Questi limiti mantengono sicura la moltiplicazione intera; la policy non rappresenta tutte le regole fiscali o contabili.

```js
export function applyDiscount(priceCents, percent) {
  if (!Number.isInteger(priceCents) ||
      priceCents < 0 || priceCents > 1_000_000_000) {
    throw new RangeError("Expected integer cents from 0 to 1000000000");
  }
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new RangeError("Expected an integer percentage from 0 to 100");
  }
  return Math.round(priceCents * (100 - percent) / 100);
}
```

### 2. Test unitari: test/discount.test.mjs

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDiscount } from "../src/discount.mjs";

test("applica uno sconto del 10 percento", () => {
  const priceCents = 10_000;
  const result = applyDiscount(priceCents, 10);
  assert.equal(result, 9_000);
});

for (const [price, percent, expected] of [
  [0, 10, 0],
  [100, 0, 100],
  [100, 100, 0],
  [1, 50, 1],
  [1_000_000_000, 1, 990_000_000],
]) {
  test(`sconto: ${price}, ${percent} -> ${expected}`, () => {
    assert.equal(applyDiscount(price, percent), expected);
  });
}

test("rifiuta importi e percentuali fuori contratto", () => {
  assert.throws(() => applyDiscount(-1, 10), RangeError);
  assert.throws(() => applyDiscount(100, 101), RangeError);
  assert.throws(() => applyDiscount("100", 10), RangeError);
});
```

Sono sette test: sei casi validi e un test con tre assertion. Numero di test, numero di assertion e copertura sono misure differenti.

### 3. Confine asincrono: src/user-loader.mjs

Il repository viene iniettato. Deve accettare un ID intero positivo e risolvere con un record oppure `null`; puo rifiutare per un guasto. Il modulo non implementa HTTP o SQL e non li certifica implicitamente.

```js
export function createUserLoader(findById) {
  if (typeof findById !== "function") {
    throw new TypeError("Expected a repository function");
  }
  return async function loadUser(id) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new RangeError("Expected a positive integer id");
    }
    const user = await findById(id);
    if (user === null) return null;
    if (typeof user !== "object" || Array.isArray(user) ||
        user.id !== id || typeof user.name !== "string" ||
        user.name.trim().length === 0) {
      throw new TypeError("Unexpected user record");
    }
    return { id: user.id, name: user.name.trim() };
  };
}
```

### 4. Test asincroni: test/user-loader.test.mjs

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createUserLoader } from "../src/user-loader.mjs";

test("restituisce solo i campi pubblici normalizzati", async (t) => {
  const findById = t.mock.fn(async () => ({
    id: 7, name: " Ada ", internalToken: "fixture-only",
  }));
  const loadUser = createUserLoader(findById);

  assert.deepEqual(await loadUser(7), { id: 7, name: "Ada" });
  assert.equal(findById.mock.callCount(), 1);
  assert.deepEqual(findById.mock.calls[0].arguments, [7]);
});

test("utente assente distinto da guasto del repository", async () => {
  assert.equal(await createUserLoader(async () => null)(7), null);
  const failure = new Error("repository unavailable");
  const loadUser = createUserLoader(async () => { throw failure; });
  await assert.rejects(loadUser(7), (error) => error === failure);
});

test("input invalido non chiama il repository", async (t) => {
  const findById = t.mock.fn(async () => null);
  await assert.rejects(createUserLoader(findById)(0), RangeError);
  assert.equal(findById.mock.callCount(), 0);
});

test("risposta incoerente viene rifiutata", async () => {
  const loadUser = createUserLoader(async () => ({ id: 8, name: "Ada" }));
  await assert.rejects(loadUser(7), TypeError);
});
```

Il controllo della chiamata al repository e utile per questo confine, ma il risultato resta l'assertion principale. `t.mock` ha lifecycle legato al test; per risorse reali registra il cleanup con `t.after` o usa `try/finally`.

### 5. Esecuzione

Struttura completa:

```text
testing-demo/
  src/
    discount.mjs
    user-loader.mjs
  test/
    discount.test.mjs
    user-loader.test.mjs
```

Dalla cartella `testing-demo`, esegui una singola volta:

```sh
node --test test/discount.test.mjs test/user-loader.test.mjs
```

Risultato atteso: **11 test superati**, exit code zero. I test non scrivono file, non contattano rete e non richiedono un database.

Per selezionare un caso per nome, le opzioni precedono i percorsi:

```sh
node --test --test-name-pattern="input invalido" test/user-loader.test.mjs
```

Per lavorare interattivamente con riesecuzione alle modifiche:

```sh
node --test --watch test/discount.test.mjs test/user-loader.test.mjs
```

La modalita watch rimane attiva: non e il comando da lasciare in CI. Non confondere test saltati o filtrati con casi effettivamente eseguiti.

## Varianti

### Coverage e limiti

In questa versione Node la raccolta coverage e sperimentale:

```sh
node --test --experimental-test-coverage --test-coverage-include="src/**/*.mjs" test/discount.test.mjs test/user-loader.test.mjs
```

La coverage conta codice eseguito, non requisiti verificati. Un ramo puo essere attraversato senza controllarne il risultato. Esamina anche file mai importati, esclusioni, test saltati e casi negativi: una percentuale alta non garantisce assertion efficaci.

Snapshot e mutation testing rispondono a domande diverse: lo snapshot confronta output registrati da rivedere, non da aggiornare alla cieca; il mutation testing modifica intenzionalmente il programma per vedere se i test rilevano la differenza. Nessuno sostituisce requisiti corretti.

### Integrazioni, UI e cleanup

Per una vera integrazione con file, database o HTTP usa risorse di test isolate. Crea un workspace temporaneo o dati dedicati, attendi operazioni pendenti e chiudi handle/connessioni anche su errore. Non usare dati di produzione.

Per UI, prova azioni osservabili e selettori semantici. Un DOM simulato non prova layout, rendering, CORS o comportamento di tutti i browser. Per E2E attendi uno stato significativo, non un ritardo arbitrario; mantieni un numero limitato di flussi rappresentativi.

Tempo, casualita, timezone, locale e stato globale sono possibili fonti di non determinismo. Inietta un clock o controlla i timer quando serve; poi mantieni verifiche reali mirate. I fake timer non rendono automaticamente sincrone tutte le Promise o la rete.

La concorrenza dei test non deve cambiare il risultato: evita file, porte e variabili globali condivisi. Un timeout del runner non e un rollback e non dimostra che un'operazione esterna sia stata annullata.

### TDD e CI

TDD segue **red, green, refactor**: osserva il fallimento atteso, implementa il comportamento, migliora il codice mantenendo le verifiche verdi. Non e obbligatorio per ogni attivita, ma il primo fallimento aiuta a distinguere un test significativo da un test che passa comunque.

In CI usa runtime e lockfile concordati, una modalita non interattiva e controlli separati per lint, tipi e test. Una suite che esce con codice zero puo comunque avere test esclusi: verifica report e perimetro. Non mascherare un test instabile aggiungendo retry senza capirne la causa.

## Errori comuni

- Copiare un test con `expect`, `vi` o funzioni non importate.
- Dimenticare `await` o `return` sulle assertion asincrone.
- Usare `throws` per il rifiuto di una funzione async.
- Controllare solo il percorso felice o solo le chiamate dei mock.
- Ricopiare l'algoritmo nella costruzione del risultato atteso.
- Dipendere da ordine, rete pubblica, clock reale o stato lasciato da altri test.
- Aggiungere skip, retry o aggiornamenti snapshot senza una decisione motivata.
- Considerare lint, coverage e test come prove equivalenti.

## Checklist

- Il contratto specifica input, output, errori ed effetti?
- Il test fallisce quando introduco il difetto che deve rilevare?
- Sono coperti casi vuoti, limiti, input invalidi e guasti delle dipendenze?
- Ogni Promise e attesa e ogni risorsa viene chiusa?
- I mock sono limitati a confini dichiarati?
- Almeno le integrazioni e i flussi critici hanno verifiche nell'ambiente appropriato?
- CI esegue davvero i file previsti e propaga gli errori?

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Functional Programming|Functional Programming]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]

## Fonti

- [Node.js 24.14.0: test runner, lifecycle, mock e coverage](https://nodejs.org/download/release/v24.14.0/docs/api/test.html).
- [Node.js 24.14.0: assertion strict e verifiche asincrone](https://nodejs.org/download/release/v24.14.0/docs/api/assert.html).
- [Vitest: configurazione e avvio](https://vitest.dev/guide/).
- [Jest: configurazione e avvio](https://jestjs.io/docs/getting-started).
- [Playwright: buone pratiche per i test](https://playwright.dev/docs/best-practices).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
