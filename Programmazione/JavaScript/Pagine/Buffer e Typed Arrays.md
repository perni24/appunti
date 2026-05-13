---
date: 2026-05-04
area: Programmazione
topic: JavaScript
tags: [javascript, binary-data, arraybuffer, typed-arrays, dataview, buffer]
aliases: ["Typed Arrays, ArrayBuffer e DataView", "Dati Binari e Buffer"]
type: technical-note
status: "non revisionato"
difficulty: advanced
prerequisites: [Tipi di Dati, Array Methods]
related: [Web Workers]
---

# Buffer e Typed Arrays

JavaScript usa oggetti e array normali per molti dati applicativi, ma quando serve lavorare con **dati binari** entrano in gioco `ArrayBuffer`, `TypedArray` e `DataView`.

Questi strumenti permettono di leggere e scrivere byte, numeri interi e floating point in modo efficiente e controllato.

> [!INFO]
> `ArrayBuffer` rappresenta memoria binaria grezza. Le Typed Arrays e `DataView` sono viste che permettono di interpretare quei byte.

## 1. Perche Servono

Gli array JavaScript normali non sono ideali per dati binari.

```javascript
const values = [10, 20, 30];
```

Un array normale:

- puo contenere tipi misti;
- ha overhead da oggetto dinamico;
- non rappresenta direttamente memoria binaria compatta;
- non controlla dimensione e signedness degli elementi;
- non e adatto a protocolli binari, audio, immagini o WebAssembly.

I buffer binari servono per:

- file;
- stream;
- immagini;
- audio/video;
- networking;
- WebSockets;
- WebAssembly;
- crittografia;
- parsing di formati binari;
- performance su grandi quantita di numeri.

## 2. ArrayBuffer

`ArrayBuffer` e un blocco di memoria binaria grezza.

```javascript
const buffer = new ArrayBuffer(8);

console.log(buffer.byteLength); // 8
```

Questo crea 8 byte, ma da solo non permette di leggere o scrivere valori in modo comodo.

Per usarlo serve una vista:

- Typed Array;
- `DataView`.

Schema:

```txt
ArrayBuffer
  -> bytes grezzi
  -> interpretati tramite viste
```

## 3. Typed Arrays

Una Typed Array interpreta un `ArrayBuffer` come sequenza di valori dello stesso tipo.

Esempi:

- `Int8Array`;
- `Uint8Array`;
- `Uint8ClampedArray`;
- `Int16Array`;
- `Uint16Array`;
- `Int32Array`;
- `Uint32Array`;
- `Float32Array`;
- `Float64Array`;
- `BigInt64Array`;
- `BigUint64Array`.

Esempio:

```javascript
const bytes = new Uint8Array(4);

bytes[0] = 255;
bytes[1] = 128;

console.log(bytes); // Uint8Array [255, 128, 0, 0]
```

Qui ogni elemento e un unsigned integer da 8 bit.

## 4. Buffer Condiviso tra Viste

Typed Arrays sono viste sopra un buffer.

```javascript
const buffer = new ArrayBuffer(4);

const bytes = new Uint8Array(buffer);
const words = new Uint16Array(buffer);

bytes[0] = 1;
bytes[1] = 0;

console.log(words[0]); // dipende dall'endianness della piattaforma
```

Entrambe le viste leggono e scrivono sugli stessi byte.

Questo e potente, ma richiede attenzione: cambiare una vista modifica i dati osservati dalle altre.

## 5. Creare Typed Arrays

### Da lunghezza

```javascript
const values = new Int32Array(3);

values[0] = 10;
values[1] = 20;
values[2] = 30;
```

### Da array normale

```javascript
const values = new Float32Array([1.5, 2.5, 3.5]);
```

### Da ArrayBuffer

```javascript
const buffer = new ArrayBuffer(16);
const values = new Uint32Array(buffer);
```

### Da porzione di buffer

```javascript
const buffer = new ArrayBuffer(16);
const view = new Uint32Array(buffer, 4, 2);
```

Qui:

- offset: 4 byte;
- lunghezza: 2 elementi `Uint32`.

