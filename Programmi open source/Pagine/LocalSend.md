---
date: 2026-06-09
area: Programmi open source
topic: Condivisione file in rete locale
type: technical-note
status: non revisionato
difficulty: base
tags:
  - open-source
  - file-sharing
  - rete-locale
  - privacy
aliases:
  - LocalSend
prerequisites: []
related:
  - "[[Programmi open source/Pagine/Barrier]]"
title: LocalSend
publish: true
---

# LocalSend

## Sintesi

LocalSend trasferisce file e messaggi tra dispositivi nella rete locale, senza un server cloud obbligatorio. E disponibile per piu sistemi desktop e mobili.

## Quando usarlo

Per spostare documenti tra telefono e computer o tra computer vicini senza configurare una condivisione di rete permanente.

## Come funziona

I dispositivi si individuano nella rete locale e il mittente sceglie destinatario e contenuto. Il trasferimento e diretto; il progetto usa HTTPS per proteggere il traffico.

## Esempio pratico

1. Aprire LocalSend sui due dispositivi.
2. Collegarli a una rete che permetta la comunicazione tra client.
3. Selezionare file e destinatario.
4. Accettare la ricezione e verificare i file arrivati.

## Limiti

Essere sullo stesso Wi-Fi non basta se il router isola i client. Firewall e permessi possono impedire rilevamento e trasferimento. Non e uno strumento di sincronizzazione continua o un backup.

## Checklist

- Controllare il destinatario prima dell'invio.
- Evitare ricezione automatica su reti non fidate.
- Verificare spazio libero e permessi della cartella di destinazione.
- Per reti diverse scegliere un altro metodo di trasferimento.

## Collegamenti

- [[Programmi open source/Pagine/Barrier|Barrier]]
- [[Programmi open source/Indice Programmi Open Source|Catalogo open source]]

## Fonti

- [LocalSend: sito ufficiale](https://localsend.org/)
