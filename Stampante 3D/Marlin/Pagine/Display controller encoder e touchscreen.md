---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [marlin, display, controller, encoder, touchscreen]
aliases: [Display Marlin, Controller LCD Marlin, Touchscreen Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]"
  - "[[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Lingua menu e feedback acustico]]"
marlin-version: "2.1.2.8"
---

# Display, controller, encoder e touchscreen

## Sintesi

Il pannello di controllo non si configura soltanto in base a dimensioni e aspetto. Occorre identificare architettura, controller grafico, interfaccia elettrica, revisione della scheda, pinout e metodo di input.

In Marlin 2.1.2.8 si incontrano quattro casi principali:

| Architettura | Chi genera l'interfaccia | Collegamento tipico |
|---|---|---|
| LCD a caratteri o grafico monocromatico | il microcontrollore della motherboard | EXP1/EXP2, parallelo, SPI o I2C |
| TFT pilotato direttamente | il microcontrollore della motherboard | SPI o FSMC |
| Smart display con protocollo dedicato | Marlin e il controller interno del display | seriale o interfaccia proprietaria |
| Touchscreen usato come host G-code | il firmware autonomo del touchscreen | UART |

Queste architetture non sono intercambiabili. Un touchscreen seriale autonomo non diventa un TFT pilotato direttamente abilitando `TFT_GENERIC`.

## Quando usarlo

- Quando si aggiunge o sostituisce il pannello di controllo.
- Quando display, encoder, touch o slot SD non rispondono correttamente.
- Quando si migra la configurazione su una motherboard con pinout diverso.
- Quando si deve distinguere un TFT pilotato da Marlin da un host G-code seriale.
- Quando una UI grafica supera i limiti di flash, RAM o prestazioni della MCU.

## Prima di modificare Marlin

Raccogliere almeno queste informazioni:

- nome esatto del display;
- revisione del PCB;
- sigla del controller LCD o TFT;
- tipo di touch controller, se presente;
- tensione logica e di alimentazione;
- connettori usati e posizione del pin 1;
- presenza di encoder, buzzer e slot SD;
- schema dei pin della motherboard;
- eventuale firmware separato richiesto dal pannello.

Il nome commerciale puo non essere sufficiente. Revisioni esteticamente simili possono usare controller, orientamento dei connettori o pinout differenti.

## Come funziona

Marlin include il codice dell'interfaccia in fase di compilazione. La direttiva del controller seleziona driver, pin e capacita attese; le macro subordinate aggiungono input, supporti e comportamento della UI.

Nei display diretti la motherboard esegue anche il rendering. Nei pannelli con processore autonomo una parte o tutta l'interfaccia e eseguita dal display, mentre Marlin comunica tramite il protocollo previsto.

### LCD a caratteri

Un LCD a caratteri mostra simboli presenti nella ROM del controller. Richiede poche risorse, ma offre un numero limitato di righe, colonne e caratteri.

Esempio comune:

```cpp
//#define REPRAP_DISCOUNT_SMART_CONTROLLER
```

Il RepRapDiscount Smart Controller usa normalmente un pannello 20x4, encoder, buzzer e lettore SD. La presenza fisica di queste periferiche non garantisce che pin e cablaggio siano corretti per ogni motherboard.

### Display grafici monocromatici

Marlin disegna testo e icone in un framebuffer o per pagine, quindi puo controllare i singoli pixel.

Esempio:

```cpp
//#define REPRAP_DISCOUNT_FULL_GRAPHIC_SMART_CONTROLLER
```

Il Full Graphic Smart Controller usa un display 128x64. Rispetto a un LCD a caratteri richiede piu flash e tempo di elaborazione, soprattutto su MCU a 8 bit.

Altre famiglie presenti nel file della release includono:

```cpp
//#define MKS_MINI_12864
//#define MKS_MINI_12864_V3
//#define FYSETC_MINI_12864_2_0
//#define FYSETC_MINI_12864_2_1
//#define BTT_MINI_12864
//#define CR10_STOCKDISPLAY
```

Le varianti non sono equivalenti. La versione deve corrispondere al PCB reale.

### TFT pilotati direttamente

Il microcontrollore della motherboard disegna tutta l'interfaccia sul TFT. La configurazione deve descrivere controller, bus, risoluzione e UI.

Per un modello non coperto da un preset:

```cpp
//#define TFT_GENERIC
#if ENABLED(TFT_GENERIC)
  #define TFT_DRIVER AUTO

  //#define TFT_INTERFACE_FSMC
  //#define TFT_INTERFACE_SPI

  //#define TFT_RES_320x240
  //#define TFT_RES_480x272
  //#define TFT_RES_480x320
  //#define TFT_RES_1024x600
#endif
```

