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
  - interfacce
aliases:
  - Interface Segregation Principle
  - ISP
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/SOLID]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
  - "[[Programmazione/Clean Code/Pagine/Dependency Inversion Principle]]"
  - "[[Programmazione/Clean Code/Pagine/Moduli piccoli]]"
title: Interface Segregation Principle
---

# Interface Segregation Principle

## Sintesi

L'**Interface Segregation Principle** (ISP) suggerisce di definire i contratti a partire dai **clienti**. Un report che consulta un utente non dovrebbe dover conoscere salvataggio e cancellazione solo perché lo stesso archivio offre anche quelle operazioni. Il criterio è l'uso, non un limite al numero di metodi.

## Esempio: due clienti, un solo archivio possibile

```ts
type User = { id: string; displayName: string };

interface UserReader {
  findById(id: string): Promise<User | null>;
}

interface UserEditor {
  save(user: User): Promise<void>;
  remove(id: string): Promise<void>;
}

async function nameForReport(reader: UserReader, id: string): Promise<string> {
  const user = await reader.findById(id);
  return user?.displayName ?? "(utente assente)";
}
```

Il report può usare un sostituto che implementa **solo** `findById`. Non servono metodi finti che lanciano «operazione non supportata». L'editor amministrativo dell'esempio usa salvataggio e rimozione; un adattatore concreto può soddisfare entrambi i contratti. Se il flusso amministrativo deve anche consultare un utente, può richiedere `UserReader & UserEditor` senza allargare il contratto del report.

## Verifica del confine

Una ricerca riuscita con `null` produce `"(utente assente)"`; una connessione interrotta è un errore e non viene trasformata nello stesso testo. Cambiare la firma di `remove` non deve obbligare a riscrivere il sostituto del report. Un tentativo di chiamare `reader.remove(id)` attraverso il tipo `UserReader` viene respinto dal compilatore.

## Limiti ed errori comuni

- Un tipo di sola lettura restringe le operazioni visibili **al codice tipizzato**, non revoca permessi all'utente o al database. Un oggetto concreto può ancora esporre più metodi a runtime.
- Non rendere `save?` e `remove?` opzionali su un'unica interfaccia per aggirare il problema: sposteresti su ogni chiamante la domanda «posso usare questo metodo?».
- Se gli stessi clienti usano sempre due operazioni per una sola responsabilità, tenerle insieme può essere più leggibile. ISP chiede **quale porzione** serve al cliente; DIP chiede **chi definisce** quel contratto.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/SOLID|SOLID]]
- [[Programmazione/Clean Code/Pagine/Dependency Inversion Principle|Dependency Inversion Principle]]
- [[Programmazione/Clean Code/Pagine/Coesione e accoppiamento|Coesione e accoppiamento]]
- [[Programmazione/Clean Code/Pagine/Moduli piccoli|Moduli piccoli]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]

## Fonti

- Robert C. Martin, [Solid Relevance: Interface Segregation](https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html)
- Robert C. Martin, *Agile Software Development, Principles, Patterns, and Practices*; *Clean Architecture*
