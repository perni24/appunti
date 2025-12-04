# Variabili e Mutabilità in Rust

In Rust, le variabili sono immutabili per impostazione predefinita. Questa è una delle caratteristiche fondamentali che Rust usa per garantire la sicurezza del codice, in particolare la sicurezza rispetto alla concorrenza.

## Variabili Immutabili

Quando dichiari una variabile in Rust, il suo valore non può essere modificato una volta assegnato.

```rust
fn main() {
    let x = 5;
    println!("Il valore di x è: {}", x);
    // x = 6; // Questo causerebbe un errore di compilazione!
    println!("Il valore di x è ancora: {}", x);
}
```

Questo approccio previene errori comuni in cui lo stato di una variabile viene modificato inaspettatamente.

## Variabili Mutabili

Se hai bisogno di una variabile il cui valore possa essere modificato, devi usare la parola chiave `mut` durante la dichiarazione.

```rust
fn main() {
    let mut x = 5;
    println!("Il valore di x è: {}", x);
    x = 6;
    println!("Il valore di x è ora: {}", x);
}
```

## Costanti

Le costanti sono simili alle variabili immutabili, ma con alcune differenze chiave:
- Non puoi usare `mut` con le costanti. Le costanti sono sempre immutabili.
- Devi specificare esplicitamente il tipo della costante.
- Le costanti possono essere dichiarate in qualsiasi scope, incluso quello globale.
- Le costanti possono essere assegnate solo a espressioni costanti, non a valori calcolati a runtime.

```rust
const MAX_POINTS: u32 = 100_000;
```

## Shadowing

In Rust, puoi dichiarare una nuova variabile con lo stesso nome di una variabile precedente. Questa pratica è chiamata "shadowing". La nuova variabile "mette in ombra" la precedente.

```rust
fn main() {
    let x = 5;
    let x = x + 1;
    let x = x * 2;
    println!("Il valore di x è: {}", x); // Stampa 12
}
```

Lo shadowing è diverso dall'usare `mut` perché stiamo creando una nuova variabile. Questo ci permette anche di cambiare il tipo della variabile:

```rust
let spaces = "   ";
let spaces = spaces.len(); // Ora `spaces` è un numero
```

Questa è una funzionalità molto utile che permette di riutilizzare nomi di variabili in modo sicuro.

## Tipi di Dati

Rust è un linguaggio a tipizzazione statica, il che significa che deve conoscere i tipi di tutte le variabili al momento della compilazione. Nella maggior parte dei casi, il compilatore può inferire il tipo in base al valore che gli assegniamo, ma a volte è necessario specificarlo esplicitamente.

Rust ha due categorie principali di tipi di dati: scalari e composti.

### Tipi Scalari

I tipi scalari rappresentano un singolo valore. Rust ha quattro tipi scalari primitivi: interi, numeri floating-point, booleani e caratteri.

#### Interi

Gli interi sono numeri senza componente frazionaria. Rust offre diversi tipi di interi, a seconda che siano con segno (`i`) o senza segno (`u`) e della loro dimensione (8, 16, 32, 64, 128 bit, o `isize`/`usize` che dipendono dall'architettura del sistema).

| Lunghezza | Con Segno | Senza Segno |
|-----------|-----------|-------------|
| 8-bit     | `i8`      | `u8`        |
| 16-bit    | `i16`     | `u16`       |
| 32-bit    | `i32`     | `u32`       |
| 64-bit    | `i64`     | `u64`       |
| 128-bit   | `i128`    | `u128`      |
| arch      | `isize`   | `usize`     |

Esempio:
```rust
let intero: i32 = 42;
let unsigned_int: u64 = 100_000; // Il `_` è solo per leggibilità
```

#### Numeri Floating-Point

Rust ha due tipi floating-point: `f32` (precisione singola) e `f64` (precisione doppia, default).

```rust
let x = 2.0; // f64
let y: f32 = 3.0; // f32
```

#### Booleani

Il tipo booleano ha due valori possibili: `true` e `false`.

```rust
let t = true;
let f: bool = false; // con annotazione esplicita di tipo
```

#### Caratteri

Il tipo `char` di Rust rappresenta un carattere Unicode scalare. I valori `char` sono specificati con virgolette singole.

```rust
let c = 'z';
let emoji = '😻';
```

### Tipi Composti

I tipi composti possono raggruppare più valori in un unico tipo. Rust ha due tipi composti primitivi: tuple e array.

#### Tuple

Una tupla è un modo per raggruppare un numero fisso di valori di diversi tipi in un unico tipo composto. Le tuple sono immutabili per dimensione.

```rust
let tup: (i32, f64, u8) = (500, 6.4, 1);
let (x, y, z) = tup; // Destrutturazione
println!("Il valore di y è: {}", y);

// Accesso diretto agli elementi con l'indice
let five_hundred = tup.0;
let six_point_four = tup.1;
```

#### Array

Gli array sono un modo per raggruppare un numero fisso di valori dello stesso tipo. Gli array sono immutabili per dimensione e tipo.

```rust
let a = [1, 2, 3, 4, 5]; // Tipo inferito: [i32; 5]
let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Con annotazione esplicita: [tipo; lunghezza]
let b: [i32; 5] = [1, 2, 3, 4, 5];

// Array con tutti gli elementi uguali
let c = [3; 5]; // È come scrivere [3, 3, 3, 3, 3]

// Accesso agli elementi
let first = a[0];
let second = a[1];
```

Accesso a un elemento fuori dai limiti di un array causerà un *panic* a runtime.
