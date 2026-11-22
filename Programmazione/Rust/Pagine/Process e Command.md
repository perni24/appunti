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
  - std::process::Command
  - Processi Rust
  - Command Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
  - "[[Programmazione/Rust/Pagine/Path e PathBuf]]"
related:
  - "[[Programmazione/Rust/Pagine/CLI con clap]]"
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
title: Process e Command
---

# Process e Command

## Sintesi

`std::process::Command` configura e avvia un programma esterno. La configurazione non esegue nulla finche non chiami `status()`, `output()` o `spawn()`.

Tieni separati tre risultati: **avvio/attesa riusciti**, **esito del programma** e **interpretazione dell'output**. Un processo puo partire correttamente, terminare con errore e produrre byte che non sono UTF-8.

## Quando usarlo

- Invocare Git, compilatori o strumenti gia installati.
- Eseguire un programma mostrando direttamente i suoi messaggi.
- Catturare un risultato piccolo e finito da elaborare.
- Configurare argomenti, ambiente, directory di lavoro e canali standard.
- Gestire esplicitamente un figlio mentre il chiamante svolge altro lavoro.

Non serve una shell per lanciare un eseguibile. Non scegliere un processo esterno quando una libreria gia disponibile offre l'operazione richiesta con un contratto piu semplice.

## Come funziona

### Builder e argomenti

Il programma e gli argomenti sono elementi distinti: `Command::new("git").arg("--version")`, non `Command::new("git --version")`.

Gli argomenti non subiscono normalmente espansioni di shell: spazi, `*`, `$HOME`, `|` e `>` restano dati. Non aggiungere virgolette intorno a un percorso con spazi: passeresti anche quelle al programma.

`arg`/`args` accettano valori OS, quindi un `Path` o un `OsStr` non richiede conversioni lossy. Gli argomenti si accumulano: riusare un builder e aggiungere un'altra opzione non cancella quelle precedenti.

### Tre livelli di errore

- `Err(io::Error)`: il sistema non ha potuto completare l'operazione, per esempio eseguibile assente, permessi o directory non valida.
- `Ok(status)` o `Ok(output)` con `success() == false`: il programma e partito ma non ha segnalato successo.
- Output non conforme al formato atteso: errore del protocollo applicativo, anche con stato di successo.

`ExitStatus::success()` controlla l'esito convenzionale zero. Alcuni comandi usano codici non zero per risultati attesi, come una ricerca senza corrispondenze: consulta il loro contratto.

`status.code()` restituisce `Option<i32>`, non sempre un numero. Su Unix un processo terminato da segnale puo avere `None`. Per diagnostica conserva anche lo status completo; non trasformare `None` in zero.

### Ambiente, directory ed eseguibile

Di default il figlio eredita ambiente e directory corrente. `env`, `env_remove` e `current_dir` modificano la configurazione del figlio, non il processo Rust chiamante.

Un nome breve come `git` richiede la risoluzione dell'eseguibile secondo le regole della piattaforma. Per un programma controllato, un percorso assoluto evita ambiguita. La combinazione di eseguibile relativo e `current_dir` non ha un comportamento portabile garantito.

`env_clear()` disabilita l'ereditarieta dell'ambiente, ma puo rimuovere dati necessari al programma. Non e una sandbox e non garantisce, su ogni piattaforma, che la ricerca dell'eseguibile non usi il PATH del padre.

## API / Sintassi

| Metodo | Risultato | Flussi predefiniti | Attesa |
| --- | --- | --- | --- |
| `status()` | `io::Result<ExitStatus>` | stdin/stdout/stderr ereditati | Fino alla terminazione |
| `output()` | `io::Result<Output>` | stdin chiuso; stdout/stderr catturati | Fino al completamento della raccolta |
| `spawn()` | `io::Result<Child>` | stdin/stdout/stderr ereditati | Non attende la terminazione |

I valori predefiniti possono essere sostituiti tramite `Stdio::inherit()`, `Stdio::null()`, `Stdio::piped()` o un file aperto. Se imposti stdout su un file, `output.stdout` non contiene quei byte.

`Output` contiene `status`, `stdout: Vec<u8>` e `stderr: Vec<u8>`. La cattura conserva separati i due flussi, non il loro ordine temporale combinato.

`output()` e `wait_with_output()` raccolgono in memoria: non sono adatti a output illimitato. Inoltre un discendente che mantiene aperta una pipe puo impedire EOF anche dopo l'uscita del figlio diretto.

