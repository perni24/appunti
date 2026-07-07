---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, organizzazioni, team, permessi]
aliases: [Organizzazioni e team GitHub, GitHub Organizations, GitHub Teams]
prerequisites: [Accessi ruoli e permessi GitHub]
related: [Accessi ruoli e permessi GitHub, CODEOWNERS]
---

# Organizzazioni e team GitHub

## Sintesi

Le **organizzazioni GitHub** raggruppano repository, persone, team e policy. I **team** permettono di gestire permessi e responsabilita in modo collettivo invece di assegnare accessi utente per utente.

Sono fondamentali quando il lavoro supera il progetto personale e diventa collaborazione strutturata.

## Quando usarlo

Usa organizzazioni e team quando:

- hai piu repository collegati;
- lavori con piu persone;
- vuoi accessi centralizzati;
- vuoi CODEOWNERS basato su team;
- vuoi policy comuni per sicurezza e Actions;
- vuoi separare ruoli come frontend, backend, devops o security.

## Come funziona

Una organizzazione puo contenere:

- repository;
- membri;
- team;
- ruoli;
- policy;
- secret e variabili a livello organizzazione;
- GitHub Apps;
- settings di sicurezza.

Un team puo avere accesso a repository e puo essere menzionato o usato in `CODEOWNERS`.

## API / Sintassi

Esempio di struttura:

```text
org: acme
  team: frontend
  team: backend
  team: devops
  team: security
```

Esempio CODEOWNERS con team:

```text
/apps/web/ @acme/frontend
/apps/api/ @acme/backend
/.github/workflows/ @acme/devops
```

## Esempio pratico

Repository `app` dentro organizzazione:

- `frontend`: write su `apps/web`;
- `backend`: write su `apps/api`;
- `devops`: owner dei workflow;
- `security`: review richiesta su autenticazione e secret.

Gli accessi vengono gestiti aggiungendo o rimuovendo persone dai team, non modificando ogni repository manualmente.

## Varianti

- **Organizzazione piccola**: pochi repository e team essenziali.
- **Organizzazione aziendale**: policy, audit e ruoli piu rigorosi.
- **Team funzionale**: frontend, backend, devops.
- **Team di ownership**: responsabile di un package o dominio.
- **Team temporaneo**: utile per progetto o migrazione.

## Errori comuni

- Gestire accessi solo con utenti singoli.
- Creare troppi team senza responsabilita reale.
- Non rimuovere membri non piu attivi.
- Usare team come gruppi sociali invece che permessi operativi.
- Non allineare team, CODEOWNERS e branch protection.
- Dare policy diverse a repository simili senza motivo.

## Checklist

- I team rappresentano responsabilita reali?
- Gli accessi sono gestiti tramite team?
- CODEOWNERS usa team stabili?
- I membri inattivi vengono rimossi?
- Le policy organizzative sono documentate?
- I repository critici hanno ownership chiara?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Accessi ruoli e permessi GitHub]]
- [[CODEOWNERS]]
- [[Repository settings]]
- [[Monorepo su GitHub]]

## Fonti

- [GitHub Docs - About organizations](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/about-organizations)
- [GitHub Docs - About teams](https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams)