Va scelta:

1. una sola interfaccia;
2. una sola risoluzione;
3. il driver corretto o `AUTO` solo se l'hardware permette il rilevamento previsto;
4. una sola interfaccia utente.

Le UI disponibili in questo blocco sono:

```cpp
//#define TFT_CLASSIC_UI
//#define TFT_COLOR_UI
//#define TFT_LVGL_UI
```

| UI | Caratteristiche |
|---|---|
| `TFT_CLASSIC_UI` | emula la MarlinUI grafica 128x64 ingrandita |
| `TFT_COLOR_UI` | usa menu Marlin pensati per un display a colori e per il touch |
| `TFT_LVGL_UI` | usa LVGL e richiede piu risorse e asset aggiuntivi |

Con `TFT_LVGL_UI` la release richiede anche di copiare la cartella `assets` prodotta dalla build nella root della scheda SD insieme al firmware. Senza gli asset l'interfaccia puo risultare incompleta.

Se TFT e altre periferiche condividono lo stesso bus SPI:

```cpp
#if ENABLED(TFT_COLOR_UI)
  //#define TFT_SHARED_IO
#endif
```

`TFT_SHARED_IO` disabilita il trasferimento asincrono dei dati del display per rendere sicuro il bus condiviso. Puo ridurre le prestazioni grafiche.

L'orientamento grafico e regolabile, quando supportato:

```cpp
//#define TFT_ROTATION TFT_NO_ROTATION
```

La rotazione dell'immagine e la trasformazione delle coordinate touch sono due problemi distinti.

### Display DWIN e smart display

La release contiene diverse UI alternative per specifiche famiglie DWIN:

```cpp
//#define DWIN_CREALITY_LCD
//#define DWIN_LCD_PROUI
//#define DWIN_CREALITY_LCD_JYERSUI
//#define DWIN_MARLINUI_PORTRAIT
//#define DWIN_MARLINUI_LANDSCAPE
```

Va abilitata solo l'opzione prevista per hardware, protocollo, orientamento e asset installati. Due macro DWIN alternative non devono essere attivate contemporaneamente.

Uno smart display possiede un controller proprio, ma Marlin continua a partecipare alla logica dell'interfaccia tramite il protocollo previsto. Non va confuso con un generico terminale seriale G-code.

### Touchscreen host G-code

Alcuni pannelli eseguono un firmware autonomo e comunicano con Marlin come farebbe un computer:

1. il pannello invia un comando G-code via UART;
2. Marlin esegue il comando;
3. Marlin restituisce stato e risposte seriali;
4. il pannello aggiorna la propria interfaccia.

In questo caso occorre configurare:

- una porta seriale hardware libera;
- lo stesso baud rate sui due dispositivi;
- TX e RX incrociati;
- una massa comune;
- livelli logici compatibili;
- il firmware corretto sul touchscreen.

La configurazione delle porte e trattata in [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]].

Un pannello seriale puo offrire anche una modalita di emulazione LCD tramite connettori EXP. Le due modalita hanno cablaggio e firmware differenti e vanno documentate separatamente.

## Selezione del controller

La sezione `LCD / Controller Selection` di `Configuration.h` contiene molte alternative. Il metodo corretto non e provare macro casuali finche il display si accende.

Procedura:

1. identificare modello e revisione;
2. cercare la direttiva esatta nel file della release;
3. leggere il commento e le eventuali macro subordinate;
4. controllare i pin assegnati dal file della motherboard;
5. verificare la compatibilita elettrica;
6. abilitare un solo controller principale;
7. compilare prima di collegare l'hardware.

Alcune direttive sono alias o preset che attivano internamente un'altra implementazione. Questo e normale: non bisogna abilitare manualmente anche la direttiva sottostante se non richiesto dal commento.

## Connettori EXP e sicurezza elettrica

Molti pannelli usano `EXP1` e `EXP2`, ma la forma del connettore non definisce un pinout universale.

Prima dell'accensione:

- confrontare gli schemi di motherboard e display;
- individuare pin 1, `5V`, `3.3V` e `GND`;
- controllare l'orientamento delle chiavi IDC;
- verificare eventuali adattatori;
- misurare continuita e tensioni se la documentazione e ambigua;
- collegare o scollegare i cavi a macchina spenta.

Invertire un cavo per tentativi puo mettere alimentazione su un segnale o cortocircuitare una linea. Un display bianco o spento non giustifica la rotazione casuale dei connettori.

## Encoder rotativo

Un encoder meccanico genera transizioni sulle linee A e B. Una tacca fisica puo produrre piu impulsi, mentre Marlin deve tradurre gli impulsi in passi del menu.

