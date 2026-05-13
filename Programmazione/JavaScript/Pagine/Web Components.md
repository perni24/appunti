---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: advanced
tags: [javascript, web-components, custom-elements, shadow-dom, templates, browser]
aliases: [Custom Elements, Shadow DOM, HTML Templates]
prerequisites: [Classi, Manipolazione del DOM, Gestione Eventi]
related: [Classi, Manipolazione del DOM, Gestione Eventi]
---

# Web Components

I **Web Components** sono un insieme di API native del browser per creare componenti riutilizzabili, incapsulati e indipendenti da framework.

Le tre tecnologie principali sono:

- **Custom Elements**: permettono di definire nuovi tag HTML;
- **Shadow DOM**: incapsula markup e stile;
- **HTML Templates**: definiscono markup riutilizzabile non renderizzato subito.

---

## 1. Perche usare Web Components

I Web Components servono quando vuoi creare elementi UI riutilizzabili senza dipendere da React, Vue, Angular o altri framework.

Sono utili per:

- design system condivisi;
- widget embeddabili in pagine diverse;
- componenti usabili in progetti con framework differenti;
- isolamento di markup e CSS;
- librerie UI native basate su standard web.

Non sostituiscono sempre un framework, ma offrono una base standard per componenti portabili.

---

## 2. Custom Elements

I Custom Elements permettono di creare nuovi tag HTML.

Un nome di custom element deve contenere almeno un trattino.

Esempi validi:

```html
<user-card></user-card>
<app-modal></app-modal>
<x-tooltip></x-tooltip>
```

Esempio base:

```js
class UserCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <article>
        <h2>Utente</h2>
        <p>Profilo utente</p>
      </article>
    `;
  }
}

customElements.define("user-card", UserCard);
```

Uso:

```html
<user-card></user-card>
```

Quando il browser incontra `<user-card>`, crea una istanza della classe associata.

---

## 3. Lifecycle dei Custom Elements

Un custom element puo definire metodi lifecycle.

```js
class AppCounter extends HTMLElement {
  connectedCallback() {
    console.log("Elemento inserito nel DOM");
  }

  disconnectedCallback() {
    console.log("Elemento rimosso dal DOM");
  }

  adoptedCallback() {
    console.log("Elemento spostato in un altro document");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`${name}: ${oldValue} -> ${newValue}`);
  }
}
```

I callback principali sono:

- `connectedCallback()`: chiamato quando l'elemento entra nel DOM;
- `disconnectedCallback()`: chiamato quando viene rimosso dal DOM;
- `adoptedCallback()`: chiamato quando viene spostato tra documenti;
- `attributeChangedCallback()`: chiamato quando un attributo osservato cambia.

---

## 4. Attributi osservati

Per reagire ai cambiamenti degli attributi bisogna dichiarare `observedAttributes`.

```js
class UserBadge extends HTMLElement {
  static observedAttributes = ["name", "role"];

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const name = this.getAttribute("name") ?? "Utente";
    const role = this.getAttribute("role") ?? "guest";

    this.innerHTML = `
      <span>${name} - ${role}</span>
    `;
  }
}

customElements.define("user-badge", UserBadge);
```

Uso:

```html
<user-badge name="Luca" role="admin"></user-badge>
```

Se `name` o `role` cambiano, `attributeChangedCallback()` viene eseguito.

---

## 5. Properties vs attributes

Gli attributi sono stringhe presenti nell'HTML.

```html
<user-badge name="Luca"></user-badge>
```

Le proprieta sono valori JavaScript sull'oggetto DOM.

```js
const badge = document.querySelector("user-badge");

badge.user = {
  name: "Luca",
  role: "admin",
};
```

Regola pratica:

- usa attributi per configurazioni semplici e serializzabili;
- usa proprieta per oggetti, array, funzioni o dati complessi.

---

## 6. Shadow DOM

Lo Shadow DOM crea un albero DOM separato e incapsulato dentro un elemento.

```js
class AppButton extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <style>
        button {
          padding: 0.5rem 1rem;
          border: 0;
          border-radius: 0.5rem;
          background: black;
          color: white;
        }
      </style>

      <button>
        <slot></slot>
      </button>
    `;
  }
}

customElements.define("app-button", AppButton);
```

