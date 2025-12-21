---
tags:
  - programmazione
  - rust
  - teoria
argomento: Gestione Errori
data: 2025-12-20
stato: 🟢 completato
---

# Gestione degli Errori in Rust

## 💡 Concetto Chiave
Rust **non usa eccezioni** (niente `try-catch`).
Gli errori sono trattati come **valori** di ritorno standard. Si dividono in:
1.  **Recuperabili (`Result<T, E>`)**: Il caso normale (file non trovato, input errato). Si *devono* gestire.
2.  **Irrecuperabili (`panic!`)**: Bug logici o stati corrotti (array index out of bounds). Il programma termina.

---

## 📝 Sintassi

### Tipi Fondamentali
```rust
// Enum Result: Successo (T) o Errore (E)
enum Result<T, E> {
    Ok(T),
    Err(E),
}

// Macro Panic: Interrompe il programma immediatamente
panic!("Messaggio di errore critico");
```

### Operatori
```rust
// Operatore '?' (Propagazione)
// Se è Ok(x), estrae x. Se è Err(e), ritorna subito Err(e) dalla funzione.
let x = funzione_che_puo_fallire()?;

// Unwrap (Pericoloso)
// Se Ok(x) -> x. Se Err -> Panic.
let x = funzione().unwrap();

// Expect (Unwrap con messaggio personalizzato)
let x = funzione().expect("Messaggio se fallisce");
```

---

## 💻 Esempi Pratici

### 1. Gestione esplicita con `match`
Il modo più prolisso ma sicuro.

```rust
use std::fs::File;

fn main() {
    let f_result = File::open("hello.txt");

    let f = match f_result {
        Ok(file) => file,
        Err(error) => panic!("Impossibile aprire il file: {:?}", error),
    };
}
```

### 2. Propagazione dell'errore (Idiomatico)
Invece di gestire l'errore sul posto, lo "passiamo" a chi ci ha chiamato.
Richiede che la funzione restituisca un `Result`.

```rust
use std::fs::File;
use std::io::{self, Read};

// La funzione ritorna una stringa O un errore IO
fn leggi_file() -> Result<String, io::Error> {
    // Il punto interrogativo '?' fa tutto il lavoro sporco
    let mut f = File::open("hello.txt")?; 
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

### 3. Panic (Irrecuperabile)
```rust
fn main() {
    // Questo codice causerà un crash immediato
    panic!("Brucia tutto!"); 
}
```

---

## ⚙️ Funzionamento Interno

### L'operatore `?`
L'operatore `?` non è magico; è zucchero sintattico per un `match` che ritorna anticipatamente (`early return`) in caso di errore.
Inoltre, `?` chiama automaticamente la funzione `from` del trait `From` per convertire tipi di errore diversi. Se la tua funzione ritorna `MyError` ma ricevi un `io::Error`, il compilatore proverà a convertirlo se esiste un'implementazione `impl From<io::Error> for MyError`.

### Unwinding vs Abort
Di default, quando avviene un panic, Rust esegue l'**unwinding** dello stack: risale la catena delle chiamate e libera la memoria (chiama i distruttori `drop`) di tutte le variabili.
Puoi configurare Rust per fare **abort** (terminazione immediata senza pulizia) nel `Cargo.toml` per ridurre la dimensione del binario.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Usa `Result`:** È la norma per il 99% dei casi. Obbliga il chiamante a considerare il fallimento.
- ✅ **Usa `expect` invece di `unwrap`:** Se proprio devi crashare, `expect` ti permette di dire *perché* pensavi che non sarebbe successo (es. `.expect("La configurazione deve esistere")`).
- ✅ **Evita `panic!` in librerie:** Se scrivi una libreria, non usare mai `panic!` o `unwrap`. Restituisci sempre `Result` e lascia decidere all'utente finale.
- 💣 **Main e Result:** La funzione `main` può restituire `Result<(), E>`. Questo permette di usare `?` anche nel main!

---

## 📚 Riferimenti
- [The Rust Programming Language - Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html)