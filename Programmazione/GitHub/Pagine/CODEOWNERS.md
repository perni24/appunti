---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - codeowners
  - review
  - permessi
aliases:
  - CODEOWNERS
  - Code owners
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Review code su GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Review code su GitHub]]"
title: CODEOWNERS
---

# CODEOWNERS

## Sintesi

`CODEOWNERS` e un file GitHub che associa percorsi del repository a persone o team responsabili. Quando una pull request modifica quei percorsi, GitHub puo richiedere automaticamente review dai code owner.

Serve a evitare che modifiche critiche entrino senza revisione di chi conosce quella parte del sistema.

## Quando usarlo

Usa `CODEOWNERS` quando:

- il repository ha piu aree tecniche;
- alcune cartelle richiedono review specialistica;
- lavori con team diversi;
- vuoi review automatica per sicurezza, deploy o database;
- vuoi rendere chiara la responsabilita del codice;
- vuoi collegare review richieste alle regole del branch.

## Come funziona

Il file `CODEOWNERS` puo stare in posizioni convenzionali come:

```text
CODEOWNERS
.github/CODEOWNERS
docs/CODEOWNERS
```

Le regole mappano pattern di file a utenti o team.

```text
*.md @example-org/docs-team
/src/auth/ @example-org/security-team
/.github/workflows/ @example-org/devops-team
```

Prevale l'ultima regola corrispondente, non automaticamente quella piu specifica. Metti i fallback prima delle eccezioni. Se esistono piu file, GitHub usa il primo trovato nell'ordine `.github/`, radice, `docs/`, senza unirli.

## API / Sintassi

Esempio:

```text
# Owner globale
* @example-org/owner-team

# Documentazione
/docs/ @example-org/docs-team

# Workflow CI/CD
/.github/workflows/ @example-org/devops-team

# Area autenticazione
/src/auth/ @example-org/security-team
```

Sostituisci `example-org` e i team con nomi reali. Un utente si indica con `@username`, un team con `@organizzazione/team`: `@docs-team` da solo identifica un eventuale utente, non un team.

Gli owner devono avere accesso `write`. Un team deve inoltre essere visibile e avere accesso di scrittura esplicito al repository; non basta che lo abbiano i singoli membri. Owner inesistenti o senza permessi adeguati non vengono assegnati.

## Esempio pratico

Se una PR modifica:

```text
.github/workflows/release.yml
```

e il file contiene:

```text
/.github/workflows/ @example-org/devops-team
```

GitHub richiede automaticamente review a `@example-org/devops-team` sulle PR non draft. Il file utilizzato e quello del branch di destinazione. Per rendere obbligatoria l'approvazione devi anche configurare la protezione del branch o un ruleset: la sola assegnazione non blocca il merge.

## Varianti

- **Owner globale**: fallback per tutto il repository.
- **Owner per cartella**: team responsabili per area.
- **Owner per estensione**: utile per docs o config.
- **Owner per file critico**: workflow, deploy, security policy.
- **Team owner**: preferibile a utenti singoli in repository condivisi.

## Errori comuni

- Usare utenti singoli invece di team stabili.
- Non dare accesso al team indicato.
- Creare regole troppo generiche.
- Dimenticare aree critiche come workflow e configurazioni.
- Non allineare `CODEOWNERS` con branch protection.
- Lasciare owner non piu attivi.

## Checklist

- Le aree critiche hanno owner?
- Gli utenti hanno accesso `write` e i team sono visibili con accesso `write` esplicito?
- I team sono preferiti agli utenti singoli?
- Le regole sono leggibili?
- Le review dei code owner sono richieste sulle branch protette?
- Il file viene aggiornato quando cambia ownership?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]

## Fonti

- [GitHub Docs - About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
