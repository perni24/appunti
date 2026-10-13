---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - temperatura
  - termistore
  - termocoppia
  - rtd
aliases:
  - Sensori temperatura Marlin
  - Limiti termici Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]"
  - "[[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Controllo PID MPC e protezioni termiche]]"
  - "[[Stampante 3D/Marlin/Pagine/Ventole e raffreddamento]]"
marlin-version: 2.1.2.8
title: Sensori di temperatura e limiti operativi
status: non revisionato
---

# Sensori di temperatura e limiti operativi

## Sintesi

Marlin non misura direttamente i gradi Celsius. Legge un segnale elettrico e lo converte usando il modello selezionato con `TEMP_SENSOR_*`. Se il modello non corrisponde al componente e al circuito, la temperatura visualizzata puo essere plausibile ma sbagliata.

La configurazione termica deve quindi rispettare questa catena:

```text
sensore fisico -> circuito e pin -> tipo TEMP_SENSOR -> conversione -> limiti -> controllo heater
```

`MINTEMP`, `MAXTEMP` e le protezioni termiche possono intervenire soltanto sulla temperatura calcolata. Non rendono sicuro un sensore configurato con la tabella errata.

## Canali di temperatura

In `Configuration.h`:

```cpp
#define TEMP_SENSOR_0 1
#define TEMP_SENSOR_1 0
#define TEMP_SENSOR_2 0
#define TEMP_SENSOR_3 0
#define TEMP_SENSOR_4 0
#define TEMP_SENSOR_5 0
#define TEMP_SENSOR_6 0
#define TEMP_SENSOR_7 0
#define TEMP_SENSOR_BED 1
#define TEMP_SENSOR_PROBE 0
#define TEMP_SENSOR_CHAMBER 0
#define TEMP_SENSOR_COOLER 0
#define TEMP_SENSOR_BOARD 0
#define TEMP_SENSOR_REDUNDANT 0
```

I canali hanno ruoli differenti:

| Direttiva | Grandezza sorvegliata |
|---|---|
| `TEMP_SENSOR_0`...`7` | hotend associati agli estrusori |
| `TEMP_SENSOR_BED` | piatto riscaldato |
| `TEMP_SENSOR_PROBE` | temperatura della sonda |
| `TEMP_SENSOR_CHAMBER` | camera |
| `TEMP_SENSOR_COOLER` | circuito di raffreddamento dedicato |
| `TEMP_SENSOR_BOARD` | scheda elettronica |
| `TEMP_SENSOR_REDUNDANT` | seconda misura di confronto |

Il valore `0` indica che il canale non e usato. Un valore diverso da zero seleziona una tabella o un'interfaccia specifica.

## Come scegliere il tipo

La scelta va ricavata da:

1. codice o datasheet del sensore;
2. tipo di circuito sulla scheda;
3. valore della resistenza di pull-up;
4. tensione e tolleranza dell'ingresso;
5. pin effettivamente assegnato;
6. intervallo di temperatura richiesto.

Non basta sapere che il componente e "un NTC 100K": beta, tabella e pull-up possono essere differenti.

### Termistori analogici

Sono sensori resistivi letti dall'ADC tramite un partitore. Marlin include tabelle per molti componenti e circuiti. La tabella deve corrispondere sia al termistore sia alla pull-up della scheda.

Sintomi di una tabella errata:

- temperatura ambiente apparentemente corretta ma errore crescente a caldo;
- PID difficile da stabilizzare;
- target reale piu alto o piu basso del valore mostrato;
- interventi MAXTEMP inattesi;
- materiale degradato nonostante la lettura sembri normale.

Cambiare tabella per "correggere" una differenza senza identificare l'hardware nasconde il problema.

### RTD Pt100 e Pt1000

La release include tabelle analogiche per Pt100/Pt1000 e supporto MAX31865:

```cpp
#define TEMP_SENSOR_0 -5
```

