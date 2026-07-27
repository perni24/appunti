---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: operational-note

publish: true
difficulty: avanzato
tags: [marlin, platformio, compilazione, avvio, troubleshooting]
aliases: [Diagnostica compilazione Marlin, Errori avvio Marlin, Marlin non si avvia]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin]]"
  - "[[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni]]"
  - "[[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica]]"
marlin-version: "2.1.2.8"
---

# Errori di compilazione e avvio

## Obiettivo

Individuare in quale fase nasce un errore e correggerlo senza confondere:

- configurazione Marlin;
- compilazione e linking;
- ambiente PlatformIO;
- caricamento sulla scheda;
- boot del firmware;
- periferiche che non si inizializzano;
- dati EEPROM incompatibili.

Un messaggio finale come `FAILED` o `exit code 1` non identifica la causa. La diagnosi parte dalla prima riga di errore significativa e dal momento preciso in cui il processo si interrompe.

## Quando usarlo

- La build non termina.
- Auto Build Marlin non mostra l'ambiente atteso.
- La compilazione riesce ma l'upload fallisce.
- Dopo il flash la scheda non comunica.
- Il firmware si riavvia in ciclo o entra subito in stato `STOP`.
- Display, SD o altre periferiche non funzionano dopo una nuova build.
- Compaiono errori EEPROM dopo un aggiornamento.

## Prerequisiti

- Sorgenti originali di Marlin 2.1.2.8.
- `Configuration.h` e `Configuration_adv.h` della stessa release.
- Copia della configurazione precedente funzionante.
- Nome esatto della motherboard e del processore.
- Log completo di build e upload, non soltanto le ultime righe.
- Cavo USB dati noto e alimentazione stabile.
- Accesso all'interruttore generale della macchina.

## Risultato atteso

Al termine deve essere possibile classificare il problema in una sola fase:

```text
configurazione
  -> preprocessing e SanityCheck
  -> compilazione
  -> linking e memoria
  -> upload
  -> boot
  -> inizializzazione periferiche
  -> caricamento EEPROM
```

La correzione deve essere minima, verificabile e registrata.

## Raccolta iniziale

Annotare:

| Campo | Valore |
|---|---|
| Versione Marlin | `2.1.2.8` |
| Origine dei sorgenti | |
| Commit o archivio | |
| `MOTHERBOARD` | |
| Ambiente PlatformIO | |
| Sistema operativo | |
| Versione VS Code | |
| Versione PlatformIO | |
| Auto Build Marlin | |
| Metodo di upload | USB, SD, DFU, programmatore |
| Ultima build funzionante | |
| Prima modifica dopo cui fallisce | |

Salvare:

- log completo della build;
- log completo dell'upload;
- configurazione che fallisce;
- configurazione precedente;
- eventuale output seriale dal momento del reset.

## Procedura

### 1. Riprodurre con una base controllata

Aprire in VS Code la cartella radice che contiene:

```text
platformio.ini
Marlin/
buildroot/
ini/
```

Non aprire soltanto la sottocartella `Marlin/`.

Verificare che i file di configurazione si trovino nella directory corretta:

```text
Marlin/Configuration.h
Marlin/Configuration_adv.h
```

Eseguire prima una build, senza upload. Con PlatformIO CLI:

```powershell
platformio run -e <ambiente>
```

Se si usa Auto Build Marlin, scegliere **Build** per l'ambiente proposto dalla motherboard. Separare build e upload rende evidente se il problema riguarda il codice o il collegamento con la scheda.

### 2. Cercare il primo errore reale

Nel log distinguere:

| Testo | Interpretazione |
|---|---|
| `warning:` | avviso; puo anticipare un problema ma non sempre ferma la build |
| `error:` | errore del compilatore o di un controllo Marlin |
| `fatal error:` | file o dipendenza non trovata, oppure compilazione interrotta |
| `undefined reference` | simbolo mancante durante il linking |
| `region ... overflowed` | firmware o dati oltre la memoria disponibile |
| `FAILED` | riepilogo dell'ambiente fallito, non causa primaria |

Leggere alcune righe prima e dopo il primo `error:`. Le centinaia di errori successivi possono essere conseguenze di una sola parentesi, direttiva o dipendenza errata.

### 3. Classificare un errore `SanityCheck`

Marlin usa controlli di compilazione per rifiutare combinazioni incoerenti. Il messaggio normalmente descrive:

- opzione obsoleta o rinominata;
- dipendenza mancante;
- due funzioni incompatibili;
- pin o periferica non disponibili;
- geometria impossibile;
- seriale, display o driver non supportati;
- valore fuori intervallo;
- file di configurazione appartenente a un'altra release.

Azioni:

