---
date: 2026-07-11
area: Linux
topic: Ambiente di sviluppo
type: operational-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, user-space, nvm, pyenv, rustup, toolchain]
aliases: [Installazione linguaggi in user-space, Toolchain per utente]
prerequisites: [Shell Linux, PATH, package manager]
related: [Gestione pacchetti universali, Indice Linux]
---

# Installazione linguaggi in user-space

## Obiettivo

Installare e gestire versioni di Node.js, Python e Rust nella home dell'utente senza sostituire interpreti o compilatori richiesti dal sistema operativo.

NVM, pyenv e rustup modificano il `PATH` della shell. Prima di installarli controlla sempre il repository ufficiale: i comandi che scaricano ed eseguono script remoti sono potenti e la versione indicata nella nota può diventare obsoleta.

## Quando usarlo

- Sviluppo con più versioni dello stesso linguaggio.
- Progetti che richiedono toolchain differenti.
- Macchina sulla quale non vuoi modificare Python o Node.js di sistema.
- Ambiente personale senza installazioni globali tramite `sudo`.

Non è necessariamente la scelta giusta per server minimali, immagini container o build riproducibili: in quei casi possono essere migliori pacchetti fissati, container o immagini CI versionate.

## Procedura

### 1. Preparare i prerequisiti

Installa strumenti di base tramite il package manager della distribuzione:

Su Debian e derivate aggiorna prima l'indice dei pacchetti:

```bash
sudo apt update
```

Installa quindi gli strumenti di base:

```bash
sudo apt install curl git build-essential ca-certificates
```

Su Arch Linux aggiorna il sistema:

```bash
sudo pacman -Syu
```

Installa gli strumenti di compilazione e download:

```bash
sudo pacman -S --needed curl git base-devel
```

Pyenv compila normalmente CPython dai sorgenti e richiede ulteriori librerie di sviluppo. Consulta la sezione ufficiale sulle build dependencies per la distribuzione e la versione Python scelte.

### 2. Installare NVM e Node.js

