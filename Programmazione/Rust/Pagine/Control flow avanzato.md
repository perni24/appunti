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
  - control-flow
  - expressions
aliases:
  - Controllo di flusso avanzato Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Controllo di flusso]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
related:
  - "[[Programmazione/Rust/Pagine/if let e while let]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
title: Control flow avanzato
---

# Control flow avanzato

## Sintesi

Il controllo di flusso avanzato combina espressioni con risultato, label, uscite anticipate e propagazione di errori. La domanda principale e **da quale ambito esce ogni istruzione**: ciclo, blocco, funzione o closure.

Gli esempi sono programmi indipendenti per `src/main.rs`, verificati con **Rust 1.99.1, edition 2024**. I due controesempi finali non compilano intenzionalmente. L'esempio di lettura file non modifica il file indicato.

## Quando usarlo

- Per ottenere un risultato da una ricerca o da un ciclo.
- Per uscire da un livello specifico di cicli annidati.
- Per separare condizioni iniziali dal percorso normale.
- Per propagare errori conservandone il significato.
- Per interrompere una visita tramite callback senza usare un errore fittizio.

Non tutte le variabili mutabili sono un problema: scegli il costrutto che rende il percorso piu leggibile, non quello con meno righe.

## Come funziona

`break` esce dal ciclo piu interno, oppure dalla destinazione indicata dalla label. `continue` passa alla prossima iterazione del ciclo scelto. `return` termina la funzione o closure corrente, non una funzione esterna che la sta chiamando.

`if`, `match`, `loop` e blocchi possono produrre valori. I percorsi che restituiscono normalmente devono convergere a un tipo comune, anche tramite coercizioni; `return` e un'espressione divergente di tipo `!`. Un punto e virgola finale puo trasformare il risultato di un blocco in `()`.

Le uscite normali eseguono i distruttori dei valori ancora posseduti negli scope abbandonati. Non equivalgono a un rollback: operazioni gia effettuate su file, rete o stato esterno non vengono annullate automaticamente.

### Loop con risultato

```rust
fn main() {
    let mut attempts = 0_u32;
    let result = loop {
        attempts += 1;
        if attempts == 3 {
            break attempts * 10;
        }
    };
    assert_eq!(result, 30);
    assert_eq!(attempts, 3);
}
```

`break valore` determina il risultato del loop. Gli eventuali altri `break` verso lo stesso loop devono produrre valori compatibili; `break;` produce `()`. Qui la terminazione e esplicita a tre passi e le operazioni non possono andare in overflow. Un vero retry richiede anche limite dei tentativi, politica degli errori ed eventuale attesa.

## API / Sintassi

### Label con break e continue

```rust
fn main() {
    let mut visited = Vec::new();

    'rows: for row in 0..3 {
        for column in 0..3 {
            if column == 1 {
                continue 'rows;
            }
            visited.push((row, column));
            if row == 2 {
                break 'rows;
            }
        }
    }

    assert_eq!(visited, vec![(0, 0), (1, 0), (2, 0)]);
}
```

`continue 'rows` salta il resto del ciclo interno e avanza il `for` esterno. `break 'rows` termina entrambi. Senza label, ciascuna istruzione riguarderebbe solo il ciclo interno. La label non e un `goto`: indica un costrutto contenitore, non una posizione arbitraria.

### Un blocco etichettato restituisce un valore

```rust
fn find_position(rows: &[&[i32]], target: i32) -> Option<(usize, usize)> {
    'search: {
        for (row_index, row) in rows.iter().enumerate() {
            for (column_index, value) in row.iter().enumerate() {
                if *value == target {
                    break 'search Some((row_index, column_index));
                }
            }
        }
        None
    }
}

fn main() {
    let rows: &[&[i32]] = &[&[1, 2], &[], &[3, 2]];
    assert_eq!(find_position(rows, 2), Some((0, 1)));
    assert_eq!(find_position(rows, 9), None);
}
```

Il blocco viene eseguito una volta; `break 'search` ne produce il risultato senza terminare necessariamente tutta la funzione. Non ammette `continue 'search`, perche non e un ciclo. Qui si cerca la prima occorrenza in ordine di riga, anche con righe vuote o di lunghezze diverse.

Un `for` o `while` normale non accetta `break valore`. Il valore sopra appartiene al **blocco esterno**, non al `for`.

### Let else e uscita locale

```rust
fn main() {
    let mut present = Vec::new();
    for entry in [Some(0), None, Some(7)] {
        let Some(number) = entry else {
            continue;
        };
        present.push(number);
    }
    assert_eq!(present, vec![0, 7]);
}
```

`number` resta visibile dopo il controllo. Il ramo `else` deve divergere rispetto a quel punto: qui passa all'iterazione seguente, ma potrebbe restituire un errore dalla funzione. Stampare un messaggio e continuare nello stesso blocco non basta.

### Propagare errori di lettura

```rust
use std::path::Path;

fn load_text(path: &Path) -> std::io::Result<String> {
    let text = std::fs::read_to_string(path)?;
    Ok(text)
}

fn main() -> std::io::Result<()> {
    let Some(path) = std::env::args_os().nth(1) else {
        return Ok(());
    };
    let text = load_text(Path::new(&path))?;
    println!("{} byte", text.len());
    Ok(())
}
```

Senza argomenti il programma termina senza I/O. Con un percorso legge l'intero file come UTF-8 e stampa il numero di byte, non il contenuto. Dopo aver inserito l'esempio in un progetto Cargo, un file gia esistente puo essere letto con:

```powershell
cargo run -- "config.toml"
```