```cpp
//#define ENCODER_PULSES_PER_STEP 4
//#define ENCODER_STEPS_PER_MENU_ITEM 1
```

| Opzione | Cosa regola |
|---|---|
| `ENCODER_PULSES_PER_STEP` | numero di impulsi necessari per un passo logico |
| `ENCODER_STEPS_PER_MENU_ITEM` | passi logici necessari per cambiare voce |

Sintomi tipici:

- il cursore salta voci: rapporto troppo aggressivo o segnali sporchi;
- servono molte tacche: rapporto troppo conservativo;
- il valore oscilla avanti e indietro: rimbalzo, cablaggio o rumore;
- il click non funziona: pin del pulsante, pull-up o mappatura errati.

### Direzione

```cpp
//#define REVERSE_ENCODER_DIRECTION
//#define REVERSE_MENU_DIRECTION
//#define REVERSE_SELECT_DIRECTION
```

- `REVERSE_ENCODER_DIRECTION` inverte navigazione e modifica dei valori.
- `REVERSE_MENU_DIRECTION` inverte solo la navigazione dei menu.
- Per invertire solo la modifica dei valori, il commento della release indica di abilitare entrambe le prime due.
- `REVERSE_SELECT_DIRECTION` riguarda la direzione di selezione su alcuni pannelli.

Prima va stabilito quale comportamento e invertito. Abilitare macro a caso puo correggere il menu ma rendere controintuitiva la modifica numerica.

### Filtro e accelerazione

Per encoder rumorosi:

```cpp
//#define ENCODER_NOISE_FILTER
#if ENABLED(ENCODER_NOISE_FILTER)
  #define ENCODER_SAMPLES 10
#endif
```

Il filtro puo ridurre falsi passi, ma non ripara cavi lunghi, masse instabili o un encoder guasto.

In `Configuration_adv.h`:

```cpp
#define ENCODER_RATE_MULTIPLIER
#if ENABLED(ENCODER_RATE_MULTIPLIER)
  #define ENCODER_10X_STEPS_PER_SEC  30
  #define ENCODER_100X_STEPS_PER_SEC 80
#endif
```

Ruotando rapidamente l'encoder, i valori cambiano a passi piu grandi. E utile per temperature e coordinate, ma soglie troppo basse rendono difficile una regolazione precisa.

## Touchscreen gestito da Marlin

Per un TFT compatibile:

```cpp
//#define TOUCH_SCREEN
#if ENABLED(TOUCH_SCREEN)
  #define BUTTON_DELAY_EDIT  50
  #define BUTTON_DELAY_MENU 250

  //#define DISABLE_ENCODER
  //#define TOUCH_IDLE_SLEEP_MINS 5

  #define TOUCH_SCREEN_CALIBRATION
#endif
```

- `BUTTON_DELAY_EDIT` regola la ripetizione nelle schermate di modifica.
- `BUTTON_DELAY_MENU` regola la ripetizione nei menu.
- `DISABLE_ENCODER` elimina l'input dell'encoder eventualmente presente.
- `TOUCH_IDLE_SLEEP_MINS` imposta il timeout di inattivita.

Il timeout puo essere cambiato a runtime:

```gcode
M255 S5
```

Il comando ha effetto solo su display con backlight o sleep controllabile via software.

### Calibrazione

Con `TOUCH_SCREEN_CALIBRATION` e disponibile:

```gcode
M995
```

La calibrazione determina scala, offset e orientamento delle coordinate touch. I valori manuali previsti dal file sono:

```cpp
//#define TOUCH_CALIBRATION_X 12316
//#define TOUCH_CALIBRATION_Y -8981
//#define TOUCH_OFFSET_X        -43
//#define TOUCH_OFFSET_Y        257
//#define TOUCH_ORIENTATION TOUCH_LANDSCAPE
```

I numeri mostrati sono esempi del file di configurazione, non valori universali.

Con EEPROM:

```cpp
#if BOTH(TOUCH_SCREEN_CALIBRATION, EEPROM_SETTINGS)
  #define TOUCH_CALIBRATION_AUTO_SAVE
#endif
```

La calibrazione riuscita viene salvata automaticamente. Dopo un cambio di orientamento, firmware, display o controller touch va ripetuta.

Se il punto premuto:

- e spostato sempre della stessa distanza: controllare gli offset;
- si allontana progressivamente: controllare le scale;
- si muove nell'asse opposto: controllare segni e orientamento;
- scambia X e Y: controllare orientamento e rotazione;
- oscilla: controllare rumore, massa e alimentazione.

## Slot SD del display

Per abilitare il supporto media:

```cpp
//#define SDSUPPORT
```

La macro abilita le funzioni SD di Marlin, ma non stabilisce da sola quale slot fisico usare. La motherboard e il controller selezionato devono fornire pin, chip select e percorso SPI corretti.