## Esempio pratico

Ogni blocco e un programma indipendente. Gli esempi con `current_exe()` rilanciano il proprio eseguibile con un argomento speciale: servono a provare il comportamento senza comandi shell o strumenti di sistema specifici.

### Mostrare lo stato di un comando

Prerequisito: Git disponibile nel PATH. Esegue solo `git --version`, senza modificare repository.

```rust
use std::io;
use std::process::{Command, Stdio};

fn main() -> io::Result<()> {
    let status = Command::new("git")
        .arg("--version")
        .stdin(Stdio::null())
        .status()?;

    if !status.success() {
        return Err(io::Error::other(format!("git failed: {status}")));
    }
    Ok(())
}
```

stdout e stderr sono visibili direttamente. `?` gestisce gli errori I/O; il controllo successivo gestisce l'esito di Git.

### Catturare e decodificare un risultato

Prerequisito: `rustc` nel PATH, oppure variabile `RUSTC` con il percorso del compilatore. La variabile deve indicare un eseguibile, non un comando con flag.

```rust
use std::error::Error;
use std::process::Command;

fn main() -> Result<(), Box<dyn Error>> {
    let compiler = std::env::var_os("RUSTC")
        .unwrap_or_else(|| "rustc".into());
    let output = Command::new(compiler).arg("--version").output()?;

    if !output.status.success() {
        return Err(format!(
            "rustc failed ({}): {}",
            output.status,
            String::from_utf8_lossy(&output.stderr).trim_end()
        ).into());
    }

    let text = String::from_utf8(output.stdout)?;
    print!("{text}");
    Ok(())
}
```

Qui UTF-8 e parte del formato atteso, quindi la conversione puo fallire. `from_utf8_lossy` viene usata solo per mostrare un messaggio diagnostico: non e adatta a decodificare identificatori o dati da conservare senza perdita. Anche i messaggi esterni possono contenere dati sensibili o sequenze di controllo per il terminale.

### Passare argomenti letterali e ambiente locale al figlio

Non crea file e non cambia l'ambiente o la directory del padre.

```rust
use std::ffi::OsStr;
use std::io;
use std::process::Command;

fn main() -> io::Result<()> {
    if std::env::args_os().nth(1).as_deref()
        == Some(OsStr::new("--inspect-child"))
    {
        assert_eq!(
            std::env::args_os().nth(2).as_deref(),
            Some(OsStr::new("nome con spazi * $HOME | >"))
        );
        assert_eq!(std::env::var("APPUNTI_MODE").as_deref(), Ok("child"));
        println!("child-ok");
        return Ok(());
    }

    let original = std::env::var_os("APPUNTI_MODE");
    let directory = std::env::current_dir()?;
    let output = Command::new(std::env::current_exe()?)
        .args(["--inspect-child", "nome con spazi * $HOME | >"])
        .env("APPUNTI_MODE", "child")
        .current_dir(&directory)
        .output()?;

    assert!(output.status.success());
    assert_eq!(output.stdout, b"child-ok\n");
    assert_eq!(std::env::var_os("APPUNTI_MODE"), original);
    assert_eq!(std::env::current_dir()?, directory);
    Ok(())
}
```

Gli assert sono verifiche del demo controllato, non una strategia per gestire errori esterni in produzione. Per avviare test Cargo useresti allo stesso modo `Command::new("cargo")`, `args(["test"])`, `current_dir("my-crate")` ed `env("RUST_BACKTRACE", "1")`, controllando poi lo status.

### Leggere il commit Git senza nascondere il fallimento

Prerequisiti: Git nel PATH e percorso di un repository con almeno un commit. Il programma accetta il percorso come primo argomento, altrimenti usa la directory corrente. Esegue soltanto una lettura.

```rust
use std::error::Error;
use std::path::{Path, PathBuf};
use std::process::Command;

fn git_commit_hash(repo: &Path) -> Result<String, Box<dyn Error>> {
    let output = Command::new("git")
        .current_dir(repo)
        .env_remove("GIT_DIR")
        .env_remove("GIT_WORK_TREE")
        .args(["rev-parse", "--verify", "HEAD^{commit}"])
        .output()?;

    if !output.status.success() {
        return Err(format!(
            "git rev-parse failed ({}): {}",
            output.status,
            String::from_utf8_lossy(&output.stderr).trim_end()
        ).into());
    }

    let text = String::from_utf8(output.stdout)?;
    let hash = text.trim_end_matches(['\r', '\n']);
    if hash.is_empty() || !hash.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err("git returned an invalid object id".into());
    }
    Ok(hash.to_owned())
}

fn main() -> Result<(), Box<dyn Error>> {
    let repo = std::env::args_os().nth(1)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));
    println!("{}", git_commit_hash(&repo)?);
    Ok(())
}
```

