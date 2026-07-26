---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [marlin, estrusione, retrazione, toolchange, sicurezza]
aliases: [Retract Marlin, Cambio utensile Marlin, Limiti estrusione Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento]]"
  - "[[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Linear Advance Input Shaping e compensazioni geometriche]]"
marlin-version: "2.1.2.8"
---

# Limiti di estrusione, retrazione e cambio utensile

## Sintesi

Marlin applica tre gruppi di controlli distinti:

| Gruppo | Scopo |
|---|---|
| Sicurezza estrusione | bloccare movimento E a freddo o comandi singoli eccessivi |
| Retract / recover | ridurre la pressione prima dei travel e ripristinarla dopo |
| Tool change | selezionare, parcheggiare, scaricare e preparare un utensile |

Queste funzioni non devono essere confuse. La retrazione di stampa e breve e frequente; lo scarico per un cambio filamento puo attraversare tutto il percorso Bowden; un cambio utensile puo includere movimenti XYZ, servo, temperatura e spurgo.

## Protezione contro l'estrusione a freddo

In `Configuration.h`:

```cpp
#define PREVENT_COLD_EXTRUSION
#define EXTRUDE_MINTEMP 170
```

Marlin rifiuta i movimenti E quando la temperatura dell'hotend attivo e inferiore alla soglia. Questo evita che il motore:

- macini il filamento;
- perda passi;
- deformi il sistema di trascinamento;
- spinga materiale solido contro la zona fredda;
- danneggi un hotend ostruito.

La soglia deve essere compatibile con il materiale meno caldo che verra estruso, ma non va abbassata per nascondere un sensore errato o un hotend che non raggiunge la temperatura.

Leggere lo stato:

```gcode
M302
```

Impostare la soglia a 170 °C mantenendo il controllo:

```gcode
M302 S170 P0
```

Consentire temporaneamente l'estrusione a qualunque temperatura:

```gcode
M302 P1
```

Riattivare il controllo:

```gcode
M302 P0
```

`P1` disabilita il controllo: non significa "protezione attiva". Anche `M302 S0` consente sempre l'estrusione. Queste modalita sono adatte soltanto a test consapevoli, per esempio verificare il verso del motore senza filamento inserito.

## Protezione contro estrusioni troppo lunghe

```cpp
#define PREVENT_LENGTHY_EXTRUDE
#define EXTRUDE_MAXLENGTH 200
```

La protezione blocca una **singola** estrusione piu lunga del limite. Non e un contatore del materiale totale usato dalla stampa.

Il valore deve essere:

- abbastanza basso da intercettare comandi E palesemente errati;
- abbastanza alto da consentire le procedure previste;
- maggiore della lunghezza richiesta per carico e scarico su un Bowden lungo, se tali operazioni sono inviate come un unico comando.

Un errore tipico e passare da estrusione assoluta a relativa, o viceversa, senza reimpostare la coordinata E. Un comando che lo slicer considera normale puo diventare un movimento enorme. La protezione riduce il danno, ma non corregge il G-code.

## Posizionamento dell'asse E

Estrusione assoluta:

```gcode
M82
```

Estrusione relativa:

```gcode
M83
```

Azzerare la coordinata logica E:

```gcode
G92 E0
```

Lo slicer deve dichiarare esplicitamente la modalita utilizzata. Script iniziali, cambio filamento e macro devono ripristinare lo stato atteso. Una macro che usa `M83` e non ripristina `M82` puo alterare il resto della stampa.

## Retract nello slicer o nel firmware

Esistono due strategie:

### Retract generato dallo slicer

Lo slicer emette movimenti E espliciti. Vantaggi:

- parametri visibili nel profilo;
- impostazioni per materiale e oggetto;
- compatibilita ampia;
- controllo diretto sul G-code.

### Firmware Retract

Marlin riceve:

```gcode
G10
```

per retrarre e:

```gcode
G11
```

per recuperare. I parametri sono conservati nel firmware e possono essere regolati senza rigenerare il file.

Per abilitarlo:

```cpp
//#define FWRETRACT
```

Le due strategie non vanno sommate. Se lo slicer emette gia un movimento E di retrazione e aggiunge anche `G10`, il filamento viene retratto due volte.

## Parametri Firmware Retract

Valori iniziali in `Configuration_adv.h`:

```cpp
#define RETRACT_LENGTH 3
#define RETRACT_LENGTH_SWAP 13
#define RETRACT_FEEDRATE 45
#define RETRACT_ZRAISE 0
#define RETRACT_RECOVER_LENGTH 0
#define RETRACT_RECOVER_LENGTH_SWAP 0
#define RETRACT_RECOVER_FEEDRATE 8
#define RETRACT_RECOVER_FEEDRATE_SWAP 8
```

