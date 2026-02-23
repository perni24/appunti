---
date: 2026-02-23
tags: [javascript, programming, networking, ajax]
type: #permanent-note
status: budding
---

# AJAX in JavaScript

**AJAX** sta per *Asynchronous JavaScript and XML*. Non è un singolo linguaggio o una tecnologia a sé stante, ma una tecnica che combina diverse tecnologie per permettere alle applicazioni web di scambiare dati con un server e aggiornare parti di una pagina web senza dover ricaricare l'intero documento.

## 1. Il concetto di base

Tradizionalmente, ogni interazione con il server richiedeva il caricamento di una nuova pagina. Con AJAX, JavaScript intercetta l'interazione, invia una richiesta asincrona al server e gestisce la risposta aggiornando solo il DOM necessario.

## 2. XMLHttpRequest (XHR)

L'oggetto `XMLHttpRequest` è il modo "classico" (e storico) per implementare AJAX. Sebbene oggi sia stato ampiamente superato dalla [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]], è ancora fondamentale per capire come funziona il networking nel browser.

### Esempio di implementazione

```javascript
const xhr = new XMLHttpRequest();

// Configurazione della richiesta (Metodo, URL, Asincronia)
xhr.open('GET', 'https://api.esempio.com/dati', true);

// Gestione del cambio di stato
xhr.onreadystatechange = function() {
    // 4 significa 'DONE' (operazione completata)
    if (xhr.readyState === 4) {
        if (xhr.status === 200) {
            console.log("Dati ricevuti:", JSON.parse(xhr.responseText));
        } else {
            console.error("Errore nella richiesta");
        }
    }
};

// Invio della richiesta
xhr.send();
```

## 3. Stati della richiesta (readyState)

L'oggetto XHR attraversa diversi stati durante il suo ciclo di vita:
0. **UNSENT**: Oggetto creato, `open()` non ancora chiamato.
1. **OPENED**: `open()` chiamato.
2. **HEADERS_RECEIVED**: `send()` chiamato, header ricevuti.
3. **LOADING**: Download del corpo della risposta in corso.
4. **DONE**: Operazione completata.

## 4. Evoluzione: Da AJAX a Fetch

Sebbene il termine AJAX venga ancora usato genericamente per indicare le richieste asincrone, tecnicamente oggi si preferisce usare la **Fetch API** perché:
- Usa le [[Programmazione/JavaScript/Pagine/Promises|Promises]] invece dei callback.
- Ha una sintassi molto più pulita e leggibile.
- Si integra meglio con `async/await`.

> [!NOTE] Curiosità storica
> Nonostante nel nome compaia "XML", oggi la stragrande maggioranza delle richieste AJAX scambia dati in formato **JSON**.

---
