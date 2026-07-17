---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, repository, archiviazione, manutenzione]
aliases: [Archiviazione repository GitHub, Archiviare repository GitHub]
prerequisites: [Repository GitHub, Repository hygiene]
related: [Governance repository GitHub, Migrazione repository GitHub, Repository settings]
---

# Archiviazione repository GitHub

## Sintesi

L'**archiviazione di un repository GitHub** rende il repository read-only e segnala che non e piu mantenuto attivamente. E utile per preservare codice, issue, release e storico senza continuare a ricevere contributi come se il progetto fosse attivo.

Archiviare non significa cancellare: significa congelare lo stato del progetto.

## Quando usarlo

Archivia un repository quando:

- il progetto e concluso;
- il codice e sostituito da un nuovo repository;
- non ci sono piu manutentori;
- il repository resta utile come riferimento storico;
- vuoi evitare nuove issue e pull request operative;
- vuoi comunicare chiaramente che non ci saranno aggiornamenti.

## Come funziona

Un repository archiviato diventa read-only per codice, issue, pull request, wiki, release, branch, tag, label, milestone, progetti, commenti e permessi. Per modificarlo bisogna prima disarchiviarlo.

Prima di archiviare conviene:

- chiudere o commentare issue e pull request;
- aggiornare README e descrizione;
- indicare repository sostitutivo, se esiste;
- salvare backup se serve;
- controllare release e tag;
- verificare implicazioni su Pages, package, Actions o integrazioni.

## API / Sintassi

Checklist pre-archiviazione:

```text
README aggiornato
descrizione aggiornata
issue e PR gestite
link al nuovo repository se esiste
backup valutato
release e tag controllati
repository archiviato da Settings > Danger Zone
```

## Esempio pratico

README finale:

```md
# Nome progetto

> Repository archiviato. Il progetto non e piu mantenuto.

Nuovo repository: https://github.com/org/nuovo-progetto
Ultima versione stabile: v1.4.2
```

Questo evita che utenti o LLM interpretino il progetto come ancora attivo.

## Varianti

- **Archiviazione semplice**: repository personale o demo conclusa.
- **Archiviazione con migrazione**: indica il nuovo repository.
- **Archiviazione storica**: conserva release e tag come riferimento.
- **Disarchiviazione temporanea**: solo per correggere metadati o sicurezza.
- **Backup prima dell'archiviazione**: utile per requisiti interni o disaster recovery.

## Errori comuni

- Archiviare senza spiegare perche.
- Lasciare issue critiche senza risposta.
- Non indicare il repository successore.
- Confondere archiviazione e cancellazione.
- Non considerare backup o Git LFS.
- Non controllare integrazioni che puntano ancora al repository.

## Checklist

- Il README dichiara lo stato del progetto?
- La descrizione del repository e aggiornata?
- Issue e pull request sono state gestite?
- Esiste un link al successore?
- Release e tag sono ordinati?
- Serve un backup?
- Le integrazioni esterne sono state aggiornate?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[Repository settings]]
- [[Repository hygiene]]
- [[Migrazione repository GitHub]]
- [[Gestione release su GitHub]]

## Fonti

- [GitHub Docs - Archiving repositories](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories)
- [GitHub Docs - Backing up a repository](https://docs.github.com/en/repositories/archiving-a-github-repository/backing-up-a-repository)
