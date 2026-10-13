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
  - sicurezza
  - dependabot
  - scanning
aliases:
  - Cheatsheet sicurezza GitHub
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Checklist sicurezza GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Dependabot]]"
  - "[[Programmazione/GitHub/Pagine/Secret scanning]]"
title: GitHub - Sicurezza repository
---

# GitHub - Sicurezza repository

## Dependabot

```text
.github/dependabot.yml
```

```yaml
version: 2

updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

## Controlli da abilitare

- Dependency graph.
- Dependabot alerts.
- Dependabot security updates.
- Secret scanning e push protection.
- Code scanning.
- Security advisories per vulnerabilita private.

## Permessi Actions

```yaml
permissions:
  contents: read
```

Aggiungere permessi `write` soltanto al job che ne ha bisogno.

## Azioni immutabili

Per workflow sensibili, fissare le action a un commit SHA completo verificato:

```yaml
- uses: owner/action@full-length-commit-sha
```

I tag come `@v7` sono comodi ma possono essere spostati; lo SHA completo e il riferimento immutabile.

## Token

Ordine preferibile:

1. `GITHUB_TOKEN`.
2. OIDC con credenziali temporanee.
3. GitHub App.
4. Fine-grained personal access token.

Limitare sempre repository, scadenza e permessi.

## Segreto esposto

1. Revocare o ruotare immediatamente la credenziale.
2. Verificare log, workflow e accessi.
3. Rimuovere il valore dalla cronologia Git quando necessario.
4. Non considerare sufficiente la sola eliminazione dal branch corrente.

## Pull request non affidabili

- Non eseguire codice del fork con secret disponibili.
- Evitare interpolazione diretta di titoli e body negli script shell.
- Valutare attentamente `pull_request_target`.
- Separare build non privilegiata e operazioni privilegiate.

## Checklist

- Lockfile versionati.
- Branch principale protetto.
- Review richiesta per workflow e file sensibili.
- Action di terze parti verificate e fissate.
- Token con privilegio minimo.
- Nessun segreto in repository, artifact o log.
- Dipendenze e workflow aggiornati.

## Approfondimento

- [[Programmazione/GitHub/Pagine/Checklist sicurezza GitHub|Checklist sicurezza GitHub]]
- [[Programmazione/GitHub/Pagine/Dependabot|Dependabot]]
- [[Programmazione/GitHub/Pagine/Dependency graph|Dependency graph]]
- [[Programmazione/GitHub/Pagine/Secret scanning|Secret scanning]]
- [[Programmazione/GitHub/Pagine/Code scanning|Code scanning]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]
- [[Programmazione/GitHub/Pagine/Fine-grained token GitHub|Fine-grained token GitHub]]
- [[Programmazione/GitHub/Pagine/Security advisories GitHub|Security advisories GitHub]]
- [[Programmazione/GitHub/Pagine/SBOM e attestazioni su GitHub|SBOM e attestazioni su GitHub]]
- [[Programmazione/JavaScript/Pagine/Supply chain security npm|Supply chain security npm]]

## Riferimenti

- [GitHub Docs - Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub Docs - Dependabot configuration](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file)


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
