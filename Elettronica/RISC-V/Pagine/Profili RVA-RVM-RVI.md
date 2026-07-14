---
date: 2026-04-30
tags: [risc-v, profiles, rva, rvm, rvi, compatibility, standardizzazione]
aliases: ["Profili RVA/RVM/RVI: Comprendere la standardizzazione moderna"]
type: #permanent-note
status: budding
---

# Profili RVA-RVM-RVI

I **profili RISC-V** sono insiemi nominati e versionati di ISA base, estensioni e requisiti architetturali pensati per ridurre la frammentazione dell'ecosistema.

Il problema che risolvono e pratico: dire "questo processore e RISC-V" non basta. Bisogna sapere quali estensioni, versioni, privilege mode e capacita minime il software puo assumere.

> [!INFO]
> Una estensione dice "questa funzionalita esiste". Un profilo dice "per questa classe di piattaforme, questo insieme di funzionalita deve o puo esistere". I profili sono quindi un livello sopra le singole estensioni.

## 1. Perche Servono i Profili

RISC-V e modulare.

Questa modularita e un vantaggio per hardware specializzato, ma crea un rischio:

```txt
Core A: RV64GC
Core B: RV64GC_Zba_Zbb
Core C: RV64GCV
Core D: RV64IMAC senza floating point
```

Tutti possono essere "RISC-V", ma il software binario non puo assumere le stesse capacita.

I profili servono a:

- ridurre frammentazione;
- creare target software stabili;
- aiutare compilatori e sistemi operativi;
- chiarire cosa e mandatory e cosa e optional;
- fornire un linguaggio comune tra vendor hardware e software;
- rendere piu semplice distribuire binari compatibili.

## 2. Profilo vs Estensione

Una estensione e un blocco funzionale.

Esempi:

- [[Zicsr]]
- [[Zifencei]]
- [[Bitmanip]]
- [[Vector]]

Un profilo e una combinazione versionata di requisiti.

Esempio concettuale:

```txt
Profilo
  -> base ISA
  -> estensioni mandatory
  -> estensioni optional
  -> requisiti privilege
  -> requisiti di sistema
  -> versioni precise
```

Quindi un profilo non sostituisce le estensioni: le organizza in un target coerente.

## 3. Profilo vs Piattaforma

Un profilo non descrive tutta la piattaforma.

Un profilo puo dire quali funzionalita ISA devono esserci, ma non necessariamente definisce:

- interrupt controller concreto;
- memory map;
- periferiche;
- boot ROM;
- device tree;
- firmware;
- layout fisico del SoC;
- protocollo bus;
- policy di cache;
- board support package.

Per questi aspetti servono specifiche di piattaforma, firmware, SBI, ACPI/device tree o documentazione vendor.

Collegamento futuro: [[SBI (Supervisor Binary Interface): Lo standard per comunicare tra OS e Firmware]]

## 4. Naming dei Profili

I profili usano nomi strutturati.

Forma concettuale:

```txt
<family><release><mode><xlen>
```

Esempi:

```txt
RVA20U64
RVA20S64
RVA22U64
RVA23U64
RVA23S64
RVI20U32
```

Significato:

- `RV`: famiglia RISC-V;
- lettera famiglia: `A`, `I`, `M`, ecc.;
- numero release: spesso legato all'anno o ciclo di rilascio;
- mode: `U`, `S`, `M` secondo il privilege level;
- XLEN: `32` o `64`.

## 5. Mode del Profilo

Il suffisso del mode indica quale livello di privilegio e coperto.

| Suffisso | Significato | Contesto |
|---|---|---|
| `U` | User mode | applicazioni user-space |
| `S` | Supervisor mode | kernel, OS, hypervisor context |
| `M` | Machine mode | firmware, boot, bare-metal basso livello |

Esempio:

```txt
RVA23U64
```

Indica un profilo della famiglia `RVA`, release 23, user-mode, XLEN 64.

```txt
RVA23S64
```

Indica i requisiti supervisor-mode della stessa famiglia/release.

## 6. RVA

`RVA` e la famiglia di profili per application processors.

Target tipico:

- sistemi operativi ricchi;
- Linux distribuito come binario;
- Android;
- server;
- desktop;
- workload general-purpose;
- software di terze parti che deve girare su hardware di vendor diversi.

Obiettivo:

```txt
portabilita binaria per applicazioni e sistemi operativi
```

RVA e quindi la famiglia piu importante quando si parla di ecosistemi software ampi.

## 7. RVA20, RVA22, RVA23

Le release RVA evolvono nel tempo.

Esempi importanti:

- `RVA20`: prima base di profili application-class;
- `RVA22`: evoluzione con requisiti piu moderni;
- `RVA23`: profilo piu recente e rilevante per application processors moderni.

RVA23 e particolarmente importante perche rende piu forte la convergenza dell'ecosistema software. Secondo RISC-V International, elementi come Vector e Hypervisor diventano componenti chiave per workload moderni, inclusi AI/ML, crittografia, compressione e virtualizzazione.

Collegamenti:

- [[Vector]]
- [[Estensioni G]]

## 8. RVA e Software Portabile

