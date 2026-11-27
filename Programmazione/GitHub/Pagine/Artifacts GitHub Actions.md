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
  - artifacts
  - ci
aliases:
  - Artifacts GitHub Actions
  - Workflow artifacts
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Cache GitHub Actions]]"
title: Artifacts GitHub Actions
---

# Artifacts GitHub Actions

## Sintesi

Un **artifact** conserva un output identificabile di un run: per esempio un report di test, un bundle o un log diagnostico. Usalo se qualcuno deve ispezionare quel risultato o se un altro job deve consumare **proprio quei file**. Una cache non offre questa garanzia; un asset di release, invece, va pubblicato esplicitamente.

## Esempio pratico: conservare il report anche se un test fallisce

Frammento di `steps` su GitHub.com, dopo checkout, setup di Node 24 e `npm ci` in `site/`. Il comando parte dalla **radice del repository**. Il reporter JUnit del test runner Node scrive un XML nel workspace; non è un report di coverage.

```yaml
- name: Esegui i test e scrivi il report JUnit
  run: node --test --test-reporter=junit --test-reporter-destination=risultati.xml site/scripts/content.test.mjs
- name: Conserva il report del run
  if: ${{ !cancelled() && hashFiles('risultati.xml') != '' }}
  uses: actions/upload-artifact@v7
  with:
    name: report-trasformazione
    path: risultati.xml
    retention-days: 7
    if-no-files-found: error
```

Se un’asserzione fallisce, il test resta rosso. La condizione dell’upload consente di conservare il report già scritto senza trasformare il fallimento in successo. Se i test non sono nemmeno partiti e il file non esiste, l’upload viene saltato: cerca la causa nel primo step fallito. `retention-days` deve rispettare il limite del repository o dell’organizzazione.

## Leggere il risultato in un altro job

Frammento di `steps` nel job consumatore **dello stesso run**. Aggiungi `needs` con l’ID del produttore per aspettarne la fine. Normalmente un job dipendente parte solo dopo il successo; se deve diagnosticare un fallimento, serve anche una condizione esplicita sul **job** e va gestito il possibile report mancante.

```yaml
- uses: actions/download-artifact@v8
  with:
    name: report-trasformazione
    path: scaricati
```

Con il nome esplicito, il file si trova in `scaricati/risultati.xml`. Il download di un artifact non richiede il checkout del sorgente. Per il controllo umano puoi scaricarlo dal riepilogo del run finché non scade.

## Errori comuni

- In una matrix assegna a ciascun upload un nome distinto (per esempio con OS e runtime). Non far scrivere più job nello stesso artifact immutabile.
- Carica soltanto i file previsti: log completi, dump del database e configurazioni locali possono contenere credenziali. Per il coverage scegli il reporter del progetto e verifica che produca la directory indicata.
- Il sito Quartz è un caso diverso: il job di build usa `actions/upload-pages-artifact` per `site/public`; il job di deploy lo pubblica. Caricare un comune artifact con gli HTML non aggiorna il sito.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Cache GitHub Actions|Cache GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]

## Fonti

- [GitHub Docs - Salvare e condividere gli artifact](https://docs.github.com/en/actions/tutorials/store-and-share-data)
- [actions/upload-artifact - File, nomi e conservazione](https://github.com/actions/upload-artifact/tree/v7)
- [actions/download-artifact - Destinazione e nome](https://github.com/actions/download-artifact/tree/v8)
- [Node.js - Test reporter e destinazioni](https://nodejs.org/docs/latest-v24.x/api/test.html)
