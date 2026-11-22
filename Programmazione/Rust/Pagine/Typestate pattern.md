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
  - compile-time-e-type-level-programming
aliases:
  - Typestate
  - Typestate pattern
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Marker types]]"
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
related:
  - "[[Programmazione/Rust/Pagine/PhantomData]]"
  - "[[Programmazione/Rust/Pagine/Newtype pattern]]"
  - "[[Programmazione/Rust/Pagine/Builder pattern]]"
title: Typestate pattern
---

# Typestate pattern

## Sintesi

Il **typestate pattern** rappresenta stati e transizioni tramite tipi distinti. Un valore in uno stato espone solo le operazioni previste per quello stato; una transizione puo consumarlo e restituire un valore di un altro tipo.

Non cambia il tipo di un oggetto in posizione: produce un nuovo valore, trasferendone eventualmente i dati. Il compilatore controlla l'uso dell'API, non la correttezza delle condizioni di dominio o il successo di un'operazione esterna. [Rust Book: stati come tipi](https://doc.rust-lang.org/book/ch18-03-oo-design-patterns.html#encoding-states-and-behavior-as-types).

Esempi verificati con **Rust 1.99.1, edition 2024**, sola standard library: due programmi completi in memoria e tre controesempi dichiarati. La baseline non e una MSRV; i demo non pubblicano dati su un sito e non aprono connessioni.

## Quando usarlo

- Impedire operazioni prima di una configurazione obbligatoria.
- Separare dati modificabili e dati gia validati.
- Modellare poche fasi con operazioni chiaramente diverse.
- Rendere esplicito il trasferimento di una risorsa fra fasi.

Una enum runtime puo essere piu semplice quando gli stati sono molti, scelti da input esterni o conservati in collezioni eterogenee. Il typestate non elimina la validazione degli input.

## Come funziona

### Transizioni e responsabilita

Il primo demo modella soltanto il ciclo di vita **locale** di un documento:

| Operazione | Contratto |
| --- | --- |
| Creazione | Produce una bozza |
| Modifica | Disponibile sulla bozza |
| Pubblicazione | Valida e restituisce successo o bozza |
| Lettura | Disponibile sul pubblicato |
| Ritiro | Restituisce una bozza modificabile |

Una firma `publish(self) -> Result<Post<Published>, (Self, PublishError)>` esprime due esiti con tipi diversi. Il consumo di self impedisce di usare ancora lo stesso wrapper non Copy; il valore restituito in Err permette di correggerlo e riprovare. [Ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html).

### Tipi, dati e visibilita

Il marker non contiene la prova della validazione. Il modulo deve esporre solo costruttori e transizioni che preservano il contratto; campi pubblici o un costruttore per qualunque State permetterebbero di saltarlo.

I campi privati restano accessibili al modulo proprietario e ai suoi discendenti. Un marker pubblico non concede da solo la costruzione del wrapper. [Privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html).

Il parametro puo essere una semplice etichetta con PhantomData oppure uno stato che contiene dati reali. I due demo mostrano entrambe le forme.

## API / Sintassi

### Documento con transizione fallibile e recupero

Policy locale: titolo e corpo non devono essere vuoti dopo trim. Il controllo usa una vista, **non modifica le stringhe**; conserva spazi, maiuscole e contenuto originali.

