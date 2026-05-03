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
- [[pagine/Registri e XLEN|Registri e XLEN (32, 64, 128-bit)]]
- [[pagine/Formati Istruzioni e Immediate Encoding|Formati Istruzioni e Immediate Encoding]]
- [[pagine/Zicsr|Zicsr: Control and Status Register Instructions]]
- [[pagine/Zifencei|Zifencei: Instruction Fetch Fence]]
- [[pagine/Estensibilita|Estensibilita: Custom Opcode space]]

### Estensioni Standard e Profili
- [[pagine/Estensioni G|Estensioni G (IMAFD_Zicsr_Zifencei)]]
- [[pagine/Bitmanip|Bitmanip (B): Zba, Zbb, Zbc, Zbs]]
- [[pagine/Vector|Vector (V): VLEN, ELEN, Register Grouping (LMUL)]]
- [[pagine/Profili RVA-RVM-RVI|Profili RVA/RVM/RVI: Standardizzazione moderna]]

### Modalità di Privilegio e OS
- [ ] Machine, Supervisor, User Mode
- [ ] **Hypervisor Extension (H)**: Virtualizzazione
- [ ] **RVWMO** (RISC-V Weak Memory Ordering) e istruzioni FENCE
- [ ] **Smstateen**: Gestione degli stati delle estensioni

### Anatomia e Sviluppo del Software
- [[pagine/Anatomia del Software|Anatomia del Software]]
- [[pagine/Reset Flow|Reset Flow]]
- [[pagine/ABI|ABI (Application Binary Interface)]]
- [ ] **SBI (Supervisor Binary Interface)**: Standard tra OS e Firmware
- [ ] Linker Scripts e Inline Assembly
- [ ] IPI (Inter-Processor Interrupts) e gestione software

### Ecosistema e Governance
- [[pagine/Storia e Governance|Storia e Governance (RISC-V International)]]
- [[pagine/Frozen vs Draft|Il concetto di "Frozen" vs "Draft" specifications]]
- [ ] Sicurezza: Enclavi (Keystone), Control-Flow Integrity (CFI)
- [ ] IA/ML: Estensioni per accelerazione tensoriale
