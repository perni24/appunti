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
  - Path
  - PathBuf
  - Percorsi Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
  - "[[Programmazione/Rust/Pagine/AsRef AsMut e Borrow]]"
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
related:
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/Process e Command]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa]]"
title: Path e PathBuf
---

# Path e PathBuf

## Sintesi

`Path` rappresenta un percorso come vista borrowed, normalmente `&Path`; `PathBuf` ne possiede il buffer e permette di modificarlo. Il rapporto e simile a quello fra `str` e `String`, ma la rappresentazione sottostante e basata su `OsStr` e `OsString`, non necessariamente su testo UTF-8.

**Un percorso non e un file aperto, una prova di esistenza o un permesso di accesso.** Costruire un `PathBuf` cambia dati in memoria; leggere o modificare il filesystem richiede operazioni distinte, che possono fallire.

## Quando usarlo

- `&Path` per ispezionare un percorso senza acquisirne la proprieta.
- `PathBuf` per costruire o conservare un percorso indipendente dal valore di origine.
- `AsRef<Path>` per accettare tipi diversi nelle API; passa `&path` se vuoi conservare un `PathBuf` del chiamante.
- `OsStr` per confrontare nomi ed estensioni senza conversioni Unicode.
- Metodi di `std::fs` quando serve conoscere o modificare lo stato reale del filesystem.

`Path` interpreta la sintassi della piattaforma su cui gira il programma: non e un parser universale di percorsi Windows su Unix, di URL o di percorsi remoti.

## Come funziona

### Vista borrowed e buffer posseduto

Ogni blocco Rust valido e un programma autonomo. I due controesempi in Errori comuni sono intenzionalmente non compilabili.

```rust
use std::ffi::OsStr;
use std::path::{Path, PathBuf};

fn name(path: &Path) -> Option<&OsStr> {
    path.file_name()
}

fn main() {
    let text = String::from("data/config.toml");
    let borrowed = Path::new(&text);
    assert_eq!(name(borrowed), Some(OsStr::new("config.toml")));

    let mut owned: PathBuf = borrowed.to_path_buf();
    owned.set_file_name("settings.toml");
    assert_eq!(owned, Path::new("data/settings.toml"));
    assert_eq!(borrowed, Path::new("data/config.toml"));

    let logs = PathBuf::from("logs");
    let joined = logs.join("app.log");
    assert_eq!(logs, Path::new("logs"));
    assert_eq!(joined, Path::new("logs/app.log"));

    let mut built = logs;
    built.push("app.log");
    assert_eq!(built, joined);
    assert!(built.pop());
    assert_eq!(built.as_path(), Path::new("logs"));
}
```

`Path::new(&text)` crea una vista senza copiare il buffer; il riferimento dipende dalla durata di `text`. `to_path_buf()` produce un valore posseduto distinto. `PathBuf` implementa `Deref<Target = Path>`: i metodi di ispezione sono utilizzabili anche sul buffer.

`join` restituisce un nuovo `PathBuf`; `push` modifica quello esistente. `pop` toglie l'ultimo componente del percorso, non cancella un file e non esegue `cd`. Nessuna di queste istruzioni crea directory.

### Percorso relativo, assoluto e piattaforma

Un percorso relativo viene interpretato dalle operazioni filesystem rispetto alla directory corrente del processo, **non** alla cartella del sorgente o dell'eseguibile. `PathBuf::from("data")` non memorizza la directory corrente: se questa cambia, un successivo accesso puo indicare un altro oggetto.

```rust
use std::path::Path;

fn main() {
    assert!(Path::new("data/config.toml").is_relative());

    #[cfg(unix)]
    {
        let base = Path::new("/srv/app");
        assert_eq!(base.join("/etc/config"), Path::new("/etc/config"));
        assert!(Path::new("/etc/config").is_absolute());
        assert_eq!(Path::new(r"data\config.toml").components().count(), 1);
    }

    #[cfg(windows)]
    {
        let base = Path::new(r"C:\app\data");
        assert_eq!(base.join(r"D:\other"), Path::new(r"D:\other"));
        assert_eq!(base.join(r"\other"), Path::new(r"C:\other"));
        assert_eq!(base.join("D:other"), Path::new("D:other"));

        assert!(Path::new(r"C:\app").is_absolute());
        assert!(Path::new(r"\app").has_root());
        assert!(!Path::new(r"\app").is_absolute());
        assert!(!Path::new("C:app").is_absolute());
        assert_eq!(Path::new(r"data\config.toml").components().count(), 2);
    }
}
```

Un argomento assoluto di `join` o `push` sostituisce la base. Su Windows una radice senza prefisso conserva il prefisso della base, mentre un prefisso senza radice puo sostituire tutto: **rifiutare soltanto `is_absolute()` non basta a garantire un percorso relativo sicuro**.

