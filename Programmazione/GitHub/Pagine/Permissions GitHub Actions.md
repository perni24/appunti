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
  - permissions
  - github-token
  - security
aliases:
  - Permissions GitHub Actions
  - Permessi GitHub Actions
  - GITHUB_TOKEN permissions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Variabili e secrets GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Required status checks]]"
title: Permissions GitHub Actions
---

# Permissions GitHub Actions

## Sintesi

`permissions` limita il **`GITHUB_TOKEN` del job**: riguarda le operazioni verso le API e il repository, non la possibilità di creare file sul runner. Un job può generare migliaia di HTML con `contents: read` senza poter creare un commit su GitHub. Il blocco non riduce i privilegi di un eventuale PAT o di una credenziale cloud passata separatamente.

## Esempio pratico: leggere il repository senza scriverci

Questo workflow su PR non ha bisogno di commentare, pubblicare o richiedere un token OIDC. Parte da `permissions: {}` e concede al solo job `verifica` la lettura necessaria al checkout. Il comando controlla che `Home.md` sia **tracciato in Git**; non bastano un file generato o una modifica non aggiunta all’indice.

```yaml
name: Verifica file tracciato
on: pull_request
permissions: {}
jobs:
  verifica:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - run: git ls-files --error-unmatch -- Home.md
```

## Leggere i permessi effettivi

La configurazione del repository o dell’organizzazione fornisce i default. Il workflow può dichiarare i propri e il job può specificare la propria mappa: se assegni permessi espliciti, quelli non elencati sono `none`. Non trattare il blocco del job come una lista di permessi da aggiungere automaticamente a quelli del workflow. Le restrizioni delle PR da fork possono limitare ulteriormente i permessi.

| Operazione | Permesso da valutare | Cosa non implica |
| --- | --- | --- |
| Leggere codice per test o lint | `contents: read` | Non autorizza un push. |
| Commentare una issue o una PR | `issues: write` o `pull-requests: write` secondo l’endpoint | Non è necessario per mostrare il normale esito della CI. |
| Pubblicare package o creare una release | `packages: write` per il registry GitHub; `contents: write` per una release | Non assegnarli a tutti i job di test. |
| Ottenere un token OIDC | `id-token: write` nel job che si autentica | Permette di richiedere l’identità; è il provider esterno a decidere accesso e ruolo. |

Il deploy Quartz del vault dichiara `contents: read`, `pages: write` e `id-token: write` **a livello di workflow**. È un esempio di pubblicazione, non la lista da copiare per una CI su PR.

## Se compare un errore 403

Individua job, evento, endpoint e token davvero usato. Per esempio, un checkout riuscito non prova che lo stesso token possa scrivere una release. Controlla anche la provenienza da fork e le policy dell’organizzazione. Assegna il minimo permesso al job che esegue l’operazione; non risolvere un 403 consegnando un token personale con ampi privilegi al codice di una PR.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Variabili e secrets GitHub Actions|Variabili e secrets GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]
- [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]]

## Fonti

- [GitHub Docs - GITHUB_TOKEN e durata per job](https://docs.github.com/en/actions/concepts/security/github_token)
- [GitHub Docs - Permissions e precedenza](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions)
- [GitHub Docs - Relazione di fiducia OIDC](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-cloud-providers)
