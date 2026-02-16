---
date: 2026-02-16
tags:
  - javascript
  - programming
  - dom
type: permanent-note
status: budding
---

# Manipolazione del DOM in JavaScript

Il **DOM** (Document Object Model) è la rappresentazione strutturata della pagina HTML che JavaScript può utilizzare per interagire con il contenuto, lo stile e la struttura del documento.

## 1. Selezione Elementi
Per manipolare un elemento, prima devi "trovarlo".

- **`document.getElementById('id')`**: Seleziona un singolo elemento per ID. Molto veloce.
- **`document.querySelector('css-selector')`**: Seleziona il *primo* elemento che corrisponde al selettore CSS (es. `.classe`, `#id`, `div > p`).
- **`document.querySelectorAll('css-selector')`**: Seleziona *tutti* gli elementi corrispondenti (restituisce una `NodeList`, simile a un array).

```javascript
const titolo = document.getElementById('main-title');
const primoParagrafo = document.querySelector('p.intro');
const tuttiITasti = document.querySelectorAll('button');
```

## 2. Modifica Contenuto
- **`textContent`**: Legge/scrive il testo puro (ignora i tag HTML). Più sicuro e performante.
- **`innerHTML`**: Legge/scrive l'HTML interno. Potente ma rischio sicurezza (XSS) se usato con input utente non sanificato.

```javascript
titolo.textContent = "Nuovo Titolo"; 
// titolo.innerHTML = "<span>Nuovo</span> Titolo";
```

## 3. Modifica Stile e Classi
Non modificare lo stile direttamente (`.style`) se puoi evitarlo; meglio manipolare le classi CSS.

- **`element.classList.add('class')`**: Aggiunge una classe.
- **`element.classList.remove('class')`**: Rimuove una classe.
- **`element.classList.toggle('class')`**: Aggiunge se manca, rimuove se c'è.

```javascript
titolo.classList.add('highlight');
```

## 4. Creazione e Inserimento
Per aggiungere nuovi elementi dinamicamente:

1.  **Creazione**: `document.createElement('tag')`
2.  **Modifica**: Aggiungi testo/classi al nuovo elemento.
3.  **Inserimento**: Appendilo a un genitore esistente con `parent.append()` o `parent.appendChild()`.

```javascript
const nuovoDiv = document.createElement('div');
nuovoDiv.textContent = "Sono stato creato con JS!";
document.body.append(nuovoDiv);
```

### Configurazione dell'Elemento
Dopo aver creato l'elemento, puoi modificarne gli attributi e lo stile:

- **Attributi Standard**: `element.id`, `element.src`, `element.href` (proprietà dirette).
- **`setAttribute()`**: Per attributi personalizzati o non standard (`elem.setAttribute('role', 'button')`).
- **Stile**: `element.style.color = 'red'` (aggiunge stile inline).
- **Dataset**: `element.dataset.info = '123'` (crea attributo `data-info="123"`).

```javascript
const btn = document.createElement('button');
btn.textContent = "Cliccami";
btn.id = "submit-btn";
btn.setAttribute('type', 'submit');
btn.classList.add('btn', 'btn-primary');
btn.style.marginTop = '10px';
```

> [!IMPORTANT] `createElement` vs `innerHTML`
>
> È **fortemente consigliato** usare `createElement` rispetto a `innerHTML` per generare nuovi elementi:
> 1.  **Sicurezza**: `innerHTML` è vulnerabile ad attacchi **XSS** (Cross-Site Scripting) se inserisci dati utente non sanificati.
> 2.  **Performance**: Il browser deve ri-parsare l'intera stringa HTML ogni volta che usi `innerHTML`, mentre `createElement` lavora direttamente con nodi DOM ottimizzati.
> 3.  **Event Listeners**: Con `innerHTML += ...`, distruggi e ricrei gli elementi, perdendo eventuali listener associati agli elementi esistenti.

## 5. Rimozione
Per rimuovere un elemento dal DOM:

- **`element.remove()`**: Metodo moderno e diretto.

```javascript
const daEliminare = document.querySelector('.old-banner');
if (daEliminare) daEliminare.remove();
```