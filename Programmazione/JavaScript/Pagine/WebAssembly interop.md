---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - javascript
  - webassembly
  - performance
aliases: []
prerequisites: []
related: []
---

# WebAssembly interop

## Sintesi

**WebAssembly interop** indica l'integrazione tra JavaScript e moduli WebAssembly. JavaScript resta il livello di orchestrazione, accesso al DOM e I/O, mentre WebAssembly esegue codice compilato da linguaggi come Rust, C o C++.

## Quando usarlo

- Calcoli numerici intensivi.
- Elaborazione immagini, audio o video.
- Porting di librerie native.
- Codice condiviso tra backend, CLI e browser.

## Come funziona

### Concetto chiave
WebAssembly non sostituisce JavaScript: lo affianca. Il browser esegue un modulo `.wasm`, ma l'applicazione usa JavaScript per caricarlo, passare dati e ricevere risultati.

```javascript
const response = await fetch("/math.wasm");
const bytes = await response.arrayBuffer();
const module = await WebAssembly.instantiate(bytes);

const result = module.instance.exports.add(2, 3);
console.log(result);
```

## API / Sintassi

API principali:

```javascript
const { instance, module } = await WebAssembly.instantiate(bytes, imports);
```

Con streaming, quando il server invia il MIME corretto:

```javascript
const { instance } = await WebAssembly.instantiateStreaming(
  fetch("/math.wasm"),
  imports,
);
```

Accesso agli export:

```javascript
const result = instance.exports.add(2, 3);
```

Per passare dati complessi spesso si usa memoria condivisa tra Wasm e JavaScript tramite `WebAssembly.Memory`.

## Esempio pratico

Caricamento di un modulo con funzione esportata:

```javascript
async function loadMathModule() {
  const response = await fetch("/math.wasm");
  const bytes = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes);

  return {
    add: instance.exports.add,
  };
}

const math = await loadMathModule();
console.log(math.add(2, 3));
```

Questo modello e adatto a funzioni semplici. Per stringhe, array o strutture complesse serve una convenzione di serializzazione o un binding generato dal toolchain.

## Varianti

### Limiti
- Il passaggio dati tra JS e Wasm ha un costo.
- WebAssembly non accede direttamente al DOM.
- Debug e build sono piu complessi rispetto a JavaScript puro.

## Errori comuni

- Usarlo per logica UI semplice.
- Aspettarsi automaticamente performance migliori.
- Ignorare il costo di serializzazione dei dati.

## Checklist

- Usa Wasm solo per lavoro computazionale significativo.
- Misura il costo di passaggio dati tra JS e Wasm.
- Tieni JavaScript come livello di orchestrazione per DOM e I/O.
- Verifica MIME, caching e caricamento del file `.wasm`.
- Preferisci binding generati quando passi strutture complesse.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]
- [[Programmazione/Rust/Indice rust|Rust]]
