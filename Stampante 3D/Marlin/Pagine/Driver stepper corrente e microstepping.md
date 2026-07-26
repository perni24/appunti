---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [marlin, driver-stepper, tmc, corrente, microstepping]
aliases: [Driver stepper Marlin, Corrente TMC Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]"
  - "[[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro]]"
related: []
marlin-version: "2.1.2.8"
---

# Driver stepper, corrente e microstepping

## Sintesi

Il driver stepper converte i segnali logici di Marlin nella corrente controllata che attraversa le bobine del motore. La scelta del tipo di driver determina temporizzazioni, comunicazione UART o SPI, regolazione della corrente, microstepping e disponibilita di funzioni come StealthChop, SpreadCycle, StallGuard e diagnostica.

Il nome configurato deve descrivere sia il componente sia la modalita in cui e cablato. Un TMC usato in modalita standalone non offre a Marlin le stesse funzioni dello stesso chip collegato tramite UART o SPI.

## Scelta del driver

In `Configuration.h`:

```cpp
#define X_DRIVER_TYPE  A4988
#define Y_DRIVER_TYPE  A4988
#define Z_DRIVER_TYPE  A4988
#define E0_DRIVER_TYPE A4988
```

La release 2.1.2.8 elenca:

```text
A4988, A5984, DRV8825, LV8729, TB6560, TB6600, TMC2100,
TMC2130, TMC2160, TMC2208, TMC2209, TMC26X, TMC2660,
TMC5130, TMC5160 e relative varianti STANDALONE
```

Sono disponibili anche i driver per X2, Y2, Z2-Z4, assi aggiuntivi I-W ed estrusori E1-E7.

Note specifiche del sorgente:

- TMC2225 usa il profilo `TMC2208` o `TMC2208_STANDALONE`;
- TMC2226 usa `TMC2209` o `TMC2209_STANDALONE`.

Non bisogna scegliere un tipo soltanto perche appartiene alla stessa famiglia. Temporizzazioni, protocollo e registri supportati devono corrispondere all'hardware.

## Driver standalone e driver configurabili

### Standalone

Il driver riceve normalmente `STEP`, `DIR` ed `ENABLE`. Microstepping e corrente vengono definiti da:

- jumper o pin logici;
- resistenze della scheda;
- potenziometro `Vref`;
- cablaggio del modulo.

Marlin non puo leggere lo stato interno ne modificare i registri del chip.

### UART o SPI

Il driver comunica con il microcontrollore e Marlin puo configurare:

- corrente RMS;
- microstepping;
- interpolazione;
- modalita del chopper;
- soglia ibrida;
- sensibilita StallGuard;
- stato termico ed errori.

Una voce non `STANDALONE` non crea fisicamente il collegamento. UART, SPI, pin CS, indirizzi e pin DIAG devono essere disponibili sulla scheda e cablati correttamente.

## Collegamento dei TMC

### SPI

TMC2130, TMC2160, TMC2660, TMC5130 e TMC5160 possono usare SPI. Il sorgente richiede:

- collegamento al bus SPI hardware, oppure software SPI;
- pin CS distinto per ogni driver, salvo configurazioni in catena;
- definizioni corrette nel file pin della scheda o in `Configuration_adv.h`.

Le opzioni di override includono:

```cpp
//#define X_CS_PIN -1
//#define TMC_USE_SW_SPI
//#define TMC_SPI_MOSI -1
//#define TMC_SPI_MISO -1
//#define TMC_SPI_SCK  -1
```

`*_CHAIN_POS` descrive l'ordine in una catena SPI. Il valore predefinito `-1` indica che il driver non e concatenato.

### UART

Per i TMC220x il sorgente descrive il collegamento di `PDN_UART` al TX tramite una resistenza da 1 kohm e, quando serve la lettura, anche al pin RX senza quella resistenza. Molte schede integrano gia questi collegamenti: bisogna seguire lo schema della scheda, non aggiungerli alla cieca.

Quattro TMC2209 possono condividere una seriale usando indirizzi hardware impostati tramite MS1 e MS2:

```text
0 = LOW / LOW
1 = HIGH / LOW
2 = LOW / HIGH
3 = HIGH / HIGH
```

Gli indirizzi firmware sono definiti da `X_SLAVE_ADDRESS`, `Y_SLAVE_ADDRESS` e direttive equivalenti. Due driver sullo stesso bus non devono avere lo stesso indirizzo, a meno che si desideri intenzionalmente comandarli come un unico destinatario e la configurazione lo supporti.

## Corrente del motore

Per i TMC configurabili:

