---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - endstop
  - homing
  - sensorless-homing
  - stallguard
aliases:
  - Endstop Marlin
  - Homing Marlin
  - Sensorless Homing Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro]]"
  - "[[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping]]"
related: []
marlin-version: 2.1.2.8
title: Endstop, homing e Sensorless Homing
status: non revisionato
---

# Endstop, homing e Sensorless Homing

## Sintesi

Gli endstop comunicano a Marlin il raggiungimento di un riferimento fisico. L'homing con `G28` muove uno o piu assi verso questi riferimenti e assegna una posizione nota al sistema di coordinate.

Un endstop non misura continuamente la posizione dell'asse. Dopo l'homing, Marlin calcola la posizione contando i passi inviati. Slittamenti, spostamenti a motori disabilitati e perdita di passi rendono nuovamente incerta la posizione.

Il Sensorless Homing sostituisce l'interruttore con il rilevamento di stallo dei driver TMC compatibili. Riduce l'hardware, ma richiede una taratura dipendente da attrito, corrente, velocita e temperatura ed e generalmente meno deterministico di un buon interruttore.

## Quando usarlo

Questa configurazione va eseguita:

- alla prima accensione della macchina;
- quando cambia il tipo o il cablaggio di un finecorsa;
- dopo aver spostato un endstop da MIN a MAX;
- quando `M119` mostra stati invertiti o instabili;
- quando l'homing si muove nella direzione sbagliata;
- quando un asse non si arresta sul finecorsa;
- quando vengono aggiunti motori e finecorsa multipli;
- quando si abilita StallGuard per il Sensorless Homing.

## Ruolo delle impostazioni

La configurazione comprende livelli distinti:

1. `USE_*_PLUG` abilita il connettore logico;
2. pull-up o pull-down impediscono un ingresso flottante;
3. `*_ENDSTOP_INVERTING` interpreta il livello elettrico;
4. `*_HOME_DIR` sceglie il lato verso cui muoversi;
5. `HOMING_FEEDRATE_MM_M` definisce la velocita;
6. bump e backoff definiscono avvicinamento e rilascio;
7. `*_MIN_POS` e `*_MAX_POS` descrivono le coordinate assegnate;
8. eventuali probe o StallGuard producono il segnale di trigger.

Modificare un livello per compensare un errore appartenente a un altro rende la configurazione fragile.

## Abilitare i connettori usati

Nel `Configuration.h` predefinito:

```cpp
#define USE_XMIN_PLUG
#define USE_YMIN_PLUG
#define USE_ZMIN_PLUG
```

Sono disponibili i connettori MIN e MAX per X, Y, Z e per gli assi aggiuntivi I-W.

Va abilitato soltanto un connettore realmente usato da:

- finecorsa;
- probe;
- pin DIAG per Sensorless Homing;
- secondo endstop di un asse.

Un connettore riutilizzato per una funzione diversa non deve rimanere dichiarato come endstop. Nei sistemi con finecorsa multipli, l'opzione `X2_USE_ENDSTOP`, `Y2_USE_ENDSTOP` o `Z2_USE_ENDSTOP` deve puntare al connettore effettivo e il corrispondente `USE_*_PLUG` deve essere abilitato.

## Cablaggio e stato elettrico

Un microinterruttore meccanico dispone spesso di:

- `COM`: comune;
- `NO`: normalmente aperto;
- `NC`: normalmente chiuso.

La configurazione predefinita di Marlin 2.1.2.8 indica come caso comune un interruttore con `COM` a massa e `NC` al segnale:

```cpp
#define X_MIN_ENDSTOP_INVERTING false
```

Un contatto NC permette spesso di riconoscere anche un cavo interrotto, perche l'apertura del circuito produce lo stesso stato del trigger. Questo vantaggio dipende pero dal circuito della scheda e dalla logica configurata.

Prima di collegare un endstop a tre fili bisogna verificare il pinout. Cortocircuitare alimentazione e massa azionando il microswitch puo danneggiare la scheda.

## Pull-up e pull-down

La configurazione generale usa:

```cpp
#define ENDSTOPPULLUPS
```

Il pull-up porta l'ingresso a un livello noto quando il contatto non lo forza. Disabilitando l'opzione globale si possono selezionare singoli ingressi:

