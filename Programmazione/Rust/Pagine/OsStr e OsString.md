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
  - OsStr
  - OsString
  - Stringhe OS
prerequisites:
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
  - "[[Programmazione/Rust/Pagine/Path e PathBuf]]"
related:
  - "[[Programmazione/Rust/Pagine/Process e Command]]"
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/FFI]]"
title: OsStr e OsString
---

# OsStr e OsString

## Sintesi

`OsStr` e `OsString` rappresentano dati testuali scambiati con il sistema operativo, per esempio nomi di file, argomenti e variabili d'ambiente. `&OsStr` e una vista borrowed; `OsString` possiede i dati, come `String` rispetto a `&str`.

La differenza decisiva e che **non impongono che il valore sia Unicode valido**. La loro rappresentazione interna non e necessariamente il buffer nativo richiesto da una API di sistema: su Windows non puoi trattare un `OsString` come un array di `u16` o un puntatore a stringa C.

## Quando usarlo

- Conservare un nome o un argomento OS senza perderne parti non Unicode.
- Passare dati a API Rust che accettano `AsRef<OsStr>`.
- Leggere argomenti con `args_os()` e variabili con `var_os()`.
- Confrontare un'estensione o un'opzione ASCII senza convertire tutto in `String`.
- Preparare conversioni specifiche per una piattaforma, rispettando il contratto della API destinataria.

Per manipolare **percorsi** usa `Path` e `PathBuf`: interpretano componenti, radici ed estensioni. `OsString::push` concatena dati, non inserisce separatori e non applica le regole di `PathBuf::push`.

## Come funziona

### Vista, copia e proprieta

Ogni blocco Rust valido e un programma autonomo. I due controesempi in Errori comuni sono intenzionalmente non compilabili.

```rust
use std::ffi::{OsStr, OsString};

fn with_suffix(value: &OsStr, suffix: &OsStr) -> OsString {
    let mut owned = value.to_os_string();
    owned.push(suffix);
    owned
}

fn main() {
    let text = String::from("report");
    let borrowed = OsStr::new(&text);
    let result = with_suffix(borrowed, OsStr::new(".bak"));

    assert_eq!(borrowed, OsStr::new("report"));
    assert_eq!(result.as_os_str(), OsStr::new("report.bak"));
    assert_eq!(text, "report");

    let mut joined = OsString::from("data");
    joined.push("config.toml");
    assert_eq!(joined, OsStr::new("dataconfig.toml"));

    let unicode = OsStr::new("\u{00E8}");
    assert_eq!(unicode.len(), 2);
    assert_eq!(unicode.to_str().unwrap().chars().count(), 1);
}
```

`OsStr::new(&text)` prende in prestito il testo; `to_os_string()` crea una copia posseduta. `OsString::from(text)` puo invece acquisire una `String` per valore, che non potrai piu usare. `OsString` implementa `Deref<Target = OsStr>`.

`len()` misura le unita del buffer interno, non caratteri, grafemi o code unit Windows. Per testo Unicode queste unita sono byte UTF-8; per altri valori non usarle per dedurre una codifica portabile. `with_capacity` e `reserve` lavorano nelle stesse unita, ma non garantiscono una capacita esattamente uguale alla richiesta.

### Conversione controllata e conversione lossy

```rust
use std::borrow::Cow;
use std::ffi::{OsStr, OsString};

#[cfg(windows)]
fn unusual() -> OsString {
    use std::os::windows::ffi::OsStringExt;
    OsString::from_wide(&[0x006E, 0xD800])
}

#[cfg(unix)]
fn unusual() -> OsString {
    use std::os::unix::ffi::OsStringExt;
    OsString::from_vec(vec![b'n', 0xFF])
}

fn main() {
    let normal = OsStr::new("caff\u{00E8}");
    assert_eq!(normal.to_str(), Some("caff\u{00E8}"));
    assert!(matches!(normal.to_string_lossy(), Cow::Borrowed(_)));
    assert_eq!(
        OsString::from("caff\u{00E8}").into_string().unwrap(),
        "caff\u{00E8}",
    );

    #[cfg(any(windows, unix))]
    {
        let original = unusual();
        assert!(original.to_str().is_none());
        let recovered = original.into_string().unwrap_err();
        assert_eq!(recovered, unusual());

        let shown = recovered.to_string_lossy();
        assert_eq!(shown, "n\u{FFFD}");
        assert!(matches!(&shown, Cow::Owned(_)));
        assert_ne!(OsString::from(shown.into_owned()), recovered);
    }
}
```