## 6. byteLength, byteOffset e length

```javascript
const buffer = new ArrayBuffer(16);
const view = new Uint32Array(buffer, 4, 2);

console.log(view.length); // 2 elementi
console.log(view.byteLength); // 8 byte
console.log(view.byteOffset); // 4 byte
```

Differenza:

- `length`: numero di elementi;
- `byteLength`: numero di byte coperti dalla vista;
- `byteOffset`: posizione di partenza dentro il buffer.

## 7. DataView

`DataView` permette di leggere e scrivere tipi diversi nello stesso buffer, scegliendo anche l'endianness.

```javascript
const buffer = new ArrayBuffer(8);
const view = new DataView(buffer);

view.setUint8(0, 255);
view.setUint16(1, 500, true);

console.log(view.getUint8(0)); // 255
console.log(view.getUint16(1, true)); // 500
```

`DataView` e utile per formati binari strutturati:

- header;
- magic number;
- lunghezze;
- flag;
- valori multi-byte;
- protocolli di rete;
- file format.

## 8. Endianness

Endianness indica l'ordine dei byte per rappresentare numeri multi-byte.

Esempio: valore `0x1234`.

```txt
big-endian:    12 34
little-endian: 34 12
```

`DataView` consente di specificarlo:

```javascript
view.setUint16(0, 0x1234, false); // big-endian
view.setUint16(0, 0x1234, true);  // little-endian
```

Con Typed Arrays, l'endianness segue la piattaforma. Con `DataView`, lo controlli esplicitamente.

## 9. Uint8Array

`Uint8Array` e una delle Typed Arrays piu usate.

Rappresenta byte da 0 a 255.

```javascript
const bytes = new Uint8Array([72, 101, 108, 108, 111]);

console.log(bytes.length); // 5
```

Usi tipici:

- dati ricevuti da rete;
- file;
- crittografia;
- encoding/decoding testo;
- WebAssembly memory;
- immagini e audio.

## 10. TextEncoder e TextDecoder

Per convertire stringhe in byte e viceversa:

```javascript
const encoder = new TextEncoder();
const bytes = encoder.encode("Ciao");

console.log(bytes); // Uint8Array
```

```javascript
const decoder = new TextDecoder("utf-8");
const text = decoder.decode(bytes);

console.log(text); // "Ciao"
```

Questo e preferibile a conversioni manuali carattere-per-carattere.

## 11. Fetch e ArrayBuffer

`fetch` puo leggere una risposta come `ArrayBuffer`.

```javascript
const response = await fetch("/image.png");
const buffer = await response.arrayBuffer();

const bytes = new Uint8Array(buffer);

console.log(bytes[0]);
```

Questo e utile per:

- file binari;
- immagini;
- audio;
- PDF;
- dati compressi;
- protocolli custom.

Collegamento: [[Fetch API]]

## 12. Blob e File

Nel browser, `Blob` e `File` rappresentano dati binari o file-like.

```javascript
const blob = new Blob([new Uint8Array([1, 2, 3])], {
  type: "application/octet-stream",
});

const buffer = await blob.arrayBuffer();
```

`File` estende `Blob` e aggiunge metadati come nome e data modifica.

Questo collega buffer binari a upload, download e file input.

## 13. WebSockets

WebSocket puo ricevere dati binari come `ArrayBuffer` o `Blob`.

```javascript
const socket = new WebSocket("wss://example.com");

socket.binaryType = "arraybuffer";

socket.addEventListener("message", (event) => {
  const bytes = new Uint8Array(event.data);
  console.log(bytes);
});
```

Collegamento: [[WebSockets]]

## 14. Web Workers

I buffer binari possono essere trasferiti a un Web Worker.

```javascript
worker.postMessage(buffer, [buffer]);
```

Quando un `ArrayBuffer` viene trasferito, la ownership passa al worker e il buffer originale viene detached.

Questo evita copie costose su dati grandi.

Collegamento: [[Web Workers]]

## 15. structuredClone e Transfer

`structuredClone` puo clonare molti oggetti binari.

