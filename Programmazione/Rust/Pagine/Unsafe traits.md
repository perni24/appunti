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
  - unsafe trait
  - Unsafe traits Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Unsafe functions]]"
related:
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
  - "[[Programmazione/Rust/Pagine/Invariants]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
title: Unsafe traits
---

# Unsafe traits

## Sintesi

In `unsafe trait`, **unsafe qualifica l'implementazione, non ogni chiamata**. Chi definisce il trait scrive una garanzia di sicurezza sotto `# Safety`; chi scrive `unsafe impl` afferma che il proprio tipo la rispetta. Il codice generico può usare quella garanzia per giustificare un'operazione unsafe, anche se offre ai propri chiamanti una funzione safe.

## Quando usarlo

La domanda utile è: **quale operazione diventerebbe non sicura se un'implementazione mentisse?** Se la risposta è soltanto «il risultato sarebbe sbagliato» o «il programma andrebbe in panic», di norma basta un trait ordinario. Se l'invariante si può esprimere con un tipo o verificare prima dell'operazione, preferisci quella strada.

## Come funziona

### Una promessa che il consumatore può usare

Supponiamo che un formato abbia sempre un byte iniziale che identifica il tipo di messaggio. Il contratto minimo per leggerlo senza controllare l'indice è che **la slice restituita da ogni chiamata a `bytes()` contenga almeno un elemento**.

```rust
/// Vista di un messaggio che ha sempre un primo byte.
///
/// # Safety
/// Per ogni valore del tipo, ogni chiamata a bytes() deve
/// restituire una slice non vuota.
unsafe trait NonEmptyBytes {
    fn bytes(&self) -> &[u8];
}

struct Header([u8; 4]);

// SAFETY: bytes() restituisce l'intero array di quattro byte.
// Nessun valore di Header può avere un array di lunghezza zero.
unsafe impl NonEmptyBytes for Header {
    fn bytes(&self) -> &[u8] {
        &self.0
    }
}

fn first_byte<T: NonEmptyBytes + ?Sized>(value: &T) -> u8 {
    let bytes = value.bytes();
    // SAFETY: questa stessa slice è non vuota per contratto.
    unsafe { *bytes.get_unchecked(0) }
}

fn main() {
    let header = Header([7, 10, 20, 30]);
    assert_eq!(header.bytes().len(), 4);
    assert_eq!(first_byte(&header), 7);
}
```

Leggi l'esempio in tre passaggi:

1. **Il trait** promette solo che la slice non è vuota. Non promette che sia lunga quattro né che il contenuto resti uguale tra chiamate.
2. **L'implementazione** soddisfa la promessa per costruzione: persino `Header([0; 4])` ha quattro elementi. I valori dei byte non contano.
3. **Il consumatore** usa soltanto l'indice zero della slice appena ricevuta. Può chiamare `bytes()` senza blocco unsafe perché il metodo è safe; il blocco serve per `get_unchecked`. A chi chiama `first_byte` non resta alcuna precondizione da verificare.

Questo esempio mostra *dove* si usa la promessa, non un vantaggio prestazionale misurato. Se devi leggere solo `Header`, accedi al suo array. Se invece un messaggio può essere vuoto, la soluzione generica safe è più semplice:

```rust
fn first_byte(bytes: &[u8]) -> Option<u8> {
    bytes.first().copied()
}

fn main() {
    assert_eq!(first_byte(&[7, 10]), Some(7));
    assert_eq!(first_byte(&[]), None);
}
```

## API / Sintassi

| Dove compare `unsafe` | Chi deve garantire cosa |
| --- | --- |
| `unsafe trait` e `unsafe impl` | L'autore del trait descrive l'invariante; chi implementa lo giustifica per **tutti** i valori e gli stati raggiungibili tramite l'API safe. |
| `unsafe fn` in un trait ordinario | È il **chiamante** del metodo a dover rispettare precondizioni aggiuntive. Per il solo fatto che il metodo è unsafe, l'implementazione del trait non diventa `unsafe impl`. |
| Metodo `unsafe fn` in un `unsafe trait` | I due obblighi si sommano: l'implementatore risponde del contratto del trait; il chiamante risponde delle precondizioni del metodo. |

