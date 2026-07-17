---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, repository-settings, configurazione]
aliases: [Repository settings, Impostazioni repository GitHub]
prerequisites: [Repository GitHub, GitHub Web UI]
related: [Branch protection rules, Repository rulesets]
---

# Repository settings

## Sintesi

I **repository settings** controllano configurazione, permessi, feature abilitate, sicurezza, branch, Actions, Pages, webhook e integrazioni di un repository GitHub.

Sono una zona ad alto impatto: una modifica sbagliata puo aprire accessi, disabilitare protezioni o rompere automazioni.

## Quando usarlo

Intervieni nei settings quando:

- crei un repository condiviso;
- vuoi abilitare o disabilitare issue, wiki, discussions o projects;
- configuri branch protection o rulesets;
- gestisci Actions e Pages;
- imposti webhook o deploy key;
- controlli visibilita e permessi.

## Come funziona

La sezione `Settings` puo includere:

- general settings;
- access e collaborators;
- branches;
- rules;
- actions;
- security;
- webhooks;
- deploy keys;
- pages;
- environments;
- secrets e variables.

Le voci visibili dipendono da permessi, tipo di repository e funzionalita abilitate.

## API / Sintassi

Percorsi web tipici:

```text
https://github.com/owner/repository/settings
https://github.com/owner/repository/settings/branches
https://github.com/owner/repository/settings/actions
https://github.com/owner/repository/settings/secrets/actions
```

Aprire repository nel browser con GitHub CLI:

```bash
gh repo view --web
```

## Esempio pratico

Setup iniziale per repository condiviso:

1. definisci descrizione e topic;
2. abilita issue e pull request;
3. configura branch protection su `main`;
4. abilita GitHub Actions solo con permessi necessari;
5. configura secret richiesti;
6. controlla accessi e ruoli;
7. documenta policy principali nel README o in `CONTRIBUTING.md`.

## Varianti

- **Settings personali**: repository di un utente.
- **Settings organizzazione**: repository dentro org con policy ereditate.
- **Settings security**: scanning, alerts e advisories.
- **Settings Actions**: permessi e runner.
- **Settings Pages**: pubblicazione sito statico.
- **Settings webhooks**: integrazioni esterne.

## Errori comuni

- Modificare settings senza sapere impatto.
- Lasciare Actions con permessi troppo ampi.
- Non controllare accessi dopo cambio team.
- Disabilitare issue o PR senza avvisare.
- Non proteggere branch dopo aver creato il repo.
- Inserire secret in posti sbagliati o con nomi confusi.

## Checklist

- Le feature abilitate sono necessarie?
- Gli accessi sono minimi e aggiornati?
- Branch protection o rulesets sono configurati?
- Actions ha permessi adeguati?
- Secret e variables sono nominati chiaramente?
- Le modifiche ai settings critici sono documentate?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[GitHub Web UI]]
- [[Branch protection rules]]
- [[Repository rulesets]]

## Fonti

- [GitHub Docs - Managing repository settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings)
