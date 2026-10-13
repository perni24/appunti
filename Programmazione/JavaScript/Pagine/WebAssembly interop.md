---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - javascript
  - webassembly
  - performance
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Web Workers]]"
  - "[[Programmazione/Rust/Pagine/wasm-bindgen]]"
title: WebAssembly interop
---

# WebAssembly interop

## Sintesi

**WebAssembly interop** e il confine tra JavaScript e codice WebAssembly (Wasm). JavaScript carica il modulo, fornisce import e usa export; il modulo esegue istruzioni compilate, per esempio da Rust, C o C++, oppure descritte in formato testuale WAT.

Wasm non e automaticamente piu veloce, asincrono o multithread. Una funzione esportata ordinaria viene chiamata **sincronicamente**: un calcolo lungo puo bloccare il main thread come JavaScript. Il vantaggio va misurato insieme a download, compilazione, inizializzazione e conversione dei dati.

## Quando usarlo

- Porting di librerie native, codec ed elaborazione numerica.
- Elaborazione di immagini, audio o grandi buffer.
- Riutilizzo di un nucleo computazionale fra applicazioni diverse, se target e dipendenze lo permettono.
- Interoperabilita con una libreria gia distribuita come Wasm.

Per normale logica UI, piccoli calcoli e frequenti chiamate DOM, considera prima JavaScript. Una funzione `add` e utile per capire l'interfaccia, **non** dimostra un vantaggio prestazionale.

La nota usa moduli core, memoria **wasm32 non condivisa** e API JavaScript browser. I frammenti con top-level `await` richiedono un modulo; i nomi come `instance` e `compiledModule` si riferiscono al caricamento completo sotto, non a variabili fornite dal browser.

## Come funziona

### Byte, Module e Instance

| Oggetto | Significato |
| --- | --- |
| File `.wat` | Rappresentazione testuale da compilare; non e il binario accettato da `instantiate` |
| File `.wasm` / byte | Formato binario da scaricare e validare/compilare |
| `WebAssembly.Module` | Codice compilato riutilizzabile per creare istanze |
| `WebAssembly.Instance` | Istanza eseguibile con export e stato |
| `WebAssembly.Memory` | Memoria lineare accessibile tramite viste sui byte |
| `WebAssembly.Table` / `Global` | Tabelle di riferimenti e globali, se previsti dal contratto del modulo |

Due istanze dello stesso modulo non condividono automaticamente la memoria definita internamente. Possono pero importare lo stesso oggetto `Memory` o `Global`: il contratto degli import decide quali risorse sono comuni.

### Import ed export

Un modulo non trova da solo `console`, DOM, Fetch o filesystem. L'host gli fornisce funzioni/risorse nominate, oppure un binding generato costruisce questa integrazione.

Per un import WAT chiamato `"env" "log"`, l'oggetto JavaScript deve avere la forma `{ env: { log: funzione } }`. Namespace, nome e tipo devono corrispondere. Non inventare `imports = {}` se la libreria richiede un runtime.

Gli export si leggono da `instance.exports`. Un file con estensione corretta non garantisce che esponga `add`, la memoria o l'ABI attesa. `WebAssembly.Module.imports(module)` ed `exports(module)` aiutano a ispezionare nomi e categorie, ma non sostituiscono la documentazione completa delle firme.

### Tipi al confine

| Tipo Wasm | Valore JavaScript | Attenzione |
| --- | --- | --- |
| `i32` | `Number` | Conversione a 32 bit; il risultato esposto e signed |
| `i64` | `BigInt` | Usa per esempio `41n`, non il Number `41` |
| `f32` / `f64` | `Number` | `f32` riduce la precisione rispetto al Number JS |
| `externref` | Riferimento a un valore JS | Non equivale a serializzare un oggetto nella memoria lineare |

Le firme numeriche raw non sono validatori applicativi: un decimale passato a `i32` viene convertito, non necessariamente rifiutato. `i32.add` lavora modulo 2^32, quindi l'overflow non genera automaticamente un errore.

