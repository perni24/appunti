---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, modellazione, stati]
aliases: [Modellare stati impossibili, Make illegal states unrepresentable]
prerequisites: [Invarianti del dominio]
related: [Value objects, Primitive obsession, Codice esplicito vs codice implicito]
---

# Modellare stati impossibili

## Sintesi

**Modellare stati impossibili** significa progettare tipi e strutture in modo che certe combinazioni non valide non possano essere rappresentate, o siano molto difficili da creare.

E un modo potente per spostare errori dal runtime al design del codice.

## Problema che risolve

Molti bug derivano da stati che non dovrebbero esistere:

- ordine con stato `paid` ma senza pagamento;
- utente attivo ma senza email verificata;
- richiesta con `success: true` e `error` valorizzato;
- prezzo negativo;
- oggetto con campi incompatibili.

Se il modello permette questi stati, tutto il codice successivo deve difendersi.

## Concetto chiave

Il modello dovrebbe rappresentare solo stati validi.

Strategie comuni:

- usare tipi dedicati;
- separare stati con union o enum;
- evitare campi opzionali non correlati;
- creare costruttori validanti;
- usare transizioni esplicite;
- eliminare booleani ambigui.

## Dettagli importanti

- Non sempre lo stato invalido puo essere eliminato completamente.
- Gli input esterni vanno comunque validati.
- La modellazione deve seguire il dominio, non solo il tipo tecnico.
- Rendere impossibile uno stato riduce controlli difensivi.
- Il codice diventa piu chiaro perche esprime i casi reali.

## Esempio

Modello ambiguo:

```ts
type ApiResult = {
  success: boolean;
  data?: User;
  error?: string;
};
```

Modello piu sicuro:

```ts
type ApiResult =
  | { status: "success"; data: User }
  | { status: "error"; error: string };
```

Nel secondo caso non puo esistere una risposta con `success` e `error` insieme.

## Limiti

- Alcuni linguaggi supportano meglio questa tecnica di altri.
- Troppi tipi possono rendere il codice difficile da navigare.
- Stati intermedi di form o wizard possono essere legittimamente incompleti.
- Serve evitare modelli troppo rigidi per domini ancora instabili.

## Errori comuni

- Usare molti booleani per rappresentare stati esclusivi.
- Rendere tutto opzionale per comodita.
- Non distinguere dati grezzi e dati validati.
- Validare in ritardo quando il dato ha gia attraversato il sistema.
- Creare enum senza controllare transizioni valide.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Invarianti del dominio]]
- [[Value objects]]
- [[Primitive obsession]]
- [[Codice esplicito vs codice implicito]]

## Fonti

- Yaron Minsky, *Effective ML*
- Scott Wlaschin, *Domain Modeling Made Functional*
