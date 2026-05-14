---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Gestione della memoria e AbortController]
prerequisites: []
related: []
---
# Gestione della memoria e AbortController

## Sintesi

Nota su Gestione della memoria e AbortController in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

In React, la **gestione della memoria** non significa allocare o liberare memoria manualmente come in linguaggi low-level. Significa soprattutto evitare effetti collaterali che restano vivi oltre il necessario:
- timer non rimossi;
- event listener dimenticati;
- subscription aperte;
- richieste HTTP che completano quando il componente non esiste piu;
- aggiornamenti di stato su dati ormai obsoleti.

In questo contesto, `AbortController` e uno strumento pratico per interrompere operazioni asincrone, soprattutto `fetch`, quando non sono piu rilevanti.

> [!INFO] Punto chiave
> In React il problema piu comune non e il "memory leak" classico del garbage collector, ma il lasciare in vita lavoro asincrono, listener o riferimenti che continuano a produrre effetti dopo il momento corretto.

---

## 1. Da dove nascono i problemi

I problemi tipici nascono dentro [[Programmazione/React/Pagine/useEffect]], quando un componente:
- monta e avvia un side effect;
- cambia dipendenze e riavvia lo stesso effetto;
- si smonta prima che il lavoro asincrono sia concluso.

Esempi comuni:
- una `fetch` che termina dopo l'unmount;
- un `setInterval` che continua a girare;
- un listener su `window` che non viene rimosso;
- una websocket che resta aperta;
- due richieste consecutive che arrivano in ordine inverso.

Il rischio non e solo sprecare memoria: e anche sporcare lo stato della UI con risultati non piu validi.

---

## 2. Cleanup in useEffect

La prima difesa e la funzione di cleanup di [[Programmazione/React/Pagine/useEffect]].

```javascript
useEffect(() => {
  const handleResize = () => {
    console.log(window.innerWidth);
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

Il cleanup viene eseguito:
- prima dell'unmount del componente;
- prima di rieseguire l'effetto quando cambiano le dipendenze.

Questa regola vale per:
- listener;
- timer;
- subscription;
- connessioni esterne;
- operazioni asincrone che supportano cancellazione.

---

## 3. Il caso delle fetch API

Un caso molto frequente e questo:

```javascript
useEffect(() => {
  fetch(`/api/users/${userId}`)
    .then(response => response.json())
    .then(data => {
      setUser(data);
    });
}, [userId]);
```

Il codice funziona, ma ha due problemi tipici:
- se il componente si smonta, la richiesta puo completarsi comunque;
- se `userId` cambia rapidamente, una risposta vecchia puo arrivare dopo quella nuova.

Il secondo problema genera **race condition**: la UI mostra dati non coerenti con l'input piu recente.

---

## 4. AbortController

`AbortController` permette di creare un segnale di cancellazione da passare a `fetch`.

```javascript
useEffect(() => {
  const controller = new AbortController();

  async function loadUser() {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        signal: controller.signal
      });

      const data = await response.json();
      setUser(data);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
      }
    }
  }

  loadUser();

  return () => {
    controller.abort();
  };
}, [userId]);
```

Quando l'effetto viene pulito:
- React esegue il cleanup;
- `controller.abort()` annulla la richiesta;
- il browser interrompe il lavoro associato;
- la promise viene rigettata con un errore di tipo `AbortError`.

Questo evita di processare una risposta che non serve piu.

---

## 5. Perche AbortController e utile davvero

`AbortController` non serve solo a "silenziare warning". Serve a migliorare il comportamento reale dell'applicazione:
- evita lavoro inutile lato client;
- riduce il rischio di aggiornare stato non piu valido;
- limita race condition nei cambi rapidi di input;
- rende piu esplicito il ciclo di vita dell'effetto.

Non sostituisce una buona architettura di data fetching, ma migliora molto i casi semplici e medi.

---

## 6. AbortController non risolve tutto

Ci sono due limiti da capire bene.

### Non cancella qualsiasi API
Funziona bene con `fetch` e con librerie che supportano `AbortSignal`, ma non tutte le API asincrone sono abortabili nello stesso modo.

### Non sostituisce la logica applicativa
Se hai richieste multiple, cache, retry, deduplicazione e sincronizzazione complessa, spesso conviene usare strumenti dedicati come TanStack Query invece di scrivere tutto a mano.

Quindi `AbortController` e utile, ma non va scambiato per una soluzione universale.

---

## 7. Memory leak vs stale update

Spesso si parla genericamente di "memory leak", ma conviene distinguere:

### Memory leak logico
Risorse che restano attive senza motivo:
- listener;
- timer;
- subscription;
- connessioni.

### Stale update
Aggiornamento corretto dal punto di vista sintattico, ma sbagliato dal punto di vista temporale:
- una richiesta vecchia termina dopo una nuova;
- uno stato viene aggiornato con dati non piu attuali.

Nel lavoro React quotidiano, il secondo problema e spesso piu frequente del leak classico.

---

## 8. Pattern pratici

### Fetch con cleanup
Usa `AbortController` quando fai richieste in `useEffect` che dipendono da props o stato.

### Timer con cleanup

```javascript
useEffect(() => {
  const timerId = setInterval(() => {
    console.log("tick");
  }, 1000);

  return () => {
    clearInterval(timerId);
  };
}, []);
```

### Listener con cleanup

```javascript
useEffect(() => {
  function onScroll() {
    console.log(window.scrollY);
  }

  window.addEventListener("scroll", onScroll);

  return () => {
    window.removeEventListener("scroll", onScroll);
  };
}, []);
```

La regola e semplice: se l'effetto registra qualcosa nel mondo esterno, deve quasi sempre anche smontarlo.

---

## 9. Relazione con il rendering React

Questi problemi non dipendono dal [[Programmazione/React/Pagine/Virtual DOM]] in senso stretto, ma dal fatto che React:
- monta;
- aggiorna;
- smonta componenti;
- riesegue effetti quando cambiano le dipendenze.

Con il rendering moderno e concorrente, capire bene il ciclo di vita degli effetti diventa ancora piu importante. Il punto non e "bloccare React", ma mantenere effetti e dati allineati al render effettivamente valido.

Questo si collega bene a:
- [[Programmazione/React/Pagine/useEffect]];
- [[Programmazione/React/Pagine/Fiber Architecture e Concurrent Mode]];
- `data fetching` nell'ecosistema React.

---

## 10. Best Practices

1. **Ogni effetto che apre una risorsa deve avere una strategia di cleanup:** listener, timer, subscription e fetch non vanno lasciati impliciti.
2. **Usa `AbortController` per le fetch dipendenti dal ciclo di vita del componente:** e il modo piu diretto per evitare lavoro inutile e risultati obsoleti.
3. **Gestisci `AbortError` separatamente dagli errori reali:** una richiesta abortita non e un fallimento applicativo.
4. **Non mettere tutta la logica asincrona in un unico `useEffect` enorme:** separare responsabilita rende piu facile il cleanup corretto.
5. **Pensa in termini di validita del dato, non solo di completamento tecnico della richiesta:** una risposta puo essere corretta ma non piu rilevante.
6. **Per scenari complessi valuta una libreria di data fetching:** caching, retry e deduplicazione sono spesso meglio gestiti da strumenti dedicati.

---
