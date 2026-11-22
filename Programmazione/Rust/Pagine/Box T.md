---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - smart-pointers-e-interior-mutability
aliases:
  - Box<T>
  - Box Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
related:
  - "[[Programmazione/Rust/Pagine/Deref Trait]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/Drop Trait]]"
  - "[[Programmazione/Rust/Pagine/Pin e Unpin]]"
title: Box<T>
---

# Box<T>

## Sintesi

`Box<T>` e un puntatore proprietario: possiede un valore tramite un livello di indirezione e ne gestisce il rilascio. E utile per tipi ricorsivi, valori grandi e trait object posseduti. Non introduce reference counting o garbage collection.

Il box e il valore puntato non sono la stessa cosa: spostare il box trasferisce la proprieta senza spostare il contenuto nella sua allocazione. Questo **non** impedisce di estrarre o sostituire il contenuto: `Box<T>` da solo non e `Pin<Box<T>>`.

Gli esempi sono programmi autonomi verificati con **Rust 1.99.1, edition 2024**. I due programmi nella sezione `Errori comuni` devono essere rifiutati dal compilatore. La versione e una baseline di verifica, non una MSRV.

## Quando usarlo

- Per interrompere la ricorsione nella rappresentazione di una lista o di un albero.
- Per possedere un'implementazione dietro `Box<dyn Trait>`.
- Per separare un valore grande dalla dimensione del contenitore che lo possiede.
- Per possedere sequenze a lunghezza fissata a runtime, come `Box<[T]>` o `Box<str>`.

Non aggiungere un box solo perche un dato e dinamico: `String` e `Vec<T>` gestiscono gia propri buffer. `Box<String>` e `Box<Vec<T>>` possono avere senso, ma aggiungono un livello di indirezione per i metadati del contenitore, non spostano per la prima volta i suoi elementi sullo heap.

## Come funziona

### Proprietario, allocazione e dimensione

Nel caso ordinario di un `T` non zero-sized, `Box::new(value)` alloca e trasferisce `value` nel box. Per un tipo zero-sized non serve un'allocazione. Il compilatore puo inoltre eliminare allocazioni non osservabili: il numero di chiamate all'allocatore non si deduce contando `Box::new` nel sorgente.

Con `T: Sized`, il normale `Box<T>` ha la rappresentazione di un singolo puntatore; non assumere una dimensione universale di otto byte. `Box<[T]>` e `Box<dyn Trait>` sono anch'essi valori sized, ma devono conservare anche i metadati del tipo puntato. Non estendere a questi casi la regola del singolo puntatore.

Il box puo essere una variabile locale, un campo di un'altra struttura o un elemento di un contenitore. Dire "il box sta sempre sullo stack" e una semplificazione scorretta.

### Prestito, mutazione e trasferimento

```rust
fn text_len(text: &str) -> usize {
    text.len()
}

fn main() {
    let value = Box::new(42);
    assert_eq!(*value, 42);

    let mut boxed = Box::new(String::from("rust"));
    let address = std::ptr::from_ref(boxed.as_ref());

    boxed.push('!');
    assert_eq!(text_len(&boxed), 5);

    let view: &String = boxed.as_ref();
    assert_eq!(view, "rust!");

    let moved = boxed;
    assert_eq!(std::ptr::from_ref(moved.as_ref()), address);

    let text: String = *moved;
    assert_eq!(text, "rust!");
}
```

- `&boxed` puo essere convertito per deref coercion in un riferimento al contenuto; qui le conversioni arrivano fino a `&str`.
- `as_ref()` presta `T` senza trasferirlo; `as_mut()` permette un prestito mutabile quando disponi di accesso mutabile al box.
- `let moved = boxed` trasferisce il proprietario. L'uguaglianza degli indirizzi verifica la posizione della `String` contenuta, non quella dei suoi byte.
- `let text: String = *moved` estrae il valore non `Copy`. Il box precedente non e piu utilizzabile come prima; la `String` passa al nuovo proprietario.

