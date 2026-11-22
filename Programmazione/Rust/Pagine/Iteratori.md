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
  - iteratori
  - collezioni
aliases:
  - Iteratori Rust
  - Iterator
prerequisites:
  - "[[Programmazione/Rust/Pagine/Vec]]"
related:
  - "[[Programmazione/Rust/Pagine/Closure]]"
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
title: Iteratori
---

# Iteratori

## Sintesi

Un iteratore mantiene lo stato di una visita e produce un elemento alla volta. Gli adattatori come `map` e `filter` costruiscono una pipeline; il lavoro sugli elementi avviene quando la pipeline viene avanzata, per esempio con `next`, `collect` o un ciclo `for`.

Non e una copia della collezione e non riparte automaticamente dall'inizio. Gli esempi sono autonomi, per Rust stable ed edition 2024; il controesempio finale deve fallire in compilazione.

## Quando usarlo

- Trasformare, filtrare, cercare o aggregare dati senza gestire indici manuali.
- Elaborare slice, vettori, mappe, range e altre sorgenti con la stessa interfaccia.
- Costruire una nuova collezione oppure fermarsi appena si trova un risultato.
- Comporre passaggi brevi e leggibili; preferire un `for` quando controllo del flusso ed effetti diventano piu chiari.

## Come funziona

### Iterator e IntoIterator non sono la stessa cosa

`Iterator` definisce il tipo associato `Item` e il metodo `next(&mut self) -> Option<Self::Item>`. `Some(item)` fornisce un elemento, `None` segnala l'arresto di quella visita. Non ridefinire il trait: e gia nel prelude.

`IntoIterator` converte un valore in un iteratore. E il contratto usato da `for`; puo essere implementato per un contenitore posseduto **o per un riferimento**. Molti iteratori sono a loro volta iterabili e `into_iter` ne conserva lo stato corrente.

### Avanzare con next

```rust
fn main() {
    let values = [10, 20];
    let mut iter = values.iter();
    assert_eq!(iter.next(), Some(&10));
    assert_eq!(iter.next(), Some(&20));
    assert_eq!(iter.next(), None);
    assert_eq!(iter.next(), None);

    let mut fresh = values.iter();
    assert_eq!(fresh.next(), Some(&10));
}
```

`mut` serve per avanzare lo stato dell'iteratore, non implica una modifica della sorgente. Qui `Item` e `&i32`. Per ripartire creiamo una nuova visita con `values.iter()`.

La permanenza di `None` e garantita da questo iteratore su slice, ma non dal solo trait `Iterator`: vedi `fuse` nelle varianti.

### Lazy non significa assenza di ogni effetto

La creazione della sorgente, la valutazione degli argomenti e le catture avvengono subito. A essere differito e il lavoro degli adattatori sugli elementi. Anche scartare una pipeline puo distruggere valori che possiede.

Una pipeline non crea necessariamente collezioni intermedie, ma le operazioni possono comunque allocare, fare I/O o essere costose. Le prestazioni dipendono da codice e dati: l'astrazione non e una garanzia di assenza di costo.

## API / Sintassi

### Prestito, modifica e consumo

```rust
fn main() {
    let mut names = vec![String::from("api"), String::from("web")];

    let lengths: Vec<_> = names.iter().map(String::len).collect();
    assert_eq!(lengths, [3, 3]);

    for name in names.iter_mut() {
        name.push('!');
    }
    let borrowed: Vec<&String> = (&names).into_iter().collect();
    assert_eq!(borrowed.len(), 2);

    let owned: Vec<String> = names.into_iter().collect();
    assert_eq!(owned, ["api!", "web!"]);

    let values = [1, 2, 3];
    let copied: Vec<i32> = values.iter().copied().collect();
    assert_eq!(copied, [1, 2, 3]);
}
```

Per `Vec<T>`: `iter()` produce `&T`, `iter_mut()` produce `&mut T`, `into_iter()` sul valore produce `T` consumando il vettore. Su `&Vec<T>`, invece, `into_iter()` produce riferimenti: non trasferisce gli elementi posseduti.

`copied()` trasforma `&T` in `T` per tipi `Copy`; `cloned()` richiede `Clone` e puo essere costoso. `collect` non clona implicitamente per cambiare il tipo degli elementi.

Sugli array, `array.into_iter()` usa elementi per valore da edition 2021; il metodo aveva una compatibilita particolare in 2015/2018. Questi esempi usano edition 2024.

### Pipeline lazy e consumo parziale

