---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - unsafe-rust-in-profondita
aliases:
  - Miri
  - cargo miri
prerequisites:
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
title: Miri
---

# Miri

## Sintesi

**Miri esegue un programma Rust e controlla le operazioni che incontra.** Interpreta il MIR (*Mid-level Intermediate Representation*) prodotto dal compilatore. Può quindi segnalare, per esempio, una lettura che non rispetta i requisiti di inizializzazione, allineamento o validità del puntatore anche quando un normale test nativo non rileva anomalie.

È un controllo **dinamico**, non un'analisi di tutti i rami del sorgente. Se un test verifica soltanto il caso vuoto e ritorna prima della lettura, Miri non ha verificato quella lettura.

## Quando usarlo

- Dopo una modifica in un modulo che espone un'API safe sopra codice unsafe: esegui i test **dal punto di vista di chi usa l'API**.
- Quando vuoi controllare operazioni su memoria o prestiti con casi piccoli e ripetibili. Includi sia gli input di confine sia almeno un input che attraversi davvero l'operazione da verificare.
- Come complemento ai test nativi. Mantieni questi ultimi per l'integrazione reale con sistema operativo, driver e librerie esterne; Miri non è una misura delle prestazioni né un sostituto di quella piattaforma.

## Come funziona

### Preparare la toolchain senza cambiare quella del progetto

Occorrono Rust gestito da `rustup` e, per la preparazione iniziale, rete e spazio su disco. Installa Miri **nella stessa nightly** che userai per i test. Il comando seguente scarica anche i sorgenti della libreria standard; non serve impostare un override nella cartella del progetto.

```sh
rustup toolchain install nightly --profile minimal --component miri --component rust-src
```

Controlla quale Miri stai per usare:

```sh
cargo +nightly miri --version
```

Prepara la libreria standard per l'interprete (*sysroot*). Il primo test può farlo automaticamente; separare questo passaggio rende più facile distinguere un problema di installazione da un problema nel codice.

```sh
cargo +nightly miri setup
```

`+nightly` seleziona la toolchain **per quel comando**. Se il componente manca per una determinata nightly o piattaforma, verifica la disponibilità prima di modificare i test. In CI puoi fissare una nightly datata che hai effettivamente provato: usa lo stesso identificatore per installazione, setup ed esecuzione.

## Esempio pratico

### Una lettura, due percorsi da coprire

L'esempio è una **crate di libreria senza dipendenze**. Per provarlo in un progetto nuovo, crea una cartella dedicata:

```sh
cargo new --lib miri-demo --vcs none
```

Entra nella cartella che contiene il nuovo `Cargo.toml`:

```sh
cd miri-demo
```

Il contenuto di `src/lib.rs` è il seguente:

```rust
pub fn last_byte(bytes: &[u8]) -> Option<u8> {
    let index = bytes.len().checked_sub(1)?;
    // SAFETY: esiste almeno un elemento; index è l'ultimo indice
    // valido della stessa slice, ancora presa in prestito per la lettura.
    Some(unsafe { *bytes.as_ptr().add(index) })
}

#[cfg(test)]
mod tests {
    use super::last_byte;

    #[test]
    fn handles_empty() {
        assert_eq!(last_byte(&[]), None);
    }

    #[test]
    fn reads_last_byte() {
        assert_eq!(last_byte(&[7]), Some(7));
        assert_eq!(last_byte(&[10, 20, 30]), Some(30));
    }
}
```

Nel codice applicativo basta `bytes.last().copied()`. Qui la lettura esplicita serve a distinguere **il risultato controllato dall'assert** dalle **condizioni della lettura controllate dall'interprete**. Il caso vuoto termina con `None` prima del blocco unsafe. Gli altri casi leggono rispettivamente all'offset zero e a un offset positivo dello stesso buffer.

### Eseguire gli stessi test

Prima esegui i due unit test nativamente:

```sh
cargo test --lib
```

Poi esegui lo stesso target con Miri:

```sh
cargo +nightly miri test --lib
```

Per concentrare il controllo sul percorso che **legge** il buffer:

```sh
cargo +nightly miri test --lib -- tests::reads_last_byte --exact
```

Con questa crate, la suite completa deve contare **due test passati**; il comando filtrato **uno passato e uno escluso dal filtro**. Zero test eseguiti non è una verifica riuscita dell'esempio. `--lib` seleziona i test della libreria, non quelli di integrazione o i doctest: in un progetto più grande, senza quel selettore, `cargo +nightly miri test` copre i target di test previsti da Cargo e supportati da Miri. Per una crate con un **binario** si può usare `cargo +nightly miri run`; il demo qui sopra non ha un binario.

## Interpretare l'esito

| Esito | Come leggerlo |
| --- | --- |
| Diagnosi di *Undefined Behavior* | Leggi l'operazione segnalata e il primo frame del tuo codice. Risali a dove sono nati il dato o il prestito e confronta il percorso con il contratto di sicurezza. Per l'aliasing, tieni conto del modello usato da quella versione di Miri. |
| Assertion fallita o panic inatteso | Il comportamento non soddisfa il test. Non è, da solo, una diagnosi di UB. |
| Operazione non supportata | L'interprete non sa eseguire quella parte dell'ambiente, per esempio una particolare chiamata nativa. Non prova né un bug né l'assenza di bug: isola la logica Rust e mantieni un test d'integrazione nativo. |
| Tutti i test passati | Non è emerso un problema nei percorsi e nelle configurazioni esplorati. Input non provati, altri target e altri ordini di esecuzione dei thread restano fuori da quella conclusione. |

Miri può anche segnalare perdite di memoria a fine esecuzione: **una perdita non è automaticamente UB**. Per rendere confrontabili due esecuzioni, annota versione di Miri, target, nome del test ed eventuali flag; se hai usato un seed specifico, conserva anche quello.

## Varianti e limiti

- **Provenienza dei puntatori.** Alcune nightly offrono `-Zmiri-strict-provenance` tramite la variabile d'ambiente `MIRIFLAGS`. È una modalità aggiuntiva che restringe, fra l'altro, la ricostruzione di puntatori da interi; non serve per il demo. Verifica i flag nella documentazione della **stessa revisione** dello strumento. La sintassi POSIX per assegnare una variabile davanti al comando non è sintassi PowerShell.
- **Concorrenza.** Esecuzioni con seed diversi possono esplorare più interleaving o disposizioni della memoria. Non equivalgono a provare ogni possibilità.
- **Strumenti complementari.** Il fuzzing cerca input interessanti; i sanitizer osservano determinate classi di errori nel codice compilato. Un input utile trovato altrove può diventare un test di regressione da eseguire anche con Miri.

## Errori comuni

- Invocare `cargo miri` nella toolchain stable quando il componente è stato installato solo in nightly.
- Contare un test come copertura del blocco unsafe soltanto perché ne chiama la funzione. Controlla i rami e il numero di test realmente eseguiti.
- Disattivare il controllo che segnala un problema per ottenere una suite verde. Prima chiarisci la precondizione e da quale parte del programma dovrebbe essere garantita.
- Confondere una limitazione dell'interprete con un errore del compilatore o con una violazione osservata nel programma.

## Checklist

1. Versione, target e filtro sono quelli che volevo verificare?
2. Almeno un caso valido attraversa ogni operazione rilevante? I casi di rifiuto escono prima di quella operazione?
3. Ho distinto errore del test, diagnosi di UB e operazione non supportata?
4. Quali invarianti richiedono ancora un ragionamento sul codice, e quali integrazioni richiedono una prova nativa?

## Collegamenti

- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Fuzzing|Fuzzing]]

## Fonti

- [Miri: installazione, esecuzione, target e limiti](https://github.com/rust-lang/miri#readme)
- [rustup: selezione della toolchain](https://rust-lang.github.io/rustup/overrides.html)
- [Cargo: target, filtri e argomenti di cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html)
- [Rust Reference: comportamento indefinito](https://doc.rust-lang.org/reference/behavior-considered-undefined.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
