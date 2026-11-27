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
  - costi
  - limiti
aliases:
  - Costi e limiti GitHub Actions
  - Limiti GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Jobs steps e runners]]"
related:
  - "[[Programmazione/GitHub/Pagine/Cache GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Artifacts GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Self-hosted runners]]"
title: Costi e limiti GitHub Actions
---

# Costi e limiti GitHub Actions

## Sintesi

Per stimare una CI separa tre misure: **tempo di attesa di chi apre la PR**, **tempo complessivo dei runner** e **spazio occupato nel tempo**. Il primo interessa chi aspetta il risultato; gli altri incidono sui consumi. Una build più veloce grazie al parallelismo non è necessariamente meno costosa.

## Esempio pratico: quanto costa una matrix in termini di lavoro?

Frammento di configurazione di un job di compatibilità. Gli step, qui omessi, devono usare `matrix.node` per configurare Node ed eseguire gli stessi test su ogni variante.

```yaml
runs-on: ${{ matrix.os }}
timeout-minutes: 20
strategy:
  max-parallel: 2
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node: ['22', '24']
```

Tre sistemi per due runtime producono **sei job**. Se ciascuno gira quattro minuti, senza code o overhead, consumano 24 minuti complessivi di esecuzione e terminano in circa 12 minuti con due runner alla volta. Con sei runner liberi finirebbero in circa quattro minuti, ma il lavoro rimarrebbe di 24 minuti. **Non è una previsione di fattura**: piattaforma, tipo di runner, piano e quote possono cambiare l’importo. `timeout-minutes: 20` si applica a ciascun job, non all’intera matrix.

## Che cosa misurare nel repository

| Risorsa | Dove intervenire | Errore da evitare |
| --- | --- | --- |
| Calcolo | Confronta durata e utilità dei job; valuta una matrix ridotta su PR e una completa su schedule. | Spostare un test essenziale fuori dalla PR senza accorgersi di perdere la protezione prima del merge. |
| Artifact | Carica report mirati e imposta una conservazione coerente con il tempo necessario alla diagnosi. | Cancellare un vecchio report limita l’occupazione futura, non cancella lo storage già maturato. |
| Cache | Misura hit e tempo di ripristino rispetto a una build senza cache. | Trattare la cache come archivio permanente o confondere la sua quota con quella degli artifact. |
| Runner self-hosted | Considera macchina, manutenzione e disponibilità. | Confondere l’assenza di addebito GitHub per il calcolo self-hosted con un’infrastruttura a costo zero. |

Esempio di upload per un job che **ha già prodotto** `risultati.xml`. `retention-days` vale per quel file caricato e deve rispettare la policy del repository; non è una scadenza globale per log e cache.

```yaml
- uses: actions/upload-artifact@v7
  with:
    name: report-test
    path: risultati.xml
    retention-days: 7
    if-no-files-found: error
```

## Quote, limiti e prezzi non sono sinonimi

Per un repository pubblico il calcolo su runner GitHub-hosted **standard** è gratuito; i *larger runners* possono essere fatturati anche lì. Nei repository privati verifica la quota inclusa e l’uso nella fatturazione dell’account. La disponibilità del runner resta distinta dalla spesa: una matrix può restare in coda anche con budget residuo. Un budget non modifica neppure i limiti tecnici: per esempio, la documentazione GitHub.com indica sei ore per un job GitHub-hosted. Per soglie, tariffe e condizioni del piano usa i riferimenti aggiornati, non il conto didattico sopra.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Matrix strategy GitHub Actions|Matrix strategy GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Cache GitHub Actions|Cache GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Artifacts GitHub Actions|Artifacts GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Self-hosted runners|Self-hosted runners]]

## Fonti

- [GitHub Docs - Fatturazione di calcolo, artifact e cache](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub Docs - Limiti di workflow, runner e matrix](https://docs.github.com/en/actions/reference/limits)
- [GitHub Docs - Timeout e configurazione delle strategie](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [actions/upload-artifact - Retention e percorsi](https://github.com/actions/upload-artifact/tree/v7)
