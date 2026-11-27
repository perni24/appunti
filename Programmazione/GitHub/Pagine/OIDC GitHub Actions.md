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
  - github-actions
  - oidc
  - security
  - deploy
aliases:
  - OIDC GitHub Actions
  - OpenID Connect GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Deploy con GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Environments GitHub Actions]]"
title: OIDC GitHub Actions
---

# OIDC GitHub Actions

## Sintesi

**OpenID Connect (OIDC)** permette a un job di presentare la propria identità a un provider esterno senza custodire una chiave cloud di lunga durata tra i secret. Ci sono **due decisioni separate**: GitHub permette al job di richiedere un token di identità; il provider verifica quell’identità e decide se rilasciare credenziali temporanee e con quali privilegi.

## Seguire l’identità, non il nome del workflow

1. Il job autorizzato può richiedere un token firmato da GitHub con una *audience* (`aud`) adatta al destinatario. `id-token: write` concede questa possibilità: **non** concede accesso in scrittura al repository o al cloud.
2. Il provider verifica firma, emittente (`iss`), destinatario, validità e condizioni sul soggetto (`sub`). Un’identità valida può comunque essere rifiutata se ambiente o repository non coincidono.
3. Se lo scambio riesce, il ruolo del provider stabilisce cosa si può fare. Un errore durante lo scambio e un’operazione negata **dopo** lo scambio richiedono diagnosi diverse.

Frammento da mettere sul solo job che si autentica. `contents: read` serve se quel job deve fare checkout; non è un prerequisito di OIDC. Il frammento non invia richieste: servono anche la federazione presso il provider e il suo client o la sua action ufficiale.

```yaml
environment: production
permissions:
  contents: read
  id-token: write
```

## Esempio ragionato: chi può assumere il ruolo?

Esempio **parziale**, con nomi e ID fittizi, della sola condizione di una trust policy AWS per l’audience standard di STS e il formato GitHub con ID immutabili. Non è una policy IAM completa né indica alcun ruolo del vault.

```json
{
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:esempio@123456/guida@456789:environment:production"
  }
}
```

Un job di `staging` non soddisfa questa uguaglianza. Un job che usa `production` ha invece, nel formato predefinito, un soggetto basato sull’environment: **quel soggetto non dimostra da solo che il branch sia `main`**. Limita anche i branch/tag ammessi nell’environment. Non dare per scontato che ogni provider possa confrontare qualsiasi claim presente nel token.

Su GitHub.com esistono sia il formato storico (`repo:esempio/guida:environment:production`) sia quello con ID: GitHub documenta il nuovo default per i repository creati dopo il 15 luglio 2026 e casi di migrazione per quelli esistenti. Controlla il formato configurato prima di copiare la condizione. Se non coincide, correggi il valore atteso senza allargare la policy a qualsiasi repository.

## Limiti operativi

Azure e Google Cloud usano meccanismi di federazione propri; anche alcuni registry accettano identità federate. Audience, condizioni e ruolo vanno definiti per quel servizio. Limita OIDC al job di deploy, tieni distinti staging e produzione, non stampare token nei log e revoca le vecchie chiavi statiche dopo aver verificato la migrazione. Il `GITHUB_TOKEN` per le API GitHub è una credenziale distinta.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Deploy con GitHub Actions|Deploy con GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]
- [[Programmazione/GitHub/Pagine/Environments GitHub Actions|Environments GitHub Actions]]

## Fonti

- [GitHub Docs - OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
- [GitHub Docs - Claim, environment e formato immutabile](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub Docs - Condizioni OIDC per AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
