---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: operational-note
status: "non revisionato"
difficulty: avanzato
tags: [marlin, movimento, temperatura, estrusione, livellamento, troubleshooting]
aliases: [Diagnostica operativa Marlin, Problemi stampa Marlin, Troubleshooting macchina Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Procedura completa di taratura e verifica]]"
  - "[[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Errori di compilazione e avvio]]"
  - "[[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware]]"
marlin-version: "2.1.2.8"
---

# Problemi di movimento, temperatura, estrusione e livellamento

## Obiettivo

Diagnosticare i problemi che compaiono dopo l'avvio di Marlin, identificando il livello responsabile prima di modificare la configurazione:

```text
hardware elettrico
  -> meccanica
  -> sensori
  -> configurazione compilata
  -> valori runtime ed EEPROM
  -> G-code
  -> slicer e materiale
```

La stessa imperfezione visibile puo avere cause differenti. Un layer shift puo derivare da una puleggia lenta, corrente insufficiente, accelerazione eccessiva o collisione del nozzle; aumentare gli steps per millimetro non corregge nessuna di queste cause.

## Quando usarlo

- Un asse non si muove o perde posizione.
- Homing ed endstop si comportano in modo errato.
- Compaiono errori di temperatura.
- L'estrusore scatta, sottoestrude o sovraestrude.
- Probe, `G29`, mesh o offset Z non producono un primo layer uniforme.
- Il problema compare soltanto durante una stampa.
- Una taratura sembra valida ma non sopravvive al riavvio.

## Prerequisiti

- Macchina controllata secondo la procedura di messa in servizio.
- Accesso immediato all'interruttore generale.
- Host che mostri il log seriale completo.
- Configurazione e output `M503` disponibili.
- Strumenti di misura adeguati.
- File di prova noto e profilo slicer archiviato.

## Regole di diagnosi

1. Fermare la macchina se esiste un rischio.
2. Registrare il messaggio originale e lo stato.
3. Riprodurre con il test minimo possibile.
4. Modificare una sola variabile.
5. Provare in RAM prima di salvare.
6. Confrontare risultato atteso e risultato reale.
7. Correggere la causa piu a monte.
8. Ripetere il test dopo un riavvio.

Non:

- disabilitare protezioni per far scomparire un errore;
- compensare un difetto meccanico con la mesh;
- aumentare corrente senza leggere specifiche e temperatura;
- modificare contemporaneamente firmware e slicer;
- salvare con `M500` ogni tentativo;
- usare una stampa lunga come primo test.

## Report iniziale

Identificare la build:

```gcode
M115
```

Leggere la configurazione runtime:

```gcode
M503
```

Leggere la posizione:

```gcode
M114
```

Leggere temperature e target:

```gcode
M105
```

Leggere endstop e probe:

```gcode
M119
```

Leggere i driver Trinamic compatibili:

```gcode
M122
```

Leggere gli offset del probe:

```gcode
M851
```

Leggere stato e mesh:

```gcode
M420 V
```

Alcuni comandi esistono soltanto se la relativa funzione e stata compilata. `Unknown command` non prova un guasto: puo indicare che la feature e assente.

## Diagnostica del movimento

### Un motore non si muove

Controllare nell'ordine:

1. macchina in stato operativo e non `STOP`;
2. asse homed, se i limiti software impediscono la richiesta;
3. driver abilitato;
4. connettore del motore;
5. coppie delle fasi;
6. driver e alimentazione motori;
7. asse e pin configurati;
8. corrente;
9. cinematica e G-code.

Sintomi utili:

| Sintomo | Causa probabile |
|---|---|
| Motore completamente libero | driver non abilitato o non alimentato |
| Motore trattiene ma non ruota | fasi errate, step/dir, blocco meccanico |
| Vibra avanti e indietro | una fase aperta o coppie errate |
| Si muove dall'interfaccia ma non in stampa | G-code, limiti, tool o modalita |
| Si ferma dopo poco | driver in protezione, corrente o raffreddamento |

Con Trinamic controllare:

