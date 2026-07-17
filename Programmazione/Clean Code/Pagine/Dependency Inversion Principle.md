---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, solid, dipendenze]
aliases: [Dependency Inversion Principle, DIP]
prerequisites: [SOLID]
related: [Dipendenze esplicite, Confini tra moduli, Coesione e accoppiamento]
---

# Dependency Inversion Principle

## Sintesi

Il **Dependency Inversion Principle** dice che il codice di alto livello non dovrebbe dipendere direttamente da dettagli di basso livello. Entrambi dovrebbero dipendere da astrazioni.

In pratica: la logica importante non dovrebbe essere legata direttamente a database, framework, API esterne o librerie specifiche.

## Problema che risolve

Quando il dominio dipende da dettagli infrastrutturali, cambiare database, provider email, sistema di pagamento o framework diventa costoso.

Anche i test diventano piu difficili, perche la logica richiede ambiente reale o mock complicati.

## Concetto chiave

La direzione delle dipendenze dovrebbe proteggere il codice piu stabile e importante.

Il codice di dominio o use case definisce cosa gli serve. L'infrastruttura implementa quei contratti.

```text
Use case -> interfaccia -> implementazione concreta
```

## Dettagli importanti

- DIP non significa usare sempre dependency injection container.
- Una astrazione deve rappresentare un bisogno reale del chiamante.
- Le interfacce dovrebbero stare vicino al codice che le usa quando proteggono il dominio.
- DIP funziona bene con test, adapter e boundary.
- Troppa inversione crea indirezione inutile.

## Esempio

Dipendenza diretta:

```ts
class RegisterUser {
  constructor(private emailClient: SmtpEmailClient) {}
}
```

Dipendenza da contratto:

```ts
interface EmailSender {
  sendWelcomeEmail(user: User): Promise<void>;
}

class RegisterUser {
  constructor(private emailSender: EmailSender) {}
}
```

Il caso d'uso non conosce SMTP, conosce solo il comportamento necessario.

## Limiti

- In codice piccolo una interfaccia puo essere prematura.
- Se esiste una sola implementazione stabile, l'astrazione potrebbe non servire.
- Le astrazioni sbagliate sono piu dannose delle dipendenze dirette.
- DIP non elimina la complessita, la sposta su confini piu controllati.

## Errori comuni

- Creare interfacce identiche alle classi concrete.
- Usare DIP per ogni dipendenza, anche banale.
- Mettere interfacce in cartelle generiche senza contesto.
- Far dipendere il dominio da tipi del framework.
- Confondere inversione delle dipendenze e inversione del controllo.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[SOLID]]
- [[Dipendenze esplicite]]
- [[Confini tra moduli]]
- [[Coesione e accoppiamento]]
- [[Separazione delle responsabilita]]

## Fonti

- Robert C. Martin, *Clean Architecture*
- Martin Fowler, *Inversion of Control Containers and the Dependency Injection pattern*
