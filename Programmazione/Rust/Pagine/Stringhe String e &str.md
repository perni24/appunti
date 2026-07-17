---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, string, str, utf8]
aliases:
  - "String e str"
  - "String vs &str"
  - "String slices"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Slices]]"
related:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
---

# Stringhe String e &str

## Sintesi

In Rust `String` e una stringa posseduta, modificabile e allocata sullo heap. `&str` e una vista presa in prestito su testo UTF-8. La distinzione e centrale: `String` possiede i dati, `&str` li legge senza possederli.

Per le API, spesso conviene accettare `&str` quando si deve solo leggere testo e restituire `String` quando si produce un nuovo testo posseduto.

## Quando usarlo

- Usa `String` quando devi costruire, modificare o conservare testo.
- Usa `&str` quando devi solo leggere testo.
- Usa string literal come `&'static str` per testo noto a compile time.
- Usa `String::from`, `.to_string()` o `.to_owned()` per ottenere testo posseduto.

## Come funziona

`String` e costruita sopra un buffer di byte UTF-8, simile a `Vec<u8>` ma con garanzia di validita UTF-8.

```rust
let mut s = String::from("ciao");
s.push_str(" rust");
```

`&str` e una slice: puntatore piu lunghezza.

```rust
let s = String::from("rust");
let vista: &str = &s;
```

Un literal come `"rust"` ha tipo `&'static str`, perche vive per tutta la durata del programma.

## API / Sintassi

```rust
let a = String::new();
let b = String::from("rust");
let c = "rust".to_string();
let d = "rust".to_owned();
```

Firma flessibile:

```rust
fn saluta(nome: &str) {
    println!("ciao {nome}");
}

saluta("Luca");
saluta(&String::from("Luca"));
```

Costruzione:

```rust
let mut s = String::from("log");
s.push(':');
s.push_str(" ok");
```

## Esempio pratico

```rust
fn slug(titolo: &str) -> String {
    titolo
        .trim()
        .to_lowercase()
        .replace(' ', "-")
}

fn main() {
    let titolo = String::from("  Rust Memory Safety  ");
    let risultato = slug(&titolo);

    println!("{risultato}");
    println!("{titolo}");
}
```

La funzione accetta `&str`, quindi non consuma `titolo`. Restituisce una nuova `String`, perche produce testo posseduto.

## Varianti

- `String`: testo posseduto, heap, modificabile se il binding e `mut`.
- `&str`: testo preso in prestito, non posseduto.
- `Box<str>`: string slice posseduta con dimensione fissa.
- `Cow<'a, str>`: puo essere borrowed o owned, utile per evitare allocazioni quando non necessarie.
- `OsString` e `OsStr`: testo per interfacciarsi con il sistema operativo, non sempre UTF-8.

## Errori comuni

- Usare `String` come parametro quando basta `&str`.
- Tagliare stringhe con indici byte non validi per UTF-8.
- Pensare che `.clone()` su `String` sia gratuito: duplica il buffer.
- Confondere `.to_string()` con una conversione sempre economica.
- Iterare con `.chars()` aspettandosi byte o indici diretti.

## Checklist

- La funzione deve solo leggere testo? Parametro `&str`.
- Deve conservare il testo oltre la chiamata? Serve `String`.
- Deve modificare in place? Serve `&mut String`.
- Stai usando slicing su testo non ASCII? Verifica i boundary UTF-8.
- Stai creando molte stringhe temporanee? Valuta `push_str`, `format!` o buffer riusabili.

## Collegamenti

- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]

