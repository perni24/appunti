---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - git
  - tag
  - versioning
  - changelog
aliases:
  - Tag versioni e changelog
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Git e GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Gestione release su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Protected tags]]"
  - "[[Programmazione/GitHub/Pagine/Conventional commits su GitHub]]"
title: Tag, versioni e changelog
---

# Tag, versioni e changelog

## Sintesi

La **versione** comunica compatibilità, il **tag** identifica il codice e il **changelog** spiega cosa cambia per chi aggiorna. Nessuno dei tre pubblica automaticamente una release o esegue un deploy.

## Scegliere il numero di versione

Prima di applicare Semantic Versioning, definire l'interfaccia pubblica: può includere API, opzioni CLI o variabili di configurazione documentate. Ecco tre cambiamenti alternativi a partire dalla versione stabile `1.4.2`:

| Modifica | Versione | Motivo |
| --- | --- | --- |
| Correggere la lettura dell'URL senza cambiare la configurazione supportata | `1.4.3` | Patch compatibile. |
| Introdurre `API_URL` continuando ad accettare `OLD_API_URL` e dichiarare la vecchia forma deprecata | `1.5.0` | Funzionalità compatibile e deprecazione esplicita. |
| Smettere di accettare la variabile pubblica `OLD_API_URL` | `2.0.0` | Un'installazione prima valida non funziona più: modifica incompatibile. |

Il prefisso `v` nel tag `v2.0.0` è una convenzione Git: il numero SemVer è `2.0.0`. Un progetto può scegliere versioni a calendario, ma in quel caso il numero non promette automaticamente le stesse regole di compatibilità.

## Esempio: preparare il changelog

Committare la voce di `CHANGELOG.md` **prima** di creare il tag se deve essere presente nei sorgenti della versione. Un elenco di commit o PR può essere il punto di partenza, non sostituisce le istruzioni di aggiornamento.

```md
## 2.0.0 - 2026-11-27

### Removed
- Rimossa la variabile di configurazione OLD_API_URL.

### Migrazione
- Rinominare OLD_API_URL in API_URL nella configurazione di deploy prima di aggiornare.
```

## Creare e controllare il tag

Un tag leggero è un riferimento; un **tag annotato** ha un oggetto proprio con autore del tag, data e messaggio. Nell'esempio si vuole marcare il commit attualmente in checkout. Controllarne l'identificativo e confrontarlo con il commit che ha superato la CI:

```bash
git rev-parse HEAD
```

Creare il tag annotato **nel clone locale**, solo dopo aver verificato commit e changelog:

```bash
git tag -a v2.0.0 -m "Release v2.0.0"
```

Risolvere il tag fino al commit. Confrontare questo valore, non l'identificativo dell'oggetto tag, con quello verificato:

```bash
git rev-parse "v2.0.0^{commit}"
```

Con permessi adeguati, pubblicare **solo quel tag** sul remoto (scrittura reale, che può attivare automazioni):

```bash
git push origin refs/tags/v2.0.0
```

## Errori da evitare

- `git tag --list` elenca i tag locali: la presenza in elenco non prova che un tag sia già su GitHub.
- Non spostare o riutilizzare un tag di release già pubblicato per «correggerlo»: chi lo ha scaricato può avere altro codice con lo stesso nome. Preferire una nuova versione e segnalare quella difettosa.
- La cancellazione di un tag remoto (`git push origin --delete refs/tags/NOME`) è un intervento eccezionale e distruttivo, non un rollback dei deploy o dei clone. Definire chi può creare, modificare o eliminare i tag di release.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]
- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub|Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Protected tags|Protected tags]]
- [[Programmazione/GitHub/Pagine/Conventional commits su GitHub|Conventional commits su GitHub]]
- [[Programmazione/GitHub/Pagine/Gestione release su GitHub|Gestione release su GitHub]]

## Fonti

- [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html)
- [Git: tag leggeri e annotati](https://git-scm.com/docs/git-tag)
- [Keep a Changelog: scrivere per chi aggiorna](https://keepachangelog.com/en/1.1.0/)
- [GitHub Docs: relazione tra tag e release](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
