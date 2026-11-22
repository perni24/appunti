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
  - string
  - str
  - utf8
aliases:
  - String e str
  - String vs &str
  - String slices
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Slices]]"
related:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
title: Stringhe String e &str
---

# Stringhe String e &str

## Sintesi

`String` possiede testo UTF-8 e puo crescere; `&str` prende in prestito una vista su testo UTF-8 gia esistente. La prima gestisce il buffer, la seconda non ne prolunga la vita.

Per leggere testo, un parametro `&str` e spesso sufficiente. Per produrre testo indipendente dall'input, restituisci `String`. Gli esempi sono programmi autonomi verificati con Rust **1.99.1**, edition **2024**.

## Quando usarlo

- `&str`: leggere un literal, una String o una sua porzione senza copiarla.
- `String`: costruire testo o trasferirne la proprieta.
- `&mut String`: modificare il buffer del chiamante, anche cambiando lunghezza.
- `&mut str`: modifiche consentite dalla sua API, senza ridimensionare il testo.

Conservare testo oltre una chiamata non obbliga sempre a copiarlo: si puo conservare un riferimento se il proprietario vive abbastanza e il tipo esprime quel lifetime. Una String elimina quella dipendenza dall'input, non ogni possibile costo.

## Come funziona

`str` e un tipo a dimensione dinamica, normalmente usato dietro un riferimento. `&str` contiene puntatore e lunghezza in **byte**. Un literal ha tipo `&'static str`; una vista su una String locale non diventa static.

String gestisce puntatore, lunghezza e capacita di un buffer separato. `String::new()` non alloca finche non serve spazio. Dove risiedono i metadati dipende dal contenitore: non sono necessariamente sullo stack.

Il testo deve restare UTF-8 valido. Un byte, un valore scalare Unicode (`char`) e un grafema percepito dall'utente non sono la stessa unita. Non esiste indicizzazione `text[0]` per ottenere il primo carattere.

## API / Sintassi

### Creare e modificare testo

```rust
fn main() {
    let empty = String::new();
    assert!(empty.is_empty());
    assert_eq!(empty.capacity(), 0);

    let mut text = String::from("log");
    text.push(':');
    text.push_str(" ok");
    assert_eq!(text, "log: ok");

    let copied = "rust".to_owned();
    let formatted = 42.to_string();
    assert_eq!(copied, "rust");
    assert_eq!(formatted, "42");
}
```

`push` aggiunge un char, `push_str` copia il testo ricevuto nel buffer. `to_owned` su str crea testo posseduto; `to_string` usa Display, anche per numeri. Non sono operazioni genericamente gratuite.

### Leggere senza consumare

```rust
fn byte_len(text: &str) -> usize {
    text.len()
}

fn main() {
    let name = String::from("Luca");
    assert_eq!(byte_len(&name), 4);
    assert_eq!(byte_len("Ada"), 3);
    assert_eq!(byte_len(name.as_str()), 4);
    assert_eq!(name, "Luca");
}
```

La coercizione da `&String` a `&str` evita di imporre un contenitore specifico all'API. Il parametro non possiede name.

### Concatenare e formattare

```rust
fn main() {
    let prefix = String::from("log");
    let suffix = String::from(": ok");
    let joined = prefix + &suffix;
    assert_eq!(joined, "log: ok");
    assert_eq!(suffix, ": ok");

    let summary = format!("{joined} ({})", suffix.len());
    assert_eq!(summary, "log: ok (4)");
    assert_eq!(joined, "log: ok");
}
```

`+` consuma la String a sinistra e prende in prestito il testo a destra. `format!` produce una nuova String senza consumare questi argomenti; non promette riuso del buffer.

### Byte, valori scalari e intervalli

```rust
fn main() {
    let text = "caff\u{00E8}";
    assert_eq!(text.len(), 6);
    assert_eq!(text.chars().count(), 5);
    assert_eq!(text.chars().next(), Some('c'));
    assert_eq!(text.get(4..6), Some("\u{00E8}"));
    assert_eq!(text.get(0..5), None);
    assert_eq!(text.char_indices().last(), Some((4, '\u{00E8}')));

    let decomposed = "e\u{0301}";
    assert_eq!(decomposed.chars().count(), 2);
}
```

