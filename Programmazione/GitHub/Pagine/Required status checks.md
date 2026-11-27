---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - status-checks
  - ci
  - pull-request
aliases:
  - Required status checks
  - Status checks GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Branch protection rules]]"
related:
  - "[[Programmazione/GitHub/Pagine/Branch protection rules]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
title: Required status checks
---

# Required status checks

## Sintesi

Un **required status check** è un risultato che la protezione del branch si aspetta da una CI per la revisione in esame. Non è il comando di test: `npm test` è qualcosa che il runner può eseguire; il check da selezionare è il **nome effettivamente riportato** dal job o dal servizio esterno. Mantienilo stabile e non riutilizzare lo stesso nome per job diversi.

## Esempio: un controllo prima del merge, non un deploy

Questo workflow **di esempio** per un repository di documentazione verifica che il `README.md` tracciato contenga almeno una riga non vuota. Non costruisce e non pubblica il sito. Il controllo ha un nome che dice esattamente cosa prova:

```yaml
name: Verifica documentazione
on:
  pull_request:
  merge_group:

permissions:
  contents: read

jobs:
  readme:
    name: docs-readme
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Verifica il contenuto del README nel commit
        run: git grep -q '[^[:space:]]' HEAD -- README.md
```

Prima lascia che il job riesca su una PR. Poi, se quel requisito serve al progetto, seleziona `docs-readme` fra i check disponibili nella protezione della base, con la sorgente attesa se configurata. Il job fallisce se il file manca o contiene solo spazi; **non** verifica link, grammatica o build. Per quelli servono test diversi. `merge_group` permette a una merge queue, se usata, di richiedere una verifica separata sul gruppo proposto.

Il workflow Quartz di questo vault (`.github/workflows/deploy-pages.yml`) serve a un altro scopo: parte su push a `main` o su avvio manuale. Vedere il deploy verde **dopo** il merge non significa aver convalidato la PR **prima** del merge.

## Perché la PR mostra ancora un blocco?

| Sintomo | Controllo da fare |
| --- | --- |
| Il check è atteso ma non arriva | Confronta il nome richiesto con quello pubblicato. Se l’intero workflow è stato saltato per filtri su branch o percorsi, il check può restare in attesa. |
| La CI è verde per una revisione precedente | Confronta gli SHA. Se GitHub mostra i check del commit di merge di prova, sono quelli rilevanti; in assenza di un risultato su quel commit conta l’ultimo head. |
| Il job è saltato ma la PR risulta idonea | Un job saltato per una condizione non equivale a un workflow mai partito. Gli esiti `success`, `neutral` o `skipped` possono soddisfare il requisito: verifica che i test necessari siano stati realmente eseguiti. |
| Il branch deve essere aggiornato | In modalità **strict** deve essere aggiornato rispetto alla base; in **loose** questo non è richiesto, ma restano obbligatori i check selezionati. |
| Il nome coincide, ma la sorgente no | Se la regola richiede una GitHub App specifica, deve essere quella a pubblicare l’esito. |

Con `gh` autenticato, sostituisci repository e numero per vedere **solo** i check obbligatori. Ometti `--required` per confrontarli con tutti gli altri:

```bash
gh pr checks 123 --repo OWNER/REPO --required
```

Il comando legge gli esiti, non avvia test. In uno script, il codice di uscita `8` indica check in attesa, non un fallimento del programma sotto test.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Branch protection rules|Branch protection rules]]
- [[Programmazione/GitHub/Pagine/Repository rulesets|Repository rulesets]]

## Fonti

- [GitHub Docs: status checks](https://docs.github.com/en/pull-requests/reference/status-checks)
- [GitHub Docs: check in attesa, commit e merge queue](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [GitHub Docs: opzioni strict e loose](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub CLI: leggere i check di una PR](https://cli.github.com/manual/gh_pr_checks)
