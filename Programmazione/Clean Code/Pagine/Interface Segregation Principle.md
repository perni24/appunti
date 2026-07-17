---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, solid, interfacce]
aliases: [Interface Segregation Principle, ISP]
prerequisites: [SOLID]
related: [Coesione e accoppiamento, Dependency Inversion Principle, Moduli piccoli]
---

# Interface Segregation Principle

## Sintesi

L'**Interface Segregation Principle** dice che un client non dovrebbe dipendere da metodi che non usa.

In pratica: meglio interfacce piccole e specifiche rispetto a contratti enormi che obbligano implementazioni e chiamanti a conoscere troppo.

## Problema che risolve

Interfacce grandi creano accoppiamento artificiale. Un modulo che ha bisogno solo di leggere dati dipende anche da metodi di scrittura, cancellazione o sincronizzazione.

Questo rende test e implementazioni piu complicati.

## Concetto chiave

Una interfaccia dovrebbe essere definita dal bisogno del client, non dalla lista completa di capacita dell'oggetto concreto.

Se due client usano parti diverse di una interfaccia, probabilmente servono contratti separati.

## Dettagli importanti

- ISP riduce dipendenze inutili.
- Interfacce piccole rendono piu facili test e fake.
- Una interfaccia non deve essere piccola per forza, ma coesa.
- Il nome dell'interfaccia dovrebbe descrivere il ruolo.
- ISP e collegato alla coesione: metodi che cambiano per ragioni diverse non dovrebbero stare sempre insieme.

## Esempio

Interfaccia troppo ampia:

```ts
interface UserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Contratto piu specifico:

```ts
interface UserReader {
  findById(id: string): Promise<User>;
}

interface UserWriter {
  save(user: User): Promise<void>;
}
```

Un caso d'uso di lettura non dipende piu da operazioni di scrittura.

## Limiti

- Troppe interfacce piccole possono frammentare il design.
- Separare contratti senza bisogni reali e prematuro.
- Alcuni framework richiedono interfacce piu ampie.
- Il confine giusto emerge osservando i client reali.

## Errori comuni

- Creare una singola interfaccia per ogni repository con tutte le operazioni CRUD.
- Far implementare metodi vuoti o non supportati.
- Separare interfacce per metodo senza coesione.
- Definire interfacce dal punto di vista dell'implementazione.
- Non aggiornare i contratti quando cambiano i casi d'uso.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[SOLID]]
- [[Dependency Inversion Principle]]
- [[Coesione e accoppiamento]]
- [[Moduli piccoli]]
- [[Dipendenze esplicite]]

## Fonti

- Robert C. Martin, *Agile Software Development, Principles, Patterns, and Practices*
- Robert C. Martin, *Clean Architecture*
