---
date: 2026-04-23
tags: [risc-v, registri, xlen, isa, abi, architettura]
type: #permanent-note
status: budding
---

# Registri e XLEN

In RISC-V, il concetto di **XLEN** definisce la larghezza dei registri interi e della maggior parte delle operazioni intere dell'architettura base.

Comprendere XLEN e il file registri e essenziale per leggere la ISA, capire le differenze tra RV32 e RV64, interpretare le ABI e progettare hardware o toolchain compatibili.

> [!INFO]
> XLEN e la larghezza, in bit, dei registri interi architetturali. In pratica, determina quanto sono larghi i registri general-purpose e quale dimensione hanno le operazioni intere native della base ISA.

## 1. Cosa Significa XLEN

XLEN indica la dimensione dei registri interi del processore.

Valori tipici:

- `RV32`: XLEN = 32 bit;
- `RV64`: XLEN = 64 bit;
- `RV128`: XLEN = 128 bit, previsto concettualmente ma non diffuso nei sistemi reali.

Quando si dice `RV32I` o `RV64I`, si sta dicendo:

- quale e la base ISA;
- quanto sono larghi i registri interi;
- quale dimensione hanno le operazioni aritmetiche e logiche native;
- come vengono rappresentati indirizzi, puntatori e molti tipi base a livello macchina.

## 2. Il File dei Registri Interi

RISC-V definisce **32 registri interi general-purpose**, numerati da `x0` a `x31`.

Caratteristiche:

- sono registri architetturali visibili al software;
- hanno larghezza pari a XLEN;
- sono usati per dati, indirizzi, puntatori, risultati e argomenti;
- fanno parte della base ISA intera;
- esistono sia in RV32 sia in RV64.

Schema concettuale:

```txt
x0  x1  x2  x3  ...  x31
|   |   |   |        |
32 registri interi larghi XLEN bit
```

Il numero dei registri resta costante; cambia la loro larghezza.

## 3. x0: Il Registro Zero

`x0` e un registro speciale: legge sempre zero e ignora ogni scrittura.

Esempi di utilita:

- generare costanti zero senza caricare un valore;
- semplificare confronti;
- implementare move e negate tramite istruzioni esistenti;
- scartare risultati indesiderati;
- ridurre la complessita di alcune operazioni ISA.

Esempio:

```asm
add x5, x6, x0
```

Equivale a copiare `x6` in `x5`.

Altro esempio:

```asm
sub x5, x0, x6
```

Produce il valore opposto di `x6`.

La presenza di `x0` e un tratto classico delle ISA RISC ben progettate: riduce il numero di casi speciali e rende piu regolare la codifica delle istruzioni.

## 4. Nomi ABI dei Registri

Oltre ai nomi numerici `x0`-`x31`, RISC-V usa nomi ABI convenzionali.

| Registro | Nome ABI | Ruolo Tipico |
|---|---|---|
| x0 | zero | costante zero |
| x1 | ra | return address |
| x2 | sp | stack pointer |
| x3 | gp | global pointer |
| x4 | tp | thread pointer |
| x5-x7 | t0-t2 | temporanei caller-saved |
| x8-x9 | s0/fp-s1 | saved registers, frame pointer opzionale |
| x10-x17 | a0-a7 | argomenti e valori di ritorno |
| x18-x27 | s2-s11 | saved registers callee-saved |
| x28-x31 | t3-t6 | temporanei caller-saved |

Questi nomi non cambiano la ISA, ma sono fondamentali per:

- assembly leggibile;
- calling convention;
- compilatori;
- debugger;
- stack frame;
- interoperabilita ABI.

## 5. Caller-Saved e Callee-Saved

I registri non sono tutti equivalenti dal punto di vista software.

Classificazione pratica:

- `a0-a7`: passaggio argomenti e ritorni;
- `t0-t6`: temporanei, caller-saved;
- `s0-s11`: registri preservati, callee-saved;
- `ra`: indirizzo di ritorno;
- `sp`: stack pointer.

