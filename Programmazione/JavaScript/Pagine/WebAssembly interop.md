---
date: 2026-05-20
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
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

## Concetto chiave

WebAssembly non sostituisce JavaScript: lo affianca. Il browser esegue un modulo `.wasm`, ma l'applicazione usa JavaScript per caricarlo, passare dati e ricevere risultati.

```javascript
const response = await fetch("/math.wasm");
const bytes = await response.arrayBuffer();
const module = await WebAssembly.instantiate(bytes);

const result = module.instance.exports.add(2, 3);
console.log(result);
```

## Quando usarlo

- Calcoli numerici intensivi.
- Elaborazione immagini, audio o video.
- Porting di librerie native.
- Codice condiviso tra backend, CLI e browser.

## Limiti

- Il passaggio dati tra JS e Wasm ha un costo.
- WebAssembly non accede direttamente al DOM.
- Debug e build sono piu complessi rispetto a JavaScript puro.

## Errori comuni

- Usarlo per logica UI semplice.
- Aspettarsi automaticamente performance migliori.
- Ignorare il costo di serializzazione dei dati.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]
- [[Programmazione/Rust/Indice rust|Rust]]


