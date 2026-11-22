---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - rust-di-sistema
aliases:
  - Zero-cost abstractions
  - Astrazioni zero-cost
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics|Generics]]"
  - "[[Programmazione/Rust/Pagine/Traits|Traits]]"
  - "[[Programmazione/Rust/Pagine/Iterator API|Iterator API]]"
related:
  - "[[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]"
title: Zero-cost abstractions
---

# Zero-cost abstractions

## Sintesi

**Zero-cost** non significa «non consuma risorse». La domanda è: *rispetto a quale implementazione manuale, a parità di comportamento, l'astrazione introduce lavoro in più?* Sommare i numeri pari richiede comunque di leggere l'input. L'idea è poter descrivere quel lavoro con un iteratore senza dover pagare, per esempio, per una collezione intermedia che non serve.

È un **principio di progettazione**, non la promessa che ogni ciclo e ogni iteratore producano le stesse istruzioni o abbiano la stessa velocità. Conviene distinguere tre tipi di affermazione:

| Affermazione | Che cosa la giustifica |
| --- | --- |
| «Questo wrapper ha il layout del suo campo.» | Una garanzia documentata, qui `#[repr(transparent)]` su un solo campo. |
| «Questa pipeline non costruisce un vettore di risultati parziali.» | Le operazioni effettivamente usate: una slice in prestito, un filtro e un accumulatore. Va considerato anche il corpo delle callback. |
| «Le due versioni sono altrettanto veloci sul mio carico.» | Una misura comparabile sul target e sul profilo pertinenti. Né la firma né il conteggio delle righe di assembly bastano. |

## Esempio: stessa somma, due notazioni

Il contratto è «somma solo i valori pari, modulo 2⁶⁴». `wrapping_add` rende esplicito l'overflow in **entrambi** i profili: un possibile panic in una variante e un risultato avvolto nell'altra non sarebbero comportamenti equivalenti. Il laboratorio richiede Rust/Cargo 1.85 o successivi, un linker per l'host e nessuna crate esterna. In una directory di prova:

```sh
cargo new --lib --vcs none costi
```

```sh
cd costi
```

Sostituisci `src/lib.rs`. Nel laboratorio `#[inline(never)]` chiede al compilatore di mantenere il confine delle due funzioni per facilitarne l'ispezione: non disattiva le ottimizzazioni **dentro** ciascuna funzione e non è un consiglio per il codice di produzione.

```rust
#[inline(never)]
pub fn sum_even_loop(values: &[u64]) -> u64 {
    let mut acc = 0_u64;
    for &n in values {
        if n % 2 == 0 {
            acc = acc.wrapping_add(n);
        }
    }
    acc
}

#[inline(never)]
pub fn sum_even_iter(values: &[u64]) -> u64 {
    values.iter().copied()
        .filter(|&n| n % 2 == 0)
        .fold(0, u64::wrapping_add)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn somma_pari_modulare() {
        for (values, expected) in [
            (&[][..], 0),
            (&[1, 3, u64::MAX][..], 0),
            (&[0, 2, 5, 4][..], 6),
            (&[u64::MAX - 1, 4][..], 2),
        ] {
            assert_eq!(sum_even_loop(values), expected);
            assert_eq!(sum_even_iter(values), expected);
        }
    }
}
```

`copied()` legge un `u64` alla volta; `filter` è pigro; `fold` consuma la catena e restituisce un numero. Nessun passaggio chiede di conservare tutti i valori pari. Inserire un `collect::<Vec<_>>()` tra filtro e somma cambierebbe il lavoro richiesto: si chiederebbe di materializzare gli elementi, non semplicemente di riscrivere la stessa espressione. Analogamente, `cloned()` su riferimenti a `String` non equivale a copiare un intero: clonare stringhe non vuote può allocare e copiare i byte.

### Controllare prima la semantica, poi il codice generato

```sh
cargo test
```

```sh
cargo test --release
```

Per ispezionare il codice senza installare strumenti aggiuntivi, dalla radice del progetto compila la libreria con ottimizzazioni e indica il file di uscita. Il comando crea o sovrascrive `confronto.s` nella directory di prova:

```sh
rustc --edition=2024 --crate-name costi --crate-type=lib -C opt-level=3 --emit=asm=confronto.s src/lib.rs
```

Cerca `sum_even_loop` e `sum_even_iter` nel file. Osserva se hanno corpi distinti, se un nome rimanda all'altro e se il percorso principale contiene chiamate agli adattatori. Un corpo condiviso è un risultato di **quella compilazione**; due corpi diversi non sono una misura di lentezza. L'inlining può eliminare chiamate e il compilatore può vettorizzare il ciclo, ma Rust non impone nessuno dei due risultati. Il comando diretto non applica automaticamente feature e profili di un workspace Cargo: per una conclusione sul progetto reale usa la sua build e [[Programmazione/Rust/Pagine/Performance e profiling|misura il percorso caldo]].

## Dispatch e allocazione sono decisioni separate

