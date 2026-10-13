---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: intermedio
tags:
  - marlin
  - motori-stepper
  - steps-per-mm
  - calibrazione
aliases:
  - Passi per millimetro Marlin
  - Direzione motori Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Tipo di stampante e cinematica]]"
  - "[[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]"
related: []
marlin-version: 2.1.2.8
title: Motori, direzione e passi per millimetro
status: non revisionato
---

# Motori, direzione e passi per millimetro

## Sintesi

Marlin controlla ogni motore stepper generando impulsi sul pin `STEP`, impostando il verso sul pin `DIR` e abilitando il driver tramite `ENABLE`. Per trasformare una distanza richiesta in impulsi deve conoscere quanti step corrispondono a un millimetro, oppure a un grado per gli assi rotativi.

La configurazione corretta richiede tre verifiche separate:

1. il motore deve muoversi nel verso coerente con le coordinate;
2. il rapporto `steps/mm` deve derivare dalla meccanica e dal microstepping reale;
3. il firmware deve mantenere alimentati i motori quando la posizione non puo essere persa.

## Quando usarlo

Queste impostazioni vanno controllate:

- alla prima configurazione della macchina;
- dopo la sostituzione di motore, puleggia, vite o riduttore;
- quando cambia il microstepping del driver;
- quando un asse si muove nella direzione opposta;
- quando la distanza reale non coincide con quella comandata;
- quando un asse perde la posizione dopo un periodo di inattivita;
- quando vengono aggiunti motori secondari X2, Y2, Z2, Z3 o Z4.

## Catena del movimento

Un comando di movimento viene trasformato secondo questa catena:

```text
distanza richiesta
  -> cinematica
  -> steps per unita
  -> numero di impulsi STEP
  -> driver
  -> microstep del motore
  -> trasmissione meccanica
  -> spostamento reale
```

Un valore errato di `steps/mm` produce un errore proporzionale su tutta la corsa. Giochi, elasticita, slittamenti e perdita di passi producono invece errori meccanici che non vanno corretti alterando arbitrariamente gli step.

## `DEFAULT_AXIS_STEPS_PER_UNIT`

Nel `Configuration.h` della release 2.1.2.8:

```cpp
#define DEFAULT_AXIS_STEPS_PER_UNIT { 80, 80, 400, 500 }
```

L'ordine predefinito e:

```text
X, Y, Z, eventuali assi aggiuntivi, E0, eventuali estrusori aggiuntivi
```

Per gli assi lineari l'unita e `steps/mm`; per quelli dichiarati rotativi e `steps/grado`.

Con:

```cpp
//#define DISTINCT_E_FACTORS
```

ogni estrusore puo avere fattori distinti. Se nell'array sono presenti meno valori rispetto agli estrusori, l'ultimo valore viene applicato ai rimanenti.

I valori compilati sono impostazioni iniziali. Se la EEPROM contiene valori salvati, questi possono sostituirli all'avvio.

## Calcolo per cinghia e puleggia

Per un asse a cinghia:

```text
steps/mm =
  (step completi per giro * microstep)
  / (denti puleggia * passo cinghia in mm)
```

Esempio con:

- motore da 200 step/giro, cioe 1,8 gradi per step;
- microstepping 16;
- puleggia da 20 denti;
- cinghia con passo 2 mm.

```text
steps/mm = (200 * 16) / (20 * 2) = 80
```

Il numero di denti va contato sulla puleggia motrice. Il diametro esterno della puleggia non sostituisce il diametro primitivo determinato da denti e passo.

## Calcolo per vite

Per un asse azionato direttamente da una vite:

```text
steps/mm =
  (step completi per giro * microstep)
  / avanzamento della vite per giro
```

Con un motore da 200 step/giro, microstepping 16 e vite con lead di 8 mm:

```text
steps/mm = (200 * 16) / 8 = 400
```

Il **lead** e l'avanzamento lineare per giro. Non va confuso con il **pitch**, cioe la distanza tra due filetti consecutivi. In una vite a piu principi:

```text
lead = pitch * numero di principi
```

Usare il pitch al posto del lead e una causa frequente di errori moltiplicativi.

## Riduzioni e assi rotativi

Con una riduzione:

```text
steps/unita =
  (step completi per giro * microstep * rapporto di riduzione)
  / unita prodotte da un giro dell'uscita
```

Un rapporto 3:1 indica che il motore compie tre giri per un giro dell'uscita.

Per un asse rotativo senza riduzione:

```text
steps/grado = (step completi per giro * microstep) / 360
```