```cpp
//#define ENDSTOPPULLUP_XMIN
//#define ENDSTOPPULLUP_YMIN
//#define ENDSTOPPULLUP_ZMIN
```

In alternativa esistono `ENDSTOPPULLDOWNS` e le varianti individuali.

Pull-up e pull-down devono essere coerenti con:

- circuito della scheda;
- tipo di sensore;
- uscita open-drain o push-pull;
- tensione logica ammessa;
- cablaggio NO o NC.

Non vanno abilitati entrambi senza una ragione supportata dallo schema. Un ingresso flottante puo cambiare stato per rumore e causare arresti casuali.

## Inversione logica

Le direttive:

```cpp
#define X_MIN_ENDSTOP_INVERTING false
#define Y_MIN_ENDSTOP_INVERTING false
#define Z_MIN_ENDSTOP_INVERTING false
#define X_MAX_ENDSTOP_INVERTING false
```

fanno interpretare a Marlin il livello elettrico come `open` o `TRIGGERED`. Sono presenti direttive equivalenti per tutti gli assi e:

```cpp
#define Z_MIN_PROBE_ENDSTOP_INVERTING false
```

per il probe.

Il valore corretto non si sceglie dal colore dei fili. Si verifica con `M119`.

## Verifica obbligatoria con `M119`

Allontanare manualmente tutti gli endstop e inviare:

```gcode
M119
```

Ogni ingresso deve risultare `open`.

Premere un solo endstop e ripetere:

```gcode
M119
```

Soltanto quell'ingresso deve risultare `TRIGGERED`.

La prova va ripetuta per ciascun endstop e probe. Prima di usare `G28` devono essere vere tutte queste condizioni:

- stato aperto stabile;
- stato premuto stabile;
- nome riportato corrispondente all'asse;
- nessun altro ingresso cambia insieme;
- scollegare il cavo produce un comportamento compreso e sicuro.

Se `M119` non cambia, controllare connettore, pinout e `USE_*_PLUG`. Se cambia al contrario, correggere `*_ENDSTOP_INVERTING` soltanto dopo aver verificato il cablaggio.

## Rumore elettrico

La release offre:

```cpp
//#define ENDSTOP_NOISE_THRESHOLD 2
```

Filtra trigger brevi, ma valori maggiori possono ridurre ripetibilita o precisione di alcuni probe. Il sorgente suggerisce, come correzione hardware del rumore, un condensatore ceramico da 100 nF in parallelo al contatto; alcuni moduli lo includono gia.

Prima del filtro vanno controllati:

- cavi lontani da motori e riscaldatori;
- massa e schermatura;
- connettori;
- alimentazione del sensore;
- pull-up/pull-down;
- livelli logici;
- falsi contatti.

```cpp
//#define ENDSTOP_INTERRUPTS_FEATURE
```

riduce il polling usando interrupt, ma richiede che tutti i pin endstop abilitati supportino interrupt.

```cpp
//#define DETECT_BROKEN_ENDSTOP
```

controlla endstop bloccati o scollegati durante l'homing. Non sostituisce il test iniziale con `M119`.

## Direzione di homing

```cpp
#define X_HOME_DIR -1
#define Y_HOME_DIR -1
#define Z_HOME_DIR -1
```

I valori ammessi sono:

- `-1`: homing verso il lato MIN;
- `1`: homing verso il lato MAX.

La direzione deve corrispondere al connettore e alla posizione fisica del sensore. Per esempio, con `X_HOME_DIR -1` e un interruttore sul minimo X si usa normalmente `USE_XMIN_PLUG`.

`INVERT_X_DIR` determina quale segnale produce un movimento positivo; `X_HOME_DIR` determina verso quale estremita cercare il riferimento. Non sono intercambiabili.

## Velocita e sequenza di homing

Nel file base:

```cpp
#define HOMING_FEEDRATE_MM_M { (50*60), (50*60), (4*60) }
```

I valori sono in mm/min per gli assi lineari. L'esempio corrisponde a:

- X: 3000 mm/min;
- Y: 3000 mm/min;
- Z: 240 mm/min.

