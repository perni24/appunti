---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [marlin, ventole, raffreddamento, pwm, fan]
aliases: [Ventole Marlin, Raffreddamento Marlin, Fan control Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]"
  - "[[Stampante 3D/Marlin/Pagine/Sensori di temperatura e limiti operativi]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Controllo PID MPC e protezioni termiche]]"
  - "[[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping]]"
marlin-version: "2.1.2.8"
---

# Ventole e raffreddamento

## Sintesi

Una stampante puo avere ventole con responsabilita molto diverse:

| Ventola | Comando tipico | Scopo |
|---|---|---|
| Part cooling | `M106` / `M107` | raffreddare il materiale depositato |
| Hotend auto fan | automatica sulla temperatura | raffreddare heatbreak e dissipatore |
| Controller fan | automatica su motori o scheda | raffreddare driver e MOSFET |
| Chamber fan | automatica rispetto alla camera | distribuire o estrarre calore |
| Cooler fan | automatica sul cooler | supportare un circuito di raffreddamento |

Scambiare le funzioni e pericoloso. La ventola dell'heatbreak non dovrebbe dipendere dal profilo part cooling dello slicer; spegnerla con l'hotend caldo puo causare heat creep e intasamenti.

## Mappatura elettrica

Prima della configurazione documentare:

- tensione nominale della ventola;
- corrente di avvio e corrente continua;
- connettore e polarita;
- uscita controllata o sempre alimentata;
- presenza di MOSFET;
- supporto PWM del pin;
- eventuale filo tachimetrico;
- eventuale ingresso PWM separato nelle ventole a quattro fili.

Una ventola da 12 V non deve essere collegata direttamente a 24 V. Limitare il duty cycle con firmware non e equivalente a un convertitore di tensione sicuro: durante gli impulsi la ventola riceve comunque la tensione piena.

## Ventole controllate da `M106`

Il numero di ventole esposte al comando puo essere limitato:

```cpp
//#define NUM_M106_FANS 1
```

Se l'opzione non e impostata, Marlin ricava il numero dalla configurazione dei pin e dalle feature abilitate. Definirla non crea nuove uscite fisiche.

Accendere FAN0 al massimo:

```gcode
M106 P0 S255
```

Impostare circa il 50%:

```gcode
M106 P0 S128
```

Spegnere FAN0:

```gcode
M107 P0
```

Senza `P`, viene selezionata la ventola part cooling predefinita. `S` usa l'intervallo 0-255.

Il cambio di velocita `M106` viene associato al prossimo blocco inserito nel planner. Durante una stampa puo quindi attendere il completamento dei movimenti gia accodati, mantenendo il comando sincronizzato con il percorso. A macchina ferma l'effetto e immediato.

## Part cooling

La ventola part cooling modifica la solidificazione del materiale. Non e una protezione dell'hotend.

Effetti di una velocita eccessiva:

- adesione interlayer ridotta;
- warping su materiali sensibili;
- caduta di temperatura dell'hotend;
- thermal runaway se il flusso investe il blocco;
- rumorosita e vibrazioni.

Effetti di una velocita insufficiente:

- bridge cedevoli;
- dettagli piccoli deformati;
- layer precedenti ancora molli;
- superfici peggiori sui tempi layer brevi.

Il convogliatore deve dirigere l'aria sotto l'ugello, non sul blocco riscaldante o sul sensore.

## Velocita secondaria

Con:

```cpp
//#define EXTRA_FAN_SPEED
```

si puo memorizzare una velocita secondaria.

Impostare FAN1 a 128 come velocita secondaria:

```gcode
M106 P1 T128
```

Usare la velocita secondaria:

```gcode
M106 P1 T1
```

Ripristinare la precedente:

```gcode
M106 P1 T2
```

E una funzione di stato del firmware. Lo slicer deve sapere quando la velocita temporanea viene attivata e ripristinata.

## Hotend auto fan

In `Configuration_adv.h`:

```cpp
#define E0_AUTO_FAN_PIN -1
#define E1_AUTO_FAN_PIN -1
#define EXTRUDER_AUTO_FAN_TEMPERATURE 50
#define EXTRUDER_AUTO_FAN_SPEED 255
```

