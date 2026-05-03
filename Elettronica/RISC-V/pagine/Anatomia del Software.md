---
date: 2026-05-03
tags: [risc-v, software, architettura, boot, trap, initialization]
type: #permanent-note
status: seedling
---

# Anatomia del Software RISC-V

Questa nota descrive la struttura funzionale minima che un software deve avere per girare su un'architettura RISC-V, indipendentemente dal linguaggio di programmazione utilizzato.

## 1. Reset Flow e Entry Point
Al momento dell'accensione o del reset, il processore salta a un indirizzo predefinito (Reset Vector).
- **Funzionalità:** È il primo punto in cui viene eseguito il codice (solitamente in assembly).
- **Obiettivo:** Preparare l'hardware minimo per permettere l'esecuzione di codice più complesso.

## 2. Inizializzazione dello Stato
Prima di eseguire la logica applicativa, il software deve configurare lo "stato" della CPU:
- **Stack Pointer (`sp`):** Configurazione del registro `x2` per permettere le chiamate a funzione.
- **Global Pointer (`gp`):** Configurazione opzionale del registro `x3` per ottimizzare l'accesso alle variabili globali.
- **Pulizia Memoria:** Azzeramento della sezione `.bss` (variabili non inizializzate) e copia della sezione `.data` dalla memoria flash alla RAM.

## 3. Configurazione dei Trap Handler
RISC-V gestisce errori (eccezioni) e segnali esterni (interruzioni) tramite i **Trap**.
- **`mtvec` (Machine Trap Vector):** Il software deve scrivere in questo registro l'indirizzo della funzione che gestirà eventuali problemi o interrupt.
- **Vettore dei Trap:** Una tabella di salti che indirizza la CPU verso il codice corretto in base al tipo di evento.

## 4. Ciclo di Esecuzione (Main Loop)
Una volta preparato l'ambiente, il software entra nel suo flusso principale.
- **Bare-metal:** Spesso un ciclo infinito `while(1)` che legge sensori o elabora dati.
- **OS-ready:** Caricamento di un Kernel e salto alla modalità di privilegio inferiore (User Mode).

## 5. Interazione con le Modalità di Privilegio
La struttura deve prevedere come il software interagisce con i diversi livelli di sicurezza (Machine, Supervisor, User):
- **System Calls (`ecall`):** Come un programma "User" chiede servizi al "Machine" (es. input/output).
- **MRET/SRET:** Istruzioni per tornare correttamente dal trap handler al programma principale.

> [!TIP]
> Questa struttura è ciò che trasforma un "pezzo di codice" in un software capace di gestire l'hardware in modo robusto. Senza inizializzazione dello stack o dei trap handler, il processore entrerebbe in uno stato di errore non appena incontra la prima chiamata a funzione o il primo interrupt.
