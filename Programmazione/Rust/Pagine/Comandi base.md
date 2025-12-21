---
tags:
  - programmazione
  - rust
  - strumenti
argomento: Comandi Base (Cargo)
data: 2025-12-20
stato: 🟢 completato
---

# Comandi Base e Toolchain (Cargo)

## 💡 Concetto Chiave
L'ecosistema Rust ruota attorno a **Cargo**, che non è solo un package manager, ma un sistema di build completo. Gestisce dipendenze, compilazione, testing, documentazione e rilascio. A differenza di C++ (Make/CMake) o Python (pip/poetry/venv), Cargo è lo standard unico e ufficiale.

---

## 📝 Sintassi
I comandi si eseguono da terminale nella root del progetto.

```bash
cargo <comando> [opzioni]
```

### Comandi Principali
*   `new`: Crea un nuovo progetto.
*   `build`: Compila il progetto.
*   `run`: Compila ed esegue.
*   `check`: Verifica errori senza generare l'eseguibile (veloce).
*   `test`: Esegue la suite di test.
*   `fmt`: Formatta il codice.
*   `clippy`: Linter avanzato per suggerimenti di qualità.

---

## 💻 Esempi Pratici

### 1. Inizializzazione Progetto
```bash
# Crea un eseguibile (default)
cargo new mio_progetto

# Crea una libreria
cargo new mia_libreria --lib
```
Genera un `Cargo.toml` e una cartella `src`.

### 2. Ciclo di Sviluppo (Dev Loop)
Durante la scrittura del codice, usa `check` frequentemente.
```bash
# Veloce controllo di sintassi/tipi
cargo check

# Quando vuoi provare il programma
cargo run
```

### 3. Aggiungere Dipendenze
Non serve modificare `Cargo.toml` a mano.
```bash
# Scarica e aggiunge "serde" al progetto
cargo add serde
```

### 4. Build per Produzione
```bash
# Ottimizzazioni attive, debug info rimossi
cargo build --release
```
L'eseguibile sarà in `target/release/` invece che `target/debug/`.

### 5. Cross-Compilazione
Esempio per Windows da Linux:
```bash
rustup target add x86_64-pc-windows-gnu
cargo build --release --target x86_64-pc-windows-gnu
```

---

## ⚙️ Funzionamento Interno

### Cargo.toml vs Cargo.lock
*   **Cargo.toml:** Il file "manifesto". Qui dichiari le dipendenze e le loro versioni *compatibili* (es. `serde = "1.0"`). È modificabile dall'uomo.
*   **Cargo.lock:** Generato automaticamente. Fissa le versioni *esatte* di tutte le dipendenze (e le loro sotto-dipendenze) usate nell'ultima build funzionante. Garantisce la riproducibilità. **Non modificarlo mai a mano.**

### La cartella `target/`
Tutti gli artefatti di compilazione finiscono qui. Può diventare molto grande (GB).
*   **Debug:** Compilazione incrementale, veloce, zero ottimizzazioni.
*   **Release:** Compilazione lenta, LLVM optimization pass attivi.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Usa `cargo check`:** È molto più veloce di `build`. Usalo mentre scrivi codice per avere feedback rapido.
- ✅ **Usa `clippy`:** `cargo clippy` ti insegna a scrivere codice "Idiomatic Rust". Ascolta i suoi consigli.
- ✅ **Gitignore:** Assicurati che la cartella `/target` sia nel `.gitignore`.
- 💣 **Librerie vs Binari:** Se crei una libreria, committa il `Cargo.lock` solo se vuoi garantire versioni precise (raro per le lib, comune per le app).

---

## 📚 Riferimenti
- [The Cargo Book](https://doc.rust-lang.org/cargo/)
- [Crates.io](https://crates.io/)
