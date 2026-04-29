---
date: 2026-04-29
tags: [risc-v, zicsr, csr, isa, privilege, assembly]
aliases: ["Zicsr: Control and Status Register Instructions"]
type: #permanent-note
status: budding
---

# Zicsr

`Zicsr` e l'estensione standard RISC-V che definisce le istruzioni per accedere ai **Control and Status Registers (CSR)**.

Senza Zicsr, la ISA base intera non ha un meccanismo standard per leggere e modificare registri architetturali come `mstatus`, `mtvec`, `mepc`, `mcause`, contatori, registri di trap, stato di privilegio o configurazioni macchina.

> [!INFO]
> I CSR non sono general-purpose registers. Sono registri speciali usati per stato macchina, controllo, eccezioni, interrupt, contatori e configurazione del processore.

## 1. Perche Esiste Zicsr

RISC-V separa in modo pulito:

- dati generali nei registri `x0-x31`;
- stato di controllo nei CSR;
- meccanismi di trap e privilege nelle specifiche privilegiate.

L'estensione Zicsr esiste per:

- leggere stato della CPU;
- configurare comportamento macchina;
- abilitare o disabilitare interrupt;
- salvare e ripristinare stato di trap;
- accedere a contatori e timer;
- esporre configurazioni architetturali a firmware, kernel e hypervisor.

Collegamento: [[Registri e XLEN]]

## 2. Cosa Sono i CSR

I CSR sono registri speciali indirizzati tramite un identificatore a **12 bit**.

Caratteristiche:

- non fanno parte dei 32 registri interi;
- hanno semantica definita dalla specifica;
- possono essere read-only, read-write o con vincoli particolari;
- possono essere accessibili solo a certi privilege level;
- possono avere side effect su lettura o scrittura.

Esempi comuni:

- `mstatus`: stato macchina;
- `mtvec`: trap vector;
- `mepc`: program counter salvato su eccezione;
- `mcause`: causa della trap;
- `mie`: interrupt enable;
- `mip`: interrupt pending;
- `cycle`, `time`, `instret`: contatori.

## 3. Relazione con i Privilege Mode

I CSR sono strettamente legati ai privilege mode.

Collegamento futuro: [[Machine, Supervisor, User Mode]]

Non tutti i software possono leggere o scrivere tutti i CSR:

- alcuni sono accessibili solo in Machine mode;
- altri sono visibili anche in Supervisor mode;
- altri ancora sono esposti a User mode in forma controllata;
- alcuni possono essere read-only;
- alcuni possono generare trap se l'accesso non e permesso.

Questa separazione impedisce, per esempio, che codice utente modifichi direttamente stato sensibile del processore.

## 4. Le Sei Istruzioni Zicsr

Zicsr definisce sei istruzioni:

- `CSRRW`
- `CSRRS`
- `CSRRC`
- `CSRRWI`
- `CSRRSI`
- `CSRRCI`

Le prime tre usano un registro sorgente (`rs1`), le seconde tre usano un immediato a 5 bit (`uimm`).

Schema:

```txt
rd <- old CSR value
CSR <- new value derived from rs1/uimm
```

Queste istruzioni permettono operazioni atomiche di read-modify-write sul singolo CSR.

## 5. CSRRW

`CSRRW rd, csr, rs1`

Semantica:

1. legge il vecchio valore del CSR;
2. lo copia in `rd`;
3. scrive nel CSR il valore contenuto in `rs1`.

Esempio:

```asm
csrrw t0, mstatus, t1
```

Effetto:

- `t0` riceve il vecchio `mstatus`;
- `mstatus` diventa il contenuto di `t1`.

Caso particolare:

- se `rd = x0`, il vecchio valore non viene restituito;
- in questo caso la lettura del CSR non e richiesta come risultato architetturale.

Uso tipico:

- sostituzione completa del contenuto di un CSR;
- save/restore di stato;
- swap tra registro generale e CSR.

## 6. CSRRS

`CSRRS rd, csr, rs1`

Semantica:

1. legge il vecchio valore del CSR;
2. lo copia in `rd`;
3. scrive nel CSR il valore `CSR | rs1`.

E utile per **settare bit** senza toccare gli altri.

Esempio:

```asm
csrrs t0, mie, t1
```

Se `t1` contiene una mask, i bit a 1 in quella mask vengono abilitati in `mie`.

Caso importante:

- se `rs1 = x0`, non viene modificato il CSR;
- l'istruzione diventa una lettura pura del CSR.

Esempio:

```asm
csrrs t0, mstatus, x0
```

Questo equivale, di fatto, a leggere `mstatus` in `t0`.

## 7. CSRRC

`CSRRC rd, csr, rs1`

Semantica:

1. legge il vecchio valore del CSR;
2. lo copia in `rd`;
3. scrive nel CSR il valore `CSR & ~rs1`.

E utile per **pulire bit** selettivamente.

Esempio:

```asm
csrrc t0, mie, t1
```

Se `t1` contiene una mask, i bit a 1 nella mask vengono azzerati nel CSR.

Anche qui:

- se `rs1 = x0`, il CSR non viene modificato;
- l'istruzione si riduce a una lettura del CSR.

## 8. Varianti Immediate

Le varianti immediate sono:

- `CSRRWI`
- `CSRRSI`
- `CSRRCI`

Invece di usare `rs1`, usano un immediato unsigned a 5 bit (`uimm`), zero-extended a XLEN.

Esempio:

```asm
csrrsi t0, mstatus, 0x8
```

Questo setta i bit indicati da `0x8` e restituisce il vecchio valore in `t0`.

Le varianti immediate sono utili quando:

- la mask e piccola;
- non conviene preparare un registro;
- si vuole codice piu compatto e diretto.

## 9. Lettura Pura e Scrittura Pura

Zicsr permette pattern molto usati.

### Lettura pura

```asm
csrrs t0, mstatus, x0
```

Legge `mstatus` senza modificarlo.

### Scrittura pura

```asm
csrrw x0, mtvec, t1
```

Scrive `t1` in `mtvec` senza salvare il vecchio valore.

### Set bit con mask

```asm
csrrs x0, mie, t1
```

Setta bit in `mie`, ignorando il vecchio valore.

### Clear bit con mask

```asm
csrrc x0, mie, t1
```

Pulisce bit in `mie`, ignorando il vecchio valore.

Questi pattern compaiono continuamente in firmware, boot code, trap handler e kernel low-level.

## 10. Side Effect e Casi Speciali

I CSR non sono tutti semplici "registri memoria-like". Alcuni possono avere side effect.

Per questo la semantica precisa delle istruzioni conta molto.

Regole pratiche importanti:

- `CSRRW` con `rd = x0` evita di usare il valore letto come risultato;
- `CSRRS` e `CSRRC` con `rs1 = x0` non modificano il CSR;
- le varianti immediate con `uimm = 0` possono comportarsi come letture pure per le operazioni set/clear;
- accessi a CSR read-only o non permessi possono generare illegal instruction trap.

Questi dettagli sono cruciali per scrivere codice corretto e per modellare fedelmente l'ISA in simulatori e RTL.

## 11. Esempi con mstatus, mie e mtvec

### Leggere `mstatus`

```asm
csrrs t0, mstatus, x0
```

Uso:

- debug;
- salvataggio stato;
- ispezione di privilege bits e interrupt enable.

### Abilitare interrupt in `mie`

```asm
li t1, 0x80
csrrs x0, mie, t1
```

Uso:

- attivare una classe specifica di interrupt;
- lasciare invariati gli altri bit.

### Disabilitare interrupt in `mie`

```asm
li t1, 0x80
csrrc x0, mie, t1
```

### Impostare `mtvec`

```asm
la t1, trap_handler
csrrw x0, mtvec, t1
```

Uso:

- configurare l'indirizzo del trap handler.

## 12. Atomicita Logica

Le istruzioni CSR sono pensate come operazioni atomiche sul singolo CSR dal punto di vista architetturale.

Questo significa che il pattern:

```txt
leggi -> modifica -> scrivi
```

e espresso in una singola istruzione, evitando finestre intermedie visibili a livello architetturale per quella stessa operazione sul CSR.

Non significa automaticamente sincronizzazione multiprocessore generale: per quello servono altri meccanismi, come atomiche in memoria o `FENCE`, a seconda del problema.

Collegamento futuro: [[Istruzioni FENCE e TSO (Total Store Ordering)]]

## 13. Zicsr e Sistema Operativo

Un sistema operativo usa i CSR continuamente.

Casi tipici:

- ingresso e uscita da trap;
- configurazione interrupt;
- lettura contatori;
- context switching;
- gestione timer;
- gestione eccezioni;
- transizione tra privilege mode;
- virtualizzazione o delegation.

Senza Zicsr non si potrebbe implementare in modo standard la maggior parte del software privilegiato.

## 14. Zicsr e Debug/Verifica

Dal punto di vista di verifica e debug, i CSR sono una fonte frequente di bug.

Problemi tipici:

- indirizzo CSR errato;
- accessi illegali non trappati;
- bit read-only scritti erroneamente;
- side effect non modellati;
- comportamento WARL non rispettato;
- semantica di set/clear implementata male;
- differenze tra privilege mode non gestite.

Collegamento futuro: [[Architectural Compliance Testing: Assicurarsi che un core sia RISC-V]]

Una implementazione puo eseguire bene ALU e load/store ma fallire la compatibilita se il sottosistema CSR e scorretto.

## 15. Relazione con XLEN

I CSR interagiscono con XLEN, ma non sempre in modo banale.

Collegamento: [[Registri e XLEN]]

Aspetti importanti:

- il dato trasferito verso i registri generali ha dimensione XLEN;
- alcune viste dei CSR dipendono da RV32 o RV64;
- certe coppie di CSR o campi cambiano tra implementazioni a 32 e 64 bit;
- la toolchain deve sapere il target per generare accessi corretti.

Per questo leggere la semantica dei CSR senza sapere se il target e RV32 o RV64 puo portare a interpretazioni sbagliate.

## 16. Relazione con Estensioni e Privileged Spec

Zicsr e solo il meccanismo di accesso.

Non definisce da solo tutti i CSR esistenti. Il contenuto vero dei CSR dipende da:

- specifica privilegiata;
- estensioni implementate;
- contatori supportati;
- debug architecture;
- hypervisor extension;
- vector extension;
- eventuali CSR custom.

Collegamenti:

- [[Estensibilita]]
- [[Machine, Supervisor, User Mode]]

Quindi conoscere `CSRRW` o `CSRRS` non basta: bisogna sapere anche **quale CSR** si sta toccando e in quale contesto.

## 17. Errori Comuni

### Confondere CSR e registri generali

I CSR non sono registri liberamente usabili per dati applicativi.

### Dimenticare i privilege check

Una istruzione CSR valida sintatticamente puo comunque generare trap se il software non ha i permessi necessari.

### Usare `CSRRW` quando serve set/clear selettivo

`CSRRW` sovrascrive tutto il CSR. Se serve modificare pochi bit, `CSRRS` o `CSRRC` sono spesso la scelta corretta.

### Non considerare side effect

Su alcuni CSR, leggere o scrivere puo avere effetti osservabili. Non vanno trattati come semplici variabili.

### Ignorare `x0`

Con Zicsr, `x0` cambia il significato operativo di molti pattern: puo trasformare una lettura-modifica-scrittura in lettura pura o scrittura senza ritorno del valore precedente.

## 18. Checklist Operativa

Quando analizzi o implementi Zicsr, verifica:

1. Quali CSR sono presenti nel target?
2. Quali privilege mode possono accedervi?
3. Il CSR e read-only, read-write o WARL?
4. Ci sono side effect su lettura o scrittura?
5. Serve leggere il vecchio valore o no?
6. Serve settare bit, pulire bit o sovrascrivere tutto?
7. Il codice gira in RV32 o RV64?
8. L'accesso puo generare illegal instruction trap?
9. Il simulatore e l'RTL implementano la stessa semantica?
10. Il software ha bisogno di fallback o astrazioni per target diversi?

## 19. Mappa Mentale

```txt
Zicsr
  -> accesso ai CSR
  -> 6 istruzioni: CSRRW/CSRRS/CSRRC + immediate
  -> read / set / clear / write
  -> controllo privilege
  -> trap, interrupt, contatori, stato macchina
  -> dipende da CSR specifico e contesto
```

## Collegamenti

- [[Registri e XLEN]]
- [[Estensibilita]]
- [[Machine, Supervisor, User Mode]]
- [[Architectural Compliance Testing: Assicurarsi che un core sia RISC-V]]
- [[Istruzioni FENCE e TSO (Total Store Ordering)]]

## Riferimenti

- [RISC-V Unprivileged ISA Specification](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [RISC-V Privileged Architecture Specification](https://docs.riscv.org/reference/isa/priv/priv-index.html)
