---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - psu-control
  - relay
  - led
  - case-light
  - buzzer
  - servo
aliases:
  - Accessori Marlin
  - PSU Control Marlin
  - Luci e servo Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]"
  - "[[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Lingua menu e feedback acustico]]"
  - "[[Stampante 3D/Marlin/Pagine/Sensore di fine filamento e recupero dopo perdita di alimentazione]]"
marlin-version: 2.1.2.8
title: Alimentatore, rele, LED, luci, buzzer e servo
status: non revisionato
---

# Alimentatore, rele, LED, luci, buzzer e servo

## Sintesi

Le periferiche accessorie non devono essere collegate tutte allo stesso modo. Marlin genera segnali logici o PWM; la corrente del carico deve essere fornita da un'uscita di potenza o da un driver esterno adeguato.

| Dispositivo | Segnale Marlin | Stadio esterno tipico |
|---|---|---|
| controllo PSU | digitale attivo alto o basso | ingresso PS_ON o modulo dedicato |
| rele | digitale | transistor, MOSFET o modulo isolato |
| case light | digitale o PWM | MOSFET o uscita di potenza |
| RGB analogico | piu canali PWM | MOSFET per ogni canale |
| NeoPixel | linea dati | alimentazione 5 V separata dimensionata |
| buzzer attivo | digitale | driver integrato o uscita compatibile |
| speaker passivo | segnale a frequenza variabile | uscita o driver compatibile |
| servo | impulsi di controllo | alimentazione servo dimensionata |

Il fatto che un pin possa commutare non significa che possa alimentare direttamente il carico.

## Quando usarlo

- Quando si vuole accendere o spegnere l'alimentatore da Marlin.
- Quando si aggiungono luci di lavoro o LED di stato.
- Quando una periferica richiede un rele o un MOSFET.
- Quando buzzer e speaker non producono il feedback previsto.
- Quando si aggiunge un servo non gia gestito da una funzione Marlin.
- Quando si devono risolvere reset, disturbi o pin in conflitto.

## Come funziona

La configurazione associa una funzione a un pin e stabilisce:

- stato attivo;
- valore all'avvio;
- eventuale PWM;
- ritardi e timeout;
- comando G-code;
- integrazione con menu ed eventi.

Il circuito elettrico deve poi tradurre il segnale logico nel livello di tensione e corrente richiesto dal dispositivo.

## Classificare l'uscita

Prima del cablaggio determinare se il pin e:

- GPIO logico a 3.3 V;
- GPIO logico a 5 V;
- uscita open-drain;
- uscita MOSFET per carichi;
- pin PWM hardware o software;
- bus dati;
- pin riservato a boot, debug o periferiche.

Controllare sempre:

- file pin della motherboard;
- schema elettrico;
- corrente massima dell'uscita;
- stato durante reset e bootloader;
- eventuale inversione;
- condivisione con display, SD, endstop o driver.

## Sicurezza dei carichi

Un GPIO non deve alimentare direttamente:

- bobina di rele;
- striscia LED;
- servo;
- lampada;
- ventola;
- contattore.

Per una bobina induttiva servono uno stadio di pilotaggio e la protezione contro la tensione di ritorno. Per carichi a tensione di rete servono componenti certificati, isolamento, protezioni, contenitore e cablaggio adeguati.

Marlin non puo rilevare:

- contatti saldati;
- rele bloccato;
- MOSFET guasto in corto;
- isolamento insufficiente;
- terra di protezione mancante.

Gli interventi sulla rete elettrica devono essere eseguiti da personale competente e con alimentazione disconnessa.

## Controllo dell'alimentatore

In `Configuration.h`:

```cpp
//#define PSU_CONTROL
//#define PSU_NAME "Power Supply"
```

Per abilitare:

```cpp
#define PSU_CONTROL
```

Marlin usa il pin `PS_ON_PIN` definito dalla motherboard o dalla configurazione pin.

## Stato attivo

```cpp
#define PSU_ACTIVE_STATE LOW
```

Il commento della release indica:

- `LOW` per un tipico ingresso ATX PS_ON;
- `HIGH` per il caso Xbox citato nel file.

La polarita va comunque misurata sul circuito reale. Uno stato errato puo lasciare l'alimentatore sempre acceso o sempre spento.

## Accensione e spegnimento

Accendere:

```gcode
M80
```

Spegnere:

```gcode
M81
```

`M81` puo togliere alimentazione a controller, ventole e comunicazione prima che l'host riceva ulteriori risposte.

