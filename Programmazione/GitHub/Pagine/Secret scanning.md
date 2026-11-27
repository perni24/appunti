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
  - secret-scanning
  - security
  - credentials
aliases:
  - Secret scanning
  - GitHub secret scanning
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Code scanning]]"
title: Secret scanning
---

# Secret scanning

## Sintesi

**Secret scanning** segnala credenziali riconosciute in contenuti già presenti su GitHub, inclusa la storia Git. **Push protection** può invece bloccare un push che contiene un segreto riconosciuto, prima che venga accettato. Entrambi dipendono dalla copertura dei rilevatori e dalle funzioni abilitate: l’assenza di alert non dimostra l’assenza di segreti.

## Tre casi da non confondere

| Evento | Che cosa significa | Prima decisione |
| --- | --- | --- |
| Push bloccato | GitHub non ha accettato quel push. La credenziale potrebbe però essere stata condivisa altrove. | Rimuovi il valore dalle modifiche da pubblicare e verifica se esistono altre copie esposte. Non trattare un token reale come un falso positivo. |
| Alert su un commit già pubblicato | Il valore è stato presente nella storia, anche se il file attuale non lo contiene più. | Identifica l’emittente e revoca o ruota la credenziale. Non aspettare la pulizia della storia. |
| Validità `unknown` | Per quel tipo di credenziale la validità non è stata determinata. | Non equivale a `inactive`: verifica tramite il provider. Non pubblicare il valore per chiedere conferma. |

Alcuni rilevamenti vengono notificati ai provider partner; il comportamento varia per tipo di credenziale. Non presumere che una notifica abbia già comportato la revoca. Per formati interni valuta pattern personalizzati dove supportati; per eccezioni legittime usa il processo di approvazione del progetto, non credenziali vere nei test.

## Prevenzione: cosa fa davvero .gitignore

Esempio di regole Git per file locali. Nell’eventuale `.env.example` versionato lascia solo nomi e valori dimostrativi:

```gitignore
.env
.env.local
*.pem
*.key
secrets.json
```

Quando il percorso non è già tracciato, questo comando mostra **quale regola** lo ignora, senza leggerne il contenuto:

```bash
git check-ignore -v -- .env
```

Quest’altro comando verifica invece se Git lo traccia già:

```bash
git ls-files -- .env
```

Se il secondo stampa `.env`, aggiungere il nome a `.gitignore` non lo rimuove né dall’indice né dai commit passati. Se non stampa nulla, non dimostra che il file non sia mai stato condiviso. L’applicazione può leggere il valore da `process.env.API_TOKEN` dopo che il sistema di esecuzione lo ha fornito: evita di inserirlo nei comandi salvati nella cronologia o di stamparlo nei log.

## Risposta a un’esposizione confermata

1. Revoca la credenziale esposta o ruotala presso l’emittente, assicurandoti che il valore precedente non sia più valido. Aggiorna solo i consumatori autorizzati e verifica il funzionamento con la sostituzione.
2. Controlla i log di utilizzo disponibili nella finestra di esposizione e correggi la fonte: codice, configurazione, artefatto o log di build. Conserva nel registro dell’incidente riferimenti e orari, **non** il valore segreto.
3. Valuta con i manutentori l’eventuale bonifica della storia e delle copie. Chiudi l’alert con la motivazione corretta dopo aver verificato la revoca e registrato le azioni: chiudere l’alert non invalida la credenziale.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]
- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/Code scanning|Code scanning]]

## Fonti

- [GitHub Docs: secret scanning e monitoraggio dei provider](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning)
- [GitHub Docs: push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)
- [GitHub Docs: come interpretare la validità](https://docs.github.com/en/code-security/concepts/secret-security/validity-checks)
- [GitHub Docs: risoluzione degli alert](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-secret-scanning-alerts/resolving-alerts)
- [Git: effetto delle regole sui file non tracciati](https://git-scm.com/docs/gitignore)
