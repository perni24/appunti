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
  - github-actions
  - deployment
  - approvals
aliases:
  - Deployment approvals GitHub Actions
  - Review deployments
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Environments GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Deploy con GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Environments GitHub Actions]]"
title: Deployment approvals GitHub Actions
---

# Deployment approvals GitHub Actions

## Sintesi

L’approvazione del deployment risponde a «**vogliamo rilasciare questa revisione in questo ambiente, adesso?**». La review di una PR decide invece se integrare il codice. Né una PR approvata né un clic su *Run workflow* soddisfano automaticamente la regola *Required reviewers* dell’environment.

## Dove si imposta il blocco

1. Prepara l’environment `production` in **Settings → Environments**. Se piano e visibilità lo consentono, abilita *Required reviewers* e seleziona persone o team con accesso in lettura al repository.
2. Nel workflow associa **il job che produce l’effetto esterno** a `production`. Un job preliminare approvato non protegge un altro job che pubblica autonomamente con credenziali proprie.
3. Per impedire a chi ha avviato il deployment di approvarlo, abilita *Prevent self-review*. Con la regola integrata basta **uno** tra i revisori configurati: aggiungerne due non richiede due firme.

Estratto del job di pubblicazione, non file completo. `build` è l’ID del job produttore nello stesso workflow; `steps` del deploy è omesso. Il nome dell’environment nel YAML collega il job alla regola, non la definisce.

```yaml
needs: build
runs-on: ubuntu-latest
environment: production
```

## Cosa controllare quando compare «Review deployments»

Confronta ambiente e versione attesa con **SHA o tag**, esito dei test e artifact del run. Per esempio, se devi rilasciare `v1.2.0` e il report appartiene a `v1.1.9`, non autorizzare il passaggio soltanto perché la build è verde. Controlla anche chi può ripristinare la versione precedente.

| Decisione o stato | Effetto |
| --- | --- |
| In attesa della review | Gli step protetti non iniziano e i secret dell’environment non sono disponibili al job. |
| Approva | Si soddisfa la regola di review; il job può partire se anche le altre protezioni sono soddisfatte. Non è ancora un deploy riuscito. |
| Rifiuta | Il workflow interessato fallisce; motivare il rifiuto aiuta a preparare la revisione corretta. |

Un *wait timer* misura tempo, non consenso. Le restrizioni di branch/tag scelgono i riferimenti ammessi e le eventuali regole personalizzate interrogano altri controlli. Verifica disponibilità e impostazioni di bypass amministrativo secondo la politica del progetto. Su GitHub Free, Pro e Team, GitHub documenta i *required reviewers* per i repository pubblici: non dare per scontata la stessa opzione in un repository privato.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Deploy con GitHub Actions|Deploy con GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Environments GitHub Actions|Environments GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Release automation GitHub Actions|Release automation GitHub Actions]]

## Fonti

- [GitHub Docs - Approvare o rifiutare un deployment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments)
- [GitHub Docs - Numero di approvazioni e regole disponibili](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [GitHub Docs - Impostazioni degli environment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
