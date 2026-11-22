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
  - Deref
  - Deref coercion
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Box T]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
related:
  - "[[Programmazione/Rust/Pagine/Drop Trait]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/AsRef AsMut e Borrow]]"
title: Deref Trait
---

# Deref Trait

## Sintesi

`Deref` espone un **riferimento condiviso** a un tipo target e permette a un wrapper di offrire un accesso simile a quello di un puntatore. Interviene nella dereferenziazione sovraccaricata, nelle deref coercions e nella risoluzione dei metodi.

Non trasferisce ownership, non clona il contenuto e non fa ereditare automaticamente i trait del target. `DerefMut` aggiunge accesso tramite riferimento mutabile, con implicazioni importanti per le invarianti del wrapper.

Gli esempi sono programmi autonomi verificati con **Rust 1.99.1, edition 2024**. Tre programmi in `Errori comuni` sono intenzionalmente non compilabili; un quarto compila ma dimostra una violazione logica. La versione e una baseline di verifica, non una MSRV.

## Quando usarlo

- Per capire perche una funzione con parametro `&str` puo ricevere `&String` o `&Box<String>`.
- Per progettare un wrapper che debba esporre in modo trasparente le operazioni del target.
- Per distinguere l'accesso al contenuto dalla sua estrazione per valore.
- Per valutare se i metodi mutabili del target possano violare le regole del wrapper.

Se serve soltanto una vista esplicita, `as_str()`, `as_slice()` o `AsRef` possono essere scelte piu controllate. Non implementare `Deref` solo per risparmiare la scrittura di un nome campo o simulare ereditarieta.

## Come funziona

### Target e significato di deref

`Deref` richiede un tipo associato `Target: ?Sized` e il metodo `fn deref(&self) -> &Self::Target`. Il target puo quindi essere anche `str` o `[T]`, che non sono sized.

Il riferimento restituito e legato al prestito di `self`: non puoi costruire un valore temporaneo dentro `deref` e restituirne un riferimento gia scaduto.

Per un wrapper ordinario che sovraccarica la dereferenziazione, in un contesto condiviso `*value` si interpreta tramite `*Deref::deref(&value)`. Non significa che ogni `*` nel linguaggio chiami questo metodo: riferimenti e raw pointer hanno dereferenziazione incorporata, mentre `Box` ha anche regole speciali per l'estrazione del contenuto.

### Un wrapper completo senza allocazione propria

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(value: T) -> Self {
        Self(value)
    }

    fn into_inner(this: Self) -> T {
        this.0
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let number = MyBox::new(7_u32);
    assert_eq!(*number, 7);
    assert_eq!(*Deref::deref(&number), 7);

    let text = MyBox::new(String::from("rust"));
    let view: &String = &*text;
    assert_eq!(view, "rust");
    assert_eq!(view.as_ptr(), text.0.as_ptr());

    let owned = MyBox::into_inner(text);
    assert_eq!(owned, "rust");
}
```

`MyBox` contiene `T` direttamente: il nome e didattico, **non e una nuova implementazione heap di `Box`**. Se `T` e una `String`, il suo buffer resta un'allocazione gestita dalla `String`, non dal trait `Deref`.

`deref` restituisce un prestito; `into_inner`, invece, consuma il wrapper e trasferisce `T`. Leggere `*number` copia un `u32` perche quel tipo e `Copy`: non prova che `Deref` possa spostare qualsiasi contenuto.

## API / Sintassi

### Coercizioni nei punti con tipo atteso

```rust
fn text_len(text: &str) -> usize {
    text.len()
}

fn view(text: &String) -> &str {
    text
}

