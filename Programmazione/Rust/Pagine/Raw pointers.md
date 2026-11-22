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
  - Raw pointer
  - "*const T"
  - "*mut T"
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/FFI]]"
title: Raw pointers
---

# Raw pointers

## Sintesi

Un raw pointer identifica una posizione in memoria, ma il suo tipo non dice **chi mantiene vivo il dato** né **per quanto tempo puoi accedervi**. `*const T` consente di esprimere una lettura; `*mut T` anche una scrittura. Nessuno dei due dimostra che l'accesso sia valido. Copiare il puntatore non copia il valore e non ne acquisisce la proprietà.

## Quando usarlo

- **Nel normale codice Rust** preferisci `&T`, `&mut T` o una slice. Se il valore può mancare, usa `Option<&T>`: il compilatore continua a controllare il prestito.
- **Al confine con C o con il sistema operativo** puoi dover fornire un indirizzo, una lunghezza o un puntatore nullo. Controlla il contratto della singola API: può scrivere nel buffer? Trattiene il puntatore dopo la chiamata?
- **In strutture dati e allocatori a basso livello** un raw pointer permette di rappresentare posizioni senza creare subito riferimenti. L'implementazione deve però mantenere gli invarianti che un riferimento avrebbe espresso nel tipo.

## Come funziona

### Ottenere un puntatore non significa accedere al dato

```rust
fn main() {
    let mut value = 10_i32;
    let reader: *const i32 = std::ptr::from_ref(&value);
    // SAFETY: value è vivo, inizializzato e allineato; nessuno lo modifica.
    let before = unsafe { *reader };

    let writer: *mut i32 = std::ptr::from_mut(&mut value);
    // SAFETY: il puntatore deriva dall'accesso esclusivo a value;
    // durante questa operazione non usiamo altri percorsi per accedervi.
    unsafe { *writer += 1 };
    assert_eq!((before, value), (10, 11));
}
```

I due accessi avvengono **in sequenza**: dopo la creazione di `writer` non riutilizziamo `reader`. Né creare i puntatori da riferimenti validi né controllare `p.is_null()` richiede `unsafe`. Leggere con `*p`, scrivere con `*p = value` o formare un riferimento con `&*p` richiede invece che chi usa il puntatore giustifichi l'operazione. Creare quel riferimento impone le regole di un riferimento **fin dall'inizio**, non solo quando viene letto.

Il compilatore accetta il cast `reader.cast_mut()` senza un blocco unsafe: cambia il tipo del puntatore, **non** i permessi derivati da `&value`. Se devi modificare un normale `i32`, parti da un accesso esclusivo come nell'esempio.

## API / Sintassi

### Spostarsi di elementi: `add` non verifica l'indice

`p.add(i)` avanza di **`i` elementi di tipo `T`**, non di `i` byte. Per uno spostamento non nullo in byte, sia il punto di partenza sia l'intervallo percorso devono appartenere alla stessa allocazione, con il limite finale ammesso, e lo scostamento deve rientrare in `isize`. Il metodo è unsafe **anche se il risultato non viene letto**. `wrapping_add` consente di calcolare un puntatore senza quel vincolo immediato, ma non rende leggibile il risultato.

```rust
fn copied_at<T: Copy>(slice: &[T], index: usize) -> Option<T> {
    if index >= slice.len() {
        return None;
    }
    // SAFETY: l'indice è strettamente interno alla slice presa in prestito.
    // Il puntatore è allineato e l'elemento inizializzato può essere copiato.
    Some(unsafe { *slice.as_ptr().add(index) })
}

fn main() {
    let values = [10_u32, 20, 30];
    assert_eq!(copied_at(&values, 1), Some(20));
    assert_eq!(copied_at(&values, values.len()), None);
    assert_eq!(copied_at::<u32>(&[], 0), None);
    assert_eq!(copied_at(&values, usize::MAX), None);
}
```

Questa è una dimostrazione: in produzione basta **`slice.get(index).copied()`**. Il controllo usa `>=`, non `>`: per un array non vuoto di `u32` puoi calcolare il puntatore subito **dopo** l'ultimo elemento, ma in quella posizione non esiste un altro `u32` da leggere.

## Esempio pratico

### Rappresentare il caso vuoto al confine FFI