- `to_str()` restituisce `Option<&str>` senza consumare il valore; `None` significa che non e rappresentabile come testo Unicode valido.
- `into_string()` consuma l'`OsString`. Il risultato e `Result<String, OsString>`: in caso di errore ricevi indietro i dati originali.
- `to_string_lossy()` restituisce `Cow<'_, str>`: puo prendere in prestito il testo valido oppure produrre una stringa con caratteri di rimpiazzo.
- `display()` fornisce un adapter per mostrare il valore nella baseline. `Debug` offre diagnostica con escaping; nessuno dei due e un formato stabile per ricostruire i dati.

La conversione lossy e sicura rispetto alla memoria, ma **non conserva sempre l'informazione**. Non usarla per identificare un file, confrontare chiavi o passare un argomento operativo: valori distinti possono diventare lo stesso testo. Non e neppure un filtro per segreti o un escaping specifico per HTML e shell.

## API / Sintassi

| Operazione | Risultato | Proprieta |
| --- | --- | --- |
| `OsStr::new(&value)` | `&OsStr` | Vista borrowed. |
| `value.as_os_str()` su OsString | `&OsStr` | Vista sul buffer posseduto. |
| `value.to_os_string()` | `OsString` | Copia posseduta. |
| `value.to_str()` | `Option<&str>` | Unicode controllato, senza consumo. |
| `value.into_string()` | `Result<String, OsString>` | Consumo, con recupero in Err. |
| `value.to_string_lossy()` | `Cow<'_, str>` | Possibile perdita di dati. |
| `std::env::args_os()` | `ArgsOs` | Iteratore di OsString. |
| `std::env::var_os(key)` | `Option<OsString>` | Valore OS o assenza/errore. |

`as_encoded_bytes()` espone byte di una codifica interna non specificata e dipendente dalla piattaforma: **non e un formato per salvare e ricaricare stringhe OS fra versioni o sistemi**. Non passarli a `from_encoded_bytes_unchecked` se provengono arbitrariamente da un file o dalla rete. Per interscambio scegli una codifica/protocollo documentato; per le rappresentazioni native usa i trait di estensione appropriati.

## Esempio pratico

### Confrontare un'estensione senza conversione Unicode

```rust
use std::ffi::OsStr;
use std::path::Path;

fn is_rust_file(path: &Path) -> bool {
    path.extension() == Some(OsStr::new("rs"))
}

fn main() {
    assert!(is_rust_file(Path::new("src/main.rs")));
    assert!(!is_rust_file(Path::new("src/main.RS")));
    assert!(!is_rust_file(Path::new(".rs")));
    assert!(!is_rust_file(Path::new("archive.rs.bak")));
    assert!(!is_rust_file(Path::new("no_extension")));
}
```

Il confronto non richiede che l'intero percorso sia Unicode e distingue maiuscole/minuscole. Riguarda soltanto il nome: non controlla esistenza, tipo dell'oggetto o correttezza del codice Rust contenuto.

`eq_ignore_ascii_case` e una scelta esplicita per confronti ASCII senza distinzione di caso, non un confronto Unicode completo o una normalizzazione del filesystem.

### Scegliere un percorso da argomenti e ambiente

```rust
use std::ffi::OsString;
use std::path::PathBuf;

fn select_input(
    argument: Option<OsString>,
    fallback: Option<OsString>,
) -> Result<PathBuf, &'static str> {
    let value = argument
        .or(fallback)
        .unwrap_or_else(|| OsString::from("input.txt"));
    if value.is_empty() {
        return Err("input path is empty");
    }
    Ok(PathBuf::from(value))
}

fn main() -> Result<(), &'static str> {
    let argument = std::env::args_os().nth(1);
    let fallback = std::env::var_os("APPUNTI_DEMO_INPUT");
    let path = select_input(argument, fallback)?;
    println!("path: {}", path.display());
    Ok(())
}
```

La politica del demo e: primo argomento, altrimenti variabile `APPUNTI_DEMO_INPUT`, altrimenti `input.txt`. Un valore presente ma vuoto e rifiutato, non sostituito silenziosamente dal fallback.

**Effetti:** legge solo argomenti e quella variabile, poi stampa il percorso; non apre file, non avvia comandi e non modifica l'ambiente. I valori non Unicode restano nel `PathBuf`; la stampa e soltanto diagnostica e puo perdere informazione.

`args()` puo andare in panic durante l'iterazione su un argomento non Unicode; `args_os()` evita quel requisito, ma non analizza opzioni o valida valori. Il primo elemento tradizionalmente identifica l'eseguibile, ma non e un dato affidabile per autorizzazioni.

`var_os` non distingue tutti gli errori: `None` puo indicare assenza o un nome di variabile non ammesso, per esempio contenente `=` o NUL. `var` restituisce invece `Result<String, VarError>` e distingue anche `NotUnicode`. `Some(OsString::new())` non e equivalente a `None`.

