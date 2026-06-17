---
date: 2026-06-17
area: Programmi open source
topic: Compressione contesto LLM
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [open-source, ai, llm, token, proxy, coding]
aliases: [Token Tamer, TokenTamer, token-tamer]
prerequisites: []
related: [Aider]
---

# Token Tamer

## Sintesi

**Token Tamer** e un progetto open source che funziona come proxy tra un coding agent AI e le API LLM, con l'obiettivo di ridurre il numero di token inviati al modello.

Il progetto comprime il contesto di codice considerato "di sfondo", mantenendo informazioni strutturali come import, firme di funzioni, classi e interfacce, ma rimuovendo parti non necessarie come corpi di funzioni gia lette o poco rilevanti.

## Quando usarlo

- Usare agenti di coding che inviano molto contesto ripetuto al modello.
- Ridurre costo e dimensione delle richieste LLM.
- Lavorare su repository dove i file vengono riletti molte volte nella stessa sessione.
- Sperimentare compressione del contesto mantenendo le parti strutturali del codice.
- Analizzare quanto token e costo possono essere ridotti in workflow agentici.

## Come funziona

Token Tamer si mette in mezzo tra il client e l'API del modello. Intercetta il payload, individua file attivi e file di contorno, poi sostituisce parti del codice con scheletri strutturali.

L'idea e lasciare intatti i file su cui l'agente sta lavorando e comprimere invece letture ripetute o file non direttamente modificati. Per alcuni strumenti puo bastare configurare una base URL; per altri strumenti con endpoint hardcoded puo servire intercettazione HTTPS locale.

## Esempio d'uso

```bash
# Avvio locale del proxy
token-tamer --port 8000 --no-dashboard

# Esempio con Aider
aider --openai-api-base http://127.0.0.1:8000/v1
```

## Punti forti

- **Proxy drop-in**: in alcuni workflow basta cambiare API base URL.
- **Compressione strutturale**: conserva firme, classi e import invece di tagliare testo casualmente.
- **Supporto coding agent**: pensato per strumenti come [[Aider]] e altri agenti che leggono file.
- **Tracking locale**: puo mostrare token e costo risparmiati.

## Limiti

- Il progetto dichiara di essere software alpha.
- La compressione e piu utile in sessioni lunghe con riletture ripetute.
- L'intercettazione HTTPS locale richiede attenzione, soprattutto su strumenti con endpoint hardcoded.
- Se comprime troppo o nel punto sbagliato, puo togliere contesto utile al modello.
- Va usato solo dopo aver capito bene sicurezza, certificati e routing delle API.

## Checklist

- Provarlo prima su repository non critici.
- Controllare sempre output e diff generati dall'agente.
- Usare la modalita passthrough o disabilitare compressione se qualcosa si rompe.
- Non configurarlo senza capire dove passano API key e traffico.
- Misurare risparmio reale su sessioni lunghe, non solo su test brevi.

## Collegamenti

- https://github.com/borhen68/TokenTamer
