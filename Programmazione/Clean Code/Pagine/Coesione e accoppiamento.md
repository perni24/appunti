---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, design, coesione, accoppiamento]
aliases: [Coesione e accoppiamento, Cohesion and coupling]
prerequisites: [Moduli piccoli]
related: [Separazione delle responsabilita, Confini tra moduli, Dipendenze esplicite]
---

# Coesione e accoppiamento

## Sintesi

La **coesione** indica quanto gli elementi di un modulo stanno bene insieme. L'**accoppiamento** indica quanto un modulo dipende da altri moduli.

Nel Clean Code l'obiettivo e avere alta coesione e basso accoppiamento.

## Problema che risolve

Codice con bassa coesione contiene responsabilita non correlate. Codice con alto accoppiamento richiede modifiche a catena.

In entrambi i casi la codebase diventa difficile da cambiare in modo locale.

## Concetto chiave

Un modulo coeso contiene elementi che cambiano per la stessa ragione.

Un modulo poco accoppiato:

- conosce pochi dettagli degli altri moduli;
- dipende da interfacce stabili;
- non accede a stato interno altrui;
- puo essere testato con meno setup;
- puo cambiare senza rompere molte parti.

## Dettagli importanti

- Coesione e accoppiamento vanno valutati insieme.
- Un modulo piccolo ma molto accoppiato resta fragile.
- Un modulo grande ma molto coeso puo essere accettabile temporaneamente.
- Le dipendenze circolari sono un forte segnale di accoppiamento problematico.
- L'accoppiamento ai dettagli e piu fragile dell'accoppiamento alle astrazioni.

## Esempio

Bassa coesione:

```text
UserService:
- registra utente
- calcola sconto
- invia newsletter
- genera fattura
```

Alta coesione:

```text
UserRegistration
DiscountPolicy
NewsletterSender
InvoiceService
```

Ogni componente ha una ragione piu chiara per cambiare.

## Limiti

- Ridurre l'accoppiamento a zero non e realistico.
- Le astrazioni introdotte per disaccoppiare hanno un costo.
- Alcune dipendenze sono naturali nel dominio.
- Separare troppo presto puo produrre struttura inutile.

## Errori comuni

- Creare moduli generici con responsabilita casuali.
- Usare `shared` o `common` come scorciatoia.
- Far dipendere il dominio da dettagli infrastrutturali.
- Separare codice senza ridurre dipendenze reali.
- Ignorare dipendenze circolari perche "funzionano".

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Moduli piccoli]]
- [[Confini tra moduli]]
- [[Dipendenze esplicite]]
- [[Separazione delle responsabilita]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]

## Fonti

- Robert C. Martin, *Clean Architecture*
- David Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules*
