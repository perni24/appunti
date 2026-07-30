---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, promemoria, ruleset, codeowners, repository-settings]
aliases: [Cheatsheet protezione repository GitHub]
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Repository rulesets]]"
  - "[[Programmazione/GitHub/Pagine/CODEOWNERS]]"
---

# GitHub - Ruleset, CODEOWNERS e impostazioni

## CODEOWNERS

Posizioni riconosciute:

```text
.github/CODEOWNERS
CODEOWNERS
docs/CODEOWNERS
```

Esempio:

```text
*                         @owner
/docs/                    @docs-team
/src/security/            @security-team
/.github/workflows/       @devops-team
```

L'ultima regola corrispondente prevale.

## Ruleset del branch principale

Controlli consigliati:

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

Usare nomi stabili per job e workflow:

```yaml
jobs:
  verify:
    name: Verify
```

Il ruleset deve richiedere esattamente il check pubblicato.

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

```powershell
gh repo view --json defaultBranchRef,visibility
```

```powershell
gh repo edit --delete-branch-on-merge
```

## Approfondimento

- [[Programmazione/GitHub/Pagine/Repository settings]]
- [[Programmazione/GitHub/Pagine/Repository rulesets]]
- [[Programmazione/GitHub/Pagine/Branch protection rules]]
- [[Programmazione/GitHub/Pagine/Configurare branch protection]]
- [[Programmazione/GitHub/Pagine/Required status checks]]
- [[Programmazione/GitHub/Pagine/CODEOWNERS]]
- [[Programmazione/GitHub/Pagine/Governance repository GitHub]]
- [[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub]]
