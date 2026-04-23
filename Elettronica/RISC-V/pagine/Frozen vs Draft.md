---
date: 2026-04-23
tags: [risc-v, specifications, draft, frozen, ratified, governance, isa]
type: #permanent-note
status: budding
---

# Frozen vs Draft

Nel processo di standardizzazione RISC-V, termini come **Draft**, **Stable**, **Frozen** e **Ratified** indicano il livello di maturita di una specifica.

Questi stati sono importanti perche una ISA non e solo un documento tecnico: e un contratto tra hardware, firmware, compilatori, sistemi operativi e applicazioni. Cambiare una specifica troppo tardi puo rompere toolchain, ABI, test di compliance e implementazioni gia esistenti.

> [!INFO]
> In RISC-V, una specifica Draft non dovrebbe essere trattata come una base stabile per prodotti a lungo ciclo di vita. Una specifica Frozen e molto piu stabile, ma non ha ancora lo stesso livello di garanzia di una specifica Ratified.

## 1. Perche Esistono Questi Stati

RISC-V e modulare: oltre alla ISA base, esistono molte estensioni standard e non standard.

Senza un ciclo di maturazione chiaro, ogni proposta rischierebbe di essere interpretata come standard definitivo.

Gli stati servono a chiarire:

- quanto una specifica puo ancora cambiare;
- se e adatta alla sperimentazione;
- se e ragionevole implementarla in hardware;
- se compilatori e sistemi operativi possono dipenderne;
- se puo essere usata per compliance e prodotti commerciali;
- quanto rischio tecnico assume chi la adotta.

## 2. Ciclo di Vita di una Specifica

Il processo puo essere semplificato cosi:

```txt
Idea
  -> Draft / Development
  -> Stable
  -> Frozen
  -> Public Review
  -> Ratified
```

La sequenza non e solo burocratica. Ogni fase riduce il margine di cambiamento e aumenta la fiducia dell'ecosistema.

## 3. Draft

Una specifica **Draft** e ancora in sviluppo.

Caratteristiche:

- puo cambiare in modo sostanziale;
- encoding, semantica e dettagli operativi non sono finali;
- feedback e redesign sono ancora attesi;
- non dovrebbe essere considerata una promessa di compatibilita futura;
- e utile per ricerca, prototipi e discussione tecnica.

Uso corretto:

- simulazione;
- prototipazione;
- valutazione di fattibilita;
- contributi alla specifica;
- implementazioni sperimentali;
- ricerca accademica o industriale.

Uso rischioso:

- silicon tape-out senza piano di aggiornamento;
- toolchain pubbliche presentate come definitive;
- prodotti con supporto pluriennale;
- ABI o API pubbliche difficili da cambiare.

## 4. Stable

Una specifica **Stable** e piu matura di una Draft, ma non ancora bloccata.

Caratteristiche:

- struttura principale abbastanza definita;
- cambiamenti ancora possibili;
- modifiche attese piu limitate;
- utile per early adopters consapevoli;
- non equivale a ratifica.

Stable significa che la direzione tecnica e relativamente chiara, ma non bisogna ancora assumere compatibilita definitiva.

## 5. Frozen

Una specifica **Frozen** e quasi definitiva.

Caratteristiche:

- cambiamenti sostanziali sono altamente improbabili;
- eventuali modifiche dovrebbero riguardare problemi critici;
- la specifica e preparata per review e ratifica;
- l'ecosistema puo iniziare a pianificare implementazioni piu concrete;
- resta comunque uno stato precedente a Ratified.

Frozen e lo stato in cui hardware vendor, compiler team e sistemi operativi possono iniziare ad avere fiducia maggiore nella stabilita della specifica.

> [!WARNING]
> Frozen non significa immutabile. Significa che il costo per cambiare la specifica e diventato molto alto e che i cambiamenti dovrebbero essere eccezioni motivate.

## 6. Ratified

Una specifica **Ratified** e standard ufficiale.

Caratteristiche:

- non dovrebbe essere modificata in modo incompatibile;
- e adatta a prodotti, toolchain e compliance;
- diventa una base stabile per implementazioni hardware e software;
- eventuali evoluzioni dovrebbero avvenire tramite nuove estensioni o revisioni compatibili.

Per un progettista hardware, Ratified e lo stato piu sicuro.

Per un team software, Ratified e il livello che consente di assumere compatibilita stabile nel tempo.

## 7. Tabella Comparativa

| Stato | Stabilita | Rischio di Cambiamento | Uso Tipico |
|---|---:|---:|---|
| Draft | Bassa | Alto | Ricerca, discussione, prototipi |
| Stable | Media | Medio | Early adoption, valutazioni tecniche |
| Frozen | Alta | Basso | Pianificazione hardware/software seria |
| Ratified | Molto alta | Molto basso | Prodotti, toolchain, compliance |

## 8. Impatto su Hardware

In hardware, adottare una specifica instabile e molto piu rischioso che in software.

Un errore in una implementazione software puo essere corretto con una release. Un errore in silicio puo richiedere:

- nuova revisione del chip;
- workaround firmware;
- disabilitazione di funzionalita;
- errata documentati;
- costi di validazione aggiuntivi;
- incompatibilita con toolchain future.

Per questo motivo, una specifica Draft dovrebbe essere implementata in hardware solo se il progetto accetta esplicitamente il rischio.

Esempi di mitigazione:

