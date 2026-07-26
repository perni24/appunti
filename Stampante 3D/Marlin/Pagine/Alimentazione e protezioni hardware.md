---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [marlin, alimentazione, sicurezza, emergenza]
aliases: [PSU Control Marlin, Sicurezza hardware Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita]]"
  - "[[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]"
related: []
marlin-version: "2.1.2.8"
---

# Alimentazione e protezioni hardware

## Sintesi

Marlin puo comandare l'accensione di un alimentatore, monitorare tensione e corrente e reagire ad alcuni errori. Queste funzioni migliorano controllo e diagnostica, ma non trasformano il firmware in un sistema di sicurezza certificato.

Un microcontrollore, un relè software o il comando `M112` non sostituiscono interruttore generale, fusibili, messa a terra, protezioni da sovracorrente e dispositivi di arresto progettati in base ai rischi della macchina.

## Quando usarlo

Queste opzioni sono rilevanti quando:

- la scheda dispone di `PS_ON_PIN`;
- l'alimentatore supporta un ingresso di accensione remoto;
- si usa un modulo di controllo alimentazione compatibile;
- si vuole spegnere automaticamente la potenza dopo il raffreddamento;
- sono installati sensori analogici di corrente o tensione;
- la scheda supporta il controllo preventivo dell'alimentazione dei driver;
- serve comprendere la differenza tra arresto del movimento e arresto completo.

## Modello elettrico

Occorre distinguere almeno tre domini:

1. **rete elettrica:** alimenta l'alimentatore e richiede protezioni adeguate;
2. **potenza DC:** alimenta heater, motori, ventole e scheda;
3. **logica:** segnali del microcontrollore a 3,3 V o 5 V.

`PS_ON_PIN` e un segnale logico. Non deve pilotare direttamente la rete elettrica o un carico di potenza. Serve un circuito progettato per l'alimentatore o un'interfaccia isolata e dimensionata correttamente.

## `PSU_CONTROL`

La sezione principale di `Configuration.h` e:

```cpp
//#define PSU_CONTROL
//#define PSU_NAME "Power Supply"
```

Abilitando `PSU_CONTROL`, Marlin usa `PS_ON_PIN` definito dal file della scheda.

Se il pin non esiste o il circuito non e compatibile, abilitare la direttiva non crea una funzione di accensione utilizzabile.

### Stato attivo

```cpp
#define PSU_ACTIVE_STATE LOW
```

Determina il livello logico che richiede l'accensione:

- `LOW`: configurazione indicata dal file per alimentatori ATX;
- `HIGH`: configurazione indicata per alcuni alimentatori o moduli con logica opposta.

Un valore invertito puo accendere la potenza quando il firmware la considera spenta. Lo stato deve essere verificato sulla documentazione elettrica del circuito.

### Nome dell'alimentatore

```cpp
//#define PSU_NAME "Power Supply"
```

Personalizza il nome mostrato dall'interfaccia. Non modifica il comportamento elettrico.

### Modulo MKS PWC

```cpp
//#define MKS_PWC
```

Va abilitato soltanto quando si usa il modulo MKS Power Control previsto. Non e un'opzione generica per qualsiasi relè.

## Stato iniziale e temporizzazioni

### `PSU_DEFAULT_OFF`

```cpp
//#define PSU_DEFAULT_OFF
```

Mantiene la potenza controllata spenta finche non viene richiesta esplicitamente. La scheda deve comunque ricevere l'alimentazione necessaria per eseguire Marlin e cambiare lo stato del pin.

### `PSU_POWERUP_DELAY`

```cpp
//#define PSU_POWERUP_DELAY 250
```

Introduce un ritardo, espresso in millisecondi, per permettere all'alimentatore di stabilizzarsi prima dell'uso dei carichi.

### `POWER_OFF_DELAY`

```cpp
//#define POWER_OFF_DELAY 60
```

Ritarda lo spegnimento, in secondi, per lasciare attivi carichi come le ventole. E disponibile nel blocco `AUTO_POWER_CONTROL`.

Il ritardo non garantisce che la temperatura sia sicura: per questo esistono condizioni separate basate sul raffreddamento.

## Comandi di accensione e spegnimento

Con `PSU_CONTROL` attivo:

```gcode
M80
```

richiede l'accensione dell'alimentatore.

```gcode
M81
```

richiede lo spegnimento. Se la scheda riceve energia soltanto dalla potenza controllata, anche il controller puo spegnersi; con USB o alimentazioni separate la logica puo restare attiva.

### Conferma e segnale acustico

