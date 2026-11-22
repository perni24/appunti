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
  - File I/O
  - std::fs
  - std::io
prerequisites:
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Path e PathBuf]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
related:
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
  - "[[Programmazione/Rust/Pagine/File descriptor]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
title: File I/O
---

# File I/O

## Sintesi

In Rust, `std::fs` opera su file e directory; `std::io` definisce i trait per leggere e scrivere byte. Il tipo `File` possiede una risorsa aperta, mentre un `Path` descrive soltanto un percorso.

Le tre decisioni iniziali sono: **testo o byte**, **lettura completa o incrementale**, **sovrascrittura, append o creazione esclusiva**. Gli errori sono parte del risultato dell'operazione, non eccezioni da ignorare.

## Quando usarlo

- Configurazioni UTF-8 e piccoli documenti: helper di `std::fs`.
- File binari: byte, senza passare da `String`.
- Molte operazioni piccole: `BufReader` o `BufWriter`.
- File grandi: elaborazione incrementale senza accumulare tutto il contenuto.
- Directory, metadata e copie: API filesystem, con effetti espliciti.

Sono API sincrone: una lettura puo bloccare il thread. In un'applicazione asincrona usa le API del runtime o il suo meccanismo per lavoro bloccante; aggiungere `async` a una funzione non rende non bloccante `File::open`.

## Come funziona

### Percorso, apertura e posizione

`File::open` apre in sola lettura. `File::create` apre in scrittura, crea il file se manca e **tronca a zero il contenuto di un file esistente**. Il danno puo avvenire gia all'apertura, prima della prima scrittura.

Un file aperto mantiene una posizione: letture e scritture successive proseguono da li. Il trait `Seek` permette di spostarla; `rewind()` torna all'inizio. Non tutti i flussi sono riposizionabili, per esempio una pipe. `File::try_clone` non crea una copia del contenuto e condivide la posizione con l'handle originale.

`File` chiude automaticamente la risorsa con `Drop`, ma non restituisce al chiamante gli errori di chiusura. La chiusura non e una conferma generale di persistenza su disco.

### Testo, byte e memoria

- `fs::read` restituisce `Vec<u8>`: puo contenere qualsiasi sequenza di byte.
- `fs::read_to_string` restituisce `String` e fallisce se il contenuto non e UTF-8 valido.
- Il nome del file puo essere non Unicode anche quando il contenuto e UTF-8: sono due proprieta indipendenti.
- Entrambi gli helper caricano tutto il contenuto in memoria. Non sono adatti a input senza un limite ragionevole.
- Un buffer riduce molte letture piccole; non rende automaticamente limitato l'uso di memoria del programma.

### Letture e scritture parziali

`read(&mut buffer)` restituisce quanti byte sono stati letti: usa solo `buffer[..n]`. Una lettura breve non implica EOF. Con buffer non vuoto, `Ok(0)` segnala che al momento non arrivano altri byte; per un file regolare che cresce non e necessariamente una condizione permanente.

`read_exact` riempie la porzione richiesta oppure fallisce, per esempio con `UnexpectedEof`. Se fallisce non trattare il buffer come un record completo.

`write` puo accettare solo una parte dei byte. Per inviare tutto usa `write_all`, che gestisce scritture parziali e ritenta su `Interrupted`. Anche `write_all` puo fallire dopo aver scritto un prefisso: **errore non significa rollback**.

## API / Sintassi

| Esigenza | API | Attenzione |
| --- | --- | --- |
| Leggere testo UTF-8 | `fs::read_to_string(path)` | Tutto in memoria; UTF-8 non valido e un errore |
| Leggere byte | `fs::read(path)` | Restituisce `Vec<u8>` |
| Sostituire il contenuto | `fs::write(path, bytes)` | Crea oppure tronca; non e un aggiornamento transazionale |
| Aprire in lettura | `File::open(path)` | Non crea il file |
| Creare senza sostituire | `OpenOptions` con `write(true).create_new(true)` | Fallisce se la destinazione esiste |
| Aggiungere in fondo | `OpenOptions` con `append(true).create(true)` | Non rende atomico un intero record applicativo |
| Leggere una riga | `BufRead::read_line(&mut text)` | Aggiunge al buffer e conserva il terminatore |
| Scrivere tutti i byte | `Write::write_all(bytes)` | Propaga errori; non garantisce persistenza |
| Riposizionare | `Seek::seek(...)`, `Seek::rewind()` | Posizione in byte, non in caratteri |

I metodi di trait richiedono il trait in scope, per esempio `use std::io::Write;`. Un `File` implementa `Read` e `Write`, ma l'operazione puo comunque fallire a runtime se la modalita di apertura non la consente.