Non assumere che `HOME` sia definita ovunque o identifichi sempre la directory desiderata. Lettura dell'ambiente e ricerca di directory applicative sono responsabilita distinte.

### Liste di percorsi senza separatori scritti a mano

```rust
use std::env;
use std::path::PathBuf;

fn main() -> Result<(), env::JoinPathsError> {
    let paths = [
        PathBuf::from("bin tools"),
        PathBuf::from("vendor/bin"),
    ];
    let encoded = env::join_paths(&paths)?;
    let decoded: Vec<PathBuf> = env::split_paths(&encoded).collect();
    assert_eq!(decoded.as_slice(), paths.as_slice());
    Ok(())
}
```

`split_paths` e `join_paths` gestiscono la sintassi delle liste come `PATH`: su Windows usano le convenzioni con `;` e quoting, sui comuni sistemi Unix il separatore e `:`. Non equivalgono a `Path::join`, che costruisce **un singolo percorso**.

Il demo elabora valori fittizi e non legge o modifica `PATH`. `join_paths` puo fallire su componenti non rappresentabili nella lista; non scartare il suo errore. Queste API non sono disponibili con la stessa semantica su ogni target, per esempio ambienti senza variabile PATH delimitata.

## Varianti

### Rappresentazioni native e terminatori

```rust
use std::ffi::{CString, OsStr, OsString};

#[cfg(windows)]
fn wide_terminated(value: &OsStr) -> Result<Vec<u16>, &'static str> {
    use std::os::windows::ffi::OsStrExt;
    let mut units: Vec<u16> = value.encode_wide().collect();
    if units.contains(&0) {
        return Err("interior NUL");
    }
    units.push(0);
    Ok(units)
}

fn main() {
    let with_nul = OsString::from("part\0tail");
    assert_eq!(with_nul.to_str(), Some("part\0tail"));
    assert!(CString::new("part\0tail").is_err());

    #[cfg(windows)]
    {
        use std::os::windows::ffi::{OsStrExt, OsStringExt};
        let input = [0x0061, 0xD800];
        let value = OsString::from_wide(&input);
        assert_eq!(value.encode_wide().collect::<Vec<_>>(), input);
        assert_eq!(wide_terminated(&value).unwrap(), vec![0x0061, 0xD800, 0]);
        assert!(wide_terminated(&with_nul).is_err());
    }

    #[cfg(unix)]
    {
        use std::os::unix::ffi::{OsStrExt, OsStringExt};
        let bytes = vec![b'a', 0xFF];
        let value = OsString::from_vec(bytes.clone());
        assert_eq!(value.as_bytes(), bytes.as_slice());
        let c = CString::new(value.as_bytes()).unwrap();
        assert_eq!(c.as_bytes_with_nul(), &[b'a', 0xFF, 0]);
        assert_eq!(value.into_vec(), bytes);
    }
}
```

Su Unix `OsStrExt` permette viste sui byte tramite `as_bytes/from_bytes` e `OsStringExt` trasferisce vettori tramite `from_vec/into_vec`. Su Windows `from_wide` ed `encode_wide` conservano le code unit, anche se non formano UTF-16 valido; `encode_wide` **non aggiunge** un terminatore.

Il tipo OS puo contenere NUL e non e automaticamente terminato con NUL. Il helper Windows sopra prepara solo un buffer per API che richiedono quella terminazione: non convalida un nome file, non chiama una funzione nativa e non garantisce che una specifica API accetti ogni sequenza.

`CString/CStr` descrivono stringhe C a byte, terminate e senza NUL interni; **non impongono UTF-8** e non sono equivalenti a un buffer wide Windows. Il buffer proprietario deve rimanere vivo mentre una API usa il suo puntatore; il contratto di ownership non si risolve con una conversione.

Altre distinzioni:

- `String/&str` per testo UTF-8 da elaborare come testo; `OsString/&OsStr` per conservare valori OS; `PathBuf/&Path` per percorsi.
- L'output di un processo e normalmente una sequenza di byte: `Command::output` restituisce `Vec<u8>` per stdout/stderr, non automaticamente `OsString` o UTF-8.
- In edition 2024 `set_var` e `remove_var` richiedono `unsafe`; non basta aggiungere il blocco senza valutare le precondizioni. Per l'ambiente di un figlio preferisci `Command::env`, senza cambiare quello del processo corrente. Gli esempi qui non usano `unsafe`.

## Errori comuni

### Restituire una vista sul proprietario locale

Controesempio, **non compila** (`E0515` nella baseline).

