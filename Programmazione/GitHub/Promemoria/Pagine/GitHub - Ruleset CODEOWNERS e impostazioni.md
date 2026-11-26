---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - promemoria
  - ruleset
  - codeowners
  - repository-settings
aliases:
  - Cheatsheet protezione repository GitHub
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Repository rulesets]]"
  - "[[Programmazione/GitHub/Pagine/CODEOWNERS]]"
title: GitHub - Ruleset, CODEOWNERS e impostazioni
---

# GitHub - Ruleset, CODEOWNERS e impostazioni

## CODEOWNERS

GitHub legge il **primo** `CODEOWNERS` trovato nel branch di destinazione della PR, nell’ordine seguente. I tre file non vengono combinati:

```text
.github/CODEOWNERS
CODEOWNERS
docs/CODEOWNERS
```

Esempio:

```text
*                         @owner
/docs/                    @example-org/docs-team
/src/security/            @example-org/security-team
/.github/workflows/       @example-org/devops-team
```

Nel file scelto prevale l’ultima riga che corrisponde al percorso. Per esempio, per `/docs/guida.md` vale `@example-org/docs-team`, non anche `@owner`. Metti sulla stessa riga i proprietari alternativi dello stesso percorso.

Sostituire utenti, organizzazione e team con quelli reali. Utenti: `@username`; team: `@org/team`. Servono permessi `write`; i team devono essere visibili e avere accesso `write` esplicito. Per bloccare il merge senza approvazione attivare anche la review obbligatoria dei code owner nel ruleset.

## Ruleset del branch principale

Seleziona il branch di destinazione e verifica che il ruleset sia **Active**: salvare una bozza di configurazione o lasciarlo disabilitato non blocca i merge. Scegli i controlli adatti al progetto:

- pull request obbligatoria;
- numero minimo di approvazioni;
- conversazioni risolte;
- status check richiesti;
- branch aggiornato prima del merge, quando necessario;
- blocco dei force push;
- blocco delle eliminazioni;
- firma dei commit, se prevista dal progetto;
- bypass limitato e tracciato.

## Status check

Frammento di un job esistente: assegna un nome stabile e univoco fra i workflow che pubblicano check sullo stesso repository.

```yaml
jobs:
  verify:
    name: Verify
```

Prima esegui il workflow su una PR, poi seleziona nel ruleset il check effettivamente pubblicato. Il nome nel file YAML da solo non rende obbligatorio il check.

## Impostazioni repository

Verificare:

- default branch;
- merge method ammessi;
- eliminazione automatica branch;
- Actions consentite;
- permessi predefiniti di `GITHUB_TOKEN`;
- visibilita;
- Issues, Projects, Discussions e Wiki;
- Pages;
- protezioni di tag;
- accessi di collaboratori e team.

## Merge method

| Metodo | Uso |
|---|---|
| Merge commit | Conserva la topologia del branch |
| Squash | Un commit per pull request |
| Rebase | Cronologia lineare con commit separati |

## Repository da CLI

Il primo comando legge le impostazioni. Il secondo cambia una preferenza del repository per tutti e richiede i permessi appropriati: non è necessario per consultarla.

```powershell
gh repo view --json defaultBranchRef,visibility
```

```powershell
gh repo edit --delete-branch-on-merge
```

## Fonti

- [GitHub Docs: posizione e precedenza di CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Docs: regole disponibili e check richiesti](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/Repository rulesets|Repository rulesets]]
- [[Programmazione/GitHub/Pagine/Branch protection rules|Branch protection rules]]
- [[Programmazione/GitHub/Pagine/Configurare branch protection|Configurare branch protection]]
- [[Programmazione/GitHub/Pagine/Required status checks|Required status checks]]
- [[Programmazione/GitHub/Pagine/CODEOWNERS|CODEOWNERS]]
- [[Programmazione/GitHub/Pagine/Governance repository GitHub|Governance repository GitHub]]
- [[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub|Accessi ruoli e permessi GitHub]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
