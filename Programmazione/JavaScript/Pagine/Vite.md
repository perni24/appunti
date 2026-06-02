---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - javascript
  - tooling
  - frontend
aliases: []
prerequisites: []
related: []
---

# Vite

## Sintesi

**Vite** e un tool di sviluppo e build per applicazioni frontend moderne. Fornisce dev server rapido, Hot Module Replacement e build di produzione basata su bundling ottimizzato.

## Quando usarlo

Usa Vite per progetti frontend moderni dove vuoi avvio rapido del dev server, hot module replacement e build ottimizzata.

E adatto per:

- applicazioni vanilla JavaScript;
- React, Vue, Svelte e altri framework;
- librerie frontend;
- prototipi che devono crescere in progetti reali.

Evitalo solo se il progetto richiede una toolchain gia vincolata, per esempio un framework full-stack con proprio sistema di build.

## Come funziona

### Concetto chiave
In sviluppo Vite sfrutta moduli ES nativi del browser. In produzione crea bundle ottimizzati per deploy.

```powershell
npm create vite@latest
npm run dev
```
### Uso tipico
- App React, Vue, Svelte o vanilla.
- Librerie frontend.
- Prototipi.
- Tool interni.

## API / Sintassi

### Perche e rapido
- Serve i file come moduli ES.
- Trasforma solo cio che serve.
- Usa HMR per aggiornare moduli senza ricaricare tutto.
- Delega la build finale a strumenti ottimizzati.

## Esempio pratico

Struttura minimale:

```text
my-app/
  index.html
  package.json
  src/
    main.js
```

Script tipici:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Durante lo sviluppo Vite serve i moduli on demand. In produzione genera asset ottimizzati nella cartella di build.

## Varianti

- **Vanilla**: progetto senza framework.
- **React/Vue/Svelte**: template con plugin dedicati.
- **Library mode**: build per pubblicare una libreria.
- **SSR mode**: integrazione con rendering lato server.
- **Plugin Vite**: estensioni per trasformazioni, asset, framework e tool.

## Errori comuni

- Confondere dev server e build finale.
- Usare variabili ambiente senza prefisso previsto dal progetto.
- Dipendere da API Node nel codice destinato al browser.

## Checklist

- Definisci script `dev`, `build` e `preview`.
- Controlla alias e path se il progetto cresce.
- Usa variabili ambiente con il prefisso previsto da Vite.
- Verifica la build di produzione, non solo il dev server.
- Misura dimensione bundle e chunk generati.
- Evita dipendenze Node.js non compatibili con il browser.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]]
- [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain React]]