```gcode
M122
```

Risposte registri tutte a zero o tutte a uno indicano un problema di comunicazione UART/SPI, non una taratura meccanica.

### Il motore gira nel verso errato

Verificare prima:

- direzione positiva del sistema di coordinate;
- posizione dell'endstop;
- `*_HOME_DIR`;
- cinematica;
- inversione del motore;
- eventuale inversione del secondo motore.

Non invertire insieme cablaggio e direttiva firmware: si perde la relazione causa-effetto. Dopo la correzione ripetere `M119` prima del primo homing.

### Il motore vibra o e rumoroso

Possibili cause:

- coppie delle fasi errate;
- connettore parzialmente inserito;
- corrente troppo bassa;
- corrente o raffreddamento inadeguati con protezione termica;
- microstepping incoerente;
- accelerazione troppo alta;
- frequenza di risonanza;
- vite, guida o cinghia bloccata;
- modalita Trinamic non adatta alla velocita.

Scollegare meccanicamente il carico soltanto a macchina disalimentata e se la procedura hardware lo permette. Verificare prima che l'asse scorra libero.

### Perdita di passi o layer shift

Separare il momento del difetto:

- sempre nello stesso punto: collisione, ostacolo, cavo, guida;
- durante accelerazioni: corrente o accelerazione;
- dopo molte ore: temperatura driver o motore;
- su travel sopra parti sollevate: collisione nozzle;
- casuale con reset o artefatti: alimentazione o disturbi;
- su CoreXY: controllare entrambi i motori e l'intero percorso cinghie.

Controllare:

- pulegge e grani;
- tensione e percorso cinghie;
- liberta di movimento dell'asse;
- corrente e raffreddamento driver;
- `M122`, `M911` e flag termici se disponibili;
- velocita, accelerazione e Jerk/Junction Deviation;
- cablaggi che seguono il movimento;
- curling del pezzo.

Ridurre temporaneamente l'accelerazione:

```gcode
M204 P<valore_basso> T<valore_basso>
```

Ridurre temporaneamente il feedrate globale durante una prova:

```gcode
M220 S<percentuale>
```

Se il difetto scompare, non e ancora dimostrato quale limite sia responsabile. Reintrodurre una variabile alla volta.

### Distanza comandata diversa da quella reale

Errore proporzionale e ripetibile:

- steps per unita;
- microstepping;
- rapporto puleggia, cinghia, vite o riduttore;
- unita G-code.

Errore variabile:

- perdita di passi;
- slittamento;
- gioco;
- flessione;
- misura inaffidabile.

Leggere gli steps:

```gcode
M92
```

Non correggere X e Y partendo da un pezzo stampato prima di aver escluso ritiro, flow e larghezza linea.

### Homing non si ferma

Togliere alimentazione prima della collisione. A macchina ferma leggere:

```gcode
M119
```

Azionare manualmente il sensore e ripetere:

```gcode
M119
```

Controllare:

- connettore min/max corretto;
- pin usato dalla scheda;
- logica `open` e `TRIGGERED`;
- pull-up o pull-down;
- direzione di homing;
- endstop condiviso con il probe;
- soglia StallGuard per sensorless;
- disturbi sul cavo.

Non usare `M999` e ripetere homing senza aver verificato il cambio di stato.

### Homing si ferma troppo presto

Se `M119` cambia senza contatto:

- cavo intermittente;
- ingresso flottante;
- disturbo da motori o heater;
- logica errata;
- sensorless troppo sensibile;
- switch normalmente chiuso con circuito aperto.

Provare prima a macchina immobile, poi durante movimenti controllati. Un filtro antirumore puo ridurre impulsi brevi, ma non deve sostituire cablaggio e messa a terra corretti.

### Posizione o area utile errata

Confrontare:

- posizione dopo `G28`;
- `X/Y/Z_MIN_POS`;
- `X/Y/Z_MAX_POS`;
- dimensioni piatto;
- offset nozzle-probe;
- coordinate dello slicer;
- origine al centro o all'angolo;
- limiti fisici del probe rispetto a quelli del nozzle.