```cpp
//#define PS_OFF_CONFIRM
```

richiede una conferma nell'interfaccia prima dello spegnimento.

```cpp
//#define PS_OFF_SOUND
```

aggiunge un segnale acustico prima dello spegnimento.

Sono protezioni contro un comando involontario, non dispositivi di sicurezza.

### Spegnimento temporizzato

```cpp
//#define POWER_OFF_TIMER
```

abilita l'uso del parametro `D` di `M81` per richiedere lo spegnimento dopo un intervallo.

### Attesa del raffreddamento

```cpp
//#define POWER_OFF_WAIT_FOR_COOLDOWN
```

abilita il comportamento collegato a `M81 S`, che attende il raffreddamento prima di togliere la potenza controllata.

L'efficacia dipende da sensori corretti, ventole alimentate e soglie coerenti.

### G-code associati all'alimentazione

```cpp
//#define PSU_POWERUP_GCODE "M355 S1"
```

```cpp
//#define PSU_POWEROFF_GCODE "M355 S0"
```

Permettono di eseguire azioni aggiuntive all'accensione o prima dello spegnimento. Gli esempi ufficiali controllano la luce della macchina.

Non inserire comandi che richiedono periferiche non ancora alimentate o che riattivano carichi durante lo spegnimento.

## Controllo automatico della potenza

```cpp
//#define AUTO_POWER_CONTROL
```

Permette a Marlin di accendere l'alimentatore quando determinate funzioni richiedono energia e di spegnerlo dopo un periodo di inattivita.

Nel blocco sono presenti:

```cpp
#define AUTO_POWER_FANS
#define AUTO_POWER_E_FANS
#define AUTO_POWER_CONTROLLERFAN
#define AUTO_POWER_CHAMBER_FAN
#define AUTO_POWER_COOLER_FAN
#define POWER_TIMEOUT 30
```

`POWER_TIMEOUT` e espresso in secondi.

Possono essere configurate soglie termiche:

```cpp
//#define AUTO_POWER_E_TEMP 50
```

```cpp
//#define AUTO_POWER_CHAMBER_TEMP 30
```

```cpp
//#define AUTO_POWER_COOLER_TEMP 26
```

Lo spegnimento automatico deve essere provato verificando che le ventole necessarie al raffreddamento restino alimentate abbastanza a lungo.

## Monitoraggio di corrente e tensione

In `Configuration_adv.h`:

```cpp
//#define POWER_MONITOR_CURRENT
```

```cpp
//#define POWER_MONITOR_VOLTAGE
```

Le opzioni leggono sensori analogici e permettono a `M430` di riportare corrente, tensione e, quando calcolabile, potenza.

### Sensore di corrente

```cpp
#define POWER_MONITOR_VOLTS_PER_AMP 0.05000
#define POWER_MONITOR_CURRENT_OFFSET 0
#define POWER_MONITOR_FIXED_VOLTAGE 13.6
```

- `POWER_MONITOR_VOLTS_PER_AMP` descrive la sensibilita del sensore;
- `POWER_MONITOR_CURRENT_OFFSET` corregge l'offset in ampere;
- `POWER_MONITOR_FIXED_VOLTAGE` permette di stimare la potenza quando non e presente un sensore di tensione.

### Sensore di tensione

```cpp
#define POWER_MONITOR_VOLTS_PER_VOLT 0.077933
#define POWER_MONITOR_VOLTAGE_OFFSET 0
```

Il rapporto dipende dal circuito di misura. La tensione applicata al pin analogico non deve superare `ADC_VREF`.

### Lettura con `M430`

```gcode
M430
```

richiede il report dei valori disponibili.

```gcode
M430 I1 V1 W1
```

abilita la visualizzazione su LCD di corrente, tensione e potenza, quando supportate.

Il monitoraggio e diagnostico. Un valore misurato dal firmware non disconnette automaticamente un circuito in sovracorrente e non sostituisce fusibili o protezioni hardware.

## Protezione dell'alimentazione dei driver

`Configuration_adv.h` include:

```cpp
//#define DISABLE_DRIVER_SAFE_POWER_PROTECT
```

Quando una scheda definisce `SAFE_POWER_PIN`, Marlin puo controllare che i driver compatibili risultino installati correttamente prima di applicare potenza. La direttiva mostrata disabilita tale controllo.

Non va attivata per eliminare un errore senza capire:

- se la scheda implementa realmente il circuito;
- se i driver supportano il rilevamento;
- se un driver e inserito al contrario o manca;
- se esiste un problema di contatto.

La protezione non e disponibile su tutte le schede.