Questo influenza il codice generato dal compilatore.

Esempio concettuale:

```txt
Caller
  -> salva registri temporanei se gli servono
  -> chiama funzione
Callee
  -> salva i registri sN che vuole usare
  -> esegue lavoro
  -> ripristina i registri sN
  -> ritorna
```

Questa organizzazione e parte dell'ABI, non della sola ISA.

## 6. XLEN e Dimensione dei Dati

XLEN non significa che tutti i dati del programma abbiano quella dimensione.

Significa che:

- i registri interi hanno quella larghezza;
- le operazioni intere native usano quella dimensione;
- gli indirizzi e i puntatori sono tipicamente allineati a quella larghezza architetturale;
- il comportamento di molte istruzioni dipende da essa.

In RV32:

- i registri interi sono da 32 bit;
- i puntatori sono tipicamente da 32 bit;
- lo spazio di indirizzamento e piu ridotto;
- le operazioni native lavorano su word da 32 bit.

In RV64:

- i registri interi sono da 64 bit;
- i puntatori sono tipicamente da 64 bit;
- le operazioni intere native lavorano su 64 bit;
- sono disponibili anche istruzioni "word" che operano su 32 bit e poi estendono il risultato.

## 7. RV32 vs RV64

La differenza tra RV32 e RV64 non e solo "piu bit".

Cambia:

- larghezza dei registri;
- dimensione dei puntatori;
- ABI;
- encoding e disponibilita di alcune istruzioni;
- comportamento di load/store di certe dimensioni;
- costo hardware e area;
- ampiezza del percorso dati;
- supporto a software e sistemi operativi diversi.

Confronto sintetico:

| Aspetto | RV32 | RV64 |
|---|---|---|
| XLEN | 32 bit | 64 bit |
| Puntatori | tipicamente 32 bit | tipicamente 64 bit |
| Range interi nativi | piu ridotto | piu ampio |
| Costo hardware | minore | maggiore |
| Target tipici | microcontrollori, embedded | sistemi Linux-capable, application processors |

RV32 e spesso adatto a sistemi embedded a basso costo e basso consumo.

RV64 e piu adatto a sistemi complessi che richiedono grandi spazi di indirizzamento e sistemi operativi moderni.

## 8. E RV128?

RISC-V contempla anche l'idea di `RV128`, cioe XLEN = 128 bit.

Va pero letto correttamente:

- fa parte della progettazione estendibile dell'ISA;
- non e il target comune nell'industria attuale;
- non va assunto come piattaforma disponibile solo perche il nome esiste;
- alcune parti della specifica possono riferirsi a RV128 in modo prospettico.

Per lo studio pratico, i casi rilevanti oggi sono soprattutto RV32 e RV64.

## 9. XLEN e Istruzioni

Molte istruzioni hanno semantica dipendente da XLEN.

Esempi:

- `ADD`, `SUB`, `AND`, `OR`, `XOR` operano su registri larghi XLEN;
- gli shift logici e aritmetici dipendono dalla larghezza dei registri;
- confronti signed e unsigned dipendono dall'interpretazione del valore in registri XLEN;
- i load/store legano dimensione del dato e comportamento di estensione.

In RV64 esistono anche istruzioni che lavorano su 32 bit all'interno di registri da 64 bit, come la famiglia `*W`.

Esempio concettuale:

```txt
RV64 ADD
  -> opera su 64 bit

RV64 ADDW
  -> opera su 32 bit
  -> produce risultato sign-extended a 64 bit
```

Questo dettaglio e molto importante per compilatori, ABI e debugging.

## 10. XLEN e Immediate

Anche le immediate interagiscono con XLEN.

Le istruzioni codificano immediate di ampiezza limitata, ma il valore finale viene poi esteso o interpretato rispetto a registri larghi XLEN.

