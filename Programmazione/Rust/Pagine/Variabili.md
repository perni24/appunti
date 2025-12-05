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

#### Struct (Strutture)

Le `struct` sono tipi di dati composti che permettono di raggruppare e nominare più valori correlati. Sono il modo principale in Rust per creare i tuoi tipi di dati personalizzati. Esistono tre tipi di `struct`:

-   **Struct classiche (con campi nominati):**

```rust
struct Utente {
    username: String,
    email: String,
    attivo: bool,
    accessi: u64,
}

let utente1 = Utente {
    email: String::from("qualcuno@example.com"),
    username: String::from("utente123"),
    attivo: true,
    accessi: 1,
};

// Per accedere ai campi si usa la notazione a punto
println!("Email dell'utente: {}", utente1.email);
```

-   **Tuple Structs:** Simili alle tuple, ma con un nome per il tipo. Utili per dare un nome a una tupla e renderla un tipo distinto.

```rust
struct Colore(i32, i32, i32);
struct Punto(i32, i32, i32);

let nero = Colore(0, 0, 0);
let origine = Punto(0, 0, 0);
```

-   **Unit-like Structs:** Strutture senza campi, utili in situazioni generiche o quando si ha bisogno di implementare un *trait* su un tipo ma non si hanno dati da memorizzare.

```rust
struct AlwaysEqual;
let subject = AlwaysEqual;
```

#### Enum (Enumerazioni)

Le `enum` (enumerazioni) permettono di definire un tipo che può avere uno tra un insieme di valori possibili (chiamati *varianti*).

```rust
enum Messaggio {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}
```
A differenza di altri linguaggi, ogni variante di un'enum può opzionalmente contenere dei dati. Questo rende le enum di Rust estremamente potenti.

Un esempio fondamentale è l'enum `Option<T>`, definita nella libreria standard, che gestisce l'eventuale assenza di un valore:

```rust
enum Option<T> {
    Some(T), // Il valore è presente
    None,    // Il valore è assente (simile a `null`)
}
```

Questo sistema permette a Rust di garantire a livello di compilazione che i valori "null" (o meglio, `None`) siano gestiti, prevenendo un'intera classe di bug.

```rust
let numero_presente = Some(5);
let numero_assente: Option<i32> = None;
```
Per interagire con le enum si usa tipicamente il costrutto `match`, che vedremo più avanti.

### Tipi Slice

Uno slice è un tipo di dato che non ha la proprietà dei dati, ma permette di fare riferimento a una sequenza contigua di elementi in una collezione. È una "vista" su una porzione di dati, come un array o una `String`.

#### String Slice (`&str`)

In Rust si distingue tra `String` e `&str`:

-   `String`: È un tipo proprietario, allocato sulla heap, che può essere modificato (se dichiarato con `mut`). È un buffer di testo UTF-8. Quando si passa una `String`, la proprietà viene spostata.
-   `&str`: È uno "string slice" o "riferimento a una stringa". È un riferimento immutabile a una sequenza di byte UTF-8 che può essere in qualsiasi parte della memoria (sulla heap, sullo stack o nel codice binario del programma). I letterali di stringa (es. `"ciao"`) sono di tipo `&'static str`.

```rust
let s = String::from("ciao mondo");

let ciao = &s[0..4]; // slice che contiene "ciao"
let mondo = &s[5..10]; // slice che contiene "mondo"

// Le funzioni che accettano &str sono più flessibili
fn prima_parola(s: &str) -> &str {
    // ... logica per trovare la prima parola
    &s[..1] // esempio semplificato
}

// Possiamo passare sia una String...
prima_parola(&s);

// ...che uno string slice
let s_literal = "un'altra stringa";
prima_parola(s_literal);
```

#### Slice di altri tipi

Il concetto di slice non è limitato alle stringhe. Funziona con qualsiasi collezione contigua, come gli array.

