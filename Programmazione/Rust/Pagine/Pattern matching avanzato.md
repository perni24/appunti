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
  - pattern-matching
  - avanzato
aliases:
  - Pattern avanzati Rust
  - Match avanzato Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Destructuring]]"
related:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
title: Pattern matching avanzato
---

# Pattern matching avanzato

## Sintesi

I pattern avanzati combinano alternative, range, binding `@`, riferimenti e forme annidate. Permettono di descrivere insieme la struttura attesa e i dati necessari, senza aggirare ownership o regole di esaustivita.

Questa nota approfondisce [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]] e [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]. Gli esempi sono programmi indipendenti per `src/main.rs`, verificati con **Rust 1.99.1, edition 2024**; i due controesempi finali non compilano.

## Quando usarlo

- Per unire casi con lo stesso trattamento e gli stessi binding.
- Per riconoscere un intervallo mantenendo anche il valore.
- Per esaminare enum, tuple o slice annidati senza copie.
- Per distinguere forma del dato e condizioni calcolate.
- Per esplicitare un prestito quando il pattern per valore muoverebbe dati.

Se il pattern richiede una lunga spiegazione per essere letto, separa il controllo in piu passaggi.

## Come funziona

Il pattern descrive la forma; una guardia `if` verifica una condizione aggiuntiva. I casi vengono provati in ordine, e le guardie non sostituiscono i fallback necessari all'esaustivita.

`|` e un'alternativa tra pattern, non l'operatore booleano `||`. `@` lega un nome alla parte riconosciuta dal sottopattern: non clona il valore. `..` ignora una parte restante; per darle un nome nelle slice puoi usare `rest @ ..`.

### Alternative e intervalli

```rust
fn character_kind(character: char) -> &'static str {
    match character {
        'a' | 'e' | 'i' | 'o' | 'u' => "vocale minuscola ASCII",
        'a'..='z' | 'A'..='Z' => "altra lettera ASCII",
        '0'..='9' => "cifra ASCII",
        _ => "altro",
    }
}

fn main() {
    assert_eq!(character_kind('a'), "vocale minuscola ASCII");
    assert_eq!(character_kind('B'), "altra lettera ASCII");
    assert_eq!(character_kind('7'), "cifra ASCII");
    assert_eq!(character_kind('?'), "altro");
}
```

Gli estremi di `..=` sono inclusi. Il primo ramo deve precedere il range delle lettere. Questo non e un classificatore linguistico Unicode: per esempio `A` non ricade fra le vocali minuscole, e le lettere accentate non sono nei range ASCII.

Un range pattern non e un generico oggetto `Range` valutato a runtime. I suoi estremi ammessi vengono dal pattern, per esempio letterali o costanti; per un limite passato come parametro usa una guardia.

## API / Sintassi

### Binding con @ e parentesi

```rust
fn selected(value: u8) -> Option<u8> {
    match value {
        number @ (1..=5 | 10) => Some(number),
        _ => None,
    }
}

fn main() {
    assert_eq!(selected(1), Some(1));
    assert_eq!(selected(5), Some(5));
    assert_eq!(selected(10), Some(10));
    assert_eq!(selected(6), None);
}
```

Le parentesi fanno appartenere entrambe le alternative al binding `number`. Senza parentesi, `number @ 1..=5 | 10` introduce il nome solo nella prima alternativa e non soddisfa le regole dei binding.

In ogni alternativa di uno stesso braccio devono comparire gli stessi binding, con lo stesso tipo e modo di binding. Non bastano tipi che potrebbero subire una coercizione nel corpo del braccio.

### Guardia applicata a tutte le alternative

```rust
fn allowed(value: u8, enabled: bool) -> bool {
    match value {
        1 | 2 | 3 if enabled => true,
        _ => false,
    }
}

fn above_limit(value: Option<i32>, limit: i32) -> bool {
    match value {
        Some(number) if number > limit => true,
        Some(_) | None => false,
    }
}

fn main() {
    assert!(allowed(1, true));
    assert!(!allowed(1, false));
    assert!(!allowed(3, false));
    assert!(!allowed(4, true));
    assert!(above_limit(Some(11), 10));
    assert!(!above_limit(Some(10), 10));
}
```