Una velocita eccessiva aumenta urto e spazio di arresto. Una velocita troppo bassa puo rendere inaffidabile StallGuard.

Le opzioni di ordine includono:

```cpp
//#define QUICK_HOME
//#define HOME_Y_BEFORE_X
//#define HOME_Z_FIRST
//#define CODEPENDENT_XY_HOMING
```

- `QUICK_HOME` esegue inizialmente un movimento diagonale quando `G28` include X e Y;
- `HOME_Y_BEFORE_X` forza Y prima di X;
- `HOME_Z_FIRST` porta Z per primo e richiede un endstop reale, non un probe;
- `CODEPENDENT_XY_HOMING` gestisce meccaniche in cui X e Y dipendono reciprocamente.

La sequenza deve evitare collisioni con telaio, probe, dock, fermagli del piatto e utensili.

## Altezza di sicurezza Z

```cpp
//#define Z_HOMING_HEIGHT 4
//#define Z_AFTER_HOMING 10
```

`Z_HOMING_HEIGHT` impone uno spazio minimo prima dell'homing per superare piatto e ostacoli. Il sorgente avverte che deve esistere corsa sufficiente oltre la posizione corrente: se Z e gia vicino al massimo, il sollevamento puo provocare grinding.

`Z_AFTER_HOMING` porta Z all'altezza indicata dopo l'homing.

Con probe usato per l'homing Z, `Z_SAFE_HOMING` sposta il probe in un punto sicuro prima della discesa:

```cpp
//#define Z_SAFE_HOMING

#define Z_SAFE_HOMING_X_POINT X_CENTER
#define Z_SAFE_HOMING_Y_POINT Y_CENTER
```

La configurazione completa del probe e trattata nella nota dedicata. Il punto deve essere raggiungibile dal **probe**, considerando il suo offset rispetto all'ugello.

## Bump e backoff

In `Configuration_adv.h`:

```cpp
#define HOMING_BUMP_MM      { 5, 5, 2 }
#define HOMING_BUMP_DIVISOR { 2, 2, 4 }
```

La procedura tipica:

1. raggiunge l'endstop alla velocita di homing;
2. arretra della distanza `HOMING_BUMP_MM`;
3. si riavvicina a velocita ridotta dividendo il feedrate per `HOMING_BUMP_DIVISOR`.

Il secondo contatto lento migliora generalmente la ripetibilita degli interruttori.

Altre opzioni:

```cpp
//#define HOMING_BACKOFF_POST_MM { 2, 2, 2 }
//#define XY_COUNTERPART_BACKOFF_MM 0
//#define SENSORLESS_BACKOFF_MM { 2, 2, 0 }
```

- `HOMING_BACKOFF_POST_MM` libera l'endstop al termine;
- `XY_COUNTERPART_BACKOFF_MM` arretra l'asse gia homed durante l'homing dell'altro;
- `SENSORLESS_BACKOFF_MM` crea distanza prima di un nuovo homing sensorless.

Con Sensorless Homing il sorgente raccomanda `HOMING_BUMP_MM { 0, 0, 0 }`, perche un secondo urto non equivale al secondo contatto controllato di un microswitch.

## Validazione dell'homing

```cpp
#define VALIDATE_HOMING_ENDSTOPS
```

fa verificare che l'endstop previsto sia stato effettivamente raggiunto. Va mantenuta salvo una ragione tecnica precisa: senza validazione, un movimento terminato senza trigger potrebbe essere accettato come riferimento.

Le opzioni:

```cpp
//#define NO_MOTION_BEFORE_HOMING
//#define HOME_AFTER_DEACTIVATE
```

impediscono movimenti prima del riferimento e richiedono un nuovo homing dopo la disattivazione dei motori. Sono importanti quando l'utente puo spostare manualmente gli assi.

## `G28`

Homing di tutti gli assi previsti:

```gcode
G28
```

Homing del solo asse X:

```gcode
G28 X
```

Homing di X e Y:

```gcode
G28 X Y
```

Il primo test non va eseguito lasciando la macchina incustodita. Tenere pronto l'arresto e premere manualmente l'endstop prima che l'asse lo raggiunga. Se il motore non si ferma immediatamente, togliere alimentazione e correggere la configurazione.

