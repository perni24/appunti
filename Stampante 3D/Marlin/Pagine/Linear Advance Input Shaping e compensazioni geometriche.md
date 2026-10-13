---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - linear-advance
  - input-shaping
  - skew
  - backlash
aliases:
  - Compensazioni Marlin
  - Linear Advance Marlin
  - Input Shaping Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Velocita accelerazioni Jerk e Junction Deviation]]"
  - "[[Stampante 3D/Marlin/Pagine/Segmentazione curve e precisione dei movimenti]]"
related: []
marlin-version: 2.1.2.8
title: Linear Advance, Input Shaping e compensazioni geometriche
status: non revisionato
---

# Linear Advance, Input Shaping e compensazioni geometriche

## Sintesi

Marlin include compensazioni per fenomeni differenti:

| Funzione | Fenomeno corretto | Parametro principale |
|---|---|---|
| Linear Advance | pressione nel percorso di estrusione | fattore K |
| Input Shaping | risonanza degli assi | frequenza e damping |
| Skew Correction | assi non perfettamente ortogonali | fattori XY, XZ, YZ |
| Backlash Compensation | gioco al cambio di direzione | distanza e percentuale |

Questi strumenti intervengono sul comando dei motori. Non riparano parti lente, cinghie allentate, ruote eccentriche, guide piegate o un telaio fuori squadra. La correzione firmware va applicata soltanto dopo aver ridotto le cause meccaniche.

## Quando usarlo

Le compensazioni sono utili quando:

- gli angoli estrusi si gonfiano per variazioni di pressione;
- il ringing rimane dopo la taratura di velocita e accelerazione;
- un quadrato ha diagonali diverse nonostante X e Y abbiano scala corretta;
- un asse mostra un errore ripetibile soltanto dopo l'inversione;
- la macchina deve mantenere precisione a velocita diverse;
- una correzione e misurabile e stabile nel tempo.

Non vanno attivate tutte insieme durante la diagnosi. Ogni funzione deve essere tarata separatamente e confrontata con una condizione di riferimento.

## Prerequisiti comuni

Prima della compensazione verificare:

- steps/mm;
- corrente e modalita dei driver;
- tensione delle cinghie;
- serraggio delle pulegge;
- gioco di ruote, guide, giunti e viti;
- temperatura e portata dell'hotend;
- accelerazioni sostenibili;
- rigidita del telaio;
- precisione dello strumento di misura.

Una compensazione calcolata su una macchina instabile cambia quando la macchina si scalda, si usura o viene rimontata.

## Linear Advance

### Problema fisico

Il filamento, il tubo, la zona fusa e le parti elastiche del percorso di estrusione immagazzinano pressione. Quando la velocita aumenta, serve una portata maggiore e la pressione deve crescere. Quando il movimento rallenta, la pressione residua continua a spingere materiale.

Senza compensazione si possono osservare:

- angoli gonfi;
- inizio linea povero;
- accumulo alla fine dei perimetri;
- larghezza variabile al cambiare della velocita;
- superficie irregolare nei cambi di direzione.

Linear Advance modifica temporaneamente la velocita dell'estrusore per anticipare l'aumento e la riduzione della pressione.

### Versione dell'algoritmo

Il commento di Marlin 2.1.2.8 identifica **Linear Pressure Control v1.5** e usa:

```text
advance in step = K * variazione della velocita E in step/s
```

`K = 0` disabilita la compensazione.

I valori K della versione 1.5 non sono confrontabili con quelli di Linear Advance 1.0. Una configurazione migrata da una versione precedente deve essere ricalibrata.

### Configurazione

In `Configuration_adv.h`:

```cpp
//#define LIN_ADVANCE
```

Con un unico fattore:

```cpp
#define ADVANCE_K 0.22
```

Con `DISTINCT_E_FACTORS`:

```cpp
#define ADVANCE_K { 0.22 }
```

ogni estrusore puo avere il proprio valore.

Il sorgente esprime K come lunghezza di compressione, in millimetri, per 1 mm/s di velocita dell'estrusore. Il valore di esempio `0.22` non e universale: dipende da estrusore, filamento, temperatura, ugello e lunghezza del percorso.

