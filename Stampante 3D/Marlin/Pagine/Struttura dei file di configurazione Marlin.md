---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
status: "non revisionato"
difficulty: base
tags: [marlin, configurazione, preprocessore]
aliases: [Configuration.h e Configuration_adv.h, File di configurazione Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]"
marlin-version: "2.1.2.8"
---

# Struttura di Configuration.h e Configuration_adv.h

## Sintesi

Marlin 2.1.2.8 usa principalmente `Marlin/Configuration.h` e `Marlin/Configuration_adv.h` per descrivere la macchina e scegliere le funzionalita compilate. I due file sono codice C/C++ elaborato dal preprocessore, non semplici file di preferenze.

`Configuration.h` contiene le impostazioni fondamentali e piu comuni. `Configuration_adv.h` raccoglie regolazioni dettagliate, componenti aggiuntivi e opzioni che richiedono maggiore attenzione.

## Quando usarlo

Questa struttura serve per:

- capire dove cercare una direttiva;
- distinguere opzioni di base e avanzate;
- leggere correttamente `#define`, commenti e condizioni;
- riconoscere dipendenze tra opzioni;
- evitare di modificare file interni quando esiste una direttiva pubblica;
- documentare in modo ripetibile ogni modifica.

## Ruolo dei file

### `Configuration.h`

Il commento iniziale del file elenca tra le impostazioni di base:

- elettronica;
- sensori di temperatura;
- geometria della stampante;
- finecorsa;
- controller LCD;
- funzionalita comuni.

Il file e diviso in sezioni riconoscibili da commenti come:

```cpp
// @section machine
```

```cpp
// @section temperature
```

```cpp
// @section motion
```

L'ordine del file non coincide sempre con l'ordine migliore per configurare una macchina. Questa guida raggruppa quindi le direttive per sottosistema.

### `Configuration_adv.h`

Contiene opzioni avanzate per termica, movimento, driver, interfacce, periferiche e diagnostica. Il file stesso avverte che alcune impostazioni possono danneggiare la stampante se usate in modo scorretto.

Una direttiva avanzata puo dipendere da una funzione abilitata in `Configuration.h`. Modificare soltanto la seconda parte senza comprendere il prerequisito puo non avere effetto oppure causare un errore durante la build.

## Sintassi delle direttive

### Opzione booleana abilitata

```cpp
#define SHOW_BOOTSCREEN
```

La presenza della direttiva abilita la funzione.

### Opzione booleana disabilitata

```cpp
//#define BLUETOOTH
```

La riga e un commento: la funzione non viene definita.

### Opzione con valore

```cpp
#define BAUDRATE 250000
```

Il simbolo `BAUDRATE` viene associato al valore `250000`.

### Stringa

```cpp
#define STRING_CONFIG_H_AUTHOR "(none, default config)"
```

Le virgolette fanno parte della sintassi. Rimuoverle rende il valore non valido come stringa.

### Lista di valori

```cpp
#define DEFAULT_AXIS_STEPS_PER_UNIT { 80, 80, 400, 500 }
```

Ordine, numero degli elementi e unita dipendono dalla direttiva. Non bisogna dedurli soltanto dall'esempio.

### Espressione

```cpp
#define Z_PROBE_FEEDRATE_SLOW (Z_PROBE_FEEDRATE_FAST / 2)
```

Il valore puo derivare da un'altra direttiva. Cambiare il valore di origine modifica anche il risultato.

### Blocco condizionale

```cpp
#if ENABLED(PSU_CONTROL)
  #define PSU_ACTIVE_STATE LOW
#endif
```

Le direttive interne vengono considerate nel contesto della funzione esterna. Il rientro visivo non crea la dipendenza: sono `#if` e `#endif` a delimitarla.

## Macro di controllo usate da Marlin

Nel codice di configurazione sono comuni espressioni come:

```cpp
#if ENABLED(FEATURE_NAME)
```

```cpp
#if DISABLED(FEATURE_NAME)
```

```cpp
#if BOTH(FEATURE_A, FEATURE_B)
```

```cpp
#if ANY(FEATURE_A, FEATURE_B, FEATURE_C)
```

Servono a includere impostazioni solo quando determinate funzionalita sono attive. Non vanno sostituite con valori casuali: descrivono relazioni che la build usa per selezionare il codice.

## Versionamento dei file

Nei file predefiniti del tag `2.1.2.8` sono presenti:

```cpp
#define CONFIGURATION_H_VERSION 02010206
```

