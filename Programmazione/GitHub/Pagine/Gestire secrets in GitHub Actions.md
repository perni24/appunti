---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-actions
  - secrets
  - sicurezza
  - procedura
aliases:
  - Gestire secrets in GitHub Actions
  - Gestione secrets GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Variabili e secrets GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Environments GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/OIDC GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Secret scanning]]"
title: Gestire secrets in GitHub Actions
---

# Gestire secrets in GitHub Actions

## Obiettivo

Fornire una credenziale **solo al job e allo step che ne hanno bisogno**, senza commetterla, stamparla nei log o copiarla nella cronologia della shell. Per il normale deploy Pages del vault non serve creare un token personale: il workflow usa i permessi previsti da GitHub.

## Scegliere la credenziale

| Necessità | Scelta |
| --- | --- |
| Preferenza non riservata, come il nome di una regione | Variabile di configurazione (`vars`), non secret. |
| Operazione GitHub nello stesso repository | Valutare prima `GITHUB_TOKEN` con i soli permessi necessari. |
| Accesso a un provider che supporta OIDC | Preferire credenziali temporanee: il provider deve fidarsi solo dei repository, branch o environment previsti. `id-token: write` consente di richiedere l'identità, non concede di per sé accesso alle risorse cloud. |
| Servizio esterno che accetta solo un token statico | Creare un token con privilegi minimi sul servizio e salvarlo nel più ristretto ambito GitHub adatto. |

## Procedura: esempio con un environment

1. Preparare l'environment `staging` nel repository di prova. Per la produzione scegliere un environment distinto e, se disponibili e appropriati, regole di protezione e revisori. I secret di repository hanno ambito più ampio; per quelli di organizzazione limitare i repository autorizzati.
2. Da un terminale interattivo autenticato, sostituire `OWNER/REPO` e impostare il secret **al prompt**, non con il valore in chiaro sulla riga di comando. L'operazione scrive o sostituisce il valore remoto; per la prova è sufficiente un valore fittizio.

```bash
gh secret set API_TOKEN --env staging --repo OWNER/REPO
```

3. Verificare il **nome** nell'environment giusto. L'elenco non rivela il valore, né dimostra che la credenziale sia valida sul servizio esterno.

```bash
gh secret list --env staging --repo OWNER/REPO
```

4. In un workflow avviato manualmente da una revisione fidata, usare un job come questo **frammento sotto `jobs`**. La verifica non contatta il servizio e non legge codice dal repository; non serve checkout.

```yaml
verifica:
  runs-on: ubuntu-latest
  environment: staging
  permissions: {}
  steps:
    - name: Verifica la presenza del token
      shell: pwsh
      env:
        API_TOKEN: ${{ secrets.API_TOKEN }}
      run: |
        if ([string]::IsNullOrWhiteSpace($env:API_TOKEN)) {
          throw "API_TOKEN non disponibile per questo job"
        }
        Write-Output "Credenziale presente"
```

In un job di deploy reale assegnare il secret allo **step che usa il client**. Non passa automaticamente da uno step al successivo tramite quell'`env`. Un controllo di presenza verde non verifica scadenza, autorizzazioni o autenticazione esterna.

## Debug e rotazione

- **Valore vuoto:** un secret non impostato si risolve in una stringa vuota. Controllare nome, environment del job ed eventuali approvazioni. I normali workflow `pull_request` da fork non ricevono gli Actions secrets del repository base; un workflow riutilizzabile non li riceve automaticamente.
- **Token presente, servizio risponde con errore:** verificare scadenza e privilegi presso il servizio. Modificare `permissions` di `GITHUB_TOKEN` non amplia i privilegi del token esterno.
- **Rotazione programmata:** creare la nuova credenziale presso il servizio, aggiornare il secret, provare l'operazione minima prevista e revocare la vecchia. Eliminare da GitHub un secret non più usato non lo revoca presso l'emittente.
- **Possibile esposizione:** revocare o ruotare subito presso l'emittente, poi gestire log e copie esposte. Il mascheramento dei log non sostituisce la revoca.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Variabili e secrets GitHub Actions|Variabili e secrets GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Environments GitHub Actions|Environments GitHub Actions]]
- [[Programmazione/GitHub/Pagine/OIDC GitHub Actions|OIDC GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Secret scanning|Secret scanning]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs: ambiti, limiti e uso dei secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [GitHub CLI: gh secret set](https://cli.github.com/manual/gh_secret_set)
- [GitHub CLI: gh secret list](https://cli.github.com/manual/gh_secret_list)
- [GitHub Docs: OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