Conferma sul display:

```cpp
//#define PS_OFF_CONFIRM
```

Segnale acustico prima dello spegnimento:

```cpp
//#define PS_OFF_SOUND
```

## Alimentazione di standby

Per accendersi con `M80`, la MCU deve restare alimentata mentre la potenza principale e spenta. Questo puo avvenire tramite:

- rail di standby ATX;
- alimentazione USB progettata per lo scopo;
- modulo power-control dedicato;
- alimentatore ausiliario.

Se spegnendo il PSU si spegne anche la motherboard, Marlin non puo ricevere il successivo `M80`.

L'alimentazione contemporanea da USB e PSU va verificata sullo schema per evitare backfeed tra sorgenti.

## Stato iniziale e ritardo

Per lasciare la potenza spenta finche non arriva `M80`:

```cpp
//#define PSU_DEFAULT_OFF
```

Ritardo dopo accensione:

```cpp
//#define PSU_POWERUP_DELAY 250
```

Il ritardo permette alla tensione di stabilizzarsi prima di usare periferiche. Non corregge un alimentatore sottodimensionato o con salita fuori specifica.

## Spegnimento ritardato e cooldown

Per usare un ritardo con `M81 D<secondi>`:

```cpp
//#define POWER_OFF_TIMER
```

Per permettere `M81 S` dopo il raffreddamento:

```cpp
//#define POWER_OFF_WAIT_FOR_COOLDOWN
```

Lo spegnimento dopo cooldown e utile per mantenere attive le ventole finche l'hotend e caldo.

Con auto power o attesa cooldown, soglia hotend:

```cpp
//#define AUTO_POWER_E_TEMP 50
```

Il valore deve essere coerente con heatbreak, sensore e comportamento delle ventole. Spegnere troppo presto puo favorire heat creep.

## G-code all'accensione e spegnimento

```cpp
//#define PSU_POWERUP_GCODE "M355 S1"
//#define PSU_POWEROFF_GCODE "M355 S0"
```

Questi hook possono controllare, per esempio, la case light.

Il G-code di spegnimento deve completarsi prima che il circuito rimuova la potenza. Non inserirvi movimenti lunghi, salvataggi non necessari o operazioni che richiedono periferiche gia spente.

## Controllo automatico

```cpp
//#define AUTO_POWER_CONTROL
```

Con la funzione attiva, la release puo mantenere acceso il PSU per:

```cpp
#define AUTO_POWER_FANS
#define AUTO_POWER_E_FANS
#define AUTO_POWER_CONTROLLERFAN
#define AUTO_POWER_CHAMBER_FAN
#define AUTO_POWER_COOLER_FAN
```

Timeout di inattivita:

```cpp
#define POWER_TIMEOUT 30
```

Ritardo aggiuntivo dopo `M81`:

```cpp
//#define POWER_OFF_DELAY 60
```

Prima di usare auto power verificare:

- quali ventole sono realmente monitorate;
- se heater e motori richiedono la potenza principale;
- se il controller resta alimentato;
- se una pausa lunga appare come inattivita;
- se il cooldown mantiene correttamente il PSU acceso.

## Modulo MKS PWC

```cpp
//#define MKS_PWC
```

E destinato all'add-on specifico. Non va abilitato per un rele generico o per una motherboard che usa un circuito power-control differente.

## Rele e moduli esterni

Un rele puo usare una logica attiva alta o bassa. All'avvio, prima che Marlin inizializzi il pin, il livello puo essere temporaneamente indefinito.

Per una funzione critica valutare:

- stato fail-safe a MCU spenta;
- pull-up o pull-down hardware;
- isolamento;
- corrente della bobina;
- diodo flyback per bobine DC;
- rating reale dei contatti;
- categoria del carico;
- fusibile e protezione a monte;
- comportamento in caso di pin flottante.

Un rele non e un sistema di sicurezza indipendente se la stessa MCU decide sia il processo sia lo spegnimento.

Non usare `M42` per pilotare in produzione un rele critico: il comando non sostituisce una funzione Marlin con stato, vincoli e gestione degli errori.

## Case light

In `Configuration_adv.h`:

```cpp
//#define CASE_LIGHT_ENABLE
```

Configurazione:

```cpp
//#define CASE_LIGHT_PIN 4
#define INVERT_CASE_LIGHT false
#define CASE_LIGHT_DEFAULT_ON true
#define CASE_LIGHT_DEFAULT_BRIGHTNESS 105
//#define CASE_LIGHT_NO_BRIGHTNESS
//#define CASE_LIGHT_MAX_PWM 128
//#define CASE_LIGHT_MENU
```