`OpenOptions::new()` parte con tutte le opzioni disabilitate. `write(true)` da solo **non tronca**: scrivere tre byte dall'inizio di un file di dieci byte lascia i sette byte finali. `create(true)` crea se manca, ma da solo non concede accesso in scrittura e non svuota un file esistente.

`create_new(true)` combina atomicamente verifica di assenza e creazione, anche contro un link simbolico gia presente nella destinazione. Non protegge invece da ogni sostituzione delle directory parent o da successive modifiche concorrenti.

## Esempio pratico

Ogni blocco e un programma indipendente. I percorsi relativi sono risolti dalla directory di lavoro, non dalla posizione del sorgente. Prova le scritture in una cartella dedicata: non usare file personali come destinazione.

### Leggere una configurazione facoltativa

Il programma legge `config.toml` nella directory corrente. Usa il default solo per `NotFound`; UTF-8 invalido, permessi insufficienti e altri errori vengono propagati.

```rust
use std::fs;
use std::io::{self, ErrorKind};
use std::path::Path;

fn read_optional<P: AsRef<Path>>(path: P) -> io::Result<String> {
    match fs::read_to_string(path) {
        Ok(text) => Ok(text),
        Err(error) if error.kind() == ErrorKind::NotFound => {
            Ok(String::from("enabled = false\n"))
        }
        Err(error) => Err(error),
    }
}

fn main() -> io::Result<()> {
    let text = read_optional("config.toml")?;
    println!("config bytes: {}", text.len());
    Ok(())
}
```

E una politica applicativa, non una regola universale: `NotFound` puo indicare anche una directory parent mancante. Non usare il fallback se vuoi diagnosticare un percorso sbagliato. Un file vuoto e una lettura riuscita, non un file assente; qui non si esegue parsing TOML.

### Creare un report senza sovrascrivere

Crea `report.txt` con due righe. La directory parent deve esistere. Se il file e gia presente, il programma termina con errore senza sostituirlo.

```rust
use std::fs::OpenOptions;
use std::io::{self, BufWriter, Write};
use std::path::Path;

fn write_report<P: AsRef<Path>>(path: P) -> io::Result<()> {
    let file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    let mut writer = BufWriter::new(file);

    for value in [10, 20] {
        writeln!(writer, "value={value}")?;
    }
    writer.flush()?;
    writer.get_ref().sync_all()?;
    Ok(())
}

fn main() -> io::Result<()> {
    write_report("report.txt")
}
```

`writeln!` scrive LF (`\n`), non sceglie automaticamente CRLF su Windows. L'esempio sincronizza una volta alla fine, non dopo ogni riga.

`flush()` trasferisce i dati dal buffer verso il writer sottostante. Con un file, `sync_all()` chiede anche la sincronizzazione di contenuto e metadata gestiti dal sistema operativo; `sync_data()` puo evitare metadata non necessari. **Prima svuota il BufWriter, poi sincronizza il File**, altrimenti alcuni byte possono essere ancora nel buffer Rust.

Non affidarti soltanto al `Drop` di `BufWriter`: tenta di scaricare il buffer ma ignora gli errori. Un fallimento puo lasciare `report.txt` vuoto o incompleto; non viene rimosso automaticamente. Nessuna di queste chiamate rende transazionale l'intera operazione o certifica da sola ogni scenario di crash.

### Leggere righe senza accumulare il file

Legge `input.txt`. `count_lines` riusa una `String`; `read_lines` conserva invece la variante che raccoglie tutte le righe, utile solo quando la dimensione e accettabile.

```rust
use std::fs::File;
use std::io::{self, BufRead, BufReader};
use std::path::Path;

fn count_lines<P: AsRef<Path>>(path: P) -> io::Result<usize> {
    let mut reader = BufReader::new(File::open(path)?);
    let mut line = String::new();
    let mut count = 0;

    loop {
        line.clear();
        if reader.read_line(&mut line)? == 0 {
            break;
        }
        count += 1;
    }
    Ok(count)
}

fn read_lines<P: AsRef<Path>>(path: P) -> io::Result<Vec<String>> {
    BufReader::new(File::open(path)?).lines().collect()
}

fn main() -> io::Result<()> {
    println!("lines: {}", count_lines("input.txt")?);
    Ok(())
}
```

`read_line` conserva LF/CRLF e restituisce il numero di **byte aggiunti**. Senza `clear()` le righe si concatenano. `lines()` elimina LF e l'eventuale CR che lo precede, non tutti gli spazi; produce `io::Result<String>` per ogni riga.