Un pin valido abilita l'accensione automatica quando l'hotend supera la soglia. `-1` disabilita l'uscita specifica.

Piu estrusori possono condividere lo stesso pin: la ventola si accende quando uno degli hotend associati supera la soglia.

La soglia deve:

- accendere la ventola prima che il calore risalga nella zona fredda;
- evitare accensioni inutili a temperatura ambiente;
- mantenere la ventola attiva durante il raffreddamento;
- essere compatibile con il sensore e la posizione reale.

Il valore 50 °C della configurazione e un default, non una garanzia per ogni heatbreak.

## Ventole a quattro fili e tachimetro

Per auto fan PWM a quattro fili:

```cpp
//#define FOURWIRES_FANS
```

Una ventola a quattro fili usa normalmente alimentazione continua, massa, tachimetro e ingresso PWM separato. Non va trattata automaticamente come una ventola a due fili commutando l'alimentazione: bisogna seguire pinout, livello logico e frequenza specificati dal produttore.

Il monitoraggio RPM si abilita assegnando un pin tachimetrico:

```cpp
//#define E0_FAN_TACHO_PIN -1
//#define E0_FAN_TACHO_PULLUP
```

Leggere i giri:

```gcode
M123
```

Il commento della release limita la funzione a ventole fino a 7000 RPM. La lettura tachimetrica non prova da sola che il flusso raggiunga il dissipatore: pale danneggiate, filtro ostruito o condotto staccato possono lasciare RPM presenti ma raffreddamento insufficiente.

## Controller fan

```cpp
//#define USE_CONTROLLER_FAN
```

Questa ventola raffredda driver stepper e MOSFET. Si attiva quando i driver sono abilitati e resta accesa per un intervallo dopo la loro disattivazione.

Parametri:

```cpp
#define CONTROLLERFAN_SPEED_MIN 0
#define CONTROLLERFAN_SPEED_ACTIVE 255
#define CONTROLLERFAN_SPEED_IDLE 0
#define CONTROLLERFAN_IDLE_TIME 60
```

Con sensore scheda:

```cpp
//#define CONTROLLER_FAN_MIN_BOARD_TEMP 40
```

la temperatura puo diventare un ulteriore trigger.

Per rendere i valori modificabili:

```cpp
//#define CONTROLLER_FAN_EDITABLE
```

Leggere la configurazione runtime:

```gcode
M710
```

Il controller fan non sostituisce un percorso d'aria progettato. Una ventola che ricircola aria calda in un box chiuso puo non ridurre la temperatura dei driver.

## Kickstart

Molte ventole non partono in modo affidabile a basso duty cycle:

```cpp
//#define FAN_KICKSTART_TIME 100
//#define FAN_KICKSTART_POWER 180
```

Al primo avvio Marlin applica per breve tempo una potenza maggiore, poi passa al valore richiesto. La funzione interessa part cooling e controller fan.

Il kickstart non corregge:

- cuscinetti usurati;
- ventola bloccata;
- tensione sbagliata;
- corrente insufficiente;
- duty cycle minimo troppo basso durante il funzionamento.

## Scaling del comando

```cpp
//#define FAN_MIN_PWM 50
//#define FAN_MAX_PWM 128
```

Marlin rimappa l'intervallo non nullo di `M106` nel range configurato:

- `FAN_MIN_PWM`: minima uscita applicata quando il comando non e zero;
- `FAN_MAX_PWM`: uscita massima.

Il valore di comando zero continua a spegnere la ventola.

`FAN_MIN_PWM` e utile per evitare regimi in cui la ventola si ferma. `FAN_MAX_PWM` puo limitare la potenza, ma non deve essere usato come unico adattamento tra tensioni incompatibili.

Per circuiti che richiedono uno stato off non nullo:

```cpp
//#define FAN_OFF_PWM 1
```

va verificata la logica dell'hardware: un valore errato puo impedire lo spegnimento completo.

## PWM software

```cpp
//#define FAN_SOFT_PWM
#define SOFT_PWM_SCALE 0
//#define SOFT_PWM_DITHER
```

