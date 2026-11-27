---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-actions
  - marketplace
  - supply-chain
aliases:
  - Actions marketplace
  - GitHub Actions marketplace
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Dependabot]]"
title: Actions marketplace
---

# Actions marketplace

## Sintesi

Il Marketplace è un catalogo: un’action è codice che viene eseguito nel job. Non si installa nel progetto npm e la presenza nel catalogo non ne garantisce l’idoneità. Prima di aggiungerla chiediti quale operazione sostituisce: per `npm ci` basta uno step `run`; per preparare Node e la cache su runner diversi può convenire `actions/setup-node`.

## Leggere la riga `uses`

In `actions/checkout@v6`, `actions` è il proprietario, `checkout` il repository e `v6` il riferimento. Un tag major può passare a un nuovo commit: è comodo per ricevere aggiornamenti compatibili, ma non fissa lo stesso codice per ogni run. Un **commit SHA completo** identifica invece una revisione precisa.

Esempio da inserire in `steps`: è volutamente fissato alla [release v6.0.2 di checkout](https://github.com/actions/checkout/releases/tag/v6.0.2), non proposto come «ultima versione». Il commento è per il lettore; GitHub usa lo SHA.

```yaml
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
  with:
    persist-credentials: false
```

Qui il checkout rimane disponibile per leggere i file, ma le credenziali usate per scaricarli non vengono conservate per i successivi comandi Git. Questa scelta non revoca il token del job: i suoi permessi si limitano con `permissions`. Uno SHA evita che il riferimento si sposti, **non** certifica la sicurezza del codice a quella revisione.

## Prima di usare un’action

1. Apri il repository del proprietario, la release e il commit corrispondente. Il badge del creatore verificato riguarda l’identità, non una revisione di sicurezza di ogni versione.
2. Leggi `action.yml` o `action.yaml` **a quella revisione**: controlla input, output e implementazione. Verifica anche permessi necessari, piattaforme supportate e manutenzione. Non concedere un secret solo perché compare nell’esempio del README.
3. Scegli il riferimento secondo le regole del repository. Se usi uno SHA, prevedi come aggiornare e verificare il pin, per esempio tramite PR di Dependabot per l’ecosistema `github-actions`.
4. Nel vault `actions/setup-node@v6` con `node-version: 24` contiene due scelte diverse: `v6` è la versione dell’action, `24` è la versione di Node predisposta per il progetto. Nessuna delle due installa le dipendenze da `site/package-lock.json`.

## Quando il Marketplace non serve

Un’action può essere **composite** (riunisce più step), **JavaScript** (esegue codice con Node) o **Docker** (porta il proprio ambiente Linux). Questa distinzione riguarda l’implementazione, non chi la mantiene: un’action locale può essere composite quanto una pubblicata sul Marketplace.

Uno step può richiamare un’action locale con `uses: ./.github/actions/nome` se quella directory contiene davvero la definizione e il checkout è già avvenuto. Un **workflow riutilizzabile** si richiama invece con `jobs.<id>.uses`: definisce job, non è uno step da infilare in `steps`.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions|Sintassi YAML GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Dependabot|Dependabot]]
- [[Programmazione/GitHub/Pagine/Composite actions|Composite actions]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Trovare e personalizzare le action](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/find-and-customize-actions)
- [GitHub Docs - Uso sicuro di action e riferimenti immutabili](https://docs.github.com/en/actions/reference/security/secure-use)
- [actions/checkout - Implementazione alla revisione mostrata](https://github.com/actions/checkout/tree/de0fac2e4500dabe0009e67214ff5f5447ce83dd)
