---
date: 2026-04-17
tags: [react, fiber, concurrent-rendering, internals, frontend, javascript]
type: #permanent-note
status: budding
---

# Fiber Architecture e Concurrent Mode

La **Fiber Architecture** e l'architettura interna moderna di React che gestisce riconciliazione, scheduling e priorita degli aggiornamenti.

Il cosiddetto **Concurrent Mode**, oggi piu correttamente inteso come **concurrent rendering**, sfrutta questa architettura per permettere a React di interrompere, riprendere e prioritizzare il lavoro di rendering in modo piu flessibile.

> [!INFO] Punto chiave
> Fiber non e una feature visuale dell'API React. E il motore interno che rende possibili aggiornamenti piu intelligenti, rendering interrompibile e strumenti moderni come `useTransition` e `Suspense`.

---

## 1. Il problema che risolve

Nel vecchio modello di rendering, React eseguiva il lavoro in modo piu monolitico:
- parte un aggiornamento;
- React processa il lavoro;
- il browser riceve il risultato.

Se quel lavoro e pesante, la UI puo diventare meno responsiva:
- input che laggano;
- click percepiti in ritardo;
- liste lente;
- transizioni poco fluide.

Fiber nasce per gestire meglio questo problema, dando a React un modello piu granulare del lavoro da eseguire.

---

## 2. Cos'è Fiber

Una **fiber** e, in termini semplificati, un'unità di lavoro che rappresenta un componente o una parte dell'albero React.

Grazie a Fiber, React puo:
- spezzare il lavoro di rendering in unita piu piccole;
- assegnare priorita diverse agli aggiornamenti;
- sospendere lavoro meno urgente;
- riprendere successivamente dove aveva lasciato.

Dal punto di vista pratico, Fiber trasforma il rendering da processo "tutto o niente" a processo piu controllabile.

---

## 3. Come cambia il rendering

Con Fiber, React distingue meglio tra:
- aggiornamenti urgenti;
- aggiornamenti non urgenti;
- lavoro che puo essere rimandato;
- lavoro che deve restare immediato per la UX.

Esempio intuitivo:
- scrivere in un input e urgente;
- ricalcolare una lista enorme filtrata puo essere non urgente.

Senza un sistema di priorita, tutto entra nello stesso flusso di lavoro. Con Fiber, React puo trattare quei due aggiornamenti in modo diverso.

Questo si collega direttamente a [[useTransition e useDeferredValue]].

---

## 4. Concurrent Rendering: cosa significa davvero

Il termine "Concurrent Mode" ha creato molta confusione. Il punto corretto da capire e questo:

React non esegue il rendering concorrente come "thread paralleli" nel browser JavaScript.

Significa piuttosto che React puo:
- iniziare un render;
- interromperlo se arriva un aggiornamento piu urgente;
- riprendere dopo;
- evitare di bloccare inutilmente l'interfaccia.

> [!WARNING] Errore comune
> Concurrent rendering non significa che React rende tutto in parallelo nel senso tradizionale del termine. Significa che il lavoro di rendering puo essere schedulato in modo piu flessibile.

---

## 5. Relazione con il Virtual DOM

Il [[Virtual DOM]] descrive la rappresentazione virtuale dell'interfaccia e il processo di diffing.

Fiber aggiunge un livello in piu:
- non decide solo *cosa* aggiornare;
- gestisce anche *come* e *quando* eseguire quel lavoro.

Quindi:
- il Virtual DOM spiega il modello di confronto dell'interfaccia;
- Fiber spiega il motore che organizza quel lavoro.

---

## 6. Esempio concettuale

Scenario:
- l'utente digita in un campo di ricerca;
- l'app deve aggiornare subito il testo digitato;
- contemporaneamente deve ricalcolare una lista molto grande.

Con il modello moderno, React puo:
- dare priorita alta all'input;
- trattare il rendering della lista come lavoro differibile;
- mantenere la UI responsiva.

Esempio con API moderna:

```javascript
const [isPending, startTransition] = useTransition();

function handleChange(event) {
  setInputValue(event.target.value);

  startTransition(() => {
    setFilteredResults(expensiveFilter(event.target.value));
  });
}
```

Qui l'API visibile e `useTransition`, ma il comportamento reso possibile dipende dalla Fiber Architecture.

---

## 7. Fasi del lavoro React

In termini concettuali, React separa il lavoro in due grandi fasi:

### Render phase
React calcola il nuovo albero e prepara il lavoro da eseguire.

Questa fase puo essere:
- spezzata;
- interrotta;
- ripresa.

### Commit phase
React applica le modifiche al DOM reale.

Questa fase e invece critica e va completata in modo coerente.

Questa distinzione aiuta a capire perche React puo essere flessibile nel rendering, ma deve comunque mantenere consistenza quando applica il risultato finale.

---

## 8. Fiber e feature moderne

La Fiber Architecture rende possibili molte feature moderne di React:
- [[Suspense e Lazy Loading]];
- [[useTransition e useDeferredValue]];
- scheduling piu intelligente;
- rendering piu responsivo;
- basi per strategie moderne di streaming e server rendering.

In pratica, Fiber e l'infrastruttura che permette a React di fare piu di un semplice diffing dell'albero.

---

## 9. Limiti e tradeoff

Fiber e concurrent rendering migliorano molto la gestione del lavoro UI, ma non eliminano i problemi architetturali.

### Vantaggi
- maggiore reattivita percepita;
- possibilita di prioritizzare aggiornamenti;
- migliore UX in scenari pesanti;
- base per API moderne di scheduling.

### Limiti
- non rendono il codice "gratuitamente veloce";
- non sostituiscono profiling e ottimizzazione mirata;
- non evitano problemi dovuti a stato mal distribuito o componenti troppo pesanti.

### Rischio comune
Pensare che "React 18 risolve le performance da solo" porta a diagnosi sbagliate. Se l'architettura della UI e pessima, Fiber puo aiutare ma non compensare tutto.

---

## 10. Best Practices

1. **Considera Fiber come modello interno utile da capire, non come API da usare direttamente:** il valore pratico sta nel capire cosa rende possibile.
2. **Usa le API moderne che lo sfruttano davvero:** `useTransition`, `useDeferredValue`, `Suspense`.
3. **Distingui aggiornamenti urgenti da non urgenti:** e il modo corretto di sfruttare il concurrent rendering.
4. **Non confondere concorrente con parallelo:** il browser resta single-threaded per JavaScript nella maggior parte dei casi.
5. **Continua a usare profiling reale:** la teoria di Fiber non sostituisce [[Profiler e Debugging]].
6. **Mantieni comunque buona architettura UI:** stato locale ben posizionato, liste ottimizzate e componenti coerenti restano fondamentali.

---
