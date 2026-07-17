---
date: 2026-05-21
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - astrazione-e-generici
aliases:
  - "GAT"
  - "Generic Associated Types"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Associated types]]"
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetimes nei trait]]"
  - "[[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)]]"
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
---

# Generic Associated Types (GAT)

## Sintesi

I Generic Associated Types sono associated types che accettano parametri generici, spesso lifetime. Permettono di esprimere relazioni piu precise tra un trait, i suoi metodi e tipi restituiti che dipendono dal lifetime del borrow.

Sono utili per API avanzate come iteratori che producono riferimenti legati a `self`, parser, viste temporanee e astrazioni lending.

## Quando usarlo

- Quando un associated type deve dipendere da un lifetime.
- Quando un metodo restituisce un tipo collegato al borrow di `self`.
- Quando un trait generico normale non riesce a modellare la relazione tra input e output.
- Quando vuoi evitare allocazioni restituendo viste prese in prestito.

## Come funziona

Forma base:

```rust
trait LendingIterator {
    type Item<'a>
    where
        Self: 'a;

    fn next<'a>(&'a mut self) -> Option<Self::Item<'a>>;
}
```

`Item<'a>` dipende dal lifetime del borrow di `self`. Questo permette di restituire riferimenti validi solo finche dura quel borrow.

Senza GAT, molti trait di questo tipo richiederebbero allocazioni, workaround o API meno precise.

## API / Sintassi

Associated type generico:

```rust
trait Container {
    type Ref<'a>
    where
        Self: 'a;

    fn get<'a>(&'a self) -> Self::Ref<'a>;
}
```

Implementazione:

```rust
struct Text(String);

impl Container for Text {
    type Ref<'a> = &'a str;

    fn get<'a>(&'a self) -> Self::Ref<'a> {
        &self.0
    }
}
```

## Esempio pratico

```rust
trait RowSource {
    type Row<'a>
    where
        Self: 'a;

    fn current<'a>(&'a self) -> Option<Self::Row<'a>>;
}

struct CsvRow {
    line: String,
}

impl RowSource for CsvRow {
    type Row<'a> = &'a str;

    fn current<'a>(&'a self) -> Option<Self::Row<'a>> {
        Some(self.line.as_str())
    }
}
```

Il tipo restituito e una vista dentro `self`, senza creare una nuova `String`.

## Varianti

- GAT con lifetime: `type Item<'a>;`.
- GAT con parametri di tipo: `type Output<T>;`.
- GAT con bound: `type Item<'a>: Debug`.
- Trait lending: restituiscono valori legati al borrow del trait implementer.
- Alternative piu semplici: associated types normali o funzioni generiche quando bastano.

## Errori comuni

- Usare GAT per casi che associated types normali risolvono gia.
- Dimenticare il bound `where Self: 'a` quando richiesto.
- Rendere il trait difficile da implementare per ottenere una piccola ottimizzazione.
- Confondere lifetime del valore restituito con ownership del valore.
- Usare GAT prima di avere chiaro il modello di borrowing dell'API.

## Checklist

- Il tipo associato dipende davvero da un lifetime o da un parametro?
- Stai restituendo una vista presa in prestito da `self`?
- L'API resta comprensibile per chi dovra implementarla?
- Un trait piu semplice con associated type normale basta?
- Hai documentato la relazione tra borrow e valore restituito?

## Collegamenti

- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds (HRTB)]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