```rust
use std::cell::Cell;

fn main() {
    let calls = Cell::new(0);
    let mut doubled = (1..=4).map(|n| {
        calls.set(calls.get() + 1);
        n * 2
    });
    assert_eq!(calls.get(), 0);

    let first_two: Vec<_> = doubled.by_ref().take(2).collect();
    assert_eq!(first_two, [2, 4]);
    assert_eq!(calls.get(), 2);

    assert_eq!(doubled.next(), Some(6));
    assert_eq!(calls.get(), 3);
}
```

`|n| ...` e una closure: riceve `n` e restituisce l'ultima espressione. `Cell` serve qui solo a osservare il numero di chiamate senza un prestito mutabile esterno persistente.

`by_ref()` permette all'adattatore di consumare un prestito dell'iteratore, conservando il valore originale nello stato avanzato. Non duplica gli elementi e non annulla il lavoro gia svolto.

### Tipo di Item e riferimenti nei predicati

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4];

    let borrowed: Vec<&i32> = numbers.iter()
        .filter(|n: &&i32| **n % 2 == 0)
        .collect();
    assert_eq!(borrowed, [&2, &4]);

    let doubled: Vec<i32> = numbers.iter().copied()
        .filter(|n: &i32| *n % 2 == 0)
        .map(|n: i32| n * 2)
        .collect();
    assert_eq!(doubled, [4, 8]);
    assert_eq!(numbers, [1, 2, 3, 4]);
}
```

`map` riceve un `Item` e produce un nuovo valore; `filter` riceve `&Item` per decidere se conservare l'item originale. Se `Item = &i32`, il predicato riceve quindi `&&i32`. Non e una regola speciale delle slice: dipende dalla firma dell'adattatore.

### Ricerca, aggregazione e arresto anticipato

```rust
fn main() {
    let mut numbers = [1, 3, 4, 8].into_iter();
    assert_eq!(numbers.find(|n| *n % 2 == 0), Some(4));
    assert_eq!(numbers.next(), Some(8));

    let mut values = [2, 4, 7, 8].into_iter();
    assert!(!values.all(|n| n % 2 == 0));
    assert_eq!(values.next(), Some(8));

    let total: i64 = (1..=4).map(i64::from).sum();
    let joined = ["api", "web"].into_iter().fold(
        String::new(),
        |mut acc, part| {
            if !acc.is_empty() { acc.push(','); }
            acc.push_str(part);
            acc
        },
    );
    assert_eq!(total, 10);
    assert_eq!(joined, "api,web");

    assert!(std::iter::empty::<i32>().all(|_| false));
    assert!(!std::iter::empty::<i32>().any(|_| true));
    assert_eq!(std::iter::empty::<i32>().reduce(i32::max), None);
}
```

`find`, `any` e `all` possono fermarsi prima della fine; l'elemento che determina l'esito e gia consumato. `find` restituisce un `Item`, quindi su `iter()` il risultato puo essere un riferimento.

Non tutti i consumatori prendono `self`: questi metodi usano `&mut self` e consentono di continuare. `sum`, `fold` e `collect` prendono invece il ricevente per valore. `fold` usa un accumulatore iniziale anche sul vuoto; `reduce` usa il primo elemento e restituisce `None` se manca.

## Esempio pratico

### Preparare tag senza modificare la sorgente

```rust
fn normalize_tags(tags: &[String]) -> Vec<String> {
    tags.iter()
        .map(|tag| tag.trim().to_lowercase())
        .filter(|tag| !tag.is_empty())
        .collect()
}

fn main() {
    let tags = vec![
        String::from(" Rust "),
        String::from(" "),
        String::from("API"),
        String::from("rust"),
    ];
    let normalized = normalize_tags(&tags);
    assert_eq!(normalized, ["rust", "api", "rust"]);
    assert_eq!(tags[0], " Rust ");
}
```

La funzione conserva ordine e duplicati, rimuove whitespace ai bordi e produce nuove stringhe minuscole. Non elimina spazi interni o punteggiatura, non valida tag applicativi, non esegue normalizzazione Unicode o case folding completo. Il risultato posseduto puo sopravvivere alla slice originale.

Per input non fidato servono limiti espliciti di dimensione e numero di tag; la pipeline non li impone. Lowercase puo espandere il testo, quindi non assumere che l'output occupi gli stessi byte.

### Propagare errori anziche scartarli

```rust
use std::num::ParseIntError;

fn parse_numbers(input: &[&str]) -> Result<Vec<u16>, ParseIntError> {
    input.iter().map(|text| text.parse::<u16>()).collect()
}

