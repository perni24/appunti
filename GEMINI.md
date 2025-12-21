# GEMINI.md - Contesto e Istruzioni Operative

Questo file definisce il contesto, le convenzioni e le istruzioni operative per l'assistente AI (Gemini) che opera su questo repository (`D:\appunti`).

## 1. Scopo del Progetto
Questo repository funge da **Personal Knowledge Base (Second Brain)** per l'utente. Contiene appunti tecnici strutturati su programmazione, trading, software open source e stampa 3D.
L'obiettivo è avere una fonte di verità centralizzata, modulare e facilmente consultabile, che favorisca il confronto tra diverse tecnologie (es. Rust vs Python).

## 2. Struttura del File System
L'organizzazione delle cartelle è gerarchica e standardizzata.

### Programmazione
```text
Programmazione/
├── Linguaggio/
│   ├── Indice [linguaggio].md  <- MOC (Map of Content) principale
│   └── Pagine/                 <- Contiene i singoli file di teoria
│       ├── Argomento.md
│       └── ...
```

### Programmi Open Source
L'organizzazione segue il modello **Hub & Spoke**:
1.  **Pagina Hub (Main):** Il file principale (es. `FreeCAD.md`) funge da anteprima, scheda tecnica rapida e indice delle funzionalità.
2.  **Pagine di Dettaglio:** Se un software richiede guide estese, queste vanno create in una sottocartella dedicata (es. `FreeCAD/Modellazione.md`).

---

## 3. Standard di Scrittura (Template)
- **Teoria Programmazione:** Ogni nuovo appunto tecnico ("Teoria") **DEVE** seguire il template in `D:\appunti\Programmazione\template.md`.
- **Programmi Open Source:** Le pagine principali (Hub) devono seguire il template in `D:\appunti\Programmi open source\_Template Software Main.md`.

---

## 4. Istruzioni per l'Assistente (Workflow)

### Quando si crea una nuova pagina di Teoria:
1.  Verificare se esiste il file `template.md`.
2.  Generare il contenuto seguendo le sezioni del template.
3.  Adattare il livello tecnico al linguaggio specifico (vedi sez. 5).
4.  **Azione Automatica:** Aggiornare sempre il file `Indice [linguaggio].md` corrispondente.

### Quando si gestisce un Software Open Source:
1.  **Pagina Hub:** Creare la pagina principale con la "Scheda Rapida" e la "Mappa delle Funzionalità".
2.  **Gerarchia:** Se si aggiungono guide specifiche, utilizzare i link verso sottocartelle (es. `[[Software/Guida]]`) per mantenere pulita la cartella radice.
3.  **Indici:** Aggiornare sempre `D:\appunti\Programmi open source\Indice Programmi Open Source.md`.

### Gestione dei Link:
- Usare percorsi relativi o WikiLinks compatibili con Obsidian: `[[Pagine/Nome File|Titolo Visualizzato]]`.
- Favorire il cross-linking tra linguaggi nella sezione "Riferimenti" se pertinente.

---

## 5. Specifiche di Dominio

### Rust
- **Focus:** Memory safety, Ownership, Borrowing, Lifetimes, Type Safety esplicita.
- **Toolchain:** Cargo, Clippy, Rustfmt.
- **Gotchas:** `panic!` vs `Result`, `unwrap()`, Move semantics.

### Python
- **Focus:** Leggibilità, "Pythonic way" (List comprehensions), Virtual Environments.
- **Teoria:** Reference counting, GIL, Dynamic typing, Mutability.

### JavaScript / Node.js
- **Focus:** Asincronia (Promise, Async/Await), ES6+ features, Event Loop.

### Programmi Open Source
- **Focus:** Installazione (Winget/Docker), Configurazione critica, Risoluzione problemi (Troubleshooting).
- **Strategia:** Fornire un'anteprima immediata del software e smistare il traffico verso guide approfondite solo se necessario.

### Trading (Backtrader/Teoria)
- Mantenere la distinzione tra **Teoria** (indicatori matematici, psicologia) e **Implementazione** (codice Backtrader).