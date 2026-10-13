---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - design-patterns
  - architecture
  - oop
aliases:
  - Pattern JavaScript
  - Design Pattern JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Functional Programming]]"
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Testing]]"
title: Design Patterns
---

# Design Patterns

## Sintesi

I design pattern sono soluzioni ricorrenti a problemi di progettazione.

Non sono codice da copiare meccanicamente: sono modelli mentali per organizzare responsabilita, dipendenze e creazione degli oggetti.

---

## Quando usarlo

Usa un design pattern quando riconosci un problema ricorrente e il pattern rende il codice piu chiaro, testabile o estendibile.

E utile quando:

- la creazione degli oggetti e complessa;
- hai piu algoritmi intercambiabili;
- devi notificare piu parti di un cambiamento;
- vuoi isolare dipendenze;
- stai rimuovendo duplicazione reale.

Non partire dal pattern: parti dal problema. Un pattern applicato troppo presto aggiunge astrazione senza beneficio.

Gli esempi sono indipendenti salvo i richiami espliciti. Le factory e le callback qui sono sincrone; i blocchi con export richiedono un modulo ES. Sono implementazioni didattiche con contratti dichiarati, non librerie complete per validazione o messaggistica.

## Come funziona

### Factory
Una factory centralizza la creazione di oggetti.

```js
function createTransport(type) {
  if (type === "car") {
    return { type: "car", wheels: 4 };
  }

  if (type === "bike") {
    return { type: "bike", wheels: 2 };
  }

  throw new Error("Tipo non supportato");
}
```

Utile quando la creazione dipende da configurazione o input. Ogni chiamata restituisce un oggetto distinto; i tipi sconosciuti generano un errore invece di scegliere un fallback implicito.

Questa e una **simple factory**, non necessariamente il pattern GoF Factory Method, che delega la creazione a implementazioni specializzate. Non servono una classe o una gerarchia per ogni funzione che crea oggetti.

---
### Singleton
Un singleton controlla la creazione e l'accesso a un'istanza condivisa. In JavaScript spesso basta uno stato a livello di modulo, senza una classe con getInstance. Esempio config.mjs:

```js
export const config = Object.freeze({
  apiUrl: "https://api.example.com",
});
```

Gli import che risolvono allo stesso modulo condividono quell'oggetto nello stesso contesto di caricamento. Non e una singola istanza universale tra tab, worker, processi o copie diverse del bundle. In Node URL con query o fragment differenti possono identificare moduli distinti.

freeze protegge qui la proprieta stringa; non congelerebbe automaticamente dati annidati. Non e una misura di riservatezza: configurazioni incluse nel frontend sono leggibili.

Usalo con cautela: stato condiviso puo accoppiare i test e, sul server, mescolare richieste o utenti. Passa dipendenze e stato per richiesta a factory o funzioni quando devono essere isolati.

---
### Module pattern
Prima degli ES modules si usavano closure per esporre API pubblica e nascondere dettagli.

```js
const counter = (() => {
  let value = 0;

  return {
    increment() {
      value += 1;
    },
    getValue() {
      return value;
    },
  };
})();
```

Oggi gli ES modules coprono molti casi in modo nativo.

La IIFE viene eseguita subito e una volta per ogni valutazione di quel blocco; la closure conserva value. Non e un meccanismo di singleton tra script diversi. Per piu contatori usa una factory che restituisce ogni volta una nuova closure. Il contatore qui e solo dimostrativo: non gestisce il superamento degli interi sicuri.

---
### Observer
Observer collega direttamente un subject a piu listener. Pub/sub usa generalmente un intermediario e argomenti o canali: sono modelli affini, non sinonimi perfetti, e nessuno implica da solo esecuzione asincrona o consegna garantita.

Questo Subject ha una politica esplicita: notifica sincrona in ordine di iscrizione, snapshot iniziale, nuove iscrizioni rinviate alla notifica successiva, iscrizioni rimosse prima del turno saltate. Due subscribe dello stesso callback sono due iscrizioni indipendenti.

```js
class Subject {
  #listeners = new Set();

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("Listener non valido");
    const subscription = { listener };
    this.#listeners.add(subscription);
    return () => this.#listeners.delete(subscription);
  }

  notify(value) {
    for (const subscription of [...this.#listeners]) {
      if (!this.#listeners.has(subscription)) continue;
      const { listener } = subscription;
      listener(value);
    }
  }
}
```

Lo snapshot evita che un listener che continua a iscriverne altri prolunghi senza limite il ciclo corrente. Un semplice ciclo sul Set vivo non avrebbe questo contratto.

