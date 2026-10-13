---
date: 2026-06-02
area: Programmazione
topic: JavaScript
tags:
  - javascript
  - binary-data
  - arraybuffer
  - typed-arrays
  - dataview
  - buffer
aliases:
  - Typed Arrays, ArrayBuffer e DataView
  - Dati Binari e Buffer
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
  - "[[Programmazione/JavaScript/Pagine/Array Methods]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Web Workers]]"
title: Buffer e Typed Arrays
---

# Buffer e Typed Arrays

## Sintesi

Un `ArrayBuffer` contiene byte; una **vista** stabilisce come leggerli e modificarli. Le typed arrays rappresentano sequenze numeriche omogenee, mentre `DataView` legge campi anche di tipi diversi con un ordine dei byte esplicito.

La distinzione operativa piu importante non e solo tra tipi numerici, ma tra **copia**, **vista sulla stessa memoria**, **trasferimento della proprieta** e **memoria condivisa**. Confonderli puo produrre mutazioni inattese, dati letti dalla posizione sbagliata o uso di un buffer ormai distaccato.

## Quando usarlo

- Protocolli binari, file, immagini, audio e dati per WebAssembly.
- API che richiedono byte, come codifica del testo, crittografia e messaggi binari.
- Elaborazioni numeriche con formato e precisione definiti.
- Scambio di dati con worker, scegliendo consapevolmente copia, transfer o condivisione.

Un array ordinario rimane adatto a molte collezioni applicative. Una typed array non e automaticamente piu veloce: vincola rappresentazione e conversioni, e va scelta in base all'API e al lavoro da svolgere.

## Come funziona

### Memoria e viste

```js
const buffer = new ArrayBuffer(8);
const bytes = new Uint8Array(buffer);
const words = new Uint16Array(buffer, 2, 2);

console.log(bytes.length, bytes.byteLength); // 8, 8
console.log(words.length, words.byteOffset, words.byteLength); // 2, 2, 4
console.log(bytes.buffer === words.buffer); // true

bytes[2] = 1; // Cambia anche i byte visibili attraverso words
```

Il secondo parametro del costruttore e un **offset in byte**; il terzo e una **quantita di elementi**. Per `Uint16Array` l'offset deve essere multiplo di 2; per `Float64Array`, di 8. Intervalli fuori dal buffer o non correttamente allineati causano `RangeError`.

`TypedArray` indica una famiglia: non si usa `new TypedArray()`. Si costruisce un tipo concreto. `Array.isArray(bytes)` e falso; `ArrayBuffer.isView(bytes)` e vero, come per un `DataView`.

Le typed arrays multibyte usano l'endianness della piattaforma. Non interpretare `words[0]` come un valore di protocollo portabile senza averne definito l'ordine dei byte.

### Tipi e conversioni

| Tipo | Byte per elemento | Impiego e attenzione |
| --- | --- | --- |
| Int8Array, Uint8Array | 1 | Interi con/senza segno; Uint8Array per byte grezzi |
| Uint8ClampedArray | 1 | Valori limitati a 0..255, utile per canali colore |
| Int16Array, Uint16Array | 2 | Interi a 16 bit |
| Int32Array, Uint32Array | 4 | Interi a 32 bit |
| Float16Array | 2 | Floating point a precisione ridotta; controllare compatibilita |
| Float32Array | 4 | Floating point, con arrotondamento rispetto a Number |
| Float64Array | 8 | Floating point come la rappresentazione numerica di Number |
| BigInt64Array, BigUint64Array | 8 | Interi a 64 bit esposti come BigInt |

Le assegnazioni convertono i valori: una typed array **non sostituisce la validazione** degli input. Gli interi possono troncare la frazione e avvolgersi nel range rappresentabile; il tipo clamped satura e arrotonda, con i casi esattamente a meta verso l'intero pari.

```js
const wrapped = new Uint8Array([-1, 256, 3.9]);
const clamped = new Uint8ClampedArray([-1, 256, 2.5, 3.5]);
const ids = new BigUint64Array([1n, 2n]);

console.log([...wrapped]); // [255, 0, 3]
console.log([...clamped]); // [0, 255, 2, 4]
console.log(ids[0]); // 1n
```

