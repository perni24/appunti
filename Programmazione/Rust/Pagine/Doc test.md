---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "Doc test"
  - "Documentation test"
prerequisites:
  - "[[Programmazione/Rust/Pagine/rustdoc]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Unit test]]"
  - "[[Programmazione/Rust/Pagine/Integration test]]"
  - "[[Programmazione/Rust/Pagine/Documentazione delle crate]]"
---

# Doc test

## Sintesi

I **doc test** sono esempi Rust scritti nella documentazione che vengono compilati ed eseguiti da `cargo test`. Servono a mantenere gli esempi pubblici sincronizzati con il codice reale.

Sono particolarmente utili per librerie: un esempio nella documentazione non dovrebbe solo spiegare, ma anche continuare a compilare quando l'API cambia.

## Quando usarlo

Usa doc test quando:

- documenti una funzione pubblica;
- vuoi mostrare l'uso idiomatico di un'API;
- vuoi evitare esempi obsoleti;
- una crate e destinata ad altri sviluppatori;
- vuoi testare esempi minimi e leggibili;
- vuoi documentare casi di errore o panic.

Non usare doc test per scenari lunghi o con molta infrastruttura: in quel caso meglio integration test o esempi in `examples/`.

## Come funziona

`rustdoc` estrae blocchi di codice Rust dalla documentazione e li trasforma in test. `cargo test` esegue anche questi test per le librerie.

Puoi controllare il comportamento con annotazioni:

- `no_run`: compila ma non esegue;
- `ignore`: ignora il blocco;
- `compile_fail`: il codice deve fallire la compilazione;
- `should_panic`: il codice deve andare in panic;
- `text`: blocco non Rust.

Gli esempi dovrebbero essere piccoli, completi e orientati all'utente.

## API / Sintassi

Esempio di documentazione testabile:

```rust
/// Somma due numeri.
///
/// # Examples
///
/// ```
/// let result = my_crate::add(2, 3);
/// assert_eq!(result, 5);
/// ```
pub fn add(left: i32, right: i32) -> i32 {
    left + right
}
```

Esempio che deve fallire:

```rust
/// ```compile_fail
/// let value: u32 = -1;
/// ```
pub struct OnlyPositive;
```

## Esempio pratico

Documentare un parser:

```rust
/// Converte una stringa in percentuale.
///
/// # Examples
///
/// ```
/// let value = my_crate::parse_percentage("42").unwrap();
/// assert_eq!(value, 42);
/// ```
///
/// # Errors
///
/// Restituisce errore se il valore non e un numero tra 0 e 100.
pub fn parse_percentage(input: &str) -> Result<u8, String> {
    let value: u8 = input.parse().map_err(|_| "invalid number".to_string())?;

    if value > 100 {
        return Err("percentage out of range".to_string());
    }

    Ok(value)
}
```

L'esempio diventa parte della suite di test e protegge la documentazione dall'invecchiare.

## Varianti

- **Esempi eseguibili**: blocchi Rust normali.
- **no_run**: utile per esempi che aprono rete, file o server.
- **compile_fail**: documenta vincoli di type system.
- **should_panic**: documenta panic intenzionali.
- **hidden lines**: righe nascoste per preparare contesto.
- **examples/**: esempi piu lunghi e separati dalla documentazione inline.

## Errori comuni

- Inserire esempi non completi.
- Usare doc test troppo lunghi.
- Nascondere troppo setup rendendo l'esempio poco onesto.
- Usare `ignore` per evitare di mantenere esempi rotti.
- Documentare API private invece del contratto pubblico.
- Dimenticare se l'esempio deve essere eseguito o solo compilato.
- Non spiegare errori e panic nelle sezioni dedicate.

## Checklist

- L'esempio mostra un uso reale dell'API?
- Il blocco compila con `cargo test`?
- L'esempio e abbastanza breve?
- Le annotazioni `no_run`, `ignore`, `compile_fail` sono motivate?
- Gli errori pubblici sono documentati?
- La documentazione resta leggibile senza conoscere il test harness?
- I doc test coprono le API centrali della crate?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/rustdoc]]
- [[Programmazione/Rust/Pagine/Unit test]]
- [[Programmazione/Rust/Pagine/Integration test]]
- [[Programmazione/Rust/Pagine/Public API design]]
- [[Programmazione/Rust/Pagine/Documentazione delle crate]]
