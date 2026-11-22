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
  - Iterator API
  - API Iterator Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Closure]]"
  - "[[Programmazione/Rust/Pagine/Associated types]]"
related:
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
  - "[[Programmazione/Rust/Pagine/Rayon e parallel iterators]]"
title: Iterator API
---

# Iterator API

## Sintesi

Questa nota approfondisce i **contratti delle API**: quali elementi vengono consumati, quali tipi attraversano la pipeline e quali capacita restano disponibili. Per `iter`, `iter_mut`, `into_iter` e laziness di base parti da [[Programmazione/Rust/Pagine/Iteratori|Iteratori]].

`Iterator` richiede `type Item` e `next(&mut self) -> Option<Self::Item>`; i metodi forniti costruiscono adattatori oppure avanzano la visita. Non ridefinire il trait nel programma. Nessuna promessa generale di velocita: callback, allocazioni e sorgente determinano il costo.

Esempi autonomi per **Rust 1.99.1, edition 2024**, senza crate esterne. La baseline non certifica una MSRV; l'ultimo programma e un controesempio di compilazione.

## Quando usarlo

- Scegliere un adattatore in base al tipo di `Item` e al comportamento desiderato.
- Fermare un'elaborazione su errore senza nasconderlo.
- Leggere una sequenza in piu fasi, mantenendo chiaro lo stato residuo.
- Accettare input generici o implementare una piccola sorgente custom.
- Capire perche `rev` o `len` non sono disponibili dopo una trasformazione.

## Come funziona

### Ricevente, item e callback sono contratti distinti

`map` prende il ricevente per valore e passa ogni `Item` alla callback; `filter` passa invece `&Item` al predicato. Con `Item = &T`, il predicato vede quindi `&&T`. Il tipo di `Item` non dice da solo se il contenitore originale e stato consumato.

La costruzione di una pipeline trasferisce o prende in prestito il ricevente subito; le trasformazioni sugli elementi avvengono quando la avanzi. `next` basta: non serve necessariamente un consumatore finale come `collect`. `by_ref` conserva il proprietario dell'iteratore, non la posizione iniziale.

### Stato residuo e lettura dalle due estremita

```rust
fn main() {
    let mut values = [10, 20, 30, 40, 50].into_iter();
    assert_eq!(values.size_hint(), (5, Some(5)));
    assert_eq!(values.len(), 5);

    assert_eq!(values.nth(1), Some(20));
    assert_eq!(values.next_back(), Some(50));
    assert_eq!(values.len(), 2);

    let reversed: Vec<_> = values.by_ref().rev().collect();
    assert_eq!(reversed, [40, 30]);
    assert_eq!(values.next(), None);
}
```

`nth(1)` salta un elemento **a partire dalla posizione attuale** e restituisce il successivo: non e accesso casuale e scarta anche gli elementi saltati. `next_back` usa l'altra estremita dello stesso intervallo; non e una seconda visita indipendente.