1. leggere il messaggio completo;
2. cercare nel file indicato la direttiva nominata;
3. controllare il blocco `#if` che ne definisce le dipendenze;
4. confrontare con i file di configurazione puliti della 2.1.2.8;
5. modificare una sola opzione;
6. ricompilare.

Non commentare il controllo in `SanityCheck.h`. Se il controllo fallisce, la configurazione deve essere corretta; disabilitare il controllo consente di produrre un firmware internamente incoerente.

### 4. Verificare la versione dei file di configurazione

`Configuration.h` e `Configuration_adv.h` devono provenire dalla stessa release dei sorgenti. Copiare integralmente file di una release precedente puo introdurre:

- nomi rimossi;
- valori con semantica cambiata;
- dipendenze nuove;
- sezioni mancanti;
- versioni di configurazione non corrispondenti.

Metodo corretto:

1. partire dai file puliti della release destinazione;
2. confrontare la vecchia configurazione;
3. trasferire le decisioni, non l'intero file;
4. compilare per piccoli blocchi.

Questo processo verra approfondito nella futura nota `Migrazione della configurazione tra versioni`, gia prevista dall'indice.

### 5. Diagnosticare direttive e sintassi

Errori comuni:

- `#define` duplicato con valori differenti;
- parentesi o graffe mancanti in un array;
- virgola mancante;
- virgolette tipografiche copiate da una pagina web;
- valore testuale non racchiuso correttamente;
- direttiva inserita fuori dal blocco previsto;
- commento `/* ... */` non chiuso;
- nome della macro scritto in modo errato;
- uso di una direttiva presente in una versione diversa.

Confrontare il blocco modificato con il file originale 2.1.2.8. Non correggere gli errori a valle finche il primo errore sintattico non e scomparso.

### 6. Verificare motherboard e ambiente

La direttiva:

```cpp
#define MOTHERBOARD BOARD_...
```

determina pin, processore supportato e ambienti di build associati.

Controllare:

- modello esatto e revisione della scheda;
- eventuali varianti con processore differente;
- commenti `env:` nei file dei pin;
- ambiente proposto da Auto Build Marlin;
- metodo di bootloader e upload previsto dal produttore.

Sintomi di ambiente errato:

- istruzioni CPU non riconosciute;
- dimensioni memoria incompatibili;
- linker script errato;
- upload su protocollo sbagliato;
- firmware compilato ma non avviabile;
- periferiche assegnate a pin non corrispondenti.

Non scegliere un ambiente soltanto perche la build termina. Deve corrispondere a scheda, processore e bootloader.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]].

### 7. Risolvere file o librerie mancanti

Un `fatal error: ... No such file or directory` puo indicare:

- dipendenze PlatformIO non scaricate;
- cache incompleta;
- ambiente non corretto;
- sorgenti incompleti;
- antivirus che ha bloccato un file;
- percorso eccessivamente lungo o con permessi insufficienti;
- inclusione manuale non prevista da Marlin.

Ordine di controllo:

1. verificare che il repository o archivio sia completo;
2. controllare connessione e log di download delle dipendenze;
3. ripetere una build pulita;
4. verificare lo spazio disponibile;
5. reinstallare la sola dipendenza danneggiata o PlatformIO come ultima misura.

Pulizia CLI dell'ambiente selezionato:

```powershell
platformio run --target clean -e <ambiente>
```

Auto Build Marlin espone anche il comando **Clean**. Eliminare manualmente `.pio` forza una ricostruzione completa, ma prima assicurarsi che il percorso sia davvero la cartella di build del progetto.

### 8. Diagnosticare errori del compilatore

Categorie frequenti:

| Errore | Causa probabile |
|---|---|
| `not declared in this scope` | nome errato, funzione non abilitata, ordine o versione incompatibile |
| `expected ... before ...` | errore sintattico precedente |
| `redefinition` | simbolo o macro definito due volte |
| `no matching function` | API o libreria con versione non compatibile |
| `invalid conversion` | tipo errato o codice personalizzato non aggiornato |
| `static assertion failed` | vincolo noto non rispettato |

Se l'errore compare nei sorgenti Marlin non significa automaticamente che Marlin sia difettoso. Una macro di configurazione puo selezionare un ramo di codice incompatibile.

Per isolare:

1. ripristinare l'ultimo blocco modificato;
2. ricompilare;
3. riapplicare una modifica alla volta;
4. evitare modifiche dirette in `Marlin/src` finche la configurazione standard non compila.

### 9. Diagnosticare linker e memoria

#### `undefined reference`

Indica che una dichiarazione e stata compilata ma l'implementazione non e disponibile nel link finale. Controllare:

- funzione abilitata solo parzialmente;
- file escluso dall'ambiente;
- libreria con versione errata;
- modifica personalizzata non completa;
- build cache incoerente.

#### Memoria programma esaurita

Messaggi come `region ... overflowed` o percentuale flash oltre il limite richiedono di:

1. confermare il target corretto;
2. rimuovere funzioni non necessarie;
3. scegliere varianti piu leggere di UI, font o menu;
4. evitare doppie interfacce e diagnostica permanente;
5. ricompilare e registrare il margine.

#### RAM insufficiente

Su MCU con poca SRAM, una build puo compilare ma avere margine operativo insufficiente. Funzioni con buffer, mesh grandi, display grafici e Input Shaping possono aumentare l'uso.

Non valutare soltanto la dimensione del file firmware. Flash e RAM sono risorse differenti.

### 10. Separare errore di build da errore di upload

Se il log riporta una build riuscita e l'errore compare durante `upload`, il firmware e stato compilato. Controllare:

- porta seriale corretta;
- porta occupata da host o monitor seriale;
- cavo USB dati;
- driver USB;
- alimentazione della scheda;
- protocollo di upload;
- bootloader;
- jumper o pulsanti BOOT/RESET;
- upload tramite SD con nome file richiesto;
- permessi del sistema operativo.

Upload CLI:

```powershell
platformio run --target upload -e <ambiente>
```

Chiudere prima programmi che mantengono aperta la porta. Non cambiare configurazione Marlin per risolvere un errore di accesso alla porta.

### 11. Verificare un aggiornamento tramite SD

Per le schede che aggiornano da SD controllare:

- filesystem e capacita supportati dalla scheda;
- nome richiesto per il file firmware;
- file copiato nella root;
- scheda inserita prima del reset, se richiesto;
- eventuale rinomina del file dopo un flash riuscito;
- LED o segnali previsti dal bootloader.

Un file compilato correttamente non prova che il bootloader lo abbia installato. Dopo l'avvio verificare versione e data:

```gcode
M115
```

### 12. Diagnosticare assenza di comunicazione dopo il flash

Procedere dal livello piu basso:

1. verificare che il sistema rilevi una porta USB;
2. provare un cavo dati noto;
3. controllare alimentazione e LED;
4. verificare porta e baud rate;
5. aprire il monitor seriale prima del reset per catturare il boot;
6. scollegare temporaneamente periferiche che possono interferire con seriale o alimentazione;
7. riprovare la configurazione minima nota;
8. verificare bootloader e processore.

Se la porta appare e scompare ciclicamente, cercare reset da watchdog, brownout, corto, periferica bloccante o firmware compilato per target errato.

### 13. Diagnosticare display vuoto o corrotto

Prima stabilire se il firmware e vivo tramite seriale:

```gcode
M115
```

Se la risposta e corretta, il problema e circoscritto all'interfaccia.

Controllare:

- una sola definizione di display compatibile;
- orientamento dei connettori EXP;
- adattatore richiesto dalla motherboard;
- tensione e contrasto;
- pin condivisi con SD, driver o altre periferiche;
- cavi troppo lunghi o disturbati;
- variante grafica e driver corretti;
- modalita del touchscreen: Marlin mode o host G-code.

Artefatti ST7920 possono richiedere ritardi di comunicazione specifici, ma questi vanno introdotti solo dopo aver escluso display, cablaggio e pin errati.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen]].

### 14. Diagnosticare blocco o riavvio immediato

Raccogliere l'output seriale dal reset. Distinguere:

- reset continuo;
- messaggio `STOP`;
- `Printer halted. kill() called!`;
- errore termico;
- probe non inizializzato;
- watchdog;
- caduta di alimentazione;
- semplice display bloccato con firmware ancora attivo.

Un reset quando si attiva un heater o un motore suggerisce prima:

- alimentatore insufficiente;
- caduta di tensione;
- corto o carico errato;
- massa o connettore difettoso;
- disturbo elettrico.

Non attribuire automaticamente il riavvio al firmware.

### 15. Gestire lo stato `STOP`

Marlin entra in `STOP` quando continuare non e considerato sicuro. Prima:

1. leggere e salvare il messaggio precedente;
2. disattivare alimentazione se esiste un rischio hardware;
3. correggere la causa;
4. verificare sensori e stato;
5. riavviare.

Dopo aver risolto la causa, il comando seguente puo riportare il firmware allo stato operativo:

```gcode
M999
```

`M999` non ripara il guasto e non deve essere inviato ripetutamente per ignorare errori termici, probe falliti o problemi elettrici.

### 16. Gestire errori EEPROM

Dopo una build diversa possono comparire:

```text
EEPROM datasize error
EEPROM CRC mismatch
```