```cpp
#define HOLD_MULTIPLIER 0.5

#define X_CURRENT      800
#define X_CURRENT_HOME X_CURRENT
#define X_MICROSTEPS    16
#define X_RSENSE         0.11
```

`X_CURRENT` e espresso in mA RMS. Il commento ufficiale indica:

```text
corrente di picco = corrente RMS * 1.414
```

`X_CURRENT_HOME` permette una corrente diversa durante l'homing, tipicamente inferiore. `HOLD_MULTIPLIER` riduce la corrente quando il motore mantiene la posizione; puo essere sovrascritto per singolo asse.

La corrente corretta non e semplicemente il massimo nominale del motore. Dipende da:

- corrente di fase ammessa dal motore;
- raffreddamento del driver;
- tensione di alimentazione e impostazioni del chopper;
- massa e attrito dell'asse;
- velocita e accelerazione;
- numero e collegamento dei motori pilotati;
- limiti della scheda e del modulo.

Una corrente troppo bassa puo causare perdita di passi. Una corrente troppo alta aumenta temperatura di motore e driver, puo attivare protezioni termiche e non garantisce piu coppia utile ad alta velocita.

`X_RSENSE` deve corrispondere alla resistenza di sense effettiva del modulo. Copiare il valore da un altro driver puo rendere errato il calcolo della corrente.

## Regolazione runtime

Con driver compatibili, leggere le correnti:

```gcode
M906
```

Impostare la corrente X in mA:

```gcode
M906 X700
```

Impostare la corrente di piu assi:

```gcode
M906 X700 Y700 Z800
```

La disponibilita dei parametri dipende dai driver e dalla build. Dopo la verifica, `M500` conserva i valori soltanto se la relativa impostazione e salvabile in EEPROM.

Le opzioni legacy o specifiche di alcune schede includono:

```cpp
//#define PWM_MOTOR_CURRENT { 1300, 1300, 1250 }
//#define DIGIPOT_MOTOR_CURRENT { 135, 135, 135, 135, 135 }
//#define DAC_MOTOR_CURRENT_DEFAULT { 70, 80, 90, 80 }
//#define DIGIPOT_I2C_MOTOR_CURRENTS { 1.0, 1.0, 1.0, 1.0 }
```

Le unita non sono uguali: possono essere mA, valori grezzi, percentuali o ampere. I comandi `M907`-`M910` si applicano soltanto all'hardware indicato dalla documentazione.

## Microstepping

Il microstepping divide uno step completo in passi comandati piu piccoli. Puo ridurre rumore e ondulazione del movimento, ma non moltiplica in modo proporzionale precisione meccanica e coppia utile.

Per i TMC:

```cpp
#define INTERPOLATE true
#define X_MICROSTEPS 16
```

`X_MICROSTEPS` e il microstepping ricevuto dal firmware. `INTERPOLATE` permette al driver di interpolare internamente fino a 256 microstep. Gli step/mm si calcolano sul microstepping comandato, non sul valore interpolato.

Per driver controllati tramite pin MS:

```cpp
#define MICROSTEP_MODES { 16, 16, 16, 16, 16, 16 }
```

questa funzione richiede che la scheda esponga pin come `X_MS1`, `X_MS2` ed eventualmente `X_MS3`. Se i jumper determinano il microstepping in hardware e non sono controllabili, la dichiarazione firmware non puo modificarli.

Quando il microstepping passa, per esempio, da 16 a 32:

```text
nuovi steps/mm = vecchi steps/mm * 32 / 16
```

Raddoppiare il microstepping raddoppia la frequenza di step richiesta. Su processori lenti o con valori di steps/mm elevati puo ridurre la velocita massima raggiungibile.

## StealthChop e SpreadCycle

Per i driver supportati:

```cpp
#define STEALTHCHOP_XY
#define STEALTHCHOP_Z
#define STEALTHCHOP_E
```

StealthChop privilegia silenziosita e fluidita a basso carico. Disabilitandolo, Marlin usa SpreadCycle, generalmente piu robusto quando servono coppia e risposta prevedibile.

La scelta va provata sulla macchina:

- un asse leggero puo funzionare bene in StealthChop;
- un estrusore o un asse ad alto carico puo perdere passi in silenzio;
- lo StallGuard usato per l'homing opera in SpreadCycle nella configurazione descritta dal sorgente.

Con:

```cpp
//#define HYBRID_THRESHOLD
```

il driver passa da StealthChop a SpreadCycle sopra una velocita definita da `*_HYBRID_THRESHOLD`. La soglia puo essere regolata con `M913`. L'opzione richiede StealthChop attivo sull'asse.

## Chopper timing

```cpp
#define CHOPPER_TIMING CHOPPER_DEFAULT_12V
```

