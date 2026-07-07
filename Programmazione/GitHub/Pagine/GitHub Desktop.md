---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, desktop, git, gui]
aliases: [GitHub Desktop]
prerequisites: [GitHub, Git e GitHub]
related: [Branch su GitHub, Pull request]
---

# GitHub Desktop

## Sintesi

**GitHub Desktop** e un'app grafica per usare Git e GitHub senza lavorare sempre da terminale. Permette di clonare repository, creare branch, vedere diff, fare commit, push, pull e aprire pull request.

E utile per imparare il flusso GitHub e per operazioni quotidiane semplici, ma non sostituisce la comprensione di Git.

## Quando usarlo

Usalo quando:

- preferisci una UI visuale per commit e diff;
- vuoi vedere chiaramente file modificati;
- vuoi fare commit piccoli selezionando file o parti;
- sei all'inizio con Git;
- devi gestire workflow semplici;
- vuoi aprire velocemente un repository nell'editor.

## Come funziona

GitHub Desktop si collega al tuo account GitHub e ai repository locali. Mostra:

- repository corrente;
- branch attivo;
- file modificati;
- diff;
- messaggio di commit;
- stato di fetch, pull e push;
- opzione per aprire pull request su GitHub.

Le operazioni sono le stesse di Git, ma presentate tramite interfaccia grafica.

## API / Sintassi

Concetti equivalenti tra GitHub Desktop e Git:

```text
Fetch origin  -> git fetch origin
Pull origin   -> git pull
Push origin   -> git push
New branch    -> git switch -c nome-branch
Commit        -> git commit
```

GitHub Desktop non elimina la necessita di capire branch, remote, commit e conflitti.

## Esempio pratico

Flusso tipico:

1. apri il repository in GitHub Desktop;
2. crea un branch `fix/test-login`;
3. modifica i file nell'editor;
4. controlla il diff;
5. scrivi un messaggio di commit chiaro;
6. fai commit;
7. fai push;
8. apri la pull request da GitHub.

## Varianti

- **Uso didattico**: ideale per vedere diff e branch.
- **Uso quotidiano semplice**: commit, pull, push e PR.
- **Uso insieme al terminale**: UI per diff, terminale per comandi avanzati.
- **Uso con editor**: apertura rapida in VS Code o editor configurato.

## Errori comuni

- Cliccare `Pull` o `Push` senza capire branch e remote.
- Fare commit troppo grandi perche la UI rende facile selezionare tutto.
- Non leggere il diff prima del commit.
- Risolvere conflitti senza capire il contenuto.
- Pensare che GitHub Desktop renda Git superfluo.

## Checklist

- Il repository selezionato e quello giusto?
- Il branch attivo e corretto?
- Hai letto il diff?
- Il messaggio di commit e descrittivo?
- Hai fatto push del branch?
- La pull request e stata aperta e controllata?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub]]
- [[Git e GitHub]]
- [[Branch su GitHub]]
- [[Pull request]]

## Fonti

- [GitHub Docs - GitHub Desktop](https://docs.github.com/en/desktop)
