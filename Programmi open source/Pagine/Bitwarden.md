---
date: 2026-06-09
area: Programmi open source
topic: Gestione password
type: technical-note
status: non revisionato
difficulty: base
tags:
  - open-source
  - password
  - sicurezza
  - privacy
aliases:
  - Bitwarden
prerequisites: []
related: []
title: Bitwarden
publish: true
---

# Bitwarden

## Sintesi

Bitwarden e un gestore di password con applicazioni open source. Conserva credenziali in un vault cifrato e consente di generare password diverse per ogni servizio e sincronizzarle tra dispositivi.

## Quando usarlo

Per evitare riuso delle password e gestire accessi da browser, desktop e dispositivi mobili.

## Come funziona

Il client sblocca il vault e propone le credenziali associate al sito. Il servizio puo essere ospitato da Bitwarden oppure gestito in self-hosting. L'hosting autonomo richiede aggiornamenti, backup e competenze operative.

## Esempio pratico

1. Configurare l'account e proteggere l'accesso con una passphrase robusta.
2. Installare l'estensione ufficiale.
3. Salvare un accesso di prova e controllare il dominio associato.
4. Generare una password unica e verificare la compilazione automatica.

## Limiti

La cifratura del vault non protegge da un dispositivo compromesso o da una sessione lasciata sbloccata. Funzioni e licenze dei componenti vanno distinte dai piani commerciali: open source non significa che ogni servizio sia gratuito.

## Checklist

- Attivare l'autenticazione a due fattori e custodire il recupero.
- Verificare dominio e destinazione prima della compilazione.
- Proteggere eventuali esportazioni: possono contenere dati leggibili.
- Provare backup e recupero prima di affidare tutte le credenziali al vault.

## Collegamenti

- [[Programmi open source/Indice Programmi Open Source|Catalogo open source]]

## Fonti

- [Bitwarden: estensione e primi passi](https://bitwarden.com/help/getting-started-browserext/)