La memoria di `count_lines` dipende dalla riga piu lunga, non ha un limite fisso. Una sola riga enorme puo ancora esaurirla. Per input non fidati imponi un limite e rileva il superamento: un semplice `take(limit)` senza verifica potrebbe accettare silenziosamente dati troncati.

Se i dati non sono UTF-8, usa operazioni su byte come `read_until`. Non usare `filter_map(Result::ok)` o `flatten()` sulle righe per far sparire gli errori.

### Copiare testo UTF-8 con sostituzione esplicita

**Sovrascrive `copy.txt`** con il testo di `input.txt`. Legge prima l'origine: se lettura o decodifica falliscono, non apre la destinazione. Dopo l'inizio della scrittura non c'e rollback.

```rust
use std::io;
use std::path::Path;

fn copy_text<P: AsRef<Path>, Q: AsRef<Path>>(
    from: P,
    to: Q,
) -> io::Result<()> {
    let text = std::fs::read_to_string(from)?;
    std::fs::write(to, text)
}

fn main() -> io::Result<()> {
    copy_text("input.txt", "copy.txt")
}
```

La funzione conserva i byte del testo UTF-8, inclusi i terminatori: non normalizza le righe. Non e una copia generica di file binari e non conserva automaticamente metadata, permessi o timestamp dell'origine. Per un'interfaccia destinata all'utente chiedi esplicitamente il consenso alla sovrascrittura.

### Copiare byte in una destinazione nuova

Copia `input.bin` in `copy.bin` senza caricare l'intero file in memoria. L'origine viene aperta prima di creare la destinazione; il secondo percorso deve essere nuovo.

```rust
use std::fs::{File, OpenOptions};
use std::io;
use std::path::Path;

fn copy_new<P: AsRef<Path>, Q: AsRef<Path>>(
    from: P,
    to: Q,
) -> io::Result<u64> {
    let mut source = File::open(from)?;
    let mut destination = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(to)?;
    let bytes = io::copy(&mut source, &mut destination)?;
    destination.sync_all()?;
    Ok(bytes)
}

fn main() -> io::Result<()> {
    println!("copied bytes: {}", copy_new("input.bin", "copy.bin")?);
    Ok(())
}
```

`io::copy` trasferisce byte tra un `Read` e un `Write` fino a EOF: non interpreta UTF-8 e non copia metadata. Su errore puo rimanere un file parziale; scegli come segnalarlo o recuperarlo, senza cancellare alla cieca un percorso che altri processi potrebbero aver sostituito.

`fs::copy(from, to)` e l'alternativa fra percorsi e copia anche i permessi, ma **sovrascrive** la destinazione. Se origine e destinazione identificano lo stesso file puo troncarlo: un confronto tra stringhe non riconosce hard link, alias o race. La strategia `create_new` evita di riaprire in scrittura un bersaglio gia esistente, ma non e una soluzione generale di confinamento filesystem.

### Elencare una directory gestendo tutti gli errori

Elenca le voci immediate di `input-dir`, senza ricorsione e senza modificarle. La directory deve esistere.

```rust
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

fn list_entries<P: AsRef<Path>>(path: P) -> io::Result<Vec<PathBuf>> {
    let mut paths = fs::read_dir(path)?
        .map(|entry| entry.map(|entry| entry.path()))
        .collect::<io::Result<Vec<_>>>()?;
    paths.sort();
    Ok(paths)
}

fn main() -> io::Result<()> {
    for path in list_entries("input-dir")? {
        println!("{}", path.display());
    }
    Ok(())
}
```

La prima operazione puo fallire, ma anche una successiva iterazione puo produrre un errore. L'ordine di `read_dir` non e garantito; qui viene ordinato esplicitamente. Non e un ordinamento linguistico e puo differire fra piattaforme. `display()` e solo una presentazione, eventualmente lossy: per altre operazioni conserva il `PathBuf`.

## Varianti

### Append, buffer e posizione

Per aggiungere a un log usa `OpenOptions::new().append(true).create(true).open(path)`. Non sostituirlo con un `seek` alla fine seguito da una scrittura: un altro writer potrebbe intervenire fra le due operazioni.

Append posiziona ogni scrittura in fondo, ma piu scritture possono intercalarsi con quelle di altri writer. `write_all` e `writeln!` non trasformano un messaggio in una transazione indivisibile.

Un `BufReader` puo aver letto in anticipo: leggere anche dal `File` sottostante o recuperarlo con `into_inner()` puo saltare byte rimasti nel buffer. Continua attraverso il reader e riposizionalo tramite il suo `Seek` quando necessario.

### Metadata, directory e cancellazione

