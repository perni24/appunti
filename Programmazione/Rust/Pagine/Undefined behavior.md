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
  - UB
  - Undefined behavior
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
  - "[[Programmazione/Rust/Pagine/Invariants]]"
related:
  - "[[Programmazione/Rust/Pagine/Miri]]"
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
title: Undefined behavior
---

# Undefined behavior

## Sintesi

**Comportamento indefinito** (*undefined behavior*, UB) significa che un'esecuzione viola una regola su cui Rust permette al compilatore di fare affidamento. Non è un particolare esito, come un panic o un crash: **il linguaggio non garantisce il comportamento di quell'esecuzione**. Non puoi nemmeno contare sul fatto che tutto ciò che precede la violazione si comporti come suggerisce l'ordine del sorgente.

`unsafe` non sospende queste regole. Segnala i punti in cui la correttezza dipende anche da garanzie che il compilatore non verifica. Una funzione safe può contenere codice unsafe, ma deve restare sicura per **tutti gli usi consentiti dalla sua API safe**.

## Quando usarlo

Usa questa distinzione quando leggi una sezione `# Safety`, rivedi la costruzione di un riferimento, interpreti dati da un file o dalla FFI, oppure cerchi di capire che cosa abbia effettivamente verificato un test. Una domanda più utile di «può andare in crash?» è: **«quale operazione richiede quale proprietà, e da dove so che è vera?»**

## Come funziona

### Lo stesso indice, tre contratti diversi

Per una slice di lunghezza 2, l'indice 2 è fuori intervallo. Il significato dipende dall'operazione scelta:

| Operazione | Cosa garantisce Rust |
| --- | --- |
| `slice.get(2)` | Restituisce `None`. L'assenza è prevista dal tipo di ritorno e il chiamante può gestirla. |
| `slice[2]` | Il controllo dei limiti causa un **panic**, anche in release. La strategia di panic può prevedere unwinding o abort, ma non si tratta di UB. |
| `slice.get_unchecked(2)` | La precondizione richiede un indice strettamente minore della lunghezza. Violarla è **UB già alla chiamata**, anche se il riferimento restituito non viene poi letto. Nessun panic è garantito. |

```rust
fn byte_at(bytes: &[u8], index: usize) -> u8 {
    bytes[index] // Fuori intervallo: panic, non None.
}

fn main() {
    let bytes = [10_u8, 20];
    assert_eq!(byte_at(&bytes, 1), 20);
    assert_eq!(bytes.get(2), None);
}
```

Anche un **errore logico** è diverso: scegliere l'indice 0 quando si voleva l'1 produce un risultato sbagliato ma valido. Analogamente, un errore del borrow checker impedisce la compilazione; non è un episodio di UB osservato a runtime.

## API / Sintassi

### Validità, accesso e inizializzazione

- **Puntatori e riferimenti.** Un raw pointer nullo può rappresentare «nessun dato». Non è però un riferimento: per creare un `&T` devi garantire, già in quel momento, non nullità, allineamento, un valore valido e accesso compatibile per la durata del prestito. Controllare solo `is_null()` non prova queste condizioni. Il pattern `_` non forza di per sé una copia o una lettura del valore: non usarlo come test della leggibilità di un indirizzo.
- **Rappresentazione.** Due tipi della stessa dimensione non ammettono necessariamente le stesse configurazioni di bit. Tutti i byte sono validi come `u8`; per un `bool` Rust le sole rappresentazioni valide sono 0 e 1. Produrre un valore non valido è già un problema, anche se subito dopo si intende controllarlo.
- **Aliasing e concorrenza.** Un accesso incompatibile con un riferimento attivo può violare il contratto anche in un solo thread. Una *data race* richiede accessi concorrenti in conflitto alla stessa memoria, almeno una scrittura, almeno un accesso non atomico e assenza della necessaria sincronizzazione. Un risultato che dipende dall'ordine di due operazioni atomiche può essere un errore logico senza essere una data race.
- **FFI.** Il fatto che il codice compili e il linker trovi un simbolo non dimostra che la firma abbia un'ABI compatibile, né che un buffer sia vivo e abbastanza lungo. Le garanzie necessarie devono valere anche sul lato esterno della chiamata.

`MaybeUninit<T>` consente di rappresentare *spazio per un valore* senza affermare che il valore esista già. Nell'esempio, la prima lettura passa dal riferimento restituito da `write`, quindi avviene solo dopo l'inizializzazione:

```rust
use std::mem::MaybeUninit;

fn main() {
    let mut slot = MaybeUninit::<u32>::uninit();
    let initialized = slot.write(42);
    assert_eq!(*initialized, 42);
}
```

Per un singolo numero nel normale codice applicativo basta `let value = 42`. Il punto è la distinzione tra spazio e valore: `assume_init` **non** inizializza lo spazio e **non** controlla i byte; richiede che l'inizializzazione sia già stata completata correttamente.

## Esempio pratico

### Validare un flag prima di creare il bool

Un formato binario ammette soltanto i byte 0 e 1 per un flag. Il chiamante deve poter distinguere un campo mancante da un campo presente ma non valido. Perciò si legge un `u8`, si controlla il dominio del formato e solo allora si restituisce un `bool`. Non serve `transmute`.

```rust
#[derive(Debug, PartialEq)]
enum FlagError {
    Missing,
    Invalid(u8),
}

fn read_flag(bytes: &[u8], index: usize) -> Result<bool, FlagError> {
    match bytes.get(index).copied() {
        None => Err(FlagError::Missing),
        Some(0) => Ok(false),
        Some(1) => Ok(true),
        Some(other) => Err(FlagError::Invalid(other)),
    }
}

fn main() {
    let record = [0, 1, 2];
    assert_eq!(read_flag(&record, 0), Ok(false));
    assert_eq!(read_flag(&record, 1), Ok(true));
    assert_eq!(read_flag(&record, 2), Err(FlagError::Invalid(2)));
    assert_eq!(read_flag(&record, 3), Err(FlagError::Missing));
}
```

L'input `2` **non è UB**: è un byte perfettamente valido, ma non appartiene al formato. Anche scrivere `byte != 0` produrrebbe sempre un `bool` Rust valido; sarebbe però il parser *sbagliato* per questo contratto, perché accetterebbe 2 come vero.

## Verifica con Miri

In un progetto Cargo con `Cargo.toml`, toolchain nightly e componente Miri corrispondente già installati, esegui i test della crate con:

```bash
cargo +nightly miri test
```

Miri interpreta i **percorsi eseguiti** e può diagnosticare diverse violazioni, per esempio nell'uso della memoria. Un test superato non dimostra che ogni input, interleaving o percorso FFI sia corretto. Non serve provocare UB per verificare un parser: il risultato atteso per un byte non valido è un normale `Err`. Per preparazione dell'ambiente e limiti dello strumento, vedi [[Programmazione/Rust/Pagine/Miri|Miri]].

## Errori comuni

- **Dedurre il contratto dall'esito di un esperimento.** Un panic osservato in una build con controlli aggiuntivi non trasforma un'operazione unsafe in un'API che rifiuta sempre l'input.
- **Controllare troppo tardi.** Verifica limiti, allineamento, durata e validità per il tipo *prima* di formare un riferimento o produrre un valore tipizzato.
- **Scambiare un cambio di comportamento tra debug e release per una diagnosi.** È un indizio da investigare, non una prova di UB. Anche un `debug_assert!` può spiegare una differenza; per contro, esiti identici non escludono UB.
- **Contare su un panic per recuperare.** `catch_unwind` può intercettare un panic con unwinding, non un abort né una violazione del contratto di sicurezza.

## Checklist

1. L'input non è valido **per il formato** o il programma sta producendo un valore non valido **per Rust**?
2. La funzione controlla la condizione oppure la sua sezione `# Safety` la impone al chiamante?
3. Se costruisco un riferimento, posso giustificarne validità e permessi per tutto il prestito?
4. I test coprono casi vuoti, valori limite ed errori tramite API definite? Che cosa resta da dimostrare sul codice unsafe?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/panic|panic]]
- [[Programmazione/Rust/Pagine/Miri|Miri]]

## Fonti

- [Rust Reference: behavior considered undefined](https://doc.rust-lang.org/reference/behavior-considered-undefined.html)
- [Rust Reference: wildcard pattern](https://doc.rust-lang.org/reference/patterns.html#wildcard-pattern)
- [Standard library: slice::get_unchecked](https://doc.rust-lang.org/std/primitive.slice.html#method.get_unchecked) e [MaybeUninit](https://doc.rust-lang.org/std/mem/union.MaybeUninit.html)
- [Miri: utilizzo e limiti dichiarati](https://github.com/rust-lang/miri)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
