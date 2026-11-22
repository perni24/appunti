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
  - Safe unsafe abstractions
  - Astrazioni unsafe sicure
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Invariants]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
related:
  - "[[Programmazione/Rust/Pagine/Miri]]"
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
title: Unsafe abstractions sicure
---

# Unsafe abstractions sicure

## Sintesi

Una funzione safe può usare `unsafe` internamente. La promessa al chiamante è precisa: **nessuna sequenza di operazioni ammesse dall'API safe deve poter causare comportamento indefinito**. Può ancora restituire un errore, andare in panic o dare un risultato logicamente sbagliato: sono questioni diverse dalla *soundness*, cioè dal rispetto di quella promessa.

Il punto non è nascondere `unsafe`. È mostrare, per ogni operazione che lo richiede, **da dove arrivano le sue garanzie**: dal tipo di un parametro, da un controllo effettivo o da un invariante mantenuto dall'intero modulo.

## Quando usarlo

- **Per il normale codice applicativo**, cerca prima un tipo o un metodo safe della libreria standard. Non introdurre un blocco unsafe per un presunto vantaggio prestazionale non misurato.
- **Al confine con una primitiva unsafe o una libreria nativa**, offri una funzione safe se l'implementazione può soddisfare tutte le precondizioni per conto del chiamante.
- **Se una condizione essenziale è nota solo al chiamante**, cambia la firma per ricevere quella garanzia (per esempio una slice al posto di un indirizzo) oppure esponi una `unsafe fn` con una sezione `# Safety`. Un'avvertenza nella documentazione di una funzione safe non basta.

## Come funziona

### Prima scelta: rendere impossibile lo stato non valido

`NonEmptySlice` deve poter restituire un primo elemento anche dopo che il costruttore è terminato. Invece di conservare una slice e ricordare che non è vuota, conserva **il riferimento al primo elemento e la coda**. La coda può essere vuota; il primo elemento non può mancare.

```rust
pub struct NonEmptySlice<'a, T> {
    first: &'a T,
    tail: &'a [T],
}

impl<'a, T> NonEmptySlice<'a, T> {
    pub fn new(slice: &'a [T]) -> Option<Self> {
        let (first, tail) = slice.split_first()?;
        Some(Self { first, tail })
    }

    pub fn first(&self) -> &'a T { self.first }
    pub fn tail(&self) -> &'a [T] { self.tail }
}

fn main() {
    assert!(NonEmptySlice::<u8>::new(&[]).is_none());
    let data = [7, 8, 9];
    let view = NonEmptySlice::new(&data).unwrap();
    assert_eq!(*view.first(), 7);
    assert_eq!(view.tail(), &[8, 9]);
}
```

Qui non c'è alcun codice unsafe da giustificare. Il prestito dei risultati è legato a `data`, non alla durata del contenitore `view`: distruggere la vista non distrugge gli elementi, ma non permette nemmeno di conservarne un riferimento oltre la vita dei dati.

## API / Sintassi

### Seconda scelta: controllare prima di delegare

Considera un'API che divide una slice mutabile e restituisce `None` se il punto di taglio non è valido. **In produzione basta `slice.split_at_mut_checked(mid)`.** La versione didattica qui sotto separa il controllo dalla primitiva che può fidarsene:

```rust
pub fn split_at_mut_checked<T>(
    slice: &mut [T],
    mid: usize,
) -> Option<(&mut [T], &mut [T])> {
    if mid > slice.len() {
        return None;
    }
    // SAFETY: mid <= slice.len() per questa stessa slice, anche in release.
    Some(unsafe { slice.split_at_mut_unchecked(mid) })
}

fn main() {
    let mut data = [1, 2, 3];
    let (left, right) = split_at_mut_checked(&mut data, 1).unwrap();
    left[0] = 10;
    right[0] = 20;
    assert_eq!(data, [10, 20, 3]);
    assert!(split_at_mut_checked(&mut data, 4).is_none());
}
```

| Cosa serve | Chi lo garantisce |
| --- | --- |
| Memoria valida, inizializzata e presa in prestito esclusivamente | L'ingresso è già una `&mut [T]`. La firma lega entrambi i risultati al prestito dell'input. |
| Punto di taglio nell'intervallo `0..=len` | Il ramo di errore precede il blocco unsafe. Un normale `if` vale anche in release; un `debug_assert!` non sarebbe un sostituto. |
| Due slice utilizzabili indipendentemente | Soddisfatta la precondizione, la primitiva restituisce gli intervalli `0..mid` e `mid..len`: non hanno elementi in comune. Non occorre confrontare indirizzi, neppure per tipi di dimensione zero. |

