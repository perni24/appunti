---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - git
  - branch
  - workflow
aliases:
  - Branch GitHub
  - Branch su GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Git e GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub]]"
title: Branch su GitHub
---

# Branch su GitHub

## Sintesi

Un branch è un nome che punta a un commit. Quando lavori su quel branch e fai un nuovo commit, avanza il suo riferimento; gli altri branch non si muovono. È utile per sviluppare una feature, correggere un bug, preparare una release o sperimentare senza cambiare il branch principale. Non impedisce i conflitti: separa le storie finché non decidi di integrarle.

## Esempio: partire dalla base giusta

Vuoi correggere l’export CSV quando il report è vuoto. Nell’esempio `origin` è il repository in cui puoi pubblicare e `main` è la destinazione della PR. Se lavori da un fork, controlla quale remoto corrisponde alla **base** desiderata.

1. Nel clone, controlla la directory di lavoro. Se contiene modifiche, decidi prima dove salvarle: cambiare branch non le isola automaticamente.

```bash
git status --short
```

2. Aggiorna i riferimenti remoti senza integrare nulla nel branch corrente:

```bash
git fetch origin
```

3. Crea il branch direttamente dall’ultimo `origin/main` scaricato. `--no-track` evita di impostare `origin/main` come upstream del branch di lavoro. Il tuo `main` locale non viene spostato.

```bash
git switch --no-track -c fix/export-vuoto origin/main
```

4. Dopo aver registrato la correzione e il test, pubblica il branch sul remoto e imposta il tracciamento verso il branch **omonimo**:

```bash
git push -u origin fix/export-vuoto
```

Ora il branch esiste anche sul server. Il push non apre una pull request e non modifica `main`. Per le volte successive verifica il tracciamento con `git branch -vv`.

## Nomi e protezioni

`feature/`, `fix/`, `release/` e `hotfix/` sono convenzioni del team, non tipi speciali di branch. Anche `main` è solo un nome: la protezione da push o merge non controllati dipende dalle regole attive su GitHub. Preferisci un nome che descriva la modifica a uno come `test`.

## Pulizia dopo il merge

Sono due operazioni distinte, **non una sequenza da eseguire sempre**. Prima controlla su GitHub che la PR sia stata integrata nella base prevista e che nessun altro usi il branch.

- **Locale:** passa a un altro branch. Il comando seguente cerca di eliminare solo il riferimento locale. Il controllo di `-d` riguarda l’upstream del branch, se configurato, altrimenti `HEAD`: non è una prova che la PR sia stata integrata in `main`.

```bash
git branch -d fix/export-vuoto
```

- **Remoto:** se il branch è ancora sul server e vuoi eliminarlo anche per i collaboratori:

```bash
git push origin --delete fix/export-vuoto
```

Squash e rebase possono integrare il contenuto senza conservare i commit originali come antenati di `main`. Non passare automaticamente a una cancellazione forzata se il controllo locale rifiuta l’operazione.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub|Merge squash e rebase su GitHub]]

## Fonti

- [GitHub Docs - About branches](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-branches)
- [Git: creazione, tracciamento ed eliminazione dei branch](https://git-scm.com/docs/git-branch)
