---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, rulesets, repository, governance]
aliases: [Repository rulesets, Rulesets GitHub]
prerequisites: [Repository GitHub, Branch protection rules]
related: [Branch protection rules, Protected tags]
---

# Repository rulesets

## Sintesi

I **repository rulesets** permettono di definire regole di protezione piu centralizzate e flessibili per branch, tag e workflow del repository. Sono utili quando le semplici branch protection rules non bastano o quando vuoi una governance piu uniforme.

Il concetto chiave e: le regole non vivono solo su un singolo branch, ma possono applicarsi a pattern e target piu ampi.

## Quando usarlo

Usa rulesets quando:

- vuoi proteggere piu branch con una sola policy;
- vuoi proteggere tag di release;
- vuoi applicare regole coerenti in una organizzazione;
- vuoi avere bypass espliciti e controllati;
- vuoi migrare da branch protection frammentate;
- vuoi rendere piu visibile la governance del repository.

## Come funziona

Un ruleset definisce:

- target, per esempio branch o tag;
- pattern, per esempio `main`, `release/*`, `v*`;
- enforcement, cioe se la regola e attiva;
- condizioni richieste;
- bypass consentiti;
- eventuali controlli su commit, review o status check.

Le regole possono convivere con branch protection esistenti, ma bisogna evitare sovrapposizioni confuse.

## API / Sintassi

Esempio concettuale:

```text
Ruleset: Release tags
Target: tags
Pattern: v*
Require signed tags: yes
Allow deletion: no
Bypass: release-managers
```

Esempio per branch:

```text
Target: branches
Pattern: main
Require pull request: yes
Require status checks: yes
Block force pushes: yes
```

## Esempio pratico

Un repository puo avere:

- ruleset per `main`;
- ruleset per `release/*`;
- ruleset per tag `v*`;
- bypass limitato al team release;
- required status check per test e build.

Questo rende esplicito quali parti del repository sono critiche.

## Varianti

- **Ruleset branch**: protegge branch o pattern di branch.
- **Ruleset tag**: protegge tag di release.
- **Ruleset organizzativo**: applicabile a piu repository, se disponibile nel piano e contesto.
- **Ruleset con bypass**: permette eccezioni controllate.
- **Ruleset in evaluation**: utile per verificare impatto prima dell'enforcement, quando supportato.

## Errori comuni

- Duplicare branch protection e rulesets senza sapere quale regola prevale.
- Lasciare bypass troppo ampi.
- Proteggere tag senza definire processo di release.
- Applicare pattern troppo larghi.
- Non testare impatto sulle automazioni.
- Non documentare chi puo bypassare e perche.

## Checklist

- Il ruleset ha target e pattern chiari?
- Ci sono sovrapposizioni con branch protection?
- I bypass sono minimi?
- Le regole proteggono branch e tag critici?
- La CI ha permessi compatibili con il ruleset?
- Il team conosce le conseguenze operative?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[Branch protection rules]]
- [[Protected tags]]
- [[Required status checks]]

## Fonti

- [GitHub Docs - About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
