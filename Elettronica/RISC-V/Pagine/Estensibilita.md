---
date: 2026-04-23
tags: [risc-v, estensioni, custom-opcode, isa, microarchitettura, toolchain]
type: #permanent-note
status: budding
---

# Estensibilita

L'estensibilita e una delle caratteristiche centrali di RISC-V: l'ISA e progettata per partire da una base minima e crescere tramite estensioni standard, estensioni custom e implementazioni specializzate.

Questa scelta permette di costruire processori molto diversi senza abbandonare una base software comune.

> [!INFO]
> In RISC-V bisogna distinguere tra estensioni standard, custom e non-conforming. Una estensione custom usa spazi di encoding riservati al vendor; una estensione non-conforming usa encoding standard o reserved in modo non previsto e puo rompere la compatibilita futura.

## 1. Perche RISC-V e Estendibile

RISC-V nasce con un obiettivo diverso da molte ISA storiche: fornire una base semplice, stabile e modulare su cui costruire processori specifici per domini diversi.

La modularita serve a supportare microcontrollori, SoC embedded, sistemi Linux-capable, acceleratori crittografici, DSP, AI/ML, real-time control e ricerca su nuove microarchitetture.

Il vantaggio e che non tutti i sistemi devono pagare il costo di tutte le funzionalita. Un microcontrollore puo usare una base molto ridotta, mentre un processore applicativo puo includere estensioni per atomiche, floating point, vector, virtualizzazione e sicurezza.

## 2. Base ISA ed Estensioni

Una ISA RISC-V e composta da:

```txt
Base ISA
  + estensioni standard
  + eventuali estensioni custom
  + profilo / ABI / privilege architecture
```

Esempi:

- `RV32I`: base intera a 32 bit;
- `RV64I`: base intera a 64 bit;
- `M`: moltiplicazione e divisione;
- `A`: atomiche;
- `F`: floating point single precision;
- `D`: floating point double precision;
- `C`: istruzioni compresse;
- `V`: vector extension;
- `B`: bit manipulation;
- `Zicsr`: Control and Status Register Instructions;
- `Zifencei`: Instruction Fetch Fence.

Esempio:

```txt
RV64IMAFDC
```

Indica un target RV64 con estensioni `I`, `M`, `A`, `F`, `D` e `C`.

## 3. Standard, Reserved e Custom

RISC-V divide gli spazi di encoding in categorie.

| Categoria | Significato |
|---|---|
| Standard | Usato da specifiche definite da RISC-V International |
| Reserved | Non ancora assegnato, tenuto libero per futuri standard |
| Custom | Disponibile per estensioni vendor-specific |

Usare uno spazio **custom** e il modo corretto per aggiungere istruzioni private senza entrare in conflitto con futuri standard.

Usare uno spazio **reserved** o **standard** per una istruzione privata e pericoloso: una futura estensione ufficiale potrebbe usare lo stesso encoding.

## 4. Custom Opcode Space

Il custom opcode space e lo spazio di codifica riservato alle estensioni non standard definite da vendor, progetti o team specifici.

Nella codifica a 32 bit, RISC-V mette a disposizione major opcode custom, comunemente indicati come:

- `custom-0`;
- `custom-1`;
- `custom-2`;
- `custom-3`.

Questi spazi sono pensati per istruzioni non standard che non devono confliggere con le estensioni ufficiali.

> [!WARNING]
> Prima di usare un custom opcode bisogna verificare la versione della specifica, XLEN, formato istruzione e vincoli del target. Le mappe di encoding sono parte della specifica e non vanno ricostruite a memoria.

## 5. Custom Extension vs Non-Conforming Extension

Una estensione custom conforme usa solo encoding custom.

Una estensione non-conforming usa encoding standard o reserved in modo non previsto.

| Tipo | Encoding Usato | Rischio |
|---|---|---|
| Custom extension | Custom encoding | Compatibile con lo spazio previsto per vendor |
| Non-conforming extension | Standard o reserved encoding | Possibile conflitto con standard presenti o futuri |

La differenza e importante perche una implementazione puo essere RISC-V compatibile anche con estensioni custom, ma diventa problematica se ridefinisce istruzioni standard o occupa encoding riservati.

## 6. Quando Usare Estensioni Custom

Le estensioni custom hanno senso quando una funzionalita e troppo specifica per diventare standard generale.

Esempi:

- accelerazione AES o SHA;
- operazioni DSP per segnali;
- moltiplicazioni specializzate per ML;
- controllo motori;
- elaborazione sensori;
- bit packing per protocolli industriali;
- istruzioni per acceleratori tightly-coupled;
- primitive per sicurezza proprietaria;
- operazioni su registri o memoria non standard.