La guardia `enabled` vale per tutto `1 | 2 | 3`, non soltanto per `3`. Il parametro `limit` viene confrontato nella guardia, non introdotto come nuovo binding.

Evita effetti collaterali nelle guardie: se piu alternative dello stesso braccio corrispondono e la guardia fallisce, puo essere valutata piu di una volta. Un binding posseduto non viene spostato nel corpo finche la guardia non riesce.

### Ref, ref mut e reference pattern

```rust
fn main() {
    let mut message = Some(String::from("ciao"));

    if let Some(ref text) = message {
        let borrowed: &String = text;
        assert_eq!(borrowed, "ciao");
    }
    if let Some(ref mut text) = message {
        text.push('!');
    }
    assert_eq!(message.as_deref(), Some("ciao!"));

    let &number = &7_i32;
    let copied: i32 = number;
    assert_eq!(copied, 7);
}
```

`ref text` crea un binding per riferimento nel pattern; `ref mut text` uno esclusivo. Qui lo scrutinee e `message`, non `&message`.

Il pattern `&number` riconosce invece un riferimento e ne estrae il contenuto: nell'esempio un intero copiabile. Non e una licenza per spostare una `String` fuori da `&String`.

In edition 2024 i modificatori espliciti sono limitati quando il pattern ha gia attivato i binding impliciti per riferimento. Per leggere `&message`, usa normalmente `Some(text)`, non `Some(ref text)`. I casi annidati vanno valutati in base al modo di binding, non con la regola assoluta "ref non si usa mai con riferimenti".

### Pattern annidati e slice

```rust
fn payload(frame: (u8, &[u8])) -> Option<&[u8]> {
    match frame {
        (1, [0xAA, body @ .., 0xFF]) => Some(body),
        _ => None,
    }
}

fn main() {
    let bytes = [0xAA, 10, 20, 0xFF];
    assert_eq!(payload((1, &bytes)), Some(&[10, 20][..]));
    assert_eq!(payload((1, &[0xAA, 0xFF])), Some(&[][..]));
    assert_eq!(payload((2, &bytes)), None);
    assert_eq!(payload((1, &[])), None);
}
```

Si combinano un tag numerico e una slice con almeno due elementi. `body` e una vista legata all'input, non una nuova allocazione. Il pattern ammette anche payload vuoto.

E un formato dimostrativo, non un protocollo completo: non verifica lunghezza dichiarata, checksum, escaping o autenticita. Un singolo elemento non puo essere contemporaneamente l'elemento iniziale e quello finale del pattern.

## Esempio pratico

### Classificare token gia costruiti

```rust
enum Token {
    Number(i64),
    Ident(String),
    Symbol(char),
}

fn classify(token: &Token) -> &'static str {
    match token {
        Token::Number(0..=9) => "cifra",
        Token::Number(_) => "numero",
        Token::Ident(name) if name == "fn" || name == "let" => "keyword",
        Token::Ident(_) => "identificatore",
        Token::Symbol('(' | ')' | '{' | '}') => "delimitatore",
        Token::Symbol(_) => "simbolo",
    }
}

fn main() {
    let tokens = [
        Token::Number(7),
        Token::Number(-1),
        Token::Ident(String::from("fn")),
        Token::Ident(String::from("name")),
        Token::Symbol('('),
        Token::Symbol('+'),
    ];
    let labels: Vec<_> = tokens.iter().map(classify).collect();
    assert_eq!(
        labels,
        vec!["cifra", "numero", "keyword", "identificatore", "delimitatore", "simbolo"]
    );
    assert!(matches!(&tokens[2], Token::Ident(name) if name == "fn"));
}
```

La funzione prende in prestito i token; le stringhe restano nel contenitore. Per consumarli potresti ricevere `Token` e usare binding per valore, ma non e necessario per una classificazione.

