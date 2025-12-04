# Controllo del Flusso in Rust

Rust offre diverse strutture per controllare il flusso di esecuzione del codice, tra cui `if`, `else if`, `else` per le condizioni, e vari tipi di cicli come `loop`, `while` e `for`.

## Espressioni Condizionali: `if`, `else if`, `else`

L'espressione `if` permette di eseguire un blocco di codice solo se una condizione è vera.

```rust
fn main() {
    let numero = 6;

    if numero % 4 == 0 {
        println!("Il numero è divisibile per 4");
    } else if numero % 3 == 0 {
        println!("Il numero è divisibile per 3");
    } else if numero % 2 == 0 {
        println!("Il numero è divisibile per 2");
    } else {
        println!("Il numero non è divisibile per 4, 3, o 2");
    }
}
```

### `if` in una `let`

Poiché `if` è un'espressione in Rust, può restituire un valore. I blocchi di codice in ogni braccio dell' `if` devono restituire lo stesso tipo.

```rust
fn main() {
    let condizione = true;
    let numero = if condizione { 5 } else { 6 };
    println!("Il valore del numero è: {}", numero);
}
```

## Cicli

Rust ha tre tipi principali di cicli: `loop`, `while`, e `for`.

### `loop`

Il ciclo `loop` esegue un blocco di codice all'infinito, finché non viene esplicitamente fermato con la parola chiave `break`.

```rust
fn main() {
    let mut contatore = 0;

    let risultato = loop {
        contatore += 1;

        if contatore == 10 {
            break contatore * 2;
        }
    };

    println!("Il risultato è {}", risultato);
}
```

`break` può restituire un valore dal punto in cui il ciclo viene interrotto.

### `while`

Il ciclo `while` esegue un blocco di codice finché una condizione è vera.

```rust
fn main() {
    let mut numero = 3;

    while numero != 0 {
        println!("{}!", numero);
        numero -= 1;
    }

    println!("LIFTOFF!!!");
}
```

### `for`

Il ciclo `for` è usato per iterare su una collezione, come un array o un range. È il ciclo più comunemente usato in Rust per la sua sicurezza e concisione.

#### Iterare su un Array

```rust
fn main() {
    let a = [10, 20, 30, 40, 50];

    for elemento in a.iter() {
        println!("Il valore è: {}", elemento);
    }
}
```

#### Iterare su un Range

```rust
fn main() {
    for numero in (1..4).rev() { // rev() inverte il range
        println!("{}!", numero);
    }
    println!("LIFTOFF!!!");
}
```
Questo è più sicuro e meno propenso a errori rispetto a un ciclo `while` con un contatore manuale.
