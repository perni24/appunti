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
  - standard-library
aliases:
  - AsRef
  - AsMut
  - Borrow
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Deref Trait]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Path e PathBuf]]"
  - "[[Programmazione/Rust/Pagine/HashMap e HashSet]]"
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
title: AsRef, AsMut e Borrow
---

# AsRef, AsMut e Borrow

## Sintesi

`AsRef<T>` e `AsMut<T>` espongono una vista condivisa o esclusiva di dati gia disponibili. `Borrow<T>` aggiunge un contratto di equivalenza tra il valore e la sua rappresentazione presa in prestito: serve, per esempio, a cercare una chiave `String` in una mappa usando `&str`.

La firma della funzione decide se il chiamante cede ownership. Il fatto che al suo interno venga chiamato `as_ref()` **non rende automaticamente borrowed l'argomento**.

## Quando usarlo

- `AsRef<str>`, `AsRef<[u8]>` o `AsRef<Path>`: accettare rappresentazioni diverse di testo, byte o percorsi senza richiedere una copia.
- `AsMut<[u8]>`: modificare un buffer attraverso una slice, senza dipendere dal contenitore.
- `Borrow<Q>`: algoritmi e collection che devono trattare una vista `Q` come la stessa chiave.
- `&str`, `&[u8]` o `&Path`: spesso sufficienti per helper interni. Un parametro generico non e obbligatorio.

Se serve conservare dati indipendentemente dal chiamante, valuta invece un tipo owned e una conversione come `Into<String>`.

## Come funziona

### Vista e ownership sono due decisioni distinte

Ogni blocco Rust valido in questa nota e un programma autonomo. I due controesempi finali sono intenzionalmente non compilabili.

```rust
fn byte_len<S: AsRef<str>>(value: S) -> usize {
    value.as_ref().len()
}

fn text_view<S: AsRef<str> + ?Sized>(value: &S) -> &str {
    value.as_ref()
}

fn main() {
    let text = String::from("caff\u{e8}");
    assert_eq!(byte_len(&text), 6);
    assert_eq!(text_view(&text), "caff\u{e8}");
    assert_eq!(text_view("rust"), "rust");
    println!("{}", byte_len(text));
}
```

Il programma stampa `6`: `str::len()` conta byte UTF-8, non caratteri percepiti.

- In `byte_len(&text)`, `S` e `&String`; il proprietario rimane al chiamante.
- In `byte_len(text)`, `S` e `String`; la stringa viene spostata e poi distrutta al termine della chiamata.
- `text_view` riceve un prestito. Il riferimento restituito non puo sopravvivere a quel prestito; non e una nuova stringa.
- `?Sized` consente anche `S = str` dietro `&S`; non permette di passare un valore unsized per valore.

Per limitarsi a stampare la lunghezza basta `println!("{}", byte_len(&text))`. Un generico `borrowed_len<T: Borrow<str>>` sarebbe possibile, ma imporrebbe un contratto inutile per una semplice lettura.

### Una vista mutabile non svuota il contenitore

```rust
struct Buffer(Vec<u8>);

impl AsMut<[u8]> for Buffer {
    fn as_mut(&mut self) -> &mut [u8] {
        self.0.as_mut_slice()
    }
}

fn clear_bytes<B: AsMut<[u8]>>(mut bytes: B) {
    bytes.as_mut().fill(0);
}

fn main() {
    let mut buffer = Buffer(vec![10, 20, 30]);
    clear_bytes(&mut buffer);
    assert_eq!(buffer.0, [0, 0, 0]);

    let mut bytes = [4_u8, 5, 6, 7];
    clear_bytes(&mut bytes[1..3]);
    assert_eq!(bytes, [4, 0, 0, 7]);
}
```

`mut bytes` rende mutabile il binding locale, necessario per chiamare `as_mut(&mut self)`. Passare `&mut buffer` conserva il proprietario; passare `buffer` lo sposterebbe.