L'estrazione tramite `*` e un comportamento speciale di `Box` supportato dal linguaggio: implementare `Deref` in un wrapper non permette automaticamente di spostare valori fuori da un riferimento condiviso.

## API / Sintassi

Le operazioni ordinarie sono `Box::new(value)`, prestito tramite `as_ref()` / `as_mut()`, dereferenziazione, move e `drop(boxed)`. Per estrarre un `T: Sized` posseduto puoi usare `*boxed`; nella baseline `Box::into_inner` e ancora nightly-only.

### Clone non significa condivisione del box

```rust
fn main() {
    let original = Box::new(String::from("rust"));
    let mut copied = original.clone();

    copied.push_str("-copy");

    assert_eq!(original.as_str(), "rust");
    assert_eq!(copied.as_str(), "rust-copy");
    assert!(!std::ptr::eq(original.as_ref(), copied.as_ref()));
}
```

Per `Box<T>` con `T: Clone`, `clone()` clona anche `T`. Nel demo produce una `String` indipendente: non e l'equivalente di incrementare il contatore di un `Rc`.

Non generalizzare pero a una "deep copy di tutto": il comportamento dipende da `T::clone`. Per esempio, clonare un `Box<Rc<_>>` crea due box ma i rispettivi `Rc` continuano a condividere il dato.

### Distruzione ordinaria e drop anticipato

```rust
use std::cell::Cell;

struct Tracked<'a> {
    drops: &'a Cell<usize>,
}

impl Drop for Tracked<'_> {
    fn drop(&mut self) {
        self.drops.set(self.drops.get() + 1);
    }
}

fn main() {
    let drops = Cell::new(0);

    {
        let first = Box::new(Tracked { drops: &drops });
        let second = first;
        assert_eq!(drops.get(), 0);

        drop(second);
        assert_eq!(drops.get(), 1);
    }

    assert_eq!(drops.get(), 1);

    {
        let _third = Box::new(Tracked { drops: &drops });
    }

    assert_eq!(drops.get(), 2);
}
```

Spostare il box non distrugge il contenuto. `drop(second)` consuma il proprietario e anticipa la distruzione; all'uscita dal blocco non avviene una seconda distruzione dello stesso valore.

Nel rilascio ordinario, il contenuto viene distrutto e l'allocazione del box viene liberata. Non e una promessa che i distruttori vengano sempre eseguiti: leak intenzionali, `mem::forget` e terminazione senza unwinding possono evitarli. Un box restituito da una funzione trasferisce la responsabilita al chiamante, non viene distrutto al ritorno della funzione.

### Slice e testo posseduti

```rust
fn main() {
    let mut numbers: Box<[i32]> = vec![10, 20, 30].into_boxed_slice();
    numbers[1] = 25;
    assert_eq!(&*numbers, &[10, 25, 30]);

    let mut growable = numbers.into_vec();
    growable.push(40);
    assert_eq!(growable, [10, 25, 30, 40]);

    let fixed: Box<[i32; 2]> = Box::new([7, 8]);
    let slice: Box<[i32]> = fixed;
    assert_eq!(slice.len(), 2);

    let mut text: Box<str> = String::from("rust").into_boxed_str();
    text.make_ascii_uppercase();
    assert_eq!(&*text, "RUST");

    let mut growable_text = text.into_string();
    growable_text.push('!');
    assert_eq!(growable_text, "RUST!");
}
```

`Box<[T]>` possiede gli elementi e permette di modificarli, ma non ha `push` o capacita di crescita. `Box<str>` possiede il testo: non e `Box<&str>`. Consente operazioni che rispettano la lunghezza e UTF-8, come la conversione ASCII mostrata; non offre la crescita di `String`.