Per le viste BigInt usa valori BigInt; un Number come `1` causa `TypeError`. Le viste floating point ammettono anche `NaN` e infinita: verifica separatamente i vincoli del dominio. `Float16Array` e piu recente degli altri tipi storici; verificane la presenza prima dell'uso su runtime meno recenti.

### Copia e alias non sono equivalenti

```js
const source = new Uint8Array([10, 20, 30, 40]);
const copy = source.slice(1, 3);
const alias = source.subarray(1, 3);

alias[0] = 99;
console.log([...source]); // [10, 99, 30, 40]
console.log([...copy]); // [20, 30]
console.log(alias.buffer === source.buffer); // true
```

Per queste typed arrays native, `slice()` copia gli elementi selezionati; `subarray()` crea una vista sugli stessi byte. Una sottovista di pochi byte puo quindi mantenere raggiungibile un buffer molto grande.

`new Uint8Array(otherTypedArray)` crea una copia **convertendo i valori**, non reinterpretando tutti i byte del tipo originale. Per vedere i byte dell'intervallo originale usa buffer, offset e lunghezza:

```js
const values16 = new Uint16Array([0x1234, 0x5678]);
const converted = new Uint8Array(values16);
const rawBytes = new Uint8Array(
  values16.buffer,
  values16.byteOffset,
  values16.byteLength,
);

console.log([...converted]); // [52, 120]: conversione dei due valori
console.log(rawBytes.length); // 4: stessi byte, nessuna copia
```

L'ordine dei quattro byte di `rawBytes` dipende dalla piattaforma. **Eccezione Node:** `Buffer.slice()` non copia; vedi la variante dedicata.

## API / Sintassi

### DataView: offset, campi ed endianness

```js
const storage = new Uint8Array(10);
const region = storage.subarray(2, 8);
const view = new DataView(
  region.buffer,
  region.byteOffset,
  region.byteLength,
);

view.setUint16(1, 0x1234, false); // Offset 1 nella vista, big-endian
console.log(region[1], region[2]); // 18, 52
console.log(view.getUint16(1, false)); // 4660
console.log(view.getUint16(1, true)); // 13330: gli stessi byte in little-endian
```

`false`, o parametro omesso, significa big-endian; `true` significa little-endian. Il formato stabilisce la scelta, non la macchina che lo legge. A differenza delle typed arrays, `DataView` permette campi multibyte non allineati.

Non basta `new DataView(region.buffer)`: allargherebbe la lettura all'intero buffer e perderebbe l'offset della sottovista. Gli offset di `getUint16`, `setFloat32` e metodi analoghi sono relativi alla vista e misurati in byte.

Una lettura/scrittura che supera una vista valida genera `RangeError`. L'accesso numerico a una typed array ha invece un comportamento diverso: per un indice fuori intervallo legge `undefined` e una scrittura con valore del tipo corretto non aggiunge elementi. Non usare questo comportamento per verificare un pacchetto: controlla prima i limiti.

### Testo e byte

```js
const text = "caff\u00e8";
const encoded = new TextEncoder().encode(text);
const decoded = new TextDecoder("utf-8", { fatal: true }).decode(encoded);

console.log(text.length, encoded.byteLength); // 5, 6
console.log(decoded === text); // true
```

`TextEncoder` produce UTF-8. `String.length` conta unita UTF-16, non byte UTF-8 e neppure necessariamente caratteri percepiti. Una surrogate isolata viene sostituita durante la codifica: non e una serializzazione reversibile di qualunque sequenza di unita UTF-16.

`TextDecoder` supporta anche altre codifiche. Per UTF-8 malformato il default inserisce caratteri sostitutivi; `fatal: true` genera `TypeError`. Nei flussi un carattere puo essere diviso tra chunk:

```js
const decoder = new TextDecoder("utf-8", { fatal: true });
let result = decoder.decode(new Uint8Array([0xc3]), { stream: true });
result += decoder.decode(new Uint8Array([0xa8]), { stream: true });
result += decoder.decode(); // Flush: controlla anche sequenze rimaste incomplete
console.log(result); // "\u00e8"
```

Mantieni lo stesso decoder per tutto il flusso; non uno per chunk.

### Buffer ridimensionabili

Non tutti gli `ArrayBuffer` moderni hanno dimensione immutabile. Specificare `maxByteLength` abilita il ridimensionamento nei runtime che lo supportano:

