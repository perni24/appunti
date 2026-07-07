---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, codeowners, review, permessi]
aliases: [CODEOWNERS, Code owners]
prerequisites: [Pull request, Review code su GitHub]
related: [Pull request, Review code su GitHub]
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
*.md @docs-team
/src/auth/ @security-team
/.github/workflows/ @devops-team
```

Le regole piu specifiche dovrebbero essere messe con attenzione, perche l'ordine e i pattern influenzano chi viene richiesto in review.

## API / Sintassi

Esempio:

```text
# Owner globale
* @owner-team

# Documentazione
/docs/ @docs-team

# Workflow CI/CD
/.github/workflows/ @devops-team

# Area autenticazione
/src/auth/ @security-team
```

Team e utenti devono avere accesso al repository per essere usati come owner.

## Esempio pratico

Se una PR modifica:

```text
.github/workflows/release.yml
```

e il file contiene:

```text
/.github/workflows/ @devops-team
```

GitHub richiede automaticamente review a `@devops-team`.

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
- Gli owner hanno accesso al repository?
- I team sono preferiti agli utenti singoli?
- Le regole sono leggibili?
- Le review dei code owner sono richieste sulle branch protette?
- Il file viene aggiornato quando cambia ownership?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Pull request]]
- [[Review code su GitHub]]
- [[Repository GitHub]]

## Fonti

- [GitHub Docs - About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
