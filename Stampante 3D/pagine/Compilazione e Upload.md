---
date: 2026-03-02
tags: [compilation, upload, platformio, vscode, build, marlin]
type: #permanent-note
status: budding
---

# Compilazione e Upload (PlatformIO e VS Code)

Marlin 2.0+ non viene più compilato con l'IDE di Arduino a causa della complessità e delle varie architetture a 32-bit. Lo standard attuale è **VS Code** con l'estensione **PlatformIO**.

## 1. Strumenti Necessari

- **Visual Studio Code (VS Code):** L'editor di codice.
- **PlatformIO IDE:** Plugin per VS Code che gestisce biblioteche, toolchain e compilazione.
- **Auto Build Marlin (Plugin consigliato):** Un'interfaccia semplificata per compilare e caricare Marlin con un solo click.

---

## 2. PlatformIO.ini

È il file di configurazione principale per il processo di build. Qui si definisce l'ambiente di compilazione (`default_envs`) in base all'MCU della scheda madre.

> [!INFO] Esempio Ambiente
> Se usi una SKR MINI E3 v2 (STM32F103) dovrai impostare:
> `default_envs = STM32F103RC_btt` nel file `platformio.ini`.

### Marlin Auto Build
Questo plugin analizza automaticamente i file `Configuration.h` e propone l'ambiente corretto senza dover editare manualmente `platformio.ini`.

---

## 3. Il Ciclo di Build

1.  **Clean:** Rimuove i file binari precedenti (facoltativo ma consigliato prima di modifiche radicali).
2.  **Build:** Compila il codice sorgente. Se l'operazione ha successo, vedrai un messaggio verde `SUCCESS`.
3.  **Upload:** Invia il firmware compilato alla stampante (via cavo USB o creando un file `.bin` sulla SD).

### Flashing via SD
Molte schede moderne a 32-bit (es. BigTreeTech, Creality 4.2.x) non permettono il flash diretto via USB.
1.  Il file compilato `firmware.bin` si trova in `.pio/build/<tuo_env>/`.
2.  Copia il file su una micro SD vuota.
3.  Inserisci la SD nella stampante spenta e accendila.
4.  Attendi qualche secondo; se il file viene rinominato in `firmware.cur`, il flash è avvenuto con successo.

---