---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - standard-library
aliases:
  - Display
  - Debug
  - Formatting Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/rustfmt]]"
title: Display e Debug
---

# Display e Debug

## Sintesi

`Debug` e `Display` descrivono due rappresentazioni testuali di un valore: diagnostica per chi sviluppa (`{:?}`) e testo scelto per l'utente (`{}`).

`Debug` si puo derivare; per `Display` non esiste un derive standard. Nessuno dei due garantisce automaticamente riservatezza, escaping, serializzazione o stabilita del formato.

## Quando usarlo

- `Debug`: ispezionare stato e struttura, anche nei messaggi di fallimento dei test.
- `Display`: definire una rappresentazione leggibile per messaggi, CLI e altri contesti documentati.
- `Debug` manuale: selezionare i campi diagnostici o non esporre un dato sensibile.
- Un **adapter**: offrire piu rappresentazioni senza cambiare il formato principale del tipo.
- `Error`: rappresentare un errore con messaggio, diagnostica e, se presente, una causa.

Non derivare `Debug` per abitudine su credenziali o dati riservati. Se il testo viene consumato da software, stabilisci un contratto esplicito oppure usa un formato di serializzazione appropriato.

## Come funziona

### Due rappresentazioni dello stesso valore

Ogni blocco Rust valido e un programma autonomo. I due controesempi nella sezione Errori comuni sono intenzionalmente non compilabili.

```rust
use std::fmt;

#[derive(Debug)]
struct User {
    id: u64,
    name: String,
}

impl fmt::Display for User {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} ({})", self.name, self.id)
    }
}

fn print_user<T: fmt::Display + ?Sized>(value: &T) {
    println!("{value}");
}

fn main() {
    let user = User { id: 7, name: String::from("Ada") };
    assert_eq!(format!("{user}"), "Ada (7)");
    assert_eq!(user.to_string(), "Ada (7)");

    let compact = format!("{user:?}");
    let pretty = format!("{user:#?}");
    assert!(compact.contains("id"));
    assert!(pretty.contains('\n'));
    print_user(&user);
    assert_eq!(user.name, "Ada");
}
```

`fmt` riceve `&self`: rappresentare un valore non richiede di consumarlo. Anche `print_user` riceve un riferimento; `?Sized` permette tipi come `str` o un `dyn Display` dietro quel riferimento. Un helper scritto invece con `value: T` puo consumare il proprietario.

Il derive include i campi, anche quelli privati, usando il loro `Debug`. `{:#?}` chiede la variante estesa: derive e builder diagnostici standard la gestiscono. Un'implementazione completamente personalizzata deve decidere come trattarla.

Il testo esatto del `Debug` derivato o dei tipi standard puo cambiare tra versioni. Nel programma si verificano informazioni utili, non una serializzazione da ricaricare.

### Contratto del formatter

Entrambi i trait hanno un metodo con firma `fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result`, ma sono trait indipendenti: implementarne uno non implementa l'altro.

`fmt::Result` e `Result<(), fmt::Error>`. Dentro `fmt` propaga gli errori restituiti dal formatter, tramite `?` o restituendo direttamente il risultato di `write!`. **Non restituire un nuovo `fmt::Error` per dati applicativi invalidi**: validali prima, oppure scegli una rappresentazione testuale definita per quello stato.

Il segnale `fmt::Error` interrompe la scrittura senza trasportarne la causa. E appropriato che lo crei una destinazione che implementa `fmt::Write` quando non riesce a ricevere testo. Un formatter che lo restituisce arbitrariamente puo far andare in panic `format!` o `to_string()`, anche scrivendo in una `String`.

`write!(f, ...)` evita la costruzione obbligata di una stringa intermedia. Non e una garanzia generale di zero allocazioni: il codice dei formatter e la destinazione possono allocare. `format!` e `to_string()` producono invece una `String` posseduta.

## API / Sintassi

