---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, pull-request, review, collaborazione]
aliases: [Pull request, PR, Merge request]
prerequisites: [Branch su GitHub, Commit e cronologia su GitHub]
related: [Review code su GitHub, Issues GitHub]
---

# Pull request

## Sintesi

Una **pull request** e una proposta di modifica da un branch verso un altro branch. Su GitHub e il punto centrale del lavoro collaborativo: mostra diff, commit, discussioni, review, controlli automatici e stato del merge.

Una pull request non e solo una richiesta tecnica di merge: e anche il contesto che spiega il problema, la soluzione e i rischi.

## Quando usarlo

Apri una pull request quando:

- vuoi unire un branch a `main`;
- vuoi ricevere review;
- vuoi far girare test e lint in CI;
- vuoi discutere una modifica prima del merge;
- vuoi collegare codice a issue o task;
- vuoi mantenere una traccia storica delle decisioni.

## Come funziona

Una pull request ha:

- branch sorgente;
- branch destinazione;
- titolo;
- descrizione;
- diff;
- commit;
- review;
- commenti;
- status check;
- eventuali issue collegate.

GitHub aggiorna automaticamente la pull request quando fai push di nuovi commit sul branch sorgente.

## API / Sintassi

Creare un branch e inviarlo:

```bash
git switch -c feature/report-export
git add .
git commit -m "Aggiunge export report"
git push -u origin feature/report-export
```

Creare PR con GitHub CLI:

```bash
gh pr create --base main --head feature/report-export
```

Vedere stato PR:

```bash
gh pr status
gh pr checks
```

## Esempio pratico

Descrizione utile:

```md
## Cosa cambia

- Aggiunge export CSV dei report.
- Aggiunge test sul formato generato.

## Perche

Serve per scaricare i dati da dashboard.

## Verifica

- npm test
- npm run lint
```

Una descrizione cosi riduce domande ripetute durante la review.

## Varianti

- **Draft pull request**: modifica ancora in lavorazione.
- **Ready for review**: modifica pronta per revisione.
- **PR da fork**: comune nei progetti open source.
- **PR piccola**: piu facile da rivedere.
- **PR stacked**: piu pull request dipendenti, da usare con disciplina.

## Errori comuni

- Aprire PR troppo grandi.
- Non spiegare il perche della modifica.
- Non indicare come e stata testata.
- Mescolare feature, refactor e fix.
- Lasciare conversazioni di review irrisolte.
- Fare merge con controlli falliti.

## Checklist

- Il titolo spiega la modifica?
- La descrizione include contesto e verifica?
- La PR e piccola abbastanza da rivedere?
- I test e lint passano?
- Le review richieste sono assegnate?
- Le conversazioni sono risolte prima del merge?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Branch su GitHub]]
- [[Commit e cronologia su GitHub]]
- [[Review code su GitHub]]
- [[Issues GitHub]]

## Fonti

- [GitHub Docs - About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
