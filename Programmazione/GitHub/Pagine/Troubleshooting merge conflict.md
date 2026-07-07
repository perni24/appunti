---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
difficulty: intermedio
tags: [github, git, merge-conflict, troubleshooting]
aliases: [Troubleshooting merge conflict, Troubleshooting conflitti GitHub]
prerequisites: [Merge squash e rebase su GitHub, Pull request]
related: [Troubleshooting pull request, Branch su GitHub, Commit e cronologia su GitHub]
---

# Troubleshooting merge conflict

## Obiettivo

Risolvere conflitti di merge che bloccano una pull request o un merge locale, mantenendo il codice corretto e senza perdere modifiche importanti.

Un conflitto non e solo un errore tecnico: e un punto in cui due linee di sviluppo hanno preso decisioni incompatibili e serve scegliere il risultato finale.

## Quando usarlo

- GitHub segnala che la PR ha conflitti.
- Il pulsante merge e disabilitato.
- `git merge` o `git rebase` fallisce.
- Lo stesso file e stato modificato su branch diversi.
- Un file e stato modificato in un branch e cancellato in un altro.

## Procedura

1. Leggi quali file sono in conflitto.
2. Decidi se il conflitto e semplice o complesso.
3. Per conflitti semplici di linea puoi usare l'editor GitHub.
4. Per conflitti complessi lavora in locale.
5. Aggiorna il branch rispetto alla base.
6. Apri i file con marker di conflitto.
7. Scegli o combina le modifiche corrette.
8. Rimuovi i marker `<<<<<<<`, `=======`, `>>>>>>>`.
9. Esegui test o build.
10. Fai commit e push della risoluzione.

## Snippet

Risoluzione locale con merge:

```bash
git fetch origin
git switch feature-branch
git merge origin/main
# modifica i file in conflitto
git add .
git commit
git push
```

Risoluzione locale con rebase:

```bash
git fetch origin
git switch feature-branch
git rebase origin/main
# modifica i file in conflitto
git add .
git rebase --continue
git push --force-with-lease
```

Interrompere un rebase se hai sbagliato:

```bash
git rebase --abort
```

## Adattamenti comuni

- **Conflitto semplice di linea**: puo bastare l'editor GitHub.
- **Conflitto su molti file**: meglio risolvere in locale con IDE e test.
- **File cancellato/modificato**: decidi se mantenere il file o confermare la cancellazione.
- **Branch condiviso**: evita `push --force` non coordinato; usa `--force-with-lease`.
- **PR critica**: chiedi review sulla risoluzione del conflitto.

## Debug rapido

- Se GitHub non permette la risoluzione online, il conflitto e troppo complesso o il branch e protetto.
- Se dopo il merge i test falliscono, il conflitto e stato risolto sintatticamente ma non semanticamente.
- Se `git rebase --continue` fallisce, controlla file non aggiunti con `git status`.
- Se hai perso modifiche, ferma tutto e controlla reflog prima di fare altri push.
- Se compaiono ancora marker nel codice, cerca `<<<<<<<`.

## Checklist finale

- Tutti i marker di conflitto rimossi.
- File cancellati/modificati controllati.
- Test o build eseguiti.
- Diff della risoluzione revisionato.
- Branch aggiornato su GitHub.
- PR non mostra piu conflitti.
- Reviewer informati se la risoluzione e delicata.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Merge squash e rebase su GitHub]]
- [[Pull request]]
- [[Branch su GitHub]]
- [[Commit e cronologia su GitHub]]
- [[Troubleshooting pull request]]

## Fonti

- [GitHub Docs - About merge conflicts](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/about-merge-conflicts)
- [GitHub Docs - Resolving a merge conflict on GitHub](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-on-github)
