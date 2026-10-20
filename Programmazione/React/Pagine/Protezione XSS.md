---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - security
  - xss
aliases:
  - Protezione XSS
  - Sanitizzazione HTML
prerequisites:
  - "[[Programmazione/React/Pagine/JSX|JSX]]"
  - "[[Programmazione/JavaScript/Pagine/Sanitizzazione input|Sanitizzazione input]]"
related:
  - "[[Programmazione/React/Pagine/Content Security Policy|Content Security Policy]]"
  - "[[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]"
title: Protezione XSS
---

# Protezione XSS

## Sintesi

XSS permette a contenuto non fidato di diventare codice eseguito nell'origine dell'app. React protegge il normale rendering di stringhe come testo, **non qualsiasi uso di una stringa**: HTML raw, manipolazione DOM, URL e script di terzi richiedono controlli distinti.

La prima scelta e non interpretare HTML. Quando serve rich text, centralizza la sanitizzazione prima dell'inserimento e conserva una policy piccola. Gli esempi usano React/React DOM 19.3.0 e DOMPurify 3.4.17.

## Quando usarlo

Controlla questi confini per commenti, profili, query string, Markdown, CMS, messaggi postMessage e risposte API. Anche il database puo contenere input scritto da un altro utente: provenienza dal backend non significa contenuto fidato.

Per le differenze generali fra validazione, encoding e sanitizzazione vedi [[Programmazione/JavaScript/Pagine/Sanitizzazione input|Sanitizzazione input]]. Qui il punto centrale e l'integrazione con React, non un secondo sanitizer scritto a mano.

## Come funziona

### Testo, markup e props

In un normale elemento, `<p>{userInput}</p>` tratta una stringa come testo. Non pre-escaparla: visualizzeresti letteralmente entita come `&lt;`. Questo non autorizza a inserire la stessa stringa dentro script, style o API imperative che la reinterpretano.

`dangerouslySetInnerHTML` sostituisce il contenuto del nodo con HTML: non offre sanitizzazione e non va combinato con children sullo stesso nodo. Rimuovere solo i tag script non basta; eventi HTML, URL attive e altri contesti restano rilevanti.

Non accettare un intero oggetto di props non fidate con `<Element {...data} />`: scegli esplicitamente i campi ammessi. La validazione di un payload JSON non trasforma i suoi campi in HTML sicuro.

### URL e difese aggiuntive

React 19 blocca URL `javascript:` in alcuni attributi, ma non e una policy per le destinazioni dell'app. Un link HTTPS puo comunque portare a phishing o a un redirect indesiderato. Il costruttore URL fa parsing; il codice applicativo decide protocolli, origini e credenziali ammessi.

`noopener` riguarda il rapporto con la finestra aperta; `noreferrer` omette il referrer. Nessuno dei due sanitizza l'HTML o valida `href`. CSP e Trusted Types possono limitare errori e impatto, ma non sostituiscono encoding, sanitizer e controllo delle dipendenze.

## API / Sintassi

| Destinazione | Scelta |
| --- | --- |
| Testo in un elemento React | Stringa come children |
| Rich text in un div HTML | Sanitizer mantenuto, policy esplicita, inserimento diretto |
| href scelto da dati esterni | Parsing URL e allowlist applicativa |
| Script, template eseguibili, eval | Non costruirli da input non fidato |
| HTML generato da Markdown | Sanitizzare dopo la conversione finale |

Non esiste una singola funzione `sanitize` valida per HTML, URL, JavaScript e SQL. Non passare contenuto gia pulito a un'altra trasformazione che aggiunge markup non fidato.

## Esempio pratico

### Testo, rich text e link controllato

In un progetto React con bundler, installa la dipendenza nella directory del progetto, non nel vault o nel generatore Quartz:

```sh
npm install --save-exact --ignore-scripts dompurify@3.4.17
```

La versione rende la prova riproducibile: verifica gli aggiornamenti di sicurezza, non mantenere il pin indefinitamente. Modulo browser `ContentPreview.jsx`, da rendere con `<ContentPreview />`:

```jsx
import { useId, useState } from "react";
import createDOMPurify from "dompurify";

const purifier = typeof window === "undefined" ? null : createDOMPurify(window);
const initialHtml = '<p>Ciao <strong>React</strong>' +
  '<img src=x onerror="globalThis.unexpected = true"></p>';

export function checkText(value) {
  if (typeof value !== "string") throw new TypeError("Serve una stringa");
  if (value.length > 20_000) throw new RangeError("Contenuto troppo lungo");
  return value;
}

export function sanitizeRichHtml(html) {
  checkText(html);
  if (!purifier?.isSupported) throw new Error("Sanitizer browser non disponibile");
  return purifier.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "code"],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    RETURN_TRUSTED_TYPE: false,
  });
}

export function allowedHelpUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.origin !== "https://react.dev"
      || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function PlainText({ text }) {
  return <p>{checkText(text)}</p>;
}

export function RichText({ html }) {
  const clean = sanitizeRichHtml(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

export default function ContentPreview() {
  const htmlId = useId();
  const linkId = useId();
  const [html, setHtml] = useState(initialHtml);
  const [destination, setDestination] = useState("https://react.dev/learn");
  const href = allowedHelpUrl(destination);
  return (
    <section aria-label="Anteprima contenuto" style={{ overflowWrap: "anywhere" }}>
      <label htmlFor={htmlId}>Contenuto</label>
      <textarea id={htmlId} value={html} maxLength={20_000}
        style={{ display: "block", width: "100%", boxSizing: "border-box" }}
        onChange={(e) => setHtml(e.target.value)} />
      <h2>Come testo</h2>
      <div data-view="text"><PlainText text={html} /></div>
      <h2>Come HTML limitato</h2>
      <div data-view="rich"><RichText html={html} /></div>
      <label htmlFor={linkId}>Link documentazione</label>
      <input id={linkId} value={destination} maxLength={2048}
        style={{ display: "block", width: "100%", boxSizing: "border-box" }}
        onChange={(e) => setDestination(e.target.value)} />
      {href ? <a href={href} target="_blank" rel="noopener noreferrer">Apri documentazione</a>
        : <p role="status">Destinazione non ammessa.</p>}
      <p><button type="button" onClick={() => setHtml(initialHtml)}>Ripristina esempio</button></p>
    </section>
  );
}
```

