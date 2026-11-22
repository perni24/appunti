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
  - lifetimes
aliases:
  - Elision dei lifetime
  - Lifetime elision rules
prerequisites:
  - "[[Programmazione/Rust/Pagine/Lifetime impliciti]]"
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetimes nelle struct]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nei trait]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
title: Lifetime elision
---

# Lifetime elision

## Sintesi

La **lifetime elision** permette di omettere annotazioni nelle firme quando regole definite determinano il contratto dei prestiti. Non significa che Rust legga il corpo della funzione per indovinare da quale argomento deriva il risultato.

L'elision riduce la sintassi, non i vincoli: un riferimento restituito non puo diventare utilizzabile oltre la validita dei dati. Qui gli esempi sono verificati con Rust **1.99.1**, edition **2024**: nove programmi, di cui tre intenzionalmente non compilabili nella sezione Errori comuni.

## Quando usarlo

- Per leggere firme come `fn first_word(text: &str) -> &str`.
- Per restituire viste sui dati di un oggetto tramite `&self` o `&mut self`.
- Per evitare annotazioni ridondanti senza nascondere prestiti importanti.
- Per capire quando servono lifetime espliciti e quando invece il problema e l'ownership.
- Per distinguere le regole delle funzioni dai default dei trait object.

## Come funziona

### Le regole delle firme

1. Ogni lifetime eliso negli input diventa un parametro lifetime distinto.
2. Nel caso standard con **una sola posizione lifetime negli input**, elisa o esplicita, quel lifetime viene assegnato agli output elisi.
3. Nei metodi con receiver `&Self` o `&mut Self`, il lifetime di quel riferimento a `self` determina gli output elisi.
4. Se nessuna regola determina un lifetime di output, ometterlo e un errore.

Si considerano le **posizioni lifetime negli input**, non i soli argomenti: un parametro tupla `(&str, &str)` contiene due lifetime elisi. Le formulazioni sintetiche della regola non vanno lette come "basta contare i nomi distinti": nella verifica con Rust 1.99.1, `fn choose<'a>(a: &'a str, b: &'a str) -> &str` viene rifiutata con E0106 anche se i due input nominano entrambi `'a`. Scrivere `-> &'a str` rende la firma valida. Questo caso e verificato separatamente dai nove programmi mostrati sotto.

Un parametro numerico come `limit: usize` non aggiunge lifetime. Un output posseduto come `usize` o `String` non richiede una relazione di prestito da elidere.

### Elision e analisi del corpo non sono la stessa cosa

La firma viene interpretata prima di controllare che il corpo ne rispetti il contratto. Nei corpi, invece, il borrow checker considera gli usi effettivi e puo far terminare un prestito prima dello scope del nome.

Scrivere lifetime espliciti equivalenti non cambia gli accessi consentiti. Anche il nome del parametro e irrilevante: chiamarlo `source` o `result` non suggerisce al compilatore una relazione diversa.

## API / Sintassi

### Un input, due firme equivalenti

```rust
fn first_word(text: &str) -> &str {
    text.split_whitespace().next().unwrap_or("")
}

fn first_word_explicit<'a>(text: &'a str) -> &'a str {
    text.split_whitespace().next().unwrap_or("")
}

fn main() {
    let input = String::from("  Rust lifetimes ");
    assert_eq!(first_word(&input), "Rust");
    assert_eq!(first_word(&input), first_word_explicit(&input));
    assert_eq!(first_word(" \t\n"), "");
}
```

La divisione usa whitespace Unicode, non soltanto lo spazio ASCII; non e un'analisi linguistica delle parole. Il risultato e una slice, non una nuova String. Il literal vuoto del fallback non rende static il contratto della funzione: l'output resta legato all'input.

### Il receiver prevale sugli altri riferimenti

```rust
struct Buffer {
    text: String,
}

impl Buffer {
    fn as_str(&self) -> &str {
        &self.text
    }

    fn replace_text(&mut self, input: &str) -> &str {
        self.text.clear();
        self.text.push_str(input);
        &self.text
    }
}

fn main() {
    let mut buffer = Buffer { text: String::from("prima") };
    assert_eq!(buffer.as_str(), "prima");

    let result;
    {
        let replacement = String::from("dopo");
        result = buffer.replace_text(&replacement);
    }
    assert_eq!(result, "dopo");
    assert_eq!(buffer.as_str(), "dopo");
}
```

