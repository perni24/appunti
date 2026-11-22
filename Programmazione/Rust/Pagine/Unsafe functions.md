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
  - unsafe-rust-in-profondita
aliases:
  - unsafe fn
  - Funzioni unsafe
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
related:
  - "[[Programmazione/Rust/Pagine/Invariants]]"
  - "[[Programmazione/Rust/Pagine/Unsafe traits]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
title: Unsafe functions
---

# Unsafe functions

## Sintesi

Una `unsafe fn` impone a chi la chiama una **precondizione di sicurezza** che la firma non fa rispettare al compilatore. Il criterio non è «la funzione contiene codice unsafe», ma «un chiamante potrebbe violarne le precondizioni usando soltanto valori ammessi dai tipi?». Se la funzione può controllarle da sola, può offrire una firma safe.

## Quando usarlo

- **Indice fornito dall'utente:** non chiedere al chiamante di garantirlo con `unsafe`. Usa `slice.get(i)` e restituisci `Option<&T>` se l'assenza è prevista. Un input non valido da rifiutare non è, di per sé, un motivo per dichiarare la funzione unsafe.
- **Puntatore fornito da una libreria esterna:** se devi leggerlo, la coppia indirizzo/lunghezza non dimostra che l'allocazione sia viva e leggibile. Qui può servire una `unsafe fn` con un contratto verificabile da chi conosce la libreria.
- **Metodo o costruttore a basso livello:** valgono gli stessi criteri di una funzione libera. Documenta gli invarianti aggiuntivi che l'implementazione può assumere e preferisci un costruttore safe se li puoi stabilire dai parametri.

## Come funziona

Il contratto va letto in entrambe le direzioni. **Il chiamante** deve soddisfare ciò che compare sotto `# Safety`; **l'implementazione** deve essere corretta per *tutti* gli input che soddisfano quelle condizioni, senza presumere altro.

```rust
#![deny(unsafe_op_in_unsafe_fn)]

/// Restituisce un elemento senza verificare l'indice.
///
/// # Safety
/// Il chiamante deve garantire che `index < slice.len()`.
unsafe fn get_unchecked<T>(slice: &[T], index: usize) -> &T {
    // SAFETY: il contratto del chiamante è quello del metodo sulla slice.
    unsafe { slice.get_unchecked(index) }
}

fn main() {
    let values = [10, 20, 30];
    // SAFETY: l'indice 1 è strettamente minore della lunghezza 3.
    let value = unsafe { get_unchecked(&values, 1) };
    assert_eq!(*value, 20);

    // Un indice non verificato passa invece dall'API safe.
    assert_eq!(values.get(values.len()), None);
}
```

La slice in input garantisce già memoria valida e lega la durata del riferimento restituito al prestito originale. Al chiamante resta da provare **solo l'indice**. Per `get_unchecked`, `index == len` viola il contratto già alla chiamata, non soltanto se il riferimento viene poi letto.

La firma `unsafe fn` e il blocco `unsafe { ... }` hanno scopi distinti. In edition 2024 omettere il blocco per un'operazione unsafe dentro una `unsafe fn` produce un **warning di default**, non un errore obbligatorio dell'edition. Nell'esempio `deny(unsafe_op_in_unsafe_fn)` lo rende un errore. Da una normale funzione safe è invece necessario un blocco esplicito per chiamare la funzione unsafe.

## API / Sintassi

### Una primitiva unsafe e un chiamante safe

```rust
/// Legge una copia di un intero.
///
/// # Safety
/// Per la lettura, ptr deve essere non nullo, allineato e valido per
/// leggere un i32 inizializzato. L'accesso deve rispettare aliasing
/// e non deve concorrere con una scrittura non sincronizzata.
unsafe fn read_i32(ptr: *const i32) -> i32 {
    // SAFETY: sono le precondizioni documentate sopra.
    unsafe { *ptr }
}

fn read_first(slice: &[i32]) -> Option<i32> {
    let first = slice.first()?;
    // SAFETY: first è un riferimento valido per tutta la lettura.
    Some(unsafe { read_i32(std::ptr::from_ref(first)) })
}

fn main() {
    assert_eq!(read_first(&[]), None);
    assert_eq!(read_first(&[7, 9]), Some(7));
}
```

`read_first` non è unsafe: su input vuoto esce prima della chiamata; altrimenti ricava il puntatore da un vero `&i32`, non da un semplice controllo `!ptr.is_null()`. Il wrapper serve a mostrare chi si assume la responsabilità. **Nel codice applicativo l'intera funzione può essere `slice.first().copied()`**, senza usare puntatori.

## Esempio pratico

### Un buffer esterno: prestare o copiare?