Prima salvare i valori recuperabili con:

```gcode
M503
```

Caricare in RAM i default compilati:

```gcode
M502
```

Controllare il report:

```gcode
M503
```

Se i default sono corretti, inizializzare la EEPROM:

```gcode
M500
```

Riavviare e verificare:

```gcode
M503
```

Questa sequenza sostituisce le impostazioni persistenti con i default dei file compilati. Non eseguirla senza aver registrato offset, steps, PID, mesh e altri valori utili.

Approfondimento: [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni]].

## Albero decisionale rapido

```text
La build parte?
  no -> installazione, cartella progetto, PlatformIO
  si
    SanityCheck interrompe?
      si -> configurazione o release incoerente
      no
        compilatore interrompe?
          si -> sintassi, API, dipendenze
          no
            linker o memoria interrompe?
              si -> simboli, target, flash o RAM
              no
                upload interrompe?
                  si -> porta, protocollo, bootloader
                  no
                    scheda avvia?
                      no -> target, alimentazione, bootloader
                      si
                        seriale risponde?
                          no -> porta, baud, reset, seriale configurata
                          si -> periferica, EEPROM o configurazione runtime
```

## Adattamenti comuni

### Configurazione personalizzata

Prima compilare la configurazione standard piu vicina all'hardware. Reintrodurre poi:

1. motherboard e seriale;
2. cinematica e dimensioni;
3. motori, endstop e sensori;
4. heater e protezioni;
5. display;
6. leveling;
7. accessori;
8. funzioni avanzate.

Una build tra ogni blocco identifica subito la modifica responsabile.

### Aggiornamento di PlatformIO

Se una configurazione invariata smette di compilare dopo un aggiornamento:

- registrare le versioni;
- eseguire una clean build;
- leggere gli errori di dipendenza;
- non aggiornare librerie a caso;
- verificare la toolchain dichiarata dalla release;
- riprodurre con un progetto pulito.

### Codice personalizzato

Mantenere le modifiche a `Marlin/src` in commit separati. Prima verificare che:

- la configurazione standard compili;
- la personalizzazione compili da sola;
- non dipenda da API di un'altra release;
- ogni nuovo pin o periferica abbia controlli di compatibilita.

## Debug rapido

| Sintomo | Controllo prioritario |
|---|---|
| Auto Build non mostra ambienti | cartella radice e `MOTHERBOARD` |
| `SanityCheck.h` produce errore | leggere il testo e correggere la configurazione |
| Centinaia di errori C++ | risolvere il primo errore |
| File header mancante | sorgenti, dipendenze, ambiente, cache |
| Firmware troppo grande | target e funzioni con maggiore costo |
| Build riuscita, upload fallito | porta, bootloader, protocollo |
| Upload riuscito, versione invariata | bootloader SD, file installato, `M115` |
| Nessuna seriale dopo flash | target, cavo, alimentazione, baud, reset |
| Display vuoto ma `M115` risponde | definizione display, cavi, pin |
| Riavvio quando parte un heater | alimentazione e corto prima del firmware |
| EEPROM CRC mismatch | backup, `M502`, verifica, `M500` |
| `M999` non risolve | causa dello `STOP` ancora presente |

## Checklist finale

- [ ] Cartella radice corretta aperta in VS Code.
- [ ] Sorgenti e configurazione appartengono alla 2.1.2.8.
- [ ] Motherboard e ambiente corrispondono all'hardware.
- [ ] Primo errore significativo identificato.
- [ ] `SanityCheck` non e stato aggirato.
- [ ] Build pulita completata.
- [ ] Uso flash e RAM compatibile con la MCU.
- [ ] Metodo di upload verificato.
- [ ] Versione installata confermata con `M115`.
- [ ] Output seriale di boot controllato.
- [ ] Periferiche verificate separatamente dal core firmware.
- [ ] EEPROM inizializzata solo dopo backup e controllo dei default.
- [ ] Configurazione corretta registrata nel controllo versione.

## Riferimenti

- [Marlin 2.1.2.8](https://github.com/MarlinFirmware/Marlin/tree/2.1.2.8)
- [Installing Marlin](https://marlinfw.org/docs/basics/install.html)
- [Installing Marlin with PlatformIO](https://marlinfw.org/docs/basics/install_platformio.html)
- [Auto Build Marlin](https://marlinfw.org/docs/basics/auto_build_marlin.html)
- [Troubleshooting Tips](https://marlinfw.org/docs/basics/troubleshooting.html)
- [M999 - STOP Restart](https://marlinfw.org/docs/gcode/M999.html)
- [EEPROM](https://marlinfw.org/docs/features/eeprom.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin]]
- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]
- [[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica]]
