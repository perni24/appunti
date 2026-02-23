---
date: 2026-02-19
tags: [javascript, programming, oop]
type: #permanent-note
status: budding
---

# Prototypes in JavaScript

JavaScript è un linguaggio basato sui **prototipi**. A differenza dei linguaggi basati sulle classi (come Java o C++), JavaScript usa l'ereditarietà prototipale: ogni oggetto ha un link interno a un altro oggetto chiamato **Prototipo**.

## 1. Il concetto di Prototipo

Un prototipo è essenzialmente un "modello" da cui un oggetto eredita metodi e proprietà.

- Ogni funzione in JavaScript ha una proprietà chiamata `prototype`.
- Ogni oggetto (istanza) ha una proprietà interna (accessibile via `__proto__`) che punta al `prototype` della funzione che l'ha creato.

## 2. prototype vs `__proto__`

È facile confonderli, ma hanno scopi diversi:
- **`prototype`**: È una proprietà presente solo nelle **funzioni**. Definisce cosa verrà ereditato dagli oggetti creati con quella funzione.
- **`__proto__`**: È una proprietà presente in tutti gli **oggetti**. Punta al prototipo da cui l'oggetto sta attualmente ereditando.

```javascript
function Persona(nome) {
    this.nome = nome;
}

// Aggiungiamo un metodo al PROTOTIPO della funzione
Persona.prototype.saluta = function() {
    console.log(`Ciao, sono ${this.nome}`);
};

const luca = new Persona("Luca");

console.log(luca.__proto__ === Persona.prototype); // true
luca.saluta(); // Funziona tramite ereditarietà!
```

## 3. Prototype Chain (Catena dei Prototipi)

Quando cerchi di accedere a una proprietà di un oggetto:
1. JavaScript la cerca nell'oggetto stesso.
2. Se non la trova, la cerca nel suo `__proto__` (il prototipo).
3. Se non la trova nemmeno lì, sale al prototipo del prototipo.
4. La catena finisce quando si arriva a `Object.prototype` (il cui prototipo è `null`).

## 4. Perché usare i Prototipi?

> [!TIP] Ottimizzazione della Memoria
> Invece di definire un metodo all'interno del costruttore (che verrebbe duplicato per ogni singola istanza), definirlo sul prototipo significa che esiste **una sola copia** in memoria condivisa da tutte le istanze.

> [!NOTE] Classi ES6
> Le classi introdotte in ES6 sono "zucchero sintattico". Sotto il cofano, JavaScript continua a usare esattamente questo sistema di prototipi.

---