fn main() {
    assert_eq!(parse_numbers(&["10", "20"]).unwrap(), [10, 20]);
    assert!(parse_numbers(&["10", "bad", "20"]).is_err());

    let only_valid: Vec<u16> = ["10", "bad", "20"].into_iter()
        .filter_map(|text| text.parse().ok())
        .collect();
    assert_eq!(only_valid, [10, 20]);
}
```

`collect::<Result<Vec<_>, _>>()` interrompe al primo errore e lo restituisce. `filter_map(...ok())` scarta invece gli errori e continua: e una diversa policy, non una gestione equivalente. Gli effetti gia avvenuti non vengono annullati.

Qui il parser accetta la grammatica di `u16`, compresi zero e segno `+`, e non applica `trim`: non e una validazione di porte o di uno specifico formato di file.

## Varianti

### Fine stabile con fuse

```rust
fn intermittent() -> impl Iterator<Item = u8> {
    let mut steps = [Some(1), None, Some(3)].into_iter();
    std::iter::from_fn(move || steps.next().flatten())
}

fn main() {
    let mut raw = intermittent();
    assert_eq!(raw.next(), Some(1));
    assert_eq!(raw.next(), None);
    assert_eq!(raw.next(), Some(3));

    let mut fused = intermittent().fuse();
    assert_eq!(fused.next(), Some(1));
    assert_eq!(fused.next(), None);
    assert_eq!(fused.next(), None);
}
```

`FusedIterator` promette di restituire sempre `None` dopo il primo arresto; `fuse()` adatta un iteratore per ottenere questa proprieta. Un `for` termina al primo `None`, anche se la sorgente potrebbe riprendere.

- `enumerate`: aggiunge un contatore della visita corrente, non necessariamente l'indice originale dopo un filtro.
- `take` e `skip`: limitano o saltano elementi; la loro posizione nella pipeline conta.
- `take_while`: interrompe al primo predicato falso e ha gia estratto quell'elemento.
- `zip`: abbina elementi finche entrambi li producono; non verifica che le lunghezze siano uguali.
- `collect`: il tipo di destinazione determina come aggregare gli item tramite `FromIterator`. Non implica sempre `Vec`.
- Per sequenze infinite, anche `take(n)` **dopo un filtro che non trova elementi** puo non terminare. Un limite di output non e necessariamente un limite al lavoro.

Per il catalogo piu ampio di adattatori e bound vedi [[Programmazione/Rust/Pagine/Iterator API|Iterator API]].

## Errori comuni

### Usare un iteratore dopo un consumatore per valore

Controesempio intenzionale: `collect` prende possesso dell'iteratore.

```rust
fn main() {
    let mut iter = (1..=3).map(|n| n * 2);
    let values: Vec<_> = iter.collect();
    println!("{values:?}");
    println!("{:?}", iter.next());
}
```

Per conservare il ricevente usa `iter.by_ref()`; rimarra pero avanzato, non ripristinato. Per ripetere il calcolo serve una nuova sorgente o una strategia esplicita di memorizzazione.

- Aspettarsi che una pipeline non consumata trasformi gia i dati.
- Credere che `into_iter` significhi sempre proprieta degli elementi.
- Clonare tutto quando bastano riferimenti.
- Usare `for_each` aspettandosi che `return` esca dalla funzione esterna: esce solo dalla callback.
- Raccogliere sorgenti infinite o molto grandi senza un limite appropriato.
- Nascondere la perdita di errori con `filter_map` o `flatten` su `Result`.

## Checklist

- Tipo `Item` noto a ogni passaggio?
- Lettura, modifica o consumo della sorgente scelti consapevolmente?
- Ricevente ancora disponibile dopo il consumatore?
- Arresto anticipato e input vuoto gestiti?
- Limiti al lavoro e alle allocazioni, non soltanto al numero di risultati?
- Errori propagati o scartati secondo una policy esplicita?

## Collegamenti

- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]

## Fonti

Baseline consultata: **Rust 1.99.1**, solo API stable negli esempi. Non e una dichiarazione di MSRV.

- [Rust Book: iteratori e tipi degli elementi](https://doc.rust-lang.org/book/ch13-02-iterators.html)
- [Iterator: metodi e contratti](https://doc.rust-lang.org/std/iter/trait.Iterator.html)
- [IntoIterator: conversione e ciclo for](https://doc.rust-lang.org/std/iter/trait.IntoIterator.html)
- [std::iter: laziness e sequenze infinite](https://doc.rust-lang.org/std/iter/index.html)
- [FusedIterator: fine permanente](https://doc.rust-lang.org/std/iter/trait.FusedIterator.html)
- [FromIterator: destinazione di collect](https://doc.rust-lang.org/std/iter/trait.FromIterator.html)
- [Edition Guide: IntoIterator per array](https://doc.rust-lang.org/edition-guide/rust-2021/IntoIterator-for-arrays.html)
- [str: trim e to_lowercase](https://doc.rust-lang.org/std/primitive.str.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