Il valore deve restare coerente con `AXISn_ROTATES` e con l'unita in gradi usata da Marlin.

## Estrusore

Per un estrusore a ruota dentata:

```text
steps/mm teorici =
  (step completi per giro * microstep * rapporto di riduzione)
  / circonferenza efficace della ruota
```

La circonferenza efficace puo differire da quella geometrica per la penetrazione dei denti nel filamento. Il valore teorico e quindi un punto di partenza da verificare misurando il filamento realmente trascinato.

La calibrazione dell'estrusore deve avvenire:

- con percorso del filamento libero e ripetibile;
- senza una contropressione dell'ugello che provochi slittamento;
- rispettando la protezione contro l'estrusione a freddo;
- prima di correggere il flow nello slicer.

Gli E-step descrivono il trasporto meccanico. Il flow compensa invece il volume estruso durante la stampa: non sono la stessa taratura.

## Modifica e verifica con `M92`

Per leggere i valori correnti:

```gcode
M92
```

Per impostare temporaneamente un valore:

```gcode
M92 X80.00
```

Per modificare l'estrusore:

```gcode
M92 E415.00
```

Una correzione basata su una misura puo essere calcolata con:

```text
nuovo valore =
  valore attuale * distanza comandata / distanza misurata
```

Esempio:

```text
valore attuale = 80
distanza comandata = 100 mm
distanza misurata = 99.5 mm

nuovo valore = 80 * 100 / 99.5 = 80.402
```

Prima di applicare la correzione bisogna escludere cinghie lente, pulegge che slittano, perdita di passi e strumenti di misura inadeguati.

Se la EEPROM e abilitata, salvare solo dopo la verifica:

```gcode
M500
```

Per controllare le impostazioni attive:

```gcode
M503
```

`M502` ripristina i valori compilati, ma non li rende persistenti finche non viene eseguito `M500`.

## Direzione degli assi

Le direttive principali sono:

```cpp
#define INVERT_X_DIR false
#define INVERT_Y_DIR true
#define INVERT_Z_DIR false
```

Sono disponibili anche `INVERT_I_DIR` fino a `INVERT_W_DIR` e `INVERT_E0_DIR` fino a `INVERT_E7_DIR`.

Il significato di `true` o `false` non e universale: dipende dal cablaggio delle bobine, dall'orientamento del motore, dal driver e dalla scheda. Il criterio corretto e il risultato:

- un movimento X positivo deve aumentare la coordinata X;
- un movimento Y positivo deve aumentare la coordinata Y;
- un movimento Z positivo deve aumentare la distanza tra ugello e piatto secondo il sistema della macchina;
- l'estrusione positiva deve spingere il filamento verso l'hotend.

La direzione va verificata prima dell'homing. Un asse invertito puo allontanarsi dal finecorsa e urtare il limite opposto.

Su CoreXY e varianti, due motori concorrono allo stesso movimento cartesiano. Se il comportamento e incrociato, bisogna prima verificare di aver scelto la cinematica corretta; invertire valori a tentativi puo nascondere un errore di configurazione.

> Non collegare o scollegare un motore stepper mentre il driver e alimentato. Le tensioni indotte possono danneggiare il driver o la scheda.

## Segnale di abilitazione

La release definisce:

```cpp
#define X_ENABLE_ON 0
#define Y_ENABLE_ON 0
#define Z_ENABLE_ON 0
#define E_ENABLE_ON 0
```

`0` indica un segnale di enable attivo basso, comune a molti driver; `1` indica attivo alto. Non e un'impostazione per invertire il movimento. Un valore errato puo lasciare il motore sempre disabilitato o attivo nel momento sbagliato.

Le opzioni `INVERT_*_STEP_PIN` in `Configuration_adv.h` riguardano la polarita dell'impulso STEP e servono soltanto a hardware che la richiede. Non vanno usate per correggere il verso.

## Disabilitazione e perdita della posizione

In `Configuration.h`:

```cpp
//#define DISABLE_X
//#define DISABLE_Y
//#define DISABLE_Z
//#define DISABLE_E
```

Se abilitate, disattivano immediatamente il relativo motore quando non sta eseguendo step. La macchina non puo sapere se l'asse si sposta mentre il motore e libero.

`Configuration_adv.h` offre invece un timeout:

```cpp
#define DEFAULT_STEPPER_TIMEOUT_SEC 120
#define DISABLE_IDLE_X
#define DISABLE_IDLE_Y
#define DISABLE_IDLE_Z
#define DISABLE_IDLE_E
```