La slice consente di cambiare gli elementi, non la lunghezza del `Vec`. `fill(0)` azzera i byte esposti, non equivale a `Vec::clear()` e non costituisce una garanzia di cancellazione sicura di segreti.

La vista e economica, ma il riempimento visita gli elementi. Esporre una vista mutabile e corretto solo se le modifiche ammesse non violano gli invarianti del wrapper.

## API / Sintassi

| Trait | Metodo | Contratto e impiego |
| --- | --- | --- |
| `AsRef<T>` | `fn as_ref(&self) -> &T` | Vista condivisa economica e infallibile. |
| `AsMut<T>` | `fn as_mut(&mut self) -> &mut T` | Vista esclusiva economica e infallibile. Non richiede `AsRef<T>`. |
| `Borrow<T>` | `fn borrow(&self) -> &T` | Rappresentazione equivalente del valore; coerenza di confronto e hash. |
| `BorrowMut<T>` | `fn borrow_mut(&mut self) -> &mut T` | Versione mutabile; richiede anche `Borrow<T>`. |

Il target puo essere unsized, per esempio `str` o `[u8]`. `AsRef` e `AsMut` sono nel prelude; per usare i metodi degli altri due trait occorrono gli import da `std::borrow` oppure chiamate qualificate.

Se produrre una vista puo fallire, usa un metodo dedicato con `Option` o `Result`, non un'implementazione di `AsRef` che valida e va in panic.

### Borrow per cercare la stessa chiave in un'altra forma

```rust
use std::borrow::Borrow;
use std::collections::{BTreeMap, HashMap};

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
struct UserName(String);

impl Borrow<str> for UserName {
    fn borrow(&self) -> &str {
        self.0.as_str()
    }
}

fn main() {
    let plain = HashMap::from([(String::from("ada"), 7)]);
    assert_eq!(plain.get("ada"), Some(&7));

    let users = HashMap::from([(UserName(String::from("ada")), 7)]);
    assert_eq!(users.get("ada"), Some(&7));
    assert_eq!(users.get("ADA"), None);

    let ordered = BTreeMap::from([(UserName(String::from("ada")), 7)]);
    assert_eq!(ordered.get("ada"), Some(&7));
}
```

Il wrapper contiene un solo campo e usa il confronto e l'hash derivati da quella stringa, senza normalizzazioni. La vista `str` ha quindi la stessa identita della chiave.

Per `HashMap<K, V>::get<Q>(&Q)` servono `K: Borrow<Q>` e `Q: Hash + Eq + ?Sized`. Qui `Q = str`: non e necessario costruire una `String` solo per cercare. L'hashing del testo resta comunque lavoro da svolgere.

`Borrow` non ha `Eq`, `Ord` o `Hash` come supertrait. Il suo contratto richiede pero che, quando presenti, queste operazioni siano coerenti fra valore e vista. Una mappa ordinata dipende dall'ordine, una hash map da uguaglianza e hash; il compilatore non dimostra questa coerenza.

### AsRef per una parte che non identifica tutto il valore

```rust
#[derive(Debug, PartialEq, Eq, Hash)]
struct Account {
    id: u32,
    name: String,
}

impl AsRef<str> for Account {
    fn as_ref(&self) -> &str {
        self.name.as_str()
    }
}

fn main() {
    let first = Account { id: 1, name: String::from("ada") };
    let second = Account { id: 2, name: String::from("ada") };

    assert_eq!(first.as_ref(), second.as_ref());
    assert_ne!(first, second);
}
```

Qui implementare `Borrow<str>` sul nome sarebbe scorretto: due viste uguali corrispondono a valori diversi. `AsRef` e adatto per leggere quel campo, ma **non abilita il lookup per nome in una `HashMap<Account, V>`**. Per cercare per nome serve un indice con una chiave progettata per quello scopo.

Lo stesso problema si presenta con una chiave case-insensitive che pretendesse di essere `Borrow<str>`: il normale confronto di `str` distingue maiuscole e minuscole.

