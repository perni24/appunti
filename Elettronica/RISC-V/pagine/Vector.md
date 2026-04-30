---
date: 2026-04-30
tags: [risc-v, vector, rvv, vlen, elen, sew, lmul, simd, isa]
aliases: ["Vector (V): VLEN, ELEN, Register Grouping (LMUL)"]
type: #permanent-note
status: budding
---

# Vector

La **V extension** di RISC-V aggiunge supporto per operazioni vettoriali: una singola istruzione puo operare su piu elementi dati contenuti nei registri vettoriali.

La differenza principale rispetto a molte ISA SIMD tradizionali e che RISC-V Vector e progettata per essere **vector-length agnostic**: lo stesso binario puo scalare su implementazioni con registri vettoriali di dimensione diversa, entro i vincoli supportati dal profilo hardware.

> [!INFO]
> In RVV, il software non dovrebbe assumere una lunghezza vettoriale fissa come 128 o 256 bit. Usa `vsetvli` per chiedere al processore quanti elementi puo elaborare in questa iterazione, poi avanza il loop in base al valore effettivo di `vl`.

## 1. Perche Esiste la Vector Extension

Molti workload moderni sono data-parallel.

Esempi:

- DSP;
- elaborazione immagini;
- audio/video;
- machine learning;
- crittografia;
- compressione;
- simulazioni numeriche;
- database e analytics;
- copia, confronto e trasformazione di array.

Senza estensione vettoriale, il processore deve eseguire una istruzione scalare per ogni elemento.

Con RVV:

```txt
una istruzione vettoriale
  -> opera su N elementi
  -> N dipende da VLEN, SEW e LMUL
```

Questo aumenta throughput e riduce overhead di loop.

## 2. Vector-Length Agnostic

Il concetto piu importante di RVV e il modello vector-length agnostic.

Il codice non assume direttamente quanti elementi stanno in un registro vettoriale. Invece:

1. calcola quanti elementi restano da processare;
2. usa `vsetvli` o istruzioni simili per configurare `vl` e `vtype`;
3. esegue operazioni vettoriali su `vl` elementi;
4. avanza i puntatori;
5. ripete finche il lavoro e finito.

Schema:

```txt
while (n > 0) {
  vl = set_vector_length(n, SEW, LMUL)
  process vl elements
  n -= vl
}
```

Questo permette allo stesso binario di girare su core con VLEN diverso, per esempio 128, 256, 512 o 1024 bit.

## 3. Registri Vettoriali

RVV definisce 32 registri vettoriali:

```txt
v0, v1, v2, ... v31
```

Ogni registro ha una lunghezza fisica pari a **VLEN** bit.

Esempio:

```txt
VLEN = 128 bit
v0 = 128 bit
v1 = 128 bit
...
v31 = 128 bit
```

Se `VLEN = 256`, ogni registro vettoriale ha 256 bit.

Il software portabile non dovrebbe dipendere direttamente da questo valore, ma puo leggerne alcune proprieta tramite CSR come `vlenb`.

## 4. VLEN

`VLEN` e la lunghezza in bit di un singolo registro vettoriale.

Caratteristiche:

- e definita dall'implementazione;
- e una costante di design per un dato hart;
- deve essere almeno `ELEN`;
- nelle specifiche standard e una potenza di 2;
- influenza quanti elementi possono essere processati per istruzione.

Esempio:

```txt
VLEN = 128
SEW = 32
LMUL = 1

VLMAX = 128 / 32 = 4 elementi
```

Con lo stesso codice, una macchina con `VLEN = 256` potrebbe processare 8 elementi a 32 bit per istruzione con `LMUL = 1`.

## 5. ELEN

`ELEN` e la dimensione massima, in bit, di un elemento che una operazione vettoriale puo produrre o consumare.

Esempi:

- `ELEN = 32`: supporto massimo nativo per elementi a 32 bit;
- `ELEN = 64`: supporto massimo nativo per elementi a 64 bit.

Relazione:

```txt
VLEN >= ELEN
```

`ELEN` non dice quanti elementi stanno in un registro. Dice qual e la larghezza massima supportata per il singolo elemento.

## 6. SEW

`SEW` significa **Selected Element Width**.

Indica la dimensione degli elementi per una specifica configurazione vettoriale.

Esempi:

- `e8`: elementi da 8 bit;
- `e16`: elementi da 16 bit;
- `e32`: elementi da 32 bit;
- `e64`: elementi da 64 bit.

Esempio:

```asm
vsetvli t0, a0, e32, m1, ta, ma
```

Qui si richiede una configurazione con:

- elementi da 32 bit;
- `LMUL = 1`;
- tail agnostic;
- mask agnostic.