Senza profili, un vendor software dovrebbe gestire molte combinazioni:

```txt
RV64GC
RV64GC_Zba_Zbb
RV64GCV
RV64GC con H
RV64GC senza H
```

Con un profilo come RVA23, il software puo assumere un baseline piu chiaro.

Questo aiuta:

- toolchain;
- distribuzioni Linux;
- runtime;
- browser;
- JVM;
- container;
- librerie ottimizzate;
- applicazioni commerciali.

Le estensioni optional possono comunque essere scoperte a runtime e usate da librerie ottimizzate.

## 9. RVI

`RVI` e la famiglia storica/base per profili unprivileged integer.

Target concettuale:

- base integer ISA;
- user-mode;
- requisiti minimi;
- software che vuole assumere una base RISC-V comune senza entrare nel mondo application-class completo.

Esempio:

```txt
RVI20U32
RVI20U64
```

`RVI` e utile per capire la standardizzazione iniziale dei profili, ma non va confuso con un profilo completo per sistemi operativi ricchi.

## 10. RVM

`RVM` viene usato nelle discussioni sui profili come famiglia orientata ai microcontrollori.

Target tipico:

- microcontroller;
- bare-metal;
- RTOS;
- sistemi senza virtual memory;
- firmware embedded;
- dispositivi a basso consumo;
- sistemi con risorse limitate.

Va trattato con attenzione: rispetto a `RVA`, il profilo microcontroller e piu legato a una area in evoluzione e puo avere stato di maturita diverso a seconda del documento ufficiale consultato.

Il punto concettuale rimane chiaro:

```txt
RVA -> application processors con OS ricchi
RVM -> microcontroller / embedded senza virtual memory
RVI -> base integer unprivileged
```

## 11. Mandatory e Optional

Ogni profilo distingue tra requisiti mandatory e optional.

Mandatory:

- devono essere implementati per dichiarare conformita al profilo;
- possono essere assunti dal software target;
- riducono frammentazione.

Optional:

- sono permessi dal profilo;
- non sono richiesti per la conformita;
- devono essere rilevati prima dell'uso;
- permettono ottimizzazioni senza rompere portabilita.

Esempio concettuale:

```txt
Software baseline
  -> usa mandatory extensions

Libreria ottimizzata
  -> controlla optional extension
  -> usa percorso veloce se presente
  -> usa fallback se assente
```

## 12. Profili e G

`G` e un bundle ISA.

Collegamento: [[Estensioni G]]

Un profilo e piu ricco:

| Concetto | Cosa descrive |
|---|---|
| `G` | abbreviazione per `IMAFD_Zicsr_Zifencei` |
| Profilo | set versionato di requisiti ISA e architetturali |
| Piattaforma | SoC, firmware, periferiche, boot, interrupt, memory map |

Quindi:

```txt
RV64G != RVA23
```

`RV64G` dice quali istruzioni base general-purpose ci sono.

`RVA23` definisce un target application-class piu ampio e versionato.

## 13. Profili e Vector

La Vector extension e centrale nei profili application-class moderni.

Collegamento: [[Vector]]

Motivi:

- AI/ML;
- crittografia;
- compressione;
- multimedia;
- calcolo numerico;
- librerie ottimizzate;
- Android/Linux ecosystem.

Il punto non e solo "avere vector", ma avere un baseline abbastanza comune perche toolchain, runtime e librerie possano generare codice utile senza esplodere in varianti incompatibili.

## 14. Profili e Hypervisor

Per application processors moderni, la virtualizzazione e importante.

Collegamento futuro: [[Hypervisor Extension (H): Virtualizzazione hardware]]

L'estensione Hypervisor (`H`) abilita scenari come:

- cloud;
- server;
- container e VM;
- isolamento workload;
- sistemi enterprise;
- OS multipli sulla stessa macchina.

Nei profili application-class piu recenti, il supporto a `H` diventa rilevante per allineare RISC-V alle aspettative di piattaforme server e general-purpose.

## 15. Profili e Toolchain

Per un compilatore, un profilo e un target piu stabile.

Senza profili:

```bash
-march=rv64gc_zba_zbb_zbs_v
```

Con profili, toolchain e distribuzioni possono ragionare su baseline standardizzate.

Il profilo aiuta a decidere:

- quali istruzioni generare di default;
- quali librerie distribuire;
- quali fallback servono;
- quali ottimizzazioni sono sempre sicure;
- quali feature vanno rilevate a runtime.

## 16. Profili e Compliance

I profili hanno valore solo se verificabili.

Collegamento futuro: [[Architectural Compliance Testing: Assicurarsi che un core sia RISC-V]]

Una implementazione che dichiara un profilo deve dimostrare:

- ISA base corretta;
- estensioni mandatory presenti;
- versioni corrette;
- comportamento privilege coerente;
- optional dichiarate correttamente;
- assenza di feature dichiarate ma non funzionanti.

La compliance rispetto a un profilo e piu forte del semplice dire "supporta RISC-V".

## 17. Profili e Frammentazione

La frammentazione nasce quando il software non sa cosa puo assumere.

Esempio:

```txt
Vendor A: include Vector
Vendor B: no Vector
Vendor C: include Bitmanip parziale
Vendor D: include Hypervisor
```

Se tutti dichiarano solo "RV64", il software deve fare molte assunzioni manuali.

Con profili:

- alcune capacita diventano baseline;
- altre diventano optional dichiarate;
- il software ha un target migliore;
- l'ecosistema converge.

## 18. Profili vs Custom Extension

Le estensioni custom restano possibili.

Collegamento: [[Estensibilita]]

Pero:

- non dovrebbero sostituire requisiti mandatory del profilo;
- devono essere dichiarate separatamente;
- non devono rompere compatibilita;
- richiedono fallback software;
- non possono essere assunte dal software portabile.

Un vendor puo differenziarsi con custom extension, ma il profilo serve a mantenere una base comune.

## 19. Lettura Pratica dei Nomi

Esempio:

```txt
RVA23U64
```

Interpretazione:

- `RVA`: application processor;
- `23`: release;
- `U`: user-mode;
- `64`: XLEN 64.

Esempio:

```txt
RVA23S64
```

Interpretazione:

- application processor;
- release 23;
- supervisor-mode;
- 64 bit;
- rilevante per kernel e OS.

Esempio:

```txt
RVI20U32
```

Interpretazione:

- base integer profile family;
- release 20;
- user-mode;
- 32 bit.

## 20. Impatto Hardware

Per un progettista hardware, i profili cambiano la domanda.

Invece di chiedere:

```txt
quali estensioni voglio implementare?
```

conviene chiedere:

```txt
quale profilo voglio dichiarare?
quali estensioni mandatory devo supportare?
quali optional voglio aggiungere?
```

Questo influenza:

- dimensionamento core;
- FPU;
- vector unit;
- hypervisor support;
- interrupt/exception behavior;
- memory model;
- CSR;
- test compliance;
- documentazione del prodotto.

## 21. Impatto Software

Per il software, i profili definiscono target piu utili.

Benefici:

- meno varianti binarie;
- baseline chiara;
- librerie ottimizzabili;
- runtime piu semplice;
- migliori decisioni nel compilatore;
- portabilita tra vendor.

Ma il software deve comunque gestire:

- optional extensions;
- differenze di piattaforma;
- firmware;
- kernel;
- disponibilita reale delle feature;
- bug o errata vendor.

## 22. Errori Comuni

### Confondere profilo e ISA string

`rv64gcv` e una ISA string. `RVA23U64` e un profilo.

### Pensare che un profilo definisca tutto il SoC

Il profilo non sostituisce specifiche di piattaforma, firmware e periferiche.

### Assumere che RVM abbia lo stesso stato di RVA

RVA ha specifiche ratificate e molto visibili per application processors. RVM va verificato sul documento ufficiale corrente prima di usarlo come requisito commerciale.

### Ignorare mandatory vs optional

Una optional extension non puo essere assunta senza detection.

### Confondere RVI e RISC-V International

Nel contesto dei profili, `RVI` indica una profile family. In altri contesti, RVI puo anche abbreviare RISC-V International; bisogna leggere il contesto.

## 23. Checklist Operativa

Quando analizzi una piattaforma RISC-V:

1. Quale profilo dichiara?
2. La dichiarazione e per user, supervisor o machine mode?
3. XLEN e 32 o 64?
4. Quale release del profilo e usata?
5. Quali estensioni mandatory sono richieste?
6. Quali optional sono presenti?
7. Il profilo e ratificato o ancora in evoluzione?
8. Toolchain e kernel supportano quel profilo?
9. Esistono test di compliance?
10. La piattaforma documenta anche firmware, interrupt, boot e memory map?

## 24. Mappa Mentale

```txt
Profili RISC-V
  -> riducono frammentazione
  -> nominati e versionati
  -> mandatory + optional
  -> RVA: application processors
  -> RVI: base integer unprivileged
  -> RVM: microcontroller / embedded, da verificare nello stato corrente
  -> profilo != estensione
  -> profilo != piattaforma completa
```

## Collegamenti

- [[Estensibilita]]
- [[Estensioni G]]
- [[Bitmanip]]
- [[Vector]]
- [[Zicsr]]
- [[Zifencei]]
- [[Frozen vs Draft]]
- [[Architectural Compliance Testing: Assicurarsi che un core sia RISC-V]]
- [[Machine, Supervisor, User Mode]]

## Riferimenti

- [RISC-V Technical Specifications - Profiles](https://riscv.atlassian.net/wiki/spaces/HOME/pages/16154769/RISC-V%2BTechnical%2BSpecifications)
- [RVA23 Profile PDF](https://docs.riscv.org/reference/profiles/rva23/_attachments/rva23-profile.pdf)
- [RISC-V Profiles PDF: RVA20, RVI20, RVA22](https://docs.riscv.org/reference/profiles/rva20-rvi20-rva22/_attachments/RISC-V_Profiles.pdf)
- [RISC-V Profile Policy](https://lf-riscv.atlassian.net/wiki/spaces/WPMU/pages/462258208/RISC-V%2BProfile%2BPolicy)
