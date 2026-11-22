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
  - option
  - error-handling
aliases:
  - Option Rust
  - Valori opzionali
prerequisites:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
related:
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
  - "[[Programmazione/Rust/Pagine/if let e while let]]"
title: Option
---

# Option

## Sintesi

`Option<T>` esprime un valore opzionale: `Some(value)` contiene un `T`, `None` indica assenza. Il tipo rende visibile questa possibilita nella firma, senza confonderla con zero, stringa vuota o un valore sentinella.

Non obbliga a gestire bene l'assenza: puoi ignorare il risultato o usare `unwrap()`, che su `None` va in panic. Il vantaggio e non poter usare direttamente un `Option<T>` come se fosse un `T`.

## Quando usarlo

- Ricerca senza risultati, prima voce di una lista eventualmente vuota, campo facoltativo.
- Calcolo parziale del quale basta conoscere successo o assenza.
- Risorsa estraibile una sola volta da un campo.
- Se occorre distinguere le cause del fallimento, preferisci [[Programmazione/Rust/Pagine/Result|Result]].

## Come funziona

`Option` e un enum della standard library, gia nel prelude insieme a `Some` e `None`: non devi ridefinirlo. Rust non ha riferimenti validi nulli; i raw pointer possono invece essere nulli. `Option<&T>` rappresenta un riferimento facoltativo senza dereferenziare un puntatore nullo.

### Presente non significa non vuoto

Ogni blocco Rust della nota e un programma autonomo per `src/main.rs`, salvo il controesempio esplicitamente non compilabile. Baseline: Rust 1.99.1, edition 2024, nessuna crate esterna.

```rust
fn describe(value: Option<&str>) -> &'static str {
    match value {
        None => "missing",
        Some("") => "empty",
        Some(_) => "present",
    }
}

fn main() {
    assert_eq!(describe(None), "missing");
    assert_eq!(describe(Some("")), "empty");
    assert_eq!(describe(Some("0")), "present");
    let absent: Option<u32> = None;
    assert!(absent.is_none());
    assert!(Some(0).is_some());
}
```

Un `None` isolato puo richiedere un'annotazione per inferire `T`. Non dedurre il layout di ogni `Option<T>`: la rappresentazione ottimizzata e garantita solo per i casi documentati, non per qualsiasi enum.

## API / Sintassi

### Prestare senza clonare

`as_ref()` produce `Option<&T>`, `as_mut()` produce `Option<&mut T>`. Con `String`, `as_deref()` fornisce direttamente `Option<&str>`.

```rust
fn main() {
    let mut title = Some(String::from("rust"));
    assert_eq!(title.as_ref().map(String::len), Some(4));
    assert_eq!(title.as_deref(), Some("rust"));

    if let Some(text) = title.as_mut() {
        text.push('!');
    }
    assert_eq!(title.as_deref(), Some("rust!"));
    let numbers = [10, 20];
    assert_eq!(numbers.get(1).copied(), Some(20));
    assert_eq!(numbers.get(2).copied(), None);
}
```

`copied()` su `Option<&T>` richiede `T: Copy`; `cloned()` richiede `T: Clone` e puo copiare dati sullo heap. I prestiti non rendono i dati indipendenti dal proprietario.

### Trasformare e concatenare

`map` trasforma `T -> U`; `and_then` concatena `T -> Option<U>` senza annidare un secondo `Option`. Entrambi saltano la closure su `None`. `filter` conserva un valore solo se soddisfa il predicato.

```rust
fn doubled(value: Option<u8>) -> Option<u8> {
    value.and_then(|n| n.checked_mul(2))
}

fn first_character(text: &str) -> Option<char> {
    let first = text.chars().next()?;
    Some(first)
}

fn main() {
    assert_eq!(Some("rust").map(str::len), Some(4));
    assert_eq!(Some(128_u8).map(|n| n.checked_mul(2)), Some(None));
    assert_eq!(doubled(Some(128)), None);
    assert_eq!(doubled(Some(12)), Some(24));
    assert_eq!(doubled(None), None);
    assert_eq!(Some(0).filter(|n| *n > 0), None);
    assert_eq!(first_character(""), None);
    assert_eq!(first_character("\u{e8}"), Some('\u{e8}'));
}
```

Qui `None` accorpa input mancante e overflow: e una scelta del contratto, non una diagnostica. `char` e un valore scalare Unicode, non necessariamente un carattere percepito completo.

### Default immediato o differito

L'argomento di `unwrap_or` viene valutato anche con `Some`. La closure di `unwrap_or_else` viene chiamata solo con `None`.

```rust
fn fallback(calls: &mut usize) -> String {
    *calls += 1;
    String::from("untitled")
}

fn main() {
    let mut calls = 0;
    let first = Some(String::from("notes"))
        .unwrap_or(fallback(&mut calls));
    assert_eq!(first, "notes");
    assert_eq!(calls, 1);

    let second = Some(String::from("notes"))
        .unwrap_or_else(|| fallback(&mut calls));
    assert_eq!(second, "notes");
    assert_eq!(calls, 1);

    let third: Option<String> = None;
    assert_eq!(third.unwrap_or_else(|| fallback(&mut calls)), "untitled");
    assert_eq!(calls, 2);
}
```