`Vec::into_boxed_slice` e `String::into_boxed_str` eliminano la capacita in eccesso e possono riallocare. Non promettere la conservazione dell'indirizzo in ogni conversione. Il passaggio `Box<[i32; 2]> -> Box<[i32]>`, invece, e una coercizione unsized che mantiene l'allocazione ed espone una slice.

### Trait object con una factory completa

```rust
trait Draw {
    fn draw(&self) -> String;
}

struct Label(String);
struct Counter(u32);

impl Draw for Label {
    fn draw(&self) -> String {
        self.0.clone()
    }
}

impl Draw for Counter {
    fn draw(&self) -> String {
        format!("count={}", self.0)
    }
}

fn make_widget(count: Option<u32>) -> Box<dyn Draw> {
    match count {
        Some(value) => Box::new(Counter(value)),
        None => Box::new(Label(String::from("ready"))),
    }
}

fn main() {
    let widgets = [make_widget(None), make_widget(Some(3))];

    let rendered: Vec<String> = widgets.iter().map(|item| item.draw()).collect();
    assert_eq!(rendered, ["ready", "count=3"]);
}
```

La factory restituisce tipi concreti diversi dietro un unico tipo di ritorno. Il box possiede l'implementazione, `dyn` permette il dispatch dinamico; il trait deve essere dyn-compatible.

`Draw` qui produce **testo**, non disegna una GUI e non esegue escaping per HTML o terminale. Ogni `draw` restituisce una `String`, quindi questo costo e distinto da quello del box.

In questa firma `Box<dyn Draw>` usa il default `'static` per i prestiti eventualmente contenuti nell'implementazione. Non significa che il box viva per sempre. Un'implementazione che prende in prestito dati locali puo richiedere `Box<dyn Draw + 'a>`; possedere il wrapper non significa possedere ogni dato a cui esso fa riferimento.

## Esempio pratico

### Lista ricorsiva con dimensione finita

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

impl List {
    fn prepend(self, value: i32) -> Self {
        Self::Cons(value, Box::new(self))
    }

    fn len(&self) -> usize {
        let mut current = self;
        let mut count = 0;

        while let Self::Cons(_, next) = current {
            count += 1;
            current = next.as_ref();
        }

        count
    }

    fn first(&self) -> Option<i32> {
        match self {
            Self::Cons(value, _) => Some(*value),
            Self::Nil => None,
        }
    }
}

fn main() {
    let list = List::Nil.prepend(20).prepend(10);

    assert_eq!(list.len(), 2);
    assert_eq!(list.first(), Some(10));
    assert_eq!(List::Nil.first(), None);
}
```

Sostituire `Box<List>` con `List` nella variante `Cons` renderebbe il tipo direttamente ricorsivo, senza una dimensione finita. Il box interrompe la ricorsione della rappresentazione; la lunghezza della lista non diventa parte della dimensione del suo valore radice.

Questo esempio serve a capire l'indirezione, non a sostituire `Vec` come scelta ordinaria: ogni `prepend` crea un box e i nodi non formano un unico buffer contiguo. `len` percorre la lista in modo iterativo, ma il rilascio automatico dei nodi resta ricorsivo e puo esaurire lo stack con strutture molto profonde.

### Albero di espressioni con overflow esplicito

```rust
enum Expr {
    Number(i64),
    Add(Box<Expr>, Box<Expr>),
}

fn eval(expr: &Expr) -> Option<i64> {
    match expr {
        Expr::Number(value) => Some(*value),
        Expr::Add(left, right) => eval(left)?.checked_add(eval(right)?),
    }
}

