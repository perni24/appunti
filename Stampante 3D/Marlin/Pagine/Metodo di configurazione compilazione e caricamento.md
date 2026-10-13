---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: operational-note
publish: true
difficulty: base
tags:
  - marlin
  - platformio
  - compilazione
  - firmware
aliases:
  - Compilare Marlin
  - Caricare Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita]]"
  - "[[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin]]"
related: []
marlin-version: 2.1.2.8
title: Metodo di configurazione, compilazione e caricamento
status: non revisionato
---

# Metodo di configurazione, compilazione e caricamento

## Obiettivo

Modificare Marlin 2.1.2.8 con un processo ripetibile che permetta di:

- partire da sorgenti integri;
- isolare gli errori;
- produrre il firmware per l'ambiente corretto;
- caricarlo senza perdere la configurazione precedente;
- verificare quali impostazioni siano realmente attive;
- tornare rapidamente a una build funzionante.

## Quando usarlo

La procedura va seguita:

- alla prima configurazione;
- dopo un cambio di scheda o componente;
- quando si abilita una nuova funzione;
- quando si modifica un parametro compile-time;
- quando si migra da una release Marlin precedente;
- quando il firmware caricato non sembra usare i nuovi valori.

## Prerequisiti

- sorgente ufficiale Marlin `2.1.2.8`;
- documentazione dell'hardware;
- `Configuration.h` e `Configuration_adv.h` coerenti con la release;
- Visual Studio Code con PlatformIO oppure Auto Build Marlin;
- metodo di caricamento supportato dalla scheda;
- collegamento dati affidabile;
- copia del firmware e della configurazione precedenti;
- possibilita di inviare G-code e leggere la console seriale.

Il README ufficiale indica PlatformIO con Visual Studio Code come scelta preferibile per Marlin 2.1, pur mantenendo altre possibilita di build.

## Procedura

### Preparare una copia di lavoro

Scaricare o clonare il tag `2.1.2.8`, quindi lavorare in una cartella separata. Non modificare l'unica copia disponibile del firmware funzionante.

Conservare almeno:

- vecchi `Configuration.h` e `Configuration_adv.h`;
- file binario precedentemente caricato, se disponibile;
- nome esatto della scheda e del processore;
- ambiente di compilazione usato;
- output di `M503`;
- note sulle modifiche hardware.

### Verificare il sorgente pulito

Prima di personalizzare Marlin:

1. aprire come progetto la cartella che contiene `platformio.ini`;
2. verificare che `Marlin/Configuration.h` e `Marlin/Configuration_adv.h` esistano;
3. controllare che il repository sia sul tag `2.1.2.8`;
4. eseguire una build di riferimento;
5. conservare il risultato o il log.

Una build pulita riuscita separa i problemi dell'ambiente di sviluppo da quelli introdotti dalla configurazione.

### Identificare scheda e ambiente

`MOTHERBOARD` seleziona la definizione hardware:

```cpp
#define MOTHERBOARD BOARD_RAMPS_14_EFB
```

Il valore mostrato e quello predefinito del file ufficiale, non una scelta universale.

L'ambiente PlatformIO dipende dalla scheda e dal microcontrollore. Il `platformio.ini` della release contiene `mega2560` come ambiente predefinito, ma non deve essere usato automaticamente per hardware differente.

Auto Build Marlin puo mostrare gli ambienti associati alla scheda configurata. In alternativa bisogna consultare i file della piattaforma in `ini/` e la documentazione della scheda.

### Configurare prima l'hardware essenziale

Procedere per blocchi:

1. scheda madre, processore e comunicazione;
2. cinematica, dimensioni e limiti;
3. motori, driver e direzioni;
4. finecorsa e homing;
5. sensori e protezioni termiche;
6. hotend, piatto e ventole;
7. display e periferiche;
8. funzionalita avanzate.

Compilare dopo ogni blocco. Una modifica piccola rende leggibile l'errore e semplifica il rollback.

### Eseguire la build

Con Auto Build Marlin:

1. aprire il progetto Marlin in Visual Studio Code;
2. aprire il pannello Auto Build Marlin;
3. selezionare l'ambiente corretto;
4. avviare `Build`;
5. leggere il primo errore significativo, non soltanto l'ultima riga.

Con PlatformIO CLI, sostituire il segnaposto con l'ambiente verificato:

```powershell
pio run -e <environment>
```

Non aggiungere o rimuovere direttive casualmente per eliminare un errore. I controlli di Marlin spesso indicano una dipendenza mancante, un'opzione rinominata o una combinazione non valida.

### Individuare l'artefatto

Gli artefatti PlatformIO vengono normalmente prodotti sotto:

```text
.pio/build/<environment>/
```

Il formato e il nome dipendono dalla piattaforma. Possono essere presenti file come `.bin`, `.hex` o immagini specifiche della scheda.

Non rinominare o copiare un artefatto sulla scheda SD senza aver verificato la procedura prevista dal bootloader.

### Controllare prima del caricamento

Verificare almeno:

- scheda e ambiente corretti;
- sensori di temperatura configurati;
- protezioni termiche non disabilitate;
- pin di heater e ventole coerenti;
- direzione logica dei finecorsa;
- limiti e dimensioni plausibili;
- driver e corrente compatibili;
- disponibilita di un metodo di ripristino.

Prima accensione e primi test devono avvenire con possibilita di togliere alimentazione immediatamente.

### Caricare il firmware

Il caricamento puo essere eseguito da Auto Build Marlin, da PlatformIO o con il metodo specifico della scheda.

Con PlatformIO CLI:

```powershell
pio run -e <environment> -t upload
```

