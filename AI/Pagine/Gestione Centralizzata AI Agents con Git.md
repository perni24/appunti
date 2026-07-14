# 🚀 Setup: Gestione Centralizzata AI Agents con Git

Questa procedura ti permette di avere un unico "cervello" su GitHub e di distribuirlo su tutti i tuoi repository (Obsidian, Coding, ecc.), mantenendoli sincronizzati.

## 1. Preparazione del Repository Centrale (Master)

- **Crea un nuovo repo su GitHub** chiamato `ai-agents-hub` (o simile).
    
- **Carica i tuoi file di configurazione**:
    
    - `Obsidian-Agent.md` (le regole per il Vault).
        
    - `Coder-Agent.md` (le regole per la programmazione).
        
    - `General-Agent.md` (regole base).
        
- **Copia l'URL del repo** (es: `https://github.com/tuo-user/ai-agents-hub.git`).
    

---

## 2. Collegamento al Repository Appunti (Vault Obsidian)

Apri il terminale all'interno della cartella dei tuoi appunti ed esegui questi passaggi:

### A. Aggiungi il Sottomodulo

Questo comando crea una cartella che "punta" al tuo repo centrale.

Bash

```
git submodule add https://github.com/tuo-user/ai-agents-hub.git .ai-rules
```

### B. Crea il Collegamento Simbolico (Simlink)

Dato che abbiamo istruito Gemini a cercare `Agents.md`, creiamo un link che punti al file specifico per Obsidian dentro la cartella del sottomodulo.

Bash

```
# Per Linux / macOS
ln -s .ai-rules/Obsidian-Agent.md Agents.md

# Per Windows (PowerShell come Amministratore)
New-Item -ItemType SymbolLink -Path "Agents.md" -Target ".ai-rules/Obsidian-Agent.md"
```

---

## 3. Gestione degli Aggiornamenti

### Scaricare aggiornamenti (da GitHub al PC)

Se modifichi l'agente dal browser o da un altro PC, per aggiornare il repository locale usa:

Bash

```
git submodule update --remote --merge
```

### Inviare aggiornamenti (se Gemini modifica il file)

Se l'AI ottimizza `Agents.md`, la modifica avviene nel file dentro `.ai-rules`. Per salvarla:

Bash

```
cd .ai-rules
git add .
git commit -m "Gemini: auto-optimization of Obsidian agent"
git push
cd ..
```

---

## 4. Automazione (Script di Sincronizzazione)

Per non dover ricordare i comandi, puoi creare un alias nel tuo file `.zshrc` o `.bashrc`:

Bash

```
# Aggiorna tutti gli agenti in un colpo solo
alias update-agents="git submodule update --remote --merge"
```

---

## 5. Riepilogo Struttura File Finale

Ecco come apparirà il tuo repository degli appunti:

Plaintext

```
📂 Il-Tuo-Vault/
├── 📂 .ai-rules/             <-- (Sottomodulo Git con tutti i tuoi .md)
│   ├── Obsidian-Agent.md
│   └── Coder-Agent.md
├── 📄 Agents.md              <-- (Simlink che punta a .ai-rules/Obsidian-Agent.md)
├── 📄 Nota1.md
└── 📄 Nota2.md
```