fn main() {
    let expr = Expr::Add(
        Box::new(Expr::Number(10)),
        Box::new(Expr::Add(
            Box::new(Expr::Number(20)),
            Box::new(Expr::Number(12)),
        )),
    );
    assert_eq!(eval(&expr), Some(42));

    let overflow = Expr::Add(
        Box::new(Expr::Number(i64::MAX)),
        Box::new(Expr::Number(1)),
    );
    assert_eq!(eval(&overflow), None);
}
```

Il valutatore prende in prestito l'albero: non lo consuma e non clona i sottoalberi. `None` significa che una somma intermedia non e rappresentabile come `i64`. `checked_add` rende questa scelta esplicita, senza dipendere dai controlli di overflow del profilo di compilazione.

E un valutatore didattico di nodi gia costruiti, **non un parser**. La ricorsione di valutazione e distruzione richiede profondita limitate; `Box` non risolve da solo lo stack overflow. Per input non fidati servono limiti di nodi/profondita e, dove necessario, visita e rilascio iterativi o una rappresentazione ad arena.

## Varianti

### Scegliere il proprietario corretto

| Tipo | Contratto principale |
| --- | --- |
| `Box<T>` | Un proprietario del valore indiretto; prestiti normali. |
| `&T` / `&mut T` | Prestito, non ownership del dato. |
| `Rc<T>` | Ownership condivisa senza accesso tra thread. |
| `Arc<T>` | Conteggio atomico; uso tra thread subordinato ai bound sul contenuto. |
| `Pin<Box<T>>` | Contratto di pinning sul contenuto; rilevante per tipi non `Unpin`. |

Un `Box<T>` puo essere `Send` se `T` e `Send` e `Sync` se `T` e `Sync`. Non rende automaticamente sicuri tra thread i dati contenuti e non fornisce sincronizzazione.

### Box ordinario e pinning non sono equivalenti

```rust
use std::marker::PhantomPinned;
use std::pin::Pin;

struct Entry {
    text: String,
    _pin: PhantomPinned,
}

fn main() {
    let boxed = Box::new(Entry {
        text: String::from("movable"),
        _pin: PhantomPinned,
    });

    let entry: Entry = *boxed;
    assert_eq!(entry.text, "movable");

    let pinned = Box::pin(String::from("ordinary"));
    let unpinned: Box<String> = Pin::into_inner(pinned);
    let text: String = *unpinned;
    assert_eq!(text, "ordinary");
}
```

`PhantomPinned` rende `Entry` non `Unpin`, ma **non la blocca da solo**: un `Box<Entry>` ordinario consente ancora l'estrazione mostrata.

Per un contenuto non `Unpin`, `Box::pin` introduce il contratto che impedisce di estrarlo liberamente tramite le API safe. Il valore `Pin<Box<T>>` puo comunque essere spostato: e il contenuto puntato a essere protetto. Con `String: Unpin`, invece, `Pin::into_inner` e consentito, come nel demo.

Pinning non significa immutabilita. I dettagli sulle proiezioni e sui tipi dipendenti dal proprio indirizzo sono nella nota [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]].

### Allocazioni grandi, leak e raw pointer

`Box::new(large_value)` riceve un valore gia costruito: non garantisce che la costruzione di un array enorme eviti temporanei sullo stack. Per un buffer di elementi inizializzati puo essere piu appropriato partire da `Vec` e convertirlo in `Box<[T]>`. Occorre comunque limitare le dimensioni richieste.

`Box::new` non restituisce `Result`. Il fallimento dell'allocazione segue il gestore previsto dall'ambiente, che normalmente con `std` termina il processo; non usare `catch_unwind` come recupero affidabile dall'esaurimento della memoria. Nella baseline `Box::try_new` e nightly-only.

`Box::leak` consuma il proprietario e restituisce un riferimento senza il normale rilascio automatico: e una decisione esplicita di gestione della memoria, non una correzione ordinaria per errori di lifetime. Non rende statici i riferimenti locali gia contenuti in `T`.

`Box::into_raw` trasferisce la responsabilita di gestione a un raw pointer. `Box::from_raw` e unsafe: richiede provenienza, allocatore, layout, validita e ownership corretti. Non si puo costruire un box da un riferimento arbitrario, da un puntatore nullo o due volte dalla stessa allocazione. Per le operazioni comuni resta sulle API safe mostrate sopra.

## Errori comuni

### Riutilizzare il box dopo un move

Questo programma **non compila**: anche se `u32` e `Copy`, `Box<u32>` non lo e.

```rust
fn main() {
    let original = Box::new(10_u32);
    let moved = original;

    assert_eq!(*moved, 10);
    assert_eq!(*original, 10);
}
```

Se devi soltanto leggere, passa un riferimento. Se vuoi due valori proprietari distinti e il contenuto lo permette, usa `clone()`; se vuoi ownership condivisa, valuta `Rc` o `Arc`.

### Un box di riferimenti non possiede i dati riferiti

Questo programma **non compila**: il box sopravvivrebbe alla `String` locale da cui dipende.

```rust
fn main() {
    let boxed;

    {
        let local = String::from("temporaneo");
        boxed = Box::new(local.as_str());
    }

    assert_eq!(*boxed, "temporaneo");
}
```

Il tipo e `Box<&str>`, non `Box<str>` o `Box<String>`. Per conservare i dati puoi trasferire `local` nel box oppure convertirla in `Box<str>`; per un prestito, il proprietario originale deve restare valido.

Altri errori da evitare:

- Usare `Box` per qualsiasi valore piccolo, senza un'esigenza di ownership o rappresentazione.
- Confondere il move del box con il clone del contenuto.
- Promettere assenza di stack overflow soltanto perche i nodi sono allocati sullo heap.
- Trattare `Pin<Box<T>>` come garanzia che ogni `T` sia immobile o immutabile.
- Copiare API nightly dalla documentazione senza controllare versione e feature gate.
- Aggiungere `'static` o un leak per nascondere un prestito ancora necessario.

