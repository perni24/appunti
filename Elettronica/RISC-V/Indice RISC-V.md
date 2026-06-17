# Indice RISC-V (Mastery Level)

RISC-V va studiato distinguendo sempre:

- **ISA**: comportamento visibile al software.
- **Privileged architecture**: privilege mode, trap, interrupt, memoria virtuale e CSR privilegiati.
- **Microarchitettura**: come un core implementa pipeline, cache, branch prediction, OoO, unita funzionali.
- **Piattaforma**: interrupt controller, timer, bus, firmware, device tree, boot flow, OS.
- **Ecosistema**: toolchain, simulatori, compliance, specifiche e profili.

---

## Hardware (Microarchitettura e Implementazione)

### Microarchitettura del Core

- **Pipeline base**: fetch, decode, execute, memory, writeback
- **Front-end**: instruction fetch, predecode, branch prediction, BHT, BTB, RAS
- **Decode e immediate generation**: decodifica opcode, formati R/I/S/B/U/J, compressed decode
- **Back-end in-order**: hazard, forwarding, scoreboarding, stall, flush
- **Back-end out-of-order**: register renaming, reservation stations, ROB, commit
- **Esecuzione intera**: ALU, branch unit, shifter, compare
- **Moltiplicazione e divisione**: implementazione dell'estensione `M`
- **Floating point unit**: implementazione `F`, `D`, `Q`, rounding mode, exception flags
- **Atomic unit**: LR/SC, AMO, ordering, reservation set
- **Vector unit**: VLEN, lanes, register file vettoriale, mask, LMUL
- **CSR unit**: lettura/scrittura CSR, side effect, privilege checks
- **Trap e interrupt path**: salvataggio PC, `mcause`, `mepc`, `mtvec`, ritorno da trap
- **Multi-hart design**: core multipli, hart ID, reset per-hart, sincronizzazione
- **Performance counters**: `cycle`, `instret`, `hpmcounter`, filtri e privilege mode

### Memoria, Cache e Interconnessioni

- **Load/store unit**: accessi allineati, misaligned access, store buffer, load forwarding
- **Modello di memoria**: RVWMO, FENCE, acquire/release, ordering tra hart
- **Cache L1/L2/L3**: instruction cache, data cache, writeback, write-through, replacement policy
- **Coerenza cache**: MESI/MOESI, snooping, directory, coerenza tra hart
- **Cache management operations (CMO)**: flush, invalidate, clean, gestione software delle cache
- **TLB e page table walker**: traduzione indirizzi, page fault, shootdown
- **PMA (Physical Memory Attributes)**: attributi fisici della memoria
- **PMP/ePMP (Physical Memory Protection)**: regioni, permessi, lock, protezione machine mode
- **Bus e protocolli**: TileLink, AXI4, CHI, Wishbone
- **MMIO**: accesso a periferiche memory-mapped, ordering, side effect
- **DMA e coerenza**: interazione tra periferiche, cache e memoria
- **Side-channel hardware**: cache timing, branch predictor state, mitigazioni

### Controller e Periferiche di Sistema

- **CLINT / ACLINT**: timer e software interrupt locali
- **PLIC**: interrupt esterni platform-level
- **AIA**: APLIC, IMSIC, MSI e architettura interrupt moderna
- **Timer**: `mtime`, `mtimecmp`, supervisor timer, `Sstc`
- **IPI (Inter-Processor Interrupts)**: interrupt tra hart
- **Debug Spec (Sdext)**: JTAG, run-control, debug module, abstract commands
- **Trigger Module**: breakpoint, watchpoint, trigger hardware
- **Trace**: processor trace, branch trace, Nexus-style trace
- **Reset controller**: reset vector, boot ROM, inizializzazione minima
- **Power management**: WFI, clock gating, power domain, idle state

### SoC e Piattaforme

- **Boot ROM e mask ROM**: primo codice dopo reset
- **Memory map di piattaforma**: RAM, ROM, MMIO, interrupt controller, timer
- **Device Tree**: descrizione hardware per firmware e Linux
- **ACPI su RISC-V**: piattaforme server e sistemi general-purpose
- **Board support package**: supporto scheda, periferiche, clock, pinmux
- **Sistemi embedded bare-metal**: microcontrollori RISC-V senza OS
- **Application processors**: RISC-V con MMU e Linux
- **Server e datacenter**: profili RVA, coerenza, virtualizzazione, affidabilita

### Verifica, Compliance e Validazione

- **Architectural Compliance Testing**: assicurarsi che un core sia RISC-V
- **RISC-V architectural tests**: test ufficiali ISA e privileged
- **riscv-formal**: verifica formale di core RISC-V
- **riscv-dv**: generazione random di programmi di test
- **ISS lockstep**: confronto RTL con simulatori ISA
- **Simulazione RTL**: Verilator, Questa, VCS, testbench
- **FPGA prototyping**: validazione su FPGA
- **Coverage**: functional coverage, code coverage, corner case
- **Benchmarking**: CoreMark, Dhrystone, SPEC, benchmark embedded/HPC

