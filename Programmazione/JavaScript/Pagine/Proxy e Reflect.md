---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - javascript
  - proxy
  - reflect
  - metaprogramming
  - objects
aliases:
  - Proxy JS
  - Reflect JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
  - "[[Programmazione/JavaScript/Pagine/Property Descriptors]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Prototypes]]"
  - "[[Programmazione/JavaScript/Pagine/Property Descriptors]]"
  - "[[Programmazione/JavaScript/Pagine/Error Handling]]"
title: Proxy e Reflect
---

# Proxy e Reflect

## Sintesi

`Proxy` crea un oggetto che intercetta operazioni rivolte a un **target**, tramite funzioni del relativo **handler**, dette trap. Non modifica il codice del target e non ne sostituisce tutti i riferimenti gia esistenti.

`Reflect` e un oggetto con metodi statici che espongono molte operazioni fondamentali del linguaggio. E utile per inoltrarle esplicitamente, ma non disattiva i Proxy e non garantisce che un'operazione riesca.

## Quando usarlo

- Logging e diagnostica di accessi generici.
- Validazione di un insieme controllato di operazioni.
- Virtualizzazione di proprieta o adapter con un contratto ben definito.
- Implementazione di sistemi reattivi, insieme a gestione delle dipendenze e notifiche.

Per un paio di campi, funzioni, getter/setter o una classe sono spesso piu leggibili. Proxy non offre da solo un sistema reattivo completo, lazy loading asincrono, autenticazione o isolamento di codice non fidato. Non usarlo come confine di sicurezza.

## Come funziona

### Target, handler e identita

```js
const target = { name: "Luca" };
const accesses = [];
const proxy = new Proxy(target, {
  get(object, property, receiver) {
    accesses.push(String(property));
    return Reflect.get(object, property, receiver);
  },
});

console.log(proxy.name); // "Luca"
console.log(proxy === target); // false
console.log(accesses); // ["name"]
```

Target e handler devono essere oggetti, incluse le funzioni. Un handler vuoto inoltra le operazioni, ma il Proxy mantiene un'identita distinta: come chiave di Map o WeakMap non equivale al target.

La trap riceve una chiave stringa o Symbol. Non concatenare un Symbol senza convertirlo se stai costruendo un messaggio di log. La lettura diretta di `target.name` non passa dal Proxy. Anche un oggetto annidato restituito senza ulteriori wrapper resta un oggetto ordinario: l'intercettazione non e automaticamente profonda.

### Receiver: il this di getter e setter

```js
const base = {
  name: "base",
  get label() {
    return this.name;
  },
};
const forwarded = new Proxy(base, {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver);
  },
});
const child = Object.create(forwarded);
child.name = "child";

console.log(child.label); // "child"
```

Qui il receiver e `child`, non `base`. Restituire `target[key]` leggerebbe il getter con this uguale al target e produrrebbe "base". `Reflect.get(target, key, receiver)` conserva il receiver originale.

Anche `Reflect.set(target, key, value, receiver)` conserva il this dei setter e puo definire una proprieta sul receiver, anziche sul target. Quando il receiver e il Proxy, l'inoltro di una normale assegnazione puo attivare anche la trap `defineProperty`. Non contare ogni trap come una modifica applicativa distinta.

`Reflect.get(proxy, key)` dentro la trap get dello stesso Proxy puo invece rientrare nella trap e causare ricorsione infinita. Inoltra al parametro target appropriato, non al Proxy che stai intercettando. Un target puo a sua volta essere un altro Proxy: Reflect non lo rende un oggetto ordinario.

## API / Sintassi

### Quale operazione viene intercettata?

| Trap | Operazione tipica | Attenzione |
| --- | --- | --- |
| get | obj.key, obj[key], Reflect.get | Getter e receiver; la chiave puo essere Symbol |
| set | Assegnazione, Reflect.set | Deve segnalare successo/fallimento; non copre ogni modifica |
| defineProperty | Object.defineProperty, campi pubblici di classe | Non equivale a un'assegnazione |
| deleteProperty | delete, Reflect.deleteProperty | Restituisce un esito booleano |
| has | key in obj, Reflect.has | Non e la trap usata da Object.hasOwn |
| ownKeys | Reflect.ownKeys, enumerazione delle chiavi proprie | Include anche Symbol e non enumerabili |
| getOwnPropertyDescriptor | Descrittori e controlli sulle proprieta proprie | Object.keys usa anche i descrittori per filtrare |
| getPrototypeOf, setPrototypeOf | Lettura e modifica del prototipo | Vincoli particolari su target non estensibili |
| isExtensible, preventExtensions | Estensibilita dell'oggetto | Il risultato deve essere coerente con il target |
| apply | Chiamata di funzione | Il target deve essere chiamabile |
| construct | new, Reflect.construct | Il target deve essere costruibile; il risultato un oggetto |

Un'operazione di alto livello puo usare piu metodi interni. Per esempio Object.keys non coincide con Reflect.ownKeys: esclude Symbol e chiavi non enumerabili.

### Reflect e valori di ritorno

