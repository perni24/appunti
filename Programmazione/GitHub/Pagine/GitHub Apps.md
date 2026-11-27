---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - github-apps
  - api
  - automazione
aliases:
  - GitHub Apps
  - GitHub App
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
  - "[[Programmazione/GitHub/Pagine/Webhooks GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Webhooks GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Fine-grained token GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Personal access token GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Automazioni issue e pull request]]"
title: GitHub Apps
---

# GitHub Apps

## Sintesi

Una **GitHub App** è utile quando un’integrazione deve continuare a funzionare indipendentemente da una persona ed essere installabile su repository diversi. **Registrare** l’App definisce capacità, eventi ed eventuali URL di callback; **installarla** decide dove può operare. Rendere l’App pubblicamente installabile non le dà accesso ai repository di chi non l’ha installata.

## Quale identità sta agendo?

| Identità | A cosa serve | Limite da ricordare |
| --- | --- | --- |
| App, tramite JWT firmato con la sua chiave privata | Identificare l’App e richiedere un token per una sua installazione. | Il JWT non è la credenziale generica per commentare una issue. |
| Installazione, tramite installation access token | Eseguire un compito server-to-server, per esempio applicare una label. | Operazioni e repository dipendono dall’installazione e dai limiti del token. Il token scade normalmente dopo un’ora. |
| Utente per conto dell’App, tramite user access token | Agire in seguito all’autorizzazione di una persona. | Si applicano sia i permessi dell’App sia l’accesso dell’utente: uno non estende l’altro. |

Per uno step isolato del workflow nel proprio repository verifica prima se basta il `GITHUB_TOKEN`. Una OAuth App è orientata all’autorizzazione di un utente; una GitHub App può anche operare come installazione quando nessun utente è presente.

## Esempio pratico: triage su due repository

Supponi che l’App sia installata su `esempio/guide` e `esempio/esercizi` con `Issues: write`, ma non su `esempio/sito`. Un webhook `issues.opened` porta l’ID dell’installazione: il servizio valida la consegna, seleziona l’installazione attesa e usa il suo token per aggiungere la label al repository giusto. Non occorrono permessi di scrittura sui contenuti. Il **secret del webhook** autentica il corpo in ingresso; la **chiave privata dell’App** serve all’autenticazione in uscita: non sono intercambiabili.

Per diagnosticare il perimetro, con `gh` e **un token d’installazione già fornito al processo come `GH_TOKEN`**:

```bash
gh api --paginate installation/repositories --jq '.repositories[].full_name'
```

È una lettura. Con un token valido per entrambi i repository dell’esempio devono comparire entrambi i nomi, ma non `esempio/sito`. Se il token è stato ristretto a un solo repository, la lista può essere più corta. La sessione personale di `gh` non è un sostituto per questo controllo dell’installazione.

## Manutenzione

Proteggi e ruota la chiave privata. Conserva la scadenza restituita con il token anziché presumere che una credenziale in cache sia ancora valida. Se un repository viene rimosso o l’installazione viene sospesa, smetti di elaborarne il lavoro; rinnovare il token non ripristina un accesso revocato. Un controllo di review, un commento o uno status possono richiedere permessi diversi: parti dall’endpoint usato, non dal generico nome «bot».

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub REST API|GitHub REST API]]
- [[Programmazione/GitHub/Pagine/GitHub GraphQL API|GitHub GraphQL API]]
- [[Programmazione/GitHub/Pagine/Webhooks GitHub|Webhooks GitHub]]
- [[Programmazione/GitHub/Pagine/Personal access token GitHub|Personal access token GitHub]]
- [[Programmazione/GitHub/Pagine/Fine-grained token GitHub|Fine-grained token GitHub]]
- [[Programmazione/GitHub/Pagine/Automazioni issue e pull request|Automazioni issue e pull request]]

## Fonti

- [GitHub Docs - Registrazione e responsabilità dell’App](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps)
- [GitHub Docs - Autenticazione come installazione](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation)
- [GitHub Docs - Agire per conto di un utente](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-with-a-github-app-on-behalf-of-a-user)
- [GitHub REST - Repository accessibili all’installazione](https://docs.github.com/en/rest/apps/installations#list-repositories-accessible-to-the-app-installation)
