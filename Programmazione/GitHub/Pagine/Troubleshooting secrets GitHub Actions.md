---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-actions, secrets, troubleshooting]
aliases: [Troubleshooting secrets GitHub Actions, Troubleshooting secret Actions]
prerequisites: [Gestire secrets in GitHub Actions, Variabili e secrets GitHub Actions]
related: [Troubleshooting permissions GitHub Actions, Environments GitHub Actions, Secret scanning]
---

# Troubleshooting secrets GitHub Actions

## Obiettivo

Diagnosticare perche un secret GitHub Actions non e disponibile, sembra vuoto, non funziona in un comando o causa errori di autenticazione.

I problemi piu comuni dipendono da nome errato, ambito sbagliato, environment non dichiarato, fork, permessi ridotti o confusione tra secrets e variables.

## Quando usarlo

- Il workflow dice che una variabile e vuota.
- Il deploy non autentica.
- Un secret funziona in staging ma non in produzione.
- Un workflow da pull request esterna non vede i secrets.
- Un secret organization non e disponibile nel repository.
- Un valore non segreto e stato salvato come secret o viceversa.

## Procedura

1. Controlla il nome esatto del secret.
2. Verifica se il secret e repository, environment o organization.
3. Se e environment secret, controlla che il job dichiari `environment`.
4. Controlla se il workflow parte da fork.
5. Verifica che il secret sia referenziato come `${{ secrets.NOME }}`.
6. Controlla se stai usando una variable invece di un secret.
7. Verifica permessi del token o servizio esterno.
8. Non stampare il secret; stampa solo presenza o lunghezza mascherata se necessario.
9. Se il secret e stato esposto, revocalo e rigeneralo.

## Snippet

Uso corretto:

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

Controllo presenza senza stampare il valore:

```yaml
- name: Check secret presence
  run: |
    if [ -z "$API_TOKEN" ]; then
      echo "API_TOKEN missing"
      exit 1
    fi
    echo "API_TOKEN configured"
  env:
    API_TOKEN: ${{ secrets.API_TOKEN }}
```

## Adattamenti comuni

- **Repository secret**: disponibile ai workflow del repository, salvo limitazioni evento.
- **Environment secret**: disponibile solo se il job usa quell'environment.
- **Organization secret**: disponibile solo ai repository autorizzati.
- **Fork pull request**: secrets generalmente non disponibili per sicurezza.
- **OIDC**: preferibile a secret statici quando il provider lo supporta.

## Debug rapido

- Se il secret e vuoto, controlla maiuscole/minuscole nel nome.
- Se un environment secret non appare, manca `environment:` nel job.
- Se il problema avviene solo su fork, e probabilmente una limitazione di sicurezza.
- Se un token esterno viene rifiutato, controlla scadenza, scope e rotazione.
- Se hai stampato un secret, consideralo compromesso e ruotalo.
- Se un valore non e sensibile, usa variables invece di secrets.

## Checklist finale

- Nome secret corretto.
- Ambito corretto.
- Environment dichiarato se necessario.
- Fork e evento controllati.
- Secret non stampato nei log.
- Token esterno valido.
- OIDC valutato.
- Secret compromessi revocati.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Gestire secrets in GitHub Actions]]
- [[Variabili e secrets GitHub Actions]]
- [[Environments GitHub Actions]]
- [[OIDC GitHub Actions]]
- [[Secret scanning]]
- [[Sicurezza dei token GitHub]]
- [[Troubleshooting permissions GitHub Actions]]
- [[Troubleshooting GitHub Actions]]

## Fonti

- [GitHub Docs - Using secrets in GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