Uso:

```html
<app-button>Salva</app-button>
```

Lo stile definito nello Shadow DOM non si applica automaticamente al resto della pagina.

Allo stesso modo, molti stili globali della pagina non entrano automaticamente nel componente.

---

## 7. Shadow root open e closed

`attachShadow()` accetta una modalita.

```js
this.attachShadow({ mode: "open" });
```

Con `open`, il codice esterno puo accedere allo shadow root.

```js
const button = document.querySelector("app-button");

console.log(button.shadowRoot);
```

Con `closed`, `shadowRoot` non e accessibile dall'esterno.

```js
this.attachShadow({ mode: "closed" });
```

In pratica, `open` e piu comune per debug, test e interoperabilita.

`closed` non deve essere considerato una protezione di sicurezza forte.

---

## 8. Slot

Gli slot permettono di inserire contenuto esterno dentro lo Shadow DOM.

```js
class AppCard extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" }).innerHTML = `
      <article>
        <header>
          <slot name="title"></slot>
        </header>

        <section>
          <slot></slot>
        </section>
      </article>
    `;
  }
}

customElements.define("app-card", AppCard);
```

Uso:

```html
<app-card>
  <h2 slot="title">Profilo</h2>
  <p>Contenuto della card.</p>
</app-card>
```

Lo slot senza nome riceve il contenuto non assegnato ad altri slot.

---

## 9. Template HTML

Il tag `<template>` contiene markup che il browser non renderizza subito.

```html
<template id="user-card-template">
  <style>
    article {
      border: 1px solid #ddd;
      padding: 1rem;
    }
  </style>

  <article>
    <h2></h2>
    <p></p>
  </article>
</template>
```

Il template puo essere clonato da JavaScript.

```js
const template = document.querySelector("#user-card-template");
const clone = template.content.cloneNode(true);

document.body.append(clone);
```

Nei Web Components, i template aiutano a separare markup e logica.

---

## 10. Template dentro un componente

Esempio completo con template e Shadow DOM.

```html
<template id="profile-card-template">
  <style>
    article {
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      padding: 1rem;
    }

    h2 {
      margin: 0 0 0.5rem;
    }
  </style>

  <article>
    <h2></h2>
    <p></p>
  </article>
</template>
```

```js
class ProfileCard extends HTMLElement {
  constructor() {
    super();

    const template = document.querySelector("#profile-card-template");
    const content = template.content.cloneNode(true);

    this.attachShadow({ mode: "open" }).append(content);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const name = this.getAttribute("name") ?? "Utente";
    const description = this.getAttribute("description") ?? "";

    this.shadowRoot.querySelector("h2").textContent = name;
    this.shadowRoot.querySelector("p").textContent = description;
  }
}

customElements.define("profile-card", ProfileCard);
```

Uso:

```html
<profile-card
  name="Luca"
  description="Frontend developer"
></profile-card>
```

---

## 11. Eventi nei Web Components

Un componente puo emettere eventi custom.

```js
class AppToggle extends HTMLElement {
  #checked = false;

  connectedCallback() {
    this.innerHTML = `<button>Toggle</button>`;

    this.querySelector("button").addEventListener("click", () => {
      this.#checked = !this.#checked;

      this.dispatchEvent(new CustomEvent("toggle-change", {
        detail: {
          checked: this.#checked,
        },
        bubbles: true,
      }));
    });
  }
}

customElements.define("app-toggle", AppToggle);
```

Uso:

```js
document.querySelector("app-toggle").addEventListener("toggle-change", event => {
  console.log(event.detail.checked);
});
```

Gli eventi custom sono il modo principale per comunicare dal componente verso l'esterno.

---

## 12. Eventi e Shadow DOM

Quando un evento attraversa uno Shadow DOM, il browser puo modificarne il target visibile all'esterno.

Per far uscire un evento da uno Shadow DOM, spesso serve `composed: true`.

```js
this.dispatchEvent(new CustomEvent("modal-close", {
  bubbles: true,
  composed: true,
}));
```

Significato:

- `bubbles: true`: l'evento risale l'albero DOM;
- `composed: true`: l'evento puo attraversare il confine dello Shadow DOM.

Senza `composed: true`, alcuni eventi custom restano confinati nello Shadow DOM.

---

## 13. Stili nello Shadow DOM

Lo Shadow DOM isola gli stili, ma esistono modi controllati per personalizzare un componente.

### CSS custom properties

```css
app-button {
  --button-bg: darkblue;
}
```

```js
this.shadowRoot.innerHTML = `
  <style>
    button {
      background: var(--button-bg, black);
      color: white;
    }
  </style>

  <button><slot></slot></button>
`;
```

Le custom properties attraversano il confine dello Shadow DOM e sono utili per tematizzare i componenti.

### ::part()

Un componente puo esporre parti stilizzabili.

```html
<button part="button">
  <slot></slot>
</button>
```

```css
app-button::part(button) {
  border-radius: 999px;
}
```

`::part()` permette personalizzazione controllata senza esporre tutta la struttura interna.

---

## 14. Form-associated custom elements

Alcuni custom elements possono integrarsi con i form usando la Form-associated Custom Elements API.

```js
class RatingInput extends HTMLElement {
  static formAssociated = true;

  #internals;

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  set value(value) {
    this.#internals.setFormValue(value);
  }
}

customElements.define("rating-input", RatingInput);
```

Questo e utile per componenti custom che devono comportarsi come input nativi.

E un argomento avanzato e va valutato in base al supporto dei browser target.

---

## 15. Web Components e framework

I Web Components possono essere usati con molti framework perche sono elementi HTML standard.

Esempio in HTML:

```html
<app-button>Salva</app-button>
```

Esempio concettuale in React:

```jsx
<app-button>Salva</app-button>
```

Bisogna pero fare attenzione a:

- passaggio di proprieta non stringa;
- eventi custom;
- differenze tra attributi e properties;
- server-side rendering;
- hydration nei framework moderni.

---

## 16. Limiti

I Web Components hanno alcuni limiti pratici:

- non forniscono routing;
- non forniscono state management globale;
- non forniscono un sistema di rendering dichiarativo completo;
- richiedono piu codice boilerplate rispetto a molti framework;
- il binding tra dati e UI va gestito manualmente o con librerie dedicate;
- alcuni dettagli di accessibilita restano responsabilita dello sviluppatore.

Per componenti complessi, spesso si usano librerie come Lit, ma il concetto base resta quello delle API native.

---

## 17. Best practice

- Usa nomi con trattino per tutti i custom elements.
- Mantieni una API pubblica chiara tramite attributi, proprieta ed eventi.
- Usa Shadow DOM quando serve incapsulamento reale.
- Usa slot per contenuto esterno.
- Usa `CustomEvent` per comunicare verso l'esterno.
- Usa `composed: true` quando un evento deve uscire dallo Shadow DOM.
- Evita `innerHTML` con input non fidato.
- Pulisci listener, timer e risorse in `disconnectedCallback()`.
- Documenta attributi, properties, eventi e slot del componente.

---

## 18. Errori comuni

- Definire un custom element senza trattino nel nome.
- Confondere attributi HTML e proprieta JavaScript.
- Aspettarsi che CSS globale entri sempre nello Shadow DOM.
- Dimenticare `composed: true` negli eventi custom.
- Non gestire cleanup in `disconnectedCallback()`.
- Usare `innerHTML` con dati utente non sicuri.
- Pensare che Shadow DOM sia una barriera di sicurezza.
- Creare componenti troppo grandi senza API chiara.

---

## 19. Mappa mentale

```text
Web Components
|
|-- Custom Elements
|   |-- nuovi tag HTML
|   |-- lifecycle callbacks
|   |-- attributi osservati
|
|-- Shadow DOM
|   |-- incapsulamento DOM
|   |-- isolamento CSS
|   |-- slot
|
|-- Templates
|   |-- markup non renderizzato subito
|   |-- cloneNode()
|   |-- riuso struttura
|
|-- Comunicazione
|   |-- attributes
|   |-- properties
|   |-- CustomEvent
|
|-- Stili
|   |-- CSS custom properties
|   |-- ::part()
```

---
