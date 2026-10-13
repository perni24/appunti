---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - z-probe
  - bltouch
  - probe-offset
  - m851
aliases:
  - Sonda Z Marlin
  - Offset probe Marlin
  - BLTouch Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing]]"
  - "[[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Babystepping e regolazioni dinamiche]]"
  - "[[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]"
marlin-version: 2.1.2.8
title: Probe Z, offset e BLTouch
status: non revisionato
---

# Probe Z, offset e BLTouch

## Sintesi

La probe Z misura il punto in cui la sonda raggiunge il piatto. Marlin usa questa informazione per l'homing di Z, per misurare una mesh e per conoscere la posizione del punto sondato rispetto all'ugello.

Una configurazione affidabile richiede quattro elementi distinti:

1. il tipo di sonda corretto;
2. il pin di segnale e la logica elettrica corretti;
3. l'offset geometrico tra ugello e punto di trigger;
4. una procedura di test che preceda qualsiasi discesa automatica verso il piatto.

Il probe non livella fisicamente il piatto e non corregge una meccanica instabile. Misura la superficie; il metodo di bed leveling decide poi come utilizzare le misure.

## Quando usarlo

- Per usare una sonda come riferimento durante l'homing di Z.
- Per creare automaticamente una mesh del piatto.
- Per misurare inclinazione, irregolarita o ripetibilita della superficie.
- Per configurare BLTouch, sonde induttive, switch fissi, nozzle probe e altri sistemi supportati.

## Collegamento e ruolo della sonda

Una sonda puo:

- sostituire l'endstop Z-min;
- usare un ingresso dedicato ed essere impiegata anche per l'homing;
- usare un ingresso dedicato solo per il probing, lasciando l'homing a un endstop separato.

Se la sonda sostituisce l'endstop ed e collegata al connettore Z-min:

```cpp
#define Z_MIN_PROBE_USES_Z_MIN_ENDSTOP_PIN
```

Nella release 2.1.2.8 questa opzione abilita automaticamente l'uso della probe per l'homing Z.

Se la sonda usa un pin dedicato e deve eseguire anche l'homing:

```cpp
#define USE_PROBE_FOR_Z_HOMING
```

`Z_MIN_PROBE_PIN` serve soltanto quando il pin predefinito della scheda non corrisponde al collegamento reale:

```cpp
//#define Z_MIN_PROBE_PIN -1
```

Non va impostato copiando il numero usato da un'altra scheda. Il pin deve essere verificato nel file `pins` della motherboard, nella documentazione della scheda e nello schema del connettore.

## Logica del segnale

Il firmware deve interpretare correttamente gli stati libero e attivato:

```cpp
#define Z_MIN_PROBE_ENDSTOP_INVERTING false
```

Il valore corretto non si deduce dal tipo commerciale della sonda. Va verificato con `M119`.

Per uno switch semplice, un contatto normalmente chiuso offre un comportamento fail-safe migliore: un filo interrotto appare come una condizione anomala invece di rimanere indistinguibile da un circuito aperto a riposo. Sonde elettroniche, BLTouch e cloni devono invece seguire lo schema del produttore e i livelli logici ammessi dalla scheda.

> [!danger] Cablaggio
> Non fidarsi soltanto dei colori dei fili. Ordine, tensione e piedinatura possono cambiare tra produttori, cloni e schede. Un collegamento errato puo danneggiare sia la sonda sia il microcontrollore.

## Scelta del tipo di probe

In `Configuration.h` va abilitata una sola architettura compatibile con l'hardware.

### Sonda fissa

Per switch fissi e molte sonde induttive:

```cpp
#define FIX_MOUNTED_PROBE
```

Una sonda induttiva rileva materiale conduttivo e la distanza di trigger puo cambiare con materiale, spessore e temperatura del piano. Non va considerata automaticamente compatibile con vetro o superfici non metalliche.

### Ugello usato come sonda

Per sistemi in cui il contatto viene rilevato dall'ugello:

```cpp
#define NOZZLE_AS_PROBE
```