```rust
mod posts {
    use std::marker::PhantomData;

    #[derive(Debug)]
    pub struct Draft;

    #[derive(Debug)]
    pub struct Published;

    #[derive(Debug, PartialEq, Eq)]
    pub enum PublishError {
        EmptyTitle,
        EmptyBody,
    }

    #[derive(Debug)]
    pub struct Post<State> {
        title: String,
        body: String,
        state: PhantomData<fn() -> State>,
    }

    impl Post<Draft> {
        pub fn new(title: String, body: String) -> Self {
            Self { title, body, state: PhantomData }
        }

        pub fn set_title(&mut self, title: String) {
            self.title = title;
        }

        pub fn set_body(&mut self, body: String) {
            self.body = body;
        }

        pub fn publish(
            self,
        ) -> Result<Post<Published>, (Self, PublishError)> {
            if self.title.trim().is_empty() {
                return Err((self, PublishError::EmptyTitle));
            }
            if self.body.trim().is_empty() {
                return Err((self, PublishError::EmptyBody));
            }

            Ok(Post {
                title: self.title,
                body: self.body,
                state: PhantomData,
            })
        }
    }

    impl Post<Published> {
        pub fn title(&self) -> &str {
            &self.title
        }

        pub fn body(&self) -> &str {
            &self.body
        }

        pub fn retract(self) -> Post<Draft> {
            Post {
                title: self.title,
                body: self.body,
                state: PhantomData,
            }
        }
    }
}

use posts::{Draft, Post, PublishError, Published};

enum StoredPost {
    Draft(Post<Draft>),
    Published(Post<Published>),
}

fn main() {
    let draft = Post::new("   ".to_owned(), "Content".to_owned());
    let (mut draft, error) = draft.publish().unwrap_err();
    assert_eq!(error, PublishError::EmptyTitle);

    draft.set_title("Intro".to_owned());
    let published = draft.publish().unwrap();
    assert_eq!(published.title(), "Intro");
    assert_eq!(published.body(), "Content");

    let mut draft = published.retract();
    draft.set_body("Updated".to_owned());
    let published = draft.publish().unwrap();
    assert_eq!(published.body(), "Updated");

    let items = [
        StoredPost::Draft(Post::new(String::new(), String::new())),
        StoredPost::Published(published),
    ];
    let titles: Vec<_> = items.iter().filter_map(|item| match item {
        StoredPost::Published(post) => Some(post.title()),
        StoredPost::Draft(_) => None,
    }).collect();
    assert_eq!(titles, ["Intro"]);
}
```