`FAN_SOFT_PWM` usa il PWM software dei heater. Aumentare `SOFT_PWM_SCALE` raddoppia la frequenza a ogni incremento ma dimezza la risoluzione; a zero sono disponibili 128 posizioni effettive secondo il commento della release.

`SOFT_PWM_DITHER` distribuisce alcuni cicli per recuperare in media duty cycle intermedi quando la risoluzione e stata ridotta.

La modifica influenza anche il PWM software degli heater. Non va trattata come una regolazione isolata della rumorosita.

## PWM ad alta frequenza

```cpp
//#define FAST_PWM_FAN
```

Puo spostare il rumore fuori dalla banda udibile, ma aumenta il riscaldamento di FET o microcontrollore:

```cpp
//#define FAST_PWM_FAN_FREQUENCY 31400
```

La frequenza disponibile dipende dalla MCU, dai timer e dai pin. Frequenze troppo basse possono produrre comportamenti inattesi; frequenze troppo alte possono danneggiare l'hardware.

```cpp
//#define USE_OCR2A_AS_TOP
```

su AVR amplia le frequenze possibili sacrificando risoluzione e rendendo indisponibile il PWM sul pin OC2A. Prima di abilitarla bisogna controllare schema e assegnazione timer della scheda.

## Ventola ridondante e multiplexer

Per sincronizzare una seconda ventola part cooling con FAN0:

```cpp
//#define REDUNDANT_PART_COOLING_FAN 1
```

La seconda ventola riceve lo stesso comando, ma la ridondanza elettrica non assicura che entrambe funzionino senza tachimetro o controllo esterno.

Il multiplexer:

```cpp
#define FANMUX0_PIN -1
#define FANMUX1_PIN -1
#define FANMUX2_PIN -1
```

puo indirizzare automaticamente il segnale a 2, 4 o 8 ventole durante il cambio tool. Richiede hardware di multiplexing e pin reali; non permette di collegare piu carichi direttamente a un pin logico.

## Chamber fan

Con sensore camera:

```cpp
//#define CHAMBER_FAN
```

Un fan esistente puo essere destinato alla camera:

```cpp
//#define CHAMBER_FAN_INDEX 2
```

Modalita:

```cpp
#define CHAMBER_FAN_MODE 2
```

| Modalita | Comportamento |
|---:|---|
| 0 | velocita statica |
| 1 | aumenta quando la camera supera il target |
| 2 | curva a V rispetto alla differenza dal target |
| 3 | simile a 1, ma ventola sempre attiva |

I parametri `CHAMBER_FAN_BASE` e `CHAMBER_FAN_FACTOR` definiscono velocita minima e variazione per grado secondo la modalita.

Una ventola di ricircolo e una ventola di estrazione hanno effetti opposti. La modalita deve riflettere il percorso dell'aria.

Marlin supporta anche una presa d'aria comandata da servo:

```cpp
//#define CHAMBER_VENT
```

Angoli, limiti di eccesso termico e pendenza di raffreddamento devono essere verificati sul meccanismo reale.

## Cooler e auto fan camera

Pin automatici:

```cpp
#define CHAMBER_AUTO_FAN_PIN -1
#define COOLER_AUTO_FAN_PIN -1
#define CHAMBER_AUTO_FAN_TEMPERATURE 30
#define CHAMBER_AUTO_FAN_SPEED 255
#define COOLER_AUTO_FAN_TEMPERATURE 18
#define COOLER_AUTO_FAN_SPEED 255
```

Per il cooler dedicato:

```cpp
#define COOLER_FAN
#define COOLER_FAN_INDEX 0
#define COOLER_FAN_BASE 100
#define COOLER_FAN_FACTOR 25
```

Queste opzioni riguardano sistemi equipaggiati con `TEMP_SENSOR_COOLER`; non descrivono la normale ventola dell'hotend.

## Adaptive Fan Slowing

All'interno della protezione hotend:

```cpp
//#define ADAPTIVE_FAN_SLOWING
```

Marlin puo rallentare la ventola part cooling se la temperatura dell'hotend cala. Con PID:

```cpp
//#define NO_FAN_SLOWING_IN_PID_TUNING
```

puo impedire che questa correzione alteri l'autotune `M303`.

La funzione aiuta in una condizione transitoria, ma non deve compensare un convogliatore che soffia direttamente su blocco e termistore.

## Procedura di verifica

1. Identificare fisicamente ogni ventola.
2. Verificare tensione, corrente, polarita e tipo di comando.
3. Associare ciascuna ventola al pin previsto.
4. Con heater freddi, provare le ventole `M106` una alla volta.
5. Confermare che `P0`, `P1` e gli altri indici controllino il carico corretto.
6. Provare piu valori `S` e individuare partenza e regime minimo stabili.
7. Verificare lo spegnimento con `M107`.
8. Scaldare l'hotend a bassa temperatura e verificare l'auto fan.
9. Controllare che resti attiva durante il raffreddamento fino alla soglia.
10. Abilitare i motori e verificare il controller fan.
11. Provare ventola al massimo durante un test termico dell'hotend.
12. Controllare che il flusso part cooling non colpisca il blocco.
13. Se presente, confrontare RPM `M123` con comportamento reale.
14. Eseguire una stampa breve sorvegliando temperatura e raffreddamento.

## Errori comuni

- **Collegare una ventola 12 V a 24 V e limitarla con PWM:** gli impulsi restano a 24 V.
- **Usare la ventola heatbreak come FAN0 dello slicer:** puo spegnersi con hotend caldo.
- **Confondere part cooling e auto fan:** proteggono elementi differenti.
- **Impostare `FAN_MIN_PWM` sotto la soglia di rotazione:** la ventola puo fermarsi senza che il comando sia zero.
- **Usare kickstart per una ventola guasta:** risolve solo l'avvio a basso duty.
- **Aumentare arbitrariamente `FAST_PWM_FAN_FREQUENCY`:** timer, FET o ventola possono non supportarla.
- **Ignorare l'effetto di `SOFT_PWM_SCALE` sugli heater:** la modifica non riguarda soltanto le ventole.
- **Spegnere il controller fan appena si fermano i motori:** driver e MOSFET possono essere ancora caldi.
- **Interpretare RPM come prova del flusso corretto:** condotti e filtri possono essere ostruiti.
- **Usare chamber fan mode senza considerare il verso dell'aria:** si puo estrarre calore quando si voleva ricircolarlo.
- **Abilitare Adaptive Fan Slowing per coprire un duct errato:** la causa termica rimane.

## Checklist

- Ogni ventola ha ruolo, pin, tensione e corrente documentati.
- Le uscite dispongono di pilotaggio adatto al carico.
- FAN0 controlla davvero il part cooling.
- L'auto fan dell'hotend non dipende dallo slicer.
- La soglia auto fan protegge il heatbreak durante raffreddamento.
- Il duty cycle minimo mantiene la rotazione.
- Kickstart e scaling sono stati verificati separatamente.
- La frequenza PWM e compatibile con MCU, timer, FET e ventola.
- Le ventole a quattro fili seguono il proprio pinout.
- Il controller fan copre driver e MOSFET.
- Le ventole camera hanno percorso d'aria coerente con la modalita.
- Il flusso part cooling non investe il blocco riscaldante.
- `M123`, se disponibile, restituisce letture plausibili.
- Il comportamento e stato verificato con hotend e motori in condizioni reali.

## Fonti

- [Configuration.h 2.1.2.8 - Fan PWM](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Controller, auto and chamber fans](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M106 - Set Fan Speed](https://marlinfw.org/docs/gcode/M106.html)
- [M107 - Fan Off](https://marlinfw.org/docs/gcode/M107.html)
- [M123 - Fan Tachometers](https://marlinfw.org/docs/gcode/M123.html)
- [M710 - Controller Fan Settings](https://marlinfw.org/docs/gcode/M710.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Sensori di temperatura e limiti operativi]]
- [[Stampante 3D/Marlin/Pagine/Controllo PID MPC e protezioni termiche]]
- [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]
- [[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware]]
- [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento]]