Marlin fornisce preset per 12 V, 19 V, 24 V, 36 V e casi specifici. Il preset deve riflettere alimentazione, motore e driver. Un preset errato puo aumentare rumore, temperatura o instabilita.

Le varianti `CHOPPER_TIMING_X`, `CHOPPER_TIMING_Y`, `CHOPPER_TIMING_Z` e `CHOPPER_TIMING_E` consentono override per asse. I parametri custom richiedono la conoscenza del chopper TMC; non sono una regolazione generica da fare per tentativi.

## Monitoraggio e diagnostica

```cpp
//#define MONITOR_DRIVER_STATUS
```

abilita il controllo di condizioni come preallarme termico e corto verso massa. Le opzioni associate possono:

- ridurre la corrente di `CURRENT_STEP_DOWN`;
- riportare le variazioni;
- fermare la stampa con `STOP_ON_ERROR`.

Per la diagnostica TMC:

```cpp
//#define TMC_DEBUG
```

e quindi:

```gcode
M122
```

Il report aiuta a individuare:

- comunicazione assente;
- registri incoerenti;
- sovratemperatura;
- corti o carico anomalo;
- modalita StealthChop/SpreadCycle;
- corrente e microstepping applicati.

`M911` mostra le condizioni di preallarme termico memorizzate e `M912` le cancella. Cancellare il flag non corregge la causa termica.

Il reporting continuo di `M122` e uno strumento temporaneo: genera traffico seriale e puo alterare il comportamento durante test sensibili.

## Procedura di configurazione

1. Identificare il codice esatto del driver e la modalita standalone, UART o SPI.
2. Verificare schema della scheda, jumper, pin CS, UART, indirizzi e pin DIAG.
3. Configurare ogni `*_DRIVER_TYPE`.
4. Impostare microstepping coerente con hardware e steps/mm.
5. Per i TMC, verificare `RSENSE` e scegliere una corrente RMS prudente.
6. Compilare e accendere senza avviare subito una stampa.
7. Con `M122`, verificare che tutti i driver configurabili rispondano.
8. Provare movimenti brevi a bassa velocita.
9. Aumentare gradualmente carico, velocita e accelerazione.
10. Controllare perdita di passi, rumori, temperatura e messaggi diagnostici.
11. Provare l'homing con la corrente dedicata.
12. Salvare soltanto valori stabili e documentati.

## Errori comuni

- **Dichiarare un TMC UART senza collegamento UART:** Marlin non riesce a configurarlo.
- **Usare la variante `STANDALONE` con funzioni smart attese:** corrente e diagnostica non sono disponibili.
- **Confondere RMS e picco:** si imposta una corrente maggiore del previsto.
- **Copiare `RSENSE`:** il valore dipende dal modulo reale.
- **Cambiare microstepping senza aggiornare `M92`:** le distanze diventano errate.
- **Usare 256 come valore degli step calcolati perche l'interpolazione e attiva:** l'interpolazione e interna al driver.
- **Impostare corrente massima per eliminare ogni perdita di passi:** si nascondono attrito, accelerazioni eccessive o raffreddamento insufficiente.
- **Scegliere il preset chopper soltanto dal nome del driver:** conta anche la tensione.
- **Assegnare indirizzi UART duplicati:** i driver non sono controllabili individualmente.
- **Ignorare i preallarmi termici:** ridurre o cancellare il flag non sostituisce il raffreddamento.

## Checklist

- Tipo e modalita del driver corrispondono al componente montato.
- Collegamenti UART o SPI sono verificati sullo schema della scheda.
- Ogni TMC sullo stesso bus ha indirizzo o CS corretto.
- Corrente indicata e interpretata nella giusta unita.
- `RSENSE` deriva dal modulo reale.
- Microstepping firmware e hardware coincidono.
- Gli steps/mm sono stati aggiornati dopo ogni variazione.
- Interpolazione e microstepping comandato non sono confusi.
- Chopper timing coerente con la tensione.
- `M122` non riporta errori di comunicazione o temperatura.
- Corrente di homing provata separatamente dalla corrente di lavoro.
- Raffreddamento verificato nelle condizioni reali di stampa.

## Fonti

- [Configuration.h 2.1.2.8 - Stepper Drivers](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Trinamic Smart Drivers](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M906 - Stepper Motor Current](https://marlinfw.org/docs/gcode/M906.html)
- [M122 - TMC Debugging](https://marlinfw.org/docs/gcode/M122.html)
- [Trinamic Drivers - Marlin](https://marlinfw.org/docs/hardware/tmc_drivers.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]
- [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro]]
- [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing]]