Una firma come `unsafe fn bytes_from_raw<'a>(ptr: *const u8, len: usize) -> &'a [u8]` non ricava `'a` dal puntatore: nessun parametro contiene un prestito con quella durata. Scrivere `'a` non prolunga la vita del buffer. Per restituire quel riferimento bisognerebbe garantire memoria valida e non modificata **per tutto il prestito scelto**, non soltanto durante la funzione.

Se hai già una slice Rust, preserva invece il legame nel tipo. Lo si vede nella firma seguente: il risultato non può sopravvivere a `bytes`. L'annotazione esplicita è didattica; con un solo prestito in ingresso si può omettere.

```rust
fn prefix<'a>(bytes: &'a [u8], len: usize) -> Option<&'a [u8]> {
    bytes.get(..len)
}

fn main() {
    assert_eq!(prefix(b"abc", 2), Some(&b"ab"[..]));
    assert_eq!(prefix(b"abc", 4), None);
}
```

Se il contratto esterno garantisce la memoria **solo durante la chiamata**, una copia posseduta evita di esporre un prestito più lungo. L'adattatore seguente accetta esplicitamente `(null, 0)`: è una scelta della sua API, **non** una precondizione ammessa da `from_raw_parts`.

```rust
/// Copia un buffer; con lunghezza zero non accede al puntatore.
///
/// # Safety
/// Se len > 0, ptr deve essere non nullo e consentire la lettura di
/// len byte consecutivi e inizializzati in una singola allocazione.
/// L'intervallo non deve superare isize::MAX byte né avvolgere lo
/// spazio degli indirizzi. La memoria deve restare viva e non essere
/// modificata per tutta la copia. Per u8 l'allineamento richiesto è 1.
unsafe fn copy_bytes(ptr: *const u8, len: usize) -> Vec<u8> {
    if len == 0 {
        return Vec::new();
    }
    // SAFETY: il contratto copre l'intera slice fino alla fine di to_vec().
    unsafe { std::slice::from_raw_parts(ptr, len) }.to_vec()
}

fn main() {
    // SAFETY: con len == 0 il contratto non richiede memoria leggibile.
    let empty = unsafe { copy_bytes(std::ptr::null(), 0) };
    assert!(empty.is_empty());

    let owned = {
        let source = vec![10_u8, 20, 30];
        // SAFETY: ptr e len vengono dallo stesso Vec, vivo e non modificato.
        unsafe { copy_bytes(source.as_ptr(), source.len()) }
    };
    assert_eq!(owned, [10, 20, 30]); // source non esiste più.
}
```

La copia costa tempo e memoria proporzionali a `len`, ma elimina l'obbligo di mantenere vivo il buffer **dopo** il ritorno. Non elimina quello di renderlo leggibile **durante** la copia. L'esempio usa memoria Rust per verificare il contratto senza dipendere da una libreria C.

## Errori comuni

- **Scrivere “il puntatore deve essere valido” senza dire per cosa.** Specifica tipo, numero di elementi o byte, durata, accessi concorrenti ammessi e comportamento a lunghezza zero.
- **Usare `unsafe` per evitare la gestione degli errori.** Un indice sconosciuto si controlla; un `debug_assert!` che può sparire in release non basta a rendere safe un wrapper.
- **Confondere ABI e sicurezza.** `extern "C"` descrive come avviene la chiamata, non dimostra che un buffer sia valido. Per una funzione importata, le precondizioni vanno ricavate dal contratto della libreria.
- **Testare violando deliberatamente `# Safety`.** Un panic non è garantito. Esegui il percorso unsafe solo con input validi; verifica gli input da rifiutare attraverso l'API safe.

## Checklist

1. Quale condizione aggiuntiva non è già garantita dai tipi e chi può conoscerla?
2. La sezione `# Safety` basta al chiamante per decidere se l'operazione è lecita, inclusi i casi vuoti e i limiti?
3. Ogni commento `SAFETY:` spiega perché la condizione è vera **in quel punto**, invece di ripetere che la chiamata è unsafe?
4. Se restituisco un riferimento, che cosa ne vincola la durata? Un valore posseduto o un ingresso già preso in prestito eliminerebbero l'obbligo?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]

## Fonti

- [Rust Reference: unsafe functions](https://doc.rust-lang.org/reference/unsafe-keyword.html#unsafe-functions-unsafe-fn)
- [Edition Guide: unsafe operations in unsafe functions](https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-op-in-unsafe-fn.html)
- [Standard library: slice::get_unchecked](https://doc.rust-lang.org/std/primitive.slice.html#method.get_unchecked)
- [Standard library: contratto di slice::from_raw_parts](https://doc.rust-lang.org/std/slice/fn.from_raw_parts.html)
- [Rustonomicon: unbounded lifetimes](https://doc.rust-lang.org/nomicon/unbounded-lifetimes.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
