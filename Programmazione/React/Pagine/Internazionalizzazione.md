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
prerequisites:
  - "[[Programmazione/React/Pagine/Context API|Context API]]"
related:
  - "[[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]"
title: Internazionalizzazione
---

# Internazionalizzazione

## Sintesi

Internazionalizzazione (i18n) significa predisporre un'app a lingue, formati e convenzioni differenti. Localizzazione (l10n) e l'adattamento concreto di testi e contenuti a una lingua o un mercato.

Traduzione, locale, valuta e fuso orario sono scelte correlate ma distinte: cambiare da italiano a inglese non converte automaticamente euro in dollari e non stabilisce dove si trova l'utente.

## Quando usarlo

Serve per interfacce multilingua e anche per app monolingua che devono mostrare date e numeri secondo regole precise. Prevedila prima di spargere stringhe concatenate e formattazioni manuali in tutti i componenti.

## Come funziona

Usa chiavi semantiche e messaggi completi, per esempio `greeting: "Ciao, {{name}}"`, invece di concatenare una parola tradotta con il nome. Ordine delle parole e accordi grammaticali variano tra lingue.

Il motore di traduzione risolve chiave, interpolazioni, plurale e fallback. Le API `Intl` formattano dati: non traducono i testi dell'app e non costituiscono un parser universale di input localizzato.

## API / Sintassi

| Scelta | Esempio | Cosa non implica |
| --- | --- | --- |
| Lingua delle risorse | `it`, `en` | Il Paese o la posizione dell'utente |
| Locale di formattazione | `it-IT`, `en-GB` | Una conversione di valuta |
| Valuta del dato | `EUR` | La valuta del locale scelto |
| Fuso di visualizzazione | `Europe/Rome` | Il fuso del dispositivo |
| Direzione | `ltr`, `rtl` | Il mirroring corretto di ogni elemento grafico |

`Intl.NumberFormat(locale, options)` formatta numeri; `Intl.DateTimeFormat(locale, options)` formatta date/istanti; `Intl.PluralRules(locale)` restituisce una categoria grammaticale. Il testo completo resta responsabilita dei dizionari.

## Esempio pratico

### Configurare le traduzioni in una SPA

`t` non e una funzione globale di React: qui proviene da `useTranslation` di `react-i18next`. Installa le versioni usate dagli esempi:

```bash
npm install i18next@26.4.5 react-i18next@17.0.16
```

In `src/i18n.js`, una factory crea un'istanza con dizionari inclusi nel bundle. Il provider successivo la passa esplicitamente ai componenti: i test possono creare istanze indipendenti senza modificare un singleton condiviso.

```javascript
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

export const resources = {
    it: { translation: {
      actions: { add: "Aggiungi elemento", clear: "Svuota" },
      language: "Lingua",
      greeting: "Ciao, {{name}}",
      items_zero: "Nessun elemento",
      items_one: "{{count}} elemento",
      items_many: "{{count}} elementi",
      items_other: "{{count}} elementi",
      amount: "Importo",
      updated: "Aggiornato a Roma",
      error: "Cambio lingua non riuscito.",
    } },
    en: { translation: {
      actions: { add: "Add item", clear: "Clear" },
      language: "Language",
      greeting: "Hello, {{name}}",
      items_zero: "No items",
      items_one: "{{count}} item",
      items_other: "{{count}} items",
      amount: "Amount",
      updated: "Updated in Rome",
      error: "Language change failed.",
      help: "Help is available in English.",
    } },
};

export async function createI18n(language = "it") {
  const instance = createInstance();
  await instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: "en",
    supportedLngs: ["it", "en"],
    resources: structuredClone(resources),
    interpolation: { escapeValue: false },
  });
  return instance;
}
```

In `src/main.jsx`, attendi l'inizializzazione e usa il componente `App.jsx` definito sotto:

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import App from "./App.jsx";
import { createI18n } from "./i18n.js";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento root assente");
createI18n("it").then(i18n => {
  createRoot(root).render(
    <StrictMode><I18nextProvider i18n={i18n}><App /></I18nextProvider></StrictMode>
  );
}).catch(error => {
  console.error("i18n initialization failed", error);
  root.textContent = "Impossibile avviare l'interfaccia.";
});
```

### Usare chiavi, plurali e cambio lingua

Modulo `src/App.jsx`. La lingua e una preferenza della SPA; locale e fuso vengono scelti esplicitamente. La regione di stato espone il numero di elementi dopo le azioni.

```jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function formatPrice(amount, locale, currency) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

export function formatInstant(iso, locale, timeZone) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium", timeStyle: "short", timeZone,
  }).format(new Date(iso));
}