Supponi che un'API esterna richieda espressamente un puntatore nullo quando il buffer è vuoto. Non puoi dedurlo da `slice.as_ptr().is_null()`: anche una slice vuota ha un puntatore non nullo, senza che questo implichi l'esistenza di un primo elemento. Decidi in base alla **lunghezza**, oppure delega la decisione a `first()`:

```rust
fn first_or_null<T>(slice: &[T]) -> *const T {
    slice.first().map_or(std::ptr::null(), std::ptr::from_ref)
}

fn main() {
    let values = [10, 20];
    assert_eq!(first_or_null(&values), values.as_ptr());

    let empty: &[i32] = &values[..0];
    assert!(empty.first().is_none());
    assert!(!empty.as_ptr().is_null());
    assert!(first_or_null(empty).is_null());
}
```

Qui **non serve unsafe**: traduciamo una convenzione e non leggiamo dal puntatore. Non tutte le API C richiedono `null` per lunghezza zero. Per un buffer completo devi passare anche la lunghezza prevista dal contratto, nelle unità richieste; il puntatore da solo non la trasporta. Il risultato di `first_or_null` non tiene in vita `values`: se il destinatario vuole conservarlo, occorre un accordo esplicito su durata e proprietà.

### Un campo non allineato: evitare il riferimento intermedio

In una struttura `packed`, un campo `u32` può trovarsi a un indirizzo non allineato per `u32`. `&raw const` prende l'indirizzo del campo **senza creare un `&u32`**. `read_unaligned` esegue poi la lettura senza richiedere l'allineamento naturale:

```rust
#[repr(C, packed)]
struct Header {
    tag: u8,
    count: u32,
}

fn main() {
    let header = Header { tag: 1, count: 300 };
    let field = &raw const header.count;
    // SAFETY: il campo è un u32 inizializzato di header, ancora vivo.
    // read_unaligned non richiede l'allineamento e u32 è Copy.
    let count = unsafe { field.read_unaligned() };
    assert_eq!(count, 300);
}
```

Non sostituire `&raw const` con un cast da `&header.count`: quel passaggio tenterebbe già di formare un riferimento non validamente allineato. `&raw mut` è la forma mutabile; nel codice meno recente puoi trovare le macro `addr_of!` e `addr_of_mut!`. L'esempio legge un campo Rust già inizializzato: per interpretare **byte di un protocollo** con ordine noto preferisci, per esempio, `u32::from_le_bytes` su quattro byte.

## Errori comuni

- **Scambiare non nullo per valido.** `NonNull<T>` esclude l'indirizzo nullo, non dimostra che il dato sia vivo, inizializzato o accessibile. Un indirizzo numericamente plausibile non prova da quale allocazione provenga il puntatore (*provenance*).
- **Riutilizzare il puntatore dopo una riallocazione.** Se un `Vec` cresce, il suo buffer può spostarsi. Conserva un indice se è quello che ti serve e ottieni un nuovo puntatore dal vettore dopo la modifica; se devi ritrovare lo stesso elemento, considera anche eventuali inserimenti o rimozioni.
- **Confondere allineamento, validità e proprietà.** `read_unaligned` elimina solo il requisito di allineamento. Il dato deve comunque essere leggibile e valido per `T`; con un tipo non `Copy`, una copia dei bit non crea un secondo proprietario legittimo.

## Checklist

1. Per questa operazione, da quale oggetto o allocazione proviene il puntatore? È ancora vivo e non riallocato?
2. Ho un elemento intero nell'intervallo, non soltanto un indirizzo non nullo o il limite finale?
3. Il valore è inizializzato e valido per la lettura? L'indirizzo soddisfa l'allineamento richiesto **dall'operazione scelta**?
4. L'origine permette questa lettura o scrittura? Ci sono riferimenti o accessi concorrenti in conflitto?
5. Posso lasciare il puntatore al solo confine FFI e restituire al chiamante Rust una slice o un `Option<&T>`?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]

## Fonti

- [Standard library: requisiti per l'accesso e provenance](https://doc.rust-lang.org/std/ptr/index.html#safety)
- [Standard library: contratto di add](https://doc.rust-lang.org/std/primitive.pointer.html#method.add)
- [Standard library: slice::as_ptr](https://doc.rust-lang.org/std/primitive.slice.html#method.as_ptr)
- [Standard library: read_unaligned e campi packed](https://doc.rust-lang.org/std/ptr/fn.read_unaligned.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
