---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: technical-note

publish: true
difficulty: avanzato
tags: [marlin, eeprom, sd-card, persistent-settings, storage]
aliases: [EEPROM Marlin, Scheda SD Marlin, Impostazioni persistenti Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]"
  - "[[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica]]"
  - "[[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]"
marlin-version: "2.1.2.8"
---

# EEPROM, scheda SD e salvataggio delle impostazioni

## Sintesi

Marlin usa livelli di configurazione differenti:

| Livello | Contenuto | Durata |
|---|---|---|
| `Configuration.h` e `Configuration_adv.h` | funzioni compilate e valori predefiniti | fino alla prossima build |
| RAM | valori attivi nella sessione corrente | fino a reset o spegnimento |
| EEPROM o memoria persistente equivalente | valori salvati con `M500` | tra riavvii compatibili |
| Scheda SD o altro volume | file G-code, dati di recupero e file di servizio | finche il supporto resta leggibile |

La EEPROM non contiene tutto il firmware e la scheda SD non sostituisce la EEPROM. Inoltre, ricompilare Marlin non garantisce che i nuovi valori predefiniti sostituiscano quelli gia salvati.

## Quando usarlo

- Quando si vogliono conservare tarature e parametri tra i riavvii.
- Quando una modifica nei file di configurazione sembra non avere effetto.
- Quando si migra a una nuova build o release di Marlin.
- Quando la scheda SD non viene rilevata o perde la comunicazione.
- Quando occorre scegliere tra slot LCD, slot onboard o collegamento personalizzato.
- Quando si vuole verificare cosa e attivo prima di una modifica rischiosa.

## Come funziona

All'avvio Marlin costruisce inizialmente i valori predefiniti compilati. Se `EEPROM_SETTINGS` e attivo e i dati persistenti risultano validi e compatibili, li carica e sovrascrive i corrispondenti valori runtime.

Il flusso e quindi:

```text
default compilati -> valori runtime -> eventuale caricamento EEPROM
```

Durante l'uso, un comando come `M92`, `M851` o `M301` cambia un valore in RAM. Il valore diventa persistente soltanto se appartiene ai dati salvabili e viene eseguito `M500`.

## Abilitare la memoria persistente

In `Configuration.h`:

```cpp
//#define EEPROM_SETTINGS
```

Per abilitare il salvataggio:

```cpp
#define EEPROM_SETTINGS
```

Il backend reale dipende dalla scheda e dalla HAL:

- EEPROM hardware;
- flash interna emulata come EEPROM;
- memoria esterna;
- altra implementazione prevista dal core della motherboard.

Non va selezionato un backend copiando macro da una scheda diversa. La definizione della motherboard e il relativo ambiente di build stabiliscono quali implementazioni sono supportate.

## Ciclo dei comandi EEPROM

### `M500`: salvare i valori attivi

```gcode
M500
```

Scrive nella memoria persistente i valori runtime supportati dalla build.

Non significa:

- salvare l'intero firmware;
- salvare ogni direttiva `#define`;
- creare un backup portabile tra versioni;
- salvare automaticamente un parametro non gestito dalla EEPROM.

### `M501`: ricaricare i valori salvati

```gcode
M501
```

Rilegge la EEPROM e sostituisce i valori runtime corrispondenti. E utile per annullare modifiche non ancora salvate.

### `M502`: caricare i default compilati

```gcode
M502
```

Carica in RAM i valori predefiniti presenti nei file di configurazione.

Da solo non riscrive la EEPROM. Se si riavvia senza `M500`, i vecchi valori persistenti possono essere caricati di nuovo.

Per rendere persistenti i default:

```gcode
M502
```

Poi:

```gcode
M500
```

Infine e opportuno riavviare e verificare.

### `M503`: mostrare i valori runtime

```gcode
M503
```

Riporta i valori attualmente attivi in RAM, non una lettura separata del contenuto grezzo della EEPROM.

Per conoscere i valori salvati senza confonderli con modifiche runtime:

1. annotare le modifiche non salvate;
2. eseguire `M501`;
3. eseguire `M503`.

