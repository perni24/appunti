---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, permissions, github-token, security]
aliases: [Permissions GitHub Actions, Permessi GitHub Actions, GITHUB_TOKEN permissions]
prerequisites: [GitHub Actions, Sicurezza dei token GitHub]
related: [Variabili e secrets GitHub Actions, Required status checks]
---

# Permissions GitHub Actions

## Sintesi

Le **permissions GitHub Actions** controllano cosa puo fare il `GITHUB_TOKEN` generato per un workflow o job. Dichiarare permessi minimi riduce l'impatto di workflow compromessi, action vulnerabili o script pericolosi.

Il principio e: un workflow di test non dovrebbe avere permessi di scrittura se deve solo leggere codice ed eseguire test.

## Quando usarlo

Configura `permissions` quando:

- un workflow usa `GITHUB_TOKEN`;
- pubblichi release o package;
- commenti issue o pull request da workflow;
- usi action terze;
- gestisci deploy;
- vuoi applicare least privilege.

## Come funziona

Puoi dichiarare `permissions` a livello di workflow o job. Se un job ha esigenze diverse, dichiarale sul job.

Esempi di scope:

- `contents`;
- `issues`;
- `pull-requests`;
- `actions`;
- `checks`;
- `packages`;
- `id-token`.

Il valore puo essere `read`, `write` o `none`, in base allo scope.

## API / Sintassi

Permessi minimi per CI:

```yaml
permissions:
  contents: read
```

Permessi per scrivere commenti su PR:

```yaml
permissions:
  contents: read
  pull-requests: write
```

Permessi OIDC:

```yaml
permissions:
  contents: read
  id-token: write
```

## Esempio pratico

Workflow CI:

```yaml
name: CI

on:
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

Questo workflow puo leggere codice ma non scrivere nel repository.

## Varianti

- **Workflow-level permissions**: default per tutti i job.
- **Job-level permissions**: override piu specifico.
- **Read-only CI**: `contents: read`.
- **Write for release**: permessi limitati a job release.
- **OIDC**: usa `id-token: write` per autenticazione federata.
- **No permissions**: `permissions: {}` dove possibile.

## Errori comuni

- Lasciare permessi impliciti troppo ampi.
- Dare `contents: write` alla CI.
- Passare token con scrittura ad action terze non fidate.
- Usare token personali al posto di `GITHUB_TOKEN`.
- Non separare job test e job release.
- Non considerare PR da fork.

## Checklist

- Il workflow dichiara `permissions`?
- La CI usa solo lettura?
- I job con scrittura sono separati?
- Le action terze ricevono solo permessi necessari?
- `id-token: write` e usato solo dove serve?
- I secret e token sono protetti da contesti non fidati?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Variabili e secrets GitHub Actions]]
- [[Sicurezza dei token GitHub]]
- [[Pipeline CI GitHub Actions]]

## Fonti

- [GitHub Docs - GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token)
- [GitHub Docs - Workflow syntax permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions)
