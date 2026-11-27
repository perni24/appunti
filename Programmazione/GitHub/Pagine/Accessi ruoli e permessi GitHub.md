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
  - permessi
  - accessi
  - ruoli
  - sicurezza
aliases:
  - Accessi ruoli e permessi GitHub
  - Permessi GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Organizzazioni e team GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository settings]]"
title: Accessi ruoli e permessi GitHub
---

# Accessi ruoli e permessi GitHub

## Sintesi

Prima di assegnare un permesso, scrivi **quale operazione** la persona deve poter compiere e **su quale repository**. Leggere una PR, chiedere una review, approvare in modo valido per il merge e modificare le protezioni sono quattro capacità diverse. Un ruolo sul repository non equivale a un ruolo nell’organizzazione.

## Prima distinzione: chi possiede il repository?

- **Account personale**: esistono proprietario e collaboratori. In un repository personale privato l’invito a collaborare attribuisce scrittura: non è un invito di sola lettura. Per una contribuzione a un progetto pubblico spesso bastano fork e PR, senza aggiungere la persona ai collaboratori.
- **Organizzazione**: può assegnare ruoli ai membri, ai team e ai collaboratori esterni. I permessi di base dell’organizzazione valgono per i membri, **non** per gli esterni. Un accesso più alto ottenuto da un altro team o da un’assegnazione diretta non viene ridotto concedendo un ruolo inferiore.

## Quale ruolo serve in un’organizzazione?

| Compito | Ruolo di riferimento | Limite da ricordare |
| --- | --- | --- |
| Leggere codice e commentare una proposta | **Read** | Il feedback non conta come approvazione obbligatoria. |
| Assegnare issue e applicare label esistenti | **Triage** | Non concede push. |
| Moderare e modificare issue altrui, per esempio correggerne il titolo | **Moderate**, dove disponibile | Non richiede scrittura sul codice. Verifica la matrice relativa all’edizione in uso. |
| Pubblicare branch e contribuire alle review richieste | **Write** | I vincoli del branch continuano ad applicarsi; il ruolo non autorizza automaticamente un merge. |
| Gestire la manutenzione ordinaria del progetto | **Maintain** | Non equivale a gestire tutti gli accessi o a poter eliminare il repository. |
| Gestire accessi e operazioni amministrative sensibili | **Admin** | Non usarlo solo per assegnare issue o svolgere review. |

Esempio: chi classifica le segnalazioni sul CSV può usare **Triage**. Chi corregge l’esportatore in un branch condiviso può aver bisogno di **Write**. La persona che deve soltanto verificare una frase della documentazione può lasciare un commento, senza ricevere **Write** per questo.

## Verificare il proprio accesso

Con `gh` autenticato, sostituisci il nome del repository. Il campo `viewerPermission` riguarda **l’identità attiva**, non un altro utente:

```bash
gh repo view OWNER/REPO --json nameWithOwner,viewerPermission
```

Il risultato non elenca tutte le fonti di accesso e non predice da solo l’esito di un push. Per una revisione dei permessi controlla l’assegnazione diretta, la membership nei team e il permesso di base. Dopo un cambio di mansione verifica **l’accesso effettivo**: rimuovere una sola assegnazione può non bastare.

## Persone e automazioni non sono lo stesso soggetto

Un workflow usa un token con permessi propri; una GitHub App usa i permessi dell’installazione; una deploy key abilita accesso SSH al repository secondo la sua configurazione. Non attribuire Admin a una persona per risolvere il problema di un job. Nell’uscita dal team controlla anche le credenziali condivise e le integrazioni: revocare l’accesso personale non revoca automaticamente una deploy key e non cancella i cloni già presenti sul disco.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/Organizzazioni e team GitHub|Organizzazioni e team GitHub]]
- [[Programmazione/GitHub/Pagine/Account GitHub e profilo sviluppatore|Account GitHub e profilo sviluppatore]]

## Fonti

- [GitHub Docs: matrice dei ruoli nei repository di organizzazione](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization)
- [GitHub Docs: permessi nei repository personali](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository)
- [GitHub Docs: permessi di base dell’organizzazione](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/setting-base-permissions-for-an-organization)
- [GitHub CLI: informazioni sull’accesso dell’utente corrente](https://cli.github.com/manual/gh_repo_view)
