---
date: 2026-05-03
tags: [RISC-V, Hardware, Boot, Reset, LowLevel]
type: #permanent-note
status: seedling
---

# Reset Flow in RISC-V

Il **Reset Flow** è la sequenza deterministica di operazioni che il processore esegue dal momento in cui riceve un segnale di reset (hardware o software) fino all'esecuzione della prima istruzione utile del programma.

## Fasi del Reset Flow

### 1. Fase Hardware (Power-On Reset)
Quando la tensione si stabilizza o il segnale di reset viene rilasciato:
- **Azzeramento Registri:** La maggior parte dei registri interni viene portata a uno stato noto. Il Program Counter (`PC`) viene caricato con il **Reset Vector**.
- **Stato di Privilegio:** In RISC-V, il processore inizia sempre in **Machine Mode** (il livello di privilegio più alto) per permettere la configurazione completa del sistema.
- **Disabilitazione Interrupt:** Gli interrupt globali vengono disabilitati per evitare salti imprevisti durante l'inizializzazione.

### 2. Fase Firmware (ROM di Boot)
Spesso il Reset Vector punta a una piccola memoria a sola lettura (Mask ROM) integrata nel chip:
- **Self-Test:** Esecuzione di controlli minimi sull'integrità del chip.
- **Selezione Boot Source:** Il firmware decide da dove caricare il software principale (es. Flash SPI, UART, SD Card) in base alla configurazione dei pin fisici.

### 3. Fase Software (Startup Code / crt0)
Questa è la prima fase sotto il controllo del programmatore (solitamente scritta in Assembly).
- **Inizializzazione Registri:** Poiché l'ISA non garantisce che tutti i registri siano zero al reset, il codice deve azzerarli manualmente per evitare comportamenti indefiniti.
- **Setup dello Stack:** Viene impostato il registro `sp` (Stack Pointer). Senza questa operazione, non è possibile eseguire codice C o Rust (che necessitano dello stack per le variabili locali e gli indirizzi di ritorno).
- **Copia delle Sezioni:**
    - `.data`: Copiata dalla Flash alla RAM (variabili inizializzate).
    - `.bss`: Azzerata nella RAM (variabili non inizializzate).

## Il Reset Vector
Il **Reset Vector** è l'indirizzo fisico della prima istruzione. Non è fisso nello standard RISC-V, ma dipende dall'implementazione hardware specifica:
- **QEMU (virt):** `0x1000` o `0x80000000`.
- **SiFive HiFive1:** `0x20400000`.

## Esempio Concettuale (Assembly)
```assembly
.section .text.entry
.globl _start

_start:
    # 1. Disabilita interrupt
    csrw mstatus, zero
    
    # 2. Imposta lo stack (es. a fine RAM)
    la sp, _stack_end
    
    # 3. Azzera il Global Pointer (opzionale)
    .option push
    .option norelax
    la gp, __global_pointer$
    .option pop

    # 4. Salta al codice C/Rust
    call main
```

---
## Collegamenti
- [[Anatomia del Software]]
- [[ABI]]
- [[Indice RISC-V]]
