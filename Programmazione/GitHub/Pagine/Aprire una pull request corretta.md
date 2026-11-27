---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - pull-request
  - review
  - procedura
aliases:
  - Aprire una pull request corretta
  - Creare una PR corretta
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Review code su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Conventional commits su GitHub]]"
title: Aprire una pull request corretta
---

# Aprire una pull request corretta

## Obiettivo

Proporre un cambiamento che un'altra persona possa verificare: **quali file cambiano, perché e con quali prove**. L'esempio aggiorna le istruzioni di avvio in `README.md`; non apre una PR direttamente da `main`.

## Procedura

Prerequisiti: clone con working tree pulito, `origin` corretto, branch di destinazione `main` e permesso di pubblicare un branch. Per la CLI serve una sessione GitHub autenticata. Se si contribuisce da un fork, vedere la variante sotto.

**1. Partire dalla base aggiornata.** Recuperare lo stato remoto; il fetch non modifica i file di lavoro.

```bash
git fetch origin
```

Creare il branch a partire da `origin/main`, senza impostare `origin/main` come suo upstream:

```bash
git switch --no-track -c docs/setup origin/main
```

**2. Modificare e controllare.** Dopo aver aggiornato le istruzioni, provarle e mettere nell'indice soltanto il file pertinente:

```bash
git add -- README.md
```

Rileggere ciò che finirà nel commit, evitando file generati o dati locali:

```bash
git diff --cached
```

```bash
git commit -m "Chiarisci i prerequisiti di avvio"
```

**3. Verificare il confronto prima del push.** I tre punti mostrano le modifiche dal comune antenato con la base al proprio `HEAD`. Qui ci si aspetta solo `README.md`; se compaiono altri file, ispezionare la differenza prima di proseguire.

```bash
git diff --name-status origin/main...HEAD
```

**4. Pubblicare il branch e aprire la PR.** Il primo comando scrive il branch su GitHub. Il secondo crea una PR in bozza e chiede titolo e descrizione; `--base` riceve le modifiche, `--head` le propone.

```bash
git push -u origin docs/setup
```

```bash
gh pr create --base main --head docs/setup --draft
```

## Cosa scrivere nella descrizione

| Campo | Esempio per questa modifica |
| --- | --- |
| Cosa e perché | Il README ora indica la versione Node richiesta prima dell'installazione. |
| Verifica | Indicare la versione provata e il comando effettivamente eseguito. Se una prova non è stata fatta, dirlo. |
| Impatto | Solo documentazione: nessuna modifica al runtime. In una PR incompatibile aggiungere istruzioni di migrazione. |
| Issue | Usare `Closes #123` solo se il merge risolve davvero la issue. Nella descrizione la chiusura automatica vale quando la PR punta al branch predefinito. |

## Varianti e verifica finale

- **Fork:** fare push sul proprio fork; in GitHub confrontare il branch del fork con il branch base del progetto originale. Non confondere i due owner anche se entrambi hanno un branch `main`.
- **Prima della review:** rileggere *Files changed*, verificare l'esito dei check sull'ultima revisione e passare da draft a *Ready for review*. Aggiungere i reviewer pertinenti. Altri commit sullo stesso branch aggiornano la stessa PR.
- **Nessuna differenza o check assente:** ricontrollare orientamento base/head, push e trigger del workflow. In caso di conflitto aggiornare il branch con la strategia del team e ripetere le prove.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub|Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]
- [[Programmazione/GitHub/Pagine/Conventional commits su GitHub|Conventional commits su GitHub]]

## Fonti

- [GitHub CLI: gh pr create](https://cli.github.com/manual/gh_pr_create)
- [Git: confronto a tre punti](https://git-scm.com/docs/git-diff)
- [GitHub Docs: collegare e chiudere una issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
