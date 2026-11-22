---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - compile-time-e-type-level-programming
aliases:
  - const fn
  - Funzioni const Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/const e static]]"
  - "[[Programmazione/Rust/Pagine/Funzioni]]"
related:
  - "[[Programmazione/Rust/Pagine/Const generics]]"
  - "[[Programmazione/Rust/Pagine/Default]]"
  - "[[Programmazione/Rust/Pagine/Zero-sized types]]"
title: const fn
---

# const fn

## Sintesi

Una `const fn` e una funzione **utilizzabile in un contesto costante**, non una funzione che viene sempre eseguita durante la compilazione. Fuori da quel contesto resta una normale chiamata, anche con argomenti conosciuti solo a runtime.

Serve a riusare la stessa logica per costanti, inizializzazione statica e dati runtime. Non garantisce inlining, memoizzazione o prestazioni migliori. [Rust Reference: const functions](https://doc.rust-lang.org/reference/const_eval.html#const-functions).

Esempi verificati con **Rust 1.99.1, edition 2024**, standard library: sei programmi validi e quattro controesempi che non compilano. La baseline non e una MSRV.

## Quando usarlo

- Costruire valori usabili in `const` e `static`.
- Calcolare dimensioni di array o piccole tabelle.
- Controllare invarianti di configurazioni fissate nel sorgente.
- Offrire un costruttore riutilizzabile sia a compile time sia a runtime.

Non usarlo per spostare automaticamente I/O o caricamento di configurazioni nella compilazione. Per un valore costruito a runtime una sola volta, considera [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]].

## Come funziona

### Il contesto della chiamata decide

| Uso | Valutazione richiesta |
| --- | --- |
| `const N: u32 = double(8);` | Compile time |
| `static N: u32 = double(8);` | Compile time dell'inizializzatore |
| `[0u8; double(8) as usize]` | Compile time della lunghezza |
| `const { double(8) }` | Contesto costante esplicito |
| `let n = double(input);` | Chiamata ordinaria |

Nell'ultima riga il compilatore puo ottimizzare, ma `const fn` non lo obbliga. La valutazione costante usa le caratteristiche del **target**: per esempio, la larghezza di `usize` dipende dal target, non dal computer su cui gira il compilatore. [Constant evaluation](https://doc.rust-lang.org/reference/const_eval.html).

La tabella descrive il contesto, non permette di catturare qualunque variabile locale in un blocco `const`.

### Il corpo deve essere compatibile

Sono disponibili, fra le altre cose, calcoli su primitivi, `if`, `match`, `while`, variabili locali e mutazioni consentite. Anche le funzioni chiamate devono essere ammesse in quel contesto.

La verifica del corpo avviene anche se poi chiami la funzione soltanto a runtime. `const` non abilita automaticamente una chiamata di trait, una closure o un metodo di libreria che non supporta la valutazione costante.

Le capacita evolvono: controlla la dicitura `const: ...` nella documentazione dell'API e prova il compilatore minimo del progetto. Le estensioni ai riferimenti mutabili di Rust 1.83 sono un esempio di questa evoluzione; `const fn` non significa "nessuna mutazione". [Rust 1.83](https://blog.rust-lang.org/2024/11/28/Rust-1.83.0/).

## API / Sintassi

Ogni blocco valido e un programma autonomo. I blocchi della sezione Errori comuni sono invece controesempi espliciti.

### La stessa funzione in due contesti

```rust
const fn double(value: u16) -> u32 {
    (value as u32) * 2
}

const SIZE: usize = double(8) as usize;
static DEFAULT_SIZE: u32 = double(8);

fn main() -> Result<(), std::num::ParseIntError> {
    let raw = std::env::args()
        .nth(1)
        .unwrap_or_else(|| String::from("10"));
    let input: u16 = raw.parse()?;

    let buffer = [0u8; SIZE];
    assert_eq!(buffer.len(), 16);
    assert_eq!(DEFAULT_SIZE, 16);
    println!("{}", double(input));
    Ok(())
}
```

