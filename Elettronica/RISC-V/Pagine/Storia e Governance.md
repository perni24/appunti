---
date: 2026-04-23
tags: [risc-v, isa, open-standard, governance, architettura, elettronica]
type: #permanent-note
status: budding
---

# Storia e Governance

RISC-V e una Instruction Set Architecture (ISA) open standard nata come progetto di ricerca accademico e diventata uno standard industriale governato da RISC-V International.

Il punto centrale non e solo tecnico: RISC-V separa l'ISA dalle singole implementazioni. Lo standard definisce il comportamento visibile al software, mentre aziende, universita e community possono realizzare core, SoC, toolchain e sistemi proprietari o open source compatibili.

> [!INFO]
> RISC-V non e un processore specifico. E uno standard ISA modulare, aperto e royalty-free. Un core RISC-V puo essere open source, commerciale, embedded, high-performance, microcontrollore, application processor o acceleratore specializzato.

## 1. Origine

RISC-V nasce all'Universita della California, Berkeley, all'interno della tradizione RISC.

L'obiettivo iniziale era avere una ISA:

- semplice da studiare e implementare;
- adatta alla ricerca;
- estendibile senza dover negoziare licenze proprietarie;
- abbastanza pulita da supportare sistemi reali;
- utile sia per didattica sia per industria.

Il nome RISC-V indica la quinta generazione di progetti RISC sviluppati a Berkeley. La scelta di progettare una nuova ISA fu motivata anche dalla necessita di avere una base libera, moderna e non vincolata a proprieta intellettuale di un singolo vendor.

## 2. Dalla Ricerca allo Standard

La progressione storica puo essere letta in tre fasi:

1. **Ricerca accademica**: definizione dell'ISA e pubblicazione dei primi report tecnici.
2. **Fondazione e community**: creazione della RISC-V Foundation nel 2015 per coordinare standardizzazione e adozione.
3. **RISC-V International**: evoluzione in una associazione internazionale senza scopo di lucro, incorporata in Svizzera, con governance piu adatta a uno standard globale.

Questa transizione e importante: RISC-V non e rimasto un progetto universitario, ma e diventato un ecosistema coordinato da membri industriali, accademici e comunitari.

## 3. Perche una ISA Aperta

Le ISA storicamente dominanti sono spesso controllate da un vendor o da un modello di licenza restrittivo.

RISC-V sceglie un modello diverso:

- l'ISA e uno standard aperto;
- le specifiche ratificate sono disponibili pubblicamente;
- l'uso dell'ISA non richiede royalty;
- le implementazioni possono essere libere o proprietarie;
- l'innovazione puo avvenire sopra una base comune.

Questo riduce il costo di ingresso per:

- universita;
- startup hardware;
- aziende di semiconduttori;
- progetti open source silicon;
- sistemi embedded;
- ricerca su acceleratori e architetture specializzate.

## 4. Open Standard vs Open Source

RISC-V viene spesso confuso con un progetto open source, ma la distinzione e fondamentale.

| Concetto | Significato |
|---|---|
| Open standard | Specifica pubblica che definisce compatibilita e comportamento |
| Open source | Implementazione concreta con codice sorgente aperto |
| RISC-V ISA | Standard aperto |
| Core RISC-V | Implementazione dello standard, che puo essere open source o proprietaria |

RISC-V International governa le specifiche, non tutti i processori RISC-V esistenti.

Un'azienda puo costruire un core RISC-V proprietario compatibile con lo standard, mentre una community puo pubblicare un core open source. Entrambi possono essere RISC-V se rispettano le specifiche applicabili.

## 5. Modello di Governance

RISC-V International e la casa organizzativa dello standard.

Il suo ruolo principale e coordinare:

- specifiche ISA;
- estensioni standard;
- profili;
- gruppi tecnici;
- gruppi industriali e special interest groups;
- processo di ratifica;
- documentazione pubblica;
- allineamento tra membri.

La governance non e pensata per controllare i prodotti commerciali, ma per mantenere coerenza dello standard.

> [!IMPORTANT]
> La governance di RISC-V riguarda la standardizzazione dell'ISA e delle specifiche correlate. Non impone un'unica microarchitettura, non distribuisce un core ufficiale e non controlla tutte le implementazioni commerciali.

## 6. Board, Membri e Gruppi Tecnici

RISC-V International e governata da un Board of Directors, con rappresentanza delle diverse classi di membership.

Sotto il livello organizzativo, il lavoro tecnico viene svolto da gruppi specializzati.

Esempi di aree tipiche:

- ISA base;
- estensioni;
- profili;
- privileged architecture;
- debug;
- security;
- vector;
- embedded;
- software ecosystem;
- compliance.

Il processo e collaborativo: i membri contribuiscono proposte, discutono dettagli tecnici, revisionano specifiche e partecipano alla ratifica.

## 7. Processo di Standardizzazione

Una specifica RISC-V non diventa standard in modo informale. Passa attraverso un ciclo di maturazione.

Flusso semplificato:

```txt
Idea
  -> proposta
  -> sviluppo
  -> freeze
  -> public review
  -> ratifica
  -> standard stabile
```

In sintesi:

- **Draft**: puo cambiare in modo sostanziale.
- **Stable**: struttura quasi definita, ma non ancora finale.
- **Frozen**: cambiamenti molto improbabili, salvo problemi critici.
- **Ratified**: standard ufficiale; modifiche successive devono passare da nuove estensioni o revisioni compatibili.

