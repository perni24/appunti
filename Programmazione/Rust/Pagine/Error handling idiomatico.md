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
  - error-handling
  - idiomatico
aliases:
  - Gestione errori idiomatica
  - Idiomatic error handling Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Option]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
related:
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/Error types pubblici]]"
  - "[[Programmazione/Rust/Pagine/panic]]"
title: Error handling idiomatico
---

# Error handling idiomatico

## Sintesi

Gestire un errore significa scegliere **come rappresentarlo**, **dove propagarlo o recuperarlo** e **dove comunicarlo**. Sono responsabilita diverse: `?` propaga, un tipo descrive i casi e il livello applicativo decide la risposta.

`Option`, `Result` e `panic!` non sono tre livelli di gravita. L'assenza puo essere normale, un `Result` puo richiedere di terminare l'applicazione e un panic puo riguardare un singolo thread con unwind.

## Quando usarlo

- Progettare funzioni fallibili e confini tra moduli.
- Distinguere errori sui quali il chiamante deve reagire diversamente.
- Conservare una causa tecnica aggiungendo il contesto dell'operazione.
- Evitare sia errori silenziosi sia log duplicati o troppo dettagliati.

## Come funziona

Scegli in base al contratto:

- `Option<T>`: il chiamante deve distinguere presenza e assenza, senza una causa.
- `Result<T, E>`: il fallimento deve avere un significato esplicito.
- `Result<Option<T>, E>`: ricerca riuscita senza risultato distinta da errore tecnico.
- `panic!`: violazione di una precondizione/invariante che l'API ha scelto di non modellare come errore ordinario.

"Recuperabile" non promette che basti riprovare. Un errore permanente non va ritentato alla cieca; per operazioni con effetti, prima di un retry occorre sapere se l'azione possa essere gia riuscita e se sia idempotente.

### Assenza normale e errore di lettura

Ogni blocco Rust e autonomo per `src/main.rs`. Baseline: Rust 1.99.1, edition 2024, nessuna dipendenza.

```rust
use std::{fs, io, path::Path};

fn optional_read(result: io::Result<String>) -> io::Result<Option<String>> {
    match result {
        Ok(text) => Ok(Some(text)),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error),
    }
}

fn read_optional(path: &Path) -> io::Result<Option<String>> {
    optional_read(fs::read_to_string(path))
}

fn main() {
    assert_eq!(optional_read(Ok(String::new())).unwrap(), Some(String::new()));
    assert!(matches!(
        optional_read(Err(io::ErrorKind::NotFound.into())),
        Ok(None)
    ));
    let error = optional_read(Err(io::ErrorKind::PermissionDenied.into()))
        .unwrap_err();
    assert_eq!(error.kind(), io::ErrorKind::PermissionDenied);
}
```

Il demo in `main` prova la classificazione senza leggere file. `read_optional` e l'adapter reale: il chiamante gli passa un percorso. Qui un file mancante e accettabile, ma un file vuoto e `Some("")` e un altro errore resta `Err`.

Non usare `.ok()` per trasformare ogni errore in assenza, ne `path.exists()` prima della lettura come garanzia: tra controllo e accesso il filesystem puo cambiare. La classificazione usa `ErrorKind`, non il testo localizzato del sistema. Non verifica autorizzazioni applicative e non legge file di dimensione limitata.

## API / Sintassi

### Errore di dominio senza cause sottostanti

```rust
use std::{error::Error, fmt};

#[derive(Debug, PartialEq)]
enum NameError {
    Missing,
    Blank,
    TooShort,
}

impl fmt::Display for NameError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Self::Missing => "name is required",
            Self::Blank => "name is blank",
            Self::TooShort => "name needs at least three Unicode scalars",
        })
    }
}

impl Error for NameError {}

fn validate_name(raw: Option<&str>) -> Result<&str, NameError> {
    let name = raw.ok_or(NameError::Missing)?.trim();
    if name.is_empty() {
        return Err(NameError::Blank);
    }
    if name.chars().take(3).count() < 3 {
        return Err(NameError::TooShort);
    }
    Ok(name)
}

fn main() {
    assert_eq!(validate_name(None), Err(NameError::Missing));
    assert_eq!(validate_name(Some(" \t ")), Err(NameError::Blank));
    assert_eq!(validate_name(Some("\u{e8}\u{e8}")), Err(NameError::TooShort));
    assert_eq!(validate_name(Some(" Ada ")), Ok("Ada"));
    assert!(NameError::TooShort.source().is_none());
}
```

Policy del demo: trim ai margini e almeno tre **valori scalari Unicode**. `str::len()` conta byte: due lettere accentate possono superare tre byte senza essere tre scalari. Nemmeno `chars().count()` conta grafemi; sequenze con accenti combinanti possono essere percepite come un solo carattere. Questo non e un validatore universale di nomi: mancano limiti massimi, normalizzazione e altre regole di prodotto.

`Debug` serve alla diagnosi, `Display` al messaggio, `Error::source` alla causa. Qui non c'e una causa tecnica da incapsulare, quindi il metodo predefinito restituisce `None`. Il codice chiamante deve fare matching sulle varianti, non su `to_string()`.

## Esempio pratico

### Contesto del file e causa conservata

Questo programma definisce il parser e la lettura in sola lettura; `main` verifica il parser, senza richiedere file esterni.