Il demo non e un lexer Rust: riceve valori gia costruiti e riconosce soltanto due keyword. Non verifica che un identificatore sia valido o non vuoto; altre keyword reali ricadono intenzionalmente nel fallback. Allo stesso modo, un numero classificato come cifra resta un `i64`, non viene convertito in carattere.

## Varianti

### Valore intero e campi in prestito

```rust
struct Pair {
    left: String,
    right: String,
}

fn main() {
    let pair = Pair {
        left: String::from("uno"),
        right: String::from("due"),
    };
    let whole @ Pair { left, .. } = &pair;
    let borrowed_whole: &Pair = whole;
    let borrowed_left: &String = left;
    assert_eq!(borrowed_whole.right, "due");
    assert_eq!(borrowed_left, "uno");
    assert!(std::ptr::eq(borrowed_whole, &pair));
    assert_eq!(pair.left, "uno");
}
```

Il riferimento completo e quello al campo possono convivere perche sono condivisi. Con `&mut` non puoi presumere di mantenere accessi esclusivi sovrapposti al contenitore e a un suo campo; le normali regole di prestito continuano a valere.

Altre forme utili:

- `Struct { field, .. }` per scegliere campi; la privacy resta valida.
- Costanti nominate come pattern; non confonderle con nuovi binding locali.
- `matches!` quando serve soltanto un booleano, senza esportare i binding.
- `let ... else` per una forma attesa con uscita anticipata.
- `ref whole @ Struct { ref field, .. }` come forma esplicita di prestiti condivisi su un valore posseduto.

## Errori comuni

### Alternative con binding diversi

Questo programma **non compila** (E0408):

```rust
fn main() {
    let value = Some(1);
    match value {
        Some(number) | None => println!("{number}"),
    }
}
```

`number` non esiste nel caso `None`. Separa i rami oppure ignora il contenuto in entrambi se davvero non serve.

### Due proprietari dello stesso campo

Questo programma **non compila** (E0382):

```rust
struct Pair {
    left: String,
    right: String,
}

fn main() {
    let pair = Pair {
        left: String::from("uno"),
        right: String::from("due"),
    };
    let whole @ Pair { left, .. } = pair;
    println!("{} {left}", whole.right);
}
```

Il binding `whole` vorrebbe prendere l'intero valore mentre `left` ne sposta un campo non `Copy`. Per sola lettura usa `&pair` come nell'esempio precedente; non aggiungere una clonazione senza valutarne lo scopo.

Altri errori frequenti:

- Guardie senza fallback, anche quando sembrano matematicamente esaustive.
- `..` ripetuto nello stesso pattern di tupla o slice.
- Range o alternative ASCII presentati come classificazione Unicode completa.
- Un pattern generale prima dei casi specifici.
- Un `_` troppo ampio che nasconde future varianti da gestire.
- Pattern molto densi che nascondono le decisioni applicative.

## Checklist

- Le alternative introducono gli stessi binding e tipi?
- La guardia si applica all'intero gruppo previsto?
- I confini dei range e le slice vuote sono stati provati?
- `@` prende ownership o solo un riferimento?
- Prestiti e modificatori sono compatibili con l'edition?
- Il demo riconosce soltanto una forma o valida davvero un formato completo?
- Una variante nuova richiedera una decisione esplicita?

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Control flow avanzato|Control flow avanzato]]
- [[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024|Rust 2018, 2021 e 2024]]

## Fonti

- [Rust Book: pattern syntax](https://doc.rust-lang.org/book/ch19-03-pattern-syntax.html).
- [Rust Reference: patterns e or-patterns](https://doc.rust-lang.org/reference/patterns.html).
- [Rust Reference: match e guardie](https://doc.rust-lang.org/reference/expressions/match-expr.html).
- [Edition Guide: match ergonomics in Rust 2024](https://doc.rust-lang.org/edition-guide/rust-2024/match-ergonomics.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