**Una lunghezza esatta non è sempre una garanzia di sicurezza.** `ExactSizeIterator` è un trait safe: richiede una lunghezza corretta, ma il codice unsafe non può fondare la sicurezza della memoria soltanto su quel numero. `std::iter::TrustedLen` è un trait unsafe distinto, con un contratto sul valore restituito da `size_hint()`. Nessuno dei due certifica da solo che un buffer esterno contenga un certo numero di elementi inizializzati.

## Esempio pratico

### Send e Sync: prima lascia decidere al compilatore

`Send` dice che si può **trasferire un valore** fra thread. `Sync` dice che si può **trasferire un riferimento condiviso**: `T: Sync` equivale a `&T: Send`. Sono *auto trait*: Rust normalmente determina se un tipo composto li implementa in base ai campi. Un trait personalizzato non diventa automatico solo perché è dichiarato `unsafe`.

```rust
use std::cell::Cell;
use std::thread;

struct Owned<T>(Box<T>);

impl<T> Owned<T> {
    fn into_inner(self) -> T { *self.0 }
}

fn needs_send<T: Send>() {}
fn needs_sync<T: Sync>() {}

fn main() {
    needs_send::<Owned<Cell<u32>>>();
    needs_sync::<Owned<u32>>();

    let owned = Owned(Box::new(Cell::new(40_u32)));
    let worker = thread::spawn(move || {
        let cell = owned.into_inner();
        cell.set(cell.get() + 2);
        cell.get()
    });
    assert_eq!(worker.join().unwrap(), 42);
}
```

Il thread riceve **la proprietà** della cella, non un `&Cell<u32>` condiviso. Perciò `Owned<Cell<u32>>` è `Send` ma non `Sync`. Non occorre un'implementazione manuale e non è stato aggiunto alcun lock.

Sostituire `Box<T>` con un `*mut T` cambia il ragionamento: il puntatore non dice chi possiede l'allocazione né chi può ancora accedervi. Il solo bound `T: Send` non giustifica un `unsafe impl Send` per un wrapper arbitrario. Prima servono risposte su costruzione, alias, sincronizzazione e distruzione: per esempio, la risorsa può essere rilasciata su un thread diverso da quello che l'ha creata? Un'asserzione `needs_send` controlla che il compilatore *veda* l'impl, non che un'impl scritta a mano sia corretta.

## Errori comuni

- **Scrivere un contratto circolare:** «è sicuro perché implementa il trait» non giustifica l'impl. Indica quale proprietà della rappresentazione o quale controllo mantiene l'invariante.
- **Garantire la proprietà solo nel costruttore:** se aggiungi un metodo safe che può svuotare il buffer, devi riesaminare ogni impl che promette una vista non vuota.
- **Fidarsi più del necessario:** il consumatore generico deve reggere per qualunque impl conforme, non soltanto per quella che oggi restituisce quattro byte.
- **Usare `unsafe impl Send` o `Sync` per far compilare `spawn`:** prima distingui se stai trasferendo un valore o condividendo riferimenti. Poi controlla se il tipo rappresenta davvero quella scelta.

## Checklist

1. Posso indicare il punto esatto in cui il consumatore usa l'invariante per la sicurezza?
2. Il contratto specifica cosa vale per ogni chiamata, senza lasciare presupposti nascosti?
3. Costruttori, metodi safe e distruzione del tipo preservano la promessa?
4. Se il trait è pubblico, un implementatore esterno ha abbastanza informazioni per giustificare la propria impl? Se non serve estensibilità, basta un tipo concreto o un trait privato?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Unsafe functions|Unsafe functions]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]

## Fonti

- [Rust Reference: la parola chiave unsafe nei trait e nelle implementazioni](https://doc.rust-lang.org/reference/unsafe-keyword.html)
- [Standard library: ExactSizeIterator](https://doc.rust-lang.org/std/iter/trait.ExactSizeIterator.html) e [TrustedLen](https://doc.rust-lang.org/std/iter/trait.TrustedLen.html)
- [Rustonomicon: Send and Sync](https://doc.rust-lang.org/nomicon/send-and-sync.html)
- [Standard library: Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