Questa procedura scarta le modifiche runtime non salvate.

### `M504`: validare la EEPROM

```gcode
M504
```

Chiede a Marlin di verificare i dati persistenti, quando il comando e supportato dalla build. E utile dopo errori CRC, variazioni del layout o comportamenti incoerenti.

Una validazione riuscita indica coerenza del formato, non correttezza meccanica dei valori.

## Modificare e salvare in modo controllato

Procedura consigliata:

1. acquisire l'output iniziale di `M503`;
2. modificare un solo gruppo di parametri;
3. verificare il comportamento senza salvare;
4. eseguire di nuovo `M503`;
5. salvare con `M500`;
6. riavviare;
7. controllare con `M503`;
8. conservare output, sorgenti e versione del firmware.

Questa sequenza evita di rendere persistente una modifica errata prima del collaudo.

## Quali valori possono essere salvati

Il contenuto dipende dalle funzioni compilate. Esempi comuni:

- passi per unita;
- velocita e accelerazioni massime;
- parametri di planner modificabili a runtime;
- PID o altri parametri termici supportati;
- offset della probe;
- mesh di livellamento;
- Linear Advance;
- correnti dei driver compatibili;
- impostazioni di retrazione firmware;
- stato predefinito di alcune funzioni;
- calibrazione touch, se prevista.

Una macro che abilita una funzione, come il tipo di cinematica o il modello della motherboard, resta invece una scelta di compilazione.

La presenza di un comando runtime non garantisce che tutti i suoi parametri siano persistenti. La verifica corretta e:

1. impostare il valore;
2. eseguire `M500`;
3. riavviare;
4. controllare con il comando di report o `M503`.

## Opzioni EEPROM della release

### Feedback seriale

```cpp
#define EEPROM_CHITCHAT
```

Fornisce messaggi di conferma per i comandi EEPROM. E utile durante configurazione e diagnostica; disabilitarlo risparmia flash ma riduce la visibilita delle operazioni.

### Avvio silenzioso

```cpp
#define EEPROM_BOOT_SILENT
```

Riduce l'output della prima lettura e lascia visibili gli errori. Non disabilita la validazione dei dati.

### Inizializzazione automatica su errore

```cpp
//#define EEPROM_AUTO_INIT
```

Converte automaticamente in default gli errori rilevati durante il caricamento.

Vantaggio:

- la macchina puo avviarsi senza richiedere una procedura manuale.

Rischio:

- una corruzione o incompatibilita puo causare la perdita automatica delle tarature salvate.

Va mantenuto un backup leggibile dei parametri importanti.

### Inizializzazione della nuova build

```cpp
//#define EEPROM_INIT_NOW
```

Inizializza la EEPROM al primo avvio della nuova build. Va abilitato soltanto quando si vuole sostituire deliberatamente il contenuto precedente con i default compilati.

Non usarlo se si intende preservare impostazioni non ancora documentate.

### Rimuovere `M503`

```cpp
//#define DISABLE_M503
```

Rimuove il report e recupera circa la quantita di flash indicata nel commento della release. Durante configurazione, manutenzione e migrazione e preferibile mantenere `M503`.

## Perche una modifica al sorgente puo non comparire

Esempio:

1. il firmware precedente ha salvato `M92` in EEPROM;
2. si modifica `DEFAULT_AXIS_STEPS_PER_UNIT`;
3. si ricompila e si carica Marlin;
4. all'avvio viene ricaricato il vecchio valore EEPROM.

Il nuovo default esiste nel firmware ma non e il valore runtime.

Per provare i nuovi default senza salvarli:

```gcode
M502
```

Per renderli persistenti dopo la verifica:

```gcode
M500
```

## Migrazione tra build e versioni

La disposizione dei dati EEPROM puo cambiare quando cambiano:

- release Marlin;
- funzioni compilate;
- numero di estrusori o assi;
- metodo di leveling;
- backend della memoria;
- struttura interna delle impostazioni.

Prima dell'aggiornamento:

1. salvare `Configuration.h`;
2. salvare `Configuration_adv.h`;
3. acquisire `M115`;
4. acquisire `M503`;
5. esportare le mesh con i comandi specifici disponibili;
6. annotare gli offset e le tarature critiche.

