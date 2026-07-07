---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, checklist, ci-cd]
aliases: [Checklist GitHub Actions, Checklist Actions]
prerequisites: [GitHub Actions, Workflow GitHub Actions]
related: [Permissions GitHub Actions, Cache GitHub Actions, Debug GitHub Actions]
---

# Checklist GitHub Actions

## Obiettivo

Controllare che i workflow GitHub Actions siano leggibili, sicuri, riproducibili e proporzionati allo scopo.

Un workflow corretto non deve solo "passare": deve avere trigger giusti, permessi minimi, log leggibili e separazione chiara tra CI, release e deploy.

## Quando usarlo

- Quando crei una nuova pipeline.
- Prima di rendere un check obbligatorio.
- Prima di aggiungere secrets o deploy.
- Quando un workflow e lento o fragile.
- Durante audit periodici delle automazioni.

## Procedura

1. Controlla nome e responsabilita del workflow.
2. Verifica trigger.
3. Controlla `permissions`.
4. Verifica runner e dipendenze.
5. Controlla cache, artifacts e retention.
6. Verifica secrets, variables ed environments.
7. Controlla concurrency e timeout.
8. Verifica action esterne e versionamento.
9. Controlla log e debug.

## Snippet

Base consigliata:

```yaml
permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
```

Checklist sintetica:

```text
[ ] Workflow con responsabilita singola
[ ] Trigger limitati
[ ] Permissions minimi
[ ] Actions versionate
[ ] Runtime esplicito
[ ] Cache utile e controllata
[ ] Artifacts solo se necessari
[ ] Timeout configurato
[ ] Secrets non stampati
[ ] Deploy separato dalla CI
```

## Adattamenti comuni

- **CI**: usa `pull_request` e `push` su branch principale.
- **Release**: usa tag o workflow manuale controllato.
- **Deploy**: usa environment, approval e OIDC se possibile.
- **Monorepo**: valuta path filter, matrix e job separati.
- **Runner self-hosted**: isola repository fidati e pulisci workspace.

## Debug rapido

- Se il workflow non parte, controlla path e trigger.
- Se i secret sono vuoti, controlla fork, environment e nome secret.
- Se una action fallisce, verifica versione e permessi.
- Se la pipeline e lenta, misura cache, matrix e job paralleli.
- Se i log sono confusi, separa step e nomi.

## Checklist finale

- Trigger corretti.
- Permessi minimi.
- Workflow separati per CI, release e deploy.
- Action esterne versionate.
- Runtime e dipendenze riproducibili.
- Cache e artifact giustificati.
- Timeout e concurrency presenti dove utili.
- Secrets protetti.
- Log leggibili.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Eventi e trigger GitHub Actions]]
- [[Permissions GitHub Actions]]
- [[Cache GitHub Actions]]
- [[Artifacts GitHub Actions]]
- [[Concurrency e cancel-in-progress]]
- [[Debug GitHub Actions]]

## Fonti

- [GitHub Docs - Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