Senza argomenti stampa `20`; con `12` stampa `24`. Il parsing e la lettura degli argomenti sono in `main`, non nella funzione const. Un input non rappresentabile come `u16` produce un errore.

Il risultato e `u32`: il doppio di qualsiasi `u16` vi rientra. Non dedurre dalla parola `const` che gli overflow siano risolti automaticamente.

### Costruttore fallibile con Option

```rust
mod ports {
    #[derive(Debug, PartialEq, Eq)]
    pub struct Port(u16);

    impl Port {
        pub const fn new(value: u16) -> Option<Self> {
            if value == 0 {
                None
            } else {
                Some(Self(value))
            }
        }

        pub const fn get(&self) -> u16 {
            self.0
        }
    }
}

use ports::Port;

const HTTP: Port = match Port::new(80) {
    Some(port) => port,
    None => panic!("invalid HTTP port"),
};

fn main() {
    assert_eq!(HTTP.get(), 80);
    assert_eq!(Port::new(0), None);
    assert_eq!(Port::new(8080).unwrap().get(), 8080);
}
```

Qui il dominio scelto esclude la porta zero. Non e una regola universale delle API di rete: e il contratto di questo wrapper.

`None` e un risultato valido anche a compile time, non un errore di compilazione. Il chiamante decide se propagarlo, usare un fallback o convertirlo in un panic. Il campo privato impedisce al chiamante esterno al modulo di saltare il costruttore.

### Cicli e mutazioni locali

```rust
const fn squares() -> [u16; 8] {
    let mut table = [0; 8];
    let mut index = 0;

    while index < table.len() {
        let value = index as u16;
        table[index] = value * value;
        index += 1;
    }

    table
}

const SQUARES: [u16; 8] = squares();

fn main() {
    assert_eq!(SQUARES, [0, 1, 4, 9, 16, 25, 36, 49]);
    assert_eq!(squares(), SQUARES);
}
```