### Regolazione con `M900`

Leggere il fattore attivo:

```gcode
M900
```

Impostare K:

```gcode
M900 K0.18
```

Disabilitare Linear Advance a runtime:

```gcode
M900 K0
```

Nella release 2.1.2.8 il comando accetta fattori K nell'intervallo `0..10`. Un valore ammesso dal parser non e automaticamente adatto all'estrusore.

Con:

```cpp
//#define ADVANCE_K_EXTRA
```

Marlin aggiunge un secondo fattore configurabile tramite il parametro `L` di `M900`. I parametri `S` selezionano lo slot e `T` l'estrusore. Questa funzione e utile quando una macchina alterna due configurazioni note, ma non sostituisce profili materiale ben documentati.

### Interazione con accelerazione ed E Jerk

Se la correzione richiesta supera la velocita ammessa all'estrusore rispetto a E Jerk, il commento della release indica che Marlin riduce l'accelerazione del movimento interessato.

```cpp
//#define ALLOW_LOW_EJERK
```

consente un `DEFAULT_EJERK` inferiore a 10 ed e raccomandato dal sorgente per hotend direct drive. Va valutato insieme alla nota sui limiti dinamici.

Un K eccessivo puo causare:

- estrusore che scatta;
- perdita di passi E;
- sovracompensazione agli angoli;
- rallentamenti dovuti ai limiti dell'estrusore;
- variazioni visibili all'inizio delle linee.

```cpp
//#define LA_DEBUG
```

stampa informazioni di debug sulla seriale. Il sorgente raccomanda di disabilitarlo nell'uso normale.

### Procedura di taratura

1. Calibrare E-step e flow di base.
2. Stabilire temperatura, ugello, filamento e altezza layer.
3. Usare accelerazioni ripetibili e sostenibili.
4. Disabilitare algoritmi dello slicer che modificano la pressione in modo concorrente.
5. Partire da `K0`.
6. Stampare un pattern con tratti a velocita differenti.
7. Aumentare K in incrementi piccoli.
8. Cercare larghezza uniforme e angoli puliti.
9. Scartare valori che producono sottoestrusione o scatti.
10. Ripetere con una stampa reale.
11. Registrare K nel profilo materiale oppure salvarlo in EEPROM se appropriato.

Il fattore va ricalibrato dopo modifiche significative al percorso del filamento, al tipo di estrusore, all'ugello o al materiale.

## Input Shaping

### Problema fisico

Quando il movimento accelera o cambia direzione, telaio, cinghie, piatto e testina possono oscillare alla propria frequenza naturale. Il difetto appare come onde ripetute dopo un angolo o una variazione brusca.

Input Shaping modifica la sequenza temporale del comando in modo da ridurre l'eccitazione della risonanza dominante.

Non corregge:

- giochi meccanici;
- layer shift;
- estrusione irregolare;
- ruote danneggiate;
- accelerazioni oltre la coppia disponibile;
- telaio non serrato.

### Stato nella release

Marlin 2.1.2.8 definisce Input Shaping come **sperimentale** e lo offre per X e Y:

```cpp
//#define INPUT_SHAPING_X
//#define INPUT_SHAPING_Y
```

I valori predefiniti associati sono:

```cpp
#define SHAPING_FREQ_X 40.0
#define SHAPING_ZETA_X  0.15

#define SHAPING_FREQ_Y 40.0
#define SHAPING_ZETA_Y  0.15
```

- `SHAPING_FREQ_*`: frequenza dominante in hertz;
- `SHAPING_ZETA_*`: rapporto di smorzamento tra 0 e 1.

Il valore 40 Hz e soltanto un default. Non identifica automaticamente la risonanza della macchina.

### Tipi indicati da `M593`

Il commento della release elenca la mappa:

```text
T0 = ZV
T1 = EI
T2 = 2H EI, indicato come non ancora implementato
```

Poiche la funzione e sperimentale, la disponibilita va verificata sulla build 2.1.2.8 effettiva e non dedotta dalla documentazione di versioni successive.

### Regolazione runtime

Leggere i valori:

```gcode
M593
```

Impostare la frequenza X:

```gcode
M593 X F38.5
```

Impostare la frequenza Y:

```gcode
M593 Y F42.0
```

Impostare damping e frequenza per X:

```gcode
M593 X D0.15 F38.5
```

Disabilitare lo shaping tramite frequenza zero:

```gcode
M593 F0
```

Se X e Y non sono specificati, il commento della release applica frequenza e damping agli assi abilitati.

### Uso della memoria

Input Shaping usa SRAM per il buffer degli step. La dimensione dipende da:

- `SHAPING_FREQ_X` e `SHAPING_FREQ_Y`;
- `DEFAULT_AXIS_STEPS_PER_UNIT`;
- velocita massime;
- `ADAPTIVE_STEP_SMOOTHING`.

Le opzioni:

```cpp
//#define SHAPING_MIN_FREQ 20.0
//#define SHAPING_MAX_STEPRATE 10000
```

permettono di influenzare il calcolo della memoria. Frequenze piu alte e velocita inferiori riducono il buffer richiesto. Un buffer troppo piccolo riduce l'efficacia alle alte velocita.

```cpp
//#define SHAPING_MENU
```

aggiunge la regolazione al menu LCD.

### Taratura della frequenza

Metodo con ringing tower:

1. Verificare accelerazioni e meccanica senza shaping.
2. Stampare una torre a velocita e accelerazione sufficienti a mostrare il ringing.
3. Variare la frequenza con `M593` a intervalli noti lungo Z.
4. Individuare la zona con oscillazioni minori.
5. Calcolare la frequenza corrispondente.
6. Ripetere separatamente per X e Y.
7. Provare il valore su una geometria reale.
8. Controllare che non compaiano smoothing o perdita di dettagli indesiderati.

Su CoreXY un modello orientato a 45 gradi puo aiutare a separare le componenti A e B dei motori, ma i valori configurati restano associati agli assi previsti dalla funzione. La procedura deve essere coerente con la cinematica.

### Input Shaping e S-curve

`S_CURVE_ACCELERATION` rende piu graduale la variazione dell'accelerazione. Input Shaping applica invece un filtro progettato rispetto a una frequenza di risonanza.

Sono meccanismi differenti. Attivarli contemporaneamente cambia il risultato della taratura; conviene misurare prima ciascuno separatamente.

## Skew Correction

### Problema geometrico

Se X e Y hanno steps/mm corretti ma non sono ortogonali, un quadrato puo avere lati della lunghezza giusta e diagonali differenti. Aumentare o ridurre gli steps/mm non corregge l'angolo.

Marlin offre:

```cpp
//#define SKEW_CORRECTION
```

Per XY si possono inserire le misure:

```cpp
#define XY_DIAG_AC 282.8427124746
#define XY_DIAG_BD 282.8427124746
#define XY_SIDE_AD 200
```

oppure il fattore calcolato:

```cpp
//#define XY_SKEW_FACTOR 0.0
```

Marlin ricava il fattore dalle due diagonali e dal lato AD.

### Misurazione

Stampare un oggetto abbastanza grande e misurare:

1. diagonale A-C;
2. diagonale B-D;
3. lato A-D.

Ripetere le misure piu volte, alla stessa temperatura e senza deformare il pezzo con il calibro. Una differenza dovuta a warping o ritiro del materiale non rappresenta necessariamente lo skew della macchina.

Il commento della release fornisce:

```text
AB = sqrt(2*AC^2 + 2*BD^2 - 4*AD^2) / 2
```

e quindi:

```text
XY_SKEW_FACTOR =
  tan(pi/2 - acos((AC^2 - AB^2 - AD^2) / (2*AB*AD)))
```

Usare direttamente le misure nel file riduce il rischio di errori manuali nel calcolo.

### Correzione anche su Z

```cpp
//#define SKEW_CORRECTION_FOR_Z
```

abilita:

```cpp
#define XZ_DIAG_AC 282.8427124746
#define XZ_DIAG_BD 282.8427124746
#define YZ_DIAG_AC 282.8427124746
#define YZ_DIAG_BD 282.8427124746
#define YZ_SIDE_AD 200
```

