---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - sicurezza
  - checklist
  - supply-chain
aliases:
  - Checklist sicurezza GitHub
  - Checklist security GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Secret scanning]]"
  - "[[Programmazione/GitHub/Pagine/Dependabot]]"
related:
  - "[[Programmazione/GitHub/Pagine/Code scanning]]"
  - "[[Programmazione/GitHub/Pagine/Dependency graph]]"
  - "[[Programmazione/GitHub/Pagine/SBOM e attestazioni su GitHub]]"
title: Checklist sicurezza GitHub
---

# Checklist sicurezza GitHub

## Obiettivo

Prima di una pubblicazione, di un deploy o di un passaggio di consegne, verificare **quali superfici sono state controllate e con quale copertura**. Una scheda vuota può significare nessun alert visibile, funzione non attiva o permessi insufficienti. Non certifica che il repository sia sicuro.

## Checklist per chi mantiene il progetto

- [ ] **Accessi.** Confermare visibilità, collaboratori, team e integrazioni con accesso in scrittura. Per branch e tag critici verificare regole effettive, check obbligatori ed eccezioni. Non considerare «privato» sinonimo di accesso minimo.
- [ ] **Credenziali.** Controllare che sia stato esaminato anche lo storico pertinente e che gli alert di secret scanning siano stati gestiti. Un valore confermato esposto va revocato o ruotato presso l'emittente; cancellare il file o chiudere l'alert non invalida la credenziale.
- [ ] **Dipendenze e codice.** Verificare che i manifest pertinenti siano nel dependency graph; per gli alert Dependabot valutare gravità, utilizzo reale e aggiornamento disponibile. Per code scanning controllare linguaggi analizzati, branch ed esito dell'ultima analisi. Indicare cosa non è coperto o non è disponibile sul piano usato.
- [ ] **Workflow e identità.** Riesaminare origine delle action e codice eseguito prima di concedere scrittura o secret. Un riferimento a uno SHA completo rende immutabile la revisione selezionata, **non** rende affidabile il suo contenuto. Dare al job i soli permessi necessari; preferire identità a breve durata o dedicate alle credenziali personali, ove supportato.
- [ ] **Distribuzione.** Verificare chi può pubblicare package o release e quali environment proteggono il deploy. Se il progetto distribuisce una SBOM o attestazioni, controllare che si riferiscano all'artefatto consegnato; una lista di componenti non dimostra l'assenza di vulnerabilità.

## Esempio: un file è sparito, ma era già tracciato?

Dalla radice di un clone Git, questi controlli leggono **nomi o identificativi**, non il contenuto di `.env`. Il primo interroga l'indice corrente:

```bash
git ls-files -- .env
```

Il secondo cerca commit che hanno interessato quel preciso percorso nella storia raggiungibile dai riferimenti presenti nel clone:

```bash
git log --all --format=%h -- .env
```

Se il primo non restituisce righe ma il secondo sì, il file non è più nell'indice ma quel percorso compare nella storia. Non è prova che contenesse un secret; neppure due output vuoti escludono altri nomi, rami non scaricati, log o artifact. In un rapporto annotare percorso, identificativo e responsabile della verifica, **mai il valore sensibile**.

## Quando fermarsi

Bloccare la pubblicazione se si sospetta una credenziale ancora valida esposta o non è chiaro chi possa distribuire il prodotto. Coinvolgere il responsabile tramite un canale riservato; registrare eventuali rischi accettati e la data del prossimo controllo.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Secret scanning|Secret scanning]]
- [[Programmazione/GitHub/Pagine/Dependabot|Dependabot]]
- [[Programmazione/GitHub/Pagine/Dependency graph|Dependency graph]]
- [[Programmazione/GitHub/Pagine/Code scanning|Code scanning]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/OIDC GitHub Actions|OIDC GitHub Actions]]
- [[Programmazione/GitHub/Pagine/SBOM e attestazioni su GitHub|SBOM e attestazioni su GitHub]]

## Fonti

- [GitHub Docs: gestire alert di secret scanning](https://docs.github.com/en/code-security/secret-scanning/managing-alerts-from-secret-scanning/resolving-alerts)
- [GitHub Docs: uso sicuro delle action](https://docs.github.com/en/actions/reference/security/secure-use)
- [Git: interrogare l'indice](https://git-scm.com/docs/git-ls-files)
- [Git: consultare la cronologia per percorso](https://git-scm.com/docs/git-log)