- `RETRACT_LENGTH`: lunghezza della retrazione normale.
- `RETRACT_LENGTH_SWAP`: lunghezza usata nel cambio tool.
- `RETRACT_FEEDRATE`: velocita di retrazione in mm/s nel file di configurazione.
- `RETRACT_ZRAISE`: sollevamento Z associato.
- `RETRACT_RECOVER_LENGTH`: lunghezza aggiuntiva oltre a quella retratta.
- `RETRACT_RECOVER_*_SWAP`: valori di recupero dopo cambio tool.

I valori runtime di `M207` e `M208` usano feedrate in unita al minuto, normalmente mm/min.

Leggere la retrazione:

```gcode
M207
```

Impostare 0,8 mm a 35 mm/s, cioe 2100 mm/min:

```gcode
M207 S0.8 F2100
```

Aggiungere Z-hop da 0,2 mm:

```gcode
M207 Z0.2
```

Leggere il recover:

```gcode
M208
```

Impostare recupero aggiuntivo di 0,1 mm a 30 mm/s:

```gcode
M208 S0.1 F1800
```

Il parametro aggiuntivo non e la lunghezza totale: con retract da 0,8 mm e `M208 S0.1`, il recover totale e 0,9 mm.

Per i cambi tool, `M207 W...` e `M208 W... R...` regolano i valori swap.

## Auto-retract

```cpp
#define FWRETRACT_AUTORETRACT
```

Con auto-retract, Marlin puo riconoscere movimenti `G1 E...` entro un intervallo e convertirli in retract/recover firmware:

```cpp
#define MIN_AUTORETRACT 0.1
#define MAX_AUTORETRACT 10.0
```

Abilitare:

```gcode
M209 S1
```

Disabilitare:

```gcode
M209 S0
```

Il commento della release richiede di disabilitare auto-retract durante il cambio filamento. In caso contrario, i movimenti di carico e scarico possono essere interpretati come retrazioni automatiche anziche come estrusioni lineari previste.

L'auto-rilevamento e utile con G-code esistente che usa retract E espliciti, ma rende meno immediata la lettura del file. Va testato con la modalita E dello slicer e con tutte le macro.

## Taratura della retrazione

La retrazione riduce la pressione, non aspira il materiale gia depositato. Parametri eccessivi possono:

- trascinare materiale fuso nella heatbreak;
- causare heat creep o intasamenti;
- macinare il filamento;
- ritardare la ripresa dell'estrusione;
- creare vuoti all'inizio dei perimetri.

Procedura:

1. verificare temperatura, filamento asciutto e portata;
2. disabilitare una delle due strategie di retract;
3. iniziare con lunghezza prudente;
4. variare una sola grandezza alla volta;
5. provare prima la lunghezza;
6. regolare la velocita senza superare i limiti del motore;
7. aggiungere recover extra soltanto se l'inizio linea resta povero;
8. usare Z-hop solo quando evita collisioni reali;
9. ripetere con travel e temperature rappresentativi;
10. salvare il valore per lo specifico percorso di estrusione.

Direct drive e Bowden hanno elasticita differente. La lunghezza non va copiata in base alla sola categoria: dipende da tubo, hotend, materiale e temperatura.

## Selezione del tool

Selezionare T0:

```gcode
T0
```

Selezionare T1:

```gcode
T1
```

Il comando puo produrre piu azioni della sola selezione logica:

- retract del tool uscente;
- Z raise;
- ritorno o parcheggio;
- movimento di servo o docking;
- applicazione dell'offset;
- ripristino di temperatura e ventola;
- prime del tool entrante;
- ritorno alla posizione precedente.

La sequenza effettiva dipende dall'architettura configurata.

## Impostazioni universali di tool change

Per sistemi multi-estrusore, `Configuration_adv.h` include:

```cpp
#define TOOLCHANGE_ZRAISE 2
```

Il sollevamento riduce il rischio di trascinare l'ugello sul pezzo. Deve rimanere entro la corsa Z disponibile.

```cpp
//#define TOOLCHANGE_ZRAISE_BEFORE_RETRACT
```

sposta il sollevamento prima della retrazione swap.

```cpp
//#define TOOLCHANGE_NO_RETURN
```

impedisce il ritorno alla posizione precedente dopo il cambio. E una modifica sostanziale della semantica del comando `T`: gli script devono gestire esplicitamente la posizione successiva.

## Parcheggio durante il cambio

Per sistemi che non possiedono gia una procedura specifica di parcheggio:

```cpp
//#define TOOLCHANGE_PARK
```

Esempio strutturale:

```cpp
#define TOOLCHANGE_PARK_XY { X_MIN_POS + 10, Y_MIN_POS + 10 }
#define TOOLCHANGE_PARK_XY_FEEDRATE 6000
```

La posizione deve essere:

- raggiungibile dopo homing;
- esterna al pezzo quando possibile;
- compatibile con clip, purge bucket e spazzole;
- sicura con tutti gli offset;
- valida anche vicino al limite Z.

`TOOLCHANGE_PARK` non si applica alle architetture che implementano gia il proprio parcheggio, come switching toolhead, dual X carriage o parking extruder.

## Scarico e prime al cambio tool

```cpp
//#define TOOLCHANGE_FILAMENT_SWAP
```

Parametri principali:

```cpp
#define TOOLCHANGE_FS_LENGTH 12
#define TOOLCHANGE_FS_EXTRA_RESUME_LENGTH 0
#define TOOLCHANGE_FS_RETRACT_SPEED (50*60)
#define TOOLCHANGE_FS_UNRETRACT_SPEED (25*60)
#define TOOLCHANGE_FS_EXTRA_PRIME 0
#define TOOLCHANGE_FS_PRIME_SPEED (4.6*60)
#define TOOLCHANGE_FS_WIPE_RETRACT 0
```

Qui le velocita sono espresse in mm/min. Il percorso single-nozzle o Bowden puo richiedere caricamento piu lento del semplice retract.

Leggere i parametri attivi:

```gcode
M217
```

Impostare la lunghezza swap:

```gcode
M217 S12
```

Impostare l'extra resume:

```gcode
M217 B0.5
```

Impostare Z raise:

```gcode
M217 Z2
```

`M217` espone parametri diversi in base alle feature compilate. Un parametro documentato ma escluso dalla build non produce la funzione mancante.

L'opzione:

```cpp
//#define TOOLCHANGE_FS_PRIME_FIRST_USED
```

permette di effettuare il primo prime anche sul tool iniziale. La release suggerisce che `M217 V1` possa abilitarlo prima della stampa, evitando prime inattesi quando un host invia `T0` alla connessione.

## Migrazione tra tool

Con `TOOLCHANGE_FILAMENT_SWAP`:

```cpp
#define TOOLCHANGE_MIGRATION_FEATURE
```

aggiunge funzioni per spostare una stampa su un tool compatibile, per esempio dopo fine filamento o inceppamento. Gli utensili devono essere abbastanza equivalenti per geometria, materiale, temperatura e offset.

La migrazione non rende intercambiabili due ugelli con diametro diverso o due materiali incompatibili con lo stesso G-code.

## Eventi e sensori utensile

Marlin permette G-code associato a specifici cambi:

```cpp
//#define EVENT_GCODE_TOOLCHANGE_T0 "G28 A\nG1 A0"
//#define EVENT_GCODE_TOOLCHANGE_T1 "G1 A10"
```

Queste stringhe possono comandare un asse o un meccanismo personalizzato. Vanno trattate come codice macchina critico: un homing o movimento inserito qui viene eseguito ogni volta che si presenta la condizione prevista.

```cpp
//#define EVENT_GCODE_TOOLCHANGE_ALWAYS_RUN
```

forza l'esecuzione anche quando il tool richiesto e gia attivo. Va abilitata soltanto se la ripetizione e sicura e idempotente.

```cpp
//#define TOOL_SENSOR
```

usa ingressi dedicati per rilevare utensili agganciati o rilasciati. Il sensore deve essere verificato sia nello stato presente sia assente prima di consentire movimenti automatici.

## Cambio filamento con Advanced Pause

Il cambio manuale durante una stampa e una funzione distinta dal cambio tool:

```cpp
//#define ADVANCED_PAUSE_FEATURE
```

Abilita `M600`. Per parcheggiare serve `NOZZLE_PARK_FEATURE`; per interagire con l'utente serve un display, `HOST_PROMPT_SUPPORT` oppure `EMERGENCY_PARSER`.

Avviare il cambio:

```gcode
M600
```

La procedura puo:

1. retrarre;
2. parcheggiare;
3. scaricare il filamento;
4. attendere l'utente;
5. caricare;
6. spurgare;
7. ripristinare la temperatura;
8. tornare alla stampa.

Le lunghezze di unload e load devono coprire il percorso reale. Nel Bowden possono essere molto maggiori rispetto a un direct drive.

Per aggiungere comandi dedicati:

```cpp
//#define FILAMENT_LOAD_UNLOAD_GCODES
```

Caricare:

```gcode
M701
```

Scaricare:

```gcode
M702
```

`PAUSE_PARK_NOZZLE_TIMEOUT` spegne l'hotend dopo il timeout configurato. La ripresa deve gestire il nuovo riscaldamento senza spingere materiale a freddo.

