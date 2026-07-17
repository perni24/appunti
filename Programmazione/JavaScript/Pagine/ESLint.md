---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - javascript
  - tooling
  - linting
aliases: []
prerequisites: []
related: []
---

# ESLint

## Sintesi

**ESLint** e uno strumento di linting per JavaScript. Analizza il codice staticamente e segnala errori, pattern rischiosi, violazioni di stile e problemi di qualita.

## Quando usarlo

Usa ESLint in ogni progetto JavaScript non banale per intercettare errori prima dell'esecuzione e mantenere regole comuni tra sviluppatori.

E particolarmente utile quando:

- il progetto ha molti file o piu persone;
- usi moduli, async code, framework o TypeScript;
- vuoi bloccare pattern rischiosi in CI;
- vuoi distinguere regole di correttezza da semplice formattazione.

Per piccoli script personali puo bastare una configurazione minima.

## Come funziona

### Concetto chiave
ESLint non esegue il codice: lo legge come AST e applica regole configurabili.

```powershell
npx eslint .
```
### Cosa controlla
- Variabili non usate.
- Import errati.
- Uso sospetto di `==`.
- Errori con Promise o async.
- Regole di progetto.
### Rapporto con Prettier
ESLint dovrebbe occuparsi soprattutto di qualita e correttezza. [[Programmazione/JavaScript/Pagine/Prettier|Prettier]] dovrebbe occuparsi della formattazione.

## API / Sintassi

### Configurazione
Nei progetti moderni ESLint usa spesso una configurazione `eslint.config.js`.

```javascript
export default [
  {
    rules: {
      "no-unused-vars": "warn",
      "eqeqeq": "error"
    }
  }
];
```

## Esempio pratico

Esempio di problema rilevabile:

```javascript
function calculateTotal(items) {
  let total = 0;

  items.map((item) => {
    total += item.price;
  });

  return total;
}
```

Qui `map` viene usato per effetti collaterali, non per produrre un nuovo array. Una regola o una revisione puo suggerire `for...of` o `reduce`.

```javascript
function calculateTotal(items) {
  return items.reduce((total, item) => total + item.price, 0);
}
```

## Varianti

- **Regole base**: intercettano errori comuni del linguaggio.
- **Plugin framework**: regole specifiche per React, Vue, Node.js o testing.
- **Regole TypeScript**: analisi piu ricca quando il progetto usa TypeScript.
- **Configurazione shareable**: preset condivisi tra progetti.
- **Lint in editor**: feedback immediato durante la scrittura.
- **Lint in CI**: blocca modifiche che violano regole del progetto.

## Errori comuni

- Usare ESLint per formattare tutto invece di delegare la formattazione a Prettier.
- Disattivare regole con commenti senza spiegare il motivo.
- Avere regole diverse tra editor e CI.
- Non aggiornare la configurazione quando cambiano runtime, framework o versione ECMAScript.
- Attivare troppe regole stilistiche rendendo il lint rumoroso.

## Checklist

- Definisci una configurazione condivisa nel repository.
- Separa regole di qualita da formattazione automatica.
- Esegui ESLint in CI.
- Integra ESLint nell'editor.
- Usa override per test, script Node.js o file generati.
- Tratta i disable comment come eccezioni motivate.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
- [[Programmazione/JavaScript/Pagine/Prettier|Prettier]]
- [[Programmazione/JavaScript/Pagine/Supply chain security npm|Supply chain security npm]]
