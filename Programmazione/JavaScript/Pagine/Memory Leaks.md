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
  - memory-leaks
  - memory
  - performance
  - debugging
aliases:
  - Memory Leak JS
  - Perdite di memoria JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Memory Lifecycle]]"
  - "[[Programmazione/JavaScript/Pagine/Garbage Collection]]"
  - "[[Programmazione/JavaScript/Pagine/Closures]]"
related:
  - "[[Programmazione/JavaScript/Pagine/WeakMap e WeakSet]]"
  - "[[Programmazione/JavaScript/Pagine/AbortController]]"
  - "[[Programmazione/JavaScript/Pagine/Scheduling Browser]]"
  - "[[Programmazione/JavaScript/Pagine/Optimization]]"
title: Memory Leaks
---

# Memory Leaks

## Sintesi

In un'applicazione JavaScript un **memory leak** e, tipicamente, memoria trattenuta oltre la durata utile dei dati. Il garbage collector non conosce l'intenzione del programma: se rimane un percorso forte necessario per rendere un oggetto accessibile, non puo eliminarlo solo perche la vista che lo usava e stata chiusa.

Un aumento di memoria non basta a dimostrare un leak. Distingui riferimenti dimenticati, cache intenzionali, picchi temporanei di allocazione e risorse native ancora aperte.

## Quando usarlo

Consulta questa nota quando una SPA peggiora dopo molti cambi vista, si moltiplicano callback o timer, oppure cache e dati crescono senza limite.

Gli esempi sono indipendenti; markup, avvio e cleanup di ciascuna vista appartengono allo stesso caso d'uso. Quello con Fetch richiede un server same-origin con l'endpoint indicato. Gli esempi sul GC non ne misurano tempi o byte liberati.

## Come funziona

### Sintomi diversi, diagnosi diversa

| Situazione | Indizio | Cosa verificare |
| --- | --- | --- |
| Riferimento dimenticato | Istanze ancora presenti dopo ripetuti cicli di chiusura | Percorso che le trattiene e cleanup |
| Cache troppo grande | Numero di voci o byte in crescita | Limite, invalidazione e politica di espulsione |
| Allocazioni temporanee | Picchi e raccolte frequenti | Profilo di allocazione e costo del lavoro |
| Risorsa non chiusa | Connessioni, worker o subscription ancora attivi | API di chiusura e proprietario |
| Lavoro async obsoleto | Risultato dopo il cambio vista | Abort, gestione dell'esito e guardia sullo stato |

Un risultato obsoleto puo essere un bug di correttezza anche senza leak permanente. Una Promise pending non e da sola una root eterna; perdere il suo riferimento non cancella l'operazione sottostante.

### Percorsi che trattengono i dati

Cerca un percorso concreto, non una categoria colpevole in assoluto:

```text
window -> listener resize -> closure -> pannello rimosso
timer attivo -> callback -> dati del componente
cache di modulo -> Map -> risultati mai invalidati
registro di debug -> array -> nodi DOM distaccati
```

Una closure mantiene accesso ai binding che usa; non devi presumere che ogni variabile del suo scope resti fisicamente allocata per sempre. Se un handler necessita soltanto di un ID immutabile, puoi fargli usare quel valore invece dell'intero record:

```js
function createIdLogger(data) {
  const id = data.id;
  return () => console.log(id);
}

const logId = createIdLogger({ id: "record-1", payload: [1, 2, 3] });
logId(); // record-1
```

Il contratto e un record ordinario con ID stringa. Il logger fotografa l'ID iniziale: non seguira una modifica successiva del record. Questa scelta riduce le dipendenze logiche, non certifica quanti byte il motore conservera.

### Globali accidentali e DOM distaccato

In uno script classico non strict, assegnare a un nome inesistente puo creare una proprieta globale. Controesempio da non usare in produzione:

```js
function createAccidentalGlobal() {
  accidentalRecord = { id: "record-1" };
}
```

