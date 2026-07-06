---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, discussions, community, collaborazione]
aliases: [Discussions GitHub, GitHub Discussions]
prerequisites: [GitHub, Repository GitHub]
related: [Issues GitHub, Pull request]
---

# Discussions GitHub

## Sintesi

**GitHub Discussions** e uno spazio per conversazioni non necessariamente legate a un bug o a una modifica immediata. Serve per domande, idee, annunci, supporto, proposte e confronto della community.

La distinzione importante e: una issue deve portare a un lavoro tracciabile; una discussion puo essere esplorativa.

## Quando usarlo

Usa Discussions quando:

- vuoi raccogliere domande ricorrenti;
- vuoi discutere idee prima di aprire issue;
- hai una community attiva;
- vuoi separare supporto e bug reali;
- vuoi pubblicare annunci o decisioni;
- vuoi evitare che le issue diventino forum generici.

## Come funziona

Le discussioni sono organizzate in categorie. Una categoria puo essere pensata per:

- domande;
- idee;
- annunci;
- showcase;
- supporto;
- decisioni.

Una discussion puo essere convertita in issue quando emerge un lavoro concreto.

## API / Sintassi

Esempio di categorie:

```text
Q&A
Ideas
Announcements
Show and tell
Support
```

Schema per una proposta:

```md
## Contesto

## Proposta

## Alternative

## Rischi
```

## Esempio pratico

Una persona chiede:

```text
Come posso usare il progetto con PostgreSQL invece di SQLite?
```

Se e una domanda, resta Discussion. Se emerge che manca documentazione ufficiale, si apre una issue:

```text
Documentare configurazione PostgreSQL
```

## Varianti

- **Q&A**: domande e risposte.
- **Ideas**: proposte iniziali.
- **Announcements**: comunicazioni dei maintainer.
- **Support**: aiuto non necessariamente bug.
- **Decision log leggero**: discussione prima di formalizzare issue o PR.

## Errori comuni

- Usare Discussions per bug riproducibili.
- Lasciare decisioni importanti sepolte senza issue o documentazione.
- Non moderare categorie e tag.
- Rispondere in modo dispersivo senza chiudere la domanda.
- Duplicare discussioni gia presenti.
- Non convertire in issue quando nasce lavoro concreto.

## Checklist

- La conversazione e esplorativa o e gia un task?
- Esiste gia una discussion simile?
- La categoria scelta e corretta?
- La risposta finale e chiara?
- Serve aprire una issue collegata?
- Una decisione importante va documentata altrove?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Issues GitHub]]
- [[Pull request]]
- [[Repository GitHub]]