export default function TranslationDemo({ name = "Ada" }) {
  const { t, i18n } = useTranslation();
  const [count, setCount] = useState(2);
  const [changing, setChanging] = useState(false);
  const [failed, setFailed] = useState(false);
  const language = i18n.resolvedLanguage ?? "it";
  const locale = language === "it" ? "it-IT" : "en-GB";

  useEffect(() => {
    const previous = { lang: document.documentElement.lang, dir: document.documentElement.dir };
    document.documentElement.lang = language;
    document.documentElement.dir = i18n.dir(language);
    return () => {
      document.documentElement.lang = previous.lang;
      document.documentElement.dir = previous.dir;
    };
  }, [i18n, language]);

  async function changeLanguage(next) {
    setChanging(true);
    setFailed(false);
    try { await i18n.changeLanguage(next); }
    catch { setFailed(true); }
    finally { setChanging(false); }
  }

  return (
    <section>
      <h2>{t("greeting", { name })}</h2>
      <label>
        {t("language")}
        <select value={language} disabled={changing}
          onChange={event => changeLanguage(event.target.value)}>
          <option value="it">Italiano</option>
          <option value="en">English</option>
        </select>
      </label>
      {failed && <p role="alert">{t("error")}</p>}
      <p role="status">{t("items", { count })}</p>
      <button type="button" onClick={() => setCount(value => value + 1)}>{t("actions.add")}</button>
      <button type="button" onClick={() => setCount(0)}>{t("actions.clear")}</button>
      <p>{t("amount")}: {formatPrice(1234.5, locale, "EUR")}</p>
      <p>{t("updated")}: <time dateTime="2026-10-15T12:00:00Z">
        {formatInstant("2026-10-15T12:00:00Z", locale, "Europe/Rome")}
      </time></p>
    </section>
  );
}
```

`count` deve essere numerico: i18next sceglie i suffissi tramite le regole del locale, non con un generico `count === 1`. `_zero` e un messaggio speciale per zero; le categorie `one`, `few`, `many`, `other` non corrispondono a un insieme universale di numeri. L'italiano puo usare anche `many` per alcuni numeri grandi. Verifica 0, 1, 2 e almeno un caso rappresentativo per ogni categoria supportata.

Con `fallbackLng: "en"`, `t("help")` in italiano usa la risorsa inglese volutamente presente solo in `en`. Una chiave assente in entrambe le lingue normalmente torna come chiave: non considerarla una traduzione valida. Aggiungi controlli di completezza dei cataloghi e una strategia di segnalazione per le chiavi mancanti.

Il cambio lingua non persiste al reload: il bootstrap riparte da `it`. Per persistenza o rilevamento automatico definisci una priorita tra scelta esplicita, preferenza salvata, URL e browser. Un errore di caricamento delle traduzioni non sempre coincide con una Promise rifiutata: un backend i18next puo risolvere usando fallback e notificare `failedLoading`. Questo demo ha risorse locali; una soluzione con rete deve gestire anche gli eventi e gli stati del backend scelto.

L'effect su `html.lang` e `html.dir` presuppone **un solo proprietario a livello applicazione**; non copiarlo in ogni widget. Per componenti multilingua incorporati usa `lang` e `dir` sul contenitore locale. Due provider possono avere lingue diverse, ma non devono competere per gli attributi globali del documento.

`escapeValue: false` e adatto alle stringhe renderizzate come testo JSX, che React protegge tramite escaping. Non autorizza l'inserimento di traduzioni o input non fidati in `dangerouslySetInnerHTML`.

### Formati, direzione e server

- `formatPrice` riceve un numero gia validato nella valuta dichiarata. La formattazione non esegue conversione, non corregge errori di precisione del modello numerico e non analizza una stringa come `"1.234,50"`.
- `formatInstant` richiede un istante valido con offset o `Z` e un fuso supportato. Una data senza orario, come una data di nascita, non dovrebbe diventare automaticamente un istante UTC da spostare in un altro giorno.
- La data dimostrativa e fissa: usare `new Date()` durante render server/client senza coordinamento puo produrre HTML diverso. Per SSR allinea lingua, risorse, istante e fuso tra server e hydration; usa l'integrazione del framework e istanze per richiesta.
- `dir="rtl"` non traduce testi e non risolve da solo il layout. Usa proprieta logiche CSS come `margin-inline-start` e `text-align: start`; valuta `<bdi>` per testo di direzione sconosciuta. Il demo contiene solo italiano e inglese, non una UI RTL completa.
- Le stringhe formattate possono contenere spazi non separabili o caratteri direzionali. Anche il raggruppamento delle cifre dipende dai dati linguistici del runtime: non presumere che ogni numero di quattro cifre abbia un separatore delle migliaia. Nei test non fissare punteggiatura e spazi ASCII come formato universale.

## Varianti

- **Namespace e caricamento su richiesta**: dividono cataloghi grandi; richiedono loading, fallback e gestione degli errori reali.
- **FormatJS/ICU MessageFormat**: alternativa per cataloghi con messaggi ICU; la sintassi non e intercambiabile con l'interpolazione i18next mostrata qui.
- **Traduzioni con markup**: usa un'integrazione controllata come `Trans` con componenti espliciti; non trattare i cataloghi come HTML arbitrario affidabile.
- **Solo Intl**: sufficiente per formattare dati in un'app che non richiede traduzione dei messaggi.

## Errori comuni

- Concatenare stringhe tradotte.
- Dimenticare pluralizzazione.
- Formattare date e valute a mano.
- Hardcodare testi in componenti.
- Non testare layout con stringhe lunghe.
- Ignorare RTL.
- Confondere lingua, valuta e fuso, oppure riutilizzare un singleton mutabile tra richieste server.
- Rendere le chiavi mancanti invisibili nei test o lasciare messaggi ARIA nella lingua precedente.

## Checklist

- Le stringhe sono estratte?
- Date, numeri e valute usano locale?
- Le traduzioni supportano pluralizzazione?
- Il layout regge testi lunghi?
- Le lingue RTL sono considerate se richieste?
- Le traduzioni sono caricate in modo efficiente?
- `lang`, `dir`, messaggi di errore e nomi accessibili seguono la lingua effettiva?
- Fallback, chiavi mancanti e reload hanno un comportamento documentato?
- Il primo render server/client usa le stesse impostazioni e gli stessi dati?

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
- [react-i18next - I18nextProvider](https://react.i18next.com/latest/i18nextprovider)
- [i18next - Interpolazione](https://www.i18next.com/translation-function/interpolation)
- [MDN - Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) e [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- Versioni degli esempi: React/React DOM 19.3.0, i18next 26.4.5 e react-i18next 17.0.16. Il demo non implementa persistenza, backend di traduzione, SSR o lingue RTL.