```javascript
const buffer = new ArrayBuffer(1024);
const copy = structuredClone(buffer);
```

Puo anche trasferire buffer:

```javascript
const buffer = new ArrayBuffer(1024);

const moved = structuredClone(buffer, {
  transfer: [buffer],
});

console.log(buffer.byteLength); // 0
console.log(moved.byteLength); // 1024
```

Collegamento: [[Immutabilita e Copia degli Oggetti]]

## 16. SharedArrayBuffer

`SharedArrayBuffer` permette di condividere memoria tra thread, per esempio tra main thread e Web Worker.

```javascript
const buffer = new SharedArrayBuffer(4);
const view = new Int32Array(buffer);
```

Per sincronizzare accessi concorrenti si usa `Atomics`.

```javascript
Atomics.store(view, 0, 42);
console.log(Atomics.load(view, 0));
```

Questo e un argomento avanzato e richiede attenzione a sicurezza, isolamento e race condition.

## 17. Node.js Buffer

In Node.js esiste anche `Buffer`, usato per dati binari.

```javascript
const buffer = Buffer.from("Ciao", "utf8");

console.log(buffer);
```

`Buffer` e una sottoclasse di `Uint8Array`.

Uso tipico in Node:

- file system;
- stream;
- rete;
- crypto;
- HTTP;
- encoding.

Collegamento futuro: [[Buffer]]

## 18. Typed Arrays vs Array Normali

| Aspetto | Array normale | Typed Array |
|---|---|---|
| Tipo elementi | qualsiasi | tipo numerico fisso |
| Memoria | dinamica e flessibile | compatta e binaria |
| Lunghezza | modificabile | fissa |
| Metodi array | molti metodi comuni | subset simile |
| Uso | dati applicativi | dati numerici/binari |

Typed Arrays non sostituiscono gli array normali. Servono quando il dato e numerico, compatto e binario.

## 19. Performance

Typed Arrays possono essere piu efficienti quando lavori su molti numeri o byte.

Vantaggi:

- memoria compatta;
- tipo omogeneo;
- accesso prevedibile;
- integrazione con Web APIs;
- utile per WebAssembly e grafica.

Ma non sono sempre piu veloci per ogni caso.

Valuta:

- dimensione dati;
- frequenza accessi;
- costo conversione;
- compatibilita API;
- chiarezza del codice.

Collegamento: [[Optimization]]

## 20. Errori Comuni

### Confondere ArrayBuffer e Typed Array

`ArrayBuffer` e memoria grezza. `Uint8Array` e una vista.

### Pensare che slice e subarray siano uguali

```javascript
const a = new Uint8Array([1, 2, 3, 4]);

const copy = a.slice(1, 3);
const view = a.subarray(1, 3);
```

- `slice` copia;
- `subarray` crea una vista sullo stesso buffer.

### Ignorare endianness

Quando leggi formati binari multi-byte, l'ordine dei byte conta.

### Usare stringhe per dati binari

Le stringhe sono testo Unicode, non byte grezzi.

### Dimenticare che la lunghezza e fissa

Typed Arrays non crescono come array normali.

## 21. Best Practices

1. Usa `Uint8Array` per byte generici.
2. Usa `DataView` quando devi controllare endianness o leggere tipi misti.
3. Usa `TextEncoder` e `TextDecoder` per testo.
4. Usa `structuredClone` o transfer per gestire buffer grandi.
5. Usa `subarray` per viste senza copia.
6. Usa `slice` quando serve una copia reale.
7. Non usare JSON per dati binari.
8. Misura la performance prima di ottimizzare.
9. In Node.js, usa `Buffer` per API native del runtime.

## 22. Mappa Mentale

```txt
Buffer e Typed Arrays
  -> ArrayBuffer: memoria grezza
  -> TypedArray: vista tipizzata
  -> DataView: lettura/scrittura con endianness
  -> Uint8Array: byte
  -> TextEncoder/TextDecoder: testo <-> byte
  -> Blob/File/Fetch/WebSocket/Worker
  -> Node.js Buffer
```
