---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - filament-runout
  - motion-sensor
  - power-loss-recovery
  - m600
aliases:
  - Filament Runout Marlin
  - Sensore filamento Marlin
  - Power Loss Recovery Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento]]"
  - "[[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni]]"
  - "[[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile]]"
  - "[[Stampante 3D/Marlin/Pagine/Alimentatore rele LED luci buzzer e servo]]"
marlin-version: 2.1.2.8
title: Sensore di fine filamento e recupero dopo perdita di alimentazione
status: non revisionato
---

# Sensore di fine filamento e recupero dopo perdita di alimentazione

## Sintesi

Il sensore di fine filamento rileva l'assenza o il mancato avanzamento del materiale durante una stampa. Il recupero dopo perdita di alimentazione salva invece lo stato del job su un supporto scrivibile per proporre una ripresa al riavvio.

I due sistemi gestiscono eventi differenti:

| Sistema | Evento rilevato | Reazione tipica |
|---|---|---|
| switch di presenza | filamento non presente | pausa e cambio filamento |
| sensore di movimento | filamento non avanza come previsto | pausa e diagnosi del percorso |
| power-loss senza pin | salvataggi periodici | ripresa dall'ultimo stato registrato |
| power-loss con pin | segnale di mancanza alimentazione | salvataggio e operazioni residue |

Nessuno dei due garantisce il recupero del pezzo. La ripresa dipende anche da adesione, posizione fisica, temperatura, meccanica e interazione dell'utente o dell'host.

## Quando usarlo

- Quando si vogliono gestire bobine esaurite durante una stampa.
- Quando serve rilevare filamento spezzato o bloccato.
- Quando la stampante esegue job lunghi da SD o flash drive.
- Quando l'alimentazione e soggetta a interruzioni brevi.
- Quando si vuole distinguere una pausa locale da una pausa gestita dall'host.
- Quando si devono collaudare `M412`, `M600` o `M413`.

## Come funziona

### Runout

Marlin legge uno o piu ingressi digitali. Quando il sensore attivo segnala runout durante un job riconosciuto, il firmware esegue `FILAMENT_RUNOUT_SCRIPT`, normalmente `M600`.

### Power-loss recovery

Marlin salva su SD o flash drive le informazioni necessarie alla ripresa. Al riavvio, se trova uno stato di recupero valido, puo proporre di continuare il file dalla posizione registrata.

La qualita della ripresa non e contenuta nel file di recovery: se il pezzo si stacca, gli assi si muovono o l'hotend crea una colatura, il firmware non puo ricostruire automaticamente la situazione fisica.

## Tipi di sensore filamento

### Switch di presenza

Rileva se il filamento occupa il passaggio. Puo essere:

- microswitch;
- sensore ottico;
- uscita digitale di un modulo.

Rileva bobina terminata o filamento assente nel punto del sensore, ma non sempre rileva:

- filamento fermo dopo il sensore;
- ingranaggio che slitta;
- ugello ostruito;
- filamento spezzato tra sensore ed estrusore.

### Sensore di movimento

Usa una ruota o encoder che genera transizioni mentre il filamento avanza. Marlin confronta l'estrusione comandata con gli impulsi ricevuti.

Puo rilevare:

- bobina terminata;
- filamento spezzato;
- assenza di avanzamento;
- alcuni casi di slittamento.

Non misura direttamente la portata reale nell'ugello e puo produrre falsi allarmi se soglia, attrito o risoluzione sono errati.

## Abilitare il sensore

In `Configuration.h`:

```cpp
//#define FILAMENT_RUNOUT_SENSOR
```

Per abilitarlo:

```cpp
#define FILAMENT_RUNOUT_SENSOR
```

Il blocco principale della release include:

```cpp
#define FIL_RUNOUT_ENABLED_DEFAULT true
#define NUM_RUNOUT_SENSORS 1
#define FIL_RUNOUT_STATE LOW
#define FIL_RUNOUT_PULLUP
//#define FIL_RUNOUT_PULLDOWN
#define FILAMENT_RUNOUT_SCRIPT "M600"
```

## Pin e logica elettrica

La motherboard puo definire:

```text
FIL_RUNOUT_PIN
FIL_RUNOUT2_PIN
...
FIL_RUNOUT8_PIN
```

Prima di usare un pin:

- controllare il file pin della motherboard;
- verificare che non sia gia occupato;
- misurare la tensione massima dell'uscita del sensore;
- verificare se il segnale e push-pull, open-drain o contatto pulito;
- collegare una massa comune quando richiesta;
- non applicare 5 V a un ingresso che accetta soltanto 3.3 V.

