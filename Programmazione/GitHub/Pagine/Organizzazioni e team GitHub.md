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
  - organizzazioni
  - team
  - permessi
aliases:
  - Organizzazioni e team GitHub
  - GitHub Organizations
  - GitHub Teams
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub]]"
  - "[[Programmazione/GitHub/Pagine/CODEOWNERS]]"
title: Organizzazioni e team GitHub
---

# Organizzazioni e team GitHub

## Sintesi

Un’**organizzazione** possiede repository e stabilisce policy condivise. Un **team** raggruppa membri a cui assegnare accessi o richieste di review. L’identità rimane quella della singola persona: il team non è un account condiviso. Un collaboratore esterno può ricevere accesso a singoli repository, ma non entra in un team dell’organizzazione finché resta esterno.

## Esempio: due team nello stesso monorepo

Supponi che `example-org/app` contenga `apps/web/` e `apps/api/`. Concedere **Write sul repository** ai team `frontend` e `backend` permette a entrambi di proporre modifiche a entrambe le directory. Non esiste in quell’assegnazione un «Write solo su `apps/web/`». Per indirizzare le review usa un file `.github/CODEOWNERS` sul branch base della PR, con team reali, visibili e con accesso esplicito di scrittura:

```text
/apps/web/           @example-org/frontend
/apps/api/           @example-org/backend
/.github/workflows/  @example-org/platform
```

Se una PR tocca `apps/api/export.ts`, GitHub può richiedere la review a `backend`. Se è obbligatoria, la regola del branch deve **richiedere l’approvazione dei code owner**. La mappa non limita la visibilità del file né concede permessi. Se due gruppi non devono poter leggere l’uno il codice dell’altro, la separazione va progettata a livello di repository: una directory e un team segreto non sono un confine di accesso ai file.

## Cosa eredita un team figlio?

Un team figlio eredita gli accessi ai repository del **padre**, non il contrario. Se `engineering` ha Read su `app` e il figlio `frontend` ha anche Write assegnato direttamente, i membri di `frontend` possono scrivere; gli altri membri di `engineering` non ricevono Write dal figlio. Dare al padre un accesso troppo ampio lo propaga ai discendenti.

Una menzione `@example-org/frontend` richiama il gruppo ma non lo rende code owner. I team **visibili** si prestano a review e ownership; i team **segreti** non possono far parte di gerarchie annidate e nascondono la membership, non il codice dei repository.

## Ingresso, cambio di team e uscita

1. Per l’ingresso verifica se occorre la membership nell’organizzazione o basta un accesso esterno a un repository. Assegna il team coerente con le responsabilità reali, non quello con il livello più alto.
2. Se una persona passa dal backend al frontend, controlla accesso precedente e nuovo, team padre e concessioni dirette. Il cambio organizzativo non modifica automaticamente i riferimenti a team rinominati o non più responsabili nelle procedure del progetto: verifica anche `CODEOWNERS`.
3. Per l’uscita da un progetto verifica quali repository rimangono accessibili e perché. Mantieni un responsabile per l’aggiornamento dei team e delle review, soprattutto per team temporanei e policy condivise tra repository.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub|Accessi ruoli e permessi GitHub]]
- [[Programmazione/GitHub/Pagine/CODEOWNERS|CODEOWNERS]]
- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/Monorepo su GitHub|Monorepo su GitHub]]

## Fonti

- [GitHub Docs: organizzazioni](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/about-organizations)
- [GitHub Docs: membership, visibilità ed ereditarietà dei team](https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams)
- [GitHub Docs: requisiti di accesso e visibilità dei code owner](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