In strict mode e nei moduli ES la chiamata genera invece un ReferenceError se il nome non e dichiarato. Usa dichiarazioni esplicite e il linter. Anche una Map dichiarata correttamente a livello di modulo puo crescere senza limiti: strict mode non risolve la durata dei dati.

```js
let removedNode = document.createElement("section");
document.body.append(removedNode);
removedNode.remove();
console.log(removedNode.isConnected); // false: il riferimento JS esiste ancora.
removedNode = null;
```

Rimuovere un nodo dal documento toglie quel collegamento, non gli alias conservati altrove. Viceversa, un nodo scollegato con un listener su se stesso non e automaticamente un leak: se l'intero gruppo e irraggiungibile, un ciclo interno non impedisce da solo la raccolta.

### Timer, listener e richieste

Un interval attivo conserva il lavoro necessario a eseguire la callback. Chi lo crea deve sapere quando fermarlo. Un timeout concluso non equivale a un interval permanente, ma puo trattenere dati finche attende. Per un ticker completo vedi [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]]; per polling senza sovrapposizione vedi [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]].

Il problema dei listener non e il fatto che una funzione sia anonima: anche una arrow si puo conservare in una variabile o registrare con un signal. Ricreare una funzione con lo stesso corpo non permette invece a `removeEventListener` di ritrovare quella originale.

`once: true` rimuove un listener quando l'evento viene gestito, non quando il componente viene smontato. Se l'evento non arriva, non sostituisce il cleanup.

Per una richiesta, la cancellazione deve essere disponibile **mentre il lavoro e in corso**. Chiamare abort solo dopo `await fetch(...)` non annulla l'attesa gia conclusa; puo ancora influire sulla lettura del corpo non terminata. Il chiamante deve comunque gestire rifiuti e risultati tardivi.

## API / Sintassi

Abbina ogni risorsa al cleanup del suo proprietario:

| Risorsa | Operazione | Attenzione |
| --- | --- | --- |
| Timer | `clearTimeout(id)`, `clearInterval(id)` | Non interrompono callback sincrone gia in esecuzione |
| Listener | `removeEventListener` oppure abort del signal usato in registrazione | Identita della callback, target, tipo e capture devono corrispondere |
| Fetch | `controller.abort()` | Non annulla effetti gia avvenuti sul server |
| Subscription | Funzione di unsubscribe dell'API | Non sempre coincide con la rimozione di un listener DOM |
| Observer / worker / socket | `disconnect()`, `terminate()`, `close()` | Semantica e completamento dipendono dalla risorsa |
| Object URL | `URL.revokeObjectURL(url)` | Solo quando nessun utilizzatore ne ha piu bisogno |
| Cache | `delete(key)`, `clear()` o eviction | Rimuovere una voce non distrugge gli alias esterni |

Il cleanup dovrebbe essere idempotente e limitato alle risorse possedute. Per esempio, non usare una pulizia globale per cancellare timer o listener di altri componenti.

## Esempio pratico

### Vista con listener cancellabile

Esegui il codice dopo questo markup. La vista possiede il testo di `output`, non il pannello o altri listener:

```html
<section id="panel">Contenuto della vista</section>
<output id="panel-width"></output>
```

```js
function mountPanelSize(panel, output) {
  if (!(panel instanceof HTMLElement) || !(output instanceof HTMLOutputElement)) {
    throw new TypeError("Attesi un pannello HTML e un elemento output");
  }
  const controller = new AbortController();
  const initialText = output.textContent;
  let active = true;

  const render = () => {
    if (!active) return;
    output.textContent = String(Math.round(panel.getBoundingClientRect().width));
  };

  window.addEventListener("resize", render, { signal: controller.signal });
  render();

  return function dispose() {
    if (!active) return;
    active = false;
    controller.abort();
    output.textContent = initialText;
    panel = null;
    output = null;
  };
}
```

