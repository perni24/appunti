---
date: 2026-06-09
area: Programmi open source
topic: Creazione USB multiboot
type: technical-note
status: non revisionato
difficulty: base
tags:
  - open-source
  - usb
  - multiboot
  - iso
aliases:
  - YUMI
  - Your Universal Multiboot Installer
prerequisites: []
related: []
title: YUMI
publish: true
---

# YUMI

## Sintesi

YUMI prepara un supporto USB multiboot: un menu consente di avviare piu immagini, per esempio installer o strumenti di recupero, dallo stesso dispositivo.

## Quando usarlo

Per una chiavetta di installazione o diagnostica con piu sistemi e utility.

## Come funziona

La preparazione installa la struttura di avvio; successivamente si aggiungono le immagini supportate. Edizioni diverse di YUMI hanno requisiti e compatibilita differenti: seguire la documentazione della variante effettivamente scaricata.

## Esempio pratico

1. Scaricare YUMI e le immagini dai rispettivi progetti ufficiali.
2. Fare il backup della chiavetta e identificarla tramite capacita e modello.
3. Preparare il supporto e aggiungere un'immagine.
4. Provare l'avvio sulla macchina destinataria prima di aggiungere le altre.

## Limiti

La preparazione o formattazione puo cancellare i dati del dispositivo. Avvio BIOS, UEFI, Secure Boot e persistenza dipendono da variante, immagine e hardware. Aggiungere una ISO a un supporto gia preparato non equivale a riscrivere l'intero dispositivo.

## Checklist

- Verificare quale disco verra modificato.
- Controllare integrita e origine delle immagini.
- Conservare altrove backup e dati importanti.
- Distinguere licenza del programma e licenze delle ISO incluse.

## Collegamenti

- [[Programmi open source/Indice Programmi Open Source|Catalogo open source]]

## Fonti

- [YUMI: varianti e procedura ufficiale](https://pendrivelinux.com/yumi-multiboot-usb-creator/)
