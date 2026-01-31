## 📦Concetto

Il sistema dei **Packages** permette di suddividere la configurazione YAML in più file. È l'equivalente della programmazione modulare: scrivi il codice una volta e lo riusi ovunque.

### 🏗️ La Struttura Standard

Invece di avere un unico file enorme, dividi il lavoro in due parti:

1. **Il File Base (Il "Cuore"):** Contiene la logica, i sensori, i pin e le impostazioni WiFi comuni.
    
2. **Il File Dispositivo (L' "Identità"):** Contiene solo il nome univoco e l'importazione del file base.
    

---

### 🛠️ Gli Strumenti Chiave

| **Strumento**       | **Funzione**                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **`!include`**      | Carica un file locale presente nella stessa cartella.                                        |
| **`packages`**      | La sezione dello YAML dove elenchi i moduli da importare.                                    |
| **`substitutions`** | Variabili (come `${nome}`) che permettono al file base di adattarsi al nome del dispositivo. |

---

### 🔄 Flusso di Lavoro (Esempio)

#### 1. Creazione del Modulo (`comune.yaml`)

YAML

```
# Qui metti tutto ciò che si ripete
wifi:
  ssid: "MiaRete"
  password: "PasswordSegreta"

sensor:
  - platform: dht
    pin: 4
    temperature:
      name: "${friendly_name} Temperatura"
```

#### 2. Creazione dei Dispositivi

Per ogni nuova scheda che aggiungi, scriverai solo questo:

YAML

```
substitutions:
  device_name: "sensore-cucina"
  friendly_name: "Cucina"

esphome:
  name: ${device_name}

packages:
  funzioni_base: !include comune.yaml
  # per importare lo yaml da github 
  core: github://tuo-utente/tuo-repo/base_teca.yaml@main
```

---

### ✅ Vantaggi Principali

- **Manutenzione Rapida:** Se cambi la password del WiFi, modifichi **1 solo file** invece di 10.
    
- **Codice Pulito:** I file dei singoli dispositivi diventano lunghi 10 righe invece di 100.
    
- **Aggiornamenti Semplificati:** Tramite il tasto **"Update All"** della dashboard, ESPHome ricompila tutti i dispositivi partendo dall'ultima versione del tuo file base.
    
- **Condivisione:** Puoi caricare il tuo file base su **GitHub** e importarlo nei tuoi progetti usando l'URL, rendendo i tuoi setup portatili.
    

---

### ⚠️ Cosa ricordare

- **Priorità:** Se definisci la stessa cosa sia nel file base che nel file dispositivo, quello nel file dispositivo (dove c'è la chiamata `packages`) solitamente "vince" o si aggiunge, a seconda del componente.
    
- **Nomi Unici:** Usa sempre le `substitutions` per i nomi delle entità, altrimenti Home Assistant vedrà sensori con nomi identici e creerà conflitti.