Avvio:

```js
let disposePanel = mountPanelSize(
  document.querySelector("#panel"),
  document.querySelector("#panel-width"),
);
```

Alla chiusura della vista:

```js
disposePanel();
disposePanel(); // Nessun effetto aggiuntivo.
disposePanel = null;
```

Il signal rimuove la registrazione e il reset dei parametri evita di conservare accesso ai nodi tramite il cleanup. Non modifica gli alias del chiamante. Gli elementi devono appartenere allo stesso realm del codice; non montare due proprietari sullo stesso output. Per osservare cambi di dimensione non causati da resize della finestra serve valutare ResizeObserver, non aggiungere polling indiscriminato.

### Cache LRU con un limite di voci

Una WeakMap non accetta ID stringa e non offre un limite misurabile. Per questi casi una Map con eviction esplicita e piu adatta. Questa piccola cache elimina la voce usata meno recentemente quando supera il limite:

```js
function createLruCache(maxEntries) {
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) {
    throw new RangeError("Il limite deve essere un intero positivo sicuro");
  }
  const entries = new Map();

  return {
    get(key) {
      if (!entries.has(key)) return undefined;
      const value = entries.get(key);
      entries.delete(key);
      entries.set(key, value);
      return value;
    },
    has(key) {
      return entries.has(key);
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, value);
      if (entries.size > maxEntries) {
        entries.delete(entries.keys().next().value);
      }
    },
    delete(key) {
      return entries.delete(key);
    },
    clear() {
      entries.clear();
    },
    get size() {
      return entries.size;
    },
  };
}
```

Uso nello stesso script:

```js
const cache = createLruCache(2);
cache.set("a", { name: "Ada" });
cache.set("b", { name: "Lin" });
cache.get("a");
cache.set("c", { name: "Sam" });
console.log(cache.has("a"), cache.has("b"), cache.size); // true, false, 2
```

`get` e `set` aggiornano la recenza; `has` no. Un valore `undefined` e ammesso: usa `has` per distinguerlo da una voce assente. `set` non restituisce la cache e non supporta concatenamento. I valori restano condivisi, non vengono clonati.

Il limite riguarda **voci, non byte**. La cache non offre TTL, deduplicazione delle richieste, persistenza o cleanup di risorse nei valori. Salvare Promise rifiutate richiede inoltre una politica di invalidazione. Un TTL che cancella solo alla lettura puo lasciare in memoria voci scadute mai piu consultate.

### Annullare una richiesta quando la vista si chiude

Il server dimostrativo deve rispondere a `GET /api/summary` con JSON `{"count": 3}`. `count` e un intero sicuro non negativo. Il codice richiede un `output` HTML dello stesso realm e ne possiede il testo:

```html
<output id="summary"></output>
```

```js
function mountSummary(output) {
  if (!(output instanceof HTMLOutputElement)) {
    throw new TypeError("Atteso un elemento output");
  }
  const controller = new AbortController();
  const initialText = output.textContent;
  let active = true;
  output.textContent = "Caricamento...";

  const done = (async () => {
    try {
      const response = await fetch("/api/summary", { signal: controller.signal });
      if (!active) return;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!active) return;
      if (data === null || typeof data !== "object" ||
          !Number.isSafeInteger(data.count) || data.count < 0) {
        throw new TypeError("Risposta non valida");
      }
      output.textContent = `Totale: ${data.count}`;
    } catch (error) {
      if (!active) return;
      output.textContent = "Dati non disponibili";
      console.error(error);
    }
  })();

  return {
    done,
    dispose() {
      if (!active) return;
      active = false;
      controller.abort();
      output.textContent = initialText;
      output = null;
    },
  };
}
```

Avvio:

```js
let summaryView = mountSummary(document.querySelector("#summary"));
```

Alla chiusura, senza attendere prima la richiesta:

```js
summaryView.dispose();
summaryView = null;
```