L'offset XY e normalmente nullo, ma il sistema deve tollerare residui sull'ugello, temperatura e flessione della struttura.

### Sonda su servo

Per uno switch montato su un braccio comandato da servo:

```cpp
#define Z_PROBE_SERVO_NR 0
```

Gli angoli di estensione e rientro si impostano con:

```cpp
#define Z_SERVO_ANGLES { 70, 0 }
```

I valori sono specifici del meccanismo e devono essere provati lontano dal piatto.

### Altri tipi

La release include anche `PROBE_MANUALLY`, `SOLENOID_PROBE`, `Z_PROBE_SLED`, `RACK_AND_PINION_PROBE`, `MAG_MOUNTED_PROBE`, `DUET_SMART_EFFECTOR`, `TOUCH_MI_PROBE`, `Z_PROBE_ALLEN_KEY` e `SENSORLESS_PROBING`.

Ogni tipo ha dipendenze e sequenze di deploy differenti. In particolare, il sorgente avverte che il probing sensorless puo danneggiare macchine con viti di comando Z: non e un sostituto generico di una probe fisica.

## Configurazione del BLTouch

Il BLTouch usa un comando simile a quello di un servo per estendere e ritrarre il pin e un secondo segnale per comunicare il trigger.

La funzione principale e:

```cpp
#define BLTOUCH
```

Non va abilitato contemporaneamente come `FIX_MOUNTED_PROBE` o come servo probe generico.

La connessione comprende normalmente:

- alimentazione;
- massa;
- segnale di controllo per deploy e stow;
- ingresso di trigger;
- riferimento elettrico del segnale.

La posizione dei pin e la tensione ammessa dipendono dalla scheda. I nomi commerciali dei connettori non garantiscono che l'ordine dei fili coincida.

### Ritardo tra i comandi

Se la sonda non riconosce in modo affidabile deploy e stow:

```cpp
//#define BLTOUCH_DELAY 500
```

Il valore e espresso in millisecondi. Va abilitato o aumentato solo quando il problema e realmente temporale, dopo avere escluso alimentazione, connettori e segnale.

### Modalita di uscita

BLTouch Smart 3.0 e 3.1 supportano modalita open-drain e 5 V:

```cpp
//#define BLTOUCH_SET_5V_MODE
```

> [!danger] Livello logico
> `BLTOUCH_SET_5V_MODE` non deve essere abilitato senza avere verificato che l'ingresso della scheda sia tollerante a 5 V. Molte MCU a 3,3 V non lo sono.

`BLTOUCH_FORCE_MODE_SET` forza la scrittura della modalita nella memoria interna della sonda. Per un BLTouch 3.1 il sorgente raccomanda di usarlo una volta, poi disabilitarlo e ricompilare per evitare scritture inutili:

```cpp
//#define BLTOUCH_FORCE_MODE_SET
```

I cloni possono non implementare i comandi avanzati nello stesso modo. In assenza di documentazione certa e preferibile lasciare i default.

### High Speed Mode

```cpp
//#define BLTOUCH_HS_MODE true
```

In modalita high speed il pin puo rimanere esteso tra letture. Riduce i tempi, ma va abilitata soltanto dopo avere dimostrato che deploy, trigger, risalita di Z e misure ripetute sono affidabili. Una macchina che non libera il pin abbastanza rapidamente puo portare la sonda in allarme.

Lo stato puo essere letto con:

```gcode
M401 H
```

La modalita puo essere abilitata a runtime con:

```gcode
M401 S1
```

La modalita puo essere disabilitata con:

```gcode
M401 S0
```

Se la configurazione e salvabile in EEPROM:

```gcode
M500
```

## Offset tra ugello e probe

Marlin definisce la distanza dal punto dell'ugello al punto di trigger della sonda:

```cpp
#define NOZZLE_TO_PROBE_OFFSET { X, Y, Z }
```

Con l'orientamento standard del piano:

| Posizione della probe rispetto all'ugello | Segno |
|---|---|
| a destra | X positivo |
| a sinistra | X negativo |
| dietro | Y positivo |
| davanti | Y negativo |
| trigger sotto la punta dell'ugello | Z normalmente negativo |

Esempio puramente geometrico: una sonda 35 mm a sinistra, 8 mm dietro e con trigger 2,4 mm sotto la punta:

```cpp
#define NOZZLE_TO_PROBE_OFFSET { -35, 8, -2.4 }
```

Questi numeri non sono valori consigliati. X e Y si misurano dal centro dell'ugello al centro della sonda; Z va tarato sulla macchina montata.

Gli offset possono essere modificati a runtime:

```gcode
M851 X-35 Y8 Z-2.4
```

Le modifiche runtime influenzano i probing successivi, ma non correggono una mesh gia misurata. Dopo una variazione significativa di offset o montaggio, la mesh deve essere ricreata.

## Margini e area raggiungibile

La probe e spostata rispetto all'ugello. Un punto raggiungibile dall'ugello puo quindi non esserlo dalla sonda.

Il margine generale e:

```cpp
#define PROBING_MARGIN 10
```

In `Configuration_adv.h` e possibile differenziarlo:

```cpp
//#define PROBING_MARGIN_LEFT PROBING_MARGIN
//#define PROBING_MARGIN_RIGHT PROBING_MARGIN
//#define PROBING_MARGIN_FRONT PROBING_MARGIN
//#define PROBING_MARGIN_BACK PROBING_MARGIN
```

I margini devono evitare:

- clip e viti del piano;
- bordi non sensibili;
- zone in cui il carrello supera i limiti;
- deploy o stow contro telaio e cablaggi.

Marlin adatta i punti calcolati agli offset XY, ma geometria, limiti e margini devono rappresentare la macchina reale.

## Velocita, letture multiple e clearances

La velocita XY tra i punti:

```cpp
#define XY_PROBE_FEEDRATE (133*60)
```

Le velocita Z di prima lettura e lettura precisa:

```cpp
#define Z_PROBE_FEEDRATE_FAST (4*60)
#define Z_PROBE_FEEDRATE_SLOW (Z_PROBE_FEEDRATE_FAST / 2)
```

Sono espresse in millimetri al minuto. Una velocita eccessiva puo aumentare urti, ritardi apparenti e dispersione; una velocita molto bassa puo amplificare altri effetti meccanici o termici.

Per ripetere la misura:

```cpp
//#define MULTIPLE_PROBING 2
//#define EXTRA_PROBING 1
```

Con due letture Marlin usa un approccio veloce e uno lento con media pesata. Con tre o piu aggiunge letture lente e calcola la media. `EXTRA_PROBING` consente di scartare le misure piu atipiche.

Le altezze di sicurezza sono:

```cpp
#define Z_CLEARANCE_DEPLOY_PROBE 10
#define Z_CLEARANCE_BETWEEN_PROBES 5
#define Z_CLEARANCE_MULTI_PROBE 5
//#define Z_AFTER_PROBING 5
```

Queste distanze si aggiungono a un eventuale offset Z negativo. Devono lasciare spazio al meccanismo di deploy e agli spostamenti, senza aumentare inutilmente i tempi.

Il limite inferiore della ricerca:

```cpp
#define Z_PROBE_LOW_POINT -2
```

impedisce di continuare indefinitamente sotto il punto di trigger atteso. Non protegge da un offset errato abbastanza grande da causare una collisione prima del limite.

## Test iniziale senza rischio

Il primo test deve essere eseguito con la testina lontana dal piatto, velocita controllate e accesso immediato allo spegnimento.

### Controllare lo stato a riposo

```gcode
M119
```

La probe libera deve risultare non attivata. Il nome mostrato puo dipendere dalla configurazione.

### Controllare lo stato attivato

Attivare manualmente il sensore senza muovere Z e ripetere:

```gcode
M119
```

Lo stato deve cambiare in `TRIGGERED`. Se non cambia, non eseguire homing Z.

### Provare deploy e stow

