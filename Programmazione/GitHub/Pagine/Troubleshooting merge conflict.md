---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - git
  - merge-conflict
  - troubleshooting
aliases:
  - Troubleshooting merge conflict
  - Troubleshooting conflitti GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
related:
  - "[[Programmazione/GitHub/Pagine/Troubleshooting pull request]]"
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
title: Troubleshooting merge conflict
---

# Troubleshooting merge conflict

## Obiettivo

Risolvere un conflitto sul **branch della PR**, senza sovrascrivere lavoro estraneo. Prima di iniziare un merge o un rebase, verificare branch, remoto della base e working tree pulito. Se Git segnala un'operazione già in corso, **non avviarne un'altra**.

## Individuare il punto di arresto

```bash
git status
```

Su un branch condiviso, un merge della base nel branch della modifica evita di riscrivere i commit già pubblicati. Per esempio, dopo un fetch dal remoto corretto e dal branch della PR, `git merge origin/main` tenta l'integrazione **locale**: può completarla subito oppure fermarsi su un conflitto. Se il team ha scelto un rebase, seguire il relativo percorso sotto, non entrambi.

Elencare soltanto i percorsi che Git considera ancora non risolti:

```bash
git diff --name-only --diff-filter=U
```

## Risolvere e verificare

1. Per un conflitto di testo, leggere entrambe le versioni tra i marcatori. Se un branch corregge la versione minima di Node e l'altro aggiunge un passo di installazione, il risultato può dover conservare **entrambe** le informazioni. Controllare il comportamento voluto, non scegliere automaticamente un lato. L'editor web basta solo per conflitti semplici che GitHub permette di risolvere lì.
2. Per un conflitto modifica/eliminazione può non esserci alcun marcatore. Se il file deve restare, correggerlo e aggiungerlo; se va davvero eliminato, `git rm -- PERCORSO` registra la cancellazione e rimuove il file dal working tree. Concordare l'intento prima di scegliere.
3. Aggiungere **solo** i file risolti. Esempio per `README.md`:

```bash
git add -- README.md
```

Ripetere l'elenco dei percorsi non risolti: deve essere vuoto. Controllare poi le modifiche preparate, inclusi eventuali marcatori introdotti e problemi di spaziatura:

```bash
git diff --cached --check
```

Questi controlli non dimostrano che la soluzione sia corretta: rileggere il diff preparato con `git diff --cached` ed eseguire i test o la build pertinenti.

## Concludere oppure tornare indietro

| Operazione indicata da `git status` | Se la risoluzione è corretta | Se si decide di rinunciare |
| --- | --- | --- |
| Merge in corso | `git merge --continue` conclude il merge dopo aver preparato i file; può aprire l'editor del messaggio. | `git merge --abort` tenta di ripristinare lo stato precedente. Con modifiche locali già presenti prima del merge, il recupero integrale non è garantito. |
| Rebase in corso | `git rebase --continue` prosegue dal commit corrente; se emergono altri conflitti, ripetere la verifica per quel commit. | `git rebase --abort` torna al punto di partenza del rebase, scartando le risoluzioni parziali. |

Dopo il merge, un push ordinario verso il **branch della PR** è sufficiente se il remoto non è avanzato. Il rebase cambia invece gli identificativi dei commit: se il branch era già pubblicato, coordinarsi con chi lo usa prima di un eventuale push con lease. Un rifiuto non va aggirato con `--force`. Se non si riconosce più la cronologia, fermarsi e ispezionare il reflog locale prima di altri push.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub|Merge squash e rebase su GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub|Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Troubleshooting pull request|Troubleshooting pull request]]

## Fonti

- [Git: merge, continuazione e annullamento](https://git-scm.com/docs/git-merge)
- [Git: rebase interrotto da conflitti](https://git-scm.com/docs/git-rebase)
- [Git: diff, file non risolti e controllo dei marcatori](https://git-scm.com/docs/git-diff)
