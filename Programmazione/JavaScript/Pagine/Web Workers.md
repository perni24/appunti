---
date: 2026-02-24
tags: [javascript, web-api, multithreading, performance]
type: #permanent-note
status: budding
---

# Web Workers in JavaScript

JavaScript è un linguaggio **single-threaded**, il che significa che può eseguire solo un'operazione alla volta sul thread principale (UI Thread). I **Web Workers** permettono di superare questa limitazione eseguendo script in thread separati in background.

## 1. Perché usare i Web Workers?

Se esegui un calcolo molto pesante (es. elaborazione di un'immagine o crittografia) sul thread principale, l'interfaccia utente diventerà non responsiva ("freezata") finché l'operazione non termina. I Web Workers risolvono questo problema spostando il carico di lavoro altrove.

## 2. API e Comunicazione

La comunicazione tra il thread principale e il Worker avviene esclusivamente tramite **scambio di messaggi**.

### Thread Principale (`script.js`)
```javascript
// Creazione del worker
const myWorker = new Worker('worker.js');

// Invio dati al worker
myWorker.postMessage([10, 20]);

// Ricezione dati dal worker
myWorker.onmessage = function(e) {
    console.log('Risultato ricevuto: ' + e.data);
};

// Terminazione
// myWorker.terminate();
```

### Worker Thread (`worker.js`)
```javascript
// Ricezione dati dal thread principale
onmessage = function(e) {
    console.log('Worker: Ricevuti dati');
    const result = e.data[0] * e.data[1];
    
    // Invio risultato indietro
    postMessage(result);
}
```

## 3. Limitazioni Importanti

Per motivi di sicurezza e consistenza, i Workers **non hanno accesso** agli oggetti globali del thread principale:
- **No DOM**: Non puoi accedere a `document`, `window` o agli elementi della pagina.
- **No Parent**: Un worker non conosce il documento che l'ha creato.
- **Funzioni supportate**: Hanno accesso a `navigator`, `location` (read-only), `XMLHttpRequest`, `fetch` e timer (`setTimeout`).

## 4. Tipologie di Workers

1.  **Dedicated Workers**: Utilizzati da un singolo script.
2.  **Shared Workers**: Possono essere condivisi da più script eseguiti in diverse finestre, iframe o tab (stesso dominio).
3.  **Service Workers**: Agiscono come proxy tra l'app, il browser e la rete (fondamentali per le PWA e il supporto offline).

> [!TIP] Quando usarli
> Usa i Web Workers per qualsiasi operazione sincrona che richieda più di qualche millisecondo, garantendo che l'interfaccia utente rimanga fluida a 60fps.

---