Il criterio non e "posso aggiungere una istruzione?", ma "il vantaggio supera il costo sull'intero stack?".

## 7. Costi di una Istruzione Custom

Una istruzione custom non modifica solo il decoder hardware.

Impatti tipici:

- decoder e datapath;
- hazard unit;
- forwarding;
- pipeline stall;
- gestione eccezioni;
- simulatore;
- assembler;
- disassembler;
- compiler backend;
- intrinsics;
- ABI;
- debugger;
- test;
- documentazione;
- compliance interna;
- supporto firmware o kernel.

Una istruzione custom semplice puo essere economica nel core, ma costosa nell'ecosistema software.

## 8. Toolchain

Per usare davvero una istruzione custom serve supporto toolchain.

Opzioni:

1. Usare assembly inline.
2. Usare direttive o pseudo-istruzioni dell'assembler.
3. Aggiungere una istruzione al toolchain assembler/disassembler.
4. Esporre intrinsics C/C++.
5. Integrare il supporto nel backend del compilatore.

Esempio concettuale con assembly inline:

```c
static inline unsigned custom_op(unsigned a, unsigned b) {
    unsigned result;

    asm volatile (
        ".insn r CUSTOM_0, 0, 0, %0, %1, %2"
        : "=r"(result)
        : "r"(a), "r"(b)
    );

    return result;
}
```

Questo esempio mostra l'idea: incapsulare l'istruzione custom dietro una funzione o intrinsic, evitando di spargere assembly nel codice applicativo.

> [!NOTE]
> La sintassi concreta di `.insn` e dei nomi opcode dipende dal toolchain usato. Va verificata su assembler, versione GCC/LLVM e target RISC-V specifico.

## 9. Compiler Support

Inline assembly e utile per prototipi, ma non sempre basta.

Se l'istruzione custom deve essere usata automaticamente dal compilatore, serve modificare o configurare il backend.

Motivi:

- il compilatore deve sapere quando usare l'istruzione;
- deve conoscere latenza e vincoli;
- deve rispettare registri e calling convention;
- deve evitare istruzioni non supportate dal target;
- deve generare fallback quando necessario;
- deve esporre feature flag corretti.

Per prodotti reali conviene definire macro di feature detection, intrinsics stabili, fallback software, test per generazione codice e documentazione ABI.

## 10. Naming delle Estensioni

Le estensioni RISC-V hanno convenzioni di naming.

In generale:

- estensioni standard hanno nomi definiti dalle specifiche;
- molte estensioni standard modulari usano prefissi come `Z`;
- estensioni custom o non standard sono spesso identificate con prefisso `X`;
- vendor e progetti dovrebbero documentare nome, versione e semantica.

Esempio concettuale:

```txt
RV64IMAC_Xvendorcrypto
```

Il nome comunica che oltre alle estensioni standard esiste una estensione vendor-specific. Il naming non basta per garantire compatibilita: serve una specifica pubblica o interna precisa.

## 11. Custom CSR

L'estensibilita non riguarda solo istruzioni.

Anche i Control and Status Registers possono avere spazi custom o vendor-specific, ma vanno gestiti con attenzione.

Rischi:

- conflitto con CSR standard;
- differenze tra privilege mode;
- problemi con sistema operativo e firmware;
- accessi non autorizzati;
- incompatibilita con debug e virtualizzazione.

Un CSR custom dovrebbe specificare indirizzo, privilege level, comportamento su lettura/scrittura, bit read-only o WARL, reset value, effetti collaterali e interazione con interrupt, trap e power management.

## 12. Estensioni Custom e ABI

Una estensione custom puo restare interna a un firmware o diventare parte dell'interfaccia pubblica.

La seconda opzione e molto piu vincolante.

Se codice utente, librerie o ABI dipendono da una estensione custom:

- il binario non sara portabile su core RISC-V generici;
- servono feature flag;
- servono fallback;
- il sistema operativo deve esporre capability;
- il compilatore deve sapere quale target usare;
- i pacchetti software devono dichiarare requisiti architetturali.

Per questo spesso e meglio isolare l'uso dell'estensione in librerie specializzate.

## 13. Fragmentation Risk

L'estensibilita e potente, ma puo creare frammentazione.

Problema:

```txt
Core A supporta XcryptoA
Core B supporta XcryptoB
Core C supporta solo standard B/V
Software generico non puo assumere nessuna delle tre varianti custom
```

