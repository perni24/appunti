---
date: 2026-06-09
area: Programmi open source
topic: Condivisione mouse e tastiera
type: technical-note
status: non revisionato
difficulty: base
tags:
  - open-source
  - desktop
  - kvm
  - produttivita
aliases:
  - Barrier
prerequisites: []
related:
  - "[[Programmi open source/Pagine/RustDesk]]"
  - "[[Programmi open source/Pagine/LocalSend]]"
title: Barrier
publish: true
---

# Barrier

## Sintesi

Barrier condivide tastiera e mouse tra computer in rete. Il cursore passa da uno schermo all'altro, ma ogni computer continua a eseguire il proprio sistema: non trasmette il desktop come un programma di controllo remoto.

## Quando usarlo

Per usare piu computer vicini senza cambiare continuamente periferiche.

## Come funziona

Il computer con tastiera e mouse e il server; gli altri sono client. La disposizione degli schermi nella configurazione determina dove passa il cursore. Il progetto supporta anche la condivisione degli appunti.

## Esempio pratico

1. Installare Barrier sui computer interessati.
2. Configurare come server il computer con le periferiche.
3. Inserire i nomi esatti dei client e disporre gli schermi.
4. Collegare i client all'indirizzo del server e provare il passaggio del cursore.

## Limiti

Non e un KVM hardware completo: non trasporta il segnale video. Non presumere che il trasferimento di file o il drag-and-drop funzionino su ogni piattaforma; per i file usare un'app dedicata.

## Checklist

- Verificare compatibilita della release e permessi del sistema.
- Controllare rete, firewall, nomi degli schermi e protezione della connessione.
- Non esporre il servizio direttamente a Internet.

## Collegamenti

- [[Programmi open source/Pagine/LocalSend|LocalSend]]
- [[Programmi open source/Pagine/RustDesk|RustDesk]]
- [[Programmi open source/Indice Programmi Open Source|Catalogo open source]]

## Fonti

- [Barrier: progetto e istruzioni](https://github.com/debauchee/barrier)
