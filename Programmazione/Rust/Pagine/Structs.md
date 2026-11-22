---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - structs
  - tipi-dato
aliases:
  - Struct Rust
  - Struct con campi nominati
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
related:
  - "[[Programmazione/Rust/Pagine/Tuple structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
title: Structs
---

# Structs

## Sintesi

Una **struct** definisce un tipo con campi che appartengono a un unico concetto: un utente, una configurazione, una coordinata. I campi nominati rendono esplicito il significato dei valori; i blocchi impl aggiungono comportamento.

Rust non usa ereditarieta fra struct: si combinano campi, metodi e trait. Una struct non garantisce da sola che i dati rispettino le regole del dominio. Gli esempi sono autonomi, verificati con Rust **1.99.1**, edition **2024**; il controesempio non compilabile e indicato.

## Quando usarlo

- Quando piu valori devono viaggiare insieme con nomi leggibili.
- Quando una API deve esprimere proprieta, prestiti e operazioni consentite.
- Quando vuoi concentrare validazione e costruzione in un punto controllato.
- Quando una tupla diventerebbe ambigua per numero o significato dei campi.

## Come funziona

Una dichiarazione crea un **tipo nominale**: due struct con gli stessi campi ma nomi diversi non sono automaticamente intercambiabili. Un literal costruisce un valore inizializzandone i campi; non chiama implicitamente una funzione new.

La struct contiene i valori dei campi. Se un campo e String ne possiede il testo; se e &str possiede il riferimento, non il testo referenziato. Contenitori come Rc possono introdurre proprieta condivisa. Queste scelte non impongono che la struct risieda sullo stack.

Campi e metodi sono privati di default. Pub sulla struct non rende pubblici i campi: la visibilita si decide separatamente. La privacy vale rispetto ai moduli, non fra istanze o metodi dello stesso modulo.

## API / Sintassi

### Definire, costruire e leggere

```rust
struct User {
    id: u64,
    email: String,
    active: bool,
}

fn main() {
    let email = String::from("luca@example.com");
    let mut user = User { id: 1, email, active: true };
    assert_eq!(user.id, 1);
    assert_eq!(user.email, "luca@example.com");

    user.active = false;
    assert!(!user.active);
}
```

email senza due punti usa la field init shorthand: equivale a email: email e qui sposta la String. L'ordine dei campi nel literal puo differire dalla dichiarazione. Non ci sono valori di default automatici per i campi omessi.

### Funzioni associate e receiver

```rust
struct User {
    email: String,
    active: bool,
}

impl User {
    fn new(email: String) -> Self {
        Self { email, active: true }
    }

    fn email(&self) -> &str {
        &self.email
    }

    fn deactivate(&mut self) {
        self.active = false;
    }

    fn into_email(self) -> String {
        self.email
    }
}

fn main() {
    let mut user = User::new(String::from("a@example.test"));
    assert_eq!(user.email(), "a@example.test");
    user.deactivate();
    assert!(!user.active);
    let email = user.into_email();
    assert_eq!(email, "a@example.test");
}
```

new e una funzione associata senza receiver: si chiama User::new, non user.new. Il nome e convenzionale, non speciale. I tre receiver comunicano lettura (&self), modifica (&mut self) e consumo (self). Self indica il tipo dell'impl; email() restituisce una vista legata al prestito dell'istanza.

### Aggiornare senza clonare implicitamente

```rust
struct User {
    id: u64,
    email: String,
    active: bool,
}

fn main() {
    let original = User {
        id: 1,
        email: String::from("a@example.test"),
        active: true,
    };
    let moved = User { id: 2, ..original };
    assert_eq!(moved.email, "a@example.test");
    assert_eq!(original.id, 1);
    assert!(original.active);

    let copied_fields = User {
        email: String::from("b@example.test"),
        ..moved
    };
    assert_eq!(copied_fields.id, 2);
    assert_eq!(moved.email, "a@example.test");
    assert!(moved.active);
}
```

Nel primo aggiornamento email viene spostato; i campi Copy rimasti sono ancora leggibili, ma original non e piu utilizzabile come valore completo. Nel secondo email e fornito esplicitamente: dalla base si copiano soltanto id e active, quindi moved resta utilizzabile anche come insieme.

La base deve essere dello stesso tipo e tutti i campi devono essere accessibili, anche quelli non scritti. Con Drop sul contenitore ci sono ulteriori limiti allo spostamento dei campi. Questa sintassi non e ereditarieta e non chiama clone.

## Esempio pratico

### Configurazione con costruzione controllata