Con un tipo concreto il compilatore può specializzare il codice generico (*monomorfizzazione*). Per esempio, in `fn massimo<T: Ord>(a: T, b: T) -> T` si può restituire uno degli argomenti spostandolo: non serve aggiungere `Copy`. Il costo del confronto dipende però dall'implementazione di `Ord`: confrontare due stringhe può richiedere di leggerne il contenuto.

Per isolare il dispatch, **non** confrontare un prestito con un `Box`. Crea la directory `tests` e inserisci questo esempio in `tests/dispatch.rs`. Entrambe le chiamate usano la stessa slice e prendono in prestito la stessa closure:

```rust
fn count_with<P>(values: &[u64], predicate: &P) -> usize
where
    P: Fn(u64) -> bool + ?Sized,
{
    values.iter().copied().filter(|&n| predicate(n)).count()
}

#[test]
fn stesso_predicato_in_prestito() {
    let limit = 4;
    let above = |n: u64| n > limit;
    let erased: &dyn Fn(u64) -> bool = &above;
    let values = [3, 5, 4, 8];

    assert_eq!(count_with(&values, &above), 2);
    assert_eq!(count_with(&values, erased), 2);
}
```

Nel primo caso `P` è il tipo concreto della closure. Nel secondo è `dyn Fn(u64) -> bool`: `?Sized` permette questo caso perché la funzione riceve `&P`, non un `P` per valore. Il trait object consente di scegliere l'implementazione a runtime tramite vtable; formare il prestito **non alloca**. Se il compilatore riesce a risalire al tipo concreto può eliminare la chiamata indiretta. Il test verifica il risultato, non la presenza di una specifica istruzione.

Scegli generici per tipi noti quando vuoi specializzazione, tenendo conto dei tempi di compilazione e della possibile crescita del binario. Scegli `&dyn Trait` quando serve uniformare implementazioni in prestito, e `Box<dyn Trait>` quando serve anche **possederle**. La chiamata virtuale e la scelta di conservare un valore nell'heap sono costi diversi.

## Un caso garantito: layout del newtype

Inserisci in `tests/layout.rs`:

```rust
use std::mem::{align_of, size_of};
use std::num::NonZeroU32;

#[repr(transparent)]
struct TicketId(NonZeroU32);

#[test]
fn id_opzionale_senza_tag_aggiuntivo() {
    assert_eq!(size_of::<TicketId>(), size_of::<u32>());
    assert_eq!(align_of::<TicketId>(), align_of::<u32>());
    assert_eq!(size_of::<Option<TicketId>>(), size_of::<TicketId>());
    assert!(NonZeroU32::new(0).is_none());
    assert_eq!(NonZeroU32::new(7).map(TicketId).unwrap().0.get(), 7);
}
```

```sh
cargo test --release --tests
```

`TicketId` distingue un identificatore da un intero senza cambiare layout o ABI rispetto al campo. Inoltre `NonZeroU32` non può contenere zero: per questo tipo e il suo wrapper trasparente la libreria standard **garantisce** che `Option` non richieda spazio aggiuntivo. Non è una deduzione da una misura su un PC, né una regola per tutti gli enum o per `Option<u32>`. Il controllo di validità in `NonZeroU32::new` resta parte del comportamento: nessun byte aggiuntivo non significa nessun lavoro.

## Limiti da ricordare

- Il borrow checker verifica i prestiti in compilazione; questo non elimina il lavoro dei distruttori, il conteggio di `Rc`/`Arc` o i controlli dinamici richiesti da `RefCell`.
- Uno stato espresso con [[Programmazione/Rust/Pagine/Typestate pattern|typestate]] e un marker [[Programmazione/Rust/Pagine/PhantomData|PhantomData]] può evitare un flag runtime. Aprire il file o validare i dati durante la transizione ha comunque un costo.
- Un `match` su un enum può richiedere di distinguere i casi a runtime. Un iteratore parallelo può richiedere suddivisione del lavoro e sincronizzazione. Non diventano gratuiti perché l'interfaccia è tipizzata.
- Prima di sostituire codice leggibile, confronta algoritmo, ownership, allocazioni, politica di errore e input. Poi verifica la risorsa che conta: tempo, memoria, dimensione del binario o durata della build.

## Fonti ufficiali

- [The Rust Programming Language: confrontare cicli e iteratori](https://doc.rust-lang.org/book/ch13-04-performance.html)
- [Rust Reference: trait objects e dispatch](https://doc.rust-lang.org/reference/types/trait-object.html)
- [Rust Reference: rappresentazione transparent](https://doc.rust-lang.org/reference/type-layout.html#the-transparent-representation)
- [Libreria standard: garanzie di rappresentazione di Option](https://doc.rust-lang.org/std/option/index.html#representation)
- [rustc: produrre assembly con --emit](https://doc.rust-lang.org/rustc/command-line-arguments.html#--emit-specifies-the-types-of-output-files-to-generate)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]