`DoubleEndedIterator` abilita `next_back` e `rev`; `ExactSizeIterator` espone il numero di elementi **rimasti** con `len`. Le due capacita sono distinte. `size_hint` restituisce limite inferiore e superiore opzionale: non e sempre una lunghezza esatta, ne una garanzia di sicurezza per codice unsafe. [DoubleEndedIterator](https://doc.rust-lang.org/std/iter/trait.DoubleEndedIterator.html), [ExactSizeIterator](https://doc.rust-lang.org/std/iter/trait.ExactSizeIterator.html).

## API / Sintassi

### Scegliere l'operazione

Il catalogo e selettivo, non un elenco completo di tutti i metodi.

| Obiettivo | API | Attenzione |
| --- | --- | --- |
| Trasformare o selezionare | `map`, `filter`, `filter_map` | `filter_map` ignora i `None` e prosegue. |
| Appiattire | `flat_map`, `flatten` | Un livello di iterabili; su `Result` puo perdere gli errori. |
| Unire o abbinare | `chain`, `zip` | `zip` non convalida lunghezze uguali. |
| Limitare o numerare | `take`, `skip`, `enumerate` | L'ordine dei passaggi cambia il risultato. |
| Esaminare il prossimo | `peekable`, `peek`, `next_if` | Il wrapper puo gia aver avanzato la sorgente. |
| Cercare | `find`, `find_map`, `position`, `any`, `all` | L'elemento decisivo e gia consumato. |
| Aggregare | `fold`, `reduce`, `sum`, `product` | `reduce` restituisce `None` sul vuoto. |
| Raccogliere o separare | `collect`, `partition`, `unzip` | Destinazione e allocazioni dipendono dai tipi. |
| Fermarsi con un esito | `try_fold`, `try_for_each` | Nessun rollback degli effetti precedenti. |
| Osservare gli item | `inspect` | Lazy; vede soltanto gli elementi richiesti a quel punto. |

`collect` usa `FromIterator`: `Vec<T>`, `String` e `Result<Vec<T>, E>` esprimono raccolte diverse. `partition` separa in base a un predicato; `unzip` separa le componenti di coppie. Per aggiungere a un contenitore esistente usa `extend`. [FromIterator](https://doc.rust-lang.org/std/iter/trait.FromIterator.html).

### Comporre sorgenti senza collezioni intermedie

```rust
fn main() {
    let rows = ["api web", "", "cli"];
    let words: Vec<_> = rows.into_iter()
        .flat_map(str::split_whitespace)
        .chain(std::iter::once("worker"))
        .enumerate()
        .collect();
    assert_eq!(words, [(0, "api"), (1, "web"), (2, "cli"), (3, "worker")]);

    let pairs: Vec<_> = ["api", "web", "cli"].into_iter()
        .zip([8000, 8001])
        .collect();
    assert_eq!(pairs, [("api", 8000), ("web", 8001)]);

    let results: [Result<u8, &str>; 3] = [Ok(1), Err("bad"), Ok(3)];
    let ignored_errors: Vec<_> = results.into_iter().flatten().collect();
    assert_eq!(ignored_errors, [1, 3]);
}
```

`flat_map` trasforma ogni item in un iterabile e ne visita gli elementi; `flatten` appiattisce un livello gia presente. Nell'ultima pipeline `Err` equivale a zero elementi: **non e propagazione dell'errore**. Per preservarlo usa `collect::<Result<Vec<_>, _>>()` o un metodo `try_*`.

`zip` termina quando non puo produrre una coppia; non assumere che lasci intatta tutta la coda della sorgente piu lunga. Se la corrispondenza uno-a-uno e un requisito, convalida le lunghezze prima o gestisci esplicitamente gli elementi mancanti. [Flatten](https://doc.rust-lang.org/std/iter/struct.Flatten.html).

### Peekable e consumo condizionale

```rust
use std::cell::Cell;

fn main() {
    let reads = Cell::new(0);
    let mut tokens = ["name", "=", "value"].into_iter()
        .inspect(|_| reads.set(reads.get() + 1))
        .peekable();

    assert_eq!(reads.get(), 0);
    assert_eq!(tokens.peek(), Some(&"name"));
    assert_eq!(tokens.peek(), Some(&"name"));
    assert_eq!(reads.get(), 1);
    assert_eq!(tokens.next(), Some("name"));
    assert_eq!(reads.get(), 1);

    assert_eq!(tokens.next_if_eq(&"="), Some("="));
    assert_eq!(tokens.next_if(|token| token.is_empty()), None);
    assert_eq!(reads.get(), 3);
    assert_eq!(tokens.next(), Some("value"));
    assert_eq!(tokens.next(), None);
}
```

`peek` mantiene l'item disponibile nel wrapper, ma per riempire la cache chiama la sorgente: eventuali effetti avvengono gia allora. La ripetizione sullo stesso item non la avanza di nuovo. `next_if` conserva l'item se il predicato e falso; `take_while` invece perde l'elemento che causa l'arresto. Questo esempio osserva il comportamento, non implementa un parser completo. [Peekable](https://doc.rust-lang.org/std/iter/struct.Peekable.html), [peekable e sorgente](https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.peekable).

## Esempio pratico

### Parole uniche ordinate con una policy esplicita

```rust
fn unique_sorted_words(text: &str) -> Vec<String> {
    let mut words: Vec<String> = text.split_whitespace()
        .map(|word| word.trim_matches(|c: char| !c.is_alphanumeric()))
        .filter(|word| !word.is_empty())
        .map(str::to_lowercase)
        .collect();

    words.sort();
    words.dedup();
    words
}

fn main() {
    assert_eq!(unique_sorted_words("Rust, API rust! ..."), ["api", "rust"]);
    assert!(unique_sorted_words("... \t ").is_empty());
    assert_eq!(unique_sorted_words("a,b a-b"), ["a,b", "a-b"]);
}
```

La funzione separa per whitespace, elimina ai bordi i caratteri non alfanumerici, converte in minuscolo e raccoglie stringhe possedute. `sort` e `dedup` operano **dopo** la raccolta: `dedup` elimina solo duplicati adiacenti, quindi qui l'ordinamento e necessario.

Non e un tokenizer linguistico: la punteggiatura interna resta, i segni combinanti ai bordi possono essere rimossi, lowercase non e case folding completo e non normalizza Unicode. L'ordine e quello di `String`, non una collazione italiana. Per ricerca o identificatori serve una policy diversa. Su input non fidato limita dimensioni e numero di token; lowercase puo espandere il testo. [Operazioni su str](https://doc.rust-lang.org/std/primitive.str.html).

### Somma fallibile e posizione dopo l'errore

```rust
fn sum_remaining<'a>(
    items: &mut impl Iterator<Item = &'a str>,
) -> Result<u16, &'static str> {
    items.try_fold(0_u16, |total, text| {
        let value = text.parse::<u16>().map_err(|_| "invalid number")?;
        total.checked_add(value).ok_or("sum overflow")
    })
}

fn main() {
    let mut items = ["10", "20", "bad", "40"].into_iter();
    assert_eq!(sum_remaining(&mut items), Err("invalid number"));
    assert_eq!(items.next(), Some("40"));

    let mut valid = ["10", "20"].into_iter();
    assert_eq!(sum_remaining(&mut valid), Ok(30));

    let mut overflow = ["65535", "1", "2"].into_iter();
    assert_eq!(sum_remaining(&mut overflow), Err("sum overflow"));
    assert_eq!(overflow.next(), Some("2"));

    assert_eq!(sum_remaining(&mut std::iter::empty()), Ok(0));
}
```

`try_fold` usa `&mut self` e si ferma al primo `Err`. L'item problematico e stato consumato; il totale parziale non viene restituito da questa funzione. Riprendere con una nuova chiamata avvia una nuova somma da zero, non prosegue automaticamente l'accumulatore precedente.

Il parser e quello di `u16`: niente `trim`, segno `+` ammesso. Gli errori testuali sono volutamente minimi; per una API applicativa conserva posizione e causa in un tipo dedicato. `checked_add` rende esplicito l'overflow anche nelle build ottimizzate.

`try_for_each` e adatto a operazioni fallibili senza accumulatore; `ControlFlow::Break` consente anche un arresto previsto, non necessariamente un errore. Nessuno dei due annulla scritture o effetti gia avvenuti. [try_fold](https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.try_fold), [ControlFlow](https://doc.rust-lang.org/std/ops/enum.ControlFlow.html).

## Varianti

### Accettare un iterabile e restituire una pipeline

```rust
fn reversed<I>(values: I) -> impl DoubleEndedIterator<Item = I::Item>
where
    I: IntoIterator,
    I::IntoIter: DoubleEndedIterator,
{
    values.into_iter().rev()
}

fn main() {
    let names = vec![String::from("api"), String::from("web")];
    let borrowed: Vec<_> = reversed(&names).collect();
    assert_eq!(borrowed, [&names[1], &names[0]]);

    let owned: Vec<String> = reversed(names).collect();
    assert_eq!(owned, ["web", "api"]);
}
```

Il bound riguarda **l'iteratore ottenuto**, `I::IntoIter`, non ogni contenitore iterabile. `IntoIterator` permette di accettare sia valori sia prestiti; non clona gli elementi. L'output `impl DoubleEndedIterator` espone questa capacita, ma non promette `ExactSizeIterator` anche quando un particolare input la possiede. [IntoIterator](https://doc.rust-lang.org/std/iter/trait.IntoIterator.html).

### Implementare una sorgente finita

```rust
use std::iter::FusedIterator;

struct Countdown {
    remaining: u8,
}

impl Iterator for Countdown {
    type Item = u8;

    fn next(&mut self) -> Option<Self::Item> {
        if self.remaining == 0 {
            return None;
        }
        let value = self.remaining;
        self.remaining -= 1;
        Some(value)
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        let len = usize::from(self.remaining);
        (len, Some(len))
    }
}

impl ExactSizeIterator for Countdown {}
impl FusedIterator for Countdown {}

fn main() {
    let mut counter = Countdown { remaining: 3 };
    assert_eq!(counter.len(), 3);
    assert_eq!(counter.next(), Some(3));
    assert_eq!(counter.len(), 2);
    assert_eq!(counter.by_ref().collect::<Vec<_>>(), [2, 1]);
    assert_eq!(counter.len(), 0);
    assert_eq!(counter.next(), None);
    assert_eq!(counter.next(), None);
}
```

Qui `ExactSizeIterator` e `FusedIterator` sono promesse sostenute dallo stato: il conteggio e esatto e zero resta zero. Non vanno aggiunti come semplici etichette di ottimizzazione; i loro contratti devono essere rispettati. Non serve un'implementazione separata di `IntoIterator`: quella generica per gli iteratori e gia disponibile. [Fine permanente](https://doc.rust-lang.org/std/iter/trait.FusedIterator.html).

### Arresto, dimensione e parallelismo

- `filter_map` salta i `None`; `map_while` produce il prefisso fino al primo `None`. Il comportamento di `map_while` dopo quel primo arresto non e specificato: aggiungi `fuse()` se devi chiamare ancora `next`. Non usarlo per scartare errori in mezzo a un input.
- `scan` mantiene uno stato esplicito nella callback; restituire `None` segnala un arresto alla visita, non un elemento da ignorare come in `filter_map`.
- `filter` puo conservare `DoubleEndedIterator` ma perde in generale `ExactSizeIterator`: il numero di risultati dipende dal predicato. Anche un `chain` di due iteratori esatti non implementa automaticamente `ExactSizeIterator`, per il possibile overflow del conteggio.
- `take(n)` limita gli item in quel punto, non sempre il lavoro a monte: dopo un filtro su una sorgente infinita puo non terminare.
- Le pipeline standard sono sequenziali; [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon]] usa trait differenti. Nessun parallelismo implicito in `map` o `collect`.

## Errori comuni

### Chiedere len dopo un filtro

Controesempio intenzionale: il range conosce la propria lunghezza, il filtro no.

```rust
fn main() {
    let even = (0..10).filter(|n| n % 2 == 0);
    println!("{}", even.len());
}
```

`count()` calcola il numero visitando gli elementi e consuma il ricevente; raccogli in un `Vec` solo se ti servono anche i valori. Usare `size_hint().0` come conteggio sarebbe scorretto.

- Il frammento `v.iter_mut()` richiede un binding mutabile quando `v` e un `Vec` posseduto; `iter_mut` non rende mutabile una variabile dichiarata immutabile.
- `into_iter` sul `Vec` posseduto ne trasferisce la proprieta; sul suo riferimento produce prestiti. Scegli il ricevente, non soltanto il nome del metodo.
- `copied` richiede item `&T` con `T: Copy`; `cloned` richiede `Clone` e puo allocare. `collect` non clona implicitamente.
- `find`, `any` e `all` non garantiscono di visitare tutto. `sum` e `product` non sono una strategia generale contro l'overflow.
- `inspect` e utile per debug, non garantisce una notifica per ogni elemento della sorgente indipendentemente dai consumatori.
- Una pipeline troppo lunga puo nascondere effetti, errori e stato: un `for` esplicito e spesso piu chiaro.

## Checklist

- Conosco `Item`, argomento della callback e proprieta del ricevente?
- La posizione dopo ricerca, errore o anticipazione e quella attesa?
- Sto scartando errori con `flatten` o `.ok()`?
- I bound richiesti sono disponibili anche dopo gli adattatori?
- Vuoto, overflow, lunghezze diverse e sorgenti grandi sono gestiti?
- L'ordine e la policy Unicode sono adeguati ai dati reali?

## Collegamenti

- [[Programmazione/Rust/Pagine/Iteratori|Iteratori: basi e consumo]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]

## Fonti

Documentazione consultata e prove su **Rust 1.99.1**; esempi stable, edition 2024. La documentazione online puo contenere anche metodi nightly: controlla il badge del singolo metodo.

- [Iterator: firme, adattatori e consumatori](https://doc.rust-lang.org/std/iter/trait.Iterator.html)
- [IntoIterator: conversione e tipo IntoIter](https://doc.rust-lang.org/std/iter/trait.IntoIterator.html)
- [FromIterator: raccolta in una destinazione](https://doc.rust-lang.org/std/iter/trait.FromIterator.html)
- [DoubleEndedIterator](https://doc.rust-lang.org/std/iter/trait.DoubleEndedIterator.html)
- [ExactSizeIterator e limiti dei conteggi](https://doc.rust-lang.org/std/iter/trait.ExactSizeIterator.html)
- [FusedIterator](https://doc.rust-lang.org/std/iter/trait.FusedIterator.html)
- [Peekable](https://doc.rust-lang.org/std/iter/struct.Peekable.html)
- [MapWhile](https://doc.rust-lang.org/std/iter/struct.MapWhile.html)
- [ControlFlow](https://doc.rust-lang.org/std/ops/enum.ControlFlow.html)
- [str: separazione, trim e conversione in minuscolo](https://doc.rust-lang.org/std/primitive.str.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