Su Unix `\` e normalmente parte di un nome; su Windows ordinario sia `/` sia `\` separano componenti. I prefissi Windows UNC, come `\\server\share`, e verbatim, come `\\?\C:\`, hanno regole specifiche: nel caso verbatim `/` non e un separatore. Non sostituire separatori alla cieca.

I rami `cfg` sono esempi di comportamento locale, non accessi alle directory nominate.

## API / Sintassi

| Operazione | Risultato | Uso |
| --- | --- | --- |
| `Path::new(&value)` | `&Path` | Vista legata a value. |
| `path.to_path_buf()` | `PathBuf` | Percorso posseduto. |
| `path.file_name()` | `Option<&OsStr>` | Ultimo nome, se presente. |
| `path.file_stem()` | `Option<&OsStr>` | Nome senza l'ultima estensione. |
| `path.extension()` | `Option<&OsStr>` | Ultima estensione, senza punto. |
| `path.parent()` | `Option<&Path>` | Percorso senza l'ultimo componente. |
| `path.join(child)` | `PathBuf` | Composizione secondo la piattaforma. |
| `buffer.set_extension("bak")` | `bool` | Sostituisce l'estensione nel buffer. |
| `path.strip_prefix(base)` | `Result<&Path, StripPrefixError>` | Resto dopo un prefisso di componenti. |

Nome, stem ed estensione sono concetti lessicali: `archive.tar.gz` ha stem `archive.tar` ed estensione `gz`. `.gitignore` non ha estensione; `report.` ha un'estensione presente ma vuota.

`parent()` di `config.toml` e `Some(Path::new(""))`, non `None`. Percorso vuoto e radice non hanno un parent. Un nome finale non dimostra che l'oggetto sia un file anziche una directory.

## Esempio pratico

### Costruire un nome di backup

```rust
use std::ffi::OsStr;
use std::path::{Path, PathBuf};

fn backup_path<P: AsRef<Path>>(path: P) -> Option<PathBuf> {
    let mut backup = path.as_ref().to_path_buf();
    if backup.set_extension("bak") {
        Some(backup)
    } else {
        None
    }
}

fn appended_backup(path: &Path) -> Option<PathBuf> {
    let mut name = path.file_name()?.to_os_string();
    name.push(".bak");
    Some(path.with_file_name(name))
}

fn main() {
    let input = PathBuf::from("data/archive.tar.gz");
    assert_eq!(input.file_name(), Some(OsStr::new("archive.tar.gz")));
    assert_eq!(input.file_stem(), Some(OsStr::new("archive.tar")));
    assert_eq!(input.extension(), Some(OsStr::new("gz")));
    assert_eq!(input.parent(), Some(Path::new("data")));

    assert_eq!(
        backup_path(&input),
        Some(PathBuf::from("data/archive.tar.bak")),
    );
    assert_eq!(
        appended_backup(&input),
        Some(PathBuf::from("data/archive.tar.gz.bak")),
    );
    assert_eq!(input.extension(), Some(OsStr::new("gz")));
    assert_eq!(backup_path(Path::new("")), None);
    assert_eq!(appended_backup(Path::new("..")), None);
}
```

La prima funzione **sostituisce** l'ultima estensione; la seconda **aggiunge** un suffisso al nome conservando quello originale, anche non Unicode. `None` segnala l'assenza di un nome modificabile: non e un errore I/O. `AsRef<Path>` fornisce una vista, non valida il percorso.

Queste funzioni calcolano solo un nome: non copiano file, non verificano collisioni e non garantiscono che la destinazione sia diversa dall'origine. Per esempio, sostituire l'estensione di `config.bak` con `bak` produce lo stesso percorso. Una procedura di backup reale deve gestire questi casi prima di scrivere.

### Componenti e prefissi non sono un confine di sicurezza

```rust
use std::ffi::OsStr;
use std::path::{Component, Path};

