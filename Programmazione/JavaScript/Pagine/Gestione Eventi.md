---
date: 2026-02-16
tags:
  - javascript
  - programming
  - events
type: permanent-note
status: budding
---

# Gestione Eventi in JavaScript

Gli **eventi** sono segnali emessi dal browser quando accade qualcosa (es. click del mouse, caricamento pagina, pressione tasti). JavaScript permette di "ascoltare" questi eventi ed eseguire codice in risposta.

## 1. `addEventListener`
Il metodo moderno e corretto per agganciare un gestore (handler) a un evento.

**Sintassi:** `element.addEventListener('event-name', function)`

```javascript
const bottone = document.querySelector('#miodiv');

bottone.addEventListener('click', function() {
  console.log("Bottone cliccato!");
});
```

> [!TIP] Perché non usare `onclick` nell'HTML?
> Evita `<button onclick="...">`. `addEventListener` mantiene il JS separato dall'HTML (Separation of Concerns) e permette di agganciare *più* gestori allo stesso evento.

## 2. Event Object (`e`)
Quando si verifica un evento, il browser passa automaticamente un oggetto **Event** alla funzione gestore. Contiene dettagli utili.

```javascript
bottone.addEventListener('click', function(e) {
  console.log(e.target); // L'elemento esatto che è stato cliccato
  console.log(e.type);   // Tipo di evento ("click")
});
```

### `preventDefault()`
Impedisce il comportamento predefinito del browser (es. invio form, apertura link).

```javascript
form.addEventListener('submit', function(e) {
  e.preventDefault(); // Ferma il refresh della pagina!
  // ... logica invio dati via AJAX ...
});
```

## 3. Propagazione: Bubbling & Capturing
Quando clicchi su un elemento annidato (es. un bottone dentro un div), l'evento non accade solo lì, ma attraversa tutto l'albero del DOM.

Immagina di lanciare un sasso in acqua:
1.  **Capturing Phase** (Discesa): L'evento scende dalla superficie (`html`) fino al fondo (`target`).
2.  **Target Phase**: L'evento colpisce l'elemento esatto.
3.  **Bubbling Phase** (Risalita): L'evento "risale a galla" come una bolla, passando per tutti i genitori fino a `html`.

> [!NOTE] Default Behavior
> `addEventListener` ascolta di default solo la fase di **Bubbling**. Quindi se clicchi il bottone, scatta prima il suo handler, poi quello del div genitore, poi quello del body, ecc.

### `stopPropagation()`
Ferma la "bolla". L'evento non risalirà ai genitori.

```javascript
/* HTML: <div id="genitore"><button id="figlio">Clicca</button></div> */

document.getElementById('figlio').addEventListener('click', function(e) {
  e.stopPropagation(); 
  console.log("Cliccato figlio - Il genitore NON lo saprà");
});

document.getElementById('genitore').addEventListener('click', function() {
  console.log("Cliccato genitore"); // Non verrà mai eseguito
});
```

## 4. Event Delegation
Grazie al Bubbling, possiamo gestire eventi su molti elementi usando **un solo listener** sul loro contenitore comune. È utilissimo per liste dinamiche o tabelle.

**Vantaggi**:
1.  Meno memoria (1 listener vs 100).
2.  Gestisce elementi aggiunti dinamicamente in futuro.

```javascript
/* 
<ul id="lista">
  <li>Item 1</li>
  <li>Item 2</li>
  <!-- Nuovi LI aggiunti qui funzioneranno automaticamente -->
</ul> 
*/

document.getElementById('lista').addEventListener('click', function(e) {
  // e.target è l'elemento effettivamente cliccato (es. il <li>)
  // e.currentTarget è l'elemento che ha il listener (il <ul>)
  
  // Verifichiamo se abbiamo cliccato un LI (o un suo figlio)
  if (e.target.closest('li')) {
    console.log("Hai selezionato: " + e.target.textContent);
  }
});
```

## 5. Rimozione Listener
Per rimuovere un evento, la funzione callback deve essere **nominata** (non anonima).
```javascript
btn.addEventListener('click', handleClick);
btn.removeEventListener('click', handleClick); // Funziona
```

## 6. Eventi di Caricamento (Lifecycle)

Questi eventi sono fondamentali per sapere quando il browser ha terminato di elaborare la pagina o parti di essa.

### `DOMContentLoaded`
Scatta quando il documento HTML è stato completamente caricato e analizzato, senza attendere il caricamento completo di fogli di stile, immagini e sotto-frame. 

È il momento ideale per iniziare la manipolazione del DOM se lo script non usa l'attributo `defer`.

```javascript
document.addEventListener('DOMContentLoaded', () => {
  console.log('Il DOM è pronto per essere manipolato!');
  // Inizializza la tua app qui
});
```

### `load`
Scatta quando l'intera pagina è stata caricata, inclusi tutti i contenuti dipendenti (immagini, CSS, ecc.).

```javascript
window.addEventListener('load', () => {
  console.log('Pagina completamente caricata (incluse immagini)');
});
```
