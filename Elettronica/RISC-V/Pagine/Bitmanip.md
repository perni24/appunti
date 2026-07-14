---
date: 2026-04-30
tags: [risc-v, bitmanip, zba, zbb, zbc, zbs, isa, estensioni]
aliases: ["Bitmanip (B): Zba, Zbb, Zbc, Zbs"]
type: #permanent-note
status: budding
---

# Bitmanip

Le estensioni **Bitmanip** aggiungono a RISC-V istruzioni per manipolare bit, generare indirizzi, contare bit, ruotare parole, operare su singoli bit e fare moltiplicazioni carry-less.

Queste istruzioni non cambiano il modello generale load/store di RISC-V, ma rendono piu efficienti molte operazioni che altrimenti richiederebbero sequenze di shift, mask, branch e operazioni logiche.

> [!INFO]
> Nella specifica moderna, la famiglia bitmanip include piu estensioni `Zb*`. Il nome `B` viene spesso usato informalmente per "bit manipulation", ma va letto con attenzione: la specifica distingue componenti come `Zba`, `Zbb`, `Zbs` e `Zbc`.

## 1. Perche Esistono le Estensioni Bitmanip

La base intera RISC-V e intenzionalmente piccola e regolare.

Questo semplifica hardware e decode, ma alcune operazioni comuni sui bit diventano verbose:

- contare zeri iniziali o finali;
- contare bit a 1;
- ruotare una parola;
- settare, pulire o invertire un singolo bit;
- calcolare indirizzi indicizzati;
- fare max/min senza branch;
- accelerare CRC, hashing o crittografia con carry-less multiply.

Bitmanip aggiunge istruzioni mirate per ridurre:

- numero di istruzioni;
- latenza;
- consumo energetico;
- pressione sui registri;
- dimensione del codice;
- branch evitabili.

## 2. Componenti Principali

Le estensioni piu importanti trattate qui sono:

| Estensione | Nome | Scopo |
|---|---|---|
| `Zba` | Address generation | calcolo efficiente di indirizzi indicizzati |
| `Zbb` | Basic bit-manipulation | operazioni bit di uso generale |
| `Zbs` | Single-bit instructions | set/clear/invert/extract di singoli bit |
| `Zbc` | Carry-less multiplication | moltiplicazione carry-less per CRC/hash/crypto |

La specifica include anche estensioni collegate alla crittografia, come `Zbkb`, `Zbkc` e `Zbkx`, ma la base concettuale piu comune per Bitmanip e capire prima `Zba`, `Zbb`, `Zbs` e `Zbc`.

## 3. B vs Zb*

RISC-V usa nomi modulari.

Punto importante:

- `Zba`, `Zbb`, `Zbs`, `Zbc` sono estensioni con nomi espliciti;
- `B` e un nome storico/di gruppo associato alla bit manipulation;
- nella specifica ratificata, il bundle `B` e legato alle estensioni bitmanip principali, ma conviene dichiarare esplicitamente le `Zb*` supportate;
- `Zbc` e spesso studiata insieme alle altre bitmanip, ma ha un uso piu specializzato.

Per documentare una piattaforma reale, e meglio scrivere:

```txt
RV64IMAFD_Zicsr_Zifencei_Zba_Zbb_Zbs
```

oppure includere anche:

```txt
Zbc
```

se il core supporta carry-less multiplication.

Collegamento: [[Estensibilita]]

## 4. Zba: Address Generation

`Zba` aggiunge istruzioni pensate per accelerare il calcolo degli indirizzi.

Operazione tipica:

```txt
address = base + (index << scale)
```

Questo schema compare spesso quando si accede ad array di elementi da 2, 4 o 8 byte.

Esempi di istruzioni:

- `sh1add`;
- `sh2add`;
- `sh3add`;
- `add.uw` su RV64;
- `sh1add.uw` su RV64;
- `sh2add.uw` su RV64;
- `sh3add.uw` su RV64;
- `slli.uw` su RV64.