| Sintassi | Trait o destinazione | Significato |
| --- | --- | --- |
| `format!("{value}")` | `Display` | Testo principale in una nuova String. |
| `format!("{value:?}")` | `Debug` | Diagnostica compatta. |
| `format!("{value:#?}")` | `Debug` | Richiesta di diagnostica estesa. |
| `format!("{value:08}")` | `Display` | Larghezza e zeri, se l'implementazione li gestisce. |
| `format!("{value:x}")` | `LowerHex` | Formato esadecimale; non basta implementare Display. |
| `write!(&mut output, "{value}")` | Metodo `write_fmt` | Scrittura nella destinazione, con risultato da gestire. |
| `value.to_string()` | `ToString` | Disponibile automaticamente con Display. |

Per completare la sintassi:

- `{:>8}` allinea a destra in una larghezza minima; non tronca valori piu lunghi.
- `{:.2}` richiede precisione: il significato dipende dal tipo, per esempio due decimali per un float.
- `format!("{value:X}")`, `format!("{value:b}")` e `format!("{value:p}")` selezionano `UpperHex`, `Binary` e `Pointer`.
- `{{` e `}}` producono parentesi graffe letterali.
- `println!` e `eprintln!` aggiungono un newline e scelgono stdout o stderr.

`Display` fornisce `ToString` tramite una blanket implementation: normalmente implementa `Display`, non entrambi. Il testo prodotto non e automaticamente invertibile tramite `FromStr`, localizzato o stabile: questi sono impegni da documentare.

### Conservare le opzioni nel wrapper numerico

```rust
use std::fmt;

#[derive(Debug)]
struct Port(u16);

impl fmt::Display for Port {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(&self.0, f)
    }
}

fn main() {
    let port = Port(5432);
    assert_eq!(port.to_string(), "5432");
    assert_eq!(format!("{port:08}"), "00005432");
    assert_eq!(format!("{port:>6}"), "  5432");
    println!("debug: {port:?}");
    println!("display: {port}");
}
```

Delegare a `Display::fmt` del numero passa lo stesso formatter, comprese le opzioni del chiamante. Scrivere invece `write!(f, "{}", self.0)` usa una nuova specifica interna senza larghezza o flag esterni: per questo wrapper perderebbe il comportamento atteso di `{port:08}`.

Per implementazioni composte, come `User`, i flag non si applicano automaticamente all'intera rappresentazione. Devi gestirli o documentare quali supporti; per testo semplice puo essere utile `Formatter::pad`. La formattazione di `User` sopra descrive il solo formato di base.

`Port` qui dimostra il rendering di un `u16`: non valida regole applicative, non prova la disponibilita di una porta e non apre connessioni.

## Esempio pratico

### Debug che omette un segreto

```rust
use std::fmt;

struct Credentials {
    user: String,
    token: String,
}

impl fmt::Debug for Credentials {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Credentials")
            .field("user", &self.user)
            .field("token", &"<redacted>")
            .finish()
    }
}

fn main() {
    let credentials = Credentials {
        user: String::from("demo"),
        token: String::from("EXAMPLE_TOKEN_NOT_REAL"),
    };
    assert!(!credentials.token.is_empty());

    for rendered in [
        format!("{credentials:?}"),
        format!("{credentials:#?}"),
    ] {
        assert!(rendered.contains("<redacted>"));
        assert!(!rendered.contains("EXAMPLE_TOKEN_NOT_REAL"));
    }
}
```

Il builder `debug_struct` gestisce la struttura e il pretty-printing; `finish()` restituisce l'eventuale errore di scrittura.

Questo evita il token **in questa rappresentazione Debug**, non lo cancella dalla memoria e non protegge altri log, serializzazioni, formatter o accessi ai campi. Anche lo username e un dato da valutare prima di registrarlo. I valori del demo sono fittizi.

### Scrivere in testo o byte senza confondere i trait Write