```js
const subject = new Subject();
const unsubscribe = subject.subscribe((value) => console.log(value));
subject.notify("pronto"); // stampa "pronto"
unsubscribe();
unsubscribe(); // cleanup ripetibile
subject.notify("altro"); // non stampa
```

Il primo errore di un listener si propaga e interrompe la notifica: gli effetti gia eseguiti non vengono annullati. Le callback devono essere sincrone; le Promise restituite non vengono attese ne intercettate. Se serve notificare tutti malgrado gli errori, scegli e testa una diversa politica di raccolta degli errori.

Il payload non viene copiato o congelato: i listener devono trattarlo come sola lettura. Non chiamare notify ricorsivamente senza un limite: genera nuove notifiche nello stesso stack. Chi si iscrive deve conservare e chiamare unsubscribe al termine del proprio ciclo di vita. Questo contratto non coincide automaticamente con EventTarget o EventEmitter.

---
### Strategy
Strategy permette di cambiare algoritmo senza cambiare il chiamante.

```js
const discountStrategies = new Map([
  ["percent", (price, value) => {
    if (value < 0 || value > 1) throw new RangeError("Percentuale fuori intervallo");
    return price - price * value;
  }],
  ["fixed", (price, value) => {
    if (value < 0 || value > price) throw new RangeError("Sconto fuori intervallo");
    return price - value;
  }],
]);

function applyDiscount(price, type, value) {
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(value)) {
    throw new TypeError("Servono prezzo non negativo e valore numerico finito");
  }
  const strategy = discountStrategies.get(type);
  if (!strategy) throw new RangeError("Strategia sconosciuta");
  return strategy(price, value);
}
```

percent usa una frazione tra 0 e 1; fixed usa la stessa unita di price e non puo superarlo. applyDiscount(100, "percent", 0.2) restituisce 80. Il calcolo con Number e dimostrativo, non una politica di arrotondamento contabile.

La Map contiene solo le strategie registrate: nomi come constructor o toString non diventano funzioni ereditate richiamabili. Il registro deve rimanere sotto controllo del modulo, non essere modificabile da input esterni. Ogni strategia deve rispettare lo stesso contratto di input, output ed errori.

---
### Decorator
Decorator aggiunge comportamento preservando il contratto dell'operazione avvolta. Un wrapper di funzione e una forma semplice di questa idea; non e la sintassi @decorator discussa in [[Programmazione/JavaScript/Pagine/Decorators|Decorators]].

Logging dell'invocazione con logger iniettato: non stampare automaticamente tutti gli argomenti, che potrebbero contenere password o token.

```js
function withLogging(fn, log) {
  if (typeof fn !== "function" || typeof log !== "function") {
    throw new TypeError("Servono funzione e logger");
  }
  return function (...args) {
    log("Invocazione");
    return Reflect.apply(fn, this, args);
  };
}
```

La funzione ordinaria conserva il this del chiamante; un'arrow lo catturerebbe dal punto in cui e definita. Reflect.apply inoltra argomenti e receiver, restituendo il risultato originale, compresa la stessa Promise. Gli errori sincroni della funzione attraversano il wrapper.

```js
const service = {
  prefix: "ID:",
  format(value) { return `${this.prefix}${value}`; },
};
service.format = withLogging(service.format, (message) => console.log(message));
console.log(service.format(7)); // stampa "Invocazione", poi "ID:7"
```

Il log e sincrono e deve essere progettato per non lanciare: se fallisce, fn non viene chiamata. Il wrapper registra l'avvio, non il successo o la durata di una Promise; non gestisce i suoi rifiuti al posto del chiamante. Non usarlo con new e non presumere che preservi name, length o proprieta custom della funzione.

---

## API / Sintassi

Non esiste una API unica per i design pattern. Riferimento alle implementazioni sopra:

| Esigenza | Strumento | Contratto da dichiarare |
| --- | --- | --- |
| Creare un oggetto | createTransport(type) | Tipi accettati e nuova istanza |
| Condividere configurazione | export const config | Ambito della condivisione e mutabilita |
| Notificare cambiamenti | subscribe / notify | Cleanup, ordine, errori, sincronia |
| Scegliere un algoritmo | applyDiscount | Strategie ammesse e limiti degli input |
| Aggiungere comportamento | withLogging | This, argomenti, risultato ed errori |

JavaScript permette pattern sia a oggetti sia funzionali. Spesso una funzione o un modulo ES sono sufficienti dove in altri linguaggi servirebbe una classe.

## Esempio pratico

