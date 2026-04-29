---
date: 2026-04-29
tags: [risc-v, instruction-format, immediate-encoding, isa, decoding, assembly]
aliases: ["Formati Istruzioni e Immediate Encoding (perche i bit sono rimescolati?)"]
type: #permanent-note
status: budding
---

# Formati Istruzioni e Immediate Encoding

RISC-V usa formati di istruzione molto regolari per semplificare il decoding hardware. Nella ISA base, le istruzioni principali sono lunghe 32 bit e sono organizzate in pochi formati: **R**, **I**, **S**, **B**, **U** e **J**.

La parte piu controintuitiva e l'encoding degli immediate: alcuni bit sembrano "rimescolati". In realta la disposizione serve a mantenere stabili i campi piu importanti e a ridurre la complessita del circuito di decode.

> [!INFO]
> RISC-V privilegia un decode semplice: `opcode`, `rd`, `rs1` e `rs2` stanno il piu possibile sempre nelle stesse posizioni. Gli immediate vengono distribuiti attorno a questi campi per ridurre mux, fanout e ritardo critico.

## 1. Istruzione Base a 32 Bit

Nella base ISA, una istruzione normale e lunga 32 bit.

```txt
bit 31                                      bit 0
+----------------------------------------------+
|              instruction word                |
+----------------------------------------------+
```

Alcune estensioni, come `C` per istruzioni compresse, introducono istruzioni a 16 bit. Tuttavia i formati R/I/S/B/U/J sono i formati fondamentali da capire per leggere RV32I/RV64I.

Collegamento: [[Registri e XLEN]]

## 2. Campi Ricorrenti

I campi piu importanti sono tenuti in posizioni fisse.

| Campo | Bit | Significato |
|---|---:|---|
| `opcode` | 6:0 | classe principale dell'istruzione |
| `rd` | 11:7 | registro destinazione |
| `funct3` | 14:12 | sottocodice operativo |
| `rs1` | 19:15 | primo registro sorgente |
| `rs2` | 24:20 | secondo registro sorgente |
| `funct7` | 31:25 | sottocodice aggiuntivo |

Non tutti i formati usano tutti i campi.

Il punto chiave e che, quando un campo esiste, tende a stare nella stessa posizione. Questo permette al decoder di estrarre registri e opcode in parallelo, senza dover prima capire completamente il formato.

## 3. Perche i Campi Registro Sono Fissi

In hardware, il file registri deve sapere rapidamente quali registri leggere e dove scrivere.

Tenere `rd`, `rs1` e `rs2` in posizioni fisse consente di:

- semplificare il decode;
- iniziare prima la lettura del register file;
- ridurre multiplexing;
- accorciare il percorso critico;
- rendere piu semplice implementare pipeline veloci.

Il costo viene spostato sugli immediate, che vengono spezzati in posizioni apparentemente strane.

## 4. R-Type

Il formato **R-Type** usa due registri sorgente e un registro destinazione.

```txt
31        25 24   20 19   15 14  12 11    7 6      0
+-----------+-------+-------+------+--------+--------+
|  funct7   |  rs2  |  rs1  |funct3|   rd   | opcode |
+-----------+-------+-------+------+--------+--------+
```

Uso tipico:

- operazioni registro-registro;
- ALU;
- shift registro-registro;
- estensioni come `M` per moltiplicazione/divisione.

Esempio:

```asm
add x5, x6, x7
```

Significato:

```txt
x5 = x6 + x7
```

Non contiene immediate.

## 5. I-Type

Il formato **I-Type** usa un registro sorgente, un registro destinazione e un immediate a 12 bit.

```txt
31                  20 19   15 14  12 11    7 6      0
+---------------------+-------+------+--------+--------+
|      imm[11:0]      |  rs1  |funct3|   rd   | opcode |
+---------------------+-------+------+--------+--------+
```

Uso tipico:

- operazioni immediate come `ADDI`;
- load;
- `JALR`;
- alcune istruzioni CSR con varianti specifiche;
- shift immediate, con interpretazione particolare di parte dell'immediato.

Esempio:

```asm
addi x5, x6, -4
```

