---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: intermedio
tags:
  - marlin
  - lcd-language
  - menu
  - buzzer
  - user-interface
aliases:
  - Lingua LCD Marlin
  - Menu Marlin
  - Feedback acustico Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]"
  - "[[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch]]"
marlin-version: 2.1.2.8
title: Lingua, menu e feedback acustico
status: non revisionato
---

# Lingua, menu e feedback acustico

## Sintesi

La lingua modifica le stringhe compilate nell'interfaccia, mentre il charset stabilisce quali caratteri il display puo rappresentare. I menu vengono invece inclusi o esclusi in base alle funzioni abilitate e al tipo di UI.

Il feedback acustico dipende dall'hardware:

- un buzzer attivo produce in genere un tono fisso;
- uno speaker o trasduttore passivo puo riprodurre frequenze diverse;
- alcuni display smart gestiscono parte dei suoni con il proprio controller.

Lingua, menu e suono devono quindi essere regolati dopo aver identificato il pannello in [[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen|Display controller encoder e touchscreen]].

## Quando usarlo

- Quando si vuole tradurre l'interfaccia locale.
- Quando compaiono caratteri errati, accenti mancanti o testi troncati.
- Quando una voce menu prevista non compare.
- Quando occorre ridurre l'uso di flash dei menu.
- Quando buzzer, speaker, mute o feedback dei comandi non si comportano come previsto.

## Come funziona

In fase di compilazione Marlin combina:

1. stringhe della lingua selezionata;
2. font o mapper compatibili con il display;
3. menu richiesti dalle funzioni abilitate;
4. implementazione della UI scelta;
5. driver del buzzer o dello speaker.

Il risultato non e un menu universale. Due build con la stessa lingua ma display o funzioni differenti possono mostrare voci, caratteri e feedback diversi.

## Impostare la lingua

In `Configuration.h`:

```cpp
#define LCD_LANGUAGE en
```

Per l'italiano:

```cpp
#define LCD_LANGUAGE it
```

La lingua viene compilata nel firmware. Non e sufficiente cambiare una preferenza nel menu, salvo configurazioni specifiche che includono il supporto multilingua a runtime.

Le stringhe inglesi costituiscono la base del sistema di traduzione. Alcuni messaggi seriali e di protocollo restano in inglese per non compromettere la comunicazione con gli host.

## Lingua e charset non sono la stessa cosa

### LCD a caratteri HD44780

I display a caratteri possiedono glifi memorizzati nella ROM. Per questo la release espone:

```cpp
#define DISPLAY_CHARSET_HD44780 JAPANESE
```

Valori previsti:

```text
JAPANESE
WESTERN
CYRILLIC
```

La scelta deve descrivere la ROM realmente installata sul display, non la lingua desiderata. Un LCD con ROM giapponese puo comunque mostrare l'interfaccia italiana tramite i mapper previsti, ma alcuni caratteri accentati possono essere limitati o sostituiti.

Per identificare la ROM:

```cpp
#define LCD_LANGUAGE test
```

Dopo compilazione e caricamento, il menu mostra sequenze campione. Si confrontano con quelle indicate nei commenti di `Configuration.h` e nella documentazione Marlin, poi si ripristina la lingua desiderata.

`test` e una modalita diagnostica temporanea, non una lingua da lasciare nella build finale.

### Display grafici

Su un display bitmap i glifi sono disegnati dal firmware. Il font incluso deve contenere i caratteri richiesti dalla lingua.

Conseguenze:

- font e lingue aggiuntive consumano flash;
- una traduzione puo avere caratteri non disponibili nel font scelto;
- testi piu lunghi possono essere troncati su display piccoli;
- alcune UI specifiche usano sistemi di font e asset propri.

Se la build segnala mapper o glifi mancanti, non va ignorato l'errore scegliendo una macro casuale. Occorre verificare lingua, font e tipo di display.

## Schermata di stato

La release espone uno stile per la schermata informativa:

```cpp
#define LCD_INFO_SCREEN_STYLE 0
```

Il risultato dipende dalla UI e dal controller scelto. Cambiare il valore non trasforma un LCD a caratteri in un'interfaccia grafica e non tutte le implementazioni supportano gli stessi stili.

In `Configuration_adv.h` sono presenti regolazioni aggiuntive:

```cpp
//#define STATUS_MESSAGE_SCROLLING
//#define STATUS_MESSAGE_TIMEOUT_SEC 30
```

