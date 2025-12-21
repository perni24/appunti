---
tags:
  - programmazione
  - rust
  - teoria
argomento: Funzioni
data: 2025-12-20
stato: 🟢 completato
---

# Funzioni in Rust

## 💡 Concetto Chiave
Le funzioni sono l'unità fondamentale di esecuzione. In Rust, le firme delle funzioni (signature) devono essere **esplicite**: il compilatore deve conoscere esattamente il tipo di ogni parametro e il tipo di ritorno. Non c'è inferenza di tipo globale per le funzioni.
Le funzioni in Rust supportano il **ritorno implicito** (ultima espressione senza `;`).

---

## 📝 Sintassi

```rust
fn nome_funzione(parametro1: Tipo1, parametro2: Tipo2) -> TipoRitorno {
    // Corpo della funzione
    // ...
    valore_di_ritorno // Nota: niente punto e virgola
}
```
Se una funzione non restituisce nulla, il tipo di ritorno è implicitamente `()` (unit type).

---

## 💻 Esempi Pratici

### Esempio Base: Parametri
```rust
fn main() {
    stampa_somma(5, 10);
}

fn stampa_somma(a: i32, b: i32) {
    println!("La somma è: {}", a + b);
}
```

### Esempio Avanzato: Valori di Ritorno
```rust
fn main() {
    let x = cinque();
    let y = piu_uno(x);
    println!("Valore: {}", y);
}

// Ritorno implicito (idiomatico)
fn cinque() -> i32 {
    5
}

// Ritorno esplicito (usato per uscite anticipate)
fn piu_uno(x: i32) -> i32 {
    if x > 100 {
        return x; // Return esplicito necessario qui
    }
    x + 1 // Ultima espressione
}
```

---

## ⚙️ Funzionamento Interno

### Stack Frame
Quando una funzione viene chiamata, viene creato un nuovo *frame* sullo Stack contenente i parametri e le variabili locali. Quando la funzione termina, il frame viene distrutto (popped).

### Passaggio per Valore vs Riferimento
*   I parametri sono passati per **valore** (o **Move** per tipi complessi) di default.
*   Se passi una `String` a una funzione senza `&`, la funzione ne diventa proprietaria e la distrugge quando termina.
*   Per evitare il trasferimento di ownership, usa i riferimenti (`&Tipo`).

### Statements vs Expressions
Rust distingue nettamente:
*   `x + 1;` (con `;`) è uno Statement -> Ritorna `()` (unit).
*   `x + 1` (senza `;`) è un'Expression -> Ritorna il valore calcolato.
Questa distinzione è la causa più comune di errori per i principianti nelle funzioni che devono ritornare valori.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Snake Case:** Usa sempre `snake_case` per i nomi delle funzioni (`mia_funzione`).
- ✅ **Riferimenti:** Se una funzione deve solo leggere un dato complesso (es. `String` o `Vec`), passa un riferimento (`&String`), non il valore.
- 💣 **Il punto e virgola:** Se la tua funzione deve restituire `i32` ma metti un `;` all'ultima riga, riceverai un errore: *expected `i32`, found `()`*.

---

## 📚 Riferimenti
- [The Rust Programming Language - Functions](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html)