---
date: 2026-05-03
tags: [RISC-V, ABI, LowLevel, Software]
type: #literature-note
status: seedling
---

# ABI (Application Binary Interface) in RISC-V

L'**ABI** definisce le regole fondamentali affinché il codice compilato (binario) possa interagire correttamente. In RISC-V, questo include la convenzione di chiamata (**Calling Convention**), l'uso dei registri e l'allineamento dei dati in memoria.

> [!INFO] Definizione
> Mentre l'ISA definisce *cosa* il processore può fare, l'ABI definisce *come* il software deve organizzarsi per cooperare (es. come passare parametri a una funzione).

## Convenzione sui Registri (Calling Convention)

RISC-V definisce nomi mnemonici per i 32 registri integer (`x0`-`x31`) per indicarne lo scopo secondo l'ABI standard.

| Registro | Nome ABI | Ruolo | Preservato da... |
| :--- | :--- | :--- | :--- |
| `x0` | `zero` | Sempre 0 | - |
| `x1` | `ra` | Return Address | Chiamante (Caller) |
| `x2` | `sp` | Stack Pointer | Chiamato (Callee) |
| `x3` | `gp` | Global Pointer | - |
| `x4` | `tp` | Thread Pointer | - |
| `x5`-`x7` | `t0`-`t2` | Temporanei | Caller |
| `x8` | `s0`/`fp` | Saved / Frame Pointer | Callee |
| `x9` | `s1` | Saved register | Callee |
| `x10`-`x11` | `a0`-`a1` | Argomenti / Valori di ritorno | Caller |
| `x12`-`x17` | `a2`-`a7` | Argomenti | Caller |
| `x18`-`x27` | `s2`-`s11` | Saved registers | Callee |
| `x28`-`x31` | `t3`-`t6` | Temporanei | Caller |

### Caller-Saved vs Callee-Saved
- **Caller-saved (`t` e `a`):** Se il chiamante ha bisogno di questi valori dopo una `jal`, deve salvarli nello stack prima della chiamata.
- **Callee-saved (`s`):** Se una funzione vuole usare questi registri, deve salvarne il contenuto originale e ripristinarlo prima di ritornare.

## Passaggio dei Parametri

1. **Interi:** I primi 8 argomenti interi vengono passati nei registri `a0`-`a7`. Se ci sono più di 8 argomenti, i rimanenti vengono passati nello **stack**.
2. **Valori di ritorno:** I valori di ritorno sono solitamente passati in `a0` e `a1`.
3. **Floating Point:** Se l'estensione F è presente, si usano i registri `fa0`-`fa7`.

## Naming delle ABI (Standard)

Le ABI RISC-V seguono una convenzione basata su `[Integer Width][Floating Point Model]`:

- **ilp32**: 32-bit integer, long, pointers. Nessun supporto hardware FP per il passaggio parametri (Soft-float).
- **ilp32f**: 32-bit con supporto FP a singola precisione nei registri.
- **ilp32d**: 32-bit con supporto FP a doppia precisione.
- **lp64**: 64-bit integer (long), pointers. (Standard per Linux 64-bit).
- **lp64d**: 64-bit con doppia precisione FP.

## Stack Alignment
L'ABI RISC-V richiede che lo Stack Pointer (`sp`) sia sempre allineato a **16 byte** prima di una chiamata a funzione. Questo garantisce compatibilità con tipi di dati larghi (come vettori o `quad-precision float`) che potrebbero essere aggiunti in futuro o usati da estensioni specifiche.

---
## Collegamenti
- [[Anatomia del Software]]
- [[Registri e XLEN]]