Dopo il trigger, Marlin assegna la posizione coerente con limiti e offset. Un homing riuscito elettricamente non garantisce quindi che `X_MIN_POS`, `X_MAX_POS` o gli offset siano geometricamente corretti.

## Endstop multipli

Per due motori X indipendenti:

```cpp
//#define X_DUAL_ENDSTOPS
#define X2_USE_ENDSTOP _XMAX_
#define X2_ENDSTOP_ADJUSTMENT 0
```

Esistono opzioni equivalenti per Y e, con piu motori Z:

```cpp
//#define Z_MULTI_ENDSTOPS
#define Z2_USE_ENDSTOP _XMAX_
#define Z2_ENDSTOP_ADJUSTMENT 0
```

Durante `G28`, Marlin puo arrestare separatamente i motori per allineare il gantry. Gli offset possono essere regolati con `M666` e salvati con `M500`.

La sigla del connettore assegnato al secondo motore non ne cambia il ruolo geometrico. Per esempio, un endstop Z2 collegato fisicamente a XMAX resta un riferimento Z2.

`M119` deve mostrare anche gli endstop aggiuntivi. Prima del test bisogna verificare singolarmente quale sensore arresta quale motore.

## Sensorless Homing

In `Configuration_adv.h`:

```cpp
//#define SENSORLESS_HOMING
```

La release lo associa ai driver con StallGuard:

- TMC2130;
- TMC2160;
- TMC2209;
- TMC2660;
- TMC5130;
- TMC5160.

Durante l'homing X, Y e Z operano in SpreadCycle. Nella configurazione cablata, il pin DIAG1 del driver va collegato all'ingresso endstop dell'asse.

Per TMC2130 e TMC5160:

```cpp
//#define SPI_ENDSTOPS
```

permette di leggere lo stallo via SPI senza il filo DIAG1. Questa opzione non e generica per tutti i TMC.

## Sensibilita StallGuard

```cpp
#define X_STALL_SENSITIVITY 8
#define Y_STALL_SENSITIVITY 8
```

Le scale non hanno lo stesso verso:

| Driver | Sensibilita massima | Sensibilita minima |
|---|---:|---:|
| TMC2209 | 255 | 0 |
| altri indicati dal commento Marlin | -64 | 63 |

Quindi:

- sul TMC2209, aumentare il valore rende il trigger piu sensibile;
- sui TMC2130 e scale analoghe, diminuire verso `-64` rende il trigger piu sensibile.

Troppa sensibilita causa falsi trigger prima del limite. Sensibilita insufficiente lascia il motore premere contro il telaio senza arrestarsi.

La modifica runtime usa:

```gcode
M914 X8
```

Il valore va interpretato secondo il driver. Commentare `*_STALL_SENSITIVITY` disabilita il Sensorless Homing per quell'asse anche se la funzione globale rimane attiva.

## Fattori che cambiano il trigger sensorless

StallGuard misura il carico elettrico e dinamico, non una posizione. Il punto di trigger varia con:

- corrente di homing;
- velocita;
- accelerazione;
- attrito di guide e cinghie;
- tensione delle cinghie;
- massa dell'asse;
- temperatura del motore e del driver;
- tensione di alimentazione;
- modalita e chopper timing;
- collisioni o cavi che ostacolano il movimento.

Per questo la taratura va ripetuta dopo modifiche meccaniche o elettriche.

```cpp
//#define IMPROVE_HOMING_RELIABILITY
```

regola accelerazione e jerk durante l'homing e aggiunge un periodo di guardia per il trigger.

```cpp
//#define TMC_HOME_PHASE { 896, 896, 896 }
```

puo migliorare la ripetibilita portando il motore verso una fase assoluta della tabella TMC. I valori validi sono `0..1023`; `-1` disabilita la funzione per l'asse. Le posizioni di full step indicate dal sorgente sono 128, 384, 640 e 896. Questa funzione rifinisce un sistema gia funzionante, non corregge attrito o sensibilita errata.

## Procedura per endstop meccanici

