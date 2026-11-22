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
  - unsafe Rust
  - Unsafe code Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
related:
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
title: Unsafe Rust
---

# Unsafe Rust

## Sintesi

`unsafe` non disattiva il borrow checker. Segnala che **qualcuno deve garantire una condizione che il tipo non esprime**. Una firma `unsafe fn` assegna un obbligo a chi chiama; un blocco `unsafe { ... }` indica il punto in cui chi scrive il codice si assume la responsabilità di averlo soddisfatto. Nessuna delle due forme introduce un controllo a runtime.

## Quando usarlo

Prima cerca un'API safe. Per leggere un intero già disponibile come `&i32` basta `*r`; per dividere una slice mutabile basta `split_at_mut`. Ha senso scendere a un raw pointer, per esempio, al confine con una libreria C che non può restituire un riferimento con lifetime Rust. Anche lì il fatto che un puntatore **non sia nullo** non dimostra che sia ancora leggibile.

## Come funziona

In questo esempio ci sono due responsabilità diverse. Il contratto sotto `# Safety` dice **cosa deve essere vero** per qualsiasi chiamante. Il commento `SAFETY:` nel `main` spiega **perché è vero qui**.

```rust
#![deny(unsafe_op_in_unsafe_fn)]

/// Legge una copia dell'intero puntato.
///
/// # Safety
/// Per tutta la lettura, ptr deve essere allineato e valido per
/// leggere un i32 inizializzato, senza violare aliasing o data race.
unsafe fn read_unchecked(ptr: *const i32) -> i32 {
    // SAFETY: sono esattamente le precondizioni richieste al chiamante.
    unsafe { *ptr }
}

fn main() {
    let value = 42;
    let ptr = std::ptr::from_ref(&value); // Creare il puntatore è safe.
    // SAFETY: ptr deriva da value, ancora vivo, allineato e non modificato.
    let copy = unsafe { read_unchecked(ptr) };
    assert_eq!(copy, value);
}
```

Il puntatore non tiene in vita `value`. La lettura restituisce un `i32` per copia, non un riferimento con una durata da giustificare. Nell'**edition 2024**, un'operazione unsafe nel corpo di una `unsafe fn` senza blocco esplicito genera **un warning di default**. L'attributo `deny` dell'esempio lo trasforma in errore: togliendo il blocco attorno a `*ptr` si vede la distinzione fra contratto della firma e responsabilità del corpo.

## API / Sintassi

| Forma | Chi si assume quale responsabilità |
| --- | --- |
| `unsafe { ... }` | Chi scrive il blocco giustifica, per esempio, una dereferenziazione di raw pointer, una chiamata a funzione unsafe, la lettura di un campo di union o la lettura/scrittura del valore di una `static mut`. Il normale codice al suo interno resta soggetto alle regole di Rust. |
| `unsafe fn` | L'autore documenta le precondizioni; ogni chiamante deve rispettarle. Una funzione safe può invece contenere un blocco unsafe se non scarica precondizioni di sicurezza non verificate su chi la usa. |
| `unsafe trait` e `unsafe impl` | Il trait dichiara un contratto per gli implementatori; l'impl afferma che il tipo lo soddisfa. `unsafe impl` qualifica una **dichiarazione**, non richiede di avvolgerla in un blocco unsafe. Usare il trait non rende automaticamente unsafe ogni chiamata ai suoi metodi. |

Questi non sono tutti gli usi della parola chiave. Per esempio, in edition 2024 un blocco di dichiarazioni esterne si scrive `unsafe extern "C" { ... }`: chi **dichiara** le firme deve farle corrispondere alla libreria. È una responsabilità distinta dalle precondizioni per **chiamare** ciascuna funzione. Vedi [[Programmazione/Rust/Pagine/FFI|FFI]].

## Esempio pratico

### Dividere una slice nel codice applicativo

Due prestiti mutabili sono ammessi se non danno accesso agli stessi elementi. `split_at_mut(mid)` fornisce questa garanzia e va in panic se `mid > len`. Quando l'indice viene dall'esterno e vuoi gestire l'errore, `split_at_mut_checked` restituisce invece `None`. In nessuno dei due casi il chiamante scrive `unsafe`.

