---
date: 2026-02-23
tags: [javascript, programming, memory, performance]
type: #permanent-note
status: budding
---

# Garbage Collection in JavaScript

La **Garbage Collection** (GC) è un processo automatico del motore JavaScript che monitora l'allocazione della memoria e determina quando un blocco di memoria non è più necessario, per poi liberarlo. In JS, questo processo è basato principalmente sul concetto di **Reachability** (Raggiungibilità).

## 1. Il concetto di "Raggiungibilità"

In JavaScript, un valore è considerato "raggiungibile" e non viene eliminato se è accessibile o utilizzato in qualche modo.
- **Radici (Roots)**: Sono i valori base che sono sempre raggiungibili (es: variabili globali, variabili locali nel Call Stack attuale).
- Un oggetto è raggiungibile se è nelle radici o se è referenziato da un altro oggetto raggiungibile.

## 2. Algoritmo Mark-and-Sweep

È l'algoritmo principale utilizzato dai moderni motori JS (come V8). Il processo avviene in due fasi:

1.  **Mark (Marcatura)**: Il Garbage Collector parte dalle "radici" e visita tutti gli oggetti collegati, marcandoli come "vivi". Si sposta poi ricorsivamente su tutti gli oggetti referenziati da questi, finché ogni oggetto raggiungibile non è stato marcato.
2.  **Sweep (Pulizia)**: Tutti gli oggetti della memoria che **non** sono stati marcati (quindi non raggiungibili dalle radici) vengono considerati "spazzatura" e la loro memoria viene liberata.

## 3. Reference Counting (Approccio Storico)

Un tempo si usava il *Reference Counting*, che contava semplicemente quante referenze puntavano a un oggetto. Se il conteggio arrivava a 0, l'oggetto veniva eliminato.
- **Il Limite**: Questo algoritmo falliva con i **riferimenti circolari** (due oggetti che si puntano a vicenda ma non sono più usati dal resto del programma), causando Memory Leaks. Il *Mark-and-Sweep* risolve brillantemente questo problema.

## 4. Ottimizzazioni del Motore

I moderni Garbage Collector sono estremamente sofisticati:
- **Generational Collection**: Divide gli oggetti in "nuovi" e "vecchi". Gli oggetti che sopravvivono a diversi cicli vengono spostati nella sezione dei vecchi e controllati meno frequentemente.
- **Incremental/Idle GC**: Suddivide il lavoro in piccoli pezzi eseguiti durante i momenti di inattività del processore per evitare "freeze" evidenti dell'interfaccia utente.

> [!IMPORTANT] Non determinismo
> Non puoi forzare la Garbage Collection in JavaScript. È il motore a decidere il momento migliore per eseguirla in base all'utilizzo della memoria e all'attività del processore.

---