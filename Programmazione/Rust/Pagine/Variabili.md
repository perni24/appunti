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

## Ownership (Proprietà)

L'ownership è il concetto più unico di Rust e il modo in cui gestisce la memoria. Tutti i programmi devono gestire la memoria che usano durante l'esecuzione. Alcuni linguaggi usano un garbage collector (GC), altri richiedono al programmatore di allocare e deallocare la memoria manualmente. Rust usa un terzo approccio: un sistema di ownership con un insieme di regole che il compilatore controlla in fase di compilazione.

### Regole dell'Ownership

1.  Ogni valore in Rust ha una variabile che è il suo *owner* (proprietario).
2.  Ci può essere un solo owner alla volta.
3.  Quando l'owner esce dallo *scope* (l'ambito in cui è valido), il valore viene eliminato (dropped).

```rust
{
    let s = String::from("ciao"); // s è valido da questo punto in poi
    // fai qualcosa con s
} // lo scope di s è finito, s non è più valido. Rust chiama `drop` automaticamente.
```

Quando si passano dati complessi (come una `String`, che è allocata sulla heap) a una funzione o li si assegna a un'altra variabile, la proprietà viene *spostata* (move).

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // La proprietà di "hello" viene spostata da s1 a s2.
    // println!("{}", s1); // Errore! s1 non è più valido perché non è più il proprietario.
}
```

### Borrowing (Prestito) e Riferimenti

Invece di trasferire la proprietà, si può "prestare" l'accesso a un valore tramite i *riferimenti*. Questo processo è chiamato **borrowing**.

Un riferimento è come un puntatore che permette di accedere a un valore senza prenderne la proprietà. Si crea un riferimento usando il simbolo `&`.

```rust
fn main() {
    let s1 = String::from("ciao");
    let lunghezza = calcola_lunghezza(&s1); // Passiamo un riferimento a s1
    println!("La lunghezza di '{}' è {}.", s1, lunghezza); // s1 è ancora valido qui!
}

fn calcola_lunghezza(s: &String) -> usize { // s è un riferimento a una String
    s.len()
} // s esce dallo scope, ma siccome non ha la proprietà, non dealloca nulla.
```

Esistono due tipi di riferimenti:
-   **Riferimenti immutabili (`&T`)**: Permettono di leggere i dati. Se ne possono avere quanti se ne vuole contemporaneamente.
-   **Riferimenti mutabili (`&mut T`)**: Permettono di modificare i dati. Se ne può avere solo uno per un dato valore in un determinato scope.

### Lifetimes (Durata)

I lifetimes sono un'altra caratteristica unica di Rust che aiuta a prevenire i *dangling references* (riferimenti a dati non più validi).

Il lifetime di un riferimento assicura che i dati a cui punta rimangano validi per tutta la "vita" del riferimento stesso. Nella maggior parte dei casi, i lifetimes sono inferiti automaticamente dal compilatore. Tuttavia, in alcuni scenari complessi, specialmente con le funzioni che restituiscono riferimenti, potrebbe essere necessario annotarli esplicitamente.

Il loro scopo è garantire la sicurezza della memoria senza bisogno di un garbage collector. Per ora, è sufficiente sapere che esistono e che il compilatore li usa per verificare la validità dei riferimenti.

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