fn main() {
    let plain = String::from("rust");
    let boxed = Box::new(String::from("cargo"));

    assert_eq!(text_len(&plain), 4);
    assert_eq!(text_len(&boxed), 5);

    let explicit: &str = &boxed;
    let inferred = &boxed;
    let views: [&str; 2] = [&plain, &boxed];

    assert_eq!(explicit, "cargo");
    assert_eq!(text_len(inferred), 5);
    assert_eq!(view(&boxed), "cargo");
    assert_eq!(views, ["rust", "cargo"]);
}
```

Parametri di funzione, variabili annotate, risultati e campi con tipo atteso sono esempi di punti in cui puo avvenire una coercizione. Nella catena `&Box<String> -> &String -> &str`, il contenuto continua a essere posseduto dal chiamante.

`let inferred = &boxed` mantiene il tipo `&Box<String>`: non si trasforma da solo nel riferimento "piu interno". La conversione avviene quando `text_len` richiede `&str`. Questi accessi standard non copiano i byte; il lifetime del prestito non viene prolungato.

Il receiver di una chiamata come `boxed.len()` segue invece le regole di ricerca dei metodi, con autoderef e autoref. Una normale funzione libera non aggiunge automaticamente il primo `&` a un argomento posseduto.

### Riferimenti condivisi e mutabili

Indichiamo con `W` il wrapper e con `U` il target.

| Conversione | Requisito |
| --- | --- |
| `&W -> &U` | `W: Deref<Target = U>` |
| `&mut W -> &U` | Basta `Deref`, ottenendo un prestito condiviso. |
| `&mut W -> &mut U` | `W: DerefMut<Target = U>` |
| `&W -> &mut U` | Non consentita da deref coercion. |

`DerefMut` richiede anche `Deref` e usa lo stesso `Target`; il metodo e `fn deref_mut(&mut self) -> &mut Self::Target`. Servono accesso mutabile e prestiti compatibili: il trait non aggira il borrow checker.

Un riferimento condiviso non promette immutabilita profonda. Per esempio, `Deref<Target = Cell<_>>` puo esporre operazioni di interior mutability anche senza `DerefMut`.

### Buffer con vista mutabile sulla slice

```rust
use std::ops::{Deref, DerefMut};

struct Buffer(Vec<u8>);

