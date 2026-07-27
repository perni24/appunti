---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note

publish: true
difficulty: intermedio
tags: [marlin, geometria, piatto, limiti-software]
aliases: [Area di lavoro Marlin, Limiti degli assi Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Tipo di stampante e cinematica]]"
related: []
marlin-version: "2.1.2.8"
---

# Dimensioni del piatto, area di lavoro e limiti

## Sintesi

Marlin distingue dimensione stampabile, corsa degli assi, origine delle coordinate e posizione di homing. Queste grandezze coincidono soltanto nelle macchine piu semplici.

Una testina puo, per esempio, muoversi alcuni millimetri fuori dal piatto per raggiungere un finecorsa, pulire l'ugello o parcheggiarsi. In quel caso la corsa meccanica e maggiore dell'area stampabile.

## Quando usarlo

Queste impostazioni vanno definite:

- dopo aver scelto la cinematica;
- durante la prima configurazione della meccanica;
- quando si cambia piatto o posizione dei finecorsa;
- quando l'ugello non raggiunge un bordo del piano;
- quando lo slicer centra male il modello;
- quando Marlin limita un movimento che sembra fisicamente possibile;
- quando una posizione G-code porta fuori dal piatto.

## Modello mentale

Separare cinque concetti:

1. **dimensione fisica del piatto:** misura reale della superficie;
2. **area stampabile:** zona che ugello e macchina possono usare in sicurezza;
3. **corsa meccanica:** intervallo raggiungibile dagli assi;
4. **origine macchina:** coordinate assegnate dopo l'homing;
5. **offset runtime:** traslazioni applicate allo spazio delle coordinate.

Il firmware deve descrivere l'area sicura, non la misura commerciale dichiarata dal produttore.

## Dimensione stampabile

Nel `Configuration.h` predefinito:

```cpp
#define X_BED_SIZE 200
#define Y_BED_SIZE 200
```

I valori sono espressi in millimetri e descrivono la dimensione stampabile rettangolare usata da diverse funzioni.

Non devono essere impostati automaticamente uguali alla corsa massima:

```text
corsa X = X_MAX_POS - X_MIN_POS
```

Una macchina puo avere:

```text
corsa X > X_BED_SIZE
```

perche l'ugello si sposta oltre il bordo del piatto.

## Limiti di corsa

```cpp
#define X_MIN_POS 0
#define Y_MIN_POS 0
#define Z_MIN_POS 0
#define X_MAX_POS X_BED_SIZE
#define Y_MAX_POS Y_BED_SIZE
#define Z_MAX_POS 200
```

I commenti della release definiscono questi valori come limiti dopo l'homing, corrispondenti alle posizioni dei finecorsa.

- `*_MIN_POS`: coordinata minima raggiungibile;
- `*_MAX_POS`: coordinata massima raggiungibile;
- gli assi lineari usano millimetri;
- gli assi rotativi usano gradi.

I valori possono essere espressioni:

```cpp
#define X_MAX_POS X_BED_SIZE
```

In questo caso cambiare `X_BED_SIZE` modifica anche `X_MAX_POS`.

## Coordinate negative

Una coordinata minima negativa e valida quando la meccanica permette all'ugello di oltrepassare lo zero del piatto.

Esempio:

```cpp
#define X_BED_SIZE 220
#define Y_BED_SIZE 220

#define X_MIN_POS -5
#define Y_MIN_POS -10
#define Z_MIN_POS 0

#define X_MAX_POS 230
#define Y_MAX_POS 225
#define Z_MAX_POS 250
```

Questa configurazione descrive:

- area stampabile nominale di `220 x 220 mm`;
- corsa X da `-5` a `230`;
- corsa Y da `-10` a `225`;
- corsa Z da `0` a `250`.

Non dimostra che ogni punto sia realmente sicuro: cavi, clip, probe e geometria del carrello possono ridurre l'area utilizzabile.

## Origine al centro del piatto

```cpp
//#define BED_CENTER_AT_0_0
```

sposta il modello delle coordinate in modo che il centro del piatto sia:

```text
X = 0
Y = 0
```

E utile per alcune cinematiche e flussi di lavoro, ma richiede che slicer, procedure di homing, probe e coordinate accessorie usino la stessa convenzione.

Senza questa opzione, una cartesiana tipica usa l'angolo anteriore sinistro del piano come riferimento dell'area stampabile.

## Posizione di home calcolata

Marlin determina normalmente la coordinata di home usando:

- direzione di homing;
- limite minimo o massimo;
- cinematica;
- geometria derivata.

Le direttive:

```cpp
//#define MANUAL_X_HOME_POS 0
//#define MANUAL_Y_HOME_POS 0
//#define MANUAL_Z_HOME_POS 0
```

permettono di sovrascrivere il calcolo.

Sono disponibili anche:

```cpp
//#define MANUAL_I_HOME_POS 0
//#define MANUAL_J_HOME_POS 0
//#define MANUAL_K_HOME_POS 0
//#define MANUAL_U_HOME_POS 0
//#define MANUAL_V_HOME_POS 0
//#define MANUAL_W_HOME_POS 0
```

Se il valore automatico e corretto, gli override devono restare disabilitati. Un valore manuale errato rende falsa la posizione assegnata dopo il contatto con il finecorsa.

Per una Delta, il commento ufficiale definisce la posizione manuale di home come il centro superiore del volume cartesiano.

## Assi aggiuntivi

Marlin 2.1.2.8 prevede limiti per I, J, K, U, V e W:

```cpp
//#define I_MIN_POS 0
//#define I_MAX_POS 50
```

Lo stesso schema si applica agli altri assi.

La release consente di dichiarare alcuni assi come rotativi. In quel caso minimi e massimi sono angoli in gradi, non distanze in millimetri.

## Limiti software minimi

```cpp
#define MIN_SOFTWARE_ENDSTOPS
```

abilita il gruppo dei limiti minimi.

```cpp
#define MIN_SOFTWARE_ENDSTOP_X
#define MIN_SOFTWARE_ENDSTOP_Y
#define MIN_SOFTWARE_ENDSTOP_Z
#define MIN_SOFTWARE_ENDSTOP_I
#define MIN_SOFTWARE_ENDSTOP_J
#define MIN_SOFTWARE_ENDSTOP_K
#define MIN_SOFTWARE_ENDSTOP_U
#define MIN_SOFTWARE_ENDSTOP_V
#define MIN_SOFTWARE_ENDSTOP_W
```

Ogni direttiva applica il limite minimo al relativo asse.

## Limiti software massimi

```cpp
#define MAX_SOFTWARE_ENDSTOPS
```

abilita il gruppo dei limiti massimi.

```cpp
#define MAX_SOFTWARE_ENDSTOP_X
#define MAX_SOFTWARE_ENDSTOP_Y
#define MAX_SOFTWARE_ENDSTOP_Z
#define MAX_SOFTWARE_ENDSTOP_I
#define MAX_SOFTWARE_ENDSTOP_J
#define MAX_SOFTWARE_ENDSTOP_K
#define MAX_SOFTWARE_ENDSTOP_U
#define MAX_SOFTWARE_ENDSTOP_V
#define MAX_SOFTWARE_ENDSTOP_W
```

Ogni direttiva applica il limite massimo al relativo asse.

Il commento della release specifica che i limiti software X e Y si applicano ai robot cartesiani. Le cinematiche non cartesiane applicano vincoli derivati dalla propria geometria.

## Controllo con `M211`

Per leggere lo stato:

```gcode
M211
```

Per abilitare i limiti software:

```gcode
M211 S1
```

Per disabilitarli temporaneamente:

```gcode
M211 S0
```

Con i limiti attivi, Marlin tronca i movimenti ai confini configurati.

Disabilitare `M211` puo essere utile durante una procedura controllata di calibrazione, ma rimuove una barriera software contro le collisioni. Va riabilitato subito dopo.

## Voce nel menu

```cpp
//#define SOFT_ENDSTOPS_MENU_ITEM
```

aggiunge all'interfaccia la possibilita di abilitare o disabilitare i limiti software.

Su una macchina destinata a utenti non tecnici, questa voce puo rendere troppo facile rimuovere una protezione. La sua presenza va valutata in base all'uso reale.

## Limiti compilati e offset runtime

I limiti `*_MIN_POS` e `*_MAX_POS` descrivono la geometria nativa. Altri comandi possono spostare lo spazio delle coordinate:

- `M206`: imposta offset persistenti rispetto alla home nativa;
- `M428`: usa la posizione corrente per calcolare gli offset di home;
- `G92`: modifica temporaneamente la posizione logica;
- sistemi di workspace CNC: aggiungono ulteriori sistemi di coordinate.

Esempio:

```gcode
M206 X-2 Y3
```

applica offset persistenti alla home nativa. Se la EEPROM e attiva, si salvano con:

```gcode
M500
```

Gli offset non correggono una dimensione meccanica sbagliata. Prima vanno configurati area, home e limiti reali; gli offset servono per regolazioni intenzionali dello spazio di lavoro.

