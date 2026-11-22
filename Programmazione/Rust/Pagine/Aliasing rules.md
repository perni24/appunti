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
  - Aliasing
  - Regole di aliasing
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/Miri]]"
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
title: Aliasing rules
---

# Aliasing rules

## Sintesi

Due percorsi di accesso sono *alias* se possono riferirsi alla stessa memoria. **Avere lo stesso indirizzo non è, di per sé, un errore:** due riferimenti condivisi possono leggere lo stesso intero. La domanda utile è: *a quali elementi si accede, tramite quale prestito, e per quanto tempo quei permessi devono coesistere?*

La regola pratica per un valore ordinario è: più lettori condivisi, oppure accesso esclusivo tramite un prestito mutabile e i prestiti che ne derivano. La Rust Reference precisa che il modello esatto di aliasing non è interamente definito. Le regole qui sotto servono a scegliere operazioni con un contratto documentato, non a dedurre che qualsiasi sequenza accettata dal compilatore sia lecita in codice unsafe.

## Quando usarlo

- Vuoi modificare due elementi della stessa slice e il compilatore non riesce a provarne la separazione.
- Un'interfaccia a basso livello ti restituisce un raw pointer: prima di trasformarlo in un riferimento devi capire chi altro potrebbe usare la memoria.
- Vuoi modificare uno stato attraverso riferimenti condivisi. È un problema diverso dal dividere una collezione in parti disgiunte e non implica necessariamente più thread.

## Come funziona

### Stesso dato, prestiti in momenti diversi

```rust
fn main() {
    let mut value = 10;
    let parent = &mut value;
    let child = &mut *parent; // Prestito temporaneo derivato da parent.
    *child += 2;
    assert_eq!(*child, 12);   // Ultimo uso di child.

    *parent *= 2;             // Ora parent è di nuovo utilizzabile.
    assert_eq!(value, 24);
}
```

`child` non è un secondo permesso esclusivo indipendente. Finché serve ancora, non puoi usare `parent` in conflitto con esso, **nemmeno solo per leggere** lo stesso intero. Dopo l'ultimo uso di `child`, invece, il compilatore può terminare quel prestito anche senza una graffa di chiusura. L'esempio funziona per l'ordine degli accessi, non perché i nomi indicano indirizzi diversi.

### Due puntatori non sono due riferimenti mutabili

```rust
fn main() {
    let mut value = 10_i32;
    let p = std::ptr::from_mut(&mut value);
    let same = p; // Copia il raw pointer, non crea un nuovo &mut.
    assert_eq!(p, same);

    // SAFETY: entrambi derivano dallo stesso prestito di value, vivo,
    // inizializzato e allineato. Le scritture sono sequenziali e non
    // ci sono riferimenti incompatibili in uso.
    unsafe {
        *p += 1;
        *same += 2;
    }

    // SAFETY: da qui usiamo soltanto questo riferimento per accedere
    // al dato fino alla fine del suo prestito.
    let view = unsafe { &mut *same };
    *view += 3;
    assert_eq!(value, 16);
}
```

Copiare o confrontare `p` non accede all'intero. Creare `&mut *same`, invece, introduce gli obblighi del riferimento **già alla sua creazione**: puntatore non nullo e allineato, valore valido, memoria accessibile per la durata del prestito ed esclusività compatibile con `&mut`. Per un `&*p` serve un accesso condiviso valido, non il diritto esclusivo di scrivere. La sola uguaglianza degli indirizzi non dimostra nessuna di queste condizioni.

L'esempio copia **un solo puntatore**. Ottenere invece due puntatori tramite due distinti `&mut value` non dà la stessa giustificazione per riutilizzare il primo: il nuovo prestito esclusivo conta. Anche in un solo thread, dire «le istruzioni avvengono una dopo l'altra» non basta se nel frattempo si è formato un prestito incompatibile.

## API / Sintassi

| Situazione | Scelta pratica |
| --- | --- |
| Stesso elemento, solo letture | Usa più `&T`. Per i dati non racchiusi in `UnsafeCell` non introdurre scritture mentre il prestito condiviso è attivo. |
| Stesso elemento, modifiche successive | Passa un `&mut T` o ricavane un prestito più breve. Riprendi il precedente dopo l'ultimo uso di quello derivato. |
| Parti diverse della stessa slice | Per due intervalli adiacenti usa `split_at_mut`; per i primi elementi usa un pattern di slice; per indici scelti a runtime usa `get_disjoint_mut`. |
| Stesso stato da più riferimenti condivisi | Scegli un contenitore con il contratto adatto: per esempio `RefCell` per prestiti controllati a runtime su un thread, oppure `Mutex` per accesso sincronizzato fra thread. |

