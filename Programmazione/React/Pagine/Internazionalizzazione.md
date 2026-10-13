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
  - i18n
  - frontend
aliases:
  - Internazionalizzazione
  - i18n
  - Localizzazione
prerequisites: []
related: []
title: Internazionalizzazione
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

### Configurare le traduzioni in una SPA

`t` non e una funzione globale di React: nell'esempio proviene da `useTranslation` di `react-i18next`. Installare le due dipendenze:

```bash
npm install i18next react-i18next
```

In `src/i18n.js`, inizializzare un'istanza condivisa con dizionari inclusi nel bundle:

```javascript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const i18nReady = i18n.use(initReactI18next).init({
  lng: "it",
  fallbackLng: "en",
  supportedLngs: ["it", "en"],
  resources: {
    it: { translation: {
      actions: { save: "Salva" },
      language: "Lingua",
      items_one: "{{count}} elemento",
      items_many: "{{count}} elementi",
      items_other: "{{count}} elementi",
    } },
    en: { translation: {
      actions: { save: "Save" },
      language: "Language",
      items_one: "{{count}} item",
      items_other: "{{count}} items",
    } },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
```

Attendere l'inizializzazione prima del rendering in `src/main.jsx`:

```jsx
import { createRoot } from "react-dom/client";
import App from "./App";
import { i18nReady } from "./i18n";

i18nReady.then(() => {
  createRoot(document.getElementById("root")).render(<App />);
}).catch((error) => console.error("i18n initialization failed", error));
```

### Usare chiavi, plurali e cambio lingua

Un componente puo chiamare l'Hook e aggiornare la lingua condivisa:

```jsx
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function TranslationDemo({ count = 2 }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "it";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = i18n.dir(language);
  }, [i18n, language]);

  return (
    <section>
      <label>
        {t("language")}
        <select value={language} onChange={(event) => {
          i18n.changeLanguage(event.target.value)
            .catch((error) => console.error("Language change failed", error));
        }}>
          <option value="it">Italiano</option>
          <option value="en">English</option>
        </select>
      </label>
      <p>{t("items", { count })}</p>
      <button type="button">{t("actions.save")}</button>
    </section>
  );
}
```

`count` deve essere numerico: le regole del locale scelgono il suffisso, non un semplice test `count === 1`. Provare almeno 0, 1, 2 e numeri grandi; altre lingue richiedono categorie diverse. `fallbackLng` cerca la traduzione inglese se manca quella italiana. Il bottone mostra solo la traduzione: l'azione di salvataggio appartiene all'applicazione.

In questo esempio il cambio lingua non persiste al reload: per farlo aggiungere una preferenza salvata o un language detector. Con file JSON caricati via rete servono anche gestione del caricamento e degli errori. In SSR non condividere una lingua mutabile globale fra richieste: usare l'integrazione del framework e un contesto per richiesta.

`escapeValue: false` e adatto alle stringhe renderizzate come testo JSX, che React protegge tramite escaping. Non autorizza l'inserimento di traduzioni o input non fidati in `dangerouslySetInnerHTML`.

### Formattare numeri

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

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Context API|Context API]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Testing Cypress e Playwright|Testing Cypress e Playwright]]
- [[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]

## Fonti

- [react-i18next - Quick start](https://react.i18next.com/guides/quick-start)
- [react-i18next - useTranslation](https://react.i18next.com/latest/usetranslation-hook)
- [i18next - Plurals](https://www.i18next.com/translation-function/plurals)
- [i18next - API](https://www.i18next.com/overview/api)