```rust
mod settings {
    #[derive(Debug, Clone)]
    pub struct Config {
        host: String,
        port: u16,
        debug: bool,
    }

    impl Config {
        pub fn new(host: impl Into<String>, port: u16)
            -> Result<Self, &'static str>
        {
            let host = host.into();
            if host.trim().is_empty() {
                return Err("host vuoto");
            }
            if port == 0 {
                return Err("porta zero non ammessa dal demo");
            }
            Ok(Self { host, port, debug: false })
        }

        pub fn endpoint(&self) -> (&str, u16) {
            (&self.host, self.port)
        }

        pub fn debug_enabled(&self) -> bool {
            self.debug
        }

        pub fn set_debug(&mut self, enabled: bool) {
            self.debug = enabled;
        }
    }
}

fn main() {
    let mut config = settings::Config::new("localhost", 5432).unwrap();
    assert_eq!(config.endpoint(), ("localhost", 5432));
    assert!(!config.debug_enabled());
    config.set_debug(true);
    assert!(config.debug_enabled());
    assert!(settings::Config::new(" ", 5432).is_err());
    assert!(settings::Config::new("localhost", 0).is_err());
}
```

Il modulo impedisce al main di costruire o cambiare direttamente i campi privati. Il costruttore rifiuta soltanto host vuoti o composti esclusivamente da whitespace e porta zero; quest'ultima e una **politica del demo**, non un divieto universale delle API di rete.

Non valida sintassi DNS/IP, raggiungibilita o spazi presenti in un host non vuoto; conserva il testo ricevuto. Endpoint restituisce host e porta separati, senza fingere che una semplice concatenazione host:port gestisca ogni caso IPv6. Il demo non apre connessioni.

Into<String> accetta sia String sia &str, con costi diversi: una String puo essere trasferita, da &str si ottiene testo posseduto. Non e obbligatorio renderlo generico: accettare String e corretto quando quel contratto e intenzionale. Result espone un errore; gli unwrap nel main riguardano dati fissati dal demo.

## Varianti

### Marker, generici e viste

```rust
struct Marker;
struct Wrapper<T> { value: T }
struct View<'a> { text: &'a str }

fn main() {
    let marker = Marker;
    assert_eq!(std::mem::size_of_val(&marker), 0);

    let owned = Wrapper { value: String::from("rust") };
    let view = View { text: &owned.value };
    assert_eq!(view.text, "rust");
}
```

Le tuple struct hanno campi posizionali; Marker e una unit-like struct, distinta dal tipo unit (). Generici e lifetime descrivono rispettivamente il tipo contenuto e i vincoli dei riferimenti.

Derive genera implementazioni dei trait richiesti, se i campi lo consentono. Clone non garantisce dati indipendenti per qualsiasi campo; Copy non e possibile con String. Debug puo mostrare anche dati sensibili: privacy dei campi non significa segretezza dell'output.

## Errori comuni

### Campo mancante

Questo programma **non compila** (E0063):

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let point = Point { x: 1 };
    println!("{}", point.x);
}
```

Fornisci y oppure costruisci esplicitamente a partire da un valore disponibile. Default e un trait da implementare o derivare, non un riempimento implicito di ogni literal.

Altri errori frequenti:

- Chiamare new e credere che validi automaticamente ogni invariante.
- Esporre setter o campi che aggirano i controlli del costruttore.
- Leggere una String per valore quando serviva solo prenderla in prestito.
- Pensare che ..base lasci sempre la base intatta oppure la consumi sempre completamente.
- Assumere ordine fisico dei campi o layout C dal solo ordine della dichiarazione.

## Checklist

- Il tipo rappresenta un concetto coerente?
- I campi sono posseduti, condivisi oppure presi in prestito?
- Quali operazioni consumano l'istanza?
- Le vie di costruzione e modifica preservano le stesse regole?
- La privacy e verificata da un modulo esterno a quello che dichiara i campi?
- I trait derivati sono appropriati ai dati e alla API?

## Collegamenti

- [[Programmazione/Rust/Pagine/Tuple structs|Tuple structs]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Visibilita pub use e mod|Visibilita: pub, use e mod]]

## Fonti

- [Rust Book: Defining and Instantiating Structs](https://doc.rust-lang.org/book/ch05-01-defining-structs.html).
- [Rust Book: Methods](https://doc.rust-lang.org/book/ch05-03-method-syntax.html).
- [Rust Reference: Struct expressions](https://doc.rust-lang.org/reference/expressions/struct-expr.html).
- [Rust Reference: Visibility and privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html).
- [Standard library: Clone](https://doc.rust-lang.org/std/clone/trait.Clone.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
