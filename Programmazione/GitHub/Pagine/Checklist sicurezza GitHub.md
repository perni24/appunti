---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
difficulty: avanzato
tags: [github, sicurezza, checklist, supply-chain]
aliases: [Checklist sicurezza GitHub, Checklist security GitHub]
prerequisites: [Sicurezza dei token GitHub, Secret scanning, Dependabot]
related: [Code scanning, Dependency graph, SBOM e attestazioni su GitHub]
---

# Checklist sicurezza GitHub

## Obiettivo

Verificare che un repository GitHub riduca i rischi principali: secret esposti, dipendenze vulnerabili, codice insicuro, permessi eccessivi, token troppo ampi e supply chain non controllata.

Questa checklist non sostituisce un audit di sicurezza, ma copre i controlli minimi da non saltare.

## Quando usarlo

- Prima di rendere pubblico un repository.
- Prima di collegare deploy o package.
- Prima di una release.
- Durante audit periodici.
- Quando erediti un repository con automazioni esistenti.

## Procedura

1. Controlla visibilita e dati sensibili.
2. Abilita o verifica secret scanning.
3. Verifica Dependabot e dependency graph.
4. Controlla code scanning se il progetto lo giustifica.
5. Verifica token, PAT e `GITHUB_TOKEN`.
6. Controlla branch protection e required checks.
7. Verifica Actions, secret e environment.
8. Controlla release, package e attestazioni se usati.

## Snippet

Checklist sintetica:

```text
[ ] Nessun secret nel codice
[ ] Secret scanning attivo
[ ] Dependabot alerts controllati
[ ] Dependency graph attivo
[ ] Code scanning valutato
[ ] Branch principale protetto
[ ] Required status checks configurati
[ ] Workflow con permissions minimi
[ ] Secrets limitati per environment
[ ] OIDC valutato per cloud provider
[ ] PAT non usati per automazioni stabili
[ ] Release e package pubblicati da workflow controllati
```

## Adattamenti comuni

- **Repository privato**: non dare per scontato che sia sicuro.
- **Repository pubblico**: controlla storico Git prima della pubblicazione.
- **Repository con deploy**: usa environment, approval e OIDC se possibile.
- **Repository con package**: verifica token e permessi di pubblicazione.
- **Organizzazione**: centralizza policy con rulesets, team e secret organizzativi.

## Debug rapido

- Se un secret e stato committato, revocalo prima di rimuoverlo dal codice.
- Se Dependabot segnala molte vulnerabilita, ordina per severita e exploitability.
- Se un workflow richiede permessi ampi, separa job o workflow.
- Se una action esterna non e affidabile, pinna a SHA o usa action ufficiali.
- Se i fork eseguono workflow, controlla eventi e disponibilita dei secret.

## Checklist finale

- Secret non presenti nel repository.
- Dipendenze monitorate.
- Code scanning valutato.
- Branch e tag critici protetti.
- Token e permessi ridotti.
- Secrets separati per environment.
- Actions controllate e versionate.
- Release e package non dipendono da credenziali personali.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Secret scanning]]
- [[Dependabot]]
- [[Dependency graph]]
- [[Code scanning]]
- [[Sicurezza dei token GitHub]]
- [[Permissions GitHub Actions]]
- [[OIDC GitHub Actions]]
- [[SBOM e attestazioni su GitHub]]

## Fonti

- [GitHub Docs - Securing your repository](https://docs.github.com/en/code-security/getting-started/securing-your-repository)