`CASE_LIGHT_PIN` deve essere:

- un'uscita di potenza compatibile;
- oppure un segnale collegato a MOSFET o rele.

Per una luce soltanto ON/OFF o pilotata da rele:

```cpp
#define CASE_LIGHT_NO_BRIGHTNESS
```

Per limitare il duty cycle:

```cpp
//#define CASE_LIGHT_MAX_PWM 128
```

Questo non e un limitatore di corrente hardware.

## Comando `M355`

Accendere:

```gcode
M355 S1
```

Spegnere:

```gcode
M355 S0
```

Accendere a luminosita 128:

```gcode
M355 S1 P128
```

La regolazione richiede un pin PWM e uno stadio di potenza compatibile. Con un rele meccanico usare soltanto ON/OFF: pilotarlo in PWM lo danneggia e produce commutazioni pericolose.

## LED di temperatura

```cpp
//#define TEMP_STAT_LEDS
```

La logica descritta nella release usa:

- blu quando hotend, bed e target sono sotto 54 °C;
- rosso quando la condizione non e soddisfatta;
- isteresi di 1 °C.

E un indicatore, non una protezione termica e non una misura certificata di superficie sicura.

## LED RGB e RGBW analogici

Abilitare una sola famiglia:

```cpp
//#define RGB_LED
//#define RGBW_LED
```

Definire i canali:

```cpp
//#define RGB_LED_R_PIN 34
//#define RGB_LED_G_PIN 43
//#define RGB_LED_B_PIN 35
//#define RGB_LED_W_PIN -1
```

Il commento della release avverte che una striscia LED richiede MOSFET tra i pin PWM e il carico. I GPIO non sopportano la corrente della striscia.

Ogni canale analogico richiede:

- driver dimensionato;
- alimentazione corretta;
- massa comune se non isolato;
- frequenza PWM compatibile;
- dissipazione e cablaggio adeguati.

## NeoPixel

```cpp
//#define NEOPIXEL_LED
```

Parametri principali:

```cpp
#define NEOPIXEL_TYPE NEO_GRBW
//#define NEOPIXEL_PIN 4
#define NEOPIXEL_PIXELS 30
#define NEOPIXEL_BRIGHTNESS 127
//#define NEOPIXEL_STARTUP_TEST
```

`NEOPIXEL_TYPE` deve corrispondere all'ordine reale dei canali. Un ordine errato produce colori scambiati.

La linea dati non alimenta i LED. La striscia richiede una sorgente 5 V dimensionata per numero di pixel, luminosita e colore.

Un valore di brightness software limita il comando, ma non sostituisce:

- alimentatore adeguato;
- fusibile;
- conduttori dimensionati;
- distribuzione dell'alimentazione;
- gestione della caduta di tensione.

## Seconda striscia NeoPixel

```cpp
//#define NEOPIXEL2_SEPARATE
```

Con la funzione attiva si configurano numero di pixel, luminosita e strip predefinita per `M150`. Se resta disabilitata, il comportamento del secondo pin puo essere parallelo o in serie secondo le opzioni del blocco.

Non collegare due strisce assumendo che abbiano automaticamente conteggi e alimentazioni indipendenti.

## Comando `M150`

Rosso:

```gcode
M150 R255 U0 B0
```

Verde:

```gcode
M150 R0 U255 B0
```

Blu:

```gcode
M150 R0 U0 B255
```

In Marlin il parametro verde e `U`. Per NeoPixel, `P` regola la luminosita complessiva supportata.

Il parametro `K` conserva i componenti non specificati. Senza conoscere lo stato precedente, una modifica parziale puo produrre un colore inatteso.

## LED legati agli eventi

Quando e presente una famiglia LED compatibile:

```cpp
#define PRINTER_EVENT_LEDS
```

La release usa colori per:

- riscaldamento del piano;
- riscaldamento dell'hotend;
- illuminazione durante la stampa;
- completamento;
- spegnimento dopo conferma utente.

Durata del colore di completamento durante stampa SD:

```cpp
#define PE_LEDS_COMPLETED_TIME (30*60)
```

La segnalazione dipende dagli eventi che Marlin conosce. Un host esterno puo gestire il job in modo differente.

## Menu LED

```cpp
//#define LED_CONTROL_MENU
```

Preset:

```cpp
#define LED_COLOR_PRESETS
```

