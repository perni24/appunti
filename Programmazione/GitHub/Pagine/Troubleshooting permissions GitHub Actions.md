---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - github-actions
  - permissions
  - troubleshooting
aliases:
  - Troubleshooting permissions GitHub Actions
  - Troubleshooting permessi Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Troubleshooting GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Troubleshooting secrets GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Personal access token GitHub]]"
title: Troubleshooting permissions GitHub Actions
---

# Troubleshooting permissions GitHub Actions

## Obiettivo

Davanti a `403 Forbidden` o `Resource not accessible by integration`, identificare **chi ha fatto quale richiesta, su quale risorsa e in quale job**. Un errore di autorizzazione non dimostra che il token manchi né che serva un token personale più potente.

## Procedura

1. Leggere nel primo step fallito operazione, endpoint o servizio, repository destinatario e messaggio. Per un `403` controllare anche se la risposta segnala un limite di richieste. Annotare l'identità usata senza registrare il valore della credenziale.
2. Distinguere `GITHUB_TOKEN` da un token di GitHub App, PAT o credenziale esterna. `permissions` nel workflow regola il **`GITHUB_TOKEN` di quel job**, non gli scope di un PAT né i ruoli concessi dal provider cloud.
3. Per `GITHUB_TOKEN` confrontare il blocco dei permessi nel log iniziale *Set up job* con `permissions` nel workflow e nel job. Con una mappa esplicita le categorie non specificate risultano `none`; non presumere che il job sommi le proprie voci a quelle del workflow. Verificare anche evento, origine della PR e policy di repository o organizzazione: una PR da fork normalmente opera con permessi ridotti.
4. Verificare i vincoli **sulla risorsa**. Un token con scrittura non aggira una protezione di branch o tag. Un job fermo in attesa di approvazione dell'environment non ha ancora fallito una chiamata al provider.

## Esempio: commento a una issue

Per un job fidato che deve **solo aggiungere un commento a una issue** dello stesso repository tramite l'endpoint dei commenti, questa è la sezione del job, non un workflow completo:

```yaml
permissions:
  issues: write
```

L'endpoint documenta permessi alternativi: non occorre concedere insieme `issues: write` e `pull-requests: write` per quell'operazione. Una *review* su righe di codice è invece un'altra API. Se il job esegue anche il checkout di un repository privato, valutare separatamente `contents: read`. Non applicare la scrittura ai job di test soltanto per far sparire un errore.

## Se l'operazione fallita è diversa

| Operazione | Verifica mirata |
| --- | --- |
| Creazione di una release | Permesso `contents: write` del job che pubblica, repository di destinazione ed eventuali vincoli sul tag se deve crearlo. |
| Pubblicazione di un package | Registry effettivo, identità, permesso `packages: write` se si usa GitHub Packages e accesso del repository a quello specifico package. |
| Accesso cloud con OIDC | Se fallisce la richiesta del token OIDC, verificare `id-token: write`. Se il token viene emesso ma il provider rifiuta lo scambio, verificare audience e condizioni di fiducia per repository, ref o environment. |
| Stessa operazione con GitHub App o PAT | Controllare permessi della credenziale e repository a cui ha accesso; per una App verificare anche l'installazione. Cambiare `permissions` del job non modifica quella credenziale. |

Riprovare l'operazione prevista da un evento autorizzato, preferibilmente su una risorsa di prova. Non usare `write-all` per diagnosticare e non concedere accesso a codice non fidato. Il criterio di riuscita è che **quel job** riesca nella sua operazione senza ampliare i permessi degli altri.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]
- [[Programmazione/GitHub/Pagine/Personal access token GitHub|Personal access token GitHub]]
- [[Programmazione/GitHub/Pagine/Fine-grained token GitHub|Fine-grained token GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Apps|GitHub Apps]]
- [[Programmazione/GitHub/Pagine/OIDC GitHub Actions|OIDC GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Troubleshooting GitHub Actions|Troubleshooting GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Troubleshooting secrets GitHub Actions|Troubleshooting secrets GitHub Actions]]

## Fonti

- [GitHub Docs: permissions a livello di workflow e job](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub REST: permessi per creare un commento](https://docs.github.com/en/rest/issues/comments#create-an-issue-comment)
- [GitHub Docs: identità OIDC e autorizzazione del provider](https://docs.github.com/en/actions/concepts/security/openid-connect)