Reflect non e un costruttore. `Reflect.set`, `defineProperty`, `deleteProperty`, `setPrototypeOf` e `preventExtensions` restituiscono un booleano per l'esito dell'operazione, ma possono comunque lanciare per argomenti invalidi, trap, getter/setter o invarianti violate.

```js
const locked = Object.freeze({ count: 1 });
const passThrough = new Proxy(locked, {
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver);
  },
});

console.log(Reflect.set(passThrough, "count", 2)); // false
try {
  (function () {
    "use strict";
    passThrough.count = 2;
  })();
} catch (error) {
  console.log(error.name); // TypeError
}
```

Un valore falsy dalla trap set fa fallire silenziosamente un'assegnazione non strict, ma causa TypeError in strict mode; gli ES Modules sono strict. Non restituire sempre true per nascondere un fallimento. Non significa necessariamente "assegnazione completata", e puo violare le invarianti.

`Reflect.defineProperty(obj, key, descriptor)` puo restituire false dove `Object.defineProperty` genera un errore; un descrittore intrinsecamente invalido puo far lanciare anche Reflect. Le API non sono intercambiabili senza considerare il contratto.

### Chiamate e costruzione

```js
function addToBase(value) {
  return this.base + value;
}
const tracedCall = new Proxy(addToBase, {
  apply(target, thisArg, args) {
    return Reflect.apply(target, thisArg, args);
  },
});
console.log(tracedCall.call({ base: 10 }, 2)); // 12
```

Inoltra esplicitamente il receiver della chiamata; usare `target(...args)` qui lo perderebbe. Per la costruzione conserva anche `newTarget`, importante per sottoclassi e prototipi:

```js
class Item {
  constructor(name) {
    this.name = name;
  }
}
const WrappedItem = new Proxy(Item, {
  construct(target, args, newTarget) {
    return Reflect.construct(target, args, newTarget);
  },
});
class SpecialItem extends WrappedItem {}
const item = new SpecialItem("demo");

console.log(item.name, item instanceof SpecialItem); // "demo", true
```

Una trap construct non rende costruibile una arrow function, e una trap apply non rende chiamabile un oggetto ordinario. Sono capacita del target.

### Invarianti: limiti alla virtualizzazione

Il motore controlla che il Proxy non contraddica alcune proprieta fondamentali del target. Violare questi vincoli produce TypeError anche se una trap restituisce un valore apparentemente valido.

| Operazione | Esempio di vincolo |
| --- | --- |
| get | Una data property propria non configurabile e non scrivibile deve esporre lo stesso valore |
| get | Un accessor proprio non configurabile senza getter deve restituire undefined |
| set | Non puo dichiarare riuscita una scrittura diversa su una proprieta propria non configurabile e non scrivibile |
| ownKeys | Niente duplicati; chiavi stringa/Symbol; include tutte le proprie non configurabili |
| ownKeys su target non estensibile | Le chiavi restituite devono coincidere con quelle proprie del target |
| has/deleteProperty | Non possono nascondere/eliminare con successo proprieta protette dalle rispettive invarianti |

Questa tabella non sostituisce i vincoli specifici di ogni trap, soprattutto per descrittori, prototipo ed estensibilita. Esempio di errore intenzionale, intercettato:

```js
const immutable = Object.freeze({ id: 7 });
const dishonest = new Proxy(immutable, {
  get(target, key, receiver) {
    if (key === "id") return 99;
    return Reflect.get(target, key, receiver);
  },
});
try {
  console.log(dishonest.id);
} catch (error) {
  console.log(error.name); // TypeError, non 99
}
```

## Esempio pratico

### Validare un record con schema limitato

Una sola trap set non basta: `Object.defineProperty` usa un'altra operazione, la cancellazione un'altra ancora, e un alias del target evita il Proxy.

Questo esempio costruisce internamente un record con **un unico campo proprio obbligatorio, age**, senza prototipo. Accetta interi sicuri non negativi, incluso zero; e una regola dimostrativa, non una verifica anagrafica. Il campo non e configurabile e l'oggetto non e estensibile, per impedire cambio in accessor, cancellazione e aggiunta di campi.

```js
function createAgeRecord(initialAge = 0) {
  function validateAge(value) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError("age deve essere un intero sicuro non negativo");
    }
  }

  validateAge(initialAge);
  const target = Object.create(null);
  Object.defineProperty(target, "age", {
    value: initialAge,
    writable: true,
    enumerable: true,
    configurable: false,
  });
  Object.preventExtensions(target);

  return new Proxy(target, {
    set(target, key, value, receiver) {
      if (key === "age") validateAge(value);
      return Reflect.set(target, key, value, receiver);
    },
    defineProperty(target, key, descriptor) {
      if (key === "age" && Object.hasOwn(descriptor, "value")) {
        validateAge(descriptor.value);
      }
      return Reflect.defineProperty(target, key, descriptor);
    },
  });
}
```

Uso dopo la definizione della factory:

```js
const user = createAgeRecord(30);
user.age = 31;
Object.defineProperty(user, "age", { value: 32 });
console.log(user.age); // 32
console.log(Reflect.deleteProperty(user, "age")); // false
console.log(Reflect.set(user, "name", "Luca")); // false

try {
  user.age = -1;
} catch (error) {
  console.log(error.name); // RangeError
}
console.log(user.age); // 32: il valore non valido non viene scritto
```

