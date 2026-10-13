---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: operational-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - g-code
  - configuration
  - diagnostics
  - troubleshooting
aliases:
  - G-code diagnostica Marlin
  - Comandi configurazione Marlin
  - Diagnostica seriale Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]"
  - "[[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]"
  - "[[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing]]"
  - "[[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping]]"
marlin-version: 2.1.2.8
title: G-code per configurazione e diagnostica
status: non revisionato
---

# G-code per configurazione e diagnostica

## Obiettivo

Usare i G-code come interfaccia osservabile e ripetibile per:

- identificare la build in esecuzione;
- leggere lo stato prima di modificarlo;
- provare parametri runtime;
- salvare soltanto modifiche verificate;
- isolare problemi di sensori, movimento, driver, memoria e supporti;
- raccogliere un report utile per confronti e troubleshooting.

La pagina non sostituisce il riferimento completo dei G-code. Definisce un metodo di lavoro sicuro per Marlin 2.1.2.8.

## Quando usarlo

- Prima e dopo una modifica dei parametri runtime.
- Quando una taratura non sopravvive al riavvio.
- Quando firmware, host e macchina sembrano riportare stati differenti.
- Quando occorre isolare un problema prima di muovere assi o attivare heater.
- Quando si deve produrre un log riproducibile per assistenza o confronto.

## Prerequisiti

- Collegamento seriale stabile e baud rate corretto.
- Host capace di mostrare le risposte complete.
- Accesso all'interruttore o arresto di emergenza.
- Assi lontani dai limiti e spazio di movimento libero.
- Hotend e piatto in stato termico sicuro.
- Copia dei file di configurazione della build.
- Conoscenza delle funzioni effettivamente compilate.

## Risultato atteso

Al termine della procedura si deve disporre di:

- output `M115`;
- output `M503`;
- esito `M504`, se disponibile;
- stato temperature ed endstop;
- stato dei driver compatibili;
- elenco degli errori osservati;
- sequenza esatta dei comandi inviati;
- valori salvati e verificati dopo riavvio.

## Principio fondamentale: osservare, modificare, verificare, salvare

Ordine corretto:

```text
report iniziale -> modifica runtime -> prova -> report -> M500 -> riavvio -> report finale
```

`M500` non deve essere il primo comando dopo una modifica. Salvare subito rende persistente anche un errore.

## Sintassi e comunicazione

Un comando e formato dal codice e da parametri:

```gcode
M92 X80
```

Durante una sessione interattiva e preferibile inviare un comando alla volta e attendere la risposta.

Risposte comuni:

| Risposta | Significato |
|---|---|
| `ok` | comando accettato o completato secondo il protocollo |
| `echo:` | informazione o riepilogo |
| `Error:` | errore che richiede analisi |
| `busy:` | Marlin e occupato in un'operazione lunga |
| `Resend:` | host e firmware devono riallineare la sequenza |

`ok` non dimostra che il risultato fisico sia corretto. Un valore puo essere sintatticamente valido ma pericoloso per la macchina.

Numeri di riga e checksum sono normalmente gestiti dal software host durante lo streaming. Non vanno aggiunti manualmente in una console ordinaria.

## Prima fotografia della build

### Identita e capacita

```gcode
M115
```

Il report identifica firmware, protocollo, macchina e numero di estrusori. Con:

```cpp
#define EXTENDED_CAPABILITIES_REPORT
```

include anche capacita dichiarate, per esempio EEPROM, supporto SD, auto-report e probe.

Opzione aggiuntiva:

```cpp
//#define M115_GEOMETRY_REPORT
```

aggiunge la geometria dichiarata quando `EXTENDED_CAPABILITIES_REPORT` e attivo.

Il report serve a verificare che il firmware appena caricato sia realmente quello in esecuzione. Nome e data non sostituiscono un hash o l'archiviazione del binario.

### Configurazione runtime

```gcode
M503
```

Conservare l'output completo prima di ogni intervento. Rappresenta i valori attivi, non tutte le direttive compilate.

### Validita EEPROM

```gcode
M504
```

Usarlo quando disponibile per controllare coerenza e CRC del contenuto persistente.

## Adattamenti comuni

Questi esempi mostrano la famiglia di comando, non valori universali.

### Passi per unita

Leggere i valori attivi:

```gcode
M92
```

Impostare un valore misurato, per esempio su X:

```gcode
M92 X80
```

La taratura completa e in [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro|Motori direzione e passi per millimetro]].

### Velocita e accelerazioni

Velocita massime:

```gcode
M203
```

Accelerazioni massime:

```gcode
M201
```

Accelerazioni operative:

```gcode
M204
```

Parametri avanzati di movimento:

```gcode
M205
```

La semantica dei parametri dipende da Jerk, Junction Deviation e funzioni compilate. Non copiare un output da una macchina con cinematica differente.

### Offset della probe

```gcode
M851
```

Impostare soltanto il parametro misurato:

```gcode
M851 Z-1.20
```

Il segno e il valore devono derivare dalla procedura in [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch|Probe Z offset e BLTouch]].

### PID

Hotend:

```gcode
M301
```

Piatto, se supportato:

```gcode
M304
```

MPC usa comandi e parametri diversi. Non applicare coefficienti PID a una build che controlla quell'heater con MPC.

### Corrente TMC

```gcode
M906
```

La disponibilita dipende da driver, UART o SPI e funzioni compilate. Una corrente errata puo causare perdita passi o surriscaldamento.

### Stato del leveling

```gcode
M420
```

Lo stato attivo, la mesh memorizzata e il metodo di leveling sono aspetti separati. Consultare [[Stampante 3D/Marlin/Pagine/Tipi di bed leveling e configurazione della mesh|Tipi di bed leveling e configurazione della mesh]].

## Procedura di modifica persistente

### Salvare lo stato iniziale

```gcode
M503
```

### Applicare la modifica runtime

Esempio:

```gcode
M851 Z-1.20
```

### Verificare il valore

```gcode
M851
```

### Collaudare la funzione

Eseguire la procedura specifica senza salvare. Per un offset Z significa homing, controllo probe e prova sorvegliata, non una stampa completa automatica.

### Salvare

```gcode
M500
```

### Riavviare

Usare il normale reset della macchina. Non assumere che un riavvio software riproduca ogni condizione elettrica dell'accensione.

### Verificare la persistenza

```gcode
M503
```

Se il valore non persiste, controllare `EEPROM_SETTINGS`, backend della scheda, messaggi di `M500` ed esito `M504`.

## Ripristino controllato

Per provare i default compilati nella sola sessione:

```gcode
M502
```

Verificare:

```gcode
M503
```

Per rendere persistenti i default:

```gcode
M500
```

`M502` seguito da `M500` sostituisce le tarature salvate. Prima acquisire gli output recuperabili.

Per annullare modifiche runtime non salvate:

```gcode
M501
```

## Diagnostica delle temperature

Lettura singola:

```gcode
M105
```

Con `AUTO_REPORT_TEMPERATURES`, avviare un report ogni due secondi:

```gcode
M155 S2
```

Arrestare l'auto-report:

```gcode
M155 S0
```

Controllare:

- temperatura ambiente plausibile a macchina fredda;
- assenza di salti;
- identificazione corretta di hotend, bed e chamber;
- risposta graduale al riscaldamento;
- nessuna inversione tra sensori.

Non avviare un heater per diagnosticare un sensore che mostra gia un valore impossibile.

## Diagnostica degli endstop e della probe

```gcode
M119
```

Provare ogni sensore nelle due condizioni fisiche:

1. rilasciato;
2. azionato.

Lo stato deve cambiare in modo stabile tra `open` e `TRIGGERED`.

Per BLTouch e Sensorless Homing il segnale puo essere impulsivo e `M119` non rappresenta necessariamente ogni evento dinamico. La procedura completa e in [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing|Endstop homing e Sensorless Homing]].

Non eseguire homing finche gli endstop fisici non sono stati verificati.

## Diagnostica della posizione

```gcode
M114
```

Il significato preciso del report dipende dalle opzioni:

```cpp
//#define M114_DETAIL
//#define M114_REALTIME
//#define M114_LEGACY
```

La posizione logica pianificata e la posizione reale dei motori non sono sempre la stessa informazione durante una coda di movimenti.

Per attendere che tutti i movimenti pianificati siano terminati:

```gcode
M400
```

Poi:

```gcode
M114
```

`M400` non effettua homing e non rende note coordinate perse meccanicamente.

## Diagnostica dei driver Trinamic

```gcode
M122
```

Con driver TMC compatibili collegati via UART o SPI, il comando controlla comunicazione e stato. `TMC_DEBUG` amplia il report e abilita opzioni diagnostiche aggiuntive previste dalla build:

```cpp
//#define TMC_DEBUG
```

Pattern con tutti i bit bassi o alti possono indicare assenza di comunicazione.

Controllare:

- driver rilevato;
- corrente;
- microstepping;
- temperatura e prewarning;
- errori verso massa o alimentazione;
- modalita StealthChop o SpreadCycle;
- stato standstill.

Il report non misura la corrente reale del motore con uno strumento esterno.

Per evitare output continuo lasciato attivo:

```gcode
M122 S0
```

## Diagnostica della scheda SD

Montare:

```gcode
M21
```

Elencare:

```gcode
M20
```

Stato:

```gcode
M27
```

Con:

```cpp
//#define AUTO_REPORT_SD_STATUS
```

si puo richiedere un report periodico:

```gcode
M27 S2
```

Disabilitarlo:

```gcode
M27 S0
```

La diagnosi dettagliata di slot, detect, SPI e filesystem e in [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni|EEPROM scheda SD e salvataggio delle impostazioni]].

## Diagnostica dei pin

Per abilitare `M43`:

```cpp
//#define PINS_DEBUGGING
```

Report dei pin:

```gcode
M43
```

`M43` possiede modalita che possono osservare o commutare pin. `M42` puo impostare direttamente lo stato di un pin.

Questi comandi sono pericolosi su una stampante alimentata: un pin puo controllare heater, ventola, enable, servo o alimentazione. Non usare modalita toggle e non scrivere pin senza:

- schema elettrico;
- file pin della motherboard;
- carichi scollegati o messi in sicurezza;
- conoscenza delle protezioni applicate da Marlin.

La semplice corrispondenza del numero del pin non prova che il segnale sia libero.

## Diagnostica della memoria

La release espone:

```cpp
//#define M100_FREE_MEMORY_WATCHER
```

Con la funzione compilata:

```gcode
M100
```

fornisce strumenti per osservare la memoria libera e possibili corruzioni, con comportamento dipendente dalla piattaforma.

Va usato in una build diagnostica. Aggiungere codice di debug cambia a sua volta uso di flash e RAM.

## Livelli di debug

```gcode
M111
```

I flag sono bit combinabili. Valori rilevanti:

| Bit | Funzione |
|---|---|
| `1` | echo dei comandi |
| `2` | informazioni aggiuntive |
| `4` | errori aggiuntivi |
| `8` | dry run |
| `32` | debug leveling con `DEBUG_LEVELING_FEATURE` |

Esempio per informazioni ed errori:

```gcode
M111 S6
```

Disabilitare il debug:

```gcode
M111 S0
```

La modalita dry run non e un simulatore di sicurezza: puo lasciare attive parti del comportamento della macchina. Non usarla come sostituto di scollegamento heater, motori o utensili.

Per il debug dettagliato del leveling:

```cpp
//#define DEBUG_LEVELING_FEATURE
```

La release avverte che richiede molta flash. Va usato temporaneamente quando il log normale non e sufficiente.

## Auto-report e rumore seriale

Report periodici utili:

| Funzione | Direttiva | Comando |
|---|---|---|
| temperature | `AUTO_REPORT_TEMPERATURES` | `M155 S<secondi>` |
| posizione | `AUTO_REPORT_POSITION` | `M154 S<secondi>` |
| stato SD | `AUTO_REPORT_SD_STATUS` | `M27 S<secondi>` |

Troppi report:

- rendono difficile leggere gli errori;
- possono saturare una connessione lenta;
- interferiscono con il log dell'host;
- nascondono la sequenza temporale dei comandi manuali.

Al termine della diagnostica:

```gcode
M155 S0
```

Poi:

```gcode
M154 S0
```

Infine:

```gcode
M27 S0
```

I comandi non compilati possono essere ignorati o segnalati come sconosciuti.

## Coda dei comandi ed emergenze

Un comando ricevuto puo attendere nella coda mentre Marlin esegue un'attivita bloccante. L'opzione:

```cpp
//#define EMERGENCY_PARSER
```

intercetta a basso livello `M108`, `M112`, `M410` e `M876` sulle piattaforme supportate.

Non sostituisce:

- interruttore fisico;
- protezioni termiche;
- controllo della potenza;
- accesso rapido all'alimentazione.

Comando di arresto di emergenza:

```gcode
M112
```

Non va inviato come prova ordinaria durante una stampa. Dopo uno stato STOP possono essere necessari reset e nuova inizializzazione; prima di riprendere va identificata la causa.

`M410` arresta rapidamente il movimento pianificato, ma puo lasciare le coordinate logiche non coerenti con la posizione fisica. Dopo un quickstop non continuare i movimenti assumendo coordinate affidabili.

## Procedura

### Identificare

```gcode
M115
```