Colore utente:

```cpp
#define LED_USER_PRESET_RED 255
#define LED_USER_PRESET_GREEN 128
#define LED_USER_PRESET_BLUE 0
#define LED_USER_PRESET_WHITE 255
#define LED_USER_PRESET_BRIGHTNESS 255
```

I valori sono esempi del file della release. Per una striscia senza canale white, il relativo valore non produce un canale fisico.

## Usare LED RGB come case light

Con `CASE_LIGHT_ENABLE` e una famiglia compatibile:

```cpp
//#define CASE_LIGHT_USE_NEOPIXEL
//#define CASE_LIGHT_USE_RGB_LED
```

Colore predefinito:

```cpp
#define CASE_LIGHT_DEFAULT_COLOR { 255, 255, 255, 255 }
```

L'uso come case light puo sovrapporsi ai colori di evento. Va deciso quale funzione ha priorita e verificato il comportamento durante riscaldamento, stampa e fine job.

## Buzzer e speaker

La scelta elettrica:

```cpp
//#define SPEAKER
```

- buzzer attivo: genera internamente una frequenza e in genere usa `SPEAKER` disabilitato;
- speaker passivo: puo riprodurre frequenze diverse e usa `SPEAKER` se il pin e il driver lo supportano.

Test:

```gcode
M300 S440 P200
```

Seconda frequenza:

```gcode
M300 S880 P200
```

Se il componente produce sempre lo stesso tono, puo essere un buzzer attivo.

Un trasduttore che richiede piu corrente del pin deve usare un driver. La configurazione completa di menu, mute e feedback e in [[Stampante 3D/Marlin/Pagine/Lingua menu e feedback acustico|Lingua menu e feedback acustico]].

## Servo

Numero di servo:

```cpp
//#define NUM_SERVOS 3
```

Gli indici partono da `0`. Alcune funzioni Marlin impostano automaticamente `NUM_SERVOS`; definirlo manualmente serve per servo aggiuntivi non gia dichiarati.

Ritardo:

```cpp
#define SERVO_DELAY { 300 }
```

Il valore concede tempo per raggiungere la posizione prima dell'azione successiva.

## Alimentazione del servo

Il pin servo della motherboard puo fornire soltanto il segnale oppure anche una rail limitata. Verificare:

- tensione nominale del servo;
- corrente a vuoto, in movimento e stall;
- capacita del regolatore;
- cadute di tensione;
- massa comune;
- disturbi introdotti sui 5 V.

Un servo alimentato dal regolatore logico puo causare:

- reset della MCU;
- display che si spegne;
- letture sensori instabili;
- movimento incompleto;
- surriscaldamento del regolatore.

Usare una sorgente separata dimensionata quando la motherboard non puo fornire la corrente, mantenendo il riferimento di massa secondo lo schema.

## Comando `M280`

Muovere il servo indice `0`:

```gcode
M280 P0 S90
```

Leggere la posizione registrata, omettendo `S`:

```gcode
M280 P0
```

Il valore e un comando logico. Non dimostra che il servo abbia raggiunto fisicamente l'angolo.

Prima prova:

1. scollegare il leveraggio se possibile;
2. usare un intervallo angolare ridotto;
3. verificare direzione;
4. controllare gli arresti meccanici;
5. misurare assorbimento e temperatura;
6. collegare il carico soltanto dopo.

## Disattivazione del servo

Per togliere il segnale dopo il movimento:

```cpp
//#define DEACTIVATE_SERVOS_AFTER_MOVE
```

Riduce jitter, rumore e consumo, ma il servo non mantiene piu attivamente la coppia. Un meccanismo caricato puo spostarsi.

Per aggiungere `M282`:

```cpp
//#define SERVO_DETACH_GCODE
```

Detach manuale:

```gcode
M282 P0
```

Usarlo soltanto se la posizione resta sicura senza coppia.

## Angoli modificabili

```cpp
//#define EDITABLE_SERVO_ANGLES
```

Permette `M281` per modificare gli angoli gestiti dalle funzioni compatibili e `M500` per salvarli.

Prima di rendere persistente una posizione:

1. provarla senza carico;
2. controllare il fine corsa;
3. verificare che non resti in stall;
4. osservare tutte le transizioni;
5. riavviare e controllare il comportamento iniziale.

## Servo riservati ad altre funzioni

Non comandare manualmente un indice usato da:

- BLTouch o probe servo;
- switching extruder;
- switching nozzle;
- meccanismi di tool change;
- funzioni proprietarie della scheda.

