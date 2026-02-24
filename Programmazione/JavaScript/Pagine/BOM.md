---
date: 2026-02-24
tags: [javascript, web-api, bom, browser]
type: #permanent-note
status: budding
---

# BOM (Browser Object Model)

Il **BOM** rappresenta gli oggetti forniti dal browser per interagire con l'ambiente esterno al documento HTML corrente. A differenza del DOM (che si occupa del contenuto), il BOM si occupa di tutto ciò che riguarda la "finestra" del browser.

## 1. L'oggetto Globale `window`

L'oggetto `window` è l'oggetto radice del BOM. In un ambiente browser, è anche l'oggetto globale: tutte le variabili e funzioni globali diventano proprietà di `window`.

- `window.innerHeight` / `window.innerWidth`: Dimensioni della viewport.
- `window.open()` / `window.close()`: Gestione di nuove finestre.

## 2. Oggetti Principali del BOM

### Navigator
Fornisce informazioni sul browser e sul sistema dell'utente.
- `navigator.userAgent`: Stringa che identifica il browser.
- `navigator.language`: Lingua predefinita del browser.
- `navigator.onLine`: Booleano che indica se il dispositivo è connesso a internet.
- `navigator.geolocation`: API per ottenere la posizione geografica.

### Location
Contiene informazioni sull'URL della pagina corrente e permette di gestirlo.
- `location.href`: L'intero URL.
- `location.protocol` / `location.hostname` / `location.pathname`: Parti specifiche dell'URL.
- `location.assign("url")`: Carica un nuovo documento.
- `location.replace("url")`: Carica un nuovo documento sostituendo quello attuale nella cronologia.

### History
Permette di interagire con la cronologia della sessione del browser.
- `history.back()`: Torna alla pagina precedente.
- `history.forward()`: Va alla pagina successiva.
- `history.go(n)`: Va avanti o indietro di n pagine.

### Screen
Contiene dettagli sullo schermo dell'utente.
- `screen.width` / `screen.height`: Risoluzione totale.
- `screen.availWidth` / `screen.availHeight`: Spazio disponibile (escludendo barre di sistema).

## 3. Finestre di Dialogo di Sistema

Sono metodi sincroni di `window` che bloccano l'esecuzione dello script finché l'utente non interagisce.

```javascript
alert("Messaggio informativo"); // Solo avviso

const conferma = confirm("Vuoi procedere?"); // Restituisce true o false

const nome = prompt("Come ti chiami?", "Ospite"); // Restituisce la stringa o null
```

> [!WARNING] Uso dei Dialoghi
> L'uso eccessivo di `alert`, `confirm` e `prompt` è sconsigliato nelle app moderne poiché hanno un'estetica non personalizzabile e bloccano l'interattività della pagina. È preferibile usare componenti UI (modali) costruiti con HTML/CSS.

---
