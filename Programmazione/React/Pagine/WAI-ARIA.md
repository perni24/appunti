---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [WAI-ARIA]
prerequisites: []
related: []
---
# WAI-ARIA

## Sintesi

Nota su WAI-ARIA in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

La **WAI-ARIA** (*Web Accessibility Initiative - Accessible Rich Internet Applications*) e una specifica che aggiunge informazioni di accessibilita agli elementi dell'interfaccia quando l'HTML semantico da solo non basta.

In React e rilevante soprattutto quando costruiamo componenti interattivi personalizzati come:
- modal;
- tab;
- accordion;
- menu;
- combobox;
- tooltip;
- notifiche dinamiche.

> [!INFO] Punto chiave
> ARIA non serve a "decorare" il markup. Serve a comunicare a screen reader e tecnologie assistive ruolo, stato e comportamento di componenti che altrimenti sarebbero ambigui.

---

## 1. Prima regola: semantica nativa

La regola piu importante e questa:

**prima usa HTML semantico corretto, poi aggiungi ARIA solo dove serve.**

Esempi corretti:
- `<button>` per un bottone;
- `<nav>` per navigazione;
- `<input>` per campi di input;
- `<label>` associata ai controlli;
- `<ul>` e `<li>` per liste.

Errore comune:

```javascript
<div onClick={handleClick}>Salva</div>
```

Meglio:

```javascript
<button onClick={handleClick}>Salva</button>
```

Il bottone nativo porta gia con se:
- focus corretto;
- attivazione da tastiera;
- semantica chiara;
- comportamento atteso dagli screen reader.

Se usi il tag giusto, spesso non serve ARIA aggiuntiva.

---

## 2. Cosa aggiunge ARIA

ARIA aggiunge soprattutto tre categorie di informazione:

### Ruoli
Dicono *che tipo di componente e*.

Esempi:
- `role="dialog"`
- `role="tab"`
- `role="alert"`

### Stati
Dicono *in che stato si trova il componente*.

Esempi:
- `aria-expanded="true"`
- `aria-selected="false"`
- `aria-checked="true"`

### Proprietà
Dicono *come il componente e collegato o descritto*.

Esempi:
- `aria-label`
- `aria-labelledby`
- `aria-describedby`
- `aria-controls`

---

## 3. No ARIA is better than bad ARIA

Uno dei principi piu importanti dell'accessibilita web e:

**nessuna ARIA e meglio di ARIA sbagliata.**

Perche?

Se metti ruoli o attributi errati:
- comunichi informazioni false alle tecnologie assistive;
- peggiori l'esperienza;
- rendi il componente piu confuso di quanto sarebbe senza nulla.

Quindi ARIA va usata in modo preciso, non "a intuito".

---

## 4. Esempi semplici di attributi utili

### `aria-label`
Serve quando un elemento ha bisogno di un nome accessibile ma non ha testo visibile sufficiente.

```javascript
<button aria-label="Chiudi finestra">X</button>
```

### `aria-describedby`
Collega un controllo a una descrizione o a un messaggio di aiuto.

```javascript
<>
  <input aria-describedby="email-help" />
  <p id="email-help">Inserisci una email valida</p>
</>
```

### `aria-expanded`
Indica se un contenuto espandibile e aperto o chiuso.

```javascript
<button aria-expanded={isOpen} onClick={toggle}>
  Dettagli
</button>
```

---

## 5. Label accessibili nei form

Uno dei casi piu frequenti in React riguarda i form.

Un input deve avere un nome accessibile chiaro.

Approccio corretto:

```javascript
<>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
</>
```

Questo e preferibile a usare solo placeholder o workaround con ARIA.

Se proprio serve un'etichetta non visibile, puoi ricorrere a pattern dedicati, ma il principio resta:
- prima `label` semantica;
- ARIA solo se necessario.

Questo si collega direttamente a [[Programmazione/React/Pagine/Gestione Moduli]].

---

## 6. Componenti custom e tastiera

ARIA da sola non rende accessibile un componente custom.

Esempio sbagliato:

```javascript
<div role="button">Apri</div>
```

Questo non basta. Se usi un `div` come bottone, devi anche gestire:
- focus;
- `tabIndex`;
- attivazione con `Enter`;
- attivazione con `Space`;
- stati coerenti.

Quindi ARIA non sostituisce il comportamento. Lo descrive soltanto.