Un `M280` manuale puo muovere una probe mentre l'ugello e vicino al piano. Per BLTouch usare la procedura in [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch|Probe Z offset e BLTouch]].

## Sequenza di collaudo

### Verifica a macchina spenta

- pinout;
- tensioni;
- polarita;
- stadio di potenza;
- fusibile;
- stato fail-safe.

### Build minima

Abilitare una sola periferica e compilare. Controllare conflitti di pin e limiti di flash.

### Accensione senza carico

Verificare il segnale con multimetro o strumento adeguato prima di collegare il carico di potenza.

### Prova manuale

Inviare un singolo comando ON, OFF o posizione. Osservare alimentazione e temperatura.

### Prova degli eventi

Soltanto dopo il test manuale attivare auto power, event LED, hook di accensione o movimenti servo automatici.

### Riavvio

Controllare lo stato durante:

- reset;
- bootloader;
- avvio Marlin;
- collegamento USB;
- spegnimento PSU.

## Diagnostica

| Sintomo | Controlli |
|---|---|
| PSU sempre acceso | polarita, `PSU_ACTIVE_STATE`, cablaggio |
| impossibile riaccendere con `M80` | MCU senza standby |
| spegnimento troppo presto | cooldown, timeout, ventole monitorate |
| rele scatta al boot | pin flottante, inversione, pull hardware |
| luce solo ON/OFF | pin non PWM o `CASE_LIGHT_NO_BRIGHTNESS` |
| LED con colori scambiati | ordine `NEOPIXEL_TYPE` o canali RGB |
| reset con LED o servo | alimentazione insufficiente, disturbi, massa |
| servo vibra | segnale, alimentazione, carico, detach |
| servo urta il fine corsa | angolo o leveraggio errato |
| buzzer senza variazione di tono | buzzer attivo o `SPEAKER` errato |
| pin non disponibile | conflitto con motherboard o altra funzione |

## Errori comuni

- Collegare un carico direttamente a un GPIO.
- Usare un rele meccanico in PWM.
- Confondere stato attivo e stato elettrico a riposo.
- Usare `PSU_DEFAULT_OFF` senza alimentazione di standby.
- Spegnere prima che hotend e ventole siano in stato sicuro.
- Alimentare una striscia NeoPixel dal regolatore della MCU.
- Trattare brightness software come protezione di corrente.
- Comandare un servo gia assegnato a una probe.
- Salvare angoli servo prima del collaudo meccanico.
- Considerare LED e rele sostituti delle protezioni indipendenti.

## Checklist

- [ ] Il pin e libero e compatibile con la funzione.
- [ ] Tensione logica, corrente e stato attivo sono verificati.
- [ ] Il carico usa uno stadio di potenza adeguato.
- [ ] Lo stato durante reset e spegnimento e sicuro.
- [ ] PSU e MCU hanno una strategia di standby coerente.
- [ ] Cooldown e auto power sono stati collaudati.
- [ ] LED e case light hanno alimentazione dimensionata.
- [ ] Buzzer o speaker sono identificati correttamente.
- [ ] Servo, alimentazione e limiti meccanici sono verificati.
- [ ] Gli automatismi sono stati abilitati solo dopo i test manuali.

## Riferimenti

- [Marlin 2.1.2.8 - Configuration.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Marlin 2.1.2.8 - Configuration_adv.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Marlin - M80 Power On](https://marlinfw.org/docs/gcode/M080.html)
- [Marlin - M81 Power Off](https://marlinfw.org/docs/gcode/M081.html)
- [Marlin - M150 Set RGB(W) Color](https://marlinfw.org/docs/gcode/M150.html)
- [Marlin - M280 Servo Position](https://marlinfw.org/docs/gcode/M280.html)
- [Marlin - M355 Case Light Control](https://marlinfw.org/docs/gcode/M355.html)
- [Marlin - M300 Play Tone](https://marlinfw.org/docs/gcode/M300.html)

## Collegamenti

- [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin|Scheda madre porte seriali e pin]]
- [[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware|Alimentazione e protezioni hardware]]
- [[Stampante 3D/Marlin/Pagine/Lingua menu e feedback acustico|Lingua menu e feedback acustico]]
- [[Stampante 3D/Marlin/Pagine/Sensore di fine filamento e recupero dopo perdita di alimentazione|Sensore di fine filamento e recupero dopo perdita di alimentazione]]
- [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch|Probe Z offset e BLTouch]]


## Navigazione

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
