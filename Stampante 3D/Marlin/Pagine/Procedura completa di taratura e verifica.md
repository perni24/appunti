---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: operational-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - calibration
  - commissioning
  - verification
  - checklist
aliases:
  - Taratura completa Marlin
  - Collaudo Marlin
  - Commissioning stampante 3D
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]"
  - "[[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni]]"
  - "[[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware]]"
marlin-version: 2.1.2.8
title: Procedura completa di taratura e verifica
status: non revisionato
---

# Procedura completa di taratura e verifica

## Obiettivo

Collaudare e tarare in modo progressivo una macchina con Marlin 2.1.2.8, partendo dai controlli che non richiedono movimento o riscaldamento e arrivando alla stampa di verifica.

La procedura serve a:

- evitare che un errore iniziale venga nascosto da compensazioni successive;
- verificare una funzione alla volta;
- distinguere problemi elettrici, meccanici, firmware e slicer;
- registrare valori e risultati prima di salvarli in EEPROM;
- ottenere una configurazione riproducibile nei file sorgente.

Non esiste un insieme universale di valori ottimali. Correnti, temperature, velocita, accelerazioni, offset e compensazioni dipendono dall'hardware e devono essere misurati sulla macchina reale.

## Quando usarlo

- Alla prima messa in servizio.
- Dopo la sostituzione della scheda, dei driver o di un motore.
- Dopo modifiche a cinematica, trasmissioni, hotend, estrusore, probe o piatto.
- Dopo la migrazione a una nuova versione di Marlin.
- Quando piu problemi sembrano sovrapporsi e occorre ristabilire una base nota.
- Prima di aumentare velocita o abilitare compensazioni avanzate.

## Principi di sicurezza

- Tenere accessibile l'interruttore generale.
- Non lavorare sui cablaggi con la macchina alimentata.
- Non eseguire homing prima di aver verificato verso dei motori ed endstop.
- Non riscaldare un canale se il relativo sensore non mostra una temperatura ambiente plausibile.
- Sorvegliare ogni prima attivazione di heater, ventola, rele e alimentatore comandato.
- Non usare una stampa come primo test di movimento o riscaldamento.
- Interrompere il collaudo se compaiono odore, fumo, connettori caldi, rumori meccanici anomali o temperature incoerenti.
- Non disabilitare protezioni termiche, cold extrusion o limiti software per aggirare un errore.

## Risultato atteso

Al termine devono essere verificati:

- identita e configurazione della build;
- alimentazione, messa a terra e cablaggi;
- temperature a riposo e risposta degli heater;
- endstop, probe e sensori accessori;
- direzione, corrente e affidabilita dei motori;
- homing, origine, area utile e limiti;
- geometria meccanica e trasmissioni;
- steps per unita ed estrusore;
- controllo termico e ventole;
- tramming, offset Z e mesh;
- velocita, accelerazioni e compensazioni;
- estrusione, profilo materiale e primo layer;
- persistenza dei valori dopo riavvio;
- comportamento durante una stampa completa.

## Ordine di taratura

L'ordine riduce le dipendenze nascoste:

```text
documentazione e backup
  -> controlli elettrici a macchina spenta
  -> sensori senza movimento
  -> motori e driver
  -> endstop e homing
  -> geometria meccanica
  -> steps per unita
  -> sistema termico
  -> tramming, probe, offset e mesh
  -> limiti dinamici
  -> estrusione e slicer
  -> compensazioni avanzate
  -> accessori e stampa di durata
  -> salvataggio e report finale
```

Se una fase fallisce, correggere il problema prima di proseguire. Una fase successiva non deve essere usata per compensare quella precedente.

## Preparazione

### Strumenti utili

- Multimetro adeguato alle tensioni presenti.
- Calibro e righello affidabile.
- Comparatore, se serve verificare assi e piatto con maggiore precisione.
- Chiavi per pulegge, giunti, ruote e struttura.
- Terminale seriale o host che mostri la risposta completa di Marlin.
- Un file di prova semplice e noto.
- Scheda tecnica di alimentatore, motherboard, driver, motori, heater e sensori.
- Copia dei file `Configuration.h` e `Configuration_adv.h` realmente compilati.

