---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - javascript
  - web-components
  - custom-elements
  - shadow-dom
  - templates
  - browser
aliases:
  - Custom Elements
  - Shadow DOM
  - HTML Templates
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM]]"
  - "[[Programmazione/JavaScript/Pagine/Gestione Eventi]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM]]"
  - "[[Programmazione/JavaScript/Pagine/Gestione Eventi]]"
title: Web Components
---

# Web Components

## Sintesi

I **Web Components** combinano standard browser per costruire elementi riutilizzabili: Custom Elements per comportamento e ciclo di vita, Shadow DOM per incapsulare struttura e stile, template e slot per comporre il markup. Sono tecnologie utilizzabili anche separatamente: un custom element non deve necessariamente avere uno Shadow DOM.

Non sono un framework completo e non rendono automaticamente accessibile un controllo. La sua API pubblica comprende attributi, proprieta, eventi, slot e parti CSS.

## Quando usarlo

Sono utili per widget incorporabili, design system condivisi tra applicazioni e integrazione progressiva in pagine esistenti. Possono convivere con React o altri framework; valuta se la portabilita giustifica la gestione aggiuntiva di proprieta, eventi e rendering. Per una normale azione, un `button` nativo resta preferibile a ricostruirne il comportamento.

Gli esempi seguenti usano **autonomous custom elements**, cioe classi che estendono `HTMLElement`. Esegui ogni registrazione una sola volta nella pagina, con uno script module dopo il markup richiesto.

## Come funziona

### Registrazione e upgrade

Il nome deve rispettare le regole dei custom elements: per i nomi ASCII comuni inizia con una lettera minuscola, usa minuscole e contiene un trattino. Esistono anche nomi riservati: avere un trattino non basta.

`customElements.define("user-badge", UserBadge)` associa un nome a una classe nel registro. Un elemento gia presente e connesso viene aggiornato quando arriva la definizione: e l'**upgrade**. Un elemento creato prima della definizione e rimasto scollegato puo essere aggiornato con `customElements.upgrade(element)` oppure quando viene collegato.

`customElements.whenDefined(name)` attende la registrazione, non dati remoti, rendering completo o connessione di qualsiasi istanza. Registrare due volte lo stesso nome, oppure la stessa classe con un altro nome nello stesso registro, genera un errore; non usare una guardia per nascondere involontariamente due versioni incompatibili.

### Costruttore e ciclo di vita

| Metodo | Responsabilita |
| --- | --- |
| `constructor()` | Chiama `super()`; prepara stato, riferimenti e, se serve, Shadow DOM |
| `connectedCallback()` | Avvia risorse legate alla presenza nel documento; puo essere chiamato piu volte |
| `disconnectedCallback()` | Ferma timer, observer e listener esterni avviati alla connessione |
| `attributeChangedCallback(name, oldValue, newValue)` | Reagisce agli attributi elencati in `observedAttributes` |
| `adoptedCallback(oldDocument, newDocument)` | Gestisce l'adozione in un altro documento |

Nel costruttore non fare affidamento su attributi o figli del **light DOM**, e non aggiungerli all'host. Preparare il proprio shadow tree e invece consentito. Se il parser non ha ancora letto i figli, anche una connessione puo avvenire prima che siano tutti disponibili: per gli esempi carica lo script con `type="module"` senza `async`, dopo il markup.

Gli attributi iniziali osservati possono produrre callback durante l'upgrade, prima della connessione. Una rimozione produce `newValue === null`; anche assegnare lo stesso valore puo notificare, quindi confronta vecchio e nuovo valore.

Uno spostamento con normali operazioni DOM puo comportare disconnessione e riconnessione: non distruggere inutilmente lo stato e non moltiplicare i listener. Le API piu recenti `moveBefore()` e `connectedMoveCallback()` offrono spostamenti che preservano lo stato; verifica il supporto prima di basarti su di esse.

### Attributi, proprieta e dati non fidati

Gli attributi sono stringhe oppure assenti; le proprieta possono contenere qualsiasi valore JavaScript. Il collegamento tra i due **non nasce automaticamente** per una proprieta definita da te: va implementato con getter/setter e callback.

Esempio minimo senza Shadow DOM, che riserva il proprio contenuto alla label:

