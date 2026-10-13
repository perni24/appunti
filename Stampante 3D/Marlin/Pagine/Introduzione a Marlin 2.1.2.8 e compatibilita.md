---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: theory-note
publish: true
difficulty: base
tags:
  - marlin
  - firmware
  - stampante-3d
aliases:
  - Introduzione a Marlin
  - Marlin 2.1.2.8
prerequisites: []
related:
  - "[[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin]]"
  - "[[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]"
marlin-version: 2.1.2.8
title: Introduzione a Marlin 2.1.2.8 e compatibilita
status: non revisionato
---

# Introduzione a Marlin 2.1.2.8 e compatibilita

## Sintesi

Marlin e un firmware open source eseguito direttamente dal microcontrollore della stampante. Riceve comandi G-code, pianifica i movimenti e controlla motori, riscaldatori, sensori, ventole, display e dispositivi di sicurezza.

Questa guida usa esclusivamente la release stabile `2.1.2.8` come riferimento. Le spiegazioni sono generali: descrivono il funzionamento delle opzioni senza assumere uno specifico modello di stampante.

## Problema che risolve

Una scheda di controllo non conosce automaticamente la macchina a cui e collegata. Il firmware deve sapere:

- quale scheda madre e quale microcontrollore vengono usati;
- quali pin controllano motori, riscaldatori, sensori e periferiche;
- quale cinematica descrive i movimenti;
- quali sono dimensioni, direzioni e limiti degli assi;
- quali sensori di temperatura sono installati;
- quali funzioni e protezioni devono essere compilate.

Marlin combina queste informazioni con il proprio codice per produrre un firmware adatto all'hardware dichiarato.

## Concetto chiave

La configurazione avviene principalmente **prima della compilazione**. Le direttive del preprocessore C, come `#define`, decidono quali parti del firmware includere e quali valori usare come predefiniti.

```cpp
#define EXTRUDERS 1
```

```cpp
//#define BLTOUCH
```

Nel primo esempio `EXTRUDERS` ha valore `1`. Nel secondo `BLTOUCH` e disabilitato perche la riga e commentata.

Questo approccio permette di costruire un firmware compatto, ma significa che molte modifiche richiedono una nuova compilazione e un nuovo caricamento sulla scheda.

## Configurazione compilata e configurazione attiva

Non tutti i valori attivi provengono direttamente dal firmware appena compilato.

1. I file di configurazione stabiliscono funzionalita e valori predefiniti.
2. Il firmware viene compilato e caricato sulla scheda.
3. Durante l'esecuzione alcuni valori possono essere modificati con G-code o dal display.
4. Se `EEPROM_SETTINGS` e abilitato, questi valori possono essere salvati e riutilizzati dopo il riavvio.

Di conseguenza, un valore conservato in EEPROM puo prevalere sul nuovo valore predefinito compilato. Dopo un aggiornamento bisogna verificare esplicitamente quali impostazioni siano attive.

## Versione di riferimento

La release usata e:

```text
Marlin 2.1.2.8
```

I file predefiniti inclusi nel tag riportano questi marcatori:

```cpp
#define CONFIGURATION_H_VERSION 02010206
```

```cpp
#define CONFIGURATION_ADV_H_VERSION 02010206
```

Questi valori identificano la compatibilita dello schema dei file di configurazione. Non devono essere interpretati come il nome completo della release e non vanno modificati soltanto per eliminare un errore di compilazione. `Configuration.h` e `Configuration_adv.h` devono provenire dalla stessa linea di configurazione del sorgente usato.

## Compatibilita hardware

Marlin 2.1 supporta piattaforme a 8 bit e 32 bit attraverso un Hardware Abstraction Layer. La presenza di una famiglia di microcontrollori nel progetto non garantisce pero che ogni scheda derivata sia utilizzabile senza controlli.

La compatibilita reale dipende da:

- identificatore della scheda presente in `Marlin/src/core/boards.h`;
- ambiente PlatformIO disponibile per la piattaforma;
- file dei pin associato alla scheda;
- memoria flash e RAM sufficienti per le funzionalita abilitate;
- bootloader e metodo di caricamento;
- tensioni logiche, cablaggio e periferiche effettivamente supportate.

La direttiva `MOTHERBOARD` e quindi una scelta critica, non una semplice etichetta.

## Compatibilita della configurazione

Una configurazione proveniente da un'altra versione non dovrebbe essere copiata integralmente senza confronto. Tra release possono cambiare:

- nomi delle direttive;
- dipendenze tra funzionalita;
- valori predefiniti;
- controlli di validita;
- file dei pin e ambienti di compilazione;
- comportamento runtime di una funzione.

Per una migrazione e piu sicuro partire dai file puliti della nuova release e trasferire le impostazioni una alla volta, compilando frequentemente.

## Identificare il firmware in esecuzione

Il comando `M115` richiede al firmware informazioni sulla build e sulle capacita dichiarate:

```gcode
M115
```

L'output aiuta a verificare che la scheda stia eseguendo il firmware atteso. Non dimostra pero, da solo, che cablaggio e parametri siano corretti.

## Limiti

- Una guida generale non puo determinare i valori corretti per un hardware sconosciuto.
- La compilazione riuscita verifica coerenza sintattica e parte delle dipendenze, non il cablaggio reale.
- Un'opzione disponibile nel sorgente puo richiedere pin, memoria o componenti non presenti.
- La configurazione predefinita di Marlin e un esempio di partenza, non e pronta per essere caricata su qualsiasi stampante.
- Le protezioni firmware non sostituiscono fusibili, messa a terra e protezioni elettriche adeguate.

## Errori comuni

- **Mescolare release diverse:** sorgente e file di configurazione non sono allineati.
- **Copiare una configurazione completa da un'altra macchina:** i nomi commerciali simili non garantiscono elettronica identica.
- **Considerare riuscita la configurazione quando compila:** molti errori hardware emergono solo durante verifiche controllate.
- **Ignorare la EEPROM:** la macchina continua a usare valori salvati in precedenza.
- **Abilitare molte funzioni insieme:** diventa difficile individuare la modifica che ha introdotto un errore.
- **Disattivare una protezione per eliminare un allarme:** l'allarme puo indicare un problema reale di sensori, riscaldatori o cablaggio.

## Checklist

- Il sorgente proviene dal tag ufficiale `2.1.2.8`.
- Entrambi i file di configurazione appartengono alla stessa release.
- La scheda e presente nell'elenco supportato dal sorgente.
- Ogni valore hardware e stato verificato con documentazione o ispezione della macchina.
- Esiste una copia della configurazione precedente funzionante.
- Dopo il caricamento vengono controllati firmware attivo, EEPROM, sensori e finecorsa prima dei movimenti o del riscaldamento.

## Fonti

- [Marlin 2.1.2.8](https://github.com/MarlinFirmware/Marlin/tree/2.1.2.8)
- [README della release](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/README.md)
- [Configuration.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Documentazione ufficiale sulla configurazione](https://marlinfw.org/docs/configuration/configuration.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin|Struttura dei file di configurazione Marlin]]
- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento|Metodo di configurazione compilazione e caricamento]]
- [[Stampante 3D/Pagine/Componenti di una stampante FDM|Componenti di una stampante FDM]]
