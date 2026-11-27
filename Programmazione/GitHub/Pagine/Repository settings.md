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
  - repository-settings
  - configurazione
aliases:
  - Repository settings
  - Impostazioni repository GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Web UI]]"
related:
  - "[[Programmazione/GitHub/Pagine/Branch protection rules]]"
  - "[[Programmazione/GitHub/Pagine/Repository rulesets]]"
title: Repository settings
---

# Repository settings

## Sintesi

Le **Settings** descrivono come GitHub ospita e amministra un repository. Non tutto è versionato: il file di workflow è nel clone, mentre la sorgente di pubblicazione Pages, gli accessi e molte protezioni sono configurazioni del servizio. Per diagnosticare un problema, individua prima **dove risiede la scelta** e chi ha il permesso di leggerla o modificarla.

## Dove cercare

| Domanda | Punto di partenza |
| --- | --- |
| Qual è il branch predefinito? Quali metodi di merge e funzioni collaborative sono disponibili? | **General**: branch predefinito, opzioni delle PR, Issues, Wiki o Discussions secondo contesto e permessi. |
| Chi può contribuire? Cosa deve passare prima di un merge? | **Collaborators / Collaborators and teams** per gli accessi; **Branches** e **Rules → Rulesets** per le condizioni sui riferimenti. |
| Perché un’azione non è consentita? | **Actions → General** per azioni ammesse e permessi predefiniti; confronta le policy dell’organizzazione e il blocco `permissions` del workflow. |
| Dove vanno credenziali e parametri? | **Secrets and variables → Actions** oppure l’**Environment** che li utilizza. Le variabili sono configurazione non segreta. Webhook e deploy key hanno scopi e accessi separati. |
| Da dove arriva il sito? | **Pages → Build and deployment → Source** e cronologia del deployment, non il semplice elenco dei branch. |

Con la CLI, sostituendo `OWNER/REPO`, puoi leggere alcuni dati senza cambiare la configurazione:

```bash
gh repo view OWNER/REPO --json nameWithOwner,defaultBranchRef,visibility
```

`gh repo view OWNER/REPO --web` apre il repository nel browser: da lì scegli **Settings**. Il comando non certifica l’accesso amministrativo. La presenza di una voce dipende anche dal piano, dal proprietario e dalle policy superiori.

## Esempio: controllare la pubblicazione Quartz

1. Nel clone apri `.github/workflows/deploy-pages.yml`. Distingui il job `build`, che verifica le note e carica `site/public` come artefatto, da `deploy`, che dipende da `build` e pubblica nell’environment `github-pages`.
2. Sul repository verifica che **Settings → Pages → Source** indichi **GitHub Actions** se usi quel workflow. Questa scelta non seleziona un file YAML specifico e non sostituisce i trigger dichiarati dal workflow. Non aggiungere un secondo workflow per il solo fatto che GitHub propone un modello.
3. Per sapere se una revisione è online, confronta lo SHA del push con la run in **Actions**, verifica il job di deploy e apri l’URL dell’environment. Il successo della sola build dimostra la generazione dell’artefatto, non la sua pubblicazione.

## Prima di cambiare una configurazione condivisa

Registra repository, valore attuale, valore voluto ed effetto atteso. Una documentazione come `CONTRIBUTING.md` può descrivere la policy, non la applica. Se un solo job non riesce, non ampliare i permessi dell’intero repository per tentativi: leggi prima quale operazione è fallita, con quale identità e con quale ambiente. Per cambi di visibilità, accessi o pubblicazione, verifica anche chi potrà leggere i contenuti dopo il cambio.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Web UI|GitHub Web UI]]
- [[Programmazione/GitHub/Pagine/Branch protection rules|Branch protection rules]]
- [[Programmazione/GitHub/Pagine/Repository rulesets|Repository rulesets]]
- [[Programmazione/GitHub/Pagine/GitHub Pages con Actions|GitHub Pages con Actions]]

## Fonti

- [GitHub Docs: impostazioni del repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings)
- [GitHub Docs: sorgente di pubblicazione di Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Docs: impostazioni Actions del repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
- [GitHub CLI: campi disponibili in gh repo view](https://cli.github.com/manual/gh_repo_view)
