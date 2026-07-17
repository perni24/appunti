---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, git, conventional-commits, changelog]
aliases: [Conventional commits su GitHub, Conventional Commits]
prerequisites: [Commit e cronologia su GitHub]
related: [Commit e cronologia su GitHub, Pull request]
---

# Conventional commits su GitHub

## Sintesi

**Conventional Commits** e una convenzione per scrivere messaggi di commit strutturati. Su GitHub aiuta a leggere la history, generare changelog, automatizzare release e distinguere feature, fix e breaking change.

Non e obbligatoria per usare GitHub, ma diventa utile quando il progetto cresce o pubblica versioni.

## Quando usarlo

Usalo quando:

- vuoi una cronologia coerente;
- generi changelog automatici;
- fai release frequenti;
- lavori in team;
- vuoi distinguere fix, feature e refactor;
- vuoi integrare automazioni di versionamento.

## Come funziona

Il formato tipico e:

```text
tipo(scope): descrizione breve
```

Esempi:

```text
feat(auth): aggiunge login con token
fix(api): gestisce risposta 404
docs(readme): aggiorna istruzioni setup
refactor(ui): semplifica form utente
```

Il tipo comunica la natura del cambiamento. Lo scope indica l'area. La descrizione spiega cosa cambia.

## API / Sintassi

Tipi comuni:

```text
feat      nuova funzionalita
fix       correzione bug
docs      documentazione
style     stile senza cambio logico
refactor  refactor senza cambio comportamento
test      test
chore     manutenzione
ci        pipeline e automazione
build     build system o dipendenze
```

Breaking change:

```text
feat(api)!: cambia formato risposta utenti
```

Oppure:

```text
BREAKING CHANGE: il campo `name` diventa `displayName`.
```

## Esempio pratico

Commit poco informativo:

```text
update
```

Commit convenzionale:

```text
fix(auth): gestisce token scaduti durante refresh pagina
```

Il secondo aiuta review, ricerca nella history e generazione changelog.

## Varianti

- **Conventional Commits rigoroso**: validato da CI.
- **Uso leggero**: usato come linea guida senza blocchi automatici.
- **Squash PR con titolo convenzionale**: un commit finale pulito per pull request.
- **Scope per area tecnica**: `api`, `ui`, `db`, `docs`.
- **Scope per package**: utile nei monorepo.

## Errori comuni

- Usare `feat` per ogni modifica.
- Mettere descrizioni vaghe.
- Cambiare tipo in modo incoerente.
- Usare scope troppo casuali.
- Applicare la convenzione solo ad alcuni commit.
- Bloccare la CI per regole troppo rigide in progetti piccoli.

## Checklist

- Il tipo descrive la natura della modifica?
- Lo scope e utile e coerente?
- La descrizione e specifica?
- Le breaking change sono evidenziate?
- Il titolo della pull request segue la stessa convenzione se si usa squash?
- Le automazioni di release leggono il formato atteso?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Commit e cronologia su GitHub]]
- [[Pull request]]
- [[Merge squash e rebase su GitHub]]

## Fonti

- [Conventional Commits - Specification](https://www.conventionalcommits.org/en/v1.0.0/)