```rust
use std::{error::Error, fmt, fs, io, num::ParseIntError, path::{Path, PathBuf}};

#[derive(Debug)]
enum ConfigError {
    Read { path: PathBuf, source: io::Error },
    InvalidPort(ParseIntError),
    ZeroPort,
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Read { path, .. } => write!(f, "cannot read {}", path.display()),
            Self::InvalidPort(_) => f.write_str("invalid port number"),
            Self::ZeroPort => f.write_str("port must be nonzero"),
        }
    }
}

impl Error for ConfigError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Read { source, .. } => Some(source),
            Self::InvalidPort(source) => Some(source),
            Self::ZeroPort => None,
        }
    }
}

impl From<ParseIntError> for ConfigError {
    fn from(source: ParseIntError) -> Self {
        Self::InvalidPort(source)
    }
}

type ConfigResult<T> = Result<T, ConfigError>;

fn parse_port(raw: &str) -> ConfigResult<u16> {
    let port = raw.trim().parse::<u16>()?;
    if port == 0 {
        return Err(ConfigError::ZeroPort);
    }
    Ok(port)
}

fn load_port(path: &Path) -> ConfigResult<u16> {
    let text = fs::read_to_string(path).map_err(|source| ConfigError::Read {
        path: path.to_owned(),
        source,
    })?;
    parse_port(&text)
}

fn main() {
    assert_eq!(parse_port(" 8080\n").unwrap(), 8080);
    assert!(matches!(parse_port("0"), Err(ConfigError::ZeroPort)));
    let error = parse_port("bad").unwrap_err();
    assert_eq!(error.to_string(), "invalid port number");
    assert!(error.source().unwrap().is::<ParseIntError>());
}
```

Il tipo conserva la causa senza incorporarla due volte nel messaggio: `Display` descrive il livello corrente, `source()` espone quello inferiore.

`From<ParseIntError>` consente la conversione di `?`. Per l'I/O usiamo `map_err` perche serve anche il percorso corrente: `From<io::Error>` non potrebbe ricavarlo da solo. L'alias `ConfigResult` non crea un nuovo tipo o nuove conversioni.

Limiti espliciti: il percorso compare negli errori di lettura, non in quelli di parsing; il parser non conserva il testo grezzo. La lettura richiede UTF-8, carica tutto il file e non interpreta TOML. Sono ammessi spazi ai margini e il segno `+`; porta zero rifiutata per policy, non verificata la disponibilita in rete.

### Gestione al confine applicativo

La nota [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]] mostra la CLI completa con contesto anche sul parsing. La regola resta la stessa senza crate:

1. Il livello basso restituisce l'errore, senza stamparlo a ogni passaggio.
2. Il chiamante recupera solo nei casi previsti, oppure aggiunge contesto e propaga.
3. Il confine applicativo sceglie messaggio, destinazione del log e codice di uscita.
4. La catena tecnica non va esposta automaticamente a client non fidati: percorsi, query e dettagli del sistema possono essere sensibili.

La presenza di `Error` non aggiunge logging, traduzione, retry, HTTP status o transazioni. Se una scrittura e parziale, restituire `Err` non la annulla.

## Varianti

- **Enum tipizzato**: utile quando il chiamante deve distinguere casi; aggiungere varianti a un enum pubblico esaustivo puo rompere i match esterni.
- **Struct opaca o enum non esaustivo**: possibili scelte di evoluzione, da progettare prima di stabilizzare l'API.
- **`Box<dyn Error>`**: puo essere appropriato a confini eterogenei, ma non espone un insieme esaustivo di casi. Per trasferimento/condivisione tra thread possono servire `Send + Sync`.
- **`thiserror`**: genera implementazioni per il tuo tipo; non progetta automaticamente il contratto.
- **`anyhow`**: reporting e contesto dinamici, spesso convenienti nel livello applicativo; non vietato per definizione in ogni libreria.
- **Raccolta di errori**: `?` e `collect::<Result<...>>()` si fermano al primo. La validazione di un form puo invece richiedere un elenco di problemi.

## Errori comuni

- Nascondere errori diversi dietro `None`, un default o `String` quando il chiamante deve distinguerli.
- Perdere la causa con `map_err(|_| ... )` senza una decisione esplicita di astrazione o riservatezza.
- Considerare qualsiasi errore "non recuperato qui" un motivo per fare panic.
- Promettere una validazione dei caratteri usando una lunghezza in byte.
- Esporre `Debug` o l'intera source chain come messaggio pubblico.
- Duplicare la stessa diagnostica in ogni livello.

## Checklist

- Il contratto distingue assenza, input invalido e fallimento tecnico?
- Le varianti servono a decisioni reali del chiamante?
- Le cause restano disponibili senza duplicarle nel testo?
- Il contesto e sufficiente ma non include segreti?
- Successo, ogni errore, confini numerici e Unicode sono provati?
- Eventuali effetti parziali e retry sono documentati?

## Collegamenti

- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/panic|panic!]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]

## Fonti

Riferimento: Rust 1.99.1, edition 2024; nessuna MSRV complessiva dichiarata.

- [Rust Book: scelta tra panic e Result](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html).
- [Trait Error e source chain](https://doc.rust-lang.org/std/error/trait.Error.html).
- [From e conversioni](https://doc.rust-lang.org/std/convert/trait.From.html).
- [io::ErrorKind](https://doc.rust-lang.org/std/io/enum.ErrorKind.html).
- [str: byte e valori scalari](https://doc.rust-lang.org/std/primitive.str.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