La tabella e costruita con mutazioni locali e poi restituita per valore. Non modifica uno stato globale. `while` evita di dipendere da chiamate agli iteratori: nella baseline non puoi sostituirlo indiscriminatamente con `for` o `.map()`. [Contesto e motivazione dei cicli const](https://rust-lang.github.io/rfcs/2344-const-looping.html).

Per tabelle grandi considera anche costo della compilazione e dimensione del risultato: precalcolare non elimina ogni costo e non e un benchmark.

## Esempio pratico

### Configurazione con invariante e Default

```rust
mod config {
    pub struct Limits {
        max_connections: usize,
    }

    impl Limits {
        pub const fn new(max_connections: usize) -> Self {
            assert!(max_connections > 0, "limit must be positive");
            Self { max_connections }
        }

        pub const fn max_connections(&self) -> usize {
            self.max_connections
        }
    }

    impl Default for Limits {
        fn default() -> Self {
            Self::new(100)
        }
    }
}

use config::Limits;

const DEFAULT_LIMITS: Limits = Limits::new(100);
const MAX_CONNECTIONS: usize = DEFAULT_LIMITS.max_connections();

fn main() {
    let configured = Limits::new(50);
    assert_eq!(configured.max_connections(), 50);
    assert_eq!(Limits::default().max_connections(), MAX_CONNECTIONS);
}
```

Un valore zero viola l'invariante. In un inizializzatore costante provoca un errore di compilazione; in una chiamata ordinaria provoca un panic. Per input dell'utente preferisci un costruttore che restituisca `Option` o `Result`, come nell'esempio precedente.

`assert!` resta attivo anche nei normali build release: non sostituirlo con `debug_assert!` se l'invariante deve valere sempre. Il messaggio fisso evita di dipendere da formattazione non disponibile in contesto costante. [assert!](https://doc.rust-lang.org/std/macro.assert.html).

`Default::default` delega a `new`, ma questo **non rende const il metodo del trait**. Nella baseline usa il costruttore esplicito per la costante. [Default](https://doc.rust-lang.org/std/default/trait.Default.html).

### Dimensione con overflow gestito

```rust
const fn capacity(base: usize) -> Option<usize> {
    base.checked_mul(2)
}

const BUFFER_SIZE: usize = match capacity(512) {
    Some(size) => size,
    None => panic!("buffer size overflow"),
};

fn main() {
    let buffer = [0u8; BUFFER_SIZE];
    assert_eq!(buffer.len(), 1024);
    assert_eq!(capacity(0), Some(0));
    assert_eq!(capacity(usize::MAX), None);
}
```

`checked_mul` restituisce `None` invece di dipendere dal comportamento dell'overflow nei diversi profili. Il chiamante sceglie qui di rifiutare una dimensione non rappresentabile. Una dimensione rappresentabile non e necessariamente ragionevole da allocare: il demo costruisce soltanto un array di 1024 byte. [usize::checked_mul](https://doc.rust-lang.org/std/primitive.usize.html#method.checked_mul).

Non usare un overflow intenzionale come validazione. Nelle prove su Rust 1.99.1, il prodotto `255u8 * 2` dentro una `const fn` chiamata da una costante fallisce con `-C overflow-checks=yes`, ma produce `254` con `-C overflow-checks=no`. La stessa operazione scritta direttamente nell'inizializzatore viene invece rifiutata in entrambi i casi. E un comportamento osservato sulla baseline, non una garanzia da usare nell'API: `checked_mul` mantiene esplicito il contratto.

## Varianti

### Blocco const e parametri generici

```rust
fn buffer<const N: usize>() -> [u8; N] {
    const {
        assert!(N > 0, "buffer must not be empty");
    }
    [0; N]
}

fn main() {
    let bytes = buffer::<4>();
    assert_eq!(bytes, [0; 4]);
}
```

`buffer` e una normale funzione. Il blocco `const` forza il controllo a compile time per l'istanza usata: `buffer::<0>()` non compila. Il blocco puo usare il parametro generico `N`; non puo catturare un normale parametro runtime.

Non dedurre che un blocco in codice mai eseguito venga sempre valutato: la Reference distingue esecuzione raggiunta e codice non eseguito. [Const blocks](https://doc.rust-lang.org/reference/expressions/block-expr.html#const-blocks).

`const fn`, costante associata e parametro const sono concetti diversi: funzione chiamabile in contesto costante, valore legato a un tipo, valore che parametrizza un tipo o una funzione. Dettagli in [[Programmazione/Rust/Pagine/Const generics|Const generics]].

### Compatibilita della API

Rendere `pub const fn` un costruttore permette ai chiamanti di usarlo nei propri inizializzatori. **Togliere `const` puo quindi rompere la compilazione dei loro programmi**, anche lasciando firma e risultato invariati: e una conseguenza del contratto di chiamata, verificata anche nei test della nota.

Aggiungere un controllo che rifiuta input prima accettati puo cambiare il comportamento o impedire la compilazione di costanti esistenti. Documenta invarianti e MSRV, non soltanto il valore restituito. Vedi [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]] e [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]].

## Errori comuni

Questi quattro programmi **non compilano intenzionalmente**.

### Chiamare un helper non const

```rust
fn helper(value: u32) -> u32 {
    value + 1
}

const fn increment(value: u32) -> u32 {
    helper(value)
}

fn main() {
    assert_eq!(increment(2), 3);
}
```

Errore `E0015` anche se `main` usa una chiamata ordinaria. Rendi const anche l'helper, se possibile, oppure togli `const` da `increment` rinunciando agli usi in contesti costanti. [Errore E0015](https://doc.rust-lang.org/error_codes/E0015.html).

### Catturare un parametro runtime in const

```rust
fn double(value: u32) -> u32 {
    const { value * 2 }
}

fn main() {
    println!("{}", double(3));
}
```

Errore `E0435`: il parametro non e una costante. Per riusare la stessa logica nei due contesti rendi `double` una `const fn` e lascia il corpo ordinario `value * 2`. [Errore E0435](https://doc.rust-lang.org/error_codes/E0435.html).

### Violare un invariante durante la compilazione

```rust
const fn nonzero(value: usize) -> usize {
    assert!(value > 0, "value must be positive");
    value
}

const INVALID: usize = nonzero(0);

fn main() {
    println!("{INVALID}");
}
```

Errore `E0080`: l'asserzione fallisce durante la valutazione della costante. Non e un panic intercettabile dal programma con `catch_unwind`, perche l'eseguibile non viene prodotto. Correggi l'input oppure gestisci l'assenza con un risultato fallibile. [Errore E0080](https://doc.rust-lang.org/error_codes/E0080.html).

### Confondere Default con un costruttore const

```rust
#[derive(Default)]
struct Settings {
    retries: u8,
}

const SETTINGS: Settings = Settings::default();

fn main() {
    assert_eq!(SETTINGS.retries, 0);
}
```

Errore `E0015` nella baseline: il metodo derivato non e const. Un valore esplicito come `Settings { retries: 0 }`, una costante associata o un costruttore const risolvono un'esigenza diversa dal solo trait `Default`.

Altri limiti da ricordare:

- `const fn` non rende leciti I/O, allocazioni arbitrarie o distruzione arbitraria a compile time. Costruire un valore con `Drop` e diverso da eseguirne il distruttore durante la valutazione. [Errore E0493](https://doc.rust-lang.org/error_codes/E0493.html).
- Non tutte le API di un tipo sono const: un costruttore ammesso non rende automaticamente ammessi parsing, `push` o metodi di trait.
- `unsafe` non e un modo per disattivare le regole della valutazione costante.
- Per calcoli che possono fallire distingui input non valido, overflow e fallimento di un'invariante.

## Checklist

- Quale chiamante ha bisogno del contesto costante?
- Ho provato sia un inizializzatore const sia una chiamata ordinaria?
- Le API usate sono const sul compilatore minimo supportato?
- Gli input invalidi producono un risultato fallibile o un panic documentato?
- Il calcolo dipende dalla larghezza dei tipi del target?
- I campi privati impediscono di aggirare le invarianti pubbliche?
- Ho considerato compatibilita e costo della compilazione?

## Collegamenti

- [[Programmazione/Rust/Pagine/const e static|const e static]]
- [[Programmazione/Rust/Pagine/Const generics|Const generics]]
- [[Programmazione/Rust/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Rust/Pagine/Default|Default]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/panic|panic]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]

## Fonti

- [Rust Reference: constant evaluation e const functions](https://doc.rust-lang.org/reference/const_eval.html).
- [Rust Reference: const blocks](https://doc.rust-lang.org/reference/expressions/block-expr.html#const-blocks).
- [Standard library: const](https://doc.rust-lang.org/std/keyword.const.html).
- [Rust 1.83: estensioni della valutazione costante](https://blog.rust-lang.org/2024/11/28/Rust-1.83.0/).
- [RFC 2344: cicli const](https://rust-lang.github.io/rfcs/2344-const-looping.html), motivazione storica; il comportamento effettivo va verificato sul compilatore scelto.
- [Standard library: Default](https://doc.rust-lang.org/std/default/trait.Default.html) e [usize::checked_mul](https://doc.rust-lang.org/std/primitive.usize.html#method.checked_mul).
- [Rust error index: E0080](https://doc.rust-lang.org/error_codes/E0080.html).
- [Standard library: assert!](https://doc.rust-lang.org/std/macro.assert.html).
- [Rust error index: E0015](https://doc.rust-lang.org/error_codes/E0015.html), [E0435](https://doc.rust-lang.org/error_codes/E0435.html) ed [E0493](https://doc.rust-lang.org/error_codes/E0493.html).

Consultate il 2026-11-17. Le pagine online possono essere piu recenti della toolchain di prova; i risultati dichiarati si riferiscono a Rust 1.99.1.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
