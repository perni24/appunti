---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, token, security, authentication]
aliases: [Sicurezza dei token GitHub, Token GitHub, Personal access token]
prerequisites: [Accessi ruoli e permessi GitHub]
related: [Accessi ruoli e permessi GitHub, Secret scanning]
---

# Sicurezza dei token GitHub

## Sintesi

I token GitHub permettono ad applicazioni, script, CLI e automazioni di agire su GitHub. Sono credenziali: se vengono esposti, possono consentire accesso a codice, issue, package, Actions o impostazioni.

La regola base e usare token con permessi minimi, durata limitata e conservazione sicura.

## Quando usarlo

Studia la sicurezza dei token quando:

- usi GitHub CLI;
- configuri script locali;
- integri CI/CD;
- usi GitHub API;
- installi GitHub Apps;
- devi sostituire password o credenziali vecchie.

## Come funziona

GitHub supporta diversi meccanismi di accesso:

- personal access token classici;
- fine-grained personal access token;
- token generati da GitHub Actions;
- token di GitHub Apps;
- deploy key SSH;
- autenticazione SSH per Git.

Per automazioni moderne e preferibile evitare token personali ampi e usare identita con scope limitato.

## API / Sintassi

Esempio di uso token via variabile ambiente:

```bash
export GITHUB_TOKEN="..."
```

Chiamata API:

```bash
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/owner/repository
```

Controllare autenticazione GitHub CLI:

```bash
gh auth status
```

## Esempio pratico

Per uno script che legge issue:

1. crea token fine-grained;
2. limita accesso al solo repository;
3. concedi solo permessi necessari;
4. imposta scadenza;
5. salva il token in secret manager o variabile sicura;
6. revoca il token quando non serve piu.

## Varianti

- **Fine-grained PAT**: preferibile per scope limitati.
- **Classic PAT**: piu ampio, da usare con cautela.
- **GITHUB_TOKEN in Actions**: token automatico del workflow.
- **GitHub App token**: adatto a integrazioni installabili.
- **Deploy key**: accesso Git SSH a repository.
- **SSH key personale**: autenticazione Git da macchina locale.

## Errori comuni

- Salvare token in repository.
- Usare token personali in CI condivisa.
- Dare scope `repo` quando basta lettura limitata.
- Non impostare scadenza.
- Non revocare token dopo leak o cambio uso.
- Condividere token tra persone o progetti.

## Checklist

- Il token ha permessi minimi?
- Ha scadenza?
- E limitato ai repository necessari?
- E conservato fuori dal codice?
- Secret scanning e push protection sono attivi?
- Esiste una procedura di revoca e rotazione?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Accessi ruoli e permessi GitHub]]
- [[Secret scanning]]
- [[Repository settings]]

## Fonti

- [GitHub Docs - Managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