Questo comando e valido solo quando l'ambiente e il metodo di upload sono gia corretti. Alcune schede richiedono invece di copiare l'artefatto su una scheda SD o usare un bootloader dedicato.

### Verificare la build attiva

Dopo il riavvio inviare:

```gcode
M115
```

Controllare almeno:

- nome e versione del firmware;
- tipo di macchina dichiarato;
- numero di estrusori;
- capacita riportate, se il relativo report e abilitato.

Un output inatteso puo indicare che il caricamento non e avvenuto o che la scheda ha avviato un altro file.

### Gestire la EEPROM

Prima di sovrascrivere i valori attivi, ottenere un report:

```gcode
M503
```

`M503` mostra i parametri runtime correnti. Non garantisce che coincidano con i valori compilati o con quelli memorizzati.

Per caricare in memoria i valori predefiniti del nuovo firmware:

```gcode
M502
```

`M502` modifica i valori in memoria, ma non aggiorna automaticamente la EEPROM.

Per salvare i valori correnti in EEPROM:

```gcode
M500
```

Infine verificare:

```gcode
M503
```

La sequenza `M502` seguita da `M500` deve essere usata consapevolmente: elimina le regolazioni runtime precedentemente salvate e le sostituisce con i default della nuova build.

### Eseguire test progressivi

Ordine prudente:

1. comunicazione e identificazione firmware;
2. lettura delle temperature a macchina fredda;
3. stato dei finecorsa senza movimento;
4. abilitazione e direzione dei motori con spostamenti minimi;
5. homing di un asse alla volta quando possibile;
6. riscaldamento controllato osservando sensore e heater;
7. ventole e periferiche;
8. livellamento e movimenti completi;
9. taratura.

Interrompere il test se una temperatura non e plausibile, un asse si muove verso il lato sbagliato o un finecorsa non cambia stato.

### Registrare la build

Per ogni firmware conservare:

- release Marlin;
- commit o tag;
- data della build;
- ambiente PlatformIO;
- hash o copia dei file di configurazione;
- elenco sintetico delle modifiche;
- nome dell'artefatto caricato;
- risultato dei test;
- eventuale output `M115` e `M503`.

## Strategia di rollback

Prima di ogni caricamento:

1. conservare l'ultima build funzionante;
2. etichettare configurazione e artefatto con la stessa versione;
3. conoscere il metodo per entrare nel bootloader;
4. non dipendere dalla sola EEPROM per recuperare la macchina;
5. mantenere separati firmware sperimentale e firmware stabile.

Se la nuova build si avvia ma usa valori errati, verificare prima EEPROM e configurazione runtime. Se non si avvia o non comunica, ripristinare l'artefatto precedente con il metodo previsto dalla scheda.

## Adattamenti comuni

- **Auto Build Marlin:** riduce la ricerca manuale dell'ambiente, ma non determina i valori hardware corretti.
- **PlatformIO CLI:** utile per build ripetibili e automazione.
- **Arduino IDE:** supportato per alcune piattaforme, ma non e il percorso preferito indicato dal progetto per Marlin 2.1.
- **Aggiornamento via SD:** comune su schede a 32 bit, con nomi e procedure specifici del bootloader.
- **Upload seriale:** comune su molte schede AVR e su schede con bootloader compatibile.

## Debug rapido

- **La build usa la scheda sbagliata:** controllare `MOTHERBOARD` e ambiente PlatformIO.
- **Errore su una direttiva sconosciuta:** verificare che i file appartengano alla release `2.1.2.8`.
- **La compilazione termina con molti errori:** risolvere il primo errore reale; gli altri possono esserne conseguenze.
- **Il firmware non cambia dopo l'upload:** verificare `M115`, nome dell'artefatto e procedura del bootloader.
- **I nuovi valori non vengono applicati:** controllare con `M503`, poi valutare `M502` e `M500`.
- **La memoria flash e insufficiente:** disabilitare soltanto funzioni non necessarie e ricompilare.
- **La porta seriale non compare:** controllare cavo dati, driver, bootloader, alimentazione e porta usata da un altro programma.
- **La macchina si blocca per sicurezza:** diagnosticare sensore, cablaggio e configurazione; non disattivare la protezione per aggirare il problema.

## Checklist finale

- Sorgente e configurazioni provengono dal tag `2.1.2.8`.
- La build pulita e stata provata prima delle modifiche.
- Scheda e ambiente PlatformIO sono verificati.
- Ogni blocco di modifiche e stato compilato separatamente.
- E disponibile una build precedente funzionante.
- L'artefatto caricato appartiene alla configurazione corrente.
- `M115` identifica il firmware atteso.
- La gestione della EEPROM e stata eseguita consapevolmente.
- Sensori e finecorsa sono stati verificati prima di heater e movimenti.
- La build e documentata e versionata.

## Fonti

- [README Marlin 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/README.md)
- [platformio.ini 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/platformio.ini)
- [Auto Build Marlin](https://marlinfw.org/docs/basics/auto_build_marlin.html)
- [Installare Marlin con PlatformIO e Visual Studio Code](https://marlinfw.org/docs/basics/install_platformio_vscode.html)
- [M115 - Firmware Info](https://marlinfw.org/docs/gcode/M115.html)
- [M500 - Save Settings](https://marlinfw.org/docs/gcode/M500.html)
- [M502 - Factory Reset](https://marlinfw.org/docs/gcode/M502.html)
- [M503 - Report Settings](https://marlinfw.org/docs/gcode/M503.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita|Introduzione a Marlin 2.1.2.8 e compatibilita]]
- [[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin|Struttura dei file di configurazione Marlin]]
