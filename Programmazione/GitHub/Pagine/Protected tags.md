---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, tags, release, rulesets]
aliases: [Protected tags, Tag protetti GitHub]
prerequisites: [Repository GitHub]
related: [Repository rulesets]
---

# Protected tags

## Sintesi

I **protected tags** proteggono tag importanti, soprattutto quelli usati per release come `v1.0.0`. Impediscono creazione, modifica o cancellazione non autorizzata di tag che rappresentano versioni ufficiali.

I tag sono spesso usati da release automation e deploy: se vengono spostati o cancellati senza controllo, la tracciabilita delle versioni diventa fragile.

## Quando usarlo

Proteggi i tag quando:

- pubblichi release versionate;
- usi tag per triggerare deploy o release;
- vuoi impedire riscrittura di versioni;
- vuoi limitare chi puo creare tag `v*`;
- devi mantenere audit trail;
- il repository distribuisce pacchetti o artefatti.

## Come funziona

Un tag Git punta a un commit. Su GitHub puo essere usato per:

- release;
- changelog;
- artifact;
- package;
- deploy;
- workflow trigger.

Proteggere un pattern come `v*` significa applicare regole ai tag di versione:

```text
v1.0.0
v1.2.3
v2.0.0
```

## API / Sintassi

Creare un tag locale:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Tag annotato:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Eliminare tag remoto, operazione da proteggere:

```bash
git push origin --delete v1.0.0
```

## Esempio pratico

Policy per release:

```text
Pattern: v*
Create: release managers
Update: denied
Delete: denied
```

In questo modo una release pubblicata non viene riscritta casualmente.

## Varianti

- **Tag lightweight**: semplice puntatore a commit.
- **Tag annotato**: contiene messaggio, autore e metadata.
- **Tag semver**: `vMAJOR.MINOR.PATCH`.
- **Tag release candidate**: `v1.0.0-rc.1`.
- **Tag protetto via ruleset**: protezione centralizzata.

## Errori comuni

- Usare tag di release senza protezione.
- Spostare tag gia pubblicati.
- Cancellare tag usati da release o pacchetti.
- Non distinguere tag temporanei e tag ufficiali.
- Dare permesso di tag a troppe persone.
- Usare tag come branch permanenti.

## Checklist

- I tag di release seguono un pattern chiaro?
- I tag `v*` sono protetti?
- Solo persone o automazioni autorizzate possono creare release tag?
- Update e deletion sono bloccati?
- I workflow che usano tag sono documentati?
- La strategia di versionamento e chiara?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[Repository rulesets]]
- [[Conventional commits su GitHub]]

## Fonti

- [GitHub Docs - Protected tags](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-tags)