- `fs::metadata(path)` segue il link simbolico finale; `fs::symlink_metadata(path)` osserva il link stesso. Questo non elimina la risoluzione delle directory parent.
- `file.metadata()` interroga la risorsa gia aperta. Nessuna lettura dei metadata garantisce che il contenuto non cambi subito dopo.
- `fs::create_dir_all(path)` crea i parent mancanti; su errore possono restare directory gia create.
- `fs::remove_file(path)` elimina una voce file; `fs::remove_dir(path)` richiede una directory vuota.
- `fs::remove_dir_all(path)` e ricorsiva e distruttiva: verifica il bersaglio e non usarla come pulizia generica di input non fidato.

### Aggiornamento robusto ed errori

Per sostituire una configurazione importante, la semplice troncatura e rischiosa. Una strategia e scrivere in un file temporaneo esclusivo nella stessa directory, controllare scrittura e sincronizzazione, poi sostituire il bersaglio. La pubblicazione atomica e la durabilita dopo crash sono problemi distinti: dipendono dalle garanzie di rename, filesystem, piattaforma e persistenza della directory.

`fs::rename` puo sostituire un file esistente e non funziona fra filesystem diversi. Non presentare una sequenza generica temporaneo/rename come garanzia universale; usa un'implementazione verificata per i requisiti dell'applicazione.

Propaga `io::Error` con `?` e aggiungi il contesto al confine applicativo: operazione e percorso coinvolto, senza esporre dati sensibili. Non confrontare il testo localizzato dell'errore. `ErrorKind` e utile per politiche specifiche, con un ramo per gli altri casi; non presumere che ogni piattaforma classifichi allo stesso modo tutti gli errori filesystem.

## Errori comuni

- Usare `File::create` per leggere o aggiornare poche posizioni: tronca il file prima.
- Credere che `write(true).create(true)` svuoti automaticamente il contenuto.
- Usare `read_to_string` per byte arbitrari o una conversione lossy per copiarli.
- Ignorare il numero restituito da `read`/`write`.
- Accumulare tutte le righe in un vettore pensando di usare memoria costante.
- Confondere `flush`, sincronizzazione e aggiornamento atomico.
- Controllare `exists()` e poi creare il file: la verifica separata introduce una race.
- Sopprimere gli errori, usare `unwrap()` su input esterno o scambiare ogni errore per file assente.
- Rimuovere automaticamente un file parziale senza verificare proprieta e concorrenza.

## Checklist

- Testo UTF-8 o byte arbitrari?
- Contenuto e singole righe hanno limiti accettabili?
- Il percorso e mantenuto come `Path`/`PathBuf`?
- La modalita di apertura rende esplicita la sovrascrittura?
- Sono gestite letture/scritture parziali e gli errori durante l'iterazione?
- Il buffer viene svuotato prima dell'eventuale sincronizzazione?
- Cosa resta se l'operazione fallisce a meta?
- Servono garanzie ulteriori contro concorrenza, link o crash?

## Collegamenti

- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/File descriptor|File descriptor]]

## Fonti

Riferimento: standard library di Rust **1.99.1**, esempi in edition **2024**. Le garanzie del filesystem non si deducono dalla sola compilazione.

- [File: apertura, posizione, sincronizzazione e chiusura](https://doc.rust-lang.org/std/fs/struct.File.html)
- [OpenOptions: modalita di apertura](https://doc.rust-lang.org/std/fs/struct.OpenOptions.html)
- [read_to_string](https://doc.rust-lang.org/std/fs/fn.read_to_string.html), [write](https://doc.rust-lang.org/std/fs/fn.write.html) e [fs::copy](https://doc.rust-lang.org/std/fs/fn.copy.html)
- [Read](https://doc.rust-lang.org/std/io/trait.Read.html), [Write](https://doc.rust-lang.org/std/io/trait.Write.html) e [Seek](https://doc.rust-lang.org/std/io/trait.Seek.html)
- [BufRead](https://doc.rust-lang.org/std/io/trait.BufRead.html), [BufReader](https://doc.rust-lang.org/std/io/struct.BufReader.html) e [BufWriter](https://doc.rust-lang.org/std/io/struct.BufWriter.html)
- [io::copy](https://doc.rust-lang.org/std/io/fn.copy.html) e [ErrorKind](https://doc.rust-lang.org/std/io/enum.ErrorKind.html)
- [read_dir](https://doc.rust-lang.org/std/fs/fn.read_dir.html), [metadata](https://doc.rust-lang.org/std/fs/fn.metadata.html) e [symlink_metadata](https://doc.rust-lang.org/std/fs/fn.symlink_metadata.html)
- [create_dir_all](https://doc.rust-lang.org/std/fs/fn.create_dir_all.html) e [rename](https://doc.rust-lang.org/std/fs/fn.rename.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