Dopo l'aggiornamento:

1. leggere i messaggi di avvio;
2. controllare eventuali errori di versione, dimensione o CRC;
3. non ripristinare ciecamente dati incompatibili;
4. inizializzare i nuovi default se necessario;
5. reintrodurre soltanto parametri ancora validi;
6. ripetere le verifiche di movimento e sicurezza.

Un vecchio output `M503` e un riferimento, non uno script di migrazione garantito.

## Errori EEPROM

Messaggi tipici:

- versione non compatibile;
- dimensione differente;
- CRC non valido;
- scrittura o lettura fallita.

Procedura prudente:

1. salvare il messaggio completo;
2. verificare versione e build effettiva con `M115`;
3. conservare l'eventuale output `M503`;
4. caricare i default con `M502`;
5. controllare i valori critici;
6. salvarli con `M500`;
7. riavviare;
8. validare con `M504`.

Non eseguire `M502` e `M500` prima di aver annotato i parametri recuperabili, perche la procedura sostituisce i dati precedenti.

## Abilitare la scheda SD

In `Configuration.h`:

```cpp
//#define SDSUPPORT
```

Per abilitare il supporto media:

```cpp
#define SDSUPPORT
```

Questo aggiunge il filesystem e i G-code SD, ma lo slot fisico dipende dai pin della scheda e dalla configurazione del controller.

## Selezionare lo slot fisico

In `Configuration_adv.h`:

```cpp
//#define SDCARD_CONNECTION LCD
```

Valori previsti:

```text
LCD
ONBOARD
CUSTOM_CABLE
```

| Valore | Slot usato |
|---|---|
| `LCD` | lettore nel controller esterno |
| `ONBOARD` | lettore sulla motherboard |
| `CUSTOM_CABLE` | collegamento definito dal relativo file pin |

Se la direttiva resta commentata, si applica il default previsto dalla motherboard. Non va assunta la presenza dello slot LCD solo perche il display possiede un lettore.

## Inizializzazione e rilevamento

La logica standard considera spesso il segnale di rilevamento basso quando il supporto e inserito. Se il comportamento e invertito:

```cpp
//#define SD_DETECT_STATE HIGH
```

Per ignorare completamente il pin detect, per esempio con alcuni extender:

```cpp
//#define NO_SD_DETECT
```

Senza rilevamento automatico possono essere necessari rimontaggio manuale o riavvio dopo l'inserimento.

Per evitare il mount all'avvio:

```cpp
//#define SD_IGNORE_AT_STARTUP
```

## Velocita SPI e affidabilita

In presenza di errori `volume init`:

```cpp
//#define SD_SPI_SPEED SPI_HALF_SPEED
```

La release permette:

```text
SPI_HALF_SPEED
SPI_QUARTER_SPEED
SPI_EIGHTH_SPEED
```

Ridurre la velocita puo compensare margini elettrici limitati, ma prima vanno controllati:

- alimentazione;
- integrita del supporto;
- lunghezza e qualita dei cavi;
- chip select;
- condivisione del bus;
- livelli logici;
- pinout.

In `Configuration.h`:

```cpp
//#define SD_CHECK_AND_RETRY
```

Abilita controllo CRC e tentativi sulla comunicazione supportata. Aumenta la robustezza, ma non ripara un cablaggio errato.

## Comandi fondamentali per il supporto

Montare o inizializzare:

```gcode
M21
```

Elencare i file:

```gcode
M20
```

Rilasciare il supporto prima della rimozione:

```gcode
M22
```

Selezionare un file:

```gcode
M23 nomefile.gco
```

Avviare o riprendere:

```gcode
M24
```

Mettere in pausa:

```gcode
M25
```

Controllare lo stato:

```gcode
M27
```

Interrompere una stampa SD:

```gcode
M524
```

La disponibilita e la sintassi estesa dipendono dalle opzioni compilate.

## Scrittura e sola lettura

Per rimuovere il codice di scrittura e risparmiare flash:

```cpp
//#define SDCARD_READONLY
```

Con la modalita read-only non funzionano le operazioni che devono creare, cancellare o aggiornare file. Prima di abilitarla verificare:

- caricamento file via seriale;
- log su supporto;
- recupero da perdita di alimentazione;
- aggiornamenti o asset;
- funzioni host che scrivono sulla SD.

Il trasferimento standard usa `M28` per iniziare e `M29` per terminare. Non rimuovere il supporto durante la scrittura.

## Ordinamento e nomi lunghi

```cpp
//#define SDCARD_SORT_ALPHA
```

L'ordinamento alfabetico migliora la navigazione ma usa RAM. Il limite predefinito del blocco e:

```cpp
#define SDSORT_LIMIT 40
```

Ogni elemento ordinato ha un costo indicato dal commento della release. Cache dei nomi e allocazione dinamica vanno valutate con attenzione sulle MCU con poca SRAM.

Opzioni correlate:

```cpp
//#define UTF_FILENAME_SUPPORT
//#define LONG_FILENAME_HOST_SUPPORT
//#define LONG_FILENAME_WRITE_SUPPORT
//#define SCROLL_LONG_FILENAMES
```

I caratteri internazionali richiedono anche glifi presenti nel font del display.

## Fine e interruzione della stampa

Al termine:

```cpp
#define SD_FINISHED_STEPPERRELEASE true
#define SD_FINISHED_RELEASECOMMAND "M84"
```

Su una cinematica in cui il piano o il gantry puo cadere quando Z viene disabilitato, la release suggerisce una variante come:

```cpp
#define SD_FINISHED_RELEASECOMMAND "M84XYE"
```

La scelta dipende dalla meccanica. Lasciare Z alimentato puo scaldare il motore e il driver; disabilitarlo puo permettere un movimento gravitazionale.

All'interruzione:

```cpp
#define EVENT_GCODE_SD_ABORT "G28XY"
```

La riga presente nella configurazione di riferimento esegue homing X e Y dopo l'abort. Deve essere verificata sulla macchina reale: un oggetto sul piano puo interferire con il percorso. Non lasciare un G-code post-abort non analizzato.

Questa opzione mantiene i riscaldatori attivi dopo Stop Print:

```cpp
//#define SD_ABORT_NO_COOLDOWN
```

Il commento della release la sconsiglia. Lasciarla disabilitata evita che un abort venga interpretato come uno stato termico sicuro mentre gli heater restano accesi.

## Recupero da perdita di alimentazione

```cpp
//#define POWER_LOSS_RECOVERY
```

La funzione scrive dati di stato sul supporto durante la stampa. Questo comporta:

- necessita di scrittura affidabile;
- usura del supporto;
- dipendenza dalla meccanica e dalla posizione dopo il blackout;
- impossibilita di garantire la qualita del pezzo ripreso;
- incompatibilita con una configurazione SD puramente read-only.

`POWER_LOSS_MIN_Z_CHANGE` limita la frequenza di salvataggio in base alla variazione Z:

```cpp
#define POWER_LOSS_MIN_Z_CHANGE 0.05
```

Un valore troppo alto riduce la possibilita di riprendere geometrie con incrementi Z piccoli. La configurazione completa sara trattata con gli accessori e il recupero di alimentazione.

## Supporti e funzioni avanzate

### Accesso USB mass storage

Su schede compatibili lo slot onboard puo essere condiviso con il computer. Per nasconderlo all'host:

```cpp
//#define NO_SD_HOST_DRIVE
```

L'accesso contemporaneo allo stesso filesystem da Marlin e dal computer va gestito secondo il supporto della scheda; due writer concorrenti possono corrompere i dati.

### Volumi multipli

```cpp
//#define MULTI_VOLUME
```

Nella release e marcato sperimentale. Aggiunge selezione tra volumi, ma richiede una configurazione esplicita e non va abilitato in una build stabile senza collaudo.

### Chiavette USB

```cpp
//#define USB_FLASH_DRIVE_SUPPORT
```

Richiede hardware USB host compatibile, pin e libreria corretti. Una porta USB device usata per collegare la stampante al PC non e automaticamente una porta USB host.

