# Indice RISC-V (Mastery Level)

## Hardware (Microarchitettura e Implementazione)
### Microarchitettura del Core
- [ ] **Front-end**: Branch Prediction (BHT, BTB, RAS)
- [ ] **Back-end**: Scoreboarding, Register Renaming, Out-of-Order, ROB
- [ ] **Esecuzione**: ALU, FPU, Unità di moltiplicazione/divisione

### Memoria e Interconnessioni
- [ ] **Gestione delle Cache**: Coerenza, Costanza e Side-channel attacks
- [ ] **Bus e Protocolli**: TileLink, AXI4, CHI
- [ ] **PMP (Physical Memory Protection)**: Implementazione hardware

### Controller e Periferiche di Sistema
- [ ] **CLINT / PLIC / AIA**: Advanced Interrupt Architecture (Implementazione)
- [ ] **Debug Spec (Sdext)**: JTAG, Run-control, Trigger Module
- [ ] **Trace**: Nexus-based processor trace

### Verifica e Compliance
- [ ] **Architectural Compliance Testing**: Assicurarsi che un core sia RISC-V
- [ ] **Formal Verification**: riscv-formal e verifica formale dei core

---

## Software (ISA, Sistemi e Programmazione)
### Fondamenta dell'ISA (Programming Model)
- [[Pagine/Registri e XLEN|Registri e XLEN (32, 64, 128-bit)]]
- [[Pagine/Formati Istruzioni e Immediate Encoding|Formati Istruzioni e Immediate Encoding]]
- [[Pagine/Zicsr|Zicsr: Control and Status Register Instructions]]
- [[Pagine/Zifencei|Zifencei: Instruction Fetch Fence]]
- [[Pagine/Estensibilita|Estensibilita: Custom Opcode space]]

### Estensioni Standard e Profili
- [[Pagine/Estensioni G|Estensioni G (IMAFD_Zicsr_Zifencei)]]
- [[Pagine/Bitmanip|Bitmanip (B): Zba, Zbb, Zbc, Zbs]]
- [[Pagine/Vector|Vector (V): VLEN, ELEN, Register Grouping (LMUL)]]
- [[Pagine/Profili RVA-RVM-RVI|Profili RVA/RVM/RVI: Standardizzazione moderna]]

### Modalità di Privilegio e OS
- [ ] Machine, Supervisor, User Mode
- [ ] **Hypervisor Extension (H)**: Virtualizzazione
- [ ] **RVWMO** (RISC-V Weak Memory Ordering) e istruzioni FENCE
- [ ] **Smstateen**: Gestione degli stati delle estensioni

### Anatomia e Sviluppo del Software
- [[Pagine/Anatomia del Software|Anatomia del Software]]
- [[Pagine/Reset Flow|Reset Flow]]
- [[Pagine/ABI|ABI (Application Binary Interface)]]
- [ ] **SBI (Supervisor Binary Interface)**: Standard tra OS e Firmware
- [ ] Linker Scripts e Inline Assembly
- [ ] IPI (Inter-Processor Interrupts) e gestione software

### Ecosistema e Governance
- [[Pagine/Storia e Governance|Storia e Governance (RISC-V International)]]
- [[Pagine/Frozen vs Draft|Il concetto di "Frozen" vs "Draft" specifications]]
- [ ] Sicurezza: Enclavi (Keystone), Control-Flow Integrity (CFI)
- [ ] IA/ML: Estensioni per accelerazione tensoriale
