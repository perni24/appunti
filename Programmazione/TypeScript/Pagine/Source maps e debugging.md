---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, sourcemap, debugging, build]
aliases: [Source maps, Debugging TypeScript]
prerequisites: [tsconfig]
related: [TypeScript con Node.js, Testing in TypeScript]
---

# Source maps e debugging

## Sintesi

Le source map collegano il JavaScript generato al sorgente TypeScript originale. Servono per fare debug, leggere stack trace e impostare breakpoint nei file `.ts` invece che nel codice compilato.

Sono importanti in sviluppo, test e produzione, ma vanno gestite con attenzione per non esporre sorgenti o dettagli sensibili.

## Quando usarlo

- Debug in browser.
- Debug Node.js con file TypeScript compilati.
- Stack trace leggibili in sviluppo.
- Test runner che eseguono codice trasformato.
- Analisi errori in produzione con strumenti di monitoring.

## Come funziona

Con `sourceMap: true`, TypeScript genera file `.map` che descrivono la relazione tra output JavaScript e sorgente TypeScript.

Il debugger o browser usa queste mappe per mostrare il file originale anche se il codice eseguito e JavaScript.

## API / Sintassi

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "outDir": "dist"
  }
}
```

## Esempio pratico

```ts
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Divisione per zero");
  }

  return a / b;
}

divide(10, 0);
```

Con source map abilitate, lo stack trace puo puntare alla riga TypeScript originale invece che al file JavaScript compilato.

## Varianti

- **`sourceMap`**: genera file `.map` separati.
- **`inlineSourceMap`**: include la mappa nel file generato.
- **`inlineSources`**: include sorgenti nella source map.
- **Bundler source maps**: Vite, Webpack, Rollup o esbuild hanno opzioni proprie.
- **Production source maps**: utili per monitoring, ma da proteggere.

## Errori comuni

- **Abilitare source map in produzione pubblica senza controllo**: puo esporre codice sorgente.
- **Configurare TypeScript ma non il bundler**: la mappa finale puo essere sbagliata.
- **Debuggare output vecchio**: se la build non e aggiornata, breakpoint e linee non combaciano.
- **Ignorare stack trace minificati**: in produzione serve upload delle source map al servizio di error tracking.

## Checklist

- Abilitare source map in sviluppo.
- Coordinare TypeScript, bundler e test runner.
- Proteggere o non pubblicare source map sensibili in produzione.
- Verificare che breakpoint e stack trace puntino ai file `.ts`.
- Usare configurazioni diverse per sviluppo e produzione.

## Collegamenti

- [[tsconfig]]
- [[TypeScript con Node.js]]
- [[Testing in TypeScript]]
