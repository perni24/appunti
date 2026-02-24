---
date: 2026-02-24
tags: [javascript, architecture, design-patterns, oop]
type: #permanent-note
status: budding
---

# Design Patterns in JavaScript

I **Design Patterns** sono soluzioni collaudate a problemi comuni che si presentano durante la progettazione del software. Non sono frammenti di codice pronti all'uso, ma schemi logici per strutturare il codice in modo manutenibile e scalabile.

## 1. Pattern Creazionali
Si occupano dei meccanismi di creazione degli oggetti.

### Singleton
Garantisce che una classe abbia una sola istanza e fornisce un punto di accesso globale ad essa.
```javascript
const Database = (function() {
    let instance;
    function createInstance() {
        return new Object("Istanza DB");
    }
    return {
        getInstance: function() {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

const db1 = Database.getInstance();
const db2 = Database.getInstance();
console.log(db1 === db2); // true
```

### Factory
Definisce un'interfaccia per la creazione di oggetti, delegando alle sottoclassi o a una logica interna il tipo di oggetto da istanziare.
```javascript
class Auto { constructor() { this.tipo = "Auto"; } }
class Moto { constructor() { this.tipo = "Moto"; } }

class VeicoloFactory {
    static creaVeicolo(tipo) {
        if (tipo === "auto") return new Auto();
        if (tipo === "moto") return new Moto();
    }
}
```

## 2. Pattern Strutturali
Riguardano il modo in cui classi e oggetti sono composti per formare strutture più grandi.

### Module Pattern
Permette di emulare il concetto di "privato" e "pubblico" incapsulando la logica ed esponendo solo ciò che è necessario. (Oggi ampiamente sostituito dagli [ES Modules](file:///c:/Users/luca.bellini/Documents/luca/appunti/Programmazione/JavaScript/Pagine/Moduli.md)).

```javascript
const ModuloContatore = (function() {
    let _contatore = 0; // Privato
    return {
        incrementa: () => _contatore++,
        getValore: () => _contatore
    };
})();
```

## 3. Pattern Comportamentali
Gestiscono la comunicazione e l'assegnazione di responsabilità tra oggetti.

### Observer Pattern
Un oggetto (**Subject**) mantiene una lista di dipendenti (**Observers**) e li notifica automaticamente di qualsiasi cambiamento di stato. È la base della gestione degli eventi nel DOM.

```javascript
class Subject {
    constructor() { this.observers = []; }
    subscribe(fn) { this.observers.push(fn); }
    notify(data) { this.observers.forEach(fn => fn(data)); }
}

const newsSub = new Subject();
newsSub.subscribe(data => console.log("Notifica ricevuta: " + data));
newsSub.notify("Nuovo articolo disponibile!");
```

## Perché usarli?
1.  **Linguaggio Comune**: Facilitano la comunicazione tra sviluppatori.
2.  **Best Practices**: Seguono pattern consolidati che evitano errori architettonici.
3.  **Refactoring**: Rendono il codice più modulare e facile da modificare.

---