I due trap coprono assegnazione e definizione; il controllo e puro perche l'inoltro puo invocarlo due volte. I normali vincoli del target gestiscono cancellazione e schema. Object.freeze puo rendere il campo non scrivibile: non e necessario aggirarlo, le scritture successive devono fallire.

La factory non espone un alias del target. Non e pero una validazione generale di grafi annidati, record con getter arbitrari o oggetti provenienti da codice ostile. Per un'API applicativa semplice una funzione `setAge` puo essere una scelta migliore.

## Varianti

### Campi privati e oggetti nativi

Un Proxy non trasferisce su se stesso campi privati o internal slots del target. Un metodo letto tramite get, poi chiamato come `proxy.method()`, riceve di norma il Proxy come this.

```js
class Secret {
  #value = 7;
  read() {
    return this.#value;
  }
}
const wrappedSecret = new Proxy(new Secret(), {});
try {
  wrappedSecret.read();
} catch (error) {
  console.log(error.name); // TypeError: il Proxy non possiede #value
}

const wrappedMap = new Proxy(new Map([["key", 1]]), {});
try {
  console.log(wrappedMap.size);
} catch (error) {
  console.log(error.name); // TypeError: receiver senza gli slot di Map
}
```

Leggere `#value` non genera una trap get ordinaria. Un wrapper banale non e quindi trasparente per tutte le classi, Map, Date o API DOM.

Usare il target come receiver puo risolvere uno specifico getter nativo; i metodi possono richiedere un binding esplicito al target. Non applicare `bind(target)` indiscriminatamente: cambia this, puo cambiare identita del metodo e un metodo che restituisce this puo esporre il target. Per API note, preferisci un adapter esplicito; un wrapper universale richiede molti piu vincoli.

### Revoca

```js
const { proxy: temporary, revoke } = Proxy.revocable({
  profile: { name: "Luca" },
}, {});
const savedProfile = temporary.profile;

revoke();
revoke(); // Ripetibile
try {
  console.log(temporary.profile);
} catch (error) {
  console.log(error.name); // TypeError
}
console.log(savedProfile.name); // "Luca": il riferimento gia ottenuto resta valido
```

La revoca impedisce successive operazioni intercettate su quel Proxy. Non cancella risorse, Promise o effetti gia avviati, e non revoca ricorsivamente tutti i dati precedentemente restituiti. Non ogni operatore esegue una trap: per esempio `typeof temporary` resta possibile.

### Reattivita, lazy loading e virtualizzazione

Un motore reattivo deve definire quali letture registrare, quali scritture notificare e come gestire eliminazioni, enumerazione, array, alias e wrapper annidati. Una coppia get/set non risolve da sola scheduling e invalidazione.

Una trap get e sincrona: puo restituire una Promise, ma non trasforma automaticamente l'accesso a una proprieta in un valore gia caricato. Se una API puo fallire o richiede I/O, documenta l'asincronia oppure usa un metodo esplicito.

Misura il costo nei percorsi frequenti, senza assumere che Proxy sia sempre lento o gratuito. Non nascondere accessi di rete o log sensibili dietro una lettura apparentemente innocua.

## Errori comuni

- Usare target[key] perdendo il receiver di un getter.
- Chiamare Reflect sullo stesso Proxy dentro la propria trap, causando ricorsione.
- Dire che set intercetta ogni scrittura: defineProperty, class fields e alias seguono altri percorsi.
- Restituire sempre true invece dell'esito reale o ignorare strict mode.
- Omettere chiavi non configurabili da ownKeys o restituire duplicati.
- Nascondere un campo soltanto da Object.keys credendo di renderlo privato.
- Dimenticare Symbol, proprieta non enumerabili o metodi con requisiti sul this.
- Considerare un Proxy un clone, un wrapper profondo automatico o una barriera di sicurezza.

## Checklist

- Le operazioni ammesse e il comportamento delle trap sono documentati.
- Inoltro e receiver conservano la semantica necessaria.
- Validazione, defineProperty, delete e alias sono coerenti con il contratto.
- Descrittori, non estensibilita e invarianti sono rispettati.
- Errori e valori booleani vengono gestiti dal chiamante.
- Campi privati, internal slots e revoca sono considerati.
- Complessita e prestazioni sono giustificate rispetto a un'API esplicita.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]
- [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes]]
- [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks|Private Fields e Static Blocks]]
- [[Programmazione/JavaScript/Pagine/Strict Mode|Strict Mode]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]

## Fonti

- [MDN: Proxy e limiti dei wrapper](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).
- [MDN: Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect).
- [MDN: get, receiver e invarianti](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get).
- [MDN: set e risultato booleano](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set).
- [MDN: defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/defineProperty).
- [MDN: ownKeys e chiavi obbligatorie](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/ownKeys).
- [MDN: Reflect.set e receiver](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/set).
- [MDN: Reflect.construct e newTarget](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct).
- [MDN: Proxy.revocable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