```js
if (typeof ArrayBuffer.prototype.resize === "function") {
  const resizable = new ArrayBuffer(4, { maxByteLength: 8 });
  const tracking = new Uint8Array(resizable);
  const fixed = new Uint8Array(resizable, 0, 2);
  fixed[1] = 9;

  resizable.resize(8);
  console.log(tracking.length, fixed.length); // 8, 2

  resizable.resize(1);
  console.log(tracking.length, fixed.length); // 1, 0: fixed fuori intervallo

  resizable.resize(4);
  console.log(fixed.length, fixed[1]); // 2, 0: i byte rimossi non tornano
}
```

Omettere la lunghezza su questo buffer crea una vista **length-tracking**; indicarla crea una vista a lunghezza fissa, che puo temporaneamente finire fuori intervallo. La crescita inizializza a zero i nuovi byte. La dimensione massima non garantisce che qualunque allocazione riesca.

Una typed array non acquisisce `push()` o `pop()`, e assegnare a `length` non la ridimensiona. Per un buffer fisso devi allocare e copiare, oppure usare le API di trasferimento disponibili nel runtime. I metodi su buffer distaccati o viste fuori intervallo non hanno tutti lo stesso comportamento: ricrea/valida le viste prima di riutilizzarle.

### Trasferimento: cambia il proprietario

```js
const original = new Uint8Array([7, 8, 9]);
const otherView = original.subarray(1);
const moved = structuredClone(original, { transfer: [original.buffer] });

console.log([...moved]); // [7, 8, 9]
console.log(original.byteLength, otherView.byteLength); // 0, 0
```

Senza l'opzione `transfer`, il clone di un normale ArrayBuffer usa memoria indipendente. Con transfer viene distaccato il buffer originale e diventano inutilizzabili **tutte** le sue vecchie viste, non solo quella passata nel messaggio. Nella lista si inserisce l'ArrayBuffer, non la typed array.

Anche `worker.postMessage({ bytes }, [bytes.buffer])` puo trasferirlo: `worker` e `bytes` devono esistere e il destinatario deve sapere interpretare il messaggio. La lista da sola non aggiunge il buffer al contenuto inviato. Per un esempio completo di worker vedi [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]].

Il trasferimento evita di richiedere una copia applicativa dell'intero contenuto, ma non e una promessa universale su costo, implementazione o latenza. Le API piu recenti `ArrayBuffer.prototype.transfer()` e `transferToFixedLength()` permettono anche di ottenere un nuovo buffer distaccando il precedente; controlla la compatibilita.

## Esempio pratico

### Un piccolo formato binario

Questo e un **protocollo didattico inventato per l'esempio**, non un formato standard:

| Offset | Dimensione | Contenuto |
| --- | --- | --- |
| 0 | 2 byte | Magic 0x4E42, big-endian |
| 2 | 1 byte | Versione, qui 1 |
| 3 | 1 byte | Riservato, deve essere 0 |
| 4 | 2 byte | Lunghezza del payload UTF-8 in byte, big-endian |
| 6 | Variabile | Testo UTF-8, senza byte extra dopo il payload |

L'encoder accetta stringhe senza surrogate isolate, cosi il round-trip non sostituisce unita UTF-16 invalide. Il limite di 65.535 riguarda il payload gia codificato, non la memoria massima usata per ricevere un dato.

```js
function encodePacket(text) {
  if (typeof text !== "string") throw new TypeError("Attesa una stringa");
  // Con il flag u, una coppia valida e un code point fuori dal range surrogate.
  if (/[\uD800-\uDFFF]/u.test(text)) throw new TypeError("Surrogate isolata");
  const payload = new TextEncoder().encode(text);
  if (payload.byteLength > 65_535) throw new RangeError("Payload troppo grande");

  const packet = new Uint8Array(6 + payload.byteLength);
  const header = new DataView(packet.buffer);
  header.setUint16(0, 0x4e42, false);
  header.setUint8(2, 1);
  header.setUint8(3, 0);
  header.setUint16(4, payload.byteLength, false);
  packet.set(payload, 6);
  return packet;
}

function decodePacket(bytes) {
  if (!(bytes instanceof Uint8Array) ||
      !(bytes.buffer instanceof ArrayBuffer) ||
      bytes.buffer.resizable) {
    throw new TypeError("Attesi byte su ArrayBuffer fisso dello stesso realm");
  }
  if (bytes.byteLength < 6) throw new RangeError("Header incompleto");

  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (header.getUint16(0, false) !== 0x4e42) throw new Error("Magic non valido");
  if (header.getUint8(2) !== 1) throw new Error("Versione non supportata");
  if (header.getUint8(3) !== 0) throw new Error("Campo riservato non valido");
  if (header.getUint16(4, false) !== bytes.byteLength - 6) {
    throw new RangeError("Lunghezza del payload incoerente");
  }
  return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true })
    .decode(bytes.subarray(6));
}
```

