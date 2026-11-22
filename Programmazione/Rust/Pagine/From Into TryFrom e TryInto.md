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
  - From
  - Into
  - TryFrom
  - TryInto
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
related:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/Blanket implementations]]"
title: From, Into, TryFrom e TryInto
---

# From, Into, TryFrom e TryInto

## Sintesi

Questi trait descrivono **conversioni esplicite tra tipi**. `From` e `Into` producono direttamente il valore di destinazione; `TryFrom` e `TryInto` restituiscono un `Result` con un tipo di errore associato.

Implementare una conversione non abilita assegnazioni implicite, non genera automaticamente il percorso inverso e non impone che la conversione sia economica. Gli esempi sono autonomi, verificati con **Rust 1.99.1, edition 2024**, senza dipendenze esterne. I due programmi in Errori comuni devono fallire in compilazione; la baseline non certifica una MSRV.

## Quando usarlo

- `From`: conversione infallibile, semanticamente fedele e con un significato evidente.
- `TryFrom`: controllo di intervallo o invarianti del tipo di destinazione.
- `Into<T>` e `TryInto<T>`: bound di input per funzioni generiche.
- `From<SourceError>`: conservare una causa dentro un errore applicativo.
- Un metodo nominato quando esistono piu policy, per esempio arrotondamento, saturazione o endianness.

