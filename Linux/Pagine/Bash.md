---
date: 2026-07-13
area: Linux
topic: Shell Bash
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [linux, bash, shell, terminale]
aliases: [GNU Bash, Bourne Again Shell]
prerequisites: [Terminale e comandi fondamentali, Variabili ambiente e PATH]
related: [Pipe e ridirezioni, Espansioni della shell, Variabili e quoting, Job control, Bash scripting]
---

# Bash

## Sintesi

Bash, acronimo di **Bourne-Again Shell**, è una shell e un linguaggio di comando. Legge input interattivo o script, interpreta sintassi, espansioni e ridirezioni, quindi esegue builtin, funzioni o programmi esterni.

La shell non coincide con il terminale: il terminale gestisce l'interfaccia testuale, mentre Bash interpreta i comandi. Bash implementa molte funzionalità POSIX `sh`, ma aggiunge estensioni che non sono necessariamente portabili verso altre shell.

## Quando usarlo

- Lavorare interattivamente nel terminale.
- Combinare programmi tramite pipe e ridirezioni.
- Automatizzare procedure di sistema con script.
- Gestire variabili, processi e job della sessione.
- Diagnosticare come un comando viene risolto ed eseguito.

## Come funziona

Per una riga di comando, Bash esegue in forma semplificata queste fasi:

1. Legge e divide l'input in parole e operatori.
2. Riconosce alias, parole riservate e strutture sintattiche.
3. Esegue le espansioni previste.
4. Applica le ridirezioni.
5. Risolve il comando come funzione, builtin o eseguibile nel `PATH`.
6. Attende il risultato, salvo esecuzione asincrona, e imposta lo stato di uscita.

I builtin come `cd`, `export` e `jobs` sono eseguiti dalla shell stessa perché devono modificarne lo stato. Un programma esterno viene invece caricato come processo separato.

Bash può essere:

- **interattiva**, quando mostra un prompt e accetta comandi dall'utente;
- **non interattiva**, quando esegue uno script o input reindirizzato;
- **login shell**, quando rappresenta l'inizio di una sessione di login;
- **non-login shell**, tipica dei terminali aperti dentro una sessione grafica.

I file di avvio letti cambiano in base alla modalità. In genere una login shell usa `/etc/profile` e uno tra `~/.bash_profile`, `~/.bash_login` o `~/.profile`; una shell interattiva non-login usa `/etc/bash.bashrc` o equivalente della distribuzione e `~/.bashrc`.

## API / Sintassi

Mostrare la versione corrente:

```bash
bash --version
```

Verificare se la shell corrente è Bash:

```bash
printf '%s\n' "$BASH_VERSION"
```

Mostrare la shell di login configurata per l'utente:

```bash
getent passwd "$USER"
```

Determinare come Bash risolve un nome:

```bash
type -a printf
```

Mostrare il percorso di un comando esterno:

```bash
command -v grep
```

Avviare una shell pulita senza file di configurazione personali:

```bash
bash --noprofile --norc
```

Controllare la sintassi di uno script senza eseguirlo:

```bash
bash -n script.sh
```

Eseguire uno script esplicitamente con Bash:

```bash
bash script.sh
```

## Esempio pratico

Uno script Bash minimo può iniziare con:

```bash
#!/usr/bin/env bash
```

Il corpo può verificare un argomento e terminare con uno stato significativo:

```bash
[[ -n ${1:-} ]] || exit 2
```

Per renderlo direttamente eseguibile:

```bash
chmod u+x script.sh
```

Per avviarlo dalla directory corrente:

```bash
./script.sh valore
```

La shebang viene usata dal kernel quando il file è eseguito direttamente. Se si avvia `sh script.sh`, la shebang non impone Bash: è `sh` a interpretare il file, quindi le estensioni Bash possono fallire.

## Varianti

- `sh` indica un'interfaccia POSIX e può essere collegata a Bash, Dash o un'altra shell.
- Zsh e Fish privilegiano funzionalità interattive diverse e non sono compatibili con tutta la sintassi Bash.
- `bash --posix` modifica alcuni comportamenti per avvicinarli allo standard POSIX.
- Una subshell, scritta `( comandi )`, isola modifiche a directory e variabili dal processo chiamante.
- Un gruppo `{ comandi; }` viene normalmente eseguito nella shell corrente.

## Errori comuni

- Confondere emulatore di terminale e shell.
- Supporre che uno script Bash funzioni con qualsiasi `/bin/sh`.
- Mettere configurazioni necessarie agli script solo in `~/.bashrc`, che una shell non interattiva normalmente non legge.
- Usare `which` per dedurre sempre cosa verrà eseguito: `type` e `command -v` comprendono anche builtin, funzioni e alias.
- Eseguire uno script con `source` senza considerare che modifica la shell corrente.
- Ignorare lo stato di uscita dei comandi.
- Usare alias in script non interattivi, dove normalmente non vengono espansi.

## Checklist

- Lo script richiede Bash o deve essere portabile POSIX `sh`?
- La shebang corrisponde al linguaggio realmente usato?
- Funzioni, builtin e comandi esterni vengono distinti correttamente?
- Le configurazioni sono nel file di avvio adatto alla modalità della shell?
- Lo script supera `bash -n`?
- Gli stati di uscita significativi vengono controllati?
- Variabili ed espansioni sono quotate correttamente?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Terminale e comandi fondamentali|Terminale e comandi fondamentali]]
- [[Linux/Pagine/Variabili ambiente e PATH|Variabili d'ambiente e PATH]]
- [[Linux/Pagine/Pipe e ridirezioni|Pipe e ridirezioni]]
- [[Linux/Pagine/Espansioni della shell|Espansioni della shell]]
- [[Linux/Pagine/Variabili e quoting|Variabili e quoting]]
- [[Linux/Pagine/Job control|Job control]]
- [[Linux/Pagine/Bash scripting|Bash scripting]]

## Fonti

- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html)
- [GNU Bash - Basic Shell Features](https://www.gnu.org/software/bash/manual/html_node/Basic-Shell-Features.html)
- [GNU Bash - Shell Builtin Commands](https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html)