```rust
use std::ffi::{OsStr, OsString};

fn label(input: &OsStr) -> &OsStr {
    let owned = OsString::from(input);
    owned.as_os_str()
}

fn main() {}
```

Restituisci `OsString` se serve un risultato indipendente; se non serve alcuna trasformazione, restituisci direttamente il riferimento `input`.

### Riusare un valore dopo into_string

Controesempio, **non compila** (`E0382` nella baseline).

```rust
use std::ffi::OsString;

fn main() {
    let name = OsString::from("demo");
    let text = name.into_string();
    println!("{name:?} {text:?}");
}
```

Per controllare il testo senza consumare il nome usa `to_str()`. Se hai scelto la conversione posseduta, gestisci il risultato e recupera l'`OsString` dal ramo `Err` quando necessario.

Altri errori da evitare:

- Usare `to_str().unwrap()` su input OS arbitrario.
- Considerare lossy una forma di validazione o di protezione dei log.
- Misurare caratteri o code unit Windows con `len()`.
- Interpretare byte interni come codifica stabile per archivi o rete.
- Usare `OsString::push` per comporre directory.
- Confondere ambiente assente, vuoto e non Unicode.
- Supporre che un contenitore OS renda validi NUL, nomi file o argomenti per ogni API.
- Trattare `CString` come UTF-8 garantito o come stringa wide.

## Checklist

- Serve testo Unicode oppure la conservazione esatta del valore OS?
- Il valore va preso in prestito o trasferito?
- Un errore di conversione conserva l'originale?
- La conversione lossy e limitata alla visualizzazione?
- Sto costruendo una stringa, un percorso o una lista di percorsi?
- Ambiente assente e valore vuoto hanno politiche distinte?
- La API nativa richiede byte, code unit wide o un terminatore?
- Sono rispettate durata e ownership dei buffer?
- Le informazioni mostrate nei log possono essere riservate?

## Collegamenti

- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
- [[Programmazione/Rust/Pagine/AsRef AsMut e Borrow|AsRef, AsMut e Borrow]]
- [[Programmazione/Rust/Pagine/Display e Debug|Display e Debug]]
- [[Programmazione/Rust/Pagine/Process e Command|Process e Command]]
- [[Programmazione/Rust/Pagine/File I O|File I/O]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]

## Fonti

Baseline: Rust **1.99.1**, edition **2024**, Windows GNU; documentazione consultata il **2026-11-05**. I rami Unix sono verificati documentalmente, non eseguiti su questa piattaforma. I link standard seguono la versione corrente e non certificano una MSRV.

- [OsString: rappresentazione, capacita e conversione posseduta](https://doc.rust-lang.org/std/ffi/struct.OsString.html).
- [OsStr: viste, conversioni e byte interni](https://doc.rust-lang.org/std/ffi/struct.OsStr.html).
- [std::ffi: differenze e conversioni fra famiglie di stringhe](https://doc.rust-lang.org/std/ffi/index.html).
- [args_os: argomenti OS](https://doc.rust-lang.org/std/env/fn.args_os.html).
- [args: Unicode e panic durante l'iterazione](https://doc.rust-lang.org/std/env/fn.args.html).
- [var_os: valore, assenza e limiti](https://doc.rust-lang.org/std/env/fn.var_os.html).
- [var: errori di lettura e Unicode](https://doc.rust-lang.org/std/env/fn.var.html).
- [split_paths: parsing della lista PATH](https://doc.rust-lang.org/std/env/fn.split_paths.html).
- [join_paths: ricomposizione e caratteri non ammessi](https://doc.rust-lang.org/std/env/fn.join_paths.html).
- [OsStrExt Windows: encode_wide](https://doc.rust-lang.org/std/os/windows/ffi/trait.OsStrExt.html).
- [OsStringExt Windows: from_wide](https://doc.rust-lang.org/std/os/windows/ffi/trait.OsStringExt.html).
- [OsStrExt Unix: viste sui byte](https://doc.rust-lang.org/std/os/unix/ffi/trait.OsStrExt.html).
- [OsStringExt Unix: vettori di byte](https://doc.rust-lang.org/std/os/unix/ffi/trait.OsStringExt.html).
- [CString: terminazione e NUL interni](https://doc.rust-lang.org/std/ffi/struct.CString.html).
- [Edition 2024: funzioni diventate unsafe](https://doc.rust-lang.org/edition-guide/rust-2024/newly-unsafe-functions.html).
- [set_var: precondizioni e alternativa per processi figli](https://doc.rust-lang.org/std/env/fn.set_var.html).
- [Output: stdout e stderr come byte](https://doc.rust-lang.org/std/process/struct.Output.html).
- [Command::env: ambiente del processo figlio](https://doc.rust-lang.org/std/process/struct.Command.html#method.env).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