Stringhe, array e strutture richiedono un contratto: codifica, layout, puntatore, lunghezza, proprietario della memoria e durata. Binding generati o estensioni specifiche possono fornire interfacce piu ricche; non presumere che qualunque modulo accetti direttamente un oggetto JS.

### Memoria lineare non significa memoria condivisa fra thread

La memoria lineare e una sequenza di byte. Per il formato usato qui una pagina misura **64 KiB**. Un puntatore wasm32 e un offset in quella memoria, non un indirizzo arbitrario del processo.

JavaScript e Wasm possono leggere gli stessi byte di una memoria non condivisa: questo non richiede `SharedArrayBuffer`. `new Uint8Array(memory.buffer)` crea una **vista**, non una copia; `view.slice()` copia i dati, mentre `subarray()` mantiene una vista.

Per numeri multibyte, WebAssembly usa little-endian; con `DataView` dichiara esplicitamente l'endianness, per esempio `getUint32(offset, true)`. Un range valido fisicamente non e necessariamente una regione che l'applicazione ti permette di sovrascrivere: potresti corrompere dati o l'allocatore del modulo.

### Crescita e validita delle viste

Nella memoria non condivisa con buffer a lunghezza fissa usata qui, una `memory.grow()` riuscita distacca il vecchio buffer, anche con incremento zero. Ricrea le viste da `memory.buffer` dopo operazioni che possono far crescere la memoria, incluse chiamate alla libreria.

L'esempio e indipendente dal modulo `math.wasm`:

```js
const growingMemory = new WebAssembly.Memory({ initial: 1, maximum: 2 });
const oldView = new Uint8Array(growingMemory.buffer);
oldView[0] = 7;

console.log(growingMemory.grow(1)); // 1: numero precedente di pagine
console.log(oldView.byteLength); // 0: buffer precedente distaccato

const freshView = new Uint8Array(growingMemory.buffer);
console.log(freshView.byteLength, freshView[0]); // 131072, 7
```

La crescita non e garantita: limite massimo o risorse insufficienti possono impedirla. L'API JS `Memory.grow` segnala il fallimento con `RangeError`; l'istruzione Wasm `memory.grow` restituisce invece un valore sentinella di fallimento.

Con memoria condivisa il vecchio `SharedArrayBuffer` non viene distaccato dalla crescita, ma non rappresenta automaticamente la nuova estensione. Memorie condivise, buffer ridimensionabili e memory64 richiedono contratti distinti: questi snippet non sono helper universali per tutte le varianti.

## API / Sintassi

### Caricamento con HTTP, MIME e fallback controllato

Questo loader restituisce sempre `{ module, instance }`. Usa streaming soltanto quando disponibile e con un `Content-Type` esattamente `application/wasm`, senza parametri: e il requisito della Web API streaming.

```js
async function loadWasm(url, imports = {}, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Caricamento Wasm fallito: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type")?.trim().toLowerCase();
  signal?.throwIfAborted();

  let result;
  if (typeof WebAssembly.instantiateStreaming === "function"
    && contentType === "application/wasm") {
    result = await WebAssembly.instantiateStreaming(response, imports);
  } else {
    const bytes = await response.arrayBuffer();
    signal?.throwIfAborted();
    result = await WebAssembly.instantiate(bytes, imports);
  }

  signal?.throwIfAborted();
  return result;
}
```

Il fallback legge **la stessa risposta**, senza scaricare due volte il file. Non intercetta indiscriminatamente ogni errore dello streaming per riprovare: un errore di compilazione, un import incompatibile o una start function fallita devono rimanere visibili. L'istanziazione puo gia avere prodotto effetti tramite import.

Il fallback tollera un MIME errato, ma la correzione del server resta preferibile. Non risolve CORS, CSP o un server che restituisce HTML al posto del binario. Il signal puo annullare Fetch/lettura; compilazione e istanziazione non ricevono quel signal. Il controllo finale evita di consegnare un risultato ormai indesiderato, **non annulla eventuali effetti gia avvenuti**.

