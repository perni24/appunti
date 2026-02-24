---
date: 2026-02-24
tags: [javascript, programming, regex, strings]
type: #permanent-note
status: budding
---

# Regular Expressions (RegEx) in JavaScript

Le **espressioni regolari** sono pattern utilizzati per trovare corrispondenze di combinazioni di caratteri nelle stringhe. In JavaScript, le RegEx sono oggetti.

## 1. Creazione

Esistono due modi per creare un oggetto `RegExp`:

1.  **Sintassi Letterale**: Il pattern è racchiuso tra slash. Viene compilata al caricamento dello script.
    ```javascript
    const regex = /ab+c/i;
    ```
2.  **Costruttore**: Utile quando il pattern è dinamico (es. derivato da un input utente).
    ```javascript
    const regex = new RegExp('ab+c', 'i');
    ```

## 2. Flags Comuni

I flags modificano il comportamento della ricerca:
- `g`: **Global search** (non si ferma alla prima corrispondenza).
- `i`: **Case-insensitive** search.
- `m`: **Multiline** search.
- `u`: **Unicode** (gestisce correttamente i caratteri speciali).

## 3. Sintassi dei Pattern

### Classi di Caratteri
- `\d`: Qualsiasi cifra (0-9).
- `\w`: Qualsiasi carattere alfanumerico (incluso underscore).
- `\s`: Qualsiasi spazio bianco (spazi, tab, invio).
- `.`: Qualsiasi carattere tranne l'andata a capo.
- `[abc]`: Qualsiasi carattere contenuto nelle parentesi.
- `[^abc]`: Qualsiasi carattere **NON** contenuto nelle parentesi.

### Quantificatori
- `*`: 0 o più volte.
- `+`: 1 o più volte.
- `?`: 0 o 1 volta.
- `{n}`: Esattamente n volte.
- `{n,m}`: Da n a m volte.

### Ancore
- `^`: Inizio della stringa.
- `$`: Fine della stringa.
- `\b`: Confine di parola.

## 4. Metodi Principali

### Metodi di RegExp
- **`test()`**: Restituisce `true` o `false` se trova la corrispondenza.
- **`exec()`**: Restituisce un array con i dettagli della corrispondenza (o `null`).

### Metodi di Stringa
- **`match()`**: Restituisce le corrispondenze trovate.
- **`replace()`**: Sostituisce la parte trovata con un'altra stringa.
- **`search()`**: Restituisce l'indice della prima corrispondenza.
- **`split()`**: Divide la stringa usando la regex come separatore.

```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
console.log(emailRegex.test("test@example.com")); // true

const testo = "Oggi è il 24/02/2026";
const date = testo.match(/\d{2}\/\d{2}\/\d{4}/g);
console.log(date); // ["24/02/2026"]
```

> [!TIP] Strumenti Esterni
> Per testare regex complesse, è consigliato usare strumenti visuali come **Regex101**, che spiegano passo dopo passo ogni parte del pattern.

---
