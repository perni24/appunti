---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, i18n, frontend]
aliases: [Internazionalizzazione, i18n, Localizzazione]
prerequisites: []
related: []
---

# Internazionalizzazione

## Sintesi

Internazionalizzazione significa progettare l'app per supportare piu lingue, formati locali, date, numeri, valute, pluralizzazione e direzione del testo. Localizzazione e l'adattamento concreto a una lingua o mercato.

## Quando usarlo

Serve quando l'app ha utenti in piu lingue o regioni, o quando date, valute e numeri devono rispettare locale.

## Come funziona

Invece di stringhe hardcoded:

```jsx
<button>Salva</button>
```

usi chiavi traducibili:

```jsx
<button>{t("actions.save")}</button>
```

## API / Sintassi

Intl:

```jsx
new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
}).format(1234.5);
```

Date:

```jsx
new Intl.DateTimeFormat("it-IT").format(new Date());
```

## Esempio pratico

```jsx
function Price({ amount, locale, currency }) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });

  return <span>{formatter.format(amount)}</span>;
}
```

## Varianti

- **i18next/react-i18next**: libreria diffusa.
- **FormatJS**: formattazione e messaggi.
- **Intl API**: standard browser.
- **Lazy loading traduzioni**: carica solo locale attivo.
- **RTL support**: layout per lingue right-to-left.
- **Plural rules**: singolare/plurale dipendono dalla lingua.

## Errori comuni

- Concatenare stringhe tradotte.
- Dimenticare pluralizzazione.
- Formattare date e valute a mano.
- Hardcodare testi in componenti.
- Non testare layout con stringhe lunghe.
- Ignorare RTL.

## Checklist

- Le stringhe sono estratte?
- Date, numeri e valute usano locale?
- Le traduzioni supportano pluralizzazione?
- Il layout regge testi lunghi?
- Le lingue RTL sono considerate se richieste?
- Le traduzioni sono caricate in modo efficiente?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Context API]]
- [[Design system]]
- [[Testing Cypress e Playwright]]
- [[WAI-ARIA]]