Leggere la posizione:

```gcode
M114
```

I software endstop sono una protezione. Non disabilitarli come correzione permanente per un'area definita male.

## Diagnostica della temperatura

### `MINTEMP` o `MAXTEMP` all'avvio

Non attivare heater.

Leggere:

```gcode
M105
```

Cause tipiche:

| Errore | Possibili cause |
|---|---|
| `MINTEMP` | sensore scollegato, filo rotto, tipo errato |
| `MAXTEMP` | corto del sensore, pin errato, tipo errato |
| Valore plausibile ma sbagliato | tabella sensore errata, canali scambiati |
| Valore instabile | falso contatto, disturbo, sensore allentato |

La relazione elettrica dipende dal tipo di sensore. Non assumere che ogni circuito aperto produca sempre lo stesso estremo.

Controllare sensore, connettore, continuita a macchina disalimentata e `TEMP_SENSOR_*` compilato.

### Il canale sbagliato cambia temperatura

Se comandando l'hotend aumenta la lettura del piatto, fermare subito la prova. Sono possibili:

- sensori scambiati;
- heater scambiati;
- pin o indici errati;
- etichette dei cablaggi errate.

Verificare un canale alla volta a bassa energia e correggere la corrispondenza fisica. Il controllo termico non e sicuro se heater e sensore non appartengono alla stessa zona.

### `Heating failed`

Significa che la temperatura non e aumentata abbastanza nel periodo di controllo.

Controllare:

- cartuccia o heater collegato;
- tensione presente sotto carico;
- potenza e tensione nominali;
- MOSFET o rele;
- sensore fissato alla zona corretta;
- ventola che soffia sul blocco;
- isolamento;
- alimentatore;
- soglie `WATCH_*`.

Prima correggere hardware e configurazione. Allargare il periodo di watch e ragionevole solo quando il sistema e sano ma realmente lento e il nuovo limite resta sicuro.

### `Thermal runaway`

Significa che, dopo aver raggiunto il target, la temperatura si e allontanata troppo a lungo dall'intervallo ammesso.

Cause frequenti:

- sensore allentato;
- cartuccia allentata;
- PID o MPC non tarato;
- ventola pezzo sul blocco;
- heater insufficiente;
- caduta di alimentazione;
- connettore intermittente;
- ambiente molto freddo;
- potenza massima limitata.

Non disabilitare `THERMAL_PROTECTION_*`. Correggere la causa e ripetere una prova sorvegliata.

### Overshoot o oscillazione

Controllare:

- controllore realmente compilato: bang-bang, PID o MPC;
- valori caricati da EEPROM;
- posizione e fissaggio del sensore;
- ventole;
- potenza heater;
- autotune eseguito a condizioni rappresentative;
- masse o componenti cambiati dopo la taratura.

Leggere i valori:

```gcode
M503
```

PID e MPC sono alternativi per l'hotend. Non applicare coefficienti PID a una build MPC.

### Temperatura stabile a riposo ma instabile in stampa

Riprodurre progressivamente:

1. heater senza ventole;
2. ventola hotend;
3. ventola pezzo a diverse percentuali;
4. movimenti;
5. estrusione;
6. stampa.

Questo separa flusso d'aria, cadute di tensione, cablaggi in movimento e carico termico del filamento.

### Reset quando si accendono gli heater

Controllare prima:

- tensione dell'alimentatore sotto carico;
- sezione e serraggio cavi;
- corto o carico di tensione errata;
- dimensionamento del PSU;
- massa;
- MOSFET;
- protezioni.

Un reset simultaneo all'attivazione di potenza e un problema elettrico fino a prova contraria.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Sensori di temperatura e limiti operativi]]
- [[Stampante 3D/Marlin/Pagine/Controllo PID MPC e protezioni termiche]]
- [[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware]]

## Diagnostica dell'estrusione

### L'estrusore non si muove

Controllare:

- temperatura sopra `EXTRUDE_MINTEMP`;
- tool attivo;
- driver e motore;
- connettore;
- modalita assoluta o relativa di E;
- limite `EXTRUDE_MAXLENGTH`;
- stato `STOP`;
- comando effettivamente inviato.

Per una prova a caldo, impostare modalita relativa dell'estrusore:

```gcode
M83
```

Comandare una lunghezza piccola e una velocita prudente:

```gcode
G1 E<lunghezza> F<velocita>
```

Non usare `M302` per rendere normale l'estrusione a freddo. Se si deve verificare solo la meccanica, scollegare il percorso del filamento quando l'hardware lo consente.

### L'estrusore scatta o consuma il filamento

Cause possibili:

- nozzle ostruito;
- temperatura insufficiente;
- portata richiesta eccessiva;
- tensione idler errata;
- ingranaggio sporco;
- percorso filamento frenato;
- heat creep;
- corrente motore insufficiente;
- retrazioni troppo frequenti o lunghe;
- filamento deformato o di diametro irregolare.

Ridurre la portata e provare un'estrusione lenta. Se il problema resta senza nozzle o senza contropressione, concentrarsi su estrusore, driver e percorso. Se compare soltanto attraverso l'hotend, concentrarsi sul sistema di fusione.

### Sottoestrusione

Separare:

- lunghezza trascinata dall'estrusore;
- massa o volume fuso dall'hotend;
- quantita richiesta dallo slicer.

Controllare nell'ordine:

1. diametro filamento;
2. steps E;
3. slittamento;
4. temperatura;
5. nozzle;
6. portata volumetrica;
7. flow;
8. Linear Advance;
9. G-code.

Non aumentare flow finche l'estrusore perde passi o l'hotend non fonde la portata richiesta.

### Sovraestrusione

Controllare:

- diametro inserito nello slicer;
- flow o extrusion multiplier;
- steps E;
- nozzle e larghezza linea;
- profilo materiale;
- comandi `M221`;
- valori per estrusore distinti.

Leggere o riportare il flow al riferimento durante il test:

```gcode
M221 S100
```

### Stringing e retrazione

Verificare prima:

- temperatura;
- umidita del materiale;
- travel;
- tenuta del percorso;
- pressione nel nozzle;
- impostazioni firmware retract e slicer;
- Linear Advance.

Non attivare contemporaneamente retrazione firmware e una strategia incompatibile dello slicer. Modificare distanza e velocita separatamente.

### Intasamento dopo molte retrazioni

Possibili cause:

- retrazione troppo lunga;
- velocita eccessiva;
- heat creep;
- ventola hotend insufficiente;
- temperatura troppo alta;
- percorso con gioco;
- materiale trascinato nella zona fredda.

Una retrazione che funziona su un direct drive puo essere eccessiva per un hotend o percorso differente.

### Difetti dopo Linear Advance

Disabilitare temporaneamente il fattore:

```gcode
M900 K0
```

Se il difetto scompare, controllare:

- K troppo alto;
- steps E e flow non ancora corretti;
- limiti di velocita o accelerazione E;
- strategia di pressure control dello slicer attiva insieme a Marlin;
- valore non adatto al materiale.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento]]
- [[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile]]
- [[Stampante 3D/Marlin/Pagine/Linear Advance Input Shaping e compensazioni geometriche]]

## Diagnostica del probe e del livellamento

### Il probe non si attiva o non cambia stato

Leggere lo stato:

```gcode
M119
```

Per probe comandabili, provare il deploy:

```gcode
M401
```

Provare lo stow:

```gcode
M402
```

Controllare:

- alimentazione e livello logico;
- pin servo/control e pin trigger;
- connettore dedicato o Z-min;
- inversione dello stato;
- tipo di probe;
- spazio per deploy;
- allarmi specifici, per esempio BLTouch lampeggiante.

Non iniziare `G28 Z` finche l'attivazione manuale non produce lo stato atteso.

### `G29` fallisce

Possibili cause:

- macchina non homed;
- probe non dispiegato;
- area di probing irraggiungibile;
- offset XY errato;
- margini e inset incompatibili;
- `Z_PROBE_LOW_POINT` raggiunto;
- piatto non trammato;
- probe intermittente;
- nozzle o probe urtano fermagli;
- metodo `G29` diverso da quello atteso.

Verificare:

```gcode
G28
```

Poi eseguire il test soltanto sotto sorveglianza:

```gcode
G29
```

Non rendere molto negativo `Z_PROBE_LOW_POINT` per nascondere offset o tramming errati: quel limite protegge da una discesa eccessiva.

### Il probe e poco ripetibile

Eseguire:

```gcode
M48 P10 V2
```

Controllare:

- fissaggio del probe;
- gioco del carrello;
- cavi e Bowden che torcono la testa;
- temperatura di piatto, probe e hotend;
- vibrazioni;
- disturbi elettrici;
- velocita e numero di campioni;
- superficie e punto di misura.

La ripetibilita misura la dispersione, non la correttezza dell'offset assoluto.

### La mesh esiste ma non viene applicata

Leggere stato e contenuto:

```gcode
M420 V
```

Abilitare una mesh valida, se il metodo lo supporta:

```gcode
M420 S1
```

Controllare:

- `G28` puo disabilitare il leveling;
- ordine dello start G-code;
- mesh salvata nello slot corretto;
- `M500` eseguito quando necessario;
- metodo bilinear, MBL o UBL;
- fade height;
- slicer che invia comandi successivi.

Non assumere che una mesh mostrata nel menu sia attiva durante la stampa.

### Un lato e alto e l'altro basso dopo la mesh

Controllare prima:

- portale X non parallelo;
- piatto non trammato;
- probe inclinato o non rigido;
- cavi che torcono il carrello;
- offset XY errato;
- direzione della compensazione;
- mesh non attiva;
- asse Z con piu motori disallineato.

La mesh corregge una superficie rispetto al piano di movimento. Se probe e nozzle cambiano relazione durante la corsa, la misura non rappresenta l'altezza del nozzle.

### Offset Z corretto al centro ma errato altrove

Possibili cause:

- tramming;
- mesh non attiva;
- superficie deformata;
- probe non perpendicolare;
- gioco su Z;
- torsione del portale;
- compensazione geometrica errata.

Un singolo `M851 Z` sposta tutto il riferimento Z. Non puo correggere un errore che varia con X e Y.

### Offset Z cambia tra stampe

Controllare:

- homing Z ripetibile;
- probe;
- nozzle sporco;
- temperatura della macchina;
- portale che scende a motori disabilitati;
- ruote, giunti e viti;
- valore salvato in EEPROM;
- start G-code;
- babystepping non trasferito al valore persistente.

Leggere l'offset:

```gcode
M851
```

Leggere i parametri caricati:

```gcode
M503
```

### Primo layer troppo alto o troppo basso ovunque

Probabile causa globale:

- offset Z;
- babystepping;
- altezza primo layer dello slicer;
- mesh non attiva;
- superficie o nozzle sporchi.

Correggere l'offset, non l'intera mesh, se l'errore e uniforme.

### Primo layer irregolare localmente

Probabile causa locale:

- mesh;
- piatto deformato;
- punto anomalo;
- superficie contaminata;
- probe poco ripetibile;
- densita mesh insufficiente;
- fermaglio o magnete che altera la misura.

Validare la mesh con un pattern di primo layer e registrare le condizioni termiche.

### Diagnostica dettagliata del leveling

Se `DEBUG_LEVELING_FEATURE` e stato compilato, abilitare i messaggi:

```gcode
M111 S32
```

Eseguire il comando da analizzare e salvare tutto il log. Al termine disabilitare il debug:

```gcode
M111 S0
```

Il debug mostra coordinate e sequenze, ma non rende sicuro un movimento errato. Sorvegliare sempre il primo test.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch]]
- [[Stampante 3D/Marlin/Pagine/Tipi di bed leveling e configurazione della mesh]]
- [[Stampante 3D/Marlin/Pagine/Z Safe Homing e allineamento degli assi Z]]

