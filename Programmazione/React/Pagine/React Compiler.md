---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: advanced
tags: [react, compiler, performance]
aliases: [React Compiler]
prerequisites: []
related: []
---

# React Compiler

## Sintesi

React Compiler e uno strumento di build che ottimizza automaticamente componenti e hook applicando memoization quando il codice rispetta le regole di React. Riduce il bisogno di `useMemo`, `useCallback` e `React.memo` manuali in molte situazioni.

Non cambia il modello mentale di base: i componenti devono restare puri e prevedibili.

## Quando usarlo

Valutalo in progetti React moderni dove performance e render inutili sono un problema, oppure quando vuoi ridurre memoization manuale. Va adottato gradualmente in codebase esistenti.

## Come funziona

Il compiler analizza componenti e hook a build time. Se il codice e compatibile, genera output ottimizzato. Se rileva pattern non sicuri, puo saltare la compilazione di quella parte o segnalare problemi tramite lint/configurazione.

## API / Sintassi

Configurazione concettuale:

```js
export default {
  plugins: ["babel-plugin-react-compiler"],
};
```

Direttive:

```jsx
function Component() {
  "use memo";
  return <div />;
}
```

Le direttive servono per controllare compilazione in adozione graduale.

## Esempio pratico

Prima di introdurre il compiler:

1. aggiorna lint e regole hooks;
2. verifica componenti impuri;
3. abilita il compiler su una parte limitata;
4. confronta comportamento e performance;
5. espandi gradualmente.

## Varianti

- **Adozione globale**: progetto gia compatibile.
- **Adozione incrementale**: solo file o funzioni annotate.
- **Gating**: rollout controllato da feature flag.
- **Compilazione librerie**: per autori di package.
- **Lint compiler-aware**: segnala pattern incompatibili.

## Errori comuni

- Usarlo per correggere codice impuro.
- Rimuovere memoization manuale senza misurare.
- Ignorare regole hooks e purezza.
- Abilitarlo su tutta una codebase legacy senza rollout.
- Non testare comportamento prima/dopo.

## Checklist

- Il progetto rispetta Rules of React?
- Le regole lint sono aggiornate?
- Esiste una strategia di rollout?
- I componenti critici sono testati?
- Le performance sono misurate?
- La documentazione ufficiale e stata verificata per versione e setup?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[useMemo e useCallback]]
- [[Profiler e Debugging]]
- [[Linting e Formattazione]]
- [[Fiber Architecture e Concurrent Mode]]
- [React Compiler](https://react.dev/learn/react-compiler)