Strategy per comporre validazioni testuali. required rifiuta stringhe vuote o di soli spazi; emailShape controlla solo una forma minima e una lunghezza massima dimostrativa. Non certifica conformita completa agli standard email, proprieta dell'indirizzo o recapitabilita.

```js
const validators = new Map([
  ["required", (value) => typeof value === "string" && value.trim() !== ""],
  ["emailShape", (value) => typeof value === "string" && value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)],
]);

function validate(value, rules) {
  if (!Array.isArray(rules)) throw new TypeError("Serve un array di regole");
  const selected = [];
  for (let index = 0; index < rules.length; index += 1) {
    if (!Object.hasOwn(rules, index)) throw new TypeError("Array sparso non ammesso");
    const rule = rules[index];
    if (typeof rule !== "string" || !validators.has(rule)) {
      throw new RangeError("Regola sconosciuta");
    }
    selected.push(validators.get(rule));
  }
  return selected.every((validator) => validator(value));
}

console.log(validate("luca@example.com", ["required", "emailShape"])); // true
console.log(validate("   ", ["required"])); // false
```

Il chiamante non contiene `if` per ogni regola: sceglie strategie da una mappa esplicita.

Tutte le regole vengono controllate prima di eseguirne una: una configurazione sconosciuta deve generare errore anche se required fallirebbe subito. Dopo questa fase every si ferma al primo false; con [] restituisce true perche non ci sono vincoli. Non usare callback async in questo registro.

Il controllo non normalizza il valore: per esempio gli spazi esterni rendono emailShape falsa. Se decidi di fare trim, rendilo una fase esplicita e valida il valore che userai realmente. La validazione client serve alla UI e non sostituisce quella sul server.

## Varianti

- **Creazionali**: factory, builder, singleton.
- **Strutturali**: adapter, decorator, facade.
- **Comportamentali**: observer, strategy, command.
- **Funzionali**: higher-order function, composition, partial application.
- **Modulari**: module pattern, dependency injection leggera.
- **Event-driven**: pub/sub, EventEmitter, observer.

Le ultime tre voci descrivono tecniche e organizzazione del codice, non ulteriori categorie ufficiali del catalogo GoF. Adapter adatta un'interfaccia incompatibile; Facade ne espone una piu semplice; Decorator aggiunge comportamento mantenendo l'interfaccia attesa. Dependency injection significa passare una dipendenza invece di recuperarla implicitamente: il parametro log di withLogging ne e un esempio senza container.

## Errori comuni

- Applicare pattern solo per rendere il codice "piu architetturale".
- Usare singleton per stato che dovrebbe essere esplicito.
- Creare astrazioni prima di avere duplicazione reale.
- Confondere pattern con framework.
- Rendere difficile il debug con troppi layer.
- Chiamare una strategia tramite una chiave non verificata su un oggetto ordinario.
- Dimenticare unsubscribe o lasciare indefiniti gli errori dei listener.
- Perdere this o return in un wrapper; confondere avvio asincrono e completamento.
- Considerare un modulo singleton globale a tutti i processi o conservare dati per utente in stato condiviso.

---

## Checklist

### Checklist operativa
- Parti dal problema, non dal pattern.
- Preferisci soluzioni semplici finche bastano.
- Usa factory per creazione condizionale.
- Usa observer per notifiche multiple.
- Usa strategy per algoritmi intercambiabili.
- Verifica che il pattern migliori testabilita e manutenzione.
- Prova strategie inesistenti, cleanup ripetuto, iscrizioni durante notify ed errori delle callback.
- Dichiara l'ambito dello stato condiviso e mantieni la possibilita di iniettare dipendenze nei test.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Functional Programming|Functional Programming]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
- [[Programmazione/JavaScript/Pagine/Context|Context]]
- [[Programmazione/JavaScript/Pagine/Map e Set|Map e Set]]
- [[Programmazione/JavaScript/Pagine/Decorators|Decorators]]
- [[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]]

## Fonti

- [Addy Osmani - Learning JavaScript Design Patterns](https://patterns.addy.ie/)
- [Patterns.dev - Singleton Pattern e limiti dello stato condiviso](https://www.patterns.dev/vanilla/singleton-pattern/)
- [Patterns.dev - Observer Pattern](https://www.patterns.dev/vanilla/observer-pattern/)
- [MDN - Reflect.apply](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/apply)
- [MDN - Set.prototype.forEach e modifiche durante l'iterazione](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/forEach)
- [MDN - Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- [Node.js - ES modules, URL e cache](https://nodejs.org/api/esm.html#urls)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
