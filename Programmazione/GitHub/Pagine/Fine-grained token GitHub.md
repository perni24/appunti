---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, token, fine-grained-token, autenticazione]
aliases: [Fine-grained token GitHub, Fine-grained personal access token]
prerequisites: [Personal access token GitHub]
related: [Personal access token GitHub, GitHub REST API, GitHub Apps, Sicurezza dei token GitHub]
---

# Fine-grained token GitHub

## Sintesi

Un **fine-grained token GitHub** e un personal access token con permessi piu specifici rispetto ai token classic. Puo essere limitato a un owner, a repository selezionati e a singoli permessi.

E la scelta preferibile quando serve un token personale ma vuoi ridurre il raggio d'azione.

## Quando usarlo

Usalo quando:

- devi chiamare API GitHub con accesso limitato;
- vuoi dare accesso solo ad alcuni repository;
- vuoi evitare token classic troppo ampi;
- vuoi indicare permessi come `contents: read` o `pull_requests: write`;
- l'endpoint che ti serve supporta fine-grained PAT;
- l'organizzazione permette o approva questo tipo di token.

## Come funziona

Durante la creazione scegli:

- nome e descrizione;
- scadenza;
- resource owner;
- repository access;
- permessi repository, organization o account;
- eventuale richiesta di approvazione organizzativa.

Ogni endpoint REST indica se supporta fine-grained token e quali permessi richiede. Questa verifica va fatta sull'endpoint specifico, non solo sulla categoria generale.

## API / Sintassi

Esempio concettuale di permessi:

```text
Repository access: Only selected repositories
Permissions:
  Contents: read
  Issues: write
  Pull requests: write
```

Uso con API:

```bash
curl \
  -H "Authorization: Bearer FINE_GRAINED_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/OWNER/REPO/issues
```

## Esempio pratico

Per uno script che apre issue in un solo repository:

```text
Repository access: selected repository
Permissions:
  Issues: write
  Metadata: read
Expiration: 30 giorni
```

Non serve un token classic con accesso a tutti i repository personali o di organizzazione.

## Varianti

- **Token read-only**: utile per report e audit.
- **Token write su issue**: utile per bot semplici.
- **Token write su pull request**: utile per automazioni di PR.
- **Token con repository selezionati**: preferibile per sicurezza.
- **Token classic**: fallback quando una feature non e ancora supportata.
- **GitHub App**: migliore per automazioni lunghe e condivise.

## Errori comuni

- Presumere che tutti gli endpoint supportino fine-grained token.
- Dare accesso a tutti i repository senza motivo.
- Impostare scadenza troppo lunga.
- Non gestire approvazione richiesta dall'organizzazione.
- Confondere permessi repository e permessi organizzazione.
- Usare token personali per processi di produzione.

## Checklist

- L'endpoint supporta fine-grained token?
- Sono stati scelti solo i repository necessari?
- I permessi sono minimi?
- La scadenza e breve?
- L'organizzazione deve approvare il token?
- Per automazioni ricorrenti sarebbe meglio una GitHub App?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Personal access token GitHub]]
- [[GitHub REST API]]
- [[GitHub GraphQL API]]
- [[GitHub Apps]]
- [[Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub Docs - Fine-grained PAT permissions](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)
