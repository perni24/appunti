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
  - Allocator Rust
  - Global allocator
prerequisites:
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
title: Allocator
---

# Allocator

## Sintesi

Un allocatore fornisce e recupera **blocchi di memoria**. Non costruisce un valore Rust in quei byte e non ne esegue il distruttore quando li libera. Di solito è il proprietario, per esempio `Box<T>`, a coordinare queste operazioni. In un `Vec<T>` la distinzione è visibile: la *capacità* indica lo spazio disponibile, la *lunghezza* conta soltanto gli elementi inizializzati.

## Quando usarlo

| Esigenza | Prima scelta |
| --- | --- |
| Possedere un valore o una sequenza che può crescere | Usa `Box`, `Vec` o `String`. Non occorre scegliere o chiamare direttamente un allocatore. |
| Evitare crescite ripetute di un buffer o segnalare una prenotazione fallita | Intervieni sul contenitore con `with_capacity` o `try_reserve`; non cambiare l'allocatore di tutto il programma. |
| Configurare l'heap di un firmware o confrontare due allocatori su un carico reale | Scegli l'allocatore a livello di applicazione. Misura latenza, picco di memoria e frammentazione sul target interessato. |
| Implementare un contenitore o integrare un'API nativa che trasferisce memoria | Stabilisci layout, proprietario, inizializzazione e funzione di rilascio prima di usare puntatori grezzi. |

## Come funziona

### L'allocatore globale non decide la lunghezza di Vec

`#[global_allocator]` seleziona l'implementazione globale per il programma Rust; può comparire una sola volta nell'insieme delle crate collegate. Qui scegliamo esplicitamente `System`. Senza l'attributo il normale codice con `std` funziona comunque: non basare un'interfaccia sulla supposizione che l'allocatore predefinito sia sempre `System`.

```rust
use std::alloc::System;
use std::collections::TryReserveError;

#[global_allocator]
static GLOBAL: System = System;

fn main() -> Result<(), TryReserveError> {
    let mut bytes = Vec::<u8>::new();
    bytes.try_reserve(1024)?;
    assert!(bytes.capacity() >= 1024);
    assert!(bytes.is_empty());

    bytes.extend_from_slice(&[10, 20]);
    let capacity = bytes.capacity();
    bytes.clear();
    assert!(bytes.is_empty());
    assert_eq!(bytes.capacity(), capacity);
    Ok(())
}
```

`try_reserve(n)` chiede spazio per almeno **altri** `n` elementi rispetto alla lunghezza. Non inizializza quegli elementi e non promette una capacità esatta. `clear()` rimuove gli elementi e conserva il buffer per riutilizzarlo; quando il vettore viene distrutto, rilascia anche il suo eventuale buffer. La gestione fallibile riguarda questa prenotazione, non ogni altra allocazione del programma.

## API / Sintassi

### Layout: quanti byte e a quale allineamento?

`Layout::new::<T>()` descrive un valore; `Layout::array::<T>(n)` verifica che lo spazio per `n` elementi sia rappresentabile. Calcolare un layout **non alloca** memoria. Per un layout costruito a mano, la dimensione richiesta non deve necessariamente essere già un multiplo dell'allineamento:

```rust
use std::alloc::Layout;
use std::mem::{align_of, size_of};

fn main() {
    let words = Layout::array::<u32>(3).unwrap();
    assert_eq!(words.size(), 3 * size_of::<u32>());
    assert_eq!(words.align(), align_of::<u32>());
    assert!(Layout::array::<u32>(usize::MAX).is_err());

    let request = Layout::from_size_align(3, 4).unwrap();
    assert_eq!(request.size(), 3);
    assert_eq!(request.pad_to_align().size(), 4);
    assert!(Layout::from_size_align(8, 3).is_err());
}
```

L'allineamento deve essere una potenza di due non nulla; la dimensione, arrotondata all'allineamento, non può superare `isize::MAX`. Un layout di dimensione zero è valido, ma **non va passato a `std::alloc::alloc`**: questa funzione usa il contratto di `GlobalAlloc`, che richiede una richiesta non vuota.

## Esempio pratico

### Dal blocco grezzo a un unico proprietario

Nell'applicazione normale basta `Box::new(value)`. La funzione seguente ne esplicita i passaggi per mostrare dove cambiano le responsabilità. Se l'allocatore segnala il fallimento restituendo un puntatore nullo, il chiamante recupera il valore originale in `Err`.