impl Deref for Buffer {
    type Target = [u8];

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for Buffer {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

fn reset(bytes: &mut [u8]) {
    bytes.fill(0);
}

fn main() {
    let mut buffer = Buffer(vec![1, 2, 3]);
    buffer[0] = 9;
    buffer.reverse();

    let shared: &[u8] = &mut buffer;
    assert_eq!(shared, &[3, 2, 9]);

    reset(&mut buffer);
    assert_eq!(&*buffer, &[0, 0, 0]);
}
```

Il target e `[u8]`, non `Vec<u8>`: i metodi della slice sono disponibili, ma `push` non arriva attraverso `Deref`. La scelta del target determina quale superficie di API rendi accessibile.

Questo buffer non mantiene invarianti sui valori degli elementi. Per un tipo che richiede dati validati, concedere accesso mutabile a tutti gli elementi potrebbe essere una scelta sbagliata.

## Esempio pratico

### NonEmptyString con campo privato e aggiornamento validato

```rust
mod non_empty {
    use std::ops::Deref;

    pub struct NonEmptyString(String);

    impl NonEmptyString {
        pub fn new(value: String) -> Option<Self> {
            if value.is_empty() {
                None
            } else {
                Some(Self(value))
            }
        }

        pub fn try_replace(&mut self, value: String) -> Result<(), String> {
            if value.is_empty() {
                return Err(value);
            }

            self.0 = value;
            Ok(())
        }

        pub fn into_inner(self) -> String {
            self.0
        }
    }

    impl Deref for NonEmptyString {
        type Target = str;

        fn deref(&self) -> &Self::Target {
            self.0.as_str()
        }
    }
}

use non_empty::NonEmptyString;

fn text_len(text: &str) -> usize {
    text.len()
}

fn main() {
    assert!(NonEmptyString::new(String::new()).is_none());

    let mut text = NonEmptyString::new(String::from("rust")).unwrap();
    assert_eq!(text_len(&text), 4);
    assert!(text.starts_with("ru"));

    assert_eq!(text.try_replace(String::new()), Err(String::new()));
    assert_eq!(&*text, "rust");

    assert_eq!(text.try_replace(String::from("cargo")), Ok(()));
    assert_eq!(text.into_inner(), "cargo");
}
```

Il modulo rende il campo privato anche rispetto al codice utilizzatore: non basta dichiarare il costruttore se chi chiama puo costruire direttamente una tupla invalida.

`try_replace` valida prima di modificare lo stato; in caso di errore restituisce la `String` ricevuta e lascia invariato il valore precedente. `into_inner` consuma il wrapper, quindi non deve mantenere un wrapper valido dopo l'estrazione.

L'invariante e soltanto **stringa non vuota in byte**: spazi, newline e qualsiasi testo UTF-8 non vuoto sono ammessi. Non e validazione di un nome utente, di una email o di testo visibile. `len` e `text_len` contano byte, non caratteri percepiti.

Qui `Deref<Target = str>` e una scelta deliberata per esporre la lettura come string slice. Non implementiamo `DerefMut` per mantenere questa API di sola lettura del target. Non significa che `&mut str` possa svuotare una stringa: le operazioni safe su `str` non ne cambiano la lunghezza. Il rischio di `&mut String` e diverso, come mostra il controesempio.

## Varianti

### AsRef esplicito per un contratto generico

```rust
use std::ops::Deref;

struct Label(String);

impl Deref for Label {
    type Target = str;

    fn deref(&self) -> &Self::Target {
        self.0.as_str()
    }
}

impl AsRef<str> for Label {
    fn as_ref(&self) -> &str {
        self.0.as_str()
    }
}

fn byte_len<S: AsRef<str>>(value: S) -> usize {
    value.as_ref().len()
}

fn main() {
    let label = Label(String::from("rust"));

    assert_eq!(label.len(), 4);
    assert_eq!(byte_len(&label), 4);
    assert_eq!(byte_len(String::from("cargo")), 5);
    assert_eq!(byte_len("go"), 2);
}
```

`Label: AsRef<str>` e implementato esplicitamente: non e una conseguenza automatica di `Deref<Target = str>`. La firma generica esprime il contratto richiesto, senza promettere che ogni tipo accettato esponga tutti i metodi di `str`.

`byte_len` riceve `S` per valore: con `&label` trasferisce solo il riferimento, con una `String` posseduta consuma quella stringa. Un bound `AsRef` non rende automaticamente borrowed ogni chiamata.

`Borrow` richiede inoltre coerenza di `Eq`, `Ord` e `Hash` tra rappresentazione posseduta e presa in prestito. Non e un sinonimo "piu veloce" di `Deref` o `AsRef`. Per le conversioni di ownership si usano altri contratti, per esempio `From` / `Into`, senza implicare necessariamente una copia.

### Collisioni tra metodi del wrapper e del target

```rust
use std::ops::Deref;

struct Target;

impl Target {
    fn name(&self) -> &str {
        "target"
    }
}

struct Wrapper(Target);

impl Wrapper {
    fn name(&self) -> &str {
        "wrapper"
    }
}

impl Deref for Wrapper {
    type Target = Target;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let wrapped = Wrapper(Target);

    assert_eq!(wrapped.name(), "wrapper");
    assert_eq!(Target::name(&wrapped), "target");
    assert_eq!(wrapped.deref().name(), "target");
}
```

Nel demo i due metodi hanno receiver `&self`: il metodo del wrapper viene trovato prima di quello del target. Una chiamata esplicita permette di scegliere quello desiderato.

In generale il compilatore considera candidati ottenuti tramite dereferenziazione e prestiti del receiver. Anche la differenza tra `&self` e `&mut self` incide sull'ordine: la regola non e semplicemente "un metodo inherent vince sempre su qualsiasi trait".

Per wrapper generici limita i metodi che possono collidere con quelli di un target sconosciuto. Aggiungere o cambiare `Deref` modifica l'API pubblica e puo cambiare la risoluzione delle chiamate.

### Costi e fallibilita

`Deref` dovrebbe essere prevedibile ed economico. Non usarlo per nascondere parsing, I/O o operazioni che falliscono ordinariamente: meglio un metodo esplicito con `Result` o `Option`.

Il tipo del metodo non garantisce assenza di panic o effetti collaterali. Le implementazioni mostrate restituiscono viste del contenuto; questa proprieta non si estende automaticamente a ogni implementazione possibile.

## Errori comuni

### Controesempio: esporre String mutabile rompe la validazione

Il programma seguente **compila**, ma il wrapper e progettato male. Dimostra un errore logico, non una soluzione da riutilizzare.

```rust
mod broken {
    use std::ops::{Deref, DerefMut};

    pub struct BrokenNonEmptyString(String);

    impl BrokenNonEmptyString {
        pub fn new(value: String) -> Option<Self> {
            if value.is_empty() {
                None
            } else {
                Some(Self(value))
            }
        }
    }

    impl Deref for BrokenNonEmptyString {
        type Target = String;

        fn deref(&self) -> &Self::Target {
            &self.0
        }
    }

    impl DerefMut for BrokenNonEmptyString {
        fn deref_mut(&mut self) -> &mut Self::Target {
            &mut self.0
        }
    }
}

fn main() {
    let mut text = broken::BrokenNonEmptyString::new(String::from("rust")).unwrap();

    text.clear();
    assert!(text.is_empty());
}
```

Il campo privato non basta: `DerefMut<Target = String>` consente di chiamare `clear` e di usare operazioni come `mem::take` sulla `String` interna. Il costruttore corretto non protegge le mutazioni successive. Il wrapper valido usa un target `str` di sola lettura e un metodo di sostituzione validato.

### Estrarre un valore non Copy tramite Deref

Questo programma **non compila**: il riferimento condiviso restituito da `deref` non concede ownership della `String`.

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let wrapped = MyBox(String::from("rust"));
    let owned: String = *wrapped;
    assert_eq!(owned, "rust");
}
```

Usa un prestito, una copia esplicita se necessaria, oppure un'operazione che consuma il wrapper, come `MyBox::into_inner` nel primo esempio. Non estendere ai wrapper custom la regola speciale di estrazione da `Box<T>`.

### I trait del target non diventano trait del wrapper

Questo programma **non compila**, anche se `text.len()` e disponibile tramite la ricerca dei metodi.

```rust
use std::fmt::Display;
use std::ops::Deref;

struct Text(String);

impl Deref for Text {
    type Target = str;

    fn deref(&self) -> &Self::Target {
        self.0.as_str()
    }
}

fn render<T: Display + ?Sized>(value: &T) -> String {
    format!("{value}")
}

fn main() {
    let text = Text(String::from("rust"));
    assert_eq!(text.len(), 4);
    assert_eq!(render(&text), "rust");
}
```

L'inferenza sceglie `T = Text`, che non implementa `Display`. Per usare il target puoi passare `render(&*text)` oppure specificare `render::<str>(&text)`. Se e il wrapper a dover soddisfare il contratto, implementa esplicitamente `Display`.

Analogamente, `Deref` non inoltra automaticamente operatori come `+` o `==`. La disponibilita di un metodo tramite autoderef non equivale a una nuova implementazione di trait.

### Il prestito iniziale non viene aggiunto a ogni argomento

Questo programma **non compila**:

```rust
fn text_len(text: &str) -> usize {
    text.len()
}

fn main() {
    let text = String::from("rust");
    assert_eq!(text_len(text), 4);
}
```

La correzione e `text_len(&text)`. Non confondere una chiamata di funzione con il trattamento speciale del receiver in `text.len()`.

## Checklist

- Il wrapper deve davvero comportarsi in modo trasparente come il target?
- `Target` e la vista corretta: `str` o `String`, `[T]` o `Vec<T>`?
- Sto chiedendo un prestito, una copia oppure un trasferimento di ownership?
- Il punto della chiamata fornisce un tipo atteso per la coercizione?
- I trait richiesti dai generics sono implementati sul tipo effettivo?
- Ogni operazione esposta da `DerefMut` conserva le invarianti?
- Campi e costruttori impediscono di aggirare la validazione dall'esterno?
- Metodi, costi e possibili panic impliciti sono prevedibili?
- Una vista nominata o `AsRef` renderebbero l'API piu chiara?

## Collegamenti

- [[Programmazione/Rust/Pagine/Box T|Box<T>]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/AsRef AsMut e Borrow|AsRef, AsMut e Borrow]]

## Fonti

- [Standard library: Deref](https://doc.rust-lang.org/std/ops/trait.Deref.html).
- [Standard library: DerefMut](https://doc.rust-lang.org/std/ops/trait.DerefMut.html).
- [Rust Reference: dereference operator](https://doc.rust-lang.org/reference/expressions/operator-expr.html#the-dereference-operator).
- [Rust Reference: type coercions](https://doc.rust-lang.org/reference/type-coercions.html).
- [Rust Reference: method-call expressions](https://doc.rust-lang.org/reference/expressions/method-call-expr.html).
- [Rust Reference: comportamento speciale di Box](https://doc.rust-lang.org/reference/special-types-and-traits.html#boxt).
- [The Rust Book: Deref e smart pointer](https://doc.rust-lang.org/book/ch15-02-deref.html).
- [Standard library: AsRef](https://doc.rust-lang.org/std/convert/trait.AsRef.html).
- [Standard library: Borrow](https://doc.rust-lang.org/std/borrow/trait.Borrow.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
