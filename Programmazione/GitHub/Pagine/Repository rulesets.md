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
  - rulesets
  - repository
  - governance
aliases:
  - Repository rulesets
  - Rulesets GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Branch protection rules]]"
related:
  - "[[Programmazione/GitHub/Pagine/Branch protection rules]]"
  - "[[Programmazione/GitHub/Pagine/Protected tags]]"
title: Repository rulesets
---

# Repository rulesets

## Sintesi

Un **ruleset** è un insieme nominato di regole. Per leggerlo parti da quattro domande: **che cosa protegge**, **quali nomi comprende**, **quali operazioni limita** e **se è attivo**. Un branch ruleset può imporre review e check; un tag ruleset può proteggere i riferimenti di release. Un workflow Actions è invece codice che esegue un’attività: non diventa obbligatorio solo perché esiste.

## Come leggere una policy

1. In **Settings → Rules → Rulesets** controlla il tipo di regola e la provenienza: repository oppure organizzazione, se supportato dal piano. Chi ha accesso in lettura può consultare i ruleset attivi; cambiarli richiede privilegi ulteriori.
2. Controlla inclusioni ed esclusioni. Se l’intento è proteggere il **branch predefinito**, sceglierlo come target non equivale a scrivere il nome fisso `main`: il primo segue la scelta del repository anche dopo un cambio di default.
3. Leggi lo stato: **Active** applica le regole; **Disabled** no. Dove disponibile, **Evaluate** registra come si comporterebbero senza bloccare le operazioni. Non considerare la valutazione una protezione già attiva.
4. Leggi le condizioni e le eventuali eccezioni autorizzate **per quel ruleset**. Un’eccezione a un insieme di regole non cancella gli altri vincoli applicabili. I *push ruleset*, dove disponibili, riguardano restrizioni come percorsi e dimensione dei file: non sono sinonimo di regole sui branch.

## Esempio: due regole sulla stessa PR

Un ruleset organizzativo richiede una review su `main`. Quello del repository ne richiede due e impone il check `docs-readme`. Senza eccezioni applicabili, servono **due approvazioni e quel check**, non tre approvazioni e non la sola regola più recente. Per lo stesso requisito vale la versione più restrittiva; requisiti diversi si sommano. Anche una protezione classica applicabile può aggiungere vincoli.

Con GitHub CLI autenticata, sostituisci `OWNER/REPO`. Per consultare le regole dei ruleset che riguardano il branch predefinito:

```bash
gh ruleset check --default --repo OWNER/REPO
```

Per controllare a quali regole corrisponderebbe un nome di branch, **senza crearlo**:

```bash
gh ruleset check release/1.x --repo OWNER/REPO
```

Queste sono letture, non prove di un push né una verifica completa dei permessi della persona che farà il merge. Per sapere quali check mancano davvero, apri la PR; per le regole classiche controlla anche **Branches**.

## Branch, tag e firme

Non trasferire le opzioni da un tipo di regola all’altro. Per i tag `v*` decidi separatamente chi può creare, aggiornare o cancellare il riferimento. **Require signed commits** riguarda i commit: non è una regola chiamata «Require signed tags» e non certifica la firma dell’oggetto tag. Per la procedura di release e la distinzione tra tag annotato e firmato vedi [[Programmazione/GitHub/Pagine/Protected tags|Protected tags]].

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Branch protection rules|Branch protection rules]]
- [[Programmazione/GitHub/Pagine/Protected tags|Protected tags]]
- [[Programmazione/GitHub/Pagine/Required status checks|Required status checks]]

## Fonti

- [GitHub Docs: regole sovrapposte, disponibilità e stati](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub Docs: tipi di regole disponibili](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub Enterprise Cloud: valutazione senza enforcement](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-code-governance)
- [GitHub CLI: controllare i ruleset per nome di branch](https://cli.github.com/manual/gh_ruleset_check)
