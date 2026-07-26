---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: operational-note
status: "non revisionato"
difficulty: avanzato
tags: [marlin, migrazione, upgrade, configuration, eeprom]
aliases: [Aggiornare Marlin, Migrazione Marlin, Upgrade configurazione Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin]]"
  - "[[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Riferimento rapido delle direttive Marlin]]"
  - "[[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni]]"
marlin-version: "2.1.2.8"
---

# Migrazione della configurazione tra versioni

## Obiettivo

Trasferire una configurazione Marlin funzionante a una release differente senza:

- copiare opzioni obsolete;
- perdere decisioni hardware;
- confondere default compilati ed EEPROM;
- mantenere pin non piu validi;
- saltare la verifica di sicurezza;
- rendere impossibile il rollback.

La procedura usa Marlin 2.1.2.8 come versione di riferimento della guida, ma il metodo resta applicabile alle release future aggiornando sorgenti, configurazioni di esempio e controlli specifici.

## Quando usarlo

- Aggiornamento a una nuova release stabile.
- Passaggio da una vecchia configurazione a Marlin 2.1.2.8.
- Sostituzione della motherboard insieme all'aggiornamento firmware.
- Ricostruzione di una configurazione vendor non documentata.
- Allineamento di piu macchine a una base comune.
- Necessita di ridurre personalizzazioni accumulate nei sorgenti.

## Risultato atteso

La migrazione e completata quando esistono:

- sorgenti puliti della release destinazione;
- nuovi `Configuration.h` e `Configuration_adv.h`;
- matrice delle decisioni trasferite;
- build riproducibile;
- report runtime ed EEPROM verificati;
- collaudo minimo completato;
- archivio della versione precedente;
- procedura di rollback provata o documentata.

Una build riuscita e necessaria ma non sufficiente. Il compilatore non puo sapere se termistore, area utile, corrente, verso motori e pin corrispondono alla macchina reale.

## Principio fondamentale

Migrare le decisioni, non i file.

```text
vecchia configurazione
  -> inventario delle decisioni
  -> file puliti della nuova release
  -> trasferimento per blocchi
  -> build e controlli
  -> inizializzazione runtime
  -> collaudo
```

Copiare interamente i vecchi header nella nuova release puo compilare ma lasciare fuori nuove opzioni, nuove protezioni o valori derivati.

## Materiale da conservare

Prima di iniziare archiviare:

- sorgenti completi della versione funzionante;
- `Configuration.h`;
- `Configuration_adv.h`;
- eventuali modifiche in `pins_*.h`;
- altri file modificati sotto `Marlin/src`;
- `platformio.ini`, `config.ini` e file INI personalizzati;
- file firmware installato;
- configurazione slicer e start/end G-code;
- foto di scheda, cablaggi e revisioni;
- report `M115` e `M503`;
- mesh, offset, PID/MPC e tarature;
- istruzioni di upload e bootloader;
- commit Git o archivio con checksum.

Non affidarsi soltanto alla configurazione salvata nel repository se la macchina puo avere valori EEPROM differenti.

## Registro di migrazione

Creare una tabella:

| Area | Vecchia direttiva | Vecchio valore | Significato hardware | Direttiva destinazione | Azione | Test |
|---|---|---|---|---|---|---|
| Scheda | `MOTHERBOARD` | | modello/revisione | | verifica | build e pin |
| Sensore | `TEMP_SENSOR_0` | | componente reale | | trasferisci o sostituisci | `M105` |
| Movimento | `DEFAULT_AXIS_STEPS_PER_UNIT` | | trasmissione | | trasferisci e misura | corsa nota |
| Probe | `NOZZLE_TO_PROBE_OFFSET` | | geometria reale | | rimisura | `M851`, `M48` |
| Termica | PID o MPC | | heater e sensore | | valida o ricalibra | stabilita |

Stati utili:

- `invariato`: nome e significato confermati;
- `rinominato`: nuova direttiva equivalente;
- `sostituito`: nuova architettura;
- `rimosso`: funzione non piu disponibile;
- `nuovo`: decisione richiesta dalla release;
- `ricalibrare`: il valore non deve essere copiato;
- `da verificare`: manca evidenza.

## Procedura

### 1. Congelare la base funzionante

Non iniziare modificando direttamente l'unica copia funzionante.

Registrare:

```gcode
M115
```

Registrare tutti i parametri runtime:

```gcode
M503
```

Validare la EEPROM, se disponibile:

```gcode
M504
```

Registrare mesh e stato leveling:

```gcode
M420 V
```

Registrare gli offset:

```gcode
M851
```

Registrare Linear Advance, se compilato:

```gcode
M900
```

Registrare Input Shaping, se compilato:

```gcode
M593
```

Conservare i log come file di testo associati alla vecchia build.

### 2. Identificare esattamente origine e destinazione

Per entrambe annotare:

- tag o commit;
- data;
- repository;
- configurazioni di esempio usate;
- toolchain;
- ambiente PlatformIO;
- MCU;
- metodo di caricamento.

Esempio:

```text
origine: Marlin <tag_o_commit>
destinazione: Marlin 2.1.2.8
scheda: <modello_e_revisione>
ambiente: <ambiente_platformio>
```

Non usare `bugfix` come se fosse una release immutabile: un branch cambia nel tempo. Se viene scelto consapevolmente, registrare il commit.

### 3. Scaricare sorgenti puliti

Usare il tag ufficiale della destinazione. Non estrarre i nuovi sorgenti sopra la vecchia cartella.

La directory destinazione deve inizialmente contenere:

- sorgenti originali;
- file di configurazione originali;
- nessun oggetto `.pio` della vecchia build;
- nessuna libreria copiata manualmente;
- nessuna modifica ai pin.

Eseguire una build iniziale della configurazione di partenza quando possibile. Questo verifica toolchain e archivio prima di introdurre personalizzazioni.

### 4. Scegliere la configurazione di partenza

Ordine di preferenza:

1. esempio ufficiale della stessa release per modello e revisione esatti;
2. esempio ufficiale per la stessa motherboard e architettura;
3. file default della release;
4. configurazione ricostruita dall'inventario hardware.

Un esempio simile riduce il lavoro, ma non sostituisce il confronto con l'hardware. Produttori diversi possono usare la stessa motherboard con pin, display, sensori e meccanica differenti.

### 5. Confrontare le versioni di configurazione

Controllare:

```cpp
CONFIGURATION_H_VERSION
```

Controllare:

```cpp
CONFIGURATION_ADV_H_VERSION
```

Questi valori appartengono ai file della release. Non modificarli nel nuovo file.

La documentazione ufficiale propone anche di aggiornare temporaneamente i numeri nei vecchi file e compilare per ottenere messaggi sulle opzioni obsolete. Usare questa tecnica in una copia separata soltanto come strumento diagnostico:

1. duplicare i vecchi file;
2. cambiare i numeri nella copia;
3. compilare;
4. registrare ogni errore di `SanityCheck`;
5. riportare le decisioni nei file nuovi;
6. scartare la copia diagnostica.

Una build riuscita dei vecchi file non dimostra che contengano tutte le nuove opzioni e protezioni.

### 6. Trasferire prima identita e motherboard

Prima fase:

- autore e nome build;
- nome macchina;
- motherboard;
- porte seriali;
- baud rate;
- ambiente PlatformIO.

Compilare.

Non proseguire se l'ambiente non corrisponde a processore, memoria e bootloader.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]].

### 7. Trasferire cinematica e volume

Seconda fase:

- tipo di cinematica;
- numero di assi;
- dimensioni piatto;
- minimi e massimi;
- origine;
- direzioni di homing;
- limiti software.

Compilare.

Valori geometrici specifici di Delta, SCARA e altre cinematiche devono essere riesaminati se la release modifica formule o semantica.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Tipo di stampante e cinematica]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]

### 8. Trasferire motori, driver ed endstop

Terza fase:

- tipi driver;
- direzione;
- enable;
- steps teorici;
- feedrate e accelerazioni conservative;
- corrente e microstepping;
- connettori endstop;
- stato elettrico;
- pull-up o pull-down;
- homing tradizionale o sensorless.

Compilare.

Non trasferire automaticamente soglie sensorless se cambiano:

- driver;
- tensione;
- motore;
- massa mobile;
- libreria;
- modalita chopper.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping]]
- [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing]]

### 9. Trasferire sensori, heater e protezioni

Quarta fase:

- tipo di ogni sensore;
- limiti minimi e massimi;
- uscite heater;
- potenza massima;
- protezioni termiche;
- watch period;
- PID oppure MPC;
- ventole.

Compilare.

Classificazione:

| Valore | Se hardware invariato | Se hardware o algoritmo cambia |
|---|---|---|
| Tipo sensore | trasferire dopo verifica | scegliere dal componente reale |
| Limiti temperatura | verificare con specifiche | ridefinire |
| PID | puo essere una base | ritarare |
| MPC | puo essere una base solo nella stessa implementazione | ritarare |
| Protezioni | mantenere attive | riesaminare senza disabilitare |
| Potenza massima | verificare | ricalcolare |

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Sensori di temperatura e limiti operativi]]
- [[Stampante 3D/Marlin/Pagine/Controllo PID MPC e protezioni termiche]]
- [[Stampante 3D/Marlin/Pagine/Ventole e raffreddamento]]