Il percorso relativo parte dalla directory di lavoro, non dalla posizione del sorgente. Il nome `config.toml` non implica parsing TOML. File mancante, accesso negato o contenuto non UTF-8 producono errori; il demo non limita la dimensione letta.

Su `Result`, `?` estrae `Ok` oppure restituisce anticipatamente l'errore alla funzione corrente, con una conversione compatibile quando prevista. Non stampa, non ritenta e non chiude il processo da solo: qui e il risultato finale di `main` a determinare l'esito del programma.

## Esempio pratico

### Validare una porta senza confondere gli errori

```rust
use std::num::ParseIntError;

#[derive(Debug, PartialEq, Eq)]
enum PortError {
    Missing,
    Invalid(ParseIntError),
    Zero,
}

fn parse_port(input: Option<&str>) -> Result<u16, PortError> {
    let Some(raw) = input else {
        return Err(PortError::Missing);
    };
    let port = raw.parse::<u16>().map_err(PortError::Invalid)?;
    if port == 0 {
        return Err(PortError::Zero);
    }
    Ok(port)
}

fn main() {
    assert_eq!(parse_port(Some("8080")), Ok(8080));
    assert_eq!(parse_port(None), Err(PortError::Missing));
    assert_eq!(parse_port(Some("0")), Err(PortError::Zero));
    assert!(matches!(parse_port(Some("abc")), Err(PortError::Invalid(_))));
}
```

`let ... else` distingue l'assenza, `map_err` conserva l'errore di parsing in una variante, `?` lo propaga e il controllo finale applica la politica sullo zero. Gli errori non vengono ridotti a un messaggio indistinto.

Non viene fatto trim: gli spazi possono causare un errore di parsing. Non viene aperto alcun socket ne verificata la disponibilita della porta. Vietare zero e una scelta del demo, non un vincolo universale delle API di rete. L'enum e didattico: un tipo d'errore pubblico potrebbe implementare anche `Display` e `Error`.

## Varianti

### Interrompere una visita con ControlFlow

```rust
use std::ops::ControlFlow;

fn first_negative(values: &[i32]) -> Option<i32> {
    let outcome: ControlFlow<i32> = values.iter().try_for_each(|&value| {
        if value < 0 {
            return ControlFlow::Break(value);
        }
        ControlFlow::Continue(())
    });
    outcome.break_value()
}

fn main() {
    assert_eq!(first_negative(&[1, -2, -3]), Some(-2));
    assert_eq!(first_negative(&[0, 1]), None);
    assert_eq!(first_negative(&[]), None);
}
```

Il `return` termina la **closure**. E `try_for_each` a interrompere la visita quando riceve `ControlFlow::Break`; la funzione esterna continua e legge `outcome`. Una normale `for_each` non interpreta un `return;` nella callback come arresto dell'iterazione.

Questo risultato distingue un arresto voluto da un errore. Per la semplice ricerca del demo esiste anche `Iterator::find`; `ControlFlow` e utile quando la visita comprende piu lavoro. Ulteriori combinazioni di iteratori sono nella nota dedicata.

`?` su `Option` propaga invece `None`; non trasforma da solo l'assenza in errore. Nei blocchi ordinari e nei loop, `?` non significa `break`: torna dalla funzione o closure che fornisce il contesto di propagazione.

## Errori comuni

### Break con valore in for

Questo programma **non compila** (E0571):

```rust
fn main() {
    for number in 0..3 {
        break number;
    }
}
```

Usa `loop`, un blocco etichettato, `return` se vuoi terminare la funzione o un metodo di ricerca adatto.

### Option in una funzione Result

Questo programma **non compila** (E0277):

```rust
fn value(input: Option<u16>) -> Result<u16, &'static str> {
    let number = input?;
    Ok(number)
}

fn main() {}
```

Scegli esplicitamente l'errore: `let number = input.ok_or("mancante")?;`. Questo da significato all'assenza; non e un dettaglio puramente sintattico.

Altri errori frequenti:

- Perdere il valore del blocco aggiungendo un punto e virgola finale.
- Usare `unwrap` come equivalente di propagazione: puo invece causare panic.
- Attendere che `?` in una closure esca anche dalla funzione esterna.
- Nascondere errori o effetti gia eseguiti dietro un fallback generico.
- Accumulare label quando una funzione piu piccola renderebbe il flusso chiaro.

## Checklist

- Da quale costrutto esce ciascun `break`, `continue`, `return` o `?`?
- I risultati dei percorsi normali convergono a un tipo comune?
- Il ciclo termina anche per input vuoto o senza corrispondenze?
- Gli errori conservano il contesto utile al chiamante?
- Una callback segnala davvero l'arresto all'API che la invoca?
- Le operazioni gia effettuate richiedono transazioni o compensazioni separate?

## Collegamenti

- [[Programmazione/Rust/Pagine/Controllo di flusso|Controllo di flusso]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]
- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/File I O|File I/O]]

## Fonti

- [Rust Book: controllo di flusso](https://doc.rust-lang.org/book/ch03-05-control-flow.html).
- [Rust Reference: loop, label e blocchi etichettati](https://doc.rust-lang.org/reference/expressions/loop-expr.html).
- [Rust Reference: return](https://doc.rust-lang.org/reference/expressions/return-expr.html).
- [Rust Reference: let statements](https://doc.rust-lang.org/reference/statements.html#let-statements).
- [Rust Reference: operatore ?](https://doc.rust-lang.org/reference/expressions/operator-expr.html#the-question-mark-operator).
- [Rust Book: propagazione di errori](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html).
- [Standard library: read_to_string](https://doc.rust-lang.org/std/fs/fn.read_to_string.html).
- [Standard library: ControlFlow](https://doc.rust-lang.org/std/ops/enum.ControlFlow.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