## Prevenzione del ristagno

```cpp
//#define EXTRUDER_RUNOUT_PREVENT
```

Questa funzione estrude periodicamente una piccola quantita quando la macchina e inattiva e sopra una temperatura minima. Non e un sensore di fine filamento e non previene l'esaurimento della bobina: tenta di evitare il ristagno del materiale caldo.

Parametri:

```cpp
#define EXTRUDER_RUNOUT_MINTEMP 190
#define EXTRUDER_RUNOUT_SECONDS 30
#define EXTRUDER_RUNOUT_SPEED 1500
#define EXTRUDER_RUNOUT_EXTRUDE 5
```

Puo produrre materiale indesiderato, aumentare la pressione o interferire con una pausa. Va abilitata soltanto quando il comportamento e necessario e lo spazio di spurgo e controllato.

## Persistenza

Le impostazioni di `M207`, `M208`, `M209` e `M217` possono essere conservate in EEPROM.

Controllare:

```gcode
M503
```

Salvare:

```gcode
M500
```

Dopo aver cambiato i default compilati, i valori precedentemente salvati possono continuare a prevalere. Per caricare i nuovi default:

```gcode
M502
```

Poi, dopo la verifica:

```gcode
M500
```

## Errori comuni

- **Disabilitare stabilmente `PREVENT_COLD_EXTRUSION`:** elimina una protezione meccanica importante.
- **Interpretare `M302 P1` come protezione attiva:** il significato e opposto.
- **Impostare `EXTRUDE_MAXLENGTH` sotto la lunghezza Bowden:** carico e scarico vengono rifiutati.
- **Usare modalita E incoerenti tra slicer e macro:** compaiono estrusioni molto lunghe o insufficienti.
- **Attivare retract nello slicer e nel firmware:** la retrazione viene duplicata.
- **Confondere mm/s e mm/min:** i valori runtime risultano 60 volte diversi.
- **Usare recover extra come lunghezza totale:** si sovraestrude alla ripresa.
- **Lasciare auto-retract attivo durante il cambio filamento:** i movimenti E possono essere reinterpretati.
- **Copiare una retrazione Bowden su direct drive:** aumenta il rischio di intasamento.
- **Usare troppo Z-hop:** allunga i tempi e puo raggiungere il limite Z.
- **Provare un tool changer a velocita piena:** un offset o docking errato causa collisioni.
- **Ripetere eventi tool-change non idempotenti:** il meccanismo puo muoversi oltre la posizione prevista.
- **Considerare equivalenti tool diversi durante la migrazione:** geometria e portata possono non corrispondere.

## Checklist

- `PREVENT_COLD_EXTRUSION` e attiva.
- La soglia minima e compatibile con i materiali previsti.
- `EXTRUDE_MAXLENGTH` consente carico e scarico reali.
- Slicer, start G-code e macro usano la stessa modalita E.
- E stata scelta una sola strategia di retrazione.
- Lunghezza, velocita e recover sono stati tarati separatamente.
- Le unita mm/s e mm/min sono state convertite correttamente.
- Auto-retract viene disabilitato durante il cambio filamento.
- Lo Z raise resta entro la corsa disponibile.
- La posizione di parcheggio e stata provata a bassa velocita.
- Retract swap, unload e prime coprono il percorso senza eccessi.
- Offset e temperatura di ogni tool sono verificati.
- Eventi personalizzati sono sicuri anche se ripetuti.
- I sensori utensile rilevano correttamente presenza e assenza.
- `M600`, `M701` e `M702` sono stati provati prima di usarli in stampa.
- I valori EEPROM corrispondono alla configurazione documentata.

## Fonti

- [Configuration.h 2.1.2.8 - Extrusion safety](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Firmware Retract, Tool Change and Advanced Pause](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M302 - Cold Extrude](https://marlinfw.org/docs/gcode/M302.html)
- [Firmware Retract](https://marlinfw.org/docs/features/fwretract.html)
- [M207 - Firmware Retraction Settings](https://marlinfw.org/docs/gcode/M207.html)
- [M208 - Firmware Recover Settings](https://marlinfw.org/docs/gcode/M208.html)
- [M209 - Set Auto Retract](https://marlinfw.org/docs/gcode/M209.html)
- [M217 - Filament Swap Parameters](https://marlinfw.org/docs/gcode/M217.html)
- [M600 - Filament Change](https://marlinfw.org/docs/gcode/M600.html)
- [T0-T7 - Select or Report Tool](https://marlinfw.org/docs/gcode/T001-T002.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento]]
- [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]
- [[Stampante 3D/Marlin/Pagine/Linear Advance Input Shaping e compensazioni geometriche]]