```js
class UserBadge extends HTMLElement {
  static observedAttributes = ["display-name", "user-role"];

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) this.render();
  }

  render() {
    const name = this.getAttribute("display-name") ?? "Utente";
    const role = this.getAttribute("user-role") ?? "guest";
    this.textContent = `${name} - ${role}`;
  }
}

customElements.define("user-badge", UserBadge);
```

```html
<user-badge display-name="Luca" user-role="admin"></user-badge>
```

`user-role` e un dato applicativo: **non usare `role="admin"`**, perche `role` ha un significato di accessibilita. `textContent` mostra dati come testo anche se contengono tag HTML. Interpolarli in `innerHTML` li farebbe invece interpretare come markup.

Per valori booleani scegli un contratto esplicito. Nell'esempio `note-toggle` sotto, `pressed` usa la **presenza** dell'attributo: `pressed="false"` significa comunque attivo. Per disattivarlo rimuovi l'attributo o assegna `element.pressed = false`. Una proprieta come `element.user = {...}` richiede invece un setter/stato e un aggiornamento UI implementati dal componente: un'assegnazione arbitraria non basta.

### Shadow DOM, stili e sicurezza

Lo shadow tree e distinto dai figli ordinari dell'host. `document.querySelector()` non lo attraversa; con una radice aperta puoi usare `host.shadowRoot.querySelector()`.

`mode: "closed"` fa restituire `null` a `host.shadowRoot`, ma il codice che conserva il riferimento restituito da `attachShadow()` puo usarlo. Non e una barriera contro script ostili nella stessa pagina.

L'isolamento CSS non e totale:

- i selettori ordinari esterni non selezionano direttamente i nodi interni;
- proprieta ereditabili, come `color`, e custom properties possono arrivare dall'host;
- `:host` consente di stilizzare l'host dall'interno;
- `part` e `::part()` espongono punti controllati di personalizzazione.

Non mettere dati utente in stringhe HTML. Gli esempi con template statici non rendono sicuro HTML ricevuto dalla rete; valgono inoltre le policy CSP/Trusted Types dell'applicazione.

### Template e slot

Un normale `<template>` conserva il contenuto in `template.content`, un `DocumentFragment` non visualizzato. Clonarlo permette di creare istanze indipendenti. Aggiungere direttamente il frammento originale al DOM ne sposta i figli e svuota il template.

La copia non include listener aggiunti con `addEventListener`. Quando cloni nel light DOM, evita ID duplicati; inserire uno `<style>` clonato nel documento non gli conferisce isolamento. Nell'esempio pratico lo stile viene inserito nello Shadow DOM.

Uno `<slot>` proietta i figli del light DOM: **non li sposta fisicamente nello shadow tree**. `slot="title"` seleziona lo slot con quel nome; uno slot senza nome riceve i nodi assegnabili senza nome. Il fallback interno appare quando non ci sono nodi assegnati. `slotchange` segnala cambiamenti nell'assegnazione, non ogni modifica profonda del contenuto proiettato.

### Eventi attraverso il confine

`dispatchEvent()` notifica sincronicamente i listener. In un evento custom:

- `bubbles: true` permette la risalita verso gli antenati;
- `composed: true` permette di attraversare confini Shadow DOM;
- `detail` contiene il payload, senza clonarlo automaticamente.

Un evento emesso **sull'host** non deve attraversare il proprio shadow root per raggiungere il suo genitore. `composed` diventa comunque utile se quell'host e dentro lo shadow tree di un altro componente. Un evento emesso su un nodo interno, invece, necessita di `composed` per uscirne; `bubbles` da solo non basta.

Fuori dallo shadow tree il `target` puo essere ritargettizzato all'host. `composedPath()` mostra il percorso visibile al chiamante, senza esporre gli interni di una radice chiusa. Non basare l'API pubblica su selettori privati del componente.

## API / Sintassi