```rust
use std::alloc::{alloc, Layout};
use std::ptr::NonNull;

fn try_box_value<T>(value: T) -> Result<Box<T>, T> {
    let layout = Layout::new::<T>();
    if layout.size() == 0 {
        return Ok(Box::new(value));
    }

    // SAFETY: il layout di T è valido e ha dimensione non nulla.
    let raw = unsafe { alloc(layout) };
    let Some(slot) = NonNull::new(raw.cast::<T>()) else {
        return Err(value);
    };

    // SAFETY: blocco esclusivo dell'allocatore globale, con il layout di T.
    // write inizializza T; solo dopo from_raw trasferisce la proprietà al Box.
    unsafe {
        slot.as_ptr().write(value);
        Ok(Box::from_raw(slot.as_ptr()))
    }
}

fn main() {
    let text = try_box_value(String::from("ciao")).unwrap();
    assert_eq!(text.as_str(), "ciao");
    assert_eq!(*try_box_value(()).unwrap(), ());
}
```

Prima di `write` esiste lo spazio per un `T`, non un `T` da leggere o distruggere. Dopo `Box::from_raw`, il box è l'unico proprietario: al suo rilascio distrugge il valore e restituisce il blocco all'allocatore globale. Non chiamare anche `dealloc`. Per `String`, il blocco appena allocato contiene il valore `String`, **non** una copia dei caratteri: il buffer già posseduto viene trasferito insieme al valore.

Per un tipo di dimensione zero, `Box::new` gestisce proprietà e allineamento senza richiedere un blocco. Anche un tipo di dimensione zero può avere un distruttore. Il ramo `Err` copre un **fallimento segnalato**: non promette il recupero se l'allocatore scelto termina il processo.

### Se il blocco resta sotto gestione manuale

`dealloc(ptr, layout)` rilascia soltanto il blocco: richiede il puntatore iniziale di un'allocazione ancora viva e il layout usato per richiederla. Se il blocco contiene ancora valori inizializzati con risorse, bisogna prima distruggerli, per esempio con `drop_in_place`; se sono già stati spostati altrove non vanno distrutti di nuovo. In un buffer parzialmente inizializzato il conteggio utile è quello dei **valori vivi**, non la capacità. È uno dei motivi per preferire un proprietario Rust che gestisca anche i ritorni anticipati.

## Varianti e limiti

- **`System` o `GlobalAlloc` personalizzato.** `System` usa l'allocatore di sistema. Implementare il trait unsafe `GlobalAlloc` significa rispettare anche le richieste di allineamento, le chiamate concorrenti e il divieto di far propagare un panic con unwinding dai suoi metodi. Evita di fare logging che alloca dentro `alloc`: può richiamare lo stesso allocatore.
- **Arena, bump e pool.** Un bump allocator fa avanzare un cursore; un'arena può recuperare spazio in blocco quando termina una fase. Un pool riutilizza slot adatti a una classe di oggetti. Verifica separatamente quando si libera lo spazio e quando vengono eseguiti i distruttori: non sono la stessa operazione.
- **`no_std`.** `core` non richiede un heap. Per usare contenitori di `alloc` che richiedono memoria dinamica, il binario finale deve disporre di un allocatore adatto al target e di memoria disponibile. Una libreria riutilizzabile non dovrebbe imporre da sola la scelta globale.

## Errori comuni

- **Usare un puntatore senza aver controllato l'esito di `alloc`.** Sul ramo nullo non esiste alcun blocco da inizializzare o liberare.
- **Scambiare allocatori o layout.** Il fatto che due API usino l'heap di sistema non autorizza a passare un puntatore Rust a `free` o a costruire un `Box` sopra memoria di provenienza sconosciuta. Segui la funzione di rilascio prevista dall'API.
- **Usare il numero di allocazioni come condizione di correttezza.** Il compilatore può eliminare o trasformare allocazioni non osservabili. Un contatore può aiutare nel profiling di una build specifica, non dimostrare che il programma eseguirà sempre una certa chiamata.

## Checklist

- È sufficiente prenotare spazio nel contenitore esistente?
- Per ogni blocco conosco origine, dimensione e allineamento, anche nel caso zero?
- Chi possiede i valori su successo, fallimento e ritorno anticipato?
- I test distinguono distruzione del valore, rilascio dello spazio e prestazioni? Miri può aiutare per i percorsi unsafe eseguiti, ma non sostituisce una misura sul target reale.

## Collegamenti

- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/Box T|Box T]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]

## Fonti

- [Standard library: GlobalAlloc e contratto di sicurezza](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html), [System](https://doc.rust-lang.org/std/alloc/struct.System.html) e [Layout](https://doc.rust-lang.org/std/alloc/struct.Layout.html).
- [Standard library: alloc](https://doc.rust-lang.org/std/alloc/fn.alloc.html), [dealloc](https://doc.rust-lang.org/std/alloc/fn.dealloc.html) e [layout e proprietà di Box](https://doc.rust-lang.org/std/boxed/index.html#memory-layout).
- [Standard library: Vec::try_reserve](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.try_reserve) e [Vec::clear](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.clear).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
