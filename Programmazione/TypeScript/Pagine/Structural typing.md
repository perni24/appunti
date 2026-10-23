---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - typescript
  - structural-typing
  - type-system
aliases:
  - Tipizzazione strutturale
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
  - "[[Programmazione/TypeScript/Pagine/Classi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Brand Types]]"
  - "[[Programmazione/TypeScript/Pagine/Variance]]"
title: Structural typing
---

# Structural typing

## Sintesi

TypeScript confronta soprattutto la **struttura** dei tipi, non il loro nome. La domanda pratica e direzionale: "questo valore e assegnabile al tipo richiesto?". Non basta che due tipi abbiano nomi diversi per distinguerli, ne basta contare le proprieta per stabilire la compatibilita.

Baseline degli esempi: **TypeScript 5.9.3**, `strict: true`, target `ES2022`. I blocchi TypeScript sono indipendenti.

## Quando usarlo

- Ricevere oggetti che rispettano un contratto senza richiedere una classe comune.
- Iniettare un servizio o un test double con le sole operazioni necessarie.
- Capire perche una variabile con proprieta aggiuntive viene accettata e un oggetto letterale no.
- Decidere quando servono brand, discriminanti o controlli runtime.

## Come funziona

Per assegnare un oggetto a un tipo, i membri richiesti devono esserci e avere tipi compatibili. Il controllo riguarda anche firme di funzione e membri annidati; proprieta opzionali, indici e tipi speciali introducono ulteriori regole.

Il tipo di destinazione non trasforma il valore, non rimuove proprieta e non esegue una validazione dei dati esterni. Una relazione valida in una direzione non implica quella inversa.

## API / Sintassi

### Proprieta aggiuntive e oggetti letterali

```ts
interface Point {
  x: number;
  y: number;
}

const labeled = { x: 10, y: 20, label: "start" };
const point: Point = labeled;

console.log(point === labeled); // true
console.log(JSON.stringify(point)); // {"x":10,"y":20,"label":"start"}

// Errore: controllo delle proprieta in eccesso sul letterale.
// const direct: Point = { x: 10, y: 20, label: "start" };

// Errore: manca label nel tipo statico di point.
// const back: typeof labeled = point;
```

Il controllo aggiuntivo sui letterali aiuta a intercettare refusi. Non rende `Point` un tipo "esatto": l'oggetto ricevuto puo avere altri campi. Non aggirare il controllo assegnando prima a una variabile solo per nascondere un errore; correggi il contratto o usa `satisfies` se vuoi controllare un'espressione.

### Classi e identita runtime

```ts
class Label {
  constructor(public text: string) {}
}

const plain: Label = { text: "ready" };
console.log(plain.text); // ready
console.log(plain instanceof Label); // false
```

Il confronto tra tipi di istanza non confronta automaticamente costruttori e membri statici. `instanceof`, invece, e un controllo JavaScript sulla catena dei prototipi.

Ci sono eccezioni alla semplice compatibilita dei membri pubblici: i membri TypeScript `private` e `protected` richiedono un'origine compatibile nella gerarchia di classi; anche i campi JavaScript `#private` distinguono le dichiarazioni. Due classi indipendenti con un campo privato dallo stesso nome non diventano per questo intercambiabili.

## Esempio pratico

Un consumer dipende da un contratto minimo, non dall'intera implementazione del logger.

```ts
interface Logger {
  info(message: string): void;
}

function runJob(logger: Logger): void {
  logger.info("start");
}

const messages: string[] = [];
const memoryLogger = {
  info(message: string) { messages.push(message); },
  clear() { messages.length = 0; },
};

runJob(memoryLogger);
console.log(messages.join(",")); // start
```

Non serve `implements Logger` sull'oggetto. Se il tipo di `info` cambia in modo incompatibile, il consumer non lo accetta. Un oggetto globale come `console` puo essere usato quando soddisfa la stessa firma.

## Varianti

### Tipi deboli con sole proprieta opzionali

Un tipo con sole proprieta opzionali non equivale a "qualsiasi oggetto". Nel caso seguente una variabile senza membri in comune viene respinta:

```ts
type Options = { timeout?: number };
const unrelated = { retries: 3 };
const matching = { timeout: 1000, retries: 3 };

const options: Options = matching;
console.log(options.timeout); // 1000
// const invalidOptions: Options = unrelated; // errore: nessun membro in comune
```

### Funzioni e tipi nominali simulati

Le funzioni possono ignorare argomenti che il chiamante passa, ma non richiedere arbitrariamente argomenti in piu. La direzione della compatibilita dei parametri e trattata in [[Programmazione/TypeScript/Pagine/Variance|Variance]].

Per distinguere valori strutturalmente identici ma semanticamente diversi, per esempio due identificatori stringa, usa un brand o un wrapper. Un semplice alias `type UserId = string` non introduce identita nominale.

## Errori comuni

- Confondere assegnabilita statica, uguaglianza dei valori e identita della classe.
- Pensare che un'annotazione elimini campi prima della serializzazione.
- Usare `as` per far passare dati non validati.
- Trattare `readonly` come una copia o un blocco delle mutazioni attraverso altri riferimenti.
- Assumere che tutti i casi siano sicuri solo perche `strict` e attivo: il sistema conserva compromessi, soprattutto con metodi e array mutabili.

## Checklist

- Ho individuato sorgente e destinazione dell'assegnazione?
- I campi e le firme richieste sono realmente presenti?
- Sto controllando un letterale o una variabile gia tipizzata?
- I dati esterni passano per un controllo runtime?
- Se devo separare due concetti identici nella forma, ho modellato questa distinzione?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces|Type Aliases e Interfaces]]
- [[Programmazione/TypeScript/Pagine/Implementazione di interfacce|Implementazione di interfacce]]
- [[Programmazione/TypeScript/Pagine/Brand Types|Brand Types]]
- [[Programmazione/TypeScript/Pagine/Variance|Variance]]

## Fonti

- [TypeScript - Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [TypeScript - Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