```rust
let a = [1, 2, 3, 4, 5];

let slice: &[i32] = &a[1..3]; // È un riferimento a una parte dell'array `a`
// `slice` ora punta ai dati `[2, 3]`

assert_eq!(slice, &[2, 3]);
```
Gli slice sono sicuri e potenti perché, grazie alle regole del borrowing, il compilatore si assicura che lo slice non possa "sopravvivere" alla collezione a cui fa riferimento, prevenendo dangling pointers.

### Collezioni Dinamiche

Oltre ai tipi composti con dimensione fissa come tuple e array, Rust offre collezioni dinamiche dalla libreria standard che possono crescere o ridursi in base alle necessità e che tipicamente allocano i loro dati sulla heap.

#### Vettore (`Vec<T>`)

Il tipo `Vec<T>`, spesso chiamato "vettore", è una collezione omogenea (tutti gli elementi sono dello stesso tipo `T`) che ti permette di memorizzare un numero variabile di valori. È l'equivalente di un array dinamico in altri linguaggi.

```rust
let mut v: Vec<i32> = Vec::new(); // Crea un nuovo vettore vuoto
v.push(1); // Aggiunge elementi
v.push(2);
v.push(3);

let mut v2 = vec![1, 2, 3]; // Macro per creare un vettore con valori iniziali

// Accesso agli elementi (come gli array, ma attenzione ai panic!)
let terzo_elemento = &v2[2]; // Riferimento all'elemento
println!("Il terzo elemento è: {}", terzo_elemento);

// Oppure con get, che restituisce un Option<&T>
match v2.get(2) {
    Some(terzo) => println!("Il terzo elemento è: {}", terzo),
    None => println!("Non c'è un terzo elemento."),
}

// Iterare su un vettore
for i in &mut v2 {
    *i += 50; // Per modificare il valore, dobbiamo dereferenziare il riferimento mutabile
}
println!("Vettore modificato: {:?}", v2);
```

#### Hash Map (`HashMap<K, V>`)

L'`HashMap<K, V>` è una collezione che memorizza i dati come coppie chiave-valore. Le chiavi `K` devono essere tutte dello stesso tipo e i valori `V` devono essere tutti dello stesso tipo. `HashMap` è utile quando vuoi cercare dati per chiave.

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

let team_name = String::from("Blue");
let score = scores.get(&team_name).copied().unwrap_or(0); // get restituisce Option<&V>
println!("Il punteggio del team {} è: {}", team_name, score);

// Iterare su una HashMap
for (key, value) in &scores {
    println!("{}: {}", key, value);
}

// Aggiornare valori:
// Se la chiave non esiste, la inserisce. Se esiste, non fa nulla.
scores.entry(String::from("Blue")).or_insert(25);

// Se la chiave esiste, aggiorna il valore
let red_score = scores.entry(String::from("Red")).or_insert(0);
*red_score += 10; // Modifica il valore puntato dal riferimento
```
Una `HashMap` richiede che le chiavi implementino i trait `Eq` e `Hash`. Tipi come `String` e tutti i tipi numerici implementano questi trait per impostazione predefinita.

## Pattern Matching con `match`

Il `match` è un potente costrutto di controllo di flusso in Rust che permette di confrontare un valore con una serie di "pattern" ed eseguire codice basandosi sul pattern che corrisponde. È simile a un `switch` di altri linguaggi, ma molto più potente.

Il `match` è esaustivo: devi coprire ogni possibile caso. Questo è particolarmente utile con le `enum`.

```rust
enum Moneta {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn valore_in_centesimi(moneta: Moneta) -> u8 {
    match moneta {
        Moneta::Penny => 1,
        Moneta::Nickel => 5,
        Moneta::Dime => 10,
        Moneta::Quarter => 25,
    }
}
```

`match` può anche essere usato per estrarre i valori contenuti nelle varianti di un'enum, come `Option<T>`:

```rust
fn piu_uno(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}

let cinque = Some(5);
let sei = piu_uno(cinque);      // Some(6)
let nessuno = piu_uno(None); // None
```

Il `match` è una delle funzionalità più amate di Rust perché permette di scrivere codice conciso, espressivo e sicuro, specialmente quando si lavora con strutture dati complesse.