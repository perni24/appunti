---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, secrets, sicurezza, procedura]
aliases: [Gestire secrets in GitHub Actions, Gestione secrets GitHub Actions]
prerequisites: [Variabili e secrets GitHub Actions, Permissions GitHub Actions]
related: [Environments GitHub Actions, OIDC GitHub Actions, Secret scanning]
---

# Gestire secrets in GitHub Actions

## Obiettivo

Gestire credenziali e valori sensibili usati da GitHub Actions senza inserirli nel codice, nei log o nei workflow in modo insicuro.

I secret devono essere il piu possibile limitati per ambiente, repository e permessi. Quando possibile, per cloud provider moderni e preferibile usare OIDC invece di token statici.

## Quando usarlo

Usalo quando:

- un workflow deve autenticarsi verso un servizio esterno;
- devi fare deploy;
- devi pubblicare package;
- devi usare chiavi API;
- vuoi separare staging e produzione;
- vuoi evitare credenziali hardcoded.

## Procedura

1. Identifica se il valore e davvero un secret.
2. Verifica se puoi usare OIDC al posto di un token statico.
3. Scegli ambito corretto: repository, environment o organization.
4. Crea il secret con nome chiaro e maiuscolo.
5. Usa il secret nel workflow tramite `secrets.NOME`.
6. Limita i permessi del job.
7. Evita di stampare valori sensibili.
8. Per produzione usa environment protection e reviewer.
9. Ruota il secret periodicamente.
10. Rimuovi secret non usati.

## Snippet

Uso di un secret:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy
        run: ./deploy.sh
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}
```

Permessi minimi con OIDC:

```yaml
permissions:
  contents: read
  id-token: write
```

## Adattamenti comuni

- **Repository secret**: valido per workflow del repository.
- **Environment secret**: migliore per staging e produzione.
- **Organization secret**: utile per valori condivisi, ma va limitato ai repository necessari.
- **OIDC**: evita secret statici per cloud provider compatibili.
- **Variable non segreta**: usa variables, non secrets.

## Debug rapido

- Se il secret sembra vuoto, controlla nome, ambito e ambiente.
- Se il workflow parte da fork, considera limitazioni sui secrets.
- Se il deploy non autentica, verifica permessi del token esterno.
- Se un valore appare nei log, ruotalo subito.
- Se usi environment secrets, controlla che il job dichiari `environment`.

## Checklist finale

- Il valore e davvero un secret.
- Ambito minimo scelto.
- Nome chiaro e coerente.
- Nessun secret nel codice.
- Nessun secret stampato nei log.
- `permissions` minimi nel workflow.
- OIDC valutato.
- Rotazione prevista.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Variabili e secrets GitHub Actions]]
- [[Permissions GitHub Actions]]
- [[Environments GitHub Actions]]
- [[OIDC GitHub Actions]]
- [[Secret scanning]]
- [[Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Using secrets in GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