Con MAX31865 bisogna specificare resistenza nominale del sensore e resistenza di riferimento:

```cpp
#define MAX31865_SENSOR_OHMS_0 100
#define MAX31865_CALIBRATION_OHMS_0 430
```

Per una Pt1000 e un modulo progettato per essa, i valori sono normalmente nell'ordine di 1000 e 4300 ohm, ma devono provenire dal modulo reale.

In `Configuration_adv.h`:

```cpp
//#define MAX31865_SENSOR_WIRES_0 2
```

seleziona un collegamento a 2, 3 o 4 fili. Una configurazione errata introduce l'errore della resistenza dei cavi o letture di fault.

Per reti elettriche europee:

```cpp
//#define MAX31865_50HZ_FILTER
```

puo selezionare il filtro a 50 Hz al posto del default a 60 Hz.

### Termocoppie

La release supporta, tra gli altri:

- `-2`: MAX6675;
- `-3`: MAX31855;
- `-4`: AD8495 analogico;
- `-1`: AD595 analogico.

I moduli SPI richiedono il relativo pin chip-select. Se sono definiti anche clock e MISO software, Marlin puo usare software SPI; `TEMP_SENSOR_FORCE_HW_SPI` forza invece il bus hardware predefinito.

Per AD595 e AD8495 si possono correggere guadagno e offset:

```cpp
#define TEMP_SENSOR_AD595_OFFSET 0.0
#define TEMP_SENSOR_AD595_GAIN 1.0
#define TEMP_SENSOR_AD8495_OFFSET 0.0
#define TEMP_SENSOR_AD8495_GAIN 1.0
```

Queste correzioni richiedono misure di riferimento affidabili. Non servono a compensare un sensore del tipo sbagliato.

## Termistore personalizzato

Il valore `1000` abilita un modello personalizzato. Per E0:

```cpp
#define TEMP_SENSOR_0 1000
```

In `Configuration_adv.h`:

```cpp
#define HOTEND0_PULLUP_RESISTOR_OHMS 4700
#define HOTEND0_RESISTANCE_25C_OHMS 100000
#define HOTEND0_BETA 3950
#define HOTEND0_SH_C_COEFF 0
```

Parametri equivalenti esistono per gli altri hotend, il piatto, la camera, la sonda, il cooler e la scheda.

- `PULLUP_RESISTOR_OHMS`: resistenza del circuito della scheda.
- `RESISTANCE_25C_OHMS`: resistenza nominale del sensore a 25 °C.
- `BETA`: coefficiente beta.
- `SH_C_COEFF`: coefficiente C di Steinhart-Hart, quando noto.

Valori presunti producono una curva presunta. Per un sensore non documentato e piu sicuro identificarlo o sostituirlo.

## Sensori dummy

I valori `998` e `999` restituiscono sempre una temperatura fissa:

```cpp
#define DUMMY_THERMISTOR_998_VALUE 25
#define DUMMY_THERMISTOR_999_VALUE 100
```

La sorgente 2.1.2.8 li indica esclusivamente per test e sviluppo, mai per una macchina in produzione. Un sensore dummy elimina la retroazione reale: il firmware non puo sapere se l'heater e freddo o fuori controllo.

## Sensore ridondante

```cpp
#define TEMP_SENSOR_REDUNDANT 1
```

Configurazione:

```cpp
#define TEMP_SENSOR_REDUNDANT_SOURCE E1
#define TEMP_SENSOR_REDUNDANT_TARGET E0
#define TEMP_SENSOR_REDUNDANT_MAX_DIFF 10
```

La sorgente e il canale fisico usato come seconda lettura; il target e la misura da sorvegliare. Se la differenza supera la soglia, Marlin interrompe la stampa.

Il canale scelto come sorgente perde la sua funzione normale. Per esempio, riutilizzare il sensore del bed come ridondante disabilita il controllo del piatto.

La ridondanza e utile soltanto se:

- i sensori sono entrambi fissati in posizioni significative;
- hanno risposta temporale confrontabile;
- usano conversioni corrette;
- la soglia ammette il normale gradiente ma rileva un distacco.

Due sensori installati in punti termicamente diversi non devono necessariamente leggere lo stesso valore.

## Limite minimo

```cpp
#define HEATER_0_MINTEMP 5
#define BED_MINTEMP 5
#define CHAMBER_MINTEMP 5
```

Una lettura sotto `MINTEMP` viene trattata come guasto e spegne l'heater. Con molti circuiti NTC puo indicare un cavo interrotto o un sensore scollegato, ma il significato elettrico dipende dal circuito.

Il limite deve essere inferiore alla minima temperatura ambiente prevista. Una macchina tenuta in un locale molto freddo puo generare un errore corretto dal punto di vista della configurazione ma non indicativo di un guasto.

Non abbassare il valore senza verificare:

- intervallo reale dell'ambiente;
- precisione del sensore alle basse temperature;
- comportamento ADC a circuito aperto;
- rischio di rendere meno efficace il rilevamento del guasto.

## Limite massimo

```cpp
#define HEATER_0_MAXTEMP 275
#define BED_MAXTEMP 150
#define CHAMBER_MAXTEMP 60
```

Una lettura superiore a `MAXTEMP` spegne l'heater. Il valore deve rimanere sotto il piu basso limite sicuro tra:

- sensore;
- heater;
- cartuccia e cablaggio;
- heatbreak e blocco;
- tubo PTFE, se presente nella zona calda;
- isolamento;
- superficie del piatto;
- adesivi e magneti;
- connettori, MOSFET e relazioni di potenza;
- struttura della camera.

La portata nominale del sensore non e la temperatura sicura dell'intero gruppo. Un termistore da 300 °C non rende automaticamente sicuro un hotend a 300 °C.

Il commento della release precisa inoltre che `MAXTEMP` non protegge da ogni corto o guasto di potenza. Un MOSFET bloccato in conduzione puo continuare ad alimentare l'heater indipendentemente dal comando firmware; servono progettazione elettrica e protezioni hardware adeguate.

## Margine di overshoot

```cpp
#define HOTEND_OVERSHOOT 15
#define BED_OVERSHOOT 10
#define COOLER_OVERSHOOT 2
```

Il target massimo impostabile viene tenuto distante dal limite assoluto. Per un hotend con `MAXTEMP` a 275 °C e overshoot di 15 °C, il target non dovrebbe superare 260 °C.

Questo margine evita che un normale superamento transitorio del target provochi immediatamente MAXTEMP. Non autorizza a impostare `MAXTEMP` sopra il limite dell'hardware.

## Stabilizzazione dei comandi con attesa

Per l'hotend:

```cpp
#define TEMP_RESIDENCY_TIME 10
#define TEMP_WINDOW 1
#define TEMP_HYSTERESIS 3
```

Impostazioni analoghe esistono per bed e camera. Influenzano quando i comandi con attesa considerano raggiunto il target:

- `M109`: hotend;
- `M190`: piatto;
- `M191`: camera.

`TEMP_RESIDENCY_TIME` richiede che la temperatura resti stabile per il tempo specificato. `TEMP_WINDOW` definisce la finestra usata dal timer; `TEMP_HYSTERESIS` stabilisce quanto ci si puo allontanare prima di considerare persa la condizione.

Questi parametri non regolano la qualita del PID e non sono protezioni thermal runaway.

## Lettura e diagnostica

Leggere le temperature:

```gcode
M105
```

Con:

```cpp
#define AUTO_REPORT_TEMPERATURES
```

si puo richiedere un report automatico ogni due secondi:

```gcode
M155 S2
```

Disabilitare il report:

```gcode
M155 S0
```

Per includere i valori ADC grezzi:

```cpp
//#define SHOW_TEMP_ADC_VALUES
```