### Le due forme di instantiate

Dopo aver ottenuto `compiledModule` con il loader dell'esempio pratico:

```js
const anotherInstance = await WebAssembly.instantiate(compiledModule, imports);
console.log(anotherInstance.exports.add(4, 5)); // 9
```

Con i **byte** `instantiate` restituisce `{ module, instance }`; con un **Module gia compilato** restituisce direttamente una `Instance`. Non usare sempre la stessa destructuring.

`compile` e `compileStreaming` producono un Module senza istanziarlo. `validate(bytes)` verifica la validita del binario per il motore, non la sua affidabilita, il suo costo o l'ABI della tua applicazione.

## Esempio pratico

### 1. Modulo riproducibile

File dimostrativo `math.wat`. La funzione importata `log` riceve un intero; la memoria parte da una pagina e puo arrivare a due. Il modulo non contiene allocatore o altri dati: riserviamo per l'esempio di testo la regione da 1024 a 1151 inclusi.

```wat
(module
  (import "env" "log" (func $log (param i32)))
  (memory (export "memory") 1 2)

  (func $add (export "add") (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)

  (func (export "addAndLog") (param $a i32) (param $b i32) (result i32)
    (local $sum i32)
    local.get $a
    local.get $b
    call $add
    local.tee $sum
    call $log
    local.get $sum)

  (func (export "increment64") (param $value i64) (result i64)
    local.get $value
    i64.const 1
    i64.add)

  (func (export "firstByte") (param $offset i32) (result i32)
    local.get $offset
    i32.load8_u)
)
```

Prerequisito: `wat2wasm` del progetto WABT disponibile nel PATH. Dalla cartella del demo, compila il sorgente; `-o` crea o sostituisce l'output indicato:

```sh
wat2wasm math.wat -o math.wasm
```

Servi la cartella del demo tramite un server HTTP locale, con `application/wasm` per i file `.wasm`; non aprire la pagina con `file://`. Per esempio, da quella cartella e con Python 3 disponibile:

```sh
python -m http.server 8090 --bind 127.0.0.1
```

La mappatura MIME del server va verificata; il loader dispone del fallback. Questi sono file di un'applicazione dimostrativa, **non asset gia presenti nel sito Quartz**.

### 2. Caricamento ed export

In `app.js` inserisci prima `loadWasm`, poi questo codice:

```js
const imports = {
  env: {
    log(value) {
      console.log("Dal modulo:", value);
    },
  },
};
const { module: compiledModule, instance } = await loadWasm(
  new URL("./math.wasm", import.meta.url),
  imports,
);

console.log(instance.exports.add(2, 3)); // 5
console.log(instance.exports.addAndLog(10, 20)); // log 30 e risultato 30
console.log(instance.exports.increment64(41n)); // 42n
```

Carica il modulo JS dalla pagina `index.html`:

```html
<!doctype html>
<html lang="it">
  <meta charset="utf-8">
  <title>Demo WebAssembly</title>
  <body>
    <p>Risultati nella console del browser.</p>
    <script type="module" src="./app.js"></script>
  </body>
</html>
```

`new URL("./math.wasm", import.meta.url)` risolve il binario rispetto a `app.js`, evitando il percorso assoluto `/math.wasm` che potrebbe ignorare un sottopercorso di pubblicazione. Il comportamento dei bundler richiede comunque la loro configurazione degli asset.

Controlla i limiti numerici sul confine applicativo se servono: `add(2147483647, 1)` restituisce `-2147483648`, non una somma JavaScript arbitrariamente grande. `increment64(41)` con Number genera un `TypeError`.

### 3. Testo UTF-8 e range espliciti

Aggiungi nello stesso modulo queste funzioni. Il contratto e una Memory wasm32 non condivisa dello stesso realm, offset/lunghezze non negativi e una regione riservata dal chiamante. Non allocano memoria Wasm e non gestiscono accessi concorrenti.

