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
  - lifetimes
  - borrowing
aliases:
  - Lifetimes impliciti
  - Lifetime elision base
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Lifetime elision]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nelle struct]]"
title: Lifetime impliciti
---

# Lifetime impliciti

## Sintesi

Ogni riferimento ha vincoli di validita: il dato deve esistere e gli accessi devono rispettare i prestiti. Spesso non si scrivono annotazioni. Bisogna pero distinguere **inferenza nei corpi delle funzioni** e **regole di elision nelle firme**.

L'elision non analizza il corpo per indovinare quale parametro venga restituito: applica regole alla firma. Non estende la vita dei dati. Gli esempi sono verificati con Rust **1.99.1**, edition **2024**; i due controesempi non compilabili sono indicati.

## Quando usarlo

- Per leggere firme che ricevono o restituiscono riferimenti senza annotazioni.
- Per capire quando il risultato dipende dalla durata di un input.
- Per distinguere un contratto ambiguo da un riferimento a dati gia distrutti.
- Come introduzione: i casi avanzati restano nelle note su Lifetime annotations ed elision.

## Come funziona

Nelle firme comuni ogni lifetime eliso di input e inizialmente distinto. Se c'e un solo lifetime di input, esso viene assegnato agli output elisi. Nei metodi con receiver &self o &mut self, gli output elisi vengono legati al lifetime del receiver.

Sono regole del contratto, non una ricerca dell'input "piu probabile" nel corpo. Due &str di input non impediscono una funzione che restituisce usize; l'ambiguita nasce quando un output in prestito non ha una relazione determinata dalle regole.

Dentro una funzione, l'analisi dei prestiti considera il flusso degli usi. Un prestito puo terminare prima dello scope lessicale del binding, ma questo non distrugge anticipatamente il proprietario e non autorizza un riferimento a sopravvivergli.

## API / Sintassi

### Un input e una vista restituita

```rust
fn first_scalar(text: &str) -> Option<&str> {
    let first = text.chars().next()?;
    text.get(..first.len_utf8())
}

fn main() {
    assert_eq!(first_scalar("rust"), Some("r"));
    assert_eq!(first_scalar("\u{00E8}ra"), Some("\u{00E8}"));
    assert_eq!(first_scalar(""), None);
}
```

La firma equivale a `fn first_scalar<'a>(text: &'a str) -> Option<&'a str>`. Il risultato e una vista sul primo **valore scalare**, non necessariamente sul primo grafema completo. A differenza di &text[..1], il demo gestisce vuoto e UTF-8 multibyte senza tagliare una codifica.

### Piu input senza output in prestito

```rust
fn total_bytes(first: &str, second: &str) -> Option<usize> {
    first.len().checked_add(second.len())
}

fn main() {
    assert_eq!(total_bytes("ab", "c"), Some(3));
    assert_eq!(total_bytes("", ""), Some(0));
}
```

I due input non devono avere la stessa durata. Il risultato e un numero posseduto e non mantiene alcun prestito. checked_add rende esplicito l'eventuale overflow della somma.

### Metodo con receiver

```rust
struct Buffer {
    text: String,
}

impl Buffer {
    fn as_str(&self) -> &str {
        &self.text
    }

    fn view_with_label(&self, _label: &str) -> &str {
        &self.text
    }
}

fn main() {
    let buffer = Buffer { text: String::from("rust") };
    let view;
    {
        let label = String::from("preview");
        view = buffer.view_with_label(&label);
    }
    assert_eq!(view, "rust");
    assert_eq!(buffer.as_str(), "rust");
}
```

Il risultato e legato al prestito di buffer, non a label. Restituire \_label con la stessa firma non funzionerebbe per durate generiche: servirebbe un contratto esplicito diverso. Non e soltanto una convenzione "spesso" applicata ai metodi.

## Esempio pratico

### Prima parola senza copiare