## 7. VL

`vl` e il numero effettivo di elementi che le prossime istruzioni vettoriali opereranno.

Non e sempre uguale al numero richiesto dal programma.

Esempio:

```txt
elementi restanti = 100
VLMAX = 8
vsetvli -> vl = 8
```

All'ultima iterazione:

```txt
elementi restanti = 3
VLMAX = 8
vsetvli -> vl = 3
```

Questo elimina la necessita di scrivere un loop scalare separato per il resto finale.

## 8. LMUL

`LMUL` significa **register grouping multiplier**.

Permette a una operazione vettoriale di usare gruppi di registri invece di un singolo registro.

Valori tipici:

- `mf8`;
- `mf4`;
- `mf2`;
- `m1`;
- `m2`;
- `m4`;
- `m8`.

Esempio:

```txt
LMUL = 1 -> un registro vettoriale
LMUL = 2 -> gruppo di 2 registri
LMUL = 4 -> gruppo di 4 registri
LMUL = 8 -> gruppo di 8 registri
```

Formula:

```txt
VLMAX = LMUL * VLEN / SEW
```

Esempio:

```txt
VLEN = 128
SEW = 32
LMUL = 2

VLMAX = 2 * 128 / 32 = 8 elementi
```

## 9. Register Grouping

Quando `LMUL > 1`, una istruzione usa gruppi di registri contigui.

Esempi:

```txt
LMUL = 2
v0 usa v0-v1
v2 usa v2-v3

LMUL = 4
v0 usa v0-v3
v4 usa v4-v7

LMUL = 8
v0 usa v0-v7
v8 usa v8-v15
```

Alcune combinazioni sono riservate se il numero del registro non e allineato al gruppo.

Esempio:

```txt
LMUL = 2 con v1
  -> riservato, perche v1 non e multiplo di 2
```

Questo vincolo semplifica mapping hardware e decode.

## 10. Fractional LMUL

RVV supporta anche LMUL frazionario.

Esempi:

- `mf2`: meta registro;
- `mf4`: un quarto di registro;
- `mf8`: un ottavo di registro.

Questo e utile quando:

- gli elementi sono piccoli;
- serve ridurre pressione sui registri;
- si vogliono piu vettori attivi contemporaneamente;
- il tipo dati non richiede tutto un registro.

Esempio:

```txt
VLEN = 128
SEW = 8
LMUL = 1/2

VLMAX = 0.5 * 128 / 8 = 8 elementi
```

Il resto del registro fa parte della tail e segue le regole tail agnostic/undisturbed.

## 11. vtype

`vtype` e un CSR che descrive la configurazione vettoriale corrente.

Contiene informazioni come:

- `SEW`;
- `LMUL`;
- tail policy;
- mask policy;
- bit `vill` per configurazioni illegali.

Collegamento: [[Zicsr]]

Se il software richiede una configurazione non supportata, l'hardware puo impostare `vill`, indicando che il tipo vettoriale e illegale.

## 12. vsetvli, vsetivli e vsetvl

La configurazione vettoriale viene impostata tramite istruzioni dedicate.

Le principali sono:

- `vsetvli`;
- `vsetivli`;
- `vsetvl`.

Esempio tipico:

```asm
vsetvli t0, a0, e32, m1, ta, ma
```

Significato:

- `a0`: numero di elementi richiesti;
- `t0`: riceve il valore effettivo di `vl`;
- `e32`: elementi da 32 bit;
- `m1`: LMUL = 1;
- `ta`: tail agnostic;
- `ma`: mask agnostic.

Questo e il cuore del loop vector-length agnostic.

## 13. Esempio di Loop Vettoriale

Esempio concettuale: sommare due array di `int32`.

```asm
loop:
    vsetvli t0, a0, e32, m1, ta, ma
    vle32.v v0, (a1)
    vle32.v v1, (a2)
    vadd.vv v2, v0, v1
    vse32.v v2, (a3)
    slli t1, t0, 2
    add a1, a1, t1
    add a2, a2, t1
    add a3, a3, t1
    sub a0, a0, t0
    bnez a0, loop
```

Proprieta:

- non assume VLEN fisso;
- gestisce automaticamente il resto finale;
- scala su implementazioni diverse;
- usa `vl` per avanzare i puntatori.

## 14. Maschere

RVV usa maschere per abilitare o disabilitare elementi specifici.

Il registro `v0` e usato come mask register.

Esempio concettuale:

```asm
vmslt.vx v0, v1, zero
vadd.vv v2, v2, v3, v0.t
```

Significato:

- crea una maschera per gli elementi minori di zero;
- applica l'addizione solo agli elementi attivi.