---

## Software (ISA, Sistemi e Programmazione)

### Fondamenta dell'ISA (Programming Model)

- [[Pagine/Storia e Governance|Storia e Governance (RISC-V International)]]
- [[Pagine/Registri e XLEN|Registri e XLEN (32, 64, 128-bit)]]
- **RV32I**: base integer ISA a 32 bit
- **RV64I**: base integer ISA a 64 bit
- **RV32E / RV64E**: profilo embedded con 16 registri
- **RV128I**: variante a 128 bit e stato della specifica
- [[Pagine/Formati Istruzioni e Immediate Encoding|Formati Istruzioni e Immediate Encoding]]
- **Instruction set listings**: lettura sistematica delle istruzioni base
- **Pseudo-istruzioni assembler**: `li`, `mv`, `nop`, `ret`, `call`, `tail`
- **Assembly RISC-V**: sintassi GNU assembler, label, sezioni, direttive
- [[Pagine/Zicsr|Zicsr: Control and Status Register Instructions]]
- [[Pagine/Zifencei|Zifencei: Instruction Fetch Fence]]
- **Zicntr / Zihpm**: counter e hardware performance monitor
- **Zihintpause / Zihintntl**: hint per pause e locality
- **Zimop**: may-be-operation instructions
- **Zicond**: integer conditional operations
- [[Pagine/Estensibilita|Estensibilita: Custom Opcode space]]

### Estensioni Standard

- [[Pagine/Estensioni G|Estensioni G (IMAFD_Zicsr_Zifencei)]]
- **M**: integer multiplication and division
- **A**: atomic instructions, LR/SC e AMO
- **F**: floating point single precision
- **D**: floating point double precision
- **Q**: floating point quad precision
- **C**: compressed instructions
- **Zc\***: code size reduction extensions
- [[Pagine/Bitmanip|Bitmanip (B): Zba, Zbb, Zbc, Zbs]]
- [[Pagine/Vector|Vector (V): VLEN, ELEN, Register Grouping (LMUL)]]
- **Scalar Crypto**: estensioni crittografiche scalari
- **Vector Crypto**: estensioni crittografiche vettoriali
- **Zfh / Zfhmin**: half precision floating point
- **BF16**: bfloat16 floating point
- **Zfa**: additional floating point instructions
- **Zfinx / Zdinx / Zhinx**: floating point in integer registers
- **Ztso**: total store ordering
- **CMO**: cache management operations
- **CFI**: control-flow integrity
- **Zilsd / Zclsd**: load/store pair per RV32

### Atomics, Concorrenza e Modello di Memoria

- **RVWMO**: RISC-V weak memory ordering
- **FENCE**: sincronizzazione memoria e I/O
- **Acquire/release semantics**: `aq`, `rl`, ordering nei sistemi multicore
- **LR/SC**: load-reserved/store-conditional
- **AMO**: atomic memory operations
- **Zawrs**: wait-on-reservation-set
- **Zacas**: atomic compare-and-swap
- **Zabha**: byte e halfword atomic memory operations
- **Zalasr**: atomic load-acquire e store-release
- **Lock-free programming su RISC-V**: primitive e limiti pratici

### Profili, Piattaforme e Compatibilita

- [[Pagine/Profili RVA-RVM-RVI|Profili RVA/RVM/RVI: Standardizzazione moderna]]
- **RVI profiles**: profili embedded/intermedi
- **RVA profiles**: profili application processor
- **RVM profiles**: profili microcontroller
- **RVB profiles**: profili legati a estensioni bitmanip
- **RVA20 / RVA22 / RVA23**: evoluzione dei profili applicativi
- **Platform specification**: requisiti oltre la sola ISA
- **ISA string e naming convention**: `rv64gc_zba_zbb`, versioni, underscore
- **Compatibilita binaria**: cosa rende due target realmente compatibili
- [[Pagine/Frozen vs Draft|Il concetto di "Frozen" vs "Draft" specifications]]

### Privileged Architecture e OS

- **Machine, Supervisor, User Mode**: privilege levels e responsabilita
- **CSR privilegiati**: `mstatus`, `sstatus`, `mie`, `mip`, `medeleg`, `mideleg`
- **Trap, exception e interrupt**: causa, delega, handler, ritorno
- **Trap vector**: `mtvec`, `stvec`, direct e vectored mode
- **Privilege delegation**: delega da M-mode a S-mode
- **PMP/ePMP lato software**: configurazione, regioni, permessi
- **Virtual memory**: `satp`, page table, page fault
- **Sv32 / Sv39 / Sv48 / Sv57**: schemi di paginazione
- **TLB shootdown**: invalidazione traduzioni tra hart
- **Hypervisor Extension (H)**: virtualizzazione
- **Two-stage translation**: guest physical e supervisor virtual address
- **Smstateen / Ssstateen**: gestione degli stati delle estensioni
- **Smcsrind / Sscsrind**: indirect CSR access
- **Smepmp**: PMP enhancements
- **Smcntrpmf / Sscofpmf**: filtri per contatori e overflow
- **Smrnmi**: resumable non-maskable interrupts
- **Smdbltrp / Ssdbltrp**: double trap handling
- **Pointer masking**: mascheramento puntatori
- **Privileged CFI**: control-flow integrity lato privilegiato

