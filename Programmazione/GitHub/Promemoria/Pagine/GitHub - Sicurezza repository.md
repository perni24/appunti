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

## Dependabot: dove cerca gli aggiornamenti

Esempio per `.github/dependabot.yml` di questo vault. `directory` indica la cartella del manifest per npm; per le action si usa la radice, **non** `/.github/workflows`.

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/site"
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
```

Questa pianificazione riguarda le PR di **version update**. Non dimostra che gli alert di sicurezza siano attivi, risolti o coprano ogni dipendenza.

## Controlli rapidi

| Verifica | Evidenza da cercare |
| --- | --- |
| Dipendenze | Manifest e lockfile corretti nel dependency graph; alert Dependabot gestiti e aggiornamenti di sicurezza valutati. |
| Codice e secret | Ultima analisi riuscita sui linguaggi e branch previsti; secret scanning e push protection ove disponibili. Nessun alert visibile non equivale a nessun rischio. |
| Scrittura e rilascio | Regole su branch critici, review dei workflow e permessi limitati al job. Per una CI di lettura basta in genere `contents: read`. |
| Contributi esterni | Non eseguire codice non fidato in un job con secret o permessi di pubblicazione. Trattare titoli e body delle PR come dati, non come comandi shell. |
| Segnalazione riservata | Usare il canale indicato in `SECURITY.md`; un advisory del repository consente di coordinare la correzione prima della divulgazione. |

## Fissare una action a una revisione

Step reale, fissato al commit della release **checkout v6.0.2** (esempio di pin, non indicazione di ultima versione):

```yaml
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
```

Un tag può spostarsi; lo SHA identifica quella revisione. Verificare origine e contenuto prima dell'uso e rivedere i successivi aggiornamenti. Per le credenziali scegliere in base alla destinazione: `GITHUB_TOKEN` nel repository, GitHub App per un'integrazione tra repository, OIDC per un cloud compatibile. Se serve un PAT, limitare accessi, scadenza e permessi.

## Secret esposto

1. **Revocare o ruotare presso l'emittente** e aggiornare i consumatori autorizzati. Chiudere l'alert o eliminare il file non disattiva la credenziale.
2. Verificare accessi, log, run e artifact coinvolti, senza copiare il valore nel rapporto.
3. Rimuovere il valore dalle copie pertinenti. Se occorre riscrivere la cronologia, concordare l'intervento con i collaboratori: non è il primo rimedio.

## Fonti

- [GitHub Docs: campi di dependabot.yml](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
- [GitHub Docs: uso sicuro delle action](https://docs.github.com/en/actions/reference/security/secure-use)
- [actions/checkout: commit della release citata](https://github.com/actions/checkout/commit/de0fac2e4500dabe0009e67214ff5f5447ce83dd)

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

## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
