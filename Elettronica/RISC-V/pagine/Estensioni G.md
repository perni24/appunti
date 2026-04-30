---
date: 2026-04-30
tags: [risc-v, estensioni, g-extension, imafd, zicsr, zifencei, isa]
aliases: ["Estensioni G (IMAFD_Zicsr_Zifencei)"]
type: #permanent-note
status: budding
---

# Estensioni G

In RISC-V, **G** e una abbreviazione per un insieme di estensioni standard pensato come base general-purpose.

In forma moderna:

```txt
G = IMAFD_Zicsr_Zifencei
```

Quindi `RV64G` equivale concettualmente a:

```txt
RV64IMAFD_Zicsr_Zifencei
```

> [!INFO]
> `G` non e una estensione hardware separata. E una scorciatoia di naming per indicare un set comune di estensioni: base integer, moltiplicazione/divisione, atomiche, floating point single/double, CSR e instruction-fetch fence.

## 1. Perche Esiste G

RISC-V e modulare: ogni implementazione puo includere solo le estensioni necessarie.

Questa flessibilita e utile, ma crea un problema pratico: software general-purpose, compilatori e sistemi operativi hanno bisogno di una base relativamente prevedibile.

`G` nasce per indicare una configurazione standard adatta a sistemi general-purpose.

Serve a comunicare rapidamente:

- supporto intero completo;
- moltiplicazione e divisione hardware;
- atomiche per concorrenza;
- floating point single e double precision;
- accesso ai CSR;
- sincronizzazione instruction fetch con `FENCE.I`.

## 2. Componenti di G

| Componente | Nome | Ruolo |
|---|---|---|
| `I` | Base Integer ISA | istruzioni intere base |
| `M` | Integer Multiplication and Division | moltiplicazione e divisione intera |
| `A` | Atomic Instructions | atomiche, LR/SC e AMO |
| `F` | Single-Precision Floating Point | floating point a 32 bit |
| `D` | Double-Precision Floating Point | floating point a 64 bit |
| `Zicsr` | CSR Instructions | accesso a Control and Status Registers |
| `Zifencei` | Instruction-Fetch Fence | sincronizzazione instruction fetch |

Questa composizione rende `G` molto piu ampia di una base `I`, ma ancora piu piccola di un profilo applicativo moderno completo.

## 3. I: Base Integer ISA

`I` e la base intera.

Fornisce:

- registri interi;
- operazioni aritmetiche/logiche;
- load/store;
- branch;
- jump;
- immediate;
- istruzioni di controllo base.

Collegamenti:

- [[Registri e XLEN]]
- [[Formati Istruzioni e Immediate Encoding]]

Senza `I`, non esiste una ISA RISC-V standard completa. Tutte le altre estensioni si appoggiano a una base intera come `RV32I` o `RV64I`.

## 4. M: Moltiplicazione e Divisione

`M` aggiunge moltiplicazione e divisione intera.

Esempi di istruzioni:

- `MUL`;
- `MULH`;
- `MULHU`;
- `MULHSU`;
- `DIV`;
- `DIVU`;
- `REM`;
- `REMU`.

Senza `M`, moltiplicazioni e divisioni devono essere implementate in software o tramite routine runtime.

Impatto hardware:

- serve un moltiplicatore;
- serve una unita di divisione o una sequenza microarchitetturale;
- aumentano area e complessita;
- migliora molto la performance su codice general-purpose.

## 5. A: Atomic Instructions

`A` aggiunge istruzioni atomiche.

Include due famiglie principali:

- LR/SC: load-reserved / store-conditional;
- AMO: atomic memory operations.

Esempi:

- `LR.W`;
- `SC.W`;
- `AMOSWAP.W`;
- `AMOADD.W`;
- `AMOAND.W`;
- `AMOOR.W`;
- `AMOMIN.W`;
- `AMOMAX.W`.

Le atomiche sono fondamentali per:

- lock;
- mutex;
- spinlock;
- runtime multithread;
- kernel;
- strutture dati concorrenti;
- implementazione di primitive C/C++ atomiche.

Impatto hardware:

- gestione reservation set;
- supporto a operazioni read-modify-write;
- interazione con cache e bus;
- coerenza tra hart;
- rispetto del memory model.

Collegamento futuro: [[RVWMO (RISC-V Weak Memory Ordering)]]

## 6. F: Floating Point Single Precision

`F` aggiunge floating point a precisione singola, cioe valori IEEE 754 a 32 bit.

Esempi:

- `FADD.S`;
- `FSUB.S`;
- `FMUL.S`;
- `FDIV.S`;
- `FSQRT.S`;
- `FLW`;
- `FSW`.

`F` introduce anche:

- registri floating point;
- rounding mode;
- floating-point status;
- interazione con CSR come `fcsr`.

