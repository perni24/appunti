# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-07-07 - Revisione qualitativa area GitHub

### Fatto

- Controllata l'area `Programmazione/GitHub` dopo il completamento dell'indice.
- Normalizzati i `type` di 4 note che usavano struttura tecnica ma frontmatter operativo.
- Aggiunta la sezione `Fonti` a 34 note GitHub piu vecchie usando riferimenti ufficiali GitHub o specifiche autorevoli.

### Decisioni

- Le note modificate restano con `status: "non revisionato"`.
- Le note mantengono la struttura gia presente; e stato corretto solo cio che era incoerente a livello di metadati o tracciabilita fonti.

### Prossimi passi

- Eventuale lettura manuale dei contenuti per accorpare duplicazioni concettuali tra note vicine.

## 2026-07-07 - Troubleshooting GitHub

### Fatto

- Create 5 pagine operative dell'area `Programmazione/GitHub/Pagine` per il blocco `Troubleshooting`.
- Compilate note su troubleshooting pull request, merge conflict, GitHub Actions, permissions e secrets.
- Aggiornato `Programmazione/GitHub/Indice GitHub.md` trasformando in wikilink le ultime voci dell'indice.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- Il blocco finale privilegia diagnosi rapida, comandi minimi e checklist di verifica.

### Prossimi passi

- Rivedere l'intera area GitHub con una lettura qualitativa o collegarla ad altri indici di programmazione se utile.

## 2026-07-07 - Checklist operative GitHub

### Fatto

- Create 5 pagine operative dell'area `Programmazione/GitHub/Pagine` per il blocco `Checklist`.
- Compilate checklist per repository, pull request, sicurezza, GitHub Actions e release.
- Aggiornato `Programmazione/GitHub/Indice GitHub.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- Le checklist sono pensate come controlli rapidi prima di considerare una configurazione pronta, non come spiegazioni estese.

### Prossimi passi

- Completare il blocco finale `Troubleshooting`.

## 2026-07-07 - Procedure pratiche GitHub

### Fatto

- Create 6 pagine operative dell'area `Programmazione/GitHub/Pagine` per il blocco `Procedure pratiche`.
- Compilate procedure su creazione repository, pull request, branch protection, pipeline CI, GitHub Pages e secrets GitHub Actions.
- Aggiornato `Programmazione/GitHub/Indice GitHub.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- Le procedure usano il template operativo, con passaggi, snippet, debug rapido e checklist finale.

### Prossimi passi

- Continuare con il blocco `Checklist`.

## 2026-07-07 - Governance e manutenzione GitHub

### Fatto

- Create 7 pagine dell'area `Programmazione/GitHub/Pagine` per il blocco `Governance e manutenzione`.
- Compilati contenuti reali su governance repository, repository hygiene, archiviazione, migrazione, release, tag/versioni/changelog e template organizzativi.
- Aggiornato `Programmazione/GitHub/Indice GitHub.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- La sezione tratta ciclo di vita, standard organizzativi e manutenzione come parte della padronanza dello strumento, non solo come configurazioni isolate.

### Prossimi passi

- Continuare con il blocco `Procedure pratiche`.

## 2026-07-07 - API e automazione GitHub

### Fatto

- Create 7 pagine dell'area `Programmazione/GitHub/Pagine` per il blocco `API e automazione`.
- Compilati contenuti reali su REST API, GraphQL API, webhooks, GitHub Apps, personal access token, fine-grained token e automazioni per issue/pull request.
- Aggiornato `Programmazione/GitHub/Indice GitHub.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- La sezione distingue script personali, token granulari, GitHub Apps e webhooks come livelli diversi di automazione.

### Prossimi passi

- Continuare con il blocco `Governance e manutenzione`.

## 2026-07-07 - Actions avanzato GitHub

### Fatto

- Create 7 pagine dell'area `Programmazione/GitHub/Pagine` per il blocco `Actions avanzato`.
- Compilati contenuti reali su reusable workflows, composite actions, self-hosted runners, concurrency, workflow manuali/schedulati, debug e costi/limiti.
- Aggiornato `Programmazione/GitHub/Indice GitHub.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- La sezione distingue riuso di step, riuso di workflow, gestione runner e controllo operativo delle run.

### Prossimi passi

- Continuare con il blocco `API e automazione`.

## 2026-07-07 - CD release e deploy GitHub Actions

### Fatto

- Create 7 pagine dell'area `Programmazione/GitHub/Pagine` per il blocco `CD, release e deploy`.
- Compilati contenuti reali su deploy, environments, approval, release automation, GitHub Pages, GitHub Packages e OIDC.
- Aggiornato `Programmazione/GitHub/Indice GitHub.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- La sezione distingue deploy, release asset, package e OIDC come passaggi separati con permessi e rischi diversi.

### Prossimi passi

- Continuare con il blocco `Actions avanzato`.

## 2026-07-07 - CI con GitHub Actions

### Fatto

- Create 7 pagine dell'area `Programmazione/GitHub/Pagine` per il blocco `CI con GitHub Actions`.
- Compilati contenuti reali su pipeline CI, workflow per test/lint/build, matrix strategy, cache, artifacts, service containers e permissions.
- Aggiornato `Programmazione/GitHub/Indice GitHub.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- La sezione distingue cache e artifact, e tratta i permessi del `GITHUB_TOKEN` come parte essenziale della sicurezza CI.

### Prossimi passi

- Continuare con il blocco `CD, release e deploy`.

## 2026-07-07 - Fondamenti GitHub Actions

### Fatto

- Create 7 pagine dell'area `Programmazione/GitHub/Pagine` per il blocco `Fondamenti GitHub Actions`.
- Compilati contenuti reali su GitHub Actions, workflow, eventi/trigger, jobs/steps/runners, sintassi YAML, marketplace delle action e variabili/secrets.
- Aggiornato `Programmazione/GitHub/Indice GitHub.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- Le note GitHub Actions includono riferimenti alla documentazione ufficiale GitHub per le parti soggette a cambiamento.

### Prossimi passi

- Continuare con il blocco `CI con GitHub Actions`.