Prima viene controllato il titolo, poi il corpo. trim riconosce whitespace Unicode, non ogni carattere invisibile: un testo formato da U+200B non e vuoto secondo questa policy. Non sono verificate moderazione, autorizzazione o unicita. [str::trim](https://doc.rust-lang.org/std/primitive.str.html#method.trim).

La pubblicazione e il ritiro spostano le String senza clonarle. Il ritiro consuma il wrapper Published e restituisce una Draft, ma **non cancella copie esterne** e non effettua rollback su un server.

Il tipo non e Copy e non implementa Clone. Non puoi usare il vecchio valore dopo la transizione; aggiungere Clone cambierebbe la possibilita di duplicare i percorsi del flusso. I riferimenti gia presi sono soggetti anche al borrow checker.

Solo Published espone i metodi title e body, ma questo non e un confine di riservatezza: il Debug del demo mostra anche i campi di Draft. Per dati sensibili servono altre scelte di logging e autorizzazione.

PhantomData usa qui la forma `fn() -> State`: State e un'etichetta, non un valore posseduto. Varianza, auto trait e altre forme restano nella [[Programmazione/Rust/Pagine/PhantomData|nota dedicata]]. [PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html).

## Esempio pratico

### Builder con dati nello stato

Un nome e obbligatorio; il numero di tentativi e opzionale e puo essere impostato in entrambi gli stati. Qui Named **contiene** la String: non servono Option per il nome o PhantomData.

```rust
mod jobs {
    pub struct Missing;

    pub struct Named {
        name: String,
    }

    pub struct Builder<State> {
        state: State,
        retries: u8,
    }

    pub struct Job {
        name: String,
        retries: u8,
    }

    #[derive(Debug, PartialEq, Eq)]
    pub struct EmptyName;

    impl Builder<Missing> {
        pub fn new() -> Self {
            Self { state: Missing, retries: 0 }
        }

        pub fn name(
            self,
            name: String,
        ) -> Result<Builder<Named>, (Self, EmptyName)> {
            if name.trim().is_empty() {
                return Err((self, EmptyName));
            }
            Ok(Builder {
                state: Named { name },
                retries: self.retries,
            })
        }
    }

    impl<State> Builder<State> {
        pub fn retries(mut self, value: u8) -> Self {
            self.retries = value;
            self
        }
    }

    impl Builder<Named> {
        pub fn build(self) -> Job {
            Job { name: self.state.name, retries: self.retries }
        }
    }

    impl Job {
        pub fn name(&self) -> &str {
            &self.name
        }

        pub fn retries(&self) -> u8 {
            self.retries
        }
    }
}

use jobs::Builder;

fn main() {
    let builder = Builder::new().retries(2);
    let builder = builder.name("export".to_owned())
        .unwrap_or_else(|_| panic!("valid demo name"));
    let job = builder.retries(3).build();

    assert_eq!(job.name(), "export");
    assert_eq!(job.retries(), 3);
}
```

build esiste solo per Named e consuma il builder. name valida a runtime: il typestate garantisce che il passaggio richiesto sia avvenuto, non che qualsiasi stringa sia valida. In caso di errore restituisce il builder precedente con retries conservato; la stringa rifiutata non e restituita.

Ogni valore u8 e ammesso per retries, incluso zero. Job e una configurazione, non esegue un lavoro. Non sono dimostrati retry di rete o scheduling.

Se build deve aprire un file o verificare altre condizioni runtime, puo ancora restituire Result. Con molti campi obbligatori indipendenti gli stati possono crescere rapidamente: valuta un builder runtime con validazione finale. Vedi [[Programmazione/Rust/Pagine/Builder pattern|Builder pattern]].

## Varianti

### Stato statico e scelta runtime

StoredPost nel primo programma contiene i due wrapper e consente una collezione mista. Il match seleziona a runtime il comportamento; dentro ogni ramo torna disponibile il tipo specifico.

`Post<Draft>` e `Post<Published>` non sono automaticamente lo stesso tipo perche condividono la struct generica. Non puoi assegnare il secondo a una variabile del primo tipo, ne unirli direttamente nei rami di un if. Lo shadowing crea un nuovo binding, non modifica il tipo del precedente.

Altre scelte sono una enum con tutti i dati, tipi separati senza parametro generico oppure un trait object che esponga operazioni comuni. Quest'ultimo nasconde informazioni di tipo: non recuperi automaticamente tutte le garanzie degli stati concreti.

### Connessioni e transazioni reali

Un esempio che cambia solo marker e usa println per send **non implementa una connessione**. Una vera transizione Disconnected -> Connected deve eseguire l'operazione, per esempio TcpStream::connect, e conservare la risorsa ottenuta. [TcpStream](https://doc.rust-lang.org/std/net/struct.TcpStream.html#method.connect).

Connected puo attestare che una fase di inizializzazione e riuscita, non che il peer rimarra raggiungibile. Le scritture successive possono fallire. Anche write_all puo restituire un errore dopo aver scritto una parte dei dati: ritentare tutto puo duplicare effetti e richiede un protocollo adatto. [Write::write_all](https://doc.rust-lang.org/std/io/trait.Write.html#method.write_all).

Restituire lo stato precedente in Err e corretto solo se quell'oggetto e ancora utilizzabile secondo il contratto. Dopo effetti esterni parziali puo servire uno stato di errore o di esito incerto; non chiamare rollback il semplice cambio di marker. I demo della nota non verificano rete o database.

### Consumo, abbandono e distruzione

Typestate puo vietare l'uso dopo una transizione, ma non obbliga il chiamante a completare il flusso: puo abbandonare il valore. Rust non e un sistema lineare che imponga una chiamata finale.

Il normale drop rilascia i campi posseduti; non equivale a commit, conferma remota o cleanup asincrono completato. Alcune uscite come mem::forget o l'arresto del processo possono evitare i distruttori. [Destructors](https://doc.rust-lang.org/reference/destructors.html).

Aggiungere Drop al wrapper puo impedire di spostarne direttamente i campi durante la transizione; non basta aggiungere un impl Drop specializzato per un solo parametro di stato. Spesso conviene far gestire la risorsa reale a un campo RAII separato. Non introdurre unsafe solo per conservare la forma del demo. [Drop](https://doc.rust-lang.org/std/ops/trait.Drop.html).

## Errori comuni

I tre frammenti seguenti **non compilano intenzionalmente**. Sono programmi autonomi ridotti al vincolo di tipo; le API complete sono nei demo precedenti.

### Operazione non disponibile nello stato corrente

```rust
use std::marker::PhantomData;

struct Draft;
struct Published;
struct Post<State>(PhantomData<fn() -> State>);

impl Post<Published> {
    fn body(&self) -> &str {
        "Content"
    }
}

fn main() {
    let draft = Post::<Draft>(PhantomData);
    let _ = draft.body();
}
```

E0599: body non e definito per Draft. Nel demo completo bisogna pubblicare e gestire il Result; aggiungere body indiscriminatamente cambierebbe l'API.

### Riutilizzare lo stato consumato

```rust
struct Draft(String);
struct Published(String);

impl Draft {
    fn publish(self) -> Published {
        Published(self.0)
    }
}

fn main() {
    let draft = Draft("Content".to_owned());
    let _published = draft.publish();
    let _old_content = draft.0;
}
```

E0382: publish ha consumato draft. Riutilizza il nuovo valore o quello eventualmente restituito in Err; clonare non e una soluzione neutra per una risorsa esclusiva.

### Unire direttamente stati diversi

```rust
use std::marker::PhantomData;

struct Draft;
struct Published;
struct Post<State>(PhantomData<fn() -> State>);

fn main() {
    let ready = true;
    let _post = if ready {
        Post::<Published>(PhantomData)
    } else {
        Post::<Draft>(PhantomData)
    };
}
```

E0308: i rami devono produrre un tipo comune. Usa una enum come StoredPost o esegui operazioni appropriate separatamente nei due rami.

Altri errori da evitare:

- Campi pubblici, costruttori generici, Default o deserializzazione che saltano le transizioni.
- Confondere marker di capability e autorizzazione effettiva.
- Duplicare handle con Clone senza verificare cosa rappresentano gli stati di ciascuna copia.
- Esporre mutazioni del contenuto che rendano falsa una validazione gia effettuata.
- Promettere costo runtime nullo: dati, controlli e I/O restano reali.
- Modellare ogni combinazione possibile con un numero ingestibile di parametri.

## Checklist

- Quale sequenza invalida viene impedita dal tipo?
- Quali condizioni restano da verificare a runtime?
- La transizione consuma il valore o aggiorna lo stesso stato?
- In caso di errore, quali dati e risorse restano utilizzabili?
- Campi, costruttori e trait possono aggirare il flusso?
- Clone, prestiti e handle condivisi cambiano le garanzie?
- Serve una enum per scelte runtime o collezioni miste?
- L'abbandono del valore e gestito senza confonderlo con una transizione riuscita?

## Collegamenti

- [[Programmazione/Rust/Pagine/Marker types|Marker types]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]
- [[Programmazione/Rust/Pagine/Builder pattern|Builder pattern]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]

## Fonti

- [Rust Book: stati come tipi](https://doc.rust-lang.org/book/ch18-03-oo-design-patterns.html#encoding-states-and-behavior-as-types) e [ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html).
- [Rust Reference: privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html) e [distruttori](https://doc.rust-lang.org/reference/destructors.html).
- [Standard library: PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html), [str::trim](https://doc.rust-lang.org/std/primitive.str.html#method.trim) e [Drop](https://doc.rust-lang.org/std/ops/trait.Drop.html).
- [Standard library: TcpStream](https://doc.rust-lang.org/std/net/struct.TcpStream.html#method.connect) e [Write::write_all](https://doc.rust-lang.org/std/io/trait.Write.html#method.write_all).

Consultate il 2026-11-17. Le fonti online possono avanzare rispetto alla toolchain di prova; nessuna feature nightly utilizzata.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