Il parser lavora su una vista Uint8Array dello stesso realm, inclusi i Buffer Node, con backing store ordinario e fisso. Esclude esplicitamente buffer condivisi e ridimensionabili: supportarli richiederebbe un contratto ulteriore su mutazioni concorrenti e validita delle viste. Un buffer distaccato non supera il controllo sulla dimensione minima.

`ignoreBOM: true` conserva come testo un eventuale U+FEFF iniziale, invece di consumarlo come firma UTF-8. Non modifica la validazione `fatal`. I controlli su versione, dimensione e campo riservato rendono esplicito cosa e accettato.

I due helper precedenti sono necessari per l'esempio seguente:

```js
const packet = encodePacket("Ciao \u{1f30d}");
const envelope = new Uint8Array(packet.byteLength + 5);
envelope.set(packet, 3);
const received = envelope.subarray(3, 3 + packet.byteLength);

console.log(decodePacket(received)); // "Ciao \u{1f30d}"
```

La lettura parte dalla sottovista, non dal byte zero di `envelope`. In produzione separa il trasporto dal parser e aggiungi i vincoli specifici del protocollo: questo esempio non fornisce autenticazione, cifratura o framing di un flusso continuo.

## Varianti

### Fetch, Blob, File e WebSocket

Questo helper usa il parser precedente e richiede un endpoint che restituisca esattamente un pacchetto del formato descritto:

```js
async function fetchPacket(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  return decodePacket(new Uint8Array(buffer));
}
```

Il chiamante deve gestire la Promise rifiutata, incluse cancellazione e dati invalidi. `arrayBuffer()` accumula tutto il corpo: il controllo del parser arriva **dopo** l'allocazione, non limita i byte scaricati. Per dati grandi o non fidati servono limiti durante la lettura in streaming e sul server; `Content-Length` da solo non e un controllo sufficiente. Non puoi consumare nuovamente un corpo gia letto senza aver previsto un clone prima del consumo.

`Blob` e `File` rappresentano dati binari immutabili; `File` aggiunge metadati come nome e ultima modifica. La conversione puo richiedere ulteriore memoria:

```js
const sourceBytes = new Uint8Array([1, 2, 3]);
const blob = new Blob([sourceBytes], { type: "application/octet-stream" });
sourceBytes[0] = 99;
const restored = new Uint8Array(await blob.arrayBuffer());
console.log([...restored]); // [1, 2, 3]
```

Un WebSocket ha normalmente `binaryType = "blob"`; impostarlo ad `"arraybuffer"` cambia la rappresentazione dei **messaggi binari**, non dei messaggi di testo. Verifica il tipo di `event.data` prima del parsing e gestisci errori/chiusura. Un messaggio di testo non diventa un ArrayBuffer per effetto di quella proprieta.

### Memoria condivisa e Atomics

`SharedArrayBuffer` non viene distaccato trasferendolo: **non e trasferibile**. I contesti possono avere oggetti wrapper distinti sulla stessa memoria. Le letture/scritture condivise richiedono un protocollo di sincronizzazione; un Atomics isolato non rende corretta un'intera operazione composta.

Nel browser servono un contesto sicuro e le condizioni di isolamento richieste dalla piattaforma, tipicamente intestazioni COOP/COEP compatibili e `crossOriginIsolated === true`. Il solo fatto che il nome esista non certifica che un messaggio verso qualunque contesto sia consentito. In Node non si configurano intestazioni HTTP per usarlo tra worker.

```js
if (typeof SharedArrayBuffer === "function") {
  const shared = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
  const counter = new Int32Array(shared);
  Atomics.store(counter, 0, 10);
  console.log(Atomics.add(counter, 0, 1)); // 10: valore precedente
  console.log(Atomics.load(counter, 0)); // 11
}
```