```js
function memoryRegion(memory, offset, length) {
  if (!(memory instanceof WebAssembly.Memory)) {
    throw new TypeError("Attesa WebAssembly.Memory");
  }
  const buffer = memory.buffer;
  if (!(buffer instanceof ArrayBuffer)) {
    throw new TypeError("L'esempio richiede memoria non condivisa");
  }
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length)
    || offset < 0 || length < 0
    || offset > buffer.byteLength || length > buffer.byteLength - offset) {
    throw new RangeError("Regione fuori dalla memoria");
  }
  return new Uint8Array(buffer, offset, length);
}

function writeUtf8(memory, offset, capacity, text) {
  if (typeof text !== "string") throw new TypeError("Attesa una stringa");
  const target = memoryRegion(memory, offset, capacity);
  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength > capacity) throw new RangeError("Regione troppo piccola");
  target.set(bytes);
  return bytes.byteLength;
}

function readUtf8(memory, offset, length) {
  const bytes = memoryRegion(memory, offset, length);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
```

Dopo l'istanziazione:

```js
const memory = instance.exports.memory;
const pointer = 1024;
const capacity = 128;
const text = "Caff\u00e8";
const length = writeUtf8(memory, pointer, capacity, text);

console.log(text.length, length); // 5 unita UTF-16, 6 byte UTF-8
console.log(instance.exports.firstByte(pointer)); // 67, byte ASCII di C
console.log(readUtf8(memory, pointer, length)); // stesso testo
```

Il contratto usa **puntatore + lunghezza in byte**, senza terminatore NUL. Il resto della regione non viene azzerato: leggi solo la lunghezza restituita. Una nuova scrittura puo sostituire i dati precedenti. Il decoder con `fatal: true` rifiuta UTF-8 non valido; TextEncoder sostituisce eventuali surrogate UTF-16 isolate con il carattere di sostituzione.

Con Rust/C/C++ non scegliere un offset libero a intuito. Usa l'allocatore e la deallocazione esportati o i binding previsti; rispetta ownership, allineamento, durata e ricreazione delle viste dopo crescita. Una vista JS ancora raggiungibile non impedisce al modulo di liberare o riutilizzare la regione.

### 4. Distinguere gli errori

| Fase | Errore o sintomo | Verifica |
| --- | --- | --- |
| Rete | Fetch rifiutata, abort, CORS | URL, origine, segnale e accesso alla risposta |
| HTTP | 404/500 senza rifiuto automatico di Fetch | `response.ok` prima di leggere i byte |
| Streaming | MIME non accettato | `Content-Type: application/wasm`, senza parametri |
| Compilazione | `WebAssembly.CompileError` | Binario valido e feature supportate |
| Collegamento | `WebAssembly.LinkError`, oppure `TypeError` per struttura import errata | Nomi, namespace e tipi importati |
| Esecuzione | `WebAssembly.RuntimeError` | Trap, per esempio lettura oltre la memoria |
| Callback host | Errore lanciato dalla funzione JS importata | Non tutti gli errori diventano RuntimeError |

Le Promise di caricamento vanno gestite dal proprietario dell'app. Per esempio, in alternativa all'avvio top-level:

```js
async function startDemo() {
  try {
    const { instance: demo } = await loadWasm(
      new URL("./math.wasm", import.meta.url),
      { env: { log: (value) => console.log(value) } },
    );
    console.log(demo.exports.add(2, 3));
  } catch (error) {
    console.error("Avvio Wasm fallito:", error);
  }
}
void startDemo();
```

Un trap non e un rollback delle scritture o degli effetti precedenti. Il codice dimostrativo non carica moduli non fidati e non esegue intenzionalmente calcoli senza fine.

## Varianti

### Binding generati e toolchain

Con [[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]] o Emscripten, importa il wrapper JS prodotto dalla toolchain e segui la sua inizializzazione. Non sostituirlo alla cieca con il loader raw: possono servire import, allocatori e gestione dei tipi generati. Pubblica binario e wrapper della **stessa build**.

La compilazione per WASI e diversa da quella per browser: un binario che richiede import WASI non ottiene automaticamente filesystem e sistema operativo nel browser.

