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
  - merge
  - squash
  - rebase
aliases:
  - Merge squash e rebase
  - Strategie di merge GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
related:
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
title: Merge squash e rebase su GitHub
---

# Merge squash e rebase su GitHub

## Sintesi

Due integrazioni possono produrre **gli stessi file finali** ma storie diverse. Chiediti che cosa deve poter ricostruire chi leggerà `main`: i commit originali con la loro parentela, un solo cambiamento per PR o una sequenza lineare di passi distinti.

| Metodo su GitHub | Cosa entra nel branch base | Quando è utile |
| --- | --- | --- |
| Create a merge commit | I commit originali diventano antenati della base tramite un nuovo commit di merge. | Vuoi conservare identità, ordine e punto di unione della PR. |
| Squash and merge | Un solo nuovo commit con il risultato complessivo; gli originali del branch non diventano antenati per effetto dello squash. | La PR contiene tentativi e correzioni intermedie; ha senso annullarla come unità. |
| Rebase and merge | I commit della PR vengono riapplicati separatamente sulla base, senza commit di merge. GitHub assegna nuovi SHA. | Ogni commit racconta un passo utile e vuoi una storia lineare. |

I metodi disponibili dipendono dalle impostazioni e dalle regole del repository. **Auto-merge** decide *quando* integrare dopo il soddisfacimento dei requisiti, non è un quarto modo di costruire la storia.

## Esempio: una PR, tre storie alternative

Supponi che `fix/export-vuoto` contenga due commit, prima il test e poi la correzione. I percorsi seguenti sono **alternative**, non comandi da concatenare: provali in copie di lavoro di prova separate, pulite e con la stessa storia iniziale. Non richiedono push.

### Conservare il punto di unione

Da `main`, `--no-ff` crea un merge commit anche quando sarebbe possibile un semplice avanzamento del riferimento. Senza quell’opzione `git merge` può fare un fast-forward senza creare alcun commit.

```bash
git merge --no-ff --no-edit fix/export-vuoto
```

### Riunire tutto in un commit

Da `main`, prepara il risultato combinato senza registrarlo né spostare `HEAD`:

```bash
git merge --squash fix/export-vuoto
```

Verifica `git diff --staged`; poi registra il risultato con un messaggio che descriva l’intera PR:

```bash
git commit -m "Corregge l'export CSV dei report vuoti"
```

### Riapplicare i passi sulla base

Da `fix/export-vuoto`, con commit locali non condivisi e una base `main` che è avanzata dalla biforcazione:

```bash
git rebase main
```

Questo aggiorna **il branch di lavoro**, non `main`. Dopo il rebase e i test, passa a `main`:

```bash
git switch main
```

```bash
git merge --ff-only fix/export-vuoto
```

Qui il fast-forward muove solo il riferimento. L’esempio spiega la topologia, non replica esattamente il pulsante GitHub: un `git rebase` locale può anche non riscrivere nulla se la base è già un antenato, mentre **Rebase and merge** su GitHub crea nuovi identificatori.

## Prima di scegliere

- Guarda la storia con `git log --graph --oneline --all`. Per tornare a una correzione dopo uno squash, cerca il commit integrato sulla base, non solo lo SHA del branch di lavoro.
- Se conservi un branch di lunga durata dopo uno squash, Git può riproporre vecchi commit nel confronto successivo: per lavoro nuovo è più semplice ripartire dalla base aggiornata.
- Non riscrivere un branch condiviso senza accordo. Se ci sono conflitti, non basta ottenere un diff pulito: riprova i casi di comportamento interessati.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub|Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]

## Fonti

- [GitHub Docs - About merge methods](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github)
- [Git: merge, squash e fast-forward](https://git-scm.com/docs/git-merge)
- [Git: riapplicare i commit con rebase](https://git-scm.com/docs/git-rebase)
