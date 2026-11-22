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
  - Memory layout
  - Alignment
prerequisites:
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/FFI]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/Allocator]]"
title: Memory layout e alignment
---

# Memory layout e alignment

## Sintesi

Tre campi da 1, 4 e 2 byte occupano sempre 7 byte di **dati**, ma non necessariamente 7 byte di **memoria**. Il compilatore può lasciare spazi vuoti (*padding*) per collocare ciascun campo a un indirizzo adatto al suo tipo. Il *layout* comprende dimensione, allineamento e posizione dei campi; l'**allineamento** è il multiplo che deve rispettare l'indirizzo di un valore quando lo si usa attraverso un riferimento del suo tipo.

La domanda da porre è: *chi deve conoscere questi byte?* Il codice Rust può usare i nomi dei campi; una funzione C deve conoscere il layout del target; chi legge un file ha invece bisogno di una specifica dei byte, indipendente dal compilatore.

## Quando usarlo

| Obiettivo | Scelta iniziale |
| --- | --- |
| Modellare dati interni al programma | Lascia la rappresentazione Rust predefinita. Misura prima di cambiare i campi per risparmiare memoria o migliorare la località di cache. |
| Condividere una struct con C | Usa `#[repr(C)]`, tipi corrispondenti e lo stesso ABI e le stesse impostazioni di packing da entrambi i lati. |
| Scrivere o leggere un formato binario | Specifica larghezza, ordine, endianness e valori ammessi; codifica o estrai i singoli campi. |
| Riservare memoria per un tipo | Servono sia la dimensione sia l'allineamento. Per questi calcoli vedi [[Programmazione/Rust/Pagine/Allocator|Allocator]]. |

## Come funziona

### Un'intestazione in memoria

In Rust, `size_of::<T>()` è la distanza in byte fra due elementi consecutivi di un array di `T`: comprende il padding finale, non eventuali dati allocati altrove. `align_of::<T>()` restituisce l'allineamento minimo richiesto; `offset_of!(T, campo)` misura i byte dall'inizio della struct all'inizio del campo.

```rust
use std::mem::{align_of, offset_of, size_of};

#[repr(C)]
struct Header {
    kind: u8,
    len: u32,
    flags: u16,
}

fn main() {
    println!("{} {} {} {} {}", size_of::<Header>(), align_of::<Header>(),
        offset_of!(Header, kind), offset_of!(Header, len), offset_of!(Header, flags));
    assert_eq!(size_of::<[Header; 2]>(), 2 * size_of::<Header>());
}
```

Con l'ABI standard di **Windows x64 MSVC**, l'output è `12 4 0 4 8`: dimensione, allineamento e tre offset. Si legge così:

| Offset in byte | Contenuto |
| --- | --- |
| 0 | `kind` |
| 1, 2, 3 | Padding prima di `len`, che deve iniziare a un multiplo di 4 |
| 4–7 | `len` |
| 8–9 | `flags` |
| 10–11 | Padding finale: il prossimo elemento dell'array inizia all'offset 12 |

La **regola** di `repr(C)` è portabile: percorri i campi nell'ordine dichiarato, arrotonda ogni posizione all'allineamento del campo e infine arrotonda la dimensione all'allineamento della struct. I **numeri** dipendono dai tipi e dall'ABI del target. Il padding non è un campo da leggere, non è necessariamente inizializzato e non fa parte dei dati logici da confrontare o trasmettere.

### Verificare il lato C

Per lo stesso target e senza opzioni di packing speciali, questo programma C11 deve stampare la stessa cinquina. Confrontare solo `sizeof` non basterebbe: due tipi di uguale dimensione possono avere campi a offset diversi.

```c
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>

struct Header {
    uint8_t kind;
    uint32_t len;
    uint16_t flags;
};

int main(void) {
    printf("%zu %zu %zu %zu %zu\n", sizeof(struct Header), _Alignof(struct Header),
        offsetof(struct Header, kind), offsetof(struct Header, len),
        offsetof(struct Header, flags));
    return 0;
}
```

Questa è una verifica del **layout di questa struct**, non una prova della compatibilità di un'intera API. `repr(C)` sul contenitore non cambia la rappresentazione dei tipi al suo interno: una struct Rust annidata deve avere a sua volta la rappresentazione corretta, e un campo `String` non diventa una stringa C.

## API / Sintassi