### Worker, thread e API opzionali

Per non bloccare la UI, il modulo puo essere istanziato e chiamato dentro un [[Programmazione/JavaScript/Pagine/Web Workers|Web Worker]]. Un Module compilato puo essere inviato con `postMessage` e istanziato nel worker; non equivale a trasferire un'Instance eseguibile.

I thread con memoria condivisa richiedono toolchain/runtime compatibili, sincronizzazione e, nel browser, i requisiti di sicurezza per SharedArrayBuffer, inclusa la cross-origin isolation. Un worker con memoria non condivisa non richiede automaticamente questi header.

Feature come SIMD, memory64, Wasm GC e JavaScript Promise Integration hanno vincoli propri: verifica motore e toolchain. Una normale funzione importata che restituisce una Promise non viene magicamente attesa da un modulo sincrono.

### Prestazioni e sicurezza

Misura percorso completo e carico realistico: molte chiamate minuscole e copie possono annullare il vantaggio del calcolo. Preferisci batch e riuso del modulo compilato quando sono compatibili con il ciclo di vita dell'app.

Wasm non ha accesso libero al DOM, ma le funzioni importate possono concederglielo. La sandbox non rende innocui import potenti o un calcolo che esaurisce CPU/memoria. La validazione del binario non e un audit di sicurezza.

Se e presente una CSP restrittiva, la compilazione Wasm puo essere bloccata; valuta l'autorizzazione mirata `'wasm-unsafe-eval'` nella policy applicativa, senza disabilitare l'intera CSP. Cache e versionamento devono mantenere wrapper e binario coerenti.

## Errori comuni

- Scaricare un file `.wat` o una pagina HTML e passarla a `instantiate`.
- Confondere il valore restituito da `instantiate(bytes)` con quello di `instantiate(module)`.
- Ignorare HTTP e riprovare indiscriminatamente dopo qualsiasi errore.
- Passare Number a `i64`, oppure aspettarsi validazione automatica per `i32`.
- Confondere una vista sulla memoria con una copia indipendente.
- Conservare una vista su un buffer distaccato o su una regione gia liberata.
- Usare il numero di caratteri JS come lunghezza UTF-8.
- Pensare che Wasm crei un worker, garantisca velocita o sospenda automaticamente le chiamate async.

## Checklist

- Modulo e wrapper provengono dalla stessa build; import/export e ABI sono noti.
- URL, HTTP, MIME, CORS e CSP sono verificati nell'ambiente di destinazione.
- Il chiamante gestisce errori e risultati divenuti obsoleti.
- Tipi numerici, limiti, codifica, lunghezze e ownership sono espliciti.
- Le viste sono ricreate dopo la crescita della memoria.
- Il calcolo non blocca la UI, oppure viene eseguito in un worker.
- Prestazioni e compatibilita sono misurate, non dedotte dall'estensione `.wasm`.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]
- [[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]]
- [[Programmazione/Rust/Pagine/wasm-pack|wasm-pack]]
- [[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly|Limiti del runtime WebAssembly]]

## Fonti

- [WebAssembly JavaScript Interface: conversioni, oggetti e istanziazione](https://webassembly.github.io/spec/js-api/).
- [MDN: overload di instantiate](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiate_static).
- [WebAssembly Web API: requisiti dello streaming](https://webassembly.github.io/spec/web-api/#streaming-modules).
- [MDN: formato WAT](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Understanding_the_text_format).
- [WABT: conversione con wat2wasm](https://github.com/WebAssembly/wabt).
- [MDN: WebAssembly.Memory](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/Memory).
- [MDN: grow e validita delle viste](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/Memory/grow).
- [wasm-bindgen: guida ufficiale](https://wasm-bindgen.github.io/wasm-bindgen/).
- [Emscripten: interazione con JavaScript e memoria](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html).
- [MDN: CSP e compilazione WebAssembly](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#unsafe_webassembly_execution).
- [MDN: SharedArrayBuffer e requisiti di sicurezza](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
