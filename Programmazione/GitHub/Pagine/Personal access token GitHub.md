---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, token, pat, autenticazione]
aliases: [Personal access token GitHub, PAT GitHub]
prerequisites: [GitHub]
related: [Fine-grained token GitHub, GitHub REST API, GitHub Apps, Sicurezza dei token GitHub]
---

# Personal access token GitHub

## Sintesi

Un **personal access token** e una credenziale che permette di autenticarsi a GitHub dalla riga di comando, da script o tramite API. Sostituisce la password in contesti tecnici, ma va trattato come un segreto.

Per molte automazioni moderne conviene preferire `GITHUB_TOKEN`, GitHub Apps o fine-grained token, invece di usare token classici troppo ampi.

## Quando usarlo

Usalo quando:

- devi autenticare uno script locale;
- devi chiamare la REST API o GraphQL API;
- GitHub CLI o Git Credential Manager non bastano;
- non puoi usare `GITHUB_TOKEN`;
- non hai ancora una GitHub App;
- serve accesso temporaneo controllato.

## Come funziona

GitHub supporta due famiglie principali:

- **fine-grained personal access tokens**;
- **personal access tokens classic**.

Il token agisce con i permessi dell'utente che lo ha creato, ma limitati da scope o permessi selezionati. Non puo dare privilegi che l'utente non possiede.

Per automazioni stabili di organizzazione, una GitHub App e spesso piu adatta.

## API / Sintassi

Uso in una richiesta API:

```bash
curl \
  -H "Authorization: Bearer TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user
```

Uso con Git:

```text
username: tuo-username
password: personal-access-token
```

## Esempio pratico

Uno script locale che legge issue private puo usare un token con permesso `issues: read` o scope equivalente:

```bash
curl \
  -H "Authorization: Bearer TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/OWNER/REPO/issues?state=open"
```

Il token deve stare in un secret manager, variabile d'ambiente o strumento sicuro, non nel codice.

## Varianti

- **Fine-grained token**: piu controllabile, legato a owner e repository specifici.
- **Classic token**: piu ampio, utile solo quando una feature non supporta fine-grained token.
- **GITHUB_TOKEN**: token automatico dentro GitHub Actions.
- **GitHub App token**: consigliato per integrazioni persistenti.
- **GitHub CLI auth**: spesso evita di gestire manualmente token.

## Errori comuni

- Salvare token nel repository.
- Dare accesso a tutti i repository senza bisogno.
- Non impostare scadenza.
- Usare un token personale per un bot aziendale.
- Stampare token nei log.
- Non revocare token non piu usati.

## Checklist

- Serve davvero un PAT?
- Si puo usare `GITHUB_TOKEN` o GitHub App?
- Il token ha scadenza?
- I permessi sono minimi?
- Il token e conservato fuori dal codice?
- Esiste una procedura di rotazione e revoca?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub REST API]]
- [[GitHub GraphQL API]]
- [[Fine-grained token GitHub]]
- [[GitHub Apps]]
- [[GitHub CLI]]
- [[Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
