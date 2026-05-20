---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, vec, collezioni]
aliases:
  - "Vec Rust"
  - "Vector Rust"
  - "Vec<T>"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Slices]]"
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
related:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet]]"
  - "[[Programmazione/Rust/Pagine/HashMap e HashSet]]"
---

# Vec

## Sintesi

`Vec<T>` e una collezione dinamica contigua allocata sullo heap. E la struttura standard per liste di elementi dello stesso tipo quando serve crescere o ridurre la lunghezza a runtime.

Un `Vec<T>` possiede gli elementi che contiene. Quando il `Vec` viene distrutto, vengono distrutti anche gli elementi.

## Quando usarlo

- Quando devi accumulare una sequenza di elementi.
- Quando vuoi accesso rapido per indice.
- Quando l'ordine di inserimento e importante.
- Quando puoi trarre vantaggio dalla memoria contigua.
- Quando vuoi passare la collezione come slice `&[T]` a funzioni generiche.

## Come funziona

Un `Vec<T>` contiene sullo stack tre metadati:

- puntatore al buffer heap;
- lunghezza;
- capacita.

Il buffer heap contiene gli elementi.

```rust
let mut numeri = Vec::new();
numeri.push(10);
numeri.push(20);
```

Se la capacita non basta, il `Vec` puo riallocare il buffer. Questo puo invalidare riferimenti agli elementi.

## API / Sintassi

Creazione:

```rust
let a: Vec<i32> = Vec::new();
let b = vec![1, 2, 3];
let c = Vec::with_capacity(100);
```

Operazioni comuni:

```rust
let mut v = vec![1, 2, 3];
v.push(4);
let ultimo = v.pop();
let primo = v.get(0);
```

Iterazione:

```rust
for n in &v {
    println!("{n}");
}
```

## Esempio pratico

```rust
fn filtra_pari(numeri: &[i32]) -> Vec<i32> {
    let mut risultato = Vec::new();

    for &n in numeri {
        if n % 2 == 0 {
            risultato.push(n);
        }
    }

    risultato
}

fn main() {
    let numeri = vec![1, 2, 3, 4];
    let pari = filtra_pari(&numeri);
    println!("{pari:?}");
}
```

La funzione accetta una slice per non imporre `Vec` al chiamante e restituisce un nuovo `Vec` posseduto.

## Varianti

- `Vec<T>`: lista dinamica contigua.
- `&[T]`: vista immutabile su una sequenza.
- `&mut [T]`: vista mutabile su una sequenza senza cambiare lunghezza.
- `VecDeque<T>`: efficiente per inserimenti e rimozioni da entrambi gli estremi.
- Array `[T; N]`: dimensione fissa nota a compile time.

## Errori comuni

- Usare indicizzazione `v[i]` quando l'indice puo essere fuori range.
- Conservare riferimenti agli elementi e poi fare `push`, causando possibili riallocazioni.
- Passare `&Vec<T>` invece di `&[T]` nelle API.
- Clonare tutto il `Vec` quando basta iterare per riferimento.
- Dimenticare di usare `with_capacity` quando la dimensione prevista e nota.

## Checklist

- Serve accesso per indice e memoria contigua?
- Devi inserire spesso in testa? Valuta `VecDeque`.
- La funzione deve solo leggere? Accetta `&[T]`.
- La capacita prevista e nota?
- Esistono riferimenti agli elementi durante operazioni che possono riallocare?

## Collegamenti

- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet|VecDeque BTreeMap e BTreeSet]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]