Questa e una dimostrazione in un solo contesto, non un coordinamento completo tra thread. Le operazioni Atomics numeriche usano viste intere ammesse, non Float32Array o Uint8ClampedArray. `Atomics.wait()` e piu restrittivo: Int32Array o BigInt64Array condivise, e il blocco non e consentito sul thread principale della finestra. I SharedArrayBuffer growable possono crescere, non restringersi; anche questa funzionalita richiede supporto del runtime.

### Buffer in Node.js

`Buffer` estende Uint8Array con API Node per file, socket e codifiche. Esempio ESM, da eseguire in Node:

```js
import { Buffer } from "node:buffer";

const nodeBytes = Buffer.from([10, 20, 30, 40]);
const nodeAlias = nodeBytes.slice(1, 3); // Alias, non copia
const nodeCopy = Uint8Array.from(nodeBytes.subarray(1, 3));
nodeAlias[0] = 99;

const exactView = new DataView(
  nodeBytes.buffer,
  nodeBytes.byteOffset,
  nodeBytes.byteLength,
);
console.log([...nodeBytes]); // [10, 99, 30, 40]
console.log([...nodeCopy]); // [20, 30]
console.log(exactView.byteLength); // 4
```

Preferisci `subarray()` quando vuoi rendere esplicito l'alias. `Buffer.from(typedArray)` copia convertendo gli elementi, mentre `Buffer.from(arrayBuffer, byteOffset, length)` puo condividere quella regione di memoria. Un Buffer puo provenire da un pool: la sua proprieta `.buffer` puo contenere molto piu della porzione valida. Rispetta sempre `byteOffset` e `byteLength`, anche prima di serializzare o inviare dati.

`Buffer.alloc()` inizializza la memoria; `allocUnsafe()` richiede di sovrascrivere completamente ogni byte che sara letto/esposto. Non usarlo come ottimizzazione predefinita.

## Errori comuni

- Confondere elementi e byte: la lunghezza di Uint32Array non e il numero di byte occupati.
- Ignorare offset e lunghezza di una sottovista, leggendo header o dati altrui.
- Usare l'endianness nativa per un formato che prescrive un ordine preciso.
- Aspettarsi che overflow, NaN o conversioni vengano rifiutati automaticamente.
- Pensare che subarray liberi il resto di un buffer grande o che Buffer.slice copi.
- Riutilizzare viste dopo transfer, shrink o crescita della memoria Wasm senza verificarne il contratto.
- Decodificare chunk UTF-8 separatamente o ignorare sequenze malformate.
- Caricare tutto un file prima di imporre limiti di memoria.
- Confondere binario e serializzazione: JSON con base64 e possibile, ma aggiunge conversioni e dimensione; non e equivalente a inviare direttamente byte.

## Checklist

- [ ] Il formato specifica tipo, dimensione, segno, endianness e codifica del testo?
- [ ] Ogni vista rispetta byteOffset e byteLength della porzione valida?
- [ ] Lunghezze, header, versione e limiti applicativi sono verificati prima di leggere?
- [ ] E chiaro se sto copiando, condividendo byte o trasferendo il buffer?
- [ ] Il chiamante sa chi puo modificare i dati e quando le viste diventano invalide?
- [ ] Runtime e contesto supportano le funzionalita moderne usate?
- [ ] Ricezione e parsing hanno limiti distinti per dimensione e uso di memoria?

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]
- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Real-time con WebSocket|Real-time con WebSocket]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]
- [[Programmazione/JavaScript/Pagine/WebAssembly interop|WebAssembly interop]]
- [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]

## Fonti

Riferimenti ufficiali consultati per API e compatibilita; gli esempi definiscono i propri contratti e non sono benchmark.

- [MDN: TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray).
- [MDN: DataView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView).
- [MDN: Uint8ClampedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray).
- [MDN: subarray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/subarray).
- [MDN: TextEncoder](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) e [TextDecoder.decode](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/decode).
- [MDN: ArrayBuffer e API recenti](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) e [resize](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/resize).
- [MDN: structuredClone e transfer](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone).
- [MDN: Response.arrayBuffer](https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer).
- [MDN: SharedArrayBuffer e sicurezza](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer).
- [Node.js 24: Buffer, copie, viste e pool](https://nodejs.org/docs/latest-v24.x/api/buffer.html).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