Immediate prodotto:

```txt
imm[11:0] = inst[31:20]
```

Il bit di segno e `inst[31]`.

## 6. S-Type

Il formato **S-Type** e usato soprattutto per store.

```txt
31        25 24   20 19   15 14  12 11     7 6      0
+-----------+-------+-------+------+---------+--------+
| imm[11:5] |  rs2  |  rs1  |funct3| imm[4:0]| opcode |
+-----------+-------+-------+------+---------+--------+
```

Uso tipico:

- store byte/halfword/word/doubleword;
- indirizzamento base + offset.

Esempio:

```asm
sw x7, 12(x6)
```

Significato:

```txt
mem[x6 + 12] = x7
```

Immediate prodotto:

```txt
imm[11:5] = inst[31:25]
imm[4:0]  = inst[11:7]
```

Il campo `rd` non serve negli store. Quello spazio viene riusato per la parte bassa dell'immediato.

## 7. B-Type

Il formato **B-Type** e una variante dello S-Type usata per branch condizionali.

```txt
31      30     25 24   20 19   15 14  12 11     8 7       6      0
+---------+--------+-------+-------+------+--------+--------+--------+
| imm[12] |imm[10:5]| rs2  |  rs1  |funct3|imm[4:1]|imm[11] | opcode |
+---------+--------+-------+-------+------+--------+--------+--------+
```

Uso tipico:

- `BEQ`;
- `BNE`;
- `BLT`;
- `BGE`;
- varianti signed e unsigned.

Esempio:

```asm
beq x5, x6, target
```

Immediate prodotto:

```txt
imm[12]   = inst[31]
imm[10:5] = inst[30:25]
imm[4:1]  = inst[11:8]
imm[11]   = inst[7]
imm[0]    = 0
```

Il bit `imm[0]` e zero perche i branch target sono codificati in multipli di 2 byte. Questo supporta anche sistemi con istruzioni compresse a 16 bit.

## 8. U-Type

Il formato **U-Type** carica o somma un immediate alto da 20 bit.

```txt
31                         12 11    7 6      0
+----------------------------+--------+--------+
|          imm[31:12]        |   rd   | opcode |
+----------------------------+--------+--------+
```

Uso tipico:

- `LUI`;
- `AUIPC`;
- costruzione di costanti grandi;
- indirizzamento PC-relative.

Esempio:

```asm
lui x5, 0x12345
```

Immediate prodotto:

```txt
imm[31:12] = inst[31:12]
imm[11:0]  = 0
```

Il valore viene posizionato nella parte alta del registro.

## 9. J-Type

Il formato **J-Type** e usato da `JAL`.

```txt
31      30     21 20      19     12 11    7 6      0
+---------+--------+--------+--------+--------+--------+
| imm[20] |imm[10:1]|imm[11]|imm[19:12]|  rd  | opcode |
+---------+--------+--------+--------+--------+--------+
```

Uso tipico:

- salto PC-relative;
- chiamata di funzione;
- salvataggio return address in `rd`.

Esempio:

```asm
jal ra, function
```

Immediate prodotto:

```txt
imm[20]    = inst[31]
imm[10:1]  = inst[30:21]
imm[11]    = inst[20]
imm[19:12] = inst[19:12]
imm[0]     = 0
```

Come nei branch, il bit basso e zero perche il target e allineato almeno a 2 byte.

## 10. Tabella Riassuntiva

| Formato | Campi Principali | Immediate | Uso Tipico |
|---|---|---|---|
| R | `rd`, `rs1`, `rs2`, `funct3`, `funct7` | nessuno | ALU registro-registro |
| I | `rd`, `rs1`, `imm[11:0]` | 12 bit signed | ALU immediate, load, `JALR` |
| S | `rs1`, `rs2`, `imm[11:0]` spezzato | 12 bit signed | store |
| B | `rs1`, `rs2`, branch offset | 13 bit signed con bit 0 = 0 | branch condizionali |
| U | `rd`, upper immediate | 32 bit con low 12 a zero | `LUI`, `AUIPC` |
| J | `rd`, jump offset | 21 bit signed con bit 0 = 0 | `JAL` |

