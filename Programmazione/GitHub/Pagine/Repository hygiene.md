---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, repository, manutenzione, hygiene]
aliases: [Repository hygiene, Igiene repository GitHub]
prerequisites: [Repository GitHub, README LICENSE e gitignore]
related: [Governance repository GitHub, Template organizzativi GitHub, Archiviazione repository GitHub]
---

# Repository hygiene

## Sintesi

La **repository hygiene** e la manutenzione ordinaria che mantiene un repository comprensibile, sicuro e usabile. Include documentazione, file standard, pulizia di branch, issue, dipendenze, release e impostazioni.

Non e un'attivita una tantum: e una routine per evitare che il repository diventi difficile da leggere, automatizzare o trasferire.

## Quando usarlo

Serve quando:

- il repository contiene codice usato davvero;
- nuovi contributor devono orientarsi;
- issue e branch crescono senza controllo;
- release e tag sono confusi;
- ci sono dipendenze obsolete;
- il README non descrive piu lo stato reale;
- il progetto rischia di sembrare abbandonato.

## Come funziona

Una buona igiene riguarda:

- README aggiornato;
- LICENSE e `.gitignore` corretti;
- issue e pull request chiuse o etichettate;
- branch vecchi rimossi;
- dipendenze monitorate;
- release e tag coerenti;
- security file e disclosure policy;
- repository description e topics aggiornati.

L'obiettivo e ridurre attrito: chi apre il repository deve capire cosa fa, come usarlo, come contribuire e qual e lo stato del progetto.

## API / Sintassi

Checklist periodica:

```text
README aggiornato
issue triage
branch obsoleti rimossi
release coerenti
dipendenze controllate
security features attive
topics e descrizione aggiornati
```

## Esempio pratico

Routine mensile:

```text
1. controlla issue senza label
2. chiudi branch merged
3. verifica Dependabot alerts
4. aggiorna README se il setup e cambiato
5. controlla release draft o obsolete
6. archivia repository non piu mantenuti
```

## Varianti

- **Hygiene open source**: focus su community file, issue e contributor.
- **Hygiene interna**: focus su accessi, CI, ownership e release.
- **Hygiene sicurezza**: focus su secret scanning, code scanning e dipendenze.
- **Hygiene archivio**: focus su README finale, chiusura issue e archiviazione.

## Errori comuni

- Tenere branch vecchi senza motivo.
- Lasciare issue aperte senza triage.
- Non aggiornare README dopo cambi di setup.
- Usare release senza tag coerenti.
- Non indicare che un progetto e non mantenuto.
- Duplicare template e policy tra repository invece di centralizzarli.

## Checklist

- Il README spiega stato e setup attuali?
- Ci sono branch obsoleti?
- Le issue hanno label e priorita?
- Le dipendenze hanno alert gestiti?
- Le release hanno tag e note leggibili?
- I file di community sono presenti?
- I repository inattivi sono archiviati o dichiarati?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[README LICENSE e gitignore]]
- [[Issues GitHub]]
- [[Labels milestones e assignees]]
- [[Dependabot]]
- [[Secret scanning]]
- [[Code scanning]]
- [[Governance repository GitHub]]
- [[Archiviazione repository GitHub]]

## Fonti

- [GitHub Docs - Best practices for repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories)
