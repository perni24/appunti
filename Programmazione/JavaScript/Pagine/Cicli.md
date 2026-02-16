---
date: 2026-02-16
tags:
  - javascript
  - programming
  - basics
type: permanent-note
status: budding
---

# Cicli (Loops) in JavaScript

I **cicli** (o loop) permettono di eseguire ripetutamente un blocco di codice finché una condizione specifica rimane vera. Sono essenziali per automatizzare operazioni ripetitive.

## 1. Ciclo `for`
È il ciclo più comune, ideale quando sai in anticipo quante volte devi iterare (es. scorrere un array con indice).

**Sintassi:** `for (inizializzazione; condizione; aggiornamento) { ... }`

```javascript
for (let i = 0; i < 5; i++) {
  console.log("Iterazione numero " + i);
}
```

## 2. Ciclo `while`
Esegue il blocco finché la condizione è vera. Ideale quando non sai a priori il numero di iterazioni.

> [!WARNING] Loop Infiniti
> Assicurati che la condizione diventi `false` prima o poi, altrimenti il programma si bloccherà in un loop infinito.

```javascript
let count = 0;

while (count < 3) {
  console.log(count);
  count++;
}
```

## 3. Ciclo `do...while`
Simile al `while`, ma **garantisce che il codice venga eseguito almeno una volta**, perché la condizione viene verificata alla fine.

```javascript
let numero = 10;

do {
  console.log("Eseguito anche se la condizione è falsa all'inizio!");
  numero++;
} while (numero < 5);
```

## Strumenti di Controllo
Per manipolare il flusso all'interno di un ciclo:

- **`break`**: Interrompe immediatamente il ciclo ed esce.
- **`continue`**: Salta l'iterazione corrente e passa direttamente alla successiva.

```javascript
for (let i = 0; i < 10; i++) {
  if (i === 5) break;    // Stop totale a 5
  if (i % 2 === 0) continue; // Salta i numeri pari
  console.log(i);
}
```

## Cenni su Iterazione Oggetti/Array
Esistono varianti moderne per iterare su strutture dati:
- `for...of`: Per iterare su valori di iterabili (Array, Stringhe).
- `for...in`: Per iterare sulle chiavi di un oggetto.