## 11. Perche gli Immediate Sono Rimescolati

La scelta non e casuale.

Obiettivi principali:

- mantenere `opcode`, `rd`, `rs1` e `rs2` in posizioni stabili;
- tenere il bit di segno degli immediate in `inst[31]`;
- permettere sign extension in parallelo al decode;
- massimizzare sovrapposizione tra formati simili;
- ridurre multiplexing nella generazione dell'immediato;
- evitare shifter dedicati per alcuni offset.

Il risultato e che l'immediato sembra meno leggibile a mano, ma e piu economico da decodificare in hardware.

## 12. Sign Extension

Salvo casi particolari come immediate unsigned specifici, gli immediate RISC-V sono generalmente sign-extended.

Regola centrale:

```txt
sign bit = inst[31]
```

Questo vale per:

- I-immediate;
- S-immediate;
- B-immediate;
- U-immediate;
- J-immediate.

Vantaggio hardware:

- il circuito di sign extension puo iniziare subito;
- non deve aspettare la selezione completa del formato;
- per XLEN > 32 il fanout del bit di segno e importante.

Collegamento: [[Registri e XLEN]]

## 13. S-Type vs B-Type

S-Type e B-Type condividono una struttura simile.

Differenza:

- S-Type usa l'immediate come offset byte per store;
- B-Type usa l'immediate come branch offset in multipli di 2 byte.

Confronto:

```txt
S-Type:
imm[11:5] = inst[31:25]
imm[4:0]  = inst[11:7]

B-Type:
imm[12]   = inst[31]
imm[10:5] = inst[30:25]
imm[4:1]  = inst[11:8]
imm[11]   = inst[7]
imm[0]    = 0
```

Il bit `inst[7]`, che in S-Type sarebbe `imm[0]`, in B-Type diventa `imm[11]`.

Questo evita di dover shiftare tutto l'immediato in hardware come operazione separata.

## 14. U-Type vs J-Type

U-Type e J-Type condividono un immediate grande da 20 bit nel campo alto dell'istruzione.

Differenza:

- U-Type produce un valore con i 12 bit bassi a zero;
- J-Type produce un offset PC-relative con bit basso a zero.

Confronto:

```txt
U-Type:
imm[31:12] = inst[31:12]
imm[11:0]  = 0

J-Type:
imm[20]    = inst[31]
imm[10:1]  = inst[30:21]
imm[11]    = inst[20]
imm[19:12] = inst[19:12]
imm[0]     = 0
```

Anche qui la disposizione massimizza sovrapposizione e semplifica il datapath.

## 15. Opcode, Funct3 e Funct7

`opcode` identifica la classe generale dell'istruzione.

`funct3` e `funct7` distinguono operazioni dentro la stessa classe.

Esempio concettuale:

```txt
opcode = OP
funct3 = 000
funct7 = 0000000 -> ADD
funct7 = 0100000 -> SUB
```

Questo permette di usare lo stesso formato R-Type per operazioni diverse.

Nel decoder:

1. `opcode` seleziona il formato e la famiglia.
2. `funct3` restringe l'operazione.
3. `funct7` o altri bit completano la selezione.

## 16. Istruzioni CSR e Immediate a 5 Bit

Le istruzioni CSR sono un caso particolare.

Collegamento: [[Zicsr]]

Alcune varianti usano un immediate unsigned a 5 bit (`uimm`) invece del registro `rs1`.

Esempio:

```asm
csrrsi t0, mstatus, 8
```

In questo caso il campo che normalmente indica `rs1` viene interpretato come immediato piccolo.

Questo non cambia i formati base principali, ma mostra come RISC-V riusi campi esistenti in modo controllato.

## 17. Esempio di Decoding Manuale

Per decodificare una istruzione RISC-V a mano:

1. Leggi `opcode` nei bit `6:0`.
2. Determina il formato.
3. Estrai `rd`, `rs1`, `rs2` se presenti.
4. Usa `funct3` e `funct7` per distinguere l'operazione.
5. Ricostruisci l'immediato secondo il formato.
6. Applica sign extension.
7. Interpreta l'operazione rispetto a XLEN.