### Registrare i parametri attivi

```gcode
M503
```

### Verificare la memoria

```gcode
M504
```

### Verificare i sensori a freddo

```gcode
M105
```

Poi:

```gcode
M119
```

### Verificare posizione e coda

```gcode
M400
```

Poi:

```gcode
M114
```

### Verificare i sottosistemi presenti

Per driver TMC:

```gcode
M122
```

Per scheda SD:

```gcode
M20
```

### Cambiare un solo parametro

Inviare il comando specifico e documentare valore precedente e nuovo.

### Collaudare senza salvare

Eseguire il test funzionale appropriato.

### Salvare e riavviare

```gcode
M500
```

### Confrontare

```gcode
M503
```

## Raccolta di un report utile

Un report tecnico dovrebbe contenere:

```text
Versione e commit:
Motherboard:
Ambiente PlatformIO:
Configuration.h:
Configuration_adv.h:
Output M115:
Output M503:
Comando inviato:
Risposta completa:
Stato fisico prima e dopo:
Problema riproducibile:
```

Non limitarsi a una schermata ritagliata dell'ultima riga. I messaggi precedenti possono contenere la causa.

## Debug rapido

| Problema | Primo comando | Passo successivo |
|---|---|---|
| firmware inatteso | `M115` | verificare binario, ambiente e porta |
| valore che torna dopo il reset | `M503` | controllare EEPROM, `M500` e `M504` |
| temperatura impossibile | `M105` | spegnere gli heater e controllare sensore e pin |
| homing nella direzione errata | `M119` | interrompere e verificare endstop e direzione |
| posizione incoerente | `M400`, poi `M114` | controllare homing, passi persi e quickstop |
| TMC non comunicante | `M122` | controllare UART o SPI, indirizzi e alimentazione |
| SD non visibile | `M21`, poi `M20` | controllare slot, detect, CS e filesystem |
| output seriale ingestibile | `M111 S0` | disattivare anche gli auto-report |

I comandi indicati servono a osservare. Non correggono automaticamente la causa.

## Errori comuni

- Inviare `M500` prima di verificare la modifica.
- Considerare `M503` un elenco di tutte le funzioni compilate.
- Usare valori di un'altra cinematica o motherboard.
- Eseguire homing prima di controllare `M119`.
- Lasciare attivi auto-report e debug.
- Interpretare `ok` come conferma della correttezza fisica.
- Usare `M42` o modalita toggle di `M43` senza schema.
- Considerare `M111 S8` una simulazione completamente innocua.
- Continuare a muovere dopo `M410` senza ristabilire la posizione.
- Ripristinare un output vecchio senza controllare la compatibilita.

## Checklist finale

- [ ] La build e stata identificata con `M115`.
- [ ] Lo stato iniziale e stato registrato con `M503`.
- [ ] EEPROM e supporti sono stati controllati.
- [ ] Temperature ed endstop sono plausibili prima del movimento.
- [ ] Ogni modifica e stata provata in RAM prima di `M500`.
- [ ] I valori sono stati ricontrollati dopo riavvio.
- [ ] I comandi diagnostici compilati sono noti.
- [ ] Auto-report e debug sono stati disabilitati al termine.
- [ ] Nessun pin e stato commutato senza verifica elettrica.
- [ ] Il log contiene comandi, risposte e stato fisico.

## Riferimenti

- [Marlin 2.1.2.8 - Configuration.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Marlin 2.1.2.8 - Configuration_adv.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Marlin - G-code Index](https://marlinfw.org/meta/gcode/)
- [Marlin - M115 Firmware Info](https://marlinfw.org/docs/gcode/M115.html)
- [Marlin - M119 Endstop States](https://marlinfw.org/docs/gcode/M119.html)
- [Marlin - M122 TMC Debugging](https://marlinfw.org/docs/gcode/M122.html)
- [Marlin - M111 Debug Level](https://marlinfw.org/docs/gcode/M111.html)
- [Marlin - M503 Report Settings](https://marlinfw.org/docs/gcode/M503.html)

## Collegamenti

- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento|Metodo di configurazione compilazione e caricamento]]
- [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni|EEPROM scheda SD e salvataggio delle impostazioni]]
- [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin|Scheda madre porte seriali e pin]]
- [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing|Endstop homing e Sensorless Homing]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping|Driver stepper corrente e microstepping]]
- [[Stampante 3D/Marlin/Pagine/Tipi di bed leveling e configurazione della mesh|Tipi di bed leveling e configurazione della mesh]]


## Navigazione

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