`FIL_RUNOUT_STATE` rappresenta lo stato elettrico che significa **filamento non presente**:

```cpp
#define FIL_RUNOUT_STATE LOW
```

Se il sensore porta il pin alto in assenza di materiale:

```cpp
#define FIL_RUNOUT_STATE HIGH
```

Non impostare lo stato osservando soltanto il LED del modulo. Verificare il valore logico letto da Marlin.

## Pull-up e pull-down

Per un contatto che chiude verso massa e comune usare una pull-up:

```cpp
#define FIL_RUNOUT_PULLUP
```

Per hardware che richiede una pull-down:

```cpp
//#define FIL_RUNOUT_PULLDOWN
```

Va attivata una sola polarizzazione compatibile. Un modulo con uscita gia pilotata puo non richiedere la resistenza interna.

Sintomi di un ingresso flottante:

- stato che cambia senza toccare il sensore;
- falsi runout quando si muovono motori o ventole;
- sensibilita alla posizione del cavo;
- comportamento diverso con USB collegata.

Il firmware non sostituisce schermatura, cablaggio corretto e riferimento di massa stabile.

## Verifica dello stato

Con il filamento presente:

```gcode
M119
```

Poi rimuovere o azionare manualmente il filamento e ripetere:

```gcode
M119
```

La voce del sensore deve cambiare in modo stabile. Non avviare ancora una stampa e non usare `M600` per correggere una polarita sbagliata.

Stato della funzione runout:

```gcode
M412
```

Abilitare:

```gcode
M412 S1
```

Disabilitare temporaneamente:

```gcode
M412 S0
```

Per rendere persistente lo stato, se EEPROM e attiva:

```gcode
M500
```

## Quando Marlin considera attivo un job

Il commento della release specifica che il runout viene gestito soltanto quando Marlin sa che una stampa e in corso.

Condizioni previste:

1. stampa da supporto avviata con `M24`;
2. Print Job Timer avviato con `M75`;
3. heater avviati con `PRINTJOB_TIMER_AUTOSTART` attivo.

Una stampa inviata da un host puo quindi richiedere:

- supporto corretto del timer;
- `M75` nello start G-code;
- gestione runout lato host.

Se il sensore cambia stato ma non accade nulla durante lo streaming, controllare prima lo stato del job e il ruolo dell'host.

## Numero di sensori

```cpp
#define NUM_RUNOUT_SENSORS 1
```

La release supporta fino a un sensore per estrusore, con il relativo pin. Per sensori con logiche diverse sono disponibili override individuali:

```cpp
//#define FIL_RUNOUT1_STATE LOW
//#define FIL_RUNOUT1_PULLUP
//#define FIL_RUNOUT1_PULLDOWN
```

e opzioni analoghe per gli altri ingressi.

Normalmente Marlin osserva il sensore associato all'estrusore attivo. Per reagire a qualunque sensore:

```cpp
//#define WATCH_ALL_RUNOUT_SENSORS
```

E automaticamente attivo per alcuni mixing extruder, come indicato nel sorgente.

Con piu tool, lo script puo usare `%c`:

```cpp
#define FILAMENT_RUNOUT_SCRIPT "M600 T%c"
```

Il placeholder viene sostituito con il tool corrente. Va verificato che la cinematica di cambio e la procedura `M600` gestiscano correttamente quel tool.

## Distanza residua

Per un sensore posto prima di un tubo Bowden:

```cpp
//#define FILAMENT_RUNOUT_DISTANCE_MM 25
```

Dopo il rilevamento, Marlin continua a contare l'estrusione prima di eseguire lo script. Questo permette di sfruttare il materiale ancora presente tra sensore e ingranaggi.

Il valore deve essere inferiore alla distanza realmente utilizzabile. Se troppo alto:

- il filamento puo uscire dagli ingranaggi;
- la procedura automatica puo non riuscire a scaricarlo;
- l'ugello puo stampare senza materiale.

Se troppo basso, una parte di filamento resta nel percorso e deve essere rimossa durante il cambio.

Con la macro compilata, modificare la distanza a runtime:

```gcode
M412 D25
```

Verificare:

```gcode
M412
```

Salvare soltanto dopo il collaudo:

```gcode
M500
```

## Sensore di movimento

Richiede prima la distanza:

```cpp
#define FILAMENT_RUNOUT_DISTANCE_MM 25
```

Poi:

```cpp
//#define FILAMENT_MOTION_SENSOR
```

Per abilitarlo:

```cpp
#define FILAMENT_MOTION_SENSOR
```

