---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - account
  - profilo
  - sicurezza
aliases:
  - Account GitHub
  - Profilo GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub]]"
title: Account GitHub e profilo sviluppatore
---

# Account GitHub e profilo sviluppatore

## Sintesi

Distingui **autore**, **account autenticato** e **permesso**: il commit contiene nome ed email dell’autore; la credenziale usata per collegarsi a GitHub identifica l’account; il repository stabilisce che cosa può fare quell’account. Cambiare `user.name` non cambia account né concede il diritto di push.

## Configurare l’identità dei prossimi commit

Nel clone interessato puoi impostare un’identità **solo per quel repository**, per esempio per separare un progetto di lavoro da quelli personali:

```bash
git config --local user.name "Anna Rossi"
```

```bash
git config --local user.email "anna@example.com"
```

Sostituisci l’email di esempio con un indirizzo collegato al tuo account o con l’indirizzo `noreply` indicato da GitHub in **Settings → Emails**. Per un valore predefinito comune ai tuoi repository usa invece `--global`. Queste impostazioni non riscrivono i commit esistenti.

Controlla **il valore effettivo e da quale file proviene**, senza stampare tutta la configurazione:

```bash
git config --show-origin --get user.email
```

Per usare la CLI, `gh auth login` avvia l’accesso. Il comando seguente controlla l’account della **CLI**, non l’autore Git e non necessariamente la chiave SSH o la credenziale HTTPS usata da Git:

```bash
gh auth status
```

## Esempio: un README sul profilo

Per un normale account personale chiamato `anna-dev`, crea su GitHub il repository **pubblico** `anna-dev/anna-dev` e aggiungi un `README.md` **non vuoto nella radice** del branch predefinito. Non basta un README in un qualunque repository. Questa funzione non è disponibile per gli account utente gestiti da un’impresa (Enterprise Managed Users).

```md
## Cosa sto studiando

- Backend e database
- Automazione con GitHub Actions
- Una knowledge base in Markdown
```

## Checklist

- Per la privacy, verifica l’email effettiva **prima** del primo commit pubblico. L’email nell’oggetto Git non è segreta solo perché sul profilo è nascosta.
- Abilita la 2FA, conserva i codici di recupero e rivedi chiavi SSH e token inutilizzati. Non mostrare credenziali nel README.
- Un’organizzazione raggruppa progetti, persone e team: di norma collabori dal tuo account con i permessi assegnati. Per le automazioni scegli un’identità dedicata con i soli permessi necessari.
- Il profilo può essere minimale: scegli repository in evidenza, attività e contatti che vuoi rendere pubblici.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub|GitHub]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]

## Fonti

- [GitHub Docs: creazione di un account](https://docs.github.com/en/get-started/start-your-journey/creating-an-account-on-github)
- [GitHub Docs: il README del profilo](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme)
- [GitHub Docs: scegliere l’email dei commit](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address)