## Esempio pratico

### Controllare un'estensione senza convertire il percorso in testo

```rust
use std::ffi::OsStr;
use std::path::{Path, PathBuf};

fn has_extension<P: AsRef<Path>>(path: P, ext: &str) -> bool {
    path.as_ref().extension() == Some(OsStr::new(ext))
}

fn main() {
    let path = PathBuf::from("src/main.rs");
    assert!(has_extension(&path, "rs"));
    assert!(has_extension(String::from("src/main.rs"), "rs"));
    assert!(has_extension(Path::new("archive.tar.gz"), "gz"));
    assert!(!has_extension("README.RS", "rs"));
    assert!(!has_extension(".gitignore", "gitignore"));
    assert!(has_extension("report.", ""));
}
```

`ext` non include il punto. Il confronto e esatto e case-sensitive, anche su un filesystem che ignora il case. Si considera l'ultimo punto del nome: `archive.tar.gz` ha estensione `gz`; un dotfile senza altri punti non ha estensione; un punto finale produce un'estensione vuota.

`extension()` restituisce `Option<&OsStr>`: non richiede che l'intero percorso sia UTF-8. La precedente forma `extension().and_then(|e| e.to_str())` aggiunge invece un controllo Unicode dell'estensione, non necessario per questo confronto. Per accettare anche un'estensione di confronto non Unicode, cambia il parametro `ext` in `&OsStr`.

E un controllo lessicale: non verifica esistenza, tipo del file, contenuto, MIME, permessi o sicurezza del percorso. La sintassi dei percorsi resta dipendente dalla piattaforma.

### Leggere testo da un percorso scelto esplicitamente

```rust
use std::io;
use std::path::{Path, PathBuf};

fn read_path<P: AsRef<Path>>(path: P) -> io::Result<String> {
    std::fs::read_to_string(path)
}

fn main() -> io::Result<()> {
    if let Some(path) = std::env::args_os().nth(1) {
        let text = read_path(PathBuf::from(path))?;
        print!("{text}");
    }
    Ok(())
}
```

Senza argomenti non legge file. Con un primo argomento legge quel percorso e stampa il contenuto; i percorsi relativi dipendono dalla directory corrente. `args_os()` conserva anche percorsi non Unicode.

Il wrapper serve a mostrare la firma: `std::fs::read_to_string` accetta gia `AsRef<Path>`. La vista del percorso non alloca una copia, ma la lettura produce una `String` e carica tutto il file in memoria. File mancante, errori di accesso e contenuto non UTF-8 rimangono errori I/O: `AsRef` non li elimina.

Per file grandi, sorgenti non fidate o dati binari scegli limiti e API di lettura adeguati; questo esempio non e un lettore universale o un controllo di accesso.

## Varianti

- **`BorrowMut<T>`**: prestito mutabile con lo stesso contratto di `Borrow<T>`. Non sostituisce `AsMut` per una proiezione arbitraria.
- **`Deref<Target = T>`**: comportamento da puntatore e coercizioni; non genera automaticamente implementazioni di `AsRef<T>`.
- **`Into<T>`**: conversione per valore. Non implica che il risultato sia un riferimento o che la conversione sia senza allocazioni.
- **Metodi omonimi**: `Option::as_ref()` e `Result::as_ref()` sono metodi propri dei contenitori, non prove di un bound `AsRef`.
- **Riflessivita**: `T: Borrow<T>` e disponibile per tutti i `T: ?Sized`; `T: AsRef<T>` e `T: AsMut<T>` non sono universali. Per un tipo locale puoi aggiungere l'implementazione opportuna.
- **Riferimenti e inoltro**: le implementazioni standard di `AsRef` inoltrano dai riferimenti e quelle di `AsMut` dai riferimenti mutabili. Non dedurre da questo una transitivita generale fra wrapper o trait.