| Esigenza | API |
| --- | --- |
| Registrare e cercare una definizione | `customElements.define(name, Class)`, `get(name)` |
| Attendere o forzare un upgrade | `whenDefined(name)`, `upgrade(root)` |
| Osservare attributi | `static observedAttributes`, `attributeChangedCallback` |
| Creare uno shadow tree | `attachShadow({ mode: "open" })` |
| Copiare markup statico | `template.content.cloneNode(true)` |
| Leggere contenuto assegnato | `slot.assignedNodes()`, `assignedElements()` |
| Inviare una notifica applicativa | `dispatchEvent(new CustomEvent(name, options))` |

## Esempio pratico

### Toggle con stato osservabile

Inserisci questo markup prima del modulo che registra il componente. Il pulsante mantiene il nome accessibile stabile, mentre `aria-pressed` comunica lo stato.

```html
<template id="note-toggle-template">
  <style>
    :host { display: inline-block; }
    :host([hidden]) { display: none; }
    button {
      font: inherit;
      color: inherit;
      background: var(--toggle-background, white);
      border: 1px solid currentColor;
      padding: 0.5rem 1rem;
    }
    button[aria-pressed="true"] { border-width: 3px; }
    button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
  </style>
  <button type="button" part="button" aria-pressed="false">
    <slot>Preferito</slot>
  </button>
</template>

<note-toggle id="favorite"><span>Preferito</span></note-toggle>
```

La definizione usa un template gia disponibile, aggiorna solo lo stato e registra il listener interno una sola volta:

```js
const toggleTemplate = document.querySelector("#note-toggle-template");
if (!(toggleTemplate instanceof HTMLTemplateElement)) {
  throw new Error("Manca #note-toggle-template");
}

class NoteToggle extends HTMLElement {
  static observedAttributes = ["pressed", "disabled"];
  #button;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.append(toggleTemplate.content.cloneNode(true));
    this.#button = shadow.querySelector("button");

    this.#button.addEventListener("click", () => {
      if (this.disabled) return;
      this.pressed = !this.pressed;
      this.dispatchEvent(new CustomEvent("toggle-change", {
        detail: { pressed: this.pressed },
        bubbles: true,
        composed: true,
      }));
    });
  }

  connectedCallback() {
    // Ripassa dai setter le proprieta assegnate prima della definizione.
    for (const name of ["pressed", "disabled"]) {
      if (Object.hasOwn(this, name)) {
        const value = this[name];
        delete this[name];
        this[name] = value;
      }
    }
    this.#render();
  }

  get pressed() { return this.hasAttribute("pressed"); }
  set pressed(value) { this.toggleAttribute("pressed", Boolean(value)); }

  get disabled() { return this.hasAttribute("disabled"); }
  set disabled(value) { this.toggleAttribute("disabled", Boolean(value)); }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this.#render();
  }

  #render() {
    this.#button.setAttribute("aria-pressed", String(this.pressed));
    this.#button.disabled = this.disabled;
  }
}

customElements.define("note-toggle", NoteToggle);
```

Le assegnazioni pre-upgrade creano normalmente proprieta proprie che nascondono i setter sul prototipo. Il recupero in `connectedCallback` le elimina e ripassa il valore dal setter; in questo esempio il recupero avviene alla connessione. Non dichiarare campi pubblici `pressed` o `disabled` che nascondano di nuovo gli accessor.

Uso dopo la registrazione, oppure dopo `await customElements.whenDefined("note-toggle")`:

```js
const favorite = document.querySelector("#favorite");
favorite.addEventListener("toggle-change", (event) => {
  console.log("Preferito:", event.detail.pressed);
});
favorite.pressed = true;
favorite.disabled = false;
```

Il setter non emette l'evento: `toggle-change` segnala un'attivazione dell'utente, non ogni sincronizzazione programmatica. Il listener e attaccato al pulsante interno e sopravvive alla riconnessione senza duplicazioni; non trattiene una risorsa esterna.

Personalizzazione dalla pagina:

```css
note-toggle {
  --toggle-background: #f2f6f4;
}
note-toggle::part(button) {
  border-radius: 4px;
}
```

### Slot con nome

Esempio indipendente: la scheda accetta un titolo e contenuto libero.

```js
class AppCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `
      <article>
        <header><slot name="title">Scheda</slot></header>
        <section><slot></slot></section>
      </article>
    `;
  }
}
customElements.define("app-card", AppCard);
```