L'ADC grezzo aiuta a distinguere un problema di conversione da un ingresso fermo o rumoroso, ma deve essere interpretato rispetto allo schema elettrico.

## Procedura di verifica

1. Identificare ogni sensore e il relativo canale.
2. Verificare pin, pull-up, alimentazione e compatibilita elettrica.
3. Selezionare il codice `TEMP_SENSOR_*` dalla release usata.
4. Lasciare gli heater disalimentati e avviare la scheda.
5. Controllare che tutti i canali mostrino una temperatura ambiente plausibile.
6. Scaldare delicatamente un solo sensore con una sorgente controllata.
7. Verificare che cambi soltanto il canale previsto.
8. Controllare che la lettura cresca senza salti o interruzioni.
9. Fissare meccanicamente il sensore e assicurare i cavi.
10. Impostare `MINTEMP`, `MAXTEMP` e overshoot sotto i limiti dell'hardware.
11. Provare un riscaldamento a target moderato sorvegliando `M105`.
12. Confrontare la lettura con uno strumento adatto, considerando che punti di misura diversi hanno temperature diverse.
13. Solo dopo completare la taratura del controllo termico.

## Errori comuni

- **Scegliere una tabella perche la temperatura ambiente sembra corretta:** l'errore puo emergere soltanto a caldo.
- **Confondere NTC 100K con un modello unico:** beta e pull-up cambiano la conversione.
- **Collegare una termocoppia direttamente a un ingresso per termistore:** manca il circuito di condizionamento.
- **Usare valori MAX31865 di un modulo diverso:** riferimento e tipo RTD possono non coincidere.
- **Lasciare un sensore dummy su una macchina reale:** il controllo diventa cieco.
- **Usare il bed come sorgente ridondante senza considerarne la disabilitazione:** il piatto non viene piu controllato.
- **Alzare `MAXTEMP` per evitare errori:** puo superare il limite di PTFE, cablaggi o heater.
- **Abbassare `MINTEMP` per nascondere un contatto intermittente:** si indebolisce il rilevamento del guasto.
- **Confondere overshoot e precisione:** il margine limita il target, non migliora la regolazione.
- **Confrontare sensori in punti diversi come se dovessero coincidere:** i gradienti termici possono essere reali.

## Checklist

- Ogni `TEMP_SENSOR_*` corrisponde al componente fisico.
- Pull-up e tensione ADC sono compatibili con la tabella.
- I moduli SPI hanno CS e bus configurati.
- Pt100/Pt1000 e resistenza di riferimento MAX31865 sono corretti.
- Nessun sensore dummy controlla un heater reale.
- La temperatura ambiente e plausibile su tutti i canali.
- Scaldando un sensore varia soltanto il canale previsto.
- Il sensore e fissato e i cavi hanno scarico di trazione.
- `MINTEMP` e compatibile con l'ambiente piu freddo previsto.
- `MAXTEMP` e sotto il limite del componente piu debole.
- Il target massimo considera il margine di overshoot.
- L'eventuale sensore ridondante non sottrae un canale necessario.
- I report automatici sono stati disabilitati dopo la diagnosi se non servono.

## Fonti

- [Configuration.h 2.1.2.8 - Thermal sensors and limits](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Custom thermistors and sensor interfaces](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M105 - Report Temperatures](https://marlinfw.org/docs/gcode/M105.html)
- [M155 - Temperature Auto-Report](https://marlinfw.org/docs/gcode/M155.html)
- [M305 - User Thermistor Parameters](https://marlinfw.org/docs/gcode/M305.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin|Scheda madre porte seriali e pin]]
- [[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware|Alimentazione e protezioni hardware]]
- [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento|Hotend estrusori e filamento]]
- [[Stampante 3D/Marlin/Pagine/Controllo PID MPC e protezioni termiche|Controllo PID MPC e protezioni termiche]]
- [[Stampante 3D/Marlin/Pagine/Ventole e raffreddamento|Ventole e raffreddamento]]