Per un target ambiguo, annota il risultato, per esempio `let bytes: &[u8] = text.as_ref();`. Per una vista `Borrow` usa `let view: &str = text.borrow();` con il relativo import.

Un ulteriore limite dell'inoltro: `String: Borrow<str>` non implica `&String: Borrow<str>`. Un helper per valore con quel bound accetta `text.as_str()` oppure `text`, non necessariamente `&text`. In `map.get("ada")`, invece, il bound `Borrow` riguarda il tipo della chiave memorizzata, non il riferimento passato come query.

## Errori comuni

### Una coercizione non soddisfa automaticamente un bound

Controesempio, **non compila** (`E0277` nella baseline indicata).

```rust
fn byte_len<S: AsRef<str>>(value: S) -> usize {
    value.as_ref().len()
}

fn main() {
    let boxed = Box::new(String::from("rust"));
    let view: &str = &boxed;
    assert_eq!(view.len(), 4);
    byte_len(boxed);
}
```

`Box<String>` offre `AsRef<String>`, non automaticamente `AsRef<str>`. La coercizione verso `&str` funziona nel punto con tipo atteso, mentre il bound viene verificato sul tipo effettivo dell'argomento. Usa `byte_len(view)` oppure `byte_len(boxed.as_str())`.

### Il riferimento non puo uscire dal proprietario locale

Controesempio, **non compila** (`E0515` nella baseline indicata).

```rust
fn invalid_view<S: AsRef<str>>(value: S) -> &'static str {
    value.as_ref()
}

fn main() {}
```

`value` viene distrutto al ritorno. Scrivere `'static` non prolunga la vita dei suoi dati: usa la firma borrowed di `text_view` oppure restituisci un valore owned.

Altri errori da evitare:

- Passare una `String` per valore e usarla ancora dopo la chiamata; passa un riferimento se vuoi conservarla.
- Usare `Borrow` per estrarre un campo che non conserva l'identita della chiave.
- Credere che `AsMut` dia accesso mutabile da un semplice `&T`.
- Confondere azzeramento degli elementi, svuotamento del contenitore e cancellazione sicura.
- Interpretare `AsRef<Path>` come validazione del percorso o assenza di errori I/O.

## Checklist

- Serve un prestito o un risultato che possiede i dati?
- Il parametro generico e per valore o per riferimento?
- Il riferimento restituito resta entro la vita del proprietario?
- Serve davvero l'equivalenza di `Borrow`, oppure basta una vista?
- Uguaglianza, ordine e hash sono coerenti tra chiave e rappresentazione?
- Le modifiche attraverso `AsMut` rispettano gli invarianti?
- Sono separati costo della vista, elaborazione dei dati ed eventuale I/O?
- Un parametro concreto renderebbe l'API piu semplice?

## Collegamenti

- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From, Into, TryFrom e TryInto]]
- [[Programmazione/Rust/Pagine/Blanket implementations|Blanket implementations]]
- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]

## Fonti

Baseline degli esempi: Rust **1.99.1**, edition **2024**; documentazione consultata il **2026-11-05**. I link standard seguono la versione corrente, non costituiscono un vincolo di MSRV.

- [AsRef: contratto, inoltro e riflessivita](https://doc.rust-lang.org/std/convert/trait.AsRef.html).
- [AsMut: contratto e implementazioni](https://doc.rust-lang.org/std/convert/trait.AsMut.html).
- [Borrow: equivalenza e collection](https://doc.rust-lang.org/std/borrow/trait.Borrow.html).
- [BorrowMut: supertrait e prestito mutabile](https://doc.rust-lang.org/std/borrow/trait.BorrowMut.html).
- [HashMap::get: chiave posseduta e query borrowed](https://doc.rust-lang.org/std/collections/struct.HashMap.html#method.get).
- [Path::extension: estensione e casi limite](https://doc.rust-lang.org/std/path/struct.Path.html#method.extension).
- [read_to_string: contenuto UTF-8 ed errori](https://doc.rust-lang.org/std/fs/fn.read_to_string.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
