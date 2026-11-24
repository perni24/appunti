---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - rustfmt
  - cargo fmt
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
related:
  - "[[Programmazione/Rust/Pagine/Clippy|Clippy]]"
  - "[[Programmazione/Rust/Pagine/rustdoc|rustdoc]]"
  - "[[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]"
title: rustfmt
---

# rustfmt

## Sintesi

`rustfmt` risponde a una domanda precisa: **come verrebbe formattato questo sorgente Rust?** In un progetto Cargo, `cargo fmt` applica la risposta ai file; `cargo fmt --check` mostra le differenze senza scriverle. Usa il primo mentre lavori e il secondo in CI, dove vuoi sapere se il codice inviato è già conforme.

Un file può essere ben formattato e non compilare. Il formatter deve poter leggere la sintassi, ma non verifica i tipi, non applica i lint di [[Programmazione/Rust/Pagine/Clippy|Clippy]] e non esegue i test.

## Scegliere il comando

| Obiettivo | Comando | Effetto sui sorgenti |
| --- | --- | --- |
| Controllare il pacchetto dell'esempio | `cargo fmt -p format_notes --check` | Segnala differenze senza correggerle. Non certifica gli altri membri del workspace. |
| Uniformare il workspace in locale | `cargo fmt --all` | Riscrive i sorgenti interessati; include anche le dipendenze locali su percorso. Controlla il diff. |
| Verificare lo stesso insieme in CI | `cargo fmt --all --check` | Non scrive. Termina con errore se servono modifiche o se il formatter non riesce a elaborare il codice. |

Non è una ricerca indiscriminata di tutti i file `.rs` del repository: Cargo individua i target dei pacchetti selezionati e rustfmt segue i moduli. Uno script Rust indipendente da quei target va controllato a parte.

## Esempio pratico

### 1. Verificare senza correggere

Per provare in una directory libera, crea una libreria senza dipendenze esterne:

```sh
cargo new --lib --edition 2024 format_notes
```

Entra in `format_notes` ed esegui i comandi successivi dalla directory con `Cargo.toml`. Se usi rustup e `cargo fmt --version` segnala che il componente manca, installalo con `rustup component add rustfmt`.

Sostituisci `src/lib.rs` **della crate di prova** con questo esempio. La funzione è volutamente scritta su una riga; il test esprime il requisito, cioè che 120 venga limitato a 100:

```rust
pub fn percentage(value:i32)->u8{value.clamp(0,100) as u8}

#[cfg(test)]
mod tests {
    use super::percentage;

    #[test]
    fn caps_at_one_hundred() {
        assert_eq!(percentage(120), 100);
    }
}
```

Esegui il test:

```sh
cargo test --lib
```

Il test passa. Ora chiedi a rustfmt soltanto di verificare:

```sh
cargo fmt --all --check
```

Questa volta il comando fallisce e mostra il diff per `src/lib.rs`. Apri il file: la funzione è **ancora su una riga**. Non è il test a essere fallito.

### 2. Applicare e ripetere il controllo

```sh
cargo fmt --all
```

Ora nel file trovi:

```rust
pub fn percentage(value: i32) -> u8 {
    value.clamp(0, 100) as u8
}
```

Ripeti il controllo con `--check`: esce con successo e non produce un nuovo diff. Anche il test resta verde. Per vedere il limite del formatter, cambia **solo** il tipo di ritorno da `u8` a `bool`, lasciando il corpo invariato. La forma è ancora corretta, ma questo comando segnala tipi incompatibili:

```sh
cargo check --lib
```

Ripristina `-> u8` prima di continuare. Se invece `--check` segnala un errore di parsing, per esempio una graffa mancante, correggi prima la sintassi: rilanciare il formatter non la ripara.

## Configurazione ed edizioni

Con `cargo fmt`, Cargo passa l'edizione del linguaggio dichiarata dal pacchetto in `Cargo.toml`. È sufficiente per la maggior parte dei progetti; non occorre creare un file di configurazione per attivare i valori predefiniti.

- **`edition`** stabilisce quale sintassi rustfmt può leggere. Invocato direttamente e senza opzioni o configurazione, `rustfmt` usa l'edizione 2015: può quindi rifiutare una `async fn` valida nel pacchetto.
- **`style_edition`** stabilisce come scrivere il codice già letto. Se non la imposti, segue l'edizione di parsing. Per esempio l'accesso a tuple annidate può apparire come `pair.0 .0` con lo stile 2021 e `pair.0.0` con lo stile 2024: il valore letto non cambia.

Per provarlo, crea un file indipendente `edition_demo.rs` accanto al manifest:

```rust
pub async fn first(pair: ((u8,), u8)) -> u8 {
    pair.0.0
}
```

Controllalo direttamente con le stesse regole del progetto 2024, senza riscriverlo:

```sh
rustfmt --edition 2024 --check edition_demo.rs
```

Per vedere invece lo stile precedente, mantenendo lo stesso parser e lasciando il file intatto, stampa il risultato sul terminale:

```sh
rustfmt --edition 2024 --style-edition 2021 --emit stdout edition_demo.rs
```

Se editor e CI invocano rustfmt in modi diversi, puoi condividere una configurazione nella radice del progetto. Un esempio di `rustfmt.toml` per un progetto interamente in edizione 2024:

```toml
edition = "2024"
style_edition = "2024"
max_width = 100
```

`max_width` guida le scelte di impaginazione: non è una verifica rigida della lunghezza di ogni riga. Controlla che la toolchain supporti le opzioni scelte; alcune richiedono nightly. Un cambio di stile esteso è più facile da rivedere in un commit separato dalle modifiche di comportamento.

## Eccezioni locali

Per una tabella in cui l'allineamento comunica qualcosa, `#[rustfmt::skip]` lascia intatto **il singolo elemento**. Il resto del file continua a essere formattato:

```rust
#[rustfmt::skip]
pub const LABELS: &[(&str, &str)] = &[
    ("min",     "0"),
    ("maximum", "100"),
];
```

Per il codice generato, verifica prima se il layout è deciso dal generatore: una correzione manuale potrebbe sparire alla generazione successiva. Non escludere un modulo intero per preservare una sola tabella.

## Checklist

- Il controllo CI usa `--check` e copre i pacchetti voluti? Un controllo con `-p` può passare mentre quello con `--all` fallisce.
- Se editor e CI producono diff diversi, usano la stessa versione di rustfmt, le stesse edizioni e lo stesso file di configurazione?
- Se la formattazione passa, sono stati eseguiti **separatamente** compilazione, lint e test?

## Fonti

- [rustfmt: utilizzo, configurazione ed eccezioni](https://github.com/rust-lang/rustfmt#running)
- [Rust Edition Guide: edizione del linguaggio ed edizione di stile](https://doc.rust-lang.org/edition-guide/rust-2024/rustfmt-style-edition.html)
- [Rust Edition Guide: cambiamenti di formattazione dello stile 2024](https://doc.rust-lang.org/edition-guide/rust-2024/rustfmt-formatting-fixes.html#avoid-extra-space-in-nested-tuple-indexing-expression)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Workspace|Workspace]]
- [[Programmazione/Rust/Pagine/Edition migration|Edition migration]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Clippy|Clippy]]
- [[Programmazione/Rust/Pagine/rustdoc|rustdoc]]
- [[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]
