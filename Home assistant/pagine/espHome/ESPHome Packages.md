---
date: 2026-02-10
tags: [esphome, yaml, configuration, best-practices, packages, github]
type: #permanent-note
status: budding
---

# ESPHome Packages: Modularità e Riutilizzo

## 📦 Concetto

Il sistema dei **Packages** in ESPHome è una funzionalità potente che permette di organizzare la configurazione YAML in file modulari e riutilizzabili. Immagina la programmazione modulare applicata alla configurazione hardware: scrivi il codice una volta e lo riusi su molti dispositivi, sia a livello locale che condividendolo via piattaforme come GitHub. Questo riduce la duplicazione, semplifica la manutenzione e favorisce una configurazione più pulita e scalabile.

### 🏗️ La Struttura Standard (Local & Remote)

Invece di un unico file di configurazione monolitico, la best practice prevede di dividere il lavoro in due tipologie principali di file:

1.  **File Base (o Pacchetto Modulare):** Contiene la logica comune, i sensori, le impostazioni WiFi, i pin, o altre configurazioni che desideri riutilizzare. Questi possono essere file locali (`.yaml`) o pacchetti ospitati esternamente (es. su GitHub).
2.  **File del Dispositivo (L'Identità Specifica):** Un file YAML minimo che definisce le proprietà uniche di un dispositivo specifico (es. nome, nome descrittivo, chiavi API, password OTA) e importa i "File Base" necessari.

---

### 🛠️ Gli Strumenti Chiave per i Packages

| **Strumento**       | **Funzione**                                                                                                                                                                                                                                                                                          |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`packages`**      | La sezione principale dello YAML dove si dichiara quali pacchetti esterni o file base devono essere importati. Permette di definire la sorgente (locale o remota) e le opzioni di aggiornamento.                                                                                                        |
| **`!include`**      | Direttiva YAML per caricare il contenuto di un altro file YAML locale. Utile per suddividere configurazioni specifiche del progetto o del dispositivo senza usare la piena potenza dei `packages`.                                                                                                    |
| **`substitutions`** | Variabili (`${nome_variabile}`) che consentono di rendere i pacchetti generici. Il file del dispositivo sovrascriverà questi placeholder, permettendo al pacchetto di adattarsi automaticamente al contesto specifico del dispositivo (es. nome del dispositivo, password specifiche, ecc.). |

---

### 🔄 Flusso di Lavoro Consigliato (con Esempi reali)

Prendiamo ispirazione dalla tua struttura di repository su GitHub (`perni24/esp_home_script`) per illustrare un flusso di lavoro efficace.

#### 1. Definizione dei Pacchetti Modulari (Es. in `core/` o `boards/` su GitHub)

Questi file contengono configurazioni generiche e riutilizzabili. Possono essere ospitati localmente o, per massima flessibilità, su un repository GitHub.

**Esempio di `thread_FTD_config.yaml` (dal tuo `core/`):**

```yaml
substitutions:
  openthread_tlv: ""
  openthread_force_dataset: "true"
  ota_password: ""

esp32:
  framework:
    sdkconfig_options:
      CONFIG_OPENTHREAD_ENABLED: "y"

network:
  enable_ipv6: true

ota:
  - platform: esphome
    password: ${ota_password}

openthread:
  tlv: ${openthread_tlv}
  device_type: FTD
  force_dataset: ${openthread_force_dataset}
```
Questo pacchetto definisce configurazioni OpenThread, network IPv6 e OTA, rendendole riutilizzabili grazie alle `substitutions`.

#### 2. Configurazione del Dispositivo Specifico (Es. in `devices/` su GitHub)

Questo è il file YAML principale per un singolo dispositivo. Contiene le `substitutions` specifiche del dispositivo e importa i pacchetti modulari necessari.

**Esempio di `thread_router_longrange.yaml` (dal tuo `devices/esp32-c6/`):**

```yaml
substitutions:
  name: "router-cucina"
  friendly_name: "Router Thread Cucina"
  api_key: "IL_TUO_API_KEY_QUI"
  openthread_tlv: "0x01020304..." 
  openthread_force_dataset: "false" 
  ota_password: "TUA_PASSWORD_PASSWORD"

esphome:
  name: ${name}

packages:
  # Importa la configurazione della board specifica
  board:
    url: https://github.com/perni24/esp_home_script.git
    ref: main
    file: boards/esp32-c6.yaml
    refresh: 1d 

  # Importa la configurazione core per i dispositivi Full Thread Device
  core:
    url: https://github.com/perni24/esp_home_script.git
    ref: main
    file: core/thread_FTD_config.yaml
    refresh: 1d
```
In questo esempio:
- Le `substitutions` definiscono i valori unici per questo specifico router (nome, friendly name, etc.).
- La sezione `packages` importa due configurazioni:
    - `board`: da un file specifico nella cartella `boards` del tuo repository.
    - `core`: da un file nella cartella `core` del tuo repository, che definisce il comportamento Thread FTD.
- I parametri `url`, `ref`, `file` e `refresh` specificano come recuperare il pacchetto da GitHub e con quale frequenza controllare gli aggiornamenti.

---

### ✅ Vantaggi Principali

-   **Manutenzione Centralizzata e Rapida:** Modifica un'impostazione comune (es. password WiFi, configurazione Thread) in **un solo file** (il pacchetto modulare), e la modifica verrà applicata a tutti i dispositivi che importano quel pacchetto al prossimo aggiornamento. Questo elimina la necessità di modificare manualmente decine di file YAML.
-   **Codice Pulito e Leggibile:** I file di configurazione dei singoli dispositivi diventano estremamente concisi (spesso meno di 20 righe), contenendo solo le personalizzazioni e le importazioni dei pacchetti. Questo migliora drasticamente la leggibilità e la navigabilità del progetto.
-   **Riutilizzo e Condivisione Semplificati:** Caricando i tuoi pacchetti su un repository GitHub, puoi riutilizzarli facilmente in qualsiasi tuo progetto ESPHome. Questo non solo rende le tue configurazioni altamente portatili, ma facilita anche la condivisione di best practice e configurazioni standardizzate all'interno di una comunità o di un team.
-   **Aggiornamenti Automizzati:** Tramite il parametro `refresh` nei `packages` remoti, ESPHome può ricompilare automaticamente i tuoi dispositivi partendo dall'ultima versione dei tuoi pacchetti base ospitati su GitHub, garantendo che tutti i dispositivi siano sempre allineati alle configurazioni più recenti.
-   **Versionamento Nativo:** L'hosting su Git (come GitHub) fornisce un sistema di versionamento robusto per le tue configurazioni base, permettendoti di tracciare le modifiche, tornare a versioni precedenti e collaborare in modo efficiente.

---

### ⚠️ Cosa Ricordare

-   **Priorità e Sovrascrittura:** Le configurazioni definite direttamente nel file del dispositivo hanno solitamente la precedenza su quelle importate tramite `packages` o `!include`. Questo è fondamentale per permettere la personalizzazione.
-   **Nomi Unici per le Entità:** Utilizza sempre le `substitutions` per definire i nomi delle entità (`name`, `friendly_name`) in modo che ogni dispositivo abbia un identificatore unico in Home Assistant, prevenendo conflitti e migliorando l'organizzazione.
-   **Gestione delle Dipendenze:** Quando si usano pacchetti da repository esterni, assicurati che il `ref` (es. `main`, `v1.0.0`) punti a una versione stabile o a un branch specifico per evitare rotture dovute a modifiche inattese nel pacchetto sorgente.
-   **Cache:** ESPHome memorizza nella cache i pacchetti remoti. Il parametro `refresh` indica ogni quanto tempo la cache deve essere invalidata e il pacchetto riscaricato. Durante lo sviluppo, potresti voler impostare un `refresh` più aggressivo o cancellare manualmente la cache di ESPHome.