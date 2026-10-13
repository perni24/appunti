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
  - optimization
  - performance
  - v8
  - profiling
aliases:
  - JavaScript Performance
  - Ottimizzazione JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
  - "[[Programmazione/JavaScript/Pagine/Memory Lifecycle]]"
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Garbage Collection]]"
  - "[[Programmazione/JavaScript/Pagine/Memory Leaks]]"
  - "[[Programmazione/JavaScript/Pagine/Scheduling Browser]]"
  - "[[Programmazione/JavaScript/Pagine/Web Workers]]"
title: Optimization
---

# Optimization

## Sintesi

Ottimizzare significa migliorare un risultato misurabile: latenza, reattivita, memoria, tempo CPU o lavoro necessario al rendering. Non significa scegliere una sintassi presumibilmente piu veloce.

Prima identifica il collo di bottiglia, poi modifica una cosa alla volta e misura di nuovo, verificando che il comportamento resti corretto. Un'ottimizzazione che perde eventi, mostra risultati obsoleti o consuma memoria senza limite non e un miglioramento completo.

## Quando usarlo

Intervieni quando un caso d'uso reale e lento: una ricerca, l'apertura di una vista, un'elaborazione o una richiesta server. Distingui il costo iniziale dal lavoro ripetuto e il tempo CPU dall'attesa di rete o I/O.

Gli esempi sono indipendenti, salvo il filtro che usa `debounce` definita sotto. Sono esempi di contratti e tecniche, **non benchmark che dimostrano un'accelerazione** su ogni motore.

## Come funziona

### Partire da una misura e da uno scenario

1. Definisci input, azione e metrica: per esempio tempo fino al risultato e blocco dell'interazione.
2. Riproduci il carico con dati e dispositivo rappresentativi.
3. Registra una traccia e individua dove viene speso il tempo.
4. Formula un'ipotesi circoscritta e conserva una baseline.
5. Verifica equivalenza dei risultati, ripeti le misure e valuta anche memoria e complessita aggiunta.

Un **hot path** concentra lavoro per frequenza o costo, non semplicemente per lunghezza del codice. Nel profiler distingui tempo proprio e tempo totale comprensivo delle chiamate figlie.

Una misura sincrona minima, eseguibile nel browser o in Node moderno:

```js
const values = Array.from({ length: 10_000 }, (_, index) => index);
const start = performance.now();
const total = values.reduce((sum, value) => sum + value, 0);
const durationMs = performance.now() - start;

console.log({ total, durationMs }); // total: 49995000; durata variabile.
```

Qui la preparazione dei dati e fuori dall'intervallo. `performance.now()` usa un riferimento temporale monotono; la risoluzione puo essere ridotta dall'ambiente. Una singola durata molto piccola non e una classifica affidabile.

Per lavoro async devi includere l'attesa se vuoi misurare il tempo fino alla conclusione: misurare solo la creazione di una Promise non misura l'operazione. Il tempo trascorso include anche attese, non coincide con CPU impiegata.

### Scegliere lo strumento adatto

| Problema | Strumento | Limite |
| --- | --- | --- |
| Interazione lenta nel browser | Traccia Performance | Distingui script, style, layout e paint |
| Allocazioni o dati trattenuti | Memory e heap snapshot | Un picco non dimostra un leak |
| Caricamento iniziale | Network, strumenti di laboratorio come Lighthouse | Un punteggio non descrive ogni interazione reale |
| Segnare fasi applicative | User Timing: mark/measure | Nomi, durata e pulizia delle entry vanno gestiti |
| CPU in Node.js | Profiler del runtime | Riproduci lo stesso carico server |
| Esperienza degli utenti | Telemetria aggregata sul campo | Considera dispositivo, rete, privacy e distribuzione dei valori |

Nei confronti ripeti campioni, separa primo avvio da stato riscaldato, considera JIT, GC, cache, debug e throttling. Usa distribuzioni e percentili quando hai abbastanza osservazioni; non affidarti solo al campione migliore. Non eseguire log nel tratto che vuoi cronometrare.

### Ridurre il lavoro prima di cambiare sintassi

Un algoritmo, un accesso ripetuto al database, una lista renderizzata integralmente o una conversione superflua possono costare piu della scelta fra `for` e `map`.

```js
const products = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];
const allowedIds = ["p2", "p3"];
const allowed = new Set(allowedIds);
const visible = products.filter((product) => allowed.has(product.id));

console.log(visible.map((product) => product.id)); // ["p2", "p3"]
```

L'indice evita di ripetere una scansione di `allowedIds` per ogni prodotto. Costruirlo ha un costo e occupa memoria: puo convenire riusarlo, ma devi aggiornarlo quando cambiano gli ID. Non e una promessa universale di lookup a costo costante o di vantaggio per tre elementi.

Anche il riuso di un formatter evita costruzioni ripetute:

```js
const formatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});
const prices = [12.5, 3];
const labels = prices.map((price) => formatter.format(price));
console.log(labels);
```

Questo formatta numeri, non fornisce aritmetica monetaria esatta. Il caching deve avere durata e invalidazione ragionate; vedi [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]].

