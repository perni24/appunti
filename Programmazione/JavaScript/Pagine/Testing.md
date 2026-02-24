---
date: 2026-02-24
tags: [javascript, testing, quality, devops, tdd]
type: #permanent-note
status: budding
---

# Testing in JavaScript

Il testing è l'attività di verifica del software per garantire che soddisfi i requisiti e non introduca bug. In JavaScript, l'ecosistema del testing è molto maturo e offre strumenti per ogni livello di astrazione.

## 1. Perché Testare?

- **Fiducia**: Permette di fare refactoring senza paura di rompere funzionalità esistenti.
- **Documentazione**: I test spiegano come il codice dovrebbe comportarsi.
- **Risparmio di Tempo**: Bug trovati durante lo sviluppo costano meno di quelli trovati in produzione.

## 2. La Piramide dei Test

Un'ottima strategia di test segue solitamente questa gerarchia:

1.  **Unit Test (Base)**: Testano la più piccola unità di codice (una singola funzione o classe) in isolamento. Sono veloci e numerosi.
2.  **Integration Test (Centro)**: Verificano come diversi moduli o componenti lavorano insieme (es. una funzione che interroga un database mockato).
3.  **End-to-End Test - E2E (Cima)**: Testano l'intera applicazione dal punto di vista dell'utente, simulando azioni nel browser. Sono lenti ma danno la massima certezza.

## 3. TDD (Test Driven Development)

È una metodologia in cui si scrivono i test **prima** del codice funzionale. Segue il ciclo **Red-Green-Refactor**:
1.  **Red**: Scrivi un test che fallisce.
2.  **Green**: Scrivi il codice minimo necessario per far passare il test.
3.  **Refactor**: Ottimizza il codice mantenendo il test verde.

## 4. Ecosistema Tooling

- **Unit/Integration**:
    - **Jest**: Il framework più popolare (creato da Facebook), "tutto incluso".
    - **Vitest**: Estremamente veloce, ideale per progetti basati su Vite.
    - **Mocha + Chai**: Approccio modulare e flessibile.
- **E2E / Browser**:
    - **Cypress**: Ottima DX, gira internamente al browser.
    - **Playwright**: Moderno, supporta tutti i browser e test in parallelo.

## 5. Esempio di Unit Test (Jest/Vitest)

```javascript
// somma.js
export function somma(a, b) {
    return a + b;
}

// somma.test.js
import { somma } from './somma';

describe('Funzione Somma', () => {
    test('aggiunge correttamente 2 + 3 ottenendo 5', () => {
        expect(somma(2, 3)).toBe(5);
    });

    test('funziona con numeri negativi', () => {
        expect(somma(-1, 1)).toBe(0);
    });
});
```

> [!TIP] Mocking
> Nel testing è cruciale il "Mocking": sostituire dipendenze esterne (come chiamate API o database) con versioni controllate per testare il codice in modo isolato e deterministico.

---