Esempio:

```asm
sh2add x5, x6, x7
```

Significato concettuale:

```txt
x5 = x7 + (x6 << 2)
```

Uso tipico:

- array di `int32`;
- accesso a strutture;
- indici in tabelle;
- calcolo indirizzi in compilatori;
- codice generato da C/C++.

## 5. Perche Zba e Utile

Senza `Zba`, il compilatore dovrebbe generare una sequenza:

```asm
slli t0, index, 2
add  addr, base, t0
```

Con `Zba` puo usare:

```asm
sh2add addr, index, base
```

Vantaggi:

- meno istruzioni;
- meno registri temporanei;
- potenziale latenza minore;
- migliore densita del codice;
- pattern piu facile da ottimizzare in hardware.

Il vantaggio e particolarmente concreto in codice con molti accessi indicizzati.

## 6. Zbb: Basic Bit-Manipulation

`Zbb` contiene istruzioni bitmanip di uso generale.

Categorie principali:

- logical with negate;
- count leading/trailing zeros;
- population count;
- min/max;
- sign/zero extension;
- rotate;
- byte/word reverse;
- OR-combine per byte.

Esempi:

- `andn`;
- `orn`;
- `xnor`;
- `clz`;
- `ctz`;
- `cpop`;
- `min`;
- `max`;
- `minu`;
- `maxu`;
- `sext.b`;
- `sext.h`;
- `zext.h`;
- `rol`;
- `ror`;
- `rev8`;
- `orc.b`.

`Zbb` e spesso la parte piu general-purpose di Bitmanip.

## 7. Esempi Zbb

### Count leading zeros

```asm
clz x5, x6
```

Conta quanti zeri precedono il primo bit a 1.

Usi:

- normalizzazione numerica;
- log2 intero;
- algoritmi di allocazione;
- compressione;
- software floating point.

### Population count

```asm
cpop x5, x6
```

Conta quanti bit a 1 sono presenti.

Usi:

- bitmap;
- crittografia;
- data structures;
- bitset;
- scoring e matching.

### Rotate

```asm
ror x5, x6, x7
```

Ruota i bit verso destra.

Usi:

- hashing;
- crittografia;
- checksum;
- mixing functions.

### Logical with negate

```asm
andn x5, x6, x7
```

Equivale a:

```txt
x5 = x6 & ~x7
```

Riduce sequenze `not` + `and`.

## 8. Zbs: Single-Bit Instructions

`Zbs` aggiunge istruzioni per operare su un singolo bit.

Operazioni tipiche:

- set bit;
- clear bit;
- invert bit;
- extract bit.

Esempi:

- `bset`;
- `bclr`;
- `binv`;
- `bext`;
- varianti immediate come `bseti`, `bclri`, `binvi`, `bexti`.

Esempio:

```asm
bset x5, x6, x7
```

Significato concettuale:

```txt
x5 = x6 with bit x7 set to 1
```

Esempio con immediato:

```asm
bclri x5, x6, 3
```

Significato:

```txt
x5 = x6 with bit 3 cleared
```

## 9. Perche Zbs e Utile

Senza `Zbs`, per settare un bit il codice tipico e:

```asm
li   t0, 1
sll  t0, t0, bit_index
or   dst, src, t0
```

Con `Zbs`:

```asm
bset dst, src, bit_index
```

Vantaggi:

- meno istruzioni;
- meno registri temporanei;
- meno dipendenze;
- codice piu chiaro;
- mapping diretto su operazioni hardware comuni.

Usi tipici:

- registri di controllo;
- bitmap;
- driver;
- allocatori;
- protocolli binari;
- manipolazione flag.

## 10. Zbc: Carry-Less Multiplication

`Zbc` aggiunge moltiplicazione carry-less.

Esempi:

- `clmul`;
- `clmulh`;
- `clmulr`.