### 10. Trasferire estrusori e gestione filamento

Quinta fase:

- numero e architettura estrusori/hotend;
- driver e direzioni E;
- steps E come valore iniziale verificabile;
- cold extrusion e limite lunghezza;
- retrazione firmware;
- cambio utensile;
- runout;
- Advanced Pause;
- load/unload.

Compilare.

Flow, temperatura materiale e retrazione dello slicer non appartengono necessariamente ai file Marlin, ma vanno inclusi nel piano perche possono dipendere dal nuovo comportamento firmware.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento]]
- [[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile]]
- [[Stampante 3D/Marlin/Pagine/Sensore di fine filamento e recupero dopo perdita di alimentazione]]

### 11. Trasferire probe e leveling

Sesta fase:

- tipo di probe;
- pin e livello logico;
- offset XYZ come valore da verificare;
- velocita e campioni;
- margini;
- metodo di leveling;
- dimensioni griglia;
- Z Safe Homing;
- allineamento multi-Z;
- tramming assistito.

Compilare.

Ricreare la mesh quando cambiano:

- metodo di leveling;
- dimensioni o coordinate griglia;
- area di probing;
- offset;
- meccanica;
- formato EEPROM.

Non trattare la vecchia mesh come dato portabile tra implementazioni diverse.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch]]
- [[Stampante 3D/Marlin/Pagine/Tipi di bed leveling e configurazione della mesh]]
- [[Stampante 3D/Marlin/Pagine/Z Safe Homing e allineamento degli assi Z]]

### 12. Trasferire UI, SD e accessori

Settima fase:

- display o touchscreen;
- lingua e encoder;
- SD e slot;
- EEPROM;
- alimentatore controllato;
- power-loss recovery;
- LED, luce, buzzer e servo.

Compilare dopo ogni sottogruppo quando la scheda ha memoria limitata.

Controllare i pin condivisi: una nuova definizione display puo cambiare disponibilita di servo, SD, probe o driver.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen]]
- [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni]]
- [[Stampante 3D/Marlin/Pagine/Alimentatore rele LED luci buzzer e servo]]

### 13. Trasferire compensazioni e ottimizzazioni per ultime

Ultima fase:

- Linear Advance;
- Input Shaping;
- skew correction;
- backlash compensation;
- babystepping;
- segmentazione e archi;
- buffer;
- funzioni sperimentali.

Motivi:

- possono cambiare implementazione;
- dipendono dalla taratura base;
- aumentano uso memoria e carico CPU;
- possono nascondere difetti introdotti prima.

Linear Advance richiede particolare attenzione alla versione dell'algoritmo: valori appartenenti a implementazioni differenti non sono intercambiabili.

Ricalibrare Input Shaping se cambiano massa, cinghie, telaio, accelerazioni o supporti della testa.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Linear Advance Input Shaping e compensazioni geometriche]]
- [[Stampante 3D/Marlin/Pagine/Segmentazione curve e precisione dei movimenti]]

### 14. Gestire modifiche ai pin

Prima cercare se la nuova release supporta gia la revisione hardware.

Per ogni vecchia modifica annotare:

| Pin | Funzione precedente | Motivo override | Definizione nuova | Conflitti | Test |
|---|---|---|---|---|---|
| | | | | | |

Non copiare integralmente un vecchio `pins_*.h`. Confrontare:

- pin aggiunti dal progetto;
- pin cambiati upstream;
- alias;
- condizioni per display o scheda;
- timer, PWM, ADC e interrupt richiesti;
- livelli logici;
- pin riservati.

Preferire override supportati nei file di configurazione quando previsti. Mantenere le modifiche al core in commit separati.

### 15. Usare `SanityCheck` come elenco di lavoro

Per ogni errore:

1. registrare il testo;
2. identificare la direttiva vecchia;
3. leggere il blocco nuovo;
4. scegliere la nuova decisione;
5. aggiornare la matrice;
6. ricompilare.

Non:

- commentare il controllo;
- definire macro finte;
- cambiare il numero versione per nascondere incompatibilita;
- risolvere molti errori insieme senza build intermedia.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Errori di compilazione e avvio]].

### 16. Valutare l'esportazione `config.ini`

Marlin 2.1.2.8 include:

```cpp
//#define CONFIG_EXPORT 2
```

Il valore `2` esporta un `config.ini` durante la build. Puo aiutare a:

- estrarre opzioni abilitate;
- confrontare configurazioni;
- mantenere varianti;
- preparare migrazioni future.

Procedura:

1. abilitare `CONFIG_EXPORT 2` nella vecchia build supportata;
2. compilare;
3. individuare il file esportato nella directory di build;
4. versionarlo insieme agli header;
5. applicarlo a sorgenti destinazione puliti in una copia di lavoro;
6. esaminare differenze e messaggi;
7. compilare;
8. verificare i file risultanti.

`config.ini` non sostituisce la revisione:

- nomi possono essere rimossi;
- nuovi default possono mancare;
- dipendenze possono cambiare;
- il sistema e dichiarato sperimentale dalla documentazione;
- pin e modifiche al core non sono necessariamente rappresentati.

`Config.h` come sostituto degli header e una funzione introdotta in Marlin 2.1.3 e non appartiene alla guida 2.1.2.8.

### 17. Eseguire build pulite

Dopo ogni blocco:

```powershell
platformio run --target clean -e <ambiente>
```

Compilare:

```powershell
platformio run -e <ambiente>
```

Registrare:

- risultato;
- dimensione flash;
- uso RAM riportato;
- warning nuovi;
- hash o nome del firmware.

Una build incrementale e comoda; una build pulita prima del rilascio esclude residui della cache.

### 18. Preparare il rollback

Prima del flash assicurarsi di poter reinstallare:

- vecchio firmware;
- vecchi valori EEPROM;
- vecchia configurazione;
- metodo di upload;
- bootloader, se coinvolto.

Non iniziare l'aggiornamento quando la macchina deve produrre senza una finestra di collaudo.

Il rollback firmware puo non ripristinare automaticamente una EEPROM modificata dalla nuova release.

### 19. Gestire la EEPROM dopo il flash

La EEPROM puo sopravvivere al flash e sovrascrivere i nuovi default. E anche possibile che layout o CRC non siano compatibili.

Prima osservare:

```gcode
M115
```

Leggere i parametri attivi:

```gcode
M503
```

Validare:

```gcode
M504
```

Per una migrazione importante, dopo aver conservato i vecchi valori, caricare i default della nuova build in RAM:

```gcode
M502
```

Controllarli:

```gcode
M503
```

Salvare soltanto se sono coerenti:

```gcode
M500
```

Riavviare e rileggere:

```gcode
M503
```

`M502` non cancella da solo la EEPROM; carica i default compilati in RAM. `M500` li rende persistenti.

Approfondimento: [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni]].

### 20. Collaudare dal rischio minore al maggiore

Ripetere almeno:

1. identita firmware;
2. temperature ambiente;
3. endstop e probe senza movimento;
4. direzione dei motori;
5. homing asse per asse;
6. limiti e area;
7. steps;
8. heater uno alla volta;
9. ventole;
10. tramming, offset e mesh;
11. estrusione;
12. compensazioni;
13. SD e accessori;
14. stampa breve;
15. prova prolungata.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Procedura completa di taratura e verifica]].

### 21. Aggiornare slicer e procedure

Controllare:

- nome e dimensioni macchina;
- origine;
- numero estrusori;
- flavor G-code;
- start G-code;
- sequenza `G28`, `G29` o `M420`;
- comandi `M900`, `M593`, `M412` e accessori;
- limiti velocita e accelerazione;
- profili materiale;
- procedure di pausa e cambio filamento.

Una nuova build puo funzionare manualmente ma fallire in stampa per uno start G-code ereditato.

## Cosa trasferire, verificare o ricalibrare

| Elemento | Azione predefinita |
|---|---|
| Modello motherboard | verificare revisione e supporto |
| Porte seriali | verificare |
| Tipo sensore | trasferire solo se componente invariato |
| Pin personalizzati | confrontare con nuova definizione |
| Steps XYZ | trasferire come base e misurare |
| Steps E | trasferire come base e misurare |
| Corrente driver | verificare driver, motore e unita |
| Soglia sensorless | ricalibrare |
| PID | ricalibrare se cambia sistema termico o implementazione |
| MPC | ricalibrare su cambi significativi |
| Offset probe | rimisurare |
| Mesh | rigenerare |
| Velocita e accelerazioni | partire conservative e riverificare |
| Linear Advance K | verificare versione e ricalibrare |
| Input Shaping | ricalibrare se cambia la dinamica |
| Flow e retrazione | verificare nel profilo materiale |
| Power-loss recovery | provare con stampa sacrificabile |

## Differenze che richiedono attenzione speciale

### Patch della stessa release

Una patch puo sembrare a basso rischio, ma controllare:

- changelog;
- modifiche ai pin;
- correzioni EEPROM;
- librerie;
- comportamento di sicurezza;
- issue relative alla propria motherboard.

### Salto di piu release

Non e sempre necessario migrare attraverso ogni versione intermedia. E pero utile:

- leggere i changelog intermedi;
- usare i controlli per macro obsolete;
- separare rinomina da cambio semantico;
- evitare di attribuire tutti i cambiamenti all'ultima release.

### Cambio motherboard

Trattarlo come nuova messa in servizio:

- pin e livelli logici cambiano;
- ambiente e bootloader cambiano;
- correnti e comunicazione driver possono cambiare;
- EEPROM non e portabile;
- display e SD possono usare connessioni differenti.

### Configurazione vendor

Verificare se contiene:

- pin non upstream;
- bootloader personalizzato;
- display proprietario;
- sensori con tabelle custom;
- logo e UI;
- protezioni modificate;
- valori EEPROM preinstallati.

Non assumere che il solo confronto degli header catturi tutte le modifiche.

## Strategia per aggiornamenti futuri della guida

Quando esce una nuova release stabile:

1. mantenere le note 2.1.2.8 come base versionata;
2. confrontare i due file di configurazione;
3. elencare direttive aggiunte, rimosse e rinominate;
4. verificare cambi di semantica e default;
5. controllare EEPROM e G-code;
6. aggiornare frontmatter e riferimenti;
7. modificare solo le pagine coinvolte;
8. ripetere i test delle procedure;
9. registrare la nuova versione nello storico.

La suddivisione per componente limita l'aggiornamento alle aree realmente cambiate.

## Debug rapido

| Problema | Causa probabile | Azione |
|---|---|---|
| Vecchi file producono molti errori | opzioni obsolete o versioni diverse | usare file nuovi e matrice |
| Build riesce ma valori sono vecchi | EEPROM sovrascrive i default | `M503`, poi procedura `M502`/`M500` |
| Display non funziona | direttiva o pin cambiati | confrontare definizione target |
| Homing va nel verso errato | inversione o home direction | fermare e verificare senza ripetere |
| Temperature errate al boot | sensore o pin | non attivare heater |
| Mesh non valida | formato, area o metodo cambiato | rigenerare |
| Stampa diversa con stessi valori | default o algoritmo cambiato | confrontare semantica e G-code |
| Rollback non ripristina comportamento | EEPROM modificata | ripristinare anche i dati |
| `config.ini` ignora un'opzione | nome rimosso o dipendenza | leggere output e file generati |

## Checklist finale

- [ ] Vecchia build, sorgenti e EEPROM documentati.
- [ ] Origine e destinazione identificate con tag o commit.
- [ ] Sorgenti destinazione puliti.
- [ ] Configurazione di esempio della stessa release verificata.
- [ ] Matrice di migrazione compilata.
- [ ] Motherboard e ambiente confermati.
- [ ] Direttive trasferite per blocchi con build intermedie.
- [ ] `SanityCheck` risolto senza aggiramenti.
- [ ] Pin personalizzati riesaminati.
- [ ] Uso flash e RAM controllato.
- [ ] Firmware precedente disponibile per rollback.
- [ ] EEPROM gestita consapevolmente.
- [ ] Sensori ed endstop verificati prima di heater e homing.
- [ ] Offset, mesh e compensazioni ricalibrati quando necessario.
- [ ] Start G-code e slicer aggiornati.
- [ ] Stampa breve e prova prolungata completate.
- [ ] Nuova configurazione e report finali versionati.

## Riferimenti

- [Marlin 2.1.2.8](https://github.com/MarlinFirmware/Marlin/tree/2.1.2.8)
- [Marlin Configuration Reference](https://marlinfw.org/docs/configuration/configuration.html)
- [Configuring with INI](https://marlinfw.org/docs/configuration/config-ini.html)
- [EEPROM](https://marlinfw.org/docs/features/eeprom.html)
- [M503 - Report Settings](https://marlinfw.org/docs/gcode/M503.html)
- [Marlin Configurations](https://github.com/MarlinFirmware/Configurations)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Riferimento rapido delle direttive Marlin]]
- [[Stampante 3D/Marlin/Pagine/Errori di compilazione e avvio]]
- [[Stampante 3D/Marlin/Pagine/Procedura completa di taratura e verifica]]