Il primo riquadro deve mostrare i caratteri del markup; il secondo conserva il grassetto ma **non contiene img o attributi evento**. Il payload dimostrativo modifica soltanto una variabile locale se eseguito: non invia dati a servizi esterni.

La policy consente otto tag senza attributi: niente link nel rich text, immagini, form, CSS, SVG o MathML. Il link e un componente distinto con una destinazione limitata a react.dev; non e una funzione per qualsiasi navigazione o redirect di login. Non segue eventuali redirect HTTP della destinazione.

L'istanza dedicata evita configurazioni globali condivise. Non aggiungere `USE_PROFILES`, che sostituirebbe la allowlist dei tag. Non concatenare HTML dopo la sanitizzazione e non usare `DOMPurify.removed` come autorizzazione. I limiti sono in unita UTF-16, non byte o caratteri percepiti; il server deve imporre anche i propri limiti.

### Prove utili

- Prova testo semplice, stringa vuota, strong/em, liste e markup malformato.
- Prova img/onerror, script, iframe, attributi style/id/data/aria e link: controlla il DOM, non soltanto l'assenza di alert.
- Per la URL prova javascript, data, origini simili, credenziali prima dell'host e URL relative.
- Per dati oltre il contratto il componente lancia un errore; usa un Error Boundary oppure valida prima della UI. `maxLength` da solo non valida risposte API.

Le prove del sanitizer vanno eseguite anche senza una CSP che nasconda l'esecuzione indesiderata. Nessun insieme finito di payload dimostra l'assenza di tutti i bypass.

## Varianti

- **Markdown**: conversione, sanitizzazione dell'HTML risultante, rendering; un parser non e automaticamente un sanitizer.
- **SSR**: il demo rich text rifiuta il rendering senza il DOM browser. Sul server serve un'integrazione supportata con DOM aggiornato e policy coerente; non usare un fallback che restituisce l'input grezzo e non nascondere mismatch con suppressHydrationWarning.
- **Trusted Types**: il demo restituisce una stringa e non abilita enforcement. Per usarlo bisogna coordinare policy e CSP con il sanitizer e il sink React; una policy identita non rende affidabile l'input.
- **Sessione**: HttpOnly impedisce la lettura diretta del cookie, non le azioni autenticate di uno script XSS nella pagina. Token in memoria non significa token irraggiungibile da codice malevolo.
- **Dipendenze**: mantieni aggiornati React, sanitizer e plugin che producono HTML; verifica il comportamento dopo ogni modifica di versione o policy.

## Errori comuni

- Presentare escaping JSX e sanitizzazione HTML come la stessa operazione.
- Usare una regex o una funzione sanitizeHtml non implementata.
- Fidarsi di un CMS, del database o di una risposta JSON per la sola provenienza.
- Pensare che rel, HTTPS o new URL autorizzino qualsiasi destinazione.
- Accettare props, nomi attributo o codice arbitrario da dati esterni.
- Allargare la policy per far passare un payload senza rivedere il modello di rischio.
- Disabilitare CSP/lint per comodita o promettere che React renda XSS impossibile.

## Checklist

- Il contenuto deve essere davvero HTML, oppure basta testo?
- Sorgente, contratto e punto finale di interpretazione sono espliciti?
- La policy ammette solo tag/attributi necessari e il risultato non viene reinterpretato?
- URL e redirect hanno regole applicative separate?
- Le dipendenze sono aggiornate e i payload producono il DOM previsto?
- SSR, CSP e Trusted Types sono configurati e provati nell'ambiente reale?
- Token, cache e azioni autenticate sono considerati nel danno possibile di XSS?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Content Security Policy|Content Security Policy]]
- [[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]
- [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]
- [[Programmazione/React/Pagine/CSRF|CSRF]]
- [[Programmazione/React/Pagine/JSX|JSX]]
- [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]
- [[Programmazione/JavaScript/Pagine/Sanitizzazione input|Sanitizzazione input]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]

## Fonti

- [React DOM: dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html).
- [OWASP: XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).
- [DOMPurify 3.4.17: configurazione e ambienti](https://github.com/cure53/DOMPurify/blob/3.4.17/README.md).
- [DOMPurify 3.4.17: release](https://github.com/cure53/DOMPurify/releases/tag/3.4.17).
- [MDN: parsing URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL).
- [OWASP: HTML5 Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html).

Consultate il 2026-10-18. Esempi React/React DOM 19.3.0 e DOMPurify 3.4.17; non costituiscono un audit completo dell'app.
