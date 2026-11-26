---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - solid
  - design
aliases:
  - SOLID
  - Principi SOLID
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Separazione delle responsabilita]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Dependency Inversion Principle]]"
  - "[[Programmazione/Clean Code/Pagine/Interface Segregation Principle]]"
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
title: SOLID
---

# SOLID

## Sintesi

**SOLID** raccoglie cinque domande su come un componente cambia e su cosa promette ai suoi clienti. Sostituire tre classi con tre interfacce non dimostra di aver applicato cinque principi: può cambiare la direzione delle dipendenze, ma non dimostra che un'implementazione rispetti il comportamento atteso.

## Cinque domande per lo stesso catalogo

| Principio | Domanda da porre | Esempio |
| --- | --- | --- |
| **S**ingle Responsibility | Quali decisioni cambiano per ragioni o interlocutori diversi? | La politica commerciale sui nomi e il formato del report non devono cambiare insieme per forza. |
| **O**pen/Closed | Per quale variazione concreta serve un punto di estensione? | Il report riceve una funzione di ricerca; introdurre un catalogo in memoria non richiede un altro `if` nel report. |
| **L**iskov Substitution | Un sostituto mantiene risultati, precondizioni ed errori promessi? | Se un ID assente vale `null`, una nuova ricerca che lancia un'eccezione su quell'ID rompe il cliente. |
| **I**nterface Segregation | Da quali operazioni dipende davvero questo cliente? | Il report legge le etichette; non deve implementare né simulare la cancellazione di voci. |
| **D**ependency Inversion | Chi definisce il contratto e chi si adatta? | Il report richiede una ricerca di etichette; è l'adattatore a tradurre le righe SQL, non il report a importare il driver. |

## Esempio: stessa firma, comportamento diverso

La ricerca seguente è sincrona; accetta anche ID non presenti e restituisce `null` quando manca l'etichetta. Una stringa vuota è un'etichetta presente. Qui interessa la sostituibilità, non la gestione di un archivio remoto.

```ts
type FindLabel = (id: string) => string | null;

function displayLabel(id: string, find: FindLabel): string {
  return find(id) ?? "(non in catalogo)";
}

const labels = new Map([["A", "Carta"], ["B", ""]]);
const lookup: FindLabel = (id) => labels.get(id) ?? null;

const incompatible: FindLabel = (id) => {
  if (!labels.has(id)) throw new Error("ID assente");
  return labels.get(id)!;
};
```

TypeScript accetta entrambe le funzioni. Per `"A"` danno lo stesso risultato; per `"B"` il cliente conserva la stringa vuota. Solo `lookup` permette al cliente di mostrare il testo di ripiego per un ID assente. Il test utile è **lo stesso caso d'uso** applicato a ogni sostituto, non il solo controllo della firma.

## Limiti ed errori comuni

OCP non promette che il codice non cambierà mai: protegge una direzione di variazione scelta, non tutte quelle immaginabili. LSP non impone che le implementazioni siano identiche al loro interno, ma che rispettino le osservazioni promesse al cliente. Se nessun cliente deve scegliere tra strategie e il costo di cambiare è basso, una funzione diretta può essere la soluzione più chiara.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Separazione delle responsabilita|Separazione delle responsabilita]]
- [[Programmazione/Clean Code/Pagine/Dependency Inversion Principle|Dependency Inversion Principle]]
- [[Programmazione/Clean Code/Pagine/Interface Segregation Principle|Interface Segregation Principle]]
- [[Programmazione/Clean Code/Pagine/Coesione e accoppiamento|Coesione e accoppiamento]]
- [[Programmazione/Clean Code/Pagine/Code smells|Code smells]]

## Fonti

- Robert C. Martin, [Solid Relevance](https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html)
- Robert C. Martin, *Agile Software Development, Principles, Patterns, and Practices*; *Clean Architecture*
