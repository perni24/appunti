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
  - security-advisories
  - vulnerability
  - security
aliases:
  - Security advisories GitHub
  - GitHub Security Advisories
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Dependabot]]"
  - "[[Programmazione/GitHub/Pagine/Code scanning]]"
  - "[[Programmazione/GitHub/Pagine/Secret scanning]]"
title: Security advisories GitHub
---

# Security advisories GitHub

## Sintesi

Un **repository security advisory** serve al manutentore per coordinare una correzione in privato e poi spiegare agli utenti **se sono interessati e che cosa devono fare**. Non è un alert di Dependabot: un progetto **pubblica** un advisory sul proprio software; chi usa il pacchetto può poi **ricevere** un alert se la sua versione corrisponde a un advisory riconosciuto.

## Dove segnalare un problema

Per un progetto pubblico su GitHub.com leggi prima `SECURITY.md`. Se è abilitato il **private vulnerability reporting**, usa **Report a vulnerability** nella sezione sicurezza del repository. Il file descrive il processo del manutentore, ma la sua sola presenza non attiva il modulo. Se il modulo non c’è, usa il contatto privato indicato nella policy. Non inserire dettagli sensibili, credenziali o dati degli utenti in un’issue pubblica.

## Dal report alla comunicazione

1. **Ricezione:** il manutentore verifica che il report riguardi il proprio progetto e identifica pacchetto, ecosistema, versioni e impatto. Un report è una segnalazione da valutare, non un annuncio già pubblico.
2. **Coordinamento:** in una bozza privata invita solo chi serve per la correzione. Se occorre collaborare sul codice, GitHub permette un *temporary private fork*: un normale branch in un repository pubblico **non** rende privata la patch.
3. **Rilascio:** verifica la correzione sulle linee supportate. Registra la prima versione effettivamente disponibile per ciascuna linea, non soltanto un commit su `main`. Se non esiste ancora una patch, dichiaralo e indica solo mitigazioni verificate.
4. **Pubblicazione:** coordina advisory, release e istruzioni per l’aggiornamento. L’identificatore **GHSA** non equivale a un **CVE**; quest’ultimo può esserci già o essere richiesto se applicabile. Il GitHub Advisory Database è il catalogo consultabile, non il luogo dove scambiare privatamente la prima segnalazione.

## Esempio di avviso per chi deve aggiornare

Caso **fittizio**, non una segnalazione relativa a un pacchetto reale. Supponi di avere verificato una sola linea stabile:

| Campo | Valore esemplificativo |
| --- | --- |
| Pacchetto ed ecosistema | `esempio-report`, npm |
| Versioni interessate confermate | Da `1.2.0` inclusa a `1.2.3` esclusa |
| Prima versione corretta | `1.2.3` |
| Impatto | Un report esportato può includere una colonna che l’utente non aveva selezionato. |
| Azione per chi usa il pacchetto | Aggiornare almeno alla versione corretta sulla linea interessata e rigenerare i report coinvolti. |

Scrivere solo «tutte le versioni precedenti alla 1.2.3» includerebbe anche la 1.1, che l’esempio non ha verificato. Se la versione interessata è una dipendenza transitiva, chi consuma l’avviso deve controllare il proprio lockfile e la build distribuita, non solo il numero di versione dell’app. Motiva la severità con l’impatto verificato; non assegnarla automaticamente in base al nome del difetto.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Dependabot|Dependabot]]
- [[Programmazione/GitHub/Pagine/Code scanning|Code scanning]]
- [[Programmazione/GitHub/Pagine/Secret scanning|Secret scanning]]

## Fonti

- [GitHub Docs: advisory di repository, CVE e pubblicazione](https://docs.github.com/en/code-security/concepts/vulnerability-reporting-and-management/repository-security-advisories)
- [GitHub Docs: inviare una segnalazione privata](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately)
- [GitHub Docs: comunicazione coordinata della correzione](https://docs.github.com/en/code-security/concepts/vulnerability-reporting-and-management/coordinated-disclosure)