fn main() {
    let path = Path::new("data/./cache//../config.toml");
    let components: Vec<_> = path.components().collect();
    assert_eq!(
        components,
        vec![
            Component::Normal(OsStr::new("data")),
            Component::Normal(OsStr::new("cache")),
            Component::ParentDir,
            Component::Normal(OsStr::new("config.toml")),
        ],
    );

    let base = Path::new("data");
    let candidate = base.join("../private.txt");
    assert!(candidate.starts_with(base));
    assert_eq!(
        candidate.strip_prefix(base).unwrap(),
        Path::new("../private.txt"),
    );
    assert!(!Path::new("database/file.txt").starts_with(base));
    assert!(Path::new("other/file.txt").strip_prefix(base).is_err());

    assert_eq!(Path::new("data/./file.txt"), Path::new("data/file.txt"));
    assert_ne!(Path::new("data/../file.txt"), Path::new("file.txt"));
}
```

`components()` distingue `Prefix`, `RootDir`, `CurDir`, `ParentDir` e `Normal`. Nei percorsi ordinari elimina separatori ripetuti e `.` intermedi, ma conserva `..`: risolverlo senza filesystem potrebbe cambiare il significato in presenza di link simbolici.

`starts_with` e `strip_prefix` confrontano **componenti**, non un prefisso di caratteri. Non risolvono link e non provano che l'accesso rimanga nella base. Anche l'uguaglianza fra `Path` e lessicale: non certifica l'identita di un file. I confronti ordinari sono sensibili alle maiuscole anche su Windows, con un'eccezione per le lettere di unita.

Per input non fidato servono regole esplicite su radici, prefissi, `..` e nomi ammessi; inoltre i link possono portare fuori dalla base. Un controllo seguito da un'apertura separata puo subire una modifica concorrente del filesystem (**TOCTOU**). Non trattare `join`, `starts_with` o una canonizzazione preventiva come una garanzia generale di confinamento; per quel requisito servono operazioni relative a directory aperte e primitive appropriate al sistema.

### Conservare un percorso non Unicode

```rust
use std::ffi::{OsStr, OsString};
use std::path::PathBuf;

#[cfg(windows)]
fn unusual_name() -> OsString {
    use std::os::windows::ffi::OsStringExt;
    OsString::from_wide(&[0xD800, 0x002E, 0x0074, 0x0078, 0x0074])
}

#[cfg(unix)]
fn unusual_name() -> OsString {
    use std::os::unix::ffi::OsStringExt;
    OsString::from_vec(vec![0xFF, b'.', b't', b'x', b't'])
}

fn main() {
    #[cfg(any(windows, unix))]
    {
        let path = PathBuf::from(unusual_name());
        assert!(path.to_str().is_none());
        assert_eq!(path.extension(), Some(OsStr::new("txt")));
        assert!(path.to_string_lossy().contains('\u{FFFD}'));

        let preserved = path.as_os_str().to_os_string();
        assert_eq!(PathBuf::from(preserved), path);
        println!("{}", path.display());
    }
}
```

Il programma costruisce dati in memoria: **non crea un file con questo nome**. Su Windows usa una code unit UTF-16 isolata; su Unix un byte non UTF-8.

`to_str()` e fallibile tramite `Option<&str>`. `to_string_lossy()` e `display()` sono utili per mostrare un percorso, ma possono sostituire dati con il carattere di rimpiazzo. Non ricostruire un percorso operativo dall'output lossy; conserva `PathBuf` o `OsString`. `display()` non esegue escaping per shell, HTML o log e non nasconde dati riservati.

## Varianti

### Percorso assoluto, canonico e lettura esplicita

```rust
use std::io;
use std::path::{self, Path, PathBuf};

fn load<P: AsRef<Path>>(path: P) -> io::Result<String> {
    std::fs::read_to_string(path)
}

fn main() -> io::Result<()> {
    let Some(argument) = std::env::args_os().nth(1) else {
        return Ok(());
    };
    let input = PathBuf::from(argument);
    let absolute = path::absolute(&input)?;
    let canonical = input.canonicalize()?;
    let text = load(&canonical)?;

    println!("absolute: {}", absolute.display());
    println!("canonical: {}", canonical.display());
    print!("{text}");
    Ok(())
}
```

**Effetti:** senza argomenti non legge file. Con un primo argomento risolve il percorso, legge tutto il file e ne stampa il contenuto; non scrive sul disco. Usalo solo su file autorizzati e di dimensione gestibile. `args_os()` evita di richiedere Unicode al percorso, ma `read_to_string` richiede UTF-8 al **contenuto**.

Le due trasformazioni hanno scopi differenti:

- `std::path::absolute` rende assoluto il percorso senza risolvere link o verificare che la destinazione esista. Puo fallire, per esempio con input vuoto o se non riesce a ottenere la directory corrente; gestisce `..` secondo la piattaforma.
- `canonicalize` accede al filesystem e risolve i link simbolici; il percorso deve esistere. Su Windows puo produrre la sintassi extended-length, da non convertire o passare ad altri programmi assumendo compatibilita universale.
- Il percorso canonico restituito non e un handle e non blocca modifiche successive. Il programma dimostra le API, **non implementa un controllo di autorizzazione o anti-traversal**.

Nella baseline si usa la funzione `std::path::absolute`, non il metodo sperimentale `Path::absolute`. Per leggere un file non e obbligatorio canonizzarlo prima: `load(&input)` puo gia eseguire direttamente l'operazione e restituirne gli errori.

`exists()`, `is_file()` e `is_dir()` interrogano il filesystem ma trasformano alcuni errori in `false`. `try_exists()` restituisce `io::Result<bool>` e distingue gli errori dall'assenza verificata; segue i link e un link interrotto da `Ok(false)`. Nessuno di questi controlli garantisce che l'apertura successiva riuscira: gestisci sempre il suo risultato.

## Errori comuni

### Restituire una vista su un buffer locale

Controesempio, **non compila** (`E0515` nella baseline).

```rust
use std::path::{Path, PathBuf};

