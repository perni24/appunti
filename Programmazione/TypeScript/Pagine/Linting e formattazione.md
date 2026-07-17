---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, eslint, prettier, linting, formatting]
aliases: [Linting TypeScript, Formattazione TypeScript]
prerequisites: [tsconfig]
related: [Best Practices, Strict mode]
---

# Linting e formattazione

## Sintesi

Linting e formattazione mantengono il codice TypeScript coerente, leggibile e meno soggetto a errori. Il type checker trova problemi di tipo, mentre il linter trova pattern rischiosi, codice morto, promesse non gestite e convenzioni violate.

La formattazione dovrebbe essere automatica e non oggetto di discussione manuale.

## Quando usarlo

- In tutti i progetti TypeScript condivisi.
- Prima di commit e pull request.
- In CI.
- In monorepo con piu package.
- In librerie pubbliche o team multi-persona.

## Come funziona

ESLint analizza il codice con parser TypeScript e regole configurabili. Prettier o formatter equivalenti si occupano della formattazione.

Alcune regole TypeScript-aware richiedono accesso al `tsconfig` e quindi sono piu lente ma piu precise.

## API / Sintassi

```bash
eslint .
prettier --check .
tsc --noEmit
```

## Esempio pratico

```ts
async function save(): Promise<void> {
  await Promise.resolve();
}

void save();
```

Regole come `no-floating-promises` possono richiedere di gestire esplicitamente le promesse.

## Varianti

- **ESLint base**: regole sintattiche e stilistiche.
- **Type-aware linting**: regole che leggono i tipi.
- **Prettier**: formattazione automatica.
- **Editor integration**: feedback immediato.
- **CI lint**: impedisce regressioni.

## Errori comuni

- **Usare lint come sostituto del type checking**: servono entrambi.
- **Abilitare troppe regole subito**: produce rumore.
- **Mescolare regole formatter e linter**: meglio separare responsabilita.
- **Non allineare editor e CI**: "funziona sulla mia macchina".

## Checklist

- Eseguire lint, format check e `tsc --noEmit`.
- Automatizzare formattazione.
- Abilitare regole type-aware solo dove hanno valore.
- Tenere configurazione condivisa nel monorepo.
- Evitare regole stilistiche ridondanti col formatter.

## Collegamenti

- [[Best Practices]]
- [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]]
- [[Testing in TypeScript]]
