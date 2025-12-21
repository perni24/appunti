---
tags:
  - programmazione
  - rust
  - teoria
argomento: Cicli e Condizionali
data: 2025-12-20
stato: 🟢 completato
---

# Cicli e Condizionali in Rust

## 💡 Concetto Chiave
In Rust, il controllo del flusso è gestito tramite espressioni che possono restituire valori. A differenza di molti altri linguaggi, `if` è un'**espressione**, non solo uno statement.
Per l'iterazione, Rust privilegia il ciclo `for` basato su iteratori, che garantisce sicurezza (niente accessi fuori dai limiti) e performance.

---

## 📝 Sintassi

### Condizionali
```rust
// If-Else standard
if condizione {
    // codice
} else if altra_condizione {
    // codice
} else {
    // codice
}

// If come espressione (Ternary operator replacement)
let var = if condizione { valore_a } else { valore_b };
```

### Cicli
```rust
// Loop infinito (utile per server, demoni, retry)
loop {
    // codice
    if condizione { break; }
}

// While (finché la condizione è vera)
while condizione {
    // codice
}

// For (iterazione su collezioni o range)
for elemento in collezione {
    // codice
}
```

---

## 💻 Esempi Pratici

### Esempio 1: `if` come espressione
Poiché `if` è un'espressione, i blocchi devono restituire lo stesso tipo.

```rust
fn main() {
    let condizione = true;
    // Non c'è bisogno dell'operatore ternario (cond ? a : b)
    let numero = if condizione { 5 } else { 6 };
    println!("Il valore del numero è: {}", numero);
}
```

### Esempio 2: `loop` con valore di ritorno
`loop` è l'unico ciclo che può restituire un valore tramite `break`.

```rust
fn main() {
    let mut contatore = 0;

    let risultato = loop {
        contatore += 1;

        if contatore == 10 {
            break contatore * 2; // Restituisce 20
        }
    };

    println!("Il risultato è {}", risultato);
}
```

### Esempio 3: `for` su Range e Array
Il metodo più idiomatico per iterare.

```rust
fn main() {
    // Range (esclusivo all'estremo destro: 1, 2, 3)
    // .rev() inverte l'ordine
    for numero in (1..4).rev() { 
        println!("{}!", numero);
    }

    // Iterazione su Array
    let a = [10, 20, 30];
    for elemento in a.iter() {
        println!("Valore: {}", elemento);
    }
}
```

---

## ⚙️ Funzionamento Interno

### Expressions vs Statements
*   **Statement:** Istruzione che compie un'azione ma non restituisce un valore (es. `let x = 5;`).
*   **Expression:** Calcola e restituisce un valore (es. `5 + 6`, o un blocco `{ code }` senza punto e virgola finale).
In Rust, omettere il punto e virgola `;` all'ultima riga di un blocco lo rende un valore di ritorno.

### Iteratori
Il ciclo `for` in Rust è "syntactic sugar" per l'uso degli iteratori. Quando scrivi `for x in collezione`, Rust chiama implicitamente `IntoIterator::into_iter` sulla collezione e usa il metodo `next()` finché non restituisce `None`. Questo elimina la necessità di gestire indici manuali, prevenendo errori "off-by-one" e accessi fuori dai limiti (buffer overflow).

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Preferisci `for`:** Usa sempre `for` per iterare su collezioni. Usare `while` con un indice manuale è più lento (il compilatore deve aggiungere controlli sui limiti dell'array a ogni iterazione) e meno sicuro.
- ✅ **Tipi nei bracci `if`:** Assicurati che tutti i rami di un `if` (usato come espressione) restituiscano esattamente lo stesso tipo.
- 💣 **Loop infiniti:** Usa `loop` invece di `while true`. Semanticamente comunica meglio l'intenzione e permette al compilatore di fare analisi del flusso migliori (es. sapere che il codice dopo il loop è irraggiungibile se non c'è break).

---

## 📚 Riferimenti
- [The Rust Programming Language - Control Flow](https://doc.rust-lang.org/book/ch03-05-control-flow.html)