Collegamento: [[Zicsr]]

Impatto hardware:

- FPU single precision;
- registri floating point;
- gestione eccezioni floating point;
- conversioni intero/floating point;
- confronto floating point.

## 7. D: Floating Point Double Precision

`D` aggiunge floating point a precisione doppia, cioe valori IEEE 754 a 64 bit.

Esempi:

- `FADD.D`;
- `FSUB.D`;
- `FMUL.D`;
- `FDIV.D`;
- `FSQRT.D`;
- `FLD`;
- `FSD`.

`D` dipende da `F`: una piattaforma con `D` include anche il supporto single precision richiesto.

Impatto hardware:

- FPU piu ampia;
- datapath floating point a 64 bit;
- maggior costo di area e consumo;
- maggiore compatibilita con software scientifico, sistemi operativi e librerie standard.

## 8. Zicsr

`Zicsr` fornisce le istruzioni per accedere ai CSR.

Collegamento: [[Zicsr]]

Esempi:

- `CSRRW`;
- `CSRRS`;
- `CSRRC`;
- varianti immediate.

In una piattaforma general-purpose, i CSR sono necessari per:

- interrupt;
- trap;
- contatori;
- stato floating point;
- privilege mode;
- configurazione macchina;
- sistemi operativi.

Storicamente molte discussioni su RISC-V trattavano CSR e `FENCE.I` come parte implicita di configurazioni comuni. Nel naming moderno e meglio esplicitarle come `Zicsr` e `Zifencei`.

## 9. Zifencei

`Zifencei` fornisce `FENCE.I`.

Collegamento: [[Zifencei]]

`FENCE.I` serve a sincronizzare store verso memoria istruzioni e instruction fetch successivi sullo stesso hart.

E utile per:

- JIT;
- self-modifying code;
- loader;
- firmware;
- patching controllato del codice.

In una configurazione general-purpose, questa istruzione e importante per runtime e sistemi operativi che generano o modificano codice.

## 10. G vs GC

Nella pratica si vede spesso:

```txt
RV64GC
```

Significa:

```txt
RV64G + C
```

Dove `C` e l'estensione compressed a 16 bit.

Differenza:

- `RV64G`: set general-purpose senza istruzioni compresse;
- `RV64GC`: set general-purpose con istruzioni compresse;
- `RV64GCV`: general-purpose + compressed + vector.

`C` non fa parte di `G`, ma e molto comune nelle piattaforme reali per ridurre code size e migliorare instruction cache density.

## 11. G e Toolchain

Nei toolchain, `g` e spesso accettato come abbreviazione.

Esempio:

```bash
riscv64-unknown-elf-gcc -march=rv64g -mabi=lp64d
```

`-march=rv64g` indica il set di istruzioni.

`-mabi=lp64d` indica l'ABI:

- `lp64`: long e puntatori a 64 bit;
- `d`: ABI hard-float con double precision.

Esempio comune:

```bash
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d
```

Questo target e piu realistico per molti sistemi general-purpose perche include anche `C`.

Collegamento futuro: [[ABI (Application Binary Interface): lp64, ilp32, etc.]]

## 12. G e ABI Floating Point

La presenza di `F` e `D` non implica automaticamente che ogni binario usi registri floating point per passare argomenti.

Serve distinguere:

- ISA: quali istruzioni esistono;
- ABI: come funzioni, argomenti e registri vengono usati.

Esempi:

- `rv64g` + `lp64`: istruzioni FP presenti, ma ABI soft-float;
- `rv64g` + `lp64d`: istruzioni FP presenti e ABI hard-float double;
- `rv32g` + `ilp32d`: target 32 bit con double floating ABI.

Per compatibilita binaria, `-march` e `-mabi` devono essere coerenti.

## 13. G non Basta per Definire una Piattaforma Completa

`G` descrive l'ISA unprivileged general-purpose, ma non definisce tutta la piattaforma.

Non specifica da sola:

- privilege architecture;
- interrupt controller;
- memory map;
- cache policy;
- MMU;
- page tables;
- SBI;
- boot flow;
- debug interface;
- timer;
- device tree;
- bus e periferiche.

Per costruire un sistema operativo o un SoC completo servono altre specifiche e convenzioni.

Collegamenti futuri:

- [[Machine, Supervisor, User Mode]]
- [[SBI (Supervisor Binary Interface): Lo standard per comunicare tra OS e Firmware]]
- [[CLINT / PLIC / AIA: Advanced Interrupt Architecture]]

## 14. G e Profili Moderni

I profili RISC-V moderni servono a definire insiemi piu precisi per classi di piattaforme.

Collegamento futuro: [[Profili RVA/RVM/RVI: Comprendere la standardizzazione moderna]]

