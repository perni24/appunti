---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, moduli, architettura]
aliases: [Confini tra moduli, Boundary tra moduli]
prerequisites: [Moduli piccoli]
related: [Dipendenze esplicite, Organizzazione dei file, Struttura delle cartelle]
---

# Confini tra moduli

## Sintesi

I **confini tra moduli** definiscono cosa un modulo espone, cosa nasconde e da quali altri moduli puo dipendere.

Un buon confine riduce accoppiamento e rende possibile cambiare l'implementazione senza cambiare tutto il sistema.

## Problema che risolve

Senza confini, ogni parte del progetto puo conoscere dettagli interni di ogni altra parte. Questo crea dipendenze fragili: una modifica locale produce effetti globali.

Il risultato e codice difficile da refactorare e testare.

## Concetto chiave

Un confine di modulo e fatto da:

- API pubblica;
- dettagli privati;
- dipendenze consentite;
- dati che possono attraversare il confine;
- errori che possono uscire;
- responsabilita dichiarata.

Il modulo dovrebbe esporre il minimo necessario.

## Dettagli importanti

- I dettagli interni non dovrebbero essere importati da altri moduli.
- I confini non sono solo cartelle: sono regole di dipendenza.
- Un modulo puo avere un file `index` o facciata pubblica.
- I DTO possono essere utili per attraversare confini.
- I test possono rivelare se un confine e troppo fragile.

## Esempio

Confine debole:

```text
orders/
  internal-pricing.ts
  internal-discount.ts
  order-service.ts

users/
  user-service.ts importa orders/internal-discount.ts
```

Confine piu chiaro:

```text
orders/
  index.ts
  pricing.ts
  order-service.ts

users/
  user-service.ts importa orders/index.ts
```

Il modulo `users` usa solo cio che `orders` decide di esporre.

## Limiti

- Confini troppo rigidi possono rallentare modifiche semplici.
- In progetti piccoli alcune separazioni sono premature.
- I confini vanno aggiornati quando cambia il dominio.
- Un confine non sostituisce test e naming chiaro.

## Errori comuni

- Usare cartelle come confini ma importare dettagli interni ovunque.
- Esporre tutto per comodita.
- Creare dipendenze circolari tra moduli.
- Lasciare tipi interni diventare parte della API pubblica.
- Non documentare regole di dipendenza importanti.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Moduli piccoli]]
- [[Dipendenze esplicite]]
- [[Organizzazione dei file]]
- [[Struttura delle cartelle]]

## Fonti

- David Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules*
- Robert C. Martin, *Clean Architecture*