### Firmware, Boot e Sistemi Operativi

- [[Pagine/Reset Flow|Reset Flow]]
- [[Pagine/Anatomia del Software|Anatomia del Software]]
- **Boot chain RISC-V**: ROM, first-stage bootloader, OpenSBI, bootloader, kernel
- **SBI (Supervisor Binary Interface)**: standard tra OS e firmware
- **OpenSBI**: firmware comune per sistemi RISC-V
- **UEFI su RISC-V**: boot general-purpose
- **Device Tree nel boot**: passaggio descrizione hardware al kernel
- **Linux su RISC-V**: requisiti minimi, boot, interrupt, MMU
- **RTOS su RISC-V**: FreeRTOS, Zephyr e sistemi embedded
- **Bare-metal startup**: stack, `.bss`, `.data`, vector table, main
- **Context switching**: salvataggio registri, CSR, FPU/vector state
- **IPI e gestione software multi-hart**: startup secondari, sincronizzazione
- **Signal, syscall e ABI OS**: interfaccia tra user-space e kernel

### ABI, Toolchain e Programmazione Low-Level

- [[Pagine/ABI|ABI (Application Binary Interface)]]
- **psABI RISC-V**: calling convention, relocations, ELF, DWARF
- **Calling convention**: registri caller-saved/callee-saved, stack alignment
- **Linker scripts**: sezioni, memoria, entry point, simboli
- **Inline assembly**: constraint, clobber, volatile, memory barrier
- **Intrinsics**: vector, bitmanip, crypto e compiler builtins
- **GCC RISC-V**: `-march`, `-mabi`, multilib, tuning
- **LLVM/Clang RISC-V**: target, backend, vector support
- **Binutils**: assembler, linker, `objdump`, `readelf`, `objcopy`
- **GDB e debugging**: breakpoint, remote debugging, register inspection
- **QEMU**: emulazione system/user mode
- **Spike**: reference ISA simulator
- **Renode e simulatori embedded**: piattaforme virtuali
- **Disassembly e reverse engineering**: leggere binari RISC-V
- **Profiling**: perf, counters, trace, flame graph

### Sicurezza

- **PMP/ePMP come boundary di sicurezza**: isolamento firmware e bare-metal
- **Enclavi RISC-V**: Keystone e approcci simili
- **Control-Flow Integrity (CFI)**: protezione del flusso di controllo
- **Cryptography extensions**: accelerazione crypto standard
- **Side-channel attacks**: cache, branch predictor, timing, mitigazioni
- **Speculative execution e mitigazioni**: rischi microarchitetturali
- **Secure boot**: catena di fiducia, firma firmware, root of trust
- **TEE e isolamento**: trusted execution environment su RISC-V

### AI, ML, DSP e HPC

- **Vector per HPC**: programmazione vector-length agnostic
- **Vector per DSP**: filtri, audio, signal processing
- **Estensioni AI/ML**: stato delle estensioni tensoriali e vendor-specific
- **Packed SIMD storico**: estensioni draft/non ratificate e relazione con Vector
- **Acceleratori custom**: custom opcode, memory-mapped accelerator, coprocessori
- **Interop con compiler auto-vectorization**: GCC/LLVM e limiti pratici

### Ecosistema e Governance

- [[Pagine/Storia e Governance|Storia e Governance (RISC-V International)]]
- [[Pagine/Frozen vs Draft|Il concetto di "Frozen" vs "Draft" specifications]]
- **Ratified specifications**: cosa e stabile e cosa non cambia
- **Specs under development**: come leggere draft e proposte
- **RISC-V International working groups**: processo di standardizzazione
- **Core open source**: Rocket, BOOM, CVA6, VexRiscv, Ibex, OpenC910
- **Core commerciali**: differenza tra ISA aperta e implementazioni proprietarie
- **Board e hardware disponibili**: microcontroller, SBC, dev board, server board
- **Ecosistema software**: Linux, BSD, toolchain, package distribution
- **Landscape industriale**: embedded, automotive, datacenter, AI, sicurezza

### Percorsi di Studio Consigliati

- **Percorso base ISA**: registri, formati, RV32I/RV64I, assembly, ABI
- **Percorso embedded**: RV32E/RV32I, reset, linker script, bare-metal, interrupt
- **Percorso OS**: privileged architecture, SBI, MMU, Linux, interrupt
- **Percorso hardware**: pipeline, cache, CSR, trap, verifica, compliance
- **Percorso performance**: cache, branch prediction, counters, Vector, profiling
- **Percorso sicurezza**: PMP/ePMP, crypto, CFI, side-channel, secure boot
- **Percorso tooling**: GCC/LLVM, QEMU, Spike, GDB, objdump, riscv-tests

