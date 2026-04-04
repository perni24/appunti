---
date: 2026-04-04
tags: [linux, dev-environment, nodejs, python, rust]
type: #permanent-note
status: seedling
---

# Installazione Linguaggi in User-space

Questa nota documenta le modalità di installazione e gestione dei principali linguaggi di programmazione senza l'utilizzo del package manager di sistema (come `apt`, `pacman` o `dnf`). Questo approccio permette di evitare conflitti di versione, non richiede privilegi di root e garantisce un ambiente di sviluppo uniforme tra diverse distribuzioni Linux.

> [!INFO] Definizione
> L'installazione **User-space** avviene interamente all'interno della cartella `$HOME`. I binari e le librerie vengono aggiunti al `PATH` dell'utente tramite i file di configurazione della shell (`.bashrc`, `.zshrc`).

---

## Prerequisiti di Sistema

Prima di procedere con gli installer user-space, è necessario installare i tool di base e le librerie di sviluppo tramite il package manager della propria distribuzione. Questi strumenti sono necessari per scaricare i file e compilare i sorgenti.

### Su Debian / Ubuntu / Mint
```bash
sudo apt update
sudo apt install curl git build-essential libssl-dev zlib1g-dev \
libbz2-dev libreadline-dev libsqlite3-dev tk-dev \
libncursesw5-dev xz-utils libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
```

### Su Arch Linux
```bash
sudo pacman -Syu
sudo pacman -S base-devel openssl zlib bzip2 readline sqlite tk \
ncurses xz git curl
```

---

## 1. Node.js (NVM - Node Version Manager)
... (resto del file) ...
Invece di installare il pacchetto `nodejs` di sistema, si utilizza **NVM** per gestire versioni multiple.

### Installazione
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

### Comandi principali
- `nvm install --lts`: Installa l'ultima versione Long Term Support.
- `nvm use <version>`: Cambia la versione attiva nella sessione corrente.
- `npm install -g <package>`: Installa pacchetti globali senza `sudo` (vengono salvati in `~/.nvm`).

---

## 2. Python (Pyenv & Venv)

Python è spesso una dipendenza critica del sistema operativo. Modificare la versione di sistema può "rompere" la distro. Si consiglia l'uso di **Pyenv** per le versioni e **Venv** per i pacchetti.

### Installazione Pyenv
Il modo più semplice è usare l'installer automatico:
```bash
curl https://pyenv.run | bash
```

### Configurazione della Shell
Aggiungi queste righe alla fine del tuo file di configurazione (`~/.bashrc` o `~/.zshrc`):

```bash
# Pyenv Configuration
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
```
Dopo aver salvato, riavvia la shell o esegui `source ~/.bashrc` (o `source ~/.zshrc`).

### Pyenv (Gestione Versioni)
Installa diverse versioni di Python indipendenti da quella di sistema:
```bash
# Esempio di installazione di una versione specifica
pyenv install 3.12.0
pyenv global 3.12.0
```

### Venv (Ambienti Virtuali)
Per le librerie dei progetti, si creano ambienti isolati:
```bash
python -m venv .venv
source .venv/bin/activate
pip install <library_name>
```

---

## 3. Rust (Rustup)

Rust utilizza un installer ufficiale chiamato **Rustup**, che gestisce il compilatore (`rustc`), il package manager (`cargo`) e le toolchain.

### Installazione
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Gestione Toolchain
- `rustup update`: Aggiorna tutti gli strumenti di sviluppo.
- `rustup toolchain install nightly`: Installa la versione sperimentale.
- `cargo install <crate>`: Installa binari Rust direttamente in `~/.cargo/bin`.

---

## Vantaggi dell'Approccio
1. **Portabilità:** La configurazione della `$HOME` può essere spostata tra diverse distro (es. da Ubuntu a Arch) mantenendo l'ambiente intatto.
2. **Sicurezza:** Non è necessario usare `sudo` per installare librerie di sviluppo, riducendo i rischi di sicurezza.
3. **Flessibilità:** Possibilità di testare applicazioni su versioni diverse dello stesso linguaggio contemporaneamente.