oppure:

```cpp
//#define XZ_SKEW_FACTOR 0.0
//#define YZ_SKEW_FACTOR 0.0
```

Prima di compensare XZ o YZ bisogna verificare che gantry, guide e piano siano fisicamente in squadra e non cambino con l'altezza.

### Regolazione con `M852`

Per abilitarla:

```cpp
//#define SKEW_CORRECTION_GCODE
```

Leggere i fattori:

```gcode
M852
```

Impostare il fattore XY:

```gcode
M852 I0.01
```

Se e abilitata soltanto la correzione XY, `S` e un alias di `I`:

```gcode
M852 S0.01
```

Con correzione Z, `J` imposta XZ e `K` imposta YZ. I fattori ammessi dalla documentazione sono compresi tra `-1` e `1`, ma valori grandi indicano normalmente una meccanica da correggere.

## Backlash Compensation

### Problema meccanico

Il backlash e la corsa del motore necessaria, dopo un'inversione, prima che l'asse riprenda a spostare l'organo comandato. Puo derivare da:

- gioco tra vite e chiocciola;
- cinghia o puleggia lenta;
- giunti;
- ingranaggi;
- ruote e guide;
- flessione sotto carico.

Marlin aggiunge movimento quando cambia il verso:

```cpp
//#define BACKLASH_COMPENSATION
```

I parametri base sono:

```cpp
#define BACKLASH_DISTANCE_MM { 0, 0, 0 }
#define BACKLASH_CORRECTION 0.0
```

- `BACKLASH_DISTANCE_MM`: gioco misurato per X, Y e Z;
- `BACKLASH_CORRECTION`: quota applicata, da 0.0 a 1.0.

Per cinematiche Core:

```cpp
//#define CORE_BACKLASH
```

aggiunge step in corrispondenza dei cambi di direzione dei motori trasformati.

### Smoothing

```cpp
//#define BACKLASH_SMOOTHING_MM 3
```

distribuisce la correzione su piu segmenti. Riduce i segni superficiali provocati da una correzione istantanea, ma sacrifica parte della precisione dimensionale ed e costoso in memoria e calcolo.

### Regolazione con `M425`

```cpp
//#define BACKLASH_GCODE
```

abilita il comando e il menu.

Leggere i valori:

```gcode
M425
```

Impostare le distanze:

```gcode
M425 X0.10 Y0.05 Z0.02
```

Applicare il 100%:

```gcode
M425 F1
```

Applicare il 50%:

```gcode
M425 F0.5
```

Distribuire la correzione su 3 mm:

```gcode
M425 S3
```

La percentuale parziale e utile per evitare sovracompensazione, ma il valore finale va verificato con misure in entrambe le direzioni.

### Misurazione durante probing

Con:

```cpp
#define MEASURE_BACKLASH_WHEN_PROBING
```

Marlin puo misurare il backlash Z durante `G29`. Le impostazioni sono:

```cpp
#define BACKLASH_MEASUREMENT_LIMIT      0.5
#define BACKLASH_MEASUREMENT_RESOLUTION 0.005
#define BACKLASH_MEASUREMENT_FEEDRATE   Z_PROBE_FEEDRATE_SLOW
```

La misura non deve essere confusa con l'abilitazione della correzione. Il valore misurato puo essere caricato con:

```gcode
M425 Z
```

### Calibrazione automatica `G425`

```cpp
//#define CALIBRATION_GCODE
```

abilita una procedura separata che usa un cubo, bullone o rondella conduttiva fissata al piatto. Il probe tocca superficie e lati per misurare backlash, posizione e offset degli hotend.

La configurazione richiede posizione e dimensioni reali dell'oggetto:

```cpp
#define CALIBRATION_OBJECT_CENTER     { 264.0, -22.0, -2.0 }
#define CALIBRATION_OBJECT_DIMENSIONS { 10.0, 10.0, 10.0 }
```

Il commento della release richiede valori iniziali dell'offset hotend e del centro oggetto entro circa 5 mm da quelli reali. Copiare i valori di esempio puo provocare una collisione.

Eseguire la calibrazione:

```gcode
G425
```

La procedura carica le misure ma non abilita automaticamente la compensazione. Va poi scelta la quota con `M425 F...`.

## Ordine di taratura consigliato

1. Correggere meccanicamente telaio, cinghie, guide e giochi.
2. Calibrare steps/mm e geometria di base.
3. Tarare velocita e accelerazioni.
4. Tarare Linear Advance con materiale e hotend definiti.
5. Misurare le risonanze e tarare Input Shaping.
6. Misurare lo skew su un oggetto grande.
7. Applicare Skew Correction soltanto all'errore residuo stabile.
8. Misurare backlash in entrambe le direzioni.
9. Applicare una correzione prudente e verificare i segni superficiali.
10. Ripetere un test dimensionale completo con tutte le funzioni attive.

## Persistenza

I valori runtime di `M900`, `M593`, `M852` e `M425` possono essere salvabili in EEPROM quando la funzione e la build lo prevedono.

Controllare le impostazioni:

```gcode
M503
```

Salvare:

```gcode
M500
```

Dopo una modifica dei valori compilati, usare `M502` seguito da `M500` se si vuole sostituire la configurazione EEPROM. Conservare sempre una copia dei valori precedenti.

## Errori comuni

- **Abilitare compensazioni prima della manutenzione:** i valori diventano instabili.
- **Usare K di Linear Advance 1.0 sulla versione 1.5:** la scala e differente.
- **Copiare K da un'altra stampante:** percorso del filamento e materiale cambiano la risposta.
- **Tarare Linear Advance con flow o temperatura errati:** si compensa il problema sbagliato.
- **Scegliere 40 Hz perche e il default:** la frequenza deve essere misurata.
- **Confondere Input Shaping e S-curve:** filtrano aspetti dinamici differenti.
- **Aumentare troppo lo shaping buffer:** la RAM puo non essere sufficiente.
- **Correggere skew modificando gli steps/mm:** la scala non modifica l'ortogonalita.
- **Misurare skew su un pezzo deformato:** il fattore contiene ritiro e warping.
- **Compensare molto backlash senza smoothing:** possono comparire segni ai cambi di verso.
- **Usare smoothing per ottenere precisione massima:** distribuisce la correzione e introduce un compromesso.
- **Copiare le coordinate di esempio di `G425`:** il probe puo cercare un oggetto inesistente.

## Checklist

- La causa fisica di ogni difetto e stata identificata.
- La meccanica e stabile e serrata.
- Linear Advance usa valori v1.5 ricalibrati.
- K e documentato per materiale e percorso del filamento.
- Frequenze X e Y sono state misurate separatamente.
- La build dispone di SRAM sufficiente per Input Shaping.
- Le opzioni sperimentali sono state provate su una copia della configurazione.
- Skew e stato misurato piu volte su un oggetto non deformato.
- Backlash e stato misurato in entrambe le direzioni.
- L'eventuale oggetto `G425` e raggiungibile e configurato con misure reali.
- Ogni compensazione e stata verificata isolatamente.
- Il risultato completo e stato controllato con una stampa dimensionale.

## Fonti

- [Configuration.h 2.1.2.8 - Skew Correction](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Input Shaping, Backlash and Linear Advance](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Linear Advance - Marlin](https://marlinfw.org/docs/features/lin_advance.html)
- [M900 - Linear Advance Factor](https://marlinfw.org/docs/gcode/M900.html)
- [M593 - Input Shaping](https://marlinfw.org/docs/gcode/M593.html)
- [M852 - Bed Skew Compensation](https://marlinfw.org/docs/gcode/M852.html)
- [M425 - Backlash Compensation](https://marlinfw.org/docs/gcode/M425.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Velocita accelerazioni Jerk e Junction Deviation|Velocita accelerazioni Jerk e Junction Deviation]]
- [[Stampante 3D/Marlin/Pagine/Segmentazione curve e precisione dei movimenti|Segmentazione curve e precisione dei movimenti]]
- [[Stampante 3D/Marlin/Pagine/Babystepping e regolazioni dinamiche|Babystepping e regolazioni dinamiche]]
