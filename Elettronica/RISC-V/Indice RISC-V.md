# Indice RISC-V (Mastery Level)

## 1. Introduzione e Filosofia
- [[pagine/Storia e Governance|Storia e Governance (RISC-V International)]]
- [[pagine/Frozen vs Draft|Il concetto di "Frozen" vs "Draft" specifications]]
- [[pagine/Estensibilita|Estensibilita: Custom Opcode space]]

## 2. Architettura Base (ISA) e Z-Extensions
- [[pagine/Registri e XLEN|Registri e XLEN (32, 64, 128-bit)]]
- [[pagine/Zicsr|Zicsr: Control and Status Register Instructions]]
- [[pagine/Zifencei|Zifencei: Instruction Fetch Fence]]
- [[pagine/Formati Istruzioni e Immediate Encoding|Formati Istruzioni e Immediate Encoding (perche i bit sono rimescolati?)]]

## 3. Estensioni Standard e Profili (Profiles)
- [ ] Estensioni G (IMAFD_Zicsr_Zifencei)
- [ ] **Bitmanip (B)**: Zba, Zbb, Zbc, Zbs
- [ ] **Vector (V)**: VLEN, ELEN, Register Grouping (LMUL)
- [ ] **Profili RVA/RVM/RVI**: Comprendere la standardizzazione moderna

## 4. Modalità di Privilegio e Virtualizzazione
- [ ] Machine, Supervisor, User Mode
- [ ] **Hypervisor Extension (H)**: Virtualizzazione hardware
- [ ] PMP (Physical Memory Protection) vs ePMP
- [ ] Smstateen: Gestione degli stati delle estensioni

## 5. Memory Model e Coerenza
- [ ] **RVWMO** (RISC-V Weak Memory Ordering)
- [ ] Istruzioni FENCE e TSO (Total Store Ordering)
- [ ] Gestione delle Cache: Coerenza, Costanza e Side-channel attacks

## 6. Interrupt e Event Handling Avanzato
- [ ] **CLINT / PLIC / AIA**: Advanced Interrupt Architecture
- [ ] IPI (Inter-Processor Interrupts)
- [ ] Gestione Real-time e Latenza deterministica

## 7. Verifica, Debug e Compliance
- [ ] **Architectural Compliance Testing**: Assicurarsi che un core sia RISC-V
- [ ] **Formal Verification**: riscv-formal e verifica formale dei core
- [ ] **Debug Spec (Sdext)**: JTAG, Run-control, Trigger Module
- [ ] **Trace**: Nexus-based processor trace

## 8. Microarchitettura e Interconnessioni
- [ ] Front-end: Branch Prediction (BHT, BTB, RAS)
- [ ] Back-end: Scoreboarding, Register Renaming, ROB
- [ ] Bus e Protocolli: **TileLink**, AXI4, CHI

## 9. Toolchain e Low-level SW
- [ ] ABI (Application Binary Interface): lp64, ilp32, etc.
- [ ] Inline Assembly e Intrinsic (soprattutto per Vector e Bitmanip)
- [ ] Linker Scripts per sistemi Bare-metal
- [ ] **SBI (Supervisor Binary Interface)**: Lo standard per comunicare tra OS e Firmware

## 10. Ecosistema e Futuro
- [ ] Sicurezza: Enclavi (Keystone), Control-Flow Integrity (CFI)
- [ ] IA/ML: Estensioni per accelerazione tensoriale
- [ ] Chiplets e standard UCIe in ambito RISC-V