```cpp
#define CONFIGURATION_ADV_H_VERSION 02010206
```

Sono marcatori di compatibilita controllati durante la compilazione. Il fatto che il numero non coincida testualmente con `2.1.2.8` non indica un errore. Devono restare coerenti con i file originali della release, salvo una procedura di migrazione consapevole.

## Impostazioni compile-time e runtime

Le direttive appartengono a due categorie pratiche:

- **strutturali:** scelgono codice, hardware o funzioni e richiedono una nuova build;
- **valori predefiniti modificabili:** inizializzano parametri che possono poi essere cambiati a runtime e salvati in EEPROM.

Per esempio, il file segnala che alcuni parametri di movimento sono valori predefiniti e che la EEPROM, se abilitata, puo sovrascriverli. Per conoscere il valore realmente attivo bisogna interrogare il firmware, non limitarsi a leggere il sorgente.

## File collegati

I due file principali non contengono tutta la logica della piattaforma:

- `Marlin/src/core/boards.h` associa i nomi simbolici alle schede;
- `Marlin/src/pins/` contiene le assegnazioni dei pin;
- `platformio.ini` e `ini/` definiscono gli ambienti di compilazione;
- `Marlin/src/inc/` contiene controlli, condizioni derivate e compatibilita;
- `Marlin/Version.h` contiene informazioni sulla versione del firmware;
- `Marlin/config.ini` puo applicare modifiche alla configurazione durante una build PlatformIO.

In una configurazione normale si modificano prima i file pubblici. I file interni vanno studiati per comprendere il comportamento, non modificati per aggirare un errore.

## Esportazione della configurazione

`Configuration_adv.h` include l'opzione `CONFIG_EXPORT`, disabilitata per impostazione predefinita:

```cpp
//#define CONFIG_EXPORT 2
```

I formati previsti dal file sono:

- `1`: `marlin_config.json`;
- `2`: `config.ini`;
- `3`: `schema.json`;
- `4`: `schema.yml`.

L'esportazione viene prodotta insieme agli artefatti di build. E utile per archiviazione e confronto, ma non sostituisce il versionamento dei due file originali.

## Metodo di lettura di una direttiva

Per ogni opzione controllare nell'ordine:

1. file e sezione in cui compare;
2. commento ufficiale immediatamente precedente;
3. stato predefinito: definita o commentata;
4. tipo di valore e unita di misura;
5. blocco condizionale che la contiene;
6. opzioni richieste, incompatibili o derivate;
7. disponibilita di un comando G-code runtime;
8. persistenza o meno in EEPROM;
9. impatto su memoria, pin e sicurezza;
10. metodo di verifica dopo la build.

## Modello per documentare un'impostazione

```md
### `NOME_DIRETTIVA`

- File:
- Sezione:
- Stato predefinito:
- Scopo:
- Valori e unita:
- Dipendenze:
- Conflitti:
- Effetto sulla macchina:
- Persistenza in EEPROM:
- G-code correlati:
- Rischi:
- Verifica:
```

## Errori comuni

- **Rimuovere soltanto le due barre sbagliate:** si abilita una funzione diversa da quella desiderata.
- **Ignorare il blocco condizionale:** una direttiva resta inattiva perche il prerequisito non e definito.
- **Cambiare unita di misura implicitamente:** millimetri, millimetri al secondo e millimetri al minuto non sono intercambiabili.
- **Modificare file in `src/` per forzare la build:** si nasconde una configurazione incompatibile e si rende difficile aggiornare Marlin.
- **Confondere default e valore attivo:** la EEPROM conserva il valore precedente.
- **Correggere i marcatori di versione a tentativi:** l'errore puo indicare file mescolati tra release differenti.
- **Abilitare opzioni senza controllare la memoria:** le schede piu limitate possono superare flash o RAM disponibili.

## Checklist

- La direttiva esiste nel tag `2.1.2.8`.
- Il commento ufficiale e stato letto per intero.
- Sono note unita, intervallo e ordine dei valori.
- Sono state controllate condizioni e dipendenze.
- E chiaro se la modifica richiede ricompilazione.
- E chiaro se un valore in EEPROM puo prevalere.
- E definita una verifica concreta sulla macchina.
- La modifica e registrata nel controllo versione.

## Fonti

- [Configuration.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [platformio.ini 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/platformio.ini)
- [Documentazione ufficiale sulla configurazione](https://marlinfw.org/docs/configuration/configuration.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita]]
- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento]]
