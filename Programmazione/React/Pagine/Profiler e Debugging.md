---
date: 2026-04-17
tags: [react, profiler, debugging, performance, frontend, javascript]
type: #permanent-note
status: budding
---

# Profiler e Debugging (React DevTools)

Il **profiling** e il **debugging** in React servono a capire due cose diverse ma complementari:

- **debugging**: perche un componente si comporta in modo errato;
- **profiling**: dove l'applicazione spende tempo e quali render costano davvero.

In React, lo strumento principale per entrambe le attivita e **React DevTools**, in particolare:
- tab **Components**;
- tab **Profiler**.

> [!INFO] Regola pratica
> Non ottimizzare React alla cieca. Prima bisogna osservare quali componenti si aggiornano, perche lo fanno e quanto costa davvero quel rendering.

---

## 1. Il problema che risolvono

In un'app React, un bug o un rallentamento possono dipendere da molte cause:
- stato aggiornato nel punto sbagliato;
- props che cambiano piu del necessario;
- re-render a cascata;
- memoization inefficace;
- effetti collaterali ripetuti;
- liste grandi o componenti pesanti.

Senza strumenti di osservazione, il rischio e:
- cercare il problema nel punto sbagliato;
- aggiungere `useMemo` o `useCallback` inutilmente;
- introdurre complessita senza miglioramenti reali.

---

## 2. React DevTools: tab Components

La tab **Components** permette di:
- ispezionare l'albero React;
- vedere `props`, `state` e hook;
- individuare rapidamente dove nasce uno stato incoerente;
- controllare il flusso dei dati tra parent e child.

Esempio di uso pratico:
- selezioni un componente che mostra dati sbagliati;
- osservi le sue props correnti;
- verifichi se il problema nasce li o nel parent.

Questo rende il debugging molto piu concreto rispetto al solo `console.log`.

---

## 3. React DevTools: tab Profiler

La tab **Profiler** serve a misurare i render.

Ti permette di vedere:
- quali componenti hanno renderizzato;
- quanto tempo e costato il render;
- quali aggiornamenti sono stati piu costosi;
- quali parti dell'albero si aggiornano troppo spesso.

### Flusso tipico

1. apri il Profiler;
2. avvii la registrazione;
3. esegui un'interazione nell'app;
4. fermi la registrazione;
5. analizzi quali componenti hanno richiesto piu tempo.

Questo ti aiuta a capire se il problema e:
- un singolo componente pesante;
- una cascata di re-render;
- una lista troppo grande;
- una strategia di memoization inefficace.

---

## 4. Cosa significa un re-render costoso

Un re-render non e automaticamente un problema. React e progettato per renderizzare spesso.

Il problema nasce quando:
- il render e lento;
- i render sono troppo frequenti;
- componenti grandi si aggiornano inutilmente;
- l'interazione dell'utente percepisce lag.

> [!WARNING] Errore comune
> "Sto vedendo tanti render" non significa da solo "sto avendo un problema". La domanda corretta e: quei render costano davvero troppo o degradano la UX?

---

## 5. Cause comuni di re-render inutili

### Props referenzialmente nuove

```javascript
<Child data={{ value: count }} />
```

Qui l'oggetto viene ricreato a ogni render e puo forzare aggiornamenti inutili nel child.

### Funzioni ricreate a ogni render

```javascript
<Child onClick={() => doSomething()} />
```

In alcuni casi questo e innocuo, in altri puo interferire con `React.memo`.

### Stato troppo alto nell'albero
Se tieni stato in un parent molto alto, ogni aggiornamento puo trascinare troppi componenti nel re-render.

### Liste grandi
Renderizzare molte righe o card puo diventare costoso anche con logica semplice.

Questi casi si collegano direttamente a [[useMemo e useCallback]] e [[useTransition e useDeferredValue]].

---

## 6. Esempio pratico di analisi

Scenario:
- digiti in un input;
- tutta la pagina sembra rallentare.

Con il Profiler puoi verificare se:
- si aggiorna solo l'input;
- si aggiorna l'intera lista filtrata;
- si aggiornano anche componenti che non dovrebbero cambiare.

Se il problema e una lista costosa, puoi poi valutare:
- `useDeferredValue`;
- `useTransition`;
- memoization mirata;
- virtualizzazione;
- spostare stato piu in basso.

Il punto chiave e che il profiler non ti dice "usa questo hook", ma ti mostra dove sta il costo.

---

## 7. Debugging pratico oltre DevTools

Oltre a React DevTools, gli strumenti piu comuni sono:
- `console.log` mirati;
- breakpoint nel browser;
- network tab per problemi di fetch;
- warnings di React;
- error boundaries per sezioni instabili.

Per i problemi di runtime dell'interfaccia, spesso conviene combinare:
- **Components tab** per stato e props;
- **console** per verifiche puntuali;
- **Profiler** per i costi di rendering;
- [[Error Boundaries]] per isolare crash di rendering.

---

## 8. Profiler vs memoization

Hook come `useMemo` e `useCallback` non sono il punto di partenza. Sono strumenti di ottimizzazione successivi all'analisi.

Flusso corretto:

1. osserva il problema;
2. misura con Profiler;
3. identifica il componente o pattern costoso;
4. applica un'ottimizzazione mirata;
5. misura di nuovo.

Se usi memoization ovunque senza profiling:
- aumenti la complessita;
- peggiori la leggibilita;
- rischi di non risolvere il vero collo di bottiglia.

---

## 9. Limiti e tradeoff

Il profiling e utile, ma va interpretato con criterio.

### Vantaggi
- visibilita sui render reali;
- diagnosi mirata dei colli di bottiglia;
- ottimizzazioni piu difendibili.

### Limiti
- i dati vanno letti nel contesto dell'interazione;
- non ogni render "rosso" e un problema reale;
- il tooling aiuta molto, ma non sostituisce una buona architettura.

### Rischio comune
Scambiare il sintomo per la causa. Un componente lento puo essere solo l'ultimo anello di una catena di aggiornamenti mal distribuita.

---

## 10. Best Practices

1. **Usa React DevTools come primo strumento di osservazione:** in particolare Components e Profiler.
2. **Misura prima di ottimizzare:** evita memoization e refactor prematuri.
3. **Cerca la fonte dell'aggiornamento, non solo il componente lento:** spesso il problema nasce piu in alto nell'albero.
4. **Controlla props, stato e referenze:** oggetti e callback ricreati spesso sono una causa tipica di re-render inutili.
5. **Ottimizza solo dove la UX ne beneficia davvero:** non ogni miglioramento micro-tecnico produce valore percepibile.
6. **Ricontrolla dopo ogni ottimizzazione:** il profiler deve confermare che l'intervento ha avuto effetto.

---