### Registro di collaudo

Annotare almeno:

| Campo | Valore |
|---|---|
| Data | |
| Commit o archivio della configurazione | |
| Versione Marlin | `2.1.2.8` |
| Scheda e processore | |
| Tensione di alimentazione | |
| Cinematica | |
| Driver e microstepping | |
| Motori e trasmissioni | |
| Hotend, heater e sensore | |
| Piatto, heater e sensore | |
| Probe | |
| Materiale e profilo slicer di prova | |

Per ogni modifica registrare:

```text
valore iniziale -> valore provato -> test eseguito -> risultato -> valore accettato
```

## Procedura

### Identificare la build e salvare la base

Collegare l'host senza comandare movimenti o heater.

Leggere l'identita del firmware:

```gcode
M115
```

Leggere i parametri runtime:

```gcode
M503
```

Verificare i dati EEPROM, se il comando e disponibile:

```gcode
M504
```

Conservare l'output completo. Confrontare versione, nome macchina e funzioni dichiarate con i sorgenti usati per la compilazione.

Non eseguire `M502` o `M500` in questa fase: il primo carica i default compilati in RAM, il secondo sovrascrive i dati persistenti.

Criterio di accettazione:

- la build e identificabile;
- non compaiono errori di EEPROM;
- esiste una copia dei valori iniziali e dei sorgenti.

Approfondimento: [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni|EEPROM scheda SD e salvataggio delle impostazioni]].

### Controllare alimentazione e cablaggio a macchina spenta

Verificare:

- tensione selezionata sull'alimentatore;
- polarita e sezione dei cavi;
- serraggio dei morsetti;
- fusibili e protezioni;
- continuita della terra sulle parti metalliche che la richiedono;
- separazione tra rete, potenza e segnali;
- tensione nominale di heater, ventole e altri carichi;
- assenza di fili scoperti e connettori anneriti;
- instradamento dei cavi senza trazione o sfregamento durante tutta la corsa.

Controllare la resistenza degli heater solo a macchina disalimentata e scollegata secondo la procedura adatta all'hardware. Un valore incompatibile con tensione e potenza nominali deve essere risolto prima dell'accensione.

Criterio di accettazione:

- nessun difetto visibile o collegamento ambiguo;
- ogni carico e compatibile con tensione, uscita e stadio di potenza;
- il cablaggio puo seguire i movimenti senza essere tirato.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware|Alimentazione e protezioni hardware]].

### Verificare sensori e ingressi senza muovere la macchina

Accendere la macchina senza abilitare heater.

Leggere le temperature:

```gcode
M105
```

Hotend, piatto e camera devono mostrare valori ambientali plausibili e stabili. Scaldando delicatamente il sensore con una sorgente controllata, la lettura deve aumentare sul canale corretto.

Leggere endstop e probe:

```gcode
M119
```

Ripetere il comando mantenendo attivo un solo endstop:

```gcode
M119
```

Per ciascun ingresso registrare stato libero e stato attivo. Verificare anche probe, sensore di filamento e altri ingressi riportati.

Criterio di accettazione:

- nessuna temperatura e fissa a un estremo o varia senza causa;
- ogni sensore modifica soltanto il proprio canale;
- ogni endstop passa tra `open` e `TRIGGERED` con la logica prevista;
- il probe puo essere attivato manualmente senza collisioni.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Sensori di temperatura e limiti operativi|Sensori di temperatura e limiti operativi]]
- [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing|Endstop homing e Sensorless Homing]]
- [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch|Probe Z offset e BLTouch]]

### Verificare motori e driver a bassa energia

Con assi lontani dai limiti, controllare un asse alla volta con piccoli spostamenti comandati dall'interfaccia. La direzione positiva deve corrispondere al sistema di coordinate definito, non semplicemente al movimento verso destra o verso l'alto osservato da un lato casuale.

Per driver Trinamic compatibili leggere lo stato:

```gcode
M122
```

Controllare:

- motore associato all'asse corretto;
- verso coerente;
- assenza di vibrazione senza rotazione;
- corrente impostata secondo driver e motore;
- microstepping effettivo coerente con gli steps configurati;
- temperatura e diagnostica dei driver durante una prova breve;
- corretta rotazione degli estrusori, senza spingere filamento a freddo.

Non correggere un motore che gira al contrario scambiando fili a caso. Usare una sola strategia documentata: cablaggio delle fasi corretto oppure inversione firmware.

Criterio di accettazione:

- tutti gli assi si muovono nel verso previsto;
- nessun driver riporta guasti;
- i motori non perdono passi durante piccoli movimenti conservativi.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro|Motori direzione e passi per millimetro]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping|Driver stepper corrente e microstepping]]

### Eseguire homing e verificare i limiti

Eseguire l'homing di un solo asse dopo averne verificato direzione ed endstop:

```gcode
G28 X
```

Ripetere per Y:

```gcode
G28 Y
```

Eseguire Z soltanto quando il percorso di nozzle o probe e libero e la logica Z e gia stata controllata:

```gcode
G28 Z
```

Alcune configurazioni con `Z_SAFE_HOMING`, Delta, SCARA o dipendenze cinematiche richiedono una sequenza diversa. In questi casi usare l'homing completo previsto dalla configurazione:

```gcode
G28
```

Durante la prima prova tenersi pronti a togliere alimentazione. Verificare:

- arresto sul sensore corretto;
- secondo contatto lento, se configurato;
- posizione assegnata dopo homing;
- impossibilita di comandare corse oltre i limiti reali;
- raggiungibilita dell'area utile senza urtare telaio, fermagli o cablaggi;
- origine e dimensioni coerenti con lo slicer.

Criterio di accettazione:

- ogni asse completa l'homing senza urti;
- l'origine firmware corrisponde alla geometria reale;
- minimi, massimi e area di stampa sono raggiungibili in sicurezza.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing|Endstop homing e Sensorless Homing]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti|Dimensioni del piatto area di lavoro e limiti]]
- [[Stampante 3D/Marlin/Pagine/Z Safe Homing e allineamento degli assi Z|Z Safe Homing e allineamento degli assi Z]]

### Correggere prima la meccanica

Prima di misurare steps, mesh o compensazioni controllare:

- ortogonalita del telaio;
- parallelismo delle guide;
- tensione uniforme delle cinghie;
- pulegge serrate sull'albero, con grano sul piano quando presente;
- assenza di giochi eccessivi in ruote, carrelli e cuscinetti;
- viti Z pulite, allineate e prive di impuntamenti;
- giunti non usati per sostenere il peso dell'asse;
- portale X parallelo al riferimento meccanico previsto;
- piatto stabile, senza giochi;
- hotend e probe rigidamente fissati;
- nozzle integro e serrato con la procedura corretta per l'hotend.

Una mesh non corregge pulegge lente, perdita di passi, giochi variabili o una struttura che cambia posizione. La compensazione geometrica va applicata soltanto a un errore stabile e misurabile.

Criterio di accettazione:

- lo spostamento e libero lungo tutta la corsa;
- tornando sulla stessa posizione non compaiono giochi o scostamenti anomali;
- la geometria resta stabile dopo piu cicli di movimento.

### Calcolare e verificare gli steps per unita

Leggere i valori correnti:

```gcode
M92
```

#### Assi a cinghia

Calcolo teorico:

```text
steps/mm = (step interi per giro * microstep) / (passo cinghia * denti puleggia)
```

Esempio puramente matematico:

```text
(200 * 16) / (2 mm * 20 denti) = 80 steps/mm
```

#### Assi con vite

Calcolo teorico:

```text
steps/mm = (step interi per giro * microstep) / lead della vite in mm/giro
```

Il `lead` e l'avanzamento per giro, non necessariamente il passo tra due filetti.

#### Verifica metrologica

Misurare una corsa sufficientemente lunga con uno strumento adatto. Se serve correggere un valore gia vicino a quello teorico:

```text
nuovi_steps = steps_attuali * distanza_comandata / distanza_misurata
```

Un errore non proporzionale o diverso tra andata e ritorno indica piu probabilmente gioco, flessione, slittamento o perdita di passi.

