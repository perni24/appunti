# Gestione degli Errori in Rust

Rust non ha eccezioni come altri linguaggi (es. `try...catch`). Invece, classifica gli errori in due categorie principali e fornisce meccanismi diversi per gestirli.

## Errori Recuperabili e Irrecuperabili

La gestione degli errori in Rust si basa su una distinzione fondamentale:

1.  **Errori Recuperabili**: Sono errori che ci si aspetta possano accadere in determinate circostanze, come un file non trovato o un input non valido. Rust incoraggia a gestirli esplicitamente. Per questo tipo di errori si usa l'enum `Result<T, E>`.

2.  **Errori Irrecuperabili (o Bug)**: Sono errori che indicano un problema nel programma stesso, una situazione che non dovrebbe mai verificarsi. Ad esempio, tentare di accedere a un indice di un array fuori dai limiti. In questi casi, Rust usa la macro `panic!`, che interrompe l'esecuzione del programma.

## L'enum `Result<T, E>`

L'enum `Result` è il modo principale per gestire errori recuperabili. La sua definizione è:

```rust
enum Result<T, E> {
    Ok(T),  // Contiene il valore in caso di successo
    Err(E), // Contiene l'errore in caso di fallimento
}
```
- `T` è il tipo del valore che verrà restituito in caso di successo.
- `E` è il tipo dell'errore che verrà restituito in caso di fallimento.

Una funzione che potrebbe fallire restituisce un `Result`. Il codice che la chiama **deve** gestire entrambi i casi (`Ok` e `Err`), altrimenti il compilatore darà un avviso.

### Esempio con `match`

Ecco come si può gestire un `Result` restituito dalla funzione `File::open`, che tenta di aprire un file.

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file, // Se il file è stato aperto, `f` diventa il file handle
        Err(error) => {
            // Se c'è stato un errore, lo gestiamo qui
            panic!("Problema nell'aprire il file: {:?}", error);
        },
    };
}
```
Questo `match` assicura che entrambi i possibili risultati siano gestiti.

### Scorciatoie per `panic!`: `unwrap` ed `expect`

A volte, si vuole che il programma vada in `panic` se un'operazione fallisce. `Result` ha dei metodi di convenienza per questo:

-   **`unwrap()`**: Restituisce il valore dentro `Ok`. Se il `Result` è `Err`, va in `panic`.
-   **`expect(msg)`**: Simile a `unwrap`, ma permette di specificare un messaggio di errore personalizzato per il `panic`.

```rust
// Se "hello.txt" non esiste, questo codice andrà in panic
let f = File::open("hello.txt").unwrap();

// Questo andrà in panic con un messaggio più chiaro
let f = File::open("hello.txt").expect("Impossibile aprire hello.txt");
```
**Attenzione:** `unwrap` ed `expect` sono utili per prototipi o test, ma in codice di produzione è quasi sempre meglio usare `match` o l'operatore `?` per gestire l'errore in modo più robusto.

## Propagare gli Errori con l'Operatore `?`

Quando si scrive una funzione che a sua volta chiama altre operazioni che possono fallire, spesso si vuole "propagare" l'errore verso l'alto. Scrivere `match` ogni volta può essere verboso.

Ecco come si farebbe manualmente:
```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn leggi_username_da_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e), // Ritorna l'errore se l'apertura fallisce
    };

    let mut s = String::new();

    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s), // Ritorna la stringa se la lettura ha successo
        Err(e) => Err(e), // Ritorna l'errore se la lettura fallisce
    }
}
```

Rust fornisce l'**operatore `?`** per semplificare drasticamente la propagazione degli errori. L'espressione `un_risultato?` equivale a:
```rust
match un_risultato {
    Ok(valore) => valore,
    Err(e) => return Err(e.into()),
}
```
Usando `?`, la funzione precedente diventa molto più pulita e leggibile:
```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn leggi_username_con_interrogativo() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?; // Se Err, ritorna Err dall'intera funzione
    let mut s = String::new();
    f.read_to_string(&mut s)?; // Se Err, ritorna Err dall'intera funzione
    Ok(s) // Se tutto va bene, ritorna Ok(s)
}
```
Si può anche concatenare le chiamate:
```rust
use std::io;
use std::fs::File;

fn leggi_username_ancora_piu_corto() -> Result<String, io::Error> {
    let mut s = String::new();
    File::open("hello.txt")?.read_to_string(&mut s)?;
    Ok(s)
}
```
**Nota:** L'operatore `?` può essere usato solo in funzioni che restituiscono un tipo `Result`, `Option` o un altro tipo che implementa il trait `Try`.

## Quando Usare `panic!` e Quando `Result`

-   **Usa `Result`** quando un errore è previsto e recuperabile. È parte dell'API pubblica della funzione e obbliga chi la chiama a gestire la possibilità di un fallimento. Questa è la scelta di default nella maggior parte dei casi.

-   **Usa `panic!`** (o `unwrap`/`expect`) in queste situazioni:
    1.  **Esempi, Prototipi e Test**: Quando vuoi scrivere codice semplice per dimostrare un concetto o in un test dove un fallimento deve interrompere tutto.
    2.  **Stati Irrecuperabili**: Quando il tuo codice raggiunge uno stato che logicamente non dovrebbe mai essere possibile, indicando un bug. Ad esempio, se un'invariante del tuo tipo viene violata. "Fail fast" (fallire subito) è spesso la scelta giusta.
    3.  **Quando sei sicuro che non fallirà**: Se chiami una funzione che restituisce un `Result` ma hai garanzie esterne che non sarà mai un `Err` (ad esempio, parsing di una stringa che sai essere valida), potresti scegliere di usare `unwrap`. È una scelta rischiosa che andrebbe giustificata con un commento.
