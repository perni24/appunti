---
date: 2026-02-24
tags: [javascript, programming, oop, inheritance]
type: #permanent-note
status: budding
---

# Ereditarietà in JavaScript

L'**ereditarietà** permette a una classe di derivare proprietà e metodi da un'altra classe. In JavaScript, questo si realizza attraverso la keyword `extends`, che stabilisce una connessione tra la sottoclasse (classe figlia) e la superclasse (classe padre).

## 1. La keyword `extends`

Per creare una classe che eredita da un'altra, usiamo la sintassi `class Figlio extends Padre`.

```javascript
class Animale {
    constructor(nome) {
        this.nome = nome;
    }

    mangia() {
        console.log(`${this.nome} sta mangiando.`);
    }
}

class Cane extends Animale {
    abbaia() {
        console.log("Bau bau!");
    }
}

const fido = new Cane("Fido");
fido.mangia();  // Metodo ereditato: "Fido sta mangiando."
fido.abbaia();  // Metodo proprio: "Bau bau!"
```

## 2. La keyword `super`

La keyword `super` viene usata in due contesti principali all'interno della sottoclasse:

### Nel Costruttore
Se una sottoclasse definisce un proprio `constructor()`, deve chiamare obbligatoriamente `super()` prima di poter utilizzare `this`. Questo serve a inizializzare la classe padre.

```javascript
class Cane extends Animale {
    constructor(nome, razza) {
        super(nome); // Chiama il costruttore di Animale
        this.razza = razza;
    }
}
```

### Nei Metodi
Può essere usata per chiamare un metodo della superclasse, utile quando vogliamo estendere un comportamento invece di sostituirlo completamente.

```javascript
class Cane extends Animale {
    mangia() {
        super.mangia(); // Esegue la logica originale
        console.log("...e poi scodinzola.");
    }
}
```

## 3. Method Overriding (Sovrascrittura)

Una sottoclasse può ridefinire un metodo del padre fornendo una propria implementazione. Quando il metodo viene chiamato sull'istanza del figlio, verrà eseguita la versione più specifica.

```javascript
class Gatto extends Animale {
    mangia() {
        console.log(`${this.nome} mangia con eleganza.`);
    }
}
```

## 4. Gerarchia e Catena Prototipale

Sotto il cofano, l'ereditarietà delle classi usa ancora i [[Programmazione/JavaScript/Pagine/Prototypes|prototipi]].
- `Cane.prototype` eredita da `Animale.prototype`.
- JavaScript risale la catena dei prototipi finché non trova il metodo richiesto.

> [!IMPORTANT] Vincolo del `super()`
> Se non definisci un costruttore nella sottoclasse, JavaScript ne crea uno predefinito che chiama automaticamente `super(...args)`. Se lo definisci manualmente, la chiamata a `super()` deve avvenire **prima** di qualsiasi accesso a `this`, altrimenti verrà lanciato un errore di riferimento.

---
