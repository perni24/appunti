---
date: 2026-02-20
tags: [javascript, programming, web-api, networking]
type: #permanent-note
status: budding
---

# Fetch API in JavaScript

La **Fetch API** fornisce un'interfaccia moderna e potente per accedere e manipolare parti della pipeline HTTP, come richieste e risposte. È il successore di `XMLHttpRequest` ed è basata interamente sulle [[Programmazione/JavaScript/Pagine/Promises|Promises]].

## 1. Richiesta Base (GET)

Per impostazione predefinita, `fetch()` esegue una richiesta GET. Restituisce una Promise che si risolve in un oggetto `Response`.

```javascript
fetch('https://jsonplaceholder.typicode.com/users/1')
  .then(response => response.json()) // Estrae il body in formato JSON
  .then(data => console.log(data))
  .catch(error => console.error('Errore di rete:', error));
```

## 2. L'oggetto Response

L'oggetto `Response` contiene metadati sulla risposta del server:
- `response.ok`: Booleano, `true` se lo status è tra 200 e 299.
- `response.status`: Il codice di stato numerico (es. 200, 404).
- `response.json()`: Metodo asincrono per convertire il corpo in un oggetto JS.

## 3. Richieste POST e Opzioni

Per inviare dati, dobbiamo passare un oggetto di opzioni come secondo argomento.

```javascript
async function creaUtente() {
    const risposta = await fetch('https://api.esempio.com/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: "Luca",
            email: "luca@esempio.it"
        })
    });
    
    const risultato = await risposta.json();
    return risultato;
}
```

## 4. Gestione degli Errori

> [!WARNING] Casi Particolari
> `fetch()` **non** rigetta la promise se il server risponde con un errore HTTP (come 404 o 500). La promise viene rigettata solo in caso di fallimento della rete (es. mancanza di connessione).

Per gestire correttamente gli errori, dobbiamo controllare manualmente `response.ok`:

```javascript
async function ottieniDati(url) {
    try {
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`Errore HTTP! Stato: ${res.status}`);
        }
        
        const dati = await res.json();
        return dati;
    } catch (err) {
        console.error("Si è verificato un problema:", err.message);
    }
}
```

## 5. Perché usare Fetch?

- **Promised-based**: Si integra perfettamente con `async/await`.
- **Pulizia**: Codice molto più leggibile rispetto ai vecchi callback di AJAX.
- **Supporto Nativo**: Disponibile in tutti i browser moderni e in Node.js (v18+).

---