1. Spegnere la macchina e verificare il pinout.
2. Collegare un sensore alla volta.
3. Abilitare il relativo `USE_*_PLUG`.
4. Impostare pull-up o pull-down coerente.
5. Accendere senza eseguire homing.
6. Verificare stato libero e premuto con `M119`.
7. Controllare `*_HOME_DIR`.
8. Spostare manualmente l'asse lontano dal limite.
9. Avviare il solo asse con `G28 X`, `G28 Y` o `G28 Z`.
10. Premere manualmente il sensore durante il movimento.
11. Verificare arresto, backoff e secondo contatto.
12. Solo dopo consentire il contatto meccanico reale.
13. Misurare ripetibilita e correggere posizione e offset separatamente.

## Procedura per Sensorless Homing

1. Verificare che driver e collegamento supportino StallGuard.
2. Confermare comunicazione con `M122`.
3. Collegare DIAG1 all'endstop oppure configurare `SPI_ENDSTOPS` solo dove supportato.
4. Controllare con `M119` lo stato a riposo.
5. Impostare una corrente di homing prudente.
6. Disabilitare il bump come raccomandato dalla release.
7. Scegliere una velocita costante e adatta a StallGuard.
8. Partire da una sensibilita poco aggressiva.
9. Avviare un solo asse mantenendo pronto l'arresto.
10. Regolare con `M914` finche il limite viene rilevato senza falsi trigger.
11. Ripetere da posizioni iniziali e temperature differenti.
12. Verificare che normali accelerazioni non producano trigger.
13. Lasciare un margine rispetto al valore appena sufficiente.
14. Salvare e documentare corrente, velocita e sensibilita insieme.

## Errori comuni

- **Usare `G28` prima di `M119`:** un ingresso invertito puo impedire l'arresto.
- **Confondere MIN/MAX con il verso elettrico:** posizione fisica e logica del segnale sono aspetti distinti.
- **Correggere `HOME_DIR` per un motore invertito:** l'asse continuera ad avere coordinate incoerenti.
- **Lasciare un ingresso flottante:** compaiono trigger casuali.
- **Usare filtri forti per nascondere un cablaggio rumoroso:** si riduce la precisione senza eliminare la causa.
- **Abilitare tutti i `USE_*_PLUG`:** si riservano pin non utilizzati o destinati ad altro.
- **Eseguire Z homing con probe fuori dal piatto:** il probe non trova una superficie.
- **Usare la stessa scala di sensibilita per tutti i TMC:** TMC2209 e altre famiglie hanno verso opposto.
- **Tarare Sensorless Homing a macchina fredda soltanto:** il trigger puo cambiare durante l'uso.
- **Ridurre troppo la corrente di homing:** StallGuard e la coppia diventano instabili.
- **Tenere il bump meccanico nel sensorless:** il secondo urto puo produrre risultati incoerenti.
- **Considerare il sensorless una protezione anticollisione generale:** la funzione descritta serve al riferimento durante l'homing.

## Checklist

- Ogni connettore abilitato e realmente usato.
- Pinout e tensioni verificati sullo schema.
- Tutti gli endstop sono `open` a riposo e `TRIGGERED` quando azionati.
- Nessun ingresso cambia stato insieme a un altro.
- Direzione del motore verificata prima della direzione di homing.
- `HOME_DIR` corrisponde al lato MIN o MAX fisico.
- Feedrate e bump sono compatibili con il sensore.
- Z dispone dello spazio necessario per i movimenti di sicurezza.
- `VALIDATE_HOMING_ENDSTOPS` e attivo.
- I secondi endstop arrestano i rispettivi motori.
- Driver sensorless e StallGuard sono realmente supportati.
- Scala di `*_STALL_SENSITIVITY` interpretata correttamente.
- Corrente, velocita e sensibilita sensorless sono state testate insieme.
- Dopo l'homing i limiti e le coordinate sono stati verificati.

## Fonti

- [Configuration.h 2.1.2.8 - Endstops and Homing](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Homing and StallGuard](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M119 - Endstop States](https://marlinfw.org/docs/gcode/M119.html)
- [G28 - Auto Home](https://marlinfw.org/docs/gcode/G028.html)
- [M914 - TMC Bump Sensitivity](https://marlinfw.org/docs/gcode/M914.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro|Motori direzione e passi per millimetro]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping|Driver stepper corrente e microstepping]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti|Dimensioni del piatto area di lavoro e limiti]]
