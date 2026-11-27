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
  - dependency-graph
  - dependencies
  - supply-chain
aliases:
  - Dependency graph
  - GitHub dependency graph
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Dependabot]]"
  - "[[Programmazione/GitHub/Pagine/SBOM e attestazioni su GitHub]]"
title: Dependency graph
---

# Dependency graph

## Sintesi

Il **dependency graph** descrive i componenti che GitHub riconosce dai manifest, dai lockfile e dai dati inviati durante la build. **Dependencies** mostra ciò da cui il progetto dipende; **Dependents** mostra altri progetti che GitHub riconosce come utilizzatori. Nessuna delle due viste è un inventario completo di ciò che sta girando in produzione.

## Esempio: chi introduce un parser nel sito?

Nel vault `site/package.json` dichiara `remark-parse`. Quel pacchetto richiede a sua volta `mdast-util-from-markdown`. Il primo è **diretto** per il sito, il secondo è **transitivo** lungo questa catena. La classificazione dipende dal progetto osservato, non è una proprietà del pacchetto.

Dalla radice del vault, con npm disponibile, leggi il vincolo dichiarato dal sito:

```bash
npm --prefix site pkg get dependencies.remark-parse
```

Per vedere la versione risolta del parser transitivo e le catene che lo includono, consulta il lockfile senza installare pacchetti:

```bash
npm --prefix site ls --package-lock-only --all mdast-util-from-markdown
```

L’intervallo nel manifest risponde a «quali versioni sono ammesse?»; il lockfile a «quali versioni ha scelto il resolver per questa revisione?». Un nome che manca dal manifest principale può dunque comparire legittimamente nel grafo. Il dato non dimostra che il parser sia incluso nel JavaScript consegnato al browser: può essere usato soltanto per costruire le pagine.

## Scegliere la vista giusta

| Domanda | Strumento | Interpretazione |
| --- | --- | --- |
| Quali componenti risultano nel repository? | **Insights → Dependency graph** | Parti dal manifest e dall’ecosistema corretti. La copertura dipende dai formati supportati e dai dati disponibili. |
| Quali pacchetti aggiunge o rimuove una PR? | **Dependency review** nella PR, dove disponibile | Confronta base e proposta; il diff del lockfile può includere dipendenze transitive anche se il manifest cambia di una riga. |
| Perché un pacchetto risolto durante la build non compare? | **Dependency submission** | La build può inviare uno snapshot delle dipendenze a GitHub. Verifica la revisione e la build di origine prima di trattare un’assenza come prova. |
| Quali componenti posso comunicare a chi usa il progetto? | Esportazione **SBOM** | Esporta lo stato del grafo. Per distribuire un binario o un archivio, verifica separatamente che l’inventario rappresenti quel prodotto. |

Un manifest npm, un `Cargo.lock` o un manifest Python non danno automaticamente lo stesso dettaglio: controlla il supporto dell’ecosistema. Considera anche le dipendenze dei workflow e il codice copiato direttamente nel progetto, che può non comparire come pacchetto. Il grafo fornisce dati a Dependabot; **non è** un’analisi del codice sorgente.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Dependabot|Dependabot]]
- [[Programmazione/GitHub/Pagine/SBOM e attestazioni su GitHub|SBOM e attestazioni su GitHub]]

## Fonti

- [GitHub Docs: costruzione e limiti del dependency graph](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-graph)
- [GitHub Docs: dependency review nelle pull request](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review)
- [npm CLI: lettura dell’albero dal package-lock](https://docs.npmjs.com/cli/v11/commands/npm-ls/)