Esempio concettuale per branch:

```txt
opcode -> branch
funct3 -> BEQ/BNE/BLT/...
rs1, rs2 -> registri da confrontare
immediate B-Type -> offset PC-relative
```

L'assembler e il disassembler fanno questo automaticamente, ma capire il processo aiuta in debug, verifica e progettazione hardware.

## 18. Relazione con Instruction Alignment

Nella base ISA senza istruzioni compresse, le istruzioni sono allineate a 4 byte.

Con estensioni che introducono istruzioni a 16 bit, come `C`, l'allineamento minimo puo diventare 2 byte.

Questo spiega perche branch e jump usano offset con bit basso implicito a zero:

```txt
imm[0] = 0
```

Il target non deve rappresentare ogni singolo byte possibile, ma solo indirizzi almeno halfword-aligned.

## 19. Impatto su Hardware

Il layout RISC-V favorisce implementazioni semplici.

Vantaggi:

- decode rapido;
- register file access anticipabile;
- sign extension parallela;
- meno mux per immediate;
- formati regolari;
- compatibilita tra RV32 e RV64.

Tradeoff:

- immediati meno intuitivi da leggere a mano;
- branch/jump encoding apparentemente irregolare;
- assemblatore e disassemblatore necessari per lavorare comodamente.

Questo e un buon esempio di scelta ISA orientata al costo hardware piu che alla leggibilita diretta dell'encoding binario.

## 20. Errori Comuni

### Pensare che i bit siano casuali

La disposizione degli immediate e progettata per ridurre hardware, non per essere lineare.

### Dimenticare la sign extension

Molti immediate sono signed. Interpretarli come unsigned cambia completamente offset e costanti negative.

### Confondere B-Type e S-Type

Branch e store si somigliano, ma il bit `inst[7]` ha ruolo diverso.

### Confondere U-Type e J-Type

Entrambi usano molti bit alti, ma U costruisce un valore alto, J costruisce un offset di salto.

### Dimenticare il bit zero implicito

Branch e jump hanno `imm[0] = 0`. L'offset codifica multipli di 2 byte.

## 21. Checklist Operativa

Quando analizzi un encoding RISC-V:

1. Parti sempre da `opcode`.
2. Identifica il formato.
3. Controlla se `rd`, `rs1` e `rs2` esistono davvero in quel formato.
4. Ricostruisci l'immediate con la tabella corretta.
5. Applica sign extension da `inst[31]`.
6. Ricorda `imm[0] = 0` per B-Type e J-Type.
7. Interpreta il risultato rispetto a PC, base register o valore alto.
8. Verifica XLEN se l'operazione dipende dalla larghezza dei registri.
9. Considera pseudo-istruzioni: l'assembly visibile puo non essere una singola istruzione reale.
10. Usa disassembler affidabili quando lavori su binari reali.

## 22. Mappa Mentale

```txt
Formati RISC-V
  -> R: registri puri
  -> I: immediate 12 bit
  -> S: store offset
  -> B: branch offset, imm[0]=0
  -> U: upper immediate
  -> J: jump offset, imm[0]=0
  -> campi registro stabili
  -> sign bit sempre inst[31]
  -> immediate rimescolati per semplificare hardware
```

## Collegamenti

- [[Registri e XLEN]]
- [[Zicsr]]
- [[Zifencei]]
- [[Estensibilita]]
- [[Istruzioni FENCE e TSO (Total Store Ordering)]]
- [[ABI (Application Binary Interface): lp64, ilp32, etc.]]

## Riferimenti

- [RISC-V Unprivileged ISA - Base Instruction Formats](https://riscv.github.io/riscv-isa-manual/snapshot/unprivileged/#base-instruction-formats)
- [RISC-V Unprivileged ISA - Immediate Encoding Variants](https://riscv.github.io/riscv-isa-manual/snapshot/unprivileged/#immediate-encoding-variants)
- [RV32I Base Integer Instruction Set - RISC-V docs](https://docs.riscv.org/reference/isa/unpriv/rv32.html)
