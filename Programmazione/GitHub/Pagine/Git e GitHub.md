---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [github, git, versionamento]
aliases: [Git e GitHub]
prerequisites: []
related: [GitHub, Remote origin e upstream]
---

# Git e GitHub

## Sintesi

**Git** e il sistema di versionamento distribuito. **GitHub** e una piattaforma che ospita repository Git e aggiunge collaborazione, review, automazione e gestione del progetto.

La distinzione e fondamentale: i commit, i branch, i tag e la history appartengono a Git; pull request, issue, Actions, review e permessi sono funzionalita GitHub.

## Quando usarlo

Studia questa distinzione quando:

- un comando Git fallisce e non capisci se il problema e locale o remoto;
- devi collaborare tramite pull request;
- devi configurare `origin` e `upstream`;
- devi spiegare perche il codice e diverso tra macchina locale e GitHub;
- devi decidere se risolvere un problema da terminale o dall'interfaccia GitHub.

## Come funziona

Git lavora principalmente in locale:

- conserva la history;
- crea commit;
- gestisce branch;
- confronta differenze;
- permette merge e rebase.

GitHub lavora come remoto e piattaforma:

- riceve push;
- espone repository via web;
- gestisce pull request;
- esegue workflow;
- controlla permessi;
- integra issue, progetti e sicurezza.

Il collegamento tra i due avviene tramite remote:

```bash
git remote -v
```

Di solito `origin` punta al repository GitHub principale o al tuo fork.

## API / Sintassi

Comandi Git locali:

```bash
git status
git log --oneline
git branch
git switch main
git pull
git push
```

Comandi verso GitHub:

```bash
git remote -v
git push origin main
git fetch origin
```

Operazioni GitHub da CLI:

```bash
gh repo clone owner/repository
gh pr create
gh issue list
```

## Esempio pratico

Controllare se il repository locale punta a GitHub:

```bash
git remote -v
```

Output tipico:

```text
origin  https://github.com/luca/progetto.git (fetch)
origin  https://github.com/luca/progetto.git (push)
```

Qui Git usa GitHub come remoto chiamato `origin`.

## Varianti

- **Git senza GitHub**: repository locale o remoto su un altro server.
- **GitHub senza terminale**: modifiche da interfaccia web, utili ma limitate.
- **GitHub CLI**: ponte tra terminale e API GitHub.
- **Repository mirror**: copia sincronizzata di un repository.
- **Fork workflow**: il tuo `origin` e un fork, `upstream` e il progetto originale.

## Errori comuni

- Dire "ho fatto commit su GitHub" quando il commit e locale e manca il push.
- Fare `git pull` senza sapere da quale remote e branch.
- Confondere pull request e `git pull`.
- Pensare che una branch locale esista automaticamente su GitHub.
- Usare GitHub per risolvere problemi che sono solo di working tree locale.

## Checklist

- Sai se il problema e locale o remoto?
- Hai controllato `git status`?
- Hai controllato `git remote -v`?
- La branch locale ha una branch remota associata?
- Il commit e stato anche inviato con `push`?
- La pull request punta al branch base corretto?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub]]
- [[Remote origin e upstream]]
- [[Clone fork e template repository]]

## Fonti

- [GitHub Docs - About GitHub and Git](https://docs.github.com/en/get-started/start-your-journey/about-github-and-git)
