---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [github, sbom, attestations, provenance, supply-chain]
aliases: [SBOM e attestazioni su GitHub, GitHub artifact attestations, SBOM GitHub]
prerequisites: [Dependency graph]
related: [Dependency graph, Dependabot]
---

# SBOM e attestazioni su GitHub

## Sintesi

Una **SBOM** descrive le componenti software e le dipendenze di un progetto. Le **attestazioni** descrivono provenienza e integrita di artefatti generati da una pipeline, per esempio quale workflow ha prodotto un build.

Su GitHub questi concetti aiutano a rendere la supply chain piu verificabile: non basta sapere cosa c'e nel codice, bisogna anche sapere da dove arriva un artefatto e come e stato prodotto.

## Quando usarlo

Usa SBOM e attestazioni quando:

- distribuisci artefatti o pacchetti;
- hai requisiti di compliance;
- vuoi tracciare dipendenze e provenienza;
- pubblichi release scaricabili;
- vuoi verificare integrita build;
- vuoi ridurre rischio di artefatti non autorizzati.

## Come funziona

Il dependency graph puo alimentare informazioni sulle dipendenze. Una SBOM esporta queste informazioni in formato adatto a strumenti esterni.

Le attestazioni collegano un artefatto a metadata di build:

- repository sorgente;
- workflow;
- commit;
- ambiente;
- identita che ha generato l'artefatto;
- timestamp o informazioni di provenance.

L'obiettivo e poter rispondere a domande come: "questo binario proviene davvero dal repository e dal commit dichiarati?"

## API / Sintassi

Esempio concettuale di verifica:

```text
artifact: app-v1.2.0.zip
source repository: owner/repository
commit: abc123
workflow: release.yml
tag: v1.2.0
```

Esempio di policy:

```text
Accetta solo artefatti:
- generati da workflow release ufficiale;
- associati a tag protetto;
- con attestazione verificabile;
- pubblicati come release asset ufficiale.
```

## Esempio pratico

Per una release:

1. crea tag protetto `v1.2.0`;
2. esegui workflow di build;
3. genera artefatto;
4. produce attestazione;
5. pubblica release asset;
6. conserva SBOM o link alle dipendenze;
7. documenta verifica per utenti o sistemi interni.

## Varianti

- **SBOM da dependency graph**: elenco dipendenze rilevate.
- **SBOM generata da build tool**: spesso piu vicina all'artefatto finale.
- **Artifact attestation**: prova di provenienza build.
- **Release asset collegato**: artefatto pubblicato nella release.
- **SLSA/provenance workflow**: modello piu rigoroso di supply chain.

## Errori comuni

- Generare SBOM ma non usarla in alcun processo.
- Confondere SBOM con scansione vulnerabilita.
- Pubblicare artefatti fuori dalla pipeline ufficiale.
- Non proteggere tag di release.
- Non documentare come verificare un artefatto.
- Considerare l'attestazione una garanzia assoluta senza controlli sui workflow.

## Checklist

- La SBOM rappresenta davvero l'artefatto distribuito?
- I tag di release sono protetti?
- Gli artefatti nascono da workflow ufficiali?
- Le attestazioni sono generate e conservate?
- Gli utenti sanno come verificare origine e integrita?
- Il processo e collegato a release e dependency management?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Dependency graph]]
- [[Protected tags]]
- [[Repository rulesets]]
- [[Dependabot]]

## Fonti

- [GitHub Docs - Secure your supply chain](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain)
- [GitHub Docs - Artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
- [GitHub Docs - Export dependencies as SBOM](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom)