`replace_text` equivale a `fn replace_text<'s, 'i>(&'s mut self, input: &'i str) -> &'s str`. Il risultato dipende da `buffer`, non dalla String temporanea, perche il metodo copia il contenuto nel proprio buffer e ne restituisce una vista.

La copia puo richiedere allocazioni; non deriva dall'elision. Finche il risultato e ancora usato, non puoi chiamare di nuovo un metodo che richiede `&mut self` sullo stesso buffer. Non basta che il testo restituito sia identico.

### Placeholder nei riferimenti e nei percorsi di tipo

```rust
struct View<'a> {
    text: &'a str,
}

fn view(text: &'_ str) -> View<'_> {
    View { text }
}

fn main() {
    let owner = String::from("vista");
    let borrowed = view(&owner);
    assert_eq!(borrowed.text, "vista");
}
```

Qui `'_` chiede l'inferenza secondo le regole di elision. Con un solo input, la firma equivale a `fn view<'a>(text: &'a str) -> View<'a>`. Scrivere `View<'_>` rende visibile il prestito nel tipo restituito.

Ripetere `'_` in due input **non** dichiara un parametro condiviso come `'a`. Inoltre l'elision delle funzioni non permette di dichiarare il campo della struct semplicemente come `text: &str` senza una durata esplicita appropriata.

## Esempio pratico

### Estensione di un percorso e frammento di un indirizzo

```rust
use std::ffi::OsStr;
use std::path::Path;

fn extension(path: &Path) -> Option<&OsStr> {
    path.extension()
}

struct User {
    email: String,
}

impl User {
    fn domain_fragment(&self) -> Option<&str> {
        self.email.split_once('@').map(|(_, suffix)| suffix)
    }
}

fn main() {
    assert_eq!(extension(Path::new("notes.v1/README")), None);
    assert_eq!(extension(Path::new(".env")), None);
    assert_eq!(extension(Path::new("archive.tar.gz")), Some(OsStr::new("gz")));
    assert_eq!(extension(Path::new("file.")), Some(OsStr::new("")));

    let user = User { email: String::from("user@example.test") };
    assert_eq!(user.domain_fragment(), Some("example.test"));

    let malformed = User { email: String::from("user@@example.test") };
    assert_eq!(malformed.domain_fragment(), Some("@example.test"));
}
```

`extension` equivale a `fn extension<'a>(path: &'a Path) -> Option<&'a OsStr>`: `Option` non elimina il prestito. La variante con `rsplit_once('.')` sull'intero testo sbagliava il caso `notes.v1/README` e trattava male i dotfile.

`Path::extension` considera il nome finale del percorso, non accede al filesystem e non verifica esistenza o tipo del file. Segue la sintassi dei percorsi della piattaforma, non quella degli URL. Un suffisso non certifica il formato del contenuto.

Il risultato e `OsStr`, perche un nome del sistema operativo non e necessariamente rappresentabile come `str`. `to_str()` restituisce `Option<&str>`: concatenare `extension(path).and_then(OsStr::to_str)` confonde nel solo `None` estensione assente e testo non rappresentabile. Mantieni distinti i casi se interessano all'applicazione.

`domain_fragment` dimostra il legame con il receiver: prende solo cio che segue il primo `@`. Non valida email o dominio, non normalizza e non verifica DNS. `"user@"` produce `Some("")`; un testo senza `@` produce `None`. Non usarlo come controllo di sicurezza o di validita.

## Varianti

### Trait object: un default diverso dall'elision della funzione

```rust
use std::fmt::Display;

fn boxed(text: &str) -> Box<dyn Display + '_> {
    Box::new(text)
}

fn borrowed(text: &String) -> &dyn Display {
    text
}

fn main() {
    let text = String::from("locale");
    let object = boxed(&text);
    assert_eq!(object.to_string(), "locale");
    assert_eq!(borrowed(&text).to_string(), "locale");
}
```

Nella firma di `boxed`, `'_` lega il bound del trait object all'input. Senza `+ '_`, `Box<dyn Display>` in quella posizione assume `'static` e il corpo non puo contenere il prestito generico di `text`. **Box possiede il riferimento, non la String a cui esso punta.**

Per `&dyn Display` il riferimento contenitore fornisce il bound pertinente. Non applicare automaticamente il default di Box a tutti i contesti, soprattutto alle espressioni dove il lifetime puo essere inferito. I dettagli sono nella nota sui trait object.

### Tipi di funzione e callable

```rust
type Transform = fn(&str) -> &str;

fn trimmed(text: &str) -> &str {
    text.trim()
}

fn main() {
    let transform: Transform = trimmed;
    let first = String::from(" primo ");
    assert_eq!(transform(&first), "primo");
    {
        let second = String::from(" secondo ");
        assert_eq!(transform(&second), "secondo");
    }
}
```

`Transform` equivale a `for<'a> fn(&'a str) -> &'a str`, non a una funzione limitata agli input static. Ciascuna chiamata puo usare un prestito differente. Le firme dei trait callable come `Fn(&str) -> &str` seguono regole analoghe; la relazione con HRTB e sviluppata nella nota dedicata.

Non estendere questa equivalenza a ogni closure isolata: nella baseline, `let identity = |x: &str| -> &str { x };` non compila. Il contesto del tipo atteso puo cambiare l'inferenza; per la closure senza catture `let identity: fn(&str) -> &str = |x| x;` esprime un contratto valido. La distinzione e documentata anche nell'issue Rust #86921.

I lifetime dei riferimenti in dichiarazioni `const` e `static` hanno invece default specifici: per esempio `const LABEL: &str = "pronto";`. Questo non autorizza una funzione senza input a restituire `&str` senza annotazione.

## Errori comuni

### Due input non collegati e output ambiguo

Questo programma **non compila** (E0106), anche se restituisce sempre `first`:

```rust
fn choose(first: &str, _second: &str) -> &str {
    first
}

fn main() {}
```

La correzione coerente con questo corpo e `fn choose<'a>(first: &'a str, _second: &str) -> &'a str`. Se il corpo puo restituire entrambi gli input, serve un contratto diverso, come quello mostrato in Lifetime annotations.

### Restituire un altro input con il contratto del receiver

Questo programma **non compila**: la diagnostica segnala `lifetime may not live long enough`.

```rust
struct Service;

impl Service {
    fn echo(&self, input: &str) -> &str {
        input
    }
}

fn main() {}
```

L'output eliso e vincolato a `self`, ma il corpo restituisce `input`. Scrivi `fn echo<'a>(&self, input: &'a str) -> &'a str` per esprimere la relazione reale. L'annotazione sul receiver non e la soluzione a ogni errore di lifetime.

### Nessun input da cui ricavare il lifetime

Questo programma **non compila** (E0106), anche se restituisce un literal:

```rust
fn label() -> &str {
    "pronto"
}

fn main() {}
```

Per quel literal la firma corretta e `fn label() -> &'static str`. Per testo costruito dentro la funzione, normalmente restituisci `String`: l'elision non conserva una variabile locale dopo il ritorno.

Altri errori:

- Contare gli argomenti invece dei lifetime contenuti nei loro tipi.
- Credere che una annotazione dichiarata nell'header di `impl` sia automaticamente il lifetime di ogni output eliso del metodo.
- Pensare che elision permetta mutazioni mentre una vista e ancora utilizzata.
- Confondere il default di un trait object con le regole di input e output delle funzioni.

## Checklist

- Quali lifetime elisi compaiono nei tipi degli input?
- C'e un solo lifetime candidato per l'elision, oppure serve nominare esplicitamente quello del risultato?
- Il receiver e `&self` o `&mut self`?
- L'output prende in prestito dati o li possiede?
- La firma elisa descrive davvero il riferimento restituito dal corpo?
- `'_` chiarisce un prestito, oppure sto cercando di usarlo come un nome?
- Un eventuale `dyn Trait` richiede di controllare anche il suo object lifetime bound?
- Il programma e corretto anche quando gli input hanno scope diversi?

## Collegamenti

- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]

## Fonti

- [Rust Reference: Lifetime elision, object bounds e const/static](https://doc.rust-lang.org/reference/lifetime-elision.html).
- [Rust Book: Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html).
- [Rustonomicon: Lifetime Elision](https://doc.rust-lang.org/nomicon/lifetime-elision.html).
- [Rust By Example: Elision](https://doc.rust-lang.org/rust-by-example/scope/lifetime/elision.html).
- [Standard library: Path::extension](https://doc.rust-lang.org/std/path/struct.Path.html#method.extension).
- [Standard library: OsStr::to_str](https://doc.rust-lang.org/std/ffi/struct.OsStr.html#method.to_str).
- [Standard library: str](https://doc.rust-lang.org/std/primitive.str.html).
- [Rust error codes: E0106](https://doc.rust-lang.org/error_codes/E0106.html).
- [Rust issue #86921: differenze di elision tra funzioni e closure](https://github.com/rust-lang/rust/issues/86921).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