A `mid = 0` la prima parte è vuota; a `mid = len` è vuota la seconda. Per una slice vuota, zero è dunque un taglio **valido**. Se implementassi la stessa operazione direttamente con puntatori e `from_raw_parts_mut`, dovresti giustificare anche i requisiti di **ciascuna** costruzione: la prova completa è in [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]].

## Esempio pratico

### Terza scelta: separare la vista safe dall'indirizzo per FFI

`RawBuffer` possiede i byte. Per i chiamanti Rust espone una slice; per un'interfaccia che richiede indirizzo e lunghezza può esporre anche le parti grezze. Le due firme **non fanno la stessa promessa**.

```rust
pub struct RawBuffer {
    data: Vec<u8>,
}

impl RawBuffer {
    pub fn new(data: Vec<u8>) -> Self { Self { data } }
    pub fn as_slice(&self) -> &[u8] { &self.data }
    pub fn as_ptr_len(&self) -> (*const u8, usize) {
        (self.data.as_ptr(), self.data.len())
    }
    pub fn append(&mut self, bytes: &[u8]) {
        self.data.extend_from_slice(bytes);
    }
}

fn main() {
    let mut buffer = RawBuffer::new(vec![10, 20]);
    let (ptr, len) = buffer.as_ptr_len();
    assert_eq!(ptr, buffer.as_slice().as_ptr());
    assert_eq!(len, 2);

    buffer.append(&[30]); // Può riallocare: non riusiamo ptr.
    assert_eq!(buffer.as_slice(), &[10, 20, 30]);
}
```

- **`as_slice`** restituisce un prestito. Finché lo usi, Rust impedisce operazioni incompatibili come `append` sullo stesso buffer.
- **`as_ptr_len`** restituisce due valori, non un prestito tracciato nel tipo di ritorno. Ottenerli è safe; la lunghezza è il numero di byte inizializzati **in quel momento**, non la capacità del vettore. Per un buffer vuoto conta la lunghezza zero: non presumere che l'indirizzo sia nullo.
- **Se scrivi tu il wrapper della chiamata C**, è quel wrapper a dover verificare il contratto esterno: il destinatario legge quanti byte? Può modificarli? Conserva il puntatore dopo il ritorno? Per una lettura sincrona può bastare un prestito mantenuto durante la chiamata; se la libreria trattiene l'indirizzo, quel prestito da solo non basta. Occorre modellare proprietà, durata e rilascio. L'esempio non invoca una libreria C.

## Errori comuni

- **Controllare solo il blocco unsafe.** Anche un nuovo metodo safe, una conversione o un campo reso pubblico possono invalidare un presupposto usato altrove. Rivedi il modulo che mantiene l'invariante, non soltanto la riga che se ne serve.
- **Confondere `SAFETY:` e `# Safety`.** Il primo commento spiega perché l'operazione interna è lecita qui; la seconda sezione descrive gli obblighi aggiuntivi del chiamante di un'API unsafe. Scrivere l'una al posto dell'altro non sposta la responsabilità.
- **Affidare la sicurezza a una pulizia futura.** Verifica cosa succede se una callback va in panic o una guardia non viene distrutta. In Rust è lecito usare `mem::forget`: perdere una risorsa può essere un difetto accettabile, lasciare che il codice safe acceda a memoria non più valida no.
- **Considerare i test una prova generale.** I casi limite e Miri controllano esecuzioni concrete. La motivazione del blocco deve restare valida anche per input e sequenze di chiamate non testati.

## Checklist

1. Quale metodo safe standard o quale rappresentazione eliminerebbe la necessità di unsafe?
2. Per ogni precondizione rimasta, so indicare il tipo, il controllo o l'invariante che la garantisce?
3. La giustificazione vale a buffer vuoto, ai limiti, su errore e durante l'unwinding?
4. Un metodo safe può invalidare la memoria o i permessi mentre un risultato precedente è ancora utilizzabile?
5. Sto promettendo più di quanto la firma o il contratto della libreria esterna permettano di dimostrare?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Miri|Miri]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]

## Fonti

- [Rustonomicon: confini dell'astrazione e codice unsafe](https://doc.rust-lang.org/nomicon/working-with-unsafe.html)
- [Standard library: split_at_mut_unchecked](https://doc.rust-lang.org/std/primitive.slice.html#method.split_at_mut_unchecked) e [split_at_mut_checked](https://doc.rust-lang.org/std/primitive.slice.html#method.split_at_mut_checked)
- [Standard library: Vec::as_ptr](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.as_ptr) e [mem::forget](https://doc.rust-lang.org/std/mem/fn.forget.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
