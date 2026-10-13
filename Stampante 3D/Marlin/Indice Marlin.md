# Indice Marlin

La guida e organizzata in base alla parte della stampante interessata dalla configurazione. Ogni pagina raccoglie le direttive correlate presenti in `Configuration.h` e `Configuration_adv.h`, indicando dipendenze, valori, rischi, esempi e procedure di verifica.

Il riferimento e la release 2.1.2.8, non una promessa di compatibilita con tutte le release successive. Per cambiare versione usare la procedura di migrazione e confrontare i sorgenti.

- [[Stampante 3D/Indice Stampante 3D|Indice Stampante 3D]]

## Riferimento della Guida

- Versione di riferimento: [Marlin 2.1.2.8](https://github.com/MarlinFirmware/Marlin/tree/2.1.2.8)
- File principale: [Configuration.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- Opzioni avanzate: [Configuration_adv.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- Ambito: configurazione generale di Marlin, indipendente da uno specifico modello di stampante

## Percorso Base

### Orientamento e configurazione

- [[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita|Introduzione a Marlin 2.1.2.8 e compatibilita]]
- [[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin|Struttura di Configuration.h e Configuration_adv.h]]
- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento|Metodo di configurazione, compilazione e caricamento]]

## Configurazione della Macchina

### Elettronica

- [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin|Scheda madre, porte seriali e pin]]
- [[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware|Alimentazione e protezioni hardware]]

### Meccanica

- [[Stampante 3D/Marlin/Pagine/Tipo di stampante e cinematica|Tipo di stampante e cinematica]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti|Dimensioni del piatto, area di lavoro e limiti]]

### Motori, driver e homing

- [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro|Motori, direzione e passi per millimetro]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping|Driver stepper, corrente e microstepping]]
- [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing|Endstop, homing e Sensorless Homing]]

## Movimento e Precisione

### Pianificazione del movimento

- [[Stampante 3D/Marlin/Pagine/Velocita accelerazioni Jerk e Junction Deviation|Velocita, accelerazioni, Jerk e Junction Deviation]]
- [[Stampante 3D/Marlin/Pagine/Segmentazione curve e precisione dei movimenti|Segmentazione, curve e precisione dei movimenti]]

### Compensazioni

- [[Stampante 3D/Marlin/Pagine/Linear Advance Input Shaping e compensazioni geometriche|Linear Advance, Input Shaping e compensazioni geometriche]]
- [[Stampante 3D/Marlin/Pagine/Babystepping e regolazioni dinamiche|Babystepping e regolazioni dinamiche]]

## Estrusione e Gestione Termica

### Estrusione

- [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento|Hotend, estrusori e filamento]]
- [[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile|Limiti di estrusione, retrazione e cambio utensile]]

### Temperature

- [[Stampante 3D/Marlin/Pagine/Sensori di temperatura e limiti operativi|Sensori di temperatura e limiti operativi]]
- [[Stampante 3D/Marlin/Pagine/Controllo PID MPC e protezioni termiche|Controllo PID, MPC e protezioni termiche]]
- [[Stampante 3D/Marlin/Pagine/Ventole e raffreddamento|Ventole e raffreddamento]]

## Piatto e Livellamento

### Sonda

- [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch|Probe Z, offset e BLTouch]]

### Livellamento

- [[Stampante 3D/Marlin/Pagine/Tipi di bed leveling e configurazione della mesh|Tipi di bed leveling e configurazione della mesh]]
- [[Stampante 3D/Marlin/Pagine/Z Safe Homing e allineamento degli assi Z|Z Safe Homing e allineamento degli assi Z]]

## Interfaccia e Periferiche

### Interfaccia

- [[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen|Display, controller, encoder e touchscreen]]
- [[Stampante 3D/Marlin/Pagine/Lingua menu e feedback acustico|Lingua, menu e feedback acustico]]

### Memoria e supporti

- [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni|EEPROM, scheda SD e salvataggio delle impostazioni]]
- [[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica|G-code per configurazione e diagnostica]]

### Accessori

- [[Stampante 3D/Marlin/Pagine/Sensore di fine filamento e recupero dopo perdita di alimentazione|Sensore di fine filamento e recupero dopo perdita di alimentazione]]
- [[Stampante 3D/Marlin/Pagine/Alimentatore rele LED luci buzzer e servo|Alimentatore, rele, LED, luci, buzzer e servo]]

## Verifica e Manutenzione

### Taratura

- [[Stampante 3D/Marlin/Pagine/Procedura completa di taratura e verifica|Procedura completa di taratura e verifica]]

### Diagnostica

- [[Stampante 3D/Marlin/Pagine/Errori di compilazione e avvio|Errori di compilazione e avvio]]
- [[Stampante 3D/Marlin/Pagine/Problemi di movimento temperatura estrusione e livellamento|Problemi di movimento, temperatura, estrusione e livellamento]]

### Consultazione

- [[Stampante 3D/Marlin/Pagine/Riferimento rapido delle direttive Marlin|Riferimento rapido delle direttive Marlin]]
- [[Stampante 3D/Marlin/Pagine/Migrazione della configurazione tra versioni|Migrazione della configurazione tra versioni]]