```html
<app-card>
  <h2 slot="title">Profilo</h2>
  <p>Contenuto della scheda.</p>
</app-card>
```

La stringa HTML e statica e controllata dal codice. Il titolo resta un figlio di `app-card`, raggiungibile con le normali query del documento.

### Risorse esterne e riconnessione

Qui invece il listener e sulla finestra: rimuoverlo evita che continui a richiamare un elemento scollegato. Alla riconnessione serve un **nuovo** `AbortController`, perche un segnale abortito non si riattiva.

```js
class ViewportWidth extends HTMLElement {
  #controller;

  connectedCallback() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const view = this.ownerDocument.defaultView;
    if (!view) return;

    const render = () => {
      this.textContent = `Larghezza: ${view.innerWidth}px`;
    };
    view.addEventListener("resize", render, {
      signal: this.#controller.signal,
    });
    render();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = undefined;
  }
}
customElements.define("viewport-width", ViewportWidth);
```

Uso: `<viewport-width></viewport-width>`. L'esempio usa la finestra del documento corrente, non una variabile globale catturata per sempre. In componenti reali applica lo stesso ciclo anche a timer, observer e richieste annullabili.

## Varianti

### Form e accessibilita

Un autonomous custom element non diventa un campo inviabile solo perche contiene un `input` nello Shadow DOM. Un **form-associated custom element** dichiara `static formAssociated = true`, chiama `attachInternals()` e usa `ElementInternals.setFormValue(value)` per il valore da inviare. Servono un nome e un'associazione al form; `null` esclude il valore dalla submission.

Questo non implementa da solo validazione, reset, disabilitazione, ripristino dello stato, tastiera o nome accessibile. Valuta `setValidity()`, `formResetCallback()`, `formDisabledCallback()` e `formStateRestoreCallback()`, verificando compatibilita e comportamento con tecnologie assistive. Il toggle qui sopra e un pulsante di stato, **non** un campo form completo.

### Framework e rendering

Puoi usare tag custom anche nel JSX, ma il passaggio di oggetti e la gestione degli eventi dipendono dal framework e dalla sua versione. Non serializzare un oggetto in un attributo aspettandoti che riappaia come oggetto JavaScript.

I Web Components non includono router o gestione globale dello stato. Librerie come Lit aggiungono rendering dichiarativo. Il Declarative Shadow DOM usa `<template shadowrootmode="open">` per descrivere uno shadow tree nel markup: non equivale a un template ordinario da clonare; integrazione SSR e hydration richiedono un progetto dedicato e verifiche sui browser target.

## Errori comuni

- Interpolare attributi non fidati in `innerHTML`.
- Leggere figli nel costruttore o sovrascrivere il light DOM che dovrebbe essere proiettato.
- Registrare due volte lo stesso nome copiando esempi nella stessa pagina.
- Confondere presenza di un attributo booleano con la stringa `"false"`.
- Aggiornare lo stato solo alla prima connessione e ignorare modifiche successive.
- Ricreare pulsanti e listener a ogni render, perdendo focus o duplicando notifiche.
- Pensare che `closed` impedisca a script ostili di intervenire.
- Aspettarsi semantica, focus e invio form dal solo nome del tag.

## Checklist

- Attributi, proprieta, eventi e slot hanno un contratto documentato.
- Creazione da HTML, `createElement`, upgrade e riconnessione sono verificati.
- I dati dinamici sono inseriti come testo o gestiti con una policy HTML adeguata.
- Listener esterni e operazioni pendenti sono rilasciati alla disconnessione.
- Tastiera, focus visibile, nome accessibile e stato disabilitato funzionano.
- Sono verificati i browser richiesti, non soltanto il browser di sviluppo.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]
- [[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]

## Fonti

- [HTML Standard: custom elements, costruttori, upgrade e form](https://html.spec.whatwg.org/multipage/custom-elements.html).
- [MDN: custom elements e ciclo di vita](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements).
- [web.dev: progettazione di attributi, proprieta ed eventi](https://web.dev/articles/custom-elements-best-practices).
- [MDN: Shadow DOM, isolamento e stili](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM).
- [MDN: template e slot](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots).
- [MDN: eventi composed](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed).
- [MDN: ElementInternals.setFormValue](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/setFormValue).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