- `STATUS_MESSAGE_SCROLLING` fa scorrere i messaggi piu lunghi dello spazio disponibile.
- `STATUS_MESSAGE_TIMEOUT_SEC` applica un timeout ai messaggi di bassa priorita.

Un timeout troppo breve puo nascondere informazioni operative; senza timeout un messaggio vecchio puo restare visibile e sembrare ancora attuale.

## Messaggi inviati con G-code

Per mostrare un messaggio sulla schermata di stato:

```gcode
M117 Preparazione stampa
```

Per rimuovere o sostituire il messaggio si invia un nuovo `M117`; il comportamento finale dipende dalla UI e dalle successive notifiche di Marlin.

Questo comando e utile nello start G-code per indicare una fase:

```gcode
M117 Homing
```

Poi:

```gcode
G28
```

Quindi:

```gcode
M117 Riscaldamento
```

I comandi restano separati per rendere chiara la sequenza e facilitarne il test.

Il progresso mostrato dal display puo dipendere dalla stampa da SD, dall'host o da comandi come `M73`. Non tutti gli host inviano le stesse informazioni.

## Come vengono costruiti i menu

I menu Marlin sono condizionali. Una voce compare solo se:

1. la UI possiede un sistema di menu compatibile;
2. la funzione corrispondente e compilata;
3. sono soddisfatte le dipendenze;
4. la scheda dispone di flash sufficiente;
5. l'implementazione specifica del display espone quella voce.

Esempi:

- il menu probe richiede una probe configurata;
- la gestione mesh dipende dal metodo di leveling;
- i comandi SD richiedono `SDSUPPORT`;
- il controllo delle luci richiede la relativa funzione;
- le voci TMC dipendono da driver e comunicazione configurati.

Cambiare `LCD_LANGUAGE` traduce una voce esistente, ma non abilita una funzione assente.

## Disabilitare o ridurre i menu

In `Configuration.h`:

```cpp
//#define NO_LCD_MENUS
//#define SLIM_LCD_MENUS
```

| Opzione | Effetto |
|---|---|
| `NO_LCD_MENUS` | rimuove i menu LCD mantenendo soltanto le parti di interfaccia supportate |
| `SLIM_LCD_MENUS` | riduce i menu per recuperare spazio in flash |

Queste opzioni sono utili su MCU con poca memoria, ma eliminano funzioni locali. Prima di usarle va verificato che configurazione, manutenzione e recupero siano possibili tramite seriale o host.

Non sono una correzione per un display selezionato male.

## Navigazione e ritorno allo stato

In `Configuration_adv.h`:

```cpp
#define LCD_TIMEOUT_TO_STATUS 60000
```

Il valore e espresso in millisecondi. Dopo un periodo senza input, Marlin torna alla schermata di stato.

Un timeout:

- troppo breve interrompe la consultazione o la modifica di parametri;
- troppo lungo lascia l'interfaccia in un sottomenu e nasconde lo stato generale;
- non deve essere confuso con il timeout della retroilluminazione.

Opzione per il backlight:

```cpp
//#define LCD_BACKLIGHT_TIMEOUT_MINS 1
```

E disponibile solo se l'hardware permette il controllo software della retroilluminazione.

## Voci menu opzionali

Alcune funzioni di `Configuration_adv.h` aggiungono accessi rapidi o procedure guidate.

### Informazioni stampante

```cpp
//#define LCD_INFO_MENU
#if ENABLED(LCD_INFO_MENU)
  //#define LCD_PRINTER_INFO_IS_BOOTSCREEN
#endif
```

`LCD_INFO_MENU` aggiunge pagine informative. La seconda opzione usa le schermate di avvio al posto delle pagine informative previste.

### Navigazione rapida

```cpp
//#define TURBO_BACK_MENU_ITEM
//#define PREHEAT_SHORTCUT_MENU_ITEM
```

- `TURBO_BACK_MENU_ITEM` mantiene evidenziata in alto la voce di ritorno.
- `PREHEAT_SHORTCUT_MENU_ITEM` porta il preriscaldamento al livello principale.

Le scorciatoie migliorano l'accesso alle funzioni frequenti, ma un menu principale sovraccarico diventa meno leggibile.

### Probe

Con una probe e una UI compatibile:

```cpp
//#define PROBE_OFFSET_WIZARD
```

La procedura guidata aiuta a impostare lo Z offset, ma non sostituisce:

- la verifica del cablaggio;
- il controllo di `NOZZLE_TO_PROBE_OFFSET`;
- la misura della ripetibilita;
- il salvataggio e la verifica dell'EEPROM.