Questo incide su:

- addizioni con costanti;
- indirizzamento relativo;
- load upper immediate;
- shift amount validi;
- confronti e branch.

Collegamento futuro: [[Formati Istruzioni e Immediate Encoding (perche i bit sono rimescolati?)]]

## 11. Registri, PC e Altri Stati Architetturali

I 32 registri `x0-x31` non esauriscono tutto lo stato della CPU.

Esistono anche:

- il Program Counter (PC);
- eventuali floating-point registers;
- vector registers;
- CSR (Control and Status Registers);
- stato privilege;
- registri di debug o tracing in contesti specifici.

Il PC non fa parte dei 32 general-purpose registers, ma e ovviamente centrale nell'esecuzione.

Collegamenti:

- [[Zicsr: Control and Status Register Instructions]]
- [[Vector (V): VLEN, ELEN, Register Grouping (LMUL)]]

## 12. XLEN e ABI

XLEN influenza direttamente l'ABI.

Esempi:

- `ilp32`: interi, long e puntatori su 32 bit;
- `lp64`: long e puntatori su 64 bit;
- registri usati per argomenti e ritorni mantengono la stessa struttura logica, ma cambia la loro larghezza;
- layout dello stack e rappresentazione dei tipi cambiano.

Collegamento futuro: [[ABI (Application Binary Interface): lp64, ilp32, etc.]]

Per questo due piattaforme RISC-V possono condividere la filosofia ISA ma non essere binary-compatible se ABI e XLEN differiscono.

## 13. XLEN e Microarchitettura

Dal punto di vista hardware, aumentare XLEN ha effetti concreti.

Possibili conseguenze:

- datapath piu larghi;
- ALU piu grandi;
- register file piu costoso;
- bus interni piu ampi;
- maggiore area;
- possibili impatti su frequenza e consumo;
- maggiore capacita di rappresentare dati e indirizzi.

Per questo RV32 e spesso migliore in microcontrollori compatti, mentre RV64 ha senso quando il software richiede spazio di indirizzamento e ampiezza nativa superiori.

## 14. Errori Comuni

### Confondere XLEN con ogni dimensione dati

XLEN non significa che tutti i tipi siano larghi XLEN. Significa che quella e la dimensione nativa dei registri interi architetturali.

### Pensare che RV64 sia solo RV32 con registri piu grandi

Cambia anche ABI, toolchain, set di istruzioni disponibile e comportamento di varie operazioni.

### Dimenticare `x0`

`x0` non e un registro normale: e sempre zero. Questo influenza ottimizzazioni, assembly manuale e lettura delle istruzioni.

### Confondere registri architetturali e registri fisici

Il software vede 32 registri architetturali. Una microarchitettura out-of-order puo usare internamente molti piu registri fisici tramite renaming.

## 15. Checklist Operativa

Quando analizzi una piattaforma RISC-V, chiediti:

1. E RV32 o RV64?
2. Qual e XLEN?
3. Quale ABI usa?
4. Quali estensioni oltre alla base sono presenti?
5. I registri floating point o vector sono presenti?
6. Il target richiede Linux o bare-metal?
7. Il software usa puntatori da 32 o 64 bit?
8. Le istruzioni `*W` sono rilevanti?
9. Il calling convention e quello standard?
10. Ci sono custom extension che cambiano l'uso dei registri?

## 16. Mappa Mentale

```txt
Registri e XLEN
  -> 32 registri interi: x0-x31
  -> x0 sempre zero
  -> larghezza registri = XLEN
  -> RV32 / RV64 / RV128
  -> ABI names: ra sp a0 s0 t0 ...
  -> impatto su istruzioni, ABI, puntatori, hardware
```

## Riferimenti

- [RISC-V Unprivileged ISA Specification](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [RISC-V ABIs Specification](https://github.com/riscv-non-isa/riscv-elf-psabi-doc)
