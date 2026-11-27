---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - github-actions
  - runners
  - self-hosted
aliases:
  - Self-hosted runners
  - Runner self-hosted GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Jobs steps e runners]]"
related:
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/OIDC GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Costi e limiti GitHub Actions]]"
title: Self-hosted runners
---

# Self-hosted runners

## Sintesi

Un **runner self-hosted** è una macchina che gestisci tu e che GitHub può selezionare per un job. Ha senso quando serve una risorsa concreta: un compilatore specialistico, un dispositivo fisico, una GPU o una rete privata autorizzata. Per il sito Quartz il workflow usa `ubuntu-latest`: non presuppone un tuo server acceso.

## Come viene scelto il runner

Distingui tre livelli: **registrazione** (repository, organizzazione o enterprise), **gruppo** (quali repository o workflow possono richiedere la risorsa) ed **etichette** (quali runner dichiarano la capacità richiesta). Con `runs-on: [self-hosted, linux, x64]` le etichette sono cumulative, non tre alternative. Un’etichetta personalizzata non installa né verifica automaticamente una toolchain.

Esempio di sola lettura, da usare come job in un workflow fidato. Presuppone un gruppo esistente `laboratorio` accessibile al repository e un runner Linux con etichetta `arm-toolchain`, Bash e il compilatore indicato. Non richiede checkout né credenziali e non programma un dispositivo.

```yaml
jobs:
  verifica-toolchain:
    permissions: {}
    runs-on:
      group: laboratorio
      labels: arm-toolchain
    steps:
      - name: Verifica la versione del compilatore
        shell: bash
        run: arm-none-eabi-gcc --version
```

| Sintomo | Cosa verificare per primo |
| --- | --- |
| Job in coda, nessuno step avviato | Esiste un runner online e libero che corrisponde al gruppo e alle etichette? Il repository è ammesso? |
| Il job parte ma il comando non esiste | La selezione è riuscita. Verifica installazione e `PATH` **dell’account del servizio runner**, non soltanto della tua shell. |
| Il job passa soltanto sulla macchina già usata | Cerca file residui o dipendenze non dichiarate. Ripeti su un ambiente pulito prima di affidarti al risultato. |

## Responsabilità operative

Un runner persistente non garantisce un filesystem nuovo a ogni job. Separa ambienti con livelli di fiducia differenti, aggiorna sistema, software del runner e toolchain, monitora spazio e disponibilità. Non instradare PR non fidate verso macchine con accesso interno o dispositivi reali: `permissions: {}` limita il token GitHub, **non** i permessi locali della macchina.

L’installazione può essere fisica o in cloud. Un runner effimero dedicato a un solo job riduce il riuso dello stato, ma devi anche eliminare o ripristinare l’ambiente sottostante. Se non puoi gestire isolamento, aggiornamenti e recovery, un runner GitHub-hosted è spesso la scelta più semplice.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Jobs steps e runners|Jobs steps e runners]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/OIDC GitHub Actions|OIDC GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Caratteristiche dei runner self-hosted](https://docs.github.com/en/actions/concepts/runners/self-hosted-runners)
- [GitHub Docs - Gruppi, etichette e selezione del runner](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/use-in-a-workflow)
- [GitHub Docs - Sicurezza dei runner](https://docs.github.com/en/actions/reference/security/secure-use)
