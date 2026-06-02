---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - javascript
  - metaprogrammazione
  - classi
aliases: []
prerequisites: []
related: []
---

# Decorators

## Sintesi

I **decorators** permettono di applicare logica dichiarativa a classi, metodi, accessor o campi. Sono usati per annotare o modificare il comportamento di elementi del codice.

## Quando usarlo

### Quando usarli
- Logging trasversale.
- Validazione.
- Dependency injection.
- Metadata su classi e metodi.
- Framework che usano annotazioni dichiarative.

## Come funziona

### Concetto chiave
Un decorator e una funzione applicata a una dichiarazione. In JavaScript moderno sono soprattutto rilevanti in ecosistemi che usano transpiler o TypeScript.

```javascript
function logged(value, context) {
  return function (...args) {
    console.log(`Calling ${context.name}`);
    return value.apply(this, args);
  };
}

class Service {
  @logged
  run() {
    return "ok";
  }
}
```

## API / Sintassi

Sintassi concettuale:

```javascript
@decorator
class Example {}
```

Decorator di metodo:

```javascript
function logged(value, context) {
  return function (...args) {
    console.log(`Calling ${context.name}`);
    return value.call(this, ...args);
  };
}
```

Il parametro `value` rappresenta l'elemento decorato. `context` contiene informazioni come nome, tipo e metadati disponibili per quel decorator.

## Esempio pratico

Decorator per misurare durata di un metodo:

```javascript
function timed(value, context) {
  return function (...args) {
    const start = performance.now();

    try {
      return value.call(this, ...args);
    } finally {
      console.log(`${context.name}: ${performance.now() - start}ms`);
    }
  };
}

class ReportService {
  @timed
  generate() {
    return "report";
  }
}
```

Il vantaggio e applicare una logica trasversale senza ripeterla in ogni metodo.

## Varianti

### Limiti
I decorators aumentano la magia implicita del codice. Sono utili quando riducono duplicazione reale, ma possono rendere difficile capire dove nasce un comportamento.

## Errori comuni

- Usarli per nascondere logica fondamentale.
- Mescolare sintassi e semantiche diverse tra Babel, TypeScript e JavaScript standard.
- Applicarli dove una funzione esplicita sarebbe piu leggibile.

## Checklist

- Verifica quale sintassi supporta il tuo toolchain.
- Usa decorators solo per logica trasversale e ripetitiva.
- Mantieni il comportamento decorato comprensibile.
- Evita side effect nascosti durante la definizione della classe.
- Documenta decorators condivisi dal framework o dal progetto.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Proxy e Reflect|Proxy e Reflect]]
- [[Programmazione/TypeScript/Indice TypeScript|TypeScript]]