### Forme degli oggetti, array e JIT

V8 usa strutture interne dette Maps o hidden classes, diverse da `Map` del linguaggio. Forme e accessi coerenti possono favorire specializzazioni, ma sono dettagli del motore, non requisiti ECMAScript.

```js
function createPoint(x, y) {
  return { x, y };
}
const first = createPoint(1, 2);
const second = createPoint(3, 4);
```

Aggiunte, rimozioni e forme differenti possono cambiare le strategie interne. Non eliminare proprieta necessarie o sostituire `delete` con `undefined` solo per un consiglio di performance: presenza della proprieta, enumerazione e serializzazione cambiano.

V8 distingue anche rappresentazioni degli elementi degli array. Densita e tipi influenzano il percorso eseguito, ma gli algoritmi evolvono: evita regole assolute come “un array non potra mai tornare packed”. Un buco non e un elemento con valore undefined; rimuoverlo o riempirlo puo cambiare la semantica.

Le allocazioni temporanee possono aumentare il lavoro del GC. Pooling e mutazioni in place introducono pero ownership piu complessa e riferimenti longevi: misura prima. Le typed array servono quando il formato binario e appropriato, non come sostituto automaticamente piu veloce di ogni array.

### DOM: separare letture e scritture

Alternare una modifica di stile e una misura geometrica per ogni elemento puo costringere a ripetere layout sincroni. Raggruppare le letture e poi le scritture evita quell'alternanza; la prima lettura puo comunque richiedere un layout.

Questo esempio aggiunge spazio all'altezza border-box di elementi HTML la cui altezza CSS e modificabile, per esempio div block. Richiede elementi non trasformati, senza vincoli min/max o altri proprietari dello stile height; non riguarda gli inline non sostituiti, che ignorano height. Sovrascrive `box-sizing` e `height`:

```js
function growBoxes(elements, extra = 10) {
  if (!Number.isFinite(extra) || extra < 0) {
    throw new RangeError("Incremento non valido");
  }
  const nodes = Array.from(elements);
  if (!nodes.every((node) => node instanceof HTMLElement)) {
    throw new TypeError("Attesi elementi HTML dello stesso realm");
  }
  const heights = nodes.map((node) => node.getBoundingClientRect().height);
  nodes.forEach((node, index) => {
    node.style.boxSizing = "border-box";
    node.style.height = `${heights[index] + extra}px`;
  });
}
```

Su elementi esistenti della pagina:

```js
growBoxes(document.querySelectorAll(".measure-target"), 10);
```

La conversione con Array.from e necessaria per usare qui i metodi di array anche con una NodeList. Border-box evita di aggiungere nuovamente padding e bordi all'altezza misurata. Per valori da trasformazioni, elementi nascosti o layout vincolati serve un contratto diverso.

`requestAnimationFrame` puo raggruppare aggiornamenti visivi, ma non rende gratuita una lettura di layout dopo scritture e non sposta il lavoro su un thread separato.

## API / Sintassi

### Debounce trailing cancellabile

Esegue soltanto l'ultima chiamata dopo una pausa negli eventi. Conserva argomenti e receiver dell'ultima chiamata, non un'istantanea profonda dei dati. Un flusso continuo puo rimandare l'esecuzione indefinitamente.

```js
function debounce(callback, delay = 300) {
  if (typeof callback !== "function") throw new TypeError("Callback non valida");
  if (!Number.isInteger(delay) || delay < 0 || delay > 2_147_483_647) {
    throw new RangeError("Ritardo non valido");
  }
  let timerId;

  function debounced(...args) {
    const receiver = this;
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = undefined;
      callback.apply(receiver, args);
    }, delay);
  }

  debounced.cancel = () => {
    clearTimeout(timerId);
    timerId = undefined;
  };
  return debounced;
}
```

`cancel()` cancella il lavoro pianificato; non disabilita il wrapper, che puo essere richiamato. La funzione restituita non consegna il risultato della callback e non offre leading, flush o maxWait. I timer non garantiscono una scadenza esatta.

Il contratto e una callback sincrona. Un throw al momento dell'esecuzione viene segnalato nel task del timer, non alla chiamata iniziale; una Promise restituita non viene attesa. Se avvii lavoro async devi gestire esplicitamente il rifiuto.

### Throttle leading-only

Esegue subito la prima chiamata e scarta quelle troppo ravvicinate. Non pianifica un'esecuzione finale: **l'ultimo evento di una sequenza puo essere perso**.

```js
function throttleLeading(callback, delay = 100) {
  if (typeof callback !== "function") throw new TypeError("Callback non valida");
  if (!Number.isInteger(delay) || delay < 0 || delay > 2_147_483_647) {
    throw new RangeError("Intervallo non valido");
  }
  let lastRun = -Infinity;

  return function throttled(...args) {
    const now = performance.now();
    if (now - lastRun < delay) return;
    lastRun = now;
    return callback.apply(this, args);
  };
}
```