- rendere l'estensione disabilitabile;
- usarla solo in prototipi;
- isolarla dietro feature flag;
- prevedere microcode o firmware workaround;
- evitare di esporla come ABI pubblica stabile.

## 9. Impatto su Toolchain e Software

Compilatori, assembler, linker, simulatori e debugger dipendono da dettagli precisi.

Una modifica a una specifica puo cambiare:

- encoding delle istruzioni;
- vincoli sugli operandi;
- semantica di eccezioni;
- comportamento di memoria;
- CSR disponibili;
- ABI e calling convention;
- test di compliance.

Per questo, il supporto software a una Draft dovrebbe essere marcato chiaramente come sperimentale.

Esempio concettuale:

```txt
Supporto toolchain per estensione Draft
  -> utile per test
  -> non garantisce stabilita ABI
  -> puo cambiare con versioni future
```

## 10. Relazione con Compliance

La compliance ha senso solo rispetto a una specifica definita.

Collegamento: [[Architectural Compliance Testing: Assicurarsi che un core sia RISC-V]].

Se una specifica e Draft:

- i test possono cambiare;
- il comportamento atteso puo essere rivisto;
- una implementazione conforme oggi potrebbe non esserlo domani.

Se una specifica e Ratified:

- i test possono essere piu stabili;
- i risultati sono piu significativi;
- la compatibilita e piu difendibile.

## 11. Relazione con Estensioni

RISC-V cresce tramite estensioni.

Collegamenti utili:

- [[Estensioni G (IMAFD_Zicsr_Zifencei)]]
- [[Bitmanip (B): Zba, Zbb, Zbc, Zbs]]
- [[Vector (V): VLEN, ELEN, Register Grouping (LMUL)]]
- [[Estensibilita|Estensibilita: Custom Opcode space]]

Quando si valuta un'estensione, non basta leggere il nome. Bisogna controllare:

- stato della specifica;
- versione;
- dipendenze da altre estensioni;
- compatibilita con profili;
- supporto toolchain;
- supporto kernel o runtime;
- disponibilita di test.

## 12. Draft non Significa Inutile

Draft non e sinonimo di "da evitare sempre".

Una Draft e utile quando:

- vuoi contribuire alla specifica;
- stai facendo ricerca;
- devi valutare un'idea architetturale;
- vuoi anticipare una futura estensione;
- stai costruendo un prototipo controllato.

Il punto e non confondere sperimentazione con stabilita.

## 13. Frozen non Significa Ratified

Frozen e spesso lo stato piu frainteso.

Una specifica Frozen e abbastanza stabile da essere presa sul serio, ma non ha ancora completato l'intero processo di ratifica.

Differenza pratica:

- Frozen: "probabilmente non cambiera, salvo problemi importanti";
- Ratified: "e lo standard ufficiale".

In un progetto industriale, questa distinzione influisce su:

- risk assessment;
- contratti;
- roadmap hardware;
- validazione;
- documentazione;
- supporto clienti;
- compatibilita futura.

## 14. Checklist Decisionale

Prima di adottare una specifica RISC-V, chiedersi:

1. Qual e lo stato: Draft, Stable, Frozen o Ratified?
2. Quale versione esatta viene implementata?
3. Esistono test di compliance?
4. La toolchain supporta quella versione?
5. Il sistema operativo la riconosce?
6. Serve compatibilita ABI stabile?
7. L'estensione e richiesta da un profilo?
8. Cosa succede se la specifica cambia?
9. Esiste un piano di fallback?
10. La feature e pubblica o interna al prodotto?

## 15. Esempio di Valutazione

Scenario: un team vuole usare una nuova estensione per accelerare un algoritmo ML.

Se l'estensione e Draft:

- usarla in simulazione e prototipi e ragionevole;
- esporla come requisito pubblico e rischioso;
- bisogna aspettarsi modifiche;
- il supporto compiler potrebbe essere instabile.

Se l'estensione e Frozen:

- si puo iniziare una pianificazione piu concreta;
- resta necessario monitorare il processo di ratifica;
- conviene evitare impegni incompatibili prima della ratifica.

Se l'estensione e Ratified:

- e adatta a una roadmap piu stabile;
- la compliance diventa piu significativa;
- la toolchain puo convergere su un comportamento standard.

## 16. Mappa Mentale

```txt
Specifiche RISC-V
  -> Draft: sperimentazione, cambiamenti probabili
  -> Stable: struttura quasi definita
  -> Frozen: quasi definitiva, cambiamenti eccezionali
  -> Ratified: standard ufficiale
  -> Compliance: significativa solo rispetto a versioni precise
```

## 17. Best Practices

1. Controllare sempre stato e versione della specifica.
2. Non usare una Draft come promessa di compatibilita.
3. Trattare Frozen come molto stabile, ma non ancora definitivo.
4. Preferire Ratified per prodotti con supporto lungo.
5. Documentare nel datasheet quali estensioni e versioni sono supportate.
6. Separare feature sperimentali da feature ABI-stabili.
7. Allineare hardware, compiler, runtime e test di compliance.
8. Collegare ogni scelta tecnica al processo di governance.

## Riferimenti

- [Ratified Specifications - RISC-V International](https://riscv.org/specifications/ratified/)
- [Specs Under Development - RISC-V International](https://riscv.org/specifications/development/)
- [RISC-V Unprivileged ISA Preface](https://docs.riscv.org/reference/isa/v20240411/unpriv/colophon.html)