In questa modalita il pin deve commutare mentre il filamento avanza. La distanza stabilisce quanta estrusione comandata puo avvenire senza un impulso valido.

Valore troppo basso:

- falsi positivi durante movimenti lenti;
- sensibilita a gioco e risoluzione;
- pause durante retrazioni o ripartenze.

Valore troppo alto:

- rilevamento tardivo;
- piu materiale mancante prima della pausa.

La taratura va eseguita con velocita, accelerazioni e retrazioni realistiche.

## Script di runout

Il default della release:

```cpp
#define FILAMENT_RUNOUT_SCRIPT "M600"
```

richiede la funzione Advanced Pause:

```cpp
//#define ADVANCED_PAUSE_FEATURE
```

e, per il parcheggio:

```cpp
//#define NOZZLE_PARK_FEATURE
```

Il punto di parcheggio deve:

- essere raggiungibile;
- evitare il pezzo e le clip;
- lasciare spazio per cambiare filamento;
- mantenere Z entro i limiti;
- non attraversare zone occupate.

La macchina deve anche avere un canale di interazione:

- display;
- `HOST_PROMPT_SUPPORT`;
- oppure meccanismo previsto tramite `EMERGENCY_PARSER`.

Senza un'interazione funzionante la stampante puo entrare in pausa senza offrire un percorso affidabile per riprendere.

## Parametri principali di Advanced Pause

Il blocco in `Configuration_adv.h` controlla:

| Gruppo | Direttive principali |
|---|---|
| retrazione iniziale | `PAUSE_PARK_RETRACT_FEEDRATE`, `PAUSE_PARK_RETRACT_LENGTH` |
| scarico | `FILAMENT_CHANGE_UNLOAD_FEEDRATE`, `FILAMENT_CHANGE_UNLOAD_LENGTH` |
| caricamento | `FILAMENT_CHANGE_SLOW_LOAD_*`, `FILAMENT_CHANGE_FAST_LOAD_*` |
| spurgo | `ADVANCED_PAUSE_PURGE_FEEDRATE`, `ADVANCED_PAUSE_PURGE_LENGTH` |
| sicurezza termica | `PAUSE_PARK_NOZZLE_TIMEOUT` |
| segnalazione | `FILAMENT_CHANGE_ALERT_BEEPS` |
| mantenimento posizione | `PAUSE_PARK_NO_STEPPER_TIMEOUT` |

I valori del file sono esempi generali. La lunghezza di unload per Bowden dipende dal percorso reale, mentre su direct drive e molto piu corta.

Una lunghezza eccessiva puo:

- estrarre materiale caldo nella zona fredda;
- far uscire il filamento dagli ingranaggi in modo incontrollato;
- urtare il fine del percorso;
- allungare inutilmente la pausa.

Una lunghezza insufficiente lascia materiale fuso o ingaggiato.

## Timeout dell'hotend

```cpp
#define PAUSE_PARK_NOZZLE_TIMEOUT 45
```

Dopo il timeout Marlin spegne l'hotend per sicurezza. Alla ripresa puo essere necessaria una nuova attesa di riscaldamento.

Non aumentare il timeout soltanto per evitare il reheating. Una pausa utente puo durare molto piu del previsto.

## Mantenere gli assi

```cpp
#define PAUSE_PARK_NO_STEPPER_TIMEOUT
```

Mantiene alimentati gli stepper XYZ durante il cambio.

Vantaggio:

- riduce il rischio che gantry o piano perdano posizione.

Rischi:

- motori e driver restano caldi;
- un urto manuale puo comunque spostare la meccanica;
- un'interruzione di alimentazione annulla il mantenimento.

La scelta va verificata soprattutto su assi Z che possono scendere per gravita.

## Gestione lato host

Con `HOST_ACTION_COMMANDS`, `M412` puo delegare il runout:

```gcode
M412 H1
```

In questa modalita lo script locale non viene applicato. L'host deve:

1. ricevere l'evento;
2. mettere in pausa il job;
3. parcheggiare in modo sicuro;
4. guidare il cambio;
5. riprendere il flusso.

Delegare senza configurare l'host puo lasciare la stampa in corso senza materiale.

Per tornare alla gestione firmware:

```gcode
M412 H0
```

## Collaudo del runout

### Test elettrico

Usare `M119` con sensore presente e assente. Lo stato deve essere stabile.

### Test della funzione

```gcode
M412
```

Verificare che il runout sia attivo.

### Test della procedura di cambio

Eseguire manualmente `M600` con:

- hotend alla temperatura del materiale;
- assi referenziati;
- punto di parcheggio libero;
- utente presente;
- interruttore accessibile.