## Comandi di arresto

### `M112`

```gcode
M112
```

arresta Marlin, disabilita motori e riscaldatori e, quando possibile, spegne l'alimentatore controllato. Per riprendere il funzionamento e necessario un reset.

`M112` e un arresto di controllo software. La documentazione ufficiale precisa che non e un Emergency Stop classificato secondo categorie di sicurezza.

### `EMERGENCY_PARSER`

In `Configuration_adv.h`:

```cpp
//#define EMERGENCY_PARSER
```

aggiunge un parser a basso livello che intercetta:

```text
M108
M112
M410
M876
```

prima che restino bloccati nella coda seriale. Il commento della release segnala che non e implementato su tutte le piattaforme.

Senza questa funzione, `M112` inviato dall'host puo attendere spazio nella coda dei comandi.

### `M410`

```gcode
M410
```

ferma immediatamente gli stepper senza decelerazione. La posizione interna non e piu affidabile dopo il comando.

`M410` non spegne heater, ventole o altri carichi: non equivale a `M112`.

### `FREEZE_FEATURE`

```cpp
//#define FREEZE_FEATURE
```

puo aggiungere una funzione di blocco e ripresa del movimento. Il commento ufficiale specifica che non mette in pausa spindle, laser, ventole, heater o altre periferiche.

Non va etichettata come arresto di emergenza.

## Reset dopo un arresto

Le opzioni avanzate includono:

```cpp
//#define SOFT_RESET_VIA_SERIAL
```

```cpp
//#define SOFT_RESET_ON_KILL
```

Permettono reset software in scenari specifici. Un reset automatico puo facilitare il recupero, ma puo anche rendere meno evidente la causa di un arresto. Prima di riavviare bisogna eliminare il guasto che ha causato il kill.

## Protezioni non trattate in questa pagina

Sono argomenti distinti:

- protezioni termiche e thermal runaway;
- limiti di temperatura;
- timeout dell'hotend;
- controllo delle ventole;
- power-loss recovery;
- protezioni e diagnostica dei driver TMC;
- finecorsa e limiti software.

Contribuiscono alla sicurezza complessiva, ma non sostituiscono le protezioni elettriche.

## Errori comuni

- **Collegare `PS_ON_PIN` direttamente alla rete:** il pin e un segnale logico.
- **Invertire `PSU_ACTIVE_STATE`:** la potenza puo accendersi nello stato inatteso.
- **Presumere che `M81` spenga tutta l'elettronica:** USB o alimentazioni separate possono mantenere attiva la scheda.
- **Spegnere prima che l'hotend sia freddo:** la ventola puo fermarsi e causare heat creep.
- **Considerare `M112` un Emergency Stop certificato:** dipende da firmware, comunicazione e alimentazione.
- **Usare `M410` per spegnere la macchina:** arresta soltanto gli stepper.
- **Superare `ADC_VREF` sugli ingressi analogici:** si puo danneggiare il microcontrollore.
- **Disabilitare una protezione driver per far compilare:** si puo ignorare un problema hardware reale.
- **Affidarsi al solo monitor di corrente:** non interrompe necessariamente una sovracorrente.
- **Riavviare dopo un kill senza diagnosi:** il guasto puo ripresentarsi immediatamente.

## Checklist

- `PS_ON_PIN` esiste nel file della scheda.
- Il circuito di controllo e compatibile con il livello logico.
- `PSU_ACTIVE_STATE` e verificato senza carichi pericolosi.
- Alimentazione logica e alimentazione di potenza sono comprese.
- Ventole e raffreddamento restano attivi durante lo spegnimento.
- `M80` e `M81` vengono provati in condizioni controllate.
- Sensori di corrente e tensione non superano `ADC_VREF`.
- `M112` e `M410` sono compresi e non confusi.
- Esiste un dispositivo fisico per togliere energia in caso di pericolo.
- Fusibili, messa a terra e sezioni dei cavi sono dimensionati indipendentemente dal firmware.
- Gli arresti firmware vengono testati senza movimento o riscaldamento non controllato.

## Fonti

- [Configuration.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M80 - Power On](https://marlinfw.org/docs/gcode/M080.html)
- [M81 - Power Off](https://marlinfw.org/docs/gcode/M081.html)
- [M112 - Full Shutdown](https://marlinfw.org/docs/gcode/M112.html)
- [M410 - Quickstop](https://marlinfw.org/docs/gcode/M410.html)
- [M430 - Power Monitor](https://marlinfw.org/docs/gcode/M430.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita]]
- [[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin]]
- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]
- [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]