Questo e uno dei motivi per cui usare elementi nativi e quasi sempre la scelta migliore.

---

## 7. Dialog e modal

Per una modal accessibile, `role="dialog"` o `role="alertdialog"` puo essere utile, insieme a:
- `aria-modal="true"`;
- `aria-labelledby`;
- `aria-describedby` quando serve.

Esempio concettuale:

```javascript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">Conferma eliminazione</h2>
  <p>Questa azione non puo essere annullata.</p>
</div>
```

Ma anche qui ARIA non basta da sola. Una modal accessibile deve gestire:
- focus iniziale;
- trap del focus;
- chiusura con tastiera;
- ritorno del focus all'elemento originario.

Questo si collega bene a [[Programmazione/React/Pagine/Portals]] e ai temi di focus management.

---

## 8. Tabs, accordion e disclosure

Componenti come tab e accordion sono casi classici di ARIA.

Esempi di attributi tipici:
- `role="tablist"`
- `role="tab"`
- `role="tabpanel"`
- `aria-selected`
- `aria-controls`
- `aria-expanded`

Per esempio, un accordion puo esporre:

```javascript
<button
  aria-expanded={isOpen}
  aria-controls="section-1"
>
  Sezione 1
</button>
<div id="section-1" hidden={!isOpen}>
  Contenuto
</div>
```

Questo tipo di struttura aiuta molto le tecnologie assistive a capire relazione e stato del componente.

Si collega bene a [[Programmazione/React/Pagine/Compound Components Pattern]].

---

## 9. Live regions

Le **live regions** servono a segnalare cambiamenti dinamici che avvengono senza cambio di focus.

Esempi:
- messaggio "salvataggio completato";
- errore di form apparso dinamicamente;
- notifica di aggiornamento stato.

Attributi comuni:
- `aria-live="polite"`
- `aria-live="assertive"`

Esempio:

```javascript
<div aria-live="polite">
  {statusMessage}
</div>
```

Questo permette agli screen reader di annunciare cambiamenti importanti senza che l'utente debba cercarli manualmente.

---

## 10. React e attributi ARIA

In React gli attributi ARIA si scrivono direttamente in JSX con il nome standard:

```javascript
<button aria-expanded={isOpen} aria-controls="menu" />
```

A differenza di alcuni attributi HTML che cambiano naming in JSX, gli attributi `aria-*` restano molto vicini alla forma standard.

Questo rende abbastanza naturale integrare ARIA nei componenti React, ma non elimina la necessita di capire il pattern accessibile corretto.

---

## 11. Errori comuni

Errori frequenti:
- aggiungere ARIA a elementi semantici gia corretti senza motivo;
- usare `div` o `span` al posto di controlli nativi;
- mettere `role="button"` senza gestire tastiera e focus;
- usare `aria-hidden` in modo incoerente;
- applicare ruoli errati a componenti complessi;
- dimenticare aggiornamento degli stati ARIA quando cambia lo stato React.

Un attributo ARIA statico ma disallineato allo stato reale e un bug di accessibilita.

---

## 12. Relazione con React

WAI-ARIA si collega bene a:
- [[Programmazione/React/Pagine/Gestione Moduli]] per label, errori e descrizioni dei campi;
- [[Programmazione/React/Pagine/Portals]] per dialog e overlay;
- focus management e navigazione da tastiera;
- test di accessibilita come Axe e Lighthouse.

In React, il punto centrale e mantenere coerenti:
- stato del componente;
- markup visibile;
- attributi ARIA;
- comportamento da tastiera.

Se questi quattro aspetti divergono, il componente smette di essere realmente accessibile.

---

## 13. Best Practices

1. **Usa prima HTML semantico nativo:** spesso e gia la soluzione migliore.
2. **Aggiungi ARIA solo quando la semantica HTML non basta:** specialmente per componenti custom complessi.
3. **Non usare ruoli o attributi ARIA a caso:** informazioni sbagliate peggiorano l'accessibilita.
4. **Ricorda che ARIA non implementa il comportamento:** tastiera, focus e stati devono essere gestiti davvero.
5. **Mantieni sincronizzati attributi ARIA e stato React:** `aria-expanded`, `aria-selected` e simili devono riflettere il valore reale.
6. **Testa i componenti con tastiera e strumenti di accessibilita:** markup corretto sulla carta non basta senza verifica pratica.

---