Non usare `From` con `unwrap` per nascondere un fallimento previsto. La firma non puo impedirti tecnicamente di fare panic, ma violeresti il contratto atteso. Infallibile non significa assenza di allocazioni o di guasti di risorse. [Criteri per From](https://doc.rust-lang.org/std/convert/trait.From.html#when-to-implement-from).

## Come funziona

### Una sola implementazione per ogni direzione

`From<A> for B` rende disponibile `Into<B> for A`. Analogamente `TryFrom<A> for B` fornisce `TryInto<B> for A`, con lo stesso errore. Sono blanket implementation della standard library, non codice generato da una macro.

```rust
use std::num::TryFromIntError;

#[derive(Debug, PartialEq, Eq)]
struct UserId(u64);

impl From<u64> for UserId {
    fn from(value: u64) -> Self {
        Self(value)
    }
}

impl TryFrom<i64> for UserId {
    type Error = TryFromIntError;

    fn try_from(value: i64) -> Result<Self, Self::Error> {
        u64::try_from(value).map(Self)
    }
}

fn main() {
    assert_eq!(UserId::from(10_u64), UserId(10));
    let id: UserId = 20_u64.into();
    assert_eq!(id, UserId(20));

    let checked: Result<UserId, TryFromIntError> = 30_i64.try_into();
    assert_eq!(checked.unwrap(), UserId(30));
    assert!(UserId::try_from(-1_i64).is_err());
    assert_eq!(UserId::try_from(0_i64).unwrap(), UserId(0));
}
```

`UserId` qui ammette **ogni u64, incluso zero**: e un wrapper numerico, non la prova che un utente esista. La conversione da `i64` rifiuta i negativi e conserva `TryFromIntError` anziche trasformarlo in una stringa generica.

Le due implementazioni hanno sorgenti diverse: `u64` e `i64`. Non aggiungere un `Into<UserId>` manuale per lo stesso `u64`: entrerebbe in conflitto con quello derivato. Un Into manuale, invece, non genera From. [Into](https://doc.rust-lang.org/std/convert/trait.Into.html), [TryInto](https://doc.rust-lang.org/std/convert/trait.TryInto.html).

### Il ricevente puo essere un valore oppure un riferimento

Le firme prendono l'input per valore; se l'input e un riferimento, viene passato quel riferimento, non spostato l'oggetto referenziato. Per un valore non Copy, invece, il chiamante ne perde la proprieta anche quando una conversione fallisce, salvo recuperarlo tramite l'errore.

`From<&str> for String` crea una stringa posseduta; `From<String> for String` puo trasferire quella esistente. La conversione non implica una clonazione automatica o una vista senza allocazione.

## API / Sintassi

### Le quattro forme

| Conversione | Chiamata | Risultato |
| --- | --- | --- |
| `B: From<A>` | `B::from(value)` | `B` |
| `A: Into<B>` | `value.into()` | `B` |
| `B: TryFrom<A>` | `B::try_from(value)` | `Result<B, B::Error>` |
| `A: TryInto<B>` | `value.try_into()` | `Result<B, A::Error>` |

Gli errori nella tabella sono notazione abbreviata del tipo associato alla specifica conversione: per disambiguare usa `<B as TryFrom<A>>::Error` oppure `<A as TryInto<B>>::Error`.

`into` non ha parametri generici di metodo: `value.into::<B>()` non e la sintassi giusta. Indica `let result: B = value.into();`, usa `B::from(value)` oppure `Into::<B>::into(value)`. La destinazione e il tipo dell'input devono essere determinabili: non aspettarti che un letterale non suffissato venga provato contro ogni impl disponibile.

### Costruttore con Into senza conversioni anticipate

```rust
struct User {
    name: String,
}

impl User {
    fn new(name: impl Into<String>) -> Self {
        Self { name: name.into() }
    }
}

fn main() {
    let literal = User::new("Ada");
    assert_eq!(literal.name, "Ada");

    let owned = String::from("Lin");
    let moved = User::new(owned);
    assert_eq!(moved.name, "Lin");

    let source = String::from("Grace");
    let copied = User::new(source.as_str());
    assert_eq!(copied.name, "Grace");
    assert_eq!(source, "Grace");
}
```

Passa direttamente `"Ada"` a `new`: `User::new("Ada".into())` puo rendere ambiguo il tipo intermedio, perche il parametro e gia generico. Il costruttore conserva una String ma **non valida il nome**; stringa vuota e whitespace restano ammessi.

Preferisci `&str` quando serve solo leggere testo; usa `Into<String>` se l'API deve possederlo. Per le viste generiche vedi [[Programmazione/Rust/Pagine/AsRef AsMut e Borrow|AsRef, AsMut e Borrow]].

### Conversioni numeriche e bound fallibili

```rust
use std::convert::Infallible;

fn to_byte<T: TryInto<u8>>(value: T) -> Result<u8, T::Error> {
    value.try_into()
}

fn main() {
    assert_eq!(u16::from(255_u8), 255);
    assert_eq!(to_byte(255_u16).unwrap(), 255);
    assert!(to_byte(256_u16).is_err());
    assert!(to_byte(-1_i16).is_err());

    let already_small: Result<u8, Infallible> = to_byte(7_u8);
    assert_eq!(already_small, Ok(7));
    let widened: Result<u16, Infallible> = u16::try_from(7_u8);
    assert_eq!(widened, Ok(7));

    assert_eq!(256_u16 as u8, 0);
    assert_eq!(-1_i16 as u8, 255);
}
```

`as` e un cast del linguaggio: non chiama From/TryFrom e non e una validazione di intervallo. Qui tronca o cambia l'interpretazione del valore; non significa che ogni cast perda dati. [Rust Reference: cast numerici](https://doc.rust-lang.org/reference/expressions/operator-expr.html#numeric-cast).

Se `A: Into<B>`, esiste anche `B: TryFrom<A, Error = Infallible>`. Il risultato e sempre `Ok` per quella conversione; il nome TryFrom non implica quindi che ogni implementazione possa produrre un errore. `Infallible` non ha varianti e non equivale a `()`. [Infallible](https://doc.rust-lang.org/std/convert/enum.Infallible.html).

Il bound `TryInto<u8>` accetta anche implementazioni dirette di TryInto e conserva il loro errore, senza imporre `Error = TryFromIntError`. Non tutte le coppie numeriche dispongono di una conversione standard: per esempio non c'e un TryFrom generico da float a intero. Se serve, definisci esplicitamente come trattare frazioni, NaN e limiti.

## Esempio pratico

### Porta configurata con parsing e validazione separati

In questo esempio `Port` rappresenta una **porta di destinazione configurata tra 1 e 65535**. Escludere zero e una policy del modello, non una regola universale delle API di rete: zero puo avere altri significati, per esempio chiedere al sistema una porta locale disponibile.

```rust
use std::{error::Error, fmt, num::ParseIntError, str::FromStr};

#[derive(Debug, PartialEq, Eq)]
struct Port(u16);

#[derive(Debug)]
enum PortError {
    InvalidNumber(ParseIntError),
    Zero,
}

impl fmt::Display for PortError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidNumber(_) => f.write_str("invalid port number"),
            Self::Zero => f.write_str("destination port must be nonzero"),
        }
    }
}

impl Error for PortError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::InvalidNumber(error) => Some(error),
            Self::Zero => None,
        }
    }
}

impl From<ParseIntError> for PortError {
    fn from(error: ParseIntError) -> Self {
        Self::InvalidNumber(error)
    }
}

impl TryFrom<u16> for Port {
    type Error = PortError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value == 0 {
            Err(PortError::Zero)
        } else {
            Ok(Self(value))
        }
    }
}

impl FromStr for Port {
    type Err = PortError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        let number = value.parse::<u16>()?;
        Self::try_from(number)
    }
}

impl TryFrom<&str> for Port {
    type Error = PortError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        value.parse()
    }
}

fn main() -> Result<(), PortError> {
    assert_eq!(Port::try_from(5432_u16)?, Port(5432));
    assert_eq!(Port::try_from("5432")?, "5432".parse::<Port>()?);
    let port: Port = "8080".try_into()?;
    assert_eq!(port, Port(8080));
    assert!(matches!(Port::try_from("0"), Err(PortError::Zero)));

    let error = Port::try_from("bad").unwrap_err();
    assert!(error.source().unwrap().is::<ParseIntError>());
    assert!(Port::try_from("65536").is_err());
    Ok(())
}
```

La validazione numerica vive in `TryFrom<u16>`; `FromStr` applica prima il parser u16, poi quella regola. `TryFrom<&str>` delega al parsing: non duplica la policy.

Il `?` dopo `parse::<u16>()` converte **ParseIntError in PortError**, grazie a From. Una funzione che restituisce `Result<u64, ParseIntError>` e usa `parse::<u64>()?` propaga invece lo stesso tipo di errore. Implementare `std::error::Error` da solo non abilita la conversione; `map_err` e l'alternativa per aggiungere contesto specifico. La causa originale rimane consultabile con `source()`; Display descrive l'errore esterno senza duplicare il testo della causa. [Error](https://doc.rust-lang.org/std/error/trait.Error.html).

Limiti dichiarati:

- Si usa la grammatica di `u16`: cifre ASCII decimali, `+` iniziale e zeri iniziali ammessi; nessun `trim`. Whitespace, segno negativo, testo vuoto e valori fuori intervallo sono errori di parsing.
- `FromStr` e `TryFrom<&str>` non si generano a vicenda: qui entrambi sono implementati esplicitamente.
- Il campo privato protegge il confine del modulo, non il codice del modulo stesso o dei suoi discendenti, che devono comunque rispettare l'invariante. Per esporre questa API rendi pubblici Port e PortError, lasciando privato il campo numerico: anche l'errore associato compare nell'interfaccia pubblica. [Visibilita](https://doc.rust-lang.org/reference/visibility-and-privacy.html).
- Il demo non apre socket, non verifica disponibilita o autorizzazioni e non certifica la validita di una configurazione di rete.

## Varianti

### Conversione che restituisce una vista borrowed

```rust
#[derive(Debug, PartialEq, Eq)]
struct Label<'a>(&'a str);

impl<'a> TryFrom<&'a str> for Label<'a> {
    type Error = &'static str;

    fn try_from(value: &'a str) -> Result<Self, Self::Error> {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            Err("empty label")
        } else {
            Ok(Self(trimmed))
        }
    }
}

fn main() {
    let source = String::from(" Rust ");
    let label = Label::try_from(source.as_str()).unwrap();
    assert_eq!(label.0, "Rust");
    assert_eq!(source, " Rust ");
    assert!(Label::try_from(" \t").is_err());
}
```

Il lifetime lega la vista all'input; non si crea una nuova String. La policy rimuove whitespace ai bordi e rifiuta il vuoto, non valida HTML, identificatori o caratteri invisibili in generale.

`FromStr` non puo esprimere un output che **prende in prestito lo specifico input di quella chiamata**, perche la firma non lega quel lifetime a Self. Usa TryFrom con un lifetime esplicito o un metodo dedicato. Non e un divieto generale di implementare FromStr per qualsiasi tipo che abbia un parametro lifetime. [FromStr](https://doc.rust-lang.org/std/str/trait.FromStr.html).

### Recuperare un input posseduto attraverso l'errore

```rust
fn main() {
    let input = vec![String::from("api")];
    let result: Result<[String; 2], Vec<String>> = input.try_into();
    let mut recovered = result.unwrap_err();
    assert_eq!(recovered, ["api"]);

    recovered.push(String::from("web"));
    let pair: [String; 2] = recovered.try_into().unwrap();
    assert_eq!(pair, ["api", "web"]);
}
```

Questa specifica conversione da Vec ad array restituisce il Vec nell'errore se la lunghezza non coincide. Cosi puoi correggerlo e riprovare. Non vale per ogni TryFrom: il tipo associato Error determina se l'input e recuperabile. Nel caso di successo gli elementi vengono trasferiti, senza richiedere Clone. [Array: conversione da Vec](https://doc.rust-lang.org/std/primitive.array.html).

### Contratti da non confondere

- From e TryFrom non sostituiscono una coercizione automatica; `as` non richiama trait custom.
- `Display` e `to_string` formattano valori; `FromStr` li interpreta. Avere entrambi non garantisce un round-trip senza perdita.
- In genere implementa From/TryFrom e usa Into/TryInto nei bound; non riscrivere tutte e quattro le impl.
- TryFrom e TryInto sono nel prelude da **edition 2021**. Su edition 2018 importali da `std::convert`; FromStr richiede un import per scrivere `impl FromStr`, mentre `.parse()` e un metodo di str. [Edition Guide](https://doc.rust-lang.org/edition-guide/rust-2021/prelude.html).

## Errori comuni

### From e TryFrom in conflitto sulla stessa coppia

Controesempio intenzionale: **E0119**.

```rust
struct Count(u8);

impl From<u8> for Count {
    fn from(value: u8) -> Self {
        Self(value)
    }
}

impl TryFrom<u8> for Count {
    type Error = &'static str;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        if value == 0 { Err("zero") } else { Ok(Self(value)) }
    }
}

fn main() {}
```

From rende disponibile Into e, tramite la blanket impl standard, anche TryFrom con `Infallible`. L'impl fallibile aggiunta si sovrappone. Decidi il contratto: se zero va rifiutato, rimuovi From e mantieni TryFrom. Altri dettagli in [[Programmazione/Rust/Pagine/Blanket implementations|Blanket implementations]].

### Le conversioni non sono concatenate automaticamente

Controesempio intenzionale: **E0277**.

```rust
struct Raw(u8);
struct Middle(u8);
struct Final(u8);

impl From<Raw> for Middle {
    fn from(value: Raw) -> Self { Self(value.0) }
}

impl From<Middle> for Final {
    fn from(value: Middle) -> Self { Self(value.0) }
}

fn main() {
    let result: Final = Raw(7).into();
    assert_eq!(result.0, 7);
}
```

Scrivi `Final::from(Middle::from(Raw(7)))`, oppure implementa una conversione diretta se ha un significato stabile. Anche la conversione degli errori di `?` non cerca una catena arbitraria di From.

- Non supporre che `From<A> for B` fornisca `From<B> for A`.
- Non accettare Into ovunque se nasconde ownership e allocazioni.
- Non trasformare ogni errore in una String quando serve distinguere le cause.
- Non usare `unwrap` su dati esterni senza una policy di gestione; nei demo positivi gli input sono fissati dagli assert.
- Orphan rules e overlap restano validi: un alias non crea un tipo locale; un newtype puo fornire il confine appropriato.

## Checklist

- Conversione infallibile oppure errore realmente possibile?
- Informazione e significato preservati, senza policy nascoste?
- Tipo sorgente e destinazione inferibili?
- Input spostato, prestato o recuperabile dall'errore?
- Errore originale conservato e contesto aggiunto dove serve?
- Impl derivata gia presente o conflitto con From/TryFrom?
- Parsing, validazione del dominio e verifica delle risorse separati?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Blanket implementations|Blanket implementations]]
- [[Programmazione/Rust/Pagine/AsRef AsMut e Borrow|AsRef, AsMut e Borrow]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]

## Fonti

Baseline **Rust 1.99.1**, edition **2024**. Solo API stable negli esempi.

- [From: contratto e implementazioni generiche](https://doc.rust-lang.org/std/convert/trait.From.html)
- [Into: bound e ownership](https://doc.rust-lang.org/std/convert/trait.Into.html)
- [TryFrom](https://doc.rust-lang.org/std/convert/trait.TryFrom.html)
- [TryInto](https://doc.rust-lang.org/std/convert/trait.TryInto.html)
- [Infallible e blanket TryFrom](https://doc.rust-lang.org/std/convert/enum.Infallible.html)
- [FromStr e relazione con Display](https://doc.rust-lang.org/std/str/trait.FromStr.html)
- [Error: cause concatenate](https://doc.rust-lang.org/std/error/trait.Error.html)
- [Array: TryFrom di Vec e slice](https://doc.rust-lang.org/std/primitive.array.html)
- [u16: grammatica numerica](https://doc.rust-lang.org/std/primitive.u16.html#method.from_str_radix)
- [TcpListener::bind: significato della porta locale zero](https://doc.rust-lang.org/std/net/struct.TcpListener.html#method.bind)
- [Rust Reference: operatori di cast e propagazione](https://doc.rust-lang.org/reference/expressions/operator-expr.html)
- [Edition Guide: prelude 2021](https://doc.rust-lang.org/edition-guide/rust-2021/prelude.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