Al momento della revisione il repository ufficiale mostra NVM `v0.40.4`. Verifica la versione corrente prima di eseguire il comando:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
```

Apri una nuova shell oppure carica il profilo corretto, poi verifica:

Verifica che NVM sia caricato nella shell:

```bash
command -v nvm
```

Controlla la versione installata:

```bash
nvm --version
```

Installa l'ultima versione LTS di Node.js:

```bash
nvm install --lts
```

Imposta la linea LTS come predefinita per le nuove shell:

```bash
nvm alias default 'lts/*'
```

Verifica Node.js:

```bash
node --version
```

Verifica npm:

```bash
npm --version
```

NVM è una funzione caricata dalla shell, quindi `which nvm` può non produrre il risultato atteso; usa `command -v nvm`.

Per fissare la versione di un progetto:

Scrivi la versione richiesta dal progetto:

```bash
echo 'lts/*' > .nvmrc
```

Installa la versione indicata dal file:

```bash
nvm install
```

Attivala nella shell corrente:

```bash
nvm use
```

### 3. Installare pyenv

Installer ufficiale consigliato dal progetto:

```bash
curl -fsSL https://pyenv.run | bash
```

Per Bash aggiungi innanzitutto la directory principale di pyenv a `~/.bashrc`:

```bash
export PYENV_ROOT="$HOME/.pyenv"
```

Aggiungi i binari di pyenv al `PATH` quando la directory esiste:

```bash
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
```

Inizializza pyenv nella shell Bash:

```bash
eval "$(pyenv init - bash)"
```

Per Zsh usa `~/.zshrc` e `eval "$(pyenv init - zsh)"`. Riavvia la shell e verifica:

Verifica l'installazione:

```bash
pyenv --version
```

Elenca le versioni disponibili:

```bash
pyenv install -l
```

Installa l'ultima release conosciuta della serie 3.13:

```bash
pyenv install 3.13
```

Imposta la serie installata come versione globale dell'utente:

```bash
pyenv global 3.13
```

Controlla l'interprete risolto dalla shell:

```bash
python --version
```

Un prefisso come `3.13` viene risolto da pyenv verso l'ultima release conosciuta di quella serie.

### 4. Creare un ambiente virtuale Python

Pyenv sceglie l'interprete; `venv` isola i pacchetti del progetto:

Crea la directory del progetto:

```bash
mkdir progetto-python
```

Entra nella directory:

```bash
cd progetto-python
```

Fissa la versione Python locale:

```bash
pyenv local 3.13
```

Crea l'ambiente virtuale:

```bash
python -m venv .venv
```

Attiva l'ambiente nella shell corrente:

```bash
source .venv/bin/activate
```

Aggiorna `pip` dentro l'ambiente:

```bash
python -m pip install --upgrade pip
```

Verifica quale interprete stai usando:

```bash
python -c 'import sys; print(sys.executable)'
```

Per uscire dall'ambiente:

```bash
deactivate
```

### 5. Installare rustup e Rust

Usa l'installer pubblicato dal progetto Rust:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Apri una nuova shell oppure carica l'ambiente:

Carica le variabili installate da rustup nella shell corrente:

```bash
source "$HOME/.cargo/env"
```

Mostra toolchain e target attivi:

```bash
rustup show
```

Verifica il compilatore:

```bash
rustc --version
```

Verifica Cargo:

```bash
cargo --version
```

Gestione delle toolchain:

Aggiorna le toolchain installate:

```bash
rustup update
```

Installa la toolchain nightly quando necessaria:

```bash
rustup toolchain install nightly
```

Imposta un override stabile nella directory corrente:

```bash
rustup override set stable
```

Rimuovi l'override locale:

```bash
rustup override unset
```

Usa `cargo install` per programmi CLI Rust, non per aggiungere dipendenze a un progetto:

```bash
cargo install nome-crate
```

## Snippet

File di versione per progetto:

```text
# .nvmrc
lts/*
```

```text
# .python-version
3.13
```

```toml
# rust-toolchain.toml
[toolchain]
channel = "stable"
components = ["clippy", "rustfmt"]
```

Controllo rapido del `PATH`:

Mostra tutte le risoluzioni disponibili per i principali eseguibili:

```bash
type -a node python rustc cargo
```

Visualizza ogni directory del `PATH` su una riga separata:

```bash
printf '%s\n' "$PATH" | tr ':' '\n'
```

## Adattamenti comuni

- **Fish shell**: NVM ufficiale è progettato per shell POSIX; valuta un'integrazione compatibile o una shell supportata.
- **WSL**: installa i tool dentro la distribuzione Linux, non condividere toolchain Windows tramite il `PATH`.
- **CI**: preferisci action o immagini ufficiali con versioni fissate invece di installer interattivi.
- **Container**: usa immagini base versionate quando vuoi build riproducibili e leggere.
- **Più progetti Python**: usa `pyenv local` e un `.venv` distinto per ogni repository.
- **Tool CLI Python**: `pipx` o `uv tool` sono spesso più adatti di installazioni globali con `pip`.

## Debug rapido

- **`nvm: command not found`**: controlla quale file di profilo è stato modificato e apri una nuova shell.
- **NVM installa la versione sbagliata**: verifica `.nvmrc`, alias `default` e output di `nvm current`.
- **`pyenv: command not found`**: controlla `PYENV_ROOT`, `PATH` e inizializzazione della shell.
- **Compilazione Python fallita**: installa le build dependencies mancanti e leggi l'ultima parte del log.
- **`python` punta ancora al sistema**: esegui `pyenv rehash`, controlla `pyenv version` e l'ordine del `PATH`.
- **`rustc: command not found`**: esegui `source "$HOME/.cargo/env"` o riapri la shell.
- **Conflitti con installazioni di sistema**: usa `type -a` per capire quale eseguibile viene risolto per primo.

## Checklist finale

- Installer e versione verificati nel repository ufficiale.
- Script remoto letto o considerato attendibile prima dell'esecuzione.
- File di configurazione della shell corretto.
- Nessun `sudo npm install -g` o `sudo pip install` nell'ambiente personale.
- Versione del progetto fissata in un file tracciabile.
- Python di sistema non sostituito.
- Ambiente virtuale Python separato per progetto.
- `node`, `python`, `rustc` e `cargo` risolti dal percorso atteso.

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Repository e package manager|Repository e package manager]]
- [[Linux/Pagine/Dipendenze e librerie condivise|Dipendenze e librerie condivise]]
- [[Linux/Pagine/Compilazione da sorgente|Compilazione da sorgente]]
- [[Linux/Pagine/Gestione pacchetti universali|Gestione pacchetti universali]]

## Fonti

- [nvm - repository ufficiale](https://github.com/nvm-sh/nvm)
- [pyenv - repository ufficiale](https://github.com/pyenv/pyenv)
- [pyenv-installer](https://github.com/pyenv/pyenv-installer)
- [rustup](https://rustup.rs/)
- [Python - venv](https://docs.python.org/3/library/venv.html)
