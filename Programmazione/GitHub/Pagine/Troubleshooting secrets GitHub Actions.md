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
  - secrets
  - troubleshooting
aliases:
  - Troubleshooting secrets GitHub Actions
  - Troubleshooting secret Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Gestire secrets in GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Variabili e secrets GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Troubleshooting permissions GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Environments GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Secret scanning]]"
title: Troubleshooting secrets GitHub Actions
---

# Troubleshooting secrets GitHub Actions

## Obiettivo

Distinguere tre casi: **il job non parte**, **il processo non riceve il secret**, oppure **il servizio rifiuta una credenziale presente**. Non occorre stampare valore, lunghezza, hash o ambiente completo per separarli.

## Il job parte senza il valore atteso

| Controllo | Come interpretarlo |
| --- | --- |
| Nome e contesto | Un secret non configurato si risolve in una stringa vuota. Verificare spelling e uso di `secrets.API_TOKEN`, non `vars.API_TOKEN`. I nomi dei secret GitHub **non distinguono maiuscole e minuscole**; la variabile d'ambiente letta da uno script Linux, invece, sì. |
| Livello | A parità di nome prevale l'environment sul repository e il repository sull'organizzazione. Per un secret organizzativo verificare che il repository sia autorizzato. |
| Ambiente del job | Controllare il nome di `environment` e le regole di protezione. Un job in attesa di approvazione non ha ancora eseguito lo step che dovrebbe leggere il valore. |
| Evento e passaggio | Le normali PR da fork non ricevono i secret Actions del repository base. Un workflow riutilizzabile non li riceve automaticamente: verificare il contratto e il passaggio esplicito del secret necessario. Non rendere disponibili credenziali a codice non fidato per sbloccare un test. |
| Valore ruotato di recente | I secret di organizzazione e repository sono letti quando il run entra in coda; quelli di environment quando inizia il job che lo usa. Verificare con una nuova esecuzione, non presumere che una rotazione aggiorni un processo già in corso. |

Con GitHub CLI e accesso alla gestione dei secret, sostituire repository e ambiente. Questo comando elenca **solo nomi** dello specifico environment, non tutti i secret visibili al job:

```bash
gh secret list --env staging --repo OWNER/REPO --json name
```

## Prova minima nel job interessato

Frammento da inserire sotto `steps` in un job fidato di staging. Per una prova usare un valore fittizio. Nessun checkout, comando di deploy o chiamata esterna è necessario.

```yaml
- name: Verifica disponibilità di API_TOKEN
  shell: pwsh
  env:
    API_TOKEN: ${{ secrets.API_TOKEN }}
  run: |
    if ([string]::IsNullOrWhiteSpace($env:API_TOKEN)) {
      throw "API_TOKEN non disponibile nello step"
    }
    Write-Output "API_TOKEN presente nello step"
```

Se il controllo fallisce, verificare la catena *secret → job → env dello step → variabile letta dal processo*. Se passa ma il deploy fallisce, verificare che **anche lo step che chiama il client** riceva `API_TOKEN`: un `env` di step non si propaga al successivo. Poi controllare destinazione, scadenza, scope e revoca presso il servizio.

## Se si sospetta un'esposizione

Revocare o ruotare la credenziale presso chi l'ha emessa, aggiornare il secret e verificare il nuovo accesso dal job autorizzato. Rimuovere copie e log esposti secondo la procedura del progetto; mascherare il log o cancellare il secret da GitHub **non revoca** la credenziale. Quando il provider lo supporta, valutare OIDC per evitare token statici.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Gestire secrets in GitHub Actions|Gestire secrets in GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Variabili e secrets GitHub Actions|Variabili e secrets GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Environments GitHub Actions|Environments GitHub Actions]]
- [[Programmazione/GitHub/Pagine/OIDC GitHub Actions|OIDC GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Secret scanning|Secret scanning]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]
- [[Programmazione/GitHub/Pagine/Troubleshooting permissions GitHub Actions|Troubleshooting permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Troubleshooting GitHub Actions|Troubleshooting GitHub Actions]]

## Fonti

- [GitHub Docs: precedenza, nomi e momento di lettura](https://docs.github.com/en/actions/reference/security/secrets)
- [GitHub Docs: usare e passare i secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [GitHub CLI: elencare i secret](https://cli.github.com/manual/gh_secret_list)