Non calibrare X e Y da un cubo stampato come primo metodo: ritiro del materiale, flow, temperatura e larghezza linea alterano la misura. Derivare gli steps dalla trasmissione e verificare il movimento reale.

Impostare in RAM solo il valore misurato, per esempio:

```gcode
M92 X<steps_per_mm>
```

Ripetere la misura prima di salvare.

#### Estrusore

Calibrare l'estrusore separatamente dal flow dello slicer:

1. segnare il filamento;
2. rimuovere la contropressione scollegando il percorso quando la meccanica lo consente, oppure lavorare a temperatura stabile ed estrudere lentamente;
3. comandare una lunghezza nota;
4. misurare la lunghezza realmente trascinata;
5. applicare la stessa formula di correzione;
6. ripetere almeno due volte.

Non forzare filamento attraverso un hotend freddo e non rendere permanente una disabilitazione della protezione cold extrusion.

Impostare il valore E in RAM:

```gcode
M92 E<steps_per_mm>
```

Criterio di accettazione:

- l'errore residuo e ripetibile e compatibile con lo strumento;
- non vi sono differenze anomale tra andata e ritorno;
- l'estrusore trascina la lunghezza richiesta senza slittare.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro|Motori direzione e passi per millimetro]].

### Verificare e tarare il sistema termico

Prima di riscaldare:

- confermare il canale del sensore;
- verificare il tipo di sensore compilato;
- verificare il canale dell'heater;
- identificare ventola hotend e ventola pezzo;
- controllare limiti minimi e massimi;
- assicurarsi che le protezioni termiche siano attive.

Riscaldare un solo canale alla volta, a un target moderato e sotto sorveglianza. La temperatura deve salire sul canale corretto e fermarsi vicino al target senza crescita incontrollata.

Eseguire il PID autotune soltanto se quella zona usa PID. Per l'hotend, sostituire il target con una temperatura rappresentativa dell'uso reale:

```gcode
M303 E0 S<temperatura> C8
```

Per il piatto con `PIDTEMPBED`:

```gcode
M303 E-1 S<temperatura> C8
```

Se l'hotend usa `MPCTEMP`, seguire la procedura MPC invece del PID:

```gcode
M306 T
```

PID e MPC sono controllori alternativi per l'hotend. Non eseguire una procedura scelta solo perche il relativo comando esiste: verificare prima cosa e stato compilato.

Dopo la taratura:

- controllare l'overshoot;
- osservare la stabilita con ventola pezzo spenta e accesa;
- eseguire una permanenza al target;
- verificare che le protezioni intervengano su condizioni realmente anomale, senza provocarle intenzionalmente con procedure pericolose.

Criterio di accettazione:

- ogni heater controlla la zona prevista;
- la temperatura raggiunge e mantiene il target;
- ventole e variazioni di carico non causano instabilita;
- non compaiono errori di heating failed o thermal runaway in condizioni normali.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Controllo PID MPC e protezioni termiche|Controllo PID MPC e protezioni termiche]]
- [[Stampante 3D/Marlin/Pagine/Ventole e raffreddamento|Ventole e raffreddamento]]

### Eseguire tramming, allineamento Z, probe e mesh

L'ordine corretto e:

```text
meccanica stabile
  -> allineamento del portale Z
  -> tramming del piatto
  -> verifica del probe
  -> offset XYZ
  -> mesh
  -> primo layer
```

Pulire nozzle e superficie. Portare la macchina nelle condizioni termiche in cui verra normalmente misurata, tenendo conto dell'espansione.

Se configurato, usare il tramming assistito:

```gcode
G35
```

Verificare la ripetibilita del probe:

```gcode
M48 P10 V2
```

Leggere gli offset correnti:

```gcode
M851
```

Determinare l'offset Z con una procedura controllata. Il babystepping durante il primo layer e una regolazione temporanea: il valore finale deve essere trasferito nell'offset persistente previsto dalla configurazione.

Generare la mesh con il comando adatto al metodo compilato:

```gcode
G29
```

Leggere lo stato del leveling:

```gcode
M420 V
```

Quando si riusa una mesh salvata e il metodo lo supporta, abilitarla esplicitamente:

```gcode
M420 S1
```

Non assumere che `G28`, `G29` e `M420` abbiano lo stesso flusso per ogni metodo. Verificare la sequenza specifica di bilinear, MBL o UBL e lo start G-code dello slicer.

Criterio di accettazione:

- il portale e il piatto sono meccanicamente allineati;
- il probe produce misure ripetibili;
- l'offset Z permette un primo layer uniforme;
- la mesh viene caricata e attivata nel flusso di stampa reale.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Z Safe Homing e allineamento degli assi Z|Z Safe Homing e allineamento degli assi Z]]
- [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch|Probe Z offset e BLTouch]]
- [[Stampante 3D/Marlin/Pagine/Tipi di bed leveling e configurazione della mesh|Tipi di bed leveling e configurazione della mesh]]
- [[Stampante 3D/Marlin/Pagine/Babystepping e regolazioni dinamiche|Babystepping e regolazioni dinamiche]]

### Determinare i limiti di movimento

Partire da valori conservativi e modificare una variabile alla volta.

Leggere il report:

```gcode
M503
```

Impostare temporaneamente la velocita massima di un asse:

```gcode
M203 X<mm_s>
```

Impostare temporaneamente l'accelerazione massima:

```gcode
M201 X<mm_s2>
```

Impostare le accelerazioni operative:

```gcode
M204 P<stampa> T<travel> R<retrazione>
```

Usare `M205` soltanto per i parametri effettivamente abilitati dalla configurazione, distinguendo Classic Jerk da Junction Deviation.

Per ogni incremento:

1. eseguire movimenti lunghi e ripetuti;
2. provare inversioni e curve;
3. verificare rumore, vibrazioni e perdita di posizione;
4. controllare driver e motori;
5. ripetere homing o una misura di posizione;
6. ridurre il valore rispetto al limite appena individuato per ottenere margine operativo.

Il massimo che la macchina raggiunge una volta non e un valore affidabile di esercizio.

Criterio di accettazione:

- nessuna perdita di passi o posizione;
- nessun urto sui limiti;
- temperatura dei componenti compatibile con le specifiche;
- comportamento ripetibile anche su una sequenza prolungata.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Velocita accelerazioni Jerk e Junction Deviation|Velocita accelerazioni Jerk e Junction Deviation]].

### Tarare estrusione e profilo materiale

Procedere nell'ordine:

1. steps dell'estrusore;
2. funzionamento hotend e ventole;
3. temperatura del materiale;
4. flow o extrusion multiplier dello slicer;
5. retrazione;
6. velocita volumetrica sostenibile;
7. Linear Advance;
8. eventuali compensazioni ulteriori.

Gli steps E descrivono il rapporto meccanico dell'estrusore. Il flow descrive il comportamento di materiale, diametro reale, nozzle e profilo di slicing. Non usare gli steps E per correggere ogni materiale.

Controllare:

- diametro reale del filamento;
- nozzle configurato nello slicer;
- larghezza e altezza di linea;
- temperatura e raffreddamento;
- assenza di slittamento o grinding;
- portata che l'hotend riesce realmente a fondere.

Criterio di accettazione:

- estrusione continua e ripetibile;
- pareti e riempimenti non mostrano sovraestrusione o sottoestrusione sistematica;
- retrazione riduce i difetti senza causare inceppamenti;
- il profilo non richiede correzioni firmware arbitrarie.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento|Hotend estrusori e filamento]]
- [[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile|Limiti di estrusione retrazione e cambio utensile]]

### Abilitare le compensazioni avanzate per ultime

Linear Advance, Input Shaping e correzione geometrica devono migliorare una macchina gia funzionante.

Leggere o impostare il fattore Linear Advance:

```gcode
M900
```

Per disabilitare temporaneamente Linear Advance durante un confronto:

```gcode
M900 K0
```

Leggere i parametri dell'Input Shaping integrato:

```gcode
M593
```

Tarare una compensazione alla volta, con un modello di prova adatto e mantenendo invariati materiale, velocita, accelerazione e temperatura.