La stessa distinzione vale per `or / or_else` e `ok_or / ok_or_else`. Un default silenzioso e appropriato solo se previsto dal dominio, non per nascondere configurazioni errate.

## Esempio pratico

### Ricerca e propagazione dell'assenza

```rust
struct User {
    id: u64,
    email: Option<String>,
}

fn domain_for(users: &[User], id: u64) -> Option<&str> {
    let user = users.iter().find(|user| user.id == id)?;
    let email = user.email.as_deref()?;
    let (_, domain) = email.split_once('@')?;
    Some(domain)
}

fn main() {
    let users = [
        User { id: 1, email: Some("luca@example.com".into()) },
        User { id: 2, email: None },
        User { id: 3, email: Some("not-an-address".into()) },
    ];
    assert_eq!(domain_for(&users, 1), Some("example.com"));
    assert_eq!(domain_for(&users, 2), None);
    assert_eq!(domain_for(&users, 3), None);
    assert_eq!(domain_for(&users, 99), None);
}
```

La ricerca opera davvero sulla slice ricevuta, senza database. `?` termina questa funzione con `None` al primo passaggio assente; altrimenti estrae il valore e prosegue.

Il risultato prende in prestito la stringa dagli utenti: non alloca un nuovo dominio. Per un risultato indipendente usa `.map(str::to_owned)` sul valore restituito.

**Non e una validazione email**: `"a@"` produce `Some("")`, `"a@b@c"` produce `Some("b@c")`. Non controlla DNS o esistenza della casella. ID duplicati restituiscono il primo utente; le diverse cause di assenza non sono distinguibili. Se queste differenze servono, cambia il contratto in `Result` con errori espliciti.

## Varianti

### Estrarre e inizializzare un campo

```rust
fn main() {
    let mut pending = Some(String::from("job"));
    let job = pending.take();
    assert_eq!(job.as_deref(), Some("job"));
    assert!(pending.is_none());
    assert_eq!(pending.take(), None);

    let value = pending.get_or_insert_with(|| String::from("next"));
    value.push('!');
    assert_eq!(pending.as_deref(), Some("next!"));

    let old = pending.replace(String::from("last"));
    assert_eq!(old.as_deref(), Some("next!"));
    assert_eq!(pending.as_deref(), Some("last"));
}
```

`take` sposta il contenuto e lascia `None`; `replace` restituisce il precedente e lascia `Some(nuovo)`. `get_or_insert_with` inizializza solo se manca e restituisce un riferimento mutabile.

### Assenza ed errore con transpose

```rust
use std::num::ParseIntError;

fn optional_number(raw: Option<&str>) -> Result<Option<u16>, ParseIntError> {
    raw.map(str::parse::<u16>).transpose()
}

fn main() {
    assert_eq!(optional_number(None), Ok(None));
    assert_eq!(optional_number(Some("0")), Ok(Some(0)));
    assert!(optional_number(Some("bad")).is_err());
    assert_eq!(Some(Some(7)).flatten(), Some(7));
}
```

`transpose` converte `Option<Result<T, E>>` in `Result<Option<T>, E>`: `None -> Ok(None)`, `Some(Ok(v)) -> Ok(Some(v))`, `Some(Err(e)) -> Err(e)`. `flatten` invece rimuove un solo livello di `Option<Option<T>>`; non converte gli errori.

## Errori comuni

### Riutilizzare un Option consumato

Controesempio **non compilabile**, errore E0382:

```rust
fn main() {
    let title = Some(String::from("notes"));
    let length = title.map(|text| text.len());
    assert_eq!(length, Some(5));
    assert!(title.is_some());
}
```

`map` riceve `self` per valore. Con `Option<String>` consuma il contenitore; usa `title.as_ref().map(|text| text.len())` per conservarlo. `Option<T>` e `Copy` soltanto quando lo e `T`.

- `unwrap` e `expect` non sono fallback: su `None` fanno panic.
- `is_some()` non estrae il dato; un `match` o `if let` evita controlli separati.
- Sostituire `None` con `Some("")` altera il significato del modello.

## Checklist

- Assenza, vuoto e zero hanno contratti distinti?
- Le cause perse in `None` sono davvero irrilevanti?
- Serve possesso, prestito o modifica del contenuto?
- Il fallback va calcolato sempre o solo quando manca il valore?
- Sono provati sia `Some` sia `None` e i limiti del dominio?

## Collegamenti

- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]

## Fonti

Riferimento verificato: Rust 1.99.1, edition 2024. Le fonti online possono evolvere; non e dichiarata una MSRV per tutti gli esempi.

- [Rust Book: enum e Option](https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html).
- [Standard library: Option e rappresentazione](https://doc.rust-lang.org/std/option/).
- [API Option: metodi e contratti](https://doc.rust-lang.org/std/option/enum.Option.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