## Problemi che compaiono solo durante la stampa

Confrontare una stampa da SD e una inviata da host quando possibile:

| Risultato | Area da indagare |
|---|---|
| Fallisce solo da host | seriale, USB, host, timeout, alimentazione USB |
| Fallisce solo da SD | scheda, filesystem, lettore, file |
| Fallisce nello stesso punto | G-code, collisione, geometria del modello |
| Fallisce a tempi casuali | alimentazione, temperatura, driver, contatti |
| Fallisce solo ad alta velocita | movimento, portata, buffer, accelerazioni |
| Fallisce solo con ventola | termica, alimentazione, flusso sul blocco |

Usare lo stesso G-code per evitare che una nuova slicing introduca un'altra variabile.

## Verifica delle modifiche

Per ogni correzione:

1. leggere il valore iniziale;
2. modificare in RAM;
3. ripetere il test minimo;
4. eseguire una prova piu ampia;
5. salvare con `M500` solo se accettata;
6. riavviare;
7. verificare con `M503`;
8. aggiornare i file di configurazione.

Salvataggio:

```gcode
M500
```

Verifica:

```gcode
M503
```

## Matrice rapida dei sintomi

| Sintomo | Prima area | Non correggere subito con |
|---|---|---|
| Layer shift | meccanica e driver | steps/mm |
| Dimensione proporzionalmente errata | trasmissione e steps | flow |
| Riavvio con heater | alimentazione | PID |
| `MINTEMP` al boot | sensore | soglie termiche |
| `Thermal runaway` | sensore, heater, ventole | disabilitazione protezione |
| Estrusore che scatta | percorso e portata | corrente senza verifica |
| Sottoestrusione ad alta velocita | portata hotend | steps E |
| Stringing | materiale e temperatura | sola retrazione estrema |
| `G29` fuori piatto | offset e margini | limiti software disabilitati |
| Primo layer uniforme ma troppo basso | offset Z | nuova mesh |
| Primo layer inclinato | tramming e portale | offset globale |
| Mesh persa dopo homing | start G-code e `M420` | nuova calibrazione probe |

## Checklist finale

- [ ] Messaggio originale e condizioni registrati.
- [ ] Build e parametri runtime identificati.
- [ ] Test minimo riproducibile.
- [ ] Rischi elettrici e termici esclusi per primi.
- [ ] Meccanica verificata prima delle compensazioni.
- [ ] Endstop controllati con `M119`.
- [ ] Driver compatibili controllati con `M122`.
- [ ] Steps distinti da perdita di passi e ritiro.
- [ ] Sensore e heater associati alla stessa zona.
- [ ] Protezioni termiche mantenute attive.
- [ ] Steps E distinti dal flow dello slicer.
- [ ] Probe verificato prima di `G28 Z` e `G29`.
- [ ] Ripetibilita distinta dall'offset assoluto.
- [ ] Stato della mesh verificato nel vero start G-code.
- [ ] Una sola variabile modificata per prova.
- [ ] Valore salvato solo dopo verifica.
- [ ] Correzione riportata nei file e versionata.

## Riferimenti

- [Marlin 2.1.2.8](https://github.com/MarlinFirmware/Marlin/tree/2.1.2.8)
- [Marlin Troubleshooting Tips](https://marlinfw.org/docs/basics/troubleshooting.html)
- [M119 - Endstop States](https://marlinfw.org/docs/gcode/M119.html)
- [M122 - TMC Debugging](https://marlinfw.org/docs/gcode/M122.html)
- [M111 - Debug Level](https://marlinfw.org/docs/gcode/M111.html)
- [Automatic Bed Leveling](https://marlinfw.org/docs/features/auto_bed_leveling.html)
- [Marlin Configuration Reference](https://marlinfw.org/docs/configuration/configuration.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Procedura completa di taratura e verifica]]
- [[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica]]
- [[Stampante 3D/Marlin/Pagine/Errori di compilazione e avvio]]
