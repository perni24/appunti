---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [github, repository, migrazione, manutenzione]
aliases: [Migrazione repository GitHub, Migrare repository GitHub]
prerequisites: [Repository GitHub, GitHub REST API]
related: [Archiviazione repository GitHub, Governance repository GitHub, Repository settings]
---

# Migrazione repository GitHub

## Sintesi

La **migrazione di un repository GitHub** sposta codice, storico e metadati da un contesto a un altro: tra account, organizzazioni, piattaforme Git o prodotti GitHub. Puo essere semplice come trasferire un repository, oppure complessa come migrare molte repository con issue, pull request, utenti e permessi.

La parte critica non e solo il codice Git: sono permessi, automazioni, secret, release, package, Pages, issue e integrazioni.

## Quando usarlo

Serve migrare quando:

- un progetto passa da account personale a organizzazione;
- un team cambia organizzazione GitHub;
- si passa da un altro host Git a GitHub;
- si consolida un monorepo o si divide un repository;
- si migra da GitHub Enterprise Server a GitHub Enterprise Cloud;
- si vuole trasferire ownership senza perdere storico.

## Come funziona

I casi principali sono:

- **transfer repository**: sposta un repository a un nuovo owner GitHub;
- **mirror push**: copia solo repository Git e cronologia;
- **GitHub Importer**: importa codice da altro host Git;
- **GitHub Enterprise Importer**: migrazioni enterprise con piu metadati;
- **backup o archive**: non sempre ripristinabile come migrazione completa.

Prima di migrare devi mappare cosa deve essere conservato: codice, issue, PR, release, wiki, Actions, secrets, Pages, package, team, branch protection e webhook.

## API / Sintassi

Aggiornare remote dopo transfer:

```bash
git remote set-url origin https://github.com/NEW_OWNER/REPOSITORY.git
```

Mirror clone per copia Git:

```bash
git clone --mirror https://github.com/OLD_OWNER/REPOSITORY.git
cd REPOSITORY.git
git push --mirror https://github.com/NEW_OWNER/REPOSITORY.git
```

## Esempio pratico

Migrazione da account personale a organizzazione:

```text
1. verifica permessi nell'organizzazione
2. controlla nome repository disponibile
3. salva elenco secret, webhook e deploy key
4. trasferisci repository
5. aggiorna remote locali
6. verifica Actions, Pages, package e branch protection
7. aggiorna documentazione e link
```

## Varianti

- **Transfer GitHub -> GitHub**: conserva molti metadati e redirect.
- **Mirror Git**: conserva cronologia Git, ma non issue e PR.
- **Import da altra piattaforma**: dipende dal tool disponibile.
- **Migrazione enterprise**: richiede pianificazione, mapping utenti e log.
- **Migrazione con archiviazione**: vecchio repository archiviato e nuovo repository attivo.

## Errori comuni

- Pensare che Git contenga anche issue, PR e release.
- Non aggiornare `origin` nei clone locali.
- Non controllare GitHub Pages e custom domain.
- Dimenticare secrets, webhook e deploy key.
- Non verificare branch protection nel nuovo owner.
- Trasferire senza comunicare il cambio agli utenti.

## Checklist

- Hai deciso cosa deve essere migrato?
- Il nuovo owner puo ricevere il repository?
- Nome repository e fork network sono compatibili?
- Remote locali e documentazione verranno aggiornati?
- Secret, Actions, Pages e package sono verificati?
- Issue, PR e release sono preservate o esportate?
- Il vecchio repository va archiviato o lasciato con redirect?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[Remote origin e upstream]]
- [[Repository settings]]
- [[Archiviazione repository GitHub]]
- [[GitHub REST API]]
- [[GitHub Actions]]

## Fonti

- [GitHub Docs - Transferring a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)
- [GitHub Docs - Migrations](https://docs.github.com/en/migrations)
