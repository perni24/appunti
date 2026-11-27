---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - template
  - organizzazione
  - governance
aliases:
  - Template organizzativi GitHub
  - Template GitHub organizzazione
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Organizzazioni e team GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Issue templates e pull request templates]]"
related:
  - "[[Programmazione/GitHub/Pagine/Repository hygiene]]"
  - "[[Programmazione/GitHub/Pagine/Governance repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/CODEOWNERS]]"
title: Template organizzativi GitHub
---

# Template organizzativi GitHub

## Sintesi

Per condividere una base tra repository, distinguere **ciò che va copiato una volta** da **ciò che GitHub deve mostrare come default nel tempo**. Un template di progetto fa la prima cosa; il repository pubblico speciale `ORG/.github` fa la seconda per un elenco preciso di file della community.

## Scegliere il meccanismo

| Necessità | Dove mettere il file | Cosa succede dopo |
| --- | --- | --- |
| Avviare ogni servizio con codice, README, test e CI | Repository contrassegnato come **Template repository** | Il nuovo repository parte da una copia con una nuova storia. Le modifiche future al template non si propagano. |
| Usare la stessa guida ai contributi, policy di sicurezza o modello di PR | Repository pubblico `ORG/.github`, nei percorsi supportati per il file | GitHub mostra il default dove il progetto non ha il proprio file supportato. Il default non viene aggiunto al clone. |
| Assegnare reviewer o distribuire una licenza | `CODEOWNERS` e `LICENSE` nel singolo progetto, eventualmente copiati dal template | **Non** sono default ereditati dal repository `ORG/.github`. I file copiati vanno aggiornati nei singoli progetti. |

Generare un repository da un template **non è un fork**: non si eredita la cronologia del progetto modello. Per impostazione predefinita si copia il branch predefinito; se si includono anche gli altri branch, le loro storie nel nuovo repository non sono correlate.

## Esempio: un modulo per segnalare errori nelle note

Nel repository **pubblico chiamato `.github`** dell'organizzazione, usare questa struttura. La prima riga rappresenta il repository; la directory `.github/` al suo interno non è un refuso:

```text
ORG/.github/
  CONTRIBUTING.md
  SECURITY.md
  .github/
    ISSUE_TEMPLATE/
      correzione.yml
    pull_request_template.md
```

Contenuto di `.github/ISSUE_TEMPLATE/correzione.yml` sul branch predefinito:

```yaml
name: Correzione di una nota
description: Segnala un punto impreciso o un esempio errato.
body:
  - type: input
    id: percorso
    attributes:
      label: Percorso della nota
    validations:
      required: true
```

Aprire **New issue** in un repository dell'organizzazione con le issue abilitate e senza template locali: il modulo dovrebbe comparire. Se la directory locale `.github/ISSUE_TEMPLATE/` contiene un file supportato, anche solo `config.yml`, GitHub non combina i due insiemi: usa la configurazione locale, non i template organizzativi.

## Esempio: una base tecnica per nuovi servizi

Tenere `src/`, `tests/`, un README iniziale e `.github/workflows/ci.yml` in un repository template separato. Dopo la generazione, controllare i permessi del workflow e assegnare in `CODEOWNERS` persone o team reali con accesso in scrittura. La richiesta automatica di review e l'obbligo di approvazione sono due controlli diversi.

## Errori comuni

- Mettere dati riservati nel repository pubblico dei default.
- Aggiornare la CI nel template e presumere che i servizi esistenti abbiano ricevuto la modifica.
- Cercare nel clone un file mostrato da GitHub come default: per verificarne l'origine, confrontare l'interfaccia con i file davvero versionati.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Organizzazioni e team GitHub|Organizzazioni e team GitHub]]
- [[Programmazione/GitHub/Pagine/Issue templates e pull request templates|Issue templates e pull request templates]]
- [[Programmazione/GitHub/Pagine/CODEOWNERS|CODEOWNERS]]
- [[Programmazione/GitHub/Pagine/README LICENSE e gitignore|README LICENSE e gitignore]]
- [[Programmazione/GitHub/Pagine/Repository hygiene|Repository hygiene]]
- [[Programmazione/GitHub/Pagine/Governance repository GitHub|Governance repository GitHub]]

## Fonti

- [GitHub Docs: generare un repository da un template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)
- [GitHub Docs: default supportati e precedenza](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file)
- [GitHub Docs: configurare i template delle issue](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)
- [GitHub Docs: CODEOWNERS e requisiti di accesso](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
