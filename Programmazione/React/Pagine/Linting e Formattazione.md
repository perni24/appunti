---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Linting e Formattazione]
prerequisites: []
related: []
---
# Linting e Formattazione

## Sintesi

Nota su Linting e Formattazione in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

**Linting** e **formattazione** sono due pratiche fondamentali per mantenere un codice React leggibile, coerente e meno soggetto a errori.

Nel frontend moderno, gli strumenti piu comuni sono:
- **ESLint** per analizzare il codice e segnalare problemi;
- **Prettier** per formattare automaticamente lo stile del codice.

> [!INFO] Punto chiave
> ESLint e Prettier risolvono problemi diversi. ESLint riguarda qualita e correttezza del codice; Prettier riguarda formattazione e stile visivo.

---

## 1. Linting

Il **linting** analizza il codice alla ricerca di:
- errori potenziali;
- pattern rischiosi;
- variabili inutilizzate;
- import non usati;
- violazioni di regole del progetto;
- uso scorretto di hook o JSX.

In React, il linting e particolarmente utile per intercettare errori che non sempre emergono immediatamente durante lo sviluppo.

Esempio di problema:

```javascript
function Component({ user }) {
  useEffect(() => {
    console.log(user.name);
  }, []);
}
```

Qui un linter puo segnalare che `user` manca nelle dipendenze dell'effetto.

Questo si collega direttamente a [[Programmazione/React/Pagine/useEffect]].

---

## 2. ESLint

**ESLint** e lo strumento standard per il linting in progetti JavaScript e React.

Permette di:
- definire regole;
- usare preset condivisi;
- integrare plugin;
- fallire la build o la CI se ci sono errori;
- correggere automaticamente alcune violazioni.

Esempio di comando:

```bash
npm run lint
```

oppure:

```bash
npx eslint src
```

La configurazione esatta dipende dalla toolchain usata, come Vite, Next.js o setup personalizzati.

---

## 3. Regole specifiche per React

In React sono importanti plugin e regole dedicate.

Esempi:
- regole per JSX;
- regole per React Hooks;
- regole per import;
- regole per accessibilita.

Le regole sugli hook sono particolarmente importanti:
- gli hook devono essere chiamati sempre nello stesso ordine;
- non vanno chiamati dentro condizioni o cicli;
- le dipendenze di `useEffect`, `useMemo` e `useCallback` vanno gestite con attenzione.

Queste regole aiutano a prevenire bug sottili legati al modello di rendering React.

---

## 4. Formattazione

La **formattazione** riguarda l'aspetto del codice:
- indentazione;
- lunghezza delle righe;
- virgolette;
- trailing comma;
- spaziature;
- a capo.

Senza formatter automatico, il team spreca tempo in discussioni poco produttive e diff rumorosi.

Con un formatter, lo stile diventa una decisione automatica e ripetibile.

---

## 5. Prettier

**Prettier** e il formatter piu usato nell'ecosistema JavaScript.

Il suo obiettivo e ridurre al minimo le decisioni manuali sullo stile.

Esempio di comando:

```bash
npx prettier --write .
```

oppure in uno script:

```json
{
  "scripts": {
    "format": "prettier --write ."
  }
}
```

Prettier non prova a capire se il codice e logicamente corretto. Si occupa solo di renderlo coerente nel formato.

---

## 6. ESLint vs Prettier

| Aspetto | ESLint | Prettier |
| :--- | :--- | :--- |
| **Scopo** | Qualita e regole del codice | Formattazione |
| **Trova bug potenziali** | Si | No |
| **Gestisce stile visuale** | Solo in parte | Si |
| **Correzione automatica** | Alcune regole | Quasi tutto il formato |
| **Ruolo ideale** | Regole semantiche | Stile automatico |

La configurazione migliore evita conflitti:
- Prettier gestisce lo stile;
- ESLint gestisce correttezza, pattern e regole di progetto.

---

## 7. Integrazione con editor

Una buona configurazione deve funzionare direttamente nell'editor.

Obiettivi:
- errori ESLint visibili mentre scrivi;
- formattazione automatica al salvataggio;
- import sistemati in modo coerente;
- feedback rapido prima della CI.

Questo riduce il costo cognitivo:
- meno errori scoperti tardi;
- meno diff rumorosi;
- meno revisione su dettagli di stile.

---

## 8. Integrazione con CI

Linting e formatting devono essere verificabili anche fuori dal computer dello sviluppatore.

Esempi di script:

```json
{
  "scripts": {
    "lint": "eslint src",
    "format:check": "prettier --check ."
  }
}
```

In CI, questi comandi possono bloccare merge con:
- errori ESLint;
- formattazione non coerente;
- regole di qualita violate.

Questo rende la qualita del codice una regola del progetto, non una preferenza individuale.

---

## 9. Linting e accessibilita

Nel frontend React, il linting puo aiutare anche sull'accessibilita.

Plugin dedicati possono segnalare:
- immagini senza testo alternativo;
- elementi interattivi non accessibili;
- uso scorretto di attributi ARIA;
- label mancanti nei form;
- click handler su elementi non interattivi.

Questo si collega a:
- [[Programmazione/React/Pagine/WAI-ARIA]];
- [[Programmazione/React/Pagine/Focus Management]];
- [[Programmazione/React/Pagine/Test di accessibilita]].

Il linter non sostituisce i test manuali, ma intercetta molte regressioni comuni.

---

## 10. Linting e TypeScript

Se il progetto usa TypeScript, ESLint puo integrarsi con regole specifiche per tipi.

Esempi:
- evitare `any` non necessario;
- controllare promise non gestite;
- applicare convenzioni sui tipi;
- migliorare sicurezza degli import.

TypeScript e ESLint non sono la stessa cosa:
- TypeScript controlla tipi e compilazione;
- ESLint controlla regole di codice e pattern.

In un progetto maturo lavorano insieme.

---

## 11. Errori comuni

Errori frequenti:
- usare ESLint per regole di puro formatting che Prettier gestirebbe meglio;
- non integrare formatter nell'editor;
- ignorare warning fino a renderli rumore di fondo;
- disabilitare regole senza capirne il motivo;
- avere configurazioni diverse tra editor e CI;
- non usare regole specifiche per React Hooks.

La configurazione deve aiutare il team, non diventare un ostacolo.

---

## 12. Relazione con testing e qualita

Linting e formattazione non sostituiscono i test.

Servono a coprire un livello diverso:
- Prettier mantiene il codice uniforme;
- ESLint intercetta pattern rischiosi;
- [[Programmazione/React/Pagine/Testing Jest]] verifica comportamento di componenti e logica;
- [[Programmazione/React/Pagine/Testing Cypress e Playwright]] verifica flussi end-to-end.

Insieme creano una rete di qualita piu robusta.

---

## 13. Best Practices

1. **Lascia a Prettier la formattazione:** evita discussioni manuali su stile e spaziatura.
2. **Usa ESLint per regole semantiche e di qualita:** bug potenziali, hook, import e pattern di progetto.
3. **Integra tutto nell'editor:** feedback immediato e format on save riducono attrito.
4. **Verifica lint e format in CI:** la qualita deve essere ripetibile e non dipendere dal singolo ambiente.
5. **Non disabilitare regole senza motivo esplicito:** ogni eccezione dovrebbe essere locale e giustificata.
6. **Aggiungi regole React, Hooks e accessibilita:** sono quelle che portano piu valore nei progetti frontend.

---