Senza profili, discovery e fallback, il software diventa difficile da distribuire.

La frammentazione si riduce con estensioni standard, profili coerenti, feature detection, fallback software, documentazione pubblica, toolchain allineata e compliance test interni.

## 14. Estensioni Standard vs Custom

Prima di creare una estensione custom, verificare se esiste gia una estensione standard adatta.

Esempi:

- bit manipulation: [[Bitmanip (B): Zba, Zbb, Zbc, Zbs]];
- vector operations: [[Vector (V): VLEN, ELEN, Register Grouping (LMUL)]];
- atomiche: `A`, `Zacas`, `Zawrs`;
- cache management: CMO;
- conditional operations: `Zicond`;
- may-be operations: `Zimop`.

Usare uno standard offre migliore supporto toolchain, maggiore portabilita, test piu maturi, meno documentazione custom e compatibilita con profili futuri.

Una custom extension e giustificata quando lo standard non copre il dominio o quando serve differenziazione hardware specifica.

## 15. Rapporto con Frozen e Draft

Le estensioni custom devono essere valutate anche rispetto allo stato delle specifiche correlate.

Collegamento: [[Frozen vs Draft|Il concetto di "Frozen" vs "Draft" specifications]].

Se una custom extension e progettata vicino a una estensione standard Draft, il rischio e doppio:

- la custom potrebbe diventare incompatibile con lo standard finale;
- il team potrebbe dover supportare sia la versione custom sia quella standard.

Strategia prudente:

- usare custom opcode per prototipi;
- non occupare reserved encoding;
- mantenere fallback software;
- monitorare la specifica standard;
- migrare verso lo standard ratificato quando maturo.

## 16. Pipeline e Microarchitettura

Una istruzione custom puo sembrare locale, ma puo influenzare molte parti della microarchitettura.

Domande progettuali:

- usa registri interi, floating point o vector?
- ha latenza fissa o variabile?
- blocca la pipeline?
- genera eccezioni?
- accede alla memoria?
- richiede ordinamento con `FENCE`?
- interagisce con interrupt?
- deve essere restartable dopo trap?
- e visibile al debugger?

Se l'istruzione accede a memoria o dispositivi, il problema diventa piu complesso perche coinvolge memory model, cache, coerenza e privilege mode.

## 17. Test e Validazione

Per una estensione custom servono test dedicati.

Livelli minimi:

- test assembly per encoding e semantica;
- test C/C++ tramite intrinsic;
- simulazione ISA;
- simulazione RTL;
- test di corner case;
- test di eccezioni;
- test di privilege access;
- test di performance;
- test di regressione;
- confronto con modello golden.

Anche se la compliance ufficiale copre lo standard RISC-V, il vendor deve verificare internamente la parte custom.

## 18. Checklist per una Estensione Custom

Prima di introdurre una estensione custom:

1. Esiste gia una estensione standard equivalente?
2. Il beneficio prestazionale o energetico e misurato?
3. Quale custom opcode viene usato?
4. L'encoding evita conflitti con standard e reserved?
5. La semantica e documentata bit per bit?
6. Il comportamento in caso di eccezione e definito?
7. Esiste supporto assembler/disassembler?
8. Esistono intrinsic o API stabili?
9. Il compilatore puo generare fallback?
10. Il sistema operativo deve conoscere l'estensione?
11. La feature e visibile in ABI o solo interna?
12. Esistono test e modello di riferimento?
13. Come viene dichiarata la presenza della feature?
14. Cosa succede se una estensione standard futura copre lo stesso caso?

## 19. Best Practices

1. Usare estensioni standard quando soddisfano il requisito.
2. Usare solo custom encoding per istruzioni vendor-specific.
3. Non occupare encoding reserved per scorciatoia.
4. Documentare nome, versione, encoding e semantica.
5. Isolare l'accesso tramite intrinsic o librerie.
6. Prevedere fallback software.
7. Allineare hardware, toolchain, debugger e test.
8. Separare prototipi da ABI pubbliche.
9. Verificare interaction con privilege mode, memoria e interrupt.
10. Monitorare le specifiche RISC-V correlate.

## 20. Mappa Mentale

```txt
Estensibilita RISC-V
  -> base ISA minima
  -> estensioni standard
  -> custom opcode space
  -> custom CSR
  -> toolchain support
  -> ABI e fallback
  -> rischio frammentazione
  -> profili e compliance
```

## Riferimenti

- [RISC-V ISA Overview - RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/v20240411/unpriv/intro.html)
- [RISC-V Unprivileged ISA Specification](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