La carry-less multiplication non e una normale moltiplicazione intera. Opera su polinomi binari, usando XOR al posto dell'addizione con carry.

Uso tipico:

- CRC;
- hashing;
- GHASH;
- crittografia;
- algebra su GF(2).

Esempio concettuale:

```asm
clmul x5, x6, x7
```

Produce la parte bassa del prodotto carry-less tra `x6` e `x7`.

`Zbc` e meno general-purpose di `Zbb`, ma molto utile in domini specifici.

## 11. RV32 e RV64

Le estensioni bitmanip sono definite per RV32 e RV64, ma alcune istruzioni esistono solo su RV64.

Esempi di suffissi importanti:

- `w`: opera sui 32 bit bassi e produce risultato sign-extended a XLEN;
- `.uw`: interpreta un operando come unsigned word a 32 bit e poi opera su XLEN;
- `.b`: opera sul byte basso;
- `.h`: opera sulla halfword bassa.

Esempio:

```asm
clzw x5, x6
```

Conta leading zeros sui 32 bit bassi di `x6` in RV64.

Collegamento: [[Registri e XLEN]]

## 12. Relazione con il Compilatore

Bitmanip e particolarmente utile quando il compilatore riconosce pattern comuni.

Esempi:

```c
unsigned popcount(unsigned x) {
    return __builtin_popcount(x);
}
```

Con il target corretto, il compilatore puo generare `cpop` invece di una sequenza software.

Altro esempio:

```c
uint64_t mask_clear(uint64_t a, uint64_t b) {
    return a & ~b;
}
```

Con `Zbb`, puo diventare:

```asm
andn a0, a0, a1
```

Il beneficio reale dipende da:

- `-march`;
- supporto GCC/LLVM;
- pattern recognition;
- cost model del backend;
- microarchitettura target.

## 13. Esempi di -march

Esempio con singole estensioni:

```bash
riscv64-unknown-elf-gcc -march=rv64gc_zba_zbb_zbs -mabi=lp64d
```

Esempio includendo carry-less multiplication:

```bash
riscv64-unknown-elf-gcc -march=rv64gc_zba_zbb_zbs_zbc -mabi=lp64d
```

Il naming esplicito e preferibile quando si vuole chiarire esattamente quali componenti bitmanip sono disponibili.

Collegamento: [[Estensioni G]]

## 14. Impatto Hardware

Bitmanip puo essere implementata con costi molto diversi a seconda delle istruzioni.

Esempi:

- `andn`, `orn`, `xnor`: logica combinatoria semplice;
- `bset`, `bclr`, `binv`: mask generation + logica bitwise;
- `clz`, `ctz`, `cpop`: reti di conteggio piu costose;
- `rol`, `ror`: barrel shifter o logica di rotazione;
- `clmul`: datapath specializzato per carry-less multiplication;
- `sh1add/sh2add/sh3add`: shift limitato + adder.

Un core piccolo potrebbe implementare solo alcune `Zb*` per contenere area e timing.

## 15. Impatto Microarchitetturale

Domande progettuali:

1. Le istruzioni bitmanip sono single-cycle o multi-cycle?
2. La rete `cpop` allunga il critical path?
3. `clmul` usa logica dedicata o una sequenza iterativa?
4. Le rotazioni riusano il barrel shifter degli shift?
5. Le istruzioni `Zba` entrano nell'ALU o in un address generation path?
6. Serve forwarding speciale?
7. Il decoder distingue correttamente `w`, `.uw`, `.b`, `.h`?
8. I test coprono RV32 e RV64 separatamente?

Collegamento futuro: [[Back-end: Scoreboarding, Register Renaming, ROB]]

## 16. Relazione con Sicurezza e Crittografia

Bitmanip e rilevante per sicurezza e crittografia, ma non sostituisce le estensioni crypto dedicate.

Esempi:

- rotate e XOR sono comuni in hash e cifrari;
- carry-less multiplication accelera CRC e GHASH;
- bit extract/set/clear aiutano nella manipolazione di campi;
- alcune estensioni crypto riusano o estendono concetti bitmanip.

Per codice crittografico reale, pero, bisogna considerare anche:

- constant-time behavior;
- side-channel;
- timing predictability;
- estensioni crypto scalar/vector;
- comportamento del compilatore.

Collegamento futuro: [[Sicurezza: Enclavi (Keystone), Control-Flow Integrity (CFI)]]

## 17. Bitmanip non e Vector

Bitmanip lavora su registri interi scalari.

La vector extension lavora invece su registri vettoriali e su elementi multipli.

Differenza:

| Aspetto | Bitmanip | Vector |
|---|---|---|
| Dati | registro scalare XLEN | vettori di elementi |
| Scopo | manipolazione bit scalare | parallelismo dati |
| Estensioni | `Zba`, `Zbb`, `Zbs`, `Zbc` | `V`, `Zv*` |
| Tipico uso | bitset, hash, indirizzi, flag | array, SIMD, ML, DSP |

Collegamento futuro: [[Vector (V): VLEN, ELEN, Register Grouping (LMUL)]]

## 18. Errori Comuni

### Dire "B" senza specificare le Zb*

In contesti tecnici e meglio indicare le estensioni precise: `Zba`, `Zbb`, `Zbs`, `Zbc`.

### Pensare che Bitmanip sia solo per crittografia

Molte istruzioni sono general-purpose: indirizzi, bitmap, min/max, popcount, rotazioni e sign extension.

### Assumere che Zbc sia sempre presente

`Zbc` e spesso studiata insieme a Bitmanip, ma non va data per scontata se il target dichiara solo alcune estensioni.

### Ignorare RV32/RV64

Le istruzioni con suffisso `w` o `.uw` hanno senso specifico su RV64.

### Aspettarsi benefici senza compilatore configurato

Se `-march` non include le `Zb*`, il compilatore non deve generare quelle istruzioni.

## 19. Checklist Operativa

Quando analizzi o implementi Bitmanip:

1. Quali estensioni sono supportate: `Zba`, `Zbb`, `Zbs`, `Zbc`?
2. Il target e RV32 o RV64?
3. Le istruzioni `w` e `.uw` sono implementate correttamente?
4. Il compilatore riceve il `-march` corretto?
5. Esistono test per ogni istruzione dichiarata?
6. `clz`, `ctz`, `cpop` rispettano i casi limite?
7. `bset`, `bclr`, `binv`, `bext` gestiscono correttamente l'indice bit?
8. `clmul` e verificata contro un modello GF(2)?
9. La latenza e coerente con il pipeline design?
10. Il core dichiara solo estensioni realmente supportate?

## 20. Mappa Mentale

```txt
Bitmanip
  -> Zba: address generation
  -> Zbb: basic bit operations
  -> Zbs: single-bit operations
  -> Zbc: carry-less multiplication
  -> riduce istruzioni e latenza
  -> utile per compiler, kernel, crypto, bitmap, hash
  -> richiede dichiarazione precisa in -march
```

## Collegamenti

- [[Estensibilita]]
- [[Estensioni G]]
- [[Registri e XLEN]]
- [[Formati Istruzioni e Immediate Encoding]]
- [[RVWMO (RISC-V Weak Memory Ordering)]]
- [[Vector (V): VLEN, ELEN, Register Grouping (LMUL)]]
- [[Architectural Compliance Testing: Assicurarsi che un core sia RISC-V]]

## Riferimenti

- [RISC-V Bit Manipulation Extensions](https://docs.riscv.org/reference/isa/unpriv/b-st-ext.html)
- [RISC-V ISA Specifications](https://docs.riscv.org/reference/isa/)
- [GCC RISC-V Options](https://gcc.gnu.org/onlinedocs/gcc-15.2.0/gcc/RISC-V-Options.html)