```rust
use std::fmt::{self, Write as _};
use std::io::Write as _;

fn append_line<W: fmt::Write + ?Sized>(
    output: &mut W,
    label: &str,
) -> fmt::Result {
    writeln!(output, "item: {label}")
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut text = String::new();
    write!(&mut text, "report\n")?;
    append_line(&mut text, "rust")?;
    assert_eq!(text, "report\nitem: rust\n");

    let mut bytes = Vec::<u8>::new();
    writeln!(&mut bytes, "items: {}", 2)?;
    assert_eq!(bytes, b"items: 2\n");
    Ok(())
}
```

`fmt::Write` riceve testo UTF-8 e restituisce `fmt::Result`; `io::Write` lavora con byte e restituisce errori I/O. `String` usa il primo, `Vec<u8>` il secondo. Gli import `as _` rendono disponibili i metodi senza collisioni fra nomi.

`write!` restituisce il risultato del `write_fmt` della destinazione, non stampa necessariamente sulla console. `writeln!` aggiunge `\n`, anche su Windows. Qui entrambe le destinazioni sono in memoria; nessun file viene aperto.

Una scrittura puo lasciare un prefisso gia prodotto prima di fallire: il risultato non e una transazione. Per errori reali di file o socket, conserva `io::Error`; non convertirlo arbitrariamente nel solo `fmt::Error`.

`format_args!` prepara argomenti formattabili senza costruire la String finale, ed e alla base di queste macro. Puo prendere in prestito i valori: non e una stringa posseduta da conservare senza considerarne la durata.

### Un errore con messaggio e causa distinti

```rust
use std::{error::Error, fmt, num::ParseIntError};

#[derive(Debug)]
struct CountError(ParseIntError);

impl fmt::Display for CountError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("invalid item count")
    }
}

impl Error for CountError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(&self.0)
    }
}

fn parse_count(raw: &str) -> Result<u32, CountError> {
    raw.parse().map_err(CountError)
}

fn main() {
    assert_eq!(parse_count("8").unwrap(), 8);
    assert_eq!(parse_count("0").unwrap(), 0);

    let error = parse_count("abc").unwrap_err();
    assert_eq!(error.to_string(), "invalid item count");
    assert!(error.source().is_some());
}
```

`std::error::Error` **richiede** `Debug + Display`: non e solo una convenzione. Il messaggio del wrapper descrive il problema al proprio livello; la causa originale resta accessibile con `source()`, senza duplicarla nel messaggio.

Il parser del demo accetta un `u32`, incluso zero, senza regole di prodotto ulteriori. L'input errato non viene conservato nel wrapper. Per decidere cosa fare usa tipi, varianti o cause, non confronti sul testo di `Display`.

Un messaggio leggibile non e automaticamente adatto a una risposta pubblica: controlla anche dettagli interni e cause eventualmente esposte.

## Varianti

### Adapter borrowed per una seconda rappresentazione

```rust
use std::fmt;

struct Point {
    x: i32,
    y: i32,
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

struct CsvPoint<'a>(&'a Point);

impl Point {
    fn as_csv(&self) -> CsvPoint<'_> {
        CsvPoint(self)
    }
}

impl fmt::Display for CsvPoint<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{},{}", self.0.x, self.0.y)
    }
}

fn main() {
    let point = Point { x: 3, y: -4 };
    assert_eq!(point.to_string(), "(3, -4)");
    assert_eq!(point.as_csv().to_string(), "3,-4");
    assert_eq!(point.x, 3);
}
```

Un tipo non puo avere due implementazioni concorrenti di `Display`. L'adapter e un altro tipo che prende in prestito il valore e sceglie un altro formato; non puo sopravvivere a `point`.

Questo esempio gestisce soltanto due interi separati da virgola, non un serializzatore CSV generale. Analogamente puoi offrire adapter per locale, unita o visualizzazione ridotta, con contratti espliciti.

Altre distinzioni utili:

- `dbg!(value)` scrive diagnostica su stderr e restituisce il valore, ma puo spostarlo; `dbg!(&value)` lo prende in prestito. Non scompare automaticamente nelle build release.
- `Debug` e `Display` non eseguono automaticamente escaping HTML, SQL o shell. Neppure l'escaping diagnostico di una stringa sostituisce quello richiesto dalla destinazione.
- `rustfmt` formatta il codice sorgente, non il testo prodotto da questi trait.
- `assert_eq!` richiede anche `Debug` per costruire la diagnostica, non soltanto l'uguaglianza; questo requisito e verificato a compilazione.

## Errori comuni

### Il Debug di una collection non fornisce Display

Controesempio, **non compila** (`E0277` nella baseline).

```rust
fn main() {
    let values = vec![1, 2, 3];
    println!("{values}");
}
```

Per diagnostica usa `println!("{values:?}")`. Per un formato utente scegli una rappresentazione e un wrapper/adapter appropriato: anche se gli elementi implementano `Display`, la collection non ne riceve automaticamente un'implementazione.

### Il formato non e una stringa runtime

Controesempio, **non compila** nella baseline.

```rust
fn main() {
    let pattern = String::from("value: {}");
    println!(pattern, 7);
}
```

Le macro standard richiedono un formato noto a compilazione. `println!("{pattern}")` stampa letteralmente il contenuto, senza eseguirlo come template. Per modelli realmente dinamici serve un sistema dedicato.

Altri errori da evitare:

- Usare il `Debug` derivato come protocollo stabile o come filtro dei dati sensibili.
- Fare `write!(f, "{}", self)` oppure `self.to_string()` dentro il proprio `Display::fmt`: richiama lo stesso formatter ricorsivamente.
- Scartare l'errore di `write!` e restituire comunque `Ok(())`.
- Restituire `fmt::Error` per una validazione applicativa fallita.
- Promettere che width, precision o flag siano supportati senza implementarli.
- Considerare `Display` automaticamente serializzabile, traducibile o sicuro per ogni destinazione.

## Checklist

- Chi leggera il testo: persona, sviluppatore o altro programma?
- Quali campi possono finire in Debug e nei log?
- Serve un contratto stabile o un formato di serializzazione distinto?
- I trait richiesti dai segnaposto sono implementati?
- Quali opzioni del formatter vengono realmente rispettate?
- Gli errori della destinazione sono propagati senza nasconderli?
- Messaggio, causa tecnica ed errore di scrittura restano separati?
- Servono adapter per rappresentazioni alternative?

## Collegamenti

- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From, Into, TryFrom e TryInto]]
- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]

## Fonti

Baseline degli esempi: Rust **1.99.1**, edition **2024**; documentazione consultata il **2026-11-05**. I link standard seguono la versione corrente, non indicano una MSRV.

- [Display: contratto, adapter e limiti del formato](https://doc.rust-lang.org/std/fmt/trait.Display.html).
- [Debug: derive, builder e stabilita](https://doc.rust-lang.org/std/fmt/trait.Debug.html).
- [std::fmt: sintassi e trait selezionati](https://doc.rust-lang.org/std/fmt/index.html).
- [Formatter: opzioni, delega e pad](https://doc.rust-lang.org/std/fmt/struct.Formatter.html).
- [fmt::Error: propagazione degli errori della destinazione](https://doc.rust-lang.org/std/fmt/struct.Error.html).
- [write!: destinazioni e import dei trait](https://doc.rust-lang.org/std/macro.write.html).
- [fmt::Write: testo e fallimento della scrittura](https://doc.rust-lang.org/std/fmt/trait.Write.html).
- [Error: Debug, Display e source](https://doc.rust-lang.org/std/error/trait.Error.html).
- [ToString: implementazione automatica e panic](https://doc.rust-lang.org/std/string/trait.ToString.html).
- [dbg!: ownership, stderr e build release](https://doc.rust-lang.org/std/macro.dbg.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