`--verify` e `^{commit}` richiedono un oggetto risolvibile come commit. Non fissare automaticamente la lunghezza a 40 caratteri: Git supporta anche repository SHA-256.

Ritornare `Ok(None)` per qualsiasi exit status negativo, come nella versione semplificata, nasconderebbe repository non valido, HEAD assente e altri guasti. Qui il fallimento viene conservato come errore con diagnostica; per una libreria usa un enum che distingua I/O, status con stderr originale e formato inatteso.

La rimozione di due variabili evita due override comuni del repository, non isola completamente Git da configurazione o ambiente esterni. Usa repository e strumenti fidati; nessun processo viene reso sicuro dal solo uso di `Command`.

### Inviare input e chiudere la pipe

Il figlio controllato copia i byte ricevuti su stdout. L'input del demo e piccolo; non applicare questa sequenza a un flusso arbitrariamente grande.

```rust
use std::ffi::OsStr;
use std::io::{self, Write};
use std::process::{Command, Stdio};

fn main() -> io::Result<()> {
    if std::env::args_os().nth(1).as_deref()
        == Some(OsStr::new("--echo-child"))
    {
        io::copy(&mut io::stdin().lock(), &mut io::stdout().lock())?;
        return Ok(());
    }

    let mut child = Command::new(std::env::current_exe()?)
        .arg("--echo-child")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    let send_result = {
        let mut input = child.stdin.take().expect("stdin configured as piped");
        input.write_all(b"alpha\nbeta\n")
    };
    // Il blocco chiude stdin; attendiamo anche se la scrittura e fallita.
    let output = child.wait_with_output()?;
    send_result?;

    if !output.status.success() {
        return Err(io::Error::other(format!("child failed: {}", output.status)));
    }
    assert_eq!(output.stdout, b"alpha\nbeta\n");
    assert!(output.stderr.is_empty());
    Ok(())
}
```

`take()` lascia `None` nel campo di `Child` e trasferisce l'handle al blocco. La fine del blocco chiude la pipe e permette al figlio di osservare EOF. `flush()` non comunica EOF.

`wait()` e `wait_with_output()` chiudono lo stdin ancora posseduto da `Child`, non un handle estratto e mantenuto altrove. `try_wait()` non chiude stdin. Dimenticare la chiusura puo lasciare padre e figlio in attesa reciproca.

### Terminare e raccogliere un figlio controllato

Il solo figlio avviato dal demo attende al massimo due secondi senza scrivere file. Il padre ne richiede la terminazione: non usa PID forniti dall'esterno.

```rust
use std::ffi::OsStr;
use std::io;
use std::process::{Command, Stdio};
use std::time::Duration;

fn main() -> io::Result<()> {
    if std::env::args_os().nth(1).as_deref()
        == Some(OsStr::new("--wait-child"))
    {
        std::thread::sleep(Duration::from_secs(2));
        return Ok(());
    }

    let mut child = Command::new(std::env::current_exe()?)
        .arg("--wait-child")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()?;

    let stop_result = child.kill();
    let status = child.wait()?;
    stop_result?;
    println!("child collected: {status}");
    Ok(())
}
```

`kill()` richiede una terminazione forzata, non uno shutdown cooperativo, e non sostituisce `wait()`. L'esito puo dipendere da una race con la terminazione naturale: non assumere un particolare numero di uscita del processo terminato forzatamente.

Questo esempio non implementa un timeout: se `kill` fallisse, l'attesa potrebbe continuare fino all'uscita naturale. In un'applicazione reale conserva e gestisci anche eventuali errori di attesa o terminazione.

## Varianti

### Gestione del figlio e timeout

`Child` non termina ne attende automaticamente il processo quando esce dallo scope. Su Unix un figlio terminato non raccolto puo rimanere zombie.

