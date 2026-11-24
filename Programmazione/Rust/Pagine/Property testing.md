---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - Property testing
  - Property-based testing
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unit test|Unit test]]"
  - "[[Programmazione/Rust/Pagine/Invariants|Invariants]]"
related:
  - "[[Programmazione/Rust/Pagine/Fuzzing|Fuzzing]]"
  - "[[Programmazione/Rust/Pagine/Snapshot testing|Snapshot testing]]"
  - "[[Programmazione/Rust/Pagine/Option|Option]]"
title: Property testing
---

# Property testing

## Sintesi

Un [[Programmazione/Rust/Pagine/Unit test|test unitario]] può verificare che `normalize(" A ") == "a"`. Con il **property testing** descrivi invece una famiglia di input e una regola che deve valere per ciascuno. Il framework genera un campione di casi e, se ne trova uno che smentisce la regola, prova a semplificarlo. Un controesempio basta a confutare una proprietà; un test verde non la dimostra per tutti gli input.

## Quando usarlo

È utile per parser, serializzatori, trasformazioni e strutture dati quando sai dire che cosa deve restare vero variando l'input. Per scegliere la regola, chiediti **quale implementazione sbagliata riuscirebbe comunque a superare il test**.

| Proprietà | Che cosa chiede | Che cosa può sfuggire |
| --- | --- | --- |
| Idempotenza | Normalizzare due volte dà lo stesso risultato che normalizzare una volta. | Una funzione che restituisce sempre `""` è idempotente, ma perde il contenuto. |
| Inversione | Invertire due volte una sequenza restituisce l'originale. | Anche una funzione che non inverte mai nulla passa: aggiungi un esempio dal risultato noto. |
| Ordinamento | Ogni coppia di elementi consecutivi è in ordine. | Un risultato sempre vuoto è ordinato: verifica anche che gli elementi e le loro molteplicità siano conservati. |
| Round trip | Decodificare un valore appena codificato restituisce il valore originale. | Encoder e decoder possono condividere lo stesso errore rispetto al formato esterno: aggiungi esempi del formato. |

## Esempio pratico

### 1. Preparare una libreria

Da una directory di lavoro crea la crate:

```sh
cargo new --lib --vcs none label_notes
```

Da qui in poi lavora in `label_notes`. In `Cargo.toml` aggiungi la dipendenza **di sviluppo** (se la sezione esiste, aggiungi solo la riga di `proptest`). L'esempio usa proptest 1.12.0, che richiede Rust 1.88 o successivo; al primo avvio servono il registro Cargo o una cache già popolata.

```toml
[dev-dependencies]
proptest = "=1.12.0"
```

Sostituisci `src/lib.rs` con la funzione sotto. Il contratto è preciso: rimuove gli spazi bianchi alle **estremità**, porta il testo in minuscolo e conserva gli spazi interni. Non promette di rimuovere gli accenti o di rendere equivalenti tutte le rappresentazioni Unicode.

```rust
pub fn normalize(input: &str) -> String {
    input.trim().to_lowercase()
}
```

### 2. Scegliere il dominio e il risultato atteso

Aggiungi questo modulo **in fondo allo stesso file**. Il primo test fissa un caso leggibile con una lettera accentata, due spazi interni e una tabulazione finale. Le due proprietà rispondono a domande diverse: il risultato è *stabile*? E conserva *l'etichetta giusta*?

```rust
#[cfg(test)]
mod tests {
    use super::normalize;
    use proptest::prelude::*;

    #[test]
    fn preserves_internal_spaces() {
        assert_eq!(normalize("  ÈCO  2\t"), "èco  2");
    }

    fn labels() -> impl Strategy<Value = String> {
        prop::collection::vec(0_u8..26, 1..=16).prop_map(|letters| {
            letters.into_iter().map(|n| char::from(b'a' + n)).collect()
        })
    }

    proptest! {
        #[test]
        fn normalization_is_idempotent(chars in prop::collection::vec(any::<char>(), 0..=48)) {
            let input: String = chars.into_iter().collect();
            let once = normalize(&input);
            prop_assert_eq!(normalize(&once), once);
        }

        #[test]
        fn recovers_padded_label(label in labels(), left in 0_usize..=3, right in 1_usize..=3) {
            let input = format!("{}{}{}", " ".repeat(left), label.to_ascii_uppercase(), " ".repeat(right));
            prop_assert_eq!(normalize(&input), label);
        }
    }
}
```

