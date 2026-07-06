---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, secret-scanning, security, credentials]
aliases: [Secret scanning, GitHub secret scanning]
prerequisites: [Repository GitHub, Sicurezza dei token GitHub]
related: [Sicurezza dei token GitHub, Code scanning]
---

# Secret scanning

## Sintesi

**Secret scanning** cerca token, chiavi API, password e altre credenziali esposte nel repository. GitHub puo rilevare pattern noti, segnalare alert e, in alcuni casi, bloccare push con push protection.

E una protezione critica perche un secret committato va considerato compromesso: rimuoverlo dalla history non basta.

## Quando usarlo

Usalo quando:

- il repository contiene codice applicativo o configurazioni;
- lavori con cloud provider, API esterne o deploy;
- hai contributor esterni;
- vuoi bloccare credenziali prima del push;
- vuoi monitorare repository pubblici;
- vuoi ridurre rischio di incidenti supply chain.

## Come funziona

Secret scanning confronta contenuti del repository con pattern noti o personalizzati. Le funzionalita possono includere:

- alert su secret rilevati;
- push protection;
- custom patterns;
- validity checks, quando supportati;
- bypass controllato;
- notifiche a provider partner, dove applicabile.

## API / Sintassi

Esempi di file da proteggere con `.gitignore`:

```gitignore
.env
.env.local
*.pem
*.key
secrets.json
```

Esempio di variabile ambiente invece di secret hardcoded:

```bash
export API_TOKEN="..."
```

Nel codice:

```js
const token = process.env.API_TOKEN;
```

## Esempio pratico

Se viene committato un token:

1. revoca subito il token presso il provider;
2. crea un token nuovo;
3. sostituisci il secret nei sistemi legittimi;
4. rimuovi il riferimento dal codice;
5. valuta se riscrivere history, ma non considerarla soluzione sufficiente;
6. chiudi l'alert solo dopo revoca e verifica.

## Varianti

- **Secret scanning alert**: notifica su secret trovato.
- **Push protection**: blocca il push prima che il secret entri nel repository.
- **Custom pattern**: rileva formati interni.
- **Validity check**: aiuta a capire se un secret e ancora valido.
- **Bypass request**: eccezione tracciata quando il blocco e falso positivo.

## Errori comuni

- Pensare che cancellare il file risolva il leak.
- Non revocare il token.
- Conservare secret in `.env` versionati.
- Usare token personali in CI.
- Disattivare push protection per comodita.
- Non creare pattern custom per segreti interni.

## Checklist

- Secret scanning e attivo?
- Push protection e abilitata dove possibile?
- `.env` e file chiave sono ignorati?
- I token esposti vengono revocati subito?
- I secret CI sono in GitHub Secrets o sistema equivalente?
- Gli alert hanno processo di triage?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Sicurezza dei token GitHub]]
- [[Repository settings]]
- [[Code scanning]]

## Fonti

- [GitHub Docs - Secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning)