## Esempio pratico

### Due elementi della stessa slice

```rust
fn split_two<T>(slice: &mut [T]) -> Option<(&mut T, &mut T)> {
    match slice {
        [first, second, ..] => Some((first, second)),
        _ => None,
    }
}

fn main() {
    let mut values = [10, 20, 30];
    let (a, b) = split_two(&mut values).unwrap();
    *a += 1;
    *b += 2;
    assert_eq!(values, [11, 22, 30]);
    assert!(split_two(&mut values[..1]).is_none());
    assert!(split_two(&mut values[..0]).is_none());

    // Indici dinamici: il risultato segue l'ordine richiesto.
    let [last, first] = values.get_disjoint_mut([2, 0]).unwrap();
    std::mem::swap(last, first);
    assert_eq!(values, [30, 22, 11]);
    assert!(values.get_disjoint_mut([1, 1]).is_err());
    assert!(values.get_disjoint_mut([0, 3]).is_err());
}
```

Nel pattern, le prime due posizioni sono distinte **per costruzione**. Con indici scelti a runtime, `get_disjoint_mut` verifica prima limiti e disgiunzione: un duplicato o un indice fuori intervallo restituisce `Err`, senza restituire prestiti parziali. Confrontare gli indirizzi non sostituisce questo controllo: per un tipo di dimensione zero anche elementi distinti possono avere lo stesso indirizzo.

### Quando il dato deve davvero essere condiviso

```rust
use std::cell::RefCell;

fn main() {
    let count = RefCell::new(10);
    let reader = count.borrow();
    assert_eq!(*reader, 10);
    assert!(count.try_borrow_mut().is_err());
    drop(reader); // Rilascia la guardia e quindi il prestito dinamico.

    *count.try_borrow_mut().unwrap() += 1;
    assert_eq!(*count.borrow(), 11);
}
```

A differenza del semplice reborrow, il controllo qui dipende da una **guardia viva a runtime**: l'ultima lettura del valore non distrugge la guardia. `try_borrow_mut` restituisce un errore finché esiste un lettore; `borrow_mut` nello stesso caso andrebbe in panic. `UnsafeCell` è la primitiva che consente la mutabilità interna: non elimina l'esclusività di `&mut` e non sincronizza i thread. Anche lock e atomiche disciplinano gli accessi previsti dalla loro API, non rendono validi riferimenti incompatibili creati altrove.

## Errori comuni

- **Confrontare solo le variabili o gli indirizzi.** Parti dagli elementi interessati, dall'origine dei prestiti e dagli usi che devono ancora avvenire.
- **Convertire un raw pointer in un riferimento prima di averne verificato il contratto.** Un cast non concede permessi, non prolunga un prestito e non mantiene vivo il buffer di un `Vec` dopo una riallocazione.
- **Confondere aliasing e data race.** Un conflitto fra prestiti può esistere in un solo thread. Fra thread occorre verificare anche la sincronizzazione; la sola assenza di una race non dimostra che i riferimenti siano validi.
- **Trattare Miri come specifica.** Può segnalare violazioni nei percorsi eseguiti secondo il modello adottato. Un test che passa non dimostra che ogni uso dell'API sia corretto.

## Checklist

1. Quali elementi possono essere toccati e quali accessi sono letture o scritture?
2. I prestiti riguardano parti disgiunte, oppure un prestito più breve deriva da quello esistente?
3. Il controllo è statico, oppure dipende dalla distruzione di una guardia a runtime?
4. Prima di creare un riferimento da un puntatore, posso giustificarne durata, validità e permessi per l'intero prestito?

## Collegamenti

- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Miri|Miri]]

## Fonti

- [Rust Reference: comportamento indefinito e aliasing](https://doc.rust-lang.org/reference/behavior-considered-undefined.html)
- [Rustonomicon: aliasing](https://doc.rust-lang.org/nomicon/aliasing.html)
- [Standard library: convertire puntatori in riferimenti](https://doc.rust-lang.org/std/ptr/index.html#pointer-to-reference-conversion)
- [Standard library: get_disjoint_mut](https://doc.rust-lang.org/std/primitive.slice.html#method.get_disjoint_mut), [RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html) e [UnsafeCell](https://doc.rust-lang.org/std/cell/struct.UnsafeCell.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