Le maschere sono fondamentali per:

- predicazione;
- eliminazione di branch;
- gestione condizioni per elemento;
- loop con elementi parzialmente validi.

## 15. Tail e Mask Policy

RVV distingue:

- elementi attivi;
- elementi inattivi per maschera;
- elementi tail oltre `vl`.

Le policy principali sono:

- `ta`: tail agnostic;
- `tu`: tail undisturbed;
- `ma`: mask agnostic;
- `mu`: mask undisturbed.

Significato pratico:

- agnostic: gli elementi non attivi possono essere sovrascritti con valori non significativi;
- undisturbed: gli elementi non attivi devono conservare il valore precedente.

Le policy influenzano performance e obblighi hardware.

## 16. Load e Store Vettoriali

RVV supporta piu forme di accesso memoria.

Categorie principali:

- unit-stride load/store;
- strided load/store;
- indexed load/store;
- segment load/store.

Esempi:

```asm
vle32.v v0, (a0)
vse32.v v0, (a1)
```

Unit-stride e il caso piu semplice e spesso piu efficiente.

Indexed e strided sono utili per strutture dati meno contigue, ma possono costare di piu in hardware e memoria.

## 17. Arithmetic e Widening

RVV include operazioni:

- intere;
- floating point, se sono presenti le estensioni FP richieste;
- narrowing;
- widening;
- saturating;
- compare;
- reduction;
- slide;
- gather;
- permute.

Esempio widening:

```txt
input e16
operazione widening
output e32
```

Questo e utile quando il risultato richiede piu bit degli operandi, per esempio in accumuli numerici.

## 18. Reduction

Le reduction combinano elementi di un vettore in un risultato piu piccolo.

Esempi:

- somma di tutti gli elementi;
- massimo;
- minimo;
- AND/OR/XOR cumulativi.

Concetto:

```txt
[1, 2, 3, 4] -> sum -> 10
```

Le reduction sono fondamentali per:

- algebra lineare;
- statistiche;
- DSP;
- machine learning;
- scansione di array.

## 19. Vector vs SIMD Tradizionale

Molte ISA SIMD fissano una larghezza concreta.

Esempi concettuali:

- 128 bit;
- 256 bit;
- 512 bit.

RVV invece espone un modello scalabile.

| Aspetto | SIMD Tradizionale | RISC-V Vector |
|---|---|---|
| Lunghezza registro | spesso fissa per ISA | implementation-defined |
| Portabilita binaria | legata alla larghezza | vector-length agnostic |
| Loop tail | spesso gestita a parte | gestita tramite `vl` |
| Scalabilita hardware | richiede nuove varianti ISA | stessa ISA, VLEN diverso |

Questo e uno dei punti piu forti di RVV.

## 20. Relazione con Bitmanip

Bitmanip e Vector risolvono problemi diversi.

Collegamento: [[Bitmanip]]

| Aspetto | Bitmanip | Vector |
|---|---|---|
| Registro | scalare XLEN | vettoriale VLEN |
| Operazioni | bit su singolo valore | molti elementi |
| Tipico uso | bitmap, hash, flag, indirizzi | array, SIMD, DSP, ML |
| Naming | `Zba`, `Zbb`, `Zbs`, `Zbc` | `V`, `Zve*`, `Zvl*` |

Possono coesistere nello stesso core e nello stesso programma.

## 21. Relazione con G e Profili

`V` non fa parte di `G`.

Collegamento: [[Estensioni G]]

Esempi:

```txt
RV64G
  -> general-purpose base

RV64GCV
  -> G + compressed + vector
```

I profili moderni possono richiedere o raccomandare specifiche combinazioni di estensioni e lunghezze minime.

Collegamento futuro: [[Profili RVA/RVM/RVI: Comprendere la standardizzazione moderna]]

## 22. Zve e Zvl

La specifica definisce anche estensioni correlate.

`Zve*`:

- sottoinsiemi vector per embedded;
- utili per implementazioni piu piccole;
- riducono requisiti rispetto alla `V` completa.

`Zvl*`:

- dichiarano una lunghezza vettoriale minima;
- esempi: `Zvl32b`, `Zvl64b`, `Zvl128b`, `Zvl256b`;
- ogni estensione piu lunga implica quelle piu corte.

Esempio:

```txt
Zvl128b
  -> VLEN almeno 128 bit
```

Questi nomi sono importanti per descrivere capacita hardware e requisiti software.

## 23. Toolchain

Esempio di target con vector:

```bash
riscv64-unknown-elf-gcc -march=rv64gcv -mabi=lp64d
```

Esempio piu esplicito:

```bash
riscv64-unknown-elf-gcc -march=rv64gc_v -mabi=lp64d
```

Il supporto effettivo dipende da:

- versione GCC/LLVM;
- ABI;
- librerie;
- intrinsics;
- autovectorization;
- profilo target;
- supporto OS per stato vettoriale.

Collegamento futuro: [[Inline Assembly e Intrinsic (soprattutto per Vector e Bitmanip)]]

## 24. Intrinsics e Autovectorization

Il compilatore puo usare RVV in due modi principali:

1. Autovectorization.
2. Intrinsics espliciti.

Autovectorization:

- il compilatore riconosce loop scalari;
- prova a generarne una versione vettoriale;
- dipende da aliasing, allineamento, cost model e flags.

Intrinsics:

- il programmatore usa API specifiche RVV;
- maggiore controllo;
- minore portabilita sorgente;
- utile per kernel numerici e librerie ottimizzate.

## 25. Impatto Hardware

Implementare RVV e molto piu impegnativo di implementare una estensione scalare semplice.

Blocchi necessari:

- vector register file;
- lane vettoriali;
- load/store unit vettoriale;
- gestione `vl` e `vtype`;
- masking;
- tail policy;
- widening/narrowing;
- reduction;
- permute/slide/gather;
- supporto trap e `vstart`;
- gestione stato vettoriale nel privilege layer.

Un core piccolo puo scegliere sottoinsiemi `Zve*` invece della `V` completa.

## 26. Impatto su OS e Context Switch

Lo stato vettoriale puo essere grande.

Il sistema operativo deve gestire:

- salvataggio/ripristino dei registri vettoriali;
- tracking dello stato vector attivo;
- lazy context switching;
- trap su uso della vector unit;
- migrazione tra hart compatibili;
- ABI per chiamate di funzione;
- segnalazione delle capacita al software.

La specifica nota che thread con stato vettoriale attivo non dovrebbero essere migrati tra hart con `VLEN` o `ELEN` differenti senza gestione adeguata.

## 27. Errori Comuni

### Pensare che VLEN sia fisso per tutta RISC-V

VLEN e implementation-defined. Due core RVV possono avere VLEN diverso.

### Scrivere loop dipendenti da una larghezza concreta

Il codice RVV portabile usa `vsetvli` e `vl`.

### Confondere ELEN e SEW

`ELEN` e il massimo supportato dall'hardware; `SEW` e la larghezza selezionata per la configurazione corrente.

### Ignorare LMUL

LMUL cambia quanti registri vengono raggruppati e quanti elementi possono essere processati.

### Dimenticare maschere e tail policy

Gli elementi inattivi e tail possono conservare valori o diventare agnostic a seconda della policy.

## 28. Checklist Operativa

Quando analizzi o implementi RVV:

1. Quali valori di `VLEN` ed `ELEN` sono supportati?
2. Quali `SEW` sono validi?
3. Quali `LMUL` interi e frazionari sono supportati?
4. `vsetvli` imposta correttamente `vl` e `vtype`?
5. Il codice e vector-length agnostic?
6. Le maschere usano correttamente `v0`?
7. Tail e mask policy sono implementate?
8. Load/store vettoriali gestiscono allineamento e fault?
9. `vstart` permette ripresa corretta dopo trap?
10. Toolchain e ABI sono coerenti con `V`?
11. Il sistema operativo salva e ripristina lo stato vettoriale?
12. I test coprono VLEN diversi o almeno configurazioni diverse di SEW/LMUL?

## 29. Mappa Mentale

```txt
Vector Extension
  -> v0-v31 registri vettoriali
  -> VLEN: bit per registro
  -> ELEN: massimo elemento supportato
  -> SEW: elemento selezionato
  -> VL: elementi effettivi
  -> LMUL: raggruppamento registri
  -> vsetvli configura il loop
  -> maschere, tail policy, load/store, reduction
  -> modello vector-length agnostic
```

## Collegamenti

- [[Registri e XLEN]]
- [[Zicsr]]
- [[Bitmanip]]
- [[Estensioni G]]
- [[Formati Istruzioni e Immediate Encoding]]
- [[Profili RVA/RVM/RVI: Comprendere la standardizzazione moderna]]
- [[Inline Assembly e Intrinsic (soprattutto per Vector e Bitmanip)]]

## Riferimenti

- [RISC-V V Standard Extension for Vector Operations](https://docs.riscv.org/reference/isa/unpriv/v-st-ext.html)
- [RISC-V ISA Specifications](https://docs.riscv.org/reference/isa/)
- [LLVM RISC-V Vector Extension](https://llvm.org/docs/RISCV/RISCVVectorExtension.html)