La configurazione completa e in [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch|Probe Z offset e BLTouch]].

Per mostrare deploy e stow nel menu Motion:

```cpp
#define PROBE_DEPLOY_STOW_MENU
```

La voce compare solo nel blocco condizionale previsto dalla release.

## Schermata di avvio

Quando `SHOW_BOOTSCREEN` e attivo, `Configuration_adv.h` permette di regolare la durata:

```cpp
#define BOOTSCREEN_TIMEOUT 3000
```

Il valore e in millisecondi. Una bootscreen lunga rallenta l'accesso visivo allo stato e puo far sembrare bloccato l'avvio; una troppo breve puo non essere leggibile.

Loghi e immagini personalizzate consumano flash e dipendono dal tipo di display. Non devono nascondere errori di inizializzazione o sostituire il controllo dell'output seriale.

## Nomi dei file nella scheda SD

Le opzioni dei nomi file sono vicine alla gestione SD in `Configuration_adv.h`, ma influenzano direttamente il menu:

```cpp
//#define SCROLL_LONG_FILENAMES
//#define UTF_FILENAME_SUPPORT
//#define LONG_FILENAME_HOST_SUPPORT
//#define LONG_FILENAME_WRITE_SUPPORT
```

- `SCROLL_LONG_FILENAMES` fa scorrere i nomi lunghi nel menu SD.
- `UTF_FILENAME_SUPPORT` richiede che il font contenga i caratteri mostrati.
- `LONG_FILENAME_HOST_SUPPORT` estende la consultazione dei nomi tramite host.
- `LONG_FILENAME_WRITE_SUPPORT` permette alcune operazioni di scrittura con nomi lunghi.

Queste funzioni possono aumentare l'uso di memoria. `UTF_FILENAME_SUPPORT` non puo mostrare correttamente un glifo assente dal font.

L'ordinamento alfabetico:

```cpp
//#define SDCARD_SORT_ALPHA
```

richiede buffer e impostazioni aggiuntive. Sara approfondito nella pagina su EEPROM e supporti.

## Buzzer e speaker

In `Configuration.h`:

```cpp
//#define SPEAKER
```

Il commento della release distingue:

- speaker capace di generare toni: abilitare `SPEAKER`;
- buzzer a frequenza fissa: lasciare `SPEAKER` disabilitato.

Un buzzer attivo contiene il proprio oscillatore. Cambiare la frequenza richiesta dal firmware puo non produrre una nota diversa. Uno speaker passivo richiede invece un segnale pilotato alla frequenza desiderata.

Abilitare `SPEAKER` sul componente sbagliato puo produrre suoni assenti, deboli o anomali. Va verificato anche che il pin supporti il pilotaggio previsto e che il trasduttore non richieda una corrente eccessiva.

## Feedback dei comandi UI

La durata e la frequenza del feedback sono configurabili:

```cpp
//#define LCD_FEEDBACK_FREQUENCY_DURATION_MS 2
//#define LCD_FEEDBACK_FREQUENCY_HZ 5000
```

- la durata e espressa in millisecondi;
- la frequenza e espressa in hertz;
- impostare la durata o la frequenza a `0` disabilita il feedback previsto dal blocco.

Due millisecondi possono produrre soltanto un click breve. Il risultato reale dipende da speaker, buzzer, pin e implementazione del controller.

## Prova con `M300`

Per generare un tono:

```gcode
M300 S440 P200
```

- `S440` richiede 440 Hz;
- `P200` richiede 200 ms.

Seconda prova:

```gcode
M300 S880 P200
```

Con uno speaker funzionante le due frequenze devono essere chiaramente differenti. Un buzzer fisso puo ignorare la variazione e produrre lo stesso beep.

Non usare sequenze lunghe durante la diagnostica: prima si verifica un singolo tono, poi durata e frequenza.

## Controllo del suono dal menu

In `Configuration_adv.h`:

```cpp
//#define SOUND_MENU_ITEM
#define SOUND_ON_DEFAULT
```

- `SOUND_MENU_ITEM` aggiunge una voce per silenziare il feedback, sulle UI supportate.
- `SOUND_ON_DEFAULT` stabilisce lo stato predefinito.

Se il menu sonoro e assente, controllare le condizioni del blocco e il tipo di display. Non tutte le UI presentano la stessa voce.

Per segnalare una modifica del feedrate dalla schermata di stato:

```cpp
//#define BEEP_ON_FEEDRATE_CHANGE
#if ENABLED(BEEP_ON_FEEDRATE_CHANGE)
  #define FEEDRATE_CHANGE_BEEP_DURATION  10
  #define FEEDRATE_CHANGE_BEEP_FREQUENCY 440
#endif
```

Il feedback puo evitare modifiche involontarie, ma un beep a ogni variazione rapida puo diventare fastidioso.

## Configurazione minima consigliata

Per interfaccia italiana con menu completi:

```cpp
#define LCD_LANGUAGE it
```

Mantenere disabilitati:

```cpp
//#define NO_LCD_MENUS
//#define SLIM_LCD_MENUS
```

Per uno speaker passivo realmente compatibile:

```cpp
#define SPEAKER
```

Per un buzzer attivo:

```cpp
//#define SPEAKER
```

Le direttive del controller restano quelle specifiche dell'hardware e non sono sostituite da questo blocco.

## Procedura di verifica

1. Compilare con il controller gia verificato e `LCD_LANGUAGE it`.
2. Controllare schermata di avvio e stato.
3. Aprire ogni sottomenu senza muovere assi o attivare riscaldatori.
4. Verificare caratteri accentati e testi troncati.
5. Controllare che le funzioni abilitate abbiano le voci previste.
6. Inviare un messaggio con `M117`.
7. Verificare il ritorno automatico alla schermata di stato.
8. Provare un singolo `M300`.
9. Controllare la funzione mute, se abilitata.
10. Riavviare e verificare lo stato predefinito del suono.

Messaggio di prova:

```gcode
M117 Verifica display
```

Tono di prova:

```gcode
M300 S440 P200
```

## Diagnostica

| Sintomo | Causa probabile |
|---|---|
| caratteri strani | ROM charset errata, font o mapper incompatibile |
| accenti mancanti | limite della ROM o glifo assente |
| voce menu assente | funzione o dipendenza non compilata, UI non compatibile |
| menu troppo ridotto | `SLIM_LCD_MENUS` o `NO_LCD_MENUS` |
| ritorno allo stato troppo rapido | `LCD_TIMEOUT_TO_STATUS` troppo basso |
| messaggio lungo troncato | spazio limitato e scrolling disabilitato |
| nessun suono | pin, componente, direttiva controller o `SPEAKER` errati |
| stessa nota con frequenze diverse | buzzer attivo a tono fisso |
| beep continuo o distorto | pilotaggio o tipo di trasduttore errati |
| build oltre la flash | font, UI e menu troppo pesanti per la MCU |

## Errori comuni

- Usare `DISPLAY_CHARSET_HD44780` per scegliere la lingua.
- Lasciare `LCD_LANGUAGE test` nella build finale.
- Aspettarsi che una traduzione abiliti voci menu mancanti.
- Abilitare tutte le scorciatoie senza considerare leggibilita e flash.
- Confondere il timeout del menu con quello del backlight.
- Abilitare `SPEAKER` senza identificare il trasduttore.
- Salvare in EEPROM senza verificare prima il valore.
- Considerare identici i menu di MarlinUI, DWIN, LVGL e host seriali.

## Checklist

- [ ] La lingua compilata e quella desiderata.
- [ ] Il charset del display a caratteri e stato identificato.
- [ ] Font e glifi coprono i caratteri necessari.
- [ ] Le voci menu corrispondono alle funzioni abilitate.
- [ ] I timeout sono adatti all'uso reale.
- [ ] I messaggi lunghi restano leggibili.
- [ ] Buzzer o speaker sono identificati elettricamente.
- [ ] `M300` produce il risultato previsto.
- [ ] Il mute funziona, se esposto dal menu.
- [ ] Uso di flash e RAM resta entro i limiti.

## Riferimenti

- [Marlin 2.1.2.8 - Configuration.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Marlin 2.1.2.8 - Configuration_adv.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Marlin - LCD Language System](https://marlinfw.org/docs/development/lcd_language.html)
- [Marlin - LCD Menu Tree](https://marlinfw.org/docs/features/lcd_menu.html)
- [Marlin - M117 Set LCD Message](https://marlinfw.org/docs/gcode/M117.html)
- [Marlin - M300 Play Tone](https://marlinfw.org/docs/gcode/M300.html)

## Collegamenti

- [[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen|Display controller encoder e touchscreen]]
- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento|Metodo di configurazione compilazione e caricamento]]
- [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch|Probe Z offset e BLTouch]]


## Navigazione

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