`done` permette a test o chiamanti di attendere la conclusione del lavoro gestito; gli errori di rete, HTTP, JSON o schema vengono gestiti internamente. Non e il valore JSON e non certifica una richiesta riuscita.

La guardia `active` impedisce aggiornamenti dopo lo smontaggio anche se un'operazione intermedia non collabora con l'abort. Non offre timeout, retry o concorrenza fra ricerche successive: per questi casi vedi [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]. La guardia non cancella lavoro CPU sincrono ne garantisce rilascio immediato dei dati di un'operazione ancora sospesa.

## Varianti

### Procedura di diagnosi

1. Definisci un ciclo ripetibile, per esempio apri una vista, interagisci e chiudila.
2. Esegui un primo ciclo di riscaldamento e torna allo stato iniziale.
3. Acquisisci uno snapshot di riferimento nel pannello Memory.
4. Ripeti piu volte lo stesso ciclo, lasciando terminare o annullando i lavori previsti.
5. Confronta gli snapshot: cerca istanze aggiunte e percorsi di ritenzione, non solo memoria totale.
6. Correggi il proprietario del riferimento e ripeti lo scenario.

In Chrome lo snapshot avvia una raccolta; il pulsante diagnostico di GC, dove disponibile, e un aiuto di analisi, non una API applicativa o una prova assoluta. Una sequenza di snapshot confrontabili vale piu di un unico campione.

Esamina **Retainers**, nodi Detached e differenze di istanze. Un nodo distaccato puo essere trattenuto intenzionalmente per riuso; occorre stabilire se quel percorso sia previsto. Allocation instrumentation aiuta a collegare le allocazioni allo scenario riprodotto.

### Limiti degli strumenti

Console, debugger, estensioni e variabili temporanee degli strumenti possono mantenere riferimenti. Evita di conservare proprio gli oggetti sospetti mentre misuri. Non condividere snapshot senza controllarli: possono contenere dati sensibili.

Heap JS, buffer, DOM e memoria residente del processo sono metriche diverse. Un andamento a dente di sega puo essere normale; una base che cresce ripetutamente dopo cicli equivalenti merita indagine, ma non identifica da sola la causa. Per le metriche Node vedi [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]].

## Errori comuni

- Aspettare la richiesta prima di rendere disponibile il comando di annullamento.
- Rimuovere un nodo ma lasciare il suo listener su window o la sua voce in un registro.
- Confondere funzione anonima con funzione impossibile da rimuovere.
- Usare `once` come sostituto dello smontaggio.
- Conservare una cache o un elenco di cleanup senza limiti.
- Chiamare `null` su un alias e ignorare gli altri percorsi.
- Sostituire il cleanup con WeakRef o FinalizationRegistry.
- Dichiarare risolto un leak solo perche un test non riceve piu eventi.

## Checklist

- Ogni timer, listener, subscription e richiesta ha un proprietario.
- Cleanup ripetuto e risultati successivi allo stop non producono effetti.
- Cache e registri hanno limite, invalidazione o durata documentati.
- Gli oggetti sospetti hanno un percorso di ritenzione identificato.
- Le misure sono confrontate dopo stati equivalenti e senza riferimenti di debug superflui.
- I test funzionali verificano i contratti; le conclusioni sulla memoria richiedono misure dedicate.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]]
- [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]]
- [[Programmazione/JavaScript/Pagine/WeakMap e WeakSet|WeakMap e WeakSet]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Closures|Closures]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]

## Fonti

- [Chrome DevTools: diagnosi di leak, bloat e raccolte frequenti](https://developer.chrome.com/docs/devtools/memory-problems).
- [Chrome DevTools: heap snapshot, confronto e riferimenti](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots).
- [MDN: listener, identita, once e signal](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener).
- [MDN: AbortController.abort e lettura dei corpi](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort).
- [MDN: gestione della memoria e raggiungibilita](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