`M206` non e disponibile sulle Delta; per la geometria Delta si usa `M665`. `M428` consente invece di modificare soltanto l'offset Z su una Delta.

## Posizione riportata

```gcode
M114
```

riporta la posizione corrente del tool e i conteggi degli stepper.

Normalmente il comando mostra la posizione proiettata, cioe l'ultima destinazione richiesta al planner. Durante un movimento puo quindi essere avanti rispetto alla posizione fisica istantanea.

Le opzioni avanzate:

```cpp
//#define M114_DETAIL
//#define M114_REALTIME
```

aggiungono report utili alla diagnostica.

## Report della geometria

`Configuration_adv.h` abilita per impostazione predefinita:

```cpp
#define EXTENDED_CAPABILITIES_REPORT
```

Nel relativo blocco si puo attivare:

```cpp
//#define M115_GEOMETRY_REPORT
```

Con questa opzione `M115` include informazioni dettagliate sui limiti completi e sull'area di lavoro. E utile per host e diagnostica, ma il report riflette la configurazione: non misura fisicamente la macchina.

## Delta e aree circolari

Per una Delta i principali limiti radiali sono:

```cpp
#define DELTA_PRINTABLE_RADIUS 140.0
#define DELTA_MAX_RADIUS 140.0
```

`DELTA_PRINTABLE_RADIUS` descrive la superficie stampabile sicura. `DELTA_MAX_RADIUS` descrive la massima area raggiungibile.

Non si usano `X_BED_SIZE` e `Y_BED_SIZE` per sostituire questi parametri specializzati senza comprendere le condizioni derivate della cinematica.

## Procedura di misura

1. Identificare la posizione fisica dei finecorsa.
2. Muovere manualmente la meccanica a macchina spenta, se sicuro, per individuare ostacoli e margini.
3. Misurare il piatto reale.
4. Determinare dove si trova l'ugello dopo l'homing.
5. Determinare la corsa massima sicura senza cavi in tensione o collisioni.
6. Impostare `X_BED_SIZE`, `Y_BED_SIZE` e limiti.
7. Compilare e caricare.
8. Verificare lo stato dei finecorsa.
9. Eseguire homing controllato.
10. Provare coordinate vicine ai limiti a bassa velocita.
11. Verificare il centro e i quattro bordi.
12. Allineare lo slicer alla stessa area stampabile.

## Errori comuni

- **Usare la misura commerciale del piatto:** non considera clip, probe e margini.
- **Impostare `X_MAX_POS` uguale alla dimensione del piatto per abitudine:** la corsa puo essere maggiore o minore.
- **Rifiutare coordinate negative:** sono corrette quando l'ugello supera il bordo prima dello zero.
- **Usare offset per nascondere limiti sbagliati:** il modello geometrico resta incoerente.
- **Disabilitare permanentemente `M211`:** aumenta il rischio di collisione.
- **Impostare una home manuale senza motivo:** Marlin assegna una coordinata errata dopo l'homing.
- **Cambiare l'origine senza aggiornare lo slicer:** le stampe risultano spostate.
- **Confondere posizione proiettata e posizione fisica durante `M114`:** il planner puo non aver completato il movimento.
- **Ignorare gli assi rotativi:** limiti in gradi vengono trattati come millimetri.
- **Dichiarare un'area raggiungibile dal solo ugello:** il probe o il carrello possono urtare prima.

## Checklist

- Dimensione fisica, area stampabile e corsa sono state misurate separatamente.
- L'origine scelta coincide con quella dello slicer.
- I minimi e massimi rappresentano posizioni raggiungibili in sicurezza.
- La posizione assegnata dopo l'homing e corretta.
- Gli override `MANUAL_*_HOME_POS` sono usati soltanto se necessari.
- I limiti software minimi e massimi sono attivi sugli assi richiesti.
- `M211` viene lasciato attivo durante l'uso normale.
- I movimenti vicino ai limiti sono stati provati a bassa velocita.
- Cavi, probe, ventole, clip e utensili restano liberi lungo tutta la corsa.
- Lo slicer usa la stessa forma, origine e dimensione dell'area stampabile.

## Fonti

- [Configuration.h 2.1.2.8 - Geometry](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M114 - Get Current Position](https://marlinfw.org/docs/gcode/M114.html)
- [M206 - Set Home Offsets](https://marlinfw.org/docs/gcode/M206.html)
- [M211 - Software Endstops](https://marlinfw.org/docs/gcode/M211.html)
- [M428 - Home Offsets Here](https://marlinfw.org/docs/gcode/M428.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita]]
- [[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin]]
- [[Stampante 3D/Marlin/Pagine/Tipo di stampante e cinematica]]