Gli intervalli sono in byte e devono rispettare i confini UTF-8. `get` restituisce None per limiti invalidi; lo slicing con parentesi quadre genera panic. Anche chars conta valori scalari, non grafemi; `chars().nth(n)` percorre la sequenza, non e un accesso casuale a costo costante.

### Convertire byte in testo

```rust
fn main() {
    let bytes = vec![0x63, 0x61, 0x66, 0x66, 0xC3, 0xA8];
    let text = String::from_utf8(bytes).expect("UTF-8 valido nel demo");
    assert_eq!(text, "caff\u{00E8}");

    let invalid = vec![0xFF];
    let error = String::from_utf8(invalid).unwrap_err();
    assert_eq!(error.into_bytes(), vec![0xFF]);
    assert_eq!(String::from_utf8_lossy(&[0xFF]), "\u{FFFD}");
}
```

from_utf8 valida il vettore consumato; in caso di errore i byte sono recuperabili. La variante lossy sostituisce sequenze invalide e restituisce Cow: non usarla quando e necessario conservare esattamente il contenuto. Per validare byte in prestito esiste `std::str::from_utf8`.

## Esempio pratico

### Trasformazione semplice di un titolo

```rust
fn slug(title: &str) -> String {
    title.trim().to_lowercase().replace(' ', "-")
}

fn main() {
    let title = String::from("  Rust Memory Safety  ");
    let result = slug(&title);
    assert_eq!(result, "rust-memory-safety");
    assert_eq!(title, "  Rust Memory Safety  ");
    assert_eq!(slug(""), "");
}
```

Il nome slug e didattico: la funzione sostituisce soltanto lo spazio ASCII interno, non tab o tutti gli spazi Unicode. Spazi ripetuti producono trattini ripetuti; punteggiatura e slash restano. Non garantisce URL sicuri, unicita, traslitterazione o normalizzazione Unicode. Le trasformazioni producono String intermedie: non e un algoritmo senza allocazioni.

## Varianti

### Testo posseduto o preso in prestito

```rust
use std::borrow::Cow;

fn main() {
    let mut text: Cow<'_, str> = Cow::Borrowed("rust");
    assert!(matches!(&text, Cow::Borrowed(_)));
    text.to_mut().push('!');
    assert!(matches!(&text, Cow::Owned(_)));
    assert_eq!(text, "rust!");

    let mut fixed: Box<str> = String::from("rust").into_boxed_str();
    fixed.make_ascii_uppercase();
    assert_eq!(&*fixed, "RUST");
}
```

Cow conserva una vista oppure una String; to_mut materializza la forma posseduta quando parte da borrowed. Box<str> possiede testo di lunghezza fissa, ma non significa contenuto immutabile. OsString/OsStr servono per rappresentazioni del sistema operativo, non necessariamente UTF-8; non sono sostituti universali di String/str.

## Errori comuni

- Clonare una String quando e sufficiente un prestito; il clone rende indipendente il testo ma puo allocare.
- Trattare len come numero di caratteri visuali.
- Usare indici da input esterno senza controllare limiti e confini.
- Restituire una vista su testo creato localmente.
- Scambiare lowercase per confronto Unicode completo o normalizzazione.
- Presumere che una vista rimanga utilizzabile mentre si modifica la String sottostante.

## Checklist

- Serve leggere, modificare o trasferire proprieta?
- Il testo in prestito vive abbastanza per l'uso previsto?
- Le posizioni sono byte, valori scalari o grafemi?
- I byte esterni sono validati? E accettabile una conversione lossy?
- La trasformazione ha limiti espliciti e casi vuoti gestiti?
- Se il costo conta, misura allocazioni e lavoro sul testo anziche dedurli dal nome del metodo.

## Collegamenti

- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]
- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]

## Fonti

- [Rust Book: Strings](https://doc.rust-lang.org/book/ch08-02-strings.html).
- [Standard library: String](https://doc.rust-lang.org/std/string/struct.String.html).
- [Standard library: str](https://doc.rust-lang.org/std/primitive.str.html).
- [Standard library: Cow](https://doc.rust-lang.org/std/borrow/enum.Cow.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
