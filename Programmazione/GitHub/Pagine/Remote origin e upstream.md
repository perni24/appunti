---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, git, remote, origin, upstream]
aliases: [origin e upstream, Remote GitHub]
prerequisites: [Git e GitHub]
related: [Clone fork e template repository, Repository GitHub]
---

# Remote origin e upstream

## Sintesi

In Git, un **remote** e un collegamento a un repository esterno. Su GitHub i remote piu comuni sono:

- `origin`: repository remoto principale per la tua copia locale;
- `upstream`: repository originale da cui deriva un fork.

Capire `origin` e `upstream` evita push nel posto sbagliato, pull request verso branch sbagliati e fork non aggiornati.

## Quando usarlo

Serve padroneggiare i remote quando:

- cloni un repository;
- lavori da fork;
- cambi URL remoto da HTTPS a SSH;
- devi sincronizzare un fork;
- devi inviare branch a GitHub;
- una pull request punta al repository sbagliato.

## Come funziona

Git salva i remote nella configurazione del repository. Puoi leggerli con:

```bash
git remote -v
```

Esempio in un fork:

```text
origin    git@github.com:luca/progetto.git (fetch)
origin    git@github.com:luca/progetto.git (push)
upstream  git@github.com:original/progetto.git (fetch)
upstream  git@github.com:original/progetto.git (push)
```

Di solito fai push verso `origin` e fetch/pull da `upstream` per aggiornarti dal progetto originale.

## API / Sintassi

Mostrare remote:

```bash
git remote -v
```

Aggiungere un remote:

```bash
git remote add upstream https://github.com/original/progetto.git
```

Cambiare URL:

```bash
git remote set-url origin git@github.com:luca/progetto.git
```

Rimuovere remote:

```bash
git remote remove upstream
```

Inviare un branch:

```bash
git push -u origin nome-branch
```

## Esempio pratico

Aggiornare un fork:

```bash
git switch main
git fetch upstream
git merge upstream/main
git push origin main
```

Questo porta nel tuo fork le modifiche del repository originale.

## Varianti

- **HTTPS remote**: usa URL `https://github.com/...`.
- **SSH remote**: usa URL `git@github.com:...`.
- **origin unico**: comune nei repository propri.
- **origin + upstream**: comune nei fork.
- **multiple remote**: utile per mirror o migrazioni.

## Errori comuni

- Fare push su `upstream` senza volerlo.
- Non avere `upstream` in un fork.
- Usare `git pull` senza sapere quale remote usa.
- Cambiare URL remoto e rompere autenticazione.
- Confondere branch remoto `origin/main` con branch locale `main`.
- Non usare `-u` al primo push di un branch.

## Checklist

- Hai controllato `git remote -v`?
- `origin` punta al repository corretto?
- In un fork, `upstream` punta al repository originale?
- Stai facendo push verso il remote giusto?
- La branch locale traccia la branch remota corretta?
- L'URL remoto usa il metodo di autenticazione desiderato?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Git e GitHub]]
- [[Clone fork e template repository]]
- [[Repository GitHub]]