Il timeout puo essere modificato a runtime con `M18` o `M84`. Per assi soggetti alla gravita, in particolare un piatto o un gantry Z, disabilitare il motore puo causare una caduta. In questi casi vanno valutati:

- mantenimento del motore;
- vite non retroazionabile;
- freno meccanico;
- contrappeso;
- obbligo di ripetere l'homing dopo la disattivazione.

Le opzioni:

```cpp
//#define NO_MOTION_BEFORE_HOMING
//#define HOME_AFTER_DEACTIVATE
```

impediscono movimenti senza una posizione conosciuta e richiedono nuovamente l'homing dopo la disattivazione. Sono utili quando una perdita di riferimento avrebbe conseguenze meccaniche.

## Motori multipli sullo stesso asse

La presenza di `X2_DRIVER_TYPE`, `Y2_DRIVER_TYPE`, `Z2_DRIVER_TYPE`, `Z3_DRIVER_TYPE` o `Z4_DRIVER_TYPE` assegna driver indipendenti a motori che lavorano sullo stesso asse.

Se un secondo motore e montato specularmente puo richiedere:

```cpp
//#define INVERT_X2_VS_X_DIR
//#define INVERT_Y2_VS_Y_DIR
//#define INVERT_Z2_VS_Z_DIR
```

Queste opzioni invertono il secondo motore rispetto al primo. Non sostituiscono `INVERT_X_DIR`, `INVERT_Y_DIR` o `INVERT_Z_DIR`, che definiscono il verso complessivo dell'asse.

Con due motori collegati allo stesso driver non esiste controllo indipendente da firmware. Corrente disponibile, collegamento serie/parallelo e limiti del driver devono essere valutati elettricamente.

## Procedura di configurazione

1. Togliere cinghie o lasciare spazio sufficiente per arrestare manualmente il test.
2. Verificare tipo di motore, angolo per step, trasmissione e microstepping fisico.
3. Calcolare il valore teorico.
4. Inserire `DEFAULT_AXIS_STEPS_PER_UNIT`.
5. Accendere senza eseguire l'homing.
6. Portare manualmente gli assi lontano dai limiti.
7. Comandare un movimento positivo molto breve.
8. Correggere soltanto le direttive `INVERT_*_DIR` necessarie.
9. Misurare una corsa ampia e ripetibile.
10. Correggere gli step soltanto se l'errore e proporzionale e non meccanico.
11. Ripetere la misura in entrambe le direzioni.
12. Salvare in EEPROM solo il valore verificato.

## Errori comuni

- **Copiare gli step da un'altra stampante:** puleggia, vite, microstepping o riduzione possono essere differenti.
- **Confondere pitch e lead della vite:** l'asse percorre un multiplo errato della distanza.
- **Cambiare microstepping senza aggiornare gli step:** la scala del movimento cambia.
- **Correggere backlash con `M92`:** migliora una misura in una direzione ma peggiora l'altra.
- **Tarare dopo una perdita di passi:** il risultato non descrive la trasmissione.
- **Dimenticare la EEPROM:** il valore salvato continua a prevalere su quello ricompilato.
- **Invertire il connettore a firmware acceso:** si rischia di danneggiare il driver.
- **Eseguire subito `G28`:** un verso errato puo portare a una collisione.
- **Disabilitare Z inattivo senza valutarne la gravita:** ugello o piatto possono cadere.
- **Confondere E-step e flow:** si compensano problemi differenti.

## Checklist

- Step completi per giro verificati dal datasheet del motore.
- Microstepping reale verificato su jumper, pin o configurazione del driver.
- Denti, passo cinghia, lead e rapporti misurati correttamente.
- Ordine dell'array coerente con gli assi e gli estrusori abilitati.
- Direzione testata con movimenti brevi prima dell'homing.
- Nessuna puleggia slitta sull'albero.
- I motori multipli girano in versi meccanicamente concordi.
- Il timeout non lascia cadere assi soggetti alla gravita.
- Valori runtime e valori compilati sono stati confrontati con `M503`.
- Le modifiche definitive sono state salvate solo dopo il test.

## Fonti

- [Configuration.h 2.1.2.8 - Movement Settings](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Stepper Settings](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M92 - Set Axis Steps-per-unit](https://marlinfw.org/docs/gcode/M092.html)
- [M18 e M84 - Disable Steppers](https://marlinfw.org/docs/gcode/M018.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Tipo di stampante e cinematica|Tipo di stampante e cinematica]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti|Dimensioni del piatto area di lavoro e limiti]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping|Driver stepper corrente e microstepping]]
- [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing|Endstop homing e Sensorless Homing]]
