---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - ci
  - quality-gates
aliases:
  - Code quality gates
  - Quality gates
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Formatter]]"
  - "[[Programmazione/Clean Code/Pagine/Linter]]"
  - "[[Programmazione/Clean Code/Pagine/Coverage]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Static analysis]]"
  - "[[Programmazione/Clean Code/Pagine/Pre-commit hooks]]"
  - "[[Programmazione/Clean Code/Pagine/Codice pronto al deploy]]"
title: Code quality gates
---

# Code quality gates

## Sintesi

Un controllo produce un risultato; un **quality gate** collega quel risultato a una decisione: «questa modifica può essere integrata?». Un job rosso segnala un problema, ma **il solo file YAML non impedisce il merge**. Serve una regola del repository che richieda quel controllo sul branch di destinazione.

## Esempio: un piccolo gate di pull request

Esempio per un **progetto dimostrativo**, non per il workflow di pubblicazione di questo vault. Nella radice si trovano il modulo e i test della nota [[Programmazione/Clean Code/Pagine/Coverage|Coverage]], incluso il caso di soglia di [[Programmazione/Clean Code/Pagine/Mutation testing|Mutation testing]]. Bastano Node 24 e la sua libreria standard: non c'è un pacchetto da installare. Un possibile `.github/workflows/quality.yml`:

```yaml
name: Quality
on: [pull_request]
permissions:
  contents: read
jobs:
  tariff-contract:
    name: tariff-contract
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
      - name: Controlla la sintassi
        run: node --check shipping.mjs
      - name: Verifica il contratto
        run: node --test shipping.test.mjs
```

Entrambi i comandi sono riproducibili dalla radice del progetto. Il primo non esegue la tariffa; il secondo controlla i risultati attesi. Per bloccare il merge, configura un ruleset o la protezione del branch con `tariff-contract` come status check richiesto, e verifica la regola con una PR di prova. Mantieni un nome di job stabile e univoco. Il gate qui **non** fa deploy e non impone una percentuale di coverage.

## Come scegliere cosa blocca

| Fase | Segnale utile | Decisione |
| --- | --- | --- |
| Editor o pre-commit | Feedback rapido su stile e modifiche preparate | Correggi prima del push; non è una garanzia per il branch |
| Pull request | Controlli ripetibili su versione proposta: tipi, lint, test o build secondo il progetto | Blocca al fallimento dei controlli dichiarati obbligatori |
| Prima della release | Costi maggiori: integrazione, migrazioni, verifiche specifiche di rilascio | Non promuovere un artefatto non verificato |

## Errori comuni e verifica

Non mascherare un controllo obbligatorio con `continue-on-error`. Non rendere obbligatorio un workflow che per alcuni percorsi non parte affatto senza prevedere come arriverà il check richiesto. Se usi una merge queue, configura anche l'evento richiesto per quella coda: il solo `pull_request` del frammento non la copre. Per le eccezioni documenta il rischio accettato, chi può autorizzarle e quando scadono.

Prova sia il percorso verde sia un errore significativo: con `>` al posto di `>=` la sintassi resta valida, ma il test sull'importo esattamente alla soglia deve fermare il job. Un test locale dei comandi non certifica le impostazioni di GitHub.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Formatter|Formatter]]
- [[Programmazione/Clean Code/Pagine/Linter|Linter]]
- [[Programmazione/Clean Code/Pagine/Type checking|Type checking]]
- [[Programmazione/Clean Code/Pagine/Coverage|Coverage]]
- [[Programmazione/Clean Code/Pagine/Static analysis|Static analysis]]
- [[Programmazione/Clean Code/Pagine/Pre-commit hooks|Pre-commit hooks]]
- [[Programmazione/Clean Code/Pagine/Codice pronto al deploy|Codice pronto al deploy]]

## Fonti

- GitHub Actions Documentation
- SonarSource Documentation
- Martin Fowler, *Continuous Integration*
- [GitHub: required status checks e branch protetti](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub: risolvere i problemi dei controlli richiesti](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/troubleshooting-required-status-checks)