```rust
fn first_word(text: &str) -> &str {
    text.split_whitespace().next().unwrap_or("")
}

fn main() {
    let mut sentence = String::from("  rust ownership  ");
    let word = first_word(&sentence);
    assert_eq!(word, "rust");
    sentence.push('!');
    assert_eq!(sentence, "  rust ownership  !");
    assert_eq!(first_word(" \t\n"), "");
}
```

Qui parola significa sequenza delimitata da whitespace Unicode, non analisi linguistica: la punteggiatura resta. In assenza di parole viene restituito il literal vuoto. Il contratto resta comunque legato all'input; il chiamante non puo trattare un risultato vuoto come static in base al ramo eseguito.

Push e ammesso dopo l'ultimo uso di word; usare word anche dopo push introdurrebbe un conflitto. Non basta dire che word "vive quanto sentence": contano anche gli accessi incompatibili mentre il prestito serve.

## Varianti

### Due input e output ambiguo

Questo programma **non compila** (E0106), anche se il corpo restituisce sempre first:

```rust
fn choose(first: &str, _second: &str) -> &str {
    first
}

fn main() {}
```

### Legare il risultato a un input specifico

```rust
fn choose<'a>(first: &'a str, _second: &str) -> &'a str {
    first
}

fn main() {
    let owner = String::from("persistente");
    let result;
    {
        let temporary = String::from("temporaneo");
        result = choose(&owner, &temporary);
    }
    assert_eq!(result, "persistente");
}
```

La firma lega soltanto first al risultato; second mantiene un lifetime indipendente. Se l'algoritmo potesse restituire uno qualsiasi dei due input, occorrerebbe esprimere quel diverso vincolo. Le annotazioni non obbligano i due proprietari a essere distrutti nello stesso istante.

### Un riferimento locale resta invalido

Questo programma **non compila** (E0515), nonostante l'annotazione esplicita:

```rust
fn invalid<'a>() -> &'a str {
    let text = String::from("locale");
    &text
}

fn main() {}
```

### Restituire proprieta oppure un literal static

```rust
fn build_message() -> String {
    String::from("nuovo testo")
}

fn label() -> &'static str {
    "pronto"
}

fn main() {
    let message = build_message();
    assert_eq!(message, "nuovo testo");
    assert_eq!(label(), "pronto");
}
```

Nel primo caso il valore esce dalla funzione tramite move. Nel secondo i byte del literal sono disponibili per tutta l'esecuzione. Non si risolve un riferimento locale invalido aggiungendo static.

I lifetime delle struct con riferimenti, i placeholder '\_ e i default dei trait object hanno dettagli propri: non estendere automaticamente le tre regole introduttive a ogni contesto sintattico. Anche il bound T: 'static non significa che ogni valore di T resti allocato per sempre.

## Errori comuni

- Pensare che il compilatore ricavi il contratto pubblico dal corpo della funzione.
- Confondere lifetime, durata del proprietario e scope del nome.
- Aggiungere 'a o 'static per evitare di restituire una String posseduta.
- Credere che l'output possa sopravvivere all'input perche in un caso particolare contiene un literal.
- Usare uno slicing in byte come se fosse indipendente dal contenuto Unicode.
- Ignorare che un output ancora usato mantiene il prestito dell'input.

## Checklist

- L'output contiene un riferimento oppure un valore indipendente?
- Le regole della firma identificano il lifetime dell'output?
- Il proprietario vive abbastanza e resta accessibile in modo compatibile?
- Una annotazione descrive un rapporto reale, oppure tenta di creare una durata inesistente?
- Il riferimento punta a input, literal o dati costruiti localmente?
- Per restituire dati nuovi e piu appropriato trasferirne ownership?

## Collegamenti

- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]

## Fonti

- [Rust Reference: Lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html).
- [Rust Book: Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html).
- [Rust Book: References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html).
- [Rust By Example: lifetime e bound static](https://doc.rust-lang.org/rust-by-example/scope/lifetime/static_lifetime.html).
- [Standard library: str](https://doc.rust-lang.org/std/primitive.str.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