```rust
fn main() {
    let mut data = [10, 20, 30];
    if let Some((left, right)) = data.split_at_mut_checked(1) {
        left[0] += 1;
        right[0] += 2;
    }
    assert_eq!(data, [11, 22, 30]);
    assert!(data.split_at_mut_checked(4).is_none());
}
```

### Perché un wrapper può avere una firma safe

Questa versione didattica ha lo stesso comportamento di confine di `split_at_mut`. Nel codice applicativo preferisci il metodo standard: qui interessa la giustificazione del blocco, non un'ottimizzazione.

```rust
fn split_at_mut_safe<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    let len = slice.len();
    assert!(mid <= len);
    let ptr = slice.as_mut_ptr();

    // SAFETY: ptr viene dall'unico prestito della slice. Gli intervalli
    // 0..mid e mid..len sono validi, inizializzati e disgiunti.
    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut data = [1, 2, 3];
    let (left, right) = split_at_mut_safe(&mut data, 1);
    left[0] = 10;
    right[0] = 20;
    assert_eq!(data, [10, 20, 3]);

    assert!(split_at_mut_safe(&mut data, 0).0.is_empty());
    assert!(split_at_mut_safe(&mut data, 3).1.is_empty());
    let mut empty: [i32; 0] = [];
    let (a, b) = split_at_mut_safe(&mut empty, 0);
    assert!(a.is_empty() && b.is_empty());
}
```

1. **Origine e durata:** `ptr` proviene da una slice valida, quindi ha l'allineamento e la non nullità richiesti anche per una slice vuota. Le slice restituite prendono in prestito l'input: non possono vivere più a lungo e il chiamante non può riusare l'originale mentre le usa.
2. **Confini:** `mid <= len` è controllato **prima** dell'aritmetica e vale anche in release. Con `mid == len` l'inizio della seconda parte può trovarsi subito dopo l'ultimo elemento: la lunghezza è zero e non viene letto alcun elemento da quella posizione.
3. **Esclusività:** la prima slice comprende gli indici prima di `mid`, la seconda quelli da `mid` in poi. Nessun elemento è accessibile tramite entrambe. La prova riguarda gli intervalli, non il semplice confronto fra due indirizzi.

## Errori comuni

- **Controllare una precondizione essenziale solo con `debug_assert!`.** Può sparire nella build release. Usa un controllo effettivo oppure un tipo che renda impossibile l'input non valido.
- **Confondere panic e comportamento indefinito.** Un indice fuori intervallo nel wrapper provoca un panic prima del blocco: è un esito definito. Violare il contratto di un'operazione unsafe, invece, non garantisce né un panic né un errore rilevabile.
- **Considerare i test una prova di soundness.** Una funzione safe deve restare sicura per *ogni* chiamata ammessa dalla firma. I test e [[Programmazione/Rust/Pagine/Miri|Miri]] aiutano a trovare errori nei percorsi eseguiti; non sostituiscono il ragionamento sugli invarianti.

## Checklist

- Posso ottenere lo stesso risultato con riferimenti, slice o un metodo safe della libreria standard?
- Per ogni operazione unsafe, so indicare **quale contratto** sto usando e **quale fatto** lo rende vero qui?
- La giustificazione copre durata, esclusività, input vuoti, estremi e build release?
- Chi usa la mia API può violare una precondizione di sicurezza scrivendo soltanto codice safe? In tal caso, il wrapper non è ancora sicuro.

## Collegamenti

- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Unsafe functions|Unsafe functions]]
- [[Programmazione/Rust/Pagine/Unsafe traits|Unsafe traits]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]

## Fonti

- [Rust Reference: la parola chiave unsafe](https://doc.rust-lang.org/reference/unsafe-keyword.html)
- [Edition Guide: unsafe operations in unsafe functions](https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-op-in-unsafe-fn.html)
- [Standard library: requisiti di from_raw_parts_mut](https://doc.rust-lang.org/std/slice/fn.from_raw_parts_mut.html)
- [Standard library: split_at_mut_checked](https://doc.rust-lang.org/std/primitive.slice.html#method.split_at_mut_checked)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
