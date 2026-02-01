---
date: 2026-01-31
tags: [esphome, iot, firmware]
type: #permanent-note
status: seedling
---

# ESPHome

> [!INFO] Definizione
> **ESPHome** è un sistema per controllare i microcontrollori ESP8266/ESP32 tramite semplici file di configurazione YAML, integrandoli perfettamente in Home Assistant.

## 🚀 Perché usarlo?
- **Nessuna Programmazione C++:** Si configura tutto tramite file `.yaml`.
- **Integrazione Nativa:** Comunica direttamente con Home Assistant tramite API nativa (molto più veloce di MQTT).
- **Aggiornamenti OTA:** Puoi aggiornare il firmware dei dispositivi via WiFi senza collegarli al PC.

## 📚 Concetti Fondamentali
- **Nodi:** Ogni scheda ESP è un nodo.
- **Componenti:** I sensori, luci o interruttori collegati alla scheda (es. sensore DHT, relè).
- [[Home assistant/pagine/espHome/ESPHome Packages|Packages]]: Metodo per riutilizzare parti di configurazione su più dispositivi.

## 🔗 Risorse Utili
- [Documentazione Ufficiale ESPHome](https://esphome.io/)
- [ESPHome Web Tools](https://web.esphome.io/) (per installare ESPHome via browser)