```gcode
M600
```

Controllare unload, timeout, richiesta utente, load, purge e ritorno.

### Test durante una stampa breve

Usare un file sacrificabile, simulare il runout e verificare:

- riconoscimento del job;
- distanza residua;
- arresto dell'estrusione;
- parcheggio;
- ripresa senza spostamento del pezzo.

Non usare una stampa lunga come primo test.

## Diagnostica del runout

| Sintomo | Controllo |
|---|---|
| sempre in runout | `FIL_RUNOUT_STATE`, cablaggio, pull-up o pull-down |
| stato instabile | ingresso flottante, rumore, massa, cavo |
| cambia in `M119` ma non pausa | job non riconosciuto, `M412 S0`, host handling |
| pausa immediata all'avvio | polarita invertita o sensore vuoto |
| motion sensor con falsi allarmi | distanza troppo bassa, impulsi, attrito |
| non rileva slittamento | distanza troppo alta o encoder non commuta |
| `M600` sconosciuto | `ADVANCED_PAUSE_FEATURE` assente |
| pausa senza richiesta utente | display o host prompt non configurato |
| ripresa fuori posizione | motori disabilitati, urto, park errato |

## Power-loss recovery

In `Configuration_adv.h`, dentro il blocco `SDSUPPORT`:

```cpp
//#define POWER_LOSS_RECOVERY
```

Per abilitarlo:

```cpp
#define POWER_LOSS_RECOVERY
```

La documentazione Marlin richiede una stampa da supporto e un controller LCD per presentare la scelta di ripresa. Il display e la UI devono quindi essere collaudati prima di affidarsi al recovery.

Il valore predefinito runtime:

```cpp
#define PLR_ENABLED_DEFAULT false
```

La funzione viene quindi compilata ma inizialmente resta disabilitata.

## Controllo con `M413`

Report:

```gcode
M413
```

Abilitare:

```gcode
M413 S1
```

Disabilitare:

```gcode
M413 S0
```

Salvare lo stato:

```gcode
M500
```

`M413` e disponibile solo quando `POWER_LOSS_RECOVERY` e compilato.

## Sorgente della stampa

La documentazione della funzione richiede una stampa da:

- scheda SD;
- flash drive gestito come volume Marlin.

Durante una stampa inviata in streaming via seriale e l'host a possedere il file e la posizione del flusso. Marlin PLR non sostituisce il recupero specifico dell'host.

## Salvataggio periodico senza pin

Senza un sensore di power loss, Marlin salva periodicamente lo stato. Il blocco usa:

```cpp
#define POWER_LOSS_MIN_Z_CHANGE 0.05
```

Il valore limita la scrittura in base alla variazione Z.

Valore basso:

- recovery piu vicino all'interruzione;
- piu scritture sul supporto.

Valore alto:

- meno scritture;
- ripetizione maggiore dopo il riavvio;
- impossibilita di recuperare correttamente alcune stampe con piccoli cambi Z o vase mode.

## Rilevamento dedicato

Per un circuito che segnala la perdita:

```cpp
//#define POWER_LOSS_PIN 44
//#define POWER_LOSS_STATE HIGH
//#define POWER_LOSS_PULLUP
//#define POWER_LOSS_PULLDOWN
```

Il pin di esempio non e universale. Occorre verificare:

- pin disponibile;
- livello logico massimo;
- polarita;
- tempo tra segnale e collasso delle alimentazioni;
- pull-up o pull-down;
- isolamento del circuito.

Con un pin dedicato Marlin puo salvare al momento dell'evento, riducendo le scritture periodiche. Il circuito deve fornire un preavviso sufficiente.

## Alimentazione di backup

```cpp
//#define BACKUP_POWER_SUPPLY
```

Indica che resta energia per operazioni aggiuntive dopo il rilevamento.

Opzioni correlate:

```cpp
//#define POWER_LOSS_ZRAISE 2
//#define POWER_LOSS_PURGE_LEN 20
//#define POWER_LOSS_RETRACT_LEN 10
```

Queste azioni richiedono energia reale per:

- MCU;
- driver;
- motori;
- eventuale estrusore.

Una configurazione firmware non crea la riserva energetica. Capacita, UPS o modulo devono essere dimensionati e verificati elettricamente.

Se l'energia termina durante il movimento, la posizione salvata puo non corrispondere alla posizione fisica.

## Homing Z durante il recupero

```cpp
//#define POWER_LOSS_RECOVER_ZHOME
```

Il commento della release indica che nella quasi totalita dei casi dovrebbe restare disabilitato.