Per estendere una sonda mobile:

```gcode
M401
```

Per ritrarla:

```gcode
M402
```

Per una sonda fissa i comandi possono non produrre un movimento visibile.

### Simulare il trigger durante la discesa

Dopo avere eseguito l'homing degli assi necessari e avere sollevato la testina, avviare un homing Z sorvegliato:

```gcode
G28 Z
```

Prima che la sonda raggiunga il piatto, attivarla manualmente. Z deve fermarsi e completare la sequenza prevista. Se continua a scendere, togliere alimentazione e correggere pin, inversione o cablaggio.

Questo test non sostituisce la verifica della posizione sicura di homing: con offset XY la sonda deve trovarsi sopra una zona raggiungibile del piatto.

### Eseguire una singola misura

Portare la sonda su un punto centrale e libero, quindi:

```gcode
G30
```

Il comando esegue una singola misura Z. Va usato soltanto dopo il test manuale del trigger.

## Taratura dell'offset Z

### Metodo con wizard

Con una MarlinUI compatibile si puo abilitare:

```cpp
//#define PROBE_OFFSET_WIZARD
```

La posizione della procedura puo essere definita con:

```cpp
//#define PROBE_OFFSET_WIZARD_XY_POS { X_CENTER, Y_CENTER }
```

Il wizard guida l'avvicinamento dell'ugello e riduce gli errori di segno. `PROBE_OFFSET_WIZARD_START_Z` deve partire leggermente sopra il valore stimato, non sotto il piano.

### Metodo manuale

La procedura documentata da Marlin presuppone che la posizione homed di Z rappresenti correttamente `Z0`:

1. eseguire l'homing di Z;
2. alzare Z e fare deploy della sonda;
3. scendere molto lentamente controllando il cambio di stato con `M119`;
4. leggere la posizione corrente con `M114`;
5. negare il valore rilevato;
6. impostarlo con `M851`;
7. salvare con `M500`.

Leggere la posizione:

```gcode
M114
```

Se il trigger avviene, per esempio, a `Z5.2`, impostare:

```gcode
M851 Z-5.2
```

Salvare:

```gcode
M500
```

Verificare le impostazioni memorizzate:

```gcode
M503
```

Il valore va poi rifinito con una verifica controllata della distanza ugello-piatto o del primo layer. Correzioni grandi non devono essere affidate al babystepping: indicano che offset, montaggio o riferimento Z devono essere ricontrollati.

## Test di ripetibilita

Per abilitare `M48`:

```cpp
//#define Z_MIN_PROBE_REPEATABILITY_TEST
```

Dopo homing e verifica dei limiti, eseguire dieci letture nello stesso punto:

```gcode
M48 P10
```

Il risultato include la deviazione standard delle misure. Il test valuta la precisione, non l'accuratezza assoluta: una sonda puo ripetere sempre lo stesso valore ma avere un offset Z errato.

Se la dispersione e elevata, controllare:

- gioco nel supporto della sonda;
- movimento del gruppo hotend;
- cuscinetti e ruote;
- flessione del gantry;
- sporco sul pin o sull'ugello;
- temperatura non stabile;
- vibrazioni;
- alimentazione e disturbi elettrici;
- velocita e meccanismo di deploy.

Non esiste una soglia universale valida per ogni cinematica e risoluzione. Il valore deve essere confrontato con l'altezza layer richiesta e con test ripetuti nelle stesse condizioni.

## Stabilita termica ed elettrica

Se le letture cambiano con heater o ventole, `Configuration.h` offre:

```cpp
//#define PROBING_HEATERS_OFF
//#define PROBING_FANS_OFF
//#define PROBING_ESTEPPERS_OFF
//#define PROBING_STEPPERS_OFF
//#define DELAY_BEFORE_PROBING 200
```

Queste opzioni possono ridurre rumore e vibrazioni durante la misura, ma non devono nascondere un cablaggio difettoso. Spegnere gli heater durante una mesh lunga puo inoltre cambiare la temperatura e la geometria del piatto.