La prima chiamata passa anche se l'orologio parte da zero. L'intervallo e misurato fra inizi delle chiamate ammesse; un errore della callback viene propagato e consuma comunque quella finestra. Non ci sono timer pendenti da cancellare. Usa un'altra politica se il valore finale e indispensabile.

## Esempio pratico

### Filtro locale con smontaggio

Questo filtro mostra il comportamento del debounce **senza richieste di rete**. Esegui dopo il markup e dopo la definizione di debounce:

```html
<label for="language-filter">Linguaggio</label>
<input id="language-filter" type="search">
<output id="language-results"></output>
```

```js
function mountFilter(input, output) {
  if (!(input instanceof HTMLInputElement) || !(output instanceof HTMLOutputElement)) {
    throw new TypeError("Attesi input e output HTML dello stesso realm");
  }
  const choices = ["JavaScript", "Python", "Rust"];
  const initialText = output.textContent;
  let active = true;

  const update = debounce(() => {
    if (!active) return;
    const query = input.value.trim().toLowerCase();
    output.textContent = choices
      .filter((choice) => choice.toLowerCase().includes(query))
      .join(", ");
  }, 300);

  input.addEventListener("input", update);
  update();

  return function dispose() {
    if (!active) return;
    active = false;
    input.removeEventListener("input", update);
    update.cancel();
    output.textContent = initialText;
    input = null;
    output = null;
  };
}
```

Avvio:

```js
let disposeFilter = mountFilter(
  document.querySelector("#language-filter"),
  document.querySelector("#language-results"),
);
```

Alla chiusura della vista:

```js
disposeFilter();
disposeFilter = null;
```

Il componente possiede il testo dell'output; il cleanup e ripetibile. Il debounce riduce gli avvii, non il costo della singola ricerca: per dataset grandi servono anche un indice, paginazione o un'altra strategia.

Per una ricerca remota, debounce **non** cancella richieste gia iniziate, non impedisce risposte fuori ordine e non gestisce HTTP/JSON/errori. Abbinalo a [[Programmazione/JavaScript/Pagine/AbortController|AbortController]] e al controllo del risultato corrente; non passare semplicemente una callback async a questo wrapper ignorandone la Promise.

## Varianti

### Lavoro pesante e scheduling

- Dividi lavoro cooperativo in blocchi con budget: rinviare un unico blocco enorme con setTimeout sposta il blocco, non lo elimina.
- Usa periodi idle solo per lavoro rinviabile, con fallback e limiti.
- Valuta Web Workers se il lavoro e trasferibile fuori dal main thread; considera avvio, serializzazione, copie e comunicazione.
- Usa streaming, paginazione o virtualizzazione quando non serve elaborare o mostrare tutto.
- Riduci richieste e payload se il collo di bottiglia e la rete; non confonderlo con velocita del codice JS.
- Per bundle grandi valuta code splitting e caricamento differito, mantenendo corretti errori e stati di caricamento.

Gli esempi completi con budget, abort, protocollo ed errori sono in [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]] e [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]. Non usare un worker senza prevederne la terminazione.

### Tempo percepito e costo effettivo

Feedback tempestivo e contenuti progressivi possono migliorare l'esperienza senza ridurre il lavoro totale. Mantieni distinti tempo fino al primo feedback, tempo fino al risultato e memoria usata.

Una cache puo ridurre CPU o rete aumentando memoria e complessita di invalidazione. Anche un risultato piu veloce su un input piccolo puo peggiorare il caso grande: misura le dimensioni significative per l'app.

## Errori comuni

- Presentare un consiglio V8 come garanzia di tutti i motori.
- Cambiare presenza di proprieta, buchi o ordine per inseguire un microbenchmark.
- Misurare solo l'avvio di lavoro asincrono.
- Perdere this nei wrapper o lasciare debounce pendenti allo smontaggio.
- Confondere throttle leading-only con consegna garantita dell'ultimo evento.
- Sommare altezze border-box a uno stile content-box.
- Usare rAF, Promise o un timer come sinonimo di parallelismo.
- Affermare miglioramenti di prestazioni sulla sola base di test funzionali.

## Checklist

- Scenario, dati, metrica e baseline sono definiti.
- Il profilo distingue CPU, rete, layout e memoria.
- Il comportamento e preservato e testato anche sui limiti.
- I confronti usano piu osservazioni e condizioni coerenti.
- Cache e lavoro differito hanno proprietario e cleanup.
- Le modifiche sono locali e il costo di manutenzione resta giustificato.
- Il miglioramento e verificato nell'ambiente reale di destinazione.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]]
- [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]
- [[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]]

## Fonti

- [Chrome DevTools: analisi delle prestazioni](https://developer.chrome.com/docs/devtools/performance).
- [MDN: performance.now e precisione](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now).
- [MDN: User Timing con performance.measure](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure).
- [V8: hidden classes](https://v8.dev/docs/hidden-classes).
- [V8: elements kinds e aggiornamenti delle strategie](https://v8.dev/blog/elements-kinds).
- [web.dev: letture, scritture e layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing).
- [MDN: timer, callback e ritardi](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout).
- [Node.js: profiling di un'applicazione](https://nodejs.org/learn/getting-started/profiling).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
