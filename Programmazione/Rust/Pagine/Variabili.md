---
tags:
  - programmazione
  - rust
  - teoria
argomento: Variabili e Tipi di Dati
data: 2025-12-20
stato: 🟢 completato
---

# Variabili e Tipi di Dati in Rust

## 💡 Concetto Chiave
In Rust, la sicurezza della memoria è garantita a compile-time senza Garbage Collector. Le variabili sono **immutabili per default** e seguono rigide regole di **Ownership**.
Rust è un linguaggio a **tipizzazione statica forte**: ogni valore ha un tipo determinato alla compilazione, anche se l'inferenza di tipo (`type inference`) permette spesso di omettere le annotazioni esplicite.

---

## 📝 Sintassi
Dichiarazione di variabili, costanti e shadowing.

```rust
// 1. Variabile Immutabile (Default)
// Il tipo può essere inferito o esplicito.
let x = 5; 
let y: i32 = 10;

// 2. Variabile Mutabile
// La parola chiave `mut` abilita la modifica del valore.
let mut z = 5;
z = 6;

// 3. Costanti
// Obbligatorio specificare il tipo. Scope globale consentito.
// Valutate a compile-time, non possono essere risultati di funzioni runtime.
const MAX_POINTS: u32 = 100_000;

// 4. Shadowing
// Ridichiarare una variabile con lo stesso nome.
let spaces = "   ";
let spaces = spaces.len(); // Cambio di tipo consentito (da &str a usize)
```

---

## ⚙️ Funzionamento Interno: Ownership & Memoria
Questa è la base teorica che distingue Rust dagli altri linguaggi.

### Regole dell'Ownership
1.  Ogni valore in Rust ha una variabile chiamata **owner**.
2.  Può esserci un solo owner alla volta.
3.  Quando l'owner esce dallo scope, il valore viene **droppato** (deallocato immediatamente).

### Stack vs Heap & Move Semantics
*   **Copy (Stack):** I tipi scalari (interi, bool, char, float) hanno una dimensione fissa e vivono sullo Stack. Quando vengono assegnati a un'altra variabile, vengono copiati bit per bit.
*   **Move (Heap):** I tipi complessi (come `String`, `Vec`) vivono sulla Heap (con un puntatore nello Stack). Un'assegnazione non copia i dati, ma **sposta** la proprietà (Move). La variabile precedente diventa invalida.

```rust
let s1 = String::from("hello");
let s2 = s1; 
// println!("{}", s1); // ❌ ERRORE: s1 non è più valido (Ownership spostata a s2)
```

### Borrowing (Prestito)
Per usare un valore senza prenderne la proprietà, si usano i **riferimenti** (`&`).
*   **`&T` (Riferimento Immutabile):** Possiamo averne infiniti.
*   **`&mut T` (Riferimento Mutabile):** Possiamo averne **solo uno** per scope, e nessun altro riferimento (né mutabile né immutabile) può coesistere. Questo previene le *Data Races*.

---

## 🧩 Tipi di Dati: Scalari
Tipi primitivi che rappresentano un singolo valore.

### Interi
Possono essere *signed* (`i`) o *unsigned* (`u`).

| Lunghezza | Signed | Unsigned | Note |
|:----------|:-------|:---------|:-----|
| 8-bit     | `i8`   | `u8`     |      |
| 16-bit    | `i16`  | `u16`    |      |
| 32-bit    | `i32`  | `u32`    | Default per interi |
| 64-bit    | `i64`  | `u64`    |      |
| 128-bit   | `i128` | `u128`   |      |
| arch      | `isize`| `usize`  | Dipende dall'architettura (32/64 bit). Usato per indici. |

### Floating-Point
Standard IEEE-754.
*   `f64` (Default): Doppia precisione.
*   `f32`: Singola precisione.

### Altri Scalari
*   **Boolean (`bool`):** `true` o `false`. Occupano 1 byte.
*   **Char (`char`):** Rappresenta un *Unicode Scalar Value* (4 byte). Si usa l'apice singolo `'z'`, `'😻'`.

---

## 📦 Tipi di Dati: Composti
Raggruppamento di più valori.

### Tuple
Lunghezza fissa, tipi eterogenei.
```rust
let tup: (i32, f64, u8) = (500, 6.4, 1);
let (x, y, z) = tup; // Destrutturazione
let primo = tup.0;   // Accesso tramite indice
```