La prima strategia può generare anche la stringa vuota. La seconda sceglie prima il **risultato atteso** (da 1 a 16 lettere ASCII minuscole), poi costruisce un input con maiuscole e spazi. Non ricalcola la risposta usando lo stesso `trim().to_lowercase()` della funzione. Almeno uno spazio a destra è intenzionale: ogni caso esercita quel requisito. Questa seconda proprietà non verifica l'intero comportamento Unicode.

Dalla directory del progetto:

```sh
cargo test --lib
```

Cargo elenca **tre test**: uno a esempio fisso e due proprietà. Non significa che siano stati provati soltanto tre input: ogni proprietà genera più casi.

### 3. Osservare un fallimento e riprodurlo

Per la controprova cambia **solo** `trim()` in `trim_start()` dentro `normalize`. Esegui prima la proprietà di idempotenza da sola:

```sh
cargo test --lib tests::normalization_is_idempotent -- --exact
```

Resta verde: lasciare uno spazio a destra non rende instabile il risultato. Ora esegui la proprietà che controlla il contenuto:

```sh
cargo test --lib tests::recovers_padded_label -- --exact
```

Questa fallisce. Leggi `minimal failing input`: i nomi stampati sono i parametri della strategia, non necessariamente la stringa passata alla funzione. Per esempio, `label = "a", left = 0, right = 1` costruisce `"A "`: il risultato effettivo è `"a "`, quello atteso è `"a"`. Lo **shrinking** cerca un caso più semplice che fallisca ancora, rispettando i vincoli del generatore. Non garantisce il minimo assoluto.

Con la configurazione predefinita, in questo progetto proptest conserva il **seed** in `proptest-regressions/lib.txt`. Riesegui lo stesso comando: i seed registrati vengono riprovati prima dei nuovi casi. Conserva il file nel controllo versione del progetto; se cambi strategia o dipendenze, non dare per scontato che lo stesso seed produca gli stessi valori. Per fissare il requisito indipendentemente dal generatore, puoi aggiungere questo test nel modulo `tests`:

```rust
#[test]
fn removes_one_trailing_space() {
    assert_eq!(normalize("A "), "a");
}
```

Ripristina `trim()` e rilancia `cargo test --lib`: ora passano anche il caso registrato e il nuovo test esplicito.

## Varianti e limiti

- **Generatori mirati:** costruisci input validi per il dominio; con `prop_assume!` molti scarti possono esaurire il budget prima di esercitare il comportamento interessante. Per testare il rifiuto di input invalidi, genera proprio quella categoria e verifica l'errore atteso.
- **Relazioni fra input:** nel test dell'etichetta, cambiare maiuscole e padding non deve cambiare il risultato canonico. È una relazione *metamorfica*: spesso è più utile che duplicare l'algoritmo nel test.
- **Confronto differenziale:** confronta l'implementazione con un modello semplice e indipendente. Per una struttura con stato puoi generare sequenze brevi di operazioni e confrontare gli stati dopo ogni passo.
- **Ambito della garanzia:** nessun panic è una proprietà utile, ma non garantisce un risultato corretto. Mantieni anche casi espliciti per i confini che devono essere provati a ogni esecuzione. `quickcheck` è un'alternativa per Rust; macro e strategie mostrate qui sono di `proptest`.

## Errori comuni

- Confondere «ha superato tanti casi» con «ha coperto ogni caso limite». Aumentare il numero di input non corregge una proprietà debole.
- Usare l'ora reale, la rete o una seconda fonte casuale dentro il test. Il seed del generatore non registra questi fattori e lo shrinking può diventare irriproducibile.
- Eliminare il file di regressione per far sparire una segnalazione. Riproduci il caso, verifica il contratto e correggi il codice oppure, se il requisito era sbagliato, la proprietà.

## Checklist

- Quale comportamento errato potrebbe ancora passare questa proprietà?
- Il generatore comprende i casi importanti senza affidarsi a coincidenze rare?
- So ricostruire l'input effettivo dai parametri del controesempio?
- Il requisito emerso dal fallimento merita un test unitario esplicito?

## Fonti

- [Proptest 1.12.0: API e strategie](https://docs.rs/proptest/1.12.0/proptest/)
- [The Proptest Book: come funziona lo shrinking](https://proptest-rs.github.io/proptest/proptest/tutorial/shrinking-basics.html)
- [The Proptest Book: persistenza e riproduzione dei fallimenti](https://proptest-rs.github.io/proptest/proptest/failure-persistence.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]
- [[Programmazione/Rust/Pagine/Fuzzing|Fuzzing]]
- [[Programmazione/Rust/Pagine/Snapshot testing|Snapshot testing]]
- [[Programmazione/Rust/Pagine/Option|Option]]