### Aggiornamento firmware da SD

Il caricamento di un file firmware da parte del bootloader della motherboard e separato da Marlin. Nome file, slot e procedura dipendono dalla scheda.

L'opzione:

```cpp
//#define SD_FIRMWARE_UPDATE
```

del blocco 2.1.2.8 e destinata allo specifico scenario ATmega2560 e bootloader descritto nei commenti. Non va abilitata come soluzione generica per schede a 32 bit.

### Configurazione incorporata

```cpp
//#define CONFIGURATION_EMBEDDING
```

Incorpora nel firmware dati compressi della configurazione. Con la funzione attiva:

```gcode
M503 C
```

puo scrivere `mc.zip` sulla SD secondo il meccanismo documentato dalla release. Questo conserva i file di configurazione, non sostituisce un backup dei valori runtime e delle mesh.

## Diagnostica SD

| Sintomo | Controlli |
|---|---|
| `No media` | slot selezionato, detect, mount, pinout |
| `volume init failed` | supporto, filesystem, alimentazione, SPI, velocita |
| file assenti | directory, estensione, nomi lunghi, mount |
| lettura intermittente | cavi, contatti, condivisione SPI, alimentazione |
| scrittura fallita | read-only, spazio, filesystem, protezione o supporto |
| menu lento | ordinamento, cache nomi, numero di file, MCU |
| file corrotti | rimozione durante scrittura, accessi concorrenti, alimentazione |
| stampa interrotta | supporto difettoso, errori bus, alimentazione, G-code |

Provare inizialmente con:

```gcode
M21
```

Poi:

```gcode
M20
```

Infine controllare lo stato:

```gcode
M27
```

## Errori comuni

- Credere che il flash del firmware cancelli sempre la EEPROM.
- Usare `M500` prima di aver verificato il valore.
- Considerare `M503` una lettura indipendente del contenuto grezzo salvato.
- Riprodurre un vecchio output `M503` su una build incompatibile.
- Abilitare `EEPROM_AUTO_INIT` senza conservare i parametri critici.
- Selezionare lo slot SD in base alla posizione fisica e non ai pin.
- Ridurre la velocita SPI senza controllare il cablaggio.
- Abilitare read-only insieme a funzioni che devono scrivere.
- Rimuovere la SD durante una scrittura.
- Lasciare un comando post-abort non verificato.

## Checklist

- [ ] `EEPROM_SETTINGS` e supportato dalla motherboard.
- [ ] I valori predefiniti e quelli runtime sono stati confrontati.
- [ ] `M500`, riavvio e `M503` confermano la persistenza.
- [ ] Esiste un backup leggibile di configurazione e tarature.
- [ ] La migrazione non riutilizza automaticamente dati incompatibili.
- [ ] Lo slot SD selezionato corrisponde al cablaggio reale.
- [ ] Detect, mount, lettura e scrittura sono stati testati separatamente.
- [ ] Ordinamento e nomi lunghi rispettano i limiti di RAM.
- [ ] Comandi di fine e abort sono sicuri per la meccanica.
- [ ] Le funzioni che scrivono sono compatibili con la modalita del supporto.

## Riferimenti

- [Marlin 2.1.2.8 - Configuration.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Marlin 2.1.2.8 - Configuration_adv.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Marlin - EEPROM](https://marlinfw.org/docs/features/eeprom.html)
- [Marlin - M500 Save Settings](https://marlinfw.org/docs/gcode/M500.html)
- [Marlin - M501 Restore Settings](https://marlinfw.org/docs/gcode/M501.html)
- [Marlin - M502 Factory Reset](https://marlinfw.org/docs/gcode/M502.html)
- [Marlin - M503 Report Settings](https://marlinfw.org/docs/gcode/M503.html)
- [Marlin - M504 Validate EEPROM](https://marlinfw.org/docs/gcode/M504.html)
- [Marlin - SD Card G-codes](https://marlinfw.org/meta/gcode/)

## Collegamenti

- [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]
- [[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen]]
- [[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica]]
- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]
