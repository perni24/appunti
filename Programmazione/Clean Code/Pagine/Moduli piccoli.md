---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, moduli, manutenibilita]
aliases: [Moduli piccoli, Small modules]
prerequisites: [Clean Code]
related: [Organizzazione dei file, Confini tra moduli, Dipendenze esplicite]
---

# Moduli piccoli

## Sintesi

I **moduli piccoli** raggruppano codice intorno a una responsabilita chiara e limitata. Un modulo piccolo e piu facile da capire, testare, sostituire e riusare.

La dimensione non e solo numero di righe: e quante ragioni ha il modulo per cambiare.

## Problema che risolve

I moduli grandi diventano punti di attrazione per codice non correlato. Nel tempo accumulano funzioni, tipi, costanti, adapter, validazioni e casi speciali.

Questo rende rischioso cambiare anche una parte piccola.

## Concetto chiave

Un modulo piccolo dovrebbe avere:

- un nome chiaro;
- un confine comprensibile;
- poche dipendenze;
- API pubblica ridotta;
- responsabilita coesa;
- test associabili.

Il lettore dovrebbe poter descrivere il modulo in una frase.

## Dettagli importanti

- Un modulo piccolo non deve esporre tutti i suoi dettagli interni.
- La coesione e piu importante della dimensione assoluta.
- Moduli piccoli aiutano a limitare l'impatto dei cambiamenti.
- La API pubblica dovrebbe essere piu stabile dell'implementazione.
- Un modulo condiviso da molti altri deve essere trattato con piu cura.

## Esempio

Modulo troppo ampio:

```text
order-utils.ts
- valida ordine
- calcola totale
- invia email
- salva su database
- formatta report
```

Moduli piu piccoli:

```text
order-validation.ts
order-pricing.ts
order-notifications.ts
order-repository.ts
order-report.ts
```

Ogni file ha un motivo piu chiaro per cambiare.

## Limiti

- Troppi moduli piccoli possono rendere il progetto frammentato.
- Se i nomi sono deboli, la separazione non aiuta.
- Alcuni moduli orchestratori devono conoscere piu collaboratori.
- La granularita giusta dipende dal dominio e dal team.

## Errori comuni

- Separare codice solo per ridurre righe.
- Esporre troppi dettagli interni.
- Creare moduli piccoli ma molto accoppiati.
- Usare moduli `common` senza regole.
- Spostare codice senza ridurre dipendenze.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Organizzazione dei file]]
- [[Confini tra moduli]]
- [[Dipendenze esplicite]]
- [[Funzioni con responsabilita singola]]

## Fonti

- Robert C. Martin, *Clean Code*
- David Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules*