Opzione di robustezza della release:

```cpp
//#define SD_CHECK_AND_RETRY
```

La scheda deve usare un filesystem supportato e un'alimentazione stabile. Errori intermittenti durante la stampa possono dipendere da:

- cavo EXP lungo o disturbato;
- contatti dello slot;
- alimentazione insufficiente;
- condivisione SPI configurata male;
- chip select errato;
- supporto removibile difettoso.

Ordinamento, nomi lunghi e operazioni sulla SD saranno trattati nella nota dedicata a EEPROM e supporti.

## Procedura di collaudo progressiva

### 1. Build minima

Abilitare soltanto il controller esatto e le dipendenze indispensabili. Lasciare inizialmente disattivati touch, effetti grafici e opzioni accessorie.

Compilare e controllare:

- conflitti tra controller;
- pin mancanti;
- dipendenze della UI;
- uso di flash e RAM;
- ambiente PlatformIO corretto.

### 2. Accensione controllata

Alla prima accensione verificare:

- assenza di componenti surriscaldati;
- tensione corretta;
- retroilluminazione;
- schermata di avvio o stato;
- testo leggibile e immagine stabile.

Spegnere subito se cavi, connettori o regolatori scaldano.

### 3. Input

Provare separatamente:

1. rotazione lenta dell'encoder;
2. rotazione rapida;
3. click;
4. eventuale pulsante Back;
5. touch ai quattro angoli;
6. selezione e modifica di un valore non pericoloso.

### 4. Periferiche integrate

Provare poi:

- buzzer;
- slot SD;
- backlight;
- sleep e risveglio;
- aggiornamento delle temperature;
- stato durante una stampa simulata o sorvegliata.

## Diagnostica

| Sintomo | Controlli principali |
|---|---|
| display completamente spento | alimentazione, massa, fusibile, pinout, cavo |
| backlight acceso ma nessun testo | controller errato, contrasto, pin dati, firmware non avviato |
| testo corrotto | charset, timing, cavo, controller o tensione errati |
| TFT bianco | driver, reset, interfaccia, chip select, risoluzione |
| immagine ruotata | `TFT_ROTATION` o preset sbagliato |
| touch specchiato o sfalsato | calibrazione e orientamento touch |
| encoder salta | rapporto impulsi, rumore, cablaggio |
| SD non rilevata | `SDSUPPORT`, slot selezionato, CS, SPI, cavo |
| UI lenta | MCU al limite, TFT condiviso, UI pesante, frequenza bus |
| build troppo grande | UI, font, icone e funzioni menu eccedono la flash |

Una schermata funzionante non dimostra che encoder, touch, SD e buzzer siano configurati correttamente. Ogni sottosistema va verificato separatamente.

## Errori comuni

- Scegliere il controller in base alla sola forma del display.
- Abilitare piu direttive alternative contemporaneamente.
- Confondere un touchscreen seriale con `TFT_GENERIC`.
- Copiare pinout da una revisione diversa.
- Invertire EXP1 o EXP2 mentre la macchina e alimentata.
- Usare valori di calibrazione touch trovati online senza misurazione.
- Supporre che lo slot SD del display funzioni automaticamente.
- Correggere rumore elettrico soltanto aumentando il filtro encoder.
- Aggiungere LVGL senza copiare gli asset richiesti.

## Checklist

- [ ] Modello, revisione e controller del display sono identificati.
- [ ] Tensioni e pinout sono compatibili con la motherboard.
- [ ] E attiva una sola direttiva controller.
- [ ] Per un TFT sono selezionati driver, interfaccia, risoluzione e una sola UI.
- [ ] Il pannello seriale usa una UART libera e livelli logici compatibili.
- [ ] Encoder, click e direzioni sono stati verificati.
- [ ] Il touch e calibrato sull'orientamento definitivo.
- [ ] Lo slot SD e stato testato con il cablaggio definitivo.
- [ ] La build rientra nei limiti di flash e RAM.
- [ ] Il collaudo e stato eseguito prima di una stampa non sorvegliata.

## Riferimenti

- [Marlin 2.1.2.8 - Configuration.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Marlin 2.1.2.8 - Configuration_adv.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Marlin - Controllers and displays](https://marlinfw.org/docs/hardware/controllers.html)
- [Marlin - M255 LCD Sleep/Backlight Timeout](https://marlinfw.org/docs/gcode/M255.html)
- [Marlin - M995 Touch Screen Calibration](https://marlinfw.org/docs/gcode/M995.html)

## Collegamenti

- [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]
- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]
- [[Stampante 3D/Marlin/Pagine/Lingua menu e feedback acustico]]
