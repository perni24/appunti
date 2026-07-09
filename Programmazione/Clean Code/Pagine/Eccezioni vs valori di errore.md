---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, errori, eccezioni]
aliases: [Eccezioni vs valori di errore, Exceptions vs error values]
prerequisites: [Gestione esplicita degli errori]
related: [Errori recuperabili e non recuperabili, Contratti impliciti ed espliciti, Codice testabile]
---

# Eccezioni vs valori di errore

## Sintesi

**Eccezioni** e **valori di errore** sono due modi diversi per rappresentare un fallimento.

La scelta non dovrebbe essere estetica: dipende da quanto il fallimento e previsto, recuperabile e parte del contratto del chiamante.

## Quando usarlo

- Usa valori di errore quando il fallimento e normale e il chiamante deve decidere.
- Usa eccezioni quando il flusso non puo continuare in modo sensato.
- Usa una convenzione unica per modulo o progetto.
- Usa errori tipizzati quando il chiamante deve distinguere cause diverse.

## Come funziona

Le eccezioni interrompono il flusso normale e risalgono lo stack finche qualcuno le gestisce.

I valori di errore restano nel flusso ordinario: il chiamante deve controllarli e decidere cosa fare.

## API / Sintassi

```js
// Eccezione
const user = loadUserOrThrow(userId);

// Valore di errore
const result = loadUser(userId);
if (!result.ok) {
  return handleMissingUser(result.error);
}
```

Entrambe le forme possono essere pulite se il contratto e chiaro.

## Esempio pratico

```js
function findUser(users, userId) {
  const user = users.find((item) => item.id === userId);

  if (!user) {
    return { ok: false, error: "user_not_found" };
  }

  return { ok: true, value: user };
}
```

La mancata presenza dell'utente e un caso previsto, quindi un valore di errore puo essere piu leggibile.

## Varianti

- `throw`: interrompe il flusso e richiede gestione a un livello superiore.
- `Result`: rende obbligatorio controllare successo o errore.
- `null` / `undefined`: semplice, ma spesso troppo ambiguo.
- Codici errore: utili per API, ma vanno documentati.

## Errori comuni

- Usare eccezioni per normale controllo di flusso.
- Restituire `null` senza spiegare il motivo.
- Ignorare valori di errore.
- Catturare eccezioni troppo genericamente.
- Mescolare stili diversi nella stessa API.

## Checklist

- Il fallimento e previsto?
- Il chiamante puo recuperare?
- Serve distinguere piu cause?
- Il contratto e visibile dal nome, dal tipo o dalla documentazione?
- I test coprono entrambe le forme di uscita?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Gestione esplicita degli errori]]
- [[Errori recuperabili e non recuperabili]]
- [[Contratti impliciti ed espliciti]]
- [[Codice testabile]]

## Fonti

- Robert C. Martin, *Clean Code*
- Scott Wlaschin, *Domain Modeling Made Functional*
- Martin Fowler, *Refactoring*