fn config_path(base: &Path) -> &Path {
    let owned: PathBuf = base.join("config.toml");
    owned.as_path()
}

fn main() {}
```

Restituisci un `PathBuf`, per esempio direttamente il risultato di `base.join("config.toml")`. Un'annotazione di lifetime non prolunga la vita del buffer locale.

### Modificare il buffer mentre la vista serve ancora

Controesempio, **non compila** (`E0502` nella baseline).

```rust
use std::path::PathBuf;

fn main() {
    let mut path = PathBuf::from("config.toml");
    let name = path.file_name().unwrap();
    path.set_extension("bak");
    println!("{name:?}");
}
```

Usa la vista prima di modificare il buffer oppure conserva un `OsString` con `to_os_string()`. La copia del solo nome puo essere sufficiente; non e necessario clonare l'intero percorso.

Altri errori da evitare:

- Concatenare separatori con `format!` o sostituire `\` con `/` senza considerare la piattaforma.
- Confondere `set_extension` con aggiunta del suffisso o con un'operazione di rinomina sul disco.
- Usare `to_str().unwrap()` su input OS non controllato.
- Interpretare il tipo `PathBuf` come validazione dei caratteri ammessi dal filesystem.
- Supporre che `~`, `$HOME` o `%USERPROFILE%` vengano espansi da `Path::new`: restano testo.
- Confondere un nome relativo all'eseguibile con uno relativo alla directory corrente.
- Usare un semplice prefisso, `is_absolute` o `exists` come controllo di sicurezza completo.

## Checklist

- Serve una vista o un percorso posseduto?
- Il chiamante conserva il proprio PathBuf oppure lo passa per valore?
- Da quale directory dipende il percorso relativo?
- L'input segue la sintassi del sistema corrente?
- Sto sostituendo un'estensione o aggiungendo un suffisso?
- Ho gestito nome assente, percorso vuoto e perdita Unicode?
- Sto manipolando testo o interrogando il filesystem?
- La destinazione puo cambiare tra controllo e utilizzo?
- I file letti e l'output mostrato sono autorizzati?
- Gli errori I/O rimangono distinguibili dall'assenza?

## Collegamenti

- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/File I O|File I/O]]
- [[Programmazione/Rust/Pagine/AsRef AsMut e Borrow|AsRef, AsMut e Borrow]]
- [[Programmazione/Rust/Pagine/Process e Command|Process e Command]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
- [[Programmazione/Rust/Pagine/Display e Debug|Display e Debug]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]

## Fonti

Baseline degli esempi: Rust **1.99.1**, edition **2024**, Windows GNU; documentazione consultata il **2026-11-05**. I rami Unix sono documentati, ma non eseguiti su questa piattaforma. I link standard seguono la versione corrente e non certificano una MSRV.

- [std::path: piattaforma, confronti e normalizzazione](https://doc.rust-lang.org/std/path/index.html).
- [Path: viste, nomi, componenti e query filesystem](https://doc.rust-lang.org/std/path/struct.Path.html).
- [PathBuf: proprieta, push, pop e modifica del nome](https://doc.rust-lang.org/std/path/struct.PathBuf.html).
- [Component: radici, prefissi e componenti](https://doc.rust-lang.org/std/path/enum.Component.html).
- [Prefix: sintassi Windows, UNC e verbatim](https://doc.rust-lang.org/std/path/enum.Prefix.html).
- [OsStr: conversioni e rappresentazione OS](https://doc.rust-lang.org/std/ffi/struct.OsStr.html).
- [OsStringExt Windows: from_wide senza perdita](https://doc.rust-lang.org/std/os/windows/ffi/trait.OsStringExt.html).
- [OsStringExt Unix: costruzione da byte](https://doc.rust-lang.org/std/os/unix/ffi/trait.OsStringExt.html).
- [absolute: risoluzione senza accesso alla destinazione](https://doc.rust-lang.org/std/path/fn.absolute.html).
- [canonicalize: accesso al filesystem e limiti Windows](https://doc.rust-lang.org/std/fs/fn.canonicalize.html).
- [args_os: argomenti del processo senza vincolo Unicode](https://doc.rust-lang.org/std/env/fn.args_os.html).
- [read_to_string: lettura completa e UTF-8](https://doc.rust-lang.org/std/fs/fn.read_to_string.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