Per imporre condizioni termiche minime prima del probing:

```cpp
//#define PREHEAT_BEFORE_PROBING
```

con:

```cpp
#define PROBING_NOZZLE_TEMP 120
#define PROBING_BED_TEMP 50
```

Le temperature devono essere adatte alla sonda, alla superficie e alla procedura. Un ugello caldo e sporco e particolarmente critico quando l'ugello stesso e il sensore.

## Errori comuni

### La sonda funziona con `M401`, ma Z non si ferma

- **Causa probabile:** il segnale di controllo funziona, quello di trigger no.
- **Controllo:** verificare entrambi gli stati con `M119`.
- **Correzione:** controllare pin, massa, connettore e inversione senza affidarsi ai colori.

### Il trigger risulta sempre attivo

- **Causa probabile:** logica invertita, filo errato, pin flottante o sonda in allarme.
- **Correzione:** verificare il cablaggio e `Z_MIN_PROBE_ENDSTOP_INVERTING`; non avviare `G28 Z`.

### L'ugello scende fuori dal piatto

- **Causa probabile:** offset XY, area di lavoro, margini o posizione di homing incoerenti.
- **Correzione:** ricalcolare la zona raggiungibile dalla probe, non soltanto quella raggiungibile dall'ugello.

### La mesh e ripetibile ma il primo layer e errato

- **Causa probabile:** offset Z sbagliato, mesh non attivata o mesh obsoleta.
- **Correzione:** tarare `M851`, verificare lo stato del leveling e ricreare la mesh.

### Il BLTouch entra in allarme

- **Causa probabile:** pin bloccato, deploy impedito, movimento Z insufficiente, cablaggio o high speed non affidabile.
- **Correzione:** pulire e riallineare secondo le istruzioni del produttore, disabilitare HS mode e ripetere i test lontano dal piatto.

### Le letture cambiano a caldo

- **Causa probabile:** dilatazione meccanica, sensibilita termica della sonda o disturbi degli heater.
- **Correzione:** misurare in condizioni termiche ripetibili e distinguere deriva termica da rumore elettrico.

## Checklist

- [ ] Il tipo di probe abilitato corrisponde all'hardware.
- [ ] Il pin e stato verificato sulla scheda e nei file `pins`.
- [ ] Tensione, massa e livello logico sono compatibili.
- [ ] `M119` cambia correttamente tra stato libero e attivato.
- [ ] Deploy e stow funzionano lontano dal piatto.
- [ ] Il trigger manuale arresta la prima discesa Z.
- [ ] Gli offset X e Y sono stati misurati con segno corretto.
- [ ] L'offset Z e stato tarato e verificato, non copiato.
- [ ] Margini e clearances evitano bordi, clip e ostacoli.
- [ ] La ripetibilita e stata misurata nelle condizioni d'uso.
- [ ] Le modifiche runtime sono state salvate solo dopo la verifica.
- [ ] La mesh e stata ricreata dopo modifiche meccaniche o agli offset.

## Riferimenti

- [Marlin 2.1.2.8 - Configuration.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Marlin 2.1.2.8 - Configuration_adv.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Marlin - Probe Configuration](https://marlinfw.org/docs/configuration/probes.html)
- [Marlin - M401 Deploy Probe](https://marlinfw.org/docs/gcode/M401.html)
- [Marlin - M402 Stow Probe](https://marlinfw.org/docs/gcode/M402.html)
- [Marlin - M851 XYZ Probe Offset](https://marlinfw.org/docs/gcode/M851.html)
- [Marlin - M48 Probe Repeatability Test](https://marlinfw.org/docs/gcode/M048.html)

## Collegamenti

- [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing|Endstop homing e Sensorless Homing]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti|Dimensioni del piatto area di lavoro e limiti]]
- [[Stampante 3D/Marlin/Pagine/Babystepping e regolazioni dinamiche|Babystepping e regolazioni dinamiche]]
- [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin|Scheda madre porte seriali e pin]]


## Navigazione

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
