---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - sbom
  - attestations
  - provenance
  - supply-chain
aliases:
  - SBOM e attestazioni su GitHub
  - GitHub artifact attestations
  - SBOM GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Dependency graph]]"
related:
  - "[[Programmazione/GitHub/Pagine/Dependency graph]]"
  - "[[Programmazione/GitHub/Pagine/Dependabot]]"
title: SBOM e attestazioni su GitHub
---

# SBOM e attestazioni su GitHub

## Sintesi

Una **SBOM** (*Software Bill of Materials*) è un inventario dei componenti software. Un’**attestazione** è una dichiarazione firmata su un oggetto identificato dal suo digest. Puoi attestare **da dove proviene** un archivio oppure **quale SBOM gli è associata**. Sono affermazioni diverse: nessuna delle due dimostra da sola che il programma sia privo di vulnerabilità.

## Quale evidenza ti serve?

| Domanda | Evidenza | Limite |
| --- | --- | --- |
| Quali dipendenze riconosce GitHub nel repository? | In **Insights → Dependency graph** esporta la SBOM in formato SPDX. | È lo stato corrente del grafo, non necessariamente quello della versione già consegnata. |
| Cosa contiene l’archivio effettivamente distribuito? | Genera la SBOM nella build del prodotto tenendo conto dei componenti inclusi o incorporati. | Una dipendenza di sviluppo può costruire l’archivio senza farne parte. Anche una SBOM generata in build dipende dalla copertura del generatore. |
| Il file scaricato corrisponde al prodotto del processo di rilascio atteso? | Verifica l’attestazione di provenienza sul digest del **file scaricato**, limitando repository, workflow e riferimento sorgente attesi. | Un digest identifica i byte; da solo non identifica chi li ha prodotti. Una provenienza valida non certifica la qualità del codice. |

## Esempio: verifica dal lato di chi scarica

Supponi che un progetto distribuisca `report-v1.2.3.zip`, che il suo workflow `release.yml` produca e attesti **quel file finale** e che esso sia già sul disco. Sostituisci `OWNER/REPO`, percorso del workflow e tag con quelli che ti aspetti dalla documentazione di rilascio. Con una GitHub CLI recente e accesso alle attestazioni:

```bash
gh attestation verify report-v1.2.3.zip --repo OWNER/REPO --signer-workflow OWNER/REPO/.github/workflows/release.yml --source-ref refs/tags/v1.2.3
```

Senza indicare un altro tipo di dichiarazione, la CLI verifica la provenienza SLSA. Il nome dello ZIP non è una prova. Se il progetto usa un **workflow riutilizzabile** per attestare, il firmatario da indicare è quel workflow, non necessariamente il chiamante.

Se il produttore ha emesso **anche** un’attestazione SBOM con il tipo SPDX seguente, verifica la seconda dichiarazione **sullo stesso archivio**, non sul file JSON scaricato a parte:

```bash
gh attestation verify report-v1.2.3.zip --repo OWNER/REPO --signer-workflow OWNER/REPO/.github/workflows/release.yml --source-ref refs/tags/v1.2.3 --predicate-type https://spdx.dev/Document/v2.3
```

Un fallimento non identifica da solo la causa: verifica accesso, esistenza dell’attestazione, tipo dichiarato, digest e identità attesa. Non considerare il file verificato allargando i criteri soltanto per ottenere un esito positivo.

## Dal lato di chi pubblica

Collega tag, commit, build e artefatto finale. Genera l’inventario per la stessa build, attesta i byte che distribuirai e pubblica le istruzioni di verifica insieme alla release. Se ricomprimi l’archivio dopo averlo attestato, il digest può cambiare anche se i file interni sono identici. Caricare un artefatto Pages o allegare un JSON alla release **non** crea automaticamente un’attestazione. Disponibilità e visibilità dipendono anche dal piano e dal tipo di repository.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Dependency graph|Dependency graph]]
- [[Programmazione/GitHub/Pagine/Protected tags|Protected tags]]
- [[Programmazione/GitHub/Pagine/Repository rulesets|Repository rulesets]]
- [[Programmazione/GitHub/Pagine/Dependabot|Dependabot]]

## Fonti

- [GitHub Docs: esportare la SBOM del grafo](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom)
- [GitHub Docs: generare e verificare attestazioni di build e SBOM](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
- [GitHub CLI: identità del firmatario, riferimento sorgente e predicate type](https://cli.github.com/manual/gh_attestation_verify)