`try_wait()` restituisce `io::Result<Option<ExitStatus>>`: `None` significa ancora in esecuzione, `Some` contiene lo stato raccolto. Non e un errore se non e ancora pronto.

La standard library non offre un parametro timeout per `output()`. Un controllo a scadenza richiede polling con `Instant`, attese fra le verifiche, politica di terminazione e raccolta finale; non fare un ciclo occupato. La terminazione del figlio diretto non garantisce quella dei discendenti: gruppi di processi o Job Objects richiedono soluzioni specifiche della piattaforma.

### Pipe, streaming e deadlock

Una pipe ha capacita limitata. Scrivere molto su stdin mentre il figlio riempie stdout o stderr puo bloccare entrambi. Anche `wait()` su un figlio con output piped ma non letto puo bloccarsi.

Per input/output grandi drena i due flussi mentre invii input, usando thread o un runtime asincrono. Un limite di cattura richiede anche una politica quando viene raggiunto: smettere soltanto di leggere puo bloccare il writer. `wait_with_output()` raccoglie le pipe che possiede; se estrai stdout/stderr devi gestirle tu.

Se l'output serve soltanto a un file, passare un `File` a `Stdio` evita la raccolta in memoria, ma la modalita di apertura del file stabilisce se il contenuto precedente viene troncato. Non usare `File::create` senza valutare questo effetto.

### Sicurezza degli argomenti

Separare gli argomenti evita la costruzione di una riga shell, **non** la loro interpretazione come opzioni del programma. Un input che inizia con `-` puo cambiare il comando: valida il significato e usa `--` soltanto quando lo strumento lo supporta.

Invocare esplicitamente `sh -c`, PowerShell o `cmd /C` reintroduce un interprete. Su Windows anche i file batch e programmi con convenzioni di parsing particolari richiedono attenzione: `args` non e una protezione universale. Non passare input non fidato a un interprete pensando che le API Rust lo rendano innocuo.

Per codice asincrono usa gli strumenti del runtime: le attese e la cattura di `std::process` sono bloccanti.

## Errori comuni

- Mettere programma e argomenti nella stessa stringa.
- Aggiungere virgolette shell agli argomenti passati con `arg`.
- Trattare `Ok(output)` come esecuzione riuscita del comando.
- Usare una conversione lossy per un dato che deve restare esatto.
- Catturare output illimitato o perdere stderr in caso di errore.
- Dimenticare EOF su stdin, il drenaggio delle pipe o la raccolta del figlio.
- Pensare che lasciare cadere `Child` cancelli il processo.
- Usare `env_clear` come isolamento di sicurezza.
- Avviare comandi relativi a una directory o un ambiente impliciti e variabili.

## Checklist

- Eseguibile, argomenti e directory sono scelti esplicitamente?
- Occorre una shell oppure si puo evitarla?
- Sono separati errori I/O, status e formato dell'output?
- La cattura ha dimensione e durata accettabili?
- stdout/stderr vengono letti senza bloccare l'invio di input?
- Tutti gli handle stdin vengono chiusi quando serve EOF?
- Il figlio viene raccolto anche nei percorsi di errore?
- Sono previsti timeout, cancellazione e gestione dei discendenti quando necessari?

## Collegamenti

- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/File I O|File I/O]]
- [[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Time Duration e Instant|Time, Duration e Instant]]

## Fonti

Riferimento: standard library di Rust **1.99.1**, edition **2024**. I comandi esterni hanno prerequisiti e contratti propri.

- [Command: configurazione, argomenti e avvio](https://doc.rust-lang.org/std/process/struct.Command.html)
- [std::process: I/O e interpretazione degli argomenti Windows](https://doc.rust-lang.org/std/process/index.html)
- [Child: attesa, raccolta e terminazione](https://doc.rust-lang.org/std/process/struct.Child.html)
- [Output](https://doc.rust-lang.org/std/process/struct.Output.html) e [ExitStatus](https://doc.rust-lang.org/std/process/struct.ExitStatus.html)
- [Stdio e rischi delle pipe](https://doc.rust-lang.org/std/process/struct.Stdio.html)
- [Rust By Example: processi](https://doc.rust-lang.org/rust-by-example/std_misc/process.html) e [pipe](https://doc.rust-lang.org/rust-by-example/std_misc/process/pipe.html)
- [Git: rev-parse, verifica degli oggetti e formati](https://git-scm.com/docs/git-rev-parse)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
