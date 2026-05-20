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
  - metaprogrammazione
  - classi
aliases: []
prerequisites: []
related: []
---

# Decorators

## Sintesi

I **decorators** permettono di applicare logica dichiarativa a classi, metodi, accessor o campi. Sono usati per annotare o modificare il comportamento di elementi del codice.

## Concetto chiave

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

## Quando usarli

- Logging trasversale.
- Validazione.
- Dependency injection.
- Metadata su classi e metodi.
- Framework che usano annotazioni dichiarative.

## Limiti

I decorators aumentano la magia implicita del codice. Sono utili quando riducono duplicazione reale, ma possono rendere difficile capire dove nasce un comportamento.

## Errori comuni

- Usarli per nascondere logica fondamentale.
- Mescolare sintassi e semantiche diverse tra Babel, TypeScript e JavaScript standard.
- Applicarli dove una funzione esplicita sarebbe piu leggibile.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

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
- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Proxy e Reflect|Proxy e Reflect]]
- [[Programmazione/TypeScript/Indice TypeScript|TypeScript]]