Fare homing Z con un oggetto sul piano puo:

- urtare il pezzo;
- portare la probe fuori area;
- schiacciare l'ugello contro la stampa;
- produrre un riferimento diverso.

Se una macchina richiede realmente Z homing, occorre definire un punto XY libero:

```cpp
//#define POWER_LOSS_ZHOME_POS { 0, 0 }
```

Il punto deve essere dimostrato sicuro per ogni possibile dimensione del pezzo.

## Limiti fisici della ripresa

Prima di accettare il recovery verificare:

- il pezzo e ancora aderente;
- il piano non si e raffreddato causando distacco;
- gli assi non sono stati spostati;
- il gantry non e sceso;
- l'ugello non e incollato al pezzo;
- non c'e materiale carbonizzato o una colatura;
- la scheda contiene lo stesso file;
- la stampante non ha subito un errore elettrico.

Il recovery dopo un blackout non certifica la sicurezza della causa che ha interrotto la stampa.

## Collaudo del power-loss recovery

1. Verificare prima una stampa SD normale.
2. Controllare `M413`.
3. Usare un modello piccolo e sacrificabile.
4. Osservare la creazione e rimozione dei dati di recovery.
5. Interrompere l'alimentazione soltanto tramite un dispositivo previsto e sicuro.
6. Non aprire alimentatori o lavorare su conduttori di rete esposti.
7. Riaccendere senza spostare la meccanica.
8. Controllare lo stato fisico prima di accettare Resume.
9. Sorvegliare riscaldamento, homing eventuale e riposizionamento.
10. Verificare la qualita nel punto di ripresa.

Una prova riuscita una volta non copre tutte le altezze, geometrie e durate di blackout.

## Diagnostica del power-loss recovery

| Sintomo | Controllo |
|---|---|
| `M413` sconosciuto | funzione non compilata |
| stato torna OFF | `PLR_ENABLED_DEFAULT`, EEPROM, `M500` |
| nessuna proposta di ripresa | sorgente non SD, file recovery assente o invalido |
| supporto si corrompe | alimentazione, scritture, rimozione, filesystem |
| riprende troppo indietro | soglia Z o salvataggio periodico |
| Z non coincide | assi mossi, gantry sceso, perdita passi |
| collisione al resume | homing o percorso non sicuri |
| ripresa con materiale mancante | purge, retrazione, hotend e percorso filamento |

## Errori comuni

- Configurare `FIL_RUNOUT_STATE` in base al colore dei fili.
- Provare direttamente durante una stampa lunga.
- Usare `M600` senza Advanced Pause e punto di park.
- Delegare il runout all'host senza configurarne la reazione.
- Confondere sensore di presenza e sensore di movimento.
- Impostare una distanza residua maggiore del percorso utile.
- Credere che PLR funzioni allo stesso modo durante lo streaming seriale.
- Abilitare Z homing al recovery senza uno spazio sempre libero.
- Supporre che una UPS garantisca energia sufficiente ai motori.
- Riprendere senza controllare adesione e posizione fisica.

## Checklist

- [ ] Pin, tensione, polarita e pull del sensore sono verificati.
- [ ] `M119` cambia stabilmente tra filamento presente e assente.
- [ ] `M412` riporta lo stato previsto.
- [ ] Marlin riconosce correttamente il job in corso.
- [ ] `M600`, park, unload, load e purge sono stati collaudati.
- [ ] L'interazione tramite display o host funziona.
- [ ] Il supporto di stampa e scrivibile e affidabile.
- [ ] `M413` persiste dopo riavvio.
- [ ] Il circuito di power-loss fornisce livelli e tempi corretti.
- [ ] La procedura di ripresa e stata provata su un file sacrificabile.

## Riferimenti

- [Marlin 2.1.2.8 - Configuration.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Marlin 2.1.2.8 - Configuration_adv.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Marlin - M412 Filament Runout](https://marlinfw.org/docs/gcode/M412.html)
- [Marlin - M600 Filament Change](https://marlinfw.org/docs/gcode/M600.html)
- [Marlin - M413 Power-loss Recovery](https://marlinfw.org/docs/gcode/M413.html)

## Collegamenti

- [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento|Hotend estrusori e filamento]]
- [[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile|Limiti di estrusione retrazione e cambio utensile]]
- [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni|EEPROM scheda SD e salvataggio delle impostazioni]]
- [[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen|Display controller encoder e touchscreen]]
- [[Stampante 3D/Marlin/Pagine/Alimentatore rele LED luci buzzer e servo|Alimentatore rele LED luci buzzer e servo]]


## Navigazione

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