| Rappresentazione | Cosa garantisce e cosa no |
| --- | --- |
| `repr(Rust)` (predefinita) | Ogni campo è allineato; i campi non si sovrappongono e l'allineamento del tipo è almeno il massimo dei loro allineamenti. L'ordine in memoria non è promesso. Campi di dimensione zero possono condividere un indirizzo. |
| `repr(C)` | In una struct conserva l'ordine dichiarato e segue le regole di layout C del target. Non impone un ordine dei byte. |
| `repr(transparent)` | Un newtype come `struct UserId(u64)` con questo attributo ha layout **e ABI** di `u64`. Sono ammessi campi supplementari di dimensione zero e allineamento 1. |
| `repr(u8)` | Per un enum senza campi fissa la rappresentazione del discriminante. Non rende ogni byte una variante valida. |
| `repr(align(N))` | Impone un allineamento di almeno `N`; ad esempio `#[repr(align(64))]` può distanziare elementi adiacenti di un array. Non garantisce che una linea di cache dell'hardware sia di 64 byte. |
| `repr(packed)` | Abbassa a 1 l'allineamento usato per collocare i campi; da solo **non** fissa l'ordine. `repr(C, packed)` fissa anche l'ordine, ma non elimina il padding interno dei tipi annidati. |

### Leggere un campo packed senza creare un riferimento

Un campo `u32` può trovarsi all'offset 1. Non creare un `&u32` verso quel campo, neppure implicitamente passandolo direttamente a una macro di formattazione. Se il tipo è `Copy`, la soluzione più semplice è copiarlo **per valore** e lavorare sulla variabile locale:

```rust
#[repr(C, packed)]
struct Compact {
    tag: u8,
    count: u32,
}

fn main() {
    let record = Compact { tag: 1, count: 42 };
    let count = record.count;
    assert_eq!(count, 42);
    assert_eq!(std::mem::offset_of!(Compact, count), 1);
}
```

Serve il caso con un puntatore grezzo? Vedi [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]. Né il packing né una lettura non allineata convertono l'endianness.

## Esempio pratico

### La stessa intestazione su file: sette byte, non dodici

Supponiamo che il formato specifichi **un byte di tipo** (`1` o `2`), **quattro byte di lunghezza** e **due byte di flag**, entrambi gli interi in big-endian. In questo caso il produttore non scrive padding. Il lettore riceve esattamente i sette byte dell'intestazione; non deve ricostruire una struct C in memoria né fare cast di puntatori.

```rust
#[derive(Debug, PartialEq)]
#[repr(u8)]
enum Kind { Data = 1, Ack = 2 }

#[derive(Debug, PartialEq)]
struct Header { kind: Kind, len: u32, flags: u16 }

fn decode_header(bytes: &[u8]) -> Option<Header> {
    let &[tag, a, b, c, d, hi, lo] = bytes else { return None };
    let kind = match tag {
        1 => Kind::Data,
        2 => Kind::Ack,
        _ => return None,
    };
    Some(Header {
        kind,
        len: u32::from_be_bytes([a, b, c, d]),
        flags: u16::from_be_bytes([hi, lo]),
    })
}

fn main() {
    let bytes = [1, 0, 0, 1, 2, 0x12, 0x34];
    assert_eq!(decode_header(&bytes),
        Some(Header { kind: Kind::Data, len: 258, flags: 0x1234 }));
    assert_eq!(decode_header(&bytes[..6]), None);
    assert_eq!(decode_header(&[9; 7]), None);
}
```

Il parser verifica la dimensione dell'intestazione e il discriminante. **Non** verifica che il payload esista: chi legge il messaggio completo deve confrontare `len` con i byte effettivamente disponibili. Cambiare il layout della struct di risultato non cambia il formato del file.

## Errori comuni

- **Dedurre una garanzia da una stampa:** `offset_of!` osserva il tipo compilato; non rende stabile l'ordine dei campi di una struct `repr(Rust)` tra build.
- **Usare `transmute` perché due tipi hanno la stessa dimensione:** questo non dimostra che gli stessi bit siano valori validi nei due tipi. Nell'esempio, `9` è un valore valido di `u8`, ma non di `Kind`.
- **Eliminare tutto il padding per risparmiare RAM:** il minore ingombro può costare accessi non allineati. Se il layout è interno, misura prima l'impatto sulle strutture realmente usate.

## Checklist

- Mi serve una garanzia del linguaggio, una misura su un target o un formato identico su ogni macchina?
- Per un confine C ho verificato dimensione, allineamento e offset sui due lati?
- Per dati esterni ho stabilito l'ordine dei byte e validato lunghezza e valori prima di costruire i tipi Rust?
- Ho evitato di prendere riferimenti a campi potenzialmente non allineati?

## Collegamenti

- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Zero-sized types|Zero-sized types]]
- [[Programmazione/Rust/Pagine/Allocator|Allocator]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]

## Fonti

- [Rust Reference: dimensione, allineamento e rappresentazioni dei tipi](https://doc.rust-lang.org/reference/type-layout.html).
- [Standard library: size_of](https://doc.rust-lang.org/std/mem/fn.size_of.html) e [offset_of!, anche sulla stabilità tra compilazioni](https://doc.rust-lang.org/std/mem/macro.offset_of.html).
- [Rust: errore E0793 sui riferimenti a campi packed](https://doc.rust-lang.org/error_codes/E0793.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