### Array
Lunghezza fissa, tipi omogenei. Allocati sullo Stack.
```rust
let a: [i32; 5] = [1, 2, 3, 4, 5];
let b = [3; 5]; // [3, 3, 3, 3, 3] (inizializzazione rapida)
// L'accesso fuori dai limiti (es. a[10]) causa PANIC a runtime.
```

---

## 🏗️ Tipi Definiti dall'Utente

### Struct (Strutture)
Esistono tre tipi di strutture in Rust:

1.  **C-Style Struct:** Campi nominati.
    ```rust
    struct User {
        username: String,
        active: bool,
    }
    // Accesso: user.username
    ```
2.  **Tuple Struct:** Campi senza nome, identificati per posizione.
    ```rust
    struct Color(i32, i32, i32);
    let black = Color(0, 0, 0);
    ```
3.  **Unit-Like Struct:** Senza campi. Utili per implementare trait senza dati associati.
    ```rust
    struct AlwaysEqual;
    ```

### Enum (Enumerazioni)
Molto più potenti che in altri linguaggi (es. C/C++). Le varianti possono contenere dati di tipo diverso.

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 }, // Struttura anonima
    Write(String),           // Contiene una stringa
    ChangeColor(i32, i32, i32), // Contiene una tupla
}
```

#### Option Enum
Sostituisce il concetto di `null`. Forza il programmatore a gestire il caso di assenza di valore.
```rust
enum Option<T> {
    Some(T),
    None,
}
```

---

## 🔪 Slices (Viste sulla Memoria)
Uno slice è un riferimento a una sequenza contigua di elementi in una collezione, senza possederne l'ownership.

### String Slices (`&str`)
*   `String`: Tipo proprietario, heap-allocated, mutabile, UTF-8 garantito.
*   `&str`: Riferimento immutabile (slice) a una sequenza UTF-8. I letterali stringa `"ciao"` sono di tipo `&'static str`.

```rust
let s = String::from("hello world");
let hello: &str = &s[0..5]; // Punta ai byte 0-4 di `s`
```

### Array Slices
Funzionano allo stesso modo per gli array.
```rust
let a = [1, 2, 3, 4, 5];
let slice: &[i32] = &a[1..3]; // &[2, 3]
```

---

## 📚 Collezioni Dinamiche (std::collections)
Strutture dati che allocano sulla Heap e possono crescere dinamicamente.

### Vettori (`Vec<T>`)
Array ridimensionabili.
```rust
let mut v: Vec<i32> = Vec::new();
v.push(1);
v.push(2);
let v2 = vec![1, 2, 3]; // Macro conveniente
```

### Hash Maps (`HashMap<K, V>`)
Memorizzano coppie chiave-valore usando una funzione di hashing.
```rust
use std::collections::HashMap;
let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);

// Accesso sicuro
// .get restituisce un Option<&V>
match scores.get("Blue") {
    Some(score) => println!("{}", score),
    None => println!("Team non trovato"),
}
```

---

## 🔀 Controllo di Flusso sui Dati: Pattern Matching
Il costrutto `match` permette di confrontare un valore con una serie di pattern. Deve essere **esaustivo** (coprire tutti i casi possibili).

```rust
let msg = Message::Write(String::from("hello"));

match msg {
    Message::Quit => println!("Quit"),
    Message::Write(text) => println!("Text: {}", text), // Binding del valore
    _ => (), // Placeholder per "tutti gli altri casi"
}
```

---

## ⚠️ Best Practices & "Gotchas"
- **Unwrap:** Evita di usare `.unwrap()` in produzione su `Option` o `Result` a meno che tu non voglia causare un crash (panic) intenzionale in caso di errore. Preferisci `match` o `if let`.
- **Overflow:** In modalità debug, Rust va in panico per overflow degli interi. In release, esegue il "two's complement wrapping".
- **Floating Point:** Non usare `f32`/`f64` per valuta o calcoli che richiedono precisione decimale esatta (errori di arrotondamento IEEE-754).

## 📚 Riferimenti
- [The Rust Programming Language - Variables](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html)
- [The Rust Programming Language - Data Types](https://doc.rust-lang.org/book/ch03-02-data-types.html)