`G` e utile come abbreviazione storica e pratica, ma un profilo puo richiedere:

- estensioni aggiuntive;
- versioni specifiche;
- requisiti di memory model;
- requisiti di sistema;
- comportamento privilegiato;
- compatibilita software piu ampia.

In altre parole: `G` dice molto sull'ISA, ma un profilo dice di piu sulla piattaforma attesa.

## 15. Impatto Hardware

Implementare `G` richiede molto piu di una ALU intera semplice.

Blocchi necessari:

- integer datapath per `I`;
- multiplier/divider per `M`;
- unita atomica e interazione con memoria per `A`;
- FPU single precision per `F`;
- FPU double precision per `D`;
- register file floating point;
- CSR file e logica CSR per `Zicsr`;
- supporto a `FENCE.I` per `Zifencei`;
- trap per istruzioni illegali e accessi non consentiti;
- test e verifica per tutte le estensioni dichiarate.

Per un core didattico, partire da `RV32I` e aggiungere progressivamente `M`, `A`, `F`, `D`, `Zicsr`, `Zifencei` e piu gestibile che tentare subito `G`.

## 16. Impatto Software

Per il software, `G` abilita una base molto piu ricca.

Permette:

- compilazione C/C++ general-purpose;
- moltiplicazione/divisione hardware;
- primitive atomiche;
- runtime multithread;
- floating point standard;
- accesso a CSR per software privilegiato;
- gestione di codice generato dinamicamente tramite `FENCE.I`.

Ma il software deve comunque sapere:

- ABI;
- privilege level;
- OS o bare-metal;
- presenza di `C`, `V`, `B` o altre estensioni;
- convenzioni di piattaforma.

## 17. Compliance e Verifica

Una implementazione che dichiara `G` deve verificare ogni componente.

Test necessari:

- test RV32I/RV64I;
- test `M`;
- test `A`, inclusi LR/SC e AMO;
- test `F` e `D`, inclusi rounding ed eccezioni;
- test CSR;
- test `FENCE.I`;
- test ABI/toolchain;
- test con programmi reali.

Collegamento futuro: [[Architectural Compliance Testing: Assicurarsi che un core sia RISC-V]]

Un core che implementa solo una parte del bundle non dovrebbe dichiararsi `RV64G`.

## 18. Errori Comuni

### Pensare che G includa tutto RISC-V

`G` non include `C`, `B`, `V`, `H`, privileged architecture o periferiche.

### Confondere G con un profilo

`G` e una abbreviazione ISA. Un profilo definisce requisiti piu ampi e versionati.

### Dimenticare Zicsr e Zifencei

Nel naming moderno, `G` si espande anche a `Zicsr` e `Zifencei`.

### Usare march e mabi incoerenti

Un binario `lp64d` richiede supporto hard-float double compatibile. Non basta dire genericamente `rv64`.

### Implementare A senza un sistema memoria adeguato

Le atomiche non sono solo istruzioni nel decoder: richiedono coerenza e comportamento corretto nel sottosistema memoria.

## 19. Checklist Operativa

Quando leggi o dichiari `RV32G` o `RV64G`, verifica:

1. La base e RV32 o RV64?
2. `I` e implementata correttamente?
3. `M` supporta tutte le operazioni richieste?
4. `A` gestisce LR/SC e AMO con semantica corretta?
5. `F` e `D` includono registri FP, rounding ed eccezioni?
6. `Zicsr` e presente e coerente con privilege mode?
7. `Zifencei` implementa `FENCE.I` correttamente?
8. Il toolchain usa `-march` coerente?
9. L'ABI e compatibile con il floating point disponibile?
10. Sono presenti test di compliance per ogni estensione del bundle?

## 20. Mappa Mentale

```txt
G
  -> I: base integer
  -> M: multiply/divide
  -> A: atomics
  -> F: single precision FP
  -> D: double precision FP
  -> Zicsr: CSR access
  -> Zifencei: FENCE.I
  -> general-purpose ISA base
  -> non include C, V, B, H o piattaforma completa
```

## Collegamenti

- [[Estensibilita]]
- [[Registri e XLEN]]
- [[Formati Istruzioni e Immediate Encoding]]
- [[Zicsr]]
- [[Zifencei]]
- [[RVWMO (RISC-V Weak Memory Ordering)]]
- [[Profili RVA/RVM/RVI: Comprendere la standardizzazione moderna]]

## Riferimenti

- [RISC-V ISA Naming Conventions](https://docs.riscv.org/reference/isa/unpriv/naming.html)
- [RISC-V Unprivileged ISA Specification](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [GCC RISC-V Options](https://gcc.gnu.org/onlinedocs/gcc-15.2.0/gcc/RISC-V-Options.html)