Non usare:

- Input Shaping per nascondere una cinghia lenta;
- Linear Advance per correggere steps E o flow errati;
- skew correction per compensare un telaio non serrato;
- babystepping come sostituto permanente dell'offset Z.

Criterio di accettazione:

- il test con compensazione attiva e migliore del riferimento;
- il miglioramento e ripetibile;
- la compensazione non introduce nuovi difetti;
- il valore e documentato insieme alle condizioni di prova.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Linear Advance Input Shaping e compensazioni geometriche|Linear Advance Input Shaping e compensazioni geometriche]].

### Verificare interfaccia, supporti e accessori

Provare nell'uso reale:

- display, encoder e touchscreen;
- scheda SD e selezione dello slot;
- ventole automatiche e manuali;
- sensore di fine filamento;
- procedura `M600`, se prevista;
- recovery dopo perdita di alimentazione con una stampa sacrificabile;
- PSU controllato, rele, luci, LED, buzzer e servo;
- arresto o pausa da host e pannello.

Ogni test deve verificare l'intera catena, non solo l'accettazione del comando. Per esempio, il runout e valido soltanto se l'evento viene rilevato durante il job, la macchina entra nello stato previsto e la ripresa produce una stampa utilizzabile.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen|Display controller encoder e touchscreen]]
- [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni|EEPROM scheda SD e salvataggio delle impostazioni]]
- [[Stampante 3D/Marlin/Pagine/Sensore di fine filamento e recupero dopo perdita di alimentazione|Sensore di fine filamento e recupero dopo perdita di alimentazione]]
- [[Stampante 3D/Marlin/Pagine/Alimentatore rele LED luci buzzer e servo|Alimentatore rele LED luci buzzer e servo]]

### Salvare e verificare dopo il riavvio

Salvare soltanto i valori accettati:

```gcode
M500
```

Riavviare completamente la macchina.

Rileggere la configurazione:

```gcode
M503
```

Confrontare il report con quello precedente e verificare almeno:

- steps per unita;
- limiti di movimento;
- PID o MPC;
- offset del probe;
- stato e dati della mesh;
- parametri delle compensazioni persistenti;
- impostazioni degli accessori modificabili a runtime.

Riportare poi i valori definitivi anche nei sorgenti, quando esiste una direttiva equivalente. EEPROM e file di configurazione non devono divergere senza una ragione documentata.

Criterio di accettazione:

- i valori sopravvivono al riavvio;
- la macchina ripete homing, riscaldamento e primo layer;
- i sorgenti permettono di ricostruire lo stato operativo.

### Eseguire la stampa di accettazione

Usare una progressione:

1. movimento a vuoto;
2. riscaldamento e permanenza al target;
3. pattern del primo layer;
4. oggetto piccolo con geometrie semplici;
5. oggetto con travel, curve e variazioni di velocita;
6. stampa abbastanza lunga da portare il sistema a regime termico.

Controllare:

- adesione e uniformita del primo layer;
- stabilita delle temperature;
- assenza di layer shift;
- dimensioni coerenti, considerando la tolleranza del processo;
- pareti, spigoli e superfici;
- retrazione e cambi di portata;
- cavi e tubi lungo tutta la corsa;
- ventole e driver durante il funzionamento;
- ripresa da pausa e fine stampa.

Dopo il raffreddamento e con alimentazione scollegata, ispezionare morsetti e connettori. Scolorimento, odore o allentamento richiedono una correzione prima di altre stampe.

## Adattamenti comuni

### Cinematiche non cartesiane

Delta, SCARA, CoreXY e altre cinematiche richiedono procedure geometriche specifiche. L'ordine generale resta valido, ma:

- la direzione di un singolo motore puo non coincidere con quella di un asse cartesiano;
- steps per unita e geometria non devono essere confusi;
- l'homing puo richiedere tutti gli assi insieme;
- area raggiungibile e limiti vanno verificati sull'intero volume.

### Macchine con piu estrusori o assi

Ripetere per ogni canale:

- identificazione del motore e del driver;
- verso, corrente e microstepping;
- steps per unita;
- sensore e heater;
- offset tra utensili;
- ventole e procedure di cambio.

### Parametri per materiale

Conservare nel profilo materiale o nello start G-code i valori realmente dipendenti dal materiale, come:

- temperatura;
- raffreddamento;
- flow;
- retrazione;
- Linear Advance, se cambia in modo significativo.

Conservare nel firmware o nella configurazione macchina i parametri meccanici e di sicurezza.

## Debug rapido

| Sintomo | Fermarsi alla fase | Controlli prioritari |
|---|---:|---|
| Temperatura assurda a riposo | 3 | tipo sensore, connettore, corto o circuito aperto |
| Asse va verso il lato opposto | 4 | sistema di coordinate, inversione motore, home direction |
| Homing non si ferma | 5 | `M119`, pin, logica, connettore, sensorless |
| Distanza errata e proporzionale | 7 | steps, microstepping, trasmissione |
| Distanza variabile o ritorno errato | 6 | giochi, pulegge, perdita passi, struttura |
| Heating failed o runaway | 8 | sensore, heater, alimentazione, ventole, protezioni |
| Primo layer varia sul piatto | 9 | tramming, ripetibilita probe, offset, mesh attiva |
| Layer shift ad alta velocita | 10 | corrente, accelerazione, velocita, attrito, cablaggi |
| Estrusione irregolare | 11 | temperatura, trascinamento, nozzle, portata, filamento |
| Ringing | 6 e 10 | rigidita, cinghie, accelerazione; poi Input Shaping |
| Valori persi al riavvio | 14 | `M500`, EEPROM, versione dati, `M503` |

## Checklist finale

- [ ] Build e sorgenti sono identificati.
- [ ] Report iniziale `M115`, `M503` e, se disponibile, `M504` archiviato.
- [ ] Alimentazione, terra, morsetti e cablaggi verificati.
- [ ] Temperature ambientali plausibili.
- [ ] Endstop e probe verificati con `M119`.
- [ ] Motori e driver associati e orientati correttamente.
- [ ] Homing sicuro su tutti gli assi.
- [ ] Area utile e limiti verificati.
- [ ] Struttura e trasmissioni prive di giochi anomali.
- [ ] Steps XYZ derivati dalla meccanica e verificati.
- [ ] Steps E calibrati separatamente dal flow.
- [ ] Heater, ventole e protezioni termiche collaudati.
- [ ] PID oppure MPC tarato secondo la configurazione.
- [ ] Portale, piatto, probe, offset Z e mesh verificati nell'ordine.
- [ ] Velocita e accelerazioni hanno margine rispetto al limite.
- [ ] Profilo materiale e slicer coerenti con la macchina.
- [ ] Compensazioni avanzate confrontate con una base valida.
- [ ] SD, interfaccia e accessori provati nel flusso reale.
- [ ] Valori salvati e riletti dopo riavvio.
- [ ] Primo layer, stampa breve e prova di durata completati.
- [ ] Configurazione finale registrata nei sorgenti e versionata.

## Riferimenti

- [Marlin 2.1.2.8](https://github.com/MarlinFirmware/Marlin/tree/2.1.2.8)
- [M92 - Set Axis Steps-per-unit](https://marlinfw.org/docs/gcode/M092.html)
- [M201 - Print and Travel Move Limits](https://marlinfw.org/docs/gcode/M201.html)
- [M203 - Set Max Feedrate](https://marlinfw.org/docs/gcode/M203.html)
- [M303 - PID Autotune](https://marlinfw.org/docs/gcode/M303.html)
- [M48 - Probe Repeatability Test](https://marlinfw.org/docs/gcode/M048.html)
- [G35 - Tramming Assistant](https://marlinfw.org/docs/gcode/G035.html)
- [Linear Advance](https://marlinfw.org/docs/features/lin_advance.html)
- [Input Shaping](https://marlinfw.org/docs/features/input_shaping.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica|G-code per configurazione e diagnostica]]
- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento|Metodo di configurazione compilazione e caricamento]]
- [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni|EEPROM scheda SD e salvataggio delle impostazioni]]