## Checklist

- Serve un valore indiretto posseduto, oppure basta un riferimento?
- Il tipo e ricorsivo, grande o un trait object?
- Sto aggiungendo un box a un contenitore che possiede gia un buffer?
- Mi serve crescita (`Vec` / `String`) oppure una sequenza a lunghezza fissa?
- Il contenuto possiede i propri dati oppure contiene prestiti?
- Il clone deve duplicare valori o condividere risorse?
- La profondita della struttura e sicura anche durante la distruzione?
- Ho distinto spostamento del proprietario, estrazione del contenuto e pinning?
- Le API usate sono disponibili nella toolchain del progetto?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]

## Fonti

- [Standard library: modulo boxed e memory layout](https://doc.rust-lang.org/std/boxed/index.html).
- [Standard library: Box, API e stato di stabilizzazione](https://doc.rust-lang.org/std/boxed/struct.Box.html).
- [The Rust Book: tipi ricorsivi e Box](https://doc.rust-lang.org/book/ch15-01-box.html).
- [Rust Reference: comportamento speciale di Box](https://doc.rust-lang.org/reference/special-types-and-traits.html#boxt).
- [Rust Reference: distruttori](https://doc.rust-lang.org/reference/destructors.html).
- [Standard library: drop](https://doc.rust-lang.org/std/mem/fn.drop.html).
- [Standard library: Vec::into_boxed_slice](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.into_boxed_slice).
- [Standard library: String::into_boxed_str](https://doc.rust-lang.org/std/string/struct.String.html#method.into_boxed_str).
- [Standard library: i64::checked_add](https://doc.rust-lang.org/std/primitive.i64.html#method.checked_add).
- [Standard library: Pin e Unpin](https://doc.rust-lang.org/std/pin/index.html).
- [Standard library: Arc e requisiti del contenuto](https://doc.rust-lang.org/std/sync/struct.Arc.html).
- [Standard library: errori di allocazione](https://doc.rust-lang.org/std/alloc/fn.handle_alloc_error.html) e [ottimizzazioni dell'allocatore](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html#safety).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
