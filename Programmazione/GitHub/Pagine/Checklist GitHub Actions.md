---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-actions
  - checklist
  - ci-cd
aliases:
  - Checklist GitHub Actions
  - Checklist Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Cache GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Debug GitHub Actions]]"
title: Checklist GitHub Actions
---

# Checklist GitHub Actions

## Obiettivo

Prima di approvare un workflow, rispondere a tre domande: **quale evento lo avvia, quale codice esegue e cosa può modificare?** Prima di fidarsi di un run verde, verificare che abbia eseguito proprio il job atteso per quella revisione.

## Checklist sul file del workflow

- [ ] **Evento e destinazione.** Un controllo che deve bloccare il merge gira sulla PR verso la base corretta e, se si usa la merge queue, sul gruppo di merge. Un deploy ha invece una destinazione esplicita e parte solo dagli eventi previsti. Verificare che i filtri non saltino l'intero workflow di un check richiesto.
- [ ] **Permessi e codice fidato.** La CI di sola lettura non richiede permessi di pubblicazione. Individuare i job che ricevono scrittura, secret o accesso a un environment; verificare la provenienza dei passi eseguiti. Per runner self-hosted valutare isolamento, pulizia e chi può inviare il lavoro. Non stampare credenziali nei log.
- [ ] **Riproducibilità.** Controllare runtime, lockfile, directory dei comandi e revisioni delle action. La cache può mancare: l'installazione deve funzionare anche a cache fredda. Se una pipeline è lenta, misurare i singoli job prima di ampliare la matrix.
- [ ] **Esito e consegna.** Dare un nome stabile al check richiesto. Distinguere dipendenza tra job (`needs`) e trasferimento dei file (artifact). Verificare percorso, contenuto e conservazione dell'output; per Pages controllare anche il job di deploy.
- [ ] **Tempo e concorrenza.** Fissare timeout coerenti con il lavoro e scegliere quali run possono essere interrotti. Cancellare una CI superata sulla stessa PR può essere utile; applicare la stessa scelta a un deploy che modifica un ambiente può lasciarlo a metà.

## Esempio: cosa verificare per Pages

Questo è il blocco `concurrency` del workflow Quartz, non un workflow autonomo:

```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```

Il gruppo è comune ai deploy del sito. Un nuovo push non cancella il run **in esecuzione** per effetto di questa regola. Con la configurazione mostrata, un run ancora **in attesa** può essere sostituito da uno più recente: non è una promessa di pubblicare ogni commit.

## Checklist sul run

Con GitHub CLI autenticata, sostituire `12345` con l'ID del run (non della PR) e `OWNER/REPO` con il repository. Il comando legge i risultati, non riesegue il workflow:

```bash
gh run view 12345 --repo OWNER/REPO --json event,headSha,status,conclusion,jobs,url
```

Per un aggiornamento Quartz dopo il push a `main` verificare evento `push` e SHA atteso, `status: completed`, poi gli esiti dei job `build` e `deploy`. Un job saltato o annullato non ha eseguito il suo lavoro. Un upload riuscito con deploy saltato non dimostra che la nuova pagina sia online. Per un run manuale l'evento atteso è invece `workflow_dispatch`.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions|Eventi e trigger GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Cache GitHub Actions|Cache GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Artifacts GitHub Actions|Artifacts GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Concurrency e cancel-in-progress|Concurrency e cancel-in-progress]]
- [[Programmazione/GitHub/Pagine/Debug GitHub Actions|Debug GitHub Actions]]

## Fonti

- [GitHub Docs: concorrenza di workflow e job](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- [GitHub CLI: dati di un run](https://cli.github.com/manual/gh_run_view)
- [GitHub Docs: sicurezza dei workflow](https://docs.github.com/en/actions/reference/security/secure-use)
