---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - governance
  - repository
  - manutenzione
aliases:
  - Governance repository GitHub
  - Governance GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository settings]]"
  - "[[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Repository hygiene]]"
  - "[[Programmazione/GitHub/Pagine/Repository rulesets]]"
  - "[[Programmazione/GitHub/Pagine/Branch protection rules]]"
  - "[[Programmazione/GitHub/Pagine/Organizzazioni e team GitHub]]"
title: Governance repository GitHub
---

# Governance repository GitHub

## Sintesi

La governance stabilisce **chi decide, quale regola si applica e come verificare che venga rispettata**. Un `CONTRIBUTING.md` può chiedere una review; da solo non impedisce a chi ha accesso in scrittura di fare merge senza approvazione.

## Come scegliere i controlli

| Decisione | Dove documentarla | Cosa controllare su GitHub |
| --- | --- | --- |
| Chi può modificare il progetto? | README o guida dei manutentori | Ruoli, team, collaboratori esterni e chi può concedere accesso o fare bypass. |
| Chi deve rivedere una modifica critica? | `CODEOWNERS` sul branch di destinazione | Che gli owner abbiano accesso in scrittura e la regola del branch richieda la loro approvazione. |
| Quando si può fare merge? | `CONTRIBUTING.md`: review, test e strategia di merge | Protezione del branch o ruleset attivo con i controlli richiesti. Verificare nome e attivazione del job su una PR. |
| Chi può rilasciare o ritirare il progetto? | Procedura di release, contatto in `SECURITY.md` e piano di successione | Permessi per tag e deploy, responsabile degli aggiornamenti e alternativa se il manutentore non è disponibile. |

## Esempio: un controllo prima del merge

In questo vault il workflow `.github/workflows/deploy-pages.yml` parte su push a `main` o su avvio manuale. Un deploy verde conferma l'esito **dopo** il push; non prova che una pull request sia stata validata **prima** del merge. Per rendere obbligatoria la validazione, serve un job che giri sulle modifiche proposte (per esempio `content:check` su `pull_request`) e un controllo richiesto sul branch. Il deploy può restare separato.

Per leggere i ruleset attivi applicabili a `main`, con GitHub CLI autenticata e accesso al repository (sostituire `OWNER/REPO`):

```bash
gh ruleset check main --repo OWNER/REPO
```

Un elenco vuoto non dimostra che il branch sia privo di vincoli: verificare anche le protezioni classiche e gli accessi effettivi. Disponibilità delle regole e delle funzioni di sicurezza dipendono da piano e visibilità.

## Verifica periodica

- **Progetto personale:** documentare come ricostruire e pubblicare il progetto; evitare approvazioni obbligatorie che nessun altro può dare.
- **Progetto di team o pubblico:** indicare owner e sostituti, metodo di contribuzione, licenza e canale per segnalazioni riservate. Preferire permessi mirati all'accesso amministratore.
- **Cambio di manutentore:** verificare accessi, integrazioni e gestione delle release. Una policy resta utile solo se chi subentra può applicarla.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub|Accessi ruoli e permessi GitHub]]
- [[Programmazione/GitHub/Pagine/Organizzazioni e team GitHub|Organizzazioni e team GitHub]]
- [[Programmazione/GitHub/Pagine/Repository rulesets|Repository rulesets]]
- [[Programmazione/GitHub/Pagine/Branch protection rules|Branch protection rules]]
- [[Programmazione/GitHub/Pagine/Repository hygiene|Repository hygiene]]

## Fonti

- [GitHub Docs: pratiche di gestione](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories)
- [GitHub Docs: CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Docs: ruleset](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub CLI: gh ruleset check](https://cli.github.com/manual/gh_ruleset_check)
