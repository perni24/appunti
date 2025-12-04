# Funzioni in Rust

Le funzioni sono un blocco fondamentale in Rust. Sono il modo principale per incapsulare il codice in unità riutilizzabili.

## Dichiarazione di una Funzione

Le funzioni in Rust vengono dichiarate con la parola chiave `fn`. Per convenzione, i nomi delle funzioni usano lo stile `snake_case`.

```rust
fn main() {
    println!("Hello, world!");
    un_altra_funzione();
}

fn un_altra_funzione() {
    println!("Questa è un'altra funzione.");
}
```
L'ordine in cui vengono definite le funzioni non ha importanza, purché siano definite all'interno dello scope.

## Parametri di Funzione

Le funzioni possono avere parametri, che sono variabili speciali definite nella firma della funzione. È obbligatorio specificare il tipo di ogni parametro.

```rust
fn main() {
    stampa_valore(5);
    stampa_misura(5, 'h');
}

fn stampa_valore(x: i32) {
    println!("Il valore di x è: {}", x);
}

fn stampa_misura(valore: i32, etichetta: char) {
    println!("La misura è: {}{}", valore, etichetta);
}
```

## Espressioni e Statement

I corpi delle funzioni sono composti da una serie di *statement* che terminano, opzionalmente, con un'*espressione*.

-   **Statement**: Istruzioni che eseguono un'azione ma non restituiscono un valore. In Rust, terminano con un punto e virgola. Ad esempio, `let y = 6;` è uno statement.
-   **Espressioni**: Valutano a un valore risultante. Ad esempio, `5 + 6` è un'espressione che valuta a `11`. Le espressioni non terminano con un punto e virgola se sono l'ultima riga di una funzione e ne rappresentano il valore di ritorno.

## Valori di Ritorno

Le funzioni possono restituire valori al codice che le ha chiamate. Non nominiamo i valori di ritorno, ma dichiariamo il loro tipo dopo una freccia (`->`).

Il valore di ritorno di una funzione è il valore dell'espressione finale nel blocco del corpo della funzione.

```rust
fn cinque() -> i32 {
    5
}

fn piu_uno(x: i32) -> i32 {
    x + 1
}

fn main() {
    let x = cinque();
    let y = piu_uno(x);
    println!("Il valore di y è: {}", y);
}
```

-   `cinque()` non ha parametri e restituisce un valore di tipo `i32`. Il corpo è solo `5` (un'espressione), quindi la funzione restituisce `5`.
-   `piu_uno(x: i32)` prende un `i32` e restituisce un `i32`. `x + 1` è l'espressione finale, quindi il suo risultato viene restituito.

Se si aggiungesse un punto e virgola alla fine di `x + 1`, diventerebbe uno statement e la funzione non restituirebbe alcun valore (restituirebbe un tipo unit `()`), causando un errore di compilazione.

```rust
// Questo codice non compila!
fn piu_uno_errato(x: i32) -> i32 {
    x + 1; // L'uso del punto e virgola trasforma l'espressione in uno statement
}
```
