---
date: 2026-02-24
tags: [javascript, programming, oop, encapsulation]
type: #permanent-note
status: budding
---

# Incapsulamento in JavaScript

L'**Incapsulamento** è uno dei pilastri della Programmazione ad Oggetti (OOP). Consiste nel nascondere lo stato interno di un oggetto (i suoi dati) e nel consentire l'interazione con esso solo attraverso dei metodi pubblici definiti. Questo protegge l'integrità dei dati e riduce la complessità del sistema.

## 1. Evoluzione della Protezione Dati

JavaScript è nato senza un supporto nativo per i membri privati, portando alla nascita di diverse tecniche nel tempo.

### Convenzione dell'Underscore (`_`)
Per anni, gli sviluppatori hanno usato il prefisso `_` (es. `this._saldo`) per segnalare che una proprietà doveva essere considerata privata. Tuttavia, questa è solo una **convenzione**: la proprietà rimane tecnicamente accessibile dall'esterno.

### Closures (Principio Modulo)
Prima delle classi, le [[Programmazione/JavaScript/Pagine/Closures|closures]] erano l'unico modo per avere variabili realmente private fissate nello scope di una funzione.

```javascript
function Conto(iniziale) {
    let saldo = iniziale; // Variabile privata
    
    this.getSaldo = function() {
        return saldo;
    };
}
```

### Campi Privati Nativi (`#`)
Introdotte in ES2022, le classi ora supportano i **campi privati** nativi usando il simbolo `#`. Questi sono inaccessibili dall'esterno dell'oggetto a livello di linguaggio.

```javascript
class ContoCorrente {
    #saldo = 0; // REALE protezione a livello runtime

    constructor(iniziale) {
        this.#saldo = iniziale;
    }

    get saldo() {
        return `€ ${this.#saldo}`;
    }

    deposita(importo) {
        if (importo > 0) this.#saldo += importo;
    }
}

const mioConto = new ContoCorrente(100);
console.log(mioConto.saldo); // "€ 100"
// console.log(mioConto.#saldo); // ERRORE di sintassi
```

## 2. Accesso Controllato (Getters & Setters)

L'incapsulamento non significa "nascondere tutto", ma "controllare l'accesso". Usando `get` e `set`, possiamo aggiungere logica di validazione prima di modificare un dato.

```javascript
class Utente {
    #eta;

    set eta(valore) {
        if (valore < 0) throw new Error("Età non valida");
        this.#eta = valore;
    }
}
```

## 3. Vantaggi dell'Incapsulamento

1.  **Protezione dell'Integrità**: Impedisce a codici esterni di impostare valori inconsistenti (es. saldo negativo).
2.  **Manutenibilità**: Puoi cambiare la struttura interna della classe (es. rinominare `#saldo` in `#bilancio`) senza rompere il codice esterno che usa i metodi pubblici.
3.  **Astrazione**: L'utente della classe deve sapere solo *cosa* fa l'oggetto, non *come* memorizza i dati internamente.

---