Questa disciplina serve a proteggere software, toolchain e implementazioni hardware da cambiamenti incompatibili.

Approfondimento: [[Frozen vs Draft|Il concetto di "Frozen" vs "Draft" specifications]].

## 8. Modularita dell'ISA

Una caratteristica centrale di RISC-V e la modularita.

L'ISA parte da una base minima, come RV32I o RV64I, e aggiunge estensioni standard.

Esempi:

- `M`: moltiplicazione e divisione intera;
- `A`: operazioni atomiche;
- `F`: floating point single precision;
- `D`: floating point double precision;
- `C`: istruzioni compresse;
- `V`: vector extension;
- `B`: bit manipulation;
- `Zicsr`: accesso ai Control and Status Registers;
- `Zifencei`: sincronizzazione instruction fetch.

Questa modularita consente di costruire processori molto diversi:

- microcontrollori piccoli;
- sistemi embedded real-time;
- core Linux-capable;
- acceleratori custom;
- processori server;
- SoC eterogenei.

## 9. Estensioni Custom

RISC-V prevede spazi per estensioni custom.

Questo e importante perche permette ai progettisti di aggiungere istruzioni specializzate senza rompere lo standard principale.

Approfondimento: [[Estensibilita|Estensibilita: Custom Opcode space]].

Esempi di uso:

- accelerazione crittografica;
- DSP;
- inferenza AI;
- controllo motori;
- operazioni su sensori;
- istruzioni per domini industriali specifici.

Il rischio e la frammentazione: troppe estensioni custom incompatibili possono ridurre la portabilita del software. Per questo le estensioni standard e i profili servono a mantenere interoperabilita.

## 10. Profili e Compatibilita

Con la crescita dell'ecosistema, non basta dire "compatibile RISC-V".

Bisogna specificare:

- XLEN: 32, 64 o 128 bit;
- estensioni supportate;
- versione delle specifiche;
- privilege mode disponibili;
- ABI;
- profilo target;
- supporto a interrupt, debug, virtualizzazione e memoria.

I profili, come quelli collegati a [[Profili RVA/RVM/RVI: Comprendere la standardizzazione moderna]], aiutano a definire insiemi coerenti di funzionalita per classi di sistemi.

Questo rende piu semplice per software, sistemi operativi e toolchain sapere cosa aspettarsi da una piattaforma.

## 11. Compliance

La governance ha senso solo se esistono strumenti per verificare compatibilita.

La compliance serve a controllare che una implementazione si comporti come richiesto dallo standard.

Aspetti verificati:

- encoding delle istruzioni;
- comportamento architetturale;
- eccezioni;
- CSR;
- privilege behavior;
- memoria;
- estensioni dichiarate.

La compliance non garantisce che una microarchitettura sia veloce, sicura o efficiente. Garantisce che esponga al software il comportamento previsto dalla specifica.

## 12. Impatto Industriale

RISC-V e rilevante perche cambia il rapporto tra hardware e software.

Vantaggi strategici:

- riduce dipendenza da ISA proprietarie;
- permette maggiore personalizzazione;
- abbassa barriere per ricerca e startup;
- abilita acceleratori domain-specific;
- favorisce toolchain comuni;
- sostiene ecosistemi aperti e commerciali nello stesso standard.

Limiti e sfide:

- ecosistema software ancora in maturazione in alcune aree;
- frammentazione possibile con estensioni custom;
- compatibilita non automatica tra implementazioni diverse;
- necessita di profili e compliance robusti;
- competizione con ISA mature e toolchain consolidate.

## 13. Perche la Governance e Critica

Una ISA aperta senza governance rischia di diventare un insieme incompatibile di varianti.

La governance serve a bilanciare:

- liberta di innovazione;
- stabilita per il software;
- interoperabilita;
- evoluzione tecnica;
- esigenze industriali;
- apertura dello standard.

Il valore di RISC-V non sta solo nel fatto che l'ISA sia aperta, ma nel fatto che esista un processo per mantenerla coerente mentre cresce.

## 14. Mappa Mentale

```txt
RISC-V
  -> ISA open standard
  -> specifiche royalty-free
  -> governance: RISC-V International
  -> modularita: base ISA + estensioni
  -> standardizzazione: draft -> frozen -> ratified
  -> compatibilita: profili + compliance
  -> implementazioni: open source o proprietarie
```

## 15. Best Practices per Studiare RISC-V

1. Separare sempre ISA, microarchitettura e implementazione.
2. Controllare lo stato della specifica: draft, frozen o ratified.
3. Leggere le estensioni come moduli, non come dettagli opzionali casuali.
4. Distinguere estensioni standard da estensioni custom.
5. Usare profili e ABI per capire la compatibilita reale.
6. Considerare compliance e toolchain parte integrante dell'ecosistema.
7. Non assumere che due core RISC-V supportino le stesse funzionalita.

## Riferimenti

- [About RISC-V International](https://riscv.org/about/history/)
- [Ratified Specifications - RISC-V International](https://riscv.org/specifications/ratified/)
- [Specs Under Development - RISC-V International](https://riscv.org/specifications/development/)
- [Board of Directors - RISC-V International](https://riscv